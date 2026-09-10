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
from sqlalchemy.dialects.postgresql import JSONB, UUID
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


class HomepageSectionType(str, enum.Enum):
    """The kinds of content block the homepage CMS can place on the public
    front page. category_grid renders the category tiles; the two *_events
    types render an event row resolved either automatically or from a curated
    pick list (see HomepageSectionMode)."""

    CATEGORY_GRID = "category_grid"
    FEATURED_EVENTS = "featured_events"
    TRENDING_EVENTS = "trending_events"


class HomepageSectionMode(str, enum.Enum):
    AUTO = "auto"        # resolved from live events (most recent)
    CURATED = "curated"  # resolved from the section's hand-picked event list


class FormFieldType(str, enum.Enum):
    """Generic registration-form input types the organiser builder offers.

    Deliberately not domain-named (no "tshirt"/"blood_group" types) -- an
    organiser composes any field they need out of these three primitives:
    a free-text answer, a single choice, or multiple choices.
    """

    TEXT = "text"
    SINGLE_CHOICE = "single_choice"
    MULTI_CHOICE = "multi_choice"


class Organiser(Base):
    __tablename__ = "organisers"

    id: Mapped[uuid.UUID] = _uuid_pk()
    org_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[OrganiserStatus] = mapped_column(
        Enum(OrganiserStatus, name="organiser_status", values_callable=lambda cls: [e.value for e in cls]),
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
        Enum(EventStatus, name="event_status", values_callable=lambda cls: [e.value for e in cls]),
        nullable=False,
        default=EventStatus.DRAFT,
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
    form_fields: Mapped[list["EventFormField"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )
    images: Mapped[list["EventImage"]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )


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


class EventFormField(Base):
    """An organiser-defined registration-form field for an event.

    `options` holds the choice labels for SINGLE_CHOICE / MULTI_CHOICE fields
    and is NULL for TEXT fields (enforced at the application layer, not the DB).
    """

    __tablename__ = "event_form_fields"

    id: Mapped[uuid.UUID] = _uuid_pk()
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    field_type: Mapped[FormFieldType] = mapped_column(
        Enum(FormFieldType, name="form_field_type"), nullable=False
    )
    options: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event: Mapped["Event"] = relationship(back_populates="form_fields")


class EventImage(Base):
    """An additional gallery image shown under the event description
    (separate from the single hero banner_image_url on the event)."""

    __tablename__ = "event_images"

    id: Mapped[uuid.UUID] = _uuid_pk()
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=False)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event: Mapped["Event"] = relationship(back_populates="images")


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
        Enum(PaymentStatus, name="payment_status", values_callable=lambda cls: [e.value for e in cls]),
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
    form_responses: Mapped[list["OrderFormResponse"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )


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


class OrderFormResponse(Base):
    """A buyer's answer to one registration-form field, captured at checkout.

    `field_label` snapshots the field's label at answer time so the response
    stays readable even if the organiser later edits or deletes the field.
    `answer` is a plain string for TEXT / SINGLE_CHOICE and a list of strings
    for MULTI_CHOICE. field_id is nullable + ON DELETE SET NULL so deleting a
    field never orphan-blocks historical responses.
    """

    __tablename__ = "order_form_responses"

    id: Mapped[uuid.UUID] = _uuid_pk()
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False)
    field_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("event_form_fields.id", ondelete="SET NULL"), nullable=True
    )
    field_label: Mapped[str] = mapped_column(String(200), nullable=False)
    answer: Mapped[str | list[str]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    order: Mapped["Order"] = relationship(back_populates="form_responses")


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
        Enum(RefundStatus, name="refund_status", values_callable=lambda cls: [e.value for e in cls]),
        nullable=False,
        default=RefundStatus.PENDING,
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


class HomepageSettings(Base):
    """Single-row config for the public homepage hero + announcement banner,
    controlled from the super-admin CMS. Enforced single-row at the app layer
    (same convention as PlatformSettings)."""

    __tablename__ = "homepage_settings"

    id: Mapped[uuid.UUID] = _uuid_pk()
    hero_eyebrow: Mapped[str] = mapped_column(String(200), nullable=False, default="Discover live events near you")
    hero_headline: Mapped[str] = mapped_column(String(200), nullable=False, default="Find your next night out")
    hero_subheadline: Mapped[str | None] = mapped_column(Text, nullable=True)
    hero_search_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    banner_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    banner_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    banner_link_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class HomepageSection(Base):
    """One content block on the public homepage. Ordered by sort_order; the
    super admin can add, remove, rename, reorder, toggle, and (for event rows)
    switch between automatic and curated content."""

    __tablename__ = "homepage_sections"

    id: Mapped[uuid.UUID] = _uuid_pk()
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    section_type: Mapped[HomepageSectionType] = mapped_column(
        Enum(HomepageSectionType, name="homepage_section_type"), nullable=False
    )
    mode: Mapped[HomepageSectionMode] = mapped_column(
        Enum(HomepageSectionMode, name="homepage_section_mode"),
        nullable=False,
        default=HomepageSectionMode.AUTO,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    events: Mapped[list["HomepageSectionEvent"]] = relationship(
        back_populates="section", cascade="all, delete-orphan"
    )


class HomepageSectionEvent(Base):
    """A curated event pick for a homepage event-row section (ordered)."""

    __tablename__ = "homepage_section_events"

    id: Mapped[uuid.UUID] = _uuid_pk()
    section_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("homepage_sections.id", ondelete="CASCADE"), nullable=False
    )
    event_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("events.id"), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    section: Mapped["HomepageSection"] = relationship(back_populates="events")


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id: Mapped[uuid.UUID] = _uuid_pk()
    actor_type: Mapped[str] = mapped_column(String(20), nullable=False)  # organiser | admin | system
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    related_event_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("events.id"), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
