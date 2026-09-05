from sqlalchemy import String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import date, datetime
from decimal import Decimal
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.event import Event
    from app.models.negotiation import Negotiation
    from app.models.recovery_audit import RecoveryAudit

class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=True)
    email: Mapped[str] = mapped_column(String(100), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    city: Mapped[str] = mapped_column(String(50), nullable=True)
    total_spend: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True, default=0.0)
    segment: Mapped[str] = mapped_column(String(50), nullable=True)
    last_purchase: Mapped[date] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=True)

    # B2B Credit & Receivables fields
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True, default=0.0)
    total_credit_issued: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True, default=0.0)
    total_amount_paid: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True, default=0.0)
    outstanding_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True, default=0.0)
    current_due_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True, default=0.0)
    overdue_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True, default=0.0)
    next_due_date: Mapped[date] = mapped_column(Date, nullable=True)
    number_of_delayed_payments: Mapped[int] = mapped_column(nullable=True, default=0)
    average_payment_delay: Mapped[int] = mapped_column(nullable=True, default=0)
    payment_reliability: Mapped[str] = mapped_column(String(50), nullable=True, default="High")
    previous_payment_behavior: Mapped[str] = mapped_column(String, nullable=True)
    recovery_history: Mapped[str] = mapped_column(String, nullable=True)
    ai_risk_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=True, default=0.0)
    ai_risk_level: Mapped[str] = mapped_column(String(20), nullable=True, default="Low")
    ai_risk_explanation: Mapped[str] = mapped_column(String, nullable=True)
    ai_recommended_action: Mapped[str] = mapped_column(String, nullable=True)
    ai_recommended_reason: Mapped[str] = mapped_column(String, nullable=True)

    # Promise-to-Pay (PTP) Fields
    promise_to_pay_date: Mapped[date] = mapped_column(Date, nullable=True)
    promise_to_pay_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=True, default=0.0)
    promise_to_pay_status: Mapped[str] = mapped_column(String(20), nullable=True)  # ACTIVE, FULFILLED, EXPIRED, CANCELLED
    promise_to_pay_created_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    promise_to_pay_notes: Mapped[str] = mapped_column(String, nullable=True)

    orders: Mapped[List["Order"]] = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    events: Mapped[List["Event"]] = relationship("Event", back_populates="customer", cascade="all, delete-orphan")
    negotiations: Mapped[List["Negotiation"]] = relationship("Negotiation", back_populates="customer", cascade="all, delete-orphan")
    recovery_audits: Mapped[List["RecoveryAudit"]] = relationship("RecoveryAudit", back_populates="customer", cascade="all, delete-orphan")