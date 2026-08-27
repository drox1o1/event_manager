.DEFAULT_GOAL := help

PYTHON ?= python3.13
VENV := .venv
VENV_BIN := $(VENV)/bin

STAGE ?=
REGION ?= ap-south-1
SAM_ARTIFACTS_BUCKET ?= cyrokx-sam-artifacts-aps1-REPLACE_WITH_ACCOUNT_ID
STACK_NAME ?= cyrokx-app-$(subst _,-,$(STAGE))

DEPLOY_PROD_ARGS :=
ifneq ($(SAM_ARTIFACTS_BUCKET),cyrokx-sam-artifacts-aps1-REPLACE_WITH_ACCOUNT_ID)
DEPLOY_PROD_ARGS += --s3-bucket $(SAM_ARTIFACTS_BUCKET)
endif

.PHONY: help venv install lint format test check \
	sam-validate sam-build deploy-prod deploy-branch teardown-branch api-url \
	migrate-check migrate-upgrade migrate-drop-schema bootstrap-ci seed-admin \
	frontend-install frontend-dev-public frontend-dev-organiser frontend-dev-admin frontend-build frontend-lint \
	frontend-package frontend-sam-build frontend-deploy

help:
	@echo "venv install lint format test check sam-validate sam-build deploy-prod deploy-branch teardown-branch api-url migrate-check migrate-upgrade migrate-drop-schema bootstrap-ci seed-admin frontend-install frontend-dev-public frontend-dev-organiser frontend-dev-admin frontend-build frontend-lint frontend-package frontend-sam-build frontend-deploy" | tr ' ' '\n'

$(VENV_BIN)/activate:
	$(PYTHON) -m venv $(VENV)

venv: $(VENV_BIN)/activate

# Reinstalls whenever requirements/dev.txt changes (mtime-based), and is a
# no-op otherwise -- lint/test/seed-admin depend on this, not on venv
# directly, so deps are always current even if `install` was never run.
$(VENV)/.installed: $(VENV_BIN)/activate requirements/dev.txt
	$(VENV_BIN)/pip install -r requirements/dev.txt
	touch $(VENV)/.installed

install: $(VENV)/.installed

lint: install
	$(VENV_BIN)/ruff check .

format: install
	$(VENV_BIN)/ruff format .

test: install
	$(VENV_BIN)/pytest tests/unit

check: lint test

sam-validate: install
	$(VENV_BIN)/sam validate --lint --template infra/network-data/template.yaml
	$(VENV_BIN)/sam validate --lint --template infra/app/template.yaml

sam-build: install
	$(VENV_BIN)/sam build --template infra/app/template.yaml

deploy-prod: sam-build
	$(VENV_BIN)/sam deploy --config-file infra/app/samconfig.toml $(DEPLOY_PROD_ARGS)

deploy-branch: sam-build
	@test -n "$(STAGE)" || (echo "STAGE is required, e.g. make deploy-branch STAGE=pr_foo" && exit 1)
	$(VENV_BIN)/sam deploy \
		--stack-name "$(STACK_NAME)" \
		--s3-bucket "$(SAM_ARTIFACTS_BUCKET)" \
		--region "$(REGION)" \
		--capabilities CAPABILITY_IAM \
		--parameter-overrides "Stage=$(STAGE) DbSchema=$(STAGE)" \
		--no-confirm-changeset \
		--no-fail-on-empty-changeset

teardown-branch: install
	@test -n "$(STAGE)" || (echo "STAGE is required, e.g. make teardown-branch STAGE=pr_foo" && exit 1)
	$(VENV_BIN)/sam delete \
		--stack-name "$(STACK_NAME)" \
		--region "$(REGION)" \
		--no-prompts

api-url:
	@test -n "$(STAGE)" || (echo "STAGE is required, e.g. make api-url STAGE=pr_foo" && exit 1)
	@aws cloudformation describe-stacks \
		--stack-name "$(STACK_NAME)" \
		--region "$(REGION)" \
		--query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
		--output text

migrate-check:
	@aws lambda invoke \
		--function-name cyrokx-migration-runner-$(if $(STAGE),$(STAGE),prod) \
		--payload '{"mode":"check"}' \
		--cli-binary-format raw-in-base64-out \
		response.json
	@cat response.json

migrate-upgrade:
	@test -n "$(STAGE)" || (echo "STAGE is required, e.g. make migrate-upgrade STAGE=pr_foo" && exit 1)
	aws lambda invoke \
		--function-name cyrokx-migration-runner-$(STAGE) \
		--payload '{"mode":"upgrade","schema":"$(STAGE)"}' \
		--cli-binary-format raw-in-base64-out \
		response.json
	@cat response.json

migrate-drop-schema:
	@test -n "$(STAGE)" || (echo "STAGE is required, e.g. make migrate-drop-schema STAGE=pr_foo" && exit 1)
	aws lambda invoke \
		--function-name cyrokx-migration-runner-$(STAGE) \
		--payload '{"mode":"drop_schema","schema":"$(STAGE)"}' \
		--cli-binary-format raw-in-base64-out \
		response.json || echo "Function may already be gone -- continuing to stack delete"
	@cat response.json || true

bootstrap-ci:
	python3 infra/bootstrap/apply.py

seed-admin:
	@test -n "$(ADMIN_EMAIL)" || (echo "ADMIN_EMAIL is required, e.g. make seed-admin ADMIN_EMAIL=admin@cyrokx.com ADMIN_PASSWORD=..." && exit 1)
	@test -n "$(ADMIN_PASSWORD)" || (echo "ADMIN_PASSWORD is required, e.g. make seed-admin ADMIN_EMAIL=admin@cyrokx.com ADMIN_PASSWORD=..." && exit 1)
	@aws lambda invoke \
		--function-name cyrokx-migration-runner-$(if $(STAGE),$(STAGE),prod) \
		--payload '{"mode":"seed_admin","email":"$(ADMIN_EMAIL)","password":"$(ADMIN_PASSWORD)"}' \
		--cli-binary-format raw-in-base64-out \
		response.json
	@cat response.json

frontend-install:
	cd frontend && npm install

frontend-dev-public:
	cd frontend && npm run dev:public-site

frontend-dev-organiser:
	cd frontend && npm run dev:organiser-portal

frontend-dev-admin:
	cd frontend && npm run dev:admin-panel

frontend-build:
	cd frontend && npm run build

frontend-lint:
	cd frontend && npm run lint

# Assembles .build/frontend/<app>/ (standalone server + static/public +
# run.sh) from each app's `next build` output -- see
# scripts/package_frontend.sh and infra/frontend/template.yaml.
frontend-package: frontend-build
	./scripts/package_frontend.sh public-site
	./scripts/package_frontend.sh organiser-portal
	./scripts/package_frontend.sh admin-panel

frontend-sam-build: install frontend-package
	$(VENV_BIN)/sam build --template infra/frontend/template.yaml

frontend-deploy: frontend-sam-build
	$(VENV_BIN)/sam deploy \
		--stack-name cyrokx-frontend-$(if $(STAGE),$(STAGE),dev) \
		--s3-bucket "$(SAM_ARTIFACTS_BUCKET)" \
		--region "$(REGION)" \
		--capabilities CAPABILITY_IAM \
		--parameter-overrides "Stage=$(if $(STAGE),$(STAGE),dev)" \
		--no-confirm-changeset \
		--no-fail-on-empty-changeset
