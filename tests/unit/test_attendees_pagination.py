"""attendees_impl: the live incident this guards against is a popular event's
registration list exceeding Lambda's 6MB response cap and failing as an opaque
502 with no pagination to fall back on. These check that a page is bounded,
that walking cursors reaches every ticket, and that both the organiser and
admin routes hand their query params through -- there was previously no direct
test of this path at all (only of the CSV/Excel export).
"""

import datetime as dt
import uuid
from contextlib import contextmanager
from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from common.helpers import BadRequestError
from common.models import Event, EventStatus, Order, OrderItem, PaymentStatus, Ticket, TicketTier
from common.pagination import encode_cursor


def _fake_session(execute_all):
    session = MagicMock()
    session.execute.return_value.scalars.return_value.all.return_value = execute_all
    # attendees_impl loads the event first via session.get -- not relevant to
    # pagination, so any non-None event (and no organiser scoping) passes.
    session.get.return_value = Event(
        id=uuid.uuid4(), organiser_id=uuid.uuid4(), category_id=uuid.uuid4(), title="Jammu Marathon",
        description="x", event_date=dt.date(2026, 11, 22), event_time=dt.time(5, 0),
        venue_name="Stadium", venue_address="Jammu", city="Jammu", capacity=1000, status=EventStatus.LIVE,
    )

    @contextmanager
    def _get_session():
        yield session

    return _get_session


def _ticket(event_id, *, created_at, name) -> Ticket:
    """A fully wired Ticket -- order_item.order and order_item.ticket_tier set
    by hand, the way a real selectinload would leave them, so attendees_impl's
    dict-building can walk the relationship without touching a database."""
    tier = TicketTier(id=uuid.uuid4(), event_id=event_id, name="Full Marathon", price=Decimal("600"), quantity_total=10, quantity_sold=1)
    order = Order(
        id=uuid.uuid4(), event_id=event_id, buyer_name=name, buyer_email=f"{name}@example.com",
        buyer_phone="+919876543210", subtotal=Decimal("600"), booking_fee=Decimal("0"),
        total_amount=Decimal("600"), payment_status=PaymentStatus.SUCCESS, created_at=created_at,
    )
    item = OrderItem(id=uuid.uuid4(), order_id=order.id, ticket_tier_id=tier.id, quantity=1, unit_price=tier.price)
    item.order = order
    item.ticket_tier = tier
    ticket = Ticket(id=uuid.uuid4(), order_item_id=item.id, qr_code_token=uuid.uuid4().hex, attendee_name=name, approval_status="approved")
    ticket.order_item = item
    return ticket


def test_a_page_within_the_limit_has_no_next_cursor(monkeypatch):
    import events_service as svc

    event_id = uuid.uuid4()
    tickets = [_ticket(event_id, created_at=dt.datetime(2026, 1, 1, tzinfo=dt.UTC), name="Only One")]
    monkeypatch.setattr("events_service.get_session", _fake_session(tickets))

    result = svc.attendees_impl(str(event_id), None, limit=5)

    assert [a["attendee_name"] for a in result["attendees"]] == ["Only One"]
    assert result["next_cursor"] is None


def test_a_fuller_page_reports_a_next_cursor_matching_the_last_row(monkeypatch):
    """paginate() fetches limit+1 to detect another page -- the mock session
    stands in for that by returning one row more than the requested limit, and
    the cursor it hands back must point at the last row actually *returned*,
    not the extra lookahead one."""
    import events_service as svc

    event_id = uuid.uuid4()
    t1 = _ticket(event_id, created_at=dt.datetime(2026, 1, 2, tzinfo=dt.UTC), name="Newest")
    t2 = _ticket(event_id, created_at=dt.datetime(2026, 1, 1, tzinfo=dt.UTC), name="Oldest Shown")
    lookahead = _ticket(event_id, created_at=dt.datetime(2025, 12, 31, tzinfo=dt.UTC), name="Next Page")
    monkeypatch.setattr("events_service.get_session", _fake_session([t1, t2, lookahead]))

    result = svc.attendees_impl(str(event_id), None, limit=2)

    assert [a["attendee_name"] for a in result["attendees"]] == ["Newest", "Oldest Shown"]
    assert result["next_cursor"] == encode_cursor(t2.order_item.order.created_at, t2.id)


