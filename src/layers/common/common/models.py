"""SQLAlchemy models — the full CyRokx schema (11 tables).

Only a subset (organisers, admin_users, categories, events, ticket_tiers,
activity_log) has real business logic wired up in this pass. The rest
(orders, order_items, tickets, refund_requests, platform_settings) are
defined now because the schema is fully specified from the design review,
ready for the payment and remaining-routes follow-up passes.
"""

import datetime as dt
import enum
import uuid

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class OrganiserStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    SUSPENDED = "suspended"


class EventStatus(str, enum.Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    REJECTED = "rejected"
    LIVE = "live"
    SOLDOUT = "soldout"
    DEACTIVATED = "deactivated"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


class RefundStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Organiser(Base):
    __tablename__ = "organisers"

    id: Mapped[uuid.UUID] = _uuid_pk()
    org_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[OrganiserStatus] = mapped_column(
        Enum(OrganiserStatus, name="organiser_status"),
        nullable=False,
        default=OrganiserStatus.PENDING,
    )
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    events: Mapped[list["Event"]] = relationship(back_populates="organiser")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[uuid.UUID] = _uuid_pk()
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="super_admin")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    events: Mapped[list["Event"]] = relationship(back_populates="category")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = _uuid_pk()
    organiser_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organisers.id"), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    event_date: Mapped[dt.date] = mapped_column(Date, nullable=False)
    event_time: Mapped[dt.time] = mapped_column(Time, nullable=False)
    venue_name: Mapped[str] = mapped_column(String(200), nullable=False)
    venue_address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    banner_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, name="event_status"), nullable=False, default=EventStatus.DRAFT
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admin_users.id"), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    organiser: Mapped["Organiser"] = relationship(back_populates="events")
    category: Mapped["Category"] = relationship(back_populates="events")
    ticket_tiers: Mapped[list["TicketTier"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )
    orders: Mapped[list["Order"]] = relationship(back_populates="event")


class TicketTier(Base):
    __tablename__ = "ticket_tiers"

    id: Mapped[uuid.UUID] = _uuid_pk()
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False)
    quantity_total: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_sold: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sale_start: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sale_end: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event: Mapped["Event"] = relationship(back_populates="ticket_tiers")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="ticket_tier")


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = _uuid_pk()
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=False)
    buyer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    buyer_email: Mapped[str] = mapped_column(String(320), nullable=False)
    buyer_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    subtotal: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False)
    booking_fee: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total_amount: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False)
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status"),
        nullable=False,
        default=PaymentStatus.PENDING,
    )
    payment_gateway_ref: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event: Mapped["Event"] = relationship(back_populates="orders")
    order_items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    refund_requests: Mapped[list["RefundRequest"]] = relationship(back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = _uuid_pk()
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False)
    ticket_tier_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ticket_tiers.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False)

    order: Mapped["Order"] = relationship(back_populates="order_items")
    ticket_tier: Mapped["TicketTier"] = relationship(back_populates="order_items")
    tickets: Mapped[list["Ticket"]] = relationship(
        back_populates="order_item", cascade="all, delete-orphan"
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = _uuid_pk()
    order_item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("order_items.id"), nullable=False)
    qr_code_token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    checked_in: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    checked_in_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    order_item: Mapped["OrderItem"] = relationship(back_populates="tickets")


class RefundRequest(Base):
    __tablename__ = "refund_requests"

    id: Mapped[uuid.UUID] = _uuid_pk()
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[RefundStatus] = mapped_column(
        Enum(RefundStatus, name="refund_status"), nullable=False, default=RefundStatus.PENDING
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    requested_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("admin_users.id"), nullable=True)

    order: Mapped["Order"] = relationship(back_populates="refund_requests")


class PlatformSettings(Base):
    """Single-row config table — enforced at the application layer, not the DB layer."""

    __tablename__ = "platform_settings"

    id: Mapped[uuid.UUID] = _uuid_pk()
    commission_pct: Mapped[Numeric] = mapped_column(Numeric(5, 2), nullable=False, default=8)
    buyer_fee_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    auto_payout_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    email_sender_name: Mapped[str] = mapped_column(String(200), nullable=False, default="CyRokx")
    email_reply_to: Mapped[str | None] = mapped_column(String(320), nullable=True)
    email_footer_note: Mapped[str | None] = mapped_column(Text, nullable=True)


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id: Mapped[uuid.UUID] = _uuid_pk()
    actor_type: Mapped[str] = mapped_column(String(20), nullable=False)  # organiser | admin | system
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    related_event_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("events.id"), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
