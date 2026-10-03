"""The one place an order's payment status changes and tickets are issued.

Three independent callers converge here -- the browser's return from PayU, the
server-to-server webhook, and the scheduled reconciler -- because any one of
them can be the only one that ever arrives. A buyer closing the tab on their
bank's page loses the return; a dropped webhook loses that; neither happening
leaves only the reconciler. All three may also arrive, twice, out of order.

So `settle_order` is written to be called any number of times for the same
transaction, in any order, and converge on the same state. Its guards are the
whole design:

  * the attempt row is locked by txnid, then its order -- the order row is the
    serialisation token for everything that follows;
  * an order already SUCCESS or REFUNDED is terminal, so a late failure can
    never demote a paid order -- which is also what protects a retry's success
    from the first attempt's delayed failure;
  * the gateway's amount must equal the amount we hashed, or nothing happens.

The caller owns the session and the side effects. `settle_order` returns the
emails to send rather than sending them, so they go out *after* the commit --
a queue hiccup must never roll back money that has settled. Only the call that
actually changed the status returns emails, which is what makes duplicate mail
impossible rather than merely unlikely.

Nothing here makes an HTTP call. PayU is reached before or after a transaction,
never inside one: common.db runs pool_size=1 behind RDS Proxy, so holding a
FOR UPDATE across an 8-second call serialises checkout for a whole event.
"""

from __future__ import annotations

import datetime as dt
import secrets
import uuid
from dataclasses import dataclass, field
from decimal import Decimal

from aws_lambda_powertools import Logger
from sqlalchemy import select

from . import payu
from .helpers import short_code, utcnow
from .inventory import availability
from .models import (
    Event,
    Order,
    PaymentAttempt,
    PaymentRefund,
    PaymentStatus,
    Ticket,
    TicketTier,
)

logger = Logger(child=True)

HOLD_MINUTES = 10

# How PayU's vocabulary maps onto a verdict. Anything unrecognised is treated
# as "no verdict yet" and left for the reconciler rather than guessed at --
# guessing failure would release a hold on a payment that is still in flight.
_SUCCESS_STATUSES = frozenset({"success", "captured"})
_FAILURE_STATUSES = frozenset({"failure", "failed", "cancelled", "usercancelled", "cancel"})

# Outcomes. Only SETTLED and FAILED represent a state change this call made.
SETTLED = "settled"
FAILED = "failed"
OVERSOLD = "oversold"
ALREADY_SETTLED = "already_settled"
DUPLICATE = "duplicate"
UNKNOWN_TXNID = "unknown_txnid"
AMOUNT_MISMATCH = "amount_mismatch"
NO_VERDICT = "no_verdict"


@dataclass
class SettlementResult:
    """What a settlement attempt did, and what the caller still owes.

    `emails` and `refund` are deliberately returned rather than acted on, so
    both happen after the caller commits. See the module docstring.
    """

    outcome: str
    order_id: uuid.UUID | None = None
    attempt_id: uuid.UUID | None = None
    emails: list[dict] = field(default_factory=list)
    # Set when money arrived for tickets we can no longer issue: the tier sold
    # out while this payment was in flight. Nobody asked for this refund.
    refund_needed: bool = False

    @property
    def changed_status(self) -> bool:
        return self.outcome in (SETTLED, FAILED, OVERSOLD)


def classify_status(raw_status: str | None) -> str | None:
    """`"success"`, `"failure"`, or None when PayU hasn't decided yet.

    None is not failure. A pending transaction whose hold has lapsed must stay
    PENDING until PayU commits to an answer -- releasing the seats is safe,
    declaring the payment dead is not.
    """
    if not raw_status:
        return None
    normalised = str(raw_status).strip().lower().replace(" ", "").replace("_", "")
    if normalised in _SUCCESS_STATUSES:
        return "success"
    if normalised in _FAILURE_STATUSES:
        return "failure"
    return None


def hold_expiry(now: dt.datetime | None = None) -> dt.datetime:
    return (now or utcnow()) + dt.timedelta(minutes=HOLD_MINUTES)


def new_txnid() -> str:
    """A PayU transaction id: alphanumeric and comfortably inside the 25-char
    limit its field enforces, so it can't collide with an order id's length."""
    return f"ST{secrets.token_hex(10)}"


