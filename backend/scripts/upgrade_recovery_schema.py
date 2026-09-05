import os
import sys
from sqlalchemy import text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base
from app.models import Customer, RecoveryAudit, RecoveryBatch, User

def upgrade_schema():
    print("Starting schema upgrade...", flush=True)
    # 1. Create any missing tables (e.g. recovery_batches)
    Base.metadata.create_all(bind=engine)
    print("Base.metadata.create_all completed.", flush=True)

    # 2. Add columns to customers table if not existing
    customer_cols = [
        ("promise_to_pay_date", "DATE"),
        ("promise_to_pay_amount", "NUMERIC(10, 2) DEFAULT 0.0"),
        ("promise_to_pay_status", "VARCHAR(20)"),
        ("promise_to_pay_created_at", "TIMESTAMP"),
        ("promise_to_pay_notes", "TEXT")
    ]

    with engine.connect() as conn:
        for col_name, col_type in customer_cols:
            try:
                conn.execute(text(f"ALTER TABLE customers ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                conn.commit()
                print(f"Column customers.{col_name} checked/added.", flush=True)
            except Exception as e:
                print(f"Error checking/adding customers.{col_name}: {e}", flush=True)

        # 3. Add columns to recovery_audits table if not existing
        audit_cols = [
            ("batch_id", "VARCHAR(100)"),
            ("before_outstanding", "NUMERIC(10, 2)"),
            ("before_overdue", "NUMERIC(10, 2)"),
            ("before_risk_score", "NUMERIC(5, 2)"),
            ("before_risk_level", "VARCHAR(20)"),
            ("after_outstanding", "NUMERIC(10, 2)"),
            ("after_overdue", "NUMERIC(10, 2)"),
            ("after_risk_score", "NUMERIC(5, 2)"),
            ("after_risk_level", "VARCHAR(20)"),
            ("recovered_amount", "NUMERIC(10, 2) DEFAULT 0.0")
        ]

        for col_name, col_type in audit_cols:
            try:
                conn.execute(text(f"ALTER TABLE recovery_audits ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                conn.commit()
                print(f"Column recovery_audits.{col_name} checked/added.", flush=True)
            except Exception as e:
                print(f"Error checking/adding recovery_audits.{col_name}: {e}", flush=True)

        # 4. Add columns to campaigns table if not existing
        campaign_cols = [
            ("campaign_type", "VARCHAR(50) DEFAULT 'recovery'"),
            ("objective", "VARCHAR(100)"),
            ("batch_id", "VARCHAR(100)"),
            ("revenue_at_risk", "NUMERIC(12, 2) DEFAULT 0.0"),
            ("recovered_amount", "NUMERIC(12, 2) DEFAULT 0.0"),
            ("skipped_count", "INTEGER DEFAULT 0"),
            ("success_count", "INTEGER DEFAULT 0")
        ]

        for col_name, col_type in campaign_cols:
            try:
                conn.execute(text(f"ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                conn.commit()
                print(f"Column campaigns.{col_name} checked/added.", flush=True)
            except Exception as e:
                print(f"Error checking/adding campaigns.{col_name}: {e}", flush=True)

    print("Schema upgrade successfully completed!", flush=True)

if __name__ == "__main__":
    upgrade_schema()
