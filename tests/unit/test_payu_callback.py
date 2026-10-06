"""The two inbound PayU paths: the browser's return POST and the webhook.

What matters here is what they refuse to do. A payload that fails hash
verification must not settle anything, and neither entry point may ever answer
with an error -- the buyer has to land somewhere, and a non-2xx to PayU starts a
retry storm.
"""

import json
import urllib.parse
import uuid
from unittest.mock import MagicMock

import pytest
from conftest import PAYU_TEST_CREDENTIALS

SALT = PAYU_TEST_CREDENTIALS["salt"]
KEY = PAYU_TEST_CREDENTIALS["merchant_key"]
ORDER_ID = "d4f1c2b0-0000-4000-8000-000000000001"


def _signed(**overrides):
    """A payload carrying a hash PayU would have produced."""
    from common.payu import response_hash

    posted = {
        "key": KEY,
        "txnid": "ST0123456789abcdef",
        "amount": "998.00",
        "productinfo": "Jammu Marathon",
        "firstname": "Priya",
        "email": "priya@example.com",
        "status": "success",
        "mihpayid": "403993715513540781",
        "mode": "CC",
        "udf1": ORDER_ID,
        "udf2": "",
        "udf3": "",
        "udf4": "",
        "udf5": "",
    }
    posted.update(overrides)
    posted["hash"] = response_hash(posted, SALT)
    return posted


def _form_event(posted, *, path="/payments/payu/return"):
    return {
        "httpMethod": "POST",
        "path": path,
        "resource": path,
        "headers": {"Content-Type": "application/x-www-form-urlencoded"},
        "multiValueHeaders": {},
        "queryStringParameters": None,
        "multiValueQueryStringParameters": None,
        "pathParameters": None,
        "body": urllib.parse.urlencode(posted),
        "isBase64Encoded": False,
        "requestContext": {"authorizer": {}, "domainName": "api.test.example", "stage": "test"},
    }


def _location(response):
    """Powertools emits multiValueHeaders once CORS is configured, plain headers
    otherwise -- read whichever is present rather than depending on which."""
    multi = response.get("multiValueHeaders") or {}
    for key, values in multi.items():
        if key.lower() == "location":
            return values[0]
    for key, value in (response.get("headers") or {}).items():
        if key.lower() == "location":
            return value
    raise AssertionError(f"no Location header in {response!r}")


@pytest.fixture
def settled(monkeypatch):
    """Record settle_order calls instead of touching a database."""
    from common.settlement import SETTLED, SettlementResult

    calls = []

    def _settle(session, txnid, **kwargs):
        calls.append({"txnid": txnid, **kwargs})
        return SettlementResult(SETTLED, uuid.UUID(ORDER_ID))

    monkeypatch.setattr("common.payu_callback.settle_order", _settle)
    monkeypatch.setattr("common.payu_callback.get_session", _null_session)
    monkeypatch.setattr("common.payu_callback.publish_to_ses", lambda m: None)
    return calls


def _null_session():
    from contextlib import contextmanager

    @contextmanager
    def _cm():
        yield MagicMock()

    return _cm()


@pytest.fixture
def payu_verify(monkeypatch):
    """Stub the server-to-server verify call; returns the dict it will answer."""
    answer = {"status": "success", "mihpayid": "403993715513540781", "amt": "998.00", "mode": "CC"}
    monkeypatch.setattr("common.payu.verify_payment", lambda txnid: {"transaction_details": {txnid: answer}})
    return answer


# --- parsing ---


def test_blank_udfs_survive_parsing():
    """Dropping an empty udf changes the response hash, so every genuine
    callback would then fail verification."""
    from common.payu_callback import parse_callback

    parsed = parse_callback("txnid=ST1&udf1=abc&udf2=&udf3=")
    assert parsed == {"txnid": "ST1", "udf1": "abc", "udf2": "", "udf3": ""}


def test_a_base64_body_is_decoded():
    import base64

    from common.payu_callback import parse_callback

    encoded = base64.b64encode(b"txnid=ST1&status=success").decode()
    assert parse_callback(encoded, is_base64=True) == {"txnid": "ST1", "status": "success"}


def test_an_empty_body_parses_to_nothing():
    from common.payu_callback import parse_callback

    assert parse_callback(None) == {}
    assert parse_callback("") == {}


# --- handle_callback ---


def test_a_verified_callback_settles_using_payus_own_answer(settled, payu_verify):
    """The posted status is a fallback only -- anything that came through a
    browser is a claim, not a fact."""
    from common.payu_callback import handle_callback

    payu_verify["status"] = "failure"  # PayU's real verdict disagrees with the post
    handle_callback(_signed(status="success"), source="test")

    assert len(settled) == 1
    assert settled[0]["status"] == "failure"
    assert settled[0]["gateway_amount"] == "998.00"
    assert settled[0]["mihpayid"] == "403993715513540781"


def test_a_tampered_payload_settles_nothing(settled, payu_verify):
    from common.payu_callback import handle_callback

    posted = _signed()
    posted["amount"] = "1.00"  # the field an attacker would change

    assert handle_callback(posted, source="test") is None
    assert settled == []


def test_a_payload_with_no_txnid_settles_nothing(settled, payu_verify):
    from common.payu_callback import handle_callback

    assert handle_callback({"status": "success"}, source="test") is None
    assert settled == []


def test_a_failed_verify_call_falls_back_to_the_posted_status(settled, monkeypatch):
    """Losing the verify call must not lose the payment -- the posted status is
    hash-verified, so it is trustworthy enough to act on."""
    from common.payu_callback import handle_callback

    def _boom(txnid):
        raise RuntimeError("payu unreachable")

    monkeypatch.setattr("common.payu.verify_payment", _boom)
    handle_callback(_signed(status="success"), source="test")

    assert settled[0]["status"] == "success"


