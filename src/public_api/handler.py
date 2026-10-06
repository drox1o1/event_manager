"""public-api Lambda -- unauthenticated routes: browse, event detail,
checkout, the PayU return, and order lookup.

Only status=LIVE events are ever returned publicly.

Checkout reserves rather than sells: it writes a PENDING order holding the
seats for ten minutes, snapshots the resolved ticket plan, and returns the form
the browser POSTs to PayU. Tickets are issued in common.settlement, which is
also reached by the payment_webhook Lambda and the reconciler -- any one of the
three may be the only one that arrives, so all of them converge on the same
idempotent writer. Zero-total orders skip PayU entirely and settle in-request.
"""

from __future__ import annotations

import datetime as dt
import os
from decimal import Decimal

from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig, Response
from aws_lambda_powertools.event_handler.exceptions import (
    BadRequestError,
    NotFoundError,
)
from aws_lambda_powertools.utilities.typing import LambdaContext
from common import payu
from common.cities import DEFAULT_CITIES
from common.db import get_session
from common.helpers import (
    ConflictError,
    parse_body,
    parse_pagination,
    parse_uuid,
    short_code,
    utcnow,
)
from common.inventory import availability, is_sold_out
from common.messaging import publish_to_ses
from common.models import (
    AdminUser,
    Category,
    Event,
    EventFormField,
    EventStatus,
    HomepageSection,
    HomepageSectionMode,
    HomepageSectionType,
    HomepageSettings,
    Order,
    OrderFormResponse,
    OrderItem,
    OrderQuery,
    Organiser,
    OrganiserStatus,
    PaymentStatus,
    RefundRequest,
    SitePage,
    TicketTier,
)
from common.payu_callback import handle_callback, parse_callback, publish_all
from common.schemas import (
    CategorySummary,
    CheckoutRequest,
    CheckoutResponse,
    EventDetail,
    EventSummary,
    FormFieldResponse,
    OrderQueryCreate,
    OrganiserPublicSummary,
    RefundRequestCreate,
    SitePageResponse,
    TicketTierSummary,
    normalize_indian_mobile,
)
from common.settlement import (
    create_attempt,
    hold_expiry,
    settle_free_order,
)
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

logger = Logger()
app = APIGatewayRestResolver(
    cors=CORSConfig(allow_origin="*", allow_headers=["Content-Type", "Authorization"])
)

MAX_PAGE_SIZE = 50

# Caps retries on one order so a loop can't hammer PayU indefinitely. Generous
# enough that a buyer fixing a declined card a few times never hits it.
MAX_PAYMENT_ATTEMPTS = 5

# Checkout is unauthenticated and now reserves real inventory, which makes it a
# denial primitive: holding every seat for ten minutes on repeat would make an
# event unbookable. Capping concurrent live holds per buyer email blunts the
# cheap version of that without inconveniencing anyone genuine.
MAX_LIVE_HOLDS_PER_BUYER = 3


def _parse_body(model):
    return parse_body(model, app.current_event.json_body)


_parse_uuid = parse_uuid


def _price_from(tiers) -> float | None:
    prices = [t.price for t in tiers]
    return min(prices) if prices else None


def _tier_summary(tier: TicketTier, available: dict) -> TicketTierSummary:
    """Serialise a tier for public consumption.

    Note the asymmetry with the organiser-facing views in authenticated_api,
    which report quantity_sold alone: an organiser wants to know what has truly
    sold, while a buyer needs to know what they can actually book. Both numbers
    are here and honest, rather than one field meaning different things to
    different readers.
    """
    remaining = available.get(tier.id, 0)
    # model_validate() has no `update` kwarg -- that's model_copy()'s. Validate
    # the ORM object first, then layer the computed fields on with a copy.
    return TicketTierSummary.model_validate(tier).model_copy(
        update={
            "quantity_available": remaining,
            "quantity_held": max(0, tier.quantity_total - tier.quantity_sold - remaining),
        }
    )


def _availability_for(session, events) -> dict:
    """Bookable units for every tier across these events, in one query.

    Threaded explicitly through the serialisers rather than looked up per event,
    because the public site renders whole pages of events and a per-event lookup
    would be an N+1 on the busiest routes there are.
    """
    return availability(session, [t for e in events for t in e.ticket_tiers])


@app.get("/events")
def list_events():
    params = app.current_event.query_string_parameters or {}
    category = params.get("category")
    city = params.get("city")
    page, page_size = parse_pagination(params, MAX_PAGE_SIZE)

    query = (
        select(Event)
        .where(Event.status == EventStatus.LIVE, Event.listing_type == "public")
        .options(selectinload(Event.ticket_tiers), selectinload(Event.category))
        .order_by(Event.event_date.asc())
    )
    if category:
        # Any of the event's listing categories, not just the primary one.
        query = query.where(Event.categories.any(Category.name == category))
    if city:
        query = query.where(Event.city == city)
    keyword = (params.get("q") or "").strip()
    if keyword:
        like = f"%{keyword}%"
        query = query.where(or_(Event.title.ilike(like), Event.venue_name.ilike(like), Event.city.ilike(like)))
    query = query.offset((page - 1) * page_size).limit(page_size)

    with get_session() as session:
        events = session.execute(query).scalars().all()
        available = _availability_for(session, events)
        results = [_event_summary_dict(e, available) for e in events]

    return {"events": results, "page": page, "page_size": page_size}


