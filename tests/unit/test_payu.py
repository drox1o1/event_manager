"""PayU hashing -- the part where a wrong pipe means every payment is rejected,
or worse, that a tampered callback is accepted.

Expected digests are computed inline from the documented field sequence rather
than pasted as literals: a hardcoded hex string would still "pass" if someone
reordered both the implementation and the fixture in the same wrong way.
"""

import hashlib
from decimal import Decimal

import pytest
from conftest import PAYU_TEST_CREDENTIALS

SALT = PAYU_TEST_CREDENTIALS["salt"]
KEY = PAYU_TEST_CREDENTIALS["merchant_key"]


def _sha512(value: str) -> str:
    return hashlib.sha512(value.encode("utf-8")).hexdigest()


def _request_fields(**overrides):
    fields = {
        "key": KEY,
        "txnid": "ST0123456789abcdef",
        "amount": "1498.00",
        "productinfo": "BSF Jammu Marathon",
        "firstname": "Priya",
        "email": "priya@example.com",
        "phone": "9876543210",
        "udf1": "d4f1c2b0-0000-4000-8000-000000000001",
        "udf2": "",
        "udf3": "",
        "udf4": "",
        "udf5": "",
    }
    fields.update(overrides)
    return fields


# --- format_amount: one string, used by the hash, the form and the DB ---


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (Decimal("1498"), "1498.00"),
        (Decimal("1498.5"), "1498.50"),
        (Decimal("1498.00"), "1498.00"),
        (Decimal("0"), "0.00"),
        (600, "600.00"),
        ("499.9", "499.90"),
    ],
)
def test_format_amount_always_two_decimals(value, expected):
    from common.payu import format_amount

    assert format_amount(value) == expected


def test_form_field_and_hash_use_the_identical_amount_string(mock_payu_secret):
    """A mismatch here is the classic PayU "invalid hash" -- the form says
    1498.5 while the hash covered 1498.50."""
    from common.payu import payment_form, request_hash

    form = payment_form(
        txnid="ST0123456789abcdef",
        amount="1498.50",
        product_info="Run",
        first_name="Priya",
        email="priya@example.com",
        phone="9876543210",
        order_id="d4f1c2b0-0000-4000-8000-000000000001",
        surl="https://api.example/payments/payu/return",
        furl="https://api.example/payments/payu/return",
    )
    assert form["fields"]["amount"] == "1498.50"
    assert form["fields"]["hash"] == request_hash(form["fields"], SALT)


# --- request hash ---


def test_request_hash_matches_documented_sequence():
    from common.payu import request_hash

    fields = _request_fields()
    expected = _sha512(
        "|".join(
            [
                fields["key"], fields["txnid"], fields["amount"], fields["productinfo"],
                fields["firstname"], fields["email"],
                fields["udf1"], "", "", "", "",
                "", "", "", "", "",  # udf6..udf10, reserved and always empty
                SALT,
            ]
        )
    )
    assert request_hash(fields, SALT) == expected


def test_request_hash_includes_the_five_reserved_udf_slots():
    """Dropping the reserved pipes is the single most common integration bug;
    assert the string really is 17 segments long."""
    from common.payu import request_hash

    fields = _request_fields()
    without_reserved = _sha512(
        "|".join([fields[k] for k in ("key", "txnid", "amount", "productinfo", "firstname", "email")]
                 + [fields["udf1"], "", "", "", "", SALT])
    )
    assert request_hash(fields, SALT) != without_reserved


def test_request_hash_treats_missing_udfs_as_empty_not_none():
    from common.payu import request_hash

    with_blanks = _request_fields(udf2="", udf3="", udf4="", udf5="")
    omitted = {k: v for k, v in with_blanks.items() if k not in ("udf2", "udf3", "udf4", "udf5")}
    assert request_hash(omitted, SALT) == request_hash(with_blanks, SALT)


# --- response hash ---


