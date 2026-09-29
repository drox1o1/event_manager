"""authenticated_api Lambda -- organiser and admin routes.

/organiser/auth/* and /admin/auth/login have no Lambda authorizer attached
at the API Gateway level (see infra/app/template.yaml) since there's no JWT
yet at signup/login time. Every other route here requires a valid JWT whose
role claim the authorizer has already checked against the route prefix, and
reads its subject out of the authorizer context (organiser_id or admin_id).
"""

from __future__ import annotations

import datetime as dt
import os
import re
import uuid

import boto3
from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig
from aws_lambda_powertools.event_handler.exceptions import (
    BadRequestError,
    NotFoundError,
    ServiceError,
    UnauthorizedError,
)
from aws_lambda_powertools.utilities.typing import LambdaContext
from common.auth import (
    InvalidTokenError,
    decode_token,
    hash_password,
    issue_access_token,
    issue_email_verification_token,
    issue_refresh_token,
    verify_password,
)
from common.cities import allowed_cities, canonical_city
from common.db import get_session
from common.messaging import publish
from common.models import (
    ActivityLog,
    AdminUser,
    Category,
    Event,
    EventFormField,
    EventImage,
    EventStatus,
    FormFieldType,
    HomepageSection,
    HomepageSectionEvent,
    HomepageSectionMode,
    HomepageSectionType,
    HomepageSettings,
    Order,
    OrderItem,
    Organiser,
    OrganiserStatus,
    PaymentStatus,
    PlatformSettings,
    RefundRequest,
    RefundStatus,
    SitePage,
    Ticket,
    TicketTier,
)
from common.schemas import (
    SLUG_PATTERN,
    CategoriesReplaceRequest,
    CategorySummary,
    EventCreateRequest,
    EventImagesReplaceRequest,
    EventUpdateRequest,
    FeatureEventRequest,
    FormFieldResponse,
    FormFieldsReplaceRequest,
    HomepageReplaceRequest,
    LoginRequest,
    ModerationRejectRequest,
    OrganiserDecisionRequest,
    OrganiserProfileUpdate,
    OrganiserSignupRequest,
    OrganiserSummary,
    PlatformSettingsResponse,
    PlatformSettingsUpdateRequest,
    RefundResolveRequest,
    SitePageListItem,
    SitePageResponse,
    SitePageUpsertRequest,
    TicketTiersCreateRequest,
    TicketTierUpdate,
    TokenResponse,
    check_event_shape,
)
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import selectinload

logger = Logger()
app = APIGatewayRestResolver(
    cors=CORSConfig(allow_origin="*", allow_headers=["Content-Type", "Authorization"])
)

MAX_PAGE_SIZE = 50

_s3_client = None


def _s3():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3")
    return _s3_client


_ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


def _resolve_image_content_type(raw: str | None) -> tuple[str, str]:
    """(content_type, file_extension) for a presigned upload, from the
    caller-supplied `content_type` query param.

    Must match whatever Content-Type the frontend's PUT to S3 actually
    sends (the browser's File.type for the file the user picked) --
    presigned URLs sign the Content-Type header, so any mismatch between
    what's signed here and what's sent on the PUT is a SignatureDoesNotMatch
    (403), regardless of it being a real image. Previously hardcoded to
    "image/jpeg" here while the frontend sent the real file type, which is
    exactly why every non-JPEG upload 403'd.
    """
    content_type = (raw or "image/jpeg").split(";")[0].strip().lower()
    extension = _ALLOWED_IMAGE_TYPES.get(content_type)
    if extension is None:
        raise BadRequestError(
            f"Unsupported content_type {content_type!r} -- expected one of "
            f"{sorted(_ALLOWED_IMAGE_TYPES)}"
        )
    return content_type, extension


def _banners_cdn_url(key: str) -> str:
    """Public URL for an object in BannersBucket, via the CloudFront
    distribution in front of it (infra/app/template.yaml's
    BannersDistribution) -- not the bucket's own S3 URL, which 403s: the
    bucket has full PublicAccessBlockConfiguration and only grants read
    access to that distribution's Origin Access Control."""
    return f"https://{os.environ['BANNERS_CDN_DOMAIN']}/{key}"


class ConflictError(ServiceError):
    """409 -- aws_lambda_powertools only ships 400/401/404/500 built in."""

    def __init__(self, msg: str = "Conflict"):
        super().__init__(409, msg)


def _utcnow() -> dt.datetime:
    return dt.datetime.now(dt.UTC)


def _parse_body(model):
    try:
        return model.model_validate(app.current_event.json_body)
    except ValidationError as exc:
        raise BadRequestError(str(exc)) from exc


