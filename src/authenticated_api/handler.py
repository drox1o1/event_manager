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
from common.db import get_session
from common.messaging import publish
from common.models import (
    ActivityLog,
    AdminUser,
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
    TicketTier,
)
from common.schemas import (
    EventCreateRequest,
    EventImagesReplaceRequest,
    EventUpdateRequest,
    FormFieldResponse,
    FormFieldsReplaceRequest,
    HomepageReplaceRequest,
    LoginRequest,
    ModerationRejectRequest,
    OrganiserSignupRequest,
    OrganiserSummary,
    PlatformSettingsResponse,
    PlatformSettingsUpdateRequest,
    RefundResolveRequest,
    TicketTiersCreateRequest,
    TokenResponse,
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


def _organiser_event_summary(e: Event) -> dict:
    tickets_sold = sum(t.quantity_sold for t in e.ticket_tiers)
    tickets_total = sum(t.quantity_total for t in e.ticket_tiers)
    return {
        "event_id": str(e.id),
        "title": e.title,
        "category": e.category.name if e.category else None,
        "city": e.city,
        "event_date": e.event_date.isoformat(),
        "status": e.status.value,
        "tickets_sold": tickets_sold,
        "tickets_total": tickets_total,
        "rejection_reason": e.rejection_reason,
    }


def _organiser_event_detail(e: Event) -> dict:
    base = _organiser_event_summary(e)
    base.update(
        {
            "description": e.description,
            "event_time": e.event_time.isoformat(),
            "venue_name": e.venue_name,
            "venue_address": e.venue_address,
            "capacity": e.capacity,
            "banner_image_url": e.banner_image_url,
            "category_id": str(e.category_id),
            "ticket_tiers": [
                {
                    "id": str(t.id),
                    "name": t.name,
                    "price": str(t.price),
                    "quantity_total": t.quantity_total,
                    "quantity_sold": t.quantity_sold,
                }
                for t in e.ticket_tiers
            ],
            "gallery_images": [
                img.image_url for img in sorted(e.images, key=lambda i: i.sort_order)
            ],
            "form_fields": [
                _form_field_dict(f)
                for f in sorted(e.form_fields, key=lambda f: f.sort_order)
            ],
        }
    )
    return base


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
        organiser.status = OrganiserStatus.VERIFIED

    return {"status": OrganiserStatus.VERIFIED.value}


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


# --- Organiser events (authenticated) ---


@app.post("/organiser/events")
def create_event():
    organiser_id = _require_organiser_id()
    body = _parse_body(EventCreateRequest)

    with get_session() as session:
        event = Event(
            organiser_id=organiser_id,
            category_id=body.category_id,
            title=body.title,
            description=body.description,
            event_date=body.event_date,
            event_time=body.event_time,
            venue_name=body.venue_name,
            venue_address=body.venue_address,
            city=body.city,
            capacity=body.capacity,
            status=EventStatus.DRAFT,
        )
        session.add(event)
        session.flush()
        event_id = event.id

    return {"event_id": str(event_id), "status": EventStatus.DRAFT.value}, 201


@app.post("/organiser/events/<event_id>/submit")
def submit_event(event_id: str):
    organiser_id = _require_organiser_id()
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None or event.organiser_id != organiser_id:
            raise NotFoundError("Event not found")
        if event.status not in (EventStatus.DRAFT, EventStatus.REJECTED):
            raise ConflictError(f"Cannot submit an event in status={event.status.value}")

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
    organiser_id = _require_organiser_id()
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        event = session.get(
            Event,
            event_uuid,
            options=[
                selectinload(Event.ticket_tiers),
                selectinload(Event.category),
                selectinload(Event.images),
                selectinload(Event.form_fields),
            ],
        )
        if event is None or event.organiser_id != organiser_id:
            raise NotFoundError("Event not found")

        return _organiser_event_detail(event)


@app.patch("/organiser/events/<event_id>")
def update_event(event_id: str):
    organiser_id = _require_organiser_id()
    event_uuid = _parse_uuid(event_id)
    body = _parse_body(EventUpdateRequest)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None or event.organiser_id != organiser_id:
            raise NotFoundError("Event not found")
        if event.status not in (EventStatus.DRAFT, EventStatus.REJECTED):
            raise ConflictError(f"Cannot edit an event in status={event.status.value}")

        for field, value in body.model_dump(exclude_unset=True).items():
            setattr(event, field, value)
        status = event.status.value

    return {"event_id": event_id, "status": status}


@app.post("/organiser/events/<event_id>/ticket-tiers")
def create_ticket_tiers(event_id: str):
    organiser_id = _require_organiser_id()
    event_uuid = _parse_uuid(event_id)
    body = _parse_body(TicketTiersCreateRequest)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None or event.organiser_id != organiser_id:
            raise NotFoundError("Event not found")

        created = []
        for tier_in in body.tiers:
            tier = TicketTier(
                event_id=event_uuid,
                name=tier_in.name,
                price=tier_in.price,
                quantity_total=tier_in.quantity_total,
                sale_start=tier_in.sale_start,
                sale_end=tier_in.sale_end,
            )
            session.add(tier)
            created.append(tier)
        session.flush()
        result = [{"id": str(t.id), "name": t.name} for t in created]

    return {"ticket_tiers": result}, 201


@app.post("/organiser/events/<event_id>/banner-upload-url")
def create_banner_upload_url(event_id: str):
    """Issues a presigned PUT URL against BannersBucket -- the frontend PUTs
    the file directly to S3, then calls PATCH /organiser/events/{id} with the
    returned banner_image_url to persist it on the event."""
    organiser_id = _require_organiser_id()
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None or event.organiser_id != organiser_id:
            raise NotFoundError("Event not found")

    bucket = os.environ["BANNERS_BUCKET_NAME"]
    key = f"{event_uuid}/{uuid.uuid4()}.jpg"
    upload_url = _s3().generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": key, "ContentType": "image/jpeg"},
        ExpiresIn=900,
    )
    banner_image_url = f"https://{bucket}.s3.amazonaws.com/{key}"

    return {"upload_url": upload_url, "banner_image_url": banner_image_url}


