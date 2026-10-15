"""DataImport table mapping and database constraints."""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, nonblank


class DataImport(Base):
    __tablename__ = "data_import"
    __table_args__ = (
        CheckConstraint(
            "status IN ('completed', 'failed', 'pending')", name="valid_status"
        ),
        nonblank("source_name"),
    )
    import_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    source_name: Mapped[str] = mapped_column(String(200))
    imported_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP")
    )
    status: Mapped[str] = mapped_column(String(20), server_default="pending")
    run_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("app_user.user_id", ondelete="SET NULL"), index=True
    )
