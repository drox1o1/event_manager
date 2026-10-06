"""payment-webhook Lambda -- PayU's server-to-server notification.

The authoritative path when the browser never comes back: a buyer who closes
the tab on their bank's 3DS page still gets their tickets because of this.

The work itself is common.payu_callback, shared with the browser return route in
public_api, so both arrivals of the same payment take an identical path and
landing twice is harmless.

Always answers 200 -- including for an unknown transaction, a payload that fails
hash verification, or an unexpected exception. A non-2xx makes PayU retry on a
schedule we don't control, turning one bad request into a storm. Failures are
logged, and the reconciler picks up anything genuinely left unsettled.
"""

from __future__ import annotations

from typing import Any

from aws_lambda_powertools import Logger
from common.payu_callback import handle_callback, parse_callback

logger = Logger()

_OK = {"statusCode": 200, "body": '{"status": "ok"}'}


def handler(event: dict, _context: Any) -> dict:
    try:
        posted = parse_callback(event.get("body"), is_base64=bool(event.get("isBase64Encoded")))
        handle_callback(posted, source="webhook")
    except Exception:  # noqa: BLE001 -- never hand PayU a 5xx
        logger.exception("payu webhook could not be processed")
    return _OK
