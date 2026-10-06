"""PayU (India) client: hashing, the browser handoff payload, and the two
server-to-server commands we use (verify a payment, request a refund).

Deliberately free of any model or session import. Every function here is pure
except the two that make HTTP calls, so the hashing -- the part that is fiddly
and security-relevant -- unit-tests with nothing mocked. Stdlib only: adding
`requests` to the shared layer for two POSTs isn't worth the cold-start cost.

Callers must never invoke verify_payment or refund with a database transaction
open. common.db runs pool_size=1 behind RDS Proxy, so an 8-second outbound call
inside a SELECT ... FOR UPDATE serialises checkout for an entire event.
"""

import hashlib
import hmac
import json
import urllib.parse
import urllib.request
from decimal import Decimal
from typing import Any

from aws_lambda_powertools import Logger

from .secrets import load_secret_json

logger = Logger(child=True)

HTTP_TIMEOUT_SECONDS = 8  # the Lambda global timeout is 15s

# PayU hashes a fixed field sequence. udf6..udf10 are reserved and always
# empty for us, but their five pipes must still be present or the hash differs.
_REQUEST_FIELDS = ("key", "txnid", "amount", "productinfo", "firstname", "email")
_UDF_FIELDS = ("udf1", "udf2", "udf3", "udf4", "udf5")
_RESERVED_UDF_SLOTS = 5


def credentials() -> dict:
    """`{"merchant_key", "salt", "base_url"}` from Secrets Manager.

    base_url lives in the secret rather than being derived from the stage so
    that pointing an environment at a different PayU host is a data change,
    not a redeploy.
    """
    return load_secret_json("PAYU_SECRET_ARN")


def format_amount(value: Decimal | str | int) -> str:
    """The single source of truth for how an amount is written.

    PayU compares the hash against the amount field byte for byte, so the
    same string has to reach the hash, the form, and payment_attempts.amount.
    Never reformat an amount PayU sent back before hashing it -- echo it
    verbatim.
    """
    return f"{Decimal(str(value)).quantize(Decimal('0.01'))}"


def request_hash(fields: dict[str, str], salt: str) -> str:
    """sha512(key|txnid|amount|productinfo|firstname|email|udf1..udf5||||||salt)"""
    parts = [fields[name] for name in _REQUEST_FIELDS]
    parts += [fields.get(name, "") for name in _UDF_FIELDS]
    parts += [""] * _RESERVED_UDF_SLOTS
    parts.append(salt)
    return hashlib.sha512("|".join(parts).encode("utf-8")).hexdigest()


def response_hash(posted: dict[str, str], salt: str) -> str:
    """The request sequence reversed, salt first, with `status` spliced in.

    additionalCharges, when PayU sends it, is prepended to the whole string.
    The test is key *presence*, not truthiness: PayU's own documentation uses
    the field's presence, and an empty-string value still changes the hash.
    """
    parts = [salt, posted.get("status", "")]
    parts += [""] * _RESERVED_UDF_SLOTS
    parts += [posted.get(name, "") for name in reversed(_UDF_FIELDS)]
    parts += [posted.get(name, "") for name in reversed(_REQUEST_FIELDS)]
    base = "|".join(parts)
    if "additionalCharges" in posted:
        base = f"{posted['additionalCharges']}|{base}"
    return hashlib.sha512(base.encode("utf-8")).hexdigest()


def verify_response(posted: dict[str, str]) -> bool:
    """Whether this payload really came from PayU and wasn't edited in transit.

    Proves authenticity only. It does *not* prove the amount is the one we
    asked for -- callers must separately compare against the stored attempt,
    since a buyer who tampers with the amount gets a hash we'd reject, but a
    merchant-side bug that hashed the wrong amount would pass this check.
    """
    supplied = posted.get("hash") or ""
    expected = response_hash(posted, credentials()["salt"])
    return hmac.compare_digest(supplied.lower(), expected)


