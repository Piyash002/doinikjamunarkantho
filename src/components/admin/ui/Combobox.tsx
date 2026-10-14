'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  hint?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  allowCustom?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  error,
  disabled = false,
  className = '',
  allowCustom = false,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.value.toLowerCase().includes(search.toLowerCase()) ||
      (opt.hint && opt.hint.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearch('');
    }
  }, [isOpen]);

  function handleSelect(val: string) {
    onChange(val);
    setIsOpen(false);
  }

  function handleAddCustom() {
    if (!search.trim()) return;
    onChange(search.trim());
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] flex items-center justify-between rounded-xl border px-3.5 bg-white dark:bg-slate-900 text-left text-[16px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1b7d95]/30 disabled:opacity-50 ${
          error
            ? 'border-rose-500'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      >
        <span className={selectedOption ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-400 dark:text-slate-500'}>
          {selectedOption ? selectedOption.label : value || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl max-h-64 flex flex-col">
          <div className="relative mb-2 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full min-h-[38px] pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-[16px] sm:text-sm focus:outline-none focus:border-[#1b7d95]"
            />
          </div>

          <div className="overflow-y-auto flex-1 flex flex-col gap-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full min-h-[40px] px-3 py-2 text-left rounded-lg text-sm flex items-center justify-between transition-colors ${
                    opt.value === value
                      ? 'bg-[#1b7d95]/10 text-[#1b7d95] font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{opt.label}</span>
                    {opt.hint && <span className="text-xs text-slate-400">{opt.hint}</span>}
                  </div>
                  {opt.value === value && <Check className="w-4 h-4 text-[#1b7d95] shrink-0" />}
                </button>
              ))
            ) : allowCustom && search.trim() ? (
              <button
                type="button"
                onClick={handleAddCustom}
                className="w-full min-h-[40px] px-3 py-2 text-left rounded-lg text-sm text-[#1b7d95] hover:bg-[#1b7d95]/10 font-medium"
              >
                Add &quot;{search.trim()}&quot;
              </button>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
