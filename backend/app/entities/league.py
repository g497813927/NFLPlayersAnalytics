"""League table mapping and database constraints."""

from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, nonblank


class League(Base):
    __tablename__ = "league"
    __table_args__ = (
        UniqueConstraint("sport_id", "league_name"),
        nonblank("league_name", "country"),
    )
    league_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    league_name: Mapped[str] = mapped_column(String(150))
    country: Mapped[str] = mapped_column(String(100))
    sport_id: Mapped[int] = mapped_column(
        ForeignKey("sport.sport_id", ondelete="RESTRICT"), index=True
    )
