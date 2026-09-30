"""Unauthenticated auth routes: organiser signup/login/email-verification,
and admin login. /organiser/auth/* and /admin/auth/login have no Lambda
authorizer attached at the API Gateway level (see infra/app/template.yaml)
since there's no JWT yet at signup/login time.
"""

import uuid

from app import app, logger
from app import parse_request_body as _parse_body
from aws_lambda_powertools.event_handler.exceptions import (
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
)
from common.auth import (
    PASSWORD_RESET_TOKEN_TTL_SECONDS,
    InvalidTokenError,
    decode_token,
    hash_password,
    issue_access_token,
    issue_email_verification_token,
    issue_password_reset_token,
    issue_refresh_token,
    verify_password,
)
from common.db import get_session
from common.helpers import ConflictError, utcnow
from common.messaging import publish_to_ses
from common.models import AdminUser, Organiser, OrganiserStatus
from common.schemas import (
    LoginRequest,
    OrganiserSignupRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    RefreshRequest,
    TokenResponse,
)
from sqlalchemy import select


@app.post("/organiser/auth/signup")
def organiser_signup():
    body = _parse_body(OrganiserSignupRequest)

    with get_session() as session:
        existing = session.execute(
            select(Organiser).where(Organiser.email == body.email)
        ).scalar_one_or_none()
        if existing is not None:
            raise ConflictError("An account with this email already exists")

        organiser = Organiser(
            org_name=body.org_name,
            contact_name=body.contact_name,
            email=body.email,
            password_hash=hash_password(body.password),
            status=OrganiserStatus.PENDING,
        )
        session.add(organiser)
        session.flush()
        organiser_id = organiser.id

    verification_token = issue_email_verification_token(organiser_id)
    publish_to_ses(
        {
            "type": "organiser_verification",
            "to": body.email,
            "verification_token": verification_token,
        }
    )

    return {"organiser_id": str(organiser_id), "status": OrganiserStatus.PENDING.value}, 201


@app.post("/organiser/auth/verify-email")
def organiser_verify_email():
    body = app.current_event.json_body or {}
    token = body.get("token")
    if not token:
        raise BadRequestError("token is required")

    try:
        payload = decode_token(token, expected_type="email_verify")
    except InvalidTokenError as exc:
        raise BadRequestError("Invalid or expired verification token") from exc

    organiser_id = uuid.UUID(payload["sub"])
    with get_session() as session:
        organiser = session.get(Organiser, organiser_id)
        if organiser is None:
            raise NotFoundError("Organiser not found")
        # Confirms the email only -- approval to create events is a separate,
        # super-admin decision (POST /admin/organisers/{id}/approve).
        organiser.email_verified = True
        status = organiser.status.value

    return {"status": status, "email_verified": True}


@app.post("/organiser/auth/login")
def organiser_login():
    body = _parse_body(LoginRequest)

    with get_session() as session:
        organiser = session.execute(
            select(Organiser).where(Organiser.email == body.email)
        ).scalar_one_or_none()
        if organiser is None or not verify_password(body.password, organiser.password_hash):
            raise UnauthorizedError("Invalid email or password")
        if organiser.status == OrganiserStatus.SUSPENDED:
            raise UnauthorizedError("This account has been suspended")

        tokens = TokenResponse(
            access_token=issue_access_token(organiser.id, "organiser"),
            refresh_token=issue_refresh_token(organiser.id, "organiser"),
        )

    return tokens.model_dump()


