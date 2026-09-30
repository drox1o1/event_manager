"""Admin-facing routes: moderation queue, full event management (any event,
any status), organiser approval/suspension, transactions, and refunds. Event
creation/editing reuses events_service, the same logic organiser_routes
exposes scoped to the caller's own events.
"""

import events_service as svc
from app import app
from app import parse_request_body as _parse_body
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, NotFoundError
from common.db import get_session
from common.helpers import (
    ConflictError,
    parse_pagination,
    parse_uuid,
    short_code,
    utcnow,
    validation_message,
)
from common.models import (
    ActivityLog,
    Event,
    EventStatus,
    Order,
    OrderQuery,
    Organiser,
    OrganiserStatus,
    PaymentStatus,
    RefundRequest,
    RefundStatus,
)
from common.schemas import (
    EventCreateRequest,
    EventImagesReplaceRequest,
    EventUpdateRequest,
    FeatureEventRequest,
    FormFieldsReplaceRequest,
    ModerationRejectRequest,
    OrganiserDecisionRequest,
    OrganiserProfileUpdate,
    OrganiserSummary,
    RefundResolveRequest,
    TicketTiersCreateRequest,
    TicketTierUpdate,
)
from context import require_admin_id
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uploads import upload_url

# --- Admin moderation (authenticated) ---


@app.get("/admin/moderation-queue")
def moderation_queue():
    require_admin_id()

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
    admin_id = require_admin_id()
    event_uuid = parse_uuid(event_id)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None:
            raise NotFoundError("Event not found")
        if event.status != EventStatus.REVIEW:
            raise ConflictError(f"Event is not awaiting review (status={event.status.value})")

        event.status = EventStatus.APPROVED
        event.reviewed_at = utcnow()
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
    admin_id = require_admin_id()
    body = _parse_body(ModerationRejectRequest)
    event_uuid = parse_uuid(event_id)

    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None:
            raise NotFoundError("Event not found")
        if event.status != EventStatus.REVIEW:
            raise ConflictError(f"Event is not awaiting review (status={event.status.value})")

        event.status = EventStatus.REJECTED
        event.rejection_reason = body.reason
        event.reviewed_at = utcnow()
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
        email = {"type": "event_rejected", "to": svc.organiser_email_for(session, event), "event_title": event.title,
                 "event_id": event_id, "reason": body.reason}

    svc.notify(email)

    return {"event_id": event_id, "status": EventStatus.REJECTED.value}


# --- Admin: all events -- list, create, edit, publish, feature ---


@app.get("/admin/events")
def list_all_events():
    require_admin_id()
    params = app.current_event.query_string_parameters or {}
    page, page_size = parse_pagination(params)
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
            {**svc.organiser_event_summary(e), "organiser_name": e.organiser.org_name if e.organiser else None}
            for e in events
        ]

    return {"events": results, "page": page, "page_size": page_size}


@app.post("/admin/events")
def admin_create_event():
    """Super admin creates an event directly -- hosted by a chosen organiser
    (body.organiser_id) or by the platform itself (organiser_id omitted)."""
    admin_id = require_admin_id()
    body = _parse_body(EventCreateRequest)
    with get_session() as session:
        if body.organiser_id is not None and session.get(Organiser, body.organiser_id) is None:
            raise BadRequestError("Unknown organiser")
        event_id = svc.create_event_impl(body, None, session)
        event = session.get(Event, event_id)
        event.organiser_id = body.organiser_id
        session.add(
            ActivityLog(actor_type="admin", actor_id=admin_id, event_type="event_created",
                        message=f"{body.title} was created by a super admin", related_event_id=event_id)
        )
    return {"event_id": str(event_id), "status": EventStatus.DRAFT.value}, 201


@app.get("/admin/events/<event_id>")
def admin_get_event(event_id: str):
    require_admin_id()
    return svc.event_detail_impl(event_id, None)


@app.patch("/admin/events/<event_id>")
def admin_update_event(event_id: str):
    require_admin_id()
    body = _parse_body(EventUpdateRequest)
    with get_session() as session:
        return svc.update_event_impl(event_id, body, None, session)