@app.get("/events/<event_id>")
def get_event(event_id: str):
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        event = session.get(
            Event,
            event_uuid,
            options=[
                selectinload(Event.ticket_tiers),
                selectinload(Event.category),
                selectinload(Event.images),
                selectinload(Event.organiser),
            ],
        )
        if event is None or event.status not in (EventStatus.LIVE, EventStatus.SOLDOUT):
            raise NotFoundError("Event not found")

        tiers = sorted(event.ticket_tiers, key=lambda t: (t.sort_order, t.created_at))
        available = _availability_for(session, [event])
        detail = EventDetail(
            id=event.id,
            title=event.title,
            category=event.category.name if event.category else None,
            categories=_category_names(event),
            city=event.city,
            event_date=event.event_date,
            price_from=_price_from(event.ticket_tiers),
            sold_out=is_sold_out(event.ticket_tiers, available),
            description=event.description,
            event_time=event.event_time,
            venue_name=event.venue_name,
            venue_address=event.venue_address,
            banner_image_url=event.banner_image_url,
            gallery_images=[img.image_url for img in sorted(event.images, key=lambda i: i.sort_order)],
            ticket_tiers=[_tier_summary(t, available) for t in tiers],
            location_type=event.location_type,
            end_date=event.end_date,
            end_time=event.end_time,
            timezone=event.timezone,
            schedule_type=event.schedule_type,
            recurrence=event.recurrence,
            allow_discussions=event.allow_discussions,
            promo_video_url=event.promo_video_url,
            tags=event.tags or [],
            organiser=(
                OrganiserPublicSummary(id=event.organiser.id, org_name=event.organiser.org_name, logo_url=event.organiser.logo_url)
                if event.organiser
                else None
            ),
        )

    return detail.model_dump(mode="json")


@app.get("/events/<event_id>/form-fields")
def get_event_form_fields(event_id: str):
    """The organiser's registration form for a LIVE event -- rendered on the
    public checkout so buyers answer it before paying."""
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None or event.status not in (EventStatus.LIVE, EventStatus.SOLDOUT):
            raise NotFoundError("Event not found")

        fields = (
            session.execute(
                select(EventFormField)
                .where(EventFormField.event_id == event_uuid)
                .order_by(EventFormField.sort_order.asc())
            )
            .scalars()
            .all()
        )
        results = [
            FormFieldResponse(
                id=f.id,
                label=f.label,
                field_type=f.field_type.value,
                options=f.options,
                required=f.required,
                sort_order=f.sort_order,
            ).model_dump(mode="json")
            for f in fields
        ]

    return {"fields": results}


@app.get("/categories")
def list_categories():
    with get_session() as session:
        categories = session.execute(select(Category).order_by(Category.sort_order.asc())).scalars().all()
        results = [CategorySummary.model_validate(c).model_dump(mode="json") for c in categories]

    return {"categories": results}


# Fallback used until the super admin's site settings have ever been saved
# (or when a database is migrated before the 0005 seed ran) so the navbar and
# footer are never bare.
_DEFAULT_CITIES = DEFAULT_CITIES
_DEFAULT_FOOTER_TAGLINE = "Discover and book live events near you — no account needed to buy a ticket."
_DEFAULT_FOOTER_COLUMNS = [
    {"title": "Discover", "links": [
        {"label": "Categories", "href": "/events"},
        {"label": "Cities", "href": "/events"},
        {"label": "Trending", "href": "/events"},
        {"label": "For organisers", "href": "/signup"},
    ]},
    {"title": "Company", "links": [
        {"label": "About", "href": "/about"},
        {"label": "Careers", "href": "/careers"},
        {"label": "Press", "href": "/press"},
    ]},
    {"title": "Support", "links": [
        {"label": "Help centre", "href": "/help"},
        {"label": "Contact us", "href": "/contact"},
        {"label": "Refund policy", "href": "/refund-policy"},
    ]},
]


@app.get("/site-chrome")
def get_site_chrome():
    """Site-wide chrome the super admin controls: the city list (navbar
    dropdown, event-listing city filter) and the public footer's tagline +
    link columns. Fetched once by the root layout and passed down, so every
    page shows the same admin-edited content."""
    with get_session() as session:
        settings = session.execute(select(HomepageSettings).limit(1)).scalar_one_or_none()

        return {
            "cities": (settings.active_cities if settings and settings.active_cities else _DEFAULT_CITIES),
            "footer": {
                "tagline": (settings.footer_tagline if settings and settings.footer_tagline else _DEFAULT_FOOTER_TAGLINE),
                "columns": (settings.footer_columns if settings and settings.footer_columns else _DEFAULT_FOOTER_COLUMNS),
            },
        }


@app.get("/site-pages/<slug>")
def get_site_page(slug: str):
    with get_session() as session:
        page = session.execute(select(SitePage).where(SitePage.slug == slug)).scalar_one_or_none()
        if page is None:
            raise NotFoundError("Page not found")

        return SitePageResponse.model_validate(page).model_dump(mode="json")


