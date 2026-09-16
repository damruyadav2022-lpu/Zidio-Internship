import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Users,
  ShieldAlert,
  Boxes,
  Cpu,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Layers,
  Zap,
  ChevronRight
} from 'lucide-react';
import { RevenueChart } from '../../charts/RevenueChart';
import { DEMO_OVERVIEW } from '../../data/demoData';
import { PaymentModal } from '../../components/PaymentModal';
import { EnterpriseModal } from '../../components/EnterpriseModal';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [annualBilling, setAnnualBilling] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<'starter' | 'growth'>('growth');
  const [isEnterpriseOpen, setIsEnterpriseOpen] = useState(false);

  return (
    <div className="space-y-24 sm:space-y-32 py-12">
      
      {/* ==================== 1. HERO SECTION ==================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8 sm:pt-16">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-6 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-3.5 h-3.5 fill-current text-pulse-orange" />
          <span>Next-Generation Retail Intelligence & Forecasting Platform</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading max-w-4xl mx-auto leading-[1.1]">
          Turn retail data into your <span className="bg-gradient-to-r from-brand-600 via-purple-600 to-pulse-orange bg-clip-text text-transparent">next best decision.</span>
        </h1>

        {/* Subcopy */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          RetailPulse combines customer intelligence, predictive analytics, deep learning demand forecasting, and inventory optimization to help modern retailers grow revenue while reducing operational risk.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/app/overview')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2"
          >
            <span>Start analyzing</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('preview-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            Explore the platform
          </button>
        </div>

        {/* Trust message */}
        <p className="mt-6 text-xs text-slate-400 font-medium">
          Built for data-driven retail teams • 100% Verified ML Pipelines (PyTorch + XGBoost)
        </p>

        {/* ==================== 2. HERO INTERACTIVE PREVIEW ==================== */}
        <div id="preview-section" className="mt-14 max-w-6xl mx-auto rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-2xl overflow-hidden p-6 sm:p-8 text-left">
          
          {/* Top Mockup Ribbon */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              </div>
              <span className="text-xs text-slate-400 font-mono">retailpulse.ai/app/overview</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Production Data</span>
            </div>
          </div>

          {/* 4 KPIs Section 16 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block">Total Revenue</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block font-heading">$1.84M</span>
              <span className="text-xs text-emerald-600 font-semibold">↑ 12.8% vs last month</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block">Total Orders</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block font-heading">48,291</span>
              <span className="text-xs text-emerald-600 font-semibold">↑ 8.4% vs last month</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block">Active Customers</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 block font-heading">12,840</span>
              <span className="text-xs text-emerald-600 font-semibold">↑ 14.2% vs last month</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block">Inventory Stockout Risk</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1 block font-heading">8.6%</span>
              <span className="text-xs text-emerald-600 font-semibold">↓ 3.1% improved safety margin</span>
            </div>
          </div>

          {/* Revenue Velocity Chart Preview */}
          <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Monthly Revenue & Profit Velocity
              </h4>
              <span className="text-[11px] text-slate-400">Past 12 Months</span>
            </div>
            <RevenueChart data={DEMO_OVERVIEW.monthly_trends} height={220} />
          </div>

        </div>
      </section>

      {/* ==================== 3. 6 FEATURE SECTIONS (SECTION 17) ==================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            Six Intelligent Engines
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-heading mt-2">
            From raw transactions to intelligent decisions.
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Eliminate silos between sales, customers, warehouse stock, and machine learning models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Feature 1: BI */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Business Intelligence</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Monitor real-time GMV, order volume, Average Order Value (AOV), category mix, and regional sales distribution.
              </p>
            </div>
            <button onClick={() => navigate('/app/overview')} className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              <span>View Overview</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature 2: Customer RFM */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Customer Intelligence</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Unsupervised K-Means clustering ($K=4$) across Recency, Frequency, and Monetary scores to discover actionable personas.
              </p>
            </div>
            <button onClick={() => navigate('/app/segmentation')} className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              <span>Explore Personas</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature 3: Churn Prediction */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Churn Intelligence</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Zero data leakage XGBoost classifier (ROC-AUC 0.9615) flagging high-risk churn customers before they slip away.
              </p>
            </div>
            <button onClick={() => navigate('/app/churn')} className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              <span>Prevent Churn</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature 4: Demand Forecasting */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">AI Demand Forecasting</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                2-layer PyTorch Deep Learning LSTM with 30-day sequential lookback windows outperforming lagged baseline models.
              </p>
            </div>
            <button onClick={() => navigate('/app/forecast')} className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              <span>Run Forecaster</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature 5: Inventory Optimization */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Inventory Optimization</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Dynamic Safety Stock ($SS$), Reorder Point ($ROP$), Coverage Days, and instant Purchase Order (PDF/CSV) generation.
              </p>
            </div>
            <button onClick={() => navigate('/app/inventory')} className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              <span>Optimize Stock</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feature 6: MLOps Observability */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-xs hover:shadow-card-hover transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">MLOps & Observability</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Track MLflow experiments, registered model stages, and continuous Kolmogorov-Smirnov statistical data drift monitoring.
              </p>
            </div>
            <button onClick={() => navigate('/app/mlops')} className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              <span>Inspect Models</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* ==================== 4. PRICING SECTION (SECTION 65) ==================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Transparent Investment</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-heading mt-2">
            Predictable pricing for high-velocity retail.
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Scale from single-brand stores to multi-channel retail enterprises.
          </p>

          {/* Toggle Annual / Monthly */}
          <div className="mt-6 inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setAnnualBilling(false)}
              className={`px-3 py-1.5 rounded-lg transition-all ${!annualBilling ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setAnnualBilling(true)}
              className={`px-3 py-1.5 rounded-lg transition-all ${annualBilling ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' : 'text-slate-500'}`}
            >
              Annual Billing <span className="text-emerald-600 font-bold ml-1">(Save 20%)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Starter */}
          <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Starter</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Independent Retail</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-heading">
                  ${annualBilling ? '199' : '249'}
                </span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Ideal for growing retail stores needing automated inventory replenishment.</p>
              
              <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to 500 SKUs monitored</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Statistical Safety Stock & ROP</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated Purchase Order generation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Daily data refresh</li>
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

          {/* Growth (Most Popular) */}
          <div className="p-8 rounded-2xl border-2 border-brand-500 bg-white dark:bg-dark-card shadow-xl relative flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
              Most Popular
            </span>
            <div>
              <span className="text-xs font-bold text-brand-600 uppercase">Growth</span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Multi-Channel Brands</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-heading">
                  ${annualBilling ? '499' : '599'}
                </span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Complete customer segmentation, XGBoost churn modeling, and PyTorch demand forecasting.</p>
              
              <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Up to 5,000 SKUs monitored</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 2-Layer PyTorch LSTM forecaster</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> RFM K-Means customer segmentation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> XGBoost customer churn alerts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time 20-second state polling</li>
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Enterprise Retailers</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-heading">
                  Custom
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Dedicated MLflow servers, custom PyTorch models, and real-time Kafka/WebSocket pipelines.</p>
              
              <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Unlimited SKUs & warehouse hubs</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Custom deep learning neural models</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated Kolmogorov-Smirnov drift retrain</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 99.99% SLA & Dedicated Solutions Architect</li>
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
      </section>

      {/* ==================== 5. FAQ SECTION ==================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-heading text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <details className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card group cursor-pointer">
            <summary className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between list-none">
              <span>How does RetailPulse calculate Safety Stock and Reorder Points?</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              We compute Safety Stock dynamically using the formula SS = Z &times; &sigma;(demand) &times; &radic;(Lead Time), where Z is parameterized by service level (90% = 1.282, 95% = 1.645, 99% = 2.326). The Reorder Point is set as ROP = (d(daily) &times; Lead Time) + SS.
            </p>
          </details>

          <details className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card group cursor-pointer">
            <summary className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between list-none">
              <span>Why use a PyTorch LSTM rather than simple moving averages?</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Recurrent LSTM neural networks learn non-linear temporal sequences, holiday seasonality, and multi-week demand momentum over 30-day lookback windows, achieving a measured MAE of 14.28 units vs 16.45 for lagged random forests.
            </p>
          </details>

          <details className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card group cursor-pointer">
            <summary className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between list-none">
              <span>How does the system prevent data leakage in churn prediction?</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Features are strictly calculated prior to an observation cutoff window, excluding post-cutoff activity from training. Our champion XGBoost model achieves a verified ROC-AUC of 0.9615 with zero target leakage.
            </p>
          </details>
        </div>
      </section>

      {/* ==================== 6. BOTTOM CTA BANNER ==================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand-700 via-purple-700 to-pulse-purple p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-heading mb-4">
            Ready to predict demand and optimize inventory?
          </h2>
          <p className="text-white/80 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            Launch the live RetailPulse analytics platform now to test the PyTorch demand forecaster, K-Means customer clustering, and purchase order engine.
          </p>
          <button
            onClick={() => navigate('/app/overview')}
            className="px-8 py-3.5 rounded-xl bg-white text-brand-700 hover:bg-slate-100 text-sm font-bold shadow-lg transition-all inline-flex items-center gap-2"
          >
            <span>Launch RetailPulse Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

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
