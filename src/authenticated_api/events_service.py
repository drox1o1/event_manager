"""Event/ticket-tier/form-field/attendee business logic, implemented once
and exposed twice: under /organiser/events/* (scoped to the caller's own
events, gated on the organiser being approved) and under /admin/events/*
(any event, any status -- the super admin can create and complete events end
to end). `organiser_id=None` throughout this module means "acting as super
admin".
"""

import uuid

from app import logger
from aws_lambda_powertools.event_handler.exceptions import (
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
)
from common.cities import allowed_cities, canonical_city
from common.db import get_session
from common.helpers import ConflictError, ForbiddenError, parse_uuid, short_code
from common.messaging import publish
from common.models import (
    Category,
    Event,
    EventFormField,
    EventImage,
    EventStatus,
    FormFieldType,
    Order,
    OrderItem,
    Organiser,
    OrganiserStatus,
    PaymentStatus,
    Ticket,
    TicketTier,
)
from common.schemas import (
    EventCreateRequest,
    EventImagesReplaceRequest,
    EventUpdateRequest,
    FormFieldResponse,
    FormFieldsReplaceRequest,
    TicketTiersCreateRequest,
    TicketTierUpdate,
    check_event_shape,
)
from context import require_organiser_id
from sqlalchemy import select
from sqlalchemy.orm import selectinload

# Organisers keep editing their own events through every stage (draft, in
# review, approved, live) so details can be corrected and tickets managed
# after submission. Only an event the super admin has unpublished is locked.
ORGANISER_LOCKED = (EventStatus.DEACTIVATED,)


def require_approved_organiser(session) -> uuid.UUID:
    """Organiser id of the caller, rejecting anyone a super admin hasn't
    approved yet -- a PENDING organiser can log in and see their status but
    cannot create or edit events."""
    organiser_id = require_organiser_id()
    organiser = session.get(Organiser, organiser_id)
    if organiser is None:
        raise UnauthorizedError("Organiser not found")
    if organiser.status == OrganiserStatus.PENDING:
        raise ForbiddenError("Your organiser account is awaiting approval by the Showtik team.")
    if organiser.status == OrganiserStatus.SUSPENDED:
        raise ForbiddenError("Your organiser account is suspended.")
    return organiser_id


def load_event_for(session, event_uuid: uuid.UUID, organiser_id: uuid.UUID | None, options=()) -> Event:
    event = session.get(Event, event_uuid, options=list(options))
    if event is None or (organiser_id is not None and event.organiser_id != organiser_id):
        raise NotFoundError("Event not found")
    return event


def assert_editable(event: Event, organiser_id: uuid.UUID | None) -> None:
    if organiser_id is not None and event.status in ORGANISER_LOCKED:
        raise ConflictError("This event was unpublished by the Showtik team. Contact support to make changes.")


def resolve_city(session, city: str) -> str:
    canonical = canonical_city(session, city)
    if canonical is None:
        raise BadRequestError(
            f"'{city}' isn't an available city. Choose one of: {', '.join(allowed_cities(session))}"
        )
    return canonical


def check_shape(event_like) -> None:
    try:
        check_event_shape(event_like)
    except ValueError as exc:
        raise BadRequestError(str(exc)) from exc


def tier_dict(t: TicketTier) -> dict:
    return {
        "id": str(t.id),
        "code": short_code(t.id),
        "name": t.name,
        "price": str(t.price),
        "quantity_total": t.quantity_total,
        "quantity_sold": t.quantity_sold,
        "ticket_type": t.ticket_type,
        "description": t.description,
        "min_per_order": t.min_per_order,
        "max_per_order": t.max_per_order,
        "min_age": t.min_age,
        "max_age": t.max_age,
        "requires_approval": t.requires_approval,
        "group_name": t.group_name,
        "sale_status": t.sale_status,
        "sort_order": t.sort_order,
        "sale_start": t.sale_start.isoformat() if t.sale_start else None,
        "sale_end": t.sale_end.isoformat() if t.sale_end else None,
    }


def form_field_dict(f: EventFormField) -> dict:
    return FormFieldResponse(
        id=f.id,
        label=f.label,
        field_type=f.field_type.value,
        options=f.options,
        required=f.required,
        sort_order=f.sort_order,
    ).model_dump(mode="json")


