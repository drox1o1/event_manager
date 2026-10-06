"""uploads.py's S3 presign helpers. The boto3 client is mocked -- these check
what gets asked of S3, not that S3 itself behaves."""

from unittest.mock import MagicMock

import pytest


@pytest.fixture
def mock_s3(monkeypatch):
    client = MagicMock()
    client.generate_presigned_url.return_value = "https://example-bucket.s3.amazonaws.com/signed"
    monkeypatch.setattr("uploads.boto3.client", lambda *a, **kw: client)
    monkeypatch.setattr("uploads._s3_client", None)
    return client


def test_export_download_url_writes_then_presigns_a_get(monkeypatch, mock_s3):
    import uploads

    monkeypatch.setenv("EXPORTS_BUCKET_NAME", "cyrokx-exports-test")
    url = uploads.export_download_url("event-1/abc.csv", "my-event-registrations.csv", "text/csv", b"name,email\n")

    assert url == "https://example-bucket.s3.amazonaws.com/signed"
    mock_s3.put_object.assert_called_once_with(
        Bucket="cyrokx-exports-test", Key="event-1/abc.csv", Body=b"name,email\n", ContentType="text/csv"
    )


def test_export_download_url_forces_the_filename_and_content_type_on_download(monkeypatch, mock_s3):
    """Without these response overrides, a bare presigned GET serves whatever
    the object's own metadata says -- typically an unnamed inline render in
    the tab, not a download the browser saves under the real filename."""
    import uploads

    monkeypatch.setenv("EXPORTS_BUCKET_NAME", "cyrokx-exports-test")
    uploads.export_download_url("event-1/abc.xlsx", "Jammu Marathon.xlsx", "application/vnd.ms-excel", b"x")

    _, kwargs = mock_s3.generate_presigned_url.call_args
    assert kwargs["Params"]["ResponseContentDisposition"] == 'attachment; filename="Jammu Marathon.xlsx"'
    assert kwargs["Params"]["ResponseContentType"] == "application/vnd.ms-excel"
    assert kwargs["Params"]["Bucket"] == "cyrokx-exports-test"
    assert kwargs["Params"]["Key"] == "event-1/abc.xlsx"


def test_export_download_url_expires_quickly(monkeypatch, mock_s3):
    """Short-lived on purpose: this URL is handed straight to a browser that
    follows it within seconds, not something meant to be saved and reused."""
    import uploads

    monkeypatch.setenv("EXPORTS_BUCKET_NAME", "cyrokx-exports-test")
    uploads.export_download_url("event-1/abc.csv", "f.csv", "text/csv", b"x")

    _, kwargs = mock_s3.generate_presigned_url.call_args
    assert kwargs["ExpiresIn"] <= 300


def test_s3_client_is_built_with_an_explicit_region(monkeypatch):
    """Confirmed live: without this, boto3 signs against S3's legacy global
    endpoint regardless of where the bucket lives, which works until a GET
    against a non-us-east-1 bucket gets redirected to the real regional
    endpoint -- and the signature, computed for the original host, doesn't
    cover the one the client actually ends up asking. SignatureDoesNotMatch,
    reproduced against ExportsBucket in ap-south-1."""
    import uploads

    monkeypatch.setattr("uploads._s3_client", None)
    captured = {}

    def _fake_client(service, **kwargs):
        captured["service"] = service
        captured.update(kwargs)
        return MagicMock()

    monkeypatch.setattr("uploads.boto3.client", _fake_client)
    monkeypatch.setenv("AWS_REGION", "ap-south-1")

    uploads._s3()

    assert captured["service"] == "s3"
    assert captured["region_name"] == "ap-south-1"
