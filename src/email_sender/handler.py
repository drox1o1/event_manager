"""email-sender Lambda -- renders queued messages and sends them via SES.

Producers (authenticated_api, public_api) publish self-contained JSON
messages to EmailQueue: everything needed to render the email travels in the
message, so this function needs no database/VPC access. Message types:

  Account & security
    organiser_verification   {to, verification_token}
    email_verified            {to, name?}
    password_reset            {to, reset_token, expires_minutes?, audience?: organiser|admin|attendee}
    password_changed          {to, changed_at?, audience?}
  Organiser lifecycle
    organiser_approved        {to}
    organiser_rejected        {to, reason}
    organiser_suspended       {to, reason}
    organiser_reactivated     {to}
    admin_organiser_pending   {to, org_name, contact_name, organiser_email, organiser_id}
  Event lifecycle (organiser / admin)
    event_submitted           {to, event_title, event_id}
    admin_event_pending       {to, event_title, event_id, org_name}
    event_published           {to, event_title, event_id}
    event_rejected            {to, event_title, event_id, reason}
    new_booking                {to, event_title, event_id, buyer_name, ticket_count, total, tickets_sold?, capacity?}
    payout_processed          {to, amount, payout_reference, period?, account_last4?}
  Attendee
    order_confirmation        {to, buyer_name, order_id, order_code, event_*, tickets[], total}  (payment done + tickets)
    payment_failed             {to, buyer_name?, event_title, event_id, order_code?, total?}
    refund_issued              {to, buyer_name?, event_title, order_code, amount, refund_reference?, reason?}
    ticket_approved            {to, attendee_name, event_title, ticket_code, order_id}
    ticket_rejected            {to, attendee_name, event_title, ticket_code}
    event_reminder             {to, buyer_name?, event_title, event_date, event_time, venue, order_id, map_url?}
    event_updated              {to, event_title, event_id, changes: [{field, old, new}], note?}
    event_cancelled            {to, event_title, reason?, refund_amount?}
    transaction_query          {to, order_id, order_code, payment_ref, event_title, buyer_name, buyer_email, buyer_phone, category, message}

Rendering lives in render.py + templates/*.jinja: to add an email, write a
`_name(msg) -> (subject, template_name, context)` function below, add its
template to templates/, and register it in TEMPLATES.

Unknown types and malformed bodies are logged and dropped (retrying won't fix
them). SES send failures are reported as batchItemFailures so SQS retries.

Config (env): EMAIL_FROM_ADDRESS (an SES-verified identity), EMAIL_FROM_NAME,
PUBLIC_SITE_URL, ORGANISER_PORTAL_URL, ADMIN_PANEL_URL. While the SES account is in sandbox
mode, recipients must be verified identities too.
"""

from __future__ import annotations

import json
import os

import boto3
import render
from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger()

_ses_client = None


def _ses():
    global _ses_client
    if _ses_client is None:
        _ses_client = boto3.client("sesv2")
    return _ses_client


Rendered = tuple[str, str, str]  # (subject, html, text)


def _when(msg: dict) -> str:
    return f"{msg.get('event_date', '')} {msg.get('event_time', '')}".strip()


def _reason(msg: dict) -> str | None:
    return msg.get("reason") or None


# --- account & security -----------------------------------------------------


def _organiser_verification(msg: dict):
    url = f"{render.portal()}/verify?token={msg['verification_token']}"
    return "Verify your Showtik organiser email", "organiser_verification.html.jinja", {
        "heading": "Confirm your email",
        "preheader": "One click to confirm your email address.",
        "url": url,
    }


def _email_verified(msg: dict):
    return "Your email is verified", "email_verified.html.jinja", {
        "heading": "Email verified ✔",
        "preheader": "Your application is now in review.",
        "name": msg.get("name"),
    }


def _password_reset(msg: dict):
    url = f"{render.account_url(msg)}/reset-password?token={msg['reset_token']}"
    minutes = msg.get("expires_minutes", 30)
    return "Reset your Showtik password", "password_reset.html.jinja", {
        "heading": "Reset your password",
        "preheader": f"This link expires in {minutes} minutes.",
        "url": url,
        "minutes": minutes,
    }


