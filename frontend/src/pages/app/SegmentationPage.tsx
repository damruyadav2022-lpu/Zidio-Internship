import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Crown, 
  HeartHandshake, 
  AlertTriangle, 
  UserX, 
  Download, 
  Sparkles, 
  ArrowRight,
  Target
} from 'lucide-react';
import { fetchSegmentation } from '../../services/segmentationService';
import { RFMScatterChart } from '../../charts/RFMScatterChart';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export const SegmentationPage: React.FC = () => {
  const [activeSegmentFilter, setActiveSegmentFilter] = useState<string>('All');

  const { data, isLoading } = useQuery({
    queryKey: ['segmentation-analysis'],
    queryFn: fetchSegmentation,
    staleTime: 60000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
        <LoadingSkeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const { personas, scatter_points } = data;

  const handleExportSegments = () => {
    const exportData = personas.map(p => ({
      Segment: p.Segment,
      Count: p.CustomerCount,
      SharePct: p.CustomerPct + '%',
      AvgMonetary: p.AvgMonetary,
      AvgRecencyDays: p.AvgRecency,
      AvgFrequency: p.AvgFrequency,
      RevenueContribution: p.TotalMonetary,
      Strategy: p.ActionStrategy
    }));
    exportToCsv(exportData, 'retailpulse_rfm_segments.csv');
  };

  const getPersonaIcon = (name: string) => {
    if (name.includes('Champion')) return <Crown className="w-5 h-5 text-amber-500" />;
    if (name.includes('Loyal')) return <HeartHandshake className="w-5 h-5 text-brand-500" />;
    if (name.includes('Risk')) return <AlertTriangle className="w-5 h-5 text-rose-500" />;
    return <UserX className="w-5 h-5 text-slate-400" />;
  };

  const getPersonaBorder = (name: string, isSelected: boolean) => {
    if (!isSelected && activeSegmentFilter !== 'All') return 'opacity-50 border-slate-200 dark:border-slate-800';
    if (isSelected) return 'ring-2 ring-brand-500 border-brand-500 shadow-md';
    return 'border-slate-200 dark:border-dark-border hover:border-brand-300 dark:hover:border-brand-800';
  };

  const filteredScatterPoints = activeSegmentFilter === 'All'
    ? scatter_points
    : scatter_points.filter(p => p.Segment === activeSegmentFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-heading">
              Customer Segmentation
            </h1>
            <span className="text-xs bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-900/50 px-2.5 py-0.5 rounded-full font-semibold">
              K-Means Clustered (k=4)
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Unsupervised machine learning cohort analysis across Recency, Frequency, and Monetary vectors.
          </p>
        </div>

        <button
          onClick={handleExportSegments}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>Export Segment Metrics</span>
        </button>
      </div>

      {/* 4 Persona Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {personas.map((persona) => {
          const isSelected = activeSegmentFilter === persona.Segment;
          return (
            <div
              key={persona.Segment}
              onClick={() => setActiveSegmentFilter(isSelected ? 'All' : persona.Segment)}
              className={`bg-white dark:bg-dark-card rounded-2xl p-5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${getPersonaBorder(persona.Segment, isSelected)}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                    {getPersonaIcon(persona.Segment)}
                  </div>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {persona.CustomerPct}% of base
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {persona.Segment}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {persona.ActionStrategy}
                </p>

                {/* Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cohort Size</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatNumber(persona.CustomerCount)} customers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Monetary</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(persona.AvgMonetary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Frequency</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{persona.AvgFrequency} orders</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Recency</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{persona.AvgRecency} days</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 flex items-center justify-between">
                  <span>{isSelected ? 'Filter active' : 'Click to isolate'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cluster Scatter Visualization (PCA 2D Projection) */}
      <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                2D Principal Component (PCA) Cluster Projection
              </h2>
              {activeSegmentFilter !== 'All' && (
                <button
                  onClick={() => setActiveSegmentFilter('All')}
                  className="text-xs text-brand-600 dark:text-brand-400 underline font-semibold"
                >
                  Reset to All
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dimensionality reduction of RFM vectors showing mathematical cohort boundaries and customer density.
            </p>
          </div>
        </div>

        <div className="h-96 w-full">
          <RFMScatterChart
            data={filteredScatterPoints}
          />
        </div>
      </div>

      {/* RFM Centroids & Strategic Playbook Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cluster Centroids Table */}
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cluster Mathematical Centroids</h3>
              <p className="text-xs text-slate-500">Averages in 3-dimensional RFM feature space</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-dark-border">
                <tr>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4 text-right">Recency (Days)</th>
                  <th className="py-3 px-4 text-right">Frequency (Orders)</th>
                  <th className="py-3 px-4 text-right">Monetary (Mean $)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-300">
                {personas.map((p) => (
                  <tr key={p.Segment} className="hover:bg-slate-50/60 dark:hover:bg-slate-850">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {p.Segment}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{p.AvgRecency.toFixed(1)}d</td>
                    <td className="py-3 px-4 text-right font-mono">{p.AvgFrequency.toFixed(1)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.AvgMonetary)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tactical Automation Playbook */}
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-slate-200 dark:border-dark-border shadow-xs">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Automated Campaign Directives</h3>
              <p className="text-xs text-slate-500">Algorithmically generated lifecycle triggers</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {personas.map((p) => (
              <div
                key={p.Segment}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1"
              >
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {getPersonaIcon(p.Segment)}
                  <span>{p.Segment}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  {p.ActionStrategy}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
