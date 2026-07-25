# CyRokx Backend

Event discovery/ticketing marketplace backend — AWS Lambda (Python), RDS Postgres, API Gateway, SAM.

## Repo layout

- `infra/bootstrap/` — OIDC provider + CI IAM role. Deployed once, manually, by a human with AWS admin credentials.
- `infra/network-data/` — VPC, RDS Postgres, RDS Proxy, Secrets Manager. Deployed manually, rarely. Never touched by CI.
- `infra/app/` — the SAM template: 7 Lambdas, API Gateway, SQS, the migration Step Function, S3. Deployed by CI on every PR and on merge to `main`.
- `src/layers/common/` — shared Lambda Layer: DB session helper, auth (JWT/bcrypt), SQLAlchemy models, pydantic schemas.
- `src/<function>/` — one directory per Lambda function.
- `src/migration_runner/migrations/` — Alembic, full schema. Nested under `migration_runner` (rather than a top-level `migrations/`) so its CodeUri stays self-contained for SAM packaging — it's the only function that needs Alembic.
- `scripts/seed_admin.py` — one-off script to create the first admin user (no self-registration endpoint exists by design).
- `tests/unit/` — pytest unit tests (DB mocked).

## Local setup

```bash
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements/dev.txt
pytest tests/unit
```

## Deploying (one-time, manual)

1. `infra/bootstrap` — creates the GitHub OIDC provider and `cyrokx-ci-role`. Requires AWS admin credentials and your GitHub org/repo filled into `infra/bootstrap/users.yaml`.
2. `infra/network-data` — creates the VPC/RDS/RDS Proxy/Secrets. Requires AWS admin credentials.

After both are deployed once, `infra/app` deploys automatically via GitHub Actions on every PR (as a `cyrokx-app-pr-<branch>` preview stack) and on every merge to `main` (as `cyrokx-app-prod`).

## Status

Foundation pass: infra, full DB schema, full auth, and one representative endpoint per surface (public browse, organiser create+submit event, admin moderate). Checkout/payment, remaining organiser/admin routes, and the frontend are follow-up work — see the plan file for the full scope breakdown.
