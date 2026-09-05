from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.customer_schema import CustomerCreate, CustomerResponse
from app.schemas.order_schema import OrderResponse
from app.routes.auth import get_current_user
from app.models.user import User
from typing import List

router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)

@router.get("/by-segment", response_model=List[CustomerResponse])
def read_customers_by_segment(
    segment: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customers = db.query(Customer).filter(
        Customer.user_id == current_user.id,
        Customer.segment == segment
    ).all()
    return customers

@router.get("/orders", response_model=List[OrderResponse])
def read_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Order).join(Customer).filter(Customer.user_id == current_user.id).all()

@router.get("/", response_model=List[CustomerResponse])
def read_customers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customers = db.query(Customer).filter(Customer.user_id == current_user.id).all()
    return customers


@router.get("/{id}", response_model=CustomerResponse)
def read_customer(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == id, Customer.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("/", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_customer = Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        city=customer.city,
        total_spend=customer.total_spend,
        segment=customer.segment,
        last_purchase=customer.last_purchase,
        user_id=current_user.id
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.post("/import", status_code=status.HTTP_201_CREATED)
def import_customers(customers: List[CustomerCreate], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    imported_count = 0
    for c in customers:
        db_customer = Customer(
            name=c.name,
            email=c.email,
            phone=c.phone,
            city=c.city,
            total_spend=c.total_spend,
            segment=c.segment,
            last_purchase=c.last_purchase,
            user_id=current_user.id
        )
        db.add(db_customer)
        imported_count += 1
    db.commit()
    return {"status": "success", "imported": imported_count}

@router.put("/{id}", response_model=CustomerResponse)
def update_customer(id: int, updated: CustomerCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == id, Customer.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer.name = updated.name
    customer.email = updated.email
    customer.phone = updated.phone
    customer.city = updated.city
    customer.total_spend = updated.total_spend
    customer.segment = updated.segment
    customer.last_purchase = updated.last_purchase
    
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_customer(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    customer = db.query(Customer).filter(Customer.id == id, Customer.user_id == current_user.id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return {"status": "success", "message": "Customer deleted successfully"}

from pydantic import BaseModel
from typing import Optional
import random
import string
from datetime import date, timedelta
from decimal import Decimal

class GenerateCustomersRequest(BaseModel):
    count: int = 100
    city: Optional[str] = None

@router.post("/generate", status_code=status.HTTP_201_CREATED)
def generate_fake_customers(
    payload: GenerateCustomersRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    first_names_male = [
        "Aarav", "Vihaan", "Vivaan", "Rahul", "Amit", "Raj", "Sanjay", "Vijay",
        "Arjun", "Aditya", "Sai", "Vikram", "Rohan", "Kabir", "Manish", "Kunal",
        "Pranav", "Nikhil", "Gaurav", "Suresh", "Ramesh", "Deepak", "Anand", "Harish",
        "Siddharth", "Varun", "Abhishek", "Karan", "Alok", "Devendra"
    ]
    first_names_female = [
        "Neha", "Pooja", "Priya", "Kriti", "Anjali", "Riya", "Sneha", "Aditi",
        "Shruti", "Kavya", "Divya", "Ishita", "Meera", "Swati", "Tanya", "Sunita",
        "Pooja", "Ritu", "Deepika", "Shreya", "Nandini", "Ananya", "Preeti", "Radha",
        "Rashmi", "Pallavi", "Shalini", "Tanvi", "Vandana", "Lavanya"
    ]
    last_names = [
        "Sharma", "Verma", "Kumar", "Singh", "Patel", "Gupta", "Mehta", "Joshi",
        "Rao", "Nair", "Iyer", "Reddy", "Choudhury", "Das", "Banerjee", "Sen",
        "Deshmukh", "Kulkarni", "Sundaram", "Malhotra", "Kapoor", "Bhat", "Menon",
        "Pillai", "Agarwal", "Bose", "Chatterjee", "Mishra", "Pandey", "Saxena"
    ]
    cities_pool = [
        "Mumbai", "Bengaluru", "Hyderabad", "Chennai", "Delhi", "Gurugram", "Noida",
        "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Kochi", "Coimbatore", "Indore",
        "Surat", "Visakhapatnam", "Lucknow", "Nagpur", "Chandigarh"
    ]
    repayment_terms_pool = ["7 days", "15 days", "30 days", "45 days", "60 days", "90 days"]

    existing_emails = set(row[0].lower() for row in db.query(Customer.email).all() if row[0])
    existing_phones = set(row[0] for row in db.query(Customer.phone).all() if row[0])

    # Segments distribution for B2B portfolio
    distribution = [
        ("New Customers", 0.15),
        ("Regular Customers", 0.25),
        ("Loyal Customers", 0.20),
        ("High Value Customers", 0.15),
        ("Dormant Customers", 0.10),
        ("At Risk Customers", 0.15)
    ]

    segments_to_create = []
    for segment_name, pct in distribution:
        cnt = int(payload.count * pct)
        segments_to_create.extend([segment_name] * cnt)

    while len(segments_to_create) < payload.count:
        segments_to_create.append(random.choice([d[0] for d in distribution]))

    random.shuffle(segments_to_create)

    # Moderate tiers (60-70%): ₹25,000 to ₹5,00,000
    credit_tier_moderate = [25000, 50000, 75000, 100000, 150000, 200000, 300000, 500000]
    # High tiers (20-30%): ₹5,00,000 to ₹15,00,000
    credit_tier_high = [600000, 750000, 1000000, 1200000, 1500000]
    # Enterprise tiers (5-10%): ₹15,00,000 to ₹50,00,000
    credit_tier_enterprise = [2000000, 2500000, 3000000, 4000000, 5000000]

    def get_credit_limit(segment: str) -> Decimal:
        roll = random.random()
        if segment == "High Value Customers":
            if roll < 0.35:
                val = random.choice(credit_tier_enterprise)
            elif roll < 0.75:
                val = random.choice(credit_tier_high)
            else:
                val = random.choice([300000, 500000])
        elif segment == "New Customers":
            if roll < 0.85:
                val = random.choice([25000, 50000, 75000, 100000, 150000, 200000])
            else:
                val = random.choice([300000, 500000])
        elif segment == "Loyal Customers":
            if roll < 0.50:
                val = random.choice([100000, 150000, 200000, 300000, 500000])
            elif roll < 0.85:
                val = random.choice(credit_tier_high)
            else:
                val = random.choice(credit_tier_enterprise)
        else: # Regular, At Risk, Dormant
            if roll < 0.65:
                val = random.choice(credit_tier_moderate)
            elif roll < 0.90:
                val = random.choice(credit_tier_high)
            else:
                val = random.choice(credit_tier_enterprise)
        return Decimal(str(val))

    def get_spend_and_date(segment: str):
        today = date.today()
        if segment == "New Customers":
            spend = random.randint(1500, 8000)
            purchase_days_ago = random.randint(0, 25)
        elif segment == "Regular Customers":
            spend = random.randint(8000, 25000)
            purchase_days_ago = random.randint(0, 60)
        elif segment == "Loyal Customers":
            spend = random.randint(25000, 75000)
            purchase_days_ago = random.randint(0, 45)
        elif segment == "High Value Customers":
            spend = random.randint(80000, 350000)
            purchase_days_ago = random.randint(0, 30)
        elif segment == "Dormant Customers":
            spend = random.randint(10000, 50000)
            purchase_days_ago = random.randint(120, 365)
        elif segment == "At Risk Customers":
            spend = random.randint(15000, 60000)
            purchase_days_ago = random.randint(45, 120)
        else:
            spend = random.randint(5000, 20000)
            purchase_days_ago = random.randint(0, 30)

        purchase_date = today - timedelta(days=purchase_days_ago)
        return Decimal(str(spend)), purchase_date

    new_customers = []
    today = date.today()

    for segment in segments_to_create:
        # Generate Identity
        gender = random.choice(["male", "female"])
        first_name = random.choice(first_names_male) if gender == "male" else random.choice(first_names_female)
        last_name = random.choice(last_names)
        full_name = f"{first_name} {last_name}"

        # Generate Unique Email
        email = ""
        attempts = 0
        while attempts < 100:
            rand_num = random.randint(10, 9999)
            email_candidate = f"{first_name.lower()}.{last_name.lower()}{rand_num}@gmail.com"
            if email_candidate not in existing_emails:
                email = email_candidate
                existing_emails.add(email)
                break
            attempts += 1
        if not email:
            email = f"user_{random.choice(string.ascii_lowercase)}{random.randint(100000, 999999)}@gmail.com"

        # Generate Unique Phone
        phone = ""
        attempts = 0
        while attempts < 100:
            prefix = random.choice(["98", "97", "99", "91", "93", "88", "87", "70", "94", "96"])
            phone_candidate = f"+91 {prefix}{random.randint(10000000, 99999999)}"
            if phone_candidate not in existing_phones:
                phone = phone_candidate
                existing_phones.add(phone)
                break
            attempts += 1
        if not phone:
            phone = f"+91 98{random.randint(10000000, 99999999)}"

        # City
        cust_city = payload.city if payload.city else random.choice(cities_pool)
        terms = random.choice(repayment_terms_pool)

        # Spend & Last Purchase
        spend, purchase_date = get_spend_and_date(segment)

        # 1. Credit Limit
        credit_limit = get_credit_limit(segment)
        limit_float = float(credit_limit)

        # 2. Financial Portfolio Archetype Assignment
        # Determine risk/repayment behavior based on segment with natural variation
        # Archetypes:
        # 1: Clean / On-Time Good Payer (~40% across portfolio)
        # 2: Approaching Due / Minor Late (~25%)
        # 3: Moderately Overdue (~20%)
        # 4: High Overdue / High Risk (~10%)
        # 5: Critical / Severe Default (~5%)
        rand_arch = random.random()
        if segment == "At Risk Customers":
            # Biased heavily towards Archetypes 3, 4, 5
            if rand_arch < 0.25:
                archetype = 3
            elif rand_arch < 0.65:
                archetype = 4
            else:
                archetype = 5
        elif segment == "Loyal Customers":
            # Biased towards Archetypes 1, 2
            if rand_arch < 0.70:
                archetype = 1
            elif rand_arch < 0.95:
                archetype = 2
            else:
                archetype = 3
        elif segment == "High Value Customers":
            if rand_arch < 0.60:
                archetype = 1
            elif rand_arch < 0.85:
                archetype = 2
            else:
                archetype = 3
        elif segment == "Dormant Customers":
            if rand_arch < 0.45:
                archetype = 1
            elif rand_arch < 0.75:
                archetype = 2
            else:
                archetype = 3
        elif segment == "New Customers":
            if rand_arch < 0.65:
                archetype = 1
            elif rand_arch < 0.90:
                archetype = 2
            else:
                archetype = 3
        else: # Regular Customers
            if rand_arch < 0.40:
                archetype = 1
            elif rand_arch < 0.70:
                archetype = 2
            elif rand_arch < 0.88:
                archetype = 3
            elif rand_arch < 0.96:
                archetype = 4
            else:
                archetype = 5

        # 3. Calculate Outstanding Balance based on utilization patterns
        if archetype == 1:
            # Low to moderate utilization (10% - 40%)
            util_rate = random.uniform(0.10, 0.40)
        elif archetype == 2:
            # Moderate utilization (30% - 60%)
            util_rate = random.uniform(0.30, 0.60)
        elif archetype == 3:
            # Elevated utilization (55% - 78%)
            util_rate = random.uniform(0.55, 0.78)
        elif archetype == 4:
            # High utilization (70% - 90%)
            util_rate = random.uniform(0.70, 0.90)
        else: # Archetype 5
            # Critical utilization (85% - 98%)
            util_rate = random.uniform(0.85, 0.98)

        outstanding_float = round(limit_float * util_rate, 2)
        # Ensure strict invariant: 0 <= outstanding <= credit_limit
        outstanding_float = max(1000.0, min(outstanding_float, limit_float))
        outstanding_amount = Decimal(str(outstanding_float))

        # Issued credit & total amount paid
        issued_mult = random.uniform(1.2, 3.2)
        total_credit_issued = Decimal(str(round(limit_float * issued_mult, 2)))
        if total_credit_issued < outstanding_amount:
            total_credit_issued = outstanding_amount + Decimal(str(round(random.uniform(5000.0, 50000.0), 2)))
        total_amount_paid = total_credit_issued - outstanding_amount

        # 4. Calculate Overdue Balance & Repayment Metrics
        if archetype == 1:
            # Zero overdue (Good payer)
            overdue_float = 0.0
            overdue_amount = Decimal("0.0")
            current_due_amount = outstanding_amount
            number_of_delayed_payments = random.randint(0, 1)
            average_payment_delay = random.randint(0, 3)
            payment_reliability = "High"
            next_due_date = today + timedelta(days=random.randint(7, 30))
            previous_payment_behavior = f"Credit Terms: {terms}. Consistently settles invoices on-time with zero defaults across past cycles."
            recovery_history = "No overdue incidents recorded. Account in stellar standing."

        elif archetype == 2:
            # Low / occasional overdue or approaching due
            if random.random() < 0.5:
                overdue_float = 0.0
                overdue_amount = Decimal("0.0")
                next_due_date = today + timedelta(days=random.randint(1, 5))
                payment_reliability = "High"
            else:
                overdue_float = round(random.uniform(0.05, 0.20) * outstanding_float, 2)
                overdue_amount = Decimal(str(overdue_float))
                next_due_date = today - timedelta(days=random.randint(1, 6))
                payment_reliability = "Medium"

            current_due_amount = outstanding_amount - overdue_amount
            number_of_delayed_payments = random.randint(1, 3)
            average_payment_delay = random.randint(3, 7)
            previous_payment_behavior = f"Credit Terms: {terms}. Minor historical delays averaging {average_payment_delay} days. Settles upon initial reminder."
            recovery_history = "1 automated notification issued historically; resolved promptly."

        elif archetype == 3:
            # Moderately overdue (25% - 50% of outstanding)
            overdue_float = round(random.uniform(0.25, 0.50) * outstanding_float, 2)
            overdue_amount = Decimal(str(overdue_float))
            current_due_amount = outstanding_amount - overdue_amount
            number_of_delayed_payments = random.randint(2, 5)
            average_payment_delay = random.randint(8, 16)
            payment_reliability = "Medium"
            next_due_date = today - timedelta(days=random.randint(7, 18))
            previous_payment_behavior = f"Credit Terms: {terms}. Periodic delayed remittances with average settlement lag of {average_payment_delay} days."
            recovery_history = "2 reminder notifications dispatched; partial payments recorded."

        elif archetype == 4:
            # High overdue balance (55% - 82% of outstanding)
            overdue_float = round(random.uniform(0.55, 0.82) * outstanding_float, 2)
            overdue_amount = Decimal(str(overdue_float))
            current_due_amount = outstanding_amount - overdue_amount
            number_of_delayed_payments = random.randint(4, 8)
            average_payment_delay = random.randint(17, 30)
            payment_reliability = "Low"
            next_due_date = today - timedelta(days=random.randint(19, 35))
            previous_payment_behavior = f"Credit Terms: {terms}. Recurrent payment deferrals past due date. Low remittance reliability."
            recovery_history = "Automated reminders unanswered. Direct payment checkout link dispatched."

        else: # archetype 5
            # Critical overdue balance (85% - 100% of outstanding)
            overdue_float = round(random.uniform(0.85, 1.00) * outstanding_float, 2)
            overdue_amount = Decimal(str(overdue_float))
            current_due_amount = outstanding_amount - overdue_amount
            number_of_delayed_payments = random.randint(7, 14)
            average_payment_delay = random.randint(31, 60)
            payment_reliability = "Critical"
            next_due_date = today - timedelta(days=random.randint(36, 60))
            previous_payment_behavior = f"Credit Terms: {terms}. Severe chronic default risk. Multiple invoice payment cycles delinquent."
            recovery_history = "Escalated to management. Multiple payment demands pending."

        # 5. Explainable AI Risk Score & Level Calculation
        # Components:
        # - Credit utilization (30% weight)
        # - Overdue ratio (40% weight)
        # - Payment delay & reliability (15% weight)
        # - Segment factor (10% weight)
        # - Absolute overdue exposure scale (5% weight)
        utilization_ratio = outstanding_float / limit_float if limit_float > 0 else 0.0
        overdue_ratio = overdue_float / outstanding_float if outstanding_float > 0 else 0.0

        u_score = min(100.0, utilization_ratio * 100.0)
        o_score = min(100.0, overdue_ratio * 100.0)
        d_score = min(100.0, (average_payment_delay / 45.0) * 60.0 + (number_of_delayed_payments / 10.0) * 40.0)
        
        segment_weights = {
            "At Risk Customers": 80.0,
            "Dormant Customers": 50.0,
            "New Customers": 30.0,
            "Regular Customers": 20.0,
            "Loyal Customers": 10.0,
            "High Value Customers": 10.0
        }
        seg_score = segment_weights.get(segment, 25.0)
        exp_score = 85.0 if overdue_float > 400000.0 else (50.0 if overdue_float > 100000.0 else 15.0)

        raw_risk_score = (0.30 * u_score) + (0.40 * o_score) + (0.15 * d_score) + (0.10 * seg_score) + (0.05 * exp_score)
        # Add slight natural jitter (+/- 1.5)
        raw_risk_score += random.uniform(-1.5, 1.5)
        raw_risk_score = max(3.0, min(99.0, raw_risk_score))
        ai_risk_score = Decimal(str(round(raw_risk_score, 1)))

        # Determine AI Risk Level strictly from calculated score
        if raw_risk_score < 30.0:
            ai_risk_level = "Low"
            ai_recommended_action = "No Action"
            ai_recommended_reason = "Account is in excellent credit standing with zero overdue exposure."
            ai_risk_explanation = f"Healthy credit utilization of {utilization_ratio*100:.0f}% with {overdue_ratio*100:.0f}% overdue ratio. Payment reliability rating is High."
        elif raw_risk_score < 60.0:
            ai_risk_level = "Medium"
            ai_recommended_action = "Send Friendly Reminder"
            ai_recommended_reason = f"Upcoming / active dues of ₹{float(outstanding_amount):,.0f} with historical payment delay averaging {average_payment_delay} days."
            ai_risk_explanation = f"Moderate utilization of {utilization_ratio*100:.0f}% and overdue balance of ₹{overdue_float:,.0f}. Pre-emptive reminder recommended before due cycle."
        elif raw_risk_score < 80.0:
            ai_risk_level = "High"
            ai_recommended_action = "Send Payment Link"
            overdue_days = max(1, (today - next_due_date).days) if next_due_date and next_due_date < today else average_payment_delay
            ai_recommended_reason = f"Receivable of ₹{overdue_float:,.0f} is overdue by {overdue_days} days. Automated checkout link intervention needed."
            ai_risk_explanation = f"High overdue ratio of {overdue_ratio*100:.0f}% with ₹{overdue_float:,.0f} past due. Customer exhibits repeated payment delays averaging {average_payment_delay} days."
        else:
            ai_risk_level = "Critical"
            ai_recommended_action = "Suspend Credit & Escalate"
            overdue_days = max(1, (today - next_due_date).days) if next_due_date and next_due_date < today else average_payment_delay
            ai_recommended_reason = f"Severe chronic delinquency ({overdue_days} days overdue). Immediate credit limit freeze and senior escalation required."
            ai_risk_explanation = f"Critical risk with {overdue_ratio*100:.0f}% overdue ratio (₹{overdue_float:,.0f} overdue on ₹{limit_float:,.0f} limit) and {number_of_delayed_payments} historical delayed payments."

        # 6. Data Integrity Assertions
        assert credit_limit >= Decimal("0.0"), "Credit limit must be >= 0"
        assert Decimal("0.0") <= outstanding_amount <= credit_limit, f"Outstanding {outstanding_amount} must be <= Credit Limit {credit_limit}"
        assert Decimal("0.0") <= overdue_amount <= outstanding_amount, f"Overdue {overdue_amount} must be <= Outstanding {outstanding_amount}"
        assert current_due_amount == outstanding_amount - overdue_amount, "Current due must equal outstanding - overdue"
        assert Decimal("0.0") <= ai_risk_score <= Decimal("100.0"), "Risk score must be between 0 and 100"
        assert ai_risk_level in ["Low", "Medium", "High", "Critical"], "Risk level must be valid"

        db_customer = Customer(
            name=full_name,
            email=email,
            phone=phone,
            city=cust_city,
            total_spend=spend,
            segment=segment,
            last_purchase=purchase_date,
            user_id=current_user.id,
            credit_limit=credit_limit,
            total_credit_issued=total_credit_issued,
            total_amount_paid=total_amount_paid,
            outstanding_amount=outstanding_amount,
            current_due_amount=current_due_amount,
            overdue_amount=overdue_amount,
            next_due_date=next_due_date,
            number_of_delayed_payments=number_of_delayed_payments,
            average_payment_delay=average_payment_delay,
            payment_reliability=payment_reliability,
            previous_payment_behavior=previous_payment_behavior,
            recovery_history=recovery_history,
            ai_risk_score=ai_risk_score,
            ai_risk_level=ai_risk_level,
            ai_risk_explanation=ai_risk_explanation,
            ai_recommended_action=ai_recommended_action,
            ai_recommended_reason=ai_recommended_reason
        )
        new_customers.append(db_customer)

    db.add_all(new_customers)
    db.commit()
    return {"status": "success", "count": len(new_customers)}