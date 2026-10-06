"""Availability maths: total - confirmed sold - live holds.

These use a real in-memory SQLite session rather than a MagicMock, because the
thing worth testing is the SQL -- specifically that an expired hold stops
counting on its own, which is the whole reason there is no sweeper job.
"""

import datetime as dt
import uuid
from decimal import Decimal

import pytest
from common.models import (
    Base,
    Category,
    Event,
    EventStatus,
    Order,
    OrderItem,
    Organiser,
    PaymentStatus,
    TicketTier,
)
from sqlalchemy import create_engine
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session


@compiles(JSONB, "sqlite")
def _jsonb_as_sqlite_json(element, compiler, **kw):
    """Several models carry JSONB columns that create_all would choke on under
    SQLite. None of them are exercised here -- the aggregate under test is
    plain SQL -- so rendering them as JSON is enough to get a schema."""
    return "JSON"


@pytest.fixture
def session():
    """SQLite is enough here: no JSONB column is written, and the aggregate
    under test is plain SQL."""
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture
def event(session):
    organiser = Organiser(
        id=uuid.uuid4(), org_name="Run Club", contact_name="Ravi",
        email="ravi@example.com", phone="+919876543210", password_hash="x",
    )
    category = Category(id=uuid.uuid4(), name="Marathon")
    ev = Event(
        id=uuid.uuid4(), organiser_id=organiser.id, category_id=category.id,
        title="Jammu Marathon", description="Run",
        event_date=dt.date(2026, 11, 22), event_time=dt.time(5, 0),
        venue_name="Stadium", venue_address="Jammu", city="Jammu",
        capacity=100, status=EventStatus.LIVE,
    )
    session.add_all([organiser, category, ev])
    session.flush()
    return ev


def _tier(session, event, *, total=10, sold=0, name="Full Marathon"):
    tier = TicketTier(
        id=uuid.uuid4(), event_id=event.id, name=name, price=Decimal("600"),
        quantity_total=total, quantity_sold=sold,
    )
    session.add(tier)
    session.flush()
    return tier


def _order(session, event, tier, quantity, *, status, reserved_until=None):
    order = Order(
        id=uuid.uuid4(), event_id=event.id, buyer_name="Priya",
        buyer_email="priya@example.com", buyer_phone="+919876543210",
        subtotal=Decimal("600"), booking_fee=Decimal("0"), total_amount=Decimal("600"),
        payment_status=status, reserved_until=reserved_until,
    )
    session.add(order)
    session.flush()
    session.add(OrderItem(
        id=uuid.uuid4(), order_id=order.id, ticket_tier_id=tier.id,
        quantity=quantity, unit_price=Decimal("600"),
    ))
    session.flush()
    return order


def _future(minutes=10):
    return dt.datetime.now(dt.UTC) + dt.timedelta(minutes=minutes)


def _past(minutes=1):
    return dt.datetime.now(dt.UTC) - dt.timedelta(minutes=minutes)


# --- held_counts ---


def test_a_live_hold_counts(session, event):
    from common.inventory import held_counts

    tier = _tier(session, event)
    _order(session, event, tier, 3, status=PaymentStatus.PENDING, reserved_until=_future())

    assert held_counts(session, [tier.id]) == {tier.id: 3}


def test_an_expired_hold_stops_counting_on_its_own(session, event):
    """The absence of a sweeper depends entirely on this."""
    from common.inventory import held_counts

    tier = _tier(session, event)
    _order(session, event, tier, 3, status=PaymentStatus.PENDING, reserved_until=_past())

    assert held_counts(session, [tier.id]) == {}


@pytest.mark.parametrize(
    "status",
    [PaymentStatus.SUCCESS, PaymentStatus.FAILED, PaymentStatus.REFUNDED],
)
def test_only_pending_orders_hold_seats(session, event, status):
    """A settled order's units live in quantity_sold; a failed or refunded
    one holds nothing. Counting either here would double-count."""
    from common.inventory import held_counts

    tier = _tier(session, event)
    _order(session, event, tier, 3, status=status, reserved_until=_future())

    assert held_counts(session, [tier.id]) == {}


def test_a_pending_order_with_no_hold_timestamp_counts_nothing(session, event):
    """reserved_until NULL means no hold applies -- e.g. a free order that is
    briefly PENDING before settling inside the same request."""
    from common.inventory import held_counts

    tier = _tier(session, event)
    _order(session, event, tier, 3, status=PaymentStatus.PENDING, reserved_until=None)

    assert held_counts(session, [tier.id]) == {}


def test_holds_sum_across_orders_and_group_per_tier(session, event):
    from common.inventory import held_counts

    full = _tier(session, event, name="Full Marathon")
    half = _tier(session, event, name="Half Marathon")
    _order(session, event, full, 2, status=PaymentStatus.PENDING, reserved_until=_future())
    _order(session, event, full, 3, status=PaymentStatus.PENDING, reserved_until=_future())
    _order(session, event, half, 1, status=PaymentStatus.PENDING, reserved_until=_future())

    assert held_counts(session, [full.id, half.id]) == {full.id: 5, half.id: 1}


