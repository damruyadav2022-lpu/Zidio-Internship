import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const lower = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  if (lower.includes('critical') || lower.includes('red') || lower.includes('drift detected')) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50';
  } else if (lower.includes('warning') || lower.includes('yellow') || lower.includes('reorder')) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50';
  } else if (lower.includes('healthy') || lower.includes('green') || lower.includes('stable') || lower.includes('optimal') || lower.includes('operational')) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50';
  } else if (lower.includes('blue') || lower.includes('info') || lower.includes('staging') || lower.includes('benchmark')) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
      {status}
    </span>
  );
};

export const RiskBadge: React.FC<{ level: 'Low' | 'Medium' | 'High' | string }> = ({ level }) => {
  const norm = level.toLowerCase();
  if (norm.includes('high')) {
    return <StatusBadge status="High Risk" />;
  }
  if (norm.includes('medium')) {
    return <StatusBadge status="Medium Risk" />;
  }
  return <StatusBadge status="Low Risk" />;
};
