"""Tests for public_api registration-form handling: the checkout enforces
required fields and captures answers, and GET /events/{id}/form-fields is
gated to LIVE events. get_session is mocked to a fake in-memory session.
"""

import datetime as dt
import json
import uuid
from contextlib import contextmanager
from decimal import Decimal
from unittest.mock import MagicMock

from common.models import Event, EventFormField, EventStatus, FormFieldType, TicketTier


def _api_event(method, path, body=None):
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

    return _get_session, session


def _fake_event(form_fields=None, **overrides):
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
        status=EventStatus.LIVE,
    )
    defaults.update(overrides)
    event = Event(**defaults)
    if form_fields is not None:
        event.form_fields = form_fields
    return event


def _fake_tier(event_id, **overrides):
    defaults = dict(
        ticket_type="paid",
        sale_status="on_sale",
        min_per_order=1,
        max_per_order=10,
        requires_approval=False,
        id=uuid.uuid4(),
        event_id=event_id,
        name="General",
        price=Decimal("499.00"),
        quantity_total=100,
        quantity_sold=0,
    )
    defaults.update(overrides)
    return TicketTier(**defaults)


def _field(label, field_type, required, options=None):
    return EventFormField(
        id=uuid.uuid4(), event_id=uuid.uuid4(), label=label, field_type=field_type,
        options=options, required=required, sort_order=0,
    )


def _checkout_body(items, form_responses=None):
    body = {
        "buyer_name": "Aditi Rao",
        "buyer_email": "aditi@example.com",
        "buyer_phone": "9876543210",
        "items": items,
    }
    if form_responses is not None:
        body["form_responses"] = form_responses
    return body


def test_checkout_rejects_missing_required_field(monkeypatch):
    field = _field("Blood group", FormFieldType.SINGLE_CHOICE, required=True, options=["A+", "O+"])
    event = _fake_event(form_fields=[field])
    tier = _fake_tier(event.id)
    get_session, _ = _fake_session(get_return=event, execute_all=[tier])
    monkeypatch.setattr("public_api.handler.get_session", get_session)

    from public_api.handler import handler as api_handler

    api_event = _api_event(
        "POST",
        f"/events/{event.id}/checkout",
        body=_checkout_body([{"ticket_tier_id": str(tier.id), "quantity": 1}], form_responses=[]),
    )
    response = api_handler(api_event, MagicMock())
    assert response["statusCode"] == 400


def test_checkout_captures_form_responses(monkeypatch):
    field = _field("Blood group", FormFieldType.SINGLE_CHOICE, required=True, options=["A+", "O+"])
    event = _fake_event(form_fields=[field])
    tier = _fake_tier(event.id)
    get_session, session = _fake_session(get_return=event, execute_all=[tier])
    monkeypatch.setattr("public_api.handler.get_session", get_session)

    from common.models import OrderFormResponse

    from public_api.handler import handler as api_handler

    api_event = _api_event(
        "POST",
        f"/events/{event.id}/checkout",
        body=_checkout_body(
            [{"ticket_tier_id": str(tier.id), "quantity": 1}],
            form_responses=[{"field_id": str(field.id), "answer": "A+"}],
        ),
    )
    response = api_handler(api_event, MagicMock())
    assert response["statusCode"] == 201
    added = [c.args[0] for c in session.add.call_args_list]
    responses = [obj for obj in added if isinstance(obj, OrderFormResponse)]
    assert len(responses) == 1
    assert responses[0].field_label == "Blood group"
    assert responses[0].answer == "A+"


def test_checkout_rejects_unknown_field_id(monkeypatch):
    field = _field("Notes", FormFieldType.TEXT, required=False)
    event = _fake_event(form_fields=[field])
    tier = _fake_tier(event.id)
    get_session, _ = _fake_session(get_return=event, execute_all=[tier])
    monkeypatch.setattr("public_api.handler.get_session", get_session)

    from public_api.handler import handler as api_handler

    api_event = _api_event(
        "POST",
        f"/events/{event.id}/checkout",
        body=_checkout_body(
            [{"ticket_tier_id": str(tier.id), "quantity": 1}],
            form_responses=[{"field_id": str(uuid.uuid4()), "answer": "hi"}],
        ),
    )
    response = api_handler(api_event, MagicMock())
    assert response["statusCode"] == 400


def test_get_form_fields_404_when_not_live(monkeypatch):
    event = _fake_event(status=EventStatus.DRAFT)
    get_session, _ = _fake_session(get_return=event)
    monkeypatch.setattr("public_api.handler.get_session", get_session)

    from public_api.handler import handler as api_handler

    api_event = _api_event("GET", f"/events/{event.id}/form-fields")
    response = api_handler(api_event, MagicMock())
    assert response["statusCode"] == 404


def _aged_checkout(monkeypatch, dob: str | None, phone: str = "9876543210"):
    dob_field = _field("Date of birth", FormFieldType.DOB, required=True)
    phone_field = _field("Emergency contact", FormFieldType.PHONE, required=True)
    event = _fake_event(form_fields=[dob_field, phone_field], event_date=dt.date(2026, 11, 22))
    tier = _fake_tier(event.id, name="Full Marathon", min_age=18)
    get_session, session = _fake_session(get_return=event, execute_all=[tier])
    monkeypatch.setattr("public_api.handler.get_session", get_session)

    from public_api.handler import handler as api_handler

    responses = [{"field_id": str(phone_field.id), "answer": phone}]
    if dob is not None:
        responses.append({"field_id": str(dob_field.id), "answer": dob})
    body = _checkout_body([{
        "ticket_tier_id": str(tier.id), "quantity": 1,
        "attendees": [{"name": "Brijesh Kumar", "form_responses": responses}],
    }])
    return api_handler(_api_event("POST", f"/events/{event.id}/checkout", body=body), MagicMock()), session


def test_checkout_rejects_participant_under_min_age(monkeypatch):
    # Turns 18 on 23 Nov 2026 -- one day after the event, so still 17.
    response, _ = _aged_checkout(monkeypatch, dob="2008-11-23")
    assert response["statusCode"] == 400
    assert "minimum age" in json.loads(response["body"])["message"]


def test_checkout_accepts_participant_meeting_min_age_on_event_date(monkeypatch):
    response, _ = _aged_checkout(monkeypatch, dob="2008-11-22")
    assert response["statusCode"] == 201


def test_checkout_requires_dob_for_age_limited_ticket(monkeypatch):
    response, _ = _aged_checkout(monkeypatch, dob=None)
    assert response["statusCode"] == 400


def test_checkout_rejects_non_numeric_contact_number(monkeypatch):
    response, _ = _aged_checkout(monkeypatch, dob="1990-04-24", phone="98765-abc")
    assert response["statusCode"] == 400
    assert "10-digit mobile" in json.loads(response["body"])["message"]


def test_checkout_rejects_contact_number_not_10_digits(monkeypatch):
    for phone in ("987654321", "98765432101"):
        response, _ = _aged_checkout(monkeypatch, dob="1990-04-24", phone=phone)
        assert response["statusCode"] == 400, phone


def test_checkout_rejects_invalid_buyer_mobile(monkeypatch):
    event = _fake_event()
    get_session, _ = _fake_session(get_return=event, execute_all=[])
    monkeypatch.setattr("public_api.handler.get_session", get_session)
    from public_api.handler import handler as api_handler

    body = _checkout_body([])
    body["buyer_phone"] = "12345"
    body["items"] = [{"ticket_tier_id": str(event.id), "quantity": 1}]
    response = api_handler(_api_event("POST", f"/events/{event.id}/checkout", body=body), MagicMock())
    assert response["statusCode"] == 400
