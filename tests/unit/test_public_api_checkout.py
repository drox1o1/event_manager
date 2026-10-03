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
        # domainName/stage are what the PayU return URL is built from, so each
        # deployed stack points back at its own API with no extra config.
        "requestContext": {"authorizer": {}, "domainName": "api.test.example", "stage": "test"},
    }


def _assign_ids_on_flush(session):
    """Emulate the one thing a real flush does that checkout depends on.

    Primary keys come from a SQLAlchemy column default applied at INSERT, so
    without this every freshly-added row keeps id=None -- and the PayU handoff
    legitimately needs the order's id before the transaction closes.
    """

    def _flush():
        for call in session.add.call_args_list:
            added = call.args[0]
            if getattr(added, "id", None) is None:
                added.id = uuid.uuid4()

    session.flush.side_effect = _flush


def _fake_session(get_return=None, execute_all=None, held=None, live_holds=0):
    session = MagicMock()
    session.get.return_value = get_return
    if execute_all is not None:
        session.execute.return_value.scalars.return_value.all.return_value = execute_all
    # Checkout reads two aggregates besides the tier rows, each via a distinct
    # result method so they can be stubbed independently:
    #   .all()        -> [(tier_id, held_quantity)], seats held by in-flight payments
    #   .scalar_one() -> how many live holds this buyer already has
    session.execute.return_value.all.return_value = held or []
    session.execute.return_value.scalar_one.return_value = live_holds
    _assign_ids_on_flush(session)

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
        ticket_type="paid",
        sale_status="on_sale",
        min_per_order=1,
        max_per_order=10,
        requires_approval=False,
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


def test_checkout_rejects_when_other_buyers_hold_the_remaining_tickets(monkeypatch):
    """Stock that is merely held must block a booking as firmly as stock that
    has sold -- otherwise two buyers pay for the same last seat."""
    fake_event = _fake_event()
    tier = _fake_tier(quantity_total=5, quantity_sold=0)
    monkeypatch.setattr(
        "public_api.handler.get_session",
        _fake_session(get_return=fake_event, execute_all=[tier], held=[(tier.id, 5)]),
    )

    from public_api.handler import handler as api_handler

    api_event = _api_event(
        "POST",
        f"/events/{fake_event.id}/checkout",
        body=_checkout_body([{"ticket_tier_id": str(tier.id), "quantity": 1}]),
    )
    response = api_handler(api_event, MagicMock())
    assert response["statusCode"] == 409
    assert "Not enough" in json.loads(response["body"])["message"]


def test_checkout_rejects_a_buyer_already_holding_several_orders(monkeypatch):
    """This route is unauthenticated and reserves real stock, so without a cap
    one script could hold an event's inventory indefinitely for free."""
    fake_event = _fake_event()
    tier = _fake_tier(quantity_total=100, quantity_sold=0)
    monkeypatch.setattr(
        "public_api.handler.get_session",
        _fake_session(get_return=fake_event, execute_all=[tier], live_holds=3),
    )

    from public_api.handler import handler as api_handler

    api_event = _api_event(
        "POST",
        f"/events/{fake_event.id}/checkout",
        body=_checkout_body([{"ticket_tier_id": str(tier.id), "quantity": 1}]),
    )
    response = api_handler(api_event, MagicMock())
    assert response["statusCode"] == 409
    assert "already have tickets held" in json.loads(response["body"])["message"]


