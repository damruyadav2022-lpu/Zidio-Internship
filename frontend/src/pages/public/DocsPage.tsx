import React, { useState } from 'react';
import { Terminal, Database, Code, BookOpen, Layers, CheckCircle } from 'lucide-react';

export const DocsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'math' | 'architecture'>('endpoints');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      
      <div>
        <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
          Developer & Architecture Reference
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-heading mt-2">
          RetailPulse Technical Documentation
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Complete REST API reference, machine learning pipeline architecture, and replenishment formula definitions.
        </p>

        <div className="mt-6 flex gap-2 border-b border-slate-200 dark:border-dark-border pb-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'endpoints' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'text-slate-500'}`}
          >
            REST API Endpoints
          </button>
          <button
            onClick={() => setActiveTab('math')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'math' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'text-slate-500'}`}
          >
            Mathematical Formulas
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'architecture' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300' : 'text-slate-500'}`}
          >
            System Architecture
          </button>
        </div>
      </div>

      {/* Tab 1: Endpoints */}
      {activeTab === 'endpoints' && (
        <div className="space-y-6 text-xs">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold">GET</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">/api/overview</span>
            </div>
            <p className="text-slate-500">Retrieves executive KPIs (GMV, Orders, AOV, Margin), 12-month revenue trend, category sales, and regional breakdown.</p>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
              curl -X GET "http://localhost:8000/api/overview?date_range=30d"
            </div>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold">GET</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">/api/customers</span>
            </div>
            <p className="text-slate-500">Paginated, filterable customer list with RFM metrics, K-Means segment, and XGBoost churn probability.</p>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
              curl -X GET "http://localhost:8000/api/customers?segment=VIP%20Champions&limit=20&page=1"
            </div>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold">GET</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">/api/forecasting</span>
            </div>
            <p className="text-slate-500">Fetches 30-day historical actuals + forward demand projection from PyTorch LSTM neural network with 95% confidence intervals.</p>
            <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
              curl -X GET "http://localhost:8000/api/forecasting?model=lstm&horizon=30"
            </div>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">POST</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">/api/inventory/purchase-order</span>
            </div>
            <p className="text-slate-500">Generates formal purchase order with unique PO number, vendor details, item lines, and total order capitalization.</p>
          </div>
        </div>
      )}

      {/* Tab 2: Math */}
      {activeTab === 'math' && (
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Replenishment & Safety Stock Formulas</h3>
          
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 font-mono text-xs text-brand-700 dark:text-brand-300">
            Safety Stock (SS) = Z × σ_demand × √(Lead Time)
          </div>
          <p>Where $Z$ is the standard normal deviate representing desired stockout protection (service level):</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>90% Service Level: $Z = 1.282$</li>
            <li>95% Service Level: $Z = 1.645$</li>
            <li>99% Service Level: $Z = 2.326$</li>
          </ul>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 font-mono text-xs text-purple-700 dark:text-purple-300">
            Reorder Point (ROP) = (Average Daily Demand × Lead Time) + Safety Stock
          </div>
          <p>When Current Stock drops below ROP, the replenishment engine recommends an order batch of $(1.5 \times ROP) - CurrentStock$.</p>
        </div>
      )}

      {/* Tab 3: Architecture */}
      {activeTab === 'architecture' && (
        <div className="p-8 rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Full-Stack Decoupled Architecture</h3>
          <p>
            The frontend is an entirely standalone Single Page Application built on React, TypeScript, and Vite. All communication is routed through centralized services to FastAPI.
          </p>
          <div className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto">
            React Frontend (TanStack Query) → REST /api → FastAPI Backend → SQLite Store + PyTorch / XGBoost Engines
          </div>
          <p>
            In production, containerized microservices run inside Docker / Kubernetes pods with readiness probes and automated health checks.
          </p>
        </div>
      )}

    </div>
  );
};
