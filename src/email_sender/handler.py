"""email-sender Lambda -- STUB, follow-up work.

Real scope (not built this pass): render and send the message via SES --
organiser email verification, order confirmation with QR ticket, and
moderation decision notices are all published to this queue already
(organiser signup does this today; the others land with their respective
follow-up passes).

For now, just logs each record so the queue wiring can be verified end to
end even before SES sending exists.
"""

from __future__ import annotations

from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger()


def handler(event: dict, _context: LambdaContext) -> dict:
    for record in event.get("Records", []):
        logger.warning(
            "email_sender received a message but is not yet implemented",
            extra={"message_id": record.get("messageId"), "body": record.get("body")},
        )
    return {"batchItemFailures": []}
