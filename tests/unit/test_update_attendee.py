"""update_attendee_impl: organiser/admin correcting an issued ticket's
participant details (name/email/phone/form answers) after the fact. Doesn't
touch payment, tier or order -- only the Ticket row's own attendee_* columns.
"""

import datetime as dt
import uuid
from contextlib import contextmanager
from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from common.helpers import BadRequestError, NotFoundError
from common.models import (
    Event,
    EventFormField,
    EventStatus,
    FormFieldType,
    Order,
    OrderItem,
    PaymentStatus,
    Ticket,
    TicketTier,
)
from common.schemas import AttendeeUpdateRequest, FormResponseInput


def _ticket(event_id, *, name="Priya") -> Ticket:
    tier = TicketTier(id=uuid.uuid4(), event_id=event_id, name="Full Marathon", price=Decimal("600"), quantity_total=10, quantity_sold=1)
    order = Order(
        id=uuid.uuid4(), event_id=event_id, buyer_name="Buyer Name", buyer_email="buyer@example.com",
        buyer_phone="+919876543210", subtotal=Decimal("600"), booking_fee=Decimal("0"),
        total_amount=Decimal("600"), payment_status=PaymentStatus.SUCCESS,
        created_at=dt.datetime(2026, 1, 1, tzinfo=dt.UTC),
    )
    item = OrderItem(id=uuid.uuid4(), order_id=order.id, ticket_tier_id=tier.id, quantity=1, unit_price=tier.price)
    item.order = order
    item.ticket_tier = tier
    ticket = Ticket(id=uuid.uuid4(), order_item_id=item.id, qr_code_token=uuid.uuid4().hex, attendee_name=name, approval_status="approved")
    ticket.order_item = item
    return ticket


def _fake_session(event, ticket, fields=()):
    session = MagicMock()

    def _get(model, pk, **kw):
        if model is Event:
            return event
        if model is Ticket:
            return ticket
        raise AssertionError(f"unexpected session.get({model})")

    session.get.side_effect = _get
    session.execute.return_value.scalars.return_value.all.return_value = list(fields)

    @contextmanager
    def _get_session():
        yield session

    return _get_session


def _event(event_id) -> Event:
    return Event(
        id=event_id, organiser_id=uuid.uuid4(), category_id=uuid.uuid4(), title="Jammu Marathon",
        description="x", event_date=dt.date(2026, 11, 22), event_time=dt.time(5, 0),
        venue_name="Stadium", venue_address="Jammu", city="Jammu", capacity=1000, status=EventStatus.LIVE,
    )


def test_update_attendee_overwrites_name_email_phone(monkeypatch):
    import events_service as svc

    event_id = uuid.uuid4()
    event = _event(event_id)
    ticket = _ticket(event_id)
    monkeypatch.setattr("events_service.get_session", _fake_session(event, ticket))

    body = AttendeeUpdateRequest(name="Priya Corrected", email="priya@example.com", phone="9876543210")
    result = svc.update_attendee_impl(str(event_id), str(ticket.id), body, None)

    assert ticket.attendee_name == "Priya Corrected"
    assert ticket.attendee_email == "priya@example.com"
    assert ticket.attendee_phone == "+919876543210"
    assert result["attendee_name"] == "Priya Corrected"
    assert result["ticket_id"] == str(ticket.id)


def test_update_attendee_requires_required_form_fields(monkeypatch):
    import events_service as svc

    event_id = uuid.uuid4()
    event = _event(event_id)
    ticket = _ticket(event_id)
    field = EventFormField(id=uuid.uuid4(), event_id=event_id, label="T-shirt size", field_type=FormFieldType.TEXT, required=True, sort_order=0)
    monkeypatch.setattr("events_service.get_session", _fake_session(event, ticket, [field]))

    body = AttendeeUpdateRequest(name="Priya", form_responses=[])

    with pytest.raises(BadRequestError):
        svc.update_attendee_impl(str(event_id), str(ticket.id), body, None)


