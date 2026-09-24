"""Tests for the super-admin site-content routes added in 0005: categories
(replace-all CRUD), site pages (CRUD by slug), and the public /site-chrome +
/site-pages/<slug> reads. Same MagicMock get_session pattern as
test_admin_homepage.py."""

import json
import uuid
from contextlib import contextmanager
from unittest.mock import MagicMock

from common.models import Category, HomepageSettings, SitePage


def _api_event(method, path, body=None, path_params=None, authorizer=None):
    return {
        "httpMethod": method,
        "path": path,
        "resource": path,
        "headers": {"Content-Type": "application/json"},
        "multiValueHeaders": {},
        "queryStringParameters": None,
        "multiValueQueryStringParameters": None,
        "pathParameters": path_params,
        "body": json.dumps(body) if body is not None else None,
        "isBase64Encoded": False,
        "requestContext": {"authorizer": authorizer or {}},
    }


def _admin_ctx():
    return {"role": "admin", "admin_id": str(uuid.uuid4())}


def _scalars_all(rows):
    """A session.execute() return value whose .scalars().all() yields `rows`."""
    result = MagicMock()
    result.scalars.return_value.all.return_value = rows
    return result


def _scalar_one(row):
    result = MagicMock()
    result.scalar_one_or_none.return_value = row
    return result


def _fake_session(execute_results=None, assign_ids=False):
    """execute_results: a list consumed in order, one per session.execute()
    call -- lets a single test give different queries different results."""
    session = MagicMock()
    if execute_results is not None:
        session.execute.side_effect = execute_results

    if assign_ids:
        import datetime as dt

        added: list = []
        session.add.side_effect = added.append

        def _flush():
            # Mimics what a real flush against Postgres does for columns with
            # server_default (id via gen_random_uuid(), updated_at via now())
            # -- the ORM fetches them back via RETURNING. Our mock session
            # never touches a real DB, so this fills them in by hand.
            for obj in added:
                if getattr(obj, "id", None) is None:
                    obj.id = uuid.uuid4()
                if hasattr(obj, "updated_at") and obj.updated_at is None:
                    obj.updated_at = dt.datetime.now(dt.timezone.utc)

        session.flush.side_effect = _flush

    @contextmanager
    def _get_session():
        yield session

    return _get_session, session


# --- Categories ---


def test_list_categories_admin(monkeypatch, mock_jwt_secret):
    cats = [Category(id=uuid.uuid4(), name="Sports", sort_order=0), Category(id=uuid.uuid4(), name="Music", sort_order=1)]
    get_session, _ = _fake_session(execute_results=[_scalars_all(cats)])
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    resp = api_handler(_api_event("GET", "/admin/categories", authorizer=_admin_ctx()), MagicMock())
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert [c["name"] for c in body["categories"]] == ["Sports", "Music"]


def test_replace_categories_creates_updates_and_reorders(monkeypatch, mock_jwt_secret):
    existing = Category(id=uuid.uuid4(), name="Sports", sort_order=0)
    get_session, session = _fake_session(execute_results=[_scalars_all([existing])], assign_ids=True)
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    body = {"categories": [{"name": "Music"}, {"id": str(existing.id), "name": "Sports (renamed)"}]}
    resp = api_handler(_api_event("PUT", "/admin/categories", body=body, authorizer=_admin_ctx()), MagicMock())
    assert resp["statusCode"] == 200
    out = json.loads(resp["body"])
    assert [c["name"] for c in out["categories"]] == ["Music", "Sports (renamed)"]
    assert [c["sort_order"] for c in out["categories"]] == [0, 1]
    assert existing.name == "Sports (renamed)"


def test_replace_categories_rejects_duplicate_names(monkeypatch, mock_jwt_secret):
    get_session, _ = _fake_session()
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    body = {"categories": [{"name": "Sports"}, {"name": "sports"}]}
    resp = api_handler(_api_event("PUT", "/admin/categories", body=body, authorizer=_admin_ctx()), MagicMock())
    assert resp["statusCode"] == 400


def test_replace_categories_blocks_delete_when_events_reference_it(monkeypatch, mock_jwt_secret):
    to_delete = Category(id=uuid.uuid4(), name="Sports", sort_order=0)
    keep = Category(id=uuid.uuid4(), name="Music", sort_order=1)
    get_session, session = _fake_session(execute_results=[
        _scalars_all([to_delete, keep]),  # existing categories
        _scalars_all(["Sports"]),  # blocked names (events still use "Sports")
    ])
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    body = {"categories": [{"id": str(keep.id), "name": "Music"}]}
    resp = api_handler(_api_event("PUT", "/admin/categories", body=body, authorizer=_admin_ctx()), MagicMock())
    assert resp["statusCode"] == 409
    assert "Sports" in resp["body"]
    session.delete.assert_not_called()


def test_replace_categories_requires_admin(monkeypatch, mock_jwt_secret):
    get_session, _ = _fake_session()
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    resp = api_handler(
        _api_event("PUT", "/admin/categories", body={"categories": [{"name": "x"}]},
                   authorizer={"role": "organiser", "organiser_id": str(uuid.uuid4())}),
        MagicMock(),
    )
    assert resp["statusCode"] == 401


