"""email-sender Lambda -- renders queued messages and sends them via SES.

Producers (authenticated_api, public_api) publish self-contained JSON
messages to EmailQueue: everything needed to render the email travels in the
message, so this function needs no database/VPC access. Message types:

  Account & security
    organiser_verification   {to, verification_token}
    email_verified           {to, name?}
    password_reset           {to, reset_token, expires_minutes?, audience?: organiser|admin|attendee}
    password_changed         {to, changed_at?, audience?}
  Organiser lifecycle
    organiser_approved       {to}
    organiser_rejected       {to, reason}
    organiser_suspended      {to, reason}
    organiser_reactivated    {to}
    admin_organiser_pending  {to, org_name, contact_name, organiser_email, organiser_id}
  Event lifecycle (organiser / admin)
    event_submitted          {to, event_title, event_id}
    admin_event_pending      {to, event_title, event_id, org_name}
    event_published          {to, event_title, event_id}
    event_rejected           {to, event_title, event_id, reason}
    new_booking              {to, event_title, event_id, buyer_name, ticket_count, total, tickets_sold?, capacity?}
    payout_processed         {to, amount, payout_reference, period?, account_last4?}
  Attendee
    order_confirmation       {to, buyer_name, order_id, order_code, event_*, tickets[], total}  (payment done + tickets)
    payment_failed           {to, buyer_name?, event_title, event_id, order_code?, total?}
    refund_issued            {to, buyer_name?, event_title, order_code, amount, refund_reference?, reason?}
    ticket_approved          {to, attendee_name, event_title, ticket_code, order_id}
    ticket_rejected          {to, attendee_name, event_title, ticket_code}
    event_reminder           {to, buyer_name?, event_title, event_date, event_time, venue, order_id, map_url?}
    event_updated            {to, event_title, event_id, changes: [{field, old, new}], note?}
    event_cancelled          {to, event_title, reason?, refund_amount?}

To add an email: write a `_name(msg) -> (subject, html, text)` function and
register it in TEMPLATES.

Unknown types and malformed bodies are logged and dropped (retrying won't fix
them). SES send failures are reported as batchItemFailures so SQS retries.

Config (env): EMAIL_FROM_ADDRESS (an SES-verified identity), EMAIL_FROM_NAME,
PUBLIC_SITE_URL, ORGANISER_PORTAL_URL, ADMIN_PANEL_URL. While the SES account is in sandbox
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


def _admin() -> str:
    return os.environ.get("ADMIN_PANEL_URL", "https://admin.showtik.in").rstrip("/")


def _logo_mark_url() -> str:
    """The Showtik monogram (full-colour, transparent) -- served as a static
    asset from public-site's public/brand/ (see frontend/apps/public-site).
    Used in the email header the same way LogoMark is used on dark surfaces
    in the product UI (frontend/packages/ui/src/components/brand/Logo.tsx):
    the full lockup's wordmark is Ink Navy and unreadable on our navy header,
    so the header pairs this mark with a live white-text wordmark instead."""
    return f"{_site()}/brand/showtik-mark.png"


SUPPORT_EMAIL = "support@showtik.com"

# Archivo is the brand's display/heading face (headings, wordmark, prices);
# Inter carries body copy -- see frontend/packages/ui/src/tokens/fonts.css.
FONT_DISPLAY = "'Archivo','Inter',Segoe UI,Helvetica,Arial,sans-serif"
FONT_BODY = "'Inter',Segoe UI,Helvetica,Arial,sans-serif"


# --- building blocks --------------------------------------------------------


def _e(value) -> str:
    return html.escape(str(value if value is not None else ""))


def _button(label: str, url: str) -> str:
    return (
        f'<a href="{_e(url)}" style="display:inline-block;background:#C4143F;color:#ffffff;'
        f'text-decoration:none;font-weight:700;padding:13px 26px;border-radius:10px">{_e(label)}</a>'
    )


def _logo_header() -> str:
    """The header bar: the full-colour monogram mark plus a live white-text
    wordmark, matching the product's own logo-on-dark-surface convention
    instead of an image of the (navy-on-transparent) wordmark, which would
    be invisible on this navy bar."""
    return (
        '<table role="presentation" cellpadding="0" cellspacing="0"><tr>'
        f'<td style="padding-right:10px"><img src="{_e(_logo_mark_url())}" width="26" height="26" '
        'alt="" style="display:block;border:0;outline:0"></td>'
        f'<td style="color:#ffffff;font-size:21px;font-weight:800;letter-spacing:-0.01em;'
        f'font-family:{FONT_DISPLAY}">showtik</td>'
        "</tr></table>"
    )


def _layout(heading: str, body_html: str, preheader: str = "") -> str:
    # The preheader is the hidden inbox-preview line shown next to the subject.
    hidden = (f'<div style="display:none;max-height:0;overflow:hidden;opacity:0">{_e(preheader)}</div>'
              if preheader else "")
    return f"""<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<!--<![endif]-->
