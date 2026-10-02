"""settle_order's guards: the ones that stop a buyer being charged twice,
losing their tickets, or keeping tickets a sold-out tier can't honour.

Real SQLite rather than mocks, because the behaviour under test is almost
entirely about rows -- what gets written, what is refused, and what survives
a second call with the same payload.
"""

import datetime as dt
import uuid
from decimal import Decimal

import pytest
from common.models import (
    Base,
    Category,
    Event,
    EventStatus,
    Order,
    OrderItem,
    Organiser,
    PaymentAttempt,
    PaymentStatus,
    Ticket,
    TicketTier,
)
from sqlalchemy import create_engine, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session


@compiles(JSONB, "sqlite")
def _jsonb_as_sqlite_json(element, compiler, **kw):
    return "JSON"


@pytest.fixture
def session():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture
def event(session):
    organiser = Organiser(
        id=uuid.uuid4(), org_name="Run Club", contact_name="Ravi",
        email="ravi@example.com", phone="+919876543210", password_hash="x",
    )
    category = Category(id=uuid.uuid4(), name="Marathon")
    ev = Event(
        id=uuid.uuid4(), organiser_id=organiser.id, category_id=category.id,
        title="Jammu Marathon", description="Run",
        event_date=dt.date(2026, 11, 22), event_time=dt.time(5, 0),
        venue_name="Stadium", venue_address="Jammu", city="Jammu",
        capacity=100, status=EventStatus.LIVE,
    )
    session.add_all([organiser, category, ev])
    session.flush()
    return ev


@pytest.fixture
def tier(session, event):
    t = TicketTier(
        id=uuid.uuid4(), event_id=event.id, name="Full Marathon",
        price=Decimal("600"), quantity_total=10, quantity_sold=0,
    )
    session.add(t)
    session.flush()
    return t


def _future(minutes=10):
    return dt.datetime.now(dt.UTC) + dt.timedelta(minutes=minutes)


def _past(minutes=1):
    return dt.datetime.now(dt.UTC) - dt.timedelta(minutes=minutes)


# Distinct from None, which is itself a meaningful hold value ("no hold").
_DEFAULT_HOLD = object()


def _pending_order(session, event, tier, *, quantity=2, reserved_until=_DEFAULT_HOLD, total=None):
    """A reserved order: OrderItem rows exist, tickets don't, quantity_sold
    untouched -- exactly the state checkout leaves behind."""
    total = Decimal("600") * quantity if total is None else total
    order = Order(
        id=uuid.uuid4(), event_id=event.id, buyer_name="Priya",
        buyer_email="priya@example.com", buyer_phone="+919876543210",
        subtotal=total, booking_fee=Decimal("0"), total_amount=total,
        payment_status=PaymentStatus.PENDING,
        reserved_until=_future() if reserved_until is _DEFAULT_HOLD else reserved_until,
        pending_items=[
            {
                "ticket_tier_id": str(tier.id),
                "tier_name": tier.name,
                "unit_price": "600.00",
                "attendee_name": f"Runner {i + 1}",
                "attendee_email": None,
                "attendee_phone": None,
                "answers": [{"field_id": "f1", "field_label": "T-shirt", "answer": "M"}],
                "approval_status": "approved",
            }
            for i in range(quantity)
        ],
    )
    session.add(order)
    session.flush()
    session.add(OrderItem(
        id=uuid.uuid4(), order_id=order.id, ticket_tier_id=tier.id,
        quantity=quantity, unit_price=Decimal("600"),
    ))
    session.flush()
    return order


def _attempt(session, order, *, amount=None, status="initiated", txnid=None):
    attempt = PaymentAttempt(
        id=uuid.uuid4(), order_id=order.id,
        txnid=txnid or f"ST{uuid.uuid4().hex[:16]}",
        amount=order.total_amount if amount is None else amount,
        status=status,
    )
    session.add(attempt)
    session.flush()
    return attempt


def _tickets(session, order):
    return session.execute(
        select(Ticket).join(OrderItem).where(OrderItem.order_id == order.id)
    ).scalars().all()


