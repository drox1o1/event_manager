"""Pydantic request/response models for the representative-slice endpoints."""

import datetime as dt
import re
import uuid
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

FormFieldTypeStr = Literal["text", "single_choice", "multi_choice", "date", "dob", "phone"]

# --- Auth ---


class OrganiserSignupRequest(BaseModel):
    contact_name: str = Field(min_length=1, max_length=200)
    org_name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# --- Events (public) ---


class TicketTierSummary(BaseModel):
    id: uuid.UUID
    name: str
    price: Decimal
    quantity_total: int
    quantity_sold: int
    ticket_type: str = "paid"
    description: str | None = None
    min_per_order: int = 1
    max_per_order: int = 10
    min_age: int | None = None
    max_age: int | None = None
    requires_approval: bool = False
    group_name: str | None = None
    sale_status: str = "on_sale"
    sort_order: int = 0

    model_config = {"from_attributes": True}


class EventSummary(BaseModel):
    id: uuid.UUID
    title: str
    category: str | None = None
    city: str
    event_date: dt.date
    price_from: Decimal | None = None
    sold_out: bool = False
    event_time: dt.time | None = None
    venue_name: str | None = None
    banner_image_url: str | None = None
    location_type: str = "venue"

    model_config = {"from_attributes": True}


class OrganiserPublicSummary(BaseModel):
    id: uuid.UUID
    org_name: str
    logo_url: str | None = None


class EventDetail(EventSummary):
    description: str
    event_time: dt.time
    venue_name: str
    venue_address: str
    banner_image_url: str | None = None
    gallery_images: list[str] = []
    ticket_tiers: list[TicketTierSummary] = []
    end_date: dt.date | None = None
    end_time: dt.time | None = None
    timezone: str = "Asia/Kolkata"
    schedule_type: str = "single"
    recurrence: dict | None = None
    allow_discussions: bool = True
    promo_video_url: str | None = None
    tags: list[str] = []
    organiser: OrganiserPublicSummary | None = None


# --- Registration form builder ---


