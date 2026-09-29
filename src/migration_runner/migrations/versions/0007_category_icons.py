"""Category icons -- lets a super admin pick a Lucide icon per category
(e.g. Cycling, Marathon, Athletics) instead of a bare name.

Revision ID: 0007
Revises: 0006
"""

import sqlalchemy as sa
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("categories", sa.Column("icon", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column("categories", "icon")
