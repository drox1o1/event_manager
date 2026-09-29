"""Small request/response utilities shared by every API Lambda
(authenticated_api, public_api). Deliberately independent of any one
service's Powertools `app` instance -- callers pass in whatever piece of the
request they need (e.g. an already-extracted JSON body or query-string
dict), so the same functions work regardless of which service imports them.
"""

import datetime as dt
import uuid

from aws_lambda_powertools.event_handler.exceptions import (
    BadRequestError,
    NotFoundError,
    ServiceError,
)
from pydantic import ValidationError

MAX_PAGE_SIZE = 50


class ConflictError(ServiceError):
    """409 -- aws_lambda_powertools only ships 400/401/404/500 built in."""

    def __init__(self, msg: str = "Conflict"):
        super().__init__(409, msg)


class ForbiddenError(ServiceError):
    """403 -- aws_lambda_powertools only ships 400/401/404/500 built in."""

    def __init__(self, msg: str = "Forbidden"):
        super().__init__(403, msg)


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.UTC)


def short_code(value: uuid.UUID) -> str:
    """Human-friendly id shown in the UI (the full UUID stays the real key)."""
    return value.hex[:8].upper()


def parse_uuid(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except ValueError as exc:
        raise NotFoundError("Not found") from exc


# Friendlier names for request fields that surface in error messages.
_FIELD_LABELS = {
    "contact_name": "Full name",
    "org_name": "Organisation name",
    "buyer_name": "Name",
    "buyer_email": "Email",
    "buyer_phone": "Mobile number",
    "phone": "Mobile number",
    "email": "Email",
    "password": "Password",
    "new_password": "New password",
}


def _field_label(loc: tuple) -> str | None:
    """Last named part of a pydantic error location: ("items", 0, "attendees",
    1, "phone") -> "Mobile number". None for model-level (whole-form) errors."""
    name = next((p for p in reversed(loc) if isinstance(p, str)), None)
    if name is None:
        return None
    return _FIELD_LABELS.get(name, name.replace("_", " ").strip().capitalize())


def _error_sentence(err: dict) -> str:
    field = _field_label(tuple(err.get("loc") or ()))
    kind = err.get("type", "")
    ctx = err.get("ctx") or {}
    msg = str(err.get("msg", "is invalid"))
    if kind == "missing":
        text = "is required"
    elif kind == "string_too_short":
        n = ctx.get("min_length", 1)
        text = "is required" if n == 1 else f"must be at least {n} characters"
    elif kind == "string_too_long":
        text = f"must be at most {ctx.get('max_length')} characters"
    elif kind == "too_long":
        text = f"can have at most {ctx.get('max_length')} items"
    elif kind == "too_short":
        text = f"needs at least {ctx.get('min_length')} item{'s' if ctx.get('min_length') != 1 else ''}"
    elif "email" in msg.lower():
        text = "must be a valid email address"
    elif kind in ("literal_error", "enum"):
        text = f"must be one of: {ctx.get('expected', '')}".rstrip(": ")
    elif kind in ("greater_than", "greater_than_equal", "less_than", "less_than_equal"):
        text = msg.lower().replace("input ", "")
    elif kind.endswith("_parsing") or kind.endswith("_type"):
        text = "is not valid"
    else:
        # value_error from our own validators: "Value error, <our message>".
        text = msg.split(", ", 1)[1] if msg.startswith(("Value error, ", "Assertion failed, ")) else msg
    if field is None:
        return text[:1].upper() + text[1:]
    return f"{field} {text}"


def validation_message(exc: ValidationError, limit: int = 3) -> str:
    """Plain-English summary of a pydantic ValidationError for API clients --
    never pydantic's developer dump (type=..., input_value=..., docs URL)."""
    sentences = list(dict.fromkeys(_error_sentence(e) for e in exc.errors()))
    extra = len(sentences) - limit
    text = ". ".join(sentences[:limit])
    return f"{text}{f' (and {extra} more)' if extra > 0 else ''}."


def parse_body(model, raw_body):
    """Validate `raw_body` (a Lambda event's already-parsed JSON, e.g.
    `app.current_event.json_body`) against a pydantic request model."""
    try:
        return model.model_validate(raw_body)
    except ValidationError as exc:
        raise BadRequestError(validation_message(exc)) from exc


def parse_pagination(params: dict, max_page_size: int = MAX_PAGE_SIZE) -> tuple[int, int]:
    try:
        page = max(int(params.get("page", "1")), 1)
        page_size = min(max(int(params.get("page_size", "20")), 1), max_page_size)
    except ValueError as exc:
        raise BadRequestError("page and page_size must be integers") from exc
    return page, page_size
