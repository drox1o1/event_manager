"""Cursor (keyset) pagination, shared by any list that can grow large enough
to blow Lambda's 6MB invoke-response cap.

`parse_pagination` in helpers.py -- page/page_size, OFFSET-based -- stays
right for the small, slow-changing lists it's already used on (admin's event
and organiser listings). This is for the other kind: a list read once in full
by a UI that filters client-side (an event's attendee list, say), which is
exactly the kind that silently grows past 6MB on a popular event and turns
into a 502 with no warning, because nothing before this enforced a bound.

Keyset over OFFSET for this case specifically because the underlying table
keeps growing while someone might be mid-page: OFFSET N skips or repeats rows
when rows are inserted between pages, where keyset pagination can't, since
each page is defined relative to the last row actually seen rather than a
row count.

The cursor is opaque to callers -- encode and decode it, never parse it by
hand. It round-trips through the client as a plain string.
"""

from __future__ import annotations

import base64
import json
import uuid
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from typing import Any

from sqlalchemy import and_, or_

DEFAULT_PAGE_SIZE = 100
MAX_PAGE_SIZE = 500


class InvalidCursorError(ValueError):
    """Raised for a cursor that doesn't decode, or that doesn't match the
    ordering it's being applied to. Callers typically surface this as a 400 --
    a stale or tampered cursor should look like a bad request, not a crash."""


def _jsonable(value: Any) -> Any:
    if isinstance(value, uuid.UUID):
        return str(value)
    if hasattr(value, "isoformat"):  # datetime.date / datetime.datetime
        return value.isoformat()
    return value


def encode_cursor(*values: Any) -> str:
    """An opaque cursor from one or more ordering-key values, most-significant
    first -- e.g. (created_at, id) for an ORDER BY created_at DESC, id DESC."""
    payload = json.dumps([_jsonable(v) for v in values], separators=(",", ":"))
    return base64.urlsafe_b64encode(payload.encode()).decode().rstrip("=")


def decode_cursor(cursor: str | None) -> list[Any] | None:
    """The raw JSON values back out of a cursor. None in, None out -- "no
    cursor" is the first-page case, not an error."""
    if not cursor:
        return None
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        decoded = json.loads(base64.urlsafe_b64decode(padded.encode()))
    except Exception as exc:
        raise InvalidCursorError("Invalid pagination cursor") from exc
    if not isinstance(decoded, list):
        raise InvalidCursorError("Invalid pagination cursor")
    return decoded


@dataclass(frozen=True)
class CursorField:
    """One column in a keyset ordering.

    `column` is the SQLAlchemy column used in ORDER BY and in the keyset WHERE
    clause. `extract` reads that same logical value back off a hydrated result
    row, for encoding the *next* cursor -- it's a function rather than always
    `column`'s attribute path because the query may select a different entity
    than the column belongs to (e.g. ordering Tickets by their parent Order's
    created_at). `parse` turns a decoded cursor value (plain JSON: str, int,
    None) back into the Python type `column` expects, since JSON has no
    datetime or UUID of its own.
    """

    column: Any
    extract: Callable[[Any], Any]
    parse: Callable[[Any], Any] = lambda v: v  # noqa: E731 -- trivial default, a def would be noisier


@dataclass
class Page:
    items: list
    next_cursor: str | None


def keyset_where(fields: Sequence[CursorField], cursor_values: Sequence[Any]):
    """`(c1 < v1) OR (c1 == v1 AND c2 < v2) OR ...`, matching an
    ORDER BY c1 DESC, c2 DESC, ... "give me everything strictly after the row
    this cursor points at" in that order.
    """
    if len(fields) != len(cursor_values):
        raise InvalidCursorError("Pagination cursor doesn't match this list's ordering")
    parsed = [f.parse(v) for f, v in zip(fields, cursor_values, strict=True)]
    clauses = []
    for i in range(len(fields)):
        equal_prefix = [fields[j].column == parsed[j] for j in range(i)]
        clauses.append(and_(*equal_prefix, fields[i].column < parsed[i]))
    return or_(*clauses)


def paginate(session, query, fields: Sequence[CursorField], *, cursor: str | None, limit: int) -> Page:
    """Apply keyset pagination to `query`.

    `query` must already carry `ORDER BY <fields columns> DESC` matching
    `fields` exactly, with the last field a unique tiebreaker -- the ordering
    is the caller's to get right; this only filters and encodes against it.

    Fetches `limit + 1` rows to learn whether another page exists without a
    separate COUNT query, which would otherwise scan the same rows twice.
    """
    limit = max(1, min(limit, MAX_PAGE_SIZE))
    decoded = decode_cursor(cursor)
    if decoded is not None:
        query = query.where(keyset_where(fields, decoded))

    rows = session.execute(query.limit(limit + 1)).scalars().all()
    has_more = len(rows) > limit
    page_rows = rows[:limit]

    next_cursor = None
    if has_more and page_rows:
        last = page_rows[-1]
        next_cursor = encode_cursor(*(f.extract(last) for f in fields))

    return Page(items=page_rows, next_cursor=next_cursor)