def _category_names(e: Event) -> list[str]:
    primary = e.category.name if e.category else None
    extras = sorted((c for c in e.categories if c.id != e.category_id), key=lambda c: (c.sort_order, c.name))
    return ([primary] if primary else []) + [c.name for c in extras]


def _event_summary_dict(e: Event, available: dict) -> dict:
    return EventSummary(
        id=e.id,
        title=e.title,
        category=e.category.name if e.category else None,
        categories=_category_names(e),
        city=e.city,
        event_date=e.event_date,
        price_from=_price_from(e.ticket_tiers),
        sold_out=is_sold_out(e.ticket_tiers, available),
        event_time=e.event_time,
        venue_name=e.venue_name,
        banner_image_url=e.banner_image_url,
        location_type=e.location_type,
    ).model_dump(mode="json")


def _featured_dict(e: Event, available: dict) -> dict:
    base = _event_summary_dict(e, available)
    base.update(
        {
            "headline": e.featured_headline or e.title,
            "description": (e.description or "")[:220],
            "organiser_name": e.organiser.org_name if e.organiser else None,
            "link_url": e.featured_link_url,
            "mobile_banner_url": e.featured_mobile_banner_url,
        }
    )
    return base


# Default homepage layout used when the CMS config table is empty (e.g. a
# database migrated before the homepage seed) so the public page is never bare.
_DEFAULT_SECTIONS = [
    ("category_grid", "Browse by category", "auto"),
    ("featured_events", "Featured events", "auto"),
    ("trending_events", "Trending this week", "auto"),
]


@app.get("/homepage")
def get_homepage():
    """Resolve the super-admin homepage CMS config into concrete content:
    category tiles and event rows (auto = most recent live events, curated =
    the admin's hand-picked live events)."""
    with get_session() as session:
        settings = session.execute(select(HomepageSettings).limit(1)).scalar_one_or_none()
        sections = (
            session.execute(
                select(HomepageSection)
                .where(HomepageSection.enabled.is_(True))
                .options(selectinload(HomepageSection.events))
                .order_by(HomepageSection.sort_order.asc())
            )
            .scalars()
            .all()
        )

        # A shared pool of recent live events feeds every "auto" event row; each
        # auto row consumes the next window so rows don't duplicate events.
        live_pool = (
            session.execute(
                select(Event)
                .where(Event.status == EventStatus.LIVE, Event.listing_type == "public")
                .options(selectinload(Event.ticket_tiers), selectinload(Event.category))
                .order_by(Event.event_date.asc())
                .limit(48)
            )
            .scalars()
            .all()
        )

        categories = session.execute(select(Category).order_by(Category.sort_order.asc())).scalars().all()

        # Resolve every curated event id referenced anywhere, in one query.
        curated_ids = {e.event_id for s in sections for e in s.events}
        curated_by_id: dict = {}
        if curated_ids:
            curated_events = (
                session.execute(
                    select(Event)
                    .where(Event.id.in_(curated_ids), Event.status == EventStatus.LIVE)
                    .options(selectinload(Event.ticket_tiers), selectinload(Event.category))
                )
                .scalars()
                .all()
            )
            curated_by_id = {e.id: e for e in curated_events}

        specs = (
            [(s.section_type.value, s.title, s.mode.value, s) for s in sections]
            if sections
            else [(t, title, mode, None) for (t, title, mode) in _DEFAULT_SECTIONS]
        )

        # Sections hold Event objects while being assembled and are serialised
        # in one pass at the end, so holds for every event on the page resolve
        # in a single query instead of one per section.
        auto_offset = 0
        out_sections = []
        for section_type, title, mode, section in specs:
            block: dict = {"type": section_type, "title": title}
            if section_type == HomepageSectionType.CATEGORY_GRID.value:
                block["categories"] = [CategorySummary.model_validate(c).model_dump(mode="json") for c in categories]
            elif mode == HomepageSectionMode.CURATED.value and section is not None:
                ordered = sorted(section.events, key=lambda e: e.sort_order)
                block["events"] = [
                    curated_by_id[e.event_id] for e in ordered if e.event_id in curated_by_id
                ]
            elif section is not None and section.category_id is not None:
                # Category row ("Marathon"): that category's soonest live events.
                cat = next((c for c in categories if c.id == section.category_id), None)
                block["category"] = cat.name if cat else None
                rows = (
                    session.execute(
                        select(Event)
                        .where(
                            Event.status == EventStatus.LIVE,
                            Event.listing_type == "public",
                            Event.categories.any(Category.id == section.category_id),
                        )
                        .options(selectinload(Event.ticket_tiers), selectinload(Event.category))
                        .order_by(Event.event_date.asc())
                        .limit(8)
                    )
                    .scalars()
                    .all()
                )
                block["events"] = list(rows)
            else:  # auto event row
                window = live_pool[auto_offset : auto_offset + 4]
                auto_offset += 4
                block["events"] = list(window)
            out_sections.append(block)

        hero = {
            "eyebrow": settings.hero_eyebrow if settings else "Discover live events near you",
            "headline": settings.hero_headline if settings else "Find your next night out",
            "subheadline": settings.hero_subheadline if settings else None,
            "search_enabled": settings.hero_search_enabled if settings else True,
        }
        banner = {
            "enabled": settings.banner_enabled if settings else False,
            "text": settings.banner_text if settings else None,
            "link_url": settings.banner_link_url if settings else None,
        }

        # Hero carousel: events the super admin pinned as featured (needs a
        # banner -- enforced when featuring). One renders as a single hero,
        # several as a carousel.
        featured = (
            session.execute(
                select(Event)
                .where(Event.status == EventStatus.LIVE, Event.is_featured.is_(True), Event.banner_image_url.is_not(None))
                .options(selectinload(Event.ticket_tiers), selectinload(Event.category), selectinload(Event.organiser))
                .order_by(Event.featured_order.asc(), Event.event_date.asc())
                .limit(8)
            )
            .scalars()
            .all()
        )

        on_page = [e for b in out_sections for e in b.get("events", [])] + list(featured)
        available = _availability_for(session, on_page)
        for block in out_sections:
            if "events" in block:
                block["events"] = [_event_summary_dict(e, available) for e in block["events"]]

        return {
            "hero": hero,
            "banner": banner,
            "featured": [_featured_dict(e, available) for e in featured],
            "sections": out_sections,
        }


