"""Require record for the sports prototype."""

from sqlalchemy.orm import Session
from ..errors import AppError


def require_record(session: Session, model, record_id: int, label: str):
    record = session.get(model, record_id)
    if record is None:
        raise AppError(
            404,
            "not_found",
            f"The selected {label} could not be found. Refresh the page and try again.",
        )
    return record
