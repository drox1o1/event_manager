"""Organiser-facing routes: the caller's own account/profile and their own
events (scoped by organiser_id, gated on approval where noted). The
underlying event/tier/form/attendee logic lives in events_service and is
shared with the admin_routes equivalents under /admin/events/*.
"""

import events_service as svc
from app import app
from app import parse_request_body as _parse_body
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, NotFoundError
from common.db import get_session
from common.helpers import ConflictError, parse_pagination, parse_uuid, utcnow
from common.models import Event, EventStatus, Order, Organiser
from common.schemas import (
    EventCreateRequest,
    EventImagesReplaceRequest,
    EventUpdateRequest,
    FormFieldsReplaceRequest,
    OrganiserProfileUpdate,
    TicketTiersCreateRequest,
    TicketTierUpdate,
)
from context import require_organiser_id
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uploads import upload_url

# --- Organiser: account + public profile ---


@app.get("/organiser/me")
def get_organiser_me():
    organiser_id = require_organiser_id()
    with get_session() as session:
        organiser = session.get(Organiser, organiser_id)
        if organiser is None:
            raise NotFoundError("Organiser not found")
        return svc.organiser_profile_dict(organiser)


@app.patch("/organiser/me")
def update_organiser_me():
    organiser_id = require_organiser_id()
    body = _parse_body(OrganiserProfileUpdate)
    with get_session() as session:
        organiser = session.get(Organiser, organiser_id)
        if organiser is None:
            raise NotFoundError("Organiser not found")
        svc.apply_organiser_profile(session, organiser, body)
        return svc.organiser_profile_dict(organiser)


@app.post("/organiser/me/image-upload-url")
def organiser_image_upload_url():
    """Presigned PUT for the organiser page logo or cover (?kind=logo|cover)."""
    organiser_id = require_organiser_id()
    kind = (app.current_event.query_string_parameters or {}).get("kind", "logo")
    if kind not in ("logo", "cover"):
        raise BadRequestError("kind must be logo or cover")
    put_url, image_url = upload_url(organiser_id, f"organiser-{kind}/")
    return {"upload_url": put_url, "image_url": image_url}


# --- Organiser events (authenticated) ---


@app.post("/organiser/events")
def create_event():
    body = _parse_body(EventCreateRequest)
    with get_session() as session:
        organiser_id = svc.require_approved_organiser(session)
        event_id = svc.create_event_impl(body, organiser_id, session)
    return {"event_id": str(event_id), "status": EventStatus.DRAFT.value}, 201


@app.post("/organiser/events/<event_id>/submit")
def submit_event(event_id: str):
    event_uuid = parse_uuid(event_id)

    with get_session() as session:
        organiser_id = svc.require_approved_organiser(session)
        event = svc.load_event_for(session, event_uuid, organiser_id, (selectinload(Event.ticket_tiers),))
        if event.status not in (EventStatus.DRAFT, EventStatus.REJECTED):
            raise ConflictError(f"Cannot submit an event in status={event.status.value}")
        blockers = svc.publish_blockers(event)
        if blockers:
            raise BadRequestError("; ".join(blockers))

        event.status = EventStatus.REVIEW
        event.submitted_at = utcnow()
        event.rejection_reason = None

    return {"event_id": event_id, "status": EventStatus.REVIEW.value}


@app.get("/organiser/events")
def list_organiser_events():
    organiser_id = require_organiser_id()
    page, page_size = parse_pagination(app.current_event.query_string_parameters or {})

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
        results = [svc.organiser_event_summary(e) for e in events]

    return {"events": results, "page": page, "page_size": page_size}


@app.get("/organiser/events/<event_id>")
def get_organiser_event(event_id: str):
    return svc.event_detail_impl(event_id, require_organiser_id())


@app.patch("/organiser/events/<event_id>")
def update_event(event_id: str):
    body = _parse_body(EventUpdateRequest)
    with get_session() as session:
        organiser_id = svc.require_approved_organiser(session)
        return svc.update_event_impl(event_id, body, organiser_id, session)


