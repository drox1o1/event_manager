"""Secrets Manager reader for JSON-valued secrets, cached per execution
environment.

Deliberately its own module rather than another function in common.db: db.py
is about RDS Proxy connection management, and payment_webhook (which needs a
gateway credential but is otherwise DB-light) shouldn't import the engine
machinery just to read a secret.

common.db.load_db_credentials and common.auth._signing_key predate this and
keep their own inline reads -- converging them would be churn in two modules
that already work, including migration_runner's import path.
"""

import json
import os

import boto3

_cache: dict[str, dict] = {}


def load_secret_json(env_var: str) -> dict:
    """Read the JSON secret whose ARN is in `env_var`, once per cold start.

    Cached by ARN rather than by env var name so two variables pointing at the
    same secret share one fetch. Raises KeyError if the variable is unset --
    a function that needs a secret and wasn't given one is misconfigured, and
    should fail loudly at the first call rather than degrade quietly.
    """
    secret_arn = os.environ[env_var]
    if secret_arn not in _cache:
        client = boto3.client("secretsmanager")
        secret = client.get_secret_value(SecretId=secret_arn)
        _cache[secret_arn] = json.loads(secret["SecretString"])
    return _cache[secret_arn]