def test_exclude_order_id_leaves_out_that_orders_own_hold(session, event):
    """What lets an order re-check capacity for itself at settlement without
    competing against the seats it is already holding."""
    from common.inventory import held_counts

    tier = _tier(session, event)
    mine = _order(session, event, tier, 4, status=PaymentStatus.PENDING, reserved_until=_future())
    _order(session, event, tier, 2, status=PaymentStatus.PENDING, reserved_until=_future())

    assert held_counts(session, [tier.id]) == {tier.id: 6}
    assert held_counts(session, [tier.id], exclude_order_id=mine.id) == {tier.id: 2}


def test_no_tier_ids_asks_nothing(session):
    from common.inventory import held_counts

    assert held_counts(session, []) == {}
    assert held_counts(session, None) == {}


def test_one_query_regardless_of_tier_count(session, event):
    """A listing page resolves a whole page's holds at once; a per-tier loop
    here would be an N+1 on every public request."""
    from common.inventory import held_counts

    tiers = [_tier(session, event, name=f"Tier {i}") for i in range(5)]
    for tier in tiers:
        _order(session, event, tier, 1, status=PaymentStatus.PENDING, reserved_until=_future())

    statements = []
    original = session.execute
    session.execute = lambda stmt, *a, **kw: (statements.append(stmt), original(stmt, *a, **kw))[1]

    held_counts(session, [t.id for t in tiers])
    assert len(statements) == 1


# --- availability ---


def test_availability_subtracts_sold_and_held(session, event):
    from common.inventory import availability

    tier = _tier(session, event, total=10, sold=4)
    _order(session, event, tier, 3, status=PaymentStatus.PENDING, reserved_until=_future())

    assert availability(session, [tier]) == {tier.id: 3}


def test_availability_ignores_an_expired_hold(session, event):
    from common.inventory import availability

    tier = _tier(session, event, total=10, sold=4)
    _order(session, event, tier, 3, status=PaymentStatus.PENDING, reserved_until=_past())

    assert availability(session, [tier]) == {tier.id: 6}


def test_availability_floors_at_zero_when_a_tier_was_shrunk(session, event):
    """An admin may shrink quantity_total below what already sold; a negative
    count would otherwise have to be guarded at every call site."""
    from common.inventory import availability

    tier = _tier(session, event, total=3, sold=5)

    assert availability(session, [tier]) == {tier.id: 0}


def test_availability_honours_exclude_order_id(session, event):
    from common.inventory import availability

    tier = _tier(session, event, total=10, sold=0)
    mine = _order(session, event, tier, 4, status=PaymentStatus.PENDING, reserved_until=_future())

    assert availability(session, [tier]) == {tier.id: 6}
    assert availability(session, [tier], exclude_order_id=mine.id) == {tier.id: 10}


# --- committed_counts ---


def test_committed_counts_is_sold_plus_held(session, event):
    """The floor below which an organiser must not shrink capacity -- using
    quantity_sold alone would let them guarantee an oversell at settlement."""
    from common.inventory import committed_counts

    tier = _tier(session, event, total=10, sold=4)
    _order(session, event, tier, 3, status=PaymentStatus.PENDING, reserved_until=_future())

    assert committed_counts(session, [tier]) == {tier.id: 7}


def test_committed_counts_ignores_expired_holds(session, event):
    from common.inventory import committed_counts

    tier = _tier(session, event, total=10, sold=4)
    _order(session, event, tier, 3, status=PaymentStatus.PENDING, reserved_until=_past())

    assert committed_counts(session, [tier]) == {tier.id: 4}


# --- is_sold_out ---


def test_sold_out_when_every_tier_is_exhausted(session, event):
    from common.inventory import availability, is_sold_out

    full = _tier(session, event, total=5, sold=5, name="Full Marathon")
    half = _tier(session, event, total=5, sold=5, name="Half Marathon")

    assert is_sold_out([full, half], availability(session, [full, half])) is True


def test_held_out_tickets_read_as_sold_out(session, event):
    """Otherwise the event page invites a booking that checkout then rejects
    with a 409 -- the buyer fills in every participant first."""
    from common.inventory import availability, is_sold_out

    tier = _tier(session, event, total=5, sold=0)
    _order(session, event, tier, 5, status=PaymentStatus.PENDING, reserved_until=_future())

    assert is_sold_out([tier], availability(session, [tier])) is True


def test_not_sold_out_while_one_tier_has_stock(session, event):
    from common.inventory import availability, is_sold_out

    full = _tier(session, event, total=5, sold=5, name="Full Marathon")
    half = _tier(session, event, total=5, sold=1, name="Half Marathon")

    assert is_sold_out([full, half], availability(session, [full, half])) is False


def test_an_event_with_no_tiers_is_not_sold_out(session):
    """Matches the pre-existing _sold_out behaviour: nothing to sell is a
    draft-ish state, not a sellout."""
    from common.inventory import is_sold_out

    assert is_sold_out([], {}) is False
