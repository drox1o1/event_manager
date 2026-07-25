"""Shared fixtures. DB and JWT secrets are always mocked -- these tests never
touch a real AWS account or database."""

from unittest.mock import MagicMock

import pytest


@pytest.fixture(autouse=True)
def _base_env(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_ARN", "arn:aws:secretsmanager:ap-south-1:123456789012:secret:jwt-test")
    monkeypatch.setenv("DB_SECRET_ARN", "arn:aws:secretsmanager:ap-south-1:123456789012:secret:db-test")
    monkeypatch.setenv("DB_PROXY_HOST", "test-proxy.example.com")
    monkeypatch.setenv("DB_NAME", "cyrokx_test")


@pytest.fixture(autouse=True)
def _reset_auth_cache():
    import common.auth as auth_module

    auth_module._signing_key_cache = None
    yield
    auth_module._signing_key_cache = None


@pytest.fixture
def mock_jwt_secret(monkeypatch):
    """common.auth fetches its signing key from Secrets Manager on first use
    (then caches it) -- this patches that fetch to a fixed test value."""
    mock_client = MagicMock()
    mock_client.get_secret_value.return_value = {"SecretString": "test-signing-key-value"}
    monkeypatch.setattr("common.auth.boto3.client", lambda *a, **kw: mock_client)
    return mock_client