# --- Site pages (admin) ---


def test_list_site_pages(monkeypatch, mock_jwt_secret):
    import datetime as dt

    pages = [SitePage(id=uuid.uuid4(), slug="about", title="About", body="x", updated_at=dt.datetime.now(dt.timezone.utc))]
    get_session, _ = _fake_session(execute_results=[_scalars_all(pages)])
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    resp = api_handler(_api_event("GET", "/admin/site-pages", authorizer=_admin_ctx()), MagicMock())
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["pages"][0]["slug"] == "about"


def test_get_site_page_admin_404(monkeypatch, mock_jwt_secret):
    get_session, _ = _fake_session(execute_results=[_scalar_one(None)])
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    resp = api_handler(
        _api_event("GET", "/admin/site-pages/nope", path_params={"slug": "nope"}, authorizer=_admin_ctx()),
        MagicMock(),
    )
    assert resp["statusCode"] == 404


def test_upsert_site_page_creates_when_missing(monkeypatch, mock_jwt_secret):
    get_session, session = _fake_session(execute_results=[_scalar_one(None)], assign_ids=True)
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    body = {"title": "New page", "body": "Some text."}
    resp = api_handler(
        _api_event("PUT", "/admin/site-pages/new-page", body=body, path_params={"slug": "new-page"}, authorizer=_admin_ctx()),
        MagicMock(),
    )
    assert resp["statusCode"] == 200
    out = json.loads(resp["body"])
    assert out["slug"] == "new-page"
    assert out["title"] == "New page"
    session.add.assert_called_once()


def test_upsert_site_page_rejects_bad_slug(monkeypatch, mock_jwt_secret):
    get_session, _ = _fake_session()
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    resp = api_handler(
        _api_event("PUT", "/admin/site-pages/Not Valid!", body={"title": "t", "body": "b"},
                   path_params={"slug": "Not Valid!"}, authorizer=_admin_ctx()),
        MagicMock(),
    )
    assert resp["statusCode"] == 400


def test_delete_site_page(monkeypatch, mock_jwt_secret):
    page = SitePage(id=uuid.uuid4(), slug="about", title="About", body="x")
    get_session, session = _fake_session(execute_results=[_scalar_one(page)])
    monkeypatch.setattr("authenticated_api.handler.get_session", get_session)

    from authenticated_api.handler import handler as api_handler

    resp = api_handler(
        _api_event("DELETE", "/admin/site-pages/about", path_params={"slug": "about"}, authorizer=_admin_ctx()),
        MagicMock(),
    )
    assert resp["statusCode"] == 200
    session.delete.assert_called_once_with(page)


# --- Public: site chrome + site pages ---


def test_public_site_chrome_defaults_when_empty(monkeypatch):
    get_session, _ = _fake_session(execute_results=[_scalar_one(None)])
    monkeypatch.setattr("public_api.handler.get_session", get_session)

    from public_api.handler import handler as api_handler

    resp = api_handler(_api_event("GET", "/site-chrome"), MagicMock())
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert "Mumbai" in body["cities"]
    assert body["footer"]["columns"][0]["title"] == "Discover"


def test_public_site_chrome_uses_admin_settings(monkeypatch):
    settings = HomepageSettings(
        id=uuid.uuid4(),
        active_cities=["Jaipur", "Goa"],
        footer_tagline="Custom tagline",
        footer_columns=[{"title": "Custom", "links": [{"label": "Link", "href": "/x"}]}],
    )
    get_session, _ = _fake_session(execute_results=[_scalar_one(settings)])
    monkeypatch.setattr("public_api.handler.get_session", get_session)

    from public_api.handler import handler as api_handler

    resp = api_handler(_api_event("GET", "/site-chrome"), MagicMock())
    body = json.loads(resp["body"])
    assert body["cities"] == ["Jaipur", "Goa"]
    assert body["footer"]["tagline"] == "Custom tagline"
    assert body["footer"]["columns"][0]["title"] == "Custom"


def test_public_get_site_page_404(monkeypatch):
    get_session, _ = _fake_session(execute_results=[_scalar_one(None)])
    monkeypatch.setattr("public_api.handler.get_session", get_session)

    from public_api.handler import handler as api_handler

    resp = api_handler(_api_event("GET", "/site-pages/nope", path_params={"slug": "nope"}), MagicMock())
    assert resp["statusCode"] == 404


def test_public_get_site_page_found(monkeypatch):
    import datetime as dt

    page = SitePage(id=uuid.uuid4(), slug="about", title="About", body="Hello.", updated_at=dt.datetime.now(dt.timezone.utc))
    get_session, _ = _fake_session(execute_results=[_scalar_one(page)])
    monkeypatch.setattr("public_api.handler.get_session", get_session)

    from public_api.handler import handler as api_handler

    resp = api_handler(_api_event("GET", "/site-pages/about", path_params={"slug": "about"}), MagicMock())
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["title"] == "About"
    assert body["body"] == "Hello."
