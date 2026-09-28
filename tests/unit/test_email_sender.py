"""email_sender: every producer message type renders, unknown types are
dropped, and SES failures are reported back to SQS for retry."""

import json
from unittest.mock import MagicMock

import pytest

MESSAGES = [
    {"type": "organiser_verification", "to": "a@x.com", "verification_token": "tok"},
    {"type": "organiser_approved", "to": "a@x.com"},
    {"type": "organiser_rejected", "to": "a@x.com", "reason": "Incomplete details"},
    {"type": "organiser_suspended", "to": "a@x.com", "reason": None},
    {"type": "organiser_reactivated", "to": "a@x.com"},
    {"type": "event_published", "to": "a@x.com", "event_title": "Run", "event_id": "e1"},
    {"type": "event_rejected", "to": "a@x.com", "event_title": "Run", "event_id": "e1", "reason": "Add a banner"},
    {
        "type": "order_confirmation", "to": "b@x.com", "buyer_name": "Priya", "order_id": "o1", "order_code": "AB12CD34",
        "event_title": "BSF Jammu Marathon <2026>", "event_date": "2026-11-22", "event_time": "5:00 AM", "venue": "Stadium, Jammu",
        "total": "Free", "tickets": [
            {"attendee_name": "Brijesh", "tier": "Full Marathon", "ticket_code": "11111111", "pending": False},
            {"attendee_name": "Asha", "tier": "Half Marathon", "ticket_code": "22222222", "pending": True},
        ],
    },
    {"type": "ticket_approved", "to": "c@x.com", "attendee_name": "Asha", "event_title": "Run", "ticket_code": "22222222", "order_id": "o1"},
    {"type": "ticket_rejected", "to": "c@x.com", "attendee_name": "Asha", "event_title": "Run", "ticket_code": "22222222", "order_id": "o1"},
]


@pytest.mark.parametrize("msg", MESSAGES, ids=[m["type"] for m in MESSAGES])
def test_every_message_type_renders(msg):
    from email_sender.handler import _render

    subject, html_body, text_body = _render(msg)
    assert subject and text_body
    assert "<html>" in html_body


def test_order_email_escapes_html_and_lists_every_ticket():
    from email_sender.handler import _render

    _, html_body, text_body = _render(MESSAGES[7])
    assert "&lt;2026&gt;" in html_body
    assert "11111111" in html_body and "22222222" in html_body
    assert "Awaiting approval" in html_body
    assert "Brijesh (Full Marathon)" in text_body


def _records(*bodies):
    return {"Records": [{"messageId": f"m{i}", "body": json.dumps(b)} for i, b in enumerate(bodies)]}


def test_handler_sends_and_drops_unknown(monkeypatch):
    import email_sender.handler as h

    ses = MagicMock()
    monkeypatch.setattr(h, "_ses", lambda: ses)
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "no-reply@showtik.in")

    result = h.handler(_records(MESSAGES[1], {"type": "nope", "to": "a@x.com"}), MagicMock())
    assert result == {"batchItemFailures": []}
    assert ses.send_email.call_count == 1
    assert ses.send_email.call_args.kwargs["Destination"] == {"ToAddresses": ["a@x.com"]}


def test_handler_reports_ses_failures_for_retry(monkeypatch):
    import email_sender.handler as h

    ses = MagicMock()
    ses.send_email.side_effect = RuntimeError("throttled")
    monkeypatch.setattr(h, "_ses", lambda: ses)
    monkeypatch.setenv("EMAIL_FROM_ADDRESS", "no-reply@showtik.in")

    result = h.handler(_records(MESSAGES[1]), MagicMock())
    assert result == {"batchItemFailures": [{"itemIdentifier": "m0"}]}
