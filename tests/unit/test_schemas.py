"""Tests for common.schemas -- pydantic request validation."""

import uuid

import pytest
from common.schemas import EventCreateRequest, OrganiserSignupRequest
from pydantic import ValidationError


def test_organiser_signup_rejects_short_password():
    with pytest.raises(ValidationError):
        OrganiserSignupRequest(
            contact_name="Aditi Rao",
            org_name="Terrace Live",
            email="aditi@terracelive.in",
            password="short",
        )


def test_organiser_signup_rejects_invalid_email():
    with pytest.raises(ValidationError):
        OrganiserSignupRequest(
            contact_name="Aditi Rao",
            org_name="Terrace Live",
            email="not-an-email",
            password="a-long-enough-password",
        )


def test_organiser_signup_accepts_valid_input():
    req = OrganiserSignupRequest(
        contact_name="Aditi Rao",
        org_name="Terrace Live",
        email="aditi@terracelive.in",
        password="a-long-enough-password",
    )
    assert req.email == "aditi@terracelive.in"


def test_event_create_rejects_non_positive_capacity():
    with pytest.raises(ValidationError):
        EventCreateRequest(
            title="Jazz Night",
            category_id=uuid.uuid4(),
            description="An evening of jazz.",
            event_date="2026-07-12",
            event_time="19:00:00",
            venue_name="The Terrace",
            venue_address="Bandra, Mumbai",
            city="Mumbai",
            capacity=0,
        )
