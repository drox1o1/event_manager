"""Tests for migration_runner's pure validation logic (no live DB needed --
_drop_schema's guard rejects unsafe input before ever calling create_engine)."""

import pytest

from migration_runner.handler import _bundled_head_revision, _drop_schema


def test_bundled_head_revision_matches_the_single_migration():
    assert _bundled_head_revision() == "0001"


@pytest.mark.parametrize(
    "bad_schema", [None, "", "public", "not a safe id!", "a" * 64, "has-a-hyphen"]
)
def test_drop_schema_refuses_unsafe_or_public_targets(bad_schema):
    with pytest.raises(ValueError):
        _drop_schema("postgresql://unused", bad_schema)
