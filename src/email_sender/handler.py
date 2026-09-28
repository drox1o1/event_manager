"""email-sender Lambda -- renders queued messages and sends them via SES.

Producers (authenticated_api, public_api) publish self-contained JSON
messages to EmailQueue: everything needed to render the email travels in the
message, so this function needs no database/VPC access. Message types:

  organiser_verification   {to, verification_token}
  organiser_approved       {to}
  organiser_rejected       {to, reason}
  organiser_suspended      {to, reason}
  organiser_reactivated    {to}
  event_published          {to, event_title, event_id}
  event_rejected           {to, event_title, event_id, reason}
  order_confirmation       {to, buyer_name, order_id, order_code, event_*, tickets[], total}
  ticket_approved          {to, attendee_name, event_title, ticket_code, order_id}
  ticket_rejected          {to, attendee_name, event_title, ticket_code}

Unknown types and malformed bodies are logged and dropped (retrying won't fix
them). SES send failures are reported as batchItemFailures so SQS retries.

Config (env): EMAIL_FROM_ADDRESS (an SES-verified identity), EMAIL_FROM_NAME,
PUBLIC_SITE_URL, ORGANISER_PORTAL_URL. While the SES account is in sandbox
mode, recipients must be verified identities too.
"""

from __future__ import annotations

import html
import json
import os

import boto3
from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext

logger = Logger()

_ses_client = None


def _ses():
    global _ses_client
    if _ses_client is None:
        _ses_client = boto3.client("sesv2")
    return _ses_client


def _site() -> str:
    return os.environ.get("PUBLIC_SITE_URL", "https://showtik.in").rstrip("/")


def _portal() -> str:
    return os.environ.get("ORGANISER_PORTAL_URL", "https://host.showtik.in").rstrip("/")


def _e(value) -> str:
    return html.escape(str(value if value is not None else ""))


def _button(label: str, url: str) -> str:
    return (
        f'<a href="{_e(url)}" style="display:inline-block;background:#C4143F;color:#ffffff;'
        f'text-decoration:none;font-weight:700;padding:13px 26px;border-radius:10px">{_e(label)}</a>'
    )


def _layout(heading: str, body_html: str) -> str:
    return f"""<!doctype html><html><body style="margin:0;background:#F5F5F5;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#333">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#051747;padding:22px 28px;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.01em">showtik</td></tr>
<tr><td style="padding:30px 28px 8px"><h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;color:#051747">{_e(heading)}</h1>{body_html}</td></tr>
<tr><td style="padding:22px 28px 28px;font-size:12px;color:#999">You're receiving this because of activity on your Showtik account or booking.</td></tr>
</table></td></tr></table></body></html>"""


def _p(text: str) -> str:
    return f'<p style="margin:0 0 16px;font-size:15px;line-height:1.6">{text}</p>'


