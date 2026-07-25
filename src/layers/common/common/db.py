"""RDS Proxy connection helper.

One engine per Lambda execution environment, reused across warm invocations
(the connection itself is cheap to hold open since RDS Proxy — not this
process — does the real pooling/multiplexing across concurrent Lambdas).
Deliberately kept to a single connection per environment: pool_size=1,
max_overflow=0.

DB_SCHEMA is unset in prod (uses the default "public" schema) and set to a
sanitized branch name for PR-branch stacks, which share one RDS instance but
get their own Postgres schema each.
"""

import json
import os
from collections.abc import Iterator
from contextlib import contextmanager

import boto3
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

_engine = None
_SessionLocal: sessionmaker | None = None


def load_db_credentials() -> dict:
    """Fetch DB credentials from Secrets Manager. Also used by migration_runner,
    which needs a bare connection URL rather than a SQLAlchemy engine."""
    secret_arn = os.environ["DB_SECRET_ARN"]
    client = boto3.client("secretsmanager")
    secret = client.get_secret_value(SecretId=secret_arn)
    return json.loads(secret["SecretString"])


def _get_engine():
    global _engine, _SessionLocal
    if _engine is None:
        creds = load_db_credentials()
        host = os.environ["DB_PROXY_HOST"]
        port = os.environ.get("DB_PORT", "5432")
        dbname = os.environ.get("DB_NAME", "cyrokx")
        schema = os.environ.get("DB_SCHEMA")
        url = (
            f"postgresql+psycopg2://{creds['username']}:{creds['password']}"
            f"@{host}:{port}/{dbname}"
        )
        connect_args = {"options": f"-c search_path={schema}"} if schema else {}
        _engine = create_engine(
            url,
            pool_pre_ping=True,
            pool_size=1,
            max_overflow=0,
            connect_args=connect_args,
        )
        # expire_on_commit=False: handlers build their response dict right after
        # the `with get_session()` block ends, once the session has committed and
        # closed -- without this, touching any attribute on a returned ORM object
        # at that point raises DetachedInstanceError instead of a stale-but-usable
        # read.
        _SessionLocal = sessionmaker(
            bind=_engine, autoflush=False, autocommit=False, expire_on_commit=False
        )
    return _engine


@contextmanager
def get_session() -> Iterator[Session]:
    """Yield a SQLAlchemy session; commits on success, rolls back on exception."""
    _get_engine()
    session = _SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