@app.post("/admin/events/<event_id>/ticket-tiers")
def admin_create_ticket_tiers(event_id: str):
    require_admin_id()
    body = _parse_body(TicketTiersCreateRequest)
    with get_session() as session:
        return {"ticket_tiers": svc.create_tiers_impl(event_id, body, None, session)}, 201


@app.put("/admin/events/<event_id>/ticket-tiers/<tier_id>")
def admin_update_ticket_tier(event_id: str, tier_id: str):
    require_admin_id()
    body = _parse_body(TicketTierUpdate)
    with get_session() as session:
        return svc.update_tier_impl(event_id, tier_id, body, None, session)


@app.delete("/admin/events/<event_id>/ticket-tiers/<tier_id>")
def admin_delete_ticket_tier(event_id: str, tier_id: str):
    require_admin_id()
    with get_session() as session:
        return svc.delete_tier_impl(event_id, tier_id, None, session)


@app.post("/admin/events/<event_id>/banner-upload-url")
def admin_banner_upload_url(event_id: str):
    require_admin_id()
    event_uuid = parse_uuid(event_id)
    with get_session() as session:
        svc.load_event_for(session, event_uuid, None)
    put_url, banner_image_url = upload_url(event_uuid)
    return {"upload_url": put_url, "banner_image_url": banner_image_url}


@app.post("/admin/events/<event_id>/image-upload-url")
def admin_image_upload_url(event_id: str):
    require_admin_id()
    event_uuid = parse_uuid(event_id)
    with get_session() as session:
        svc.load_event_for(session, event_uuid, None)
    put_url, image_url = upload_url(event_uuid, "gallery/")
    return {"upload_url": put_url, "image_url": image_url}


@app.put("/admin/events/<event_id>/images")
def admin_replace_event_images(event_id: str):
    require_admin_id()
    body = _parse_body(EventImagesReplaceRequest)
    with get_session() as session:
        return svc.replace_images_impl(event_id, body, None, session)


@app.get("/admin/events/<event_id>/form-fields")
def admin_list_form_fields(event_id: str):
    require_admin_id()
    return svc.list_form_fields_impl(event_id, None)


@app.put("/admin/events/<event_id>/form-fields")
def admin_replace_form_fields(event_id: str):
    require_admin_id()
    body = _parse_body(FormFieldsReplaceRequest)
    with get_session() as session:
        return svc.replace_form_fields_impl(event_id, body, None, session)


@app.get("/admin/events/<event_id>/attendees")
def admin_list_attendees(event_id: str):
    """Registrations list, or with ?format=csv|xlsx (&status=) the export file."""
    require_admin_id()
    params = app.current_event.query_string_parameters or {}
    if params.get("format"):
        return svc.export_attendees_impl(event_id, None, params["format"], params.get("status"))
    return svc.attendees_impl(event_id, None)


@app.post("/admin/events/<event_id>/tickets/<ticket_id>/approve")
def admin_approve_ticket(event_id: str, ticket_id: str):
    require_admin_id()
    return svc.ticket_decision_impl(event_id, ticket_id, "approved", None)


@app.post("/admin/events/<event_id>/tickets/<ticket_id>/reject")
def admin_reject_ticket(event_id: str, ticket_id: str):
    require_admin_id()
    return svc.ticket_decision_impl(event_id, ticket_id, "rejected", None)


@app.post("/admin/events/<event_id>/publish")
def publish_event(event_id: str):
    """Make an event live. Normally used after approval, but a super admin can
    also publish straight from draft/review/rejected/deactivated (e.g. an
    event the admin built themselves). Blocked only by missing essentials."""
    admin_id = require_admin_id()
    event_uuid = parse_uuid(event_id)

    with get_session() as session:
        event = session.get(Event, event_uuid, options=[selectinload(Event.ticket_tiers)])
        if event is None:
            raise NotFoundError("Event not found")
        if event.status in (EventStatus.LIVE, EventStatus.SOLDOUT):
            raise ConflictError("Event is already live")
        blockers = svc.publish_blockers(event)
        if blockers:
            raise BadRequestError("; ".join(blockers))

        if event.status in (EventStatus.DRAFT, EventStatus.REVIEW, EventStatus.REJECTED):
            event.reviewed_at = utcnow()
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
        email = {"type": "event_published", "to": svc.organiser_email_for(session, event), "event_title": event.title,
                 "event_id": event_id}

    svc.notify(email)

    return {"event_id": event_id, "status": EventStatus.LIVE.value}


