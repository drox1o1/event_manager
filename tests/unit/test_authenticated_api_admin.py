"""Tests for authenticated_api's new admin routes -- status-transition
guards. common.db.get_session is mocked to a fake in-memory session, same
pattern as test_authenticated_api_events.py.
"""

import datetime as dt
import json
import uuid
from contextlib import contextmanager
from decimal import Decimal
from unittest.mock import MagicMock

from common.models import (
    Event,
    EventStatus,
    Organiser,
    OrganiserStatus,
    PlatformSettings,
    RefundRequest,
    RefundStatus,
)


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


def _admin_auth():
    return {"role": "admin", "admin_id": str(uuid.uuid4())}


def _fake_get_session(get_return=None, execute_scalar_one=None):
    session = MagicMock()
    session.get.return_value = get_return
    session.execute.return_value.scalar_one_or_none.return_value = execute_scalar_one

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
        event_date=dt.date(2026, 7, 12),
        event_time=dt.time(19, 0, 0),
        venue_name="The Terrace",
        venue_address="Bandra, Mumbai",
        city="Mumbai",
        capacity=100,
        status=EventStatus.REVIEW,
    )
    defaults.update(overrides)
    return Event(**defaults)


def _fake_settings(**overrides):
    defaults = dict(
        id=uuid.uuid4(),
        commission_pct=Decimal("8.00"),
        buyer_fee_enabled=True,
        auto_payout_enabled=False,
        email_sender_name="CyRokx",
        email_reply_to=None,
        email_footer_note=None,
    )
    defaults.update(overrides)
    return PlatformSettings(**defaults)


def test_publish_event_rejects_when_not_approved(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event(status=EventStatus.REVIEW)
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_event))

    from authenticated_api.handler import handler as api_handler

    event = _api_event("POST", f"/admin/events/{fake_event.id}/publish", authorizer=_admin_auth())
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 409


def test_publish_event_succeeds_from_approved(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event(status=EventStatus.APPROVED)
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_event))

    from authenticated_api.handler import handler as api_handler

    event = _api_event("POST", f"/admin/events/{fake_event.id}/publish", authorizer=_admin_auth())
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    assert fake_event.status == EventStatus.LIVE


def test_suspend_organiser_not_found(monkeypatch, mock_jwt_secret):
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(None))

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST", f"/admin/organisers/{uuid.uuid4()}/suspend", authorizer=_admin_auth()
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 404


def test_reactivate_organiser_succeeds(monkeypatch, mock_jwt_secret):
    fake_organiser = Organiser(
        id=uuid.uuid4(),
        org_name="Terrace Live",
        contact_name="Aditi Rao",
        email="aditi@terracelive.in",
        password_hash="x",
        status=OrganiserStatus.SUSPENDED,
    )
    monkeypatch.setattr(
        "authenticated_api.handler.get_session", _fake_get_session(fake_organiser)
    )

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST", f"/admin/organisers/{fake_organiser.id}/reactivate", authorizer=_admin_auth()
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    assert fake_organiser.status == OrganiserStatus.VERIFIED


def test_approve_refund_rejects_when_already_resolved(monkeypatch, mock_jwt_secret):
    fake_refund = RefundRequest(
        id=uuid.uuid4(),
        order_id=uuid.uuid4(),
        reason="Can't attend anymore",
        status=RefundStatus.APPROVED,
    )
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_refund))

    from authenticated_api.handler import handler as api_handler

    event = _api_event("POST", f"/admin/refunds/{fake_refund.id}/approve", authorizer=_admin_auth())
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 409


def test_reject_refund_succeeds(monkeypatch, mock_jwt_secret):
    fake_refund = RefundRequest(
        id=uuid.uuid4(),
        order_id=uuid.uuid4(),
        reason="Can't attend anymore",
        status=RefundStatus.PENDING,
    )
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_refund))

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST",
        f"/admin/refunds/{fake_refund.id}/reject",
        body={"reason": "Event already happened"},
        authorizer=_admin_auth(),
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    assert fake_refund.status == RefundStatus.REJECTED
    assert fake_refund.rejection_reason == "Event already happened"


def test_get_settings_returns_existing_row(monkeypatch, mock_jwt_secret):
    settings = _fake_settings(commission_pct=Decimal("10.00"))
    monkeypatch.setattr(
        "authenticated_api.handler.get_session",
        _fake_get_session(execute_scalar_one=settings),
    )

    from authenticated_api.handler import handler as api_handler

    event = _api_event("GET", "/admin/settings", authorizer=_admin_auth())
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["email_sender_name"] == "CyRokx"
    assert Decimal(body["commission_pct"]) == Decimal("10.00")


def test_update_settings_updates_existing_row(monkeypatch, mock_jwt_secret):
    settings = _fake_settings()
    monkeypatch.setattr(
        "authenticated_api.handler.get_session",
        _fake_get_session(execute_scalar_one=settings),
    )

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "PATCH",
        "/admin/settings",
        body={"commission_pct": "12.5"},
        authorizer=_admin_auth(),
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    assert settings.commission_pct == Decimal("12.5")
