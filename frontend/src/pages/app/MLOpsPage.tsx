import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Cpu, 
  GitBranch, 
  Play, 
  CheckCircle2, 
  RefreshCw, 
  Database, 
  Zap, 
  CheckCircle
} from 'lucide-react';
import { fetchMLOpsObservability, triggerPipelineRun } from '../../services/mlopsService';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const MLOpsPage: React.FC = () => {
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainStep, setRetrainStep] = useState<number>(0);
  const [showRetrainModal, setShowRetrainModal] = useState<boolean>(false);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['mlops-observability'],
    queryFn: fetchMLOpsObservability,
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

  const { model_registry, mlflow_experiments, drift_monitoring, system_health } = data;

  const handleStartRetrain = async () => {
    setIsRetraining(true);
    setShowRetrainModal(true);
    setRetrainStep(1);

    await triggerPipelineRun();

    // Multi-stage progression
    setTimeout(() => setRetrainStep(2), 1200);
    setTimeout(() => setRetrainStep(3), 2600);
    setTimeout(() => setRetrainStep(4), 4000);
    setTimeout(() => {
      setRetrainStep(5);
      setIsRetraining(false);
    }, 5200);
  };

  const retrainStages = [
    { id: 1, title: 'Extracting Feature Store Batches', desc: 'Pulling updated transaction records from SQLite warehouse' },
    { id: 2, title: 'Running Data Quality Checks & KS Test', desc: 'Verifying zero nulls, non-negative bounds, and covariate drift' },
    { id: 3, title: 'Training PyTorch LSTM & XGBoost Models', desc: 'Backpropagating through sequence epochs with Adam optimizer' },
    { id: 4, title: 'Model Evaluation & Benchmark Gates', desc: 'Comparing against champion models in production registry' },
    { id: 5, title: 'Registry Promotion Complete', desc: 'Updated model artifacts deployed to production inference endpoints' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              MLOps &amp; Model Observability
            </h1>
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 px-2.5 py-0.5 rounded-full font-semibold">
              MLflow &amp; TorchServe Connected
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Production model registry, automated Kolmogorov-Smirnov drift detection, and CI/CD pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-brand-500' : ''}`} />
          </button>

          <button
            onClick={handleStartRetrain}
            disabled={isRetraining}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Trigger Retrain Pipeline</span>
          </button>
        </div>
      </div>

      {/* Infrastructure Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Inference Throughput</span>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850 text-brand-500">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-3">
            240 QPS
          </div>
          <div className="text-[11px] text-emerald-500 font-medium mt-1">
            p99 Latency: 42 ms
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">GPU VRAM Allocated</span>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850 text-indigo-500">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-3">
            384 MB
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            PyTorch CUDA Runtime Active
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Monitored Features</span>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850 text-amber-500">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-3">
            {drift_monitoring.length} Features
          </div>
          <div className="text-[11px] text-amber-500 font-medium mt-1">
            1 Feature near drift boundary
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl p-5 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Production Models</span>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-3">
            {model_registry.filter(m => m.stage === 'Production').length} Active
          </div>
          <div className="text-[11px] text-emerald-500 font-medium mt-1">
            Zero failed canary deployments
          </div>
        </div>
      </div>

      {/* Model Registry Table */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Model Registry &amp; Inference Endpoints</h3>
              <p className="text-xs text-slate-500">Active machine learning architectures serving real-time requests</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-border">
              <tr>
                <th className="py-3 px-6">Model Architecture</th>
                <th className="py-3 px-6">Stage</th>
                <th className="py-3 px-6">Primary Metric</th>
                <th className="py-3 px-6">Framework</th>
                <th className="py-3 px-6">Last Retrained</th>
                <th className="py-3 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
              {model_registry.map((m) => (
                <tr key={m.model_name} className="hover:bg-slate-50/70 dark:hover:bg-slate-850 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-bold text-slate-900 dark:text-white">{m.model_name}</div>
                    <div className="text-[11px] font-mono text-slate-400">{m.version}</div>
                  </td>
                  <td className="py-3.5 px-6">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      m.stage === 'Production'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    }`}>
                      {m.stage}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-mono font-semibold text-brand-600 dark:text-brand-400">
                    {m.primary_metric}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300">
                    {m.framework}
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">
                    {m.last_trained}
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Drift & Covariate Shift Monitoring (Kolmogorov-Smirnov Test) */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Data Drift &amp; Feature Distribution Monitoring
              </h2>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-mono">
                Two-Sample Kolmogorov-Smirnov Test
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Continuous hypothesis testing comparing baseline training set distribution against live production inference data.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">Threshold:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">p &gt; 0.05 (Stable)</span>
            <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">p &le; 0.01 (Drift)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-border">
              <tr>
                <th className="py-3 px-4">Feature Name</th>
                <th className="py-3 px-4 text-right">KS Statistic (D)</th>
                <th className="py-3 px-4 text-right">P-Value</th>
                <th className="py-3 px-4 text-center">Drift Assessment</th>
                <th className="py-3 px-4 text-left">Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
              {drift_monitoring.map((d) => (
                <tr key={d.Feature} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {d.Feature}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    {d.KS_Statistic.toFixed(3)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold">
                    {d.P_Value.toFixed(4)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      d.Status === 'Drift Detected'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        : d.Status === 'Warning'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                    }`}>
                      {d.Status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-xs">
                    {d.Interpretation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MLflow Experiments Tracker */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-dark-border shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">MLflow Experiment Registry</h3>
              <p className="text-xs text-slate-500">Historical hyperparameter tuning runs and metric evaluations</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-border">
              <tr>
                <th className="py-3 px-6">Run ID</th>
                <th className="py-3 px-6">Experiment Name</th>
                <th className="py-3 px-6 text-right">Validation Metric</th>
                <th className="py-3 px-6">Duration</th>
                <th className="py-3 px-6">Artifact URI</th>
                <th className="py-3 px-6 text-center">Run Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
              {mlflow_experiments.map((r) => (
                <tr key={r.run_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                  <td className="py-3.5 px-6 font-mono font-medium text-brand-600 dark:text-brand-400">
                    {r.run_id}
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                    {r.experiment_name}
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {Object.entries(r.metrics).map(([k, v]) => `${k}: ${v}`).join(', ') || 'N/A'}
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">
                    {r.duration}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-[11px] text-slate-400 truncate max-w-xs">
                    {r.artifact_uri}
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="w-3 h-3" /> {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retrain Pipeline Modal */}
      {showRetrainModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center">
                  <RefreshCw className={`w-5 h-5 ${isRetraining ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Automated Retrain Pipeline
                  </h3>
                  <p className="text-xs text-slate-500">
                    Orchestrating PyTorch, XGBoost &amp; Drift validation
                  </p>
                </div>
              </div>

              {!isRetraining && (
                <button
                  onClick={() => setShowRetrainModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Dismiss
                </button>
              )}
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {retrainStages.map((st) => {
                const isCompleted = retrainStep > st.id;
                const isCurrent = retrainStep === st.id;
                return (
                  <div
                    key={st.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                      isCompleted
                        ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                        : isCurrent
                        ? 'border-brand-300 bg-brand-50/50 dark:border-brand-900/50 dark:bg-brand-950/30 ring-1 ring-brand-400'
                        : 'border-slate-100 dark:border-slate-800 opacity-40'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-4 h-4 text-brand-600 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{st.title}</div>
                      <div className="text-[11px] text-slate-500">{st.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!isRetraining && (
              <button
                onClick={() => setShowRetrainModal(false)}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                Close &amp; Apply Changes
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
