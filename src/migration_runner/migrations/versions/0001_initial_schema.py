"""Initial schema — all 11 tables, a default categories seed, and the
restricted cyrokx_app Postgres role that public_api/authenticated_api
connect as (DML only -- the RDS master user, used only by migration_runner,
is the only role ever granted DDL).

Revision ID: 0001
Revises:
"""

import json
import os
import re
import uuid

import boto3
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

DEFAULT_CATEGORIES = ["Music", "Comedy", "Workshops", "Sports", "Food & Drink", "Theatre"]


def _app_db_credentials() -> dict | None:
    """Reads username/password from AppDbSecret. None (skips role creation)
    if APP_DB_SECRET_ARN isn't set -- e.g. a local/throwaway dev database
    that doesn't need the restricted role at all."""
    secret_arn = os.environ.get("APP_DB_SECRET_ARN")
    if not secret_arn:
        return None
    client = boto3.client("secretsmanager")
    secret = client.get_secret_value(SecretId=secret_arn)
    return json.loads(secret["SecretString"])


def upgrade() -> None:
    bind = op.get_bind()

    # create_type=False on each: the explicit .create(checkfirst=True) calls
    # below are what actually create these types. Without it, op.create_table
    # triggers SQLAlchemy's own (non-checkfirst) enum-creation DDL as a side
    # effect of using these as column types, which collides with the type
    # this function just created and fails with "already exists".
    organiser_status = postgresql.ENUM(
        "pending", "verified", "suspended", name="organiser_status", create_type=False
    )
    event_status = postgresql.ENUM(
        "draft", "review", "approved", "rejected", "live", "soldout", "deactivated",
        name="event_status",
        create_type=False,
    )
    payment_status = postgresql.ENUM(
        "pending", "success", "failed", "refunded", name="payment_status", create_type=False
    )
    refund_status = postgresql.ENUM(
        "pending", "approved", "rejected", name="refund_status", create_type=False
    )

    organiser_status.create(bind, checkfirst=True)
    event_status.create(bind, checkfirst=True)
    payment_status.create(bind, checkfirst=True)
    refund_status.create(bind, checkfirst=True)

    op.create_table(
        "organisers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("org_name", sa.String(200), nullable=False),
        sa.Column("contact_name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(200), nullable=False),
        sa.Column("status", organiser_status, nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "admin_users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(200), nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="super_admin"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
    )

    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organiser_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organisers.id"),
            nullable=False,
        ),
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("categories.id"),
            nullable=False,
        ),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("event_date", sa.Date, nullable=False),
        sa.Column("event_time", sa.Time, nullable=False),
        sa.Column("venue_name", sa.String(200), nullable=False),
        sa.Column("venue_address", sa.Text, nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("capacity", sa.Integer, nullable=False),
        sa.Column("banner_image_url", sa.String(500), nullable=True),
        sa.Column("status", event_status, nullable=False, server_default="draft"),
        sa.Column("rejection_reason", sa.Text, nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "reviewed_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("admin_users.id"), nullable=True
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "ticket_tiers",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("events.id"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("quantity_total", sa.Integer, nullable=False),
        sa.Column("quantity_sold", sa.Integer, nullable=False, server_default="0"),
        sa.Column("sale_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sale_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("events.id"), nullable=False),
        sa.Column("buyer_name", sa.String(200), nullable=False),
        sa.Column("buyer_email", sa.String(320), nullable=False),
        sa.Column("buyer_phone", sa.String(20), nullable=False),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("booking_fee", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("payment_status", payment_status, nullable=False, server_default="pending"),
        sa.Column("payment_gateway_ref", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column(
            "ticket_tier_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("ticket_tiers.id"),
            nullable=False,
        ),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
    )

    op.create_table(
        "tickets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "order_item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("order_items.id"),
            nullable=False,
        ),
        sa.Column("qr_code_token", sa.String(64), nullable=False, unique=True),
        sa.Column("checked_in", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("checked_in_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "refund_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("reason", sa.Text, nullable=False),
        sa.Column("status", refund_status, nullable=False, server_default="pending"),
        sa.Column("rejection_reason", sa.Text, nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "resolved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("admin_users.id"), nullable=True
        ),
    )

    op.create_table(
        "platform_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("commission_pct", sa.Numeric(5, 2), nullable=False, server_default="8"),
        sa.Column("buyer_fee_enabled", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("auto_payout_enabled", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("email_sender_name", sa.String(200), nullable=False, server_default="CyRokx"),
        sa.Column("email_reply_to", sa.String(320), nullable=True),
        sa.Column("email_footer_note", sa.Text, nullable=True),
    )

    op.create_table(
        "activity_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("actor_type", sa.String(20), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column(
            "related_event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("events.id"), nullable=True
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    categories_table = sa.table(
        "categories",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("name", sa.String),
        sa.column("sort_order", sa.Integer),
    )
    op.bulk_insert(
        categories_table,
        [
            {"id": uuid.uuid4(), "name": name, "sort_order": i}
            for i, name in enumerate(DEFAULT_CATEGORIES)
        ],
    )

    app_creds = _app_db_credentials()
    if app_creds:
        username = app_creds["username"]
        password = app_creds["password"]
        if not re.fullmatch(r"[a-z_][a-z0-9_]{0,62}", username):
            raise ValueError(f"AppDbSecret username must be a safe identifier, got {username!r}")

        current_schema = bind.execute(sa.text("SELECT current_schema()")).scalar()

        role_exists = bind.execute(
            sa.text("SELECT 1 FROM pg_roles WHERE rolname = :username"), {"username": username}
        ).scalar()
        if not role_exists:
            bind.execute(
                sa.text(f'CREATE ROLE "{username}" LOGIN PASSWORD :password'), {"password": password}
            )
        else:
            # Role may already exist from a prior schema's migration run (the
            # role is cluster-wide; only the grants below are per-schema) --
            # keep its password in sync with AppDbSecret regardless.
            bind.execute(
                sa.text(f'ALTER ROLE "{username}" LOGIN PASSWORD :password'), {"password": password}
            )

        bind.execute(sa.text(f'GRANT USAGE ON SCHEMA "{current_schema}" TO "{username}"'))
        bind.execute(
            sa.text(
                f'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES '
                f'IN SCHEMA "{current_schema}" TO "{username}"'
            )
        )
        bind.execute(
            sa.text(
                f'ALTER DEFAULT PRIVILEGES IN SCHEMA "{current_schema}" '
                f'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "{username}"'
            )
        )


def downgrade() -> None:
    op.drop_table("activity_log")
    op.drop_table("platform_settings")
    op.drop_table("refund_requests")
    op.drop_table("tickets")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("ticket_tiers")
    op.drop_table("events")
    op.drop_table("categories")
    op.drop_table("admin_users")
    op.drop_table("organisers")

    bind = op.get_bind()
    postgresql.ENUM(name="refund_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="payment_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="event_status").drop(bind, checkfirst=True)
    postgresql.ENUM(name="organiser_status").drop(bind, checkfirst=True)
