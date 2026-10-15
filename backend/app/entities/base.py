"""Shared SQLAlchemy metadata and label constraint helper."""

from sqlalchemy import CheckConstraint, MetaData
from sqlalchemy.orm import DeclarativeBase


def nonblank(*columns: str) -> CheckConstraint:
    """Keep required labels meaningful even for writes made outside the API."""
    return CheckConstraint(
        " AND ".join(f"length(trim({column})) > 0" for column in columns),
        name="nonblank_fields",
    )


class Base(DeclarativeBase):
    metadata = MetaData(
        naming_convention={
            "ix": "ix_%(table_name)s_%(column_0_name)s",
            "uq": "uq_%(table_name)s_%(column_0_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
            "pk": "pk_%(table_name)s",
        }
    )
