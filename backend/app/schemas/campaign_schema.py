from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class CampaignCreate(BaseModel):
    campaign_name: str
    channel: str
    audience_size: int
    status: Optional[str] = "Draft"
    revenue: Optional[float] = 0.0

class CampaignResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    campaign_name: Optional[str] = None
    channel: Optional[str] = None
    audience_size: Optional[int] = None
    status: Optional[str] = None
    revenue: Optional[float] = 0.0
    scheduled_time: Optional[datetime] = None
    launch_time: Optional[datetime] = None
    target_segment: Optional[str] = None
    campaign_type: Optional[str] = "recovery"
    objective: Optional[str] = None
    batch_id: Optional[str] = None
    revenue_at_risk: Optional[float] = 0.0
    recovered_amount: Optional[float] = 0.0
    skipped_count: Optional[int] = 0
    success_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    sent: Optional[int] = 0
    delivered: Optional[int] = 0
    opened: Optional[int] = 0
    clicked: Optional[int] = 0
    purchased: Optional[int] = 0
    failed: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

class CampaignGenerateRequest(BaseModel):
    goal: str
    segment: Optional[str] = None
    channel: Optional[str] = None
    objective: Optional[str] = None

class CampaignGenerateResponse(BaseModel):
    campaign_name: str
    whatsapp_message: str
    email_content: str
    sms_content: str
    recommended_channel: str

class RecoveryWorkflowRequest(BaseModel):
    audience_segment: str
    objective: Optional[str] = "Recover Overdue Receivables"
    channel: Optional[str] = "whatsapp"
    goal: Optional[str] = ""

class RecoveryCampaignExecuteRequest(BaseModel):
    campaign_name: str
    objective: str
    target_segment: str
    channel: str
    customer_ids: list[int]
    simulate_recovery: Optional[bool] = True