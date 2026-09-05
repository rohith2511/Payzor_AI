from pydantic import BaseModel
from typing import Optional

class AnalyticsResponse(BaseModel):
    total_customers: int
    total_campaigns: int
    messages_sent: int
    delivered: Optional[int] = 0
    opened: Optional[int] = 0
    clicked: Optional[int] = 0
    purchased: Optional[int] = 0
    revenue_generated: float
    open_rate: Optional[float] = 0.0
    ctr: Optional[float] = 0.0
    conversion_rate: Optional[float] = 0.0
    campaign_roi: Optional[float] = 0.0
    
    # Track 03: AI Revenue Recovery metrics
    revenue_at_risk: Optional[float] = 0.0
    recovered_revenue: Optional[float] = 0.0
    customers_targeted: Optional[int] = 0
    eligible_accounts: Optional[int] = 0
    customers_recovered: Optional[int] = 0
    recovery_rate: Optional[float] = 0.0
    outstanding_reduced: Optional[float] = 0.0
    overdue_reduced: Optional[float] = 0.0