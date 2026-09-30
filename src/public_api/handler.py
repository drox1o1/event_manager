"""public-api Lambda -- unauthenticated routes: browse, event detail,
checkout, and order lookup.

Only status=LIVE events are ever returned publicly. The Razorpay webhook is
still follow-up work (payment_webhook is a stub) -- checkout here is a
synchronous **test-mode** stand-in: no real gateway credentials are
available, so it marks the order paid and issues tickets immediately instead
of going through the real checkout -> webhook -> queue -> ticket_generator
pipeline. Swap this out once real Razorpay integration lands.
"""

from __future__ import annotations

import datetime as dt
import secrets
from decimal import Decimal

from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig
from aws_lambda_powertools.event_handler.exceptions import (
    BadRequestError,
    NotFoundError,
)
from aws_lambda_powertools.utilities.typing import LambdaContext
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
from common.messaging import publish
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
    Ticket,
    TicketTier,
)
from common.schemas import (
    CategorySummary,
    CheckoutRequest,
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
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

logger = Logger()
app = APIGatewayRestResolver(
    cors=CORSConfig(allow_origin="*", allow_headers=["Content-Type", "Authorization"])
)

MAX_PAGE_SIZE = 50


def _parse_body(model):
    return parse_body(model, app.current_event.json_body)


_parse_uuid = parse_uuid


def _price_from(tiers) -> float | None:
    prices = [t.price for t in tiers]
    return min(prices) if prices else None


def _sold_out(tiers) -> bool:
    return bool(tiers) and all(t.quantity_sold >= t.quantity_total for t in tiers)


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
        results = [_event_summary_dict(e) for e in events]

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
        detail = EventDetail(
            id=event.id,
            title=event.title,
            category=event.category.name if event.category else None,
            categories=_category_names(event),
            city=event.city,
            event_date=event.event_date,
            price_from=_price_from(event.ticket_tiers),
            sold_out=_sold_out(event.ticket_tiers),
            description=event.description,
            event_time=event.event_time,
            venue_name=event.venue_name,
            venue_address=event.venue_address,
            banner_image_url=event.banner_image_url,
            gallery_images=[img.image_url for img in sorted(event.images, key=lambda i: i.sort_order)],
            ticket_tiers=[TicketTierSummary.model_validate(t) for t in tiers],
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


def _event_summary_dict(e: Event) -> dict:
    return EventSummary(
        id=e.id,
        title=e.title,
        category=e.category.name if e.category else None,
        categories=_category_names(e),
        city=e.city,
        event_date=e.event_date,
        price_from=_price_from(e.ticket_tiers),
        sold_out=_sold_out(e.ticket_tiers),
        event_time=e.event_time,
        venue_name=e.venue_name,
        banner_image_url=e.banner_image_url,
        location_type=e.location_type,
    ).model_dump(mode="json")


def _featured_dict(e: Event) -> dict:
    base = _event_summary_dict(e)
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

        auto_offset = 0
        out_sections = []
        for section_type, title, mode, section in specs:
            block: dict = {"type": section_type, "title": title}
            if section_type == HomepageSectionType.CATEGORY_GRID.value:
                block["categories"] = [CategorySummary.model_validate(c).model_dump(mode="json") for c in categories]
            elif mode == HomepageSectionMode.CURATED.value and section is not None:
                ordered = sorted(section.events, key=lambda e: e.sort_order)
                block["events"] = [
                    _event_summary_dict(curated_by_id[e.event_id])
                    for e in ordered
                    if e.event_id in curated_by_id
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
                block["events"] = [_event_summary_dict(e) for e in rows]
            else:  # auto event row
                window = live_pool[auto_offset : auto_offset + 4]
                auto_offset += 4
                block["events"] = [_event_summary_dict(e) for e in window]
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

        return {
            "hero": hero,
            "banner": banner,
            "featured": [_featured_dict(e) for e in featured],
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
            "events": [_event_summary_dict(e) for e in events],
        }


_short_code = short_code
_utcnow = utcnow


@app.post("/events/<event_id>/checkout")
def checkout(event_id: str):
    """TEST-MODE checkout -- see module docstring. Marks the order paid and
    issues tickets synchronously; no real payment gateway is involved.

    One order (= one payment id) can span several ticket types. Every ticket
    issued is its own row with its own id, and -- when the buyer supplied
    them -- its own participant name/contact and registration-form answers
    (e.g. a Full Marathon runner and a Half Marathon runner in one payment)."""
    event_uuid = _parse_uuid(event_id)
    body = _parse_body(CheckoutRequest)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None or event.status != EventStatus.LIVE:
            raise NotFoundError("Event not found")

        tier_ids = [item.ticket_tier_id for item in body.items]
        if len(tier_ids) != len(set(tier_ids)):
            raise BadRequestError("Each ticket type may appear only once per order")
        tiers_by_id = {
            t.id: t
            for t in session.execute(
                select(TicketTier)
                .where(TicketTier.id.in_(tier_ids), TicketTier.event_id == event_uuid)
                .with_for_update()
            )
            .scalars()
            .all()
        }

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
            if tier.quantity_sold + item.quantity > tier.quantity_total:
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

        issued: list[tuple[Ticket, str]] = []
        order = Order(
            event_id=event_uuid,
            buyer_name=body.buyer_name,
            buyer_email=body.buyer_email,
            buyer_phone=body.buyer_phone,
            subtotal=subtotal,
            booking_fee=Decimal("0"),
            total_amount=subtotal,
            payment_status=PaymentStatus.SUCCESS,
            payment_gateway_ref="TEST-MODE",
            occurrence_date=body.occurrence_date if event.schedule_type == "recurring" else None,
        )
        session.add(order)
        session.flush()

        for item in body.items:
            tier = tiers_by_id[item.ticket_tier_id]
            order_item = OrderItem(
                order_id=order.id,
                ticket_tier_id=tier.id,
                quantity=item.quantity,
                unit_price=unit_prices[tier.id],
            )
            session.add(order_item)
            session.flush()
            tier.quantity_sold += item.quantity
            for idx in range(item.quantity):
                attendee = item.attendees[idx] if item.attendees else None
                who = f"{tier.name} #{idx + 1} ({attendee.name})" if attendee else f"{tier.name} #{idx + 1}"
                answers = _validated_answers(fields, attendee.form_responses, who) if attendee else None
                _check_age(tier, fields, answers, order.occurrence_date or event.event_date, who)
                ticket = Ticket(
                        order_item_id=order_item.id,
                        qr_code_token=secrets.token_urlsafe(24),
                        attendee_name=attendee.name if attendee else body.buyer_name,
                        attendee_email=(attendee.email if attendee and attendee.email else None),
                        attendee_phone=(attendee.phone if attendee and attendee.phone else None),
                        attendee_answers=answers,
                        approval_status="pending" if tier.requires_approval else "approved",
                )
                session.add(ticket)
                issued.append((ticket, tier.name))

        # Buyer-level answers (legacy single-form checkout, used when no
        # per-participant details were sent).
        if not any(item.attendees for item in body.items):
            _persist_form_responses(session, event, order, body)

        session.flush()
        order_id = order.id
        try:
            email = _order_email(event, order, body, subtotal, issued)
        except Exception:  # noqa: BLE001 -- never let email rendering fail a paid order
            logger.exception("could not build order email")
            email = None

    if email:
        _notify(email)
    return {"order_id": str(order_id), "payment_status": PaymentStatus.SUCCESS.value}, 201


def _order_email(event: Event, order: Order, body: CheckoutRequest, subtotal: Decimal, issued: list) -> dict:
    return {
        "type": "order_confirmation",
        "to": body.buyer_email,
        "buyer_name": body.buyer_name,
        "order_id": str(order.id),
        "order_code": _short_code(order.id),
        "event_title": event.title,
        "event_date": (order.occurrence_date or event.event_date).isoformat(),
        "event_time": event.event_time.strftime("%I:%M %p").lstrip("0"),
        "venue": f"{event.venue_name}, {event.city}" if event.location_type == "venue" else "Online",
        "total": "Free" if subtotal == 0 else f"Rs. {subtotal:,.2f}",
        "buyer_phone": order.buyer_phone,
        "tickets": [
            {
                "attendee_name": t.attendee_name,
                "tier": tier_name,
                "ticket_code": _short_code(t.id),
                "pending": t.approval_status == "pending",
                # Participant's own registration answers (DOB, T-shirt...).
                "details": [
                    f"{a['field_label']}: {', '.join(a['answer']) if isinstance(a['answer'], list) else a['answer']}"
                    for a in (t.attendee_answers or [])[:8]
                ],
            }
            for t, tier_name in issued
        ],
    }


def _notify(message: dict) -> None:
    """Best-effort: queue a confirmation email. The order is already
    committed, so a queue failure must never fail the checkout."""
    try:
        publish("EMAIL_QUEUE_URL", message)
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
