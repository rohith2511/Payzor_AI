from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional

class CustomerCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    total_spend: Optional[float] = 0.0
    segment: Optional[str] = "New Customers"
    last_purchase: Optional[date] = None

class CustomerResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    total_spend: Optional[float] = 0.0
    segment: Optional[str] = None
    last_purchase: Optional[date] = None
    created_at: Optional[datetime] = None

    # B2B Credit & Receivables fields
    credit_limit: Optional[float] = 0.0
    total_credit_issued: Optional[float] = 0.0
    total_amount_paid: Optional[float] = 0.0
    outstanding_amount: Optional[float] = 0.0
    current_due_amount: Optional[float] = 0.0
    overdue_amount: Optional[float] = 0.0
    next_due_date: Optional[date] = None
    number_of_delayed_payments: Optional[int] = 0
    average_payment_delay: Optional[int] = 0
    payment_reliability: Optional[str] = "High"
    previous_payment_behavior: Optional[str] = None
    recovery_history: Optional[str] = None
    ai_risk_score: Optional[float] = 0.0
    ai_risk_level: Optional[str] = "Low"
    ai_risk_explanation: Optional[str] = None
    ai_recommended_action: Optional[str] = None
    ai_recommended_reason: Optional[str] = None

    # Promise-to-Pay (PTP) fields
    promise_to_pay_date: Optional[date] = None
    promise_to_pay_amount: Optional[float] = 0.0
    promise_to_pay_status: Optional[str] = None
    promise_to_pay_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)