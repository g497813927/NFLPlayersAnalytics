"""Season table mapping and database constraints."""

from __future__ import annotations

from datetime import date
from sqlalchemy import (
    CheckConstraint,
    Date,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, nonblank


class Season(Base):
    __tablename__ = "season"
    __table_args__ = (
        UniqueConstraint("league_id", "season_name"),
        CheckConstraint("end_date >= start_date", name="date_order"),
        nonblank("season_name"),
    )
    season_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    season_name: Mapped[str] = mapped_column(String(100))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    league_id: Mapped[int] = mapped_column(
        ForeignKey("league.league_id", ondelete="RESTRICT"), index=True
    )
