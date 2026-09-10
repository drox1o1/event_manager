"""Homepage CMS — super-admin control of the public front page.

Adds:
  - homepage_settings        -- singleton hero + announcement banner config
  - homepage_sections        -- ordered content blocks (add/remove/reorder)
  - homepage_section_events  -- curated event picks for event-row sections

Seeds one settings row and the three default sections so the public homepage
renders exactly as before until an admin customises it. New tables inherit the
app-role grants from the ALTER DEFAULT PRIVILEGES set in 0001.

Revision ID: 0003
Revises: 0002
"""

import uuid

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    section_type = postgresql.ENUM(
        "category_grid", "featured_events", "trending_events", name="homepage_section_type"
    )
    section_mode = postgresql.ENUM("auto", "curated", name="homepage_section_mode")
    section_type.create(bind, checkfirst=True)
    section_mode.create(bind, checkfirst=True)

    op.create_table(
        "homepage_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("hero_eyebrow", sa.String(200), nullable=False, server_default="Discover live events near you"),
        sa.Column("hero_headline", sa.String(200), nullable=False, server_default="Find your next night out"),
        sa.Column("hero_subheadline", sa.Text, nullable=True),
        sa.Column("hero_search_enabled", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("banner_enabled", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("banner_text", sa.Text, nullable=True),
        sa.Column("banner_link_url", sa.String(500), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "homepage_sections",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("section_type", section_type, nullable=False),
        sa.Column("mode", section_mode, nullable=False, server_default="auto"),
        sa.Column("enabled", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "homepage_section_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "section_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("homepage_sections.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("events.id"), nullable=False),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_index("ix_homepage_section_events_section_id", "homepage_section_events", ["section_id"])

    # Seed the default homepage so the public site is unchanged until edited.
    op.bulk_insert(
        sa.table(
            "homepage_settings",
            sa.column("id", postgresql.UUID(as_uuid=True)),
            sa.column("hero_eyebrow", sa.String),
            sa.column("hero_headline", sa.String),
            sa.column("hero_search_enabled", sa.Boolean),
            sa.column("banner_enabled", sa.Boolean),
        ),
        [{
            "id": uuid.uuid4(),
            "hero_eyebrow": "Discover live events near you",
            "hero_headline": "Find your next night out",
            "hero_search_enabled": True,
            "banner_enabled": False,
        }],
    )

    op.bulk_insert(
        sa.table(
            "homepage_sections",
            sa.column("id", postgresql.UUID(as_uuid=True)),
            sa.column("title", sa.String),
            sa.column("section_type", section_type),
            sa.column("mode", section_mode),
            sa.column("enabled", sa.Boolean),
            sa.column("sort_order", sa.Integer),
        ),
        [
            {"id": uuid.uuid4(), "title": "Browse by category", "section_type": "category_grid", "mode": "auto", "enabled": True, "sort_order": 0},
            {"id": uuid.uuid4(), "title": "Featured events", "section_type": "featured_events", "mode": "auto", "enabled": True, "sort_order": 1},
            {"id": uuid.uuid4(), "title": "Trending this week", "section_type": "trending_events", "mode": "auto", "enabled": True, "sort_order": 2},
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_homepage_section_events_section_id", table_name="homepage_section_events")
    op.drop_table("homepage_section_events")
    op.drop_table("homepage_sections")
    op.drop_table("homepage_settings")

    bind = op.get_bind()
    postgresql.ENUM(name="homepage_section_mode").drop(bind, checkfirst=True)
    postgresql.ENUM(name="homepage_section_type").drop(bind, checkfirst=True)
