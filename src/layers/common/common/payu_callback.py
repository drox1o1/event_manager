"""Handling an inbound PayU callback, start to finish.

Both ways PayU tells us about a payment -- the browser's return POST and the
server-to-server webhook -- carry the same payload and need the same handling:
verify with PayU directly, settle, publish whatever mail that produced, and
refund if the tickets can no longer be issued. The two entry points differ only
in what they return to the caller (a redirect vs a 200), so everything before
that lives here rather than in two places that could drift.

The order of operations matters and is the reason this is a module rather than
a helper on either caller:

  * PayU is asked what happened *before* a session is opened. An 8-second
    outbound call inside a transaction would hold row locks on a pool of one.
  * Settlement owns its own short transaction.
  * Mail and refunds happen after that transaction commits, so neither can roll
    back a payment that has settled.
"""

from __future__ import annotations

import urllib.parse

from aws_lambda_powertools import Logger

from . import payu
from .db import get_session
from .messaging import publish_to_ses
from .settlement import SettlementResult, settle_order

logger = Logger(child=True)

OVERSOLD_REFUND_REASON = "Tickets sold out before your payment was confirmed"


def parse_callback(body: str | None, *, is_base64: bool = False) -> dict:
    """PayU posts form-encoded, not JSON, so json_body would raise.

    keep_blank_values is load-bearing: the response hash covers every udf slot,
    so dropping an empty one changes the digest and verification fails.
    """
    raw = body or ""
    if is_base64 and raw:
        import base64

        raw = base64.b64decode(raw).decode("utf-8")
    return dict(urllib.parse.parse_qsl(raw, keep_blank_values=True))


def handle_callback(posted: dict, *, source: str) -> SettlementResult | None:
    """Verify, settle, and deal with the consequences. None if there is nothing
    to act on (no txnid, or the payload isn't genuinely PayU's).

    Never raises for a gateway or mail problem: the browser must still be
    redirected somewhere sensible, PayU must still get a 2xx, and the reconciler
    is the backstop for anything left unsettled.
    """
    txnid = posted.get("txnid", "")
    if not txnid:
        logger.warning("payu callback carried no txnid", extra={"source": source})
        return None

    if not payu.verify_response(posted):
        logger.error(
            "payu callback failed hash verification -- not settling",
            extra={"source": source, "txnid": txnid},
        )
        return None

    verified = _verified_details(txnid)

    with get_session() as session:
        result = settle_order(
            session,
            txnid,
            # PayU's posted status is a fallback only. The verdict comes from
            # our own verify call, because anything that travelled through a
            # browser is a claim rather than a fact.
            status=verified.get("status") or posted.get("status"),
            mihpayid=verified.get("mihpayid") or posted.get("mihpayid"),
            mode=verified.get("mode") or posted.get("mode"),
            error_code=verified.get("error_code") or posted.get("error"),
            error_message=verified.get("error_Message") or posted.get("error_Message"),
            gateway_amount=verified.get("amt") or posted.get("amount"),
            raw={"verified": verified, "posted": posted},
        )

    logger.info(
        "payu callback settled",
        extra={
            "source": source,
            "txnid": txnid,
            "outcome": result.outcome,
            "order_id": str(result.order_id),
        },
    )

    publish_all(result.emails)
    if result.refund_needed:
        _refund_unfulfillable(result)
    return result


def _verified_details(txnid: str) -> dict:
    try:
        return payu.transaction_status(payu.verify_payment(txnid), txnid) or {}
    except Exception:  # noqa: BLE001 -- fall back to the posted claim rather than losing the payment
        logger.exception(
            "payu verify_payment failed; relying on the posted status", extra={"txnid": txnid}
        )
        return {}


def _refund_unfulfillable(result: SettlementResult) -> None:
    """Money arrived for tickets that can't be issued, so give it back without
    waiting for anyone to ask -- nobody is going to.

    Best-effort: a failure leaves the refund row in 'requested' for the
    reconciler, which is why it must never propagate and turn a settled payment
    into an error.
    """
    try:
        from .refunds import refund_order  # local: refunds imports settlement, so avoid a cycle

        refund_order(result.order_id, reason=OVERSOLD_REFUND_REASON)
    except Exception:  # noqa: BLE001
        logger.exception(
            "could not start automatic refund", extra={"order_id": str(result.order_id)}
        )


def publish_all(messages: list[dict]) -> None:
    """Queue emails one at a time so a single bad message can't suppress the
    rest -- a buyer's confirmation shouldn't be lost to an organiser notice."""
    for message in messages:
        try:
            publish_to_ses(message)
        except Exception:  # noqa: BLE001 -- the order is committed; mail is best-effort
            logger.exception("could not queue email", extra={"type": message.get("type")})
