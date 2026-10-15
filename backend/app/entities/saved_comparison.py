"""SavedComparison table mapping and database constraints."""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, nonblank


class SavedComparison(Base):
    __tablename__ = "saved_comparison"
    __table_args__ = (
        CheckConstraint(
            "(object_type = 'athlete' AND athlete_a_id IS NOT NULL AND athlete_b_id IS NOT NULL AND athlete_a_id <> athlete_b_id AND team_a_id IS NULL AND team_b_id IS NULL) OR (object_type = 'team' AND team_a_id IS NOT NULL AND team_b_id IS NOT NULL AND team_a_id <> team_b_id AND athlete_a_id IS NULL AND athlete_b_id IS NULL)",
            name="valid_pair",
        ),
        nonblank("title"),
    )
    comparison_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("app_user.user_id", ondelete="CASCADE"), index=True
    )
    sport_id: Mapped[int] = mapped_column(
        ForeignKey("sport.sport_id", ondelete="CASCADE"), index=True
    )
    object_type: Mapped[str] = mapped_column(String(20))
    athlete_a_id: Mapped[int | None] = mapped_column(
        ForeignKey("athlete.athlete_id", ondelete="CASCADE"), index=True
    )
    athlete_b_id: Mapped[int | None] = mapped_column(
        ForeignKey("athlete.athlete_id", ondelete="CASCADE"), index=True
    )
    team_a_id: Mapped[int | None] = mapped_column(
        ForeignKey("team.team_id", ondelete="CASCADE"), index=True
    )
    team_b_id: Mapped[int | None] = mapped_column(
        ForeignKey("team.team_id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )
