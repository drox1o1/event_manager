"""Tests for public_api's new checkout/order/categories routes -- business
logic guards (event must be live, tier must exist and have capacity), not
persistence. common.db.get_session is mocked to a fake in-memory session,
same pattern as test_authenticated_api_events.py.
"""

import json
import uuid
from contextlib import contextmanager
from decimal import Decimal
from unittest.mock import MagicMock

from common.models import Category, Event, EventStatus, TicketTier


def _api_event(method, path, body=None, query=None):
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
        "requestContext": {"authorizer": {}},
    }


def _fake_session(get_return=None, execute_all=None):
    session = MagicMock()
    session.get.return_value = get_return
    if execute_all is not None:
        session.execute.return_value.scalars.return_value.all.return_value = execute_all

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
        status=EventStatus.LIVE,
    )
    defaults.update(overrides)
    return Event(**defaults)


def _fake_tier(**overrides):
    defaults = dict(
        id=uuid.uuid4(),
        event_id=uuid.uuid4(),
        name="General",
        price=Decimal("499.00"),
        quantity_total=100,
        quantity_sold=0,
    )
    defaults.update(overrides)
    return TicketTier(**defaults)


def _checkout_body(items):
    return {
        "buyer_name": "Aditi Rao",
        "buyer_email": "aditi@example.com",
        "buyer_phone": "9876543210",
        "items": items,
    }


def test_checkout_rejects_when_event_not_live(monkeypatch):
    fake_event = _fake_event(status=EventStatus.DRAFT)
    monkeypatch.setattr("public_api.handler.get_session", _fake_session(get_return=fake_event))

    from public_api.handler import handler as api_handler

    api_event = _api_event(
        "POST",
        f"/events/{fake_event.id}/checkout",
        body=_checkout_body([{"ticket_tier_id": str(uuid.uuid4()), "quantity": 1}]),
    )
    response = api_handler(api_event, MagicMock())
    assert response["statusCode"] == 404


def test_checkout_rejects_unknown_tier(monkeypatch):
    fake_event = _fake_event()
    monkeypatch.setattr(
        "public_api.handler.get_session", _fake_session(get_return=fake_event, execute_all=[])
    )

    from public_api.handler import handler as api_handler

    api_event = _api_event(
        "POST",
        f"/events/{fake_event.id}/checkout",
        body=_checkout_body([{"ticket_tier_id": str(uuid.uuid4()), "quantity": 1}]),
    )
    response = api_handler(api_event, MagicMock())
    assert response["statusCode"] == 400


def test_checkout_rejects_when_not_enough_capacity(monkeypatch):
    fake_event = _fake_event()
    tier = _fake_tier(quantity_total=5, quantity_sold=4)
    monkeypatch.setattr(
        "public_api.handler.get_session", _fake_session(get_return=fake_event, execute_all=[tier])
    )

    from public_api.handler import handler as api_handler

    api_event = _api_event(
        "POST",
        f"/events/{fake_event.id}/checkout",
        body=_checkout_body([{"ticket_tier_id": str(tier.id), "quantity": 2}]),
    )
    response = api_handler(api_event, MagicMock())
    assert response["statusCode"] == 409


def test_checkout_succeeds_and_increments_quantity_sold(monkeypatch):
    fake_event = _fake_event()
    tier = _fake_tier(quantity_total=100, quantity_sold=10)
    monkeypatch.setattr(
        "public_api.handler.get_session", _fake_session(get_return=fake_event, execute_all=[tier])
    )

    from public_api.handler import handler as api_handler

    api_event = _api_event(
        "POST",
        f"/events/{fake_event.id}/checkout",
        body=_checkout_body([{"ticket_tier_id": str(tier.id), "quantity": 2}]),
    )
    response = api_handler(api_event, MagicMock())
    assert response["statusCode"] == 201
    body = json.loads(response["body"])
    assert body["payment_status"] == "success"
    assert tier.quantity_sold == 12


def test_get_order_not_found(monkeypatch):
    monkeypatch.setattr("public_api.handler.get_session", _fake_session(get_return=None))

    from public_api.handler import handler as api_handler

    api_event = _api_event("GET", f"/orders/{uuid.uuid4()}")
    response = api_handler(api_event, MagicMock())
    assert response["statusCode"] == 404


def test_list_categories_returns_them_in_order(monkeypatch):
    categories = [
        Category(id=uuid.uuid4(), name="Music", sort_order=0),
        Category(id=uuid.uuid4(), name="Comedy", sort_order=1),
    ]
    monkeypatch.setattr("public_api.handler.get_session", _fake_session(execute_all=categories))

    from public_api.handler import handler as api_handler

    api_event = _api_event("GET", "/categories")
    response = api_handler(api_event, MagicMock())
    assert response["statusCode"] == 200
    body = json.loads(response["body"])
    assert [c["name"] for c in body["categories"]] == ["Music", "Comedy"]
