"""Team table mapping and database constraints."""

from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, nonblank


class Team(Base):
    __tablename__ = "team"
    __table_args__ = (
        UniqueConstraint("league_id", "team_name"),
        nonblank("team_name", "city"),
    )
    team_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_name: Mapped[str] = mapped_column(String(150))
    city: Mapped[str] = mapped_column(String(100))
    league_id: Mapped[int] = mapped_column(
        ForeignKey("league.league_id", ondelete="RESTRICT"), index=True
    )
