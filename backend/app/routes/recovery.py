from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.customer import Customer
from app.models.recovery_audit import RecoveryAudit
from app.models.recovery_batch import RecoveryBatch
from app.routes.auth import get_current_user
from app.models.user import User
from app.services.recovery_service import RecoveryService
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, timedelta, datetime
from decimal import Decimal
import json
from collections import defaultdict

router = APIRouter(
    prefix="/recovery",
    tags=["AI Revenue Recovery"]
)

class ApproveActionRequest(BaseModel):
    customer_id: int
    action_type: str
    force_fail: Optional[bool] = False

class SimulatePaymentRequest(BaseModel):
    customer_id: int
    amount: float

class BatchApproveRequest(BaseModel):
    customer_ids: List[int]
    simulate_recovery: Optional[bool] = True

class PromiseToPayRequest(BaseModel):
    amount: float
    promise_date: date
    notes: Optional[str] = ""

@router.get("/dashboard")
def get_recovery_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns summary statistics and charts data for B2B Revenue Recovery.
    """
    user_id = current_user.id
    
    total_outstanding = db.query(func.sum(Customer.outstanding_amount)).filter(Customer.user_id == user_id).scalar() or Decimal("0.0")
    total_overdue = db.query(func.sum(Customer.overdue_amount)).filter(Customer.user_id == user_id).scalar() or Decimal("0.0")
    total_recovered = db.query(func.sum(Customer.total_amount_paid)).filter(Customer.user_id == user_id).scalar() or Decimal("0.0")
    high_risk_receivables = db.query(func.sum(Customer.outstanding_amount)).filter(
        Customer.user_id == user_id,
        Customer.ai_risk_level.in_(["High", "Critical"])
    ).scalar() or Decimal("0.0")

    # Due dates
    today = date.today()
    due_today = db.query(func.sum(Customer.outstanding_amount)).filter(
        Customer.user_id == user_id,
        Customer.next_due_date == today
    ).scalar() or Decimal("0.0")

    week_end = today + timedelta(days=7)
    due_this_week = db.query(func.sum(Customer.outstanding_amount)).filter(
        Customer.user_id == user_id,
        Customer.next_due_date >= today,
        Customer.next_due_date <= week_end
    ).scalar() or Decimal("0.0")

    # Promise-to-Pay (PTP) Stats
    active_ptp_count = db.query(func.count(Customer.id)).filter(
        Customer.user_id == user_id,
        Customer.promise_to_pay_status == "ACTIVE"
    ).scalar() or 0

    active_ptp_amount = db.query(func.sum(Customer.promise_to_pay_amount)).filter(
        Customer.user_id == user_id,
        Customer.promise_to_pay_status == "ACTIVE"
    ).scalar() or Decimal("0.0")

    # Recovery rate math
    total_credit_issued = total_outstanding + total_recovered
    recovery_rate = 0.0
    if total_credit_issued > 0:
        recovery_rate = float(total_recovered / total_credit_issued * 100)

    # Count statistics
    customers_analyzed = db.query(func.count(Customer.id)).filter(Customer.user_id == user_id).scalar() or 0
    high_risk_customers = db.query(func.count(Customer.id)).filter(
        Customer.user_id == user_id,
        Customer.ai_risk_level.in_(["High", "Critical"])
    ).scalar() or 0

    recommended_actions_count = db.query(func.count(Customer.id)).filter(
        Customer.user_id == user_id,
        Customer.outstanding_amount > 0,
        Customer.ai_recommended_action != "No Action",
        Customer.ai_recommended_action != None
    ).scalar() or 0

    # Audit stats
    successful_recoveries_count = db.query(func.count(RecoveryAudit.id)).filter(
        RecoveryAudit.user_id == user_id,
        RecoveryAudit.status == "success"
    ).scalar() or 0

    failed_actions_count = db.query(func.count(RecoveryAudit.id)).filter(
        RecoveryAudit.user_id == user_id,
        RecoveryAudit.status == "failed"
    ).scalar() or 0

    exceptions_count = db.query(func.count(RecoveryAudit.id)).filter(
        RecoveryAudit.user_id == user_id,
        RecoveryAudit.status.in_(["failed", "blocked"])
    ).scalar() or 0

    # Recent Audit trail (last 20 items)
    recent_audits = db.query(RecoveryAudit).filter(
        RecoveryAudit.user_id == user_id
    ).order_by(RecoveryAudit.created_at.desc()).limit(20).all()

    audits_data = []
    for a in recent_audits:
        audits_data.append({
            "id": a.id,
            "customer_id": a.customer_id,
            "customer_name": a.customer_name or f"Customer #{a.customer_id}",
            "amount": float(a.amount or 0.0),
            "recovered_amount": float(a.recovered_amount or 0.0),
            "action_type": a.action_type,
            "status": a.status,
            "risk_level": a.risk_level,
            "reason": a.recommendation_reason,
            "details": a.details,
            "batch_id": a.batch_id,
            "before_state": {
                "outstanding": float(a.before_outstanding or 0.0),
                "overdue": float(a.before_overdue or 0.0),
                "risk_score": float(a.before_risk_score or 0.0),
                "risk_level": a.before_risk_level or "Low"
            } if a.before_outstanding is not None else None,
            "after_state": {
                "outstanding": float(a.after_outstanding or 0.0),
                "overdue": float(a.after_overdue or 0.0),
                "risk_score": float(a.after_risk_score or 0.0),
                "risk_level": a.after_risk_level or "Low"
            } if a.after_outstanding is not None else None,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })

    # Monthly recovery aggregation (trailing 6 months ending in current month)
    monthly_data = []

    
    # Identify the trailing 6 calendar months
    target_months = []
    for i in range(5, -1, -1):
        month_idx = today.month - i
        year = today.year
        while month_idx <= 0:
            month_idx += 12
            year -= 1
        target_months.append((year, month_idx))

    # 1. Map audit recoveries by month & customer
    audits = db.query(RecoveryAudit).filter(
        RecoveryAudit.user_id == user_id,
        RecoveryAudit.status == "success"
    ).all()

    audit_recovered_by_customer = defaultdict(float)
    audits_by_month = defaultdict(float)
    for a in audits:
        if a.created_at:
            m_key = (a.created_at.year, a.created_at.month)
            rec = float(a.recovered_amount or a.amount or 0.0)
            audits_by_month[m_key] += rec
            audit_recovered_by_customer[a.customer_id] += rec

    # 2. Map customer baseline payments (total_amount_paid minus audit recoveries)
    customers = db.query(Customer).filter(Customer.user_id == user_id).all()
    baseline_by_month = defaultdict(float)
    for c in customers:
        cust_total = float(c.total_amount_paid or 0.0)
        audit_total = audit_recovered_by_customer[c.id]
        baseline_paid = max(0.0, cust_total - audit_total)
        if baseline_paid > 0 and c.last_purchase:
            m_key = (c.last_purchase.year, c.last_purchase.month)
            baseline_by_month[m_key] += baseline_paid

    for (y, m_num) in target_months:
        dt = date(y, m_num, 1)
        month_name = dt.strftime("%b")
        total_for_month = audits_by_month.get((y, m_num), 0.0) + baseline_by_month.get((y, m_num), 0.0)
        is_current = (y == today.year and m_num == today.month)
        
        monthly_data.append({
            "name": month_name,
            "month": f"{month_name} (Active)" if is_current else month_name,
            "year": y,
            "monthNum": m_num,
            "recovered": round(total_for_month, 2),
            "target": round(total_for_month * 1.15, 2)
        })


    return {
        "summary": {
            "total_outstanding": float(total_outstanding),
            "total_overdue": float(total_overdue),
            "due_today": float(due_today),
            "due_this_week": float(due_this_week),
            "overdue": float(total_overdue),
            "high_risk_receivables": float(high_risk_receivables),
            "amount_recovered": float(total_recovered),
            "amount_targeted": float(total_overdue),
            "recovery_rate": round(recovery_rate, 1),
            "customers_analyzed": customers_analyzed,
            "high_risk_customers": high_risk_customers,
            "recommended_actions": recommended_actions_count,
            "successful_recoveries": successful_recoveries_count,
            "failed_actions": failed_actions_count,
            "exceptions": exceptions_count,
            "active_ptp_count": active_ptp_count,
            "active_ptp_amount": float(active_ptp_amount)
        },
        "audits": audits_data,
        "chart": monthly_data
    }

@router.get("/queue")
def get_recovery_queue(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns list of prioritized customers that require recovery actions.
    Checks and displays Promise-to-Pay (PTP) status and stopping states.
    """
    user_id = current_user.id
            
    debtors = db.query(Customer).filter(
        Customer.user_id == user_id,
        Customer.outstanding_amount > 0
    ).all()

    queue = []
    service = RecoveryService()

    for d in debtors:
        # Check PTP status first
        ptp_status = service.check_ptp_status(d, db)

        if not d.ai_risk_level or not d.ai_recommended_action:
            assessment = service.run_risk_assessment(db, d.id, user_id)
            rec_action = assessment.get("recommended_action")
            rec_reason = assessment.get("recommended_reason")
            risk_level = assessment.get("risk_level")
            risk_score = assessment.get("risk_score")
            msg = assessment.get("personalized_message")
            explanation = assessment.get("explanation")
        else:
            rec_action = d.ai_recommended_action
            rec_reason = d.ai_recommended_reason
            risk_level = d.ai_risk_level
            risk_score = float(d.ai_risk_score or 0.0)
            explanation = d.ai_risk_explanation
            
            days_overdue = 0
            if d.next_due_date and d.next_due_date < date.today():
                days_overdue = (date.today() - d.next_due_date).days
            
            if ptp_status == "ACTIVE":
                ptp_date_str = d.promise_to_pay_date.strftime('%d %b %Y') if d.promise_to_pay_date else 'Scheduled Date'
                rec_action = "Recovery Paused (PTP Active)"
                rec_reason = f"Customer has active Promise-to-Pay for ₹{float(d.promise_to_pay_amount or 0):,.2f} until {ptp_date_str}."
                msg = f"Hello {d.name}, acknowledging your scheduled payment date of {ptp_date_str} for ₹{float(d.promise_to_pay_amount or 0):,.2f}. Thank you!"
            elif risk_level == "Critical":
                msg = f"Urgent notice: {d.name}, your credit balance of ₹{float(d.outstanding_amount):,.2f} is overdue by {days_overdue} days. Reach account executives immediately to clear dues."
            elif risk_level == "High":
                msg = f"Hi {d.name}, your invoice payment of ₹{float(d.overdue_amount):,.2f} is overdue. Please complete it instantly here: "
            else:
                msg = f"Friendly reminder: {d.name}, your invoice of ₹{float(d.outstanding_amount):,.2f} is due. Thank you for your partnership!"

        priority = 1
        if risk_level == "Critical": priority = 4
        elif risk_level == "High": priority = 3
        elif risk_level == "Medium": priority = 2

        if rec_action == "No Action" or (risk_level == "Low" and ptp_status != "ACTIVE"):
            continue

        queue.append({
            "customer_id": d.id,
            "customer_name": d.name,
            "email": d.email,
            "phone": d.phone,
            "outstanding_amount": float(d.outstanding_amount or 0.0),
            "overdue_amount": float(d.overdue_amount or 0.0),
            "days_overdue": (date.today() - d.next_due_date).days if d.next_due_date and d.next_due_date < date.today() else 0,
            "next_due_date": d.next_due_date.isoformat() if d.next_due_date else None,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "recommended_action": rec_action,
            "recommended_reason": rec_reason,
            "explanation": explanation,
            "personalized_message": msg,
            "priority": priority,
            # Promise-to-Pay Fields
            "promise_to_pay_status": ptp_status,
            "promise_to_pay_date": d.promise_to_pay_date.isoformat() if d.promise_to_pay_date else None,
            "promise_to_pay_amount": float(d.promise_to_pay_amount or 0.0),
            "promise_to_pay_notes": d.promise_to_pay_notes,
            "is_ptp_paused": ptp_status == "ACTIVE"
        })

    # Sort queue: highest priority first, then highest outstanding
    queue.sort(key=lambda x: (-x["priority"], -x["outstanding_amount"]))
    return queue