def settle_order(
    session,
    txnid: str,
    *,
    status: str | None,
    mihpayid: str | None = None,
    mode: str | None = None,
    error_code: str | None = None,
    error_message: str | None = None,
    gateway_amount: str | None = None,
    raw: dict | None = None,
) -> SettlementResult:
    """Apply PayU's verdict for one transaction. Safe to call repeatedly.

    `status` is PayU's raw status string; None means no verdict yet, which
    records the payload and does nothing else.
    """
    attempt = session.execute(
        select(PaymentAttempt).where(PaymentAttempt.txnid == txnid).with_for_update()
    ).scalar_one_or_none()
    if attempt is None:
        # Not ours, or a txnid from a stack that shares this PayU account.
        # Never an error for the caller to raise on -- a non-2xx to PayU
        # triggers a retry storm.
        logger.warning("settlement for an unknown txnid", extra={"txnid": txnid})
        return SettlementResult(UNKNOWN_TXNID)

    order = session.execute(
        select(Order).where(Order.id == attempt.order_id).with_for_update()
    ).scalar_one()

    verdict = classify_status(status)
    _record_gateway_fields(attempt, mihpayid, mode, error_code, error_message, raw)

    # --- terminal guards ---
    if order.payment_status in (PaymentStatus.SUCCESS, PaymentStatus.REFUNDED):
        logger.info(
            "settlement ignored, order already terminal",
            extra={"txnid": txnid, "order_id": str(order.id), "status": order.payment_status.value},
        )
        return SettlementResult(ALREADY_SETTLED, order.id, attempt.id)

    if verdict is None:
        logger.info("settlement with no verdict yet", extra={"txnid": txnid, "payu_status": status})
        return SettlementResult(NO_VERDICT, order.id, attempt.id)

    if attempt.settled_at is not None and attempt.status == verdict:
        return SettlementResult(DUPLICATE, order.id, attempt.id)

    # --- the amount must be the one we asked for ---
    # The response hash already proved PayU sent this; it does not prove the
    # figure matches what we priced, which a merchant-side bug could break.
    if gateway_amount is not None and not _amounts_match(gateway_amount, attempt.amount):
        logger.error(
            "settlement refused on amount mismatch",
            extra={
                "txnid": txnid, "order_id": str(order.id),
                "expected": str(attempt.amount), "gateway": gateway_amount,
            },
        )
        attempt.status = "failure"
        attempt.error_message = f"amount mismatch: expected {attempt.amount}, gateway sent {gateway_amount}"
        return SettlementResult(AMOUNT_MISMATCH, order.id, attempt.id)

    if verdict == "failure":
        return _settle_failure(session, order, attempt)
    return _settle_success(session, order, attempt)


def _settle_failure(session, order: Order, attempt: PaymentAttempt) -> SettlementResult:
    """Mark this attempt failed and release its hold.

    No "did a sibling attempt succeed?" check is needed here: an order with a
    successful attempt is always SUCCESS or REFUNDED, both of which the
    terminal guard in settle_order has already turned away. Concurrency is
    covered by the same guard, because every caller takes the order row lock
    before reaching this point -- so a simultaneous success and failure are
    serialised, and whichever order they land in, success wins.
    """
    attempt.status = "failure"
    attempt.settled_at = utcnow()
    order.payment_status = PaymentStatus.FAILED
    order.reserved_until = None  # the hold is pointless now; a retry takes a fresh one

    emails = []
    try:
        emails.append(_payment_failed_email(order))
    except Exception:  # noqa: BLE001 -- a broken email must not fail the settlement
        logger.exception("could not build payment_failed email", extra={"order_id": str(order.id)})
    return SettlementResult(FAILED, order.id, attempt.id, emails=emails)


