'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  page?: number;
  currentPage?: number;
  totalPages: number;
  totalItems?: number;
  limit?: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  className?: string;
}

export function Pagination({
  page,
  currentPage,
  totalPages,
  totalItems,
  limit = 25,
  onPageChange,
  onLimitChange,
  className = '',
}: PaginationProps) {
  const activePage = page ?? currentPage ?? 1;
  if (totalPages <= 1 && !onLimitChange) return null;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 p-4 border-t border-slate-200 dark:border-slate-800 ${className}`}
    >
      {/* Items count & Per Page Selector */}
      <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        {typeof totalItems === 'number' && (
          <span>
            Total <strong className="text-slate-900 dark:text-slate-100">{totalItems}</strong> items
          </span>
        )}
        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>Show:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1.5 ml-auto">
        <Button
          variant="outline"
          size="sm"
          disabled={activePage <= 1}
          onClick={() => onPageChange(activePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        <span className="px-3 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
          Page <strong>{activePage}</strong> of <strong>{totalPages || 1}</strong>
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={activePage >= totalPages}
          onClick={() => onPageChange(activePage + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