@router.post("/action/approve")
def approve_recovery_action(
    payload: ApproveActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Merchant approves an AI-recommended recovery action. Executed in simulated test mode.
    """
    service = RecoveryService()
    res = service.execute_recovery_action(
        db,
        customer_id=payload.customer_id,
        user_id=current_user.id,
        action_type=payload.action_type,
        force_fail=payload.force_fail
    )
    if res.get("status") in ["failed", "blocked"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res.get("error", "Action execution failed")
        )
    return res

@router.post("/batch/approve")
def approve_recovery_batch(
    payload: BatchApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Executes bounded recovery across an entire batch of customers.
    Enforces all guardrails, calculates state mutations, records batch and customer audit entries.
    """
    if not payload.customer_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No customers selected for batch recovery"
        )

    service = RecoveryService()
    result = service.execute_batch_recovery(
        db,
        user_id=current_user.id,
        customer_ids=payload.customer_ids,
        simulate_recovery=payload.simulate_recovery
    )
    return result

@router.get("/batch/history")
def get_batch_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns list of historical recovery batches.
    """
    batches = db.query(RecoveryBatch).filter(
        RecoveryBatch.user_id == current_user.id
    ).order_by(RecoveryBatch.created_at.desc()).all()

    result = []
    for b in batches:
        result.append({
            "id": b.id,
            "batch_id": b.batch_id,
            "customer_count": b.customer_count,
            "total_at_risk": float(b.total_at_risk or 0.0),
            "total_targeted": float(b.total_targeted or 0.0),
            "total_recovered": float(b.total_recovered or 0.0),
            "success_count": b.success_count,
            "skipped_count": b.skipped_count,
            "failed_count": b.failed_count,
            "escalated_count": b.escalated_count,
            "status": b.status,
            "created_at": b.created_at.isoformat() if b.created_at else None
        })
    return result

@router.get("/batch/{batch_id}")
def get_batch_details(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full details and itemized results of a specific recovery batch.
    """
    batch = db.query(RecoveryBatch).filter(
        RecoveryBatch.batch_id == batch_id,
        RecoveryBatch.user_id == current_user.id
    ).first()

    if not batch:
        raise HTTPException(status_code=404, detail="Recovery batch not found")

    items = []
    if batch.details:
        try:
            items = json.loads(batch.details)
        except Exception:
            pass

    return {
        "id": batch.id,
        "batch_id": batch.batch_id,
        "customer_count": batch.customer_count,
        "total_at_risk": float(batch.total_at_risk or 0.0),
        "total_targeted": float(batch.total_targeted or 0.0),
        "total_recovered": float(batch.total_recovered or 0.0),
        "success_count": batch.success_count,
        "skipped_count": batch.skipped_count,
        "failed_count": batch.failed_count,
        "escalated_count": batch.escalated_count,
        "status": batch.status,
        "items": items,
        "created_at": batch.created_at.isoformat() if batch.created_at else None
    }

