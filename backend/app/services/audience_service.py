from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_
from app.models.customer import Customer
from app.services.groq_service import GroqService
from datetime import date, timedelta

class AudienceService:
    def __init__(self):
        self.groq_service = GroqService()

    def filter_customers_by_prompt(self, db: Session, prompt: str, user_id: int):
        """
        Parses the prompt, applies dynamic SQLAlchemy filters to the Customer model,
        and returns the matching customers along with the parsed filter criteria.
        """
        filters = self.groq_service.parse_audience_query(prompt, db=db, user_id=user_id)
        
        query = select(Customer).where(Customer.user_id == user_id)
        
        # 1. Overdue Amount Filters
        if filters.get("min_overdue") is not None:
            query = query.where(Customer.overdue_amount >= float(filters["min_overdue"]))
        elif filters.get("has_overdue") is True:
            query = query.where(Customer.overdue_amount > 0)

        if filters.get("max_overdue") is not None:
            query = query.where(Customer.overdue_amount <= float(filters["max_overdue"]))

        # 2. Outstanding Balance Filters
        if filters.get("min_outstanding") is not None:
            query = query.where(Customer.outstanding_amount >= float(filters["min_outstanding"]))
        elif filters.get("has_outstanding") is True:
            query = query.where(Customer.outstanding_amount > 0)

        if filters.get("max_outstanding") is not None:
            query = query.where(Customer.outstanding_amount <= float(filters["max_outstanding"]))

        # 3. Risk Levels & Score Filters
        if filters.get("risk_levels"):
            risk_list = filters["risk_levels"]
            if isinstance(risk_list, list) and len(risk_list) > 0:
                query = query.where(Customer.ai_risk_level.in_(risk_list))
        elif filters.get("min_risk_score") is not None:
            query = query.where(Customer.ai_risk_score >= float(filters["min_risk_score"]))

        # 4. Overdue Aging Filter (Days past due date)
        if filters.get("min_days_overdue") is not None:
            cutoff_date = date.today() - timedelta(days=int(filters["min_days_overdue"]))
            query = query.where(Customer.next_due_date <= cutoff_date, Customer.overdue_amount > 0)

        # 5. Promise-to-Pay (PTP) Status Filter
        if filters.get("ptp_status"):
            st = str(filters["ptp_status"]).upper()
            if st == "ACTIVE":
                query = query.where(Customer.promise_to_pay_status == "ACTIVE")
            elif st == "EXPIRED":
                query = query.where(Customer.promise_to_pay_status == "EXPIRED")
            elif st == "FULFILLED":
                query = query.where(Customer.promise_to_pay_status == "FULFILLED")
            elif st == "ANY":
                query = query.where(Customer.promise_to_pay_status.isnot(None))

        # 6. Payment Reliability Filter
        if filters.get("payment_reliability"):
            query = query.where(Customer.payment_reliability.ilike(f"%{filters['payment_reliability']}%"))

        # 7. Delayed Payments and Average Delays
        if filters.get("min_delayed_payments") is not None:
            query = query.where(Customer.number_of_delayed_payments >= int(filters["min_delayed_payments"]))
        if filters.get("min_average_delay") is not None:
            query = query.where(Customer.average_payment_delay >= int(filters["min_average_delay"]))

        # 8. Credit Suspended / High Utilization
        if filters.get("credit_suspended") is True:
            query = query.where(or_(Customer.ai_risk_level == 'Critical', Customer.outstanding_amount >= 0.85 * Customer.credit_limit))

        # 9. Inactivity, Spend, Name, City, Segment (General Filters)
        if filters.get("inactive_days") is not None:
            cutoff_date = date.today() - timedelta(days=int(filters["inactive_days"]))
            query = query.where(Customer.last_purchase <= cutoff_date)
            
        if filters.get("min_spend") is not None:
            query = query.where(Customer.total_spend >= float(filters["min_spend"]))
            
        if filters.get("name") is not None:
            query = query.where(Customer.name.ilike(f"%{filters['name']}%"))

        if filters.get("city") is not None:
            query = query.where(Customer.city.ilike(f"%{filters['city']}%"))
            
        if filters.get("segment") is not None:
            query = query.where(Customer.segment.ilike(f"%{filters['segment']}%"))
            
        results = db.scalars(query).all()
        return results, filters
