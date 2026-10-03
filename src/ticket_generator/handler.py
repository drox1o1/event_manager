"""ticket-generator Lambda -- SUPERSEDED, retained unused.

It was meant to create tickets, increment ticket_tiers.quantity_sold and send
the order confirmation, driven off OrderCompletedQueue. That work now happens
in common.settlement, synchronously inside the transaction that marks the order
paid -- so tickets are guaranteed to exist by the time the buyer lands on their
order page, and there is no window in which a paid order has no tickets.

Nothing publishes to OrderCompletedQueue. This handler and its queue are kept
only so removing them is a separate, deliberate change; if you are looking for
where tickets come from, it is common.settlement.issue_tickets.

Still to build somewhere: rendering a QR image to S3. The token exists on every
ticket (tickets.qr_code_token); nothing draws it yet.
"""

from __future__ import annotations

from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger()


def handler(event: dict, _context: LambdaContext) -> dict:
    for record in event.get("Records", []):
        logger.warning(
            "ticket_generator received a message but is superseded by common.settlement",
            extra={"message_id": record.get("messageId"), "body": record.get("body")},
        )
    return {"batchItemFailures": []}
