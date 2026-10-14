'use client';

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | string;
  confirmVariant?: 'danger' | 'primary' | string;
  isLoading?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title = 'Are you sure?',
  message,
  description,
  confirmLabel = 'Confirm',
  confirmText,
  cancelLabel = 'Cancel',
  variant = 'danger',
  confirmVariant,
  isLoading = false,
  loading = false,
}: ConfirmDialogProps) {
  const finalMessage = message || description || '';
  const finalConfirmLabel = confirmText || confirmLabel;
  const finalLoading = isLoading || loading;
  const handleClose = onClose || onCancel || (() => {});
  const effectiveVariant = confirmVariant || variant;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="sm" showCloseButton={false}>
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        {finalMessage && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">{finalMessage}</p>}

        <div className="flex items-center gap-3 w-full">
          <Button
            variant="outline"
            fullWidth
            onClick={handleClose}
            disabled={finalLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={effectiveVariant === 'danger' ? 'danger' : 'primary'}
            fullWidth
            onClick={onConfirm}
            isLoading={finalLoading}
          >
            {finalConfirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
