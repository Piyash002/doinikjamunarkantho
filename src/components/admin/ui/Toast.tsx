'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Undo2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export type ToastOptions = {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
  undoAction?: () => void;
  undoLabel?: string;
};

type ToastItem = Omit<ToastOptions, 'duration'> & {
  id: string;
  duration: number;
};

type ToastContextType = {
  toast: (options: ToastOptions | string) => void;
  success: (message: string, options?: Partial<ToastOptions>) => void;
  error: (message: string, options?: Partial<ToastOptions>) => void;
  info: (message: string, options?: Partial<ToastOptions>) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((options: ToastOptions | string) => {
    const opts: ToastOptions = typeof options === 'string' ? { message: options } : options;
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem: ToastItem = {
      ...opts,
      id,
      type: opts.type || 'info',
      duration: opts.duration ?? 4500,
    };

    setToasts((prev) => [...prev, newItem]);

    if (typeof newItem.duration === 'number' && newItem.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newItem.duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, options?: Partial<ToastOptions>) => {
    addToast({ message, type: 'success', ...options });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<ToastOptions>) => {
    addToast({ message, type: 'error', ...options });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<ToastOptions>) => {
    addToast({ message, type: 'info', ...options });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      {/* Toast container: fixed bottom center on mobile, top right on desktop */}
      <div
        aria-live="polite"
        className="fixed z-50 flex flex-col gap-2 pointer-events-none p-4 bottom-16 sm:bottom-4 right-0 left-0 sm:left-auto sm:max-w-md items-center sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center justify-between w-full max-w-sm gap-3 p-3.5 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-200 transform translate-y-0"
            style={{
              backgroundColor: 'var(--admin-card)',
              borderColor:
                t.type === 'success'
                  ? 'rgba(16, 185, 129, 0.4)'
                  : t.type === 'error'
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'var(--admin-border)',
              color: 'var(--admin-text)',
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-sky-500 shrink-0" />}
              <div className="flex flex-col min-w-0">
                {t.title && <span className="font-semibold text-xs opacity-90">{t.title}</span>}
                <span className="text-sm leading-snug break-words">{t.message}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {t.undoAction && (
                <button
                  type="button"
                  onClick={() => {
                    t.undoAction?.();
                    removeToast(t.id);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20 transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>{t.undoLabel || 'Undo'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
