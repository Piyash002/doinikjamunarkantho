'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <>
          {/* MOBILE VIEW: Native Bottom Sheet */}
          <div className="md:hidden">
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-backdrop"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-1.5 animate-bottom-sheet max-h-[80dvh] overflow-y-auto"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 shrink-0" />

              <div className="flex flex-col gap-1">
                {items.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => {
                      item.onClick();
                      setIsOpen(false);
                    }}
                    className={`w-full min-h-[48px] px-4 py-3 text-left rounded-2xl text-base flex items-center gap-3 transition-colors disabled:opacity-40 disabled:pointer-events-none ${
                      item.danger
                        ? 'text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 active:bg-rose-100'
                        : 'text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800'
                    }`}
                  >
                    {item.icon && <span className="shrink-0 text-current">{item.icon}</span>}
                    <span className="font-semibold text-sm sm:text-base flex-1">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="mt-2 min-h-[48px] w-full rounded-2xl bg-slate-200/70 dark:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300 active:bg-slate-300 transition-colors"
              >
                বাতিল (Cancel)
              </button>
            </div>
          </div>

          {/* DESKTOP VIEW: Floating Menu Attached to Trigger */}
          <div
            role="menu"
            className={`hidden md:flex flex-col absolute z-50 mt-1.5 min-w-[190px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 gap-0.5 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {items.map((item, idx) => (
              <button
                key={idx}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`w-full min-h-[40px] px-3.5 py-2 text-left rounded-xl text-sm flex items-center gap-2.5 transition-colors disabled:opacity-40 disabled:pointer-events-none ${
                  item.danger
                    ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
