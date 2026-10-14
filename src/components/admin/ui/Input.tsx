'use client';

import React from 'react';
import { X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  showClear?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, leftIcon, rightIcon, onClear, showClear, value, disabled, ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 flex items-center justify-center text-slate-400 dark:text-slate-500 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          value={value}
          disabled={disabled}
          className={`w-full min-h-[44px] rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[16px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1b7d95]/30 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 ${
            leftIcon ? 'pl-10' : 'pl-3.5'
          } ${showClear || rightIcon ? 'pr-10' : 'pr-3.5'} ${
            error
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-300 dark:border-slate-700 focus:border-[#1b7d95]'
          } ${className}`}
          {...props}
        />
        {showClear && value && onClear && !disabled ? (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Clear input"
          >
            <X className="w-4 h-4" />
          </button>
        ) : rightIcon ? (
          <div className="absolute right-3.5 flex items-center justify-center text-slate-400 dark:text-slate-500 pointer-events-none">
            {rightIcon}
          </div>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
