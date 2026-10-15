"""StatDefinition table mapping and database constraints."""

from __future__ import annotations

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, nonblank


class StatDefinition(Base):
    __tablename__ = "stat_definition"
    __table_args__ = (
        UniqueConstraint("sport_id", "abbreviation"),
        CheckConstraint(
            "calc_type IN ('sum', 'average', 'min', 'max', 'last')",
            name="valid_calc_type",
        ),
        nonblank("stat_name", "abbreviation"),
    )
    stat_definition_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    stat_name: Mapped[str] = mapped_column(String(100))
    abbreviation: Mapped[str] = mapped_column(String(20))
    calc_type: Mapped[str] = mapped_column(String(20))
    sport_id: Mapped[int] = mapped_column(
        ForeignKey("sport.sport_id", ondelete="RESTRICT"), index=True
    )
