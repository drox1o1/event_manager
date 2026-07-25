"""ticket-generator Lambda -- STUB, follow-up work.

Real scope (not built this pass): for each order in the order-completed
queue, create one `tickets` row per unit of quantity with a unique QR
token, increment ticket_tiers.quantity_sold, render the QR image to S3, and
publish an order-confirmation message to the email queue.

For now, just logs each record so the queue wiring can be verified end to
end even before the real logic exists.
"""

from __future__ import annotations

from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger()


def handler(event: dict, _context: LambdaContext) -> dict:
    for record in event.get("Records", []):
        logger.warning(
            "ticket_generator received a message but is not yet implemented",
            extra={"message_id": record.get("messageId"), "body": record.get("body")},
        )
    return {"batchItemFailures": []}
