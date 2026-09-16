import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded ${className}`} />
);

export const LoadingSkeleton = Skeleton;

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 p-6 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="p-6 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card overflow-hidden">
    <div className="p-4 border-b border-slate-100 dark:border-dark-border flex items-center justify-between">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-24" />
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/8" />
        </div>
      ))}
    </div>
  </div>
);
