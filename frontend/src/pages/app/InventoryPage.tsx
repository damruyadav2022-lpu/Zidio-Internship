import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  PackageCheck, 
  Download, 
  FilePlus, 
  Search, 
  RefreshCw,
  Sparkles,
  Calculator
} from 'lucide-react';
import { fetchInventory, createPurchaseOrder } from '../../services/inventoryService';
import { PurchaseOrder } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { PurchaseOrderModal } from '../../components/PurchaseOrderModal';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export const InventoryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [targetServiceLevel, setTargetServiceLevel] = useState<number>(95);

  // Checkbox selection for PO creation
  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>([]);
  const [activePurchaseOrder, setActivePurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState<boolean>(false);
  const [isGeneratingPo, setIsGeneratingPo] = useState<boolean>(false);

  // What-If Simulator State
  const [simLeadTimeDelta, setSimLeadTimeDelta] = useState<number>(0);
  const [simDemandDeltaPct, setSimDemandDeltaPct] = useState<number>(0);
  const [simServiceLevel, setSimServiceLevel] = useState<number>(95);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-items', selectedCategory, selectedStatus, searchQuery, targetServiceLevel],
    queryFn: () => fetchInventory(selectedCategory, selectedStatus, searchQuery, targetServiceLevel),
    staleTime: 30000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <LoadingSkeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const { summary, items } = data;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSkuIds(items.map(it => it.ProductID));
    } else {
      setSelectedSkuIds([]);
    }
  };

  const handleToggleSku = (productId: string) => {
    setSelectedSkuIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleGeneratePo = async () => {
    setIsGeneratingPo(true);
    try {
      const targetItems = selectedSkuIds.length > 0
        ? items.filter(it => selectedSkuIds.includes(it.ProductID))
        : items.filter(it => it.AlertLevel === 'Critical' || it.AlertLevel === 'Low Stock');

      const poItems = (targetItems.length > 0 ? targetItems : items.slice(0, 5)).map(it => ({
        product_id: it.ProductID,
        product_name: it.ProductName,
        category: it.Category,
        quantity: Math.max(it.SuggestedOrder || (it.ReorderPoint * 2 - it.CurrentStock), 50),
        unit_price: it.Price || 45.0
      }));

      const po = await createPurchaseOrder(poItems);
      setActivePurchaseOrder(po);
      setIsPoModalOpen(true);
    } catch (err) {
      console.error(err);
      alert('Failed to generate purchase order.');
    } finally {
      setIsGeneratingPo(false);
    }
  };

  const handleExportCsv = () => {
    const exportData = items.map(it => ({
      ProductID: it.ProductID,
      ProductName: it.ProductName,
      Category: it.Category,
      CurrentStock: it.CurrentStock,
      DailyDemand: it.DailyDemand,
      SafetyStock: it.SafetyStock,
      ReorderPoint: it.ReorderPoint,
      CoverageDays: it.CoverageDays,
      AlertLevel: it.AlertLevel,
      Price: it.Price,
      StockValue: (it.CurrentStock * it.Price).toFixed(2)
    }));
    exportToCsv(exportData, `retailpulse_inventory_audit_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // What-If Math:
  const baseLeadTime = 7;
  const sampleSku = items[0] || {
    DailyDemand: 28,
    Price: 49.99
  };
  const effectiveLeadTime = Math.max(baseLeadTime + simLeadTimeDelta, 1);
  const effectiveDemand = Math.max(Math.round(sampleSku.DailyDemand * (1 + simDemandDeltaPct / 100)), 1);
  const zScore = simServiceLevel === 99 ? 2.33 : simServiceLevel === 95 ? 1.65 : 1.28;
  const demandStdDev = effectiveDemand * 0.25;
  const simSafetyStock = Math.round(zScore * Math.sqrt(effectiveLeadTime) * demandStdDev);
  const simReorderPoint = Math.round((effectiveDemand * effectiveLeadTime) + simSafetyStock);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              Inventory Optimization &amp; Replenishment
            </h1>
            <span className="text-xs bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900/50 px-2.5 py-0.5 rounded-full font-semibold">
              Dynamic SS &amp; ROP Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Prevent stockouts, minimize holding capital, and automate algorithmic purchase order generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Stock Audit</span>
          </button>

          <button
            onClick={handleGeneratePo}
            disabled={isGeneratingPo}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all"
          >
            <FilePlus className="w-4 h-4" />
            <span>{selectedSkuIds.length > 0 ? `Create PO (${selectedSkuIds.length} SKUs)` : 'Auto-Generate PO'}</span>
          </button>
        </div>
      </div>

      {/* Top Inventory KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Warehouse Valuation</span>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-3">
            {formatCurrency(summary.total_reorder_capital * 2.4)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {summary.total_skus} monitored SKUs
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Critical Stockouts</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-3">
            {summary.critical_red} SKUs
          </div>
          <div className="text-[11px] text-rose-500 font-medium mt-1">
            Current stock &le; Safety Stock
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Reorder Required</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-3">
            {summary.reorder_yellow} SKUs
          </div>
          <div className="text-[11px] text-amber-500 font-medium mt-1">
            Stock below Reorder Point (ROP)
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Healthy Stock Ratio</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-3">
            {((summary.healthy_green / Math.max(summary.total_skus, 1)) * 100).toFixed(0)}%
          </div>
          <div className="text-[11px] text-emerald-500 font-medium mt-1">
            {summary.healthy_green} SKUs with optimal supply
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-slate-200 dark:border-dark-border shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU, product name, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none focus:outline-none font-semibold text-slate-800 dark:text-slate-200 text-xs cursor-pointer"
            >
              <option value="All">All Inventory</option>
              <option value="Critical">Critical (Below SS)</option>
              <option value="Low Stock">Low Stock (Below ROP)</option>
              <option value="Healthy">Healthy Stock</option>
              <option value="Overstocked">Overstocked</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent border-none focus:outline-none font-semibold text-slate-800 dark:text-slate-200 text-xs cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Apparel">Apparel</option>
              <option value="Home & Kitchen">Home & Kitchen</option>
              <option value="Beauty & Health">Beauty & Health</option>
            </select>
          </div>

          {/* Target Service Level Selector */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-medium">Service Level:</span>
            <select
              value={targetServiceLevel}
              onChange={(e) => setTargetServiceLevel(Number(e.target.value))}
              className="bg-transparent border-none focus:outline-none font-semibold text-brand-600 dark:text-brand-400 text-xs cursor-pointer"
            >
              <option value={90}>90% (Z=1.28)</option>
              <option value={95}>95% (Z=1.65)</option>
              <option value={99}>99% (Z=2.33)</option>
            </select>
          </div>
        </div>

      </div>

      {/* Inventory Stock SKU Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-border">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedSkuIds.length === items.length && items.length > 0}
                    onChange={handleSelectAll}
                    className="rounded accent-brand-600 w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">SKU / Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Stock</th>
                <th className="py-3.5 px-4 text-right">Daily Demand (d)</th>
                <th className="py-3.5 px-4 text-right">Safety Stock (SS)</th>
                <th className="py-3.5 px-4 text-right">Reorder Point (ROP)</th>
                <th className="py-3.5 px-4 text-right">Days Cover</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
              {items.map((item) => {
                const isChecked = selectedSkuIds.includes(item.ProductID);
                return (
                  <tr
                    key={item.ProductID}
                    onClick={() => handleToggleSku(item.ProductID)}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-850 cursor-pointer transition-colors ${
                      isChecked ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSku(item.ProductID)}
                        className="rounded accent-brand-600 w-3.5 h-3.5 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{item.ProductName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.ProductID}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                        {item.Category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {item.CurrentStock}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      {item.DailyDemand}/d
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.SafetyStock}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                      {item.ReorderPoint}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className={`font-semibold ${
                        item.CoverageDays <= 7 ? 'text-rose-600' :
                        item.CoverageDays <= 14 ? 'text-amber-600' : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {item.CoverageDays.toFixed(1)}d
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={item.AlertLevel} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Inventory Formula What-If Simulator */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Stochastic Inventory Math Simulator (What-If)
              </h3>
              <p className="text-xs text-slate-500">
                Live computation of Safety Stock SS = Z &times; &radic;(Lead Time) &times; &sigma;(demand) and Reorder Point ROP = (d &times; Lead Time) + SS
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSimLeadTimeDelta(0);
              setSimDemandDeltaPct(0);
              setSimServiceLevel(95);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Variables</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Slider 1: Lead Time Variance */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Supplier Lead Time Buffer</span>
              <span className={`font-mono ${simLeadTimeDelta > 0 ? 'text-rose-600' : simLeadTimeDelta < 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                {simLeadTimeDelta > 0 ? `+${simLeadTimeDelta} days` : `${simLeadTimeDelta} days`}
              </span>
            </div>
            <input
              type="range"
              min="-5"
              max="15"
              step="1"
              value={simLeadTimeDelta}
              onChange={(e) => setSimLeadTimeDelta(Number(e.target.value))}
              className="w-full accent-brand-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="text-[11px] text-slate-400">
              Effective Lead Time: <strong className="text-slate-900 dark:text-white font-mono">{effectiveLeadTime} days</strong>
            </div>
          </div>

          {/* Slider 2: Demand Shock */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Daily Demand Fluctuation</span>
              <span className={`font-mono ${simDemandDeltaPct > 0 ? 'text-brand-600' : simDemandDeltaPct < 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                {simDemandDeltaPct > 0 ? `+${simDemandDeltaPct}%` : `${simDemandDeltaPct}%`}
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="60"
              step="5"
              value={simDemandDeltaPct}
              onChange={(e) => setSimDemandDeltaPct(Number(e.target.value))}
              className="w-full accent-brand-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="text-[11px] text-slate-400">
              Effective Daily Demand: <strong className="text-slate-900 dark:text-white font-mono">{effectiveDemand} units/day</strong>
            </div>
          </div>

          {/* Slider 3: Target Service Level */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">Target Cycle Service Level</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                {simServiceLevel}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[90, 95, 99].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSimServiceLevel(lvl)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    simServiceLevel === lvl
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {lvl}% (Z={lvl === 99 ? '2.33' : lvl === 95 ? '1.65' : '1.28'})
                </button>
              ))}
            </div>
            <div className="text-[11px] text-slate-400">
              Normal Z-Score factor: <strong className="text-slate-900 dark:text-white font-mono">{zScore}</strong>
            </div>
          </div>

        </div>

        {/* Real-time Math Output Cards */}
        <div className="mt-6 p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Dynamic Equation Solutions</span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Lead Time demand: <strong>{effectiveDemand * effectiveLeadTime} units</strong> • Buffer standard deviation: <strong>{(demandStdDev * Math.sqrt(effectiveLeadTime)).toFixed(1)}</strong>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-500 block">Required Safety Stock (SS)</span>
              <span className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                {simSafetyStock} units
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
            <div>
              <span className="text-slate-500 block">Calculated Reorder Point (ROP)</span>
              <span className="text-xl font-extrabold font-mono text-brand-600 dark:text-brand-400">
                {simReorderPoint} units
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Official Purchase Order Modal */}
      <PurchaseOrderModal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        purchaseOrder={activePurchaseOrder}
      />

    </div>
  );
};
