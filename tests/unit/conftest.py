"""Shared fixtures. DB, JWT and PayU secrets are always mocked -- these tests
never touch a real AWS account or database."""

from unittest.mock import MagicMock

import pytest


@pytest.fixture(autouse=True)
def _base_env(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_ARN", "arn:aws:secretsmanager:ap-south-1:123456789012:secret:jwt-test")
    monkeypatch.setenv("DB_SECRET_ARN", "arn:aws:secretsmanager:ap-south-1:123456789012:secret:db-test")
    monkeypatch.setenv("DB_PROXY_HOST", "test-proxy.example.com")
    monkeypatch.setenv("DB_NAME", "cyrokx_test")
    monkeypatch.setenv("PAYU_SECRET_ARN", "arn:aws:secretsmanager:ap-south-1:123456789012:secret:payu-test")
    monkeypatch.setenv("PUBLIC_SITE_URL", "https://test.showtik.in")


# PayU's sandbox credentials. Hashes in test_payu.py are computed against
# these, so changing them means recomputing every expected digest.
PAYU_TEST_CREDENTIALS = {
    "merchant_key": "weJ0ny",
    "salt": "tRRmnWx50J8v1BMjKwa9rLEYGohPpiqT",
    "base_url": "https://test.payu.in",
}


@pytest.fixture(autouse=True)
def mock_payu_secret(monkeypatch):
    """Stub common.secrets' Secrets Manager fetch to the PayU sandbox values.

    Autouse because any paid checkout now needs a merchant key to build its
    handoff form, and a test that reached real Secrets Manager would fail on
    whatever credentials happen to be in the environment. Cleared around every
    test since the loader caches per execution environment.
    """
    import json

    import common.secrets as secrets_module

    secrets_module._cache.clear()
    mock_client = MagicMock()
    mock_client.get_secret_value.return_value = {"SecretString": json.dumps(PAYU_TEST_CREDENTIALS)}
    monkeypatch.setattr("common.secrets.boto3.client", lambda *a, **kw: mock_client)
    yield mock_client
    secrets_module._cache.clear()


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
