"""Read-only access to captured development SQL traces."""

from dataclasses import asdict
from typing import Annotated

from fastapi import APIRouter, Path

from ..api_docs import READ_RESPONSES
from ..config import settings
from ..errors import AppError
from ..sql_debug import get_trace

router = APIRouter()


@router.get(
    "/debug/sql/{request_id}",
    tags=["Development"],
    summary="Inspect SQL for a recent request",
    description=(
        "Copy `X-Request-ID` from a previous API response. Set `APP_ENV=development` "
        "and `SQL_DEBUG_UI=true` in backend/.env and restart the backend first. "
        "The response contains statements, separate bound parameters, and timings. "
        "Only 100 requests and up to 100 statements per request are kept in memory. "
        "Health and debug calls are not captured. Disabled or expired traces return "
        "404; restarting the backend clears all traces. This endpoint cannot execute SQL."
    ),
    responses={
        **READ_RESPONSES,
        200: {
            "description": "Captured statements with separate bound parameters and timings.",
            "content": {
                "application/json": {
                    "schema": {"type": "object"},
                    "example": {
                        "request_id": "copy-the-X-Request-ID-response-header",
                        "method": "GET",
                        "path": "/api/teams",
                        "statements": [
                            {
                                "statement": "SELECT team.team_id FROM team WHERE team.league_id = ?",
                                "parameters": [1],
                                "duration_ms": 0.12,
                            },
                        ],
                        "truncated": False,
                    },
                },
            },
        },
    },
)
def debug_sql(
    request_id: Annotated[
        str,
        Path(
            description="X-Request-ID header from the API response you want to inspect."
        ),
    ],
):
    if not settings.debug_ui_enabled:
        raise AppError(404, "not_found", "SQL inspection is not enabled.")
    trace = get_trace(request_id)
    if trace is None:
        raise AppError(
            404,
            "trace_expired",
            "This SQL trace has expired. Repeat the operation to capture a new one.",
        )
    return asdict(trace)