def _password_changed(msg: dict):
    return "Your Showtik password was changed", "password_changed.html.jinja", {
        "heading": "Password changed",
        "preheader": "A quick security notice about your account.",
        "changed_at": msg.get("changed_at"),
        "support_email": render.SUPPORT_EMAIL,
        "login_url": f"{render.account_url(msg)}/login",
    }


# --- organiser lifecycle ----------------------------------------------------


def _organiser_approved(msg: dict):
    return "You're approved — start creating events on Showtik", "organiser_approved.html.jinja", {
        "heading": "Your organiser account is approved",
        "preheader": "",
        "url": f"{render.portal()}/events/new",
    }


def _organiser_blocked(msg: dict):
    rejected = msg["type"] == "organiser_rejected"
    heading = "About your organiser application" if rejected else "Your organiser account is suspended"
    lead = ("We weren't able to approve your organiser account this time." if rejected
            else "Your Showtik organiser account has been suspended, so you can't create or edit events for now.")
    return heading, "organiser_blocked.html.jinja", {
        "heading": heading,
        "preheader": "",
        "lead": lead,
        "reason": _reason(msg),
        "support_email": render.SUPPORT_EMAIL,
    }


def _organiser_reactivated(msg: dict):
    return "Your Showtik organiser account is active again", "organiser_reactivated.html.jinja", {
        "heading": "Welcome back",
        "preheader": "",
        "portal_url": render.portal(),
    }


def _admin_organiser_pending(msg: dict):
    # To the Showtik team: {to, org_name, contact_name, organiser_email, organiser_id}
    return f"New organiser awaiting review: {msg.get('org_name')}", "admin_organiser_pending.html.jinja", {
        "heading": "New organiser to review",
        "preheader": "",
        "org_name": msg.get("org_name"),
        "contact_name": msg.get("contact_name"),
        "organiser_email": msg.get("organiser_email"),
        "url": f"{render.admin()}/organisers/{msg['organiser_id']}",
    }


# --- event lifecycle (organiser / admin) -----------------------------------


def _event_submitted(msg: dict):
    return f"{msg['event_title']} is in review", "event_submitted.html.jinja", {
        "heading": "Your event is in review",
        "preheader": "",
        "event_title": msg["event_title"],
        "url": f"{render.portal()}/events/{msg['event_id']}/manage/publish",
    }


def _admin_event_pending(msg: dict):
    # To the Showtik team: {to, event_title, event_id, org_name}
    return f"Event awaiting approval: {msg['event_title']}", "admin_event_pending.html.jinja", {
        "heading": "Event to review",
        "preheader": "",
        "org_name": msg.get("org_name"),
        "event_title": msg["event_title"],
        "url": f"{render.admin()}/events/{msg['event_id']}",
    }


def _event_published(msg: dict):
    return f"{msg['event_title']} is live on Showtik", "event_published.html.jinja", {
        "heading": "Your event is live 🎉",
        "preheader": "",
        "event_title": msg["event_title"],
        "url": f"{render.site()}/events/{msg['event_id']}",
    }


def _event_rejected(msg: dict):
    return f"Changes requested for {msg['event_title']}", "event_rejected.html.jinja", {
        "heading": "Your event needs a few changes",
        "preheader": "",
        "event_title": msg["event_title"],
        "reason": _reason(msg),
        "url": f"{render.portal()}/events/{msg['event_id']}/manage/publish",
    }


def _new_booking(msg: dict):
    # To the organiser: {to, event_title, event_id, buyer_name, ticket_count, total, tickets_sold?, capacity?}
    sold = f"{msg['tickets_sold']} / {msg['capacity']}" if msg.get("tickets_sold") is not None and msg.get("capacity") else msg.get("tickets_sold")
    return f"New booking for {msg['event_title']}", "new_booking.html.jinja", {
        "heading": "You have a new booking",
        "preheader": "",
        "event_title": msg["event_title"],
        "buyer_name": msg.get("buyer_name"),
        "ticket_count": msg.get("ticket_count"),
        "total": msg.get("total"),
        "sold": sold,
        "url": f"{render.portal()}/events/{msg['event_id']}/manage/attendees",
    }


