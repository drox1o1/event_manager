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
            {"attendee_name": "Brijesh", "tier": "Full Marathon", "ticket_code": "11111111", "pending": False,
             "details": ["Date of birth: 1990-04-24", "T-shirt size: M"]},
            {"attendee_name": "Asha", "tier": "Half Marathon", "ticket_code": "22222222", "pending": True},
        ],
    },
    {"type": "ticket_approved", "to": "c@x.com", "attendee_name": "Asha", "event_title": "Run", "ticket_code": "22222222", "order_id": "o1"},
    {"type": "ticket_rejected", "to": "c@x.com", "attendee_name": "Asha", "event_title": "Run", "ticket_code": "22222222", "order_id": "o1"},
    {"type": "email_verified", "to": "a@x.com", "name": "Ravi"},
    {"type": "password_reset", "to": "a@x.com", "reset_token": "rtok", "expires_minutes": 30},
    {"type": "password_changed", "to": "a@x.com", "changed_at": "2026-09-28T10:00:00+05:30", "audience": "admin"},
    {"type": "admin_organiser_pending", "to": "ops@x.com", "org_name": "Run Club", "contact_name": "Ravi",
     "organiser_email": "a@x.com", "organiser_id": "org1"},
    {"type": "event_submitted", "to": "a@x.com", "event_title": "Run", "event_id": "e1"},
    {"type": "admin_event_pending", "to": "ops@x.com", "event_title": "Run", "event_id": "e1", "org_name": "Run Club"},
    {"type": "new_booking", "to": "a@x.com", "event_title": "Run", "event_id": "e1", "buyer_name": "Priya",
     "ticket_count": 2, "total": "₹1,000", "tickets_sold": 40, "capacity": 500},
    {"type": "payout_processed", "to": "a@x.com", "amount": "₹25,000", "payout_reference": "PO123", "account_last4": "4321"},
    {"type": "payment_failed", "to": "b@x.com", "event_title": "Run", "event_id": "e1", "order_code": "AB12CD34", "total": "₹500"},
    {"type": "refund_issued", "to": "b@x.com", "event_title": "Run", "order_code": "AB12CD34", "amount": "₹500", "reason": "Event cancelled"},
    {"type": "event_reminder", "to": "b@x.com", "event_title": "Run", "event_date": "2026-11-22", "event_time": "5:00 AM",
     "venue": "Stadium", "order_id": "o1", "map_url": "https://maps.example/x"},
    {"type": "event_updated", "to": "b@x.com", "event_title": "Run", "event_id": "e1",
     "changes": [{"field": "Venue", "old": "Stadium", "new": "Park"}], "note": "Parking at gate 2"},
    {"type": "event_cancelled", "to": "b@x.com", "event_title": "Run", "reason": "Weather", "refund_amount": "₹500"},
    {"type": "transaction_query", "to": "ops@x.com", "query_id": "q1", "order_id": "o1", "order_code": "AB12CD34",
     "payment_ref": "pay_1", "event_title": "Run", "buyer_name": "Priya", "buyer_email": "b@x.com",
     "buyer_phone": "+919876543210", "category": "Payment issue", "message": "Charged twice <b>"},
]


def test_every_template_has_a_test_message():
    from email_sender.handler import SUBJECTS

    assert set(SUBJECTS) == {m["type"] for m in MESSAGES}


def test_dates_render_human_readable_not_iso():
    """dd-mm-yyyy[ HH:MM:SS], not the raw ISO strings producers publish."""
    from email_sender.handler import _render

    _, html_body, _ = _render(
        {"type": "password_changed", "to": "a@x.com", "changed_at": "2026-09-28T10:00:00+05:30"}
    )
    assert "28-09-2026 10:00:00" in html_body
    assert "2026-09-28T10:00:00" not in html_body

    _, html_body, _ = _render(MESSAGES[7])  # order_confirmation, event_date="2026-11-22"
    assert "22-11-2026" in html_body
    assert "2026-11-22" not in html_body


def test_password_reset_links_to_the_right_app(monkeypatch):
    from email_sender.handler import _render

    monkeypatch.setenv("ADMIN_PANEL_URL", "https://admin.example")
    _, html_body, text_body = _render({"type": "password_reset", "to": "a@x.com", "reset_token": "t1", "audience": "admin"})
    assert "https://admin.example/reset-password?token=t1" in text_body
    assert "30 minutes" in html_body


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
    # One registration-confirmation block per participant -- own greeting,
    # race category, and booking ID -- since each ticket in an order can
    # belong to a different person and category.
    assert "Hi Brijesh," in html_body and "Hi Asha," in html_body
    assert "Race category: <strong>Full Marathon</strong>" in html_body
    assert "Race category: <strong>Half Marathon</strong>" in html_body
    assert "Awaiting organiser approval" in html_body  # Asha's ticket is pending
    # Plain-text body is auto-derived from the HTML (tags stripped).
    assert "Hi Brijesh," in text_body and "Hi Asha," in text_body
    assert "Booking ID: 11111111" in text_body and "Booking ID: 22222222" in text_body
    assert "Awaiting organiser approval" in text_body


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