def _render(msg: dict) -> tuple[str, str, str] | None:
    """(subject, html, text) for a message, or None for an unknown type."""
    kind = msg.get("type")
    reason = msg.get("reason")

    if kind == "organiser_verification":
        url = f"{_portal()}/verify?token={msg['verification_token']}"
        return (
            "Verify your Showtik organiser email",
            _layout("Confirm your email", _p("Thanks for signing up as an organiser on Showtik. Confirm your email address to continue.")
                    + _p(_button("Verify email", url))
                    + _p("Our team also reviews every new organiser — we'll email you as soon as your account is approved.")),
            f"Confirm your email: {url}\n\nWe'll email you once your organiser account is approved.",
        )
    if kind == "organiser_approved":
        url = f"{_portal()}/events/new"
        return (
            "You're approved — start creating events on Showtik",
            _layout("Your organiser account is approved", _p("Good news — the Showtik team has approved your organiser account. You can now create and publish events.")
                    + _p(_button("Create your first event", url))),
            f"Your Showtik organiser account is approved. Create an event: {url}",
        )
    if kind in ("organiser_rejected", "organiser_suspended"):
        rejected = kind == "organiser_rejected"
        heading = "About your organiser application" if rejected else "Your organiser account is suspended"
        lead = ("We weren't able to approve your organiser account this time." if rejected
                else "Your Showtik organiser account has been suspended, so you can't create or edit events for now.")
        why = _p(f"<strong>Reason:</strong> {_e(reason)}") if reason else ""
        return (
            heading,
            _layout(heading, _p(lead) + why + _p("If you think this is a mistake, reply to this email or write to support@showtik.com.")),
            f"{lead}\n{'Reason: ' + reason if reason else ''}\nContact support@showtik.com if this is a mistake.",
        )
    if kind == "organiser_reactivated":
        return (
            "Your Showtik organiser account is active again",
            _layout("Welcome back", _p("Your organiser account has been reinstated — you can create and manage events again.") + _p(_button("Open organiser portal", _portal()))),
            f"Your organiser account is active again: {_portal()}",
        )
    if kind == "event_published":
        url = f"{_site()}/events/{msg['event_id']}"
        return (
            f"{msg['event_title']} is live on Showtik",
            _layout("Your event is live 🎉", _p(f"<strong>{_e(msg['event_title'])}</strong> has been approved and is now live — anyone can find it and book tickets.") + _p(_button("View event page", url))),
            f"{msg['event_title']} is live: {url}",
        )
    if kind == "event_rejected":
        url = f"{_portal()}/events/{msg['event_id']}/manage/publish"
        return (
            f"Changes requested for {msg['event_title']}",
            _layout("Your event needs a few changes", _p(f"The Showtik team reviewed <strong>{_e(msg['event_title'])}</strong> and requested changes before it can go live.")
                    + _p(f"<strong>Feedback:</strong> {_e(reason)}") + _p(_button("Edit and resubmit", url))),
            f"Changes requested for {msg['event_title']}: {reason}\nEdit: {url}",
        )
    if kind == "order_confirmation":
        url = f"{_site()}/order/{msg['order_id']}"
        rows = ""
        for t in msg.get("tickets", []):
            pending = '<br><span style="color:#B45309;font-size:12px">Awaiting approval</span>' if t.get("pending") else ""
            rows += (
                '<tr><td style="padding:10px 0;border-top:1px solid #eee">'
                f'<strong>{_e(t["attendee_name"])}</strong><br><span style="color:#666;font-size:13px">{_e(t["tier"])}</span></td>'
                '<td style="padding:10px 0;border-top:1px solid #eee;text-align:right;font-family:monospace">'
                f"{_e(t['ticket_code'])}{pending}</td></tr>"
            )
        when = f"{msg.get('event_date', '')} {msg.get('event_time', '')}".strip()
        body = (
            _p(f"Hi {_e(msg.get('buyer_name'))}, you're going to <strong>{_e(msg.get('event_title'))}</strong>!")
            + _p(f"📅 {_e(when)}<br>📍 {_e(msg.get('venue'))}")
            + f'<table role="presentation" width="100%" style="margin:0 0 16px;font-size:14px">{rows}</table>'
            + _p(f"Order / payment ID: <strong style=\"font-family:monospace\">{_e(msg.get('order_code'))}</strong> · Total: <strong>{_e(msg.get('total'))}</strong>")
            + _p(_button("View tickets & QR codes", url))
        )
        text_rows = "\n".join(f"- {t['attendee_name']} ({t['tier']}): ticket {t['ticket_code']}" for t in msg.get("tickets", []))
        return (
            f"Your tickets for {msg.get('event_title')}",
            _layout("Booking confirmed", body),
            f"You're going to {msg.get('event_title')} ({when}, {msg.get('venue')}).\n{text_rows}\n"
            f"Order {msg.get('order_code')}, total {msg.get('total')}.\nTickets: {url}",
        )
    if kind in ("ticket_approved", "ticket_rejected"):
        approved = kind == "ticket_approved"
        heading = "Your registration is approved" if approved else "Your registration wasn't approved"
        lead = (f"{_e(msg.get('attendee_name'))}'s ticket <strong>{_e(msg.get('ticket_code'))}</strong> for <strong>{_e(msg.get('event_title'))}</strong> "
                + ("has been approved by the organiser — see you there!" if approved else "was not approved by the organiser."))
        extra = _p(_button("View ticket", f"{_site()}/order/{msg['order_id']}")) if approved and msg.get("order_id") else ""
        return (heading, _layout(heading, _p(lead) + extra), html.unescape(lead.replace("<strong>", "").replace("</strong>", "")))
    return None


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
