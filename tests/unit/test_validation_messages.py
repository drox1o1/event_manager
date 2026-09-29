"""Validation errors reach users as plain sentences, never pydantic's
developer dump (type=..., input_value=..., docs URL)."""

import pytest
from common.helpers import validation_message
from common.schemas import CheckoutRequest, FormFieldsReplaceRequest, OrganiserSignupRequest
from pydantic import ValidationError


def _message(model, data) -> str:
    with pytest.raises(ValidationError) as exc:
        model.model_validate(data)
    return validation_message(exc.value)


def test_short_password_reads_as_a_sentence():
    msg = _message(OrganiserSignupRequest, {"contact_name": "Kets", "org_name": "Kets", "email": "k@gmail.com", "password": "secret"})
    assert msg == "Password must be at least 8 characters."


def test_several_errors_are_listed_without_pydantic_internals():
    msg = _message(OrganiserSignupRequest, {"contact_name": "", "org_name": "Kets", "email": "nope", "password": "x"})
    assert msg == "Full name is required. Email must be a valid email address. Password must be at least 8 characters."
    for leak in ("type=", "input_value", "pydantic.dev", "validation error"):
        assert leak not in msg


def test_custom_validator_and_model_level_messages():
    phone = _message(CheckoutRequest, {"buyer_name": "A", "buyer_email": "a@b.co", "buyer_phone": "123",
                                       "items": [{"ticket_tier_id": "00000000-0000-0000-0000-000000000000", "quantity": 1}]})
    assert phone == "Mobile number must be a 10-digit number."
    form = _message(FormFieldsReplaceRequest, {"fields": [{"label": "DOB", "field_type": "dob"}, {"label": "DOB 2", "field_type": "dob"}]})
    assert form == "A form can only have one Date of birth question."