@app.get("/organisers/<organiser_id>")
def get_organiser_page(organiser_id: str):
    """Public organiser page: profile + their live public events. Only
    approved organisers have a public page."""
    organiser_uuid = _parse_uuid(organiser_id)
    with get_session() as session:
        organiser = session.get(Organiser, organiser_uuid)
        if organiser is None or organiser.status != OrganiserStatus.VERIFIED:
            raise NotFoundError("Organiser not found")
        events = (
            session.execute(
                select(Event)
                .where(
                    Event.organiser_id == organiser_uuid,
                    Event.status.in_([EventStatus.LIVE, EventStatus.SOLDOUT]),
                    Event.listing_type == "public",
                )
                .options(selectinload(Event.ticket_tiers), selectinload(Event.category))
                .order_by(Event.event_date.asc())
            )
            .scalars()
            .all()
        )
        available = _availability_for(session, events)
        return {
            "id": str(organiser.id),
            "org_name": organiser.org_name,
            "bio": organiser.bio,
            "logo_url": organiser.logo_url,
            "cover_url": organiser.cover_url,
            "website_url": organiser.website_url,
            "instagram_url": organiser.instagram_url,
            "city": organiser.city,
            "member_since": organiser.created_at.isoformat(),
            "events": [_event_summary_dict(e, available) for e in events],
        }


_short_code = short_code
_utcnow = utcnow


