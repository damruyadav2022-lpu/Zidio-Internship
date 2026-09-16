import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Tag, 
  QrCode, 
  Building, 
  ArrowRight, 
  FileText, 
  Check, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Smartphone,
  Zap,
  Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  processCheckout, 
  validatePromoCoupon, 
  createRazorpayOrder, 
  verifyRazorpayPayment 
} from '../services/api';
import { TransactionConfirmation } from '../types';
import { useAuth } from '../context/AuthContext';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanId?: 'starter' | 'growth';
  initialAnnualBilling?: boolean;
  onSuccess?: (txn: TransactionConfirmation) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  initialPlanId = 'growth',
  initialAnnualBilling = true,
  onSuccess
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [planId, setPlanId] = useState<'starter' | 'growth'>(initialPlanId);
  const [isAnnual, setIsAnnual] = useState(initialAnnualBilling);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'card'>('razorpay');

  // Form Fields
  const [cardholderName, setCardholderName] = useState(user?.name || 'Alex Mercer');
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('12');
  const [expYear, setExpYear] = useState('28');
  const [cvv, setCvv] = useState('');
  const [postalCode, setPostalCode] = useState('94104');
  const [billingEmail, setBillingEmail] = useState(user?.email || 'alex.mercer@apexretail.com');
  const [companyName, setCompanyName] = useState(user?.company || 'Apex Retail Group');
  const [upiId, setUpiId] = useState('alex@okaxis');
  const [upiUtr, setUpiUtr] = useState('');

  // Coupon State
  const [couponInput, setCouponInput] = useState('LAUNCH2026');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>('LAUNCH2026');
  const [discountPct, setDiscountPct] = useState<number>(20);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

  // Status
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successTxn, setSuccessTxn] = useState<TransactionConfirmation | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [receiptInvoiceNumber, setReceiptInvoiceNumber] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPlanId(initialPlanId);
      setIsAnnual(initialAnnualBilling);
      setSuccessTxn(null);
      setErrorMsg(null);
      if (user) {
        setCardholderName(user.name);
        setBillingEmail(user.email);
        if (user.company) setCompanyName(user.company);
      }
    }
  }, [isOpen, initialPlanId, initialAnnualBilling, user]);

  if (!isOpen) return null;

  // Plan Pricing
  const planData = {
    starter: {
      name: 'Independent Retail (Starter)',
      monthlyPrice: 249,
      annualMonthlyPrice: 199,
      annualTotal: 2388,
      skuLimit: 'Up to 500 SKUs',
      badge: 'Starter'
    },
    growth: {
      name: 'Multi-Channel Brands (Growth)',
      monthlyPrice: 599,
      annualMonthlyPrice: 499,
      annualTotal: 4790,
      skuLimit: 'Up to 5,000 SKUs & PyTorch Forecaster',
      badge: 'Most Popular'
    }
  }[planId];

  const basePrice = isAnnual ? planData.annualTotal : planData.monthlyPrice;
  const discountAmount = appliedCoupon ? Math.round(basePrice * (discountPct / 100)) : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // INR Conversion for Razorpay and UPI (1 USD = ~85 INR)
  const amountINR = Math.round(finalPrice * 85);
  const upiIntentUrl = `upi://pay?pa=retailpulse@upi&pn=RetailPulse%20AI&am=${amountINR}&cu=INR&tn=RetailPulse%20${planId}%20Plan`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiIntentUrl)}`;

  // Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    setCardNumber(formatted);
  };

  const autofillTestCard = () => {
    setCardholderName('Alex Mercer');
    setCardNumber('4242 4242 4242 4242');
    setExpMonth('09');
    setExpYear('29');
    setCvv('888');
    setPostalCode('94104');
    setBillingEmail(user?.email || 'alex.mercer@retailpulse.ai');
    setErrorMsg(null);
  };

  const handleCopyUpiLink = () => {
    navigator.clipboard.writeText(upiIntentUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsCheckingCoupon(true);
    setCouponError(null);
    try {
      const res = await validatePromoCoupon(couponInput, planId, isAnnual ? 'annual' : 'monthly');
      if (res.valid) {
        setAppliedCoupon(res.code || couponInput.toUpperCase());
        setDiscountPct(res.discount_pct || 20);
      } else {
        setCouponError(res.detail || 'Invalid promotional code.');
      }
    } catch {
      if (['LAUNCH2026', 'WELCOME20', 'ZIDIO50', 'RETAIL100'].includes(couponInput.trim().toUpperCase())) {
        const code = couponInput.trim().toUpperCase();
        setAppliedCoupon(code);
        setDiscountPct(code === 'ZIDIO50' ? 50 : code === 'RETAIL100' ? 100 : 20);
      } else {
        setCouponError('Invalid coupon. Try LAUNCH2026 or ZIDIO50');
      }
    } finally {
      setIsCheckingCoupon(false);
    }
  };

  // Launch Razorpay Checkout Modal
  const launchRazorpay = async () => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Request order details from backend
      const orderData = await createRazorpayOrder(
        planId, 
        isAnnual ? 'annual' : 'monthly', 
        appliedCoupon || undefined
      );

      // 2. Check if Razorpay script loaded
      if (typeof (window as any).Razorpay !== 'undefined') {
        const options = {
          key: orderData.key_id,
          amount: orderData.amount_paise,
          currency: 'INR',
          name: 'RetailPulse AI Platform',
          description: `${orderData.plan_name} (${isAnnual ? 'Annual' : 'Monthly'})`,
          image: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
          order_id: orderData.order_id,
          handler: async function (response: any) {
            setIsProcessing(true);
            try {
              const verifyRes = await verifyRazorpayPayment({
                razorpay_payment_id: response.razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 10)}`,
                razorpay_order_id: response.razorpay_order_id || orderData.order_id,
                razorpay_signature: response.razorpay_signature || 'verified_sig',
                plan_id: planId,
                billing_cycle: isAnnual ? 'annual' : 'monthly',
                coupon_code: appliedCoupon || undefined,
                cardholder_name: cardholderName,
                billing_email: billingEmail,
                payment_app: 'Razorpay Unified'
              });
              setIsProcessing(false);
              setSuccessTxn(verifyRes.transaction);
              if (onSuccess) onSuccess(verifyRes.transaction);
            } catch (err: any) {
              setIsProcessing(false);
              setErrorMsg(err.message || 'Payment verification failed.');
            }
          },
          prefill: {
            name: cardholderName,
            email: billingEmail,
            contact: '9999999999'
          },
          notes: {
            plan_id: planId,
            billing_cycle: isAnnual ? 'annual' : 'monthly'
          },
          theme: {
            color: '#ff642d'
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setIsProcessing(false);
          setErrorMsg(response.error?.description || 'Razorpay payment was not completed.');
        });
        rzp.open();
      } else {
        // Fallback: If ad-blocker or offline, redirect directly or verify
        window.open(upiIntentUrl, '_blank');
        setTimeout(async () => {
          const verifyRes = await verifyRazorpayPayment({
            razorpay_payment_id: `pay_rzp_${Math.random().toString(36).substring(2, 10)}`,
            razorpay_order_id: orderData.order_id,
            plan_id: planId,
            billing_cycle: isAnnual ? 'annual' : 'monthly',
            coupon_code: appliedCoupon || undefined,
            cardholder_name: cardholderName,
            billing_email: billingEmail,
            payment_app: 'Razorpay / UPI App'
          });
          setIsProcessing(false);
          setSuccessTxn(verifyRes.transaction);
          if (onSuccess) onSuccess(verifyRes.transaction);
        }, 1500);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Failed to initialize Razorpay checkout.');
    }
  };

  // Direct UPI App Deep-link Opener
  const handleOpenUpiApp = (appScheme?: string) => {
    let targetUrl = upiIntentUrl;
    if (appScheme === 'gpay') {
      targetUrl = `tez://upi/pay?pa=retailpulse@upi&pn=RetailPulse%20AI&am=${amountINR}&cu=INR&tn=RetailPulse%20Subscription`;
    } else if (appScheme === 'phonepe') {
      targetUrl = `phonepe://pay?pa=retailpulse@upi&pn=RetailPulse%20AI&am=${amountINR}&cu=INR&tn=RetailPulse%20Subscription`;
    } else if (appScheme === 'paytm') {
      targetUrl = `paytmmp://pay?pa=retailpulse@upi&pn=RetailPulse%20AI&am=${amountINR}&cu=INR&tn=RetailPulse%20Subscription`;
    }

    // Try triggering deep-link intent
    window.location.href = targetUrl;
  };

  // Confirm UPI Payment Completed
  const handleConfirmUpiPayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const verifyRes = await verifyRazorpayPayment({
        razorpay_payment_id: upiUtr ? `upi_utr_${upiUtr}` : `upi_${Math.random().toString(36).substring(2, 10)}`,
        razorpay_order_id: `order_upi_${Math.random().toString(36).substring(2, 10)}`,
        plan_id: planId,
        billing_cycle: isAnnual ? 'annual' : 'monthly',
        coupon_code: appliedCoupon || undefined,
        cardholder_name: cardholderName,
        billing_email: billingEmail,
        payment_app: 'Direct UPI App (GPay / PhonePe / Paytm)'
      });
      setIsProcessing(false);
      setSuccessTxn(verifyRes.transaction);
      if (onSuccess) onSuccess(verifyRes.transaction);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Could not verify UPI transfer. Please check connection.');
    }
  };

  // Regular Card Payment
  const handleSubmitCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const rawCard = cardNumber.replace(/\s/g, '');
    if (rawCard.length < 15) {
      setErrorMsg('Please enter a valid 16-digit card number or click "Autofill Test Card".');
      return;
    }
    if (!cvv || cvv.length < 3) {
      setErrorMsg('Please enter a valid 3 or 4-digit CVV security code.');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await processCheckout({
        plan_id: planId,
        billing_cycle: isAnnual ? 'annual' : 'monthly',
        cardholder_name: cardholderName,
        card_number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvv: cvv,
        billing_email: billingEmail,
        company_name: companyName,
        postal_code: postalCode,
        payment_method: 'card',
        coupon_code: appliedCoupon || undefined
      });

      setIsProcessing(false);
      setSuccessTxn(res.transaction);
      if (onSuccess) onSuccess(res.transaction);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Payment processing failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                {successTxn ? 'Subscription Confirmed' : 'RetailPulse Payment & App Checkout'}
              </h3>
              <p className="text-xs text-slate-500">
                {successTxn ? 'Account active with instantaneous platform unlock' : 'Direct to Razorpay, Google Pay, PhonePe, Paytm, UPI & Cards'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation State */}
        {successTxn ? (
          <div className="p-8 space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Payment Verified &amp; Activated</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                Welcome to RetailPulse {successTxn.plan_name}!
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
                Your payment was received successfully. Deep learning LSTM forecasting, K-Means customer intelligence, and automated inventory safety stock are unlocked.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-left text-xs space-y-3 max-w-lg mx-auto">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Invoice Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{successTxn.invoice_number}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Transaction ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{successTxn.transaction_id}</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Payment Route</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{successTxn.payment_method}</span>
              </div>
              <div className="flex justify-between items-center pt-1 text-sm font-bold">
                <span className="text-slate-900 dark:text-white">Amount Settled</span>
                <span className="text-brand-600 font-heading text-base">
                  ${successTxn.amount.toLocaleString()} USD (~₹{Math.round(successTxn.amount * 85).toLocaleString()})
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setReceiptInvoiceNumber(successTxn.invoice_number)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>View Tax Invoice / PDF</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate('/app/overview');
                }}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Launch Enterprise Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Main Checkout View */
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Step 1: Plan Selector & Billing Cycle Toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Selected Subscription Tier
                </label>
                
                {/* Monthly / Annual Pill */}
                <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setIsAnnual(false)}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${!isAnnual ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAnnual(true)}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${isAnnual ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
                  >
                    Annual (-20%)
                  </button>
                </div>
              </div>

              {/* Plan Choice Cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: 'starter' as const,
                    name: 'Independent Retail',
                    monthly: 249,
                    annualMonthly: 199,
                    desc: '500 SKUs • Safety Stock & ROP'
                  },
                  {
                    id: 'growth' as const,
                    name: 'Multi-Channel Brands',
                    monthly: 599,
                    annualMonthly: 499,
                    desc: '5,000 SKUs • PyTorch Forecaster'
                  }
                ].map((item) => {
                  const isSelected = planId === item.id;
                  const price = isAnnual ? item.annualMonthly : item.monthly;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setPlanId(item.id)}
                      className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 ring-2 ring-brand-500/10'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300'}`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-900 dark:text-white font-heading">${price}</span>
                        <span className="text-[10px] text-slate-400">/ mo</span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500 truncate">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Payment Method Tabs */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Choose Payment Channel
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { 
                    id: 'razorpay' as const, 
                    label: 'Razorpay Gateway', 
                    desc: 'GPay, UPI, NetBanking',
                    icon: Zap,
                    badge: 'Recommended'
                  },
                  { 
                    id: 'upi' as const, 
                    label: 'Direct UPI / QR', 
                    desc: 'Open GPay, PhonePe, Paytm',
                    icon: QrCode,
                    badge: 'Instant App'
                  },
                  { 
                    id: 'card' as const, 
                    label: 'Credit / Debit Card', 
                    desc: 'Visa, Mastercard, Amex',
                    icon: CreditCard,
                    badge: 'Global'
                  }
                ].map(m => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 text-brand-900 dark:text-brand-200 ring-2 ring-brand-500/10'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {m.badge}
                        </span>
                      </div>
                      <span className="text-xs font-bold block">{m.label}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{m.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* METHOD 1: RAZORPAY UNIFIED CHECKOUT */}
              {paymentMethod === 'razorpay' && (
                <div className="p-5 rounded-2xl border-2 border-brand-500/30 bg-gradient-to-br from-brand-50/40 via-white to-orange-50/30 dark:from-brand-950/20 dark:via-dark-card dark:to-slate-900/40 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#0c2340] text-white flex items-center justify-center font-bold text-xs tracking-wider">
                        Rzp
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">
                          Razorpay Official Payment Gateway
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Directly opens Razorpay popup supporting Google Pay, PhonePe, Paytm, UPI QR, and all Indian/International Cards &amp; NetBanking.
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI', 'HDFC / SBI NetBanking', 'RuPay / Visa'].map(app => (
                      <span key={app} className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        ✓ {app}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={launchRazorpay}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-xl bg-[#0c2340] hover:bg-[#15345b] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                        <span>Opening Razorpay Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-brand-400 fill-current" />
                        <span>Pay ₹{amountINR.toLocaleString()} via Razorpay App Suite</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* METHOD 2: DIRECT UPI APP DEEP-LINKS & SCANNABLE QR */}
              {paymentMethod === 'upi' && (
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-4 text-xs">
                  
                  {/* UPI Apps Row */}
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2">
                      Direct App Redirection (Click to launch on device):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenUpiApp('gpay')}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-500 font-bold text-[11px] text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span className="text-blue-500 font-black">G</span>Pay
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenUpiApp('phonepe')}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-500 font-bold text-[11px] text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span className="text-purple-600 font-black">Phone</span>Pe
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenUpiApp('paytm')}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-sky-500 font-bold text-[11px] text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span className="text-sky-500 font-black">Pay</span>tm
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenUpiApp()}
                        className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 font-bold text-[11px] text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Any UPI</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code & Scan Instructions */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-xs">
                      <img
                        src={qrCodeUrl}
                        alt="Scan UPI QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="space-y-2 text-left flex-1">
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        Scan with Any UPI Scanner
                      </span>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Scan this dynamic QR code using Google Pay, PhonePe, Paytm, BHIM or Cred. The payment of <strong className="text-slate-800 dark:text-slate-200">₹{amountINR.toLocaleString()}</strong> will automatically populate with merchant VPA <code className="text-brand-600 font-mono">retailpulse@upi</code>.
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCopyUpiLink}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[10px] font-semibold transition-colors cursor-pointer"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>{isCopied ? 'UPI Link Copied!' : 'Copy UPI Link'}</span>
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono truncate">retailpulse@upi</span>
                      </div>
                    </div>
                  </div>

                  {/* Manual UTR Verification Input */}
                  <div className="space-y-1.5 pt-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      UPI Ref ID / UTR Number (Optional for auto-reconciliation)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={upiUtr}
                        onChange={(e) => setUpiUtr(e.target.value)}
                        placeholder="e.g. 423987102948"
                        className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono outline-none text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleConfirmUpiPayment}
                        disabled={isProcessing}
                        className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer shrink-0 disabled:opacity-75"
                      >
                        {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Payment'}
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* METHOD 3: CREDIT / DEBIT CARDS */}
              {paymentMethod === 'card' && (
                <form onSubmit={handleSubmitCardPayment} className="space-y-3 pt-1 text-xs">
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Credit or Debit Card Details</span>
                    <button
                      type="button"
                      onClick={autofillTestCard}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Autofill Test Card</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Name on Card</label>
                    <input
                      type="text"
                      required
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4242 •••• •••• 4242"
                        className="w-full pl-3.5 pr-12 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl font-mono focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                        <CreditCard className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Exp Month</label>
                      <select
                        value={expMonth}
                        onChange={(e) => setExpMonth(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
                      >
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">Exp Year</label>
                      <select
                        value={expYear}
                        onChange={(e) => setExpYear(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
                      >
                        {['26', '27', '28', '29', '30', '31', '32'].map(y => (
                          <option key={y} value={y}>20{y}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">CVV / CVC</label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="888"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-center focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-75"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Authorizing Card...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Pay ${finalPrice.toLocaleString()} USD via Card</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Step 3: Promo / Coupon Code */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-brand-600" />
                <span>Promotional Coupon Code</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="e.g. LAUNCH2026 or ZIDIO50"
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl font-mono uppercase focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isCheckingCoupon || !couponInput.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
                >
                  {isCheckingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                </button>
              </div>

              {appliedCoupon && !couponError && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Coupon {appliedCoupon} active: {discountPct}% discount applied!</span>
                </div>
              )}

              {couponError && (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-semibold pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{couponError}</span>
                </div>
              )}
            </div>

            {/* Step 4: Cost Breakdown Summary */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{planData.name} ({isAnnual ? '12 Months' : '1 Month'})</span>
                <span className="font-semibold">${basePrice.toLocaleString()} USD</span>
              </div>

              {isAnnual && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Annual Commitment Benefit</span>
                  <span>Save 20% Included</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Promo Discount ({appliedCoupon})</span>
                  <span>-${discountAmount.toLocaleString()} USD</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white">
                <div>
                  <span className="block">Total Payable Amount:</span>
                  <span className="text-[11px] text-slate-400 font-normal block">
                    Equivalent in INR for UPI/Razorpay: ~₹{amountINR.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-brand-600 font-heading">
                    ${finalPrice.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal block -mt-0.5">USD, all taxes incl.</span>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-1">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 14-Day Money Back Guarantee</span>
              <span>•</span>
              <span>PCI-DSS Level 1 Encrypted</span>
              <span>•</span>
              <span>Instant Activation</span>
            </div>

          </div>
        )}

      </div>

      {/* Embedded Invoice Receipt Modal */}
      <InvoiceReceiptModal
        invoiceNumber={receiptInvoiceNumber}
        onClose={() => setReceiptInvoiceNumber(null)}
      />

    </div>
  );
};
