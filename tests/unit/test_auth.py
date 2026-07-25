"""Tests for common.auth -- password hashing and JWT issuing/validation."""

import time
import uuid

import jwt as pyjwt
import pytest
from common.auth import (
    InvalidTokenError,
    decode_token,
    hash_password,
    issue_access_token,
    issue_email_verification_token,
    issue_refresh_token,
    verify_password,
)


def test_hash_and_verify_password_roundtrip():
    hashed = hash_password("correct horse battery staple")
    assert verify_password("correct horse battery staple", hashed)
    assert not verify_password("wrong password", hashed)


def test_hash_password_is_salted():
    assert hash_password("same-password") != hash_password("same-password")


def test_issue_and_decode_access_token(mock_jwt_secret):
    subject_id = uuid.uuid4()
    token = issue_access_token(subject_id, "organiser")
    payload = decode_token(token, expected_type="access")
    assert payload["sub"] == str(subject_id)
    assert payload["role"] == "organiser"
    assert payload["type"] == "access"


def test_issue_and_decode_refresh_token(mock_jwt_secret):
    subject_id = uuid.uuid4()
    token = issue_refresh_token(subject_id, "admin")
    payload = decode_token(token, expected_type="refresh")
    assert payload["role"] == "admin"


def test_issue_and_decode_email_verification_token(mock_jwt_secret):
    subject_id = uuid.uuid4()
    token = issue_email_verification_token(subject_id)
    payload = decode_token(token, expected_type="email_verify")
    assert payload["sub"] == str(subject_id)


def test_decode_token_rejects_wrong_type(mock_jwt_secret):
    token = issue_access_token(uuid.uuid4(), "organiser")
    with pytest.raises(InvalidTokenError):
        decode_token(token, expected_type="refresh")


def test_decode_token_rejects_bad_signature(mock_jwt_secret):
    bad_token = pyjwt.encode(
        {"sub": "x", "role": "organiser", "type": "access", "exp": time.time() + 60},
        "wrong-key",
        algorithm="HS256",
    )
    with pytest.raises(InvalidTokenError):
        decode_token(bad_token, expected_type="access")


def test_decode_token_rejects_expired_token(mock_jwt_secret):
    payload = {
        "sub": str(uuid.uuid4()),
        "role": "organiser",
        "type": "access",
        "iat": int(time.time()) - 120,
        "exp": int(time.time()) - 60,
    }
    expired = pyjwt.encode(payload, "test-signing-key-value", algorithm="HS256")
    with pytest.raises(InvalidTokenError):
        decode_token(expired, expected_type="access")