def _parse_uuid(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except ValueError as exc:
        raise NotFoundError("Not found") from exc


def _parse_pagination(params: dict) -> tuple[int, int]:
    try:
        page = max(int(params.get("page", "1")), 1)
        page_size = min(max(int(params.get("page_size", "20")), 1), MAX_PAGE_SIZE)
    except ValueError as exc:
        raise BadRequestError("page and page_size must be integers") from exc
    return page, page_size


def _form_field_dict(f: EventFormField) -> dict:
    return FormFieldResponse(
        id=f.id,
        label=f.label,
        field_type=f.field_type.value,
        options=f.options,
        required=f.required,
        sort_order=f.sort_order,
    ).model_dump(mode="json")


def _authorizer_claims() -> dict:
    authorizer = app.current_event.request_context.authorizer
    return dict(authorizer) if authorizer else {}


def _require_organiser_id() -> uuid.UUID:
    organiser_id = _authorizer_claims().get("organiser_id")
    if not organiser_id:
        raise UnauthorizedError("Missing organiser context")
    return uuid.UUID(organiser_id)


def _require_admin_id() -> uuid.UUID:
    admin_id = _authorizer_claims().get("admin_id")
    if not admin_id:
        raise UnauthorizedError("Missing admin context")
    return uuid.UUID(admin_id)


# --- Organiser auth (unauthenticated) ---


@app.post("/organiser/auth/signup")
def organiser_signup():
    body = _parse_body(OrganiserSignupRequest)

    with get_session() as session:
        existing = session.execute(
            select(Organiser).where(Organiser.email == body.email)
        ).scalar_one_or_none()
        if existing is not None:
            raise ConflictError("An account with this email already exists")

        organiser = Organiser(
            org_name=body.org_name,
            contact_name=body.contact_name,
            email=body.email,
            password_hash=hash_password(body.password),
            status=OrganiserStatus.PENDING,
        )
        session.add(organiser)
        session.flush()
        organiser_id = organiser.id

    verification_token = issue_email_verification_token(organiser_id)
    publish(
        "EMAIL_QUEUE_URL",
        {
            "type": "organiser_verification",
            "to": body.email,
            "verification_token": verification_token,
        },
    )

    return {"organiser_id": str(organiser_id), "status": OrganiserStatus.PENDING.value}, 201


@app.post("/organiser/auth/verify-email")
def organiser_verify_email():
    body = app.current_event.json_body or {}
    token = body.get("token")
    if not token:
        raise BadRequestError("token is required")

    try:
        payload = decode_token(token, expected_type="email_verify")
    except InvalidTokenError as exc:
        raise BadRequestError("Invalid or expired verification token") from exc

    organiser_id = uuid.UUID(payload["sub"])
    with get_session() as session:
        organiser = session.get(Organiser, organiser_id)
        if organiser is None:
            raise NotFoundError("Organiser not found")
        # Confirms the email only -- approval to create events is a separate,
        # super-admin decision (POST /admin/organisers/{id}/approve).
        organiser.email_verified = True
        status = organiser.status.value

    return {"status": status, "email_verified": True}


@app.post("/organiser/auth/login")
def organiser_login():
    body = _parse_body(LoginRequest)

    with get_session() as session:
        organiser = session.execute(
            select(Organiser).where(Organiser.email == body.email)
        ).scalar_one_or_none()
        if organiser is None or not verify_password(body.password, organiser.password_hash):
            raise UnauthorizedError("Invalid email or password")
        if organiser.status == OrganiserStatus.SUSPENDED:
            raise UnauthorizedError("This account has been suspended")

        tokens = TokenResponse(
            access_token=issue_access_token(organiser.id, "organiser"),
            refresh_token=issue_refresh_token(organiser.id, "organiser"),
        )

    return tokens.model_dump()


# --- Shared event management (organiser + super admin) ---
#
# Every event-editing operation is implemented once and exposed twice:
# under /organiser/events/* (scoped to the caller's own events, gated on the
# organiser being approved) and under /admin/events/* (any event, any
# status -- the super admin can create and complete events end to end).
# `organiser_id=None` below means "acting as super admin".

ORGANISER_EDITABLE = (EventStatus.DRAFT, EventStatus.REJECTED)


class ForbiddenError(ServiceError):
    def __init__(self, msg: str = "Forbidden"):
        super().__init__(403, msg)


def _require_approved_organiser(session) -> uuid.UUID:
    """Organiser id of the caller, rejecting anyone a super admin hasn't
    approved yet -- a PENDING organiser can log in and see their status but
    cannot create or edit events."""
    organiser_id = _require_organiser_id()
    organiser = session.get(Organiser, organiser_id)
    if organiser is None:
        raise UnauthorizedError("Organiser not found")
    if organiser.status == OrganiserStatus.PENDING:
        raise ForbiddenError("Your organiser account is awaiting approval by the Showtik team.")
    if organiser.status == OrganiserStatus.SUSPENDED:
        raise ForbiddenError("Your organiser account is suspended.")
    return organiser_id


def _load_event_for(session, event_uuid: uuid.UUID, organiser_id: uuid.UUID | None, options=()) -> Event:
    event = session.get(Event, event_uuid, options=list(options))
    if event is None or (organiser_id is not None and event.organiser_id != organiser_id):
        raise NotFoundError("Event not found")
    return event


def _load_owned_event(session, event_uuid: uuid.UUID, organiser_id: uuid.UUID | None) -> Event:
    return _load_event_for(session, event_uuid, organiser_id)


def _assert_editable(event: Event, organiser_id: uuid.UUID | None) -> None:
    if organiser_id is not None and event.status not in ORGANISER_EDITABLE:
        raise ConflictError(
            f"This event is {event.status.value} and can no longer be edited. Contact the Showtik team for changes."
        )


def _resolve_city(session, city: str) -> str:
    canonical = canonical_city(session, city)
    if canonical is None:
        raise BadRequestError(
            f"'{city}' isn't an available city. Choose one of: {', '.join(allowed_cities(session))}"
        )
    return canonical


def _check_shape(event_like) -> None:
    try:
        check_event_shape(event_like)
    except ValueError as exc:
        raise BadRequestError(str(exc)) from exc


def _tier_dict(t: TicketTier) -> dict:
    return {
        "id": str(t.id),
        "code": _short_code(t.id),
        "name": t.name,
        "price": str(t.price),
        "quantity_total": t.quantity_total,
        "quantity_sold": t.quantity_sold,
        "ticket_type": t.ticket_type,
        "description": t.description,
        "min_per_order": t.min_per_order,
        "max_per_order": t.max_per_order,
        "requires_approval": t.requires_approval,
        "group_name": t.group_name,
        "sale_status": t.sale_status,
        "sort_order": t.sort_order,
        "sale_start": t.sale_start.isoformat() if t.sale_start else None,
        "sale_end": t.sale_end.isoformat() if t.sale_end else None,
    }


def _short_code(value: uuid.UUID) -> str:
    """Human-friendly id shown in the UI (the full UUID stays the real key)."""
    return value.hex[:8].upper()


def _organiser_event_summary(e: Event) -> dict:
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
        "listing_type": e.listing_type,
    }


def _organiser_event_detail(e: Event) -> dict:
    base = _organiser_event_summary(e)
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
            "ticket_tiers": [_tier_dict(t) for t in sorted(e.ticket_tiers, key=lambda t: (t.sort_order, t.created_at))],
            "gallery_images": [img.image_url for img in sorted(e.images, key=lambda i: i.sort_order)],
            "form_fields": [_form_field_dict(f) for f in sorted(e.form_fields, key=lambda f: f.sort_order)],
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


def _event_detail_impl(event_id: str, organiser_id: uuid.UUID | None) -> dict:
    event_uuid = _parse_uuid(event_id)
    with get_session() as session:
        event = _load_event_for(session, event_uuid, organiser_id, _DETAIL_OPTIONS)
        return _organiser_event_detail(event)


def _create_event_impl(body: EventCreateRequest, organiser_id: uuid.UUID | None, session) -> uuid.UUID:
    if session.get(Category, body.category_id) is None:
        raise BadRequestError("Choose a valid category")
    city = _resolve_city(session, body.city)
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


def _update_event_impl(event_id: str, body: EventUpdateRequest, organiser_id: uuid.UUID | None, session) -> dict:
    event_uuid = _parse_uuid(event_id)
    event = _load_event_for(session, event_uuid, organiser_id)
    _assert_editable(event, organiser_id)

    changes = body.model_dump(exclude_unset=True)
    changes.pop("organiser_id", None)
    if organiser_id is None and "organiser_id" in body.model_fields_set:
        if body.organiser_id is not None and session.get(Organiser, body.organiser_id) is None:
            raise BadRequestError("Unknown organiser")
        event.organiser_id = body.organiser_id
    if "category_id" in changes and session.get(Category, changes["category_id"]) is None:
        raise BadRequestError("Choose a valid category")
    if "city" in changes:
        changes["city"] = _resolve_city(session, changes["city"])
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
    _check_shape(event)
    return {"event_id": event_id, "status": event.status.value}


