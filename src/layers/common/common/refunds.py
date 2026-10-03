"""Issuing a refund, across the three phases it unavoidably takes.

A refund has to talk to PayU, and PayU calls must never happen inside a
transaction -- common.db runs pool_size=1 behind RDS Proxy, so an 8-second
outbound request holding row locks would stall checkout for the whole event.
So the work splits:

  1. record the intent and commit, so a crash mid-call still leaves evidence;
  2. call PayU with no transaction open;
  3. record the answer, release the inventory, and queue the buyer's email.

Phase 1 existing without phase 3 is the point, not a flaw: a refund stuck in
'requested' is a row the reconciler can retry, whereas a refund attempted with
nothing written down is money that silently went missing.

Two callers, deliberately sharing all of this:
  * the automatic case -- a payment confirmed after its hold lapsed for a tier
    that had since sold out, so the order can't be honoured and nobody asked
    for the refund;
  * admin approval of a buyer's refund request.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from aws_lambda_powertools import Logger

from . import payu
from .db import get_session
from .messaging import publish_to_ses
from .models import RefundProgress
from .settlement import complete_refund, start_refund, successful_attempt

logger = Logger(child=True)

# The one outcome that isn't a RefundProgress: there was no successful PayU
# transaction to refund against at all. Free orders, and everything created
# before this integration (payment_gateway_ref = 'TEST-MODE'), land here -- so a
# caller can keep a human decision while reporting that no money moved.
NO_PAYMENT = "no_payment"


def refund_order(
    order_id: uuid.UUID,
    reason: str,
    *,
    amount: Decimal | None = None,
    refund_request_id: uuid.UUID | None = None,
) -> str:
    """Refund an order's payment at PayU. Returns a status for the caller to
    report: `pending` (queued at PayU), `failed` (PayU refused), `requested`
    (the call didn't get through; the reconciler will retry), or `no_payment`.

    `amount` defaults to the full captured amount. Never raises on a gateway
    problem -- the refund row is left for the reconciler to retry, because
    turning a settled payment into a 500 helps nobody.
    """
    with get_session() as session:
        attempt = successful_attempt(session, order_id)
        if attempt is None:
            logger.warning(
                "refund requested for an order with no gateway payment",
                extra={"order_id": str(order_id)},
            )
            return NO_PAYMENT
        refund = start_refund(
            session,
            attempt,
            amount if amount is not None else attempt.amount, # type: ignore
            reason,
            refund_request_id=refund_request_id,
        )
        refund_id, mihpayid, refund_amount = refund.id, attempt.mihpayid, refund.amount

    # Outside any transaction, on purpose -- see the module docstring.
    try:
        gateway_response = payu.refund(
            mihpayid, str(refund_id), payu.format_amount(refund_amount) # type: ignore
        )
    except Exception:  # noqa: BLE001 -- leave the row in 'requested' for the reconciler
        logger.exception(
            "payu refund call failed; left pending for reconciliation",
            extra={"order_id": str(order_id), "refund_id": str(refund_id)},
        )
        return RefundProgress.REQUESTED

    with get_session() as session:
        status, emails = complete_refund(session, refund_id, gateway_response)

    for message in emails:
        try:
            publish_to_ses(message)
        except Exception:  # noqa: BLE001 -- the refund is real whether or not the mail goes out
            logger.exception("could not queue refund email", extra={"order_id": str(order_id)})

    return status