class FormFieldInput(BaseModel):
    """One field in an organiser's registration form (builder payload)."""

    label: str = Field(min_length=1, max_length=200)
    field_type: FormFieldTypeStr
    options: list[str] | None = None
    required: bool = False
    sort_order: int = 0

    @field_validator("options")
    @classmethod
    def _clean_options(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        cleaned = [o.strip() for o in v if o and o.strip()]
        return cleaned or None

    @model_validator(mode="after")
    def _check_options_match_type(self) -> "FormFieldInput":
        if self.field_type in ("single_choice", "multi_choice"):
            if not self.options or len(self.options) < 1:
                raise ValueError(f"{self.field_type} fields need at least one option")
        else:  # text -- options are meaningless, drop any that slipped through
            self.options = None
        return self


class FormFieldsReplaceRequest(BaseModel):
    """Replace-all payload: the full ordered list of fields for an event."""

    fields: list[FormFieldInput] = Field(max_length=50)

    @model_validator(mode="after")
    def _single_dob(self) -> "FormFieldsReplaceRequest":
        # Ticket age limits read the one date-of-birth answer per participant.
        if sum(1 for f in self.fields if f.field_type == "dob") > 1:
            raise ValueError("A form can only have one Date of birth question")
        return self


class FormFieldResponse(BaseModel):
    id: uuid.UUID
    label: str
    field_type: str
    options: list[str] | None = None
    required: bool
    sort_order: int

    model_config = {"from_attributes": True}


# --- Event gallery images ---


class EventImageInput(BaseModel):
    image_url: str = Field(min_length=1, max_length=500)
    sort_order: int = 0


class EventImagesReplaceRequest(BaseModel):
    images: list[EventImageInput] = Field(max_length=3)


# --- Events (organiser) ---


LocationTypeStr = Literal["venue", "online", "recorded"]
ScheduleTypeStr = Literal["single", "recurring"]
ListingTypeStr = Literal["public", "private"]


class RecurrenceInput(BaseModel):
    frequency: Literal["daily", "weekly", "monthly"]
    # 0=Mon..6=Sun, only meaningful for weekly
    weekdays: list[int] = Field(default_factory=list, max_length=7)
    until: dt.date

    @field_validator("weekdays")
    @classmethod
    def _check_weekdays(cls, v: list[int]) -> list[int]:
        if any(d < 0 or d > 6 for d in v):
            raise ValueError("weekdays must be 0 (Mon) .. 6 (Sun)")
        return sorted(set(v))


class EventCreateRequest(BaseModel):
    """Basic Info step. Creates a DRAFT; media, tickets and the publish
    settings are added afterwards by the step-by-step editor."""

    title: str = Field(min_length=3, max_length=200)
    category_id: uuid.UUID
    description: str = Field(min_length=20)
    event_date: dt.date
    event_time: dt.time
    end_date: dt.date | None = None
    end_time: dt.time | None = None
    timezone: str = Field(default="Asia/Kolkata", min_length=1, max_length=64)
    location_type: LocationTypeStr = "venue"
    online_url: str | None = Field(default=None, max_length=500)
    venue_name: str | None = Field(default=None, max_length=200)
    venue_address: str | None = None
    city: str = Field(min_length=1, max_length=100)
    capacity: int = Field(default=0, ge=0)
    schedule_type: ScheduleTypeStr = "single"
    recurrence: RecurrenceInput | None = None
    listing_type: ListingTypeStr = "public"
    allow_discussions: bool = True
    promo_video_url: str | None = Field(default=None, max_length=500)
    tags: list[str] = Field(default_factory=list, max_length=12)
    # Admin-only: host the event under this organiser (None = platform-hosted).
    # Ignored on the organiser endpoint.
    organiser_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def _check(self) -> "EventCreateRequest":
        check_event_shape(self)
        return self


# --- Moderation (admin) ---


class ModerationRejectRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


# --- Categories ---


class CategorySummary(BaseModel):
    id: uuid.UUID
    name: str
    sort_order: int = 0
    icon: str | None = None

    model_config = {"from_attributes": True}


class CategoryInput(BaseModel):
    """One row in an admin categories replace-all save. `id` present means
    update that category; `id` omitted/None means create a new one. Any
    existing category whose id is absent from the full list is deleted."""

    id: uuid.UUID | None = None
    name: str = Field(min_length=1, max_length=100)
    icon: str | None = Field(default=None, max_length=50)


class CategoriesReplaceRequest(BaseModel):
    categories: list[CategoryInput] = Field(min_length=1, max_length=100)


# --- Checkout (public, test-mode -- see public_api/handler.py::checkout) ---

_INDIAN_MOBILE_RE = re.compile(r"(?:\+?91)?([6-9]\d{9})")


def normalize_indian_mobile(value: str) -> str | None:
    """'+91 98765-43210' / '919876543210' / '9876543210' -> '+919876543210'.
    None unless it is exactly a 10-digit Indian mobile number (starting 6-9),
    optionally prefixed with the 91 country code. Letters are never accepted."""
    compact = re.sub(r"[\s-]", "", value or "")
    m = _INDIAN_MOBILE_RE.fullmatch(compact)
    return f"+91{m.group(1)}" if m else None



class FormResponseInput(BaseModel):
    field_id: uuid.UUID
    answer: str | list[str]


class AttendeeInput(BaseModel):
    """One participant = one issued ticket. The event's registration form is
    answered per participant (e.g. each runner's T-shirt size / DOB)."""

    name: str = Field(min_length=1, max_length=200)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    form_responses: list[FormResponseInput] = []

    @field_validator("phone")
    @classmethod
    def _mobile(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        normalized = normalize_indian_mobile(v)
        if normalized is None:
            raise ValueError("must be a 10-digit mobile number")
        return normalized


class CheckoutItem(BaseModel):
    ticket_tier_id: uuid.UUID
    quantity: int = Field(gt=0, le=20)
    # Donation tiers: the amount per ticket the buyer chose (>= tier minimum).
    amount: Decimal | None = Field(default=None, ge=0)
    # When given, must contain exactly `quantity` participants.
    attendees: list[AttendeeInput] = []


class CheckoutRequest(BaseModel):
    buyer_name: str = Field(min_length=1, max_length=200)
    buyer_email: EmailStr
    buyer_phone: str = Field(min_length=1, max_length=20)
    items: list[CheckoutItem] = Field(min_length=1, max_length=20)
    form_responses: list[FormResponseInput] = []
    occurrence_date: dt.date | None = None

    @field_validator("buyer_phone")
    @classmethod
    def _buyer_mobile(cls, v: str) -> str:
        normalized = normalize_indian_mobile(v)
        if normalized is None:
            raise ValueError("must be a 10-digit mobile number")
        return normalized


class RefundRequestCreate(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


ORDER_QUERY_CATEGORIES = ("payment", "details", "cancellation", "other")


class OrderQueryCreate(BaseModel):
    """Buyer's 'raise a query about this transaction' (0009)."""

    category: Literal["payment", "details", "cancellation", "other"]
    message: str = Field(min_length=5, max_length=2000)


class RefundResolveRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


# --- Events (organiser: edit + ticket tiers + banner) ---


class EventUpdateRequest(BaseModel):
    """Partial update from any editor step. Cross-field rules (venue vs
    online, end after start) are re-checked by the handler on the merged
    event via check_event_shape."""

    title: str | None = Field(default=None, min_length=3, max_length=200)
    category_id: uuid.UUID | None = None
    description: str | None = Field(default=None, min_length=20)
    event_date: dt.date | None = None
    event_time: dt.time | None = None
    end_date: dt.date | None = None
    end_time: dt.time | None = None
    timezone: str | None = Field(default=None, min_length=1, max_length=64)
    location_type: LocationTypeStr | None = None
    online_url: str | None = Field(default=None, max_length=500)
    venue_name: str | None = Field(default=None, max_length=200)
    venue_address: str | None = None
    city: str | None = Field(default=None, min_length=1, max_length=100)
    capacity: int | None = Field(default=None, ge=0)
    banner_image_url: str | None = None
    schedule_type: ScheduleTypeStr | None = None
    recurrence: RecurrenceInput | None = None
    listing_type: ListingTypeStr | None = None
    allow_discussions: bool | None = None
    promo_video_url: str | None = Field(default=None, max_length=500)
    tags: list[str] | None = Field(default=None, max_length=12)
    organiser_id: uuid.UUID | None = None  # admin only


def check_event_shape(e) -> None:
    """Cross-field rules shared by create (on the request) and update (on the
    merged ORM row). Raises ValueError with a user-facing message."""
    loc = getattr(e, "location_type", "venue") or "venue"
    if loc == "venue":
        if not (getattr(e, "venue_name", None) or "").strip():
            raise ValueError("Venue name is required for an in-person event")
        if not (getattr(e, "venue_address", None) or "").strip():
            raise ValueError("Venue address is required for an in-person event")
    elif loc == "online":
        url = (getattr(e, "online_url", None) or "").strip()
        if not url.startswith(("http://", "https://")):
            raise ValueError("A valid online event link (https://...) is required")
    end_date = getattr(e, "end_date", None)
    if end_date is not None:
        if end_date < e.event_date:
            raise ValueError("End date can't be before the start date")
        end_time = getattr(e, "end_time", None)
        if end_date == e.event_date and end_time is not None and end_time <= e.event_time:
            raise ValueError("End time must be after the start time")
    if getattr(e, "schedule_type", "single") == "recurring":
        rec = getattr(e, "recurrence", None)
        if not rec:
            raise ValueError("Choose how often a recurring event repeats")
        until = rec["until"] if isinstance(rec, dict) else rec.until
        if isinstance(until, str):
            until = dt.date.fromisoformat(until)
        if until < e.event_date:
            raise ValueError("A recurring event must repeat until on/after its start date")


TicketTypeStr = Literal["paid", "free", "donation"]


class TicketTierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    ticket_type: TicketTypeStr = "paid"
    # paid: the ticket price (>0); free: forced to 0; donation: the minimum amount.
    price: Decimal = Field(default=Decimal("0"), ge=0)
    quantity_total: int = Field(gt=0, le=100000)
    description: str | None = Field(default=None, max_length=500)
    min_per_order: int = Field(default=1, ge=1, le=100)
    max_per_order: int = Field(default=10, ge=1, le=100)
    min_age: int | None = Field(default=None, ge=1, le=120)
    max_age: int | None = Field(default=None, ge=1, le=120)
    requires_approval: bool = False
    group_name: str | None = Field(default=None, max_length=100)
    sale_status: Literal["on_sale", "paused"] = "on_sale"
    sale_start: dt.datetime | None = None
    sale_end: dt.datetime | None = None

    @model_validator(mode="after")
    def _check(self) -> "TicketTierCreate":
        if self.ticket_type == "free":
            self.price = Decimal("0")
        elif self.ticket_type == "paid" and self.price <= 0:
            raise ValueError("A paid ticket needs a price above 0")
        if self.min_age is not None and self.max_age is not None and self.min_age > self.max_age:
            raise ValueError("Minimum age can't be higher than the maximum age")
        if self.min_per_order > self.max_per_order:
            raise ValueError("Minimum per order can't exceed the maximum")
        if self.sale_start and self.sale_end and self.sale_end <= self.sale_start:
            raise ValueError("Sale end must be after sale start")
        return self


class TicketTiersCreateRequest(BaseModel):
    tiers: list[TicketTierCreate] = Field(min_length=1)


class TicketTierUpdate(TicketTierCreate):
    """Full replacement of one ticket type (the edit drawer sends every field)."""


class FeatureEventRequest(BaseModel):
    is_featured: bool
    featured_order: int = Field(default=0, ge=0, le=1000)
    featured_headline: str | None = Field(default=None, max_length=200)
    # 0009: banner click target (blank = the event page) + optional phone artwork.
    featured_link_url: str | None = Field(default=None, max_length=500)
    featured_mobile_banner_url: str | None = Field(default=None, max_length=500)


# --- Organiser profile / approval ---


class OrganiserProfileUpdate(BaseModel):
    org_name: str | None = Field(default=None, min_length=1, max_length=200)
    contact_name: str | None = Field(default=None, min_length=1, max_length=200)
    bio: str | None = Field(default=None, max_length=4000)
    logo_url: str | None = Field(default=None, max_length=500)
    cover_url: str | None = Field(default=None, max_length=500)
    website_url: str | None = Field(default=None, max_length=500)
    instagram_url: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=20)
    city: str | None = Field(default=None, max_length=100)


class OrganiserDecisionRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=1000)


# --- Organisers (admin) ---


class OrganiserSummary(BaseModel):
    """Built via explicit kwargs in the handler (o.status.value), not
    model_validate(orm_obj) -- status is a `str, Enum` mixin (see models.py /
    pyproject.toml's UP042 note) and this repo's convention is to always pass
    its .value explicitly rather than lean on Pydantic's enum coercion."""

    id: uuid.UUID
    org_name: str
    contact_name: str
    email: EmailStr
    status: str
    created_at: dt.datetime
    email_verified: bool = False
    status_reason: str | None = None
    approved_at: dt.datetime | None = None
    city: str | None = None
    phone: str | None = None
    logo_url: str | None = None
    events_count: int = 0


# --- Platform settings (admin) ---


class PlatformSettingsResponse(BaseModel):
    commission_pct: Decimal
    buyer_fee_enabled: bool
    auto_payout_enabled: bool
    email_sender_name: str
    email_reply_to: str | None = None
    email_footer_note: str | None = None

    model_config = {"from_attributes": True}


HomepageSectionTypeStr = Literal["category_grid", "featured_events", "trending_events"]
HomepageSectionModeStr = Literal["auto", "curated"]


# --- Homepage CMS (admin) ---


class FooterLinkItem(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    href: str = Field(min_length=1, max_length=300)


class FooterColumnItem(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    links: list[FooterLinkItem] = Field(default_factory=list, max_length=12)


class HomepageSettingsInput(BaseModel):
    hero_eyebrow: str = Field(min_length=1, max_length=200)
    hero_headline: str = Field(min_length=1, max_length=200)
    hero_subheadline: str | None = None
    hero_search_enabled: bool = True
    banner_enabled: bool = False
    banner_text: str | None = None
    banner_link_url: str | None = Field(default=None, max_length=500)
    footer_tagline: str | None = Field(default=None, max_length=300)
    footer_columns: list[FooterColumnItem] = Field(default_factory=list, max_length=8)
    active_cities: list[str] = Field(default_factory=list, max_length=100)


class HomepageSectionInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    section_type: HomepageSectionTypeStr
    mode: HomepageSectionModeStr = "auto"
    enabled: bool = True
    event_ids: list[uuid.UUID] = Field(default_factory=list, max_length=24)
    # Auto event rows only: limit the row to one category (0009).
    category_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def _only_event_sections_curate(self) -> "HomepageSectionInput":
        if self.section_type == "category_grid":
            # A category grid has no event list; force auto + drop any picks.
            self.mode = "auto"
            self.event_ids = []
        if self.section_type == "category_grid" or self.mode == "curated":
            self.category_id = None
        return self


class HomepageReplaceRequest(BaseModel):
    """Replace-all payload for the whole homepage: hero/banner settings plus
    the full ordered list of sections (with curated picks)."""

    settings: HomepageSettingsInput
    sections: list[HomepageSectionInput] = Field(max_length=30)


class PlatformSettingsUpdateRequest(BaseModel):
    commission_pct: Decimal | None = Field(default=None, ge=0, le=100)
    buyer_fee_enabled: bool | None = None
    auto_payout_enabled: bool | None = None
    email_sender_name: str | None = Field(default=None, min_length=1, max_length=200)
    email_reply_to: EmailStr | None = None
    email_footer_note: str | None = None


# --- Site pages (admin CRUD, public read by slug) ---


class SitePageListItem(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    updated_at: dt.datetime

    model_config = {"from_attributes": True}


class SitePageResponse(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    body: str
    updated_at: dt.datetime

    model_config = {"from_attributes": True}


SLUG_PATTERN = r"^[a-z0-9]+(-[a-z0-9]+)*$"


class SitePageUpsertRequest(BaseModel):
    """PUT body for /admin/site-pages/{slug} -- creates the page if that slug
    doesn't exist yet, otherwise updates it in place."""

    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1)