@app.delete("/organiser/events/<event_id>")
def delete_draft_event(event_id: str):
    event_uuid = parse_uuid(event_id)
    with get_session() as session:
        organiser_id = svc.require_approved_organiser(session)
        event = svc.load_event_for(session, event_uuid, organiser_id)
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
        organiser_id = svc.require_approved_organiser(session)
        return {"ticket_tiers": svc.create_tiers_impl(event_id, body, organiser_id, session)}, 201


@app.put("/organiser/events/<event_id>/ticket-tiers/<tier_id>")
def update_ticket_tier(event_id: str, tier_id: str):
    body = _parse_body(TicketTierUpdate)
    with get_session() as session:
        organiser_id = svc.require_approved_organiser(session)
        return svc.update_tier_impl(event_id, tier_id, body, organiser_id, session)


@app.delete("/organiser/events/<event_id>/ticket-tiers/<tier_id>")
def delete_ticket_tier(event_id: str, tier_id: str):
    with get_session() as session:
        organiser_id = svc.require_approved_organiser(session)
        return svc.delete_tier_impl(event_id, tier_id, organiser_id, session)


@app.post("/organiser/events/<event_id>/banner-upload-url")
def create_banner_upload_url(event_id: str):
    """Presigned PUT against BannersBucket -- the frontend PUTs the file
    directly to S3, then PATCHes the event with the returned banner_image_url."""
    event_uuid = parse_uuid(event_id)
    with get_session() as session:
        svc.load_event_for(session, event_uuid, require_organiser_id())
    put_url, banner_image_url = upload_url(event_uuid)
    return {"upload_url": put_url, "banner_image_url": banner_image_url}


@app.get("/organiser/events/<event_id>/form-fields")
def list_form_fields(event_id: str):
    return svc.list_form_fields_impl(event_id, require_organiser_id())


@app.put("/organiser/events/<event_id>/form-fields")
def replace_form_fields(event_id: str):
    """Replace-all: the builder UI always sends the full ordered set on save."""
    body = _parse_body(FormFieldsReplaceRequest)
    with get_session() as session:
        organiser_id = svc.require_approved_organiser(session)
        return svc.replace_form_fields_impl(event_id, body, organiser_id, session)


@app.post("/organiser/events/<event_id>/image-upload-url")
def create_image_upload_url(event_id: str):
    event_uuid = parse_uuid(event_id)
    with get_session() as session:
        svc.load_event_for(session, event_uuid, require_organiser_id())
    put_url, image_url = upload_url(event_uuid, "gallery/")
    return {"upload_url": put_url, "image_url": image_url}


@app.put("/organiser/events/<event_id>/images")
def replace_event_images(event_id: str):
    """Replace the event's gallery images (max 3, enforced by the schema)."""
    body = _parse_body(EventImagesReplaceRequest)
    with get_session() as session:
        organiser_id = svc.require_approved_organiser(session)
        return svc.replace_images_impl(event_id, body, organiser_id, session)


@app.get("/organiser/events/<event_id>/attendees")
def list_attendees(event_id: str):
    """Registrations list, or with ?format=csv|xlsx (&status=) the export file."""
    params = app.current_event.query_string_parameters or {}
    if params.get("format"):
        return svc.export_attendees_impl(event_id, require_organiser_id(), params["format"], params.get("status"))
    return svc.attendees_impl(event_id, require_organiser_id())


@app.post("/organiser/events/<event_id>/tickets/<ticket_id>/approve")
def approve_ticket(event_id: str, ticket_id: str):
    return svc.ticket_decision_impl(event_id, ticket_id, "approved", require_organiser_id())


@app.post("/organiser/events/<event_id>/tickets/<ticket_id>/reject")
def reject_ticket(event_id: str, ticket_id: str):
    return svc.ticket_decision_impl(event_id, ticket_id, "rejected", require_organiser_id())
