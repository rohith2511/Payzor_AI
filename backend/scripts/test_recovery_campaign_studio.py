import os
import sys
from datetime import date, datetime
from decimal import Decimal

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, Base, engine
from app.models import User, Customer, RecoveryAudit, RecoveryBatch, Campaign
from app.services.recovery_service import RecoveryService
from app.services.campaign_service import CampaignService

def run_tests():
    Base.metadata.create_all(bind=engine)
    print("=" * 60, flush=True)
    print("STARTING RECOVERY CAMPAIGN STUDIO AUTOMATED VERIFICATION", flush=True)
    print("=" * 60, flush=True)

    db = SessionLocal()
    recovery_service = RecoveryService()
    campaign_service = CampaignService()

    # Get or create test user
    user = db.query(User).first()
    if not user:
        user = User(email="test_campaign@payzor.ai", name="Campaign Tester")
        db.add(user)
        db.commit()
        db.refresh(user)
    user_id = user.id

    # 1. Setup Test Debtors
    print("\n--- TEST 1: Setting up Recovery Campaign Test Debtors ---", flush=True)
    debtor_1 = db.query(Customer).filter(Customer.email == "camp_debtor1@test.com").first()
    if not debtor_1:
        debtor_1 = Customer(
            user_id=user_id,
            name="Apex Logistics Ltd",
            email="camp_debtor1@test.com",
            phone="+919876543210",
            total_spend=Decimal("350000.00"),
            outstanding_amount=Decimal("180000.00"),
            overdue_amount=Decimal("120000.00"),
            credit_limit=Decimal("200000.00"),
            number_of_delayed_payments=4,
            average_payment_delay=22,
            next_due_date=date(2026, 8, 15),
            promise_to_pay_status=None,
            segment="Overdue Receivables"
        )
        db.add(debtor_1)
    else:
        debtor_1.outstanding_amount = Decimal("180000.00")
        debtor_1.overdue_amount = Decimal("120000.00")
        debtor_1.promise_to_pay_status = None

    # Debtor 2 with Active PTP
    debtor_2 = db.query(Customer).filter(Customer.email == "camp_debtor2_ptp@test.com").first()
    if not debtor_2:
        debtor_2 = Customer(
            user_id=user_id,
            name="Zenith Infra Corp",
            email="camp_debtor2_ptp@test.com",
            phone="+919876543211",
            total_spend=Decimal("500000.00"),
            outstanding_amount=Decimal("250000.00"),
            overdue_amount=Decimal("250000.00"),
            credit_limit=Decimal("300000.00"),
            number_of_delayed_payments=3,
            average_payment_delay=18,
            next_due_date=date(2026, 8, 20),
            promise_to_pay_status="ACTIVE",
            promise_to_pay_amount=Decimal("250000.00"),
            promise_to_pay_date=date(2026, 9, 25),
            promise_to_pay_notes="Promised payment after board review",
            segment="Critical Risk Accounts"
        )
        db.add(debtor_2)
    else:
        debtor_2.outstanding_amount = Decimal("250000.00")
        debtor_2.overdue_amount = Decimal("250000.00")
        debtor_2.promise_to_pay_status = "ACTIVE"
        debtor_2.promise_to_pay_date = date(2026, 9, 25)

    # Debtor 3 with Zero Balance
    debtor_3 = db.query(Customer).filter(Customer.email == "camp_debtor3_zero@test.com").first()
    if not debtor_3:
        debtor_3 = Customer(
            user_id=user_id,
            name="ClearPath Solutions",
            email="camp_debtor3_zero@test.com",
            phone="+919876543212",
            total_spend=Decimal("120000.00"),
            outstanding_amount=Decimal("0.00"),
            overdue_amount=Decimal("0.00"),
            credit_limit=Decimal("100000.00"),
            number_of_delayed_payments=0,
            average_payment_delay=0,
            next_due_date=date(2026, 9, 30),
            promise_to_pay_status=None,
            segment="Regular Customers"
        )
        db.add(debtor_3)
    else:
        debtor_3.outstanding_amount = Decimal("0.00")
        debtor_3.overdue_amount = Decimal("0.00")
        debtor_3.promise_to_pay_status = None

    # Clean existing audits for test customers to ensure fresh test runs
    db.query(RecoveryAudit).filter(RecoveryAudit.customer_id.in_([debtor_1.id, debtor_2.id, debtor_3.id])).delete(synchronize_session=False)
    db.commit()
    db.refresh(debtor_1)
    db.refresh(debtor_2)
    db.refresh(debtor_3)
    db.commit()
    print(f"Verified test debtors: D1 ({debtor_1.name}, ID {debtor_1.id}), D2 ({debtor_2.name}, ID {debtor_2.id}, PTP Active), D3 ({debtor_3.name}, ID {debtor_3.id}, Zero Balance)", flush=True)

    # 2. Test Workflow Generation & Dynamic Cohort Analytics
    print("\n--- TEST 2: Generate AI Recovery Workflow ---", flush=True)
    wf = campaign_service.generate_recovery_workflow(
        db,
        user_id=user_id,
        audience_segment="Overdue Receivables",
        objective="Recover Overdue Receivables",
        channel="whatsapp",
        goal="Recover overdue invoices with strict compliance to active Promise-to-Pay exclusions"
    )
    db.commit()


    print(f"Strategy Title: {wf['strategy_title']}", flush=True)
    print(f"Target Customer Count: {wf['customer_count']}", flush=True)
    print(f"Total Overdue: INR {wf['total_overdue']:,.2f}", flush=True)
    print(f"Revenue at Risk: INR {wf['revenue_at_risk']:,.2f}", flush=True)
    print(f"Projected Recovery: INR {wf['expected_recovery_estimate']:,.2f}", flush=True)
    print(f"Diagnosis Points: {len(wf['diagnosis'])} points generated", flush=True)
    for d in wf['diagnosis']:
        safe_d = d.replace('₹', 'INR ').encode('ascii', errors='replace').decode('ascii')
        print(f"  * {safe_d}", flush=True)

    assert wf['customer_count'] > 0, "Workflow must match customer cohort"
    assert wf['total_overdue'] > 0, "Overdue amount must be calculated from database"
    assert len(wf['recommended_steps']) == 4, "Must generate 4-step recovery workflow"

    # 3. Test Guardrail Analysis & PTP Exclusions in Workflow
    print("\n--- TEST 3: Guardrail & PTP Exclusions Verification ---", flush=True)
    ga = wf['guardrail_analysis']
    print(f"Eligible Count: {ga['eligible_count']}", flush=True)
    print(f"Blocked Count: {ga['blocked_count']}", flush=True)
    print(f"PTP Blocked Count: {ga['ptp_blocked_count']}", flush=True)
    print(f"Zero Balance Count: {ga['zero_balance_count']}", flush=True)

    # Verify D2 (PTP Active) is blocked under PTP_ACTIVE
    d2_in_list = next((c for c in wf['customers'] if c['id'] == debtor_2.id), None)
    if d2_in_list:
        print(f"Debtor 2 Eligibility: {d2_in_list['is_eligible']}, Stopping Reason: {d2_in_list['stopping_reason']}", flush=True)
        assert d2_in_list['is_eligible'] == False, "PTP active customer MUST NOT be eligible for recovery outreach"
        assert d2_in_list['stopping_reason'] == "PTP_ACTIVE", "Stopping reason must be PTP_ACTIVE"

    # 4. Test Recovery Campaign Execution
    print("\n--- TEST 4: Execute Recovery Campaign ---", flush=True)
    target_ids = [debtor_1.id, debtor_2.id, debtor_3.id]
    exec_res = campaign_service.execute_recovery_campaign(
        db,
        user_id=user_id,
        campaign_name="Q3 High-Risk Receivables Recovery",
        objective="Recover Overdue Receivables",
        target_segment="Overdue Receivables",
        channel="whatsapp",
        customer_ids=target_ids,
        simulate_recovery=True
    )

    print(f"Campaign Execution Status: {exec_res['status']}", flush=True)
    print(f"Campaign ID: {exec_res['campaign_id']}, Batch ID: {exec_res['batch_id']}", flush=True)
    print(f"Communication Summary: Messages Simulated={exec_res['communication_summary']['messages_simulated']}, Skipped={exec_res['communication_summary']['skipped_count']}", flush=True)
    print(f"Settlement Summary: Targeted={exec_res['settlement_summary']['customers_targeted']}, Settled={exec_res['settlement_summary']['customers_settled']}, Total Recovered=INR {exec_res['settlement_summary']['total_recovered']:,.2f}", flush=True)

    assert exec_res['status'] == "success", "Campaign execution must succeed"
    assert exec_res['communication_summary']['messages_simulated'] >= 1, "Must simulate communication to eligible debtors"
    assert exec_res['communication_summary']['skipped_count'] >= 2, "Debtor 2 (PTP) and Debtor 3 (Zero Balance) must be skipped in communication"
    assert exec_res['settlement_summary']['customers_targeted'] == 3, "Must target exactly 3 test customers"
    assert exec_res['summary']['skipped'] >= 2, "Debtor 2 (PTP) and Debtor 3 (Zero Balance) must be skipped"


    # 5. Verify PostgreSQL State Mutation
    print("\n--- TEST 5: Verify Database Ledger Mutation ---", flush=True)
    db.refresh(debtor_1)
    print(f"Debtor 1 Post-Recovery Balance: Outstanding=INR {debtor_1.outstanding_amount}, Overdue=INR {debtor_1.overdue_amount}, Total Paid=INR {debtor_1.total_spend}", flush=True)
    assert debtor_1.outstanding_amount < Decimal("180000.00"), "Debtor 1 outstanding amount MUST decrease"
    assert debtor_1.overdue_amount < Decimal("120000.00"), "Debtor 1 overdue amount MUST decrease"

    # 6. Verify Campaign Record in Database
    print("\n--- TEST 6: Verify Campaign and RecoveryBatch in Database ---", flush=True)
    camp_db = db.query(Campaign).filter(Campaign.id == exec_res['campaign_id']).first()
    assert camp_db is not None, "Campaign record must be saved in database"
    assert camp_db.campaign_type == "recovery", "Campaign type must be 'recovery'"
    assert camp_db.batch_id == exec_res['batch_id'], "Campaign must be linked to Batch ID"
    print(f"Verified Campaign in PostgreSQL: ID={camp_db.id}, Type={camp_db.campaign_type}, BatchID={camp_db.batch_id}, Revenue=INR {camp_db.revenue}", flush=True)

    batch_db = db.query(RecoveryBatch).filter(RecoveryBatch.batch_id == exec_res['batch_id']).first()
    assert batch_db is not None, "RecoveryBatch record must be saved in recovery_batches table"
    print(f"Verified RecoveryBatch in PostgreSQL: ID={batch_db.id}, BatchID={batch_db.batch_id}, Status={batch_db.status}", flush=True)

    print("\n" + "=" * 60, flush=True)
    print("ALL 6 RECOVERY CAMPAIGN STUDIO TESTS PASSED! [OK]", flush=True)
    print("=" * 60, flush=True)
    db.close()

if __name__ == "__main__":
    run_tests()