@app.post("/events/<event_id>/checkout")
def checkout(event_id: str):
    """Reserve tickets and hand the buyer off to PayU.

    Nothing is sold here. The order is written PENDING with a 10-minute hold on
    the seats, the fully-resolved ticket plan is snapshotted onto it, and the
    response carries the form the browser must POST to PayU. Tickets appear
    only once money is confirmed, in common.settlement.

    Zero-total orders (free or donation-at-zero tiers) never reach PayU, which
    can't process them: they settle inside this request and the response says
    no payment is required.

    One order can span several ticket types. Every ticket issued is its own row
    with its own participant name/contact and registration-form answers (e.g. a
    Full Marathon runner and a Half Marathon runner in one payment)."""
    event_uuid = _parse_uuid(event_id)
    body = _parse_body(CheckoutRequest)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None or event.status != EventStatus.LIVE:
            raise NotFoundError("Event not found")

        tier_ids = [item.ticket_tier_id for item in body.items]
        if len(tier_ids) != len(set(tier_ids)):
            raise BadRequestError("Each ticket type may appear only once per order")
        # Ordered lock: reserve, settle and retry all lock these same rows, and
        # unordered multi-row locks deadlock under concurrency. One ordering,
        # everywhere -- see common.inventory.
        tiers_by_id = {
            t.id: t
            for t in session.execute(
                select(TicketTier)
                .where(TicketTier.id.in_(tier_ids), TicketTier.event_id == event_uuid)
                .order_by(TicketTier.id)
                .with_for_update()
            )
            .scalars()
            .all()
        }
        # Counted after the lock, never before: locking a tier row doesn't stop
        # another transaction inserting a pending hold against it.
        available = availability(session, tiers_by_id.values())

        fields = sorted(event.form_fields, key=lambda f: f.sort_order)
        now = _utcnow()
        subtotal = Decimal("0")
        unit_prices: dict = {}
        for item in body.items:
            tier = tiers_by_id.get(item.ticket_tier_id)
            if tier is None:
                raise BadRequestError(f"Unknown ticket type {item.ticket_tier_id}")
            if tier.sale_status != "on_sale":
                raise ConflictError(f"'{tier.name}' is not on sale right now")
            if tier.sale_start and now < tier.sale_start:
                raise ConflictError(f"'{tier.name}' sales haven't started yet")
            if tier.sale_end and now > tier.sale_end:
                raise ConflictError(f"'{tier.name}' sales have ended")
            if item.quantity < tier.min_per_order or item.quantity > tier.max_per_order:
                raise BadRequestError(
                    f"'{tier.name}' can be booked {tier.min_per_order}-{tier.max_per_order} per order"
                )
            if item.quantity > available.get(tier.id, 0):
                raise ConflictError(f"Not enough '{tier.name}' tickets remaining")
            if item.attendees and len(item.attendees) != item.quantity:
                raise BadRequestError(f"Enter details for all {item.quantity} '{tier.name}' participant(s)")
            if tier.ticket_type == "donation":
                amount = item.amount if item.amount is not None else tier.price
                if amount < tier.price:
                    raise BadRequestError(f"Minimum contribution for '{tier.name}' is {tier.price}")
                unit = amount
            elif tier.ticket_type == "free":
                unit = Decimal("0")
            else:
                unit = tier.price
            unit_prices[tier.id] = unit
            subtotal += unit * item.quantity

        if event.schedule_type == "recurring":
            if body.occurrence_date is None:
                raise BadRequestError("Choose which date you're booking for")
            if not _is_occurrence(event, body.occurrence_date):
                raise BadRequestError("That date isn't one of this event's sessions")

        _check_hold_quota(session, event_uuid, body.buyer_email)

        # TODO(fees): read PlatformSettings.buyer_fee_enabled / commission_pct
        #   here and set booking_fee from the platform's commission. Kept at 0
        #   deliberately for now -- but note the total below is the figure the
        #   PayU hash binds, so it must always be computed here and never by
        #   the client.
        booking_fee = Decimal("0")
        total = subtotal + booking_fee

        order = Order(
            event_id=event_uuid,
            buyer_name=body.buyer_name,
            buyer_email=body.buyer_email,
            buyer_phone=body.buyer_phone,
            subtotal=subtotal,
            booking_fee=booking_fee,
            total_amount=total,
            payment_status=PaymentStatus.PENDING,
            occurrence_date=body.occurrence_date if event.schedule_type == "recurring" else None,
        )
        session.add(order)
        session.flush()

        # OrderItem rows exist from here on, before any money has moved: the
        # held-inventory count is a join over them, so a hold that lived only
        # inside the JSON snapshot would be invisible to every availability
        # read. Tickets, which mean "really paid for", still come later.
        plan: list[dict] = []
        for item in body.items:
            tier = tiers_by_id[item.ticket_tier_id]
            session.add(
                OrderItem(
                    order_id=order.id,
                    ticket_tier_id=tier.id,
                    quantity=item.quantity,
                    unit_price=unit_prices[tier.id],
                )
            )
            plan.extend(
                _resolve_tickets(item, tier, fields, body, order.occurrence_date or event.event_date)
            )

        # Everything the form said, resolved and validated now, so settlement
        # is pure INSERTs. If this stored the raw request instead, an organiser
        # adding a required field mid-payment would make a *paid* order
        # unissuable.
        order.pending_items = plan

        # Buyer-level answers (legacy single-form checkout, used when no
        # per-participant details were sent).
        if not any(item.attendees for item in body.items):
            _persist_form_responses(session, event, order, body)

        session.flush()

        if total == 0:
            # PayU can't take a zero-amount transaction, and there is nothing
            # to wait for -- settle in-request so the buyer lands on a finished
            # order page exactly as they always have.
            result = settle_free_order(session, order)
            response = _checkout_response(order, payment_required=False)
        else:
            order.reserved_until = hold_expiry()
            attempt = create_attempt(session, order, total)
            result = None
            response = _checkout_response(
                order,
                payment_required=True,
                payu=_payu_form(order, attempt, event),
            )

    # Outside the transaction: a queue hiccup must not undo a settled order.
    if result is not None:
        publish_all(result.emails)
    return response, 201


@app.post("/orders/<order_id>/payu/retry")
def retry_payment(order_id: str):
    """Start a fresh PayU transaction for an order whose payment didn't land.

    Deliberately reuses the order rather than making the buyer re-enter every
    participant: a multi-runner marathon booking is a lot of typing to lose to
    a declined card. The stored plan is replayed untouched -- re-validating it
    here would reintroduce exactly the mid-payment-edit problem that storing a
    resolved plan exists to prevent.
    """
    order_uuid = _parse_uuid(order_id)

    with get_session() as session:
        order = session.execute(
            select(Order).where(Order.id == order_uuid).with_for_update()
        ).scalar_one_or_none()
        if order is None:
            raise NotFoundError("Order not found")
        if order.payment_status in (PaymentStatus.SUCCESS, PaymentStatus.REFUNDED):
            raise ConflictError("This order is already paid")
        if not order.pending_items or order.total_amount == 0:
            # Orders predating PayU have no stored plan; free orders have
            # nothing to pay. Neither can be retried.
            raise ConflictError("This order can't be paid online")
        if len(order.payment_attempts) >= MAX_PAYMENT_ATTEMPTS:
            raise ConflictError("Too many payment attempts for this order. Please book again.")

        event = session.get(Event, order.event_id)
        if event is None or event.status != EventStatus.LIVE:
            raise ConflictError("This event is no longer on sale")

        items = list(order.order_items)
        tiers_by_id = {
            t.id: t
            for t in session.execute(
                select(TicketTier)
                .where(TicketTier.id.in_([i.ticket_tier_id for i in items]))
                .order_by(TicketTier.id)
                .with_for_update()
            ).scalars().all()
        }
        # Excluding this order's own hold, or it would compete with itself.
        available = availability(session, tiers_by_id.values(), exclude_order_id=order.id)
        for item in items:
            if item.quantity > available.get(item.ticket_tier_id, 0):
                tier = tiers_by_id.get(item.ticket_tier_id)
                raise ConflictError(
                    f"Not enough '{tier.name if tier else 'ticket'}' tickets remaining"
                )

        order.payment_status = PaymentStatus.PENDING
        order.reserved_until = hold_expiry()
        attempt = create_attempt(session, order, order.total_amount)
        session.flush()
        response = _checkout_response(
            order, payment_required=True, payu=_payu_form(order, attempt, event)
        )

    return response, 201