def test_the_dict_shape_matches_what_the_organiser_portal_reads(monkeypatch):
    import events_service as svc

    event_id = uuid.uuid4()
    ticket = _ticket(event_id, created_at=dt.datetime(2026, 1, 1, tzinfo=dt.UTC), name="Priya")
    monkeypatch.setattr("events_service.get_session", _fake_session([ticket]))

    attendee = svc.attendees_impl(str(event_id), None, limit=10)["attendees"][0]

    assert attendee["ticket_id"] == str(ticket.id)
    assert attendee["order_id"] == str(ticket.order_item.order.id)
    assert attendee["buyer_email"] == "Priya@example.com"
    assert attendee["ticket_tier"] == "Full Marathon"
    assert attendee["approval_status"] == "approved"
    assert attendee["purchased_at"] == ticket.order_item.order.created_at.isoformat()


def test_a_garbage_client_supplied_cursor_is_a_400_not_a_500(monkeypatch):
    """A stale or tampered cursor must look like a bad request, not crash the
    route -- organiser-portal pages can sit open for a while."""
    import events_service as svc

    event_id = uuid.uuid4()
    monkeypatch.setattr("events_service.get_session", _fake_session([]))

    with pytest.raises(BadRequestError):
        svc.attendees_impl(str(event_id), None, cursor="not a real cursor")


# --- parse_limit: turns a query-string value into an int the route can trust ---


def test_parse_limit_defaults_when_absent():
    import events_service as svc

    assert svc.parse_limit(None) == svc.DEFAULT_PAGE_SIZE
    assert svc.parse_limit("") == svc.DEFAULT_PAGE_SIZE


def test_parse_limit_accepts_a_valid_integer():
    import events_service as svc

    assert svc.parse_limit("25") == 25


def test_parse_limit_rejects_a_non_integer():
    import events_service as svc

    with pytest.raises(BadRequestError):
        svc.parse_limit("twenty")


# --- both routes pass cursor/limit through ---


def _api_event(path, query=None):
    return {
        "httpMethod": "GET", "path": path, "resource": path,
        "headers": {}, "multiValueHeaders": {}, "queryStringParameters": query,
        "multiValueQueryStringParameters": None, "pathParameters": None,
        "body": None, "isBase64Encoded": False, "requestContext": {"authorizer": {"organiser_id": None}},
    }


def test_organiser_route_passes_cursor_and_limit_through(monkeypatch):
    captured = {}
    monkeypatch.setattr("organiser_routes.svc.attendees_impl", lambda *a, **kw: captured.update(kw) or {"attendees": [], "next_cursor": None})
    monkeypatch.setattr("organiser_routes.require_organiser_id", lambda: uuid.uuid4())

    from organiser_routes import app

    app.resolve(
        _api_event("/organiser/events/abc/attendees", query={"cursor": "xyz", "limit": "10"}),
        MagicMock(),
    )

    assert captured == {"cursor": "xyz", "limit": 10}


def test_admin_route_passes_cursor_and_limit_through(monkeypatch):
    captured = {}
    monkeypatch.setattr("admin_routes.svc.attendees_impl", lambda *a, **kw: captured.update(kw) or {"attendees": [], "next_cursor": None})
    monkeypatch.setattr("admin_routes.require_admin_id", lambda: uuid.uuid4())

    from admin_routes import app

    app.resolve(
        _api_event("/admin/events/abc/attendees", query={"cursor": "xyz"}),
        MagicMock(),
    )

    import events_service as svc

    assert captured == {"cursor": "xyz", "limit": svc.DEFAULT_PAGE_SIZE}