def organiser_event_summary(e: Event) -> dict:
    tickets_sold = sum(t.quantity_sold for t in e.ticket_tiers)
    tickets_total = sum(t.quantity_total for t in e.ticket_tiers)
    return {
        "event_id": str(e.id),
        "title": e.title,
        "category": e.category.name if e.category else None,
        "city": e.city,
        "event_date": e.event_date.isoformat(),
        "event_time": e.event_time.isoformat(),
        "status": e.status.value,
        "tickets_sold": tickets_sold,
        "tickets_total": tickets_total,
        "rejection_reason": e.rejection_reason,
        "banner_image_url": e.banner_image_url,
        "is_featured": e.is_featured,
        "featured_order": e.featured_order,
        "featured_headline": e.featured_headline,
        "featured_link_url": e.featured_link_url,
        "featured_mobile_banner_url": e.featured_mobile_banner_url,
        "listing_type": e.listing_type,
    }


def organiser_event_detail(e: Event) -> dict:
    base = organiser_event_summary(e)
    base.update(
        {
            "description": e.description,
            "venue_name": e.venue_name,
            "venue_address": e.venue_address,
            "capacity": e.capacity,
            "category_id": str(e.category_id),
            "organiser_id": str(e.organiser_id) if e.organiser_id else None,
            "organiser_name": e.organiser.org_name if e.organiser else None,
            "location_type": e.location_type,
            "online_url": e.online_url,
            "end_date": e.end_date.isoformat() if e.end_date else None,
            "end_time": e.end_time.isoformat() if e.end_time else None,
            "timezone": e.timezone,
            "schedule_type": e.schedule_type,
            "recurrence": e.recurrence,
            "allow_discussions": e.allow_discussions,
            "promo_video_url": e.promo_video_url,
            "tags": e.tags or [],
            "ticket_tiers": [tier_dict(t) for t in sorted(e.ticket_tiers, key=lambda t: (t.sort_order, t.created_at))],
            "gallery_images": [img.image_url for img in sorted(e.images, key=lambda i: i.sort_order)],
            "form_fields": [form_field_dict(f) for f in sorted(e.form_fields, key=lambda f: f.sort_order)],
        }
    )
    return base


_DETAIL_OPTIONS = (
    selectinload(Event.ticket_tiers),
    selectinload(Event.category),
    selectinload(Event.images),
    selectinload(Event.form_fields),
    selectinload(Event.organiser),
)


def event_detail_impl(event_id: str, organiser_id: uuid.UUID | None) -> dict:
    event_uuid = parse_uuid(event_id)
    with get_session() as session:
        event = load_event_for(session, event_uuid, organiser_id, _DETAIL_OPTIONS)
        return organiser_event_detail(event)


def create_event_impl(body: EventCreateRequest, organiser_id: uuid.UUID | None, session) -> uuid.UUID:
    if session.get(Category, body.category_id) is None:
        raise BadRequestError("Choose a valid category")
    city = resolve_city(session, body.city)
    event = Event(
        organiser_id=organiser_id,
        category_id=body.category_id,
        title=body.title.strip(),
        description=body.description,
        event_date=body.event_date,
        event_time=body.event_time,
        end_date=body.end_date,
        end_time=body.end_time,
        timezone=body.timezone,
        location_type=body.location_type,
        online_url=body.online_url if body.location_type == "online" else None,
        venue_name=(body.venue_name or "").strip() if body.location_type == "venue" else "Online",
        venue_address=(body.venue_address or "").strip() if body.location_type == "venue" else (
            "Online event" if body.location_type == "online" else "Recorded event"
        ),
        city=city,
        capacity=body.capacity,
        schedule_type=body.schedule_type,
        recurrence=body.recurrence.model_dump(mode="json") if body.recurrence else None,
        listing_type=body.listing_type,
        allow_discussions=body.allow_discussions,
        promo_video_url=body.promo_video_url,
        tags=[t.strip() for t in body.tags if t.strip()],
        status=EventStatus.DRAFT,
    )
    session.add(event)
    session.flush()
    return event.id


def update_event_impl(event_id: str, body: EventUpdateRequest, organiser_id: uuid.UUID | None, session) -> dict:
    event_uuid = parse_uuid(event_id)
    event = load_event_for(session, event_uuid, organiser_id)
    assert_editable(event, organiser_id)

    changes = body.model_dump(exclude_unset=True)
    changes.pop("organiser_id", None)
    if organiser_id is None and "organiser_id" in body.model_fields_set:
        if body.organiser_id is not None and session.get(Organiser, body.organiser_id) is None:
            raise BadRequestError("Unknown organiser")
        event.organiser_id = body.organiser_id
    if "category_id" in changes and session.get(Category, changes["category_id"]) is None:
        raise BadRequestError("Choose a valid category")
    if "city" in changes:
        changes["city"] = resolve_city(session, changes["city"])
    if "recurrence" in changes and body.recurrence is not None:
        changes["recurrence"] = body.recurrence.model_dump(mode="json")
    if "tags" in changes and changes["tags"] is not None:
        changes["tags"] = [t.strip() for t in changes["tags"] if t.strip()]

    for field, value in changes.items():
        setattr(event, field, value)

    loc = event.location_type
    if loc != "venue":
        event.venue_name = "Online"
        event.venue_address = "Online event" if loc == "online" else "Recorded event"
    if loc != "online":
        event.online_url = None
    if event.schedule_type == "single":
        event.recurrence = None
    check_shape(event)
    return {"event_id": event_id, "status": event.status.value}


