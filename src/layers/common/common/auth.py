"""Password hashing and JWT issuing/validation, shared by authenticated_api and authorizer."""

import os
import time
import uuid
from typing import Literal

import bcrypt
import boto3
import jwt

Role = Literal["organiser", "admin"]

ACCESS_TOKEN_TTL_SECONDS = 60 * 60  # 1 hour
REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days
EMAIL_VERIFY_TOKEN_TTL_SECONDS = 60 * 60 * 24  # 24 hours


class InvalidTokenError(Exception):
    pass


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))


_signing_key_cache: str | None = None


def _signing_key() -> str:
    """Fetched once per execution environment and cached -- same pattern as
    common.db's DB credential fetch, and avoids baking the secret value into
    Lambda configuration via a CloudFormation dynamic reference."""
    global _signing_key_cache
    if _signing_key_cache is None:
        secret_arn = os.environ["JWT_SECRET_ARN"]
        client = boto3.client("secretsmanager")
        secret = client.get_secret_value(SecretId=secret_arn)
        _signing_key_cache = secret["SecretString"]
    return _signing_key_cache


def _issue_token(subject_id: uuid.UUID, role: Role, ttl_seconds: int, token_type: str) -> str:
    now = int(time.time())
    payload = {
        "sub": str(subject_id),
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + ttl_seconds,
    }
    return jwt.encode(payload, _signing_key(), algorithm="HS256")


def issue_access_token(subject_id: uuid.UUID, role: Role) -> str:
    return _issue_token(subject_id, role, ACCESS_TOKEN_TTL_SECONDS, "access")


def issue_refresh_token(subject_id: uuid.UUID, role: Role) -> str:
    return _issue_token(subject_id, role, REFRESH_TOKEN_TTL_SECONDS, "refresh")


def issue_email_verification_token(subject_id: uuid.UUID) -> str:
    return _issue_token(subject_id, "organiser", EMAIL_VERIFY_TOKEN_TTL_SECONDS, "email_verify")


def decode_token(token: str, expected_type: str = "access") -> dict:
    """Raises InvalidTokenError on a bad signature, expired token, or type mismatch."""
    try:
        payload = jwt.decode(token, _signing_key(), algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise InvalidTokenError(str(exc)) from exc
    if payload.get("type") != expected_type:
        raise InvalidTokenError(f"expected a {expected_type} token, got {payload.get('type')!r}")
    return payload
