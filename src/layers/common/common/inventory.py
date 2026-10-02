"""Ticket availability once orders can exist before their money does.

`TicketTier.quantity_sold` keeps meaning exactly what it always did:
**confirmed sold**, incremented only when a payment settles. What's new is the
middle state -- a PENDING order holding seats while its buyer is away on PayU's
page -- and that is never stored as a counter. It is computed:

    available = quantity_total - quantity_sold - held

where `held` counts order items belonging to PENDING orders whose
`reserved_until` hasn't passed. An abandoned checkout therefore releases its
seats by simply ageing out; there is no sweeper job, and nothing has to run on
a schedule for inventory to be correct.

Two rules for callers, both load-bearing:

1. **Writers lock the tier rows first, then count.** A `FOR UPDATE` on
   ticket_tiers does *not* stop another transaction inserting a pending
   OrderItem for the same tier, so counting before locking reads a number that
   can already be stale by the time it's acted on.
2. **Lock tiers in a consistent order** (`ORDER BY ticket_tiers.id`). Three
   code paths now lock the same rows -- reserve, settle and retry -- and
   unordered multi-row locks deadlock under concurrency.

Readers (event listings, the public event page) call these without locking and
accept a momentarily stale answer: the authoritative check is the one checkout
and settlement make under lock.
"""

import uuid

from sqlalchemy import func, select

from .helpers import utcnow
from .models import Order, OrderItem, PaymentStatus


def held_counts(
    session, tier_ids: list[uuid.UUID] | None, *, exclude_order_id: uuid.UUID | None = None
) -> dict[uuid.UUID, int]:
    """Units currently held by live reservations, per tier id.

    One grouped query for every tier asked about -- callers passing a whole
    event's tiers (or a listing page's worth) must not loop.

    `exclude_order_id` leaves one order's own hold out of the count, which is
    what lets that order re-check availability for itself at settlement or on
    retry without competing against the seats it is already holding.

    Tiers with no live holds are absent from the result rather than present as
    0; use `.get(tier_id, 0)`.
    """
    if not tier_ids:
        return {}

    query = (
        select(OrderItem.ticket_tier_id, func.coalesce(func.sum(OrderItem.quantity), 0))
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            OrderItem.ticket_tier_id.in_(tier_ids),
            Order.payment_status == PaymentStatus.PENDING,
            Order.reserved_until.isnot(None),
            Order.reserved_until > utcnow(),
        )
        .group_by(OrderItem.ticket_tier_id)
    )
    if exclude_order_id is not None:
        query = query.where(Order.id != exclude_order_id)

    return {tier_id: int(total) for tier_id, total in session.execute(query).all()}


def availability(
    session, tiers, *, exclude_order_id: uuid.UUID | None = None
) -> dict[uuid.UUID, int]:
    """Bookable units per tier id: total minus confirmed sales minus live holds.

    Floored at 0, because an admin shrinking `quantity_total` below what has
    already sold is permitted and would otherwise produce a negative count that
    every caller would have to guard separately.
    """
    tiers = list(tiers)
    held = held_counts(session, [t.id for t in tiers], exclude_order_id=exclude_order_id)
    return {
        t.id: max(0, t.quantity_total - t.quantity_sold - held.get(t.id, 0))
        for t in tiers
    }


def committed_counts(session, tiers) -> dict[uuid.UUID, int]:
    """Sold plus held, per tier id -- the floor below which `quantity_total`
    must not be edited.

    Used by the organiser tier editor: shrinking capacity below the units
    already sold *or held* would guarantee an oversell when those holds settle.
    """
    tiers = list(tiers)
    held = held_counts(session, [t.id for t in tiers])
    return {t.id: t.quantity_sold + held.get(t.id, 0) for t in tiers}


def is_sold_out(tiers, available: dict[uuid.UUID, int]) -> bool:
    """Whether an event has nothing left to sell.

    Takes a precomputed availability map so a listing page resolves holds for
    every event's tiers in one query instead of one per event.
    """
    tiers = list(tiers)
    return bool(tiers) and all(available.get(t.id, 0) <= 0 for t in tiers)
