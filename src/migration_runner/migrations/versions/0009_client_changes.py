"""Client change round (Oct 2026): banner-only hero, category rows,
transaction queries and export-ready order columns.

  events: + featured_link_url (where the hero banner goes when clicked),
            featured_mobile_banner_url (optional 4:3 artwork for phones)
  homepage_sections: + category_id (auto event rows limited to a category)
  orders: + discount_amount (default 0), promo_code -- always 0 / NULL until
          promo codes are built; present now so exports have a fixed shape
  order_queries: buyer "raise a query about this transaction" (replaces the
          refund request button). New table; inherits app-role grants from the
          ALTER DEFAULT PRIVILEGES set in 0001.

Data:
  - categories re-ordered Marathon, Sports, Food & Drink, Workshops, Music,
    then everything else in its previous order (matched case-insensitively)
  - category_grid homepage sections disabled (the header nav replaces them;
    an admin can re-enable one from the homepage editor)

Revision ID: 0009
Revises: 0008
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None

CATEGORY_ORDER = ["marathon", "sports", "food & drink", "workshops", "workshop", "music"]


def upgrade() -> None:
    op.add_column("events", sa.Column("featured_link_url", sa.String(500), nullable=True))
    op.add_column("events", sa.Column("featured_mobile_banner_url", sa.String(500), nullable=True))

    op.add_column(
        "homepage_sections",
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True),
    )

    op.add_column("orders", sa.Column("discount_amount", sa.Numeric(10, 2), nullable=False, server_default="0"))
    op.add_column("orders", sa.Column("promo_code", sa.String(50), nullable=True))

    op.create_table(
        "order_queries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),  # open|resolved
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_order_queries_order_id", "order_queries", ["order_id"])

    bind = op.get_bind()
    rows = bind.execute(sa.text("SELECT id, name FROM categories ORDER BY sort_order, name")).fetchall()
    rank = {name: i for i, name in enumerate(CATEGORY_ORDER)}
    ordered = sorted(
        enumerate(rows),
        key=lambda pair: (rank.get(pair[1].name.strip().lower(), len(CATEGORY_ORDER)), pair[0]),
    )
    for new_order, (_, row) in enumerate(ordered):
        bind.execute(sa.text("UPDATE categories SET sort_order = :o WHERE id = :id"), {"o": new_order, "id": row.id})

    op.execute("UPDATE homepage_sections SET enabled = false WHERE section_type = 'category_grid'")


def downgrade() -> None:
    op.drop_index("ix_order_queries_order_id", table_name="order_queries")
    op.drop_table("order_queries")
    op.drop_column("orders", "promo_code")
    op.drop_column("orders", "discount_amount")
    op.drop_column("homepage_sections", "category_id")
    op.drop_column("events", "featured_mobile_banner_url")
    op.drop_column("events", "featured_link_url")
