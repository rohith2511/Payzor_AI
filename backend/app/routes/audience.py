from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.audience_schema import AudienceRequest, AudienceResponse
from app.schemas.customer_schema import CustomerResponse
from app.services.audience_service import AudienceService
from app.routes.auth import get_current_user
from app.models.user import User
from typing import List, Dict, Any

router = APIRouter(
    prefix="/audience",
    tags=["Audience Builder"]
)

@router.post("")
@router.post("/")
@router.post("/query")
def query_audience(
    payload: AudienceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AudienceService()
    
    is_fallback = False
    try:
        customers, parsed_filters = service.filter_customers_by_prompt(db, payload.prompt, current_user.id)
    except Exception as e:
        # Graceful deterministic fallback
        print(f"[AUDIENCE ROUTE] Service exception: {e}. Executing deterministic fallback.")
        is_fallback = True
        try:
            # Re-run with deterministic fallback
            filters = service.groq_service._fallback_recovery_parse(payload.prompt) if hasattr(service.groq_service, '_fallback_recovery_parse') else {}
            # Apply basic query
            from sqlalchemy import select
            from app.models.customer import Customer
            query = select(Customer).where(Customer.user_id == current_user.id)
            if "overdue" in payload.prompt.lower():
                query = query.where(Customer.overdue_amount > 0)
            customers = db.scalars(query).all()
            parsed_filters = {
                "segment_name": f"Recovery Cohort: {payload.prompt[:30]}",
                "has_overdue": True,
                "why_this_audience": "AI interpretation unavailable — using deterministic recovery rules."
            }
        except Exception as inner_e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Audience generation failed: {str(inner_e)}"
            )
    
    # Calculate real B2B revenue recovery aggregates from matched customers
    total_overdue = sum(float(c.overdue_amount or 0.0) for c in customers)
    total_outstanding = sum(float(c.outstanding_amount or 0.0) for c in customers)
    total_at_risk = sum(
        float(c.overdue_amount or c.outstanding_amount or 0.0)
        for c in customers
        if ((c.ai_risk_level in ["High", "Critical"]) or float(c.overdue_amount or 0.0) > 0)
    )
    avg_risk_score = round(sum(float(c.ai_risk_score or 0.0) for c in customers) / len(customers), 1) if customers else 0.0

    # Risk tier distribution
    critical_count = len([c for c in customers if (c.ai_risk_level or "").capitalize() == "Critical"])
    high_count = len([c for c in customers if (c.ai_risk_level or "").capitalize() == "High"])
    medium_count = len([c for c in customers if (c.ai_risk_level or "").capitalize() in ["Medium", "Moderate"]])
    low_count = len([c for c in customers if (c.ai_risk_level or "").capitalize() == "Low"])

    # Guardrail eligibility counts
    ptp_active_custs = [c for c in customers if (c.promise_to_pay_status or "").upper() == "ACTIVE"]
    ptp_active_count = len(ptp_active_custs)
    ptp_active_amount = sum(float(c.promise_to_pay_amount or c.overdue_amount or 0.0) for c in ptp_active_custs)
    
    zero_balance_count = len([c for c in customers if float(c.outstanding_amount or 0.0) <= 0 and (c.promise_to_pay_status or "").upper() != "ACTIVE"])
    
    # Eligible for active recovery dispatch
    eligible_count = max(0, len(customers) - ptp_active_count - zero_balance_count)

    segment_name = parsed_filters.get("segment_name") or f"Recovery Cohort: {payload.prompt}"
    why_this_audience = parsed_filters.get("why_this_audience") or (
        f"This cohort comprises {len(customers)} accounts representing ₹{total_overdue:,.2f} in overdue receivables "
        f"and ₹{total_outstanding:,.2f} total outstanding exposure. Accounts are prioritized for bounded recovery outreach."
    )

    return {
        "segment_name": segment_name,
        "customer_count": len(customers),
        "total_overdue": total_overdue,
        "total_outstanding": total_outstanding,
        "revenue_at_risk": total_at_risk,
        "average_risk_score": avg_risk_score,
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "ptp_active_count": ptp_active_count,
        "ptp_active_amount": ptp_active_amount,
        "zero_balance_count": zero_balance_count,
        "eligible_count": eligible_count,
        "is_fallback": is_fallback,
        "why_this_audience": why_this_audience,
        "filters": parsed_filters,
        "customers": [CustomerResponse.model_validate(c) for c in customers]
    }