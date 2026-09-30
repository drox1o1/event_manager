"""Ticketing: the priced/free/donation tiers an organiser defines for an
event, and the individual tickets issued to attendees at checkout."""

import datetime as dt
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, _uuid_pk

if TYPE_CHECKING:
    # Only for the Mapped[...] forward refs below -- resolved at runtime via
    # SQLAlchemy's registry (see the package __init__'s docstring), these
    # imports exist purely so static analysis (ruff, mypy) can see the names.
    from .events import Event
    from .orders import OrderItem


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
    # --- 0006 ---
    ticket_type: Mapped[str] = mapped_column(String(20), nullable=False, default="paid")  # paid|free|donation
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    min_per_order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    max_per_order: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    # 0008: age limits, checked against each participant's date of birth on
    # the event date (e.g. Full Marathon 18+). NULL = no limit.
    min_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    requires_approval: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    group_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sale_status: Mapped[str] = mapped_column(String(20), nullable=False, default="on_sale")  # on_sale|paused
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event: Mapped["Event"] = relationship(back_populates="ticket_tiers")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="ticket_tier")


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = _uuid_pk()
    order_item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("order_items.id"), nullable=False)
    qr_code_token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    checked_in: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    checked_in_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # --- 0006: one ticket per participant, each with its own details ---
    attendee_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    attendee_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    attendee_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    attendee_answers: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [{field_label, answer}]
    approval_status: Mapped[str] = mapped_column(String(20), nullable=False, default="approved")  # approved|pending|rejected

    order_item: Mapped["OrderItem"] = relationship(back_populates="tickets")
