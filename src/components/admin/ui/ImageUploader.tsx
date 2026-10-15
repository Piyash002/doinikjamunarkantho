'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Image as ImageIcon, Check, Loader2, Camera, FolderOpen, RefreshCw, Trash2 } from 'lucide-react';
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

  const cameraInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* Hidden file inputs for Camera and Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
      />

      {label && <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</label>}

      {value?.url ? (
        <div className="flex flex-col gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-full aspect-video sm:max-h-64 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <Image
              src={value.url}
              alt={value.alt || 'Preview'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 600px"
              unoptimized
            />
            {/* Quick Actions Overlay */}
            <div className="absolute top-2 right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-slate-900 transition-colors"
                title="Replace Image"
                aria-label="Replace image"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  onRemove?.();
                }}
                className="p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-rose-600 transition-colors"
                title="Remove Image"
                aria-label="Remove image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              ছবি পরিবর্তন (Replace)
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              onClick={() => {
                onChange(null);
                onRemove?.();
              }}
              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              মুছুন (Remove)
            </Button>
          </div>

          {showCaption && (
            <input
              type="text"
              value={value.caption || ''}
              onChange={(e) => onChange({ ...value, caption: e.target.value })}
              placeholder="ক্যাপশন / ক্রেডিট (Caption: যেমন- সংগৃহীত / নিজস্ব প্রতিবেদক)"
              className="w-full text-sm min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1b7d95]"
            />
          )}

          {showAlt && (
            <input
              type="text"
              value={value.alt || ''}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              placeholder="ছবির বর্ণনা / Alt Text (SEO ও স্ক্রিন রিডার এর জন্য)"
              className="w-full text-sm min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#1b7d95]"
            />
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!isUploading) {
              fileInputRef.current?.click();
            }
          }}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
            isDragOver
              ? 'border-[#1b7d95] bg-[#1b7d95]/10 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-[#1b7d95] dark:hover:border-sky-400 hover:bg-[#1b7d95]/5'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3 py-6 w-full max-w-xs text-center pointer-events-none">
              <Loader2 className="w-8 h-8 text-[#1b7d95] animate-spin" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                কম্প্রেস ও আপলোড হচ্ছে ({progress}%)...
              </span>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#1b7d95] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center gap-3 w-full py-2">
              <div className="w-14 h-14 rounded-2xl bg-[#1b7d95]/10 text-[#1b7d95] dark:text-sky-400 flex items-center justify-center transition-transform hover:scale-105">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 block">
                  সংবাদের মূল ছবি নির্বাচন করুন
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  ক্লিক করে ডিভাইস বা ফাইল থেকে সরাসরি ছবি আপলোড করুন
                </span>
                <span className="text-[11px] text-[#1b7d95] dark:text-sky-400 font-medium mt-0.5 inline-block">
                  অটো-কম্প্রেশন সক্রিয় (WebP, JPG, PNG)
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
