"""Identity: who can sign in and act on the platform -- organisers (the
event hosts) and admin_users (the super-admin operators)."""

import datetime as dt
import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, _uuid_pk

if TYPE_CHECKING:
    # Only for the Mapped["Event"] forward-ref below -- resolved at runtime
    # via SQLAlchemy's registry (see the package __init__'s docstring), this
    # import exists purely so static analysis (ruff, mypy) can see the name.
    from .events import Event


class OrganiserStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    SUSPENDED = "suspended"


class Organiser(Base):
    __tablename__ = "organisers"

    id: Mapped[uuid.UUID] = _uuid_pk()
    org_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    # PENDING = signed up, awaiting super-admin approval (cannot create
    # events); VERIFIED = approved by a super admin; SUSPENDED = blocked (also
    # used for a rejected application, with status_reason explaining why).
    # Email verification is tracked separately (0006) so confirming an email
    # never bypasses the admin approval gate.
    status: Mapped[OrganiserStatus] = mapped_column(
        Enum(OrganiserStatus, name="organiser_status", values_callable=lambda cls: [e.value for e in cls]),
        nullable=False,
        default=OrganiserStatus.PENDING,
    )
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Public organiser page (0006).
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cover_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    instagram_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    events: Mapped[list["Event"]] = relationship(back_populates="organiser")


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[uuid.UUID] = _uuid_pk()
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="super_admin")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
