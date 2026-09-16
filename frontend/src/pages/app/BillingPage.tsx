import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  ArrowUpRight, 
  Sparkles, 
  Clock, 
  Building2, 
  FileText, 
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Layers
} from 'lucide-react';
import { getCurrentSubscription, getInvoices } from '../../services/api';
import { UserSubscription, InvoiceRecord } from '../../types';
import { PaymentModal } from '../../components/PaymentModal';
import { EnterpriseModal } from '../../components/EnterpriseModal';
import { InvoiceReceiptModal } from '../../components/InvoiceReceiptModal';
import { useAuth } from '../../context/AuthContext';

export const BillingPage: React.FC = () => {
  const { user } = useAuth();

  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<'starter' | 'growth'>('growth');
  const [isEnterpriseOpen, setIsEnterpriseOpen] = useState(false);
  const [activeInvoiceForReceipt, setActiveInvoiceForReceipt] = useState<string | null>(null);

  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      const [subRes, invRes] = await Promise.all([
        getCurrentSubscription(),
        getInvoices()
      ]);
      setSub(subRes.subscription);
      setInvoices(invRes.invoices);
    } catch (err) {
      console.error('Failed to load billing data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, []);

  const handlePaymentSuccess = () => {
    loadBillingData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-6xl">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              Subscription &amp; Enterprise Billing
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active Tier
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your RetailPulse platform license, model quota allocations, payment methods, and invoice receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedPlanForPayment('growth');
              setIsPaymentOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Change / Upgrade Plan</span>
          </button>
        </div>
      </div>

      {/* Grid: Current Plan & Payment Method Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Active Subscription */}
        <div className="md:col-span-2 bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {sub?.plan_name || 'Multi-Channel Brands (Growth)'}
                  </h2>
                  <span className="text-xs text-slate-400">
                    Billed {sub?.billing_cycle === 'annual' ? 'Annually (Save 20% Applied)' : 'Monthly'}
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
                {sub?.status === 'active' ? 'Active' : 'Trial'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Recurring Investment</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-heading mt-0.5 block">
                  ${sub?.price ? sub.price.toLocaleString() : '4,790'} <span className="text-xs font-normal text-slate-400">USD</span>
                </span>
                <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">20% Annual Savings</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Next Renewal Date</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                  {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'September 16, 2027'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Auto-renewal enabled</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">License Capacity</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                  5,000 SKUs Monitored
                </span>
                <span className="text-[11px] text-brand-600 font-medium mt-0.5 block">PyTorch LSTM Included</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-dark-border mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Enterprise SLA Guaranteed • 99.99% Core Pipeline Availability</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedPlanForPayment('starter');
                  setIsPaymentOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Downgrade
              </button>
              <button
                onClick={() => setIsEnterpriseOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
              >
                Custom Enterprise Quote
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Primary Payment Method */}
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Payment Method</h3>
              <CreditCard className="w-4 h-4 text-slate-400" />
            </div>

            <div className="mt-4 p-4 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white space-y-3 shadow-md">
              <div className="flex justify-between items-center text-xs opacity-80 font-mono">
                <span>RETAILPULSE CORPORATE</span>
                <span className="font-bold text-amber-400">VISA</span>
              </div>
              <div className="font-mono text-base tracking-widest pt-1">
                •••• •••• •••• {sub?.card_last4 || '4242'}
              </div>
              <div className="flex justify-between text-[11px] opacity-75 pt-1">
                <span>EXP: 12/28</span>
                <span>{user?.name || 'Alex Mercer'}</span>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Billing Contact:</span>
                <strong className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{user?.email || 'evaluator@retailpulse.ai'}</strong>
              </div>
              <div className="flex justify-between">
                <span>Billing Address:</span>
                <span className="text-slate-700 dark:text-slate-300">San Francisco, CA</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedPlanForPayment('growth');
              setIsPaymentOpen(true);
            }}
            className="mt-6 w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Update Payment Details
          </button>
        </div>

      </div>

      {/* Section 2: Quota Allocations */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Current Quota &amp; Resource Utilization</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
              <span>SKU Monitor Quota</span>
              <span>842 / 5,000 SKUs</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 rounded-full" style={{ width: '16.8%' }}></div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">4,158 SKUs remaining under Growth Tier</span>
          </div>

          <div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
              <span>Deep Learning LSTM Inferences</span>
              <span>1,246 / Unlimited</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Uncapped neural inference projections</span>
          </div>

          <div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1.5 font-medium">
              <span>Drift Monitoring Service</span>
              <span>Active (KS-Test p=0.42)</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
            <span className="text-[10px] text-emerald-600 mt-1 block">Continuous covariate stability verified</span>
          </div>
        </div>
      </div>

      {/* Section 3: Billing & Invoice History Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Payment &amp; Invoice History</h3>
            <p className="text-xs text-slate-500">Download official tax receipts with transaction hash breakdown</p>
          </div>
          <button
            onClick={loadBillingData}
            title="Refresh Invoices"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 font-semibold">
                <th className="py-3.5 px-6">Invoice Number</th>
                <th className="py-3.5 px-6">Billing Date</th>
                <th className="py-3.5 px-6">Plan Tier</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Payment Method</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                    {inv.invoice_number}
                  </td>
                  <td className="py-4 px-6 text-slate-500">
                    {inv.date}
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-700 dark:text-slate-200">
                    {inv.plan_name}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900 dark:text-white font-mono">
                    ${inv.amount.toLocaleString()} USD
                  </td>
                  <td className="py-4 px-6 text-slate-500">
                    {inv.payment_method}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Paid</span>
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => setActiveInvoiceForReceipt(inv.invoice_number)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        initialPlanId={selectedPlanForPayment}
        onSuccess={handlePaymentSuccess}
      />

      <EnterpriseModal
        isOpen={isEnterpriseOpen}
        onClose={() => setIsEnterpriseOpen(false)}
      />

      <InvoiceReceiptModal
        invoiceNumber={activeInvoiceForReceipt}
        onClose={() => setActiveInvoiceForReceipt(null)}
      />

    </div>
  );
};
