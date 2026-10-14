'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export function Checkbox({ checked, onChange, label, disabled = false, id, className = '' }: CheckboxProps) {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substring(2, 8)}`;

  return (
    <label
      htmlFor={checkboxId}
      className={`inline-flex items-center gap-2.5 cursor-pointer min-h-[44px] min-w-[44px] select-none ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
          checked
            ? 'bg-[#1b7d95] border-[#1b7d95] text-white'
            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
        }`}
      >
        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </div>
      {label && <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</span>}
    </label>
  );
}
