"""Checkout and its aftermath: orders, the line items and answers captured
at checkout, refund requests, and buyer queries about a transaction."""

import datetime as dt
import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, _uuid_pk

if TYPE_CHECKING:
    # Only for the Mapped[...] forward refs below -- resolved at runtime via
    # SQLAlchemy's registry (see the package __init__'s docstring), these
    # imports exist purely so static analysis (ruff, mypy) can see the names.
    from .events import Event
    from .tickets import Ticket, TicketTier


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


class RefundStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


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
    # 0011: the inventory hold taken at checkout. NULL means no hold applies
    # (free, settled or failed orders). An expired hold simply stops counting
    # against availability -- see common.inventory -- so nothing sweeps these.
    # A lapsed hold is NOT evidence the payment failed: only PayU decides that.
    reserved_until: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # 0011: the resolved ticket plan snapshotted at checkout, replayed verbatim
    # at settlement. Resolved (not the raw request) on purpose -- see the 0011
    # migration docstring.
    pending_items: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    occurrence_date: Mapped[dt.date | None] = mapped_column(Date, nullable=True)  # recurring events (0006)
    # 0009: reserved for promo codes (not built yet) so exports have a fixed shape.
    discount_amount: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    promo_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event: Mapped["Event"] = relationship(back_populates="orders")
    order_items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    refund_requests: Mapped[list["RefundRequest"]] = relationship(back_populates="order")
    form_responses: Mapped[list["OrderFormResponse"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    payment_attempts: Mapped[list["PaymentAttempt"]] = relationship(
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


class PaymentAttempt(Base):
    """One PayU transaction (0011). `txnid` is the idempotency key every
    settlement path looks an order up by -- the browser return, the webhook,
    and the scheduled reconciler all converge on the same row.

    A retry on a failed order creates a *new* attempt with a new txnid rather
    than reusing this one, so the full history stays readable when a buyer
    says they were charged twice. `status` deliberately holds PayU's own
    vocabulary as plain text rather than a Postgres enum -- see 0011.
    """

    __tablename__ = "payment_attempts"

    id: Mapped[uuid.UUID] = _uuid_pk()
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False)
    txnid: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    # What was actually hashed and sent to PayU. The amount that comes back
    # must equal this exactly, or the response is not for what we asked.
    amount: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="initiated")
    mihpayid: Mapped[str | None] = mapped_column(String(100), nullable=True)  # PayU's id; required to refund
    mode: Mapped[str | None] = mapped_column(String(20), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    gateway_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    settled_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped["Order"] = relationship(back_populates="payment_attempts")
    refunds: Mapped[list["PaymentRefund"]] = relationship(back_populates="attempt")


class PaymentRefund(Base):
    """A refund in flight at PayU (0011). Refunds there are asynchronous: the
    API call only queues one, so `status` moves requested -> pending ->
    confirmed as the reconciler follows it up.

    `refund_request_id` is NULL when the system initiated the refund itself --
    a payment that confirmed after its hold had lapsed, for a tier that sold
    out in the meantime. Nobody asked for that one; we owe it anyway.
    """

    __tablename__ = "payment_refunds"

    id: Mapped[uuid.UUID] = _uuid_pk()
    attempt_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("payment_attempts.id"), nullable=False)
    refund_request_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("refund_requests.id"), nullable=True
    )
    amount: Mapped[Numeric] = mapped_column(Numeric(10, 2), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="requested")
    gateway_refund_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    gateway_response: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    confirmed_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    attempt: Mapped["PaymentAttempt"] = relationship(back_populates="refunds")


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


class OrderQuery(Base):
    """A buyer's question about a transaction, raised from the order page
    (0009; replaces the refund-request button). Read and resolved by the
    super admin."""

    __tablename__ = "order_queries"

    id: Mapped[uuid.UUID] = _uuid_pk()
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")  # open|resolved
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped["Order"] = relationship()
