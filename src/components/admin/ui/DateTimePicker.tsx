'use client';

import React from 'react';
import { Calendar } from 'lucide-react';

export interface DateTimePickerProps {
  value?: Date | string | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  error,
  disabled = false,
  className = '',
}: DateTimePickerProps) {
  // Convert value to 'YYYY-MM-DDTHH:mm' format for datetime-local input
  let formattedValue = '';
  if (value) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      formattedValue = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value) {
      onChange(null);
    } else {
      const parsed = new Date(e.target.value);
      onChange(isNaN(parsed.getTime()) ? null : parsed);
    }
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <Calendar className="w-4 h-4" />
      </div>
      <input
        type="datetime-local"
        value={formattedValue}
        onChange={handleChange}
        disabled={disabled}
        className={`w-full min-h-[44px] rounded-xl border pl-10 pr-3.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-[16px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1b7d95]/30 disabled:opacity-50 ${
          error
            ? 'border-rose-500'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      />
    </div>
  );
}