# --- Organiser: registration form builder ---


def _load_owned_event(session, event_uuid: uuid.UUID, organiser_id: uuid.UUID) -> Event:
    event = session.get(Event, event_uuid)
    if event is None or event.organiser_id != organiser_id:
        raise NotFoundError("Event not found")
    return event


@app.get("/organiser/events/<event_id>/form-fields")
def list_form_fields(event_id: str):
    organiser_id = _require_organiser_id()
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        _load_owned_event(session, event_uuid, organiser_id)
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


@app.put("/organiser/events/<event_id>/form-fields")
def replace_form_fields(event_id: str):
    """Replace the event's entire registration form with the posted field
    list -- the builder UI always sends the full ordered set on save."""
    organiser_id = _require_organiser_id()
    event_uuid = _parse_uuid(event_id)
    body = _parse_body(FormFieldsReplaceRequest)

    with get_session() as session:
        _load_owned_event(session, event_uuid, organiser_id)

        session.execute(
            EventFormField.__table__.delete().where(EventFormField.event_id == event_uuid)
        )
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
        result = [_form_field_dict(f) for f in sorted(created, key=lambda f: f.sort_order)]

    return {"fields": result}


# --- Organiser: gallery images ---


@app.post("/organiser/events/<event_id>/image-upload-url")
def create_image_upload_url(event_id: str):
    """Presigned PUT for a gallery image (same BannersBucket as the hero
    banner). The frontend PUTs the file, then PUTs the resulting URL list to
    /organiser/events/{id}/images to persist it."""
    organiser_id = _require_organiser_id()
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        _load_owned_event(session, event_uuid, organiser_id)

    bucket = os.environ["BANNERS_BUCKET_NAME"]
    key = f"{event_uuid}/gallery/{uuid.uuid4()}.jpg"
    upload_url = _s3().generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": key, "ContentType": "image/jpeg"},
        ExpiresIn=900,
    )
    image_url = f"https://{bucket}.s3.amazonaws.com/{key}"

    return {"upload_url": upload_url, "image_url": image_url}


