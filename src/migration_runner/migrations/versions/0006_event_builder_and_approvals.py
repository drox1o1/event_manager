"""Event builder rebuild, organiser approval + public profile, featured
events, richer ticket types and per-participant tickets.

Columns only -- no new tables, so the restricted cyrokx_app role's existing
table grants cover everything.

  organisers: email_verified, status_reason, approved_at + public profile
              (bio, logo_url, cover_url, website_url, instagram_url, phone, city).
              Existing VERIFIED organisers stay approved; email_verified is
              backfilled true for them.
  events:     location_type, online_url, end_date/end_time, timezone,
              schedule_type, recurrence, listing_type, allow_discussions,
              promo_video_url, tags, is_featured, featured_order,
              featured_headline; organiser_id becomes nullable (platform-hosted
              events created by a super admin).
  ticket_tiers: ticket_type, description, min/max_per_order,
              requires_approval, group_name, sale_status, sort_order.
  orders:     occurrence_date (recurring events).
  tickets:    attendee_name/email/phone, attendee_answers, approval_status.

Revision ID: 0006
Revises: 0005
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- organisers ---
    op.add_column("organisers", sa.Column("email_verified", sa.Boolean, nullable=False, server_default=sa.false()))
    op.add_column("organisers", sa.Column("status_reason", sa.Text, nullable=True))
    op.add_column("organisers", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("organisers", sa.Column("bio", sa.Text, nullable=True))
    op.add_column("organisers", sa.Column("logo_url", sa.String(500), nullable=True))
    op.add_column("organisers", sa.Column("cover_url", sa.String(500), nullable=True))
    op.add_column("organisers", sa.Column("website_url", sa.String(500), nullable=True))
    op.add_column("organisers", sa.Column("instagram_url", sa.String(500), nullable=True))
    op.add_column("organisers", sa.Column("phone", sa.String(20), nullable=True))
    op.add_column("organisers", sa.Column("city", sa.String(100), nullable=True))
    op.execute("UPDATE organisers SET email_verified = true, approved_at = created_at WHERE status = 'verified'")

    # --- events ---
    op.alter_column("events", "organiser_id", nullable=True)
    op.add_column("events", sa.Column("location_type", sa.String(20), nullable=False, server_default="venue"))
    op.add_column("events", sa.Column("online_url", sa.String(500), nullable=True))
    op.add_column("events", sa.Column("end_date", sa.Date, nullable=True))
    op.add_column("events", sa.Column("end_time", sa.Time, nullable=True))
    op.add_column("events", sa.Column("timezone", sa.String(64), nullable=False, server_default="Asia/Kolkata"))
    op.add_column("events", sa.Column("schedule_type", sa.String(20), nullable=False, server_default="single"))
    op.add_column("events", sa.Column("recurrence", postgresql.JSONB, nullable=True))
    op.add_column("events", sa.Column("listing_type", sa.String(20), nullable=False, server_default="public"))
    op.add_column("events", sa.Column("allow_discussions", sa.Boolean, nullable=False, server_default=sa.true()))
    op.add_column("events", sa.Column("promo_video_url", sa.String(500), nullable=True))
    op.add_column("events", sa.Column("tags", postgresql.JSONB, nullable=True))
    op.add_column("events", sa.Column("is_featured", sa.Boolean, nullable=False, server_default=sa.false()))
    op.add_column("events", sa.Column("featured_order", sa.Integer, nullable=False, server_default="0"))
    op.add_column("events", sa.Column("featured_headline", sa.String(200), nullable=True))

    # --- ticket_tiers ---
    op.add_column("ticket_tiers", sa.Column("ticket_type", sa.String(20), nullable=False, server_default="paid"))
    op.add_column("ticket_tiers", sa.Column("description", sa.Text, nullable=True))
    op.add_column("ticket_tiers", sa.Column("min_per_order", sa.Integer, nullable=False, server_default="1"))
    op.add_column("ticket_tiers", sa.Column("max_per_order", sa.Integer, nullable=False, server_default="10"))
    op.add_column("ticket_tiers", sa.Column("requires_approval", sa.Boolean, nullable=False, server_default=sa.false()))
    op.add_column("ticket_tiers", sa.Column("group_name", sa.String(100), nullable=True))
    op.add_column("ticket_tiers", sa.Column("sale_status", sa.String(20), nullable=False, server_default="on_sale"))
    op.add_column("ticket_tiers", sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"))
    op.execute("UPDATE ticket_tiers SET ticket_type = 'free' WHERE price = 0")

    # --- orders / tickets ---
    op.add_column("orders", sa.Column("occurrence_date", sa.Date, nullable=True))
    op.add_column("tickets", sa.Column("attendee_name", sa.String(200), nullable=True))
    op.add_column("tickets", sa.Column("attendee_email", sa.String(320), nullable=True))
    op.add_column("tickets", sa.Column("attendee_phone", sa.String(20), nullable=True))
    op.add_column("tickets", sa.Column("attendee_answers", postgresql.JSONB, nullable=True))
    op.add_column("tickets", sa.Column("approval_status", sa.String(20), nullable=False, server_default="approved"))


def downgrade() -> None:
    for col in ("approval_status", "attendee_answers", "attendee_phone", "attendee_email", "attendee_name"):
        op.drop_column("tickets", col)
    op.drop_column("orders", "occurrence_date")
    for col in ("sort_order", "sale_status", "group_name", "requires_approval", "max_per_order",
                "min_per_order", "description", "ticket_type"):
        op.drop_column("ticket_tiers", col)
    for col in ("featured_headline", "featured_order", "is_featured", "tags", "promo_video_url",
                "allow_discussions", "listing_type", "recurrence", "schedule_type", "timezone",
                "end_time", "end_date", "online_url", "location_type"):
        op.drop_column("events", col)
    op.alter_column("events", "organiser_id", nullable=False)
    for col in ("city", "phone", "instagram_url", "website_url", "cover_url", "logo_url", "bio",
                "approved_at", "status_reason", "email_verified"):
        op.drop_column("organisers", col)
