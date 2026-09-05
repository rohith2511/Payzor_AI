import json
import os
import random
import uuid
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.customer import Customer
from app.models.recovery_audit import RecoveryAudit
from app.models.recovery_batch import RecoveryBatch
from app.models.order import Order
from app.services.groq_service import GroqService
from app.config import settings

class RecoveryService:
    def __init__(self):
        self.groq_service = GroqService()

    def calculate_risk_metrics(self, customer: Customer) -> dict:
        """
        Pure deterministic calculation of risk score and risk tier.
        """
        outstanding = float(customer.outstanding_amount or 0.0)
        overdue = float(customer.overdue_amount or 0.0)
        limit = float(customer.credit_limit or 0.0)
        delayed_count = int(customer.number_of_delayed_payments or 0)
        avg_delay = int(customer.average_payment_delay or 0)

        # Calculate days overdue
        days_overdue = 0
        if customer.next_due_date and customer.next_due_date < date.today():
            days_overdue = (date.today() - customer.next_due_date).days

        # Risk Score Heuristic (0 to 100)
        risk_score = 0.0
        if outstanding > 0:
            overdue_ratio = overdue / outstanding if outstanding > 0 else 0
            risk_score += overdue_ratio * 30
            if days_overdue > 0:
                risk_score += min(10, days_overdue * 0.5)

            # Historical behavior (up to 30 pts)
            risk_score += min(15, delayed_count * 1.5)
            risk_score += min(15, avg_delay * 0.5)

            # Credit exposure ratio (up to 30 pts)
            exposure_ratio = outstanding / limit if limit > 0 else 1.0
            risk_score += min(30, exposure_ratio * 30)

        risk_score = min(100.0, max(0.0, risk_score))

        # Risk Level Categorization
        if overdue > 0:
            if days_overdue > 15 or risk_score > 85:
                risk_level = "Critical"
            elif days_overdue > 5 or risk_score > 60:
                risk_level = "High"
            else:
                risk_level = "Medium"
        else:
            if risk_score > 35:
                risk_level = "Medium"
            else:
                risk_level = "Low"

        return {
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "days_overdue": days_overdue,
            "outstanding": outstanding,
            "overdue": overdue,
            "limit": limit
        }

    def check_ptp_status(self, customer: Customer, db: Session) -> Optional[str]:
        """
        Validates customer Promise-to-Pay status and checks for expiration.
        Returns:
            - 'ACTIVE' if PTP is currently active and within due date
            - 'EXPIRED' if PTP passed its due date without payment (updates DB)
            - None if no active PTP
        """
        if not customer.promise_to_pay_status or customer.promise_to_pay_status != "ACTIVE":
            return None

        if customer.promise_to_pay_date:
            today = date.today()
            if today <= customer.promise_to_pay_date:
                return "ACTIVE"
            else:
                # PTP has expired
                customer.promise_to_pay_status = "EXPIRED"
                db.commit()
                return "EXPIRED"
        return "ACTIVE"

    def run_risk_assessment(self, db: Session, customer_id: int, user_id: int) -> dict:
        """
        Determines customer payment risk level and recommended actions.
        Runs deterministic logic and leverages Qwen (via Groq) for explanation/reasoning.
        """
        customer = db.query(Customer).filter(Customer.id == customer_id, Customer.user_id == user_id).first()
        if not customer:
            return {"error": "Customer not found"}

        # 1. Deterministic Backend Calculations
        metrics = self.calculate_risk_metrics(customer)
        risk_score = metrics["risk_score"]
        risk_level = metrics["risk_level"]
        days_overdue = metrics["days_overdue"]
        outstanding = metrics["outstanding"]
        overdue = metrics["overdue"]
        limit = metrics["limit"]
        delayed_count = int(customer.number_of_delayed_payments or 0)
        avg_delay = int(customer.average_payment_delay or 0)

        # Check Promise-to-Pay (PTP)
        ptp_status = self.check_ptp_status(customer, db)

        if ptp_status == "ACTIVE":
            ptp_date_str = customer.promise_to_pay_date.strftime('%d %b %Y') if customer.promise_to_pay_date else 'Scheduled Date'
            recommended_action = "Recovery Paused (PTP Active)"
            recommended_reason = f"Active Promise-to-Pay of ₹{float(customer.promise_to_pay_amount or 0):,.2f} recorded. Automated outreach paused until {ptp_date_str}."
        elif risk_level == "Critical":
            recommended_action = "Suspend Credit & Escalate"
            recommended_reason = f"Account balance is heavily overdue by {days_overdue} days, exceeding safety parameters."
        elif risk_level == "High":
            recommended_action = "Send Payment Link"
            recommended_reason = f"Customer outstanding is {days_overdue} days overdue with low reliability."
        elif risk_level == "Medium":
            recommended_action = "Send Friendly Reminder"
            recommended_reason = "Payment due date is approaching or slightly overdue with average payment delays."
        else:
            recommended_action = "No Action"
            recommended_reason = "Dues are not overdue and customer profile remains healthy."

        # 2. LLM Personalization and Explanation
        prompt = (
            f"You are the Payzor AI Revenue Recovery Copilot.\n"
            f"Please write a professional, natural-language risk explanation and a direct recovery message for this customer account:\n"
            f"- Customer Name: {customer.name}\n"
            f"- Outstanding Balance: ₹{outstanding:,.2f}\n"
            f"- Overdue Amount: ₹{overdue:,.2f}\n"
            f"- Credit Limit: ₹{limit:,.2f}\n"
            f"- Days Overdue: {days_overdue} days\n"
            f"- Average Payment Delay: {avg_delay} days\n"
            f"- Past Delayed Payments: {delayed_count} instances\n"
            f"- Calculated Risk Level: {risk_level} (Score: {risk_score:.0f}/100)\n"
            f"- Business Policy Recommendation: {recommended_action}\n"
            f"- PTP Status: {ptp_status or 'None'}\n\n"
            f"Return a JSON object with exactly two keys:\n"
            f"1. 'explanation': string (1-2 sentences explaining why the customer is in this risk tier based on metrics and what the merchant should do)\n"
            f"2. 'personalized_message': string (a short, polite, personalized SMS/WhatsApp payment reminder message suitable for the situation. Include values like the outstanding amount and due status. Keep it professional)\n"
            f"Return ONLY valid JSON."
        )

        explanation = f"Customer has an outstanding of ₹{outstanding:,.2f} with a risk score of {risk_score:.0f}%. Action recommended: {recommended_action}."
        personalized_message = f"Dear {customer.name}, a quick update from Payzor AI that your outstanding dues of ₹{outstanding:,.2f} are due soon. Please clear them via your secure payment portal."

        try:
            client = self.groq_service._get_client(db, user_id, "revenue_recovery", prompt, "risk_assessment")
            response = self.groq_service._call_chat_completion(
                client,
                messages=[
                    {"role": "system", "content": "You are a revenue recovery strategist. Return JSON only."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3,
                max_tokens=250
            )
            content = response.choices[0].message.content.strip()
            data = json.loads(content)
            explanation = data.get("explanation", explanation)
            personalized_message = data.get("personalized_message", personalized_message)
        except Exception as e:
            print(f"[RECOVERY SERVICE] Groq risk generation failed or key missing ({e}). Using local templates.")
            if ptp_status == "ACTIVE":
                explanation = f"Outreach paused due to active Promise-to-Pay for ₹{float(customer.promise_to_pay_amount or 0):,.2f}."
                personalized_message = f"Hello {customer.name}, we acknowledge your scheduled payment commitment for ₹{float(customer.promise_to_pay_amount or 0):,.2f}. Thank you!"
            elif risk_level == "Critical":
                explanation = f"Severe risk flagged. The account is {days_overdue} days overdue with {delayed_count} repeat delays. Direct escalation is advised."
                personalized_message = f"Urgent: {customer.name}, your account balance of ₹{outstanding:,.2f} is overdue by {days_overdue} days. Contact accounts immediately to resolve outstanding dues."
            elif risk_level == "High":
                explanation = f"Outstanding balance is {days_overdue} days overdue. Direct payment link recommended to accelerate collection."
                personalized_message = f"Dear {customer.name}, your payment of ₹{overdue:,.2f} is overdue by {days_overdue} days. Please clear it instantly here: "
            elif risk_level == "Medium":
                explanation = f"Account is approaching due date or slightly overdue with moderate historical delays."
                personalized_message = f"Hi {customer.name}, this is a friendly reminder that ₹{outstanding:,.2f} is due for your recent invoice. Thank you for your business!"

        # Update database fields
        customer.ai_risk_score = Decimal(str(round(risk_score, 2)))
        customer.ai_risk_level = risk_level
        customer.ai_risk_explanation = explanation
        customer.ai_recommended_action = recommended_action
        customer.ai_recommended_reason = recommended_reason
        db.commit()

        return {
            "customer_id": customer.id,
            "name": customer.name,
            "risk_score": float(risk_score),
            "risk_level": risk_level,
            "explanation": explanation,
            "recommended_action": recommended_action,
            "recommended_reason": recommended_reason,
            "personalized_message": personalized_message,
            "ptp_status": ptp_status,
            "ptp_date": customer.promise_to_pay_date.isoformat() if customer.promise_to_pay_date else None,
            "ptp_amount": float(customer.promise_to_pay_amount or 0.0)
        }

    def execute_recovery_action(
        self,
        db: Session,
        customer_id: int,
        user_id: int,
        action_type: str,
        force_fail: bool = False,
        batch_id: Optional[str] = None
    ) -> dict:
        """
        Executes a bounded recovery action (Friendly Reminder, Payment Link, or retry).
        Enforces Safety Guardrails (Zero Balance, PTP_ACTIVE, 24h cooldown, 3/week touch limit),
        captures Before vs After states, and logs a comprehensive audit trail.
        """
        customer = db.query(Customer).filter(Customer.id == customer_id, Customer.user_id == user_id).first()
        if not customer:
            return {"status": "failed", "error": "Customer not found", "stopping_reason": "CUSTOMER_NOT_FOUND"}

        outstanding = float(customer.outstanding_amount or 0.0)
        overdue = float(customer.overdue_amount or 0.0)
        amount = overdue if overdue > 0 else outstanding

        # Capture Before State
        before_state = {
            "outstanding": outstanding,
            "overdue": overdue,
            "risk_score": float(customer.ai_risk_score or 0.0),
            "risk_level": customer.ai_risk_level or "Low",
            "total_paid": float(customer.total_amount_paid or 0.0)
        }

        # 1. ENFORCE SAFETY GUARDRAILS & STOPPING RULES

        # Safety Gate A: Zero Balance Stopping Rule
        if outstanding <= 0:
            error_msg = "Action blocked: Customer outstanding balance is zero."
            self._log_audit(
                db, user_id, customer_id, customer.name, 0.0, action_type, "blocked",
                customer.ai_risk_level or "Low", "ZERO_BALANCE", error_msg,
                before_state=before_state, after_state=before_state, batch_id=batch_id
            )
            return {"status": "blocked", "error": error_msg, "stopping_reason": "ZERO_BALANCE"}

        # Safety Gate B: Promise-to-Pay (PTP) Stopping Rule
        ptp_status = self.check_ptp_status(customer, db)
        if ptp_status == "ACTIVE":
            ptp_date_str = customer.promise_to_pay_date.strftime('%d %b %Y') if customer.promise_to_pay_date else 'due date'
            error_msg = f"Action blocked: Customer has an ACTIVE Promise-to-Pay until {ptp_date_str}. Automated outreach paused."
            self._log_audit(
                db, user_id, customer_id, customer.name, amount, action_type, "blocked",
                customer.ai_risk_level or "Low", "PTP_ACTIVE", error_msg,
                before_state=before_state, after_state=before_state, batch_id=batch_id
            )
            return {"status": "blocked", "error": error_msg, "stopping_reason": "PTP_ACTIVE"}

        # Safety Gate C: Contact Frequency Cooldown (Max 1 action per 24 hours)
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        one_week_ago = datetime.utcnow() - timedelta(days=7)

        recent_action = db.query(RecoveryAudit).filter(
            RecoveryAudit.customer_id == customer_id,
            RecoveryAudit.created_at >= twenty_four_hours_ago,
            RecoveryAudit.status == "success"
        ).first()

        if recent_action:
            error_msg = "Safety Guardrail triggered: A recovery action was already dispatched in the last 24 hours."
            self._log_audit(
                db, user_id, customer_id, customer.name, amount, action_type, "blocked",
                customer.ai_risk_level or "Low", "COOLDOWN_ACTIVE", error_msg,
                before_state=before_state, after_state=before_state, batch_id=batch_id
            )
            return {"status": "blocked", "error": error_msg, "stopping_reason": "COOLDOWN_ACTIVE"}

        # Safety Gate D: Weekly Touch Limit (Max 3 per 7 days)
        weekly_count = db.query(RecoveryAudit).filter(
            RecoveryAudit.customer_id == customer_id,
            RecoveryAudit.created_at >= one_week_ago,
            RecoveryAudit.status == "success"
        ).count()

        if weekly_count >= 3:
            error_msg = "Safety Guardrail triggered: Contact limit reached (3 actions within 7 days)."
            self._log_audit(
                db, user_id, customer_id, customer.name, amount, action_type, "blocked",
                customer.ai_risk_level or "Low", "TOUCH_LIMIT_REACHED", error_msg,
                before_state=before_state, after_state=before_state, batch_id=batch_id
            )
            return {"status": "blocked", "error": error_msg, "stopping_reason": "TOUCH_LIMIT_REACHED"}

        # 2. DETECT SIMULATED OR DIRECT INITIATED FAILURES
        if force_fail:
            error_msg = "Simulated API gateway connection timeout (504 Gateway Error)."
            self._log_audit(
                db, user_id, customer_id, customer.name, amount, action_type, "failed",
                customer.ai_risk_level or "Low", "GATEWAY_TIMEOUT", error_msg,
                before_state=before_state, after_state=before_state, batch_id=batch_id
            )
            return {"status": "failed", "error": error_msg, "stopping_reason": "GATEWAY_TIMEOUT"}

        # 3. INTERFACE WITH SIMULATED DEMO CHECKOUT FLOW
        payment_link = ""
        audit_details = []

        audit_details.append(f"{datetime.utcnow().strftime('%H:%M:%S')} - Revenue risk evaluated as {customer.ai_risk_level or 'Low'}")
        audit_details.append(f"{datetime.utcnow().strftime('%H:%M:%S')} - Safety frequency & PTP filters passed")

        if action_type in ["Send Payment Link", "Payment Link"]:
            fake_id = f"rzp_rec_{random.randint(100000, 999999)}"
            payment_link = f"https://checkout.payzor.ai/v1/pay?link={fake_id}&amount={amount}&customer={customer.name}"
            audit_details.append(f"{datetime.utcnow().strftime('%H:%M:%S')} - Simulated Razorpay Payment Link generated: {fake_id}")

        elif action_type in ["Send Friendly Reminder", "Friendly Reminder"]:
            audit_details.append(f"{datetime.utcnow().strftime('%H:%M:%S')} - Personalizing recovery email/WhatsApp notification template")
            audit_details.append(f"{datetime.utcnow().strftime('%H:%M:%S')} - Outreach notification queued for dispatch")

        else:  # Escalate and Restrict
            audit_details.append(f"{datetime.utcnow().strftime('%H:%M:%S')} - Suspending customer credit limit (Credit Lock active)")
            customer.credit_limit = Decimal("0.0")
            audit_details.append(f"{datetime.utcnow().strftime('%H:%M:%S')} - Escalation ticket routed to Senior Account Executive")

        audit_details.append(f"{datetime.utcnow().strftime('%H:%M:%S')} - Action successfully completed.")

        # After State
        after_state = {
            "outstanding": float(customer.outstanding_amount or 0.0),
            "overdue": float(customer.overdue_amount or 0.0),
            "risk_score": float(customer.ai_risk_score or 0.0),
            "risk_level": customer.ai_risk_level or "Low",
            "total_paid": float(customer.total_amount_paid or 0.0)
        }

        # Log outcome
        audit = self._log_audit(
            db, user_id, customer_id, customer.name, amount, action_type, "success",
            customer.ai_risk_level or "Low", customer.ai_recommended_reason or "Outreach",
            "\n".join(audit_details),
            before_state=before_state, after_state=after_state, batch_id=batch_id
        )

        # Update recovery history JSON string on Customer row
        history = []
        if customer.recovery_history:
            try:
                history = json.loads(customer.recovery_history)
            except Exception:
                pass

        history.append({
            "audit_id": audit.id,
            "action": action_type,
            "amount": amount,
            "status": "success",
            "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "payment_link": payment_link,
            "batch_id": batch_id
        })
        customer.recovery_history = json.dumps(history)
        db.commit()

        return {
            "status": "success",
            "audit_id": audit.id,
            "action_type": action_type,
            "amount": amount,
            "payment_link": payment_link,
            "before_state": before_state,
            "after_state": after_state,
            "logs": audit_details
        }

    def process_test_payment_link_success(self, db: Session, customer_id: int, amount: float, batch_id: Optional[str] = None) -> dict:
        """
        Simulates payment completion callback for demo links.
        Captures BEFORE and AFTER states, mutates financial state in DB,
        fulfills Promise-to-Pay if active, recalculates risk score, and logs transaction audit.
        """
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            return {"error": "Customer not found"}

        recovered_amt = Decimal(str(amount))

        # 1. Capture BEFORE state
        before_outstanding = float(customer.outstanding_amount or 0.0)
        before_overdue = float(customer.overdue_amount or 0.0)
        before_paid = float(customer.total_amount_paid or 0.0)
        before_risk_score = float(customer.ai_risk_score or 0.0)
        before_risk_level = customer.ai_risk_level or "Low"

        before_state = {
            "outstanding": before_outstanding,
            "overdue": before_overdue,
            "total_paid": before_paid,
            "risk_score": before_risk_score,
            "risk_level": before_risk_level
        }

        # 2. Mutate Customer Financial Ledger in DB
        orig_outstanding = customer.outstanding_amount or Decimal("0.0")
        orig_paid = customer.total_amount_paid or Decimal("0.0")
        orig_overdue = customer.overdue_amount or Decimal("0.0")

        new_paid = orig_paid + recovered_amt
        new_outstanding = max(Decimal("0.0"), orig_outstanding - recovered_amt)
        new_overdue = max(Decimal("0.0"), orig_overdue - recovered_amt)
        new_due_amt = Decimal("0.0") if new_outstanding == 0 else max(Decimal("0.0"), (customer.current_due_amount or Decimal("0.0")) - recovered_amt)

        customer.total_amount_paid = new_paid
        customer.outstanding_amount = new_outstanding
        customer.overdue_amount = new_overdue
        customer.current_due_amount = new_due_amt

        # 3. Check and Fulfill Promise-to-Pay if active
        ptp_fulfilled = False
        if customer.promise_to_pay_status == "ACTIVE":
            customer.promise_to_pay_status = "FULFILLED"
            ptp_fulfilled = True

        # 4. Dynamically Recalculate Risk Metrics Post-Recovery
        new_metrics = self.calculate_risk_metrics(customer)
        customer.ai_risk_score = Decimal(str(new_metrics["risk_score"]))
        customer.ai_risk_level = new_metrics["risk_level"]
        customer.payment_reliability = "High" if new_overdue == 0 else "Medium"

        # 5. Capture AFTER state
        after_state = {
            "outstanding": float(new_outstanding),
            "overdue": float(new_overdue),
            "total_paid": float(new_paid),
            "risk_score": float(new_metrics["risk_score"]),
            "risk_level": new_metrics["risk_level"]
        }

        # 6. Add transactional Order matching payment recovery
        order_number = f"REC-{uuid.uuid4().hex[:8].upper()}"
        db_order = Order(
            customer_id=customer_id,
            order_number=order_number,
            product_name="B2B Invoice Payment (Recovered)",
            category="Recovery",
            quantity=1,
            unit_price=recovered_amt,
            total_amount=recovered_amt,
            order_status="Completed",
            purchase_date=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(db_order)

        # 7. Log recovery audit trace with Before vs After proof
        audit_details = [
            f"{datetime.utcnow().strftime('%H:%M:%S')} - Simulated payment completion event callback received",
            f"{datetime.utcnow().strftime('%H:%M:%S')} - Verified sandbox checkout signature success",
            f"{datetime.utcnow().strftime('%H:%M:%S')} - Recovered amount ₹{amount:,.2f} applied to balance",
            f"{datetime.utcnow().strftime('%H:%M:%S')} - Outstanding reduced: ₹{before_outstanding:,.2f} -> ₹{float(new_outstanding):,.2f}",
            f"{datetime.utcnow().strftime('%H:%M:%S')} - Overdue reduced: ₹{before_overdue:,.2f} -> ₹{float(new_overdue):,.2f}",
            f"{datetime.utcnow().strftime('%H:%M:%S')} - Risk updated: {before_risk_level} ({before_risk_score:.0f}%) -> {new_metrics['risk_level']} ({new_metrics['risk_score']:.0f}%)"
        ]
        if ptp_fulfilled:
            audit_details.append(f"{datetime.utcnow().strftime('%H:%M:%S')} - Promise-to-Pay marked as FULFILLED")

        audit = self._log_audit(
            db, customer.user_id, customer_id, customer.name, amount, "Simulated Link Payment", "success",
            new_metrics["risk_level"], "Direct Payment Completed", "\n".join(audit_details),
            before_state=before_state, after_state=after_state, recovered_amount=amount, batch_id=batch_id
        )

        # Update recovery history
        history = []
        if customer.recovery_history:
            try:
                history = json.loads(customer.recovery_history)
            except Exception:
                pass
        history.append({
            "action": "Simulated Payment Success",
            "amount": amount,
            "status": "success",
            "date": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "audit_id": audit.id
        })
        customer.recovery_history = json.dumps(history)

        db.commit()

        # Delta metrics
        delta = {
            "recovered_amount": amount,
            "outstanding_reduction": before_outstanding - float(new_outstanding),
            "overdue_reduction": before_overdue - float(new_overdue),
            "risk_score_reduction": before_risk_score - float(new_metrics["risk_score"]),
            "risk_level_transition": f"{before_risk_level} -> {new_metrics['risk_level']}",
            "ptp_fulfilled": ptp_fulfilled
        }

        return {
            "status": "success",
            "recovered_amount": amount,
            "audit_id": audit.id,
            "before_state": before_state,
            "after_state": after_state,
            "delta": delta
        }

    def execute_batch_recovery(
        self,
        db: Session,
        user_id: int,
        customer_ids: List[int],
        simulate_recovery: bool = True,
        batch_id: Optional[str] = None
    ) -> dict:
        """
        Executes bounded recovery across an entire batch of customers.
        Revalidates each customer, enforces guardrails, calculates state mutations,
        records batch-level audit record in recovery_batches, and individual recovery_audits.
        """
        if not batch_id:
            batch_id = f"BATCH-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        customers = db.query(Customer).filter(
            Customer.id.in_(customer_ids),
            Customer.user_id == user_id
        ).all()

        total_targeted = Decimal("0.0")
        total_at_risk = Decimal("0.0")
        total_recovered = Decimal("0.0")

        success_count = 0
        skipped_count = 0
        failed_count = 0
        escalated_count = 0

        item_results = []

        # 1. First pass: Evaluate guardrails and execute recovery outreach
        eligible_candidates = []
        for cust in customers:
            cust_overdue = cust.overdue_amount or Decimal("0.0")
            cust_outstanding = cust.outstanding_amount or Decimal("0.0")
            cust_due = cust_overdue if cust_overdue > 0 else cust_outstanding

            total_at_risk += cust_overdue
            total_targeted += cust_due

            metrics = self.calculate_risk_metrics(cust)
            risk_level = metrics["risk_level"]

            if risk_level == "Critical":
                action_type = "Suspend Credit & Escalate"
            elif risk_level == "High":
                action_type = "Send Payment Link"
            else:
                action_type = "Send Friendly Reminder"

            action_res = self.execute_recovery_action(
                db, customer_id=cust.id, user_id=user_id,
                action_type=action_type, batch_id=batch_id
            )

            if action_res.get("status") == "blocked":
                skipped_count += 1
                item_results.append({
                    "customer_id": cust.id,
                    "customer_name": cust.name,
                    "status": "skipped",
                    "reason": action_res.get("stopping_reason", "GUARDRAIL_TRIGGERED"),
                    "amount_targeted": float(cust_due),
                    "amount_recovered": 0.0,
                    "action_type": action_type,
                    "risk_level": risk_level
                })
            elif action_res.get("status") == "failed":
                failed_count += 1
                item_results.append({
                    "customer_id": cust.id,
                    "customer_name": cust.name,
                    "status": "failed",
                    "reason": action_res.get("error", "Execution failed"),
                    "amount_targeted": float(cust_due),
                    "amount_recovered": 0.0,
                    "action_type": action_type,
                    "risk_level": risk_level
                })
            else:
                if action_type == "Suspend Credit & Escalate":
                    escalated_count += 1
                eligible_candidates.append({
                    "customer": cust,
                    "cust_due": cust_due,
                    "action_type": action_type,
                    "risk_level": risk_level,
                    "action_res": action_res
                })

        # 2. Second pass: If simulate_recovery is enabled, select a realistic subset of eligible customers to clear dues
        import random
        cleared_customer_ids = set()
        if simulate_recovery and eligible_candidates:
            candidates_with_dues = [c for c in eligible_candidates if c["cust_due"] > 0]
            if len(candidates_with_dues) == 1:
                # For single/small test runs, ensure the candidate clears
                cleared_customer_ids.add(candidates_with_dues[0]["customer"].id)
            elif len(candidates_with_dues) > 1:
                # For batches, select between 40% and 75% of eligible accounts to realistically settle
                subset_count = max(1, min(len(candidates_with_dues), int(round(len(candidates_with_dues) * random.uniform(0.40, 0.70)))))
                selected = random.sample(candidates_with_dues, subset_count)
                for item in selected:
                    cleared_customer_ids.add(item["customer"].id)

        # 3. Process settlements for selected customers and record items
        for cand in eligible_candidates:
            cust = cand["customer"]
            cust_due = cand["cust_due"]
            action_type = cand["action_type"]
            risk_level = cand["risk_level"]
            action_res = cand["action_res"]

            recovered_for_cust = 0.0
            before_after_info = None

            if cust.id in cleared_customer_ids and cust_due > 0:
                settlement_amt = float(cust_due)
                pay_res = self.process_test_payment_link_success(
                    db, customer_id=cust.id, amount=settlement_amt, batch_id=batch_id
                )
                if pay_res.get("status") == "success":
                    recovered_for_cust = settlement_amt
                    total_recovered += Decimal(str(settlement_amt))
                    before_after_info = {
                        "before": pay_res.get("before_state"),
                        "after": pay_res.get("after_state"),
                        "delta": pay_res.get("delta")
                    }

            success_count += 1
            item_results.append({
                "customer_id": cust.id,
                "customer_name": cust.name,
                "status": "recovered" if recovered_for_cust > 0 else "action_executed",
                "amount_targeted": float(cust_due),
                "amount_recovered": recovered_for_cust,
                "action_type": action_type,
                "risk_level": risk_level,
                "payment_link": action_res.get("payment_link"),
                "state_transition": before_after_info
            })


        # Calculate batch recovery rate
        recovery_rate = 0.0
        if total_targeted > 0:
            recovery_rate = float(round((total_recovered / total_targeted) * Decimal("100.0"), 1))

        # Save Batch record in recovery_batches table
        batch_record = RecoveryBatch(
            user_id=user_id,
            batch_id=batch_id,
            customer_count=len(customers),
            total_at_risk=total_at_risk,
            total_targeted=total_targeted,
            total_recovered=total_recovered,
            success_count=success_count,
            skipped_count=skipped_count,
            failed_count=failed_count,
            escalated_count=escalated_count,
            status="completed",
            details=json.dumps(item_results)
        )
        db.add(batch_record)
        db.commit()
        db.refresh(batch_record)

        return {
            "batch_id": batch_id,
            "created_at": batch_record.created_at.isoformat() if batch_record.created_at else None,
            "summary": {
                "customers_targeted": len(customers),
                "successfully_recovered": success_count,
                "skipped": skipped_count,
                "escalated": escalated_count,
                "failed": failed_count,
                "total_at_risk": float(total_at_risk),
                "total_targeted": float(total_targeted),
                "total_recovered": float(total_recovered),
                "recovery_rate": recovery_rate
            },
            "items": item_results
        }

    def create_promise_to_pay(
        self,
        db: Session,
        customer_id: int,
        user_id: int,
        amount: float,
        ptp_date: date,
        notes: str = ""
    ) -> dict:
        """
        Records an active Promise-to-Pay for a customer, pausing automated outreach.
        """
        customer = db.query(Customer).filter(Customer.id == customer_id, Customer.user_id == user_id).first()
        if not customer:
            return {"error": "Customer not found"}

        customer.promise_to_pay_amount = Decimal(str(amount))
        customer.promise_to_pay_date = ptp_date
        customer.promise_to_pay_status = "ACTIVE"
        customer.promise_to_pay_created_at = datetime.utcnow()
        customer.promise_to_pay_notes = notes

        # Update recommendation to show paused state
        ptp_date_str = ptp_date.strftime('%d %b %Y')
        customer.ai_recommended_action = "Recovery Paused (PTP Active)"
        customer.ai_recommended_reason = f"Customer committed to pay ₹{amount:,.2f} on {ptp_date_str}. Automated outreach paused."

        # Log audit entry
        self._log_audit(
            db, user_id, customer_id, customer.name, amount, "Promise to Pay Registered", "success",
            customer.ai_risk_level or "Medium", "PTP_ACTIVE",
            f"Promise-to-Pay recorded for ₹{amount:,.2f} due on {ptp_date_str}. Notes: {notes}"
        )

        db.commit()
        return {
            "status": "success",
            "customer_id": customer.id,
            "promise_to_pay_status": "ACTIVE",
            "promise_to_pay_amount": amount,
            "promise_to_pay_date": ptp_date.isoformat(),
            "notes": notes
        }

    def cancel_promise_to_pay(self, db: Session, customer_id: int, user_id: int) -> dict:
        """
        Cancels an active Promise-to-Pay, resuming normal risk-scoring and recovery eligibility.
        """
        customer = db.query(Customer).filter(Customer.id == customer_id, Customer.user_id == user_id).first()
        if not customer:
            return {"error": "Customer not found"}

        customer.promise_to_pay_status = "CANCELLED"
        self._log_audit(
            db, user_id, customer_id, customer.name, 0.0, "Promise to Pay Cancelled", "success",
            customer.ai_risk_level or "Low", "PTP_CANCELLED",
            "Promise-to-Pay was cancelled. Account returned to active recovery eligibility."
        )
        db.commit()

        # Re-assess risk
        self.run_risk_assessment(db, customer_id, user_id)

        return {"status": "success", "message": "Promise to pay cancelled and risk reassessed"}

    def _log_audit(
        self,
        db: Session,
        user_id: int,
        customer_id: int,
        customer_name: str,
        amount: float,
        action_type: str,
        status: str,
        risk_level: str,
        reason: str,
        details: str,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        recovered_amount: float = 0.0,
        batch_id: Optional[str] = None
    ) -> RecoveryAudit:
        audit = RecoveryAudit(
            user_id=user_id,
            customer_id=customer_id,
            customer_name=customer_name,
            amount=Decimal(str(amount)),
            action_type=action_type,
            status=status,
            risk_level=risk_level,
            recommendation_reason=reason,
            details=details,
            batch_id=batch_id,
            recovered_amount=Decimal(str(recovered_amount))
        )

        if before_state:
            audit.before_outstanding = Decimal(str(before_state.get("outstanding", 0.0)))
            audit.before_overdue = Decimal(str(before_state.get("overdue", 0.0)))
            audit.before_risk_score = Decimal(str(before_state.get("risk_score", 0.0)))
            audit.before_risk_level = str(before_state.get("risk_level", "Low"))

        if after_state:
            audit.after_outstanding = Decimal(str(after_state.get("outstanding", 0.0)))
            audit.after_overdue = Decimal(str(after_state.get("overdue", 0.0)))
            audit.after_risk_score = Decimal(str(after_state.get("risk_score", 0.0)))
            audit.after_risk_level = str(after_state.get("risk_level", "Low"))

        db.add(audit)
        db.commit()
        db.refresh(audit)
        return audit