@router.post("/customer/{customer_id}/ptp")
def register_promise_to_pay(
    customer_id: int,
    payload: PromiseToPayRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Registers an active Promise-to-Pay for a customer, pausing automated recovery outreach.
    """
    service = RecoveryService()
    res = service.create_promise_to_pay(
        db,
        customer_id=customer_id,
        user_id=current_user.id,
        amount=payload.amount,
        ptp_date=payload.promise_date,
        notes=payload.notes or ""
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@router.post("/customer/{customer_id}/ptp/cancel")
def cancel_promise_to_pay(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancels an active Promise-to-Pay and returns the customer to active recovery eligibility.
    """
    service = RecoveryService()
    res = service.cancel_promise_to_pay(db, customer_id=customer_id, user_id=current_user.id)
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

@router.post("/action/simulate-payment")
def simulate_payment_success(
    payload: SimulatePaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Simulates a successful payment callback for testing and recovery dashboard updates.
    Returns Before vs After financial state delta proof.
    """
    service = RecoveryService()
    res = service.process_test_payment_link_success(
        db,
        customer_id=payload.customer_id,
        amount=payload.amount
    )
    if "error" in res:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res["error"]
        )
    return res

@router.get("/audits")
def get_all_recovery_audits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns full trace log details of all B2B credit recovery actions with Before vs After state.
    """
    audits = db.query(RecoveryAudit).filter(
        RecoveryAudit.user_id == current_user.id
    ).order_by(RecoveryAudit.created_at.desc()).all()
    
    result = []
    for a in audits:
        result.append({
            "id": a.id,
            "customer_id": a.customer_id,
            "customer_name": a.customer_name or f"Customer #{a.customer_id}",
            "amount": float(a.amount or 0.0),
            "recovered_amount": float(a.recovered_amount or 0.0),
            "action_type": a.action_type,
            "status": a.status,
            "risk_level": a.risk_level,
            "reason": a.recommendation_reason,
            "details": a.details,
            "batch_id": a.batch_id,
            "before_state": {
                "outstanding": float(a.before_outstanding or 0.0),
                "overdue": float(a.before_overdue or 0.0),
                "risk_score": float(a.before_risk_score or 0.0),
                "risk_level": a.before_risk_level or "Low"
            } if a.before_outstanding is not None else None,
            "after_state": {
                "outstanding": float(a.after_outstanding or 0.0),
                "overdue": float(a.after_overdue or 0.0),
                "risk_score": float(a.after_risk_score or 0.0),
                "risk_level": a.after_risk_level or "Low"
            } if a.after_outstanding is not None else None,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return result

@router.get("/audit/{audit_id}")
def get_recovery_audit_detail(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns complete Before vs After state and logs for a single recovery audit event.
    """
    audit = db.query(RecoveryAudit).filter(
        RecoveryAudit.id == audit_id,
        RecoveryAudit.user_id == current_user.id
    ).first()

    if not audit:
        raise HTTPException(status_code=404, detail="Audit log record not found")

    return {
        "id": audit.id,
        "customer_id": audit.customer_id,
        "customer_name": audit.customer_name,
        "amount": float(audit.amount or 0.0),
        "recovered_amount": float(audit.recovered_amount or 0.0),
        "action_type": audit.action_type,
        "status": audit.status,
        "risk_level": audit.risk_level,
        "reason": audit.recommendation_reason,
        "details": audit.details,
        "batch_id": audit.batch_id,
        "before_state": {
            "outstanding": float(audit.before_outstanding or 0.0),
            "overdue": float(audit.before_overdue or 0.0),
            "risk_score": float(audit.before_risk_score or 0.0),
            "risk_level": audit.before_risk_level or "Low"
        } if audit.before_outstanding is not None else None,
        "after_state": {
            "outstanding": float(audit.after_outstanding or 0.0),
            "overdue": float(audit.after_overdue or 0.0),
            "risk_score": float(audit.after_risk_score or 0.0),
            "risk_level": audit.after_risk_level or "Low"
        } if audit.after_outstanding is not None else None,
        "created_at": audit.created_at.isoformat() if audit.created_at else None
    }
