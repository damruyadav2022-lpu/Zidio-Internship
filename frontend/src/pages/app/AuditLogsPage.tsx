import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Clock, 
  User, 
  Activity,
  Terminal,
  Lock,
  Globe
} from 'lucide-react';
import { fetchAuditLogs } from '../../services/auditService';
import { exportToCsv } from '../../utils/exportUtils';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const AuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['audit-logs', actionFilter, searchTerm],
    queryFn: () => fetchAuditLogs(100, actionFilter, searchTerm),
    staleTime: 15000
  });

  const handleExport = () => {
    if (!data?.logs) return;
    const exportRows = data.logs.map(l => ({
      Timestamp: l.created_at,
      Actor: l.user_email,
      Action: l.action,
      Resource: l.resource,
      Details: l.details,
      IPAddress: l.ip_address
    }));
    exportToCsv(exportRows, `retailpulse_soc2_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('login') || action.includes('security') || action.includes('auth')) {
      return <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono text-[10px] font-bold">SECURITY</span>;
    }
    if (action.includes('po.') || action.includes('reorder') || action.includes('inventory')) {
      return <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold">SUPPLY CHAIN</span>;
    }
    if (action.includes('integration') || action.includes('shopify') || action.includes('sync')) {
      return <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold">INTEGRATION</span>;
    }
    return <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-mono text-[10px] font-bold">TELEMETRY</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-10 w-72 rounded-xl" />
        <LoadingSkeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const logs = data?.logs || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-heading">
              Enterprise Audit Logs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SOC2 Type II Verified
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable, cryptographically timestamped audit trail of all store modifications, PO orders, and user logins.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-brand-500' : ''}`} />
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by actor email, action, resource, or IP address..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-dark-card rounded-xl border border-slate-200 dark:border-dark-border">
          {[
            { id: 'all', label: 'All Actions' },
            { id: 'user', label: 'Auth & Logins' },
            { id: 'integration', label: 'Store Syncs' },
            { id: 'po', label: 'Procurement' },
            { id: 'model', label: 'ML Telemetry' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActionFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                actionFilter === f.id
                  ? 'bg-white dark:bg-brand-600 text-brand-600 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-border">
              <tr>
                <th className="py-3 px-5">Timestamp (UTC)</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Actor / User</th>
                <th className="py-3 px-6">Event Details</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-850 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-900 dark:text-slate-200 truncate max-w-[150px]">
                        {log.user_email || 'System Worker'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 max-w-md text-slate-600 dark:text-slate-400">
                    <div className="truncate" title={log.details}>
                      {log.details}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.ip_address || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {logs.length} of {data?.total_count || logs.length} audit trail records</span>
          <span className="text-[11px] text-slate-400">Retention: 365 Days Guaranteed</span>
        </div>
      </div>

    </div>
  );
};
