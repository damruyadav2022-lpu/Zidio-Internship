import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { PaymentModal } from '../../components/PaymentModal';
import { EnterpriseModal } from '../../components/EnterpriseModal';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [annualBilling, setAnnualBilling] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<'starter' | 'growth'>('growth');
  const [isEnterpriseOpen, setIsEnterpriseOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
          Enterprise Plans &amp; Pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-heading mt-3">
          Predictable pricing. Measurable ROI.
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Every plan includes our complete suite of statistical formulas, purchase order generation, and real-time state sync.
        </p>

        {/* Toggle */}
        <div className="mt-6 inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setAnnualBilling(false)}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${!annualBilling ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnualBilling(true)}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${annualBilling ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
          >
            Annual (Save 20%)
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Starter */}
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Starter</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Independent Store</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-heading">${annualBilling ? '199' : '249'}</span>
              <span className="text-xs text-slate-400">/ mo</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Essential safety stock replenishment &amp; sales analytics.</p>
            <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to 500 SKUs</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Statistical Safety Stock &amp; ROP</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1-Click Purchase Orders (PDF/CSV)</li>
              <li className="flex items-center gap-2 text-slate-400"><X className="w-4 h-4" /> PyTorch Deep LSTM Forecaster</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setSelectedPlanForPayment('starter');
              setIsPaymentOpen(true);
            }}
            className="mt-8 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Get Started
          </button>
        </div>

        {/* Growth */}
        <div className="p-8 rounded-2xl border-2 border-brand-500 bg-white dark:bg-dark-card shadow-xl relative flex flex-col justify-between">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
            Most Popular
          </span>
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase">Growth</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Scaling Brands</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-heading">${annualBilling ? '499' : '599'}</span>
              <span className="text-xs text-slate-400">/ mo</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Complete customer segmentation, XGBoost churn, and deep learning forecasting.</p>
            <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to 5,000 SKUs</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 2-Layer PyTorch LSTM Demand Forecaster</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> RFM K-Means Customer Clustering ($K=4$)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> XGBoost Churn Risk Alerts (ROC-AUC 0.96)</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setSelectedPlanForPayment('growth');
              setIsPaymentOpen(true);
            }}
            className="mt-8 w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            Start Free 14-Day Trial
          </button>
        </div>

        {/* Enterprise */}
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase">Enterprise</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Multi-Channel Enterprise</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-heading">Custom</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Dedicated MLflow infrastructure, custom models, and priority support.</p>
            <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited SKUs &amp; Warehouses</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Continuous Kolmogorov-Smirnov drift monitoring</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Custom training pipelines &amp; API keys</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 99.99% Uptime SLA</li>
            </ul>
          </div>
          <button
            onClick={() => setIsEnterpriseOpen(true)}
            className="mt-8 w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Contact Solutions Team
          </button>
        </div>
      </div>

      {/* Payment Checkout Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        initialPlanId={selectedPlanForPayment}
        initialAnnualBilling={annualBilling}
      />

      {/* Enterprise Consultation Modal */}
      <EnterpriseModal
        isOpen={isEnterpriseOpen}
        onClose={() => setIsEnterpriseOpen(false)}
      />

    </div>
  );
};
