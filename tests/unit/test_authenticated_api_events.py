"""Integration-style tests for authenticated_api's event status-transition
guard, exercised through the full Powertools resolver via a constructed API
Gateway REST proxy event. common.db.get_session is mocked to a fake
in-memory session rather than hitting a real database -- this checks the
handler's own business logic (which status transitions are allowed), not
persistence.
"""

import json
import uuid
from contextlib import contextmanager
from unittest.mock import MagicMock

from common.models import Event, EventStatus


def _api_event(method, path, body=None, authorizer=None):
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
        "requestContext": {"authorizer": authorizer or {}},
    }


def _fake_get_session(event_obj):
    session = MagicMock()
    session.get.return_value = event_obj

    @contextmanager
    def _get_session():
        yield session

    return _get_session


def _fake_event(**overrides):
    defaults = dict(
        id=uuid.uuid4(),
        organiser_id=uuid.uuid4(),
        category_id=uuid.uuid4(),
        title="Jazz Night at The Terrace",
        description="An intimate evening of live jazz.",
        event_date="2026-07-12",
        event_time="19:00:00",
        venue_name="The Terrace",
        venue_address="Bandra, Mumbai",
        city="Mumbai",
        capacity=100,
        status=EventStatus.DRAFT,
    )
    defaults.update(overrides)
    return Event(**defaults)


def test_submit_event_rejects_event_already_live(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event(status=EventStatus.LIVE)
    monkeypatch.setattr(
        "authenticated_api.handler.get_session", _fake_get_session(fake_event)
    )

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST",
        f"/organiser/events/{fake_event.id}/submit",
        authorizer={"role": "organiser", "organiser_id": str(fake_event.organiser_id)},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 409


def test_submit_event_succeeds_from_draft(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event(status=EventStatus.DRAFT)
    monkeypatch.setattr(
        "authenticated_api.handler.get_session", _fake_get_session(fake_event)
    )

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST",
        f"/organiser/events/{fake_event.id}/submit",
        authorizer={"role": "organiser", "organiser_id": str(fake_event.organiser_id)},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    assert fake_event.status == EventStatus.REVIEW


def test_submit_event_rejects_when_organiser_does_not_own_event(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event(status=EventStatus.DRAFT)
    monkeypatch.setattr(
        "authenticated_api.handler.get_session", _fake_get_session(fake_event)
    )

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST",
        f"/organiser/events/{fake_event.id}/submit",
        authorizer={"role": "organiser", "organiser_id": str(uuid.uuid4())},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 404


def test_approve_event_rejects_when_not_in_review(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event(status=EventStatus.DRAFT)
    monkeypatch.setattr(
        "authenticated_api.handler.get_session", _fake_get_session(fake_event)
    )

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST",
        f"/admin/events/{fake_event.id}/approve",
        authorizer={"role": "admin", "admin_id": str(uuid.uuid4())},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 409


def test_approve_event_succeeds_from_review(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event(status=EventStatus.REVIEW)
    monkeypatch.setattr(
        "authenticated_api.handler.get_session", _fake_get_session(fake_event)
    )

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST",
        f"/admin/events/{fake_event.id}/approve",
        authorizer={"role": "admin", "admin_id": str(uuid.uuid4())},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    assert fake_event.status == EventStatus.APPROVED
