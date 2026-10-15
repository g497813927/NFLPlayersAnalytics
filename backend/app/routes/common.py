"""Shared sessions, pagination, and transaction handling for API routes."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_session
from ..services import recalculate_standings, validate_sports_integrity

DB = Annotated[Session, Depends(get_session)]


def page_result(session: Session, statement, view, page: int, page_size: int) -> dict:
    total = session.scalar(
        select(func.count()).select_from(statement.order_by(None).subquery())
    )
    rows = session.scalars(
        statement.offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [view(session, row) for row in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def save_changes(session: Session, season_ids=(), *, existing: bool = False) -> None:
    session.flush()
    validate_sports_integrity(session, status_code=409 if existing else 422)
    if season_ids:
        recalculate_standings(session, season_ids)
    session.commit()
