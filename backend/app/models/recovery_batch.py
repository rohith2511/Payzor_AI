from __future__ import annotations
from sqlalchemy import String, Numeric, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
from decimal import Decimal

class RecoveryBatch(Base):
    __tablename__ = "recovery_batches"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    batch_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    customer_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_at_risk: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.0, nullable=False)
    total_targeted: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.0, nullable=False)
    total_recovered: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0.0, nullable=False)
    success_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    skipped_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    escalated_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="completed", nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=True)  # JSON string containing customer results & stopping reasons
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)
