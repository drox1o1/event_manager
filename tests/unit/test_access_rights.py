"""Who may edit what: organisers are locked out of events the super admin
unpublished, and only the super admin may change a ticket type's price after
sales. Form saves keep existing field ids so past answers stay linked."""

import uuid
from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from common.helpers import ConflictError
from common.models import Event, EventFormField, EventStatus, FormFieldType, TicketTier
from common.schemas import FormFieldsReplaceRequest, TicketTierUpdate


def _event(status=EventStatus.LIVE):
    return Event(id=uuid.uuid4(), organiser_id=uuid.uuid4(), title="Run", status=status)


def _session(event, tier=None, fields=()):
    session = MagicMock()
    session.get.side_effect = lambda model, key, *a, **k: tier if model is TicketTier else event
    session.execute.return_value.scalars.return_value.all.return_value = list(fields)
    return session


def _sold_tier(event):
    return TicketTier(
        id=uuid.uuid4(), event_id=event.id, name="Full Marathon", price=Decimal("600"), ticket_type="paid",
        quantity_total=100, quantity_sold=5,
    )


def _update(**overrides):
    body = dict(name="Full Marathon", price="800", ticket_type="paid", quantity_total=100)
    body.update(overrides)
    return TicketTierUpdate(**body)


def test_organiser_cannot_change_price_after_sales():
    import events_service as svc

    event = _event()
    tier = _sold_tier(event)
    with pytest.raises(ConflictError):
        svc.update_tier_impl(str(event.id), str(tier.id), _update(), event.organiser_id, _session(event, tier))


def test_admin_can_change_price_after_sales():
    import events_service as svc

    event = _event()
    tier = _sold_tier(event)
    out = svc.update_tier_impl(str(event.id), str(tier.id), _update(), None, _session(event, tier))
    assert out["price"] == "800.00" or Decimal(out["price"]) == Decimal("800")


def test_quantity_never_below_sold_even_for_admin():
    import events_service as svc

    event = _event()
    tier = _sold_tier(event)
    with pytest.raises(ConflictError):
        svc.update_tier_impl(str(event.id), str(tier.id), _update(price="600", quantity_total=3), None, _session(event, tier))


def test_organiser_locked_out_of_unpublished_event_form():
    import events_service as svc

    event = _event(EventStatus.DEACTIVATED)
    body = FormFieldsReplaceRequest(fields=[{"label": "T-shirt", "field_type": "text"}])
    with pytest.raises(ConflictError):
        svc.replace_form_fields_impl(str(event.id), body, event.organiser_id, _session(event))


def test_form_save_keeps_existing_field_ids_and_drops_removed_fields():
    import events_service as svc

    event = _event()
    keep = EventFormField(id=uuid.uuid4(), event_id=event.id, label="Tshirt", field_type=FormFieldType.TEXT, required=False, sort_order=0)
    drop = EventFormField(id=uuid.uuid4(), event_id=event.id, label="Old", field_type=FormFieldType.TEXT, required=False, sort_order=1)
    session = _session(event, fields=[keep, drop])
    body = FormFieldsReplaceRequest(fields=[
        {"id": str(keep.id), "label": "T-shirt size", "field_type": "single_choice", "options": ["S", "M"], "required": True},
        {"label": "Blood group", "field_type": "text"},
    ])

    out = svc.replace_form_fields_impl(str(event.id), body, event.organiser_id, session)

    assert out["fields"][0]["id"] == str(keep.id)
    assert keep.label == "T-shirt size" and keep.required is True
    session.delete.assert_called_once_with(drop)
    added = [c.args[0] for c in session.add.call_args_list]
    assert len(added) == 1 and added[0].label == "Blood group"