def _posted(**overrides):
    posted = {
        "key": KEY,
        "txnid": "ST0123456789abcdef",
        "amount": "1498.00",
        "productinfo": "BSF Jammu Marathon",
        "firstname": "Priya",
        "email": "priya@example.com",
        "status": "success",
        "udf1": "d4f1c2b0-0000-4000-8000-000000000001",
        "udf2": "",
        "udf3": "",
        "udf4": "",
        "udf5": "",
        "mihpayid": "403993715513540781",
    }
    posted.update(overrides)
    return posted


def _expected_response_hash(posted, *, additional_charges=None):
    base = "|".join(
        [
            SALT, posted["status"],
            "", "", "", "", "",  # udf10..udf6, reserved
            posted["udf5"], posted["udf4"], posted["udf3"], posted["udf2"], posted["udf1"],
            posted["email"], posted["firstname"], posted["productinfo"],
            posted["amount"], posted["txnid"], posted["key"],
        ]
    )
    if additional_charges is not None:
        base = f"{additional_charges}|{base}"
    return _sha512(base)


def test_response_hash_matches_documented_reverse_sequence():
    from common.payu import response_hash

    posted = _posted()
    assert response_hash(posted, SALT) == _expected_response_hash(posted)


def test_response_hash_is_not_the_request_hash_reversed_by_accident():
    """Guards against an implementation that reuses the request ordering."""
    from common.payu import request_hash, response_hash

    posted = _posted()
    assert response_hash(posted, SALT) != request_hash(_request_fields(), SALT)


def test_additional_charges_is_prepended_when_present():
    from common.payu import response_hash

    posted = _posted(additionalCharges="15.00")
    assert response_hash(posted, SALT) == _expected_response_hash(posted, additional_charges="15.00")


def test_empty_additional_charges_still_counts_as_present():
    """PayU's rule is key presence, not truthiness -- an empty value still
    changes the hash, and reading it as falsy rejects every real callback on
    accounts that send it."""
    from common.payu import response_hash

    posted = _posted(additionalCharges="")
    with_empty = response_hash(posted, SALT)

    assert with_empty == _expected_response_hash(posted, additional_charges="")
    assert with_empty != _expected_response_hash(_posted())


# --- verify_response: authenticity, and only authenticity ---


def test_verify_response_accepts_a_genuine_payload(mock_payu_secret):
    from common.payu import response_hash, verify_response

    posted = _posted()
    posted["hash"] = response_hash(posted, SALT)
    assert verify_response(posted) is True


def test_verify_response_accepts_an_uppercase_hash(mock_payu_secret):
    from common.payu import response_hash, verify_response

    posted = _posted()
    posted["hash"] = response_hash(posted, SALT).upper()
    assert verify_response(posted) is True


@pytest.mark.parametrize("field", ["amount", "status", "txnid", "udf1", "email", "firstname", "productinfo"])
def test_verify_response_rejects_a_tampered_field(mock_payu_secret, field):
    """Each of these is signed, so editing any one in transit must fail --
    `amount` especially: it is the field an attacker would change."""
    from common.payu import response_hash, verify_response

    posted = _posted()
    posted["hash"] = response_hash(posted, SALT)
    posted[field] = posted[field] + "x" if field != "amount" else "1.00"
    assert verify_response(posted) is False


def test_verify_response_rejects_a_tampered_hash(mock_payu_secret):
    from common.payu import response_hash, verify_response

    posted = _posted()
    genuine = response_hash(posted, SALT)
    posted["hash"] = ("0" if genuine[0] != "0" else "1") + genuine[1:]
    assert verify_response(posted) is False


def test_verify_response_rejects_a_missing_hash(mock_payu_secret):
    from common.payu import verify_response

    assert verify_response(_posted()) is False


# --- postservice commands ---


