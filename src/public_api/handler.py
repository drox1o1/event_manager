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

import secrets
import uuid
from decimal import Decimal

from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig
from aws_lambda_powertools.event_handler.exceptions import (
    BadRequestError,
    NotFoundError,
    ServiceError,
)
from aws_lambda_powertools.utilities.typing import LambdaContext
from common.db import get_session
from common.models import (
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
    PaymentStatus,
    RefundRequest,
    Ticket,
    TicketTier,
)
from common.schemas import (
    CategorySummary,
    CheckoutRequest,
    EventDetail,
    EventSummary,
    FormFieldResponse,
    RefundRequestCreate,
    TicketTierSummary,
)
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import selectinload

logger = Logger()
app = APIGatewayRestResolver(
    cors=CORSConfig(allow_origin="*", allow_headers=["Content-Type", "Authorization"])
)

MAX_PAGE_SIZE = 50


class ConflictError(ServiceError):
    """409 -- aws_lambda_powertools only ships 400/401/404/500 built in."""

    def __init__(self, msg: str = "Conflict"):
        super().__init__(409, msg)


def _parse_uuid(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except ValueError as exc:
        raise NotFoundError("Not found") from exc


def _parse_body(model):
    try:
        return model.model_validate(app.current_event.json_body)
    except ValidationError as exc:
        raise BadRequestError(str(exc)) from exc


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

    try:
        page = max(int(params.get("page", "1")), 1)
        page_size = min(max(int(params.get("page_size", "20")), 1), MAX_PAGE_SIZE)
    except ValueError as exc:
        raise BadRequestError("page and page_size must be integers") from exc

    query = (
        select(Event)
        .where(Event.status == EventStatus.LIVE)
        .options(selectinload(Event.ticket_tiers), selectinload(Event.category))
        .order_by(Event.event_date.asc())
    )
    if category:
        query = query.join(Event.category).where(Category.name == category)
    if city:
        query = query.where(Event.city == city)
    query = query.offset((page - 1) * page_size).limit(page_size)

    with get_session() as session:
        events = session.execute(query).scalars().all()
        results = [
            EventSummary(
                id=e.id,
                title=e.title,
                category=e.category.name if e.category else None,
                city=e.city,
                event_date=e.event_date,
                price_from=_price_from(e.ticket_tiers),
                sold_out=_sold_out(e.ticket_tiers),
            ).model_dump(mode="json")
            for e in events
        ]

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
            ],
        )
        if event is None or event.status != EventStatus.LIVE:
            raise NotFoundError("Event not found")

        detail = EventDetail(
            id=event.id,
            title=event.title,
            category=event.category.name if event.category else None,
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
            ticket_tiers=[TicketTierSummary.model_validate(t) for t in event.ticket_tiers],
        )

    return detail.model_dump(mode="json")


@app.get("/events/<event_id>/form-fields")
def get_event_form_fields(event_id: str):
    """The organiser's registration form for a LIVE event -- rendered on the
    public checkout so buyers answer it before paying."""
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None or event.status != EventStatus.LIVE:
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


def _event_summary_dict(e: Event) -> dict:
    return EventSummary(
        id=e.id,
        title=e.title,
        category=e.category.name if e.category else None,
        city=e.city,
        event_date=e.event_date,
        price_from=_price_from(e.ticket_tiers),
        sold_out=_sold_out(e.ticket_tiers),
    ).model_dump(mode="json")


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
                .where(Event.status == EventStatus.LIVE)
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

        return {"hero": hero, "banner": banner, "sections": out_sections}


@app.post("/events/<event_id>/checkout")
def checkout(event_id: str):
    """TEST-MODE checkout -- see module docstring. Marks the order paid and
    issues tickets synchronously; no real payment gateway is involved."""
    event_uuid = _parse_uuid(event_id)
    body = _parse_body(CheckoutRequest)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None or event.status != EventStatus.LIVE:
            raise NotFoundError("Event not found")

        tier_ids = [item.ticket_tier_id for item in body.items]
        tiers_by_id = {
            t.id: t
            for t in session.execute(
                select(TicketTier).where(
                    TicketTier.id.in_(tier_ids), TicketTier.event_id == event_uuid
                )
            )
            .scalars()
            .all()
        }

        subtotal = Decimal("0")
        for item in body.items:
            tier = tiers_by_id.get(item.ticket_tier_id)
            if tier is None:
                raise BadRequestError(f"Unknown ticket tier {item.ticket_tier_id}")
            if tier.quantity_sold + item.quantity > tier.quantity_total:
                raise ConflictError(f"Not enough '{tier.name}' tickets remaining")
            subtotal += tier.price * item.quantity

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
        )
        session.add(order)
        session.flush()

        for item in body.items:
            tier = tiers_by_id[item.ticket_tier_id]
            order_item = OrderItem(
                order_id=order.id,
                ticket_tier_id=tier.id,
                quantity=item.quantity,
                unit_price=tier.price,
            )
            session.add(order_item)
            session.flush()
            tier.quantity_sold += item.quantity
            for _ in range(item.quantity):
                session.add(Ticket(order_item_id=order_item.id, qr_code_token=secrets.token_urlsafe(24)))

        _persist_form_responses(session, event, order, body)

        order_id = order.id

    return {"order_id": str(order_id), "payment_status": PaymentStatus.SUCCESS.value}, 201


def _answer_is_empty(answer) -> bool:
    if isinstance(answer, list):
        return len([a for a in answer if str(a).strip()]) == 0
    return not str(answer).strip()


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
                "ticket_tier_name": oi.ticket_tier.name if oi.ticket_tier else None,
                "quantity": oi.quantity,
                "unit_price": str(oi.unit_price),
                "tickets": [
                    {"id": str(t.id), "qr_code_token": t.qr_code_token, "checked_in": t.checked_in}
                    for t in oi.tickets
                ],
            }
            for oi in order.order_items
        ]

        return {
            "order_id": str(order.id),
            "event_id": str(order.event_id),
            "event_title": order.event.title if order.event else None,
            "buyer_name": order.buyer_name,
            "buyer_email": order.buyer_email,
            "buyer_phone": order.buyer_phone,
            "subtotal": str(order.subtotal),
            "booking_fee": str(order.booking_fee),
            "total_amount": str(order.total_amount),
            "payment_status": order.payment_status.value,
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


@logger.inject_lambda_context
def handler(event: dict, context: LambdaContext):
    return app.resolve(event, context)
