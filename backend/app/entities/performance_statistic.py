"""PerformanceStatistic table mapping and database constraints."""

from __future__ import annotations

from sqlalchemy import CheckConstraint, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class PerformanceStatistic(Base):
    __tablename__ = "performance_statistic"
    __table_args__ = (
        CheckConstraint(
            "(athlete_id IS NOT NULL AND team_id IS NULL) OR (athlete_id IS NULL AND team_id IS NOT NULL)",
            name="one_subject",
        ),
        UniqueConstraint(
            "game_id",
            "stat_definition_id",
            "athlete_id",
            name="uq_performance_statistic_athlete",
        ),
        UniqueConstraint(
            "game_id",
            "stat_definition_id",
            "team_id",
            name="uq_performance_statistic_team",
        ),
    )
    performance_statistic_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    game_id: Mapped[int] = mapped_column(
        ForeignKey("game.game_id", ondelete="CASCADE"), index=True
    )
    stat_definition_id: Mapped[int] = mapped_column(
        ForeignKey("stat_definition.stat_definition_id", ondelete="RESTRICT"),
        index=True,
    )
    athlete_id: Mapped[int | None] = mapped_column(
        ForeignKey("athlete.athlete_id", ondelete="RESTRICT"), index=True
    )
    team_id: Mapped[int | None] = mapped_column(
        ForeignKey("team.team_id", ondelete="RESTRICT"), index=True
    )
    stat_value: Mapped[float] = mapped_column(Float)