def test_update_attendee_validates_choice_and_phone_and_date_fields(monkeypatch):
    import events_service as svc

    event_id = uuid.uuid4()
    event = _event(event_id)
    ticket = _ticket(event_id)
    choice_field = EventFormField(
        id=uuid.uuid4(), event_id=event_id, label="Category", field_type=FormFieldType.SINGLE_CHOICE,
        required=True, options=["5K", "10K"], sort_order=0,
    )
    phone_field = EventFormField(id=uuid.uuid4(), event_id=event_id, label="Emergency contact", field_type=FormFieldType.PHONE, required=False, sort_order=1)
    dob_field = EventFormField(id=uuid.uuid4(), event_id=event_id, label="DOB", field_type=FormFieldType.DOB, required=False, sort_order=2)
    monkeypatch.setattr("events_service.get_session", _fake_session(event, ticket, [choice_field, phone_field, dob_field]))

    body = AttendeeUpdateRequest(
        name="Priya",
        form_responses=[
            FormResponseInput(field_id=choice_field.id, answer="10K"),
            FormResponseInput(field_id=phone_field.id, answer="9876543210"),
            FormResponseInput(field_id=dob_field.id, answer="2000-01-15"),
        ],
    )

    result = svc.update_attendee_impl(str(event_id), str(ticket.id), body, None)

    answers = {a["field_label"]: a["answer"] for a in result["attendee_answers"]}
    assert answers["Category"] == "10K"
    assert answers["Emergency contact"] == "+919876543210"
    assert answers["DOB"] == "2000-01-15"


def test_update_attendee_rejects_an_invalid_choice(monkeypatch):
    import events_service as svc

    event_id = uuid.uuid4()
    event = _event(event_id)
    ticket = _ticket(event_id)
    choice_field = EventFormField(
        id=uuid.uuid4(), event_id=event_id, label="Category", field_type=FormFieldType.SINGLE_CHOICE,
        required=False, options=["5K", "10K"], sort_order=0,
    )
    monkeypatch.setattr("events_service.get_session", _fake_session(event, ticket, [choice_field]))

    body = AttendeeUpdateRequest(name="Priya", form_responses=[FormResponseInput(field_id=choice_field.id, answer="Marathon")])

    with pytest.raises(BadRequestError):
        svc.update_attendee_impl(str(event_id), str(ticket.id), body, None)


def test_update_attendee_404s_on_a_ticket_from_another_event(monkeypatch):
    import events_service as svc

    event_id = uuid.uuid4()
    other_event_id = uuid.uuid4()
    event = _event(event_id)
    ticket = _ticket(other_event_id)
    monkeypatch.setattr("events_service.get_session", _fake_session(event, ticket))

    body = AttendeeUpdateRequest(name="Priya")

    with pytest.raises(NotFoundError):
        svc.update_attendee_impl(str(event_id), str(ticket.id), body, None)


# --- both routes wire the PATCH through ---


def _api_event(path, body):
    import json

    return {
        "httpMethod": "PATCH", "path": path, "resource": path,
        "headers": {"Content-Type": "application/json"}, "multiValueHeaders": {},
        "queryStringParameters": None, "multiValueQueryStringParameters": None, "pathParameters": None,
        "body": json.dumps(body), "isBase64Encoded": False,
        "requestContext": {"authorizer": {"organiser_id": None}},
    }


def test_organiser_route_passes_the_body_through(monkeypatch):
    captured = {}
    monkeypatch.setattr(
        "organiser_routes.svc.update_attendee_impl",
        lambda event_id, ticket_id, body, organiser_id: captured.update(event_id=event_id, ticket_id=ticket_id, body=body) or {"ok": True},
    )
    monkeypatch.setattr("organiser_routes.require_organiser_id", lambda: uuid.uuid4())

    from organiser_routes import app

    resp = app.resolve(_api_event("/organiser/events/abc/attendees/tkt1", {"name": "New Name"}), MagicMock())

    assert captured["event_id"] == "abc"
    assert captured["ticket_id"] == "tkt1"
    assert captured["body"].name == "New Name"
    assert resp["statusCode"] == 200


def test_admin_route_passes_the_body_through(monkeypatch):
    captured = {}
    monkeypatch.setattr(
        "admin_routes.svc.update_attendee_impl",
        lambda event_id, ticket_id, body, organiser_id: captured.update(event_id=event_id, ticket_id=ticket_id, organiser_id=organiser_id) or {"ok": True},
    )
    monkeypatch.setattr("admin_routes.require_admin_id", lambda: uuid.uuid4())

    from admin_routes import app

    resp = app.resolve(_api_event("/admin/events/abc/attendees/tkt1", {"name": "New Name"}), MagicMock())

    assert captured["event_id"] == "abc"
    assert captured["ticket_id"] == "tkt1"
    assert captured["organiser_id"] is None
    assert resp["statusCode"] == 200
