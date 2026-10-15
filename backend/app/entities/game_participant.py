"""GameParticipant table mapping and database constraints."""

from __future__ import annotations

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class GameParticipant(Base):
    __tablename__ = "game_participant"
    __table_args__ = (
        UniqueConstraint("game_id", "participant_role"),
        CheckConstraint("participant_role IN ('home', 'away')", name="valid_role"),
        CheckConstraint("score IS NULL OR score >= 0", name="nonnegative_score"),
    )
    game_id: Mapped[int] = mapped_column(
        ForeignKey("game.game_id", ondelete="CASCADE"), primary_key=True
    )
    team_id: Mapped[int] = mapped_column(
        ForeignKey("team.team_id", ondelete="RESTRICT"), primary_key=True, index=True
    )
    participant_role: Mapped[str] = mapped_column(String(10))
    score: Mapped[int | None] = mapped_column(Integer)