@app.post("/admin/events/<event_id>/unpublish")
def unpublish_event(event_id: str):
    admin_id = require_admin_id()
    event_uuid = parse_uuid(event_id)
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
    require_admin_id()
    body = _parse_body(FeatureEventRequest)
    event_uuid = parse_uuid(event_id)
    with get_session() as session:
        event = session.get(Event, event_uuid)
        if event is None:
            raise NotFoundError("Event not found")
        if body.is_featured and not event.banner_image_url:
            raise BadRequestError("Add a banner image before featuring this event -- the homepage hero needs one")
        event.is_featured = body.is_featured
        event.featured_order = body.featured_order
        event.featured_headline = (body.featured_headline or "").strip() or None
        event.featured_link_url = (body.featured_link_url or "").strip() or None
        event.featured_mobile_banner_url = (body.featured_mobile_banner_url or "").strip() or None
        return {
            "event_id": event_id,
            "is_featured": event.is_featured,
            "featured_order": event.featured_order,
            "featured_headline": event.featured_headline,
            "featured_link_url": event.featured_link_url,
            "featured_mobile_banner_url": event.featured_mobile_banner_url,
        }


# --- Admin: organiser approval + management (authenticated) ---


@app.get("/admin/organisers")
def list_organisers():
    require_admin_id()
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
    admin_id = require_admin_id()
    organiser_uuid = parse_uuid(organiser_id)
    with get_session() as session:
        organiser = session.get(Organiser, organiser_uuid)
        if organiser is None:
            raise NotFoundError("Organiser not found")
        organiser.status = status
        organiser.status_reason = reason
        if status == OrganiserStatus.VERIFIED and organiser.approved_at is None:
            organiser.approved_at = utcnow()
        session.add(
            ActivityLog(actor_type="admin", actor_id=admin_id, event_type=event_type,
                        message=f"{organiser.org_name}: {event_type.replace('_', ' ')}" + (f" ({reason})" if reason else ""))
        )
        email = organiser.email
    svc.notify({"type": event_type, "to": email, "reason": reason})
    return {"organiser_id": organiser_id, "status": status.value, "status_reason": reason}


def _decision_reason() -> str | None:
    raw = app.current_event.json_body if app.current_event.body else None
    if not raw:
        return None
    try:
        return OrganiserDecisionRequest.model_validate(raw).reason
    except ValidationError as exc:
        raise BadRequestError(validation_message(exc)) from exc


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
    require_admin_id()
    page, page_size = parse_pagination(app.current_event.query_string_parameters or {})

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
                "payment_ref": o.payment_gateway_ref,
                "payment_status": o.payment_status.value,
                "created_at": o.created_at.isoformat(),
            }
            for o in orders
        ]

    return {"transactions": results, "page": page, "page_size": page_size}


@app.get("/admin/organisers/<organiser_id>")
def admin_get_organiser(organiser_id: str):
    require_admin_id()
    with get_session() as session:
        organiser = session.get(Organiser, parse_uuid(organiser_id))
        if organiser is None:
            raise NotFoundError("Organiser not found")
        return svc.organiser_profile_dict(organiser)


@app.patch("/admin/organisers/<organiser_id>")
def admin_update_organiser(organiser_id: str):
    """Super admin edits an organiser's name, contact and public page (logo,
    cover, bio, links) on their behalf."""
    require_admin_id()
    body = _parse_body(OrganiserProfileUpdate)
    with get_session() as session:
        organiser = session.get(Organiser, parse_uuid(organiser_id))
        if organiser is None:
            raise NotFoundError("Organiser not found")
        svc.apply_organiser_profile(session, organiser, body)
        return svc.organiser_profile_dict(organiser)


