"""Registration form builder + event gallery images.

Adds three tables:
  - event_form_fields      -- organiser-defined generic registration fields
  - event_images           -- extra gallery images shown under the description
  - order_form_responses   -- buyers' answers to the form, captured at checkout

New tables inherit the app-role grants from the ALTER DEFAULT PRIVILEGES set
in 0001 (migration_runner runs as the same master role here), so no explicit
GRANTs are needed in this revision.

Revision ID: 0002
Revises: 0001
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    # create_type=False: the explicit .create(checkfirst=True) call below is
    # what actually creates this type. Without it, op.create_table triggers
    # SQLAlchemy's own (non-checkfirst) enum-creation DDL as a side effect of
    # using this as a column type, which collides with the type just created
    # and fails with "already exists" -- same fix as 0001_initial_schema.py.
    form_field_type = postgresql.ENUM(
        "text", "single_choice", "multi_choice", name="form_field_type", create_type=False
    )
    form_field_type.create(bind, checkfirst=True)

    op.create_table(
        "event_form_fields",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("events.id"), nullable=False),
        sa.Column("label", sa.String(200), nullable=False),
        sa.Column("field_type", form_field_type, nullable=False),
        sa.Column("options", postgresql.JSONB, nullable=True),
        sa.Column("required", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_event_form_fields_event_id", "event_form_fields", ["event_id"])

    op.create_table(
        "event_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("events.id"), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_event_images_event_id", "event_images", ["event_id"])

    op.create_table(
        "order_form_responses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column(
            "field_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("event_form_fields.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("field_label", sa.String(200), nullable=False),
        sa.Column("answer", postgresql.JSONB, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_order_form_responses_order_id", "order_form_responses", ["order_id"])


def downgrade() -> None:
    op.drop_index("ix_order_form_responses_order_id", table_name="order_form_responses")
    op.drop_table("order_form_responses")
    op.drop_index("ix_event_images_event_id", table_name="event_images")
    op.drop_table("event_images")
    op.drop_index("ix_event_form_fields_event_id", table_name="event_form_fields")
    op.drop_table("event_form_fields")

    postgresql.ENUM(name="form_field_type").drop(op.get_bind(), checkfirst=True)
