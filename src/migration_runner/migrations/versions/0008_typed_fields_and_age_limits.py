"""Typed registration fields and per-ticket age limits.

  form_field_type enum: + date, dob, phone
    date  -- any date, rendered as a calendar picker
    dob   -- date of birth; drives ticket age limits (one per form)
    phone -- contact number, digits only
  ticket_tiers: + min_age, max_age (nullable; checked against each
    participant's date of birth on the event date)

Revision ID: 0008
Revises: 0007
"""

import sqlalchemy as sa
from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE can't be used in the same transaction that
    # adds it on older Postgres; run each in its own autocommit block.
    with op.get_context().autocommit_block():
        for value in ("date", "dob", "phone"):
            op.execute(f"ALTER TYPE form_field_type ADD VALUE IF NOT EXISTS '{value}'")

    op.add_column("ticket_tiers", sa.Column("min_age", sa.Integer, nullable=True))
    op.add_column("ticket_tiers", sa.Column("max_age", sa.Integer, nullable=True))


def downgrade() -> None:
    op.drop_column("ticket_tiers", "max_age")
    op.drop_column("ticket_tiers", "min_age")
    # Postgres can't drop enum values; rows using them are converted to text.
    op.execute("UPDATE event_form_fields SET field_type = 'text' WHERE field_type IN ('date', 'dob', 'phone')")