</head><body style="margin:0;background:#F5F5F5;font-family:{FONT_BODY};color:#333">{hidden}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#051747;padding:20px 28px">{_logo_header()}</td></tr>
<tr><td style="padding:30px 28px 8px"><h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;color:#051747;font-family:{FONT_DISPLAY};font-weight:700">{_e(heading)}</h1>{body_html}</td></tr>
<tr><td style="padding:22px 28px 28px;font-size:12px;color:#999">You're receiving this because of activity on your Showtik account or booking. Questions? Write to {SUPPORT_EMAIL}.</td></tr>
</table></td></tr></table></body></html>"""


def _p(text: str) -> str:
    return f'<p style="margin:0 0 16px;font-size:15px;line-height:1.6">{text}</p>'


def _muted(text: str) -> str:
    return f'<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#777">{text}</p>'


def _callout(text: str) -> str:
    return (f'<div style="margin:0 0 16px;padding:14px 16px;background:#FFF7ED;border-left:4px solid #C4143F;'
            f'border-radius:8px;font-size:14px;line-height:1.6">{text}</div>')


def _details(rows: list[tuple[str, object]]) -> str:
    """Two-column label/value table; rows with an empty value are skipped."""
    cells = "".join(
        '<tr><td style="padding:8px 0;border-top:1px solid #eee;color:#666">'
        f'{_e(label)}</td><td style="padding:8px 0;border-top:1px solid #eee;text-align:right;font-weight:600">{_e(value)}</td></tr>'
        for label, value in rows if value not in (None, "")
    )
    return f'<table role="presentation" width="100%" style="margin:0 0 16px;font-size:14px">{cells}</table>'


def _text_details(rows: list[tuple[str, object]]) -> str:
    return "\n".join(f"{label}: {value}" for label, value in rows if value not in (None, ""))


def _when(msg: dict) -> str:
    return f"{msg.get('event_date', '')} {msg.get('event_time', '')}".strip()


def _reason(msg: dict, label: str = "Reason") -> tuple[str, str]:
    """(html, text) fragments for an optional reason field."""
    reason = msg.get("reason")
    if not reason:
        return "", ""
    return _p(f"<strong>{_e(label)}:</strong> {_e(reason)}"), f"{label}: {reason}\n"


def _account_url(msg: dict) -> str:
    """Base URL for the app the recipient's account lives in."""
    return {"admin": _admin, "attendee": _site}.get(msg.get("audience"), _portal)()


Rendered = tuple[str, str, str]  # (subject, html, text)


# --- account & security -----------------------------------------------------


def _organiser_verification(msg: dict) -> Rendered:
    url = f"{_portal()}/verify?token={msg['verification_token']}"
    return (
        "Verify your Showtik organiser email",
        _layout("Confirm your email", _p("Thanks for signing up as an organiser on Showtik. Confirm your email address to continue.")
                + _p(_button("Verify email", url))
                + _p("Our team also reviews every new organiser — we'll email you as soon as your account is approved.")
                + _muted(f"Button not working? Paste this link into your browser:<br>{_e(url)}"),
                "One click to confirm your email address."),
        f"Confirm your email: {url}\n\nWe'll email you once your organiser account is approved.",
    )


def _email_verified(msg: dict) -> Rendered:
    return (
        "Your email is verified",
        _layout("Email verified ✔", _p(f"Thanks{', ' + _e(msg['name']) if msg.get('name') else ''} — your email address is confirmed.")
                + _p("Your organiser application is now with the Showtik team. Reviews usually take 1–2 working days, and we'll email you the result."),
                "Your application is now in review."),
        "Your email is verified. We'll email you once the Showtik team has reviewed your organiser application.",
    )


