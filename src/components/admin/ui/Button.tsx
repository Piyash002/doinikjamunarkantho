'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Variant styles
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[#0a2b3a] dark:bg-[#1b7d95] text-white hover:bg-[#103a4f] dark:hover:bg-[#2092ad] active:scale-[0.98] shadow-sm',
      secondary:
        'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98]',
      outline:
        'border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-[0.98]',
      ghost:
        'bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98]',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] shadow-sm',
    };

    // Size styles (all enforce min-height 44px on mobile for touch compliance)
    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'min-h-[44px] sm:min-h-[36px] px-3 text-xs sm:text-sm gap-1.5',
      md: 'min-h-[44px] px-4 text-sm sm:text-base gap-2',
      lg: 'min-h-[50px] px-6 text-base gap-2.5',
    };

    const effectiveLoading = isLoading || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || effectiveLoading}
        className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1b7d95]/40 select-none disabled:opacity-50 disabled:pointer-events-none ${
          fullWidth ? 'w-full' : ''
        } ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {effectiveLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
        ) : (
          leftIcon && <span className="shrink-0 text-current">{leftIcon}</span>
        )}
        <span className="text-current">{children}</span>
        {!effectiveLoading && rightIcon && <span className="shrink-0 text-current">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
