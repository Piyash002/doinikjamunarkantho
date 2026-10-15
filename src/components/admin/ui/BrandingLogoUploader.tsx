'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, Trash2, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { compressImage } from '@/src/lib/imageCompressor';
import { useToast } from './Toast';
import type { ImageValue } from './ImageUploader';

export interface BrandingLogoUploaderProps {
  value: ImageValue | null;
  onChange: (value: ImageValue | null) => void;
  label: string;
  hint?: string;
  previewWidth?: number;
  previewHeight?: number;
  fallbackText?: string;
}

export function BrandingLogoUploader({
  value,
  onChange,
  label,
  hint,
  previewWidth = 220,
  previewHeight = 44,
  fallbackText = 'Logo',
}: BrandingLogoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: toastError, success: toastSuccess } = useToast();

  async function handleFile(file: File) {
    if (
      !file.type.startsWith('image/') &&
      !file.name.match(/\.(jpg|jpeg|png|webp|gif|svg|avif|heic|tiff|bmp|ico)$/i)
    ) {
      toastError('দয়া করে একটি সঠিক ইমেজ ফাইল (.png, .svg, .jpg, .webp) নির্বাচন করুন।');
      return;
    }

    try {
      setIsUploading(true);

      let uploadFile = file;
      if (!file.type.includes('svg')) {
        try {
          uploadFile = await compressImage(file, 2000, 0.9);
        } catch {
          uploadFile = file;
        }
      }

      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload logo.');
      }

      const uploadedUrl = data.data.url;
      const publicId = data.data.publicId || '';

      onChange({
        url: uploadedUrl,
        publicId,
        alt: fallbackText,
      });

      toastSuccess('লোগো সফলভাবে আপলোড হয়েছে! (Logo uploaded successfully)');
    } catch (err: any) {
      toastError(err?.message || 'Logo upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }

  const currentUrl = value?.url || '';

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {label}
          </label>
          {hint && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hint}</p>
          )}
        </div>
        {currentUrl && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Logo (লোগো মুছুন)
          </button>
        )}
      </div>

      {currentUrl ? (
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          {/* Logo Live Preview Display */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-500" />
              Live Logo Preview:
            </span>
          </div>

          <div className="relative min-h-[60px] max-h-24 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden">
            <div className="relative h-11 w-64 max-w-full flex items-center justify-center">
              <Image
                src={currentUrl}
                alt={value?.alt || fallbackText}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          </div>

          {/* Direct URL write/edit + Change File Upload button */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 w-full">
              <Input
                value={currentUrl}
                onChange={(e) =>
                  onChange(
                    e.target.value
                      ? { url: e.target.value, publicId: value?.publicId || '', alt: fallbackText }
                      : null
                  )
                }
                placeholder="https://.../logo.png"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<UploadCloud className="w-4 h-4" />}
              isLoading={isUploading}
            >
              Upload New File
            </Button>
          </div>
        </div>
      ) : (
        /* When No Logo is set: Offer BOTH Upload AND Direct Writing/Typing */
        <div className="flex flex-col gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer gap-4 ${
              isDragOver
                ? 'border-[#1b7d95] bg-[#1b7d95]/5'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#1b7d95]/10 text-[#1b7d95] dark:text-sky-400 flex items-center justify-center shrink-0">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <UploadCloud className="w-6 h-6" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isUploading ? 'Uploading Logo...' : 'Option 1: Upload Logo File (ফাইল আপলোড)'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  PNG, SVG, JPG, WebP (Click to browse or drag & drop)
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<UploadCloud className="w-4 h-4" />}
              isLoading={isUploading}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Choose Logo File
            </Button>
          </div>

          {/* Option 2: Write/Paste direct URL */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Option 2: Write or Paste Logo URL (সরাসরি লোগো লিঙ্ক লিখুন):
            </span>
            <Input
              value=""
              onChange={(e) =>
                onChange(
                  e.target.value
                    ? { url: e.target.value, publicId: '', alt: fallbackText }
                    : null
                )
              }
              placeholder="e.g. https://domain.com/assets/logo.png or /logo.png"
            />
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.png,.svg,.webp,.jpg,.jpeg,.ico"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
      />
    </div>
  );
}