def create_tiers_impl(event_id: str, body: TicketTiersCreateRequest, organiser_id: uuid.UUID | None, session) -> list:
    event_uuid = parse_uuid(event_id)
    event = load_event_for(session, event_uuid, organiser_id, (selectinload(Event.ticket_tiers),))
    if event.status == EventStatus.DEACTIVATED:
        raise ConflictError("This event is deactivated")
    next_order = max((t.sort_order for t in event.ticket_tiers), default=-1) + 1
    created = []
    for i, tier_in in enumerate(body.tiers):
        tier = TicketTier(event_id=event_uuid, sort_order=next_order + i, **tier_in.model_dump())
        session.add(tier)
        created.append(tier)
    session.flush()
    return [tier_dict(t) for t in created]


def update_tier_impl(event_id: str, tier_id: str, body: TicketTierUpdate, organiser_id: uuid.UUID | None, session) -> dict:
    event_uuid = parse_uuid(event_id)
    load_event_for(session, event_uuid, organiser_id)
    tier = session.get(TicketTier, parse_uuid(tier_id))
    if tier is None or tier.event_id != event_uuid:
        raise NotFoundError("Ticket not found")
    if tier.quantity_sold > 0:
        if body.price != tier.price or body.ticket_type != tier.ticket_type:
            raise ConflictError("Price and ticket type can't change after tickets have been sold")
        if body.quantity_total < tier.quantity_sold:
            raise ConflictError(f"Quantity can't go below the {tier.quantity_sold} already sold")
    for field, value in body.model_dump().items():
        setattr(tier, field, value)
    session.flush()
    return tier_dict(tier)


def delete_tier_impl(event_id: str, tier_id: str, organiser_id: uuid.UUID | None, session) -> dict:
    event_uuid = parse_uuid(event_id)
    load_event_for(session, event_uuid, organiser_id)
    tier = session.get(TicketTier, parse_uuid(tier_id))
    if tier is None or tier.event_id != event_uuid:
        raise NotFoundError("Ticket not found")
    if tier.quantity_sold > 0:
        raise ConflictError("Tickets have been sold for this type -- pause it instead of deleting")
    has_orders = session.execute(select(OrderItem.id).where(OrderItem.ticket_tier_id == tier.id).limit(1)).first()
    if has_orders:
        raise ConflictError("This ticket type has orders -- pause it instead of deleting")
    session.delete(tier)
    return {"deleted": tier_id}


def list_form_fields_impl(event_id: str, organiser_id: uuid.UUID | None) -> dict:
    event_uuid = parse_uuid(event_id)
    with get_session() as session:
        load_event_for(session, event_uuid, organiser_id)
        fields = (
            session.execute(
                select(EventFormField)
                .where(EventFormField.event_id == event_uuid)
                .order_by(EventFormField.sort_order.asc())
            )
            .scalars()
            .all()
        )
        return {"fields": [form_field_dict(f) for f in fields]}


def replace_form_fields_impl(event_id: str, body: FormFieldsReplaceRequest, organiser_id: uuid.UUID | None, session) -> dict:
    event_uuid = parse_uuid(event_id)
    load_event_for(session, event_uuid, organiser_id)
    session.execute(EventFormField.__table__.delete().where(EventFormField.event_id == event_uuid))
    created = []
    for idx, field_in in enumerate(body.fields):
        field = EventFormField(
            event_id=event_uuid,
            label=field_in.label,
            field_type=FormFieldType(field_in.field_type),
            options=field_in.options,
            required=field_in.required,
            sort_order=field_in.sort_order if field_in.sort_order else idx,
        )
        session.add(field)
        created.append(field)
    session.flush()
    return {"fields": [form_field_dict(f) for f in sorted(created, key=lambda f: f.sort_order)]}


