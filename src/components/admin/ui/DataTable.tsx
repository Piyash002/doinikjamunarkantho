'use client';

import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, CheckSquare, Square } from 'lucide-react';
import { TableSkeleton } from './Skeleton';
import { Button } from './Button';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T extends { _id?: string; id?: string }> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
  isLoading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectAll?: (selected: boolean) => void;
  onSelectItem?: (id: string, selected: boolean) => void;
  bulkActions?: React.ReactNode;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  renderMobileCard?: (item: T, isSelected: boolean, onToggleSelect: () => void) => React.ReactNode;
  emptyState?: React.ReactNode;
  stickyHeader?: boolean;
}

export function DataTable<T extends { _id?: string; id?: string }>({
  columns,
  data,
  keyField = '_id',
  isLoading = false,
  selectable = false,
  selectedIds = [],
  onSelectAll,
  onSelectItem,
  bulkActions,
  sortField,
  sortOrder = 'desc',
  onSort,
  renderMobileCard,
  emptyState,
  stickyHeader = true,
}: DataTableProps<T>) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map((c) => c.key));

  const getItemId = (item: T): string => {
    return String((item as any)[keyField] || item._id || item.id);
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < data.length;

  if (isLoading) {
    return <TableSkeleton rows={6} />;
  }

  if (data.length === 0) {
    return <div className="py-6">{emptyState || <div className="text-center p-8 text-slate-400">No records found.</div>}</div>;
  }

  return (
    <div className="w-full flex flex-col relative">
      {/* Bulk actions bar (appears when 1 or more items are selected) */}
      {selectable && selectedIds.length > 0 && (
        <div className="sticky top-16 z-30 mb-4 p-3 rounded-2xl bg-[#0a2b3a] dark:bg-slate-800 text-white shadow-xl flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold bg-white/20 px-2.5 py-1 rounded-lg">
              {selectedIds.length} selected
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">{bulkActions}</div>
        </div>
      )}

      {/* MOBILE VIEW: Stacked Cards (Hidden on Desktop >= 1024px) */}
      <div className="flex flex-col gap-3 lg:hidden">
        {data.map((item) => {
          const id = getItemId(item);
          const isSelected = selectedIds.includes(id);

          if (renderMobileCard) {
            return (
              <React.Fragment key={id}>
                {renderMobileCard(item, isSelected, () => {
                  onSelectItem?.(id, !isSelected);
                })}
              </React.Fragment>
            );
          }

          // Fallback auto card if renderMobileCard is omitted
          return (
            <div
              key={id}
              className={`p-4 rounded-2xl border transition-all ${
                isSelected
                  ? 'border-[#1b7d95] bg-[#1b7d95]/5'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {selectable && (
                  <button
                    type="button"
                    onClick={() => onSelectItem?.(id, !isSelected)}
                    className="p-1 -ml-1 text-slate-400"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-[#1b7d95]" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  {columns.map((col) => (
                    <div key={col.key} className="flex justify-between py-1 text-sm">
                      <span className="text-slate-400">{col.header}:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW: Real Table (Hidden on Mobile < 1024px) */}
      <div className="hidden lg:block w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className={stickyHeader ? 'sticky top-0 z-20 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-md' : 'bg-slate-50 dark:bg-slate-800'}>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {selectable && (
                <th className="w-12 px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => onSelectAll?.(!isAllSelected)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Select all rows"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-5 h-5 text-[#1b7d95]" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
              )}

              {columns
                .filter((col) => visibleColumns.includes(col.key))
                .map((col) => {
                  const isCurrentSort = sortField === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`px-4 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider select-none ${col.className || ''}`}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => onSort?.(col.key)}
                          className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span>{col.header}</span>
                          {isCurrentSort ? (
                            sortOrder === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#1b7d95]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#1b7d95]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {data.map((item) => {
              const id = getItemId(item);
              const isSelected = selectedIds.includes(id);

              return (
                <tr
                  key={id}
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                    isSelected ? 'bg-[#1b7d95]/5 dark:bg-[#1b7d95]/10' : ''
                  }`}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onSelectItem?.(id, !isSelected)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        aria-label={`Select row ${id}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-[#1b7d95]" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  )}

                  {columns
                    .filter((col) => visibleColumns.includes(col.key))
                    .map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-sm text-slate-700 dark:text-slate-200 ${col.className || ''}`}
                      >
                        {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                      </td>
                    ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
