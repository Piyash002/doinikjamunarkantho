'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options?: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  allowCreate?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select items...',
  allowCreate = false,
  error,
  disabled = false,
  className = '',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleRemove(itemToRemove: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(value.filter((v) => v !== itemToRemove));
  }

  function handleToggle(itemValue: string) {
    if (value.includes(itemValue)) {
      onChange(value.filter((v) => v !== itemValue));
    } else {
      onChange([...value, itemValue]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed) {
        if (!value.includes(trimmed)) {
          onChange([...value, trimmed]);
        }
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(inputValue.toLowerCase()) ||
      opt.value.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={`w-full min-h-[44px] p-2 flex flex-wrap items-center gap-1.5 rounded-xl border bg-white dark:bg-slate-900 transition-colors cursor-text focus-within:ring-2 focus-within:ring-[#1b7d95]/30 ${
          error
            ? 'border-rose-500'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {value.map((val) => {
          const matchedOpt = options.find((o) => o.value === val);
          const label = matchedOpt ? matchedOpt.label : val;
          return (
            <span
              key={val}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1b7d95]/10 text-[#1b7d95] dark:bg-[#1b7d95]/20 dark:text-sky-300"
            >
              <span>{label}</span>
              <button
                type="button"
                onClick={(e) => handleRemove(val, e)}
                className="hover:text-rose-500 transition-colors p-0.5"
                aria-label={`Remove ${label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          disabled={disabled}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-[16px] sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
        />

        <div className="ml-auto flex items-center pr-1 text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {isOpen && (options.length > 0 || (allowCreate && inputValue.trim())) && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-60 overflow-y-auto flex flex-col gap-0.5">
          {filteredOptions.map((opt) => {
            const isSelected = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleToggle(opt.value)}
                className={`w-full min-h-[38px] px-3 py-1.5 text-left rounded-lg text-sm flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-[#1b7d95]/10 text-[#1b7d95] font-semibold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-[#1b7d95] shrink-0" />}
              </button>
            );
          })}

          {allowCreate && inputValue.trim() && !value.includes(inputValue.trim()) && (
            <button
              type="button"
              onClick={() => {
                onChange([...value, inputValue.trim()]);
                setInputValue('');
              }}
              className="w-full min-h-[38px] px-3 py-1.5 text-left rounded-lg text-sm text-[#1b7d95] hover:bg-[#1b7d95]/10 font-semibold"
            >
              Add &quot;{inputValue.trim()}&quot;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
