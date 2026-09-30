"""Multi-category events: an event can be listed under several super-admin
categories (e.g. BSF Jammu Marathon -> Marathon + Sports). Max 2 per event, enforced by the API.

  event_categories (new): event_id + category_id, composite PK, both FKs
          ON DELETE CASCADE. Holds EVERY category of an event, including the
          primary one; events.category_id stays as the primary (shown on
          cards / first in the list) so existing reads keep working.

Data: every existing event gets its current primary category row.
Grants: inherits app-role grants from ALTER DEFAULT PRIVILEGES set in 0001.

Revision ID: 0010
Revises: 0009
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "event_categories",
        sa.Column("event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("categories.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_index("ix_event_categories_category_id", "event_categories", ["category_id"])
    op.execute("INSERT INTO event_categories (event_id, category_id) SELECT id, category_id FROM events")


def downgrade() -> None:
    op.drop_index("ix_event_categories_category_id", table_name="event_categories")
    op.drop_table("event_categories")
