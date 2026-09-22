"""Rebrand CyRokx -> Showtik for stored defaults.

The platform_settings.email_sender_name column shipped with the brand default
"CyRokx" (0001). After the rebrand, any deployment still carrying that exact
default is updated to "Showtik". Rows an admin has already customised to some
other value are left untouched.

Revision ID: 0004
Revises: 0003
"""

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    # Move the column's own default forward for any future inserts.
    op.alter_column(
        "platform_settings",
        "email_sender_name",
        server_default="Showtik",
        existing_type=sa.String(200),
        existing_nullable=False,
    )
    # Update existing rows still on the old brand default.
    bind.execute(
        sa.text(
            "UPDATE platform_settings SET email_sender_name = 'Showtik' "
            "WHERE email_sender_name = 'CyRokx'"
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    op.alter_column(
        "platform_settings",
        "email_sender_name",
        server_default="CyRokx",
        existing_type=sa.String(200),
        existing_nullable=False,
    )
    bind.execute(
        sa.text(
            "UPDATE platform_settings SET email_sender_name = 'CyRokx' "
            "WHERE email_sender_name = 'Showtik'"
        )
    )