def test_verify_payment_hashes_key_command_var1_salt(mock_payu_secret, monkeypatch):
    from common import payu

    captured = {}

    def _fake_post(command, var1, *extra):
        captured["command"] = command
        captured["var1"] = var1
        captured["extra"] = extra
        return {"status": 1}

    monkeypatch.setattr(payu, "_post_service", _fake_post)
    payu.verify_payment("ST0123456789abcdef")

    assert captured == {"command": "verify_payment", "var1": "ST0123456789abcdef", "extra": ()}


def test_refund_passes_mihpayid_reference_and_amount(mock_payu_secret, monkeypatch):
    from common import payu

    captured = {}
    monkeypatch.setattr(payu, "_post_service", lambda c, v1, *e: captured.update(command=c, var1=v1, extra=e) or {})
    payu.refund("403993715513540781", "refund-ref-1", "1498.00")

    assert captured["command"] == "cancel_refund_transaction"
    assert captured["var1"] == "403993715513540781"
    assert captured["extra"] == ("refund-ref-1", "1498.00")


def test_post_service_builds_the_documented_hash_and_url(mock_payu_secret, monkeypatch):
    from common import payu

    sent = {}

    class _Response:
        def read(self):
            return b'{"status": 1}'

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    def _fake_urlopen(request, timeout=None):
        sent["url"] = request.full_url
        sent["body"] = request.data.decode()
        sent["timeout"] = timeout
        return _Response()

    monkeypatch.setattr(payu.urllib.request, "urlopen", _fake_urlopen)
    assert payu._post_service("verify_payment", "ST1") == {"status": 1}

    assert sent["url"] == "https://test.payu.in/merchant/postservice.php?form=2"
    assert sent["timeout"] == payu.HTTP_TIMEOUT_SECONDS
    expected_hash = _sha512(f"{KEY}|verify_payment|ST1|{SALT}")
    assert f"hash={expected_hash}" in sent["body"]


def test_post_service_survives_a_non_json_reply(mock_payu_secret, monkeypatch):
    """PayU sometimes answers with a bare error string; callers must get a
    dict with no verdict rather than an exception that loses the payment."""
    from common import payu

    class _Response:
        def read(self):
            return b"Invalid merchant key"

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

    monkeypatch.setattr(payu.urllib.request, "urlopen", lambda *a, **kw: _Response())
    result = payu._post_service("verify_payment", "ST1")

    assert result["status"] == 0
    assert "Invalid merchant key" in result["msg"]


# --- productinfo sanitising ---


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("BSF Jammu Marathon <2026>", "BSF Jammu Marathon <2026>"),
        ("Run | Walk", "Run Walk"),  # the pipe is PayU's own delimiter
        ("Café Night", "Caf Night"),  # non-ASCII dropped
        ("   spaced   out   ", "spaced out"),
        ("", "Event registration"),
        ("…", "Event registration"),  # nothing survives ASCII-stripping
    ],
)
def test_product_info_is_sanitised(raw, expected):
    from common.payu import _sanitise_product_info

    assert _sanitise_product_info(raw) == expected


def test_product_info_is_length_capped():
    from common.payu import _sanitise_product_info

    assert len(_sanitise_product_info("a" * 500)) == 100


# --- transaction_status ---


def test_transaction_status_extracts_the_matching_txnid():
    from common.payu import transaction_status

    result = {"status": 1, "transaction_details": {"ST1": {"status": "success", "amt": "100.00"}}}
    assert transaction_status(result, "ST1") == {"status": "success", "amt": "100.00"}


@pytest.mark.parametrize(
    "result",
    [
        {},
        {"transaction_details": {}},
        {"transaction_details": {"OTHER": {"status": "success"}}},
        {"transaction_details": "not a dict"},
        {"transaction_details": {"ST1": "not a dict"}},
    ],
)
def test_transaction_status_returns_none_when_payu_has_no_record(result):
    """No record for a fresh attempt means the buyer never reached the payment
    page -- not that it failed, so callers must be able to tell the difference."""
    from common.payu import transaction_status

    assert transaction_status(result, "ST1") is None
