"""Custom Lambda authorizer (TOKEN type) for the authenticated_api routes.

Validates the JWT from the Authorization header and checks its role claim
against the route being accessed (/organiser/* requires an organiser token,
/admin/* requires an admin token). API Gateway only attaches this authorizer
to the protected routes -- /organiser/auth/* and /admin/auth/login are
configured with no authorizer at all, since there's no token yet when
signing up or logging in.

Invalid/expired/missing token -> raises "Unauthorized" -> API Gateway
returns 401. Valid token but wrong role for the route -> explicit Deny
policy -> API Gateway returns 403.
"""

from __future__ import annotations

import re
from typing import Any

from aws_lambda_powertools import Logger
from common.auth import InvalidTokenError, decode_token

logger = Logger()

_METHOD_ARN_RE = re.compile(r"^arn:aws:execute-api:[^:]+:[^:]+:[^/]+/[^/]+/[A-Z]+/(?P<path>.*)$")
_ARN_PREFIX_RE = re.compile(r"^(?P<prefix>arn:aws:execute-api:[^:]+:[^:]+:[^/]+/[^/]+)/[A-Z]+/.*$")


def _required_role(method_arn: str) -> str | None:
    match = _METHOD_ARN_RE.match(method_arn)
    path = match.group("path") if match else ""
    if path.startswith("organiser"):
        return "organiser"
    if path.startswith("admin"):
        return "admin"
    return None


def _wildcard_resource(method_arn: str, role_prefix: str | None) -> str:
    """Widens the policy's Resource to every method under the role's path
    prefix (e.g. .../organiser/*) instead of just the single route that
    triggered this invocation. Required because AuthorizerResultTtlInSeconds
    caches the returned policy keyed by token and reuses it verbatim for any
    later call with that token -- a Resource scoped to one method+path would
    make every *other* route 403 until the cache entry expires."""
    match = _ARN_PREFIX_RE.match(method_arn)
    if not match or not role_prefix:
        return method_arn
    return f"{match.group('prefix')}/*/{role_prefix}/*"


def _policy(principal_id: str, effect: str, resource: str, context: dict | None = None) -> dict:
    document = {
        "Version": "2012-10-17",
        "Statement": [{"Action": "execute-api:Invoke", "Effect": effect, "Resource": resource}],
    }
    response: dict[str, Any] = {"principalId": principal_id, "policyDocument": document}
    if context:
        response["context"] = context
    return response


def handler(event: dict, _context: Any) -> dict:
    token = event.get("authorizationToken", "")
    if token.lower().startswith("bearer "):
        token = token[7:]

    method_arn = event["methodArn"]

    try:
        payload = decode_token(token, expected_type="access")
    except InvalidTokenError as exc:
        logger.warning("token rejected", extra={"reason": str(exc)})
        raise Exception("Unauthorized") from exc

    role = payload["role"]
    subject_id = payload["sub"]

    required_role = _required_role(method_arn)
    resource = _wildcard_resource(method_arn, required_role)

    if required_role is not None and role != required_role:
        logger.warning(
            "role mismatch",
            extra={"required": required_role, "actual": role, "subject": subject_id},
        )
        return _policy(subject_id, "Deny", resource)

    context = {"role": role}
    if role == "organiser":
        context["organiser_id"] = subject_id
    else:
        context["admin_id"] = subject_id

    return _policy(subject_id, "Allow", resource, context)
