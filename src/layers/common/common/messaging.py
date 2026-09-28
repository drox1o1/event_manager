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


def publish(queue_url_env_var: str, message: dict) -> None:
    queue_url = os.environ[queue_url_env_var]
    _client().send_message(QueueUrl=queue_url, MessageBody=json.dumps(message, default=str))
