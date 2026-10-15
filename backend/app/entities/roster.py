"""Roster table mapping and database constraints."""

from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Roster(Base):
    __tablename__ = "roster"
    __table_args__ = (UniqueConstraint("team_id", "season_id"),)
    roster_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_id: Mapped[int] = mapped_column(
        ForeignKey("team.team_id", ondelete="RESTRICT"), index=True
    )
    season_id: Mapped[int] = mapped_column(
        ForeignKey("season.season_id", ondelete="RESTRICT"), index=True
    )
