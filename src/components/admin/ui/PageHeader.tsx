'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  subtitle,
  breadcrumbs,
  backHref,
  actions,
  className = '',
}: PageHeaderProps) {
  const router = useRouter();
  const displayDescription = description || subtitle;

  return (
    <div className={`flex flex-col gap-3 pb-6 border-b border-slate-200 dark:border-slate-800 ${className}`}>
      {/* Desktop Breadcrumbs & Mobile Back Arrow */}
      <div className="flex items-center gap-2">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1 touch-target -ml-2 px-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
        ) : breadcrumbs && breadcrumbs.length > 0 ? (
          <>
            {/* Mobile Back button pointing to dashboard or parent breadcrumb */}
            <div className="sm:hidden">
              <Link
                href={breadcrumbs[breadcrumbs.length - 2]?.href || '/admin'}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
            </div>

            {/* Desktop Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <Link href="/admin" className="hover:text-slate-700 dark:hover:text-slate-200">
                Dashboard
              </Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-slate-700 dark:hover:text-slate-200">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </>
        ) : null}
      </div>

      {/* Main Title & Action Buttons (Stacks vertically on mobile) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 break-words">
            {title}
          </h1>
          {displayDescription && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 break-words">
              {displayDescription}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0 w-full sm:w-auto justify-start sm:justify-end pt-1 sm:pt-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