def _password_reset(msg: dict) -> Rendered:
    # {to, reset_token, expires_minutes?, audience?: organiser|admin|attendee}
    url = f"{_account_url(msg)}/reset-password?token={msg['reset_token']}"
    minutes = msg.get("expires_minutes", 30)
    return (
        "Reset your Showtik password",
        _layout("Reset your password", _p("We received a request to reset the password for your Showtik account. Choose a new one below.")
                + _p(_button("Reset password", url))
                + _p(f"This link expires in <strong>{_e(minutes)} minutes</strong> and can only be used once.")
                + _callout("Didn't ask for this? You can safely ignore this email — your password won't change.")
                + _muted(f"Button not working? Paste this link into your browser:<br>{_e(url)}"),
                f"This link expires in {minutes} minutes."),
        f"Reset your Showtik password: {url}\n\nThe link expires in {minutes} minutes. "
        "If you didn't request this, ignore this email.",
    )


def _password_changed(msg: dict) -> Rendered:
    # {to, changed_at?, audience?}
    return (
        "Your Showtik password was changed",
        _layout("Password changed", _p("The password for your Showtik account was just changed.")
                + _details([("When", msg.get("changed_at"))])
                + _callout(f"If this wasn't you, reset your password right away and contact {SUPPORT_EMAIL}.")
                + _p(_button("Sign in", f"{_account_url(msg)}/login")),
                "A quick security notice about your account."),
        f"Your Showtik password was changed{' at ' + msg['changed_at'] if msg.get('changed_at') else ''}. "
        f"If this wasn't you, contact {SUPPORT_EMAIL} immediately.",
    )


# --- organiser lifecycle ----------------------------------------------------


def _organiser_approved(msg: dict) -> Rendered:
    url = f"{_portal()}/events/new"
    return (
        "You're approved — start creating events on Showtik",
        _layout("Your organiser account is approved", _p("Good news — the Showtik team has approved your organiser account. You can now create and publish events.")
                + _p(_button("Create your first event", url))),
        f"Your Showtik organiser account is approved. Create an event: {url}",
    )


def _organiser_blocked(msg: dict) -> Rendered:
    rejected = msg["type"] == "organiser_rejected"
    heading = "About your organiser application" if rejected else "Your organiser account is suspended"
    lead = ("We weren't able to approve your organiser account this time." if rejected
            else "Your Showtik organiser account has been suspended, so you can't create or edit events for now.")
    why, why_text = _reason(msg)
    return (
        heading,
        _layout(heading, _p(lead) + why + _p(f"If you think this is a mistake, reply to this email or write to {SUPPORT_EMAIL}.")),
        f"{lead}\n{why_text}Contact {SUPPORT_EMAIL} if this is a mistake.",
    )


def _organiser_reactivated(msg: dict) -> Rendered:
    return (
        "Your Showtik organiser account is active again",
        _layout("Welcome back", _p("Your organiser account has been reinstated — you can create and manage events again.") + _p(_button("Open organiser portal", _portal()))),
        f"Your organiser account is active again: {_portal()}",
    )


def _admin_organiser_pending(msg: dict) -> Rendered:
    # To the Showtik team: {to, org_name, contact_name, organiser_email, organiser_id}
    url = f"{_admin()}/organisers/{msg['organiser_id']}"
    rows = [("Organisation", msg.get("org_name")), ("Contact", msg.get("contact_name")), ("Email", msg.get("organiser_email"))]
    return (
        f"New organiser awaiting review: {msg.get('org_name')}",
        _layout("New organiser to review", _p("A new organiser has verified their email and is waiting for approval.") + _details(rows) + _p(_button("Review organiser", url))),
        f"New organiser awaiting review.\n{_text_details(rows)}\nReview: {url}",
    )


# --- event lifecycle (organiser / admin) -----------------------------------


def _event_submitted(msg: dict) -> Rendered:
    url = f"{_portal()}/events/{msg['event_id']}/manage/publish"
    return (
        f"{msg['event_title']} is in review",
        _layout("Your event is in review", _p(f"Thanks for submitting <strong>{_e(msg['event_title'])}</strong>. The Showtik team will review it — usually within one working day — and email you when it's live.")
                + _p(_button("View submission", url))),
        f"{msg['event_title']} was submitted for review. We'll email you when it's live: {url}",
    )


