import React from 'react';
import { X, CheckCircle2, Server, Database, Brain, Activity, Clock, RefreshCw } from 'lucide-react';
import { SystemHealthItem } from '../types';

interface SystemHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthItems?: SystemHealthItem[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const DEFAULT_HEALTH: SystemHealthItem[] = [
  { service: 'FastAPI REST Server', status: 'Operational', latency_ms: 14, uptime: '99.98%' },
  { service: 'SQLite Primary Relational Store', status: 'Operational', latency_ms: 3, tables: 17 },
  { service: 'PyTorch Deep Learning Engine', status: 'Operational', latency_ms: 28, device: 'CPU / Optimized' },
  { service: 'MLflow Experiment Tracking', status: 'Operational', latency_ms: 19, active_runs: 3 },
  { service: 'Data Pipeline & ETL Watchdog', status: 'Operational', latency_ms: 8, last_sync: '12m ago' }
];

export const SystemHealthModal: React.FC<SystemHealthModalProps> = ({
  isOpen,
  onClose,
  healthItems = DEFAULT_HEALTH,
  onRefresh,
  isRefreshing = false
}) => {
  if (!isOpen) return null;

  const getServiceIcon = (service: string) => {
    if (service.includes('API') || service.includes('Server')) return Server;
    if (service.includes('SQL') || service.includes('Database')) return Database;
    if (service.includes('PyTorch') || service.includes('Learning')) return Brain;
    if (service.includes('MLflow')) return Activity;
    return Clock;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Platform System Health
              </h3>
              <p className="text-xs text-slate-500">Live infrastructure latency & connectivity audit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Services list */}
        <div className="p-5 space-y-3">
          {healthItems.map((item, idx) => {
            const Icon = getServiceIcon(item.service);
            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white block">
                      {item.service}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Response time: <strong className="text-slate-700 dark:text-slate-300">{item.latency_ms}ms</strong>
                      {item.uptime && ` • Uptime: ${item.uptime}`}
                      {item.tables && ` • Tables: ${item.tables}`}
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {item.status}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-dark-border bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span>Overall Health: <strong>100% Operational</strong></span>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Verifying...' : 'Re-check health'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
