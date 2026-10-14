'use client';

import React from 'react';

export interface StatCardProps {
  title: string;
  value: number | string;
  hint?: string;
  icon?: React.ReactNode;
  accentColor?: 'teal' | 'emerald' | 'amber' | 'sky' | 'rose' | 'purple';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export function StatCard({
  title,
  value,
  hint,
  icon,
  accentColor = 'teal',
  trend,
}: StatCardProps) {
  const accentStyles: Record<string, { bg: string; text: string }> = {
    teal: { bg: 'bg-[#1b7d95]/10', text: 'text-[#1b7d95] dark:text-sky-400' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' },
    sky: { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-600 dark:text-rose-400' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-600 dark:text-purple-400' },
  };

  const style = accentStyles[accentColor] || accentStyles.teal;

  return (
    <div className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
          {title}
        </span>
        {icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <strong className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : value}
        </strong>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {hint && (
        <span className="text-xs text-slate-400 dark:text-slate-500 mt-2 line-clamp-1">
          {hint}
        </span>
      )}
    </div>
  );
}