@app.post("/organiser/auth/refresh")
def organiser_refresh():
    body = _parse_body(RefreshRequest)

    try:
        payload = decode_token(body.refresh_token, expected_type="refresh")
    except InvalidTokenError as exc:
        raise UnauthorizedError("Invalid or expired refresh token") from exc

    organiser_id = uuid.UUID(payload["sub"])
    with get_session() as session:
        organiser = session.get(Organiser, organiser_id)
        if organiser is None or organiser.status == OrganiserStatus.SUSPENDED:
            raise UnauthorizedError("Invalid or expired refresh token")

        # Stateless refresh tokens for now -- the same one is handed back
        # unchanged (it's still valid until its own 30-day expiry) rather
        # than rotated. TODO: once refresh tokens need to be revocable
        # (logout-everywhere, compromised-token response), track issued
        # tokens server-side (e.g. a token-family table with a revoked_at
        # column) and rotate + invalidate the prior one on each refresh.
        tokens = TokenResponse(
            access_token=issue_access_token(organiser.id, "organiser"),
            refresh_token=body.refresh_token,
        )

    return tokens.model_dump()


@app.post("/organiser/auth/forgot-password")
def organiser_forgot_password():
    """Always responds the same way regardless of whether `email` has an
    account -- an endpoint that answers differently is an email-enumeration
    oracle. The real work (issuing a token, queuing an email) only happens
    when there's actually an organiser to reset."""
    body = _parse_body(PasswordResetRequest)

    with get_session() as session:
        organiser = session.execute(
            select(Organiser).where(Organiser.email == body.email)
        ).scalar_one_or_none()
        if organiser is not None:
            reset_token = issue_password_reset_token(organiser.id, "organiser")
            publish_to_ses(
                {
                    "type": "password_reset",
                    "to": organiser.email,
                    "reset_token": reset_token,
                    "expires_minutes": PASSWORD_RESET_TOKEN_TTL_SECONDS // 60,
                }
            )

    return {"status": "if_account_exists_email_sent"}


@app.post("/organiser/auth/reset-password")
def organiser_reset_password():
    body = _parse_body(PasswordResetConfirmRequest)

    try:
        payload = decode_token(body.token, expected_type="password_reset")
    except InvalidTokenError as exc:
        raise BadRequestError("Invalid or expired reset link") from exc

    organiser_id = uuid.UUID(payload["sub"])
    with get_session() as session:
        organiser = session.get(Organiser, organiser_id)
        if organiser is None:
            raise NotFoundError("Organiser not found")
        organiser.password_hash = hash_password(body.new_password)
        email = organiser.email

    # Best-effort: a queue hiccup shouldn't fail a reset that already
    # succeeded -- the password is already changed at this point.
    try:
        publish_to_ses({"type": "password_changed", "to": email, "changed_at": utcnow().isoformat()})
    except Exception:  # noqa: BLE001
        logger.exception("could not queue password_changed notification")

    return {"status": "password_reset"}


# --- Admin auth (unauthenticated -- admin rows are seeded, never self-registered) ---


@app.post("/admin/auth/login")
def admin_login():
    body = _parse_body(LoginRequest)

    with get_session() as session:
        admin = session.execute(
            select(AdminUser).where(AdminUser.email == body.email)
        ).scalar_one_or_none()
        if admin is None or not verify_password(body.password, admin.password_hash):
            raise UnauthorizedError("Invalid email or password")

        tokens = TokenResponse(
            access_token=issue_access_token(admin.id, "admin"),
            refresh_token=issue_refresh_token(admin.id, "admin"),
        )

    return tokens.model_dump()


@app.post("/admin/auth/refresh")
def admin_refresh():
    body = _parse_body(RefreshRequest)

    try:
        payload = decode_token(body.refresh_token, expected_type="refresh")
    except InvalidTokenError as exc:
        raise UnauthorizedError("Invalid or expired refresh token") from exc

    admin_id = uuid.UUID(payload["sub"])
    with get_session() as session:
        admin = session.get(AdminUser, admin_id)
        if admin is None:
            raise UnauthorizedError("Invalid or expired refresh token")

        # See the TODO on organiser_refresh above -- same stateless approach.
        tokens = TokenResponse(
            access_token=issue_access_token(admin.id, "admin"),
            refresh_token=body.refresh_token,
        )

    return tokens.model_dump()
