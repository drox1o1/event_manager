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

Rendering lives in render.py + templates/*.jinja. A template is resolved by
convention -- type "foo_bar" renders templates/foo_bar.html.jinja, with the
raw message dict passed straight through as context -- so most new email
types need nothing here beyond a SUBJECTS entry and a template file:

    SUBJECTS["my_new_type"] = lambda msg: f"Subject line for {msg['thing']}"

Only register a CONTEXT_BUILDERS entry when a type needs real computed or
branching values the template can't build on its own (conditional string
formatting, or two message types sharing one template with different
wording) -- see organiser_blocked/ticket_decision below for the latter, and
_new_booking/_payout_processed for the former. Only register a
TEMPLATE_OVERRIDES entry when the template's filename doesn't match the
message type (again, the two shared-template cases).

Unknown types and malformed bodies are logged and dropped (retrying won't fix
them). SES send failures are reported as batchItemFailures so SQS retries.

Config (env): EMAIL_FROM_ADDRESS (an SES-verified identity), EMAIL_FROM_NAME,
PUBLIC_SITE_URL, ORGANISER_PORTAL_URL, ADMIN_PANEL_URL. While the SES account is in sandbox
mode, recipients must be verified identities too.
"""

from __future__ import annotations

import json
import os
from collections.abc import Callable

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


# --- context builders: only for types needing real computation/branching ---


def _organiser_blocked(msg: dict) -> dict:
    rejected = msg["type"] == "organiser_rejected"
    heading = "About your organiser application" if rejected else "Your organiser account is suspended"
    lead = ("We weren't able to approve your organiser account this time." if rejected
            else "Your Showtik organiser account has been suspended, so you can't create or edit events for now.")
    return {**msg, "heading": heading, "lead": lead}


def _ticket_decision(msg: dict) -> dict:
    approved = msg["type"] == "ticket_approved"
    return {
        **msg,
        "heading": "Your registration is approved" if approved else "Your registration wasn't approved",
        "outcome_text": ("has been approved by the organiser — see you there!" if approved
                          else "was not approved by the organiser."),
        "show_view_ticket": approved and bool(msg.get("order_id")),
    }


def _new_booking(msg: dict) -> dict:
    sold = f"{msg['tickets_sold']} / {msg['capacity']}" if msg.get("tickets_sold") is not None and msg.get("capacity") else msg.get("tickets_sold")
    return {**msg, "sold": sold}


def _payout_processed(msg: dict) -> dict:
    account_display = f"•••• {msg['account_last4']}" if msg.get("account_last4") else None
    return {**msg, "account_display": account_display}


CONTEXT_BUILDERS: dict[str, Callable[[dict], dict]] = {
    "organiser_rejected": _organiser_blocked,
    "organiser_suspended": _organiser_blocked,
    "ticket_approved": _ticket_decision,
    "ticket_rejected": _ticket_decision,
    "new_booking": _new_booking,
    "payout_processed": _payout_processed,
}

# Only needed where the template filename doesn't match the message type.
TEMPLATE_OVERRIDES: dict[str, str] = {
    "organiser_rejected": "organiser_blocked.html.jinja",
    "organiser_suspended": "organiser_blocked.html.jinja",
    "ticket_approved": "ticket_decision.html.jinja",
    "ticket_rejected": "ticket_decision.html.jinja",
}

SUBJECTS: dict[str, Callable[[dict], str]] = {
    # account & security
    "organiser_verification": lambda msg: "Verify your Showtik organiser email",
    "email_verified": lambda msg: "Your email is verified",
    "password_reset": lambda msg: "Reset your Showtik password",
    "password_changed": lambda msg: "Your Showtik password was changed",
    # organiser lifecycle
    "organiser_approved": lambda msg: "You're approved — start creating events on Showtik",
    "organiser_rejected": lambda msg: "About your organiser application",
    "organiser_suspended": lambda msg: "Your organiser account is suspended",
    "organiser_reactivated": lambda msg: "Your Showtik organiser account is active again",
    "admin_organiser_pending": lambda msg: f"New organiser awaiting review: {msg.get('org_name')}",
    # event lifecycle
    "event_submitted": lambda msg: f"{msg['event_title']} is in review",
    "admin_event_pending": lambda msg: f"Event awaiting approval: {msg['event_title']}",
    "event_published": lambda msg: f"{msg['event_title']} is live on Showtik",
    "event_rejected": lambda msg: f"Changes requested for {msg['event_title']}",
    "new_booking": lambda msg: f"New booking for {msg['event_title']}",
    "payout_processed": lambda msg: f"Payout of {msg.get('amount')} is on its way",
    # attendee
    "order_confirmation": lambda msg: f"Your tickets for {msg.get('event_title')}",
    "transaction_query": lambda msg: f"Transaction query: {msg.get('category')} — order {msg.get('order_code')}",
    "payment_failed": lambda msg: f"Payment didn't go through for {msg['event_title']}",
    "refund_issued": lambda msg: f"Refund issued for {msg['event_title']}",
    "ticket_approved": lambda msg: "Your registration is approved",
    "ticket_rejected": lambda msg: "Your registration wasn't approved",
    "event_reminder": lambda msg: f"Reminder: {msg['event_title']} is coming up",
    "event_updated": lambda msg: f"Important update: {msg['event_title']}",
    "event_cancelled": lambda msg: f"Cancelled: {msg['event_title']}",
}


def _render(msg: dict) -> Rendered | None:
    """(subject, html, text) for a message, or None for an unknown type."""
    msg_type = msg.get("type")
    subject_fn = SUBJECTS.get(msg_type)
    if subject_fn is None:
        return None
    subject = subject_fn(msg)
    template_name = TEMPLATE_OVERRIDES.get(msg_type, f"{msg_type}.html.jinja")
    context_fn = CONTEXT_BUILDERS.get(msg_type)
    context = context_fn(msg) if context_fn else msg
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
