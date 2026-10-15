"""FastAPI entry point: uvicorn app.main:app --host 127.0.0.1 --port 8000."""

from dataclasses import asdict
import logging
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

from .config import settings
from .database import engine
from .errors import AppError, error_response, install_error_handlers
from .models import Base
from .routes import router
from .sql_debug import SQLTrace, active_trace, get_trace, install_sql_capture, save_trace

app = FastAPI(
    title="NFL Players Analytics — synthetic prototype",
    version="0.1.0",
    debug=False,
    docs_url="/docs/api",
    swagger_ui_oauth2_redirect_url="/docs/api/oauth2-redirect",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
    expose_headers=["X-Request-ID"],
)
install_error_handlers(app)

if settings.debug_ui_enabled:
    install_sql_capture(engine)


@app.middleware("http")
async def correlate_request(request: Request, call_next):
    request_id = uuid4().hex
    trace = None
    token = None
    if settings.debug_ui_enabled and request.url.path.startswith("/api/") and request.url.path != "/api/health" and not request.url.path.startswith("/api/debug/"):
        trace = SQLTrace(request_id, request.method, request.url.path)
        token = active_trace.set(trace)
    try:
        try:
            response = await call_next(request)
        except Exception:
            logging.getLogger(__name__).exception("Unhandled request failure")
            response = error_response(500, "unexpected_error", "Something went wrong. Please try again.")
        response.headers["X-Request-ID"] = request_id
        return response
    finally:
        if trace is not None:
            save_trace(trace)
        if token is not None:
            active_trace.reset(token)


@app.get("/api/health", tags=["System"])
def health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            existing = set(inspect(connection).get_table_names())
        initialized = set(Base.metadata.tables).issubset(existing)
        return {
            "status": "ok" if initialized else "setup_required",
            "database": "connected",
            "initialized": initialized,
            "sql_debug_ui": settings.debug_ui_enabled,
            "synthetic": True,
        }
    except SQLAlchemyError:
        return {
            "status": "unavailable", "database": "disconnected", "initialized": False,
            "sql_debug_ui": settings.debug_ui_enabled, "synthetic": True,
        }


@app.get("/api/debug/sql/{request_id}", tags=["Development"])
def debug_sql(request_id: str):
    if not settings.debug_ui_enabled:
        raise AppError(404, "not_found", "SQL inspection is not enabled.")
    trace = get_trace(request_id)
    if trace is None:
        raise AppError(404, "trace_expired", "This SQL trace has expired. Repeat the operation to capture a new one.")
    return asdict(trace)


app.include_router(router)
