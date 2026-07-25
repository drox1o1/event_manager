"""Tests for the custom-authorizer Lambda."""

import uuid

import pytest
from common.auth import issue_access_token

from authorizer.handler import _required_role, handler


def test_required_role_for_organiser_path():
    arn = "arn:aws:execute-api:ap-south-1:123456789012:abc123/prod/POST/organiser/events"
    assert _required_role(arn) == "organiser"


def test_required_role_for_admin_path():
    arn = "arn:aws:execute-api:ap-south-1:123456789012:abc123/prod/GET/admin/moderation-queue"
    assert _required_role(arn) == "admin"


def test_required_role_none_for_unrecognized_path():
    arn = "arn:aws:execute-api:ap-south-1:123456789012:abc123/prod/GET/events"
    assert _required_role(arn) is None


def test_handler_allows_matching_role(mock_jwt_secret):
    organiser_id = uuid.uuid4()
    token = issue_access_token(organiser_id, "organiser")
    event = {
        "authorizationToken": f"Bearer {token}",
        "methodArn": "arn:aws:execute-api:ap-south-1:123456789012:abc123/prod/POST/organiser/events",
    }
    result = handler(event, None)
    assert result["policyDocument"]["Statement"][0]["Effect"] == "Allow"
    assert result["context"]["organiser_id"] == str(organiser_id)
    assert result["context"]["role"] == "organiser"


def test_handler_denies_mismatched_role(mock_jwt_secret):
    admin_id = uuid.uuid4()
    token = issue_access_token(admin_id, "admin")
    event = {
        "authorizationToken": f"Bearer {token}",
        "methodArn": "arn:aws:execute-api:ap-south-1:123456789012:abc123/prod/POST/organiser/events",
    }
    result = handler(event, None)
    assert result["policyDocument"]["Statement"][0]["Effect"] == "Deny"


def test_handler_raises_unauthorized_for_invalid_token(mock_jwt_secret):
    event = {
        "authorizationToken": "Bearer not-a-real-token",
        "methodArn": "arn:aws:execute-api:ap-south-1:123456789012:abc123/prod/GET/admin/moderation-queue",
    }
    with pytest.raises(Exception, match="Unauthorized"):
        handler(event, None)
