"""Presigned-upload helpers for images stored in BannersBucket, served back
via the CloudFront distribution in front of it (infra/app/template.yaml's
BannersDistribution) rather than the bucket's own S3 URL -- the bucket has
full PublicAccessBlockConfiguration and only grants read access to that
distribution's Origin Access Control.
"""

import os
import uuid

import boto3
from app import app
from aws_lambda_powertools.event_handler.exceptions import BadRequestError

_s3_client = None


def _s3():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client("s3")
    return _s3_client


_ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}


def resolve_image_content_type(raw: str | None) -> tuple[str, str]:
    """(content_type, file_extension) for a presigned upload, from the
    caller-supplied `content_type` query param.

    Must match whatever Content-Type the frontend's PUT to S3 actually
    sends (the browser's File.type for the file the user picked) --
    presigned URLs sign the Content-Type header, so any mismatch between
    what's signed here and what's sent on the PUT is a SignatureDoesNotMatch
    (403), regardless of it being a real image. Previously hardcoded to
    "image/jpeg" here while the frontend sent the real file type, which is
    exactly why every non-JPEG upload 403'd.
    """
    content_type = (raw or "image/jpeg").split(";")[0].strip().lower()
    extension = _ALLOWED_IMAGE_TYPES.get(content_type)
    if extension is None:
        raise BadRequestError(
            f"Unsupported content_type {content_type!r} -- expected one of "
            f"{sorted(_ALLOWED_IMAGE_TYPES)}"
        )
    return content_type, extension


def banners_cdn_url(key: str) -> str:
    """Public URL for an object in BannersBucket, via CloudFront."""
    return f"https://{os.environ['BANNERS_CDN_DOMAIN']}/{key}"


def upload_url(prefix: uuid.UUID, sub: str = "") -> tuple[str, str]:
    """Presigned PUT into BannersBucket plus the CloudFront URL the image
    will be served from. ?content_type=<mime> must match the Content-Type
    the browser's PUT sends (see resolve_image_content_type)."""
    params = app.current_event.query_string_parameters or {}
    content_type, extension = resolve_image_content_type(params.get("content_type"))
    bucket = os.environ["BANNERS_BUCKET_NAME"]
    key = f"{prefix}/{sub}{uuid.uuid4()}.{extension}"
    put_url = _s3().generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=900,
    )
    return put_url, banners_cdn_url(key)
