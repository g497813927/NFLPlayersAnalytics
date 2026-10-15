"""User table mapping and database constraints."""

from __future__ import annotations

from sqlalchemy import CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, nonblank


class User(Base):
    __tablename__ = "app_user"
    __table_args__ = (
        CheckConstraint("role IN ('fan', 'analyst', 'admin')", name="valid_role"),
        nonblank("email", "display_name"),
    )
    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    display_name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20), server_default="fan")