def _settle_success(session, order: Order, attempt: PaymentAttempt) -> SettlementResult:
    attempt.status = "success"
    attempt.settled_at = utcnow()
    order.payment_gateway_ref = attempt.mihpayid or order.payment_gateway_ref

    items = list(order.order_items)
    tiers = _lock_tiers(session, [item.ticket_tier_id for item in items])

    short = _shortfall(session, order, items, tiers)
    if short is not None:
        # Money arrived for tickets we can't issue. The order is genuinely
        # paid, so it becomes SUCCESS and the refund then legitimately moves
        # it SUCCESS -> REFUNDED. Leaving it PENDING would make it a
        # reconciliation target for ever.
        logger.error(
            "paid order cannot be fulfilled, refund required",
            extra={"order_id": str(order.id), "txnid": attempt.txnid, "tier": short},
        )
        order.payment_status = PaymentStatus.SUCCESS
        order.reserved_until = None
        return SettlementResult(OVERSOLD, order.id, attempt.id, refund_needed=True)

    issued = issue_tickets(session, order, items, tiers)
    for item in items:
        tiers[item.ticket_tier_id].quantity_sold += item.quantity

    order.payment_status = PaymentStatus.SUCCESS
    order.reserved_until = None
    session.flush()

    emails = []
    try:
        emails.extend(_success_emails(session, order, issued))
    except Exception:  # noqa: BLE001 -- never let email rendering fail a paid order
        logger.exception("could not build order emails", extra={"order_id": str(order.id)})
    return SettlementResult(SETTLED, order.id, attempt.id, emails=emails)


def _lock_tiers(session, tier_ids) -> dict[uuid.UUID, TicketTier]:
    """Lock every tier this order touches, in id order.

    The ordering is not cosmetic: reserve, settle and retry all lock these same
    rows, and unordered multi-row locks deadlock under concurrency.
    """
    rows = session.execute(
        select(TicketTier)
        .where(TicketTier.id.in_(set(tier_ids)))
        .order_by(TicketTier.id)
        .with_for_update()
    ).scalars().all()
    return {tier.id: tier for tier in rows}


def _shortfall(session, order: Order, items, tiers) -> str | None:
    """The name of the first tier that can no longer cover this order, if any.

    Counted with this order's own hold excluded -- it must not compete against
    the seats it is already holding. A lapsed hold is exactly why this check
    exists at settlement and not only at checkout.
    """
    available = availability(session, tiers.values(), exclude_order_id=order.id)
    for item in items:
        if item.quantity > available.get(item.ticket_tier_id, 0):
            return tiers[item.ticket_tier_id].name
    return None


def issue_tickets(session, order: Order, items, tiers) -> list[tuple[Ticket, str]]:
    """Replay `order.pending_items` into Ticket rows.

    Pure INSERTs by design. The plan was fully validated at checkout, so
    nothing is re-checked here: an organiser who edits the registration form or
    tightens an age limit mid-payment must not be able to break an order the
    buyer has already paid for.
    """
    items_by_tier = {item.ticket_tier_id: item for item in items}
    issued: list[tuple[Ticket, str]] = []

    for entry in order.pending_items or []:
        tier_id = uuid.UUID(entry["ticket_tier_id"])
        order_item = items_by_tier.get(tier_id)
        if order_item is None:
            # Can only happen if pending_items and order_items disagree, which
            # would be a bug at reserve time. Skip rather than abort: the rest
            # of a paid order's tickets should still be issued.
            logger.error(
                "pending item has no matching order item",
                extra={"order_id": str(order.id), "ticket_tier_id": entry["ticket_tier_id"]},
            )
            continue
        ticket = Ticket(
            order_item_id=order_item.id,
            qr_code_token=secrets.token_urlsafe(24),
            attendee_name=entry["attendee_name"],
            attendee_email=entry.get("attendee_email"),
            attendee_phone=entry.get("attendee_phone"),
            attendee_answers=entry.get("answers"),
            approval_status=entry.get("approval_status", "approved"),
        )
        session.add(ticket)
        issued.append((ticket, entry.get("tier_name") or tiers[tier_id].name))

    session.flush()
    return issued


# --- email payloads -----------------------------------------------------
# Built here rather than in any one caller so the browser return, the webhook
# and the reconciler all produce identical mail for the same order.


def _event_of(session, order: Order) -> Event:
    return session.get(Event, order.event_id)


def _money(amount) -> str:
    value = Decimal(str(amount))
    return "Free" if value == 0 else f"Rs. {value:,.2f}"


def _venue_of(event: Event) -> str:
    return f"{event.venue_name}, {event.city}" if event.location_type == "venue" else "Online"


def _success_emails(session, order: Order, issued: list[tuple[Ticket, str]]) -> list[dict]:
    event = _event_of(session, order)
    emails = [_order_confirmation_email(order, event, issued)]
    organiser_email = _organiser_notification_email(session, order, event, issued)
    if organiser_email:
        emails.append(organiser_email)
    return emails