def _payout_processed(msg: dict):
    # To the organiser: {to, amount, payout_reference, period?, account_last4?}
    account_display = f"•••• {msg['account_last4']}" if msg.get("account_last4") else None
    return f"Payout of {msg.get('amount')} is on its way", "payout_processed.html.jinja", {
        "heading": "Your payout is on its way",
        "preheader": "",
        "amount": msg.get("amount"),
        "payout_reference": msg.get("payout_reference"),
        "period": msg.get("period"),
        "account_display": account_display,
        "payouts_url": f"{render.portal()}/payouts",
    }


# --- bookings, payments & tickets (attendee) -------------------------------


def _order_confirmation(msg: dict):
    # Payment completed + tickets delivered.
    when = _when(msg)
    return f"Your tickets for {msg.get('event_title')}", "order_confirmation.html.jinja", {
        "heading": "Booking confirmed",
        "preheader": f"Payment received — your tickets for {msg.get('event_title')} are inside.",
        "buyer_name": msg.get("buyer_name"),
        "event_title": msg.get("event_title"),
        "when": when,
        "venue": msg.get("venue"),
        "tickets": msg.get("tickets", []),
        "order_code": msg.get("order_code"),
        "total": msg.get("total"),
        "url": f"{render.site()}/order/{msg['order_id']}",
    }


def _payment_failed(msg: dict):
    # {to, buyer_name?, event_title, event_id, order_code?, total?}
    rows = [("Event", msg.get("event_title")), ("Order", msg.get("order_code")), ("Amount", msg.get("total"))]
    return f"Payment didn't go through for {msg['event_title']}", "payment_failed.html.jinja", {
        "heading": "Your payment didn't go through",
        "preheader": "",
        "buyer_name": msg.get("buyer_name") or "there",
        "rows": rows,
        "url": f"{render.site()}/events/{msg['event_id']}",
    }


def _refund_issued(msg: dict):
    # {to, buyer_name?, event_title, order_code, amount, refund_reference?, reason?}
    rows = [("Event", msg.get("event_title")), ("Order", msg.get("order_code")), ("Refund amount", msg.get("amount")), ("Refund reference", msg.get("refund_reference"))]
    return f"Refund issued for {msg['event_title']}", "refund_issued.html.jinja", {
        "heading": "Your refund is on its way",
        "preheader": "",
        "buyer_name": msg.get("buyer_name") or "there",
        "reason": _reason(msg),
        "rows": rows,
    }


def _ticket_decision(msg: dict):
    approved = msg["type"] == "ticket_approved"
    heading = "Your registration is approved" if approved else "Your registration wasn't approved"
    outcome_text = "has been approved by the organiser — see you there!" if approved else "was not approved by the organiser."
    return heading, "ticket_decision.html.jinja", {
        "heading": heading,
        "preheader": "",
        "attendee_name": msg.get("attendee_name"),
        "ticket_code": msg.get("ticket_code"),
        "event_title": msg.get("event_title"),
        "outcome_text": outcome_text,
        "show_view_ticket": approved and bool(msg.get("order_id")),
        "order_url": f"{render.site()}/order/{msg.get('order_id')}",
    }


def _event_reminder(msg: dict):
    # {to, buyer_name?, event_title, event_date, event_time, venue, order_id, map_url?}
    when = _when(msg)
    return f"Reminder: {msg['event_title']} is coming up", "event_reminder.html.jinja", {
        "heading": "See you soon!",
        "preheader": f"{when} · {msg.get('venue', '')}",
        "buyer_name": msg.get("buyer_name") or "there",
        "event_title": msg["event_title"],
        "when": when,
        "venue": msg.get("venue"),
        "map_url": msg.get("map_url"),
        "url": f"{render.site()}/order/{msg['order_id']}",
    }


def _event_updated(msg: dict):
    # To ticket holders: {to, event_title, event_id, changes: [{field, old, new}], note?}
    return f"Important update: {msg['event_title']}", "event_updated.html.jinja", {
        "heading": "Your event has changed",
        "preheader": "",
        "event_title": msg["event_title"],
        "changes": msg.get("changes", []),
        "note": msg.get("note"),
        "url": f"{render.site()}/events/{msg['event_id']}",
    }


def _event_cancelled(msg: dict):
    # To ticket holders: {to, event_title, reason?, refund_amount?}
    return f"Cancelled: {msg['event_title']}", "event_cancelled.html.jinja", {
        "heading": "This event has been cancelled",
        "preheader": "",
        "event_title": msg["event_title"],
        "reason": _reason(msg),
        "refund_amount": msg.get("refund_amount"),
        "site_url": render.site(),
    }


