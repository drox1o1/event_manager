"""authenticated_api Lambda -- organiser and admin routes.

This module is deliberately thin: it imports every route module below for
its side effect (registering routes on the shared `app` from app.py) and
exposes the Lambda entrypoint. The routes themselves live in:

  - auth_routes.py           /organiser/auth/*, /admin/auth/login (no
                              authorizer -- there's no JWT yet at signup/login)
  - organiser_routes.py       /organiser/me, /organiser/events/*
  - admin_routes.py           /admin/events/*, /admin/organisers/*,
                              /admin/transactions, /admin/refunds/*
  - admin_content_routes.py   /admin/settings, /admin/homepage,
                              /admin/categories, /admin/site-pages/*

Shared event/ticket-tier/form/attendee business logic lives in
events_service.py; S3 presigned-upload helpers live in uploads.py; reading
the caller's identity off the Lambda authorizer context lives in context.py.
Every route other than the ones above requires a valid JWT whose role claim
the authorizer has already checked against the route prefix.
"""

from __future__ import annotations

import admin_content_routes  # noqa: F401 -- imported for route registration
import admin_routes  # noqa: F401
import auth_routes  # noqa: F401
import organiser_routes  # noqa: F401
from app import app, logger
from aws_lambda_powertools.utilities.typing import LambdaContext


@logger.inject_lambda_context
def handler(event: dict, context: LambdaContext):
    return app.resolve(event, context)