def payment_form(
    *,
    txnid: str,
    amount: str,
    product_info: str,
    first_name: str,
    email: str,
    phone: str,
    order_id: str,
    surl: str,
    furl: str,
) -> dict[str, Any]:
    """Everything the browser must POST to PayU, hash included.

    `amount` must already be a format_amount() string -- it is hashed as given.
    udf1 carries the order id purely as a recovery path: settlement keys off
    txnid, but if a lookup ever misses, the order is still identifiable from
    the callback. Every udf must be a string, never None, or "None" ends up in
    the hash.
    """
    creds = credentials()
    fields = {
        "key": creds["merchant_key"],
        "txnid": txnid,
        "amount": amount,
        "productinfo": _sanitise_product_info(product_info),
        "firstname": first_name,
        "email": email,
        "phone": phone,
        "surl": surl,
        "furl": furl,
        "udf1": order_id,
        "udf2": "",
        "udf3": "",
        "udf4": "",
        "udf5": "",
    }
    fields["hash"] = request_hash(fields, creds["salt"])
    return {"action": f"{creds['base_url'].rstrip('/')}/_payment", "fields": fields}


def _sanitise_product_info(value: str) -> str:
    """ASCII, no pipes, bounded length.

    The pipe is PayU's hash delimiter, and event titles are organiser-authored
    free text (a real one in this database is "BSF Jammu Marathon <2026>"), so
    anything exotic gets dropped rather than risking a rejected hash.
    """
    ascii_only = value.encode("ascii", "ignore").decode("ascii").replace("|", " ")
    return " ".join(ascii_only.split())[:100] or "Event registration"


def verify_payment(txnid: str) -> dict:
    """PayU's own view of a transaction -- the authoritative status.

    Used instead of trusting the browser callback's status field, and by the
    reconciler for payments nobody ever came back to tell us about.
    """
    return _post_service("verify_payment", txnid)


def refund(mihpayid: str, refund_reference: str, amount: str) -> dict:
    """Queue a refund. PayU processes these asynchronously, so an accepted
    call means "queued", never "money returned" -- the reconciler follows up.

    `refund_reference` is our own id for the refund (the payment_refunds row),
    which makes a retried call idempotent at PayU's end and gives the
    reconciler something to match on.
    """
    return _post_service("cancel_refund_transaction", mihpayid, refund_reference, amount)


def _post_service(command: str, var1: str, *extra_vars: str) -> dict:
    """POST to PayU's merchant postservice endpoint.

    The hash covers only key|command|var1|salt regardless of how many vars the
    command takes -- var2 and var3 are sent unhashed.
    """
    creds = credentials()
    payload = {
        "key": creds["merchant_key"],
        "command": command,
        "var1": var1,
        "hash": hashlib.sha512(
            f"{creds['merchant_key']}|{command}|{var1}|{creds['salt']}".encode()
        ).hexdigest(),
    }
    for index, value in enumerate(extra_vars, start=2):
        payload[f"var{index}"] = value

    url = f"{creds['base_url'].rstrip('/')}/merchant/postservice.php?form=2"
    request = urllib.request.Request(
        url,
        data=urllib.parse.urlencode(payload).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=HTTP_TIMEOUT_SECONDS) as response:  # noqa: S310 -- url is from our own secret
        body = response.read().decode("utf-8")

    try:
        return json.loads(body)
    except json.JSONDecodeError:
        # PayU occasionally answers with a bare error string. Surfacing it as
        # a dict keeps callers from having to handle two return shapes; they
        # treat a missing "status" as "no verdict yet" and retry later.
        logger.warning("payu postservice returned non-JSON", extra={"command": command, "body": body[:500]})
        return {"status": 0, "msg": body[:500]}


def transaction_status(verify_result: dict, txnid: str) -> dict | None:
    """Pull one transaction out of a verify_payment response.

    PayU nests these under transaction_details keyed by txnid. Returns None
    when PayU has no record of it -- which for a freshly-created attempt means
    the buyer never reached the payment page, not that it failed.
    """
    details = verify_result.get("transaction_details") or {}
    if not isinstance(details, dict):
        return None
    entry = details.get(txnid)
    return entry if isinstance(entry, dict) else None
