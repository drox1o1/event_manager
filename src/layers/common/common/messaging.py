"""SQS publish helper -- thin wrapper so producers don't repeat boto3 boilerplate."""

import json
import os

import boto3

_sqs = None


def _client():
    global _sqs
    if _sqs is None:
        _sqs = boto3.client("sqs")
    return _sqs


def publish(queue_url_env_var: str, message: dict) -> None:
    queue_url = os.environ[queue_url_env_var]
    _client().send_message(QueueUrl=queue_url, MessageBody=json.dumps(message, default=str))