def _order_confirmation_email(order: Order, event: Event, issued: list[tuple[Ticket, str]]) -> dict:
    return {
        "type": "order_confirmation",
        "to": order.buyer_email,
        "buyer_name": order.buyer_name,
        "buyer_phone": order.buyer_phone,
        "order_id": str(order.id),
        "order_code": short_code(order.id),
        "event_title": event.title,
        "event_date": (order.occurrence_date or event.event_date).isoformat(),
        "event_time": event.event_time.strftime("%I:%M %p").lstrip("0"),
        "venue": _venue_of(event),
        "total": _money(order.total_amount),
        "tickets": [
            {
                "attendee_name": ticket.attendee_name,
                "tier": tier_name,
                "ticket_code": short_code(ticket.id),
                "pending": ticket.approval_status == "pending",
            }
            for ticket, tier_name in issued
        ],
    }


def _organiser_notification_email(session, order: Order, event: Event, issued) -> dict | None:
    """Tells the organiser they have a sale. Skipped silently if the organiser
    can't be resolved -- the buyer's confirmation matters more than this one."""
    organiser = event.organiser if event is not None else None
    if organiser is None or not organiser.email:
        return None
    tickets_sold = sum(tier.quantity_sold for tier in event.ticket_tiers)
    return {
        "type": "new_booking",
        "to": organiser.email,
        "event_title": event.title,
        "event_id": str(event.id),
        "buyer_name": order.buyer_name,
        "ticket_count": len(issued),
        "total": _money(order.total_amount),
        "tickets_sold": tickets_sold,
        "capacity": event.capacity,
    }


def _payment_failed_email(order: Order) -> dict:
    event = order.event
    return {
        "type": "payment_failed",
        "to": order.buyer_email,
        "buyer_name": order.buyer_name,
        "event_title": event.title if event else "your event",
        "event_id": str(order.event_id),
        "order_code": short_code(order.id),
        "total": _money(order.total_amount),
    }


def _refund_issued_email(order: Order, refund: PaymentRefund) -> dict:
    event = order.event
    return {
        "type": "refund_issued",
        "to": order.buyer_email,
        "buyer_name": order.buyer_name,
        "event_title": event.title if event else "your event",
        "order_code": short_code(order.id),
        "amount": _money(refund.amount),
        "reason": refund.reason,
        "refund_reference": refund.gateway_refund_id,
    }


# --- refunds ------------------------------------------------------------


def start_refund(
    session, attempt: PaymentAttempt, amount: Decimal, reason: str, *, refund_request_id=None
) -> PaymentRefund:
    """Record our intent to refund, before talking to PayU.

    Split from the gateway call on purpose: the row exists first so that a
    crash or timeout mid-call leaves evidence the reconciler can pick up,
    rather than a refund nobody knows was attempted. Its id doubles as the
    reference PayU echoes back, which makes a retried call idempotent there.
    """
    refund = PaymentRefund(
        attempt_id=attempt.id,
        refund_request_id=refund_request_id,
        amount=amount,
        reason=reason,
        status="requested",
    )
    session.add(refund)
    session.flush()
    return refund


def complete_refund(
    session, refund_id: uuid.UUID, gateway_response: dict
) -> tuple[str, list[dict]]:
    """Record PayU's answer to a refund request and release the inventory.

    Returns `(status, emails)`. Accepted means *queued*, never "money
    returned" -- PayU settles refunds asynchronously, so the status stops at
    `pending` and only the reconciler promotes it to `confirmed`. Emails are
    returned for the caller to publish after commit.
    """
    refund = session.execute(
        select(PaymentRefund).where(PaymentRefund.id == refund_id).with_for_update()
    ).scalar_one()
    refund.gateway_response = gateway_response

    accepted = str(gateway_response.get("status", "")) in ("1", "True", "true")
    if not accepted:
        refund.status = "failed"
        logger.error(
            "payu rejected a refund request",
            extra={"refund_id": str(refund.id), "message": gateway_response.get("msg")},
        )
        return refund.status, []

    refund.status = "pending"
    refund.gateway_refund_id = str(
        gateway_response.get("request_id") or gateway_response.get("mihpayid") or ""
    ) or None

    order = session.execute(
        select(Order).where(Order.id == refund.attempt.order_id).with_for_update()
    ).scalar_one()
    _release_refunded_inventory(session, order)
    order.payment_status = PaymentStatus.REFUNDED

    emails = []
    try:
        emails.append(_refund_issued_email(order, refund))
    except Exception:  # noqa: BLE001
        logger.exception("could not build refund_issued email", extra={"order_id": str(order.id)})
    return refund.status, emails


