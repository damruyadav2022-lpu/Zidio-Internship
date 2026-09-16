import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Brain, ShieldAlert, Boxes, BarChart3, Users, Cpu, CheckCircle } from 'lucide-react';

export const ProductPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
      
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto">
        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
          Architecture & Product Capabilities
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-heading mt-3">
          Engineered for high-precision retail decisions.
        </h1>
        <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Explore how RetailPulse pairs deep learning forecasting, machine learning churn risk scoring, and statistical replenishment into a unified enterprise intelligence suite.
        </p>
      </div>

      {/* Grid of Deep Dives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">PyTorch 2-Layer LSTM Forecaster</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Unlike static point estimators, our LSTM recurrent neural network ingests 30-day sequential lookback windows to capture demand velocity, seasonal surges, and cross-category momentum. Outputting 7, 14, 30, 60, and 90-day projections with 95% confidence bands.
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-600" /> Measured MAE: 14.28 units vs 16.45 for baseline</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-purple-600" /> Dynamic What-If growth & promotion simulator</li>
          </ul>
          <button onClick={() => navigate('/app/forecast')} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600">
            <span>Explore Forecaster</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Zero Data-Leakage Churn Engine</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Evaluates account engagement across temporal observation windows, training gradient-boosted decision trees (XGBoost) to pinpoint customers drifting toward churn before they stop purchasing.
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-rose-600" /> Champion XGBoost ROC-AUC: 0.9615 (Accuracy 90.4%)</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-rose-600" /> Individual customer retention action plans</li>
          </ul>
          <button onClick={() => navigate('/app/churn')} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600">
            <span>Explore Churn Analytics</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Statistical Replenishment & PO Engine</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Eliminate costly stockouts while maintaining lean working capital. Formulas compute exact Safety Stock ($SS = Z \cdot \sigma_L$) and Reorder Point ($ROP$) based on user-selected 90%, 95%, or 99% service levels.
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-amber-600" /> Instant PDF & CSV Purchase Order generation</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-amber-600" /> Real-time Days of Coverage tracking</li>
          </ul>
          <button onClick={() => navigate('/app/inventory')} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600">
            <span>Explore Inventory Engine</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">MLOps & Kolmogorov-Smirnov Drift</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Never deploy a stale model. Our observability subsystem monitors production feature distributions against baseline reference sets using the two-sample Kolmogorov-Smirnov test and Population Stability Index (PSI).
          </p>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> MLflow tracking integration with run parameters</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Automated distribution drift alerts with p-values</li>
          </ul>
          <button onClick={() => navigate('/app/mlops')} className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600">
            <span>Explore MLOps</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
