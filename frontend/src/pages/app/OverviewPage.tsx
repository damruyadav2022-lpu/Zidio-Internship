import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowUpRight, 
  Download,
  RefreshCw,
  Sparkles,
  Layers,
  MapPin,
  Package,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  BrainCircuit,
  BarChart3,
  Percent,
  Truck
} from 'lucide-react';
import { fetchDashboardOverview } from '../../services/dashboardService';
import { DateRange, PurchaseOrder, TopProduct } from '../../types';
import { KpiCard } from '../../components/KpiCard';
import { RevenueChart } from '../../charts/RevenueChart';
import { AIInsightCard } from '../../components/AIInsightCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { PurchaseOrderModal } from '../../components/PurchaseOrderModal';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [chartMode, setChartMode] = useState<'sales_profit' | 'orders_aov' | 'sales_only'>('sales_profit');
  
  // Purchase Order Modal State
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [activePO, setActivePO] = useState<PurchaseOrder | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['dashboard-overview', dateRange],
    queryFn: () => fetchDashboardOverview(dateRange),
    staleTime: 30000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 dark:bg-dark-border rounded-lg w-72 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <LoadingSkeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const { kpis, monthly_trends, category_sales, regional_sales, top_products, ai_recommendations } = data;

  // Handle PO Creation for a specific product or batch of critical items
  const handleOpenPO = (product?: TopProduct) => {
    const poNumber = `PO-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const createdDate = new Date().toISOString().split('T')[0];
    const expectedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (product) {
      const unitPrice = Math.round(product.Revenue / (product.UnitsSold || 1));
      const reorderQty = 120;
      const subtotal = unitPrice * reorderQty;

      setActivePO({
        status: 'success',
        po_number: poNumber,
        created_date: createdDate,
        expected_delivery: expectedDelivery,
        supplier: 'Apex Global Logistics & Distribution',
        total_items: 1,
        total_units: reorderQty,
        total_amount: subtotal,
        lines: [
          {
            ProductID: product.ProductID,
            ProductName: product.ProductName,
            Category: product.Category,
            Quantity: reorderQty,
            UnitPrice: unitPrice,
            Subtotal: subtotal
          }
        ]
      });
    } else {
      // Batch PO for critical items
      const lines = top_products.slice(0, 3).map((p, idx) => {
        const unitPrice = Math.round(p.Revenue / (p.UnitsSold || 1));
        const quantity = 80 + idx * 40;
        return {
          ProductID: p.ProductID,
          ProductName: p.ProductName,
          Category: p.Category,
          Quantity: quantity,
          UnitPrice: unitPrice,
          Subtotal: unitPrice * quantity
        };
      });

      const totalUnits = lines.reduce((sum, l) => sum + l.Quantity, 0);
      const totalAmount = lines.reduce((sum, l) => sum + l.Subtotal, 0);

      setActivePO({
        status: 'success',
        po_number: poNumber,
        created_date: createdDate,
        expected_delivery: expectedDelivery,
        supplier: 'Apex Global Logistics & Distribution',
        total_items: lines.length,
        total_units: totalUnits,
        total_amount: totalAmount,
        lines
      });
    }

    setIsPOModalOpen(true);
  };

  const handleExportSummary = () => {
    const exportData = top_products.map(p => ({
      ProductID: p.ProductID,
      ProductName: p.ProductName,
      Category: p.Category,
      UnitsSold: p.UnitsSold,
      Revenue: p.Revenue,
      EstUnitPrice: Math.round(p.Revenue / (p.UnitsSold || 1)),
      StockStatus: p.UnitsSold > 400 ? 'Optimal' : 'Reorder Alert'
    }));
    exportToCsv(exportData, `retailpulse_executive_overview_${dateRange}.csv`);
  };

  const dateRangeOptions: { label: string; value: DateRange }[] = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: '12 Months', value: '12m' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Header Controls with Real-Time Telemetry Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
              Executive Overview
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE TELEMETRY</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time business performance, demand signals, safety stock runways, and autonomous AI recommendations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe pill selector */}
          <div className="inline-flex bg-slate-100 dark:bg-dark-card p-1 rounded-xl border border-slate-200 dark:border-dark-border shadow-xs">
            {dateRangeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDateRange(opt.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateRange === opt.value
                    ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-brand-500' : ''}`} />
          </button>

          <button
            onClick={() => handleOpenPO()}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Replenish (PO)</span>
          </button>

          <button
            onClick={handleExportSummary}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* AI Executive Intelligence Digest Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300 font-mono">
                Neural Intelligence Briefing • Sub-second Synthesis
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-heading">
              Executive Health Digest: Pacing +14.2% Above Target
            </h2>

            <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed">
              Operating run-rate is robust at <strong className="text-white">{formatCurrency(kpis.total_revenue)}</strong> with a healthy <strong className="text-white">{formatPercent(kpis.profit_margin)}</strong> gross operating margin. Technology hardware leads product category velocity, while supply chain safety stock across {kpis.critical_skus} SKUs requires automated PO replenishment.
            </p>

            {/* Quick takeaway pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Revenue Pace: <strong>+14.2% MoM</strong></span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Stockout Risk: <strong>{kpis.critical_skus} SKUs at ROP</strong></span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Customer Retention: <strong>{formatPercent(100 - kpis.churn_risk_pct)}</strong></span>
              </div>
            </div>
          </div>

          {/* Health Index Dial / Card */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-center gap-3 bg-white/5 backdrop-blur-md p-5 rounded-xl border border-white/10 shrink-0">
            <div className="text-left lg:text-right">
              <div className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">Overall Store Health</div>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono flex items-baseline gap-1 lg:justify-end">
                94.8 <span className="text-sm font-normal text-indigo-300">/ 100</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5 lg:justify-end">
                <CheckCircle2 className="w-3.5 h-3.5" /> High Performance &amp; Resilient
              </div>
            </div>
            <div className="flex items-center gap-2 w-full lg:w-auto mt-2">
              <button
                onClick={() => navigate('/app/forecast')}
                className="flex-1 lg:flex-none text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 transition-colors flex items-center justify-center gap-1"
              >
                <span>Forecast Signals</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleOpenPO()}
                className="flex-1 lg:flex-none text-xs font-semibold px-3 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1 shadow-sm font-bold"
              >
                <span>Fast Restock</span>
                <Package className="w-3.5 h-3.5 text-brand-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tier 1: Top-Line Financial & Operational Performance (4 Columns - No Truncation) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Primary Financial Performance
          </h2>
          <span className="text-xs text-slate-400">Pacing vs target objectives</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Revenue */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Gross Revenue
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatCurrency(kpis.total_revenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
              </span>
              <span className="text-slate-500 dark:text-slate-400">vs prior period</span>
            </div>
            {/* Target Progress Bar */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Monthly Target ($2.0M)</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">92%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
          </div>

          {/* Card 2: Operating Profit */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Net Operating Profit
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatCurrency(kpis.total_profit)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3.5 h-3.5" /> +2.1%
              </span>
              <span className="text-slate-500 dark:text-slate-400">margin expansion</span>
            </div>
            {/* Margin indicator */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Gross Margin %:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                {formatPercent(kpis.profit_margin)}
              </span>
            </div>
          </div>

          {/* Card 3: Total Orders & AOV */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Order Volume
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatNumber(kpis.total_orders)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3.5 h-3.5" /> +8.7%
              </span>
              <span className="text-slate-500 dark:text-slate-400">order volume</span>
            </div>
            {/* AOV indicator */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Average Order (AOV):</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {formatCurrency(kpis.aov || (kpis.total_revenue / (kpis.total_orders || 1)))}
              </span>
            </div>
          </div>

          {/* Card 4: Active Customer Base */}
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Customer Base
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              {formatNumber(kpis.active_customers)}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3.5 h-3.5" /> +12.4%
              </span>
              <span className="text-slate-500 dark:text-slate-400">monthly growth</span>
            </div>
            {/* Retention indicator */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Repeat Purchase Rate:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded">
                84.2%
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Tier 2: Operational Health & Risk Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Risk 1: Stockout & ROP */}
        <div className="bg-white dark:bg-dark-card border border-amber-200/70 dark:border-amber-900/40 rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Supply Chain &amp; ROP Exposure</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {kpis.critical_skus} Critical SKUs
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Safety runway estimated at 4.2 days across priority categories.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
              {formatPercent(kpis.inventory_risk_pct)} Risk
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => handleOpenPO()}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Draft Replenishment PO</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/app/inventory')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Inventory Hub →
            </button>
          </div>
        </div>

        {/* Risk 2: Churn Exposure */}
        <div className="bg-white dark:bg-dark-card border border-rose-200/70 dark:border-rose-900/40 rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Customer Churn Risk</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {formatPercent(kpis.churn_risk_pct)} Attrition
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                48 at-risk enterprise customer accounts flagged by XGBoost classifier.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              -1.8% MoM
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => navigate('/app/churn')}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1"
            >
              <span>Review At-Risk Accounts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/app/customers')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Audience Hub →
            </button>
          </div>
        </div>

        {/* Risk 3: Model Health & Forecast Drift */}
        <div className="bg-white dark:bg-dark-card border border-indigo-200/70 dark:border-indigo-900/40 rounded-xl p-5 shadow-card flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Demand Model Telemetry</span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                96.4% Accuracy
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ensemble LSTM + Prophet model drift is nominal at 0.4%.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
              Optimal
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => navigate('/app/forecast')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Run Demand Simulator</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/app/mlops')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              MLOps Pipeline →
            </button>
          </div>
        </div>

      </div>

      {/* Main Revenue Chart with Multi-Mode View Switcher */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                Revenue &amp; Demand Trajectory
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Historical gross performance vs net margin and order volume pacing
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setChartMode('sales_profit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                chartMode === 'sales_profit'
                  ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sales &amp; Net Profit
            </button>
            <button
              onClick={() => setChartMode('orders_aov')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                chartMode === 'orders_aov'
                  ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Orders &amp; AOV
            </button>
            <button
              onClick={() => setChartMode('sales_only')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                chartMode === 'sales_only'
                  ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Revenue Only
            </button>
          </div>
        </div>

        {/* Trajectory Run-Rate Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <span className="text-slate-500">Peak Month Volume:</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">$226,000 (Jul 2026)</span>
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-4">
            <span className="text-slate-500">Average Monthly Run-Rate:</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">$184,200/mo</span>
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:border-l sm:border-slate-200 dark:sm:border-slate-800 sm:pl-4">
            <span className="text-slate-500">Projected Next Month:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">+11.2% Growth</span>
          </div>
        </div>

        <div className="h-80 w-full">
          <RevenueChart data={monthly_trends} mode={chartMode} />
        </div>
      </div>

      {/* Category Breakdown & Regional Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Contribution */}
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Category Sales Performance</h3>
                <p className="text-xs text-slate-500">Revenue share and units sold by category</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              3 Active Lines
            </span>
          </div>

          <div className="space-y-4">
            {category_sales.map((cat, idx) => {
              const barColors = [
                'bg-indigo-600',
                'bg-emerald-500',
                'bg-amber-500'
              ];
              const activeColor = barColors[idx % barColors.length];

              return (
                <div key={cat.Category} className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${activeColor}`} />
                      <span className="font-bold text-slate-900 dark:text-white">{cat.Category}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({formatNumber(cat.Quantity)} units)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-900 dark:text-white font-mono">{formatCurrency(cat.Sales)}</span>
                      <span className="text-xs font-bold text-slate-500 font-mono w-12 text-right">{cat.Share}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${activeColor} rounded-full transition-all duration-500`}
                      style={{ width: `${cat.Share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Total Catalog Velocity: <strong>15,170 units</strong></span>
            <span>Est. Gross Margin: <strong className="text-emerald-600">25.08%</strong></span>
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Geographic Market Distribution</h3>
                <p className="text-xs text-slate-500">Volume and customer density across regional hubs</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <Truck className="w-3.5 h-3.5" /> 99.4% On-Time SLA
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {regional_sales.map((reg) => (
              <div
                key={reg.Region}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{reg.Region}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                    SLA 99.4%
                  </span>
                </div>
                <div className="mt-3">
                  <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                    {formatCurrency(reg.Sales)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                    <span>{formatNumber(reg.Orders)} orders</span>
                    <span className="text-slate-400 text-[11px]">Avg $143/ea</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Primary Fulfillment: <strong>West Hub (38.2%)</strong></span>
            <span>Delivery SLA: <strong className="text-emerald-600">1.4 Days Avg</strong></span>
          </div>
        </div>

      </div>

      {/* Top Products Leaderboard & Live Telemetry Stream */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Top Velocity Products Table (2 Columns wide) */}
        <div className="xl:col-span-2 bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Top Velocity Products</h3>
                  <p className="text-xs text-slate-500">Highest grossing SKUs with instant 1-click replenishment</p>
                </div>
              </div>

              <button
                onClick={() => handleOpenPO()}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 inline-flex items-center gap-1"
              >
                <span>Bulk Reorder All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-border">
                  <tr>
                    <th className="py-3 px-5">SKU / Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Units Sold</th>
                    <th className="py-3 px-4 text-right">Gross Revenue</th>
                    <th className="py-3 px-4 text-center">Stock Runway</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
                  {top_products.map((prod) => {
                    const isLowStock = prod.UnitsSold <= 350;
                    return (
                      <tr key={prod.ProductID} className="hover:bg-slate-50/70 dark:hover:bg-slate-850 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900 dark:text-white">{prod.ProductName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{prod.ProductID}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                            {prod.Category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-medium">
                          {formatNumber(prod.UnitsSold)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(prod.Revenue)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <AlertTriangle className="w-3 h-3" /> Reorder Alert
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Optimal (180+)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => handleOpenPO(prod)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950 dark:hover:bg-brand-900 dark:text-brand-300 transition-colors"
                          >
                            <Package className="w-3 h-3" />
                            <span>1-Click PO</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs text-slate-500">
            <span>Showing top {top_products.length} products by sales velocity</span>
            <button
              onClick={() => navigate('/app/inventory')}
              className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
            >
              View Full Product Inventory Catalog →
            </button>
          </div>
        </div>

        {/* Live Operational Event Stream / Telemetry Feed (1 Column wide) */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Operations Feed</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Telemetry Active</span>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 dark:text-white">Order #ORD-8942 Completed</div>
                  <div className="text-slate-500">Enterprise monitor batch ($1,240.00) fulfilled via West Hub</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Just now
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 dark:text-white">ROP Safety Threshold Triggered</div>
                  <div className="text-slate-500">SKU-10008 inventory dropped below 15 units. PO drafted.</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 4 mins ago
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 dark:text-white">Neural Demand Sync Executed</div>
                  <div className="text-slate-500">LSTM weights recalculated with 0.4% baseline covariate drift</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 18 mins ago
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 dark:text-white">VIP Loyalty Discount Dispatched</div>
                  <div className="text-slate-500">Automated 15% retention offer sent to 14 high-value accounts</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 35 mins ago
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 dark:text-white">Bulk Stock Transfer Received</div>
                  <div className="text-slate-500">420 units checked into Central Distribution Hub</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 1 hour ago
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-dark-border mt-4">
            <button
              onClick={() => navigate('/app/mlops')}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Inspect Full Audit Log</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* AI Automated Decision Directives */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                AI Automated Decision Directives
              </h2>
              <p className="text-xs text-slate-500">
                Prescriptive execution playbooks generated from deep neural demand and churn signals
              </p>
            </div>
          </div>
          <span className="text-xs bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 px-3 py-1 rounded-full font-bold">
            {ai_recommendations.length} Active Directives
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ai_recommendations.map((recommendation) => (
            <AIInsightCard key={recommendation.id} recommendation={recommendation} />
          ))}
        </div>
      </div>

      {/* Purchase Order Replenishment Modal */}
      <PurchaseOrderModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        purchaseOrder={activePO}
      />

    </div>
  );
};
