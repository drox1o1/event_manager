"""Tests for the organiser forgot-password / reset-password routes in
auth_routes.py. common.db.get_session is mocked to a fake in-memory session,
same pattern as the other handler tests."""

import json
import uuid
from contextlib import contextmanager
from unittest.mock import MagicMock

from common.auth import hash_password, issue_password_reset_token
from common.models import Organiser, OrganiserStatus


def _api_event(method, path, body=None):
    return {
        "httpMethod": method,
        "path": path,
        "resource": path,
        "headers": {"Content-Type": "application/json"},
        "multiValueHeaders": {},
        "queryStringParameters": None,
        "multiValueQueryStringParameters": None,
        "pathParameters": None,
        "body": json.dumps(body) if body is not None else None,
        "isBase64Encoded": False,
        "requestContext": {"authorizer": {}},
    }


def _fake_get_session(get_return=None, execute_scalar_one=None):
    session = MagicMock()
    session.get.return_value = get_return
    session.execute.return_value.scalar_one_or_none.return_value = execute_scalar_one

    @contextmanager
    def _get_session():
        yield session

    return _get_session, session


def _fake_organiser(**overrides):
    defaults = dict(
        id=uuid.uuid4(),
        org_name="Terrace Live",
        contact_name="Aditi",
        email="aditi@example.com",
        password_hash=hash_password("old-password-1"),
        status=OrganiserStatus.VERIFIED,
    )
    defaults.update(overrides)
    return Organiser(**defaults)


def test_forgot_password_issues_token_and_queues_email_for_known_organiser(monkeypatch, mock_jwt_secret):
    organiser = _fake_organiser()
    get_session, _ = _fake_get_session(execute_scalar_one=organiser)
    monkeypatch.setattr("auth_routes.get_session", get_session)
    mock_publish = MagicMock()
    monkeypatch.setattr("auth_routes.publish_to_ses", mock_publish)

    from authenticated_api.handler import handler as api_handler

    event = _api_event("POST", "/organiser/auth/forgot-password", body={"email": organiser.email})
    response = api_handler(event, MagicMock())

    assert response["statusCode"] == 200
    mock_publish.assert_called_once()
    (msg,) = mock_publish.call_args[0]
    assert msg["type"] == "password_reset"
    assert msg["to"] == organiser.email
    assert "reset_token" in msg


def test_forgot_password_responds_the_same_for_unknown_email(monkeypatch, mock_jwt_secret):
    """No email enumeration: an unknown email gets the identical response
    and no email is queued -- the only observable difference (whether an
    email arrives) never shows up in the HTTP response itself."""
    get_session, _ = _fake_get_session(execute_scalar_one=None)
    monkeypatch.setattr("auth_routes.get_session", get_session)
    mock_publish = MagicMock()
    monkeypatch.setattr("auth_routes.publish_to_ses", mock_publish)

    from authenticated_api.handler import handler as api_handler

    known_event = _api_event("POST", "/organiser/auth/forgot-password", body={"email": "known@example.com"})
    unknown_event = _api_event("POST", "/organiser/auth/forgot-password", body={"email": "unknown@example.com"})

    known_response = api_handler(known_event, MagicMock())
    unknown_response = api_handler(unknown_event, MagicMock())

    assert known_response["statusCode"] == unknown_response["statusCode"] == 200
    assert known_response["body"] == unknown_response["body"]
    mock_publish.assert_not_called()


def test_reset_password_succeeds_with_valid_token(monkeypatch, mock_jwt_secret):
    organiser = _fake_organiser()
    original_hash = organiser.password_hash
    get_session, _ = _fake_get_session(get_return=organiser)
    monkeypatch.setattr("auth_routes.get_session", get_session)
    monkeypatch.setattr("auth_routes.publish_to_ses", MagicMock())

    token = issue_password_reset_token(organiser.id, "organiser")

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST", "/organiser/auth/reset-password", body={"token": token, "new_password": "brand-new-password"}
    )
    response = api_handler(event, MagicMock())

    assert response["statusCode"] == 200
    assert organiser.password_hash != original_hash


def test_reset_password_rejects_garbage_token(monkeypatch, mock_jwt_secret):
    get_session, _ = _fake_get_session()
    monkeypatch.setattr("auth_routes.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST", "/organiser/auth/reset-password", body={"token": "not-a-real-token", "new_password": "brand-new-password"}
    )
    response = api_handler(event, MagicMock())

    assert response["statusCode"] == 400


def test_reset_password_rejects_an_access_token(monkeypatch, mock_jwt_secret):
    """A valid, correctly-signed token of the wrong type (e.g. a login
    access token) must not be accepted for a password reset."""
    from common.auth import issue_access_token

    get_session, _ = _fake_get_session()
    monkeypatch.setattr("auth_routes.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    token = issue_access_token(uuid.uuid4(), "organiser")
    event = _api_event(
        "POST", "/organiser/auth/reset-password", body={"token": token, "new_password": "brand-new-password"}
    )
    response = api_handler(event, MagicMock())

    assert response["statusCode"] == 400