def _transaction_query(msg: dict):
    # To the Showtik team and the organiser: a buyer raised a query about an
    # order. {to, query_id, order_id, order_code, payment_ref, event_title,
    # buyer_name, buyer_email, buyer_phone, category, message}
    rows = [
        ("Event", msg.get("event_title")),
        ("Order / payment ID", msg.get("order_code")),
        ("Transaction ID", msg.get("payment_ref")),
        ("Buyer", msg.get("buyer_name")),
        ("Mobile", msg.get("buyer_phone")),
        ("Email", msg.get("buyer_email")),
        ("Query type", msg.get("category")),
    ]
    return f"Transaction query: {msg.get('category')} — order {msg.get('order_code')}", "transaction_query.html.jinja", {
        "heading": "New transaction query",
        "preheader": "",
        "rows": rows,
        "message": msg.get("message"),
        "buyer_email": msg.get("buyer_email"),
        "url": f"{render.admin()}/queries",
    }


TEMPLATES = {
    # account & security
    "organiser_verification": _organiser_verification,
    "email_verified": _email_verified,
    "password_reset": _password_reset,
    "password_changed": _password_changed,
    # organiser lifecycle
    "organiser_approved": _organiser_approved,
    "organiser_rejected": _organiser_blocked,
    "organiser_suspended": _organiser_blocked,
    "organiser_reactivated": _organiser_reactivated,
    "admin_organiser_pending": _admin_organiser_pending,
    # event lifecycle
    "event_submitted": _event_submitted,
    "admin_event_pending": _admin_event_pending,
    "event_published": _event_published,
    "event_rejected": _event_rejected,
    "new_booking": _new_booking,
    "payout_processed": _payout_processed,
    # attendee
    "order_confirmation": _order_confirmation,
    "transaction_query": _transaction_query,
    "payment_failed": _payment_failed,
    "refund_issued": _refund_issued,
    "ticket_approved": _ticket_decision,
    "ticket_rejected": _ticket_decision,
    "event_reminder": _event_reminder,
    "event_updated": _event_updated,
    "event_cancelled": _event_cancelled,
}


def _render(msg: dict) -> Rendered | None:
    """(subject, html, text) for a message, or None for an unknown type."""
    build_context = TEMPLATES.get(msg.get("type"))
    if build_context is None:
        return None
    subject, template_name, context = build_context(msg)
    html_body = render.render_html(template_name, context)
    text_body = render.html_to_text(html_body)
    return subject, html_body, text_body


def _send(to: str, subject: str, html_body: str, text_body: str) -> None:
    sender = os.environ["EMAIL_FROM_ADDRESS"]
    name = os.environ.get("EMAIL_FROM_NAME", "Showtik")
    _ses().send_email(
        FromEmailAddress=f"{name} <{sender}>",
        Destination={"ToAddresses": [to]},
        Content={
            "Simple": {
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Html": {"Data": html_body, "Charset": "UTF-8"}, "Text": {"Data": text_body, "Charset": "UTF-8"}},
            }
        },
    )


def handler(event: dict, _context: LambdaContext) -> dict:
    failures = []
    for record in event.get("Records", []):
        message_id = record.get("messageId")
        try:
            msg = json.loads(record.get("body") or "{}")
            to = msg.get("to")
            rendered = _render(msg) if to else None
        except (ValueError, KeyError, TypeError) as exc:
            logger.error("dropping malformed email message", extra={"message_id": message_id, "error": str(exc)})
            continue
        if rendered is None:
            logger.warning("dropping email message with unknown type or no recipient", extra={"message_id": message_id, "type": msg.get("type")})
            continue
        subject, html_body, text_body = rendered
        try:
            _send(to, subject, html_body, text_body)
            logger.info("email sent", extra={"message_id": message_id, "type": msg.get("type")})
        except Exception:  # noqa: BLE001 -- SES/network errors: let SQS retry
            logger.exception("email send failed", extra={"message_id": message_id, "type": msg.get("type")})
            failures.append({"itemIdentifier": message_id})
    return {"batchItemFailures": failures}