@app.post("/payments/payu/return")
def payu_return():
    """Where PayU sends the buyer's browser back, success or failure.

    PayU's posted `status` is read only for logging: the verdict comes from our
    own server-to-server verify call, because anything that travelled through a
    browser is a claim rather than a fact. The hash check below proves the
    payload is genuinely PayU's; the verify call proves what actually happened.

    Always redirects, even when verification fails -- the buyer must land
    somewhere sensible, and the webhook or the reconciler will settle an order
    this request couldn't.
    """
    posted = parse_callback(app.current_event.decoded_body)
    result = handle_callback(posted, source="browser_return")

    # udf1 carries the order id so the buyer can be sent to their order page
    # even when the payload failed verification and nothing was settled.
    order_id = posted.get("udf1") or (str(result.order_id) if result and result.order_id else "")
    return _redirect_to_order(order_id)


def _redirect_to_order(order_id: str) -> Response:
    """303, not 302: the browser arrived by POST, and only 303 is specified to
    turn that into a GET. A re-POSTed redirect would hit the Next.js order route
    and get a 405.

    The target is built from our own env var plus the order id and never from
    anything PayU sent -- this endpoint is unauthenticated, so echoing a
    supplied URL would make it an open redirect.
    """
    base = os.environ.get("PUBLIC_SITE_URL", "").rstrip("/")
    try:
        destination = f"{base}/order/{parse_uuid(order_id)}" if order_id else base or "/"
    except NotFoundError:
        logger.warning("payu return carried an unusable order reference", extra={"udf1": order_id})
        destination = base or "/"
    return Response(status_code=303, content_type="text/plain", headers={"Location": destination}, body="")


def _check_hold_quota(session, event_id, buyer_email: str) -> None:
    """Refuse a buyer who is already sitting on several live holds for this event.

    See MAX_LIVE_HOLDS_PER_BUYER: this endpoint is unauthenticated and now
    reserves inventory, so without a cap one script can keep an event sold out
    indefinitely at no cost.
    """
    live_holds = session.execute(
        select(func.count())
        .select_from(Order)
        .where(
            Order.event_id == event_id,
            Order.buyer_email == buyer_email,
            Order.payment_status == PaymentStatus.PENDING,
            Order.reserved_until.isnot(None),
            Order.reserved_until > _utcnow(),
        )
    ).scalar_one()
    if live_holds >= MAX_LIVE_HOLDS_PER_BUYER:
        raise ConflictError(
            "You already have tickets held for this event. Finish or abandon that payment first."
        )


def _resolve_tickets(item, tier: TicketTier, fields, body: CheckoutRequest, on: dt.date) -> list[dict]:
    """Validate one line item's participants and flatten them into the stored
    ticket plan -- one entry per ticket that will eventually be issued.

    All the validation that can reject a booking happens here, at checkout,
    while there is still a buyer on the other end to show an error to.
    """
    out = []
    for idx in range(item.quantity):
        attendee = item.attendees[idx] if item.attendees else None
        who = f"{tier.name} #{idx + 1} ({attendee.name})" if attendee else f"{tier.name} #{idx + 1}"
        answers = _validated_answers(fields, attendee.form_responses, who) if attendee else None
        _check_age(tier, fields, answers, on, who)
        out.append(
            {
                "ticket_tier_id": str(tier.id),
                "tier_name": tier.name,
                "attendee_name": attendee.name if attendee else body.buyer_name,
                "attendee_email": attendee.email if attendee and attendee.email else None,
                "attendee_phone": attendee.phone if attendee and attendee.phone else None,
                "answers": answers,
                "approval_status": "pending" if tier.requires_approval else "approved",
            }
        )
    return out


def _payu_form(order: Order, attempt, event: Event) -> dict:
    """The hidden-form payload the browser POSTs to PayU.

    surl/furl are derived from the incoming request rather than configured, so
    every PR-branch stack returns to its own API with no extra parameter to
    forget. PayU sends the buyer to the same endpoint either way -- our own
    verify call decides the outcome, not which URL they came back through.
    """
    request_context = app.current_event.request_context
    return_url = f"https://{request_context.domain_name}/{request_context.stage}/payments/payu/return"
    return payu.payment_form(
        txnid=attempt.txnid,
        amount=payu.format_amount(order.total_amount),
        product_info=event.title,
        first_name=order.buyer_name,
        email=order.buyer_email,
        # PayU wants bare 10 digits; normalize_indian_mobile stores +91XXXXXXXXXX.
        phone=order.buyer_phone.removeprefix("+91"),
        order_id=str(order.id),
        surl=return_url,
        furl=return_url,
    )


