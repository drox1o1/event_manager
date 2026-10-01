"""Super-admin-controlled config and public-facing content: platform-wide
settings, the homepage CMS, and freeform site pages."""

import datetime as dt
import enum
import uuid

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, _uuid_pk


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


class PlatformSettings(Base):
    """Single-row config table — enforced at the application layer, not the DB layer."""

    __tablename__ = "platform_settings"

    id: Mapped[uuid.UUID] = _uuid_pk()
    commission_pct: Mapped[Numeric] = mapped_column(Numeric(5, 2), nullable=False, default=8)
    buyer_fee_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    auto_payout_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    email_sender_name: Mapped[str] = mapped_column(String(200), nullable=False, default="Showtik")
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
    # Site-wide chrome, also super-admin controlled (0005): the public
    # footer's tagline/columns and the city list shown in the navbar dropdown
    # and event-listing city filter.
    footer_tagline: Mapped[str | None] = mapped_column(String(300), nullable=True)
    footer_columns: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # [{title, links:[{label, href}]}]
    active_cities: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # ["Mumbai", "Delhi", ...]
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SitePage(Base):
    """A freeform title/body content page (About, Careers, Help centre...),
    addressed by slug. Fully admin-managed: create, edit, or delete any page;
    the public site fetches by slug and 404s if one doesn't exist."""

    __tablename__ = "site_pages"

    id: Mapped[uuid.UUID] = _uuid_pk()
    slug: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
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
        Enum(HomepageSectionType, name="homepage_section_type", values_callable=lambda cls: [e.value for e in cls]),
        nullable=False,
    )
    mode: Mapped[HomepageSectionMode] = mapped_column(
        Enum(HomepageSectionMode, name="homepage_section_mode", values_callable=lambda cls: [e.value for e in cls]),
        nullable=False,
        default=HomepageSectionMode.AUTO,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # 0009: auto event rows can be limited to one category ("Marathon" row).
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
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
