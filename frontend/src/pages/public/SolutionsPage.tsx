import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Truck, LineChart, CheckCircle2 } from 'lucide-react';

export const SolutionsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
          Tailored Industry Solutions
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-heading mt-3">
          Built for every facet of modern commerce.
        </h1>
        <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Whether you manage multi-category retail, high-velocity D2C brands, or centralized distribution hubs, RetailPulse aligns inventory and marketing to real customer demand.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Omnichannel Retailers</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Synchronize regional store demand with central warehouse supply. Prevent regional stock imbalances through predictive transfer alerts.
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Regional demand modeling</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Multi-location stock visibility</li>
          </ul>
          <button onClick={() => navigate('/app/overview')} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 pt-2">
            <span>View Solution</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <LineChart className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">D2C & E-Commerce</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Maximize Customer Lifetime Value (LTV). Automatically flag accounts with high churn probabilities and trigger automated retention flows.
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> VIP Champions cohort tracking</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Churn intervention recommendations</li>
          </ul>
          <button onClick={() => navigate('/app/churn')} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 pt-2">
            <span>View Solution</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Supply Chain & Procurement</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Eliminate guesswork in supplier purchase orders. Pre-calculate recommended replenishment batches parameterized by lead time and service levels.
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Dynamic ROP calculations</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> 1-click PO PDF/CSV generation</li>
          </ul>
          <button onClick={() => navigate('/app/inventory')} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 pt-2">
            <span>View Solution</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
