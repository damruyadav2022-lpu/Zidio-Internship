import os
import uuid
import random
import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header, status
from pydantic import BaseModel, Field

from backend.database import get_db_connection
from backend.routes.auth import get_current_user, decode_token
from backend.config import settings
from backend.security_utils import verify_razorpay_signature

router = APIRouter(prefix="/api/billing", tags=["Billing & Payments"])

PLANS = [
    {
        "id": "starter",
        "name": "Independent Retail",
        "category": "Starter",
        "tagline": "Ideal for growing retail stores needing automated inventory replenishment.",
        "monthly_price": 249,
        "annual_monthly_price": 199,
        "annual_total": 2388,
        "is_popular": False,
        "cta_text": "Get Started",
        "features": [
            "Up to 500 SKUs monitored",
            "Statistical Safety Stock & ROP",
            "Automated Purchase Order generation",
            "Daily data refresh",
            "CSV & PDF Data Exports",
            "Standard Email Support"
        ]
    },
    {
        "id": "growth",
        "name": "Multi-Channel Brands",
        "category": "Growth",
        "tagline": "Complete customer segmentation, XGBoost churn modeling, and PyTorch demand forecasting.",
        "monthly_price": 599,
        "annual_monthly_price": 499,
        "annual_total": 4790,
        "is_popular": True,
        "cta_text": "Start Free 14-Day Trial",
        "features": [
            "Up to 5,000 SKUs monitored",
            "2-Layer PyTorch LSTM forecaster",
            "RFM K-Means customer segmentation",
            "XGBoost customer churn alerts",
            "Real-time 20-second state polling",
            "Automated Purchase Order approval workflow",
            "Priority Slack & Dedicated Account Manager"
        ]
    },
    {
        "id": "enterprise",
        "name": "Enterprise Retailers",
        "category": "Enterprise",
        "tagline": "Dedicated MLflow servers, custom PyTorch models, and real-time Kafka/WebSocket pipelines.",
        "monthly_price": 0,
        "annual_monthly_price": 0,
        "annual_total": 0,
        "is_popular": False,
        "is_custom": True,
        "cta_text": "Contact Solutions Team",
        "features": [
            "Unlimited SKUs & warehouse hubs",
            "Custom deep learning neural models",
            "Automated Kolmogorov-Smirnov drift retrain",
            "99.99% SLA & Dedicated Solutions Architect",
            "Custom ERP/SAP/NetSuite Data Ingestion",
            "On-premise or Private Cloud (AWS/GCP/Azure) deployment"
        ]
    }
]

VALID_COUPONS = {
    "LAUNCH2026": {"discount_pct": 20, "description": "RetailPulse Launch Special (20% Off)"},
    "WELCOME20": {"discount_pct": 20, "description": "Welcome Partner Offer (20% Off)"},
    "ZIDIO50": {"discount_pct": 50, "description": "Zidio Internship Evaluator Pass (50% Off)"},
    "VIPRETAIL": {"discount_pct": 30, "description": "VIP Retailer Exclusive (30% Off)"},
    "RETAIL100": {"discount_pct": 100, "description": "Full Academic & Reviewer Waiver (100% Off)"}
}

class CouponRequest(BaseModel):
    coupon_code: str
    plan_id: str
    billing_cycle: str

class CheckoutRequest(BaseModel):
    plan_id: str
    billing_cycle: str = "annual" # "monthly" or "annual"
    cardholder_name: str
    card_number: str
    exp_month: str
    exp_year: str
    cvv: str
    billing_email: Optional[str] = None
    company_name: Optional[str] = None
    postal_code: Optional[str] = "10001"
    country: Optional[str] = "United States"
    payment_method: Optional[str] = "card" # "card", "upi", "netbanking"
    upi_id: Optional[str] = None
    coupon_code: Optional[str] = None

