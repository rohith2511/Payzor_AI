import urllib.request
import urllib.error
import json
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.campaign import Campaign
from app.models.customer import Customer
from app.services.groq_service import GroqService
from app.config import settings
import time


class CampaignService:
    def __init__(self):
        self.groq_service = GroqService()

    def generate_and_save_campaign(self, db: Session, goal: str, audience_size: int, segment: str = None, channel: str = None, user_id: int = None):
        """
        Generates copy details for a campaign, saves it in PostgreSQL database,
        and returns the created campaign database record and content details.
        """
        copy = self.groq_service.generate_campaign(goal, segment, channel, db=db, user_id=user_id)

        # Normalize channel name format for frontend case-sensitivity
        norm_channel = "WhatsApp"
        target_channel = channel or copy.get("recommended_channel")
        if target_channel:
            c_low = target_channel.lower()
            if c_low == "whatsapp":
                norm_channel = "WhatsApp"
            elif c_low == "email":
                norm_channel = "Email"
            elif c_low == "sms":
                norm_channel = "SMS"
            else:
                norm_channel = target_channel.capitalize()

        db_campaign = Campaign(
            campaign_name=copy["campaign_name"],
            channel=norm_channel,
            audience_size=audience_size,
            status="Draft",
            revenue=0.0,
            user_id=user_id,
            target_segment=segment
        )
        db.add(db_campaign)
        db.commit()
        db.refresh(db_campaign)

        return db_campaign, copy

    def send_campaign_to_channel_service(self, campaign_id: int, customer_ids: list[int]):
        """
        Updates the campaign status and dispatches the recipients list to the separate Channel Service.
        Uses a self-managed database session to prevent FastAPI request-scoped session closure inside background tasks.
        Includes wake-up ping and retry logic to handle Render free-tier cold starts.
        """
        print(
            f"[DISPATCH CALLED] campaign_id={campaign_id}",
            flush=True
        )

        from app.database import SessionLocal
        db = SessionLocal()

        try:
            campaign = db.query(Campaign).filter(
                Campaign.id == campaign_id
            ).first()

            if not campaign:
                print(
                    f"[CAMPAIGN DISPATCH ERROR] Campaign with id={campaign_id} not found.",
                    flush=True
                )
                return False

            campaign.status = "Running"
            campaign.launch_time = datetime.utcnow()
            db.commit()

            customers = db.query(Customer).filter(
                Customer.id.in_(customer_ids)
            ).all()

            recipients = []
            for c in customers:
                recipients.append({
                    "customer_id": c.id,
                    "name": c.name,
                    "email": c.email,
                    "phone": c.phone
                })

            print(
                f"[DEBUG] Webhook URL: {settings.CRM_WEBHOOK_URL}",
                flush=True
            )

            payload = {
                "campaign_id": campaign.id,
                "campaign_name": campaign.campaign_name,
                "channel": campaign.channel,
                "recipients": recipients,
                "webhook_url": settings.CRM_WEBHOOK_URL
            }

            print(
                f"[CAMPAIGN DISPATCH] Initiating dispatch for campaign_id={campaign.id} ('{campaign.campaign_name}') via {campaign.channel} to {len(customers)} recipients...",
                flush=True
            )

            data = json.dumps(payload).encode("utf-8")

            # Wake up Channel Service first (handles Render free-tier cold start)
            try:
                urllib.request.urlopen(
                    settings.CHANNEL_SERVICE_URL,
                    timeout=30
                )
                print(
                    "[WAKEUP] Channel service pinged",
                    flush=True
                )
            except Exception as wakeup_error:
                print(
                    f"[WAKEUP WARNING] {wakeup_error}",
                    flush=True
                )

            # Wait for the service to fully wake up
            time.sleep(5)

            max_retries = 15

            for attempt in range(max_retries):
                try:
                    req = urllib.request.Request(
                        f"{settings.CHANNEL_SERVICE_URL}/send",
                        data=data,
                        headers={
                            "Content-Type": "application/json",
                            "User-Agent": "PayzorAI-Recovery/2.0"
                        }
                    )

                    print(
                        f"[DISPATCH ATTEMPT {attempt + 1}/{max_retries}]",
                        flush=True
                    )

                    with urllib.request.urlopen(req, timeout=30) as response:
                        res_data = json.loads(
                            response.read().decode()
                        )

                        print(
                            f"[CHANNEL RESPONSE] {res_data}",
                            flush=True
                        )

                        if res_data.get("status") == "accepted":
                            print(
                                f"[CAMPAIGN DISPATCH] Campaign {campaign.id} successfully queued in Channel Service.",
                                flush=True
                            )
                            return True

                except Exception as retry_error:
                    print(
                        f"[ATTEMPT FAILED] {retry_error}",
                        flush=True
                    )

                    if attempt < max_retries - 1:
                        print(
                            "[RETRYING IN 10 SECONDS]",
                            flush=True
                        )
                        time.sleep(10)
                    else:
                        campaign.status = "Failed"
                        db.commit()

                        print(
                            f"[CAMPAIGN DISPATCH ERROR] Failed to dispatch campaign_id={campaign_id}: {retry_error}",
                            flush=True
                        )
                        return False
        finally:
            db.close()

        return False

    def get_recovery_cohort_customers(self, db: Session, user_id: int, segment: str):
        """
        Retrieves matching customers for a recovery cohort from the database.
        """
        from app.services.recovery_service import RecoveryService
        recovery_service = RecoveryService()

        all_customers = db.query(Customer).filter(Customer.user_id == user_id).all()
        seg_lower = (segment or "").strip().lower()

        matched = []
        for c in all_customers:
            metrics = recovery_service.calculate_risk_metrics(c)
            risk_level = metrics["risk_level"]
            overdue = metrics["overdue"]
            outstanding = metrics["outstanding"]
            ptp_status = recovery_service.check_ptp_status(c, db)

            if seg_lower in ["all revenue at risk", "all revenue-at-risk", "revenue at risk"]:
                if overdue > 0 or risk_level in ["High", "Critical"]:
                    matched.append((c, metrics, ptp_status))
            elif "critical" in seg_lower:
                if risk_level == "Critical":
                    matched.append((c, metrics, ptp_status))
            elif "high risk" in seg_lower:
                if risk_level in ["High", "Critical"]:
                    matched.append((c, metrics, ptp_status))
            elif "high overdue" in seg_lower or "exposure" in seg_lower:
                if overdue >= 100000:
                    matched.append((c, metrics, ptp_status))
            elif "overdue" in seg_lower:
                if overdue > 0:
                    matched.append((c, metrics, ptp_status))
            elif "promise-to-pay" in seg_lower or "ptp" in seg_lower:
                if ptp_status in ["ACTIVE", "EXPIRED"] or c.promise_to_pay_status in ["ACTIVE", "EXPIRED"]:
                    matched.append((c, metrics, ptp_status))
            elif "failed" in seg_lower:
                if (c.payment_history_score and c.payment_history_score < 50) or (c.average_payment_delay and c.average_payment_delay > 15):
                    matched.append((c, metrics, ptp_status))
            elif "suspended" in seg_lower or "credit" in seg_lower:
                limit = float(c.credit_limit or 0)
                if (limit > 0 and outstanding / limit >= 0.85) or (risk_level == "Critical"):
                    matched.append((c, metrics, ptp_status))
            else:
                # Custom segment name or match with customer.segment
                if (c.segment and seg_lower in c.segment.lower()) or (seg_lower in (c.name or "").lower()):
                    matched.append((c, metrics, ptp_status))

        # If nothing matched specific rule, include accounts with overdue or outstanding
        if not matched and all_customers:
            for c in all_customers:
                metrics = recovery_service.calculate_risk_metrics(c)
                ptp_status = recovery_service.check_ptp_status(c, db)
                if metrics["outstanding"] > 0:
                    matched.append((c, metrics, ptp_status))

        return matched

    def generate_recovery_workflow(
        self,
        db: Session,
        user_id: int,
        audience_segment: str,
        objective: str = "Recover Overdue Receivables",
        channel: str = "whatsapp",
        goal: str = ""
    ) -> dict:
        """
        Generates an AI-driven B2B Revenue Recovery Workflow for a targeted cohort,
        evaluating guardrails, calculating real financial exposure, generating compliant dunning copy,
        and producing a structured recovery sequence.
        """
        from app.services.recovery_service import RecoveryService
        from app.models.recovery_audit import RecoveryAudit
        from datetime import datetime, timedelta

        recovery_service = RecoveryService()
        matched = self.get_recovery_cohort_customers(db, user_id, audience_segment)

        total_customers = len(matched)
        total_outstanding = sum(m[1]["outstanding"] for m in matched)
        total_overdue = sum(m[1]["overdue"] for m in matched)
        revenue_at_risk = sum(m[1]["overdue"] for m in matched if m[1]["risk_level"] in ["High", "Critical"] or m[1]["overdue"] > 0)
        if revenue_at_risk == 0 and total_outstanding > 0:
            revenue_at_risk = total_outstanding

        avg_risk_score = (sum(m[1]["risk_score"] for m in matched) / total_customers) if total_customers > 0 else 0.0

        # Guardrail Analysis per Customer
        eligible_customers = []
        blocked_customers = []
        critical_count = 0
        high_count = 0
        ptp_active_count = 0
        zero_balance_count = 0
        cooldown_count = 0
        touch_limit_count = 0

        customer_details = []

        now = datetime.utcnow()
        twenty_four_hours_ago = now - timedelta(hours=24)
        seven_days_ago = now - timedelta(days=7)

        for c, metrics, ptp_status in matched:
            if metrics["risk_level"] == "Critical":
                critical_count += 1
            elif metrics["risk_level"] == "High":
                high_count += 1

            # Check guardrails
            is_blocked = False
            stopping_reason = None

            if metrics["outstanding"] <= 0 or metrics["overdue"] <= 0:
                is_blocked = True
                stopping_reason = "ZERO_BALANCE"
                zero_balance_count += 1
            elif ptp_status == "ACTIVE":
                is_blocked = True
                stopping_reason = "PTP_ACTIVE"
                ptp_active_count += 1
            else:
                # Check 24-hr cooldown
                last_touch = db.query(RecoveryAudit).filter(
                    RecoveryAudit.customer_id == c.id,
                    RecoveryAudit.status == "executed",
                    RecoveryAudit.created_at >= twenty_four_hours_ago
                ).first()
                if last_touch:
                    is_blocked = True
                    stopping_reason = "COOLDOWN_ACTIVE"
                    cooldown_count += 1
                else:
                    # Check 7-day touch limit (max 3)
                    touch_count = db.query(RecoveryAudit).filter(
                        RecoveryAudit.customer_id == c.id,
                        RecoveryAudit.status == "executed",
                        RecoveryAudit.created_at >= seven_days_ago
                    ).count()
                    if touch_count >= 3:
                        is_blocked = True
                        stopping_reason = "TOUCH_LIMIT_REACHED"
                        touch_limit_count += 1

            # Recommended Action
            if stopping_reason == "PTP_ACTIVE":
                recommended_action = f"No Outreach (PTP Active till {c.promise_to_pay_date})"
            elif stopping_reason == "ZERO_BALANCE":
                recommended_action = "No Action (Zero Overdue Balance)"
            elif metrics["risk_level"] == "Critical":
                recommended_action = "Urgent Payment Link & Credit Freeze"
            elif metrics["risk_level"] == "High":
                recommended_action = "Payment Recovery Link + Follow-up"
            elif metrics["overdue"] > 0:
                recommended_action = "Polite Statement & Quick Pay Link"
            else:
                recommended_action = "Account Statement Reminder"

            cust_entry = {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "phone": c.phone,
                "outstanding": metrics["outstanding"],
                "overdue": metrics["overdue"],
                "risk_score": metrics["risk_score"],
                "risk_level": metrics["risk_level"],
                "days_overdue": metrics["days_overdue"],
                "ptp_status": ptp_status or c.promise_to_pay_status,
                "ptp_date": str(c.promise_to_pay_date) if c.promise_to_pay_date else None,
                "ptp_amount": float(c.promise_to_pay_amount or 0),
                "is_eligible": not is_blocked,
                "stopping_reason": stopping_reason,
                "recommended_action": recommended_action
            }
            customer_details.append(cust_entry)

            if is_blocked:
                blocked_customers.append(cust_entry)
            else:
                eligible_customers.append(cust_entry)

        # Generate "Why this audience?" Diagnostic Points
        diagnosis_points = [
            f"₹{total_overdue:,.0f} total overdue exposure across {total_customers} targeted accounts.",
            f"{critical_count} accounts categorized as Critical Risk (overdue >15d or utilization >85%), {high_count} as High Risk.",
            f"Cohort average risk score is {avg_risk_score:.1f}% based on repayment history and exposure ratio."
        ]
        if ptp_active_count > 0:
            diagnosis_points.append(f"{ptp_active_count} account(s) currently paused under active Promise-to-Pay agreements.")
        if zero_balance_count > 0:
            diagnosis_points.append(f"{zero_balance_count} account(s) have cleared balances and will be safely excluded.")

        # AI Dunning copy generation via Groq
        full_goal = f"{objective}: {goal if goal else f'Recover overdue balances for {audience_segment}'}"
        try:
            copy_res = self.groq_service.generate_campaign(full_goal, audience_segment, channel, db=db, user_id=user_id)
        except Exception as e:
            print(f"[RECOVERY WORKFLOW] Groq AI fallback activated: {e}", flush=True)
            copy_res = {
                "campaign_name": f"{objective} — {audience_segment}",
                "subject_line": "Outstanding Balance Statement & Settle Link",
                "message_body": f"Dear Accounts Payable, your account currently has an overdue balance of ₹{total_overdue:,.0f}. Please review statement and settle dues securely via our link.",
                "whatsapp_message": f"*INVOICE PAYMENT NOTICE*\n\nDear Partner,\n\nYour account currently has an overdue balance of ₹{total_overdue:,.0f}. Please review and settle the outstanding amount using the secure link below:\n\n👉 https://checkout.payzor.ai/pay/sim_dunning_token\n\nIf payment has already been initiated, please disregard this reminder.\n\nThank you,\nPayzor AI Financial Ops",
                "email_content": f"Subject: Overdue Balance Notice & Payment Link\n\nDear Accounts Payable,\n\nOur records show an overdue balance of ₹{total_overdue:,.0f} on your account. Please review your account statement and clear outstanding dues via our secure payment option:\n\nhttps://checkout.payzor.ai/pay/sim_dunning_token\n\nIf you have any questions or need a structured payment plan, reply directly to this notice.\n\nBest regards,\nPayzor AI Collections Team",
                "sms_content": f"Payzor AI: Overdue balance of ₹{total_overdue:,.0f} is due. Settle securely at https://checkout.payzor.ai/pay/sim_dunning_token",
                "timing": "10:00 AM – 12:00 PM",
                "timing_reason": "Industry benchmark for B2B financial reviews",
                "predicted_open_rate": "86.5%",
                "predicted_ctr": "38.2%"
            }

        # Expected Recovery Calculation (Realistic B2B recovery benchmark based on eligible exposure)
        eligible_overdue = sum(c["overdue"] for c in eligible_customers)
        expected_recovery = round(eligible_overdue * 0.72, 2)


        strategy_steps = [
            {
                "step": 1,
                "title": f"Polite Statement & Payment Link via {channel.upper()}",
                "description": f"Dispatch compliant, non-coercive dunning copy with verified outstanding balance of ₹{total_overdue:,.0f} and instant checkout link.",
                "channel": channel.capitalize()
            },
            {
                "step": 2,
                "title": "Grace Period & Cooldown Monitoring",
                "description": "Enforce strict 24-hour spacing. Automatically pause outreach if a customer submits a Promise-to-Pay commitment.",
                "channel": "System"
            },
            {
                "step": 3,
                "title": "High-Exposure Prioritization",
                "description": f"Prioritize accounts with overdue > ₹1,00,000 for rapid settlement verification.",
                "channel": "Collections"
            },
            {
                "step": 4,
                "title": "Policy Escalation & Credit Suspension",
                "description": "If unrecovered after 3 touches, escalate to finance leadership and temporarily suspend credit line.",
                "channel": "Executive"
            }
        ]

        return {
            "strategy_title": f"AI Revenue Recovery: {audience_segment}",
            "objective": objective,
            "audience_segment": audience_segment,
            "channel": channel.lower(),
            "customer_count": total_customers,
            "total_outstanding": total_outstanding,
            "total_overdue": total_overdue,
            "revenue_at_risk": revenue_at_risk,
            "avg_risk_score": round(avg_risk_score, 1),
            "diagnosis": diagnosis_points,
            "recommended_steps": strategy_steps,
            "recommended_action": "Payment Link + Automated Follow-up",
            "dunning_copy": copy_res.get("message_body", ""),
            "whatsapp_message": copy_res.get("whatsapp_message", ""),
            "email_content": copy_res.get("email_content", ""),
            "sms_content": copy_res.get("sms_content", ""),
            "timing": copy_res.get("timing", "10:00 AM – 12:00 PM"),
            "timing_reason": copy_res.get("timing_reason", "Peak engagement window for B2B financial reviews"),
            "predicted_open_rate": copy_res.get("predicted_open_rate", "85.0%"),
            "predicted_ctr": copy_res.get("predicted_ctr", "35.0%"),
            "expected_recovery_estimate": expected_recovery,
            "guardrail_analysis": {
                "eligible_count": len(eligible_customers),
                "blocked_count": len(blocked_customers),
                "ptp_blocked_count": ptp_active_count,
                "zero_balance_count": zero_balance_count,
                "cooldown_count": cooldown_count,
                "touch_limit_count": touch_limit_count,
                "blocked_customers": blocked_customers
            },
            "stopping_rules": [
                "Stop immediately when outstanding/overdue balance reaches ₹0 (ZERO_BALANCE)",
                "Stop all automated outreach when Promise-to-Pay is registered (PTP_ACTIVE)",
                "Enforce mandatory 24-hour cooldown between contact touches (COOLDOWN_ACTIVE)",
                "Strict limit of 3 touches within any 7-day rolling window (TOUCH_LIMIT_REACHED)",
                "Re-validate financial ledger state in PostgreSQL prior to every action"
            ],
            "customers": customer_details
        }

    def execute_recovery_campaign(
        self,
        db: Session,
        user_id: int,
        campaign_name: str,
        objective: str,
        target_segment: str,
        channel: str,
        customer_ids: list[int],
        simulate_recovery: bool = True
    ) -> dict:
        """
        Executes a Revenue Recovery Campaign through the authoritative RecoveryService engine.
        Enforces all guardrails, mutates PostgreSQL ledger balances, logs before/after snapshots,
        and records a persistent Campaign and RecoveryBatch entry.
        """
        from app.services.recovery_service import RecoveryService
        recovery_service = RecoveryService()

        batch_res = recovery_service.execute_batch_recovery(
            db,
            user_id=user_id,
            customer_ids=customer_ids,
            simulate_recovery=simulate_recovery
        )

        # Create persistent Campaign record linked to the Recovery Batch
        total_at_risk = batch_res["summary"].get("total_at_risk", 0.0)
        total_recovered = batch_res["summary"].get("total_recovered", 0.0)
        skipped = batch_res["summary"].get("skipped", 0)
        recovered_count = batch_res["summary"].get("successfully_recovered", 0)

        campaign = Campaign(
            user_id=user_id,
            campaign_name=campaign_name,
            channel=channel.capitalize(),
            audience_size=len(customer_ids),
            status="Completed",
            revenue=Decimal(str(total_recovered)),
            target_segment=target_segment,
            campaign_type="recovery",
            objective=objective,
            batch_id=batch_res["batch_id"],
            revenue_at_risk=Decimal(str(total_at_risk)),
            recovered_amount=Decimal(str(total_recovered)),
            skipped_count=skipped,
            success_count=recovered_count,
            launch_time=datetime.utcnow()
        )
        db.add(campaign)
        db.commit()
        db.refresh(campaign)

        # Calculate communication dispatch vs settlement metrics
        items = batch_res.get("items", [])
        eligible_items = [it for it in items if it.get("status") in ["recovered", "action_executed", "success"]]
        skipped_items = [it for it in items if it.get("status") in ["skipped", "blocked"]]

        skipped_reasons = {}
        for it in skipped_items:
            reason = it.get("reason") or "POLICY_EXCLUSION"
            skipped_reasons[reason] = skipped_reasons.get(reason, 0) + 1

        communication_summary = {
            "channel": channel.capitalize(),
            "status": "Dispatched (Simulation)",
            "messages_simulated": len(eligible_items),
            "eligible_count": len(eligible_items),
            "skipped_count": len(skipped_items),
            "skipped_reasons": skipped_reasons
        }

        settlement_summary = {
            "customers_targeted": len(customer_ids),
            "customers_settled": recovered_count,
            "total_recovered": total_recovered,
            "recovery_rate": round((total_recovered / total_at_risk * 100) if total_at_risk > 0 else 0.0, 1)
        }

        # Build before/after states for response
        targeted_custs = db.query(Customer).filter(Customer.id.in_(customer_ids)).all() if customer_ids else []
        total_outstanding_before = sum(float(c.outstanding_amount or 0.0) for c in targeted_custs) if targeted_custs else total_at_risk
        # Add back total recovered so before state reflects pre-settlement baseline
        total_outstanding_before = total_outstanding_before + total_recovered


        before_state = {
            "total_outstanding": total_outstanding_before,
            "total_overdue": total_at_risk,
            "revenue_at_risk": total_at_risk
        }
        after_state = {
            "remaining_outstanding": max(0.0, total_outstanding_before - total_recovered),
            "remaining_overdue": max(0.0, total_at_risk - total_recovered),
            "total_recovered": total_recovered
        }
        delta = {
            "outstanding_reduction": total_recovered,
            "overdue_reduction": total_recovered
        }

        # Format items for frontend with separated communication and settlement states
        formatted_results = []
        for it in items:
            is_success = it.get("status") in ["recovered", "action_executed", "success"]
            formatted_results.append({
                "customer_id": it.get("customer_id"),
                "customer_name": it.get("customer_name"),
                "status": "success" if is_success else it.get("status"),
                "stopping_reason": it.get("reason"),
                "communication_status": f"Dispatched ({channel.capitalize()})" if is_success else f"Skipped ({it.get('reason')})",
                "settlement_status": f"Settled INR {it.get('amount_recovered', 0.0):,.2f}" if (it.get("amount_recovered", 0.0) > 0) else ("Pending Settlement" if is_success else "No Outreach"),
                "recovered_amount": it.get("amount_recovered", 0.0),
                "action_type": it.get("action_type"),
                "risk_level": it.get("risk_level")
            })

        return {
            "status": "success",
            "campaign_id": campaign.id,
            "campaign_name": campaign.campaign_name,
            "batch_id": batch_res["batch_id"],
            "communication_summary": communication_summary,
            "settlement_summary": settlement_summary,
            "summary": batch_res["summary"],
            "before_state": before_state,
            "after_state": after_state,
            "delta": delta,
            "results": formatted_results
        }


