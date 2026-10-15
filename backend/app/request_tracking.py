"""Correlate requests and capture bounded development SQL traces."""

import logging
from uuid import uuid4

from fastapi import Request

from .config import settings
from .errors import error_response
from .sql_debug import SQLTrace, active_trace, save_trace


async def correlate_request(request: Request, call_next):
    request_id = uuid4().hex
    trace = None
    token = None
    if (
        settings.debug_ui_enabled
        and request.url.path.startswith("/api/")
        and request.url.path != "/api/health"
        and not request.url.path.startswith("/api/debug/")
    ):
        trace = SQLTrace(request_id, request.method, request.url.path)
        token = active_trace.set(trace)
    try:
        try:
            response = await call_next(request)
        except Exception:
            logging.getLogger(__name__).exception("Unhandled request failure")
            response = error_response(
                500, "unexpected_error", "Something went wrong. Please try again."
            )
        response.headers["X-Request-ID"] = request_id
        return response
    finally:
        if trace is not None:
            save_trace(trace)
        if token is not None:
            active_trace.reset(token)
