"""One-off script to create the first admin_users row.

Admin accounts have no self-registration endpoint by design (super-admin
access is provisioned by the platform team). This is the only way to create
one — run manually, once, against the target database. Credentials are read
from the environment, never hardcoded or committed.

Usage:
    ADMIN_EMAIL=admin@cyrokx.com \\
    ADMIN_PASSWORD='...' \\
    DATABASE_URL='postgresql+psycopg2://user:pass@host:5432/cyrokx' \\
    python scripts/seed_admin.py
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src" / "layers" / "common"))

from common.auth import hash_password  # noqa: E402
from common.models import AdminUser  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402


def main() -> None:
    email = os.environ["ADMIN_EMAIL"]
    password = os.environ["ADMIN_PASSWORD"]
    database_url = os.environ["DATABASE_URL"]

    if len(password) < 12:
        raise SystemExit("ADMIN_PASSWORD must be at least 12 characters")

    engine = create_engine(database_url)
    with Session(engine) as session:
        existing = session.query(AdminUser).filter_by(email=email).one_or_none()
        if existing is not None:
            raise SystemExit(f"admin_users row already exists for {email}")
        session.add(AdminUser(email=email, password_hash=hash_password(password)))
        session.commit()

    print(f"Created admin user: {email}")


if __name__ == "__main__":
    main()