def _checkout_response(order: Order, *, payment_required: bool, payu: dict | None = None) -> dict:
    return CheckoutResponse(
        order_id=order.id,
        payment_status=order.payment_status.value,
        payment_required=payment_required,
        subtotal=f"{order.subtotal:.2f}",
        booking_fee=f"{order.booking_fee:.2f}",
        amount=f"{order.total_amount:.2f}",
        payu=payu,
    ).model_dump(mode="json")


def _notify(message: dict) -> None:
    """Best-effort: queue an email. The order is already committed, so a queue
    failure must never fail the request that produced it."""
    try:
        publish_to_ses(message)
    except Exception:  # noqa: BLE001
        logger.exception("could not queue email", extra={"type": message.get("type")})


def _is_occurrence(event: Event, day: dt.date) -> bool:
    rec = event.recurrence or {}
    until = rec.get("until")
    until_date = dt.date.fromisoformat(until) if isinstance(until, str) else until
    if day < event.event_date or (until_date and day > until_date):
        return False
    freq = rec.get("frequency")
    if freq == "daily":
        return True
    if freq == "weekly":
        weekdays = rec.get("weekdays") or [event.event_date.weekday()]
        return day.weekday() in weekdays
    if freq == "monthly":
        return day.day == event.event_date.day
    return day == event.event_date


def _answer_is_empty(answer) -> bool:
    if isinstance(answer, list):
        return len([a for a in answer if str(a).strip()]) == 0
    return not str(answer).strip()




def _parse_date(value) -> dt.date | None:
    if not isinstance(value, str):
        return None
    try:
        return dt.date.fromisoformat(value.strip()[:10])
    except ValueError:
        return None


def _age_on(dob: dt.date, on: dt.date) -> int:
    return on.year - dob.year - ((on.month, on.day) < (dob.month, dob.day))


def _check_age(tier: TicketTier, fields, answers: list[dict] | None, on: dt.date, who: str) -> None:
    """Enforce the ticket's age limits against the participant's date of
    birth, measured on the event (or chosen session) date."""
    if tier.min_age is None and tier.max_age is None:
        return
    dob_field = next((f for f in fields if f.field_type.value == "dob"), None)
    if dob_field is None:
        raise BadRequestError(f"'{tier.name}' has an age limit but this event doesn't ask for a date of birth")
    dob_answer = next((a["answer"] for a in (answers or []) if a["field_id"] == str(dob_field.id)), None)
    dob = _parse_date(dob_answer)
    if dob is None:
        raise BadRequestError(f"Date of birth is required for {who} (age-limited ticket)")
    age = _age_on(dob, on)
    if tier.min_age is not None and age < tier.min_age:
        raise BadRequestError(
            f"{who}: minimum age for '{tier.name}' is {tier.min_age} years on {on:%d %b %Y} (participant will be {age})"
        )
    if tier.max_age is not None and age > tier.max_age:
        raise BadRequestError(
            f"{who}: maximum age for '{tier.name}' is {tier.max_age} years on {on:%d %b %Y} (participant will be {age})"
        )


def _validated_answers(fields, responses, who: str) -> list[dict]:
    """Checks one participant's answers against the registration form and
    returns them as [{field_id, field_label, answer}] for the ticket row."""
    fields_by_id = {f.id: f for f in fields}
    answers_by_id = {r.field_id: r.answer for r in responses}
    for field in fields:
        answer = answers_by_id.get(field.id)
        if field.required and (answer is None or _answer_is_empty(answer)):
            raise BadRequestError(f"'{field.label}' is required for {who}")
    out = []
    for field_id, answer in answers_by_id.items():
        field = fields_by_id.get(field_id)
        if field is None:
            raise BadRequestError(f"Unknown form field {field_id}")
        if _answer_is_empty(answer):
            continue
        kind = field.field_type.value
        if field.options and kind in ("single_choice", "multi_choice"):
            chosen = answer if isinstance(answer, list) else [answer]
            if any(c not in field.options for c in chosen):
                raise BadRequestError(f"Invalid choice for '{field.label}'")
        elif kind == "phone":
            normalized = normalize_indian_mobile(answer) if isinstance(answer, str) else None
            if normalized is None:
                raise BadRequestError(f"'{field.label}' must be a 10-digit mobile number for {who}")
            answer = normalized
        elif kind in ("date", "dob"):
            parsed = _parse_date(answer)
            if parsed is None:
                raise BadRequestError(f"'{field.label}' must be a valid date for {who}")
            if kind == "dob" and parsed > dt.date.today():
                raise BadRequestError(f"'{field.label}' can't be in the future for {who}")
            answer = parsed.isoformat()
        out.append({"field_id": str(field.id), "field_label": field.label, "answer": answer})
    return out


def _persist_form_responses(session, event: Event, order: Order, body: CheckoutRequest) -> None:
    """Validate the buyer's answers against the event's registration form
    (required fields, field ownership) and store them as OrderFormResponse
    rows. Reads fields off the event relationship (lazy-loaded in the open
    session) so it shares the event lookup already done above."""
    fields = list(event.form_fields)
    if not fields:
        return

    fields_by_id = {f.id: f for f in fields}
    answers_by_id = {r.field_id: r.answer for r in body.form_responses}

    for field in fields:
        answer = answers_by_id.get(field.id)
        if field.required and (answer is None or _answer_is_empty(answer)):
            raise BadRequestError(f"'{field.label}' is required")

    for field_id, answer in answers_by_id.items():
        field = fields_by_id.get(field_id)
        if field is None:
            raise BadRequestError(f"Unknown form field {field_id}")
        if _answer_is_empty(answer):
            continue
        session.add(
            OrderFormResponse(
                order_id=order.id,
                field_id=field.id,
                field_label=field.label,
                answer=answer,
            )
        )


