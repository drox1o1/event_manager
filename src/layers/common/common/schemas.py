"""Pydantic request/response models for the representative-slice endpoints."""

import datetime as dt
import uuid
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

FormFieldTypeStr = Literal["text", "single_choice", "multi_choice"]

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

    model_config = {"from_attributes": True}


class EventSummary(BaseModel):
    id: uuid.UUID
    title: str
    category: str | None = None
    city: str
    event_date: dt.date
    price_from: Decimal | None = None
    sold_out: bool = False

    model_config = {"from_attributes": True}


class EventDetail(EventSummary):
    description: str
    event_time: dt.time
    venue_name: str
    venue_address: str
    banner_image_url: str | None = None
    gallery_images: list[str] = []
    ticket_tiers: list[TicketTierSummary] = []


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


class EventCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category_id: uuid.UUID
    description: str = Field(min_length=1)
    event_date: dt.date
    event_time: dt.time
    venue_name: str = Field(min_length=1, max_length=200)
    venue_address: str = Field(min_length=1)
    city: str = Field(min_length=1, max_length=100)
    capacity: int = Field(gt=0)


# --- Moderation (admin) ---


class ModerationRejectRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


# --- Categories ---


class CategorySummary(BaseModel):
    id: uuid.UUID
    name: str
    sort_order: int = 0

    model_config = {"from_attributes": True}


# --- Checkout (public, test-mode -- see public_api/handler.py::checkout) ---


class CheckoutItem(BaseModel):
    ticket_tier_id: uuid.UUID
    quantity: int = Field(gt=0, le=20)


class FormResponseInput(BaseModel):
    field_id: uuid.UUID
    answer: str | list[str]


class CheckoutRequest(BaseModel):
    buyer_name: str = Field(min_length=1, max_length=200)
    buyer_email: EmailStr
    buyer_phone: str = Field(min_length=1, max_length=20)
    items: list[CheckoutItem] = Field(min_length=1)
    form_responses: list[FormResponseInput] = []


class RefundRequestCreate(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


class RefundResolveRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


# --- Events (organiser: edit + ticket tiers + banner) ---


class EventUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    category_id: uuid.UUID | None = None
    description: str | None = Field(default=None, min_length=1)
    event_date: dt.date | None = None
    event_time: dt.time | None = None
    venue_name: str | None = Field(default=None, min_length=1, max_length=200)
    venue_address: str | None = Field(default=None, min_length=1)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    capacity: int | None = Field(default=None, gt=0)
    banner_image_url: str | None = None


class TicketTierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    price: Decimal = Field(ge=0)
    quantity_total: int = Field(gt=0)
    sale_start: dt.datetime | None = None
    sale_end: dt.datetime | None = None


class TicketTiersCreateRequest(BaseModel):
    tiers: list[TicketTierCreate] = Field(min_length=1)


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


class HomepageSettingsInput(BaseModel):
    hero_eyebrow: str = Field(min_length=1, max_length=200)
    hero_headline: str = Field(min_length=1, max_length=200)
    hero_subheadline: str | None = None
    hero_search_enabled: bool = True
    banner_enabled: bool = False
    banner_text: str | None = None
    banner_link_url: str | None = Field(default=None, max_length=500)


class HomepageSectionInput(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    section_type: HomepageSectionTypeStr
    mode: HomepageSectionModeStr = "auto"
    enabled: bool = True
    event_ids: list[uuid.UUID] = Field(default_factory=list, max_length=24)

    @model_validator(mode="after")
    def _only_event_sections_curate(self) -> "HomepageSectionInput":
        if self.section_type == "category_grid":
            # A category grid has no event list; force auto + drop any picks.
            self.mode = "auto"
            self.event_ids = []
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
