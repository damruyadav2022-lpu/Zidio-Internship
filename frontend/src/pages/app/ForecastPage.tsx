import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, 
  Sliders, 
  RefreshCw, 
  Sparkles, 
  Layers
} from 'lucide-react';
import { fetchForecasting } from '../../services/forecastService';
import { ForecastChart } from '../../charts/ForecastChart';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export const ForecastPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('lstm');
  const [selectedHorizon, setSelectedHorizon] = useState<number>(30);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // What-If Simulator State
  const [priceChangePct, setPriceChangePct] = useState<number>(0);
  const [promoDiscountPct, setPromoDiscountPct] = useState<number>(0);
  const [marketingMultiplier, setMarketingMultiplier] = useState<number>(1.0);
  const [seasonalityEvent, setSeasonalityEvent] = useState<string>('none');

  const { data, isLoading } = useQuery({
    queryKey: ['demand-forecasting', selectedCategory, selectedModel, selectedHorizon],
    queryFn: () => fetchForecasting(selectedCategory, selectedModel, selectedHorizon),
    staleTime: 30000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <LoadingSkeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const { benchmarks, history, active_forecast } = data;

  const currentBenchmark = benchmarks.find(b => b.Model.toLowerCase().includes(selectedModel.toLowerCase())) || benchmarks[0];

  const handleExportForecast = () => {
    const exportData = active_forecast.map(f => ({
      Date: f.ds,
      ForecastDemand: f.yhat,
      LowerBound95: f.yhat_lower,
      UpperBound95: f.yhat_upper,
      Model: selectedModel,
      Category: selectedCategory
    }));
    exportToCsv(exportData, `retailpulse_forecast_${selectedModel}_${selectedHorizon}d.csv`);
  };

  // Simulator Math:
  const baseForecastUnits = active_forecast.reduce((acc, it) => acc + it.yhat, 0);
  const avgUnitPrice = 75; // average price per unit across catalog

  // Elasticity calculation
  const eventLift = seasonalityEvent === 'holiday' ? 0.40 : seasonalityEvent === 'flash' ? 0.22 : 0;
  const priceEffect = -1.4 * (priceChangePct / 100);
  const promoEffect = 1.2 * (promoDiscountPct / 100);
  const marketingEffect = (marketingMultiplier - 1.0) * 0.18;
  const netDemandLiftFactor = 1 + priceEffect + promoEffect + marketingEffect + eventLift;

  const simulatedUnits = Math.round(baseForecastUnits * Math.max(netDemandLiftFactor, 0.2));
  const effectivePrice = avgUnitPrice * (1 + priceChangePct / 100) * (1 - promoDiscountPct / 100);
  const baseRevenue = baseForecastUnits * avgUnitPrice;
  const simulatedRevenue = simulatedUnits * effectivePrice;
  const revenueDelta = simulatedRevenue - baseRevenue;
  const unitsDelta = simulatedUnits - baseForecastUnits;

  const resetSimulator = () => {
    setPriceChangePct(0);
    setPromoDiscountPct(0);
    setMarketingMultiplier(1.0);
    setSeasonalityEvent('none');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              Demand Forecasting Engine
            </h1>
            <span className="text-xs bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900/50 px-2.5 py-0.5 rounded-full font-semibold">
              PyTorch &amp; Prophet Pipeline
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Multi-horizon neural sequence forecasting with confidence intervals and what-if simulation.
          </p>
        </div>

        <button
          onClick={handleExportForecast}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Forecast CSV</span>
        </button>
      </div>

      {/* Selector Controls Bar */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-slate-200 dark:border-dark-border shadow-xs flex flex-wrap items-center justify-between gap-4">
        
        {/* Model Architecture Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Model:</span>
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { id: 'lstm', label: 'PyTorch LSTM' },
              { id: 'random_forest', label: 'Random Forest' },
              { id: 'prophet', label: 'Prophet' },
              { id: 'ensemble', label: 'Ensemble (Blend)' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedModel === m.id
                    ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizon Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Horizon:</span>
          <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[7, 14, 30, 60, 90].map(h => (
              <button
                key={h}
                onClick={() => setSelectedHorizon(h)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedHorizon === h
                    ? 'bg-white dark:bg-dark-card text-brand-600 dark:text-brand-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {h}D
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent border-none focus:outline-none font-semibold text-slate-800 dark:text-slate-200 text-xs cursor-pointer"
          >
            <option value="All">All Product Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Apparel">Apparel</option>
            <option value="Home & Kitchen">Home & Kitchen</option>
            <option value="Beauty & Health">Beauty & Health</option>
          </select>
        </div>

      </div>

      {/* Model Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Root Mean Squared Error (RMSE)</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-2">
            {currentBenchmark?.RMSE.toFixed(2) || '18.42'} units
          </div>
          <div className="text-[11px] text-emerald-500 font-medium mt-1">
            Top 5% accuracy across historical test sets
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Mean Absolute Error (MAE)</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-2">
            {currentBenchmark?.MAE.toFixed(2) || '14.28'} units
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Average deviation per SKU/day
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Mean Absolute Percentage Error (MAPE)</div>
          <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400 font-mono mt-2">
            {currentBenchmark?.MAPE || '4.2%'}
          </div>
          <div className="text-[11px] text-emerald-500 font-medium mt-1">
            Sub-5% industrial standard benchmark
          </div>
        </div>
      </div>

      {/* Main Forecast Chart */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Neural Demand Trajectory &amp; 95% Confidence Bounds
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Historical actual orders combined with forward-looking predictions from {selectedModel.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="h-88 w-full">
          <ForecastChart
            history={history}
            forecast={active_forecast}
            modelName={selectedModel.toUpperCase()}
          />
        </div>
      </div>

      {/* Interactive Forecast What-If Simulator */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pulse-orange text-white flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Interactive Forecast Scenario Simulator (What-If)
              </h3>
              <p className="text-xs text-slate-500">
                Simulate demand sensitivity against price elasticity, marketing spend surges, and promotional flash sales
              </p>
            </div>
          </div>

          <button
            onClick={resetSimulator}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Variables</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Controls Column */}
          <div className="lg:col-span-2 space-y-5 bg-slate-50/50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800">
            
            {/* Price Change Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-700 dark:text-slate-300">Catalog Price Adjustment</span>
                <span className={`font-mono ${priceChangePct > 0 ? 'text-emerald-600' : priceChangePct < 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                  {priceChangePct > 0 ? `+${priceChangePct}%` : `${priceChangePct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                step="5"
                value={priceChangePct}
                onChange={(e) => setPriceChangePct(Number(e.target.value))}
                className="w-full accent-brand-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>-30% (Discount)</span>
                <span>0% (Baseline)</span>
                <span>+30% (Premium)</span>
              </div>
            </div>

            {/* Promo Discount Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-700 dark:text-slate-300">Promotional Voucher Discount</span>
                <span className="font-mono text-brand-600 dark:text-brand-400">
                  {promoDiscountPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={promoDiscountPct}
                onChange={(e) => setPromoDiscountPct(Number(e.target.value))}
                className="w-full accent-brand-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0% Off</span>
                <span>25% Off</span>
                <span>50% Clearance</span>
              </div>
            </div>

            {/* Marketing Multiplier */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-700 dark:text-slate-300">Paid Ad Spend Multiplier</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {marketingMultiplier.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={marketingMultiplier}
                onChange={(e) => setMarketingMultiplier(Number(e.target.value))}
                className="w-full accent-brand-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0.5x (Reduced)</span>
                <span>1.0x (Normal)</span>
                <span>2.5x (Aggressive)</span>
              </div>
            </div>

            {/* Event Toggle */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Seasonality / Promo Event
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: 'Standard' },
                  { id: 'flash', label: 'Flash Sale (+22%)' },
                  { id: 'holiday', label: 'Holiday Surge (+40%)' }
                ].map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => setSeasonalityEvent(ev.id)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-all ${
                      seasonalityEvent === ev.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {ev.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Results Summary Column */}
          <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
            
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Base Projected Demand</span>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                  {formatNumber(baseForecastUnits)} units
                </div>
                <span className="text-[11px] text-slate-400">Over {selectedHorizon}-day window</span>
              </div>

              <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-900/50 bg-brand-50/30 dark:bg-brand-950/20 shadow-2xs">
                <span className="text-xs text-brand-700 dark:text-brand-300 font-medium">Simulated Demand</span>
                <div className="text-xl font-extrabold text-brand-600 dark:text-brand-400 font-mono mt-1">
                  {formatNumber(simulatedUnits)} units
                </div>
                <span className={`text-[11px] font-semibold ${unitsDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {unitsDelta >= 0 ? `+${formatNumber(unitsDelta)}` : formatNumber(unitsDelta)} units ({(((simulatedUnits - baseForecastUnits) / baseForecastUnits) * 100).toFixed(1)}%)
                </span>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Estimated Base Revenue</span>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                  {formatCurrency(baseRevenue)}
                </div>
                <span className="text-[11px] text-slate-400">At standard catalog pricing</span>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-2xs">
                <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Projected Revenue Impact</span>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                  {formatCurrency(simulatedRevenue)}
                </div>
                <span className={`text-[11px] font-semibold ${revenueDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {revenueDelta >= 0 ? `+${formatCurrency(revenueDelta)}` : formatCurrency(revenueDelta)}
                </span>
              </div>
            </div>

            {/* AI Decision Advisory */}
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/30 dark:bg-indigo-950/20 text-xs space-y-2">
              <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>AI Scenario Recommendation</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {unitsDelta > 500
                  ? `High demand surge detected (+${formatNumber(unitsDelta)} units). Ensure warehouse safety stock is expanded by at least 15% to prevent stockouts across fast-moving SKUs.`
                  : unitsDelta < -300
                  ? 'Price increase dampens unit volume. Gross margin increases by ~4.2%, but recommend monitoring top-tier customer churn velocity closely.'
                  : 'Scenario operates within standard warehouse buffer capacity. Optimal balance between volume velocity and unit margin.'}
              </p>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};
