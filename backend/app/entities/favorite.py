"""Favorite table mapping and database constraints."""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Favorite(Base):
    __tablename__ = "favorite"
    __table_args__ = (
        CheckConstraint(
            "CASE WHEN sport_id IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN league_id IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN team_id IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN athlete_id IS NOT NULL THEN 1 ELSE 0 END = 1",
            name="one_target",
        ),
        UniqueConstraint("user_id", "sport_id", name="uq_favorite_sport"),
        UniqueConstraint("user_id", "league_id", name="uq_favorite_league"),
        UniqueConstraint("user_id", "team_id", name="uq_favorite_team"),
        UniqueConstraint("user_id", "athlete_id", name="uq_favorite_athlete"),
    )
    favorite_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("app_user.user_id", ondelete="CASCADE"), index=True
    )
    sport_id: Mapped[int | None] = mapped_column(
        ForeignKey("sport.sport_id", ondelete="CASCADE"), index=True
    )
    league_id: Mapped[int | None] = mapped_column(
        ForeignKey("league.league_id", ondelete="CASCADE"), index=True
    )
    team_id: Mapped[int | None] = mapped_column(
        ForeignKey("team.team_id", ondelete="CASCADE"), index=True
    )
    athlete_id: Mapped[int | None] = mapped_column(
        ForeignKey("athlete.athlete_id", ondelete="CASCADE"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )
