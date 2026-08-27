"""Tests for migration_runner's pure validation logic (no live DB needed --
_drop_schema's and _seed_admin's guards reject unsafe input before ever
calling create_engine)."""

import pytest

from migration_runner.handler import _bundled_head_revision, _drop_schema, _seed_admin


def test_bundled_head_revision_matches_the_single_migration():
    assert _bundled_head_revision() == "0001"


@pytest.mark.parametrize(
    "bad_schema", [None, "", "public", "not a safe id!", "a" * 64, "has-a-hyphen"]
)
def test_drop_schema_refuses_unsafe_or_public_targets(bad_schema):
    with pytest.raises(ValueError):
        _drop_schema("postgresql://unused", bad_schema)


@pytest.mark.parametrize(
    ("email", "password"),
    [
        (None, "a-long-enough-password"),
        ("admin@cyrokx.com", None),
        ("admin@cyrokx.com", "too-short"),
    ],
)
def test_seed_admin_refuses_missing_or_weak_credentials(email, password):
    with pytest.raises(ValueError):
        _seed_admin("postgresql://unused", email, password, None)


@pytest.mark.parametrize("bad_schema", ["not a safe id!", "a" * 64, "has-a-hyphen"])
def test_seed_admin_refuses_unsafe_schema(bad_schema):
    with pytest.raises(ValueError):
        _seed_admin("postgresql://unused", "admin@cyrokx.com", "a-long-enough-password", bad_schema)
