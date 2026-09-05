from sqlalchemy import String, Numeric, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.customer import Customer

class RecoveryAudit(Base):
    __tablename__ = "recovery_audits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(100), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True, default=0.0)
    action_type: Mapped[str] = mapped_column(String(50), nullable=True)  # e.g., "payment_reminder", "payment_link", "payment_retry"
    status: Mapped[str] = mapped_column(String(50), nullable=True)  # e.g., "pending", "success", "failed", "blocked"
    risk_level: Mapped[str] = mapped_column(String(20), nullable=True)
    recommendation_reason: Mapped[str] = mapped_column(String, nullable=True)
    details: Mapped[str] = mapped_column(String, nullable=True)  # JSON-formatted string or detailed text trace
    batch_id: Mapped[str] = mapped_column(String(100), nullable=True, index=True)

    # Before vs After State Capture
    before_outstanding: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)
    before_overdue: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)
    before_risk_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)
    before_risk_level: Mapped[str] = mapped_column(String(20), nullable=True)

    after_outstanding: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)
    after_overdue: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True)
    after_risk_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True)
    after_risk_level: Mapped[str] = mapped_column(String(20), nullable=True)

    recovered_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

    customer: Mapped["Customer"] = relationship("Customer", back_populates="recovery_audits")