def _create_tiers_impl(event_id: str, body: TicketTiersCreateRequest, organiser_id: uuid.UUID | None, session) -> list:
    event_uuid = _parse_uuid(event_id)
    event = _load_event_for(session, event_uuid, organiser_id, (selectinload(Event.ticket_tiers),))
    if event.status == EventStatus.DEACTIVATED:
        raise ConflictError("This event is deactivated")
    next_order = max((t.sort_order for t in event.ticket_tiers), default=-1) + 1
    created = []
    for i, tier_in in enumerate(body.tiers):
        tier = TicketTier(event_id=event_uuid, sort_order=next_order + i, **tier_in.model_dump())
        session.add(tier)
        created.append(tier)
    session.flush()
    return [_tier_dict(t) for t in created]


def _update_tier_impl(event_id: str, tier_id: str, body: TicketTierUpdate, organiser_id: uuid.UUID | None, session) -> dict:
    event_uuid = _parse_uuid(event_id)
    _load_event_for(session, event_uuid, organiser_id)
    tier = session.get(TicketTier, _parse_uuid(tier_id))
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
    return _tier_dict(tier)


def _delete_tier_impl(event_id: str, tier_id: str, organiser_id: uuid.UUID | None, session) -> dict:
    event_uuid = _parse_uuid(event_id)
    _load_event_for(session, event_uuid, organiser_id)
    tier = session.get(TicketTier, _parse_uuid(tier_id))
    if tier is None or tier.event_id != event_uuid:
        raise NotFoundError("Ticket not found")
    if tier.quantity_sold > 0:
        raise ConflictError("Tickets have been sold for this type -- pause it instead of deleting")
    has_orders = session.execute(select(OrderItem.id).where(OrderItem.ticket_tier_id == tier.id).limit(1)).first()
    if has_orders:
        raise ConflictError("This ticket type has orders -- pause it instead of deleting")
    session.delete(tier)
    return {"deleted": tier_id}


def _upload_url(prefix: uuid.UUID, sub: str = "") -> tuple[str, str]:
    """Presigned PUT into BannersBucket plus the CloudFront URL the image
    will be served from. ?content_type=<mime> must match the Content-Type
    the browser's PUT sends (see _resolve_image_content_type)."""
    params = app.current_event.query_string_parameters or {}
    content_type, extension = _resolve_image_content_type(params.get("content_type"))
    bucket = os.environ["BANNERS_BUCKET_NAME"]
    key = f"{prefix}/{sub}{uuid.uuid4()}.{extension}"
    upload_url = _s3().generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=900,
    )
    return upload_url, _banners_cdn_url(key)


def _list_form_fields_impl(event_id: str, organiser_id: uuid.UUID | None) -> dict:
    event_uuid = _parse_uuid(event_id)
    with get_session() as session:
        _load_event_for(session, event_uuid, organiser_id)
        fields = (
            session.execute(
                select(EventFormField)
                .where(EventFormField.event_id == event_uuid)
                .order_by(EventFormField.sort_order.asc())
            )
            .scalars()
            .all()
        )
        return {"fields": [_form_field_dict(f) for f in fields]}


def _replace_form_fields_impl(event_id: str, body: FormFieldsReplaceRequest, organiser_id: uuid.UUID | None, session) -> dict:
    event_uuid = _parse_uuid(event_id)
    _load_event_for(session, event_uuid, organiser_id)
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
    return {"fields": [_form_field_dict(f) for f in sorted(created, key=lambda f: f.sort_order)]}


def _replace_images_impl(event_id: str, body: EventImagesReplaceRequest, organiser_id: uuid.UUID | None, session) -> dict:
    event_uuid = _parse_uuid(event_id)
    _load_event_for(session, event_uuid, organiser_id)
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


def _attendees_impl(event_id: str, organiser_id: uuid.UUID | None) -> dict:
    event_uuid = _parse_uuid(event_id)
    with get_session() as session:
        _load_event_for(session, event_uuid, organiser_id)
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
                "ticket_code": _short_code(ticket.id),
                "order_id": str(order.id),
                "order_code": _short_code(order.id),
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


def _ticket_decision_impl(event_id: str, ticket_id: str, decision: str, organiser_id: uuid.UUID | None) -> dict:
    event_uuid = _parse_uuid(event_id)
    with get_session() as session:
        _load_event_for(session, event_uuid, organiser_id)
        ticket = session.get(
            Ticket, _parse_uuid(ticket_id), options=[selectinload(Ticket.order_item).selectinload(OrderItem.order)]
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
            "ticket_code": _short_code(ticket.id),
            "order_id": str(order.id),
        }
    _notify(email)
    return {"ticket_id": ticket_id, "approval_status": decision}


def _notify(message: dict) -> None:
    """Best-effort email: the change is already saved, so a queue hiccup
    must not turn it into a failed request."""
    if not message.get("to"):
        return
    try:
        publish("EMAIL_QUEUE_URL", message)
    except Exception:  # noqa: BLE001
        logger.exception("could not queue email", extra={"type": message.get("type")})


def _organiser_email_for(session, event: Event) -> str | None:
    if event.organiser_id is None:
        return None
    organiser = session.get(Organiser, event.organiser_id)
    return getattr(organiser, "email", None) if isinstance(organiser, Organiser) else None


def _publish_blockers(event: Event) -> list[str]:
    problems = []
    if not event.ticket_tiers:
        problems.append("Add at least one ticket type")
    elif all(t.sale_status != "on_sale" for t in event.ticket_tiers):
        problems.append("At least one ticket type must be on sale")
    try:
        check_event_shape(event)
    except ValueError as exc:
        problems.append(str(exc))
    return problems


# --- Organiser: account + public profile ---


def _organiser_profile_dict(o: Organiser) -> dict:
    return {
        "id": str(o.id),
        "org_name": o.org_name,
        "contact_name": o.contact_name,
        "email": o.email,
        "status": o.status.value,
        "status_reason": o.status_reason,
        "email_verified": o.email_verified,
        "approved_at": o.approved_at.isoformat() if o.approved_at else None,
        "bio": o.bio,
        "logo_url": o.logo_url,
        "cover_url": o.cover_url,
        "website_url": o.website_url,
        "instagram_url": o.instagram_url,
        "phone": o.phone,
        "city": o.city,
        "created_at": o.created_at.isoformat(),
    }