# --- classify_status: "not decided" is not "failed" ---


@pytest.mark.parametrize("raw", ["success", "Success", "SUCCESS", "captured"])
def test_success_statuses_are_recognised(raw):
    from common.settlement import classify_status

    assert classify_status(raw) == "success"


@pytest.mark.parametrize("raw", ["failure", "failed", "cancelled", "userCancelled", "CANCEL"])
def test_failure_statuses_are_recognised(raw):
    from common.settlement import classify_status

    assert classify_status(raw) == "failure"


@pytest.mark.parametrize("raw", [None, "", "pending", "in progress", "bounced", "anything else"])
def test_an_undecided_status_is_not_a_failure(raw):
    """Treating "pending" as failure would release a hold on a payment that is
    still in flight on the buyer's bank page, and email them a failure notice
    for money they are about to be charged."""
    from common.settlement import classify_status

    assert classify_status(raw) is None


# --- the happy path ---


def test_success_issues_tickets_and_increments_sold(session, event, tier):
    from common.settlement import SETTLED, settle_order

    order = _pending_order(session, event, tier, quantity=2)
    attempt = _attempt(session, order)

    result = settle_order(session, attempt.txnid, status="success", mihpayid="mih1", gateway_amount="1200.00")

    assert result.outcome == SETTLED
    assert order.payment_status == PaymentStatus.SUCCESS
    assert order.payment_gateway_ref == "mih1"
    assert order.reserved_until is None  # the hold has done its job
    assert tier.quantity_sold == 2
    assert len(_tickets(session, order)) == 2


def test_issued_tickets_replay_the_stored_plan(session, event, tier):
    """Settlement is pure INSERTs from pending_items -- no re-validation, so an
    organiser editing the form mid-payment can't break a paid order."""
    from common.settlement import settle_order

    order = _pending_order(session, event, tier, quantity=2)
    attempt = _attempt(session, order)
    settle_order(session, attempt.txnid, status="success", mihpayid="mih1")

    tickets = sorted(_tickets(session, order), key=lambda t: t.attendee_name)
    assert [t.attendee_name for t in tickets] == ["Runner 1", "Runner 2"]
    assert tickets[0].attendee_answers == [{"field_id": "f1", "field_label": "T-shirt", "answer": "M"}]
    assert all(t.qr_code_token for t in tickets)
    assert len({t.qr_code_token for t in tickets}) == 2


def test_approval_status_carries_through_from_the_plan(session, event, tier):
    from common.settlement import settle_order

    order = _pending_order(session, event, tier, quantity=1)
    order.pending_items[0]["approval_status"] = "pending"
    attempt = _attempt(session, order)
    settle_order(session, attempt.txnid, status="success", mihpayid="mih1")

    assert _tickets(session, order)[0].approval_status == "pending"


def test_success_emails_the_buyer_and_the_organiser(session, event, tier):
    from common.settlement import settle_order

    order = _pending_order(session, event, tier, quantity=2)
    attempt = _attempt(session, order)
    result = settle_order(session, attempt.txnid, status="success", mihpayid="mih1")

    by_type = {e["type"]: e for e in result.emails}
    assert set(by_type) == {"order_confirmation", "new_booking"}
    assert by_type["order_confirmation"]["to"] == "priya@example.com"
    assert by_type["order_confirmation"]["total"] == "Rs. 1,200.00"
    assert len(by_type["order_confirmation"]["tickets"]) == 2
    assert by_type["new_booking"]["to"] == "ravi@example.com"
    assert by_type["new_booking"]["ticket_count"] == 2
    assert by_type["new_booking"]["tickets_sold"] == 2


def test_a_lapsed_hold_still_settles_when_capacity_remains(session, event, tier):
    """An expired hold means "stop reserving", never "the payment failed" --
    the buyer may simply have been slow on their bank's 3DS page."""
    from common.settlement import SETTLED, settle_order

    order = _pending_order(session, event, tier, quantity=2, reserved_until=_past())
    attempt = _attempt(session, order)

    result = settle_order(session, attempt.txnid, status="success", mihpayid="mih1")

    assert result.outcome == SETTLED
    assert tier.quantity_sold == 2
    assert len(_tickets(session, order)) == 2


