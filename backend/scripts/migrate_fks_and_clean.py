import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from sqlalchemy import text

def migrate_foreign_keys_and_clear():
    with engine.connect() as conn:
        with conn.begin():
            print("1. Updating Foreign Key Constraints to ON DELETE CASCADE...")
            
            # List of (table, constraint_name, column, foreign_table, foreign_col)
            fks = [
                ("customers", "customers_user_id_fkey", "user_id", "users", "id"),
                ("campaigns", "campaigns_user_id_fkey", "user_id", "users", "id"),
                ("copilot_conversations", "copilot_conversations_user_id_fkey", "user_id", "users", "id"),
                ("orders", "orders_customer_id_fkey", "customer_id", "customers", "id"),
                ("events", "events_customer_id_fkey", "customer_id", "customers", "id"),
                ("events", "events_campaign_id_fkey", "campaign_id", "campaigns", "id"),
                ("negotiations", "negotiations_customer_id_fkey", "customer_id", "customers", "id"),
                ("copilot_messages", "copilot_messages_conversation_id_fkey", "conversation_id", "copilot_conversations", "id"),
                ("recovery_audits", "recovery_audits_user_id_fkey", "user_id", "users", "id"),
                ("recovery_audits", "recovery_audits_customer_id_fkey", "customer_id", "customers", "id"),
                ("messages", "messages_negotiation_id_fkey", "negotiation_id", "negotiations", "id"),
            ]
            
            for table, conname, col, ftable, fcol in fks:
                try:
                    conn.execute(text(f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {conname};"))
                    conn.execute(text(f"ALTER TABLE {table} ADD CONSTRAINT {conname} FOREIGN KEY ({col}) REFERENCES {ftable}({fcol}) ON DELETE CASCADE;"))
                    print(f"  -> Recreated {conname} on {table}({col}) -> {ftable}({fcol}) ON DELETE CASCADE")
                except Exception as e:
                    print(f"  Error on {conname}: {e}")

            print("\n2. Wiping all database records and resetting sequences...")
            conn.execute(text("""
                TRUNCATE TABLE 
                    messages, 
                    negotiations, 
                    events, 
                    orders, 
                    recovery_audits, 
                    copilot_messages, 
                    copilot_conversations, 
                    campaigns, 
                    customers, 
                    users,
                    ai_usage_logs,
                    security_events
                RESTART IDENTITY CASCADE;
            """))
            print("  -> Truncate complete.")

def verify():
    with engine.connect() as conn:
        print("\n--- Verifying Foreign Key Constraints ---")
        res = conn.execute(text('''
            SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, rc.delete_rule
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.referential_constraints AS rc ON tc.constraint_name = rc.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu ON rc.unique_constraint_name = ccu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY';
        ''')).fetchall()
        for r in res:
            print(f"Table: {r[0]}, Col: {r[1]} -> Ref: {r[2]}, Delete Rule: {r[3]}")

        print("\n--- Current Database Counts ---")
        tables = [
            'users', 'customers', 'orders', 'events', 'campaigns', 
            'negotiations', 'messages', 'recovery_audits', 
            'copilot_conversations', 'copilot_messages', 
            'ai_usage_logs', 'security_events'
        ]
        for t in tables:
            cnt = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
            print(f"{t}: {cnt}")

if __name__ == "__main__":
    migrate_foreign_keys_and_clear()
    verify()
