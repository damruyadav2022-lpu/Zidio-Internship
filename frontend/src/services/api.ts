/**
 * Centralized API & Service Abstraction Layer
 * Handles communication with FastAPI backend while offering deterministic fallback to demo dataset.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '';

// Local state for demo mode toggle
let isDemoMode = false;

export function getIsDemoMode(): boolean {
  const stored = localStorage.getItem('retailpulse_demo_mode');
  if (stored !== null) {
    return stored === 'true';
  }
  return isDemoMode;
}

export function setIsDemoMode(enabled: boolean): void {
  isDemoMode = enabled;
  localStorage.setItem('retailpulse_demo_mode', enabled ? 'true' : 'false');
  window.dispatchEvent(new Event('retailpulse_mode_changed'));
}

export async function request<T>(endpoint: string, options: RequestInit = {}, fallbackData?: T): Promise<T> {
  // If explicitly in demo mode and fallback is available, return immediately
  if (getIsDemoMode() && fallbackData !== undefined) {
    await new Promise(resolve => setTimeout(resolve, 150)); // subtle network feel
    return fallbackData;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const token = localStorage.getItem('retailpulse_token');
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error: any) {
    if (getIsDemoMode() && fallbackData !== undefined) {
      console.warn(`[RetailPulse Demo Mode] Using demo fallback for ${endpoint}`);
      return fallbackData;
    }
    console.error(`[RetailPulse API Error] Request to ${endpoint} failed:`, error?.message || error);
    throw error;
  }
}

// ==================== BILLING & PAYMENT SERVICES ====================
import { 
  SubscriptionPlan, 
  UserSubscription, 
  CheckoutPayload, 
  TransactionConfirmation, 
  InvoiceRecord, 
  InvoiceReceiptDetails, 
  EnterpriseInquiryPayload 
} from '../types';

export async function getBillingPlans(): Promise<{ plans: SubscriptionPlan[]; billing_cycles: any[] }> {
  const fallback = {
    plans: [
      {
        id: 'starter',
        name: 'Independent Retail',
        category: 'Starter',
        tagline: 'Ideal for growing retail stores needing automated inventory replenishment.',
        monthly_price: 249,
        annual_monthly_price: 199,
        annual_total: 2388,
        is_popular: false,
        cta_text: 'Get Started',
        features: [
          'Up to 500 SKUs monitored',
          'Statistical Safety Stock & ROP',
          'Automated Purchase Order generation',
          'Daily data refresh',
          'CSV & PDF Data Exports',
          'Standard Email Support'
        ]
      },
      {
        id: 'growth',
        name: 'Multi-Channel Brands',
        category: 'Growth',
        tagline: 'Complete customer segmentation, XGBoost churn modeling, and PyTorch demand forecasting.',
        monthly_price: 599,
        annual_monthly_price: 499,
        annual_total: 4790,
        is_popular: true,
        cta_text: 'Start Free 14-Day Trial',
        features: [
          'Up to 5,000 SKUs monitored',
          '2-Layer PyTorch LSTM forecaster',
          'RFM K-Means customer segmentation',
          'XGBoost customer churn alerts',
          'Real-time 20-second state polling',
          'Automated Purchase Order approval workflow',
          'Priority Slack & Dedicated Account Manager'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise Retailers',
        category: 'Enterprise',
        tagline: 'Dedicated MLflow servers, custom PyTorch models, and real-time Kafka/WebSocket pipelines.',
        monthly_price: 0,
        annual_monthly_price: 0,
        annual_total: 0,
        is_popular: false,
        is_custom: true,
        cta_text: 'Contact Solutions Team',
        features: [
          'Unlimited SKUs & warehouse hubs',
          'Custom deep learning neural models',
          'Automated Kolmogorov-Smirnov drift retrain',
          '99.99% SLA & Dedicated Solutions Architect',
          'Custom ERP/SAP/NetSuite Data Ingestion',
          'On-premise or Private Cloud (AWS/GCP/Azure) deployment'
        ]
      }
    ],
    billing_cycles: [
      { id: 'monthly', label: 'Monthly Billing', discount_pct: 0 },
      { id: 'annual', label: 'Annual Billing', discount_pct: 20, badge: 'Save 20%' }
    ]
  };

  return request('/api/billing/plans', { method: 'GET' }, fallback);
}

export async function validatePromoCoupon(coupon_code: string, plan_id: string, billing_cycle: string) {
  return request<{ valid: boolean; code?: string; discount_pct?: number; description?: string; detail?: string }>(
    '/api/billing/validate-coupon',
    {
      method: 'POST',
      body: JSON.stringify({ coupon_code, plan_id, billing_cycle }),
    },
    {
      valid: ['LAUNCH2026', 'WELCOME20', 'ZIDIO50', 'RETAIL100'].includes(coupon_code.trim().toUpperCase()),
      code: coupon_code.trim().toUpperCase(),
      discount_pct: coupon_code.trim().toUpperCase() === 'ZIDIO50' ? 50 : 20,
      description: 'Promotional Evaluation Discount'
    }
  );
}

export async function getCurrentSubscription(): Promise<{ has_subscription: boolean; subscription: UserSubscription }> {
  const fallback = {
    has_subscription: true,
    subscription: {
      id: 1,
      plan_id: 'growth',
      plan_name: 'Multi-Channel Brands (Growth)',
      billing_cycle: 'annual' as const,
      price: 4790.0,
      currency: 'USD',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
      card_last4: '4242'
    }
  };

  return request('/api/billing/subscription', { method: 'GET' }, fallback);
}

export async function processCheckout(payload: CheckoutPayload): Promise<{ status: string; message: string; transaction: TransactionConfirmation }> {
  const isAnnual = payload.billing_cycle === 'annual';
  const basePrice = payload.plan_id === 'starter' ? (isAnnual ? 2388 : 249) : (isAnnual ? 4790 : 599);
  const discount = payload.coupon_code ? (payload.coupon_code.toUpperCase().includes('50') ? basePrice * 0.5 : basePrice * 0.2) : 0;
  const finalPrice = Math.max(0, basePrice - discount);

  const fallback: { status: string; message: string; transaction: TransactionConfirmation } = {
    status: 'success',
    message: 'Subscription successfully activated!',
    transaction: {
      transaction_id: `TXN-RP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      invoice_number: `INV-RP-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      amount: finalPrice,
      currency: 'USD',
      base_price: basePrice,
      discount_amount: discount,
      coupon_code: payload.coupon_code,
      plan_id: payload.plan_id,
      plan_name: payload.plan_id === 'starter' ? 'Independent Retail (Starter)' : 'Multi-Channel Brands (Growth)',
      billing_cycle: payload.billing_cycle,
      payment_method: payload.payment_method === 'upi' ? `UPI (${payload.upi_id || 'retail@upi'})` : `Credit Card (ends in ${payload.card_number.slice(-4) || '4242'})`,
      card_last4: payload.card_number.slice(-4) || '4242',
      cardholder_name: payload.cardholder_name,
      billing_email: payload.billing_email || 'evaluator@retailpulse.ai',
      current_period_end: new Date(Date.now() + (isAnnual ? 365 : 30) * 86400000).toLocaleDateString(),
      created_at: new Date().toLocaleString()
    }
  };

  return request('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, fallback);
}

export async function getInvoices(): Promise<{ status: string; invoices: InvoiceRecord[] }> {
  const fallback = {
    status: 'success',
    invoices: [
      {
        id: 1,
        invoice_number: 'INV-RP-2026-00412',
        amount: 4790.0,
        currency: 'USD',
        payment_method: 'Credit Card (Visa)',
        card_last4: '4242',
        status: 'succeeded',
        transaction_id: 'TXN-RP-98432176',
        coupon_code: 'LAUNCH2026',
        discount_amount: 1198.0,
        date: new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10),
        created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
        plan_name: 'Multi-Channel Brands (Growth)',
        billing_cycle: 'annual'
      }
    ]
  };

  return request('/api/billing/invoices', { method: 'GET' }, fallback);
}

export async function getInvoiceReceipt(invoice_number: string): Promise<InvoiceReceiptDetails> {
  const fallback: InvoiceReceiptDetails = {
    company: {
      name: 'RetailPulse AI Technologies Inc.',
      address: '100 Montgomery Street, Suite 2400',
      city: 'San Francisco, CA 94104',
      tax_id: 'US-EIN-94-3829104',
      support_email: 'billing@retailpulse.ai'
    },
    invoice: {
      invoice_number: invoice_number || 'INV-RP-2026-00412',
      date: new Date().toISOString().slice(0, 10),
      transaction_id: 'TXN-RP-98432176',
      status: 'succeeded',
      amount: 4790.0,
      currency: 'USD',
      discount_amount: 1198.0,
      payment_method: 'Credit Card (Visa)',
      card_last4: '4242',
      plan_name: 'Multi-Channel Brands (Growth)',
      billing_cycle: 'Annual',
      customer_name: 'Retail Evaluator',
      customer_email: 'evaluator@retailpulse.ai',
      customer_company: 'Apex Retail Group'
    }
  };

  return request(`/api/billing/invoices/${invoice_number}/download`, { method: 'GET' }, fallback);
}

export async function submitEnterpriseInquiry(payload: EnterpriseInquiryPayload): Promise<{ status: string; ticket_id: string; message: string }> {
  const fallback = {
    status: 'success',
    ticket_id: `ENT-RP-${Math.floor(1000 + Math.random() * 9000)}`,
    message: `Thank you ${payload.name}. Our Enterprise Solutions Architect will follow up within 4 business hours.`
  };

  return request('/api/billing/enterprise-inquiry', {
    method: 'POST',
    body: JSON.stringify(payload)
  }, fallback);
}

export interface RazorpayOrderResponse {
  status: string;
  order_id: string;
  key_id: string;
  amount_paise: number;
  amount_inr: number;
  amount_usd: number;
  currency: string;
  plan_name: string;
  upi_intent_url: string;
  upi_vpa: string;
}

export async function createRazorpayOrder(plan_id: string, billing_cycle: string, coupon_code?: string): Promise<RazorpayOrderResponse> {
  const isAnnual = billing_cycle === 'annual';
  const usd = plan_id === 'starter' ? (isAnnual ? 2388 : 249) : (isAnnual ? 4790 : 599);
  const inr = Math.round(usd * 85);
  const fallback: RazorpayOrderResponse = {
    status: 'success',
    order_id: `order_RP_${Math.random().toString(36).substring(2, 12)}`,
    key_id: 'rzp_test_RetailPulseAI2026',
    amount_paise: inr * 100,
    amount_inr: inr,
    amount_usd: usd,
    currency: 'INR',
    plan_name: plan_id === 'starter' ? 'Independent Retail (Starter)' : 'Multi-Channel Brands (Growth)',
    upi_intent_url: `upi://pay?pa=retailpulse@upi&pn=RetailPulse%20AI&am=${inr}&cu=INR&tn=RetailPulse%20Subscription`,
    upi_vpa: 'retailpulse@upi'
  };

  return request('/api/billing/razorpay/create-order', {
    method: 'POST',
    body: JSON.stringify({ plan_id, billing_cycle, coupon_code, currency: 'INR' })
  }, fallback);
}

export async function verifyRazorpayPayment(payload: {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature?: string;
  plan_id: string;
  billing_cycle: string;
  coupon_code?: string;
  cardholder_name?: string;
  billing_email?: string;
  payment_app?: string;
}): Promise<{ status: string; message: string; transaction: TransactionConfirmation }> {
  return request('/api/billing/razorpay/verify-payment', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

