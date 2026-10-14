'use client';

import React from 'react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required,
  hint,
  error,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</span>
      )}
      {error && <span className="text-xs font-medium text-rose-500 mt-0.5">{error}</span>}
    </div>
  );
}
