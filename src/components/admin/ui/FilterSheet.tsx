'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { Badge } from './Badge';

export interface ActiveFilter {
  key: string;
  label: string;
  displayValue: string;
}

export interface FilterSheetProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
  children: React.ReactNode;
  title?: string;
}

export function FilterSheet({
  activeFilters,
  onRemoveFilter,
  onClearAll,
  children,
  title = 'Filter Articles',
}: FilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Mobile Filter Trigger Button + Active Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Filter className="w-4 h-4" />}
          onClick={() => setIsOpen(true)}
          className="lg:hidden"
        >
          <span>Filters</span>
          {activeFilters.length > 0 && (
            <span className="ml-1 w-5 h-5 rounded-full bg-[#1b7d95] text-white text-xs inline-flex items-center justify-center font-bold">
              {activeFilters.length}
            </span>
          )}
        </Button>

        {/* Desktop inline container (hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-3 flex-wrap flex-1">
          {children}
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeFilters.map((af) => (
              <span
                key={af.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1b7d95]/10 text-[#1b7d95] dark:bg-[#1b7d95]/20 dark:text-sky-300"
              >
                <span>{af.label}: {af.displayValue}</span>
                <button
                  type="button"
                  onClick={() => onRemoveFilter(af.key)}
                  className="hover:text-rose-500 transition-colors p-0.5"
                  aria-label={`Remove filter ${af.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet Modal */}
      <div className="lg:hidden">
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={title}
          maxWidth="md"
        >
          <div className="flex flex-col gap-4">
            {children}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  onClearAll();
                  setIsOpen(false);
                }}
              >
                Reset
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setIsOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
