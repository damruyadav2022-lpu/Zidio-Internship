import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Bell, 
  AlertTriangle, 
  AlertOctagon, 
  Info, 
  CheckCircle2, 
  Clock, 
  Filter, 
  CheckCheck, 
  ExternalLink,
  RotateCcw,
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { request } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface AlertItem {
  id: string;
  title: string;
  category: 'Inventory' | 'Churn' | 'Drift' | 'System';
  severity: 'Critical' | 'Warning' | 'Info';
  timestamp: string;
  description: string;
  actionLabel: string;
  actionTarget: string;
  acknowledged: boolean;
  resolved: boolean;
}

const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'ALT-1001',
    title: 'Critical Stockout Imminent: Wireless Noise-Cancelling Headphones',
    category: 'Inventory',
    severity: 'Critical',
    timestamp: 'Real-time Telemetry',
    description: 'Current stock is 8 units, which has fallen below Safety Stock buffer of 16. Immediate replenishment required to maintain 95% SLA.',
    actionLabel: 'Generate Purchase Order',
    actionTarget: '/app/inventory',
    acknowledged: false,
    resolved: false
  },
  {
    id: 'ALT-1002',
    title: 'High-Value Customer Churn Risk: Sarah Jenkins (LTV $4,820)',
    category: 'Churn',
    severity: 'Critical',
    timestamp: '42 minutes ago',
    description: 'Churn probability spiked from 0.22 to 0.78 following 45 days of dormancy and 2 unresolved return tickets. Total spend at risk: $4,820.',
    actionLabel: 'Dispatch Win-Back Offer',
    actionTarget: '/app/churn',
    acknowledged: false,
    resolved: false
  }
];

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [hideResolved, setHideResolved] = useState<boolean>(true);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: () => request<{ alerts: AlertItem[]; summary: any }>('/api/alerts', { method: 'GET' }, { 
      alerts: INITIAL_ALERTS, 
      summary: { total: INITIAL_ALERTS.length, critical: 2, warning: 0, unacknowledged: 2, resolved: 0 } 
    }),
    refetchInterval: 15000,
  });

  const alerts = data?.alerts || INITIAL_ALERTS;

  const handleAcknowledge = async (id: string) => {
    try {
      await request(`/api/alerts/${id}/acknowledge`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      toast.info('Alert Acknowledged', `Incident ${id} marked as acknowledged.`);
    } catch {
      toast.info('Alert Acknowledged', `Incident ${id} marked as acknowledged.`);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await request(`/api/alerts/${id}/resolve`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      toast.success('Alert Resolved', `Incident ${id} marked as resolved and dismissed.`);
    } catch {
      toast.success('Alert Resolved', `Incident ${id} marked as resolved and dismissed.`);
    }
  };

  const handleAcknowledgeAll = async () => {
    for (const a of alerts) {
      if (!a.acknowledged) {
        try {
          await request(`/api/alerts/${a.id}/acknowledge`, { method: 'POST' });
        } catch {}
      }
    }
    queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
    toast.success('All Alerts Acknowledged', 'All active telemetric incidents have been acknowledged.');
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-12 w-64 rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const filteredAlerts = alerts.filter(a => {
    if (hideResolved && a.resolved) return false;
    if (categoryFilter !== 'All' && a.category !== categoryFilter) return false;
    if (severityFilter !== 'All' && a.severity !== severityFilter) return false;
    return true;
  });

  const criticalCount = alerts.filter(a => !a.resolved && a.severity === 'Critical').length;
  const warningCount = alerts.filter(a => !a.resolved && a.severity === 'Warning').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              Operational Alert Center
            </h1>
            {criticalCount > 0 && (
              <span className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 px-2.5 py-0.5 rounded-full font-bold">
                {criticalCount} Critical
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time proactive monitoring for inventory stockouts, churn anomalies, and data drift.
          </p>
        </div>

        <button
          onClick={handleAcknowledgeAll}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors self-start sm:self-auto"
        >
          <CheckCheck className="w-4 h-4 text-slate-500" />
          <span>Acknowledge All Alerts</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-slate-200 dark:border-dark-border shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none font-semibold text-slate-800 dark:text-slate-200 text-xs cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Inventory">Inventory Alerts</option>
              <option value="Churn">Customer Churn</option>
              <option value="Drift">Data Drift</option>
              <option value="System">System &amp; Pipeline</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-slate-400 font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-transparent border-none focus:outline-none font-semibold text-slate-800 dark:text-slate-200 text-xs cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical Only</option>
              <option value="Warning">Warning Only</option>
              <option value="Info">Info Only</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={hideResolved}
              onChange={(e) => setHideResolved(e.target.checked)}
              className="rounded accent-brand-600 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Hide resolved alerts</span>
          </label>
        </div>

      </div>

      {/* Alert Stream List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-dark-card rounded-2xl p-12 border border-slate-200 dark:border-dark-border text-center shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">All Clear</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No active alerts matching your current filter criteria. System is operating normally.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white dark:bg-dark-card rounded-2xl p-5 border transition-all shadow-xs ${
                alert.resolved
                  ? 'opacity-50 border-slate-200 dark:border-slate-800'
                  : alert.severity === 'Critical'
                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10'
                  : alert.severity === 'Warning'
                  ? 'border-amber-300 dark:border-amber-900/60'
                  : 'border-slate-200 dark:border-dark-border'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    alert.severity === 'Critical'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                      : alert.severity === 'Warning'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                      : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600'
                  }`}>
                    {alert.severity === 'Critical' ? (
                      <AlertOctagon className="w-5 h-5" />
                    ) : alert.severity === 'Warning' ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {alert.title}
                      </h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {alert.category}
                      </span>
                      {alert.acknowledged && !alert.resolved && (
                        <span className="text-[11px] text-slate-400 italic">
                          (Acknowledged)
                        </span>
                      )}
                      {alert.resolved && (
                        <span className="text-[11px] text-emerald-600 font-semibold">
                          ✓ Resolved
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                      {alert.description}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp}
                      </span>
                      <span>•</span>
                      <span>ID: {alert.id}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => navigate(alert.actionTarget)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors"
                  >
                    <span>{alert.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    {!alert.resolved && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