# --- idempotency ---


def test_settling_twice_issues_tickets_once(session, event, tier):
    """The return POST and the webhook routinely both arrive."""
    from common.settlement import ALREADY_SETTLED, SETTLED, settle_order

    order = _pending_order(session, event, tier, quantity=2)
    attempt = _attempt(session, order)

    first = settle_order(session, attempt.txnid, status="success", mihpayid="mih1")
    second = settle_order(session, attempt.txnid, status="success", mihpayid="mih1")

    assert first.outcome == SETTLED
    assert second.outcome == ALREADY_SETTLED
    assert tier.quantity_sold == 2
    assert len(_tickets(session, order)) == 2


def test_only_the_call_that_settled_returns_emails(session, event, tier):
    """What makes duplicate confirmation mail impossible rather than unlikely."""
    from common.settlement import settle_order

    order = _pending_order(session, event, tier)
    attempt = _attempt(session, order)

    first = settle_order(session, attempt.txnid, status="success", mihpayid="mih1")
    second = settle_order(session, attempt.txnid, status="success", mihpayid="mih1")

    assert first.emails
    assert second.emails == []


def test_a_late_failure_cannot_demote_a_paid_order(session, event, tier):
    from common.settlement import ALREADY_SETTLED, settle_order

    order = _pending_order(session, event, tier)
    attempt = _attempt(session, order)
    settle_order(session, attempt.txnid, status="success", mihpayid="mih1")

    result = settle_order(session, attempt.txnid, status="failure")

    assert result.outcome == ALREADY_SETTLED
    assert order.payment_status == PaymentStatus.SUCCESS
    assert len(_tickets(session, order)) == 2


def test_a_retrys_success_survives_the_first_attempts_delayed_failure(session, event, tier):
    """Attempt #1 fails slowly at the bank while attempt #2 succeeds. The
    order must stay paid, and the buyer must not get a failure email.

    The terminal guard is what does this -- a successful attempt always leaves
    the order SUCCESS, so the late failure never reaches the failure path."""
    from common.settlement import ALREADY_SETTLED, settle_order

    order = _pending_order(session, event, tier)
    first = _attempt(session, order)
    second = _attempt(session, order)

    settle_order(session, second.txnid, status="success", mihpayid="mih2")
    result = settle_order(session, first.txnid, status="failure")

    assert result.outcome == ALREADY_SETTLED
    assert order.payment_status == PaymentStatus.SUCCESS
    assert order.reserved_until is None
    assert result.emails == []
    assert len(_tickets(session, order)) == 2


def test_a_success_after_a_failure_still_settles(session, event, tier):
    """The other arrival order of the same race: FAILED is not terminal, so a
    success that lands afterwards must still issue tickets."""
    from common.settlement import SETTLED, settle_order

    order = _pending_order(session, event, tier)
    first = _attempt(session, order)
    second = _attempt(session, order)

    settle_order(session, first.txnid, status="failure")
    assert order.payment_status == PaymentStatus.FAILED

    result = settle_order(session, second.txnid, status="success", mihpayid="mih2")

    assert result.outcome == SETTLED
    assert order.payment_status == PaymentStatus.SUCCESS
    assert tier.quantity_sold == 2


def test_a_repeated_failure_is_reported_as_duplicate(session, event, tier):
    from common.settlement import DUPLICATE, FAILED, settle_order

    order = _pending_order(session, event, tier)
    attempt = _attempt(session, order)

    assert settle_order(session, attempt.txnid, status="failure").outcome == FAILED
    assert settle_order(session, attempt.txnid, status="failure").outcome == DUPLICATE


# --- failure ---


