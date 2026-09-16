import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  isPositiveGood?: boolean;
  icon?: LucideIcon;
  subtitle?: string;
  badge?: string;
  className?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  isPositiveGood = true,
  icon: Icon,
  subtitle,
  badge,
  className = '',
  onClick
}) => {
  const hasChange = change !== undefined;
  const isPositive = (change || 0) >= 0;
  
  // Decide if positive is good or bad (e.g. churn or risk increasing is bad)
  const isGood = isPositiveGood ? isPositive : !isPositive;
  const trendColor = isGood
    ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40'
    : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40';

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-brand-300 dark:hover:border-brand-700' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {badge}
            </span>
          )}
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-heading">
          {value}
        </span>
      </div>

      {(hasChange || subtitle) && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {hasChange && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-semibold text-[11px] ${trendColor}`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isPositive ? '+' : ''}{change}%
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
            {subtitle || changeLabel}
          </span>
        </div>
      )}
    </div>
  );
};