@app.get("/orders/<order_id>")
def get_order(order_id: str):
    order_uuid = _parse_uuid(order_id)

    with get_session() as session:
        order = session.get(
            Order,
            order_uuid,
            options=[
                selectinload(Order.event),
                selectinload(Order.order_items).selectinload(OrderItem.ticket_tier),
                selectinload(Order.order_items).selectinload(OrderItem.tickets),
                selectinload(Order.form_responses),
            ],
        )
        if order is None:
            raise NotFoundError("Order not found")

        items = [
            {
                "ticket_tier_id": str(oi.ticket_tier_id),
                "ticket_tier_code": _short_code(oi.ticket_tier_id),
                "ticket_tier_name": oi.ticket_tier.name if oi.ticket_tier else None,
                "quantity": oi.quantity,
                "unit_price": str(oi.unit_price),
                "tickets": [
                    {
                        "id": str(t.id),
                        "ticket_code": _short_code(t.id),
                        "qr_code_token": t.qr_code_token,
                        "checked_in": t.checked_in,
                        "attendee_name": t.attendee_name,
                        "attendee_email": t.attendee_email,
                        "attendee_answers": t.attendee_answers or [],
                        "approval_status": t.approval_status,
                    }
                    for t in oi.tickets
                ],
            }
            for oi in order.order_items
        ]
        ev = order.event
        online = ev is not None and ev.location_type == "online" and order.payment_status == PaymentStatus.SUCCESS

        return {
            "order_id": str(order.id),
            "order_code": _short_code(order.id),
            "event_id": str(order.event_id),
            "event_title": ev.title if ev else None,
            "event_date": ev.event_date.isoformat() if ev else None,
            "event_time": ev.event_time.isoformat() if ev else None,
            "venue_name": ev.venue_name if ev else None,
            "city": ev.city if ev else None,
            "banner_image_url": ev.banner_image_url if ev else None,
            "online_url": ev.online_url if online else None,
            "occurrence_date": order.occurrence_date.isoformat() if order.occurrence_date else None,
            "buyer_name": order.buyer_name,
            "buyer_email": order.buyer_email,
            "buyer_phone": order.buyer_phone,
            "subtotal": str(order.subtotal),
            "booking_fee": str(order.booking_fee),
            "total_amount": str(order.total_amount),
            "payment_status": order.payment_status.value,
            "payment_ref": order.payment_gateway_ref,
            "created_at": order.created_at.isoformat(),
            "items": items,
            "form_responses": [
                {"field_label": r.field_label, "answer": r.answer} for r in order.form_responses
            ],
        }


@app.post("/orders/<order_id>/refund-request")
def create_refund_request(order_id: str):
    order_uuid = _parse_uuid(order_id)
    body = _parse_body(RefundRequestCreate)

    with get_session() as session:
        order = session.get(Order, order_uuid)
        if order is None:
            raise NotFoundError("Order not found")

        refund = RefundRequest(order_id=order_uuid, reason=body.reason)
        session.add(refund)
        session.flush()
        refund_id = refund.id

    return {"refund_request_id": str(refund_id), "status": "pending"}, 201


_QUERY_LABELS = {
    "payment": "Payment issue",
    "details": "Wrong participant / buyer details",
    "cancellation": "Cancellation",
    "other": "Other",
}


@app.post("/orders/<order_id>/query")
def create_order_query(order_id: str):
    """'Raise a query related to this transaction' from the order page.
    Saved for the super admin (Admin -> Queries) and emailed to the Showtik
    team and the event's organiser."""
    order_uuid = _parse_uuid(order_id)
    body = _parse_body(OrderQueryCreate)

    with get_session() as session:
        order = session.get(Order, order_uuid, options=[selectinload(Order.event).selectinload(Event.organiser)])
        if order is None:
            raise NotFoundError("Order not found")
        query = OrderQuery(order_id=order_uuid, category=body.category, message=body.message.strip())
        session.add(query)
        session.flush()
        query_id = query.id

        base = {
            "type": "transaction_query",
            "query_id": str(query_id),
            "order_id": str(order.id),
            "order_code": _short_code(order.id),
            "payment_ref": order.payment_gateway_ref,
            "event_title": order.event.title if order.event else "",
            "buyer_name": order.buyer_name,
            "buyer_email": order.buyer_email,
            "buyer_phone": order.buyer_phone,
            "category": _QUERY_LABELS[body.category],
            "message": query.message,
        }
        recipients = [
            a.email for a in session.execute(select(AdminUser)).scalars().all() if getattr(a, "email", None)
        ][:5]
        organiser = order.event.organiser if order.event else None
        if organiser is not None and organiser.email:
            recipients.append(organiser.email)

    for to in dict.fromkeys(recipients):
        _notify({**base, "to": to})
    return {"query_id": str(query_id), "status": "open"}, 201


@logger.inject_lambda_context
def handler(event: dict, context: LambdaContext):
    return app.resolve(event, context)
