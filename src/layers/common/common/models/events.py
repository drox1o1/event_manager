"""Event authoring: categories, the event itself, its registration-form
fields, and its gallery images. Ticketing (TicketTier/Ticket) and checkout
(Order and friends) live in tickets.py/orders.py -- this file is the
organiser-authoring side only."""

import datetime as dt
import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    Time,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, _uuid_pk

if TYPE_CHECKING:
    # Only for the Mapped[...] forward refs below -- resolved at runtime via
    # SQLAlchemy's registry (see the package __init__'s docstring), these
    # imports exist purely so static analysis (ruff, mypy) can see the names.
    from .auth import Organiser
    from .orders import Order
    from .tickets import TicketTier


class EventStatus(str, enum.Enum):
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    REJECTED = "rejected"
    LIVE = "live"
    SOLDOUT = "soldout"
    DEACTIVATED = "deactivated"


class FormFieldType(str, enum.Enum):
    """Generic registration-form input types the organiser builder offers.

    Deliberately not domain-named (no "tshirt"/"blood_group" types) -- an
    organiser composes any field they need out of these three primitives:
    a free-text answer, a single choice, or multiple choices.
    """

    TEXT = "text"
    SINGLE_CHOICE = "single_choice"
    MULTI_CHOICE = "multi_choice"
    # 0008: typed inputs. DATE = any date (calendar picker); DOB = date of
    # birth, used for per-ticket age limits; PHONE = contact number, digits only.
    DATE = "date"
    DOB = "dob"
    PHONE = "phone"


# 0010: every category an event is listed under (includes the primary
# events.category_id). Lets one event appear under e.g. Marathon AND Sports.
event_categories = Table(
    "event_categories",
    Base.metadata,
    Column("event_id", UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
    Column("category_id", UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Lucide icon name (kebab-case, e.g. "bike", "medal") shown next to the
    # category on the public site; null falls back to a generic tag icon.
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)

    events: Mapped[list["Event"]] = relationship(back_populates="category")


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = _uuid_pk()
    # Nullable since 0006: a super admin can create a platform-hosted event
    # with no organiser attached.
    organiser_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organisers.id"), nullable=True)
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
    # --- 0006: allevents-style create flow ---
    location_type: Mapped[str] = mapped_column(String(20), nullable=False, default="venue")  # venue|online|recorded
    online_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    end_date: Mapped[dt.date | None] = mapped_column(Date, nullable=True)
    end_time: Mapped[dt.time | None] = mapped_column(Time, nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="Asia/Kolkata")
    schedule_type: Mapped[str] = mapped_column(String(20), nullable=False, default="single")  # single|recurring
    recurrence: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # {frequency, weekdays, until}
    listing_type: Mapped[str] = mapped_column(String(20), nullable=False, default="public")  # public|private
    allow_discussions: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    promo_video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    featured_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    featured_headline: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # 0009: the hero is banner-only; clicking it goes here (else the event page).
    featured_link_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    featured_mobile_banner_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
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
    # All listing categories (primary included); eager so every read has them.
    categories: Mapped[list["Category"]] = relationship(secondary=event_categories, lazy="selectin")
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
        Enum(FormFieldType, name="form_field_type", values_callable=lambda cls: [e.value for e in cls]),
        nullable=False,
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
