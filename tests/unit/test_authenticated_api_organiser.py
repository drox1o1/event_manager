"""Tests for authenticated_api's new organiser routes -- ownership checks and
status-transition guards. common.db.get_session is mocked to a fake
in-memory session, same pattern as test_authenticated_api_events.py.
"""

import datetime as dt
import json
import uuid
from contextlib import contextmanager
from unittest.mock import MagicMock

from common.models import Event, EventStatus


def _api_event(method, path, body=None, authorizer=None, query=None):
    return {
        "httpMethod": method,
        "path": path,
        "resource": path,
        "headers": {"Content-Type": "application/json"},
        "multiValueHeaders": {},
        "queryStringParameters": query,
        "multiValueQueryStringParameters": None,
        "pathParameters": None,
        "body": json.dumps(body) if body is not None else None,
        "isBase64Encoded": False,
        "requestContext": {"authorizer": authorizer or {}},
    }


def _fake_get_session(get_return=None):
    session = MagicMock()
    session.get.return_value = get_return

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
        status=EventStatus.DRAFT,
    )
    defaults.update(overrides)
    return Event(**defaults)


def test_get_organiser_event_rejects_when_not_owner(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event()
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_event))

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "GET",
        f"/organiser/events/{fake_event.id}",
        authorizer={"role": "organiser", "organiser_id": str(uuid.uuid4())},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 404


def test_get_organiser_event_succeeds_for_owner(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event()
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_event))

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "GET",
        f"/organiser/events/{fake_event.id}",
        authorizer={"role": "organiser", "organiser_id": str(fake_event.organiser_id)},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["event_id"] == str(fake_event.id)
    assert body["status"] == "draft"


def test_update_event_rejects_when_not_draft_or_rejected(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event(status=EventStatus.REVIEW)
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_event))

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "PATCH",
        f"/organiser/events/{fake_event.id}",
        body={"title": "New title"},
        authorizer={"role": "organiser", "organiser_id": str(fake_event.organiser_id)},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 409


def test_update_event_succeeds_from_draft(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event(status=EventStatus.DRAFT)
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_event))

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "PATCH",
        f"/organiser/events/{fake_event.id}",
        body={"title": "Jazz Night - Rescheduled"},
        authorizer={"role": "organiser", "organiser_id": str(fake_event.organiser_id)},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    assert fake_event.title == "Jazz Night - Rescheduled"


def test_create_ticket_tiers_rejects_when_not_owner(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event()
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_event))

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST",
        f"/organiser/events/{fake_event.id}/ticket-tiers",
        body={"tiers": [{"name": "VIP", "price": "999", "quantity_total": 50}]},
        authorizer={"role": "organiser", "organiser_id": str(uuid.uuid4())},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 404


def test_create_banner_upload_url_returns_presigned_url(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event()
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_event))
    monkeypatch.setenv("BANNERS_BUCKET_NAME", "cyrokx-banners-test")
    monkeypatch.setenv("BANNERS_CDN_DOMAIN", "d123.cloudfront.net")

    mock_s3 = MagicMock()
    mock_s3.generate_presigned_url.return_value = "https://example.com/presigned"
    monkeypatch.setattr("authenticated_api.handler._s3", lambda: mock_s3)

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST",
        f"/organiser/events/{fake_event.id}/banner-upload-url",
        authorizer={"role": "organiser", "organiser_id": str(fake_event.organiser_id)},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["upload_url"] == "https://example.com/presigned"
    # Not a raw S3 URL -- BannersBucket blocks all public access, so the
    # frontend must be given the CloudFront-fronted URL instead (see
    # _banners_cdn_url in the handler).
    assert body["banner_image_url"].startswith("https://d123.cloudfront.net/")


def test_create_image_upload_url_returns_presigned_url(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event()
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_event))
    monkeypatch.setenv("BANNERS_BUCKET_NAME", "cyrokx-banners-test")
    monkeypatch.setenv("BANNERS_CDN_DOMAIN", "d123.cloudfront.net")

    mock_s3 = MagicMock()
    mock_s3.generate_presigned_url.return_value = "https://example.com/presigned"
    monkeypatch.setattr("authenticated_api.handler._s3", lambda: mock_s3)

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST",
        f"/organiser/events/{fake_event.id}/image-upload-url",
        authorizer={"role": "organiser", "organiser_id": str(fake_event.organiser_id)},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["upload_url"] == "https://example.com/presigned"
    assert body["image_url"].startswith("https://d123.cloudfront.net/")


def test_upload_url_signs_the_caller_supplied_content_type(monkeypatch, mock_jwt_secret):
    """The presigned URL's signed Content-Type must match ?content_type --
    which itself must match the Content-Type the frontend's PUT actually
    sends (the picked File's own .type). Previously hardcoded to
    "image/jpeg" regardless of the real file type, so any non-JPEG upload's
    PUT sent a Content-Type the signature didn't cover, and S3 rejected it
    with SignatureDoesNotMatch (403) -- see _resolve_image_content_type."""
    fake_event = _fake_event()
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_event))
    monkeypatch.setenv("BANNERS_BUCKET_NAME", "cyrokx-banners-test")
    monkeypatch.setenv("BANNERS_CDN_DOMAIN", "d123.cloudfront.net")

    mock_s3 = MagicMock()
    mock_s3.generate_presigned_url.return_value = "https://example.com/presigned"
    monkeypatch.setattr("authenticated_api.handler._s3", lambda: mock_s3)

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST",
        f"/organiser/events/{fake_event.id}/banner-upload-url",
        authorizer={"role": "organiser", "organiser_id": str(fake_event.organiser_id)},
        query={"content_type": "image/png"},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert body["banner_image_url"].endswith(".png")

    _, kwargs = mock_s3.generate_presigned_url.call_args
    assert kwargs["Params"]["ContentType"] == "image/png"
    assert kwargs["Params"]["Key"].endswith(".png")


def test_upload_url_rejects_unsupported_content_type(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event()
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_event))
    monkeypatch.setenv("BANNERS_BUCKET_NAME", "cyrokx-banners-test")
    monkeypatch.setenv("BANNERS_CDN_DOMAIN", "d123.cloudfront.net")

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "POST",
        f"/organiser/events/{fake_event.id}/banner-upload-url",
        authorizer={"role": "organiser", "organiser_id": str(fake_event.organiser_id)},
        query={"content_type": "application/pdf"},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 400


def test_attendees_rejects_when_not_owner(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event()
    monkeypatch.setattr("authenticated_api.handler.get_session", _fake_get_session(fake_event))

    from authenticated_api.handler import handler as api_handler

    event = _api_event(
        "GET",
        f"/organiser/events/{fake_event.id}/attendees",
        authorizer={"role": "organiser", "organiser_id": str(uuid.uuid4())},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 404