def _admin_event_pending(msg: dict) -> Rendered:
    # To the Showtik team: {to, event_title, event_id, org_name}
    url = f"{_admin()}/events/{msg['event_id']}"
    return (
        f"Event awaiting approval: {msg['event_title']}",
        _layout("Event to review", _p(f"<strong>{_e(msg.get('org_name'))}</strong> submitted <strong>{_e(msg['event_title'])}</strong> for approval.") + _p(_button("Review event", url))),
        f"{msg.get('org_name')} submitted {msg['event_title']} for approval: {url}",
    )


def _event_published(msg: dict) -> Rendered:
    url = f"{_site()}/events/{msg['event_id']}"
    return (
        f"{msg['event_title']} is live on Showtik",
        _layout("Your event is live 🎉", _p(f"<strong>{_e(msg['event_title'])}</strong> has been approved and is now live — anyone can find it and book tickets.") + _p(_button("View event page", url))),
        f"{msg['event_title']} is live: {url}",
    )


def _event_rejected(msg: dict) -> Rendered:
    url = f"{_portal()}/events/{msg['event_id']}/manage/publish"
    why, why_text = _reason(msg, "Feedback")
    return (
        f"Changes requested for {msg['event_title']}",
        _layout("Your event needs a few changes", _p(f"The Showtik team reviewed <strong>{_e(msg['event_title'])}</strong> and requested changes before it can go live.")
                + why + _p(_button("Edit and resubmit", url))),
        f"Changes requested for {msg['event_title']}.\n{why_text}Edit: {url}",
    )


def _new_booking(msg: dict) -> Rendered:
    # To the organiser: {to, event_title, event_id, buyer_name, ticket_count, total, tickets_sold?, capacity?}
    url = f"{_portal()}/events/{msg['event_id']}/manage/attendees"
    sold = f"{msg['tickets_sold']} / {msg['capacity']}" if msg.get("tickets_sold") is not None and msg.get("capacity") else msg.get("tickets_sold")
    rows = [("Booked by", msg.get("buyer_name")), ("Tickets", msg.get("ticket_count")), ("Amount", msg.get("total")), ("Sold so far", sold)]
    return (
        f"New booking for {msg['event_title']}",
        _layout("You have a new booking", _p(f"Someone just booked <strong>{_e(msg['event_title'])}</strong>.") + _details(rows) + _p(_button("View attendees", url))),
        f"New booking for {msg['event_title']}.\n{_text_details(rows)}\nAttendees: {url}",
    )


def _payout_processed(msg: dict) -> Rendered:
    # To the organiser: {to, amount, payout_reference, period?, account_last4?}
    rows = [("Amount", msg.get("amount")), ("Reference", msg.get("payout_reference")), ("Period", msg.get("period")),
            ("Account", f"•••• {msg['account_last4']}" if msg.get("account_last4") else None)]
    return (
        f"Payout of {msg.get('amount')} is on its way",
        _layout("Your payout is on its way", _p("We've sent your ticket-sales payout. It usually reaches your bank within 1–3 working days.") + _details(rows) + _p(_button("View payouts", f"{_portal()}/payouts"))),
        f"Payout sent.\n{_text_details(rows)}",
    )


# --- bookings, payments & tickets (attendee) -------------------------------