@app.get("/organiser/me")
def get_organiser_me():
    organiser_id = _require_organiser_id()
    with get_session() as session:
        organiser = session.get(Organiser, organiser_id)
        if organiser is None:
            raise NotFoundError("Organiser not found")
        return _organiser_profile_dict(organiser)


@app.patch("/organiser/me")
def update_organiser_me():
    organiser_id = _require_organiser_id()
    body = _parse_body(OrganiserProfileUpdate)
    with get_session() as session:
        organiser = session.get(Organiser, organiser_id)
        if organiser is None:
            raise NotFoundError("Organiser not found")
        changes = body.model_dump(exclude_unset=True)
        if changes.get("city"):
            changes["city"] = _resolve_city(session, changes["city"])
        for url_field in ("website_url", "instagram_url"):
            v = changes.get(url_field)
            if v and not v.startswith(("http://", "https://")):
                raise BadRequestError(f"{url_field.replace('_url', '').title()} must start with https://")
        for field, value in changes.items():
            setattr(organiser, field, value)
        session.flush()
        return _organiser_profile_dict(organiser)


@app.post("/organiser/me/image-upload-url")
def organiser_image_upload_url():
    """Presigned PUT for the organiser page logo or cover (?kind=logo|cover)."""
    organiser_id = _require_organiser_id()
    kind = (app.current_event.query_string_parameters or {}).get("kind", "logo")
    if kind not in ("logo", "cover"):
        raise BadRequestError("kind must be logo or cover")
    upload_url, image_url = _upload_url(organiser_id, f"organiser-{kind}/")
    return {"upload_url": upload_url, "image_url": image_url}


# --- Organiser events (authenticated) ---


@app.post("/organiser/events")
def create_event():
    body = _parse_body(EventCreateRequest)
    with get_session() as session:
        organiser_id = _require_approved_organiser(session)
        event_id = _create_event_impl(body, organiser_id, session)
    return {"event_id": str(event_id), "status": EventStatus.DRAFT.value}, 201


@app.post("/organiser/events/<event_id>/submit")
def submit_event(event_id: str):
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        organiser_id = _require_approved_organiser(session)
        event = _load_event_for(session, event_uuid, organiser_id, (selectinload(Event.ticket_tiers),))
        if event.status not in (EventStatus.DRAFT, EventStatus.REJECTED):
            raise ConflictError(f"Cannot submit an event in status={event.status.value}")
        blockers = _publish_blockers(event)
        if blockers:
            raise BadRequestError("; ".join(blockers))

        event.status = EventStatus.REVIEW
        event.submitted_at = _utcnow()
        event.rejection_reason = None

    return {"event_id": event_id, "status": EventStatus.REVIEW.value}


