import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from sqlalchemy import text

def check_counts():
    db = SessionLocal()
    tables = [
        'users', 'customers', 'orders', 'events', 'campaigns', 
        'negotiations', 'messages', 'recovery_audits', 
        'copilot_conversations', 'copilot_messages', 
        'ai_usage_logs', 'security_events'
    ]
    print("--- Current Database Counts ---")
    for t in tables:
        try:
            cnt = db.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
            print(f"{t}: {cnt}")
        except Exception as e:
            print(f"{t}: Error {e}")
    db.close()

def clear_data():
    db = SessionLocal()
    print("\n--- Deleting users and customers (with cascading relationships) ---")
    try:
        db.execute(text("""
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
        db.commit()
        print("Successfully deleted all users, customers, and associated data.")
    except Exception as e:
        db.rollback()
        print(f"Error during truncate: {e}")
        try:
            print("Trying sequential DELETE...")
            for table in [
                'messages', 'negotiations', 'events', 'orders', 
                'recovery_audits', 'copilot_messages', 'copilot_conversations', 
                'campaigns', 'customers', 'users', 'ai_usage_logs', 'security_events'
            ]:
                db.execute(text(f"DELETE FROM {table}"))
            db.commit()
            print("Successfully deleted via DELETE statements.")
        except Exception as e2:
            db.rollback()
            print(f"Error during DELETE: {e2}")
    finally:
        db.close()

if __name__ == "__main__":
    check_counts()
    clear_data()
    print("\n--- After Deletion Counts ---")
    check_counts()
