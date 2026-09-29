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


def parse_body(model, raw_body):
    """Validate `raw_body` (a Lambda event's already-parsed JSON, e.g.
    `app.current_event.json_body`) against a pydantic request model."""
    try:
        return model.model_validate(raw_body)
    except ValidationError as exc:
        raise BadRequestError(str(exc)) from exc


def parse_pagination(params: dict, max_page_size: int = MAX_PAGE_SIZE) -> tuple[int, int]:
    try:
        page = max(int(params.get("page", "1")), 1)
        page_size = min(max(int(params.get("page_size", "20")), 1), max_page_size)
    except ValueError as exc:
        raise BadRequestError("page and page_size must be integers") from exc
    return page, page_size