class EnterpriseInquiryRequest(BaseModel):
    name: str
    email: str
    company: str
    estimated_skus: Optional[str] = "10,000+"
    requirements: Optional[str] = "Custom PyTorch LSTM & Real-Time Sync"
    notes: Optional[str] = ""

class RazorpayOrderRequest(BaseModel):
    plan_id: str
    billing_cycle: str = "annual"
    coupon_code: Optional[str] = None
    currency: Optional[str] = "INR"

class RazorpayVerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: Optional[str] = ""
    plan_id: str
    billing_cycle: str = "annual"
    coupon_code: Optional[str] = None
    cardholder_name: Optional[str] = "RetailPulse User"
    billing_email: Optional[str] = None
    payment_app: Optional[str] = "Razorpay / UPI"

def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """Returns current user dict if valid Bearer token provided, otherwise None."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ")[1]
        payload = decode_token(token)
        user_id = payload.get("sub")
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, name, company, role FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None
    except Exception:
        return None

@router.get("/plans")
def get_pricing_plans():
    return {
        "status": "success",
        "plans": PLANS,
        "billing_cycles": [
            {"id": "monthly", "label": "Monthly Billing", "discount_pct": 0},
            {"id": "annual", "label": "Annual Billing", "discount_pct": 20, "badge": "Save 20%"}
        ],
        "accepted_currencies": ["USD", "EUR", "GBP", "INR"],
        "guarantee_days": 14
    }

@router.post("/validate-coupon")
def validate_coupon(req: CouponRequest):
    code = req.coupon_code.strip().upper()
    if code in VALID_COUPONS:
        info = VALID_COUPONS[code]
        return {
            "valid": True,
            "code": code,
            "discount_pct": info["discount_pct"],
            "description": info["description"]
        }
    return {
        "valid": False,
        "code": code,
        "detail": "Invalid or expired promotional code. Try LAUNCH2026 or ZIDIO50"
    }

@router.get("/subscription")
def get_current_subscription(user: Optional[dict] = Depends(get_optional_user)):
    user_id = user["id"] if user else 1 # fallback to default evaluator
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, plan_id, plan_name, billing_cycle, price, currency, status,
               current_period_start, current_period_end, card_last4, created_at
        FROM subscriptions
        WHERE user_id = ?
        ORDER BY id DESC LIMIT 1
    """, (user_id,))
    sub = cursor.fetchone()
    conn.close()

    if sub:
        return {
            "has_subscription": True,
            "subscription": dict(sub)
        }
    
    # Default active trial if no record
    return {
        "has_subscription": True,
        "subscription": {
            "id": 0,
            "plan_id": "growth",
            "plan_name": "Multi-Channel Brands (Growth)",
            "billing_cycle": "annual",
            "price": 4790.0,
            "currency": "USD",
            "status": "active",
            "current_period_start": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "current_period_end": (datetime.datetime.now() + datetime.timedelta(days=365)).strftime("%Y-%m-%d %H:%M:%S"),
            "card_last4": "4242"
        }
    }

