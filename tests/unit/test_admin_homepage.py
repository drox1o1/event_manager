"""Tests for the homepage CMS routes: admin GET/PUT /admin/homepage and the
public GET /homepage resolver. get_session is mocked to a fake in-memory
session (same pattern as the other handler tests)."""

import json
import uuid
from contextlib import contextmanager
from unittest.mock import MagicMock

from common.models import (
    HomepageSection,
    HomepageSectionMode,
    HomepageSectionType,
    HomepageSettings,
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


def _admin_ctx():
    return {"role": "admin", "admin_id": str(uuid.uuid4())}


def _fake_session(scalar_one=None, scalars_all=None, assign_ids=False):
    session = MagicMock()
    session.execute.return_value.scalar_one_or_none.return_value = scalar_one
    session.execute.return_value.scalars.return_value.all.return_value = scalars_all or []

    if assign_ids:
        added: list = []
        session.add.side_effect = added.append

        def _flush():
            for obj in added:
                if getattr(obj, "id", None) is None:
                    obj.id = uuid.uuid4()

        session.flush.side_effect = _flush

    @contextmanager
    def _get_session():
        yield session

    return _get_session, session


def test_get_homepage_returns_settings_and_sections(monkeypatch, mock_jwt_secret):
    settings = HomepageSettings(
        id=uuid.uuid4(), hero_eyebrow="Eye", hero_headline="Head", hero_search_enabled=True, banner_enabled=False,
    )
    section = HomepageSection(
        id=uuid.uuid4(), title="Featured events", section_type=HomepageSectionType.FEATURED_EVENTS,
        mode=HomepageSectionMode.AUTO, enabled=True, sort_order=0,
    )
    get_session, _ = _fake_session(scalar_one=settings, scalars_all=[section])
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    resp = api_handler(_api_event("GET", "/admin/homepage", authorizer=_admin_ctx()), MagicMock())
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["settings"]["hero_headline"] == "Head"
    assert body["sections"][0]["section_type"] == "featured_events"


def test_replace_homepage_persists_and_forces_category_grid_auto(monkeypatch, mock_jwt_secret):
    settings = HomepageSettings(id=uuid.uuid4())
    get_session, session = _fake_session(scalar_one=settings, assign_ids=True)
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    body = {
        "settings": {
            "hero_eyebrow": "Discover", "hero_headline": "Find events", "hero_subheadline": None,
            "hero_search_enabled": True, "banner_enabled": True, "banner_text": "Sale!", "banner_link_url": "/events",
        },
        "sections": [
            {"title": "Categories", "section_type": "category_grid", "mode": "curated",
             "enabled": True, "event_ids": [str(uuid.uuid4())]},
            {"title": "Picks", "section_type": "featured_events", "mode": "curated",
             "enabled": True, "event_ids": [str(uuid.uuid4()), str(uuid.uuid4())]},
        ],
    }
    resp = api_handler(_api_event("PUT", "/admin/homepage", body=body, authorizer=_admin_ctx()), MagicMock())
    assert resp["statusCode"] == 200
    out = json.loads(resp["body"])
    # category_grid is coerced back to auto with no curated picks by the schema.
    assert out["sections"][0]["mode"] == "auto"
    assert out["sections"][0]["event_ids"] == []
    # featured keeps its two curated picks.
    assert out["sections"][1]["mode"] == "curated"
    assert len(out["sections"][1]["event_ids"]) == 2
    assert settings.banner_text == "Sale!"


def test_replace_homepage_requires_admin(monkeypatch, mock_jwt_secret):
    get_session, _ = _fake_session()
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    body = {"settings": {"hero_eyebrow": "a", "hero_headline": "b"}, "sections": []}
    # Organiser token -> authorizer would deny at the gateway; here we send an
    # organiser context and expect the handler's admin guard to 401.
    resp = api_handler(
        _api_event("PUT", "/admin/homepage", body=body, authorizer={"role": "organiser", "organiser_id": str(uuid.uuid4())}),
        MagicMock(),
    )
    assert resp["statusCode"] == 401


def test_public_homepage_defaults_when_empty(monkeypatch):
    get_session, _ = _fake_session(scalar_one=None, scalars_all=[])
    monkeypatch.setattr("public_api.handler.get_session", get_session)

    from public_api.handler import handler as api_handler

    resp = api_handler(_api_event("GET", "/homepage"), MagicMock())
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["hero"]["headline"] == "Find your next night out"
    assert body["banner"]["enabled"] is False
    # Falls back to the three default section types when no config rows exist.
    assert [s["type"] for s in body["sections"]] == ["category_grid", "featured_events", "trending_events"]