@app.get("/organiser/events")
def list_organiser_events():
    organiser_id = _require_organiser_id()
    page, page_size = _parse_pagination(app.current_event.query_string_parameters or {})

    query = (
        select(Event)
        .where(Event.organiser_id == organiser_id)
        .options(selectinload(Event.ticket_tiers), selectinload(Event.category))
        .order_by(Event.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    with get_session() as session:
        events = session.execute(query).scalars().all()
        results = [_organiser_event_summary(e) for e in events]

    return {"events": results, "page": page, "page_size": page_size}


@app.get("/organiser/events/<event_id>")
def get_organiser_event(event_id: str):
    return _event_detail_impl(event_id, _require_organiser_id())


@app.patch("/organiser/events/<event_id>")
def update_event(event_id: str):
    body = _parse_body(EventUpdateRequest)
    with get_session() as session:
        organiser_id = _require_approved_organiser(session)
        return _update_event_impl(event_id, body, organiser_id, session)


@app.delete("/organiser/events/<event_id>")
def delete_draft_event(event_id: str):
    event_uuid = _parse_uuid(event_id)
    with get_session() as session:
        organiser_id = _require_approved_organiser(session)
        event = _load_event_for(session, event_uuid, organiser_id)
        if event.status != EventStatus.DRAFT:
            raise ConflictError("Only draft events can be deleted")
        if session.execute(select(Order.id).where(Order.event_id == event_uuid).limit(1)).first():
            raise ConflictError("This event has orders and can't be deleted")
        session.delete(event)
    return {"deleted": event_id}


@app.post("/organiser/events/<event_id>/ticket-tiers")
def create_ticket_tiers(event_id: str):
    body = _parse_body(TicketTiersCreateRequest)
    with get_session() as session:
        organiser_id = _require_approved_organiser(session)
        return {"ticket_tiers": _create_tiers_impl(event_id, body, organiser_id, session)}, 201


@app.put("/organiser/events/<event_id>/ticket-tiers/<tier_id>")
def update_ticket_tier(event_id: str, tier_id: str):
    body = _parse_body(TicketTierUpdate)
    with get_session() as session:
        organiser_id = _require_approved_organiser(session)
        return _update_tier_impl(event_id, tier_id, body, organiser_id, session)


@app.delete("/organiser/events/<event_id>/ticket-tiers/<tier_id>")
def delete_ticket_tier(event_id: str, tier_id: str):
    with get_session() as session:
        organiser_id = _require_approved_organiser(session)
        return _delete_tier_impl(event_id, tier_id, organiser_id, session)


@app.post("/organiser/events/<event_id>/banner-upload-url")
def create_banner_upload_url(event_id: str):
    """Presigned PUT against BannersBucket -- the frontend PUTs the file
    directly to S3, then PATCHes the event with the returned banner_image_url."""
    event_uuid = _parse_uuid(event_id)
    with get_session() as session:
        _load_event_for(session, event_uuid, _require_organiser_id())
    upload_url, banner_image_url = _upload_url(event_uuid)
    return {"upload_url": upload_url, "banner_image_url": banner_image_url}


@app.get("/organiser/events/<event_id>/form-fields")
def list_form_fields(event_id: str):
    return _list_form_fields_impl(event_id, _require_organiser_id())


@app.put("/organiser/events/<event_id>/form-fields")
def replace_form_fields(event_id: str):
    """Replace-all: the builder UI always sends the full ordered set on save."""
    body = _parse_body(FormFieldsReplaceRequest)
    with get_session() as session:
        organiser_id = _require_approved_organiser(session)
        return _replace_form_fields_impl(event_id, body, organiser_id, session)


@app.post("/organiser/events/<event_id>/image-upload-url")
def create_image_upload_url(event_id: str):
    event_uuid = _parse_uuid(event_id)
    with get_session() as session:
        _load_event_for(session, event_uuid, _require_organiser_id())
    upload_url, image_url = _upload_url(event_uuid, "gallery/")
    return {"upload_url": upload_url, "image_url": image_url}


@app.put("/organiser/events/<event_id>/images")
def replace_event_images(event_id: str):
    """Replace the event's gallery images (max 3, enforced by the schema)."""
    body = _parse_body(EventImagesReplaceRequest)
    with get_session() as session:
        organiser_id = _require_approved_organiser(session)
        return _replace_images_impl(event_id, body, organiser_id, session)


@app.get("/organiser/events/<event_id>/attendees")
def list_attendees(event_id: str):
    return _attendees_impl(event_id, _require_organiser_id())


@app.post("/organiser/events/<event_id>/tickets/<ticket_id>/approve")
def approve_ticket(event_id: str, ticket_id: str):
    return _ticket_decision_impl(event_id, ticket_id, "approved", _require_organiser_id())


@app.post("/organiser/events/<event_id>/tickets/<ticket_id>/reject")
def reject_ticket(event_id: str, ticket_id: str):
    return _ticket_decision_impl(event_id, ticket_id, "rejected", _require_organiser_id())



# --- Admin auth (unauthenticated -- admin rows are seeded, never self-registered) ---


@app.post("/admin/auth/login")
def admin_login():
    body = _parse_body(LoginRequest)

    with get_session() as session:
        admin = session.execute(
            select(AdminUser).where(AdminUser.email == body.email)
        ).scalar_one_or_none()
        if admin is None or not verify_password(body.password, admin.password_hash):
            raise UnauthorizedError("Invalid email or password")

        tokens = TokenResponse(
            access_token=issue_access_token(admin.id, "admin"),
            refresh_token=issue_refresh_token(admin.id, "admin"),
        )

    return tokens.model_dump()


# --- Admin moderation (authenticated) ---


@app.get("/admin/moderation-queue")
def moderation_queue():
    _require_admin_id()

    with get_session() as session:
        events = (
            session.execute(
                select(Event)
                .where(Event.status == EventStatus.REVIEW)
                .order_by(Event.submitted_at.asc())
            )
            .scalars()
            .all()
        )
        results = [
            {
                "event_id": str(e.id),
                "title": e.title,
                "organiser_id": str(e.organiser_id) if e.organiser_id else None,
                "submitted_at": e.submitted_at.isoformat() if e.submitted_at else None,
            }
            for e in events
        ]

    return {"events": results}


@app.post("/admin/events/<event_id>/approve")
def approve_event(event_id: str):
    admin_id = _require_admin_id()
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None:
            raise NotFoundError("Event not found")
        if event.status != EventStatus.REVIEW:
            raise ConflictError(f"Event is not awaiting review (status={event.status.value})")

        event.status = EventStatus.APPROVED
        event.reviewed_at = _utcnow()
        event.reviewed_by = admin_id

        session.add(
            ActivityLog(
                actor_type="admin",
                actor_id=admin_id,
                event_type="event_approved",
                message=f"{event.title} was approved",
                related_event_id=event.id,
            )
        )

    return {"event_id": event_id, "status": EventStatus.APPROVED.value}


@app.post("/admin/events/<event_id>/reject")
def reject_event(event_id: str):
    admin_id = _require_admin_id()
    body = _parse_body(ModerationRejectRequest)
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None:
            raise NotFoundError("Event not found")
        if event.status != EventStatus.REVIEW:
            raise ConflictError(f"Event is not awaiting review (status={event.status.value})")

        event.status = EventStatus.REJECTED
        event.rejection_reason = body.reason
        event.reviewed_at = _utcnow()
        event.reviewed_by = admin_id

        session.add(
            ActivityLog(
                actor_type="admin",
                actor_id=admin_id,
                event_type="event_rejected",
                message=f"{event.title} was rejected: {body.reason}",
                related_event_id=event.id,
            )
        )
        email = {"type": "event_rejected", "to": _organiser_email_for(session, event), "event_title": event.title,
                 "event_id": event_id, "reason": body.reason}

    _notify(email)

    return {"event_id": event_id, "status": EventStatus.REJECTED.value}


# --- Admin: all events -- list, create, edit, publish, feature ---


@app.get("/admin/events")
def list_all_events():
    _require_admin_id()
    params = app.current_event.query_string_parameters or {}
    page, page_size = _parse_pagination(params)
    status_filter = params.get("status")

    query = (
        select(Event)
        .options(
            selectinload(Event.ticket_tiers),
            selectinload(Event.category),
            selectinload(Event.organiser),
        )
        .order_by(Event.created_at.desc())
    )
    if status_filter:
        try:
            query = query.where(Event.status == EventStatus(status_filter))
        except ValueError as exc:
            raise BadRequestError(f"Unknown status {status_filter!r}") from exc
    if params.get("featured") == "true":
        query = query.where(Event.is_featured.is_(True))
    query = query.offset((page - 1) * page_size).limit(page_size)

    with get_session() as session:
        events = session.execute(query).scalars().all()
        results = [
            {**_organiser_event_summary(e), "organiser_name": e.organiser.org_name if e.organiser else None}
            for e in events
        ]

    return {"events": results, "page": page, "page_size": page_size}


@app.post("/admin/events")
def admin_create_event():
    """Super admin creates an event directly -- hosted by a chosen organiser
    (body.organiser_id) or by the platform itself (organiser_id omitted)."""
    admin_id = _require_admin_id()
    body = _parse_body(EventCreateRequest)
    with get_session() as session:
        if body.organiser_id is not None and session.get(Organiser, body.organiser_id) is None:
            raise BadRequestError("Unknown organiser")
        event_id = _create_event_impl(body, None, session)
        event = session.get(Event, event_id)
        event.organiser_id = body.organiser_id
        session.add(
            ActivityLog(actor_type="admin", actor_id=admin_id, event_type="event_created",
                        message=f"{body.title} was created by a super admin", related_event_id=event_id)
        )
    return {"event_id": str(event_id), "status": EventStatus.DRAFT.value}, 201


@app.get("/admin/events/<event_id>")
def admin_get_event(event_id: str):
    _require_admin_id()
    return _event_detail_impl(event_id, None)


@app.patch("/admin/events/<event_id>")
def admin_update_event(event_id: str):
    _require_admin_id()
    body = _parse_body(EventUpdateRequest)
    with get_session() as session:
        return _update_event_impl(event_id, body, None, session)


@app.post("/admin/events/<event_id>/ticket-tiers")
def admin_create_ticket_tiers(event_id: str):
    _require_admin_id()
    body = _parse_body(TicketTiersCreateRequest)
    with get_session() as session:
        return {"ticket_tiers": _create_tiers_impl(event_id, body, None, session)}, 201


@app.put("/admin/events/<event_id>/ticket-tiers/<tier_id>")
def admin_update_ticket_tier(event_id: str, tier_id: str):
    _require_admin_id()
    body = _parse_body(TicketTierUpdate)
    with get_session() as session:
        return _update_tier_impl(event_id, tier_id, body, None, session)


@app.delete("/admin/events/<event_id>/ticket-tiers/<tier_id>")
def admin_delete_ticket_tier(event_id: str, tier_id: str):
    _require_admin_id()
    with get_session() as session:
        return _delete_tier_impl(event_id, tier_id, None, session)


@app.post("/admin/events/<event_id>/banner-upload-url")
def admin_banner_upload_url(event_id: str):
    _require_admin_id()
    event_uuid = _parse_uuid(event_id)
    with get_session() as session:
        _load_event_for(session, event_uuid, None)
    upload_url, banner_image_url = _upload_url(event_uuid)
    return {"upload_url": upload_url, "banner_image_url": banner_image_url}


@app.post("/admin/events/<event_id>/image-upload-url")
def admin_image_upload_url(event_id: str):
    _require_admin_id()
    event_uuid = _parse_uuid(event_id)
    with get_session() as session:
        _load_event_for(session, event_uuid, None)
    upload_url, image_url = _upload_url(event_uuid, "gallery/")
    return {"upload_url": upload_url, "image_url": image_url}


@app.put("/admin/events/<event_id>/images")
def admin_replace_event_images(event_id: str):
    _require_admin_id()
    body = _parse_body(EventImagesReplaceRequest)
    with get_session() as session:
        return _replace_images_impl(event_id, body, None, session)


@app.get("/admin/events/<event_id>/form-fields")
def admin_list_form_fields(event_id: str):
    _require_admin_id()
    return _list_form_fields_impl(event_id, None)


@app.put("/admin/events/<event_id>/form-fields")
def admin_replace_form_fields(event_id: str):
    _require_admin_id()
    body = _parse_body(FormFieldsReplaceRequest)
    with get_session() as session:
        return _replace_form_fields_impl(event_id, body, None, session)


@app.get("/admin/events/<event_id>/attendees")
def admin_list_attendees(event_id: str):
    _require_admin_id()
    return _attendees_impl(event_id, None)


@app.post("/admin/events/<event_id>/tickets/<ticket_id>/approve")
def admin_approve_ticket(event_id: str, ticket_id: str):
    _require_admin_id()
    return _ticket_decision_impl(event_id, ticket_id, "approved", None)


@app.post("/admin/events/<event_id>/tickets/<ticket_id>/reject")
def admin_reject_ticket(event_id: str, ticket_id: str):
    _require_admin_id()
    return _ticket_decision_impl(event_id, ticket_id, "rejected", None)


@app.post("/admin/events/<event_id>/publish")
def publish_event(event_id: str):
    """Make an event live. Normally used after approval, but a super admin can
    also publish straight from draft/review/rejected/deactivated (e.g. an
    event the admin built themselves). Blocked only by missing essentials."""
    admin_id = _require_admin_id()
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        event = session.get(Event, event_uuid, options=[selectinload(Event.ticket_tiers)])
        if event is None:
            raise NotFoundError("Event not found")
        if event.status in (EventStatus.LIVE, EventStatus.SOLDOUT):
            raise ConflictError("Event is already live")
        blockers = _publish_blockers(event)
        if blockers:
            raise BadRequestError("; ".join(blockers))

        if event.status in (EventStatus.DRAFT, EventStatus.REVIEW, EventStatus.REJECTED):
            event.reviewed_at = _utcnow()
            event.reviewed_by = admin_id
            event.rejection_reason = None
        event.status = EventStatus.LIVE
        session.add(
            ActivityLog(
                actor_type="admin",
                actor_id=admin_id,
                event_type="event_published",
                message=f"{event.title} went live",
                related_event_id=event.id,
            )
        )
        email = {"type": "event_published", "to": _organiser_email_for(session, event), "event_title": event.title,
                 "event_id": event_id}

    _notify(email)

    return {"event_id": event_id, "status": EventStatus.LIVE.value}


@app.post("/admin/events/<event_id>/unpublish")
def unpublish_event(event_id: str):
    admin_id = _require_admin_id()
    event_uuid = _parse_uuid(event_id)
    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None:
            raise NotFoundError("Event not found")
        if event.status not in (EventStatus.LIVE, EventStatus.SOLDOUT):
            raise ConflictError(f"Only live events can be unpublished (status={event.status.value})")
        event.status = EventStatus.DEACTIVATED
        event.is_featured = False
        session.add(
            ActivityLog(actor_type="admin", actor_id=admin_id, event_type="event_unpublished",
                        message=f"{event.title} was taken off the site", related_event_id=event.id)
        )
    return {"event_id": event_id, "status": EventStatus.DEACTIVATED.value}


@app.post("/admin/events/<event_id>/feature")
def feature_event(event_id: str):
    """Pin/unpin an event as a homepage hero slide. Several featured events
    render as a carousel ordered by featured_order."""
    _require_admin_id()
    body = _parse_body(FeatureEventRequest)
    event_uuid = _parse_uuid(event_id)
    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None:
            raise NotFoundError("Event not found")
        if body.is_featured and not event.banner_image_url:
            raise BadRequestError("Add a banner image before featuring this event -- the homepage hero needs one")
        event.is_featured = body.is_featured
        event.featured_order = body.featured_order
        event.featured_headline = (body.featured_headline or "").strip() or None
        return {
            "event_id": event_id,
            "is_featured": event.is_featured,
            "featured_order": event.featured_order,
            "featured_headline": event.featured_headline,
        }


# --- Admin: organiser approval + management (authenticated) ---


@app.get("/admin/organisers")
def list_organisers():
    _require_admin_id()
    status_filter = (app.current_event.query_string_parameters or {}).get("status")

    with get_session() as session:
        query = select(Organiser).options(selectinload(Organiser.events)).order_by(Organiser.created_at.desc())
        if status_filter:
            try:
                query = query.where(Organiser.status == OrganiserStatus(status_filter))
            except ValueError as exc:
                raise BadRequestError(f"Unknown status {status_filter!r}") from exc
        organisers = session.execute(query).scalars().all()
        results = [
            OrganiserSummary(
                id=o.id,
                org_name=o.org_name,
                contact_name=o.contact_name,
                email=o.email,
                status=o.status.value,
                created_at=o.created_at,
                email_verified=o.email_verified,
                status_reason=o.status_reason,
                approved_at=o.approved_at,
                city=o.city,
                phone=o.phone,
                logo_url=o.logo_url,
                events_count=len(o.events),
            ).model_dump(mode="json")
            for o in organisers
        ]

    return {"organisers": results}


def _set_organiser_status(organiser_id: str, status: OrganiserStatus, reason: str | None, event_type: str) -> dict:
    admin_id = _require_admin_id()
    organiser_uuid = _parse_uuid(organiser_id)
    with get_session() as session:
        organiser = session.get(Organiser, organiser_uuid)
        if organiser is None:
            raise NotFoundError("Organiser not found")
        organiser.status = status
        organiser.status_reason = reason
        if status == OrganiserStatus.VERIFIED and organiser.approved_at is None:
            organiser.approved_at = _utcnow()
        session.add(
            ActivityLog(actor_type="admin", actor_id=admin_id, event_type=event_type,
                        message=f"{organiser.org_name}: {event_type.replace('_', ' ')}" + (f" ({reason})" if reason else ""))
        )
        email = organiser.email
    _notify({"type": event_type, "to": email, "reason": reason})
    return {"organiser_id": organiser_id, "status": status.value, "status_reason": reason}


def _decision_reason() -> str | None:
    raw = app.current_event.json_body if app.current_event.body else None
    if not raw:
        return None
    try:
        return OrganiserDecisionRequest.model_validate(raw).reason
    except ValidationError as exc:
        raise BadRequestError(str(exc)) from exc


@app.post("/admin/organisers/<organiser_id>/approve")
def approve_organiser(organiser_id: str):
    return _set_organiser_status(organiser_id, OrganiserStatus.VERIFIED, None, "organiser_approved")


@app.post("/admin/organisers/<organiser_id>/reject")
def reject_organiser(organiser_id: str):
    reason = _decision_reason()
    if not reason:
        raise BadRequestError("Give the organiser a reason for the rejection")
    return _set_organiser_status(organiser_id, OrganiserStatus.SUSPENDED, reason, "organiser_rejected")


@app.post("/admin/organisers/<organiser_id>/suspend")
def suspend_organiser(organiser_id: str):
    return _set_organiser_status(organiser_id, OrganiserStatus.SUSPENDED, _decision_reason(), "organiser_suspended")


@app.post("/admin/organisers/<organiser_id>/reactivate")
def reactivate_organiser(organiser_id: str):
    return _set_organiser_status(organiser_id, OrganiserStatus.VERIFIED, None, "organiser_reactivated")


# --- Admin: transactions (authenticated) ---


@app.get("/admin/transactions")
def list_transactions():
    _require_admin_id()
    page, page_size = _parse_pagination(app.current_event.query_string_parameters or {})

    query = (
        select(Order)
        .options(selectinload(Order.event))
        .order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    with get_session() as session:
        orders = session.execute(query).scalars().all()
        results = [
            {
                "order_id": str(o.id),
                "event_title": o.event.title if o.event else None,
                "buyer_name": o.buyer_name,
                "buyer_email": o.buyer_email,
                "total_amount": str(o.total_amount),
                "payment_status": o.payment_status.value,
                "created_at": o.created_at.isoformat(),
            }
            for o in orders
        ]

    return {"transactions": results, "page": page, "page_size": page_size}


# --- Admin: refunds (authenticated) ---


@app.get("/admin/refunds")
def list_refunds():
    _require_admin_id()

    with get_session() as session:
        refunds = (
            session.execute(
                select(RefundRequest)
                .options(selectinload(RefundRequest.order))
                .order_by(RefundRequest.requested_at.desc())
            )
            .scalars()
            .all()
        )
        results = [
            {
                "refund_request_id": str(r.id),
                "order_id": str(r.order_id),
                "buyer_name": r.order.buyer_name if r.order else None,
                "amount": str(r.order.total_amount) if r.order else None,
                "reason": r.reason,
                "status": r.status.value,
                "requested_at": r.requested_at.isoformat(),
            }
            for r in refunds
        ]

    return {"refunds": results}


@app.post("/admin/refunds/<refund_id>/approve")
def approve_refund(refund_id: str):
    admin_id = _require_admin_id()
    refund_uuid = _parse_uuid(refund_id)

    with get_session() as session:
        refund = session.get(RefundRequest, refund_uuid, options=[selectinload(RefundRequest.order)])
        if refund is None:
            raise NotFoundError("Refund request not found")
        if refund.status != RefundStatus.PENDING:
            raise ConflictError(f"Refund request already {refund.status.value}")

        refund.status = RefundStatus.APPROVED
        refund.resolved_at = _utcnow()
        refund.resolved_by = admin_id
        if refund.order:
            refund.order.payment_status = PaymentStatus.REFUNDED

    return {"refund_request_id": refund_id, "status": RefundStatus.APPROVED.value}


@app.post("/admin/refunds/<refund_id>/reject")
def reject_refund(refund_id: str):
    admin_id = _require_admin_id()
    body = _parse_body(RefundResolveRequest)
    refund_uuid = _parse_uuid(refund_id)

    with get_session() as session:
        refund = session.get(RefundRequest, refund_uuid)
        if refund is None:
            raise NotFoundError("Refund request not found")
        if refund.status != RefundStatus.PENDING:
            raise ConflictError(f"Refund request already {refund.status.value}")

        refund.status = RefundStatus.REJECTED
        refund.rejection_reason = body.reason
        refund.resolved_at = _utcnow()
        refund.resolved_by = admin_id

    return {"refund_request_id": refund_id, "status": RefundStatus.REJECTED.value}


# --- Admin: platform settings (authenticated) ---


def _get_or_create_settings(session) -> PlatformSettings:
    settings = session.execute(select(PlatformSettings).limit(1)).scalar_one_or_none()
    if settings is None:
        settings = PlatformSettings()
        session.add(settings)
        session.flush()
    return settings


@app.get("/admin/settings")
def get_settings():
    _require_admin_id()

    with get_session() as session:
        settings = _get_or_create_settings(session)
        return PlatformSettingsResponse.model_validate(settings).model_dump(mode="json")


@app.patch("/admin/settings")
def update_settings():
    _require_admin_id()
    body = _parse_body(PlatformSettingsUpdateRequest)

    with get_session() as session:
        settings = _get_or_create_settings(session)
        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(settings, field, value)
        session.flush()
        return PlatformSettingsResponse.model_validate(settings).model_dump(mode="json")


# --- Admin: homepage CMS (authenticated) ---


def _get_or_create_homepage_settings(session) -> HomepageSettings:
    settings = session.execute(select(HomepageSettings).limit(1)).scalar_one_or_none()
    if settings is None:
        settings = HomepageSettings()
        session.add(settings)
        session.flush()
    return settings


def _homepage_settings_dict(s: HomepageSettings) -> dict:
    return {
        "hero_eyebrow": s.hero_eyebrow,
        "hero_headline": s.hero_headline,
        "hero_subheadline": s.hero_subheadline,
        "hero_search_enabled": s.hero_search_enabled,
        "banner_enabled": s.banner_enabled,
        "banner_text": s.banner_text,
        "banner_link_url": s.banner_link_url,
        "footer_tagline": s.footer_tagline,
        "footer_columns": s.footer_columns or [],
        "active_cities": s.active_cities or [],
    }


def _homepage_section_dict(sec: HomepageSection) -> dict:
    return {
        "id": str(sec.id),
        "title": sec.title,
        "section_type": sec.section_type.value,
        "mode": sec.mode.value,
        "enabled": sec.enabled,
        "sort_order": sec.sort_order,
        "event_ids": [str(e.event_id) for e in sorted(sec.events, key=lambda e: e.sort_order)],
    }


@app.get("/admin/homepage")
def get_homepage():
    _require_admin_id()

    with get_session() as session:
        settings = _get_or_create_homepage_settings(session)
        sections = (
            session.execute(
                select(HomepageSection)
                .options(selectinload(HomepageSection.events))
                .order_by(HomepageSection.sort_order.asc())
            )
            .scalars()
            .all()
        )
        return {
            "settings": _homepage_settings_dict(settings),
            "sections": [_homepage_section_dict(s) for s in sections],
        }


@app.put("/admin/homepage")
def replace_homepage():
    """Replace-all: persist hero/banner settings and the full ordered section
    list (with curated event picks) in one atomic save."""
    _require_admin_id()
    body = _parse_body(HomepageReplaceRequest)

    with get_session() as session:
        settings = _get_or_create_homepage_settings(session)
        for field, value in body.settings.model_dump().items():
            setattr(settings, field, value)

        # Rebuild sections wholesale. Deleting the parent rows cascades to
        # homepage_section_events (ON DELETE CASCADE).
        session.execute(HomepageSection.__table__.delete())

        created = []
        for idx, sec_in in enumerate(body.sections):
            section = HomepageSection(
                title=sec_in.title,
                section_type=HomepageSectionType(sec_in.section_type),
                mode=HomepageSectionMode(sec_in.mode),
                enabled=sec_in.enabled,
                sort_order=idx,
            )
            session.add(section)
            session.flush()
            for e_idx, event_id in enumerate(sec_in.event_ids):
                session.add(
                    HomepageSectionEvent(section_id=section.id, event_id=event_id, sort_order=e_idx)
                )
            created.append((section, sec_in.event_ids))

        result = [
            {
                "id": str(section.id),
                "title": section.title,
                "section_type": section.section_type.value,
                "mode": section.mode.value,
                "enabled": section.enabled,
                "sort_order": section.sort_order,
                "event_ids": [str(eid) for eid in event_ids],
            }
            for section, event_ids in created
        ]

        return {"settings": _homepage_settings_dict(settings), "sections": result}


# --- Admin: categories (authenticated) ---


@app.get("/admin/categories")
def list_categories_admin():
    _require_admin_id()

    with get_session() as session:
        categories = session.execute(select(Category).order_by(Category.sort_order.asc())).scalars().all()
        return {"categories": [CategorySummary.model_validate(c).model_dump(mode="json") for c in categories]}


@app.put("/admin/categories")
def replace_categories():
    """Replace-all save, mirroring the homepage sections / registration form
    builder convention: rows with an id are updated, rows without one are
    created, and any existing category missing from the list is deleted --
    unless it still has events, in which case nothing is persisted and a 409
    names the categories blocking the delete."""
    _require_admin_id()
    body = _parse_body(CategoriesReplaceRequest)

    names = [c.name.strip().lower() for c in body.categories]
    if len(names) != len(set(names)):
        raise BadRequestError("Category names must be unique")

    with get_session() as session:
        existing = {c.id: c for c in session.execute(select(Category)).scalars().all()}
        keep_ids = {c.id for c in body.categories if c.id is not None}
        to_delete = [c for cid, c in existing.items() if cid not in keep_ids]

        if to_delete:
            blocked = (
                session.execute(
                    select(Category.name)
                    .join(Event, Event.category_id == Category.id)
                    .where(Category.id.in_(c.id for c in to_delete))
                    .distinct()
                )
                .scalars()
                .all()
            )
            if blocked:
                raise ConflictError(
                    f"Can't delete {', '.join(blocked)} -- events still use "
                    f"{'this category' if len(blocked) == 1 else 'these categories'}."
                )

        for c in to_delete:
            session.delete(c)

        result = []
        for idx, cat_in in enumerate(body.categories):
            if cat_in.id is not None and cat_in.id in existing:
                category = existing[cat_in.id]
                category.name = cat_in.name
                category.icon = cat_in.icon
                category.sort_order = idx
            else:
                category = Category(name=cat_in.name, icon=cat_in.icon, sort_order=idx)
                session.add(category)
            result.append(category)

        session.flush()
        return {"categories": [CategorySummary.model_validate(c).model_dump(mode="json") for c in result]}


# --- Admin: site pages (authenticated; public reads by slug in public_api) ---


def _site_page_or_404(session, slug: str) -> SitePage:
    page = session.execute(select(SitePage).where(SitePage.slug == slug)).scalar_one_or_none()
    if page is None:
        raise NotFoundError("Page not found")
    return page


@app.get("/admin/site-pages")
def list_site_pages():
    _require_admin_id()

    with get_session() as session:
        pages = session.execute(select(SitePage).order_by(SitePage.slug.asc())).scalars().all()
        return {"pages": [SitePageListItem.model_validate(p).model_dump(mode="json") for p in pages]}


@app.get("/admin/site-pages/<slug>")
def get_site_page_admin(slug: str):
    _require_admin_id()

    with get_session() as session:
        page = _site_page_or_404(session, slug)
        return SitePageResponse.model_validate(page).model_dump(mode="json")


@app.put("/admin/site-pages/<slug>")
def upsert_site_page(slug: str):
    """Creates the page if `slug` doesn't exist yet (so admins can add brand
    new pages, not just edit the seeded six), otherwise updates it in place."""
    _require_admin_id()
    if not re.match(SLUG_PATTERN, slug):
        raise BadRequestError("Slug must be lowercase letters, numbers and hyphens only")
    body = _parse_body(SitePageUpsertRequest)

    with get_session() as session:
        page = session.execute(select(SitePage).where(SitePage.slug == slug)).scalar_one_or_none()
        if page is None:
            page = SitePage(slug=slug, title=body.title, body=body.body)
            session.add(page)
        else:
            page.title = body.title
            page.body = body.body
        session.flush()
        return SitePageResponse.model_validate(page).model_dump(mode="json")


@app.delete("/admin/site-pages/<slug>")
def delete_site_page(slug: str):
    _require_admin_id()

    with get_session() as session:
        page = _site_page_or_404(session, slug)
        session.delete(page)
        return {"deleted": slug}


@logger.inject_lambda_context
def handler(event: dict, context: LambdaContext):
    return app.resolve(event, context)