def test_failure_releases_the_hold_and_emails_the_buyer(session, event, tier):
    from common.settlement import FAILED, settle_order

    order = _pending_order(session, event, tier)
    attempt = _attempt(session, order)

    result = settle_order(
        session, attempt.txnid, status="failure", error_code="E101", error_message="Card declined"
    )

    assert result.outcome == FAILED
    assert order.payment_status == PaymentStatus.FAILED
    assert order.reserved_until is None  # a retry takes a fresh hold
    assert tier.quantity_sold == 0
    assert _tickets(session, order) == []
    assert [e["type"] for e in result.emails] == ["payment_failed"]
    assert attempt.error_code == "E101"
    assert attempt.error_message == "Card declined"


# --- the amount must be the one we priced ---


def test_an_amount_mismatch_refuses_to_settle(session, event, tier):
    """The response hash proves PayU sent it; only this proves it is the figure
    we asked for."""
    from common.settlement import AMOUNT_MISMATCH, settle_order

    order = _pending_order(session, event, tier, quantity=2)
    attempt = _attempt(session, order)

    result = settle_order(session, attempt.txnid, status="success", mihpayid="mih1", gateway_amount="1.00")

    assert result.outcome == AMOUNT_MISMATCH
    assert order.payment_status == PaymentStatus.PENDING
    assert tier.quantity_sold == 0
    assert _tickets(session, order) == []
    assert attempt.status == "failure"


def test_an_equivalent_amount_formatting_still_settles(session, event, tier):
    """1200 and 1200.00 are the same money; only the value is compared."""
    from common.settlement import SETTLED, settle_order

    order = _pending_order(session, event, tier, quantity=2)
    attempt = _attempt(session, order)

    result = settle_order(session, attempt.txnid, status="success", mihpayid="mih1", gateway_amount="1200")
    assert result.outcome == SETTLED


def test_an_unparseable_amount_is_a_mismatch(session, event, tier):
    from common.settlement import AMOUNT_MISMATCH, settle_order

    order = _pending_order(session, event, tier)
    attempt = _attempt(session, order)

    result = settle_order(session, attempt.txnid, status="success", gateway_amount="not a number")
    assert result.outcome == AMOUNT_MISMATCH


# --- oversell ---


def test_a_payment_for_a_sold_out_tier_demands_a_refund(session, event, tier):
    """The case the hold expiry creates: seats released, sold to someone else,
    then the original payment confirms. Money is real; the tickets aren't."""
    from common.settlement import OVERSOLD, settle_order

    order = _pending_order(session, event, tier, quantity=2, reserved_until=_past())
    attempt = _attempt(session, order)
    tier.quantity_sold = tier.quantity_total  # sold out in the meantime
    session.flush()

    result = settle_order(session, attempt.txnid, status="success", mihpayid="mih1")

    assert result.outcome == OVERSOLD
    assert result.refund_needed is True
    assert _tickets(session, order) == []
    assert tier.quantity_sold == tier.quantity_total  # nothing handed out
    assert order.payment_status == PaymentStatus.SUCCESS  # the money did arrive
    assert order.reserved_until is None
    assert result.emails == []  # no confirmation for tickets that don't exist


def test_an_orders_own_hold_does_not_block_its_own_settlement(session, event, tier):
    """Availability at settlement excludes this order, or every order would
    oversell against the seats it is itself holding."""
    from common.settlement import SETTLED, settle_order

    tier.quantity_total = 2
    order = _pending_order(session, event, tier, quantity=2, reserved_until=_future())
    attempt = _attempt(session, order)
    session.flush()

    assert settle_order(session, attempt.txnid, status="success", mihpayid="mih1").outcome == SETTLED
    assert tier.quantity_sold == 2


def test_another_buyers_live_hold_does_cause_an_oversell(session, event, tier):
    from common.settlement import OVERSOLD, settle_order

    tier.quantity_total = 2
    mine = _pending_order(session, event, tier, quantity=2, reserved_until=_past())
    _pending_order(session, event, tier, quantity=2, reserved_until=_future())
    attempt = _attempt(session, mine)
    session.flush()

    assert settle_order(session, attempt.txnid, status="success", mihpayid="mih1").outcome == OVERSOLD


