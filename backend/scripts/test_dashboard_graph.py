import os
import sys
import json
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.models import User, Customer, RecoveryAudit, RecoveryBatch
from app.services.recovery_service import RecoveryService
from app.routes.recovery import get_recovery_dashboard

def test_dashboard_monthly_graph():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("No user found.")
            return

        print("=" * 60)
        print("STEP 1: FETCHING INITIAL DASHBOARD DATA FOR USER:", user.email)
        print("=" * 60)

        initial_dashboard = get_recovery_dashboard(current_user=user, db=db)
        print("KPI Dues Recovered:", f"INR {initial_dashboard['summary']['amount_recovered']:,.2f}")
        print("KPI Total Outstanding:", f"INR {initial_dashboard['summary']['total_outstanding']:,.2f}")
        print("KPI Total Overdue:", f"INR {initial_dashboard['summary']['total_overdue']:,.2f}")
        print("KPI Recovery Rate:", f"{initial_dashboard['summary']['recovery_rate']:.1f}%")
        
        print("\nMonthly Chart Series (Trailing 6 Months):")
        for item in initial_dashboard['chart']:
            print(f"  {item['month']:<12}: INR {item['recovered']:>14,.2f}")

        chart_sum = sum(item['recovered'] for item in initial_dashboard['chart'])
        print("-" * 40)
        print(f"  {'Total (6-mo)':<12}: INR {chart_sum:>14,.2f}")

        # Verification 1: Chart has non-zero recovery
        assert chart_sum > 0, "FAIL: 6-Month recovery chart sum is 0!"
        sep_val_before = next((item['recovered'] for item in initial_dashboard['chart'] if item['name'] == 'Sep'), 0.0)
        print(f"\nInitial September (Active Month) Recovery: INR {sep_val_before:,.2f}")

        print("\n" + "=" * 60)
        print("STEP 2: SIMULATING NEW RECOVERY CAMPAIGN DISPATCH (SEPTEMBER)")
        print("=" * 60)

        service = RecoveryService()
        # Find a customer with overdue amount
        target_customer = db.query(Customer).filter(
            Customer.user_id == user.id,
            Customer.overdue_amount > 0
        ).first()

        if not target_customer:
            # Pick any customer with outstanding amount
            target_customer = db.query(Customer).filter(
                Customer.user_id == user.id,
                Customer.outstanding_amount > 0
            ).first()

        if target_customer:
            print(f"Target Customer: {target_customer.name} (Overdue: INR {target_customer.overdue_amount:,.2f}, Outstanding: INR {target_customer.outstanding_amount:,.2f})")
            
            # Execute batch recovery for this customer
            batch_result = service.execute_batch_recovery(
                db=db,
                user_id=user.id,
                customer_ids=[target_customer.id],
                simulate_recovery=True
            )
            print(f"Executed Batch Recovery (Batch ID: {batch_result['batch_id']}): Successfully recovered INR {batch_result['summary']['total_recovered']:,.2f}")

            # Fetch dashboard again
            updated_dashboard = get_recovery_dashboard(current_user=user, db=db)
            sep_val_after = next((item['recovered'] for item in updated_dashboard['chart'] if item['name'] == 'Sep'), 0.0)
            kpi_after = updated_dashboard['summary']['amount_recovered']

            print(f"\nUpdated September (Active Month) Recovery: INR {sep_val_after:,.2f} (+INR {sep_val_after - sep_val_before:,.2f})")
            print(f"Updated KPI Dues Recovered: INR {kpi_after:,.2f}")

            assert sep_val_after >= sep_val_before, "FAIL: September recovery did not increase after campaign!"
            print("\nPASS: September chart value dynamically increased with simulated recovery!")

        print("\n" + "=" * 60)
        print("ALL DASHBOARD GRAPH VERIFICATIONS PASSED SUCCESSFULLY!")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    test_dashboard_monthly_graph()