def test_an_oversold_settlement_starts_a_refund(monkeypatch, payu_verify):
    from common.payu_callback import OVERSOLD_REFUND_REASON
    from common.settlement import OVERSOLD, SettlementResult

    order_id = uuid.UUID(ORDER_ID)
    monkeypatch.setattr(
        "common.payu_callback.settle_order",
        lambda *a, **kw: SettlementResult(OVERSOLD, order_id, refund_needed=True),
    )
    monkeypatch.setattr("common.payu_callback.get_session", _null_session)

    refunded = {}
    monkeypatch.setattr(
        "common.refunds.refund_order",
        lambda oid, reason: refunded.update(order_id=oid, reason=reason) or "pending",
    )

    from common.payu_callback import handle_callback

    handle_callback(_signed(), source="test")

    assert refunded == {"order_id": order_id, "reason": OVERSOLD_REFUND_REASON}


def test_a_refund_that_cannot_start_does_not_break_the_callback(monkeypatch, payu_verify):
    """The payment settled; failing to *start* the refund leaves a row for the
    reconciler and must not turn a settled payment into an error."""
    from common.settlement import OVERSOLD, SettlementResult

    monkeypatch.setattr(
        "common.payu_callback.settle_order",
        lambda *a, **kw: SettlementResult(OVERSOLD, uuid.UUID(ORDER_ID), refund_needed=True),
    )
    monkeypatch.setattr("common.payu_callback.get_session", _null_session)

    def _boom(order_id, reason):
        raise RuntimeError("payu unreachable")

    monkeypatch.setattr("common.refunds.refund_order", _boom)

    from common.payu_callback import handle_callback

    assert handle_callback(_signed(), source="test").outcome == OVERSOLD


def test_one_bad_email_does_not_suppress_the_others(monkeypatch):
    """A buyer's confirmation must not be lost to a broken organiser notice."""
    published = []

    def _publish(message):
        if message["type"] == "new_booking":
            raise RuntimeError("queue down")
        published.append(message["type"])

    monkeypatch.setattr("common.payu_callback.publish_to_ses", _publish)

    from common.payu_callback import publish_all

    publish_all([{"type": "new_booking"}, {"type": "order_confirmation"}])
    assert published == ["order_confirmation"]


# --- the browser return route ---


def test_the_return_route_redirects_with_303(settled, payu_verify):
    """Only 303 is specified to turn a POST into a GET; a re-POSTed redirect
    would reach the Next.js order route and get a 405."""
    from public_api.handler import handler as api_handler

    response = api_handler(_form_event(_signed()), MagicMock())

    assert response["statusCode"] == 303
    assert _location(response) == f"https://test.showtik.in/order/{ORDER_ID}"


def test_the_return_route_still_redirects_when_verification_fails(settled, payu_verify):
    """The buyer must land somewhere even though nothing was settled -- the
    webhook or the reconciler will resolve the order."""
    from public_api.handler import handler as api_handler

    posted = _signed()
    posted["amount"] = "1.00"
    response = api_handler(_form_event(posted), MagicMock())

    assert response["statusCode"] == 303
    assert _location(response) == f"https://test.showtik.in/order/{ORDER_ID}"
    assert settled == []


def test_the_return_route_never_echoes_a_payu_supplied_destination(settled, payu_verify):
    """This endpoint is unauthenticated; redirecting to a supplied URL would
    make it an open redirect."""
    from public_api.handler import handler as api_handler

    response = api_handler(_form_event(_signed(udf1="https://evil.example/phish")), MagicMock())

    assert _location(response) == "https://test.showtik.in"


def test_the_return_route_handles_an_unusable_order_reference(settled, payu_verify):
    from public_api.handler import handler as api_handler

    response = api_handler(_form_event(_signed(udf1="not-a-uuid")), MagicMock())

    assert response["statusCode"] == 303
    assert _location(response) == "https://test.showtik.in"


# --- the webhook ---


def test_the_webhook_always_answers_200(settled, payu_verify):
    from payment_webhook.handler import handler as webhook

    response = webhook({"body": urllib.parse.urlencode(_signed())}, MagicMock())

    assert response["statusCode"] == 200
    assert json.loads(response["body"]) == {"status": "ok"}
    assert len(settled) == 1


def test_the_webhook_answers_200_for_a_tampered_payload(settled, payu_verify):
    from payment_webhook.handler import handler as webhook

    posted = _signed()
    posted["status"] = "success"
    posted["hash"] = "0" * 128

    assert webhook({"body": urllib.parse.urlencode(posted)}, MagicMock())["statusCode"] == 200
    assert settled == []


def test_the_webhook_answers_200_when_settlement_raises(monkeypatch, payu_verify):
    """A non-2xx makes PayU retry on a schedule we don't control, turning one
    bad request into a storm."""
    monkeypatch.setattr("common.payu_callback.get_session", _null_session)

    def _boom(*a, **kw):
        raise RuntimeError("database down")

    monkeypatch.setattr("common.payu_callback.settle_order", _boom)

    from payment_webhook.handler import handler as webhook

    assert webhook({"body": urllib.parse.urlencode(_signed())}, MagicMock())["statusCode"] == 200


def test_the_webhook_answers_200_for_an_empty_body(settled):
    from payment_webhook.handler import handler as webhook

    assert webhook({}, MagicMock())["statusCode"] == 200
    assert settled == []
