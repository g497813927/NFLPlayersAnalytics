"""Game table mapping and database constraints."""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Game(Base):
    __tablename__ = "game"
    __table_args__ = (
        CheckConstraint(
            "status IN ('scheduled', 'in_progress', 'completed', 'cancelled')",
            name="valid_status",
        ),
    )
    game_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_time: Mapped[datetime] = mapped_column(DateTime, index=True)
    status: Mapped[str] = mapped_column(String(20), server_default="scheduled")
    season_id: Mapped[int] = mapped_column(
        ForeignKey("season.season_id", ondelete="RESTRICT"), index=True
    )
    venue_id: Mapped[int | None] = mapped_column(
        ForeignKey("venue.venue_id", ondelete="SET NULL"), index=True
    )
