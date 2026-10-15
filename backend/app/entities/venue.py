"""Venue table mapping and database constraints."""

from __future__ import annotations

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, nonblank


class Venue(Base):
    __tablename__ = "venue"
    __table_args__ = (nonblank("venue_name", "city"),)
    venue_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    venue_name: Mapped[str] = mapped_column(String(150))
    city: Mapped[str] = mapped_column(String(100))
