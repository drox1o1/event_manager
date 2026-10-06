"""_tier_summary: serialising a real TicketTier for the public event-detail
response. This went to prod broken -- model_validate(tier, update={...}) isn't
a real pydantic v2 call, model_validate has no `update` kwarg -- and nothing
caught it, because every other test exercising this path mocked the session
down to raw dicts rather than constructing a real ORM TicketTier and letting
pydantic's actual validation run. A MagicMock swallows any keyword silently;
only a real object and a real BaseModel surface this class of bug.
"""

import uuid
from decimal import Decimal

from common.models import TicketTier


def _tier(**overrides):
    """A tier shaped like a row actually loaded from Postgres -- column
    defaults (ticket_type, sale_status, etc.) only apply at INSERT, so a
    bare TicketTier(...) built in Python leaves them None unless set here."""
    defaults = dict(
        id=uuid.uuid4(), event_id=uuid.uuid4(), name="Full Marathon",
        price=Decimal("600.00"), quantity_total=100, quantity_sold=40,
        ticket_type="paid", min_per_order=1, max_per_order=10,
        requires_approval=False, sale_status="on_sale", sort_order=0,
    )
    defaults.update(overrides)
    return TicketTier(**defaults)


def test_tier_summary_builds_a_real_model_without_erroring():
    from public_api.handler import _tier_summary

    tier = _tier()
    summary = _tier_summary(tier, available={tier.id: 55})

    assert summary.quantity_available == 55
    assert summary.quantity_sold == 40  # confirmed sold, untouched by holds
    assert summary.quantity_held == 5  # 100 total - 40 sold - 55 available


def test_tier_summary_copies_every_base_field_through(monkeypatch):
    """The model_copy() rewrite must not drop fields model_validate() would
    have set -- a narrower bug than the crash, but the same call site."""
    from public_api.handler import _tier_summary

    tier = _tier(ticket_type="donation", description="Supports the club", min_age=18, requires_approval=True)
    summary = _tier_summary(tier, available={tier.id: 10})

    assert summary.id == tier.id
    assert summary.name == "Full Marathon"
    assert summary.price == Decimal("600.00")
    assert summary.ticket_type == "donation"
    assert summary.description == "Supports the club"
    assert summary.min_age == 18
    assert summary.requires_approval is True


def test_tier_summary_defaults_to_zero_availability_for_an_untracked_tier():
    """A tier id absent from the availability map (shouldn't happen in
    practice, but availability() can return a partial map) must not crash."""
    from public_api.handler import _tier_summary

    tier = _tier(quantity_total=10, quantity_sold=10)
    summary = _tier_summary(tier, available={})

    assert summary.quantity_available == 0
    assert summary.quantity_held == 0  # floors at 0, doesn't go negative


def test_tier_summary_serialises_to_json_cleanly():
    """The actual failure mode in prod was this function being called inside
    a route and blowing up before a response could be built at all."""
    from public_api.handler import _tier_summary

    tier = _tier()
    summary = _tier_summary(tier, available={tier.id: 55})
    dumped = summary.model_dump(mode="json")

    assert dumped["quantity_available"] == 55
    assert dumped["id"] == str(tier.id)
