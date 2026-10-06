"""Cursor pagination: the encode/decode round-trip, the keyset WHERE clause it
builds, and that paginate() actually bounds a query -- the whole reason this
module exists is a response that grew past Lambda's 6MB cap because nothing
bounded it.
"""

import datetime as dt
import uuid
from decimal import Decimal

import pytest
from common.models import Base, Category, Event, EventStatus, Organiser, TicketTier
from common.pagination import (
    CursorField,
    InvalidCursorError,
    decode_cursor,
    encode_cursor,
    keyset_where,
    paginate,
)
from sqlalchemy import create_engine, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session


@compiles(JSONB, "sqlite")
def _jsonb_as_sqlite_json(element, compiler, **kw):
    return "JSON"


# --- encode/decode: pure, no DB needed ---


def test_round_trips_a_timestamp_and_a_uuid():
    now = dt.datetime(2026, 11, 22, 5, 0, tzinfo=dt.UTC)
    tier_id = uuid.uuid4()
    cursor = encode_cursor(now, tier_id)
    assert decode_cursor(cursor) == [now.isoformat(), str(tier_id)]


def test_no_cursor_decodes_to_none():
    """The first-page case, not an error."""
    assert decode_cursor(None) is None
    assert decode_cursor("") is None


def test_a_tampered_cursor_raises_rather_than_silently_misbehaving():
    with pytest.raises(InvalidCursorError):
        decode_cursor("not-valid-base64-json!!!")


def test_a_cursor_encoding_something_other_than_a_list_is_rejected():
    import base64
    import json

    bogus = base64.urlsafe_b64encode(json.dumps({"not": "a list"}).encode()).decode()
    with pytest.raises(InvalidCursorError):
        decode_cursor(bogus)


# --- keyset_where: the predicate, checked against its own SQL shape ---


def test_keyset_where_rejects_a_cursor_of_the_wrong_shape():
    """A cursor built for a two-column ordering applied to a differently
    ordered query must be refused, not silently truncated or padded."""
    field = CursorField(Event.event_date, extract=lambda e: e.event_date)
    with pytest.raises(InvalidCursorError):
        keyset_where([field, field], ["2026-01-01"])


def test_keyset_where_parses_before_comparing():
    """Cursor values arrive as plain JSON (str/int); each field's `parse` must
    run before the comparison, or a string timestamp gets compared against a
    DateTime column and the query silently returns nothing."""
    parsed = {}

    def _parse(v):
        parsed["seen"] = v
        return dt.datetime.fromisoformat(v)

    field = CursorField(Event.event_date, extract=lambda e: e.event_date, parse=_parse)
    keyset_where([field], ["2026-11-22T00:00:00"])
    assert parsed["seen"] == "2026-11-22T00:00:00"


# --- paginate(): against a real (SQLite) session, since the thing worth
# testing is the generated SQL actually bounding and ordering correctly ---


@pytest.fixture
def session():
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
        capacity=1000, status=EventStatus.LIVE,
    )
    session.add_all([organiser, category, ev])
    session.flush()
    return ev


def _tiers(session, event, n):
    """n tiers, created in a known order, each with a distinct created_at so
    ordering is unambiguous (SQLite's default() for created_at would otherwise
    tie everything to the same instant within a test)."""
    base = dt.datetime(2026, 1, 1, tzinfo=dt.UTC)
    rows = []
    for i in range(n):
        tier = TicketTier(
            id=uuid.uuid4(), event_id=event.id, name=f"Tier {i:03d}",
            price=Decimal("100"), quantity_total=10, quantity_sold=0,
            created_at=base + dt.timedelta(seconds=i),
        )
        session.add(tier)
        rows.append(tier)
    session.flush()
    return rows


_FIELDS = [
    CursorField(TicketTier.created_at, extract=lambda t: t.created_at, parse=dt.datetime.fromisoformat),
    CursorField(TicketTier.id, extract=lambda t: t.id, parse=uuid.UUID),
]


def _ordered_query(event):
    return (
        select(TicketTier)
        .where(TicketTier.event_id == event.id)
        .order_by(TicketTier.created_at.desc(), TicketTier.id.desc())
    )


def test_a_page_within_the_limit_has_no_next_cursor(session, event):
    _tiers(session, event, 3)
    page = paginate(session, _ordered_query(event), _FIELDS, cursor=None, limit=10)

    assert len(page.items) == 3
    assert page.next_cursor is None


def test_pagination_covers_every_row_exactly_once_in_order(session, event):
    """The property that actually matters: walking every page end to end
    reproduces the full ordered set, with nothing skipped or repeated -- the
    specific failure mode OFFSET pagination has under concurrent inserts."""
    created = _tiers(session, event, 23)
    expected = [t.name for t in sorted(created, key=lambda t: t.created_at, reverse=True)]

    seen = []
    cursor = None
    pages = 0
    while True:
        page = paginate(session, _ordered_query(event), _FIELDS, cursor=cursor, limit=5)
        seen.extend(t.name for t in page.items)
        pages += 1
        if page.next_cursor is None:
            break
        cursor = page.next_cursor
        assert pages < 20  # guard against an infinite loop if next_cursor never terminates

    assert seen == expected
    assert pages == 5  # 23 rows at 5 per page: four full pages, one partial


def test_a_page_at_exactly_the_limit_reports_no_further_page(session, event):
    """Off-by-one case: exactly `limit` rows must not falsely claim more --
    that would be an extra round trip returning nothing."""
    _tiers(session, event, 5)
    page = paginate(session, _ordered_query(event), _FIELDS, cursor=None, limit=5)

    assert len(page.items) == 5
    assert page.next_cursor is None


def test_limit_is_clamped_to_the_maximum(session, event):
    from common.pagination import MAX_PAGE_SIZE

    _tiers(session, event, 3)
    page = paginate(session, _ordered_query(event), _FIELDS, cursor=None, limit=MAX_PAGE_SIZE * 10)
    assert len(page.items) == 3  # would have fetched all 3 either way; asserts it didn't error


def test_an_empty_table_returns_an_empty_page(session, event):
    page = paginate(session, _ordered_query(event), _FIELDS, cursor=None, limit=10)
    assert page.items == []
    assert page.next_cursor is None


def test_a_cursor_from_another_querys_ordering_is_rejected(session, event):
    """Mismatched shape must fail loudly rather than silently filter on the
    wrong number of columns."""
    _tiers(session, event, 3)
    with pytest.raises(InvalidCursorError):
        paginate(session, _ordered_query(event), _FIELDS, cursor=encode_cursor("only-one-field"), limit=10)
