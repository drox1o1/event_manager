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
    EventStatus,
    Order,
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
            options=[selectinload(Event.ticket_tiers), selectinload(Event.category)],
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
            ticket_tiers=[TicketTierSummary.model_validate(t) for t in event.ticket_tiers],
        )

    return detail.model_dump(mode="json")


@app.get("/categories")
def list_categories():
    with get_session() as session:
        categories = session.execute(select(Category).order_by(Category.sort_order.asc())).scalars().all()
        results = [CategorySummary.model_validate(c).model_dump(mode="json") for c in categories]

    return {"categories": results}


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

        order_id = order.id

    return {"order_id": str(order_id), "payment_status": PaymentStatus.SUCCESS.value}, 201


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
