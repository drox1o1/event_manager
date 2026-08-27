"""migration-runner Lambda -- runs Alembic against the target schema.

Four modes, selected via the invoke payload's "mode" key:

  "check"       -- read-only. Compares the DB's current Alembic revision
                   against the head revision bundled in this deployment.
                   Used by deploy-prod.yml as a pre-deploy gate: fails the
                   CI build if the schema isn't ready yet, instead of
                   shipping code against a schema that doesn't exist.
  "upgrade"     -- runs `alembic upgrade head`. Used by the manually-
                   triggered MigrationRunner Step Function for prod, and
                   automatically by deploy-branch.yml for PR-branch stacks
                   against their own schema.
  "drop_schema" -- drops a PR-branch's schema entirely. Used by
                   teardown-branch.yml when a PR closes -- the GitHub-hosted
                   runner has no network path into the VPC, so this has to
                   go through a Lambda like everything else DB-related.
                   Refuses to run without an explicit, non-"public" schema,
                   so this can never touch prod's data.
  "seed_admin"  -- creates the first admin_users row. Same one-off logic as
                   scripts/seed_admin.py, invoked through this Lambda for the
                   same reason as "drop_schema": prod's RDS instance isn't
                   publicly reachable, so anything DB-related that isn't
                   already an HTTP route has to go through a Lambda already
                   living in the VPC. Not exposed via API Gateway.

Payload: {"mode": "check" | "upgrade" | "drop_schema" | "seed_admin",
          "schema": "<optional>", "email": "<seed_admin only>",
          "password": "<seed_admin only>"}

This function bundles migrations/ (alembic.ini, env.py, versions/) alongside
this handler in its own CodeUri -- see infra/app/template.yaml -- rather
than sharing the top-level layer, since Alembic itself isn't needed by any
other function.
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from aws_lambda_powertools import Logger
from common.auth import hash_password
from common.db import load_db_credentials
from common.models import AdminUser
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

logger = Logger()

SCHEMA_NAME_RE = re.compile(r"[a-z0-9_]{1,63}")

MIGRATIONS_DIR = Path(__file__).resolve().parent / "migrations"


def _database_url() -> str:
    creds = load_db_credentials()
    host = os.environ["DB_PROXY_HOST"]
    port = os.environ.get("DB_PORT", "5432")
    dbname = os.environ.get("DB_NAME", "cyrokx")
    return f"postgresql+psycopg2://{creds['username']}:{creds['password']}@{host}:{port}/{dbname}"


def _bundled_head_revision() -> str | None:
    script = ScriptDirectory(str(MIGRATIONS_DIR))
    return script.get_current_head()


def _db_current_revision(database_url: str, schema: str | None) -> str | None:
    engine = create_engine(database_url)
    try:
        with engine.connect() as connection:
            if schema:
                connection.execute(text(f"SET search_path TO {schema}"))
            context = MigrationContext.configure(
                connection,
                opts={"version_table_schema": schema} if schema else {},
            )
            return context.get_current_revision()
    finally:
        engine.dispose()


def _check(database_url: str, schema: str | None) -> dict:
    head = _bundled_head_revision()
    current = _db_current_revision(database_url, schema)
    result = {"up_to_date": current == head, "current_revision": current, "head_revision": head}
    logger.info("migration check", extra=result)
    return result


def _upgrade(database_url: str, schema: str | None) -> dict:
    os.environ["DATABASE_URL"] = database_url
    if schema:
        os.environ["DB_SCHEMA"] = schema
    else:
        os.environ.pop("DB_SCHEMA", None)

    cfg = Config(str(MIGRATIONS_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(MIGRATIONS_DIR))
    command.upgrade(cfg, "head")

    head = _bundled_head_revision()
    logger.info("migration upgrade complete", extra={"revision": head, "schema": schema})
    return {"revision": head, "schema": schema}


def _drop_schema(database_url: str, schema: str | None) -> dict:
    if not schema or schema == "public" or not SCHEMA_NAME_RE.fullmatch(schema):
        raise ValueError(
            f"refusing to drop schema {schema!r} -- must be a non-empty, "
            "non-'public' safe identifier"
        )
    engine = create_engine(database_url)
    try:
        with engine.connect() as connection:
            connection.execute(text(f'DROP SCHEMA IF EXISTS "{schema}" CASCADE'))
            connection.commit()
    finally:
        engine.dispose()
    logger.info("schema dropped", extra={"schema": schema})
    return {"dropped_schema": schema}


def _seed_admin(database_url: str, email: str | None, password: str | None) -> dict:
    if not email or not password:
        raise ValueError("seed_admin requires 'email' and 'password' in the payload")
    if len(password) < 12:
        raise ValueError("password must be at least 12 characters")

    engine = create_engine(database_url)
    try:
        with Session(engine) as session:
            existing = session.query(AdminUser).filter_by(email=email).one_or_none()
            if existing is not None:
                raise ValueError(f"admin_users row already exists for {email}")
            session.add(AdminUser(email=email, password_hash=hash_password(password)))
            session.commit()
    finally:
        engine.dispose()

    logger.info("admin user seeded", extra={"email": email})
    return {"seeded_admin_email": email}


def handler(event: dict, _context: Any) -> dict:
    mode = event.get("mode", "check")
    schema = event.get("schema") or os.environ.get("DB_SCHEMA")
    database_url = _database_url()

    if mode == "check":
        return _check(database_url, schema)
    if mode == "upgrade":
        return _upgrade(database_url, schema)
    if mode == "drop_schema":
        return _drop_schema(database_url, schema)
    if mode == "seed_admin":
        return _seed_admin(database_url, event.get("email"), event.get("password"))
    raise ValueError(
        f"Unknown mode: {mode!r} (expected 'check', 'upgrade', 'drop_schema', or 'seed_admin')"
    )
