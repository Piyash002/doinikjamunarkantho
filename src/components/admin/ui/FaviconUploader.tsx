'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, Trash2, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { compressImage } from '@/src/lib/imageCompressor';
import { useToast } from './Toast';

export interface FaviconUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  hint?: string;
  siteTitlePreview?: string;
}

export function FaviconUploader({
  value,
  onChange,
  label,
  hint,
  siteTitlePreview = 'Newspaper Tab',
}: FaviconUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: toastError, success: toastSuccess } = useToast();

  async function handleFile(file: File) {
    const isIco = file.name.toLowerCase().endsWith('.ico') || file.type.includes('icon');
    const isSvg = file.name.toLowerCase().endsWith('.svg') || file.type.includes('svg');
    const isImage = file.type.startsWith('image/') || isIco || isSvg;

    if (!isImage) {
      toastError('দয়া করে একটি সঠিক ইমেজ ফাইল (.ico, .png, .svg, .webp) নির্বাচন করুন।');
      return;
    }

    try {
      setIsUploading(true);

      let uploadFile = file;
      // If it's NOT an .ico or .svg, compress it safely to max 512px for optimal favicon speed
      if (!isIco && !isSvg) {
        try {
          uploadFile = await compressImage(file, 512, 0.9);
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
        throw new Error(data.error || 'Failed to upload favicon.');
      }

      const uploadedUrl = data.data.url;
      onChange(uploadedUrl);
      toastSuccess('ফেভিকন সফলভাবে আপলোড হয়েছে! (Favicon uploaded successfully)');
    } catch (err: any) {
      toastError(err?.message || 'Favicon upload failed. Please try again.');
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
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Favicon (ফেভিকন মুছুন)
          </button>
        )}
      </div>

      {value ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
          {/* Favicon Square Preview */}
          <div className="relative w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-2">
            <Image
              src={value}
              alt="Favicon preview"
              width={40}
              height={40}
              className="w-10 h-10 object-contain"
              unoptimized
            />
          </div>

          {/* Browser Tab Simulation Preview & Controls */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Browser Tab Simulation:
              </span>
            </div>

            {/* Simulated browser tab */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-t-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-b-0 text-xs font-medium text-slate-800 dark:text-slate-200 max-w-sm shadow-xs">
              <div className="w-4 h-4 relative shrink-0">
                <Image
                  src={value}
                  alt="tab icon"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <span className="truncate">{siteTitlePreview}</span>
            </div>

            {/* Direct URL input & Change button */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1">
                <Input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="https://.../favicon.ico"
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
                Change
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* When No Favicon is set: Offer BOTH Upload AND Direct Writing/Typing */
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
                : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600'
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
                  {isUploading ? 'Uploading Favicon...' : 'Option 1: Upload Favicon File (ফাইল আপলোড)'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Supports .ico, .png, .svg, .webp or .jpg (Click or drag & drop)
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
              Choose Favicon File
            </Button>
          </div>

          {/* Option 2: Write/Paste direct URL */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Option 2: Write or Paste Favicon URL (সরাসরি ফেভিকন লিঙ্ক লিখুন):
            </span>
            <Input
              value=""
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g. https://domain.com/favicon.ico or /favicon.ico"
            />
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ico,.png,.svg,.webp,.jpg,.jpeg,image/x-icon,image/png,image/svg+xml,image/jpeg,image/webp"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
      />
    </div>
  );
}
