"""Unauthenticated auth routes: organiser signup/login/email-verification,
and admin login. /organiser/auth/* and /admin/auth/login have no Lambda
authorizer attached at the API Gateway level (see infra/app/template.yaml)
since there's no JWT yet at signup/login time.
"""

import uuid

from app import app
from app import parse_request_body as _parse_body
from aws_lambda_powertools.event_handler.exceptions import (
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
)
from common.auth import (
    InvalidTokenError,
    decode_token,
    hash_password,
    issue_access_token,
    issue_email_verification_token,
    issue_refresh_token,
    verify_password,
)
from common.db import get_session
from common.helpers import ConflictError
from common.messaging import publish
from common.models import AdminUser, Organiser, OrganiserStatus
from common.schemas import LoginRequest, OrganiserSignupRequest, TokenResponse
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
    publish(
        "EMAIL_QUEUE_URL",
        {
            "type": "organiser_verification",
            "to": body.email,
            "verification_token": verification_token,
        },
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
