"""The single Powertools resolver instance shared by every route module in
this package. Route modules do `from .app import app` and register their
endpoints on import; handler.py imports all of them (for that side effect)
before defining the Lambda entrypoint.
"""

from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig
from common.helpers import parse_body

logger = Logger()
app = APIGatewayRestResolver(
    cors=CORSConfig(allow_origin="*", allow_headers=["Content-Type", "Authorization"])
)


def parse_request_body(model):
    """Validate the current request's JSON body against a pydantic model."""
    return parse_body(model, app.current_event.json_body)
