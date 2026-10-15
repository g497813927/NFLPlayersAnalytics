"""Membership table mapping and database constraints."""

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


class Membership(Base):
    __tablename__ = "membership"
    __table_args__ = (
        UniqueConstraint("roster_id", "athlete_id", "start_date"),
        CheckConstraint(
            "end_date IS NULL OR end_date >= start_date", name="date_order"
        ),
        nonblank("position"),
    )
    membership_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    roster_id: Mapped[int] = mapped_column(
        ForeignKey("roster.roster_id", ondelete="CASCADE"), index=True
    )
    athlete_id: Mapped[int] = mapped_column(
        ForeignKey("athlete.athlete_id", ondelete="RESTRICT"), index=True
    )
    position: Mapped[str] = mapped_column(String(40))
    jersey_number: Mapped[str | None] = mapped_column(String(10))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
