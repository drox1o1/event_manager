"""Real PayU payments: orders now exist before the money does.

Checkout used to write an order already marked paid ("TEST-MODE") and issue
every ticket synchronously. With a real gateway the buyer leaves for PayU's
page, so an order exists in a PENDING state first and tickets are issued only
once payment is confirmed. These tables and columns are what that gap needs.

  orders (altered):
          reserved_until   -- the 10-minute inventory hold taken at checkout.
                              NULL means no hold applies (free, settled, or
                              failed orders). An expired hold stops counting
                              against availability on its own, which is why
                              there is no sweeper job anywhere.
          pending_items    -- the *resolved* ticket plan (attendee names,
                              validated form answers, prices), snapshotted at
                              checkout. Settlement replays it as plain INSERTs
                              and never re-validates: an organiser editing the
                              registration form mid-payment must not be able
                              to break an order the buyer has already paid for.
          Indexes: (payment_status, reserved_until) for the availability
          subquery and the reconciler scan; event_id, which 0001 never added
          and which now matters because every abandoned checkout is a row.

  payment_attempts (new): one row per PayU transaction. `txnid` is the
          idempotency key all three settlement paths (browser return, webhook,
          reconciler) look an order up by. A retry on the same order gets a
          new row with a new txnid, so the full history survives for disputes
          -- hence gateway_response keeping PayU's payload verbatim.

  payment_refunds (new): PayU refunds are asynchronous, so a refund needs its
          own lifecycle rather than a flag on the order. refund_request_id is
          nullable: NULL marks a refund the system initiated on its own, when
          a payment confirmed after its hold lapsed and the tier had sold out
          in the meantime.

Note both new status columns are plain VARCHAR, not Postgres enums. The
existing payment_status/refund_status enums are real types created in 0001,
and ALTER TYPE ... ADD VALUE cannot run inside a transaction block, which is
exactly what Alembic wraps a migration in. Keeping gateway vocabulary out of
the enums also means PayU adding a status is a code change, not a migration.

Known consequence, recorded here deliberately: a refund releases inventory by
decrementing ticket_tiers.quantity_sold while the issued Ticket rows remain,
so COUNT(tickets) can exceed quantity_sold for a tier. Organiser views filter
on payment_status = 'success' and stay consistent; whoever builds ticket
check-in must filter on it too.

Data: none. Existing orders keep payment_gateway_ref = 'TEST-MODE' with no
attempt row and NULL pending_items -- every new code path treats a missing
attempt as "nothing to do" rather than an error, so no backfill is needed.
Grants: inherits app-role grants from ALTER DEFAULT PRIVILEGES set in 0001.

Revision ID: 0011
Revises: 0010
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("reserved_until", sa.DateTime(timezone=True), nullable=True))
    op.add_column("orders", sa.Column("pending_items", postgresql.JSONB, nullable=True))
    op.create_index("ix_orders_payment_status_reserved_until", "orders", ["payment_status", "reserved_until"])
    op.create_index("ix_orders_event_id", "orders", ["event_id"])

    op.create_table(
        "payment_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("txnid", sa.String(64), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="initiated"),
        sa.Column("mihpayid", sa.String(100), nullable=True),
        sa.Column("mode", sa.String(20), nullable=True),
        sa.Column("error_code", sa.String(50), nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("gateway_response", postgresql.JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("settled_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_payment_attempts_txnid", "payment_attempts", ["txnid"], unique=True)
    op.create_index("ix_payment_attempts_order_id", "payment_attempts", ["order_id"])
    op.create_index("ix_payment_attempts_status_created_at", "payment_attempts", ["status", "created_at"])

    op.create_table(
        "payment_refunds",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("attempt_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("payment_attempts.id"), nullable=False),
        # NULL = a refund the system started itself (oversell), with no buyer
        # request and no admin decision behind it.
        sa.Column("refund_request_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("refund_requests.id"), nullable=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("reason", sa.Text, nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="requested"),
        sa.Column("gateway_refund_id", sa.String(100), nullable=True),
        sa.Column("gateway_response", postgresql.JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_payment_refunds_attempt_id", "payment_refunds", ["attempt_id"])
    op.create_index("ix_payment_refunds_status", "payment_refunds", ["status"])


def downgrade() -> None:
    op.drop_index("ix_payment_refunds_status", table_name="payment_refunds")
    op.drop_index("ix_payment_refunds_attempt_id", table_name="payment_refunds")
    op.drop_table("payment_refunds")

    op.drop_index("ix_payment_attempts_status_created_at", table_name="payment_attempts")
    op.drop_index("ix_payment_attempts_order_id", table_name="payment_attempts")
    op.drop_index("ix_payment_attempts_txnid", table_name="payment_attempts")
    op.drop_table("payment_attempts")

    op.drop_index("ix_orders_event_id", table_name="orders")
    op.drop_index("ix_orders_payment_status_reserved_until", table_name="orders")
    op.drop_column("orders", "pending_items")
    op.drop_column("orders", "reserved_until")
