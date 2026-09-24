"""Super-admin control over site-wide chrome: categories, the city list,
footer content, and standalone content pages (About, Careers, etc).

Adds:
  - homepage_settings.footer_tagline / footer_columns / active_cities --
    admin-editable footer copy + link columns and the city list shown in the
    navbar/city-filter dropdown. Seeded with the values that were previously
    hardcoded in the frontend, so nothing changes on the live site until an
    admin edits them.
  - site_pages -- freeform title/body content pages, addressed by slug.
    Seeded with the six pages the footer already links to (About, Careers,
    Press, Help centre, Contact us, Refund policy).

Categories already exist (categories table, 0001) with the id/name/sort_order
an admin CRUD needs -- no schema change required there, just new endpoints.

Revision ID: 0005
Revises: 0004
"""

import uuid

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None

_DEFAULT_FOOTER_COLUMNS = [
    {
        "title": "Discover",
        "links": [
            {"label": "Categories", "href": "/events"},
            {"label": "Cities", "href": "/events"},
            {"label": "Trending", "href": "/events"},
            {"label": "For organisers", "href": "/signup"},
        ],
    },
    {
        "title": "Company",
        "links": [
            {"label": "About", "href": "/about"},
            {"label": "Careers", "href": "/careers"},
            {"label": "Press", "href": "/press"},
        ],
    },
    {
        "title": "Support",
        "links": [
            {"label": "Help centre", "href": "/help"},
            {"label": "Contact us", "href": "/contact"},
            {"label": "Refund policy", "href": "/refund-policy"},
        ],
    },
]

_DEFAULT_CITIES = ["Mumbai", "Delhi", "Bengaluru", "Pune", "Ahmedabad", "Chennai", "Hyderabad", "Kolkata"]

_DEFAULT_PAGES = [
    (
        "about",
        "About Showtik",
        "Showtik is a live-events platform built for sport — marathons, cycling challenges, "
        "football leagues, kabaddi nights — alongside music, comedy and workshops.\n\n"
        "We connect organisers with the people who show up: fast event pages, simple ticketing, "
        "and instant confirmation, no account required to buy a ticket.",
    ),
    (
        "careers",
        "Careers",
        "We're not currently hiring, but we're always glad to hear from people who love live "
        "events and building great products.\n\nWrite to us at careers@showtik.com.",
    ),
    (
        "press",
        "Press",
        "For press and media enquiries, reach out to press@showtik.com.",
    ),
    (
        "help",
        "Help centre",
        "Where are my tickets? Every order confirmation page and email includes your QR-code "
        "tickets — no account needed, just the order link.\n\n"
        "Can I get a refund? Open your order confirmation page and select \"Request refund\". "
        "Our team reviews requests within 24 hours.\n\n"
        "Still stuck? Reach us on the Contact us page.",
    ),
    (
        "contact",
        "Contact us",
        "Email us at support@showtik.com and we'll get back to you within a business day.",
    ),
    (
        "refund-policy",
        "Refund policy",
        "Refund requests can be submitted from your order confirmation page up to 48 hours "
        "before the event. Our team reviews every request within 24 hours.\n\n"
        "Approved refunds are returned to your original payment method within 5-7 business days.",
    ),
]


def upgrade() -> None:
    bind = op.get_bind()

    op.add_column(
        "homepage_settings",
        sa.Column("footer_tagline", sa.String(300), nullable=True,
                  server_default="Discover and book live events near you — no account needed to buy a ticket."),
    )
    op.add_column("homepage_settings", sa.Column("footer_columns", postgresql.JSONB, nullable=True))
    op.add_column("homepage_settings", sa.Column("active_cities", postgresql.JSONB, nullable=True))

    homepage_settings = sa.table(
        "homepage_settings",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("footer_columns", postgresql.JSONB),
        sa.column("active_cities", postgresql.JSONB),
    )
    # Backfill the one settings row if it already exists (from 0003's seed);
    # a fresh database won't have one yet -- the app creates it lazily with
    # these same column server_defaults / ORM defaults on first admin visit.
    bind.execute(
        homepage_settings.update().values(
            footer_columns=_DEFAULT_FOOTER_COLUMNS,
            active_cities=_DEFAULT_CITIES,
        )
    )

    op.create_table(
        "site_pages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(80), nullable=False, unique=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    site_pages = sa.table(
        "site_pages",
        sa.column("id", postgresql.UUID(as_uuid=True)),
        sa.column("slug", sa.String),
        sa.column("title", sa.String),
        sa.column("body", sa.Text),
    )
    bind.execute(
        site_pages.insert(),
        [{"id": uuid.uuid4(), "slug": slug, "title": title, "body": body} for slug, title, body in _DEFAULT_PAGES],
    )


def downgrade() -> None:
    op.drop_table("site_pages")
    op.drop_column("homepage_settings", "active_cities")
    op.drop_column("homepage_settings", "footer_columns")
    op.drop_column("homepage_settings", "footer_tagline")
