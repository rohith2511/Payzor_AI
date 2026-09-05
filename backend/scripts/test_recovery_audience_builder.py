import os
import sys
import json
from datetime import date, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import User, Customer
from app.services.audience_service import AudienceService
from app.schemas.audience_schema import AudienceRequest

def run_audience_builder_tests():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("No user found in database.")
            return

        user_id = user.id
        service = AudienceService()

        print("=" * 65)
        print("STARTING AI AUDIENCE BUILDER REVENUE RECOVERY VERIFICATION")
        print("=" * 65)

        # -------------------------------------------------------------
        # SETUP TEST DATA TO GUARANTEE ALL RECOVERY SCENARIOS ARE COVERED
        # -------------------------------------------------------------
        print("\n--- SETUP: Ensuring Test Debtors in PostgreSQL ---", flush=True)
        
        # Debtor 1: Overdue > 1 Lakh & High Risk
        d1 = db.query(Customer).filter(Customer.email == "aud_debtor1@test.com").first()
        if not d1:
            d1 = Customer(
                user_id=user_id,
                name="Sovereign Logistics Pvt Ltd",
                email="aud_debtor1@test.com",
                outstanding_amount=Decimal("350000.00"),
                overdue_amount=Decimal("150000.00"),
                credit_limit=Decimal("400000.00"),
                ai_risk_score=Decimal("78.5"),
                ai_risk_level="High",
                next_due_date=date.today() - timedelta(days=20),
                payment_reliability="Medium",
                segment="At Risk Customers"
            )
            db.add(d1)
        else:
            d1.overdue_amount = Decimal("150000.00")
            d1.outstanding_amount = Decimal("350000.00")
            d1.ai_risk_level = "High"

        # Debtor 2: Overdue > 30 Days & Critical Risk
        d2 = db.query(Customer).filter(Customer.email == "aud_debtor2@test.com").first()
        if not d2:
            d2 = Customer(
                user_id=user_id,
                name="Titan Industrial Infra Ltd",
                email="aud_debtor2@test.com",
                outstanding_amount=Decimal("650000.00"),
                overdue_amount=Decimal("550000.00"),
                credit_limit=Decimal("500000.00"),
                ai_risk_score=Decimal("92.0"),
                ai_risk_level="Critical",
                next_due_date=date.today() - timedelta(days=45),
                payment_reliability="Low",
                segment="Overdue Receivables"
            )
            db.add(d2)
        else:
            d2.overdue_amount = Decimal("550000.00")
            d2.outstanding_amount = Decimal("650000.00")
            d2.ai_risk_level = "Critical"
            d2.next_due_date = date.today() - timedelta(days=45)

        # Debtor 3: Active Promise-to-Pay
        d3 = db.query(Customer).filter(Customer.email == "aud_debtor3_ptp@test.com").first()
        if not d3:
            d3 = Customer(
                user_id=user_id,
                name="Meridian Supply Chains",
                email="aud_debtor3_ptp@test.com",
                outstanding_amount=Decimal("200000.00"),
                overdue_amount=Decimal("200000.00"),
                credit_limit=Decimal("250000.00"),
                ai_risk_score=Decimal("65.0"),
                ai_risk_level="High",
                promise_to_pay_status="ACTIVE",
                promise_to_pay_amount=Decimal("200000.00"),
                promise_to_pay_date=date.today() + timedelta(days=7),
                segment="At Risk Customers"
            )
            db.add(d3)
        else:
            d3.promise_to_pay_status = "ACTIVE"
            d3.promise_to_pay_amount = Decimal("200000.00")
            d3.promise_to_pay_date = date.today() + timedelta(days=7)

        db.commit()
        print("Setup completed: Debtors verified in database.", flush=True)

        # -------------------------------------------------------------
        # TEST 1: Overdue Balances Above 1 Lakh
        # -------------------------------------------------------------
        print("\n--- TEST 1: 'Show customers with overdue balances above INR 1 lakh.' ---", flush=True)
        t1_prompt = "Show customers with overdue balances above INR 1 lakh."
        custs1, filters1 = service.filter_customers_by_prompt(db, t1_prompt, user_id)
        
        print(f"Parsed Filter: {filters1.get('min_overdue') or filters1}", flush=True)
        print(f"Matched Count: {len(custs1)} accounts", flush=True)
        tot_overdue_1 = sum(float(c.overdue_amount or 0.0) for c in custs1)
        print(f"Total Overdue Amount: INR {tot_overdue_1:,.2f}", flush=True)
        for c in custs1[:3]:
            print(f"  * {c.name}: Overdue INR {float(c.overdue_amount):,.2f}, Risk: {c.ai_risk_level}", flush=True)
        
        assert len(custs1) > 0, "TEST 1 Failed: Expected accounts with overdue > 1 lakh"
        assert all(float(c.overdue_amount or 0) >= 100000 for c in custs1), "TEST 1 Failed: Not all customers have overdue >= 1 lakh"
        print("[OK] TEST 1 PASSED", flush=True)

        import time
        time.sleep(5.5)

        # -------------------------------------------------------------
        # TEST 2: High-Risk B2B Customers with Overdue Receivables
        # -------------------------------------------------------------
        print("\n--- TEST 2: 'Find high-risk B2B customers with overdue receivables.' ---", flush=True)
        t2_prompt = "Find high-risk B2B customers with overdue receivables."
        custs2, filters2 = service.filter_customers_by_prompt(db, t2_prompt, user_id)
        
        print(f"Parsed Risk Levels: {filters2.get('risk_levels')}", flush=True)
        print(f"Matched Count: {len(custs2)} accounts", flush=True)
        for c in custs2[:3]:
            print(f"  * {c.name}: Risk {c.ai_risk_level}, Overdue INR {float(c.overdue_amount):,.2f}", flush=True)
            
        assert len(custs2) > 0, "TEST 2 Failed: Expected high/critical risk accounts with overdue"
        assert all(c.ai_risk_level in ["High", "Critical"] and float(c.overdue_amount or 0) > 0 for c in custs2), "TEST 2 Failed: Risk/overdue filter mismatch"
        print("[OK] TEST 2 PASSED", flush=True)

        time.sleep(5.5)

        # -------------------------------------------------------------
        # TEST 3: Overdue Invoices Older Than 30 Days
        # -------------------------------------------------------------
        print("\n--- TEST 3: 'Show customers with overdue invoices older than 30 days.' ---", flush=True)
        t3_prompt = "Show customers with overdue invoices older than 30 days."
        custs3, filters3 = service.filter_customers_by_prompt(db, t3_prompt, user_id)
        
        print(f"Parsed Days Overdue: {filters3.get('min_days_overdue')}", flush=True)
        print(f"Matched Count: {len(custs3)} accounts", flush=True)
        for c in custs3[:3]:
            days_past = (date.today() - c.next_due_date).days if c.next_due_date else "N/A"
            print(f"  * {c.name}: Due Date {c.next_due_date} ({days_past} days past due), Overdue INR {float(c.overdue_amount):,.2f}", flush=True)
            
        assert len(custs3) > 0, "TEST 3 Failed: Expected accounts with invoice overdue > 30 days"
        print("[OK] TEST 3 PASSED", flush=True)

        time.sleep(5.5)

        # -------------------------------------------------------------
        # TEST 4: Active Promise-to-Pay Commitments
        # -------------------------------------------------------------
        print("\n--- TEST 4: 'Find customers with active Promise-to-Pay commitments.' ---", flush=True)
        t4_prompt = "Find customers with active Promise-to-Pay commitments."
        custs4, filters4 = service.filter_customers_by_prompt(db, t4_prompt, user_id)
        
        print(f"Parsed PTP Status: {filters4.get('ptp_status')}", flush=True)
        print(f"Matched Count: {len(custs4)} accounts", flush=True)
        for c in custs4:
            print(f"  * {c.name}: PTP Status={c.promise_to_pay_status}, Committed Amount=INR {float(c.promise_to_pay_amount or 0):,.2f}, PTP Date={c.promise_to_pay_date}", flush=True)
            
        assert len(custs4) > 0, "TEST 4 Failed: Expected accounts with active PTP"
        assert all(c.promise_to_pay_status == "ACTIVE" for c in custs4), "TEST 4 Failed: Non-active PTP accounts returned"
        print("[OK] TEST 4 PASSED", flush=True)

        time.sleep(5.5)

        # -------------------------------------------------------------
        # TEST 5: Outstanding Exposure Above 5 Lakh and High Risk
        # -------------------------------------------------------------
        print("\n--- TEST 5: 'Show customers with outstanding exposure above INR 5 lakh and high risk.' ---", flush=True)
        t5_prompt = "Show customers with outstanding exposure above INR 5 lakh and high risk."
        custs5, filters5 = service.filter_customers_by_prompt(db, t5_prompt, user_id)
        
        print(f"Parsed Min Outstanding: {filters5.get('min_outstanding')}, Risk: {filters5.get('risk_levels')}", flush=True)
        print(f"Matched Count: {len(custs5)} accounts", flush=True)
        for c in custs5:
            print(f"  * {c.name}: Outstanding INR {float(c.outstanding_amount):,.2f}, Risk: {c.ai_risk_level}", flush=True)
            
        assert len(custs5) > 0, "TEST 5 Failed: Expected accounts with outstanding >= 5 lakh and high/critical risk"
        assert all(float(c.outstanding_amount or 0) >= 500000 and c.ai_risk_level in ["High", "Critical"] for c in custs5), "TEST 5 Failed: Criteria mismatch"
        print("[OK] TEST 5 PASSED", flush=True)

        print("\n" + "=" * 65)
        print("ALL 5 AI AUDIENCE BUILDER RECOVERY PROMPTS PASSED! [OK]")
        print("=" * 65)

    finally:
        db.close()

if __name__ == "__main__":
    run_audience_builder_tests()