# --- unknown and undecided ---


def test_an_unknown_txnid_is_reported_not_raised(session):
    """A non-2xx answer to PayU triggers a retry storm, so an unrecognised
    transaction must be a quiet no-op."""
    from common.settlement import UNKNOWN_TXNID, settle_order

    result = settle_order(session, "ST-never-seen", status="success")

    assert result.outcome == UNKNOWN_TXNID
    assert result.order_id is None


def test_an_undecided_verdict_records_the_payload_and_waits(session, event, tier):
    from common.settlement import NO_VERDICT, settle_order

    order = _pending_order(session, event, tier)
    attempt = _attempt(session, order)

    result = settle_order(
        session, attempt.txnid, status="pending", mihpayid="mih1", raw={"status": "pending"}
    )

    assert result.outcome == NO_VERDICT
    assert order.payment_status == PaymentStatus.PENDING
    assert order.reserved_until is not None  # the hold is left alone
    assert attempt.mihpayid == "mih1"
    assert attempt.gateway_response == {"status": "pending"}


def test_the_raw_payload_is_kept_even_when_nothing_changes(session, event, tier):
    """The only record that survives a "was I charged twice?" investigation."""
    from common.settlement import settle_order

    order = _pending_order(session, event, tier)
    attempt = _attempt(session, order)
    settle_order(session, attempt.txnid, status="success", mihpayid="mih1")

    settle_order(session, attempt.txnid, status="success", mihpayid="mih1", raw={"second": "call"})
    assert attempt.gateway_response == {"second": "call"}


# --- free orders take the same path ---


def test_a_free_order_settles_through_the_same_code(session, event, tier):
    """No separate issuance path for free bookings, so they can't drift."""
    from common.settlement import SETTLED, settle_free_order

    tier.price = Decimal("0")
    order = _pending_order(session, event, tier, quantity=2, total=Decimal("0"))
    session.flush()

    result = settle_free_order(session, order)

    assert result.outcome == SETTLED
    assert order.payment_status == PaymentStatus.SUCCESS
    assert tier.quantity_sold == 2
    assert len(_tickets(session, order)) == 2
    confirmation = next(e for e in result.emails if e["type"] == "order_confirmation")
    assert confirmation["total"] == "Free"


# --- helpers ---


def test_a_new_txnid_fits_payus_field(session):
    from common.settlement import new_txnid

    ids = {new_txnid() for _ in range(100)}
    assert len(ids) == 100
    assert all(len(t) <= 25 and t.isalnum() for t in ids)


def test_expired_reads_a_missing_hold_as_expired(session, event, tier):
    from common.settlement import expired

    order = _pending_order(session, event, tier, reserved_until=None)
    assert expired(order) is True


def test_expired_distinguishes_live_from_lapsed_holds(session, event, tier):
    from common.settlement import expired

    assert expired(_pending_order(session, event, tier, reserved_until=_future())) is False
    assert expired(_pending_order(session, event, tier, reserved_until=_past())) is True


def test_successful_attempt_finds_the_one_a_refund_targets(session, event, tier):
    from common.settlement import settle_order, successful_attempt

    order = _pending_order(session, event, tier)
    failed = _attempt(session, order)
    settle_order(session, failed.txnid, status="failure")
    paid = _attempt(session, order)
    settle_order(session, paid.txnid, status="success", mihpayid="mih1")

    assert successful_attempt(session, order.id).id == paid.id


def test_successful_attempt_is_absent_for_legacy_and_free_orders(session, event, tier):
    """Pre-PayU orders carry payment_gateway_ref='TEST-MODE' and no attempt
    row, so callers must be able to keep an admin decision while reporting
    that no money moved."""
    from common.settlement import successful_attempt

    order = _pending_order(session, event, tier)
    order.payment_status = PaymentStatus.SUCCESS
    order.payment_gateway_ref = "TEST-MODE"
    session.flush()

    assert successful_attempt(session, order.id) is None
