"""Alembic environment.

Reads DATABASE_URL (a full SQLAlchemy URL) and an optional DB_SCHEMA from the
environment rather than alembic.ini's sqlalchemy.url. migration_runner's
Lambda handler resolves DB credentials from Secrets Manager and sets these
before invoking Alembic commands; for local dev, export them yourself.

DB_SCHEMA is unset for prod (uses the default "public" schema) and set to a
sanitized branch name for PR-branch stacks, which share one RDS instance but
get their own Postgres schema each — created here if it doesn't exist yet.
"""

import os
import re
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool, text

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "layers" / "common"))

from common.models import Base  # noqa: E402

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

DATABASE_URL = os.environ.get("DATABASE_URL")
DB_SCHEMA = os.environ.get("DB_SCHEMA")

if DB_SCHEMA and not re.fullmatch(r"[a-z0-9_]{1,63}", DB_SCHEMA):
    raise ValueError(f"DB_SCHEMA must be a safe identifier, got {DB_SCHEMA!r}")

if DATABASE_URL:
    config.set_main_option("sqlalchemy.url", DATABASE_URL)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table_schema=DB_SCHEMA,
        include_schemas=bool(DB_SCHEMA),
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        if DB_SCHEMA:
            connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS {DB_SCHEMA}"))
            connection.execute(text(f"SET search_path TO {DB_SCHEMA}"))
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table_schema=DB_SCHEMA,
            include_schemas=bool(DB_SCHEMA),
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