@app.post("/admin/organisers/<organiser_id>/image-upload-url")
def admin_organiser_image_upload_url(organiser_id: str):
    """Presigned PUT for an organiser's logo or cover (?kind=logo|cover)."""
    require_admin_id()
    organiser_uuid = parse_uuid(organiser_id)
    kind = (app.current_event.query_string_parameters or {}).get("kind", "logo")
    if kind not in ("logo", "cover"):
        raise BadRequestError("kind must be logo or cover")
    put_url, image_url = upload_url(organiser_uuid, f"organiser-{kind}/")
    return {"upload_url": put_url, "image_url": image_url}


# --- Admin: transaction queries raised by buyers (0009) ---

_QUERY_LABELS = {"payment": "Payment issue", "details": "Wrong details", "cancellation": "Cancellation", "other": "Other"}


@app.get("/admin/queries")
def list_order_queries():
    """Buyer queries about transactions, newest first. ?status=open|resolved|all
    (default open)."""
    require_admin_id()
    params = app.current_event.query_string_parameters or {}
    status = params.get("status") or "open"
    if status not in ("open", "resolved", "all"):
        raise BadRequestError("status must be open, resolved or all")
    query = (
        select(OrderQuery)
        .options(selectinload(OrderQuery.order).selectinload(Order.event))
        .order_by(OrderQuery.created_at.desc())
        .limit(200)
    )
    if status != "all":
        query = query.where(OrderQuery.status == status)
    with get_session() as session:
        rows = session.execute(query).scalars().all()
        return {
            "queries": [
                {
                    "id": str(q.id),
                    "order_id": str(q.order_id),
                    "order_code": short_code(q.order_id),
                    "payment_ref": q.order.payment_gateway_ref if q.order else None,
                    "event_title": q.order.event.title if q.order and q.order.event else None,
                    "buyer_name": q.order.buyer_name if q.order else None,
                    "buyer_email": q.order.buyer_email if q.order else None,
                    "buyer_phone": q.order.buyer_phone if q.order else None,
                    "category": q.category,
                    "category_label": _QUERY_LABELS.get(q.category, q.category),
                    "message": q.message,
                    "status": q.status,
                    "created_at": q.created_at.isoformat() if q.created_at else None,
                    "resolved_at": q.resolved_at.isoformat() if q.resolved_at else None,
                }
                for q in rows
            ]
        }


@app.post("/admin/queries/<query_id>/resolve")
def resolve_order_query(query_id: str):
    require_admin_id()
    with get_session() as session:
        q = session.get(OrderQuery, parse_uuid(query_id))
        if q is None:
            raise NotFoundError("Query not found")
        q.status = "resolved"
        q.resolved_at = utcnow()
    return {"id": query_id, "status": "resolved"}


# --- Admin: refunds (authenticated) ---


@app.get("/admin/refunds")
def list_refunds():
    require_admin_id()

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
    admin_id = require_admin_id()
    refund_uuid = parse_uuid(refund_id)

    with get_session() as session:
        refund = session.get(RefundRequest, refund_uuid, options=[selectinload(RefundRequest.order)])
        if refund is None:
            raise NotFoundError("Refund request not found")
        if refund.status != RefundStatus.PENDING:
            raise ConflictError(f"Refund request already {refund.status.value}")

        refund.status = RefundStatus.APPROVED
        refund.resolved_at = utcnow()
        refund.resolved_by = admin_id
        if refund.order:
            refund.order.payment_status = PaymentStatus.REFUNDED

    return {"refund_request_id": refund_id, "status": RefundStatus.APPROVED.value}


@app.post("/admin/refunds/<refund_id>/reject")
def reject_refund(refund_id: str):
    admin_id = require_admin_id()
    body = _parse_body(RefundResolveRequest)
    refund_uuid = parse_uuid(refund_id)

    with get_session() as session:
        refund = session.get(RefundRequest, refund_uuid)
        if refund is None:
            raise NotFoundError("Refund request not found")
        if refund.status != RefundStatus.PENDING:
            raise ConflictError(f"Refund request already {refund.status.value}")

        refund.status = RefundStatus.REJECTED
        refund.rejection_reason = body.reason
        refund.resolved_at = utcnow()
        refund.resolved_by = admin_id

    return {"refund_request_id": refund_id, "status": RefundStatus.REJECTED.value}
