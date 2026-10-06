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


def _session(event, tier=None, fields=(), held=()):
    session = MagicMock()
    session.get.side_effect = lambda model, key, *a, **k: tier if model is TicketTier else event
    session.execute.return_value.scalars.return_value.all.return_value = list(fields)
    # Seats held by in-flight payments, as [(tier_id, quantity)] -- read via
    # .all() rather than .scalars().all(), so it stubs independently of fields.
    session.execute.return_value.all.return_value = list(held)
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


def test_quantity_never_below_sold_plus_held():
    """Shrinking capacity below what in-flight payments are holding would
    guarantee an oversell when those payments confirm -- and the buyer would
    then have to be refunded for a ticket they thought they'd bought."""
    import events_service as svc

    event = _event()
    tier = _sold_tier(event)  # 5 sold
    session = _session(event, tier, held=[(tier.id, 4)])  # + 4 being paid for

    with pytest.raises(ConflictError, match="already sold or held"):
        svc.update_tier_impl(str(event.id), str(tier.id), _update(price="600", quantity_total=7), None, session)


def test_quantity_may_shrink_to_exactly_sold_plus_held():
    import events_service as svc

    event = _event()
    tier = _sold_tier(event)
    session = _session(event, tier, held=[(tier.id, 4)])

    out = svc.update_tier_impl(
        str(event.id), str(tier.id), _update(price="600", quantity_total=9), None, session
    )
    assert out["quantity_total"] == 9


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