def test_paid_checkout_reserves_without_selling_and_returns_a_payu_form(monkeypatch, mock_payu_secret):
    """The central behaviour change: nothing is sold here. quantity_sold stays
    put, no tickets exist yet, and the response hands the browser off to PayU."""
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
    assert body["payment_status"] == "pending"
    assert body["payment_required"] is True
    assert body["amount"] == "998.00"  # server-authoritative, 2 x 499
    assert body["booking_fee"] == "0.00"
    assert tier.quantity_sold == 10  # unchanged until the money confirms

    fields = body["payu"]["fields"]
    assert body["payu"]["action"] == "https://test.payu.in/_payment"
    assert fields["amount"] == "998.00"  # the hashed string and the form agree
    assert fields["hash"] and len(fields["hash"]) == 128
    assert fields["phone"] == "9876543210"  # PayU wants bare digits, not +91
    assert fields["udf1"] == body["order_id"]
    assert fields["surl"] == fields["furl"]
    assert fields["surl"].endswith("/payments/payu/return")


def test_a_free_checkout_skips_payu_entirely(monkeypatch):
    """PayU can't process a zero-amount transaction, and there is nothing to
    wait for, so a free booking settles in-request exactly as it always did."""
    fake_event = _fake_event()
    tier = _fake_tier(quantity_total=100, quantity_sold=10, ticket_type="free", price=Decimal("0"))
    monkeypatch.setattr(
        "public_api.handler.get_session", _fake_session(get_return=fake_event, execute_all=[tier])
    )
    settled = {}

    def _record(session, order):
        from common.settlement import SETTLED, SettlementResult

        settled["order"] = order
        return SettlementResult(SETTLED, order.id)

    monkeypatch.setattr("public_api.handler.settle_free_order", _record)

    from public_api.handler import handler as api_handler

    api_event = _api_event(
        "POST",
        f"/events/{fake_event.id}/checkout",
        body=_checkout_body([{"ticket_tier_id": str(tier.id), "quantity": 2}]),
    )
    response = api_handler(api_event, MagicMock())

    assert response["statusCode"] == 201
    body = json.loads(response["body"])
    assert body["payment_required"] is False
    assert body["payu"] is None
    assert body["amount"] == "0.00"
    assert settled["order"].pending_items is not None
    # No hold is taken: there is no window in which to abandon the payment.
    assert settled["order"].reserved_until is None


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


def _order_with_event():
    from common.models import AdminUser, Order, Organiser, PaymentStatus

    event = _fake_event()
    event.organiser = Organiser(id=event.organiser_id, org_name="Racetik", contact_name="R", email="host@racetik.in", password_hash="x")
    order = Order(
        id=uuid.uuid4(), event_id=event.id, buyer_name="Aditi", buyer_email="aditi@example.com", buyer_phone="+919876543210",
        subtotal=Decimal("0"), total_amount=Decimal("0"), payment_status=PaymentStatus.SUCCESS,
    )
    order.event = event
    admins = [AdminUser(id=uuid.uuid4(), email="ops@showtik.in", password_hash="x")]
    return order, admins


def test_raise_query_saves_and_emails_admin_and_organiser(monkeypatch):
    order, admins = _order_with_event()
    monkeypatch.setattr("public_api.handler.get_session", _fake_session(get_return=order, execute_all=admins))
    sent = []
    monkeypatch.setattr("public_api.handler.publish_to_ses", lambda msg: sent.append(msg))

    from public_api.handler import handler as api_handler

    body = {"category": "payment", "message": "I was charged twice for this order."}
    response = api_handler(_api_event("POST", f"/orders/{order.id}/query", body=body), MagicMock())

    assert response["statusCode"] == 201
    assert json.loads(response["body"])["status"] == "open"
    assert {m["to"] for m in sent} == {"ops@showtik.in", "host@racetik.in"}
    assert all(m["type"] == "transaction_query" and m["category"] == "Payment issue" for m in sent)


def test_raise_query_rejects_unknown_category(monkeypatch):
    order, admins = _order_with_event()
    monkeypatch.setattr("public_api.handler.get_session", _fake_session(get_return=order, execute_all=admins))

    from public_api.handler import handler as api_handler

    body = {"category": "refund-now", "message": "Please refund me."}
    response = api_handler(_api_event("POST", f"/orders/{order.id}/query", body=body), MagicMock())
    assert response["statusCode"] == 400
