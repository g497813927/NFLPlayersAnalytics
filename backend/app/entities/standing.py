"""Standing table mapping and database constraints."""

from __future__ import annotations

from sqlalchemy import CheckConstraint, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Standing(Base):
    __tablename__ = "standing"
    __table_args__ = (
        UniqueConstraint("team_id", "season_id"),
        CheckConstraint("rank > 0", name="positive_rank"),
        CheckConstraint(
            "wins >= 0 AND losses >= 0 AND ties >= 0", name="nonnegative_record"
        ),
        CheckConstraint("points >= 0", name="nonnegative_points"),
    )
    standing_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_id: Mapped[int] = mapped_column(
        ForeignKey("team.team_id", ondelete="CASCADE"), index=True
    )
    season_id: Mapped[int] = mapped_column(
        ForeignKey("season.season_id", ondelete="CASCADE"), index=True
    )
    rank: Mapped[int] = mapped_column(Integer)
    wins: Mapped[int] = mapped_column(Integer, server_default="0")
    losses: Mapped[int] = mapped_column(Integer, server_default="0")
    ties: Mapped[int] = mapped_column(Integer, server_default="0")
    points: Mapped[float] = mapped_column(Float, server_default="0")