def _order_confirmation(msg: dict) -> Rendered:
    # Payment completed + tickets delivered.
    url = f"{_site()}/order/{msg['order_id']}"
    rows = ""
    for t in msg.get("tickets", []):
        pending = '<br><span style="color:#B45309;font-size:12px">Awaiting approval</span>' if t.get("pending") else ""
        details = "".join(f'<br><span style="color:#888;font-size:12px">{_e(d)}</span>' for d in t.get("details", []))
        rows += (
            '<tr><td style="padding:10px 0;border-top:1px solid #eee">'
            f'<strong>{_e(t["attendee_name"])}</strong><br><span style="color:#666;font-size:13px">{_e(t["tier"])}</span>{details}</td>'
            '<td style="padding:10px 0;border-top:1px solid #eee;text-align:right;font-family:monospace">'
            f"{_e(t['ticket_code'])}{pending}</td></tr>"
        )
    when = _when(msg)
    body = (
        _p(f"Hi {_e(msg.get('buyer_name'))}, you're going to <strong>{_e(msg.get('event_title'))}</strong>!")
        + _p(f"📅 {_e(when)}<br>📍 {_e(msg.get('venue'))}")
        + f'<table role="presentation" width="100%" style="margin:0 0 16px;font-size:14px">{rows}</table>'
        + _p(f"Order / payment ID: <strong style=\"font-family:monospace\">{_e(msg.get('order_code'))}</strong> · "
             f"Total: <strong style=\"font-family:{FONT_DISPLAY}\">{_e(msg.get('total'))}</strong>")
        + _p(_button("View tickets", url))
        + _muted("Show your ticket ID at the entry gate.")
    )
    text_rows = "\n".join(
        f"- {t['attendee_name']} ({t['tier']}): ticket {t['ticket_code']}"
        + "".join(f"\n    {d}" for d in t.get("details", []))
        for t in msg.get("tickets", [])
    )
    return (
        f"Your tickets for {msg.get('event_title')}",
        _layout("Booking confirmed", body, f"Payment received — your tickets for {msg.get('event_title')} are inside."),
        f"You're going to {msg.get('event_title')} ({when}, {msg.get('venue')}).\n{text_rows}\n"
        f"Order {msg.get('order_code')}, total {msg.get('total')}.\nTickets: {url}",
    )


def _payment_failed(msg: dict) -> Rendered:
    # {to, buyer_name?, event_title, event_id, order_code?, total?}
    url = f"{_site()}/events/{msg['event_id']}"
    rows = [("Event", msg.get("event_title")), ("Order", msg.get("order_code")), ("Amount", msg.get("total"))]
    return (
        f"Payment didn't go through for {msg['event_title']}",
        _layout("Your payment didn't go through", _p(f"Hi {_e(msg.get('buyer_name') or 'there')}, we couldn't complete your payment, so no tickets were issued.")
                + _details(rows)
                + _p("If money was debited, it will be refunded automatically to your original payment method within 5–7 working days.")
                + _p(_button("Try booking again", url))),
        f"Your payment for {msg['event_title']} didn't go through and no tickets were issued.\n{_text_details(rows)}\n"
        f"Any debited amount is refunded automatically in 5–7 working days. Try again: {url}",
    )


def _refund_issued(msg: dict) -> Rendered:
    # {to, buyer_name?, event_title, order_code, amount, refund_reference?, reason?}
    rows = [("Event", msg.get("event_title")), ("Order", msg.get("order_code")), ("Refund amount", msg.get("amount")), ("Refund reference", msg.get("refund_reference"))]
    why, why_text = _reason(msg)
    return (
        f"Refund issued for {msg['event_title']}",
        _layout("Your refund is on its way", _p(f"Hi {_e(msg.get('buyer_name') or 'there')}, we've issued a refund for your booking.")
                + why + _details(rows)
                + _p("It usually appears on your original payment method within 5–7 working days, depending on your bank.")),
        f"Refund issued for {msg['event_title']}.\n{why_text}{_text_details(rows)}\nExpect it within 5–7 working days.",
    )


def _ticket_decision(msg: dict) -> Rendered:
    approved = msg["type"] == "ticket_approved"
    heading = "Your registration is approved" if approved else "Your registration wasn't approved"
    lead = (f"{_e(msg.get('attendee_name'))}'s ticket <strong>{_e(msg.get('ticket_code'))}</strong> for <strong>{_e(msg.get('event_title'))}</strong> "
            + ("has been approved by the organiser — see you there!" if approved else "was not approved by the organiser."))
    extra = _p(_button("View ticket", f"{_site()}/order/{msg['order_id']}")) if approved and msg.get("order_id") else ""
    return (heading, _layout(heading, _p(lead) + extra), html.unescape(lead.replace("<strong>", "").replace("</strong>", "")))


