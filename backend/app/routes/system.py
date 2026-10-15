"""Database connection and initialization status."""

from fastapi import APIRouter
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

from ..config import settings
from ..database import engine
from ..models import Base

router = APIRouter()


@router.get(
    "/health",
    tags=["System"],
    summary="Check database connection",
    description=(
        "Read database connectivity, table initialization, and SQL inspector availability. "
        "This endpoint always returns HTTP 200: inspect `status` for `ok`, "
        "`setup_required`, or `unavailable`. It does not initialize or seed data."
    ),
    responses={
        200: {
            "description": "Current connection and initialization state.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "ok",
                        "database": "connected",
                        "initialized": True,
                        "sql_debug_ui": False,
                        "synthetic": True,
                    },
                },
            },
        },
    },
)
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
            "status": "unavailable",
            "database": "disconnected",
            "initialized": False,
            "sql_debug_ui": settings.debug_ui_enabled,
            "synthetic": True,
        }