def replace_images_impl(event_id: str, body: EventImagesReplaceRequest, organiser_id: uuid.UUID | None, session) -> dict:
    event_uuid = parse_uuid(event_id)
    load_event_for(session, event_uuid, organiser_id)
    session.execute(EventImage.__table__.delete().where(EventImage.event_id == event_uuid))
    for idx, img_in in enumerate(body.images):
        session.add(
            EventImage(
                event_id=event_uuid,
                image_url=img_in.image_url,
                sort_order=img_in.sort_order if img_in.sort_order else idx,
            )
        )
    return {"images": [img.image_url for img in body.images]}


def attendees_impl(event_id: str, organiser_id: uuid.UUID | None) -> dict:
    event_uuid = parse_uuid(event_id)
    with get_session() as session:
        load_event_for(session, event_uuid, organiser_id)
        orders = (
            session.execute(
                select(Order)
                .where(Order.event_id == event_uuid, Order.payment_status == PaymentStatus.SUCCESS)
                .options(
                    selectinload(Order.order_items).selectinload(OrderItem.ticket_tier),
                    selectinload(Order.order_items).selectinload(OrderItem.tickets),
                )
                .order_by(Order.created_at.desc())
            )
            .scalars()
            .all()
        )
        attendees = [
            {
                "ticket_id": str(ticket.id),
                "ticket_code": short_code(ticket.id),
                "order_id": str(order.id),
                "order_code": short_code(order.id),
                "buyer_name": order.buyer_name,
                "buyer_email": order.buyer_email,
                "buyer_phone": order.buyer_phone,
                "attendee_name": ticket.attendee_name or order.buyer_name,
                "attendee_email": ticket.attendee_email,
                "attendee_phone": ticket.attendee_phone,
                "attendee_answers": ticket.attendee_answers or [],
                "ticket_tier": oi.ticket_tier.name if oi.ticket_tier else None,
                "ticket_tier_id": str(oi.ticket_tier_id),
                "unit_price": str(oi.unit_price),
                "checked_in": ticket.checked_in,
                "approval_status": ticket.approval_status,
                "occurrence_date": order.occurrence_date.isoformat() if order.occurrence_date else None,
                "purchased_at": order.created_at.isoformat(),
            }
            for order in orders
            for oi in order.order_items
            for ticket in oi.tickets
        ]
    return {"attendees": attendees}


def ticket_decision_impl(event_id: str, ticket_id: str, decision: str, organiser_id: uuid.UUID | None) -> dict:
    event_uuid = parse_uuid(event_id)
    with get_session() as session:
        load_event_for(session, event_uuid, organiser_id)
        ticket = session.get(
            Ticket, parse_uuid(ticket_id), options=[selectinload(Ticket.order_item).selectinload(OrderItem.order)]
        )
        if ticket is None or ticket.order_item.order.event_id != event_uuid:
            raise NotFoundError("Ticket not found")
        if ticket.approval_status != "pending":
            raise ConflictError(f"Ticket already {ticket.approval_status}")
        ticket.approval_status = decision
        order = ticket.order_item.order
        email = {
            "type": f"ticket_{decision}",
            "to": ticket.attendee_email or order.buyer_email,
            "attendee_name": ticket.attendee_name or order.buyer_name,
            "event_title": order.event.title if order.event else "",
            "ticket_code": short_code(ticket.id),
            "order_id": str(order.id),
        }
    notify(email)
    return {"ticket_id": ticket_id, "approval_status": decision}


def notify(message: dict) -> None:
    """Best-effort email: the change is already saved, so a queue hiccup
    must not turn it into a failed request."""
    if not message.get("to"):
        return
    try:
        publish("EMAIL_QUEUE_URL", message)
    except Exception:  # noqa: BLE001
        logger.exception("could not queue email", extra={"type": message.get("type")})


def organiser_email_for(session, event: Event) -> str | None:
    if event.organiser_id is None:
        return None
    organiser = session.get(Organiser, event.organiser_id)
    return getattr(organiser, "email", None) if isinstance(organiser, Organiser) else None


def publish_blockers(event: Event) -> list[str]:
    problems = []
    if not event.ticket_tiers:
        problems.append("Add at least one ticket type")
    elif all(t.sale_status != "on_sale" for t in event.ticket_tiers):
        problems.append("At least one ticket type must be on sale")
    aged = [t.name for t in event.ticket_tiers if t.min_age is not None or t.max_age is not None]
    if aged and not any(f.field_type.value == "dob" for f in event.form_fields):
        problems.append(
            f"{', '.join(aged)} {'has' if len(aged) == 1 else 'have'} an age limit -- "
            "add a Date of birth question to the registration form"
        )
    try:
        check_event_shape(event)
    except ValueError as exc:
        problems.append(str(exc))
    return problems
