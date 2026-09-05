from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.customer import Customer
from app.models.campaign import Campaign
from app.models.event import Event
from app.models.recovery_audit import RecoveryAudit
from app.models.recovery_batch import RecoveryBatch

class AnalyticsService:
    def get_analytics(self, db: Session, user_id: int):
        """
        Gathers general dashboard analytics metrics by aggregating customer, campaign, and recovery ledger logs.
        """
        total_customers = db.query(func.count(Customer.id)).filter(Customer.user_id == user_id).scalar() or 0
        total_campaigns = db.query(func.count(Campaign.id)).filter(Campaign.user_id == user_id).scalar() or 0
        
        # Recovery specific aggregations
        revenue_at_risk = db.query(func.sum(Customer.overdue_amount)).filter(
            Customer.user_id == user_id,
            Customer.overdue_amount > 0
        ).scalar() or 0.0
        
        # In case overdue_amount sum is 0, fall back to high-risk outstanding
        if float(revenue_at_risk) == 0.0:
            revenue_at_risk = db.query(func.sum(Customer.outstanding_amount)).filter(
                Customer.user_id == user_id,
                Customer.ai_risk_level.in_(["High", "Critical"])
            ).scalar() or 0.0

        recovered_from_campaigns = db.query(func.sum(Campaign.recovered_amount)).filter(
            Campaign.user_id == user_id,
            Campaign.campaign_type == "recovery"
        ).scalar() or 0.0

        recovered_from_audits = db.query(func.sum(RecoveryAudit.recovered_amount)).filter(
            RecoveryAudit.user_id == user_id,
            RecoveryAudit.status == "success"
        ).scalar() or 0.0

        total_recovered = max(float(recovered_from_campaigns), float(recovered_from_audits))
        if total_recovered == 0.0:
            total_paid = db.query(func.sum(Customer.total_amount_paid)).filter(Customer.user_id == user_id).scalar() or 0.0
            total_recovered = float(total_paid)

        # Debtor counts across campaigns
        campaigns = db.query(Campaign).filter(Campaign.user_id == user_id).all()
        customers_targeted = sum(c.audience_size or 0 for c in campaigns)
        messages_sent = sum(max(0, (c.audience_size or 0) - (c.skipped_count or 0)) for c in campaigns)
        customers_recovered = sum(c.success_count or c.purchased or 0 for c in campaigns)
        
        # Fallback to recovery audits if no campaigns yet
        if customers_recovered == 0:
            audits_recovered = db.query(func.count(RecoveryAudit.id)).filter(
                RecoveryAudit.user_id == user_id,
                RecoveryAudit.status == "success",
                RecoveryAudit.recovered_amount > 0
            ).scalar() or 0
            customers_recovered = audits_recovered

        if customers_targeted == 0:
            customers_targeted = total_customers

        eligible_accounts = max(0, customers_targeted - sum(c.skipped_count or 0 for c in campaigns))

        rev_at_risk_float = float(revenue_at_risk)
        recovery_rate = (total_recovered / rev_at_risk_float * 100.0) if rev_at_risk_float > 0 else 0.0

        return {
            "total_customers": total_customers,
            "total_campaigns": total_campaigns,
            "messages_sent": messages_sent,
            "delivered": messages_sent,
            "opened": messages_sent,
            "clicked": customers_recovered,
            "purchased": customers_recovered,
            "revenue_generated": round(total_recovered, 2),
            "open_rate": 100.0 if messages_sent > 0 else 0.0,
            "ctr": round((customers_recovered / messages_sent * 100.0), 2) if messages_sent > 0 else 0.0,
            "conversion_rate": round(recovery_rate, 2),
            "campaign_roi": round(recovery_rate, 2),
            
            # Recovery specific
            "revenue_at_risk": round(rev_at_risk_float, 2),
            "recovered_revenue": round(total_recovered, 2),
            "customers_targeted": customers_targeted,
            "eligible_accounts": eligible_accounts,
            "customers_recovered": customers_recovered,
            "recovery_rate": round(recovery_rate, 2),
            "outstanding_reduced": round(total_recovered, 2),
            "overdue_reduced": round(total_recovered, 2)
        }

