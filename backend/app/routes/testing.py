from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.campaign import Campaign
from app.models.event import Event
from app.models.negotiation import Negotiation
from app.models.message import Message
from app.models.recovery_audit import RecoveryAudit
from app.routes.auth import get_current_user
from app.models.user import User
from app.utils.auth_utils import hash_password
from faker import Faker
import random
from datetime import datetime, timedelta, date
from decimal import Decimal

router = APIRouter(
    prefix="/testing",
    tags=["Testing & Seeding"]
)

@router.post("/seed", status_code=status.HTTP_201_CREATED)
def seed_database(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Cleans the existing tables and seeds realistic data for testing and front-end evaluation.
    """
    if not isinstance(current_user, User):
        demo_user = db.query(User).filter(User.email == "admin@payzor.ai").first()
        if not demo_user:
            demo_user = User(
                name="Demo Admin",
                email="admin@payzor.ai",
                password_hash=hash_password("admin123"),
                org="Payzor Capital & Recovery Technologies"
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        current_user = demo_user

    # 1. Clean existing records safely for this user only
    # Delete events belonging to current user's campaigns or customers
    db.query(Event).filter(
        Event.campaign_id.in_(db.query(Campaign.id).filter(Campaign.user_id == current_user.id)) |
        Event.customer_id.in_(db.query(Customer.id).filter(Customer.user_id == current_user.id))
    ).delete(synchronize_session=False)

    # Delete orders belonging to current user's customers
    db.query(Order).filter(
        Order.customer_id.in_(db.query(Customer.id).filter(Customer.user_id == current_user.id))
    ).delete(synchronize_session=False)

    # Delete messages and negotiations belonging to current user's customers
    db.query(Message).filter(
        Message.negotiation_id.in_(
            db.query(Negotiation.id).filter(
                Negotiation.customer_id.in_(db.query(Customer.id).filter(Customer.user_id == current_user.id))
            )
        )
    ).delete(synchronize_session=False)

    db.query(Negotiation).filter(
        Negotiation.customer_id.in_(db.query(Customer.id).filter(Customer.user_id == current_user.id))
    ).delete(synchronize_session=False)

    # Delete recovery audits belonging to current user
    db.query(RecoveryAudit).filter(RecoveryAudit.user_id == current_user.id).delete(synchronize_session=False)

    # Delete campaigns and customers belonging to current user
    db.query(Campaign).filter(Campaign.user_id == current_user.id).delete(synchronize_session=False)
    db.query(Customer).filter(Customer.user_id == current_user.id).delete(synchronize_session=False)
    db.commit()

    fake = Faker()
    random.seed(42)

    # 2. Seed Customers
    segments = ["High Value Customers", "Loyal Customers", "Dormant Customers", "At Risk Customers", "New Customers"]
    cities = ["Mumbai", "Delhi", "Bangalore", "Kolkata", "Chennai", "Pune", "Hyderabad"]
    
    customers_list = []
    for _ in range(100):
        c = Customer(
            name=fake.name(),
            email=fake.unique.email(),
            phone=fake.phone_number()[:20],
            city=random.choice(cities),
            total_spend=Decimal("0.0"),
            segment=random.choice(segments),
            last_purchase=None,
            user_id=current_user.id,
            created_at=datetime.utcnow() - timedelta(days=random.randint(100, 700))
        )
        db.add(c)
        customers_list.append(c)
    db.commit()

    # 3. Seed Orders & Update Customer Totals
    categories = ["Apparel", "Electronics", "Footwear", "Accessories", "Home Decor"]
    products = {
        "Apparel": ["V-Neck T-Shirt", "Slim Fit Denim", "Leather Jacket", "Designer Saree", "Hooded Sweatshirt"],
        "Electronics": ["Bluetooth Earbuds", "Smart Fitness Band", "Fast Charging Adapter", "Portable Power Bank"],
        "Footwear": ["Running Sneakers", "Formal Leather Shoes", "Casual Loafers", "Sports Sandals"],
        "Accessories": ["Minimalist Wallet", "Aviator Sunglasses", "Classic Leather Belt", "Smartwatch Strap"],
        "Home Decor": ["Scented Candle Set", "Ceramic Flower Vase", "LED Desk Lamp", "Microfiber Cushion"]
    }

    for c in customers_list:
        # Determine number of orders based on segment
        if "High Value" in c.segment:
            order_count = random.randint(5, 12)
            unit_price_range = (2500, 8000)
        elif "Loyal" in c.segment:
            order_count = random.randint(4, 7)
            unit_price_range = (1200, 3500)
        elif "Dormant" in c.segment:
            order_count = random.randint(1, 2)
            unit_price_range = (800, 2500)
        elif "At Risk" in c.segment:
            order_count = random.randint(2, 4)
            unit_price_range = (1000, 3000)
        else: # New
            order_count = 1
            unit_price_range = (500, 1500)

        total_spend = Decimal("0.0")
        last_purchase_date = None

        for i in range(order_count):
            cat = random.choice(categories)
            prod = random.choice(products[cat])
            price = Decimal(str(round(random.uniform(*unit_price_range), 2)))
            qty = random.randint(1, 2)
            amount = price * qty
            total_spend += amount

            # Determine date distribution
            if "Dormant" in c.segment:
                days_ago = random.randint(95, 200)
            elif "At Risk" in c.segment:
                days_ago = random.randint(60, 90)
            elif "New" in c.segment:
                days_ago = random.randint(5, 28)
            else:
                days_ago = random.randint(2, 45) if i == order_count - 1 else random.randint(46, 180)

            purchase_datetime = datetime.utcnow() - timedelta(days=days_ago)
            purchase_date = purchase_datetime.date()
            if last_purchase_date is None or purchase_date > last_purchase_date:
                last_purchase_date = purchase_date

            order = Order(
                customer_id=c.id,
                order_number=f"ORD-{fake.unique.random_number(digits=6)}",
                product_name=prod,
                category=cat,
                quantity=qty,
                unit_price=price,
                total_amount=amount,
                order_status="Completed",
                purchase_date=purchase_datetime,
                created_at=purchase_datetime
            )
            db.add(order)

        c.total_spend = total_spend
        c.last_purchase = last_purchase_date

        # Seed B2B Credit & Receivables fields
        limit_val = random.randint(5, 25) * 10000
        if "High Value" in c.segment:
            limit_val = random.randint(20, 50) * 10000
        c.credit_limit = Decimal(str(limit_val))
        
        # Outstanding and issued credit
        issued_val = round(random.uniform(0.1, 0.8) * limit_val, 2)
        paid_val = round(random.uniform(0.3, 0.9) * issued_val, 2)
        
        c.total_credit_issued = Decimal(str(issued_val))
        c.total_amount_paid = Decimal(str(paid_val))
        c.outstanding_amount = c.total_credit_issued - c.total_amount_paid
        
        idx = customers_list.index(c)
        if idx < 50:
            # Scenario A: Clean/Low Risk (50%)
            c.overdue_amount = Decimal("0.0")
            c.current_due_amount = Decimal(str(round(random.uniform(0.0, 0.3) * float(c.outstanding_amount), 2)))
            c.next_due_date = date.today() + timedelta(days=random.randint(5, 30))
            c.number_of_delayed_payments = random.randint(0, 1)
            c.average_payment_delay = random.randint(0, 3)
            c.payment_reliability = "High"
            c.ai_risk_score = Decimal(str(random.randint(5, 25)))
            c.ai_risk_level = "Low"
            c.ai_risk_explanation = "Customer has a strong payment history and is consistently paying within 3 days of due date. Outstanding balance is well below the credit limit."
            c.ai_recommended_action = "No Action"
            c.ai_recommended_reason = "Account is in good standing. Dues are not overdue."
        elif idx < 70:
            # Scenario B: Approaching Due/Medium Risk (20%)
            c.overdue_amount = Decimal("0.0")
            c.current_due_amount = c.outstanding_amount
            c.next_due_date = date.today() + timedelta(days=random.randint(1, 4))
            c.number_of_delayed_payments = random.randint(1, 3)
            c.average_payment_delay = random.randint(3, 7)
            c.payment_reliability = "Medium"
            c.ai_risk_score = Decimal(str(random.randint(30, 50)))
            c.ai_risk_level = "Medium"
            c.ai_risk_explanation = f"Next payment of ₹{float(c.current_due_amount):,.2f} is due in the next few days. Customer has a history of mild payment delays averaging {c.average_payment_delay} days."
            c.ai_recommended_action = "Send Friendly Reminder"
            c.ai_recommended_reason = "Pre-emptive reminder recommended to ensure on-time payment, given historical average delay of 5 days."
        elif idx < 90:
            # Scenario C: Overdue/High Risk (20%)
            c.overdue_amount = Decimal(str(round(random.uniform(0.4, 1.0) * float(c.outstanding_amount), 2)))
            c.current_due_amount = c.outstanding_amount - c.overdue_amount
            c.next_due_date = date.today() - timedelta(days=random.randint(3, 15))
            c.number_of_delayed_payments = random.randint(3, 6)
            c.average_payment_delay = random.randint(8, 18)
            c.payment_reliability = "Low"
            c.ai_risk_score = Decimal(str(random.randint(60, 85)))
            c.ai_risk_level = "High"
            overdue_days = (date.today() - c.next_due_date).days
            c.ai_risk_explanation = f"Receivable of ₹{float(c.overdue_amount):,.2f} is overdue by {overdue_days} days. Customer has repeated payment delays and low payment reliability."
            c.ai_recommended_action = "Send Payment Link"
            c.ai_recommended_reason = f"Account is {overdue_days} days overdue. Direct payment link intervention is required."
        else:
            # Scenario D: Defaulting/Critical Risk (10%)
            c.overdue_amount = c.outstanding_amount
            c.current_due_amount = Decimal("0.0")
            c.next_due_date = date.today() - timedelta(days=random.randint(16, 45))
            c.number_of_delayed_payments = random.randint(6, 12)
            c.average_payment_delay = random.randint(20, 45)
            c.payment_reliability = "Critical"
            c.ai_risk_score = Decimal(str(random.randint(86, 99)))
            c.ai_risk_level = "Critical"
            overdue_days = (date.today() - c.next_due_date).days
            c.ai_risk_explanation = f"Outstanding balance of ₹{float(c.outstanding_amount):,.2f} is heavily overdue by {overdue_days} days. Previous recovery reminders have met with no response."
            c.ai_recommended_action = "Suspend Credit & Escalate"
            c.ai_recommended_reason = f"Receivable is severely overdue (>{overdue_days} days). Suspend credit limit immediately to prevent further exposure."
    db.commit()

    # 4. Seed Campaigns
    campaign_names = [
        ("VIP Exclusive Offer", "WhatsApp", 25, "Completed", 85000.0),
        ("Cart Re-engagement Blast", "SMS", 40, "Completed", 34000.0),
        ("Holiday Discount Blast", "Email", 70, "Completed", 124000.0),
        ("Weekend Special Promo", "WhatsApp", 15, "Completed", 45000.0),
        ("Dormant Win-Back Campaign", "Email", 30, "Draft", 0.0),
    ]

    campaigns_list = []
    for name, channel, size, status, rev in campaign_names:
        target_segment = "Dormant Customers"
        if "vip" in name.lower():
            target_segment = "High Value Customers"
        elif "cart" in name.lower():
            target_segment = "At Risk Customers"
        elif "weekend" in name.lower():
            target_segment = "Loyal Customers"
        elif "holiday" in name.lower():
            target_segment = "New Customers"

        camp = Campaign(
            campaign_name=name,
            channel=channel,
            audience_size=size,
            status=status,
            revenue=Decimal(str(rev)),
            user_id=current_user.id,
            target_segment=target_segment,
            created_at=datetime.utcnow() - timedelta(days=random.randint(5, 30))
        )
        db.add(camp)
        campaigns_list.append(camp)
    db.commit()

    # 5. Seed Events
    for camp in campaigns_list:
        if camp.status == "Completed":
            # Seed events for this campaign
            sampled_custs = random.sample(customers_list, camp.audience_size)
            camp_revenue = Decimal("0.0")
            for cust in sampled_custs:
                # Flow of events
                db.add(Event(customer_id=cust.id, campaign_id=camp.id, event_type="sent", event_time=camp.created_at))
                if random.random() > 0.05: # 95% delivery
                    db.add(Event(customer_id=cust.id, campaign_id=camp.id, event_type="delivered", event_time=camp.created_at + timedelta(seconds=30)))
                    
                    if camp.channel == "WhatsApp" or random.random() > 0.40: # Open rate
                        db.add(Event(customer_id=cust.id, campaign_id=camp.id, event_type="opened", event_time=camp.created_at + timedelta(minutes=random.randint(5, 120))))
                        
                        if random.random() > 0.70: # Click rate
                            db.add(Event(customer_id=cust.id, campaign_id=camp.id, event_type="clicked", event_time=camp.created_at + timedelta(minutes=random.randint(10, 180))))
                            
                            if random.random() > 0.85: # Purchase rate
                                purchase_val = Decimal(str(round(random.uniform(500.0, 5000.0), 2)))
                                db.add(Event(
                                    customer_id=cust.id,
                                    campaign_id=camp.id,
                                    event_type="purchased",
                                    event_time=camp.created_at + timedelta(minutes=random.randint(15, 240)),
                                    revenue=purchase_val
                                ))
                                camp_revenue += purchase_val
            camp.revenue = camp_revenue

    # 6. Seed Negotiations
    some_custs = random.sample(customers_list, 3)
    for cust in some_custs:
        neg = Negotiation(
            customer_id=cust.id,
            product_name="Minimalist Wallet",
            original_price=Decimal("1500.00"),
            negotiated_price=None,
            margin_floor=Decimal("1100.00"),
            status="active",
            created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 24))
        )
        db.add(neg)
        db.commit()

        # Add messages
        db.add(Message(negotiation_id=neg.id, sender="merchant", message="Welcome! The Minimalist Wallet is ₹1500.00. I can offer you a small discount if you want to negotiate."))
        db.add(Message(negotiation_id=neg.id, sender="customer", message="Can I get it for ₹1000?"))
        db.add(Message(negotiation_id=neg.id, sender="merchant", message="Sorry, ₹1000 is below our cost. The best I can do is ₹1250.00."))

    # 7. Seed Recovery Audits over historical months
    # We represent March, April, May, June, July, August 2026
    current_year = 2026
    audit_scenarios = [
        # March
        {"month": 3, "day": 10, "amount": 45000.0, "cust_idx": 5, "action": "WhatsApp Reminder Link", "status": "success"},
        {"month": 3, "day": 22, "amount": 35000.0, "cust_idx": 12, "action": "Email Reminder Link", "status": "success"},
        # April
        {"month": 4, "day": 5, "amount": 62000.0, "cust_idx": 8, "action": "WhatsApp Reminder Link", "status": "success"},
        {"month": 4, "day": 18, "amount": 48000.0, "cust_idx": 17, "action": "SMS Reminder Link", "status": "success"},
        # May
        {"month": 5, "day": 12, "amount": 55000.0, "cust_idx": 2, "action": "WhatsApp Reminder Link", "status": "success"},
        {"month": 5, "day": 25, "amount": 75000.0, "cust_idx": 22, "action": "Escalate to Phone Call", "status": "success"},
        # June
        {"month": 6, "day": 8, "amount": 80000.0, "cust_idx": 29, "action": "WhatsApp Reminder Link", "status": "success"},
        {"month": 6, "day": 20, "amount": 72000.0, "cust_idx": 33, "action": "Email Reminder Link", "status": "success"},
        # July
        {"month": 7, "day": 4, "amount": 95000.0, "cust_idx": 41, "action": "WhatsApp Reminder Link", "status": "success"},
        {"month": 7, "day": 15, "amount": 88000.0, "cust_idx": 48, "action": "WhatsApp Reminder Link", "status": "success"},
        {"month": 7, "day": 28, "amount": 104000.0, "cust_idx": 52, "action": "Escalate to Phone Call", "status": "success"},
        # August
        {"month": 8, "day": 5, "amount": 115000.0, "cust_idx": 61, "action": "WhatsApp Reminder Link", "status": "success"},
        {"month": 8, "day": 12, "amount": 64000.0, "cust_idx": 68, "action": "SMS Reminder Link", "status": "success"},
    ]

    for item in audit_scenarios:
        c_item = customers_list[min(item["cust_idx"], len(customers_list)-1)]
        audit_time = datetime(current_year, item["month"], item["day"], 14, 30, 0)
        db.add(RecoveryAudit(
            user_id=current_user.id,
            customer_id=c_item.id,
            customer_name=c_item.name,
            amount=Decimal(str(item["amount"])),
            action_type=item["action"],
            status=item["status"],
            risk_level="High" if item["amount"] > 50000 else "Medium",
            recommendation_reason="Invoice outstanding balance past standard credit due date term.",
            details="Demo simulated recovery payment successfully reconciled.",
            created_at=audit_time
        ))

    db.commit()
    return {"status": "success", "message": "Database cleared and seeded with fresh, consistent mock data."}
