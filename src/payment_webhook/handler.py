"""payment-webhook Lambda -- STUB, follow-up work.

Real scope (not built this pass): verify the Razorpay webhook signature,
mark the matching order's payment_status, and publish an order-completed
message to the ticket_generator queue.

Returns 200 unconditionally for now so that if anything does hit this
endpoint before the real integration lands, Razorpay doesn't interpret a
failure and enter a retry storm.
"""

from __future__ import annotations

from typing import Any

from aws_lambda_powertools import Logger

logger = Logger()


def handler(event: dict, _context: Any) -> dict:
    logger.warning(
        "payment_webhook received a request but is not yet implemented",
        extra={"body_present": bool(event.get("body"))},
    )
    return {"statusCode": 200, "body": '{"status": "not_yet_implemented"}'}
