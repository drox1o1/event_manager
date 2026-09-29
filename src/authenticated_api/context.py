"""Reads the caller's identity out of the API Gateway Lambda authorizer
context that the custom authorizer (src/authorizer/handler.py) attaches to
every authenticated route. /organiser/auth/* and /admin/auth/login have no
authorizer attached -- there's no JWT yet at signup/login time -- so nothing
here applies to those routes.
"""

import uuid

from app import app
from aws_lambda_powertools.event_handler.exceptions import UnauthorizedError


def authorizer_claims() -> dict:
    authorizer = app.current_event.request_context.authorizer
    return dict(authorizer) if authorizer else {}


def require_organiser_id() -> uuid.UUID:
    organiser_id = authorizer_claims().get("organiser_id")
    if not organiser_id:
        raise UnauthorizedError("Missing organiser context")
    return uuid.UUID(organiser_id)


def require_admin_id() -> uuid.UUID:
    admin_id = authorizer_claims().get("admin_id")
    if not admin_id:
        raise UnauthorizedError("Missing admin context")
    return uuid.UUID(admin_id)