def _event_reminder(msg: dict) -> Rendered:
    # {to, buyer_name?, event_title, event_date, event_time, venue, order_id, map_url?}
    url = f"{_site()}/order/{msg['order_id']}"
    when = _when(msg)
    directions = _p(f'<a href="{_e(msg["map_url"])}" style="color:#C4143F">Get directions</a>') if msg.get("map_url") else ""
    return (
        f"Reminder: {msg['event_title']} is coming up",
        _layout("See you soon!", _p(f"Hi {_e(msg.get('buyer_name') or 'there')}, <strong>{_e(msg['event_title'])}</strong> is almost here.")
                + _p(f"📅 {_e(when)}<br>📍 {_e(msg.get('venue'))}") + directions
                + _p(_button("Open my tickets", url))
                + _muted("Keep your ticket ID ready at the gate, and arrive a little early to beat the queue."),
                f"{when} · {msg.get('venue', '')}"),
        f"Reminder: {msg['event_title']} — {when}, {msg.get('venue')}.\nYour tickets: {url}",
    )


def _event_updated(msg: dict) -> Rendered:
    # To ticket holders: {to, event_title, event_id, changes: [{field, old, new}], note?}
    changes = msg.get("changes", [])
    rows = "".join(
        '<tr><td style="padding:8px 0;border-top:1px solid #eee;color:#666">'
        f'{_e(c.get("field"))}</td><td style="padding:8px 0;border-top:1px solid #eee;text-align:right">'
        f'<s style="color:#999">{_e(c.get("old"))}</s><br><strong>{_e(c.get("new"))}</strong></td></tr>'
        for c in changes
    )
    note = _p(_e(msg["note"])) if msg.get("note") else ""
    url = f"{_site()}/events/{msg['event_id']}"
    return (
        f"Important update: {msg['event_title']}",
        _layout("Your event has changed", _p(f"The organiser has updated <strong>{_e(msg['event_title'])}</strong>. Your tickets remain valid.")
                + f'<table role="presentation" width="100%" style="margin:0 0 16px;font-size:14px">{rows}</table>'
                + note + _p(_button("View event", url))),
        f"{msg['event_title']} has changed:\n"
        + "\n".join(f"- {c.get('field')}: {c.get('old')} -> {c.get('new')}" for c in changes)
        + (f"\n{msg['note']}" if msg.get("note") else "") + f"\nYour tickets remain valid. {url}",
    )


def _event_cancelled(msg: dict) -> Rendered:
    # To ticket holders: {to, event_title, reason?, refund_amount?}
    why, why_text = _reason(msg)
    refund = (f"A full refund of <strong>{_e(msg['refund_amount'])}</strong> will be sent to your original payment method within 5–7 working days."
              if msg.get("refund_amount") else "Any amount you paid will be refunded to your original payment method within 5–7 working days.")
    return (
        f"Cancelled: {msg['event_title']}",
        _layout("This event has been cancelled", _p(f"We're sorry — <strong>{_e(msg['event_title'])}</strong> has been cancelled by the organiser.")
                + why + _callout(refund) + _p(_button("Discover other events", _site()))),
        f"{msg['event_title']} has been cancelled.\n{why_text}{html.unescape(refund.replace('<strong>', '').replace('</strong>', ''))}",
    )


# --- registry ---------------------------------------------------------------

def _transaction_query(msg: dict) -> Rendered:
    # To the Showtik team and the organiser: a buyer raised a query about an
    # order. {to, query_id, order_id, order_code, payment_ref, event_title,
    # buyer_name, buyer_email, buyer_phone, category, message}
    url = f"{_admin()}/queries"
    rows = [
        ("Event", msg.get("event_title")),
        ("Order / payment ID", msg.get("order_code")),
        ("Transaction ID", msg.get("payment_ref")),
        ("Buyer", msg.get("buyer_name")),
        ("Mobile", msg.get("buyer_phone")),
        ("Email", msg.get("buyer_email")),
        ("Query type", msg.get("category")),
    ]
    return (
        f"Transaction query: {msg.get('category')} — order {msg.get('order_code')}",
        _layout(
            "New transaction query",
            _p("A buyer raised a query about their order.") + _details(rows) + _callout(_e(msg.get("message")))
            + _p(_button("Open queries", url)) + _muted(f"Reply to the buyer at {_e(msg.get('buyer_email'))}."),
        ),
        f"New transaction query.\n{_text_details(rows)}\n\n{msg.get('message')}\n\nOpen: {url}",
    )


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
    template = TEMPLATES.get(msg.get("type"))
    return template(msg) if template else None


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