def _release_refunded_inventory(session, order: Order) -> None:
    """Give the seats back, but only those this order actually consumed.

    An oversold order never had tickets issued and never bumped quantity_sold,
    so there is nothing to give back -- decrementing anyway would hand out
    stock that was never taken.

    Note this intentionally leaves the issued Ticket rows in place, so a
    refunded tier can show COUNT(tickets) > quantity_sold. Organiser views
    filter on payment_status = 'success' and stay consistent; see 0011.
    """
    items = list(order.order_items)
    issued_tiers = {
        item.ticket_tier_id for item in items if item.tickets
    }
    if not issued_tiers:
        return
    tiers = _lock_tiers(session, issued_tiers)
    for item in items:
        tier = tiers.get(item.ticket_tier_id)
        if tier is not None:
            tier.quantity_sold = max(0, tier.quantity_sold - item.quantity)


def successful_attempt(session, order_id: uuid.UUID) -> PaymentAttempt | None:
    """The settled attempt a refund must be issued against, if there is one.

    Returns None for free orders and for everything created before PayU
    existed here (those carry payment_gateway_ref = 'TEST-MODE' and no attempt
    row at all), so callers can keep an admin decision while reporting that no
    money moved.
    """
    return session.execute(
        select(PaymentAttempt)
        .where(
            PaymentAttempt.order_id == order_id,
            PaymentAttempt.status == "success",
            PaymentAttempt.mihpayid.isnot(None),
        )
        .order_by(PaymentAttempt.created_at.desc())
    ).scalars().first()


def _record_gateway_fields(attempt, mihpayid, mode, error_code, error_message, raw) -> None:
    """Keep whatever PayU told us, even on a call that changes nothing.

    The raw payload is the only record that survives for a "was I charged
    twice?" investigation, so it is stored before any guard can return early.
    """
    if mihpayid:
        attempt.mihpayid = mihpayid
    if mode:
        attempt.mode = mode
    if error_code:
        attempt.error_code = error_code
    if error_message:
        attempt.error_message = error_message
    if raw is not None:
        attempt.gateway_response = raw


def _amounts_match(gateway_amount: str, expected: Decimal) -> bool:
    try:
        return Decimal(str(gateway_amount)) == Decimal(str(expected))
    except (ArithmeticError, ValueError):
        return False


def create_attempt(session, order: Order, amount: Decimal, *, txnid: str | None = None) -> PaymentAttempt:
    """Open a new PayU transaction for an order.

    A retry gets its own attempt rather than reusing the failed one, so the
    full history stays readable when a buyer disputes a charge.
    """
    attempt = PaymentAttempt(
        order_id=order.id,
        txnid=txnid or new_txnid(),
        amount=Decimal(payu.format_amount(amount)),
        status="initiated",
    )
    session.add(attempt)
    session.flush()
    return attempt


def settle_free_order(session, order: Order) -> SettlementResult:
    """Issue tickets for a zero-total order with no gateway involved.

    Routed through the same attempt row and the same settle_order path as a
    paid order so free bookings can't quietly diverge -- there is no separate
    issuance code for them to drift from.
    """
    attempt = create_attempt(session, order, Decimal("0"), txnid=f"FREE{order.id.hex[:16]}")
    attempt.mihpayid = "FREE"
    session.flush()
    return settle_order(
        session,
        attempt.txnid,
        status="success",
        mihpayid="FREE",
        gateway_amount=payu.format_amount(order.total_amount),
    )


def expired(order: Order, now: dt.datetime | None = None) -> bool:
    """Whether this order's hold has lapsed.

    Only ever means "stop reserving these seats". It is never evidence the
    payment failed -- the buyer may still be on their bank's 3DS page.
    """
    if order.reserved_until is None:
        return True
    return order.reserved_until <= (now or utcnow())
