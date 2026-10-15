"""Sport table mapping and database constraints."""

from __future__ import annotations

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, nonblank


class Sport(Base):
    __tablename__ = "sport"
    __table_args__ = (nonblank("sport_name"),)
    sport_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    sport_name: Mapped[str] = mapped_column(String(100), unique=True)
