import React from 'react';
import { Sparkles, ArrowRight, ShieldAlert, TrendingUp, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AIRecommendation } from '../types';

interface AIInsightCardProps {
  recommendation: AIRecommendation;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ recommendation }) => {
  const navigate = useNavigate();

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'Critical':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">CRITICAL RISK</span>;
      case 'High':
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">HIGH PRIORITY</span>;
      default:
        return <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">INTELLIGENCE</span>;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'demand_forecast':
        return <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'churn_retention':
        return <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50/70 via-white to-indigo-50/50 dark:from-purple-950/20 dark:via-dark-card dark:to-indigo-950/20 border border-purple-200/80 dark:border-purple-900/40 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all relative overflow-hidden">
      {/* Top banner line */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
            {getIcon(recommendation.type)}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>RetailPulse Intelligence</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {recommendation.title}
            </h4>
          </div>
        </div>
        {getUrgencyBadge(recommendation.urgency)}
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3.5">
        {recommendation.description}
      </p>

      {/* Action callout box */}
      <div className="p-3 bg-white/80 dark:bg-slate-900/60 border border-purple-100 dark:border-purple-900/30 rounded-lg mb-4 text-xs">
        <span className="font-semibold text-slate-900 dark:text-slate-100 block mb-0.5">Recommended Action:</span>
        <span className="text-purple-900 dark:text-purple-300">{recommendation.action}</span>
      </div>

      {/* Footer metadata & action */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-purple-100/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400">Confidence:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{recommendation.confidence}%</span>
        </div>
        <button
          onClick={() => navigate(recommendation.route)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
        >
          <span>Take Action</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
