'use client';

import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Switch({ checked, onChange, label, description, disabled = false, id }: SwitchProps) {
  const switchId = id || `switch-${Math.random().toString(36).substring(2, 8)}`;

  return (
    <label
      htmlFor={switchId}
      className={`inline-flex items-center gap-3.5 cursor-pointer select-none min-h-[44px] py-1 ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <button
        id={switchId}
        role="switch"
        type="button"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1b7d95]/40 items-center px-0.5 ${
          checked ? 'bg-[#1b7d95]' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
          style={{ width: '22px', height: '22px' }}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200">{label}</span>}
          {description && <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{description}</span>}
        </div>
      )}
    </label>
  );
}
