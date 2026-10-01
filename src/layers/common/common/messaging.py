"""SQS publish helper -- thin wrapper so producers don't repeat boto3 boilerplate."""

import json
import os

import boto3
from botocore.config import Config

_sqs = None


def _client():
    global _sqs
    if _sqs is None:
        # Short timeouts: callers publish after committing (e.g. checkout's
        # confirmation email), so a slow queue must fail fast, not stall the
        # request until the Lambda times out.
        _sqs = boto3.client(
            "sqs", config=Config(connect_timeout=2, read_timeout=3, retries={"max_attempts": 2})
        )
    return _sqs


def publish_to_ses(message: dict) -> None:
    """Queues an email-sender message. The only queue anything publishes to
    today -- if a second one (e.g. OrderCompletedQueue, currently wired to
    TicketGeneratorFunction but unused) needs a producer later, give it its
    own small function rather than re-adding a queue-name parameter here."""
    queue_url = os.environ["EMAIL_QUEUE_URL"]
    _client().send_message(QueueUrl=queue_url, MessageBody=json.dumps(message, default=str))
