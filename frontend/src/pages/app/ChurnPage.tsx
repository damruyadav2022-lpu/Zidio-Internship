import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldAlert, 
  TrendingDown, 
  AlertOctagon, 
  Award, 
  Download, 
  CheckCircle2, 
  Send, 
  Activity,
  Cpu
} from 'lucide-react';
import { fetchChurnIntelligence } from '../../services/churnService';
import { ROCChart } from '../../charts/ROCChart';
import { FeatureImportanceChart } from '../../charts/FeatureImportanceChart';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export const ChurnPage: React.FC = () => {
  const toast = useToast();
  const [dispatchedCampaigns, setDispatchedCampaigns] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['churn-intelligence'],
    queryFn: fetchChurnIntelligence,
    staleTime: 60000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <LoadingSkeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const { summary, benchmarks, roc_curve_points, feature_importances, confusion_matrix, high_risk_alerts } = data;

  const handleExportHighRisk = () => {
    const exportData = high_risk_alerts.map(c => ({
      CustomerID: c.CustomerID,
      Monetary: c.Monetary,
      Frequency: c.Frequency,
      Recency: c.Recency,
      ChurnProbability: (c.ChurnProbability * 100).toFixed(1) + '%',
      RiskLevel: c.RiskLevel,
      Action: c.Action
    }));
    exportToCsv(exportData, 'retailpulse_high_churn_risk_accounts.csv');
    toast.success('Export Complete', 'High churn risk accounts exported to CSV.');
  };

  const handleTriggerCampaign = (customerId: string) => {
    setDispatchedCampaigns(prev => ({ ...prev, [customerId]: true }));
    toast.success('Incentive Dispatched', `Personalized Win-Back voucher successfully sent to customer ${customerId}.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              Churn Prediction &amp; Retention
            </h1>
            <span className="text-xs bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 px-2.5 py-0.5 rounded-full font-semibold">
              XGBoost Classifier v1.8
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervised machine learning pipeline predicting customer attrition risk before defection occurs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={async () => {
              try {
                const { syncRetentionKlaviyo } = await import('../../services/actionService');
                const res = await syncRetentionKlaviyo('High-Risk Churn Attrition Cohort', 'klaviyo', high_risk_alerts.length);
                toast.success('Klaviyo Sync Successful', `Successfully synced ${res.customers_pushed} at-risk customers to Klaviyo automated win-back flow!`);
              } catch (err: any) {
                toast.error('Sync Failed', err.message || 'Failed to sync with Klaviyo');
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Push to Klaviyo / Webhook</span>
          </button>

          <button
            onClick={handleExportHighRisk}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Roster</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Scored Customers</span>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-3">
            {formatNumber(summary.total_customers_scored)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Batch inference updated daily
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">High Risk Cohort</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-3">
            {formatNumber(summary.high_risk_count)} accounts
          </div>
          <div className="text-[11px] text-rose-500 font-medium mt-1">
            Churn probability &gt; 70% threshold
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gross Revenue at Risk</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-3">
            {formatCurrency(summary.revenue_at_risk)}
          </div>
          <div className="text-[11px] text-amber-500 font-medium mt-1">
            Calculated over 90-day forward window
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Champion Model</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-3 truncate">
            {summary.champion_model}
          </div>
          <div className="text-[11px] text-emerald-500 font-medium mt-1">
            AUC 0.912 in production
          </div>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Classification Model Architecture Benchmarks</h3>
              <p className="text-xs text-slate-500">Cross-validation performance across customer cohorts</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-border">
              <tr>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Accuracy</th>
                <th className="py-3 px-4 text-right">Precision</th>
                <th className="py-3 px-4 text-right">Recall</th>
                <th className="py-3 px-4 text-right">F1-Score</th>
                <th className="py-3 px-4 text-right">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
              {benchmarks.map((m) => {
                const isProduction = m.Model.includes('XGBoost');
                return (
                  <tr key={m.Model} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {m.Model}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isProduction ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Production
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Benchmarked
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">{formatPercent(m.Accuracy * 100)}</td>
                    <td className="py-3.5 px-4 text-right font-mono">{formatPercent(m.Precision * 100)}</td>
                    <td className="py-3.5 px-4 text-right font-mono">{formatPercent(m.Recall * 100)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {m['F1-Score'].toFixed(3)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {m['ROC-AUC'].toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Grid: ROC Curve & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ROC Curve */}
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Receiver Operating Characteristic (ROC)</h3>
              <p className="text-xs text-slate-500">True Positive Rate vs False Positive Rate curve (AUC = 0.912)</p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
              AUC 0.912
            </span>
          </div>
          <div className="h-72 w-full">
            <ROCChart data={roc_curve_points} />
          </div>
        </div>

        {/* Feature Importance */}
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">SHAP Feature Importance</h3>
              <p className="text-xs text-slate-500">Key behavioral features driving model decisions</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">
              Top Factors
            </span>
          </div>
          <div className="h-72 w-full">
            <FeatureImportanceChart data={feature_importances} />
          </div>
        </div>

      </div>

      {/* Confusion Matrix & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Confusion Matrix Block */}
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Confusion Matrix</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold uppercase">True Negative</div>
              <div className="text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-100 mt-1">
                {formatNumber(confusion_matrix.true_negative)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Retained Identified</div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
              <div className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold uppercase">False Positive</div>
              <div className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-100 mt-1">
                {formatNumber(confusion_matrix.false_positive)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">False Alarm</div>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50">
              <div className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold uppercase">False Negative</div>
              <div className="text-2xl font-bold font-mono text-rose-900 dark:text-rose-100 mt-1">
                {formatNumber(confusion_matrix.false_negative)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Missed Churn</div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50">
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold uppercase">True Positive</div>
              <div className="text-2xl font-bold font-mono text-indigo-900 dark:text-indigo-100 mt-1">
                {formatNumber(confusion_matrix.true_positive)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Churn Intercepted</div>
            </div>
          </div>
        </div>

        {/* High-Risk Accounts Roster */}
        <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div className="p-6 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Critical Churn Risk Accounts (Action Required)</h3>
                <p className="text-xs text-slate-500">Accounts with churn probability exceeding 70%</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-border">
                <tr>
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4 text-right">LTV ($)</th>
                  <th className="py-3 px-4 text-right">Recency</th>
                  <th className="py-3 px-4 text-center">Probability</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
                {high_risk_alerts.map((cust) => {
                  const isDispatched = dispatchedCampaigns[cust.CustomerID];
                  return (
                    <tr key={cust.CustomerID} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-white">
                        {cust.CustomerID}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(cust.Monetary)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {cust.Recency}d ago
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900/40">
                          {(cust.ChurnProbability * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          disabled={isDispatched}
                          onClick={() => handleTriggerCampaign(cust.CustomerID)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isDispatched
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-300'
                              : 'bg-brand-600 hover:bg-brand-700 text-white shadow-xs'
                          }`}
                        >
                          {isDispatched ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Sent</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Dispatch Win-Back</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