@app.put("/organiser/events/<event_id>/images")
def replace_event_images(event_id: str):
    """Replace the event's gallery images (max 3, enforced by the schema)."""
    organiser_id = _require_organiser_id()
    event_uuid = _parse_uuid(event_id)
    body = _parse_body(EventImagesReplaceRequest)

    with get_session() as session:
        _load_owned_event(session, event_uuid, organiser_id)

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


@app.get("/organiser/events/<event_id>/attendees")
def list_attendees(event_id: str):
    organiser_id = _require_organiser_id()
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None or event.organiser_id != organiser_id:
            raise NotFoundError("Event not found")

        orders = (
            session.execute(
                select(Order)
                .where(Order.event_id == event_uuid, Order.payment_status == PaymentStatus.SUCCESS)
                .options(
                    selectinload(Order.order_items).selectinload(OrderItem.ticket_tier),
                    selectinload(Order.order_items).selectinload(OrderItem.tickets),
                )
            )
            .scalars()
            .all()
        )

        attendees = [
            {
                "ticket_id": str(ticket.id),
                "order_id": str(order.id),
                "buyer_name": order.buyer_name,
                "buyer_email": order.buyer_email,
                "ticket_tier": oi.ticket_tier.name if oi.ticket_tier else None,
                "checked_in": ticket.checked_in,
            }
            for order in orders
            for oi in order.order_items
            for ticket in oi.tickets
        ]

    return {"attendees": attendees}


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
                "organiser_id": str(e.organiser_id),
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

    return {"event_id": event_id, "status": EventStatus.REJECTED.value}


# --- Admin: all events / publish (authenticated) ---


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
    query = query.offset((page - 1) * page_size).limit(page_size)

    with get_session() as session:
        events = session.execute(query).scalars().all()
        results = [
            {**_organiser_event_summary(e), "organiser_name": e.organiser.org_name if e.organiser else None}
            for e in events
        ]

    return {"events": results, "page": page, "page_size": page_size}


@app.post("/admin/events/<event_id>/publish")
def publish_event(event_id: str):
    admin_id = _require_admin_id()
    event_uuid = _parse_uuid(event_id)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None:
            raise NotFoundError("Event not found")
        if event.status != EventStatus.APPROVED:
            raise ConflictError(f"Cannot publish an event in status={event.status.value}")

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

    return {"event_id": event_id, "status": EventStatus.LIVE.value}


# --- Admin: organiser management (authenticated) ---


@app.get("/admin/organisers")
def list_organisers():
    _require_admin_id()

    with get_session() as session:
        organisers = session.execute(select(Organiser).order_by(Organiser.created_at.desc())).scalars().all()
        results = [
            OrganiserSummary(
                id=o.id,
                org_name=o.org_name,
                contact_name=o.contact_name,
                email=o.email,
                status=o.status.value,
                created_at=o.created_at,
            ).model_dump(mode="json")
            for o in organisers
        ]

    return {"organisers": results}


@app.post("/admin/organisers/<organiser_id>/suspend")
def suspend_organiser(organiser_id: str):
    _require_admin_id()
    organiser_uuid = _parse_uuid(organiser_id)

    with get_session() as session:
        organiser = session.get(Organiser, organiser_uuid)
        if organiser is None:
            raise NotFoundError("Organiser not found")
        organiser.status = OrganiserStatus.SUSPENDED

    return {"organiser_id": organiser_id, "status": OrganiserStatus.SUSPENDED.value}


@app.post("/admin/organisers/<organiser_id>/reactivate")
def reactivate_organiser(organiser_id: str):
    _require_admin_id()
    organiser_uuid = _parse_uuid(organiser_id)

    with get_session() as session:
        organiser = session.get(Organiser, organiser_uuid)
        if organiser is None:
            raise NotFoundError("Organiser not found")
        organiser.status = OrganiserStatus.VERIFIED

    return {"organiser_id": organiser_id, "status": OrganiserStatus.VERIFIED.value}


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


@logger.inject_lambda_context
def handler(event: dict, context: LambdaContext):
    return app.resolve(event, context)
