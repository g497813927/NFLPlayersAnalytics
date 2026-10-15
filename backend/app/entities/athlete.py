"""Athlete table mapping and database constraints."""

from __future__ import annotations

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, nonblank


class Athlete(Base):
    __tablename__ = "athlete"
    __table_args__ = (nonblank("first_name", "last_name"),)
    athlete_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100), index=True)
    nationality: Mapped[str | None] = mapped_column(String(100))