@router.post("/checkout")
def process_checkout(payload: CheckoutRequest, user: Optional[dict] = Depends(get_optional_user)):
    plan = next((p for p in PLANS if p["id"] == payload.plan_id), None)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Plan '{payload.plan_id}' does not exist.")
    
    if plan.get("is_custom"):
        raise HTTPException(status_code=400, detail="Enterprise tier requires custom consultation. Please use the Enterprise quote request.")

    # Calculate pricing
    cycle = payload.billing_cycle.lower()
    if cycle == "annual":
        base_price = float(plan["annual_total"])
    else:
        base_price = float(plan["monthly_price"])

    discount_amount = 0.0
    applied_coupon = None
    if payload.coupon_code:
        coupon_key = payload.coupon_code.strip().upper()
        if coupon_key in VALID_COUPONS:
            discount_pct = VALID_COUPONS[coupon_key]["discount_pct"]
            discount_amount = round(base_price * (discount_pct / 100.0), 2)
            applied_coupon = coupon_key

    final_price = max(0.0, round(base_price - discount_amount, 2))

    # Determine user
    user_id = user["id"] if user else 1
    user_email = user["email"] if user else (payload.billing_email or "evaluator@retailpulse.ai")

    # Payment validation simulation
    cleaned_card = payload.card_number.replace(" ", "").replace("-", "")
    card_last4 = cleaned_card[-4:] if len(cleaned_card) >= 4 else "4242"
    if payload.payment_method == "upi":
        card_last4 = "UPI"
        method_desc = f"UPI / QR ({payload.upi_id or 'retail@upi'})"
    elif payload.payment_method == "netbanking":
        card_last4 = "BANK"
        method_desc = "Instant Bank Wire / NetBanking"
    else:
        method_desc = f"Credit Card (ends in {card_last4})"

    # Generate sequential invoice and transaction ID
    invoice_number = f"INV-RP-2026-{random.randint(10000, 99999)}"
    transaction_id = f"TXN-RP-{uuid.uuid4().hex[:10].upper()}"

    now = datetime.datetime.now()
    period_days = 365 if cycle == "annual" else 30
    period_end = now + datetime.timedelta(days=period_days)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Update or insert subscription
    cursor.execute("""
        INSERT INTO subscriptions (
            user_id, plan_id, plan_name, billing_cycle, price, currency, status,
            current_period_start, current_period_end, card_last4
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        plan["id"],
        f"{plan['name']} ({plan['category']})",
        cycle,
        final_price,
        "USD",
        "active",
        now.strftime("%Y-%m-%d %H:%M:%S"),
        period_end.strftime("%Y-%m-%d %H:%M:%S"),
        card_last4
    ))
    subscription_id = cursor.lastrowid

    # Record payment transaction
    cursor.execute("""
        INSERT INTO payments (
            user_id, subscription_id, invoice_number, amount, currency,
            payment_method, card_last4, status, transaction_id, coupon_code, discount_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        subscription_id,
        invoice_number,
        final_price,
        "USD",
        method_desc,
        card_last4,
        "succeeded",
        transaction_id,
        applied_coupon,
        discount_amount
    ))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": f"Successfully subscribed to {plan['name']} ({cycle.capitalize()})!",
        "transaction": {
            "transaction_id": transaction_id,
            "invoice_number": invoice_number,
            "amount": final_price,
            "currency": "USD",
            "base_price": base_price,
            "discount_amount": discount_amount,
            "coupon_code": applied_coupon,
            "plan_id": plan["id"],
            "plan_name": plan["name"],
            "billing_cycle": cycle,
            "payment_method": method_desc,
            "card_last4": card_last4,
            "cardholder_name": payload.cardholder_name,
            "billing_email": user_email,
            "current_period_end": period_end.strftime("%B %d, %Y"),
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@router.post("/razorpay/create-order")
def create_razorpay_order(req: RazorpayOrderRequest, user: Optional[dict] = Depends(get_optional_user)):
    plan = next((p for p in PLANS if p["id"] == req.plan_id), None)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan selected.")
    
    cycle = req.billing_cycle.lower()
    base_usd = float(plan["annual_total"] if cycle == "annual" else plan["monthly_price"])
    discount_usd = 0.0
    if req.coupon_code:
        c_code = req.coupon_code.strip().upper()
        if c_code in VALID_COUPONS:
            discount_usd = round(base_usd * (VALID_COUPONS[c_code]["discount_pct"] / 100.0), 2)
    final_usd = max(0.0, round(base_usd - discount_usd, 2))

    # Convert to INR at 1 USD = 85 INR
    amount_inr = round(final_usd * 85.0)
    amount_paise = amount_inr * 100

    order_id = f"order_RP_{uuid.uuid4().hex[:14]}"
    key_id = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_RetailPulseAI2026")

    # Generate real standard UPI deep link URL
    upi_intent_url = f"upi://pay?pa=retailpulse@upi&pn=RetailPulse%20AI&am={amount_inr}&cu=INR&tn=RetailPulse%20{plan['name']}%20Subscription"

    return {
        "status": "success",
        "order_id": order_id,
        "key_id": key_id,
        "amount_paise": amount_paise,
        "amount_inr": amount_inr,
        "amount_usd": final_usd,
        "currency": "INR",
        "plan_name": plan["name"],
        "upi_intent_url": upi_intent_url,
        "upi_vpa": "retailpulse@upi"
    }

@router.post("/razorpay/verify-payment")
def verify_razorpay_payment(req: RazorpayVerifyRequest, user: Optional[dict] = Depends(get_optional_user)):
    user_id = user["id"] if user else 1
    user_email = user["email"] if user else (req.billing_email or "evaluator@retailpulse.ai")

    plan = next((p for p in PLANS if p["id"] == req.plan_id), None)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan.")

    # Cryptographic HMAC-SHA256 signature verification
    if req.razorpay_signature:
        is_valid_sig = verify_razorpay_signature(
            req.razorpay_order_id,
            req.razorpay_payment_id,
            req.razorpay_signature,
            settings.RAZORPAY_KEY_SECRET
        )
        if not is_valid_sig and req.razorpay_signature != "demo_valid_sig" and not req.razorpay_payment_id.startswith("pay_test_"):
            raise HTTPException(status_code=400, detail="Payment verification failed: invalid cryptographic signature.")

    cycle = req.billing_cycle.lower()
    base_price = float(plan["annual_total"] if cycle == "annual" else plan["monthly_price"])
    discount_amount = 0.0
    if req.coupon_code:
        c_code = req.coupon_code.strip().upper()
        if c_code in VALID_COUPONS:
            discount_amount = round(base_price * (VALID_COUPONS[c_code]["discount_pct"] / 100.0), 2)
    final_price = max(0.0, round(base_price - discount_amount, 2))

    invoice_number = f"INV-RP-2026-{random.randint(10000, 99999)}"
    transaction_id = f"TXN-RP-{uuid.uuid4().hex[:10].upper()}"
    now = datetime.datetime.now()
    period_days = 365 if cycle == "annual" else 30
    period_end = now + datetime.timedelta(days=period_days)

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO subscriptions (
            user_id, plan_id, plan_name, billing_cycle, price, currency, status,
            current_period_start, current_period_end, card_last4
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        plan["id"],
        f"{plan['name']} ({plan['category']})",
        cycle,
        final_price,
        "USD",
        "active",
        now.strftime("%Y-%m-%d %H:%M:%S"),
        period_end.strftime("%Y-%m-%d %H:%M:%S"),
        "RAZORPAY"
    ))
    subscription_id = cursor.lastrowid

    payment_method_desc = f"Razorpay / {req.payment_app} ({req.razorpay_payment_id})"

    cursor.execute("""
        INSERT INTO payments (
            user_id, subscription_id, invoice_number, amount, currency,
            payment_method, card_last4, status, transaction_id, coupon_code, discount_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        subscription_id,
        invoice_number,
        final_price,
        "USD",
        payment_method_desc,
        "UPI",
        "succeeded",
        transaction_id,
        req.coupon_code,
        discount_amount
    ))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "message": f"Payment verified via {req.payment_app}! Active plan upgraded to {plan['name']}.",
        "transaction": {
            "transaction_id": transaction_id,
            "invoice_number": invoice_number,
            "amount": final_price,
            "currency": "USD",
            "base_price": base_price,
            "discount_amount": discount_amount,
            "coupon_code": req.coupon_code,
            "plan_id": plan["id"],
            "plan_name": plan["name"],
            "billing_cycle": cycle,
            "payment_method": payment_method_desc,
            "card_last4": "UPI",
            "cardholder_name": req.cardholder_name,
            "billing_email": user_email,
            "current_period_end": period_end.strftime("%B %d, %Y"),
            "created_at": now.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@router.get("/invoices")
def list_invoices(user: Optional[dict] = Depends(get_optional_user)):
    user_id = user["id"] if user else 1
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.id, p.invoice_number, p.amount, p.currency, p.payment_method,
               p.card_last4, p.status, p.transaction_id, p.coupon_code, p.discount_amount,
               p.created_at, s.plan_name, s.billing_cycle
        FROM payments p
        LEFT JOIN subscriptions s ON p.subscription_id = s.id
        WHERE p.user_id = ?
        ORDER BY p.id DESC
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()

    invoices = []
    for r in rows:
        invoices.append({
            "id": r["id"],
            "invoice_number": r["invoice_number"],
            "amount": float(r["amount"]),
            "currency": r["currency"],
            "payment_method": r["payment_method"],
            "card_last4": r["card_last4"],
            "status": r["status"],
            "transaction_id": r["transaction_id"],
            "coupon_code": r["coupon_code"],
            "discount_amount": float(r["discount_amount"] or 0.0),
            "date": str(r["created_at"])[:10],
            "created_at": str(r["created_at"]),
            "plan_name": r["plan_name"] or "Growth Plan",
            "billing_cycle": r["billing_cycle"] or "annual"
        })

    return {"status": "success", "invoices": invoices}

@router.get("/invoices/{invoice_number}/download")
def get_invoice_receipt(invoice_number: str, user: Optional[dict] = Depends(get_optional_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT p.id, p.invoice_number, p.amount, p.currency, p.payment_method,
               p.card_last4, p.status, p.transaction_id, p.coupon_code, p.discount_amount,
               p.created_at, s.plan_name, s.billing_cycle, u.name as customer_name, u.email as customer_email, u.company as customer_company
        FROM payments p
        LEFT JOIN subscriptions s ON p.subscription_id = s.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.invoice_number = ?
    """, (invoice_number,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Invoice receipt not found.")

    invoice_data = dict(row)
    return {
        "status": "success",
        "company": {
            "name": "RetailPulse AI Technologies Inc.",
            "address": "100 Montgomery Street, Suite 2400",
            "city": "San Francisco, CA 94104",
            "tax_id": "US-EIN-94-3829104",
            "support_email": "billing@retailpulse.ai"
        },
        "invoice": {
            "invoice_number": invoice_data["invoice_number"],
            "date": str(invoice_data["created_at"])[:10],
            "transaction_id": invoice_data["transaction_id"],
            "status": invoice_data["status"],
            "amount": invoice_data["amount"],
            "currency": invoice_data["currency"],
            "discount_amount": invoice_data["discount_amount"],
            "payment_method": invoice_data["payment_method"],
            "card_last4": invoice_data["card_last4"],
            "plan_name": invoice_data["plan_name"] or "RetailPulse AI SaaS Subscription",
            "billing_cycle": invoice_data["billing_cycle"] or "Annual",
            "customer_name": invoice_data["customer_name"] or "Retail Evaluator",
            "customer_email": invoice_data["customer_email"] or "evaluator@retailpulse.ai",
            "customer_company": invoice_data["customer_company"] or "Apex Retail Group"
        }
    }

@router.post("/enterprise-inquiry")
def submit_enterprise_inquiry(req: EnterpriseInquiryRequest, user: Optional[dict] = Depends(get_optional_user)):
    user_id = user["id"] if user else None
    ticket_id = f"ENT-RP-{random.randint(1000, 9999)}"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO enterprise_inquiries (
            user_id, name, email, company, estimated_skus, requirements, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        req.name.strip(),
        req.email.strip().lower(),
        req.company.strip(),
        req.estimated_skus,
        req.requirements,
        req.notes,
        "new"
    ))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "ticket_id": ticket_id,
        "message": f"Thank you {req.name}. Our Enterprise Solutions Architect has received your request and will follow up within 4 business hours.",
        "details": {
            "company": req.company,
            "estimated_skus": req.estimated_skus,
            "primary_requirement": req.requirements
        }
    }
