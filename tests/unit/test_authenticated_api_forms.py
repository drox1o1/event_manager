"""Tests for the registration-form builder and gallery-image routes on
authenticated_api. common.db.get_session is mocked to a fake in-memory
session (same pattern as test_authenticated_api_events.py) -- these check the
handler's ownership guards and payload validation, not persistence.
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


def _fake_get_session(event_obj, execute_all=None):
    session = MagicMock()
    session.get.return_value = event_obj
    if execute_all is not None:
        session.execute.return_value.scalars.return_value.all.return_value = execute_all

    # A real flush assigns the uuid primary keys (Column default); the mock
    # must do the same so the handler can serialize the created rows' ids.
    added: list = []
    session.add.side_effect = added.append

    def _assign_ids():
        for obj in added:
            if getattr(obj, "id", None) is None:
                obj.id = uuid.uuid4()

    session.flush.side_effect = _assign_ids

    @contextmanager
    def _get_session():
        yield session

    return _get_session, session


def _fake_event(**overrides):
    defaults = dict(
        id=uuid.uuid4(),
        organiser_id=uuid.uuid4(),
        category_id=uuid.uuid4(),
        title="Marathon 2026",
        description="City marathon.",
        event_date="2026-07-12",
        event_time="06:00:00",
        venue_name="Marine Drive",
        venue_address="Mumbai",
        city="Mumbai",
        capacity=5000,
        status=EventStatus.DRAFT,
    )
    defaults.update(overrides)
    return Event(**defaults)


def _org_ctx(event):
    return {"role": "organiser", "organiser_id": str(event.organiser_id)}


def test_replace_form_fields_succeeds(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event()
    get_session, _ = _fake_get_session(fake_event, execute_all=[])
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    body = {
        "fields": [
            {"label": "Full name", "field_type": "text", "required": True, "sort_order": 0},
            {
                "label": "Blood group",
                "field_type": "single_choice",
                "options": ["A+", "O+"],
                "required": False,
                "sort_order": 1,
            },
        ]
    }
    event = _api_event(
        "PUT", f"/organiser/events/{fake_event.id}/form-fields", body=body, authorizer=_org_ctx(fake_event)
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    fields = json.loads(response["body"])["fields"]
    assert [f["label"] for f in fields] == ["Full name", "Blood group"]
    assert fields[1]["options"] == ["A+", "O+"]


def test_replace_form_fields_rejects_choice_without_options(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event()
    get_session, _ = _fake_get_session(fake_event, execute_all=[])
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    body = {"fields": [{"label": "Size", "field_type": "single_choice", "options": [], "required": True, "sort_order": 0}]}
    event = _api_event(
        "PUT", f"/organiser/events/{fake_event.id}/form-fields", body=body, authorizer=_org_ctx(fake_event)
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 400


def test_replace_form_fields_rejects_foreign_event(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event()
    get_session, _ = _fake_get_session(fake_event, execute_all=[])
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    body = {"fields": []}
    event = _api_event(
        "PUT",
        f"/organiser/events/{fake_event.id}/form-fields",
        body=body,
        authorizer={"role": "organiser", "organiser_id": str(uuid.uuid4())},
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 404


def test_replace_event_images_rejects_more_than_three(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event()
    get_session, _ = _fake_get_session(fake_event)
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    body = {"images": [{"image_url": f"https://x/{i}.jpg", "sort_order": i} for i in range(4)]}
    event = _api_event(
        "PUT", f"/organiser/events/{fake_event.id}/images", body=body, authorizer=_org_ctx(fake_event)
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 400


def test_replace_event_images_succeeds(monkeypatch, mock_jwt_secret):
    fake_event = _fake_event()
    get_session, _ = _fake_get_session(fake_event)
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    body = {"images": [{"image_url": "https://x/1.jpg", "sort_order": 0}, {"image_url": "https://x/2.jpg", "sort_order": 1}]}
    event = _api_event(
        "PUT", f"/organiser/events/{fake_event.id}/images", body=body, authorizer=_org_ctx(fake_event)
    )
    response = api_handler(event, MagicMock())
    assert response["statusCode"] == 200
    assert json.loads(response["body"])["images"] == ["https://x/1.jpg", "https://x/2.jpg"]
