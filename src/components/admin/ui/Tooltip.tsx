'use client';

import React, { useState } from 'react';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`hidden sm:block absolute z-50 px-2.5 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-800 border border-slate-700 rounded-md shadow-md pointer-events-none whitespace-nowrap left-1/2 -translate-x-1/2 ${
            position === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
