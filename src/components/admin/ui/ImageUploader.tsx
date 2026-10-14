'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Image as ImageIcon, Check, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { compressImage } from '@/src/lib/imageCompressor';
import { useToast } from './Toast';

export interface ImageValue {
  url: string;
  publicId?: string;
  caption?: string;
  alt?: string;
}

export interface ImageUploaderProps {
  value?: ImageValue | null;
  onChange: (value: ImageValue | null) => void;
  onOpenMediaPicker?: () => void;
  onRemove?: () => void;
  folder?: string;
  aspectRatio?: string;
  label?: string;
  showCaption?: boolean;
  showAlt?: boolean;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  onOpenMediaPicker,
  onRemove,
  folder = 'jamuna',
  aspectRatio = 'auto',
  label = 'Featured Image',
  showCaption = true,
  showAlt = true,
  className = '',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: toastError, success: toastSuccess } = useToast();

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|gif|svg|avif|heic|tiff|bmp|ico)$/i)) {
      toastError('দয়া করে একটি ইমেজ ফাইল নির্বাচন করুন (Please choose an image file).');
      return;
    }

    try {
      setIsUploading(true);
      setProgress(20);

      // 1. Try client-side compression, fallback to original if unsupported/failed
      let uploadFile = file;
      try {
        uploadFile = await compressImage(file, 2500, 0.90);
      } catch {
        uploadFile = file;
      }
      setProgress(40);

      // 2. Upload to server upload endpoint
      const formData = new FormData();
      formData.append('file', uploadFile);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      setProgress(80);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image.');
      }

      setProgress(100);

      const uploadedUrl = data.data.url;
      const publicId = data.data.publicId || '';

      // Also record into Media collection
      await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: uploadedUrl,
          publicId,
          filename: file.name,
          fileSize: data.data.fileSize || uploadFile.size,
          fileType: data.data.format ? `image/${data.data.format}` : uploadFile.type,
          width: data.data.width || 0,
          height: data.data.height || 0,
        }),
      }).catch((e) => console.warn('Could not save media item record:', e));

      onChange({
        url: uploadedUrl,
        publicId,
        caption: value?.caption || '',
        alt: value?.alt || file.name.replace(/\.[^/.]+$/, ''),
      });

      toastSuccess('Image uploaded and optimized successfully!');
    } catch (err: any) {
      toastError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setProgress(0);
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
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {label && <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</label>}

      {value?.url ? (
        <div className="flex flex-col gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-full aspect-video sm:max-h-64 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
            <Image
              src={value.url}
              alt={value.alt || 'Preview'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
              unoptimized
            />
            <button
              type="button"
              onClick={() => {
                onChange(null);
                onRemove?.();
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-rose-600 transition-colors"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {showCaption && (
            <input
              type="text"
              value={value.caption || ''}
              onChange={(e) => onChange({ ...value, caption: e.target.value })}
              placeholder="Caption / Credit (e.g. Photo: Staff Reporter)"
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1b7d95]"
            />
          )}

          {showAlt && (
            <input
              type="text"
              value={value.alt || ''}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              placeholder="Alt text for SEO & Screen Readers"
              className="w-full text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1b7d95]"
            />
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            isDragOver
              ? 'border-[#1b7d95] bg-[#1b7d95]/5'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-slate-600'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3 py-4 w-full max-w-xs text-center">
              <Loader2 className="w-8 h-8 text-[#1b7d95] animate-spin" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Optimizing & Uploading...
              </span>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#1b7d95] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-[#1b7d95]/10 text-[#1b7d95] dark:text-sky-400 flex items-center justify-center mb-1">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tap to upload or drag & drop
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                PNG, JPG or WebP (Client-optimized up to 2000px)
              </span>

              {onOpenMediaPicker && (
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<ImageIcon className="w-4 h-4" />}
                    onClick={onOpenMediaPicker}
                  >
                    Select from Media Library
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
