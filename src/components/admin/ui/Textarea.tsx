'use client';

import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, showCount, maxLength, value, ...props }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full relative flex flex-col">
        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={`w-full min-h-[96px] rounded-xl border p-3.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[16px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1b7d95]/30 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 resize-y ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-300 dark:border-slate-700 focus:border-[#1b7d95]'
          } ${className}`}
          {...props}
        />
        {showCount && maxLength && (
          <div className="text-right text-xs mt-1 text-slate-400 dark:text-slate-500">
            {currentLength} / {maxLength}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
