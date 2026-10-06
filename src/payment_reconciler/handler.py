"""payment-reconciler Lambda -- the backstop, on a schedule.

Both ways PayU normally tells us about a payment can go missing. The browser
return is lost when a buyer closes the tab on their bank's 3DS page; the webhook
is lost to a delivery failure. Either leaves an order stuck PENDING with money
possibly taken, and nothing else in the system would ever ask again.

So this asks. It polls PayU about transactions that were started but never
resolved, and settles whatever answer it gets through the same idempotent
writer the other two paths use -- so a payment that was *already* settled
normally costs one no-op here, not a double issue.

It also finishes refunds, which PayU queues rather than completes: a refund sits
at 'pending' until someone checks, and this is who checks.

Two deliberate constraints:
  * one session per order, so a single poison row can't take down the batch;
  * PayU is called outside every transaction, because an 8-second request
    holding row locks on a pool of one would stall live checkout.
"""

from __future__ import annotations

import datetime as dt
from typing import Any

from aws_lambda_powertools import Logger
from common import payu
from common.db import get_session
from common.helpers import utcnow
from common.messaging import publish_to_ses
from common.models import (
    AttemptStatus,
    Order,
    PaymentAttempt,
    PaymentRefund,
    PaymentStatus,
    RefundProgress,
)
from common.payu_callback import OVERSOLD_REFUND_REASON
from common.refunds import refund_order
from common.settlement import settle_order
from sqlalchemy import select

logger = Logger()

# Don't race the browser return: a payment finished seconds ago is probably
# being settled by the request the buyer is still waiting on.
MIN_AGE_MINUTES = 5
# Past this, PayU has nothing useful left to say and the order is abandoned.
MAX_AGE_HOURS = 48
# Bounded so a backlog can't time the function out. Anything left over is
# simply picked up on the next run five minutes later.
BATCH_SIZE = 50


def handler(_event: dict, _context: Any) -> dict:
    summary = {
        "payments_checked": 0,
        "payments_settled": 0,
        "refunds_checked": 0,
        "refunds_confirmed": 0,
    }
    _reconcile_payments(summary)
    _reconcile_refunds(summary)
    logger.info("reconciliation finished", extra=summary)
    return summary


def _reconcile_payments(summary: dict) -> None:
    for txnid in _stale_attempt_txnids():
        summary["payments_checked"] += 1
        try:
            if _resolve(txnid):
                summary["payments_settled"] += 1
        except Exception:  # noqa: BLE001 -- one bad transaction must not end the batch
            logger.exception("could not reconcile a payment", extra={"txnid": txnid})


def _stale_attempt_txnids() -> list[str]:
    """Transactions we opened and never heard a verdict on.

    Returns txnids rather than ORM rows because each is then handled in its own
    session, and a detached instance would be a trap.
    """
    now = utcnow()
    with get_session() as session:
        return list(
            session.execute(
                select(PaymentAttempt.txnid)
                .join(Order, Order.id == PaymentAttempt.order_id)
                .where(
                    PaymentAttempt.status == AttemptStatus.INITIATED,
                    Order.payment_status == PaymentStatus.PENDING,
                    PaymentAttempt.created_at < now - dt.timedelta(minutes=MIN_AGE_MINUTES),
                    PaymentAttempt.created_at > now - dt.timedelta(hours=MAX_AGE_HOURS),
                )
                .order_by(PaymentAttempt.created_at.asc())
                .limit(BATCH_SIZE)
            ).scalars()
        )


def _resolve(txnid: str) -> bool:
    """Ask PayU about one transaction and settle whatever it says.

    Returns whether this actually changed anything. A transaction PayU has no
    record of means the buyer never reached the payment page -- not that it
    failed -- so it is left alone to age out rather than marked dead.
    """
    verified = payu.transaction_status(payu.verify_payment(txnid), txnid) or {}
    if not verified:
        logger.info("payu has no record of this transaction yet", extra={"txnid": txnid})
        return False

    with get_session() as session:
        result = settle_order(
            session,
            txnid,
            status=verified.get("status"),
            mihpayid=verified.get("mihpayid"),
            mode=verified.get("mode"),
            error_code=verified.get("error_code"),
            error_message=verified.get("error_Message"),
            gateway_amount=verified.get("amt"),
            raw={"verified": verified, "source": "reconciler"},
        )

    logger.info(
        "reconciled a payment",
        extra={"txnid": txnid, "outcome": result.outcome, "order_id": str(result.order_id)},
    )
    _publish(result.emails)
    if result.refund_needed:
        refund_order(result.order_id, reason=OVERSOLD_REFUND_REASON)
    return result.changed_status


def _reconcile_refunds(summary: dict) -> None:
    """Finish refunds PayU has since processed, and retry ones that never got
    through -- a 'requested' row means the gateway call itself failed, so the
    money hasn't started moving and the whole refund needs re-attempting."""
    for refund_id, order_id, mihpayid, status in _open_refunds():
        summary["refunds_checked"] += 1
        try:
            if status == RefundProgress.REQUESTED:
                refund_order(order_id, reason=OVERSOLD_REFUND_REASON)
                continue
            if _confirm_refund(refund_id, mihpayid):
                summary["refunds_confirmed"] += 1
        except Exception:  # noqa: BLE001 -- one bad refund must not end the batch
            logger.exception("could not reconcile a refund", extra={"refund_id": str(refund_id)})


def _open_refunds() -> list[tuple]:
    with get_session() as session:
        return [
            (row.id, row.attempt.order_id, row.attempt.mihpayid, row.status)
            for row in session.execute(
                select(PaymentRefund)
                .where(PaymentRefund.status.in_((RefundProgress.REQUESTED, RefundProgress.PENDING)))
                .order_by(PaymentRefund.created_at.asc())
                .limit(BATCH_SIZE)
            ).scalars()
        ]


def _confirm_refund(refund_id, mihpayid: str | None) -> bool:
    """Promote a queued refund to confirmed once PayU reports it done."""
    if not mihpayid:
        return False
    verified = payu.transaction_status(payu.verify_payment(mihpayid), mihpayid) or {}
    if str(verified.get("status", "")).lower() not in ("refunded", "refund"):
        return False

    with get_session() as session:
        refund = session.get(PaymentRefund, refund_id)
        if refund is None or refund.status == RefundProgress.CONFIRMED:
            return False
        refund.status = RefundProgress.CONFIRMED
        refund.confirmed_at = utcnow()
    logger.info("refund confirmed by payu", extra={"refund_id": str(refund_id)})
    return True


def _publish(messages: list[dict]) -> None:
    for message in messages:
        try:
            publish_to_ses(message)
        except Exception:  # noqa: BLE001 -- the order is committed; mail is best-effort
            logger.exception("could not queue email", extra={"type": message.get("type")})
