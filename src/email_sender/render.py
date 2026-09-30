"""Jinja2 rendering for queued email messages -- loads templates/*.jinja,
exposes the app-URL helpers and constants every template needs as globals,
and derives the plain-text body from the rendered HTML (one source of
content per email, instead of hand-authoring HTML and text separately and
risking them drifting apart).

See handler.py's module docstring for the full message-type catalogue.
"""

import datetime as dt
import html
import os
import re
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from markupsafe import Markup

SUPPORT_EMAIL = "support@showtik.com"

# Archivo is the brand's display/heading face (headings, wordmark, prices);
# Inter carries body copy -- see frontend/packages/ui/src/tokens/fonts.css.
FONT_DISPLAY = "'Archivo','Inter',Segoe UI,Helvetica,Arial,sans-serif"
FONT_BODY = "'Inter',Segoe UI,Helvetica,Arial,sans-serif"


def site() -> str:
    return os.environ.get("PUBLIC_SITE_URL", "https://showtik.in").rstrip("/")


def portal() -> str:
    return os.environ.get("ORGANISER_PORTAL_URL", "https://host.showtik.in").rstrip("/")


def admin() -> str:
    return os.environ.get("ADMIN_PANEL_URL", "https://admin.showtik.in").rstrip("/")


def logo_mark_url() -> str:
    """The Showtik monogram (full-colour, transparent) -- served as a static
    asset from public-site's public/brand/ (see frontend/apps/public-site).
    Used in the email header the same way LogoMark is used on dark surfaces
    in the product UI (frontend/packages/ui/src/components/brand/Logo.tsx):
    the full lockup's wordmark is Ink Navy and unreadable on our navy header,
    so the header pairs this mark with a live white-text wordmark instead."""
    return f"{site()}/brand/showtik-mark.png"


def account_url(audience: str | None = None) -> str:
    """Base URL for the app the recipient's account lives in."""
    return {"admin": admin, "attendee": site}.get(audience, portal)()


# --- date/time display -------------------------------------------------------
# Producers publish dates as ISO strings (Event/Order columns' own
# .isoformat(), datetime.utcnow().isoformat(), ...) -- correct, unambiguous
# data, but not something to show a human. Templates apply these filters at
# the point of display instead of every producer having to remember a
# presentation format; human_date/human_datetime parse and reformat
# dd-mm-yyyy[ HH:MM:SS], falling back to the original value unchanged for
# anything they can't parse as a date (never hide data behind a formatting
# failure).


def _parse_iso(value) -> dt.date | dt.datetime | None:
    if not value:
        return None
    if isinstance(value, (dt.date, dt.datetime)):
        return value
    text = str(value)
    for parser in (dt.datetime.fromisoformat, dt.date.fromisoformat):
        try:
            return parser(text)
        except ValueError:
            continue
    return None


def human_date(value) -> str:
    """dd-mm-yyyy, for a date-only value."""
    parsed = _parse_iso(value)
    return parsed.strftime("%d-%m-%Y") if parsed else (str(value) if value else "")


def human_datetime(value) -> str:
    """dd-mm-yyyy HH:MM:SS, for a full timestamp."""
    parsed = _parse_iso(value)
    if isinstance(parsed, dt.datetime):
        return parsed.strftime("%d-%m-%Y %H:%M:%S")
    if isinstance(parsed, dt.date):
        return parsed.strftime("%d-%m-%Y")
    return str(value) if value else ""


_TEMPLATES_DIR = Path(__file__).parent / "templates"

env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    autoescape=select_autoescape(["html", "jinja"]),
    trim_blocks=True,
    lstrip_blocks=True,
)
env.globals.update(
    site=site,
    portal=portal,
    admin=admin,
    account_url=account_url,
    logo_mark_url=logo_mark_url,
    support_email=SUPPORT_EMAIL,
    # Trusted, compile-time constants (not user input) -- marked safe so
    # their literal quotes render as-is in style="font-family:..." instead
    # of being HTML-entity-escaped by autoescape.
    font_display=Markup(FONT_DISPLAY),
    font_body=Markup(FONT_BODY),
)
env.filters.update(human_date=human_date, human_datetime=human_datetime)


def render_html(template_name: str, context: dict) -> str:
    return env.get_template(template_name).render(**context)


# --- plain-text derivation ---------------------------------------------------

_HEAD_RE = re.compile(r"(?is)<head>.*?</head>")
# Tags that represent a line/row break in the rendered text.
_BREAK_RE = re.compile(r"(?i)<(br|/p|/div|/tr|/h1|li)\s*/?>")
# Table-cell boundaries become a couple of spaces so adjacent cells don't
# run into each other as one word.
_CELL_GAP_RE = re.compile(r"(?i)<(td|th)[^>]*>")
_TAG_RE = re.compile(r"<[^>]+>")
_BLANK_RUN_RE = re.compile(r"\n{3,}")
_SPACE_RUN_RE = re.compile(r"[ \t]{2,}")


def html_to_text(html_body: str) -> str:
    """Cheap, dependency-free tag stripper -- good enough for a plain-text
    email fallback (most clients render the HTML part anyway). Not a
    general-purpose HTML parser: relies on this file's own templates only
    ever using the tags handled above."""
    body = _HEAD_RE.sub("", html_body)
    body = _BREAK_RE.sub("\n", body)
    body = _CELL_GAP_RE.sub("  ", body)
    body = _TAG_RE.sub("", body)
    body = html.unescape(body)
    body = _SPACE_RUN_RE.sub(" ", body)
    lines = (line.strip() for line in body.splitlines())
    text = "\n".join(line for line in lines if line)
    return _BLANK_RUN_RE.sub("\n\n", text).strip()
