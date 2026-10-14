'use client';

import React, { useState, useRef } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import {
  Search,
  UploadCloud,
  Check,
  Loader2,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Maximize2,
  Sliders,
  Sparkles,
  FolderOpen,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useToast } from './Toast';

export interface SelectedMedia {
  url: string;
  publicId?: string;
  alt?: string;
  caption?: string;
  width?: string;
  alignment?: 'center' | 'left' | 'right';
}

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: SelectedMedia) => void;
  title?: string;
  showSizeControls?: boolean;
  defaultTab?: 'upload' | 'library';
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const SIZE_PRESETS = [
  { label: '২৫% (ছোট)', value: '25%' },
  { label: '৫০% (মাঝারি)', value: '50%' },
  { label: '৭৫% (বড়)', value: '75%' },
  { label: '১০০% (পূর্ণ প্রস্থ)', value: '100%' },
];

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Insert Image into Article Body',
  showSizeControls = true,
  defaultTab = 'upload',
}: MediaPickerModalProps) {
  // Tabs: 'upload' is primary and default!
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>(defaultTab);

  // Search & Library state
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { success: toastSuccess, error: toastError } = useToast();

  // Image insertion size and alignment states
  const [width, setWidth] = useState<string>('100%');
  const [customWidth, setCustomWidth] = useState<number>(100);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [alignment, setAlignment] = useState<'center' | 'left' | 'right'>('center');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');

  const { data, mutate, isLoading } = useSWR(
    isOpen && activeTab === 'library'
      ? `/api/admin/media?search=${encodeURIComponent(search)}&limit=30`
      : null,
    fetcher
  );

  const mediaItems = data?.success && Array.isArray(data.data) ? data.data : [];

  function handleSelectItem(item: any) {
    setSelectedItem(item);
    setAltText(item.alt || item.filename?.replace(/\.[^/.]+$/, '') || '');
    setCaption(item.caption || '');
  }

  function handlePresetClick(val: string) {
    setWidth(val);
    const num = parseInt(val, 10) || 100;
    setCustomWidth(num);
    setIsCustomMode(false);
  }

  function handleSliderChange(val: number) {
    setCustomWidth(val);
    setWidth(`${val}%`);
    setIsCustomMode(true);
  }

  async function handleProcessUpload(file: File) {
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.match(/\.(jpg|jpeg|png|webp|gif|svg|avif|heic|tiff|bmp|ico)$/i)) {
      toastError('দয়া করে একটি ইমেজ ফাইল নির্বাচন করুন (JPEG, PNG, WebP, GIF, SVG ইত্যাদি)।');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(20);

      const formData = new FormData();
      formData.append('file', file);
      setUploadProgress(45);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(75);
      const uploadData = await res.json();
      if (!res.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Upload to Cloudinary failed.');
      }

      setUploadProgress(90);

      const newMedia = {
        url: uploadData.data.url,
        publicId: uploadData.data.publicId || '',
        filename: file.name,
        fileSize: uploadData.data.fileSize || file.size,
        fileType: uploadData.data.format ? `image/${uploadData.data.format}` : file.type,
      };

      // Record to media collection in background
      await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedia),
      }).catch((e) => console.warn('Could not record media item:', e));

      setUploadProgress(100);
      handleSelectItem(newMedia);
      toastSuccess('ছবি সফলভাবে ক্লাউডিনারিতে আপলোড হয়েছে!');
    } catch (err: any) {
      toastError(err?.message || 'আপলোড ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleConfirm() {
    if (selectedItem) {
      onSelect({
        url: selectedItem.url,
        publicId: selectedItem.publicId || '',
        alt: altText || selectedItem.alt || selectedItem.filename || '',
        caption: caption || selectedItem.caption || '',
        width: showSizeControls ? width : undefined,
        alignment: showSizeControls ? alignment : undefined,
      });
      onClose();
    }
  }

  function handleResetSelection() {
    setSelectedItem(null);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="4xl">
      <div className="flex flex-col gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'bg-[#1b7d95] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              সরাসরি ফাইল আপলোড (Upload New)
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('library');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'library'
                  ? 'bg-[#1b7d95] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              আগের আপলোড করা ছবি (Media Library)
            </button>
          </div>

          {selectedItem && (
            <button
              type="button"
              onClick={handleResetSelection}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> অন্য ছবি বাছুন
            </button>
          )}
        </div>

        {/* TAB 1: DIRECT FILE UPLOAD (Default View) */}
        {activeTab === 'upload' && !selectedItem && (
          <div className="flex flex-col gap-4 py-2 animate-in fade-in-50 duration-150">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleProcessUpload(f);
              }}
              disabled={isUploading}
            />

            {/* Direct Drag & Drop Zone */}
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcessUpload(file);
              }}
              className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? 'border-[#1b7d95] bg-[#1b7d95]/10 scale-[0.99]'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 hover:border-[#1b7d95]/70 hover:bg-[#1b7d95]/5'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#1b7d95]/15 flex items-center justify-center text-[#1b7d95] animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Cloudinary-তে আপলোড হচ্ছে... ({uploadProgress}%)
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      অনুগ্রহ করে অপেক্ষা করুন, ছবিটি সরাসরি প্রসেস হচ্ছে
                    </p>
                  </div>
                  <div className="w-64 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-[#1b7d95] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1b7d95]/20 to-sky-500/10 text-[#1b7d95] flex items-center justify-center mb-3 shadow-inner">
                    <UploadCloud className="w-8 h-8" />
                  </div>

                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                    সরাসরি কম্পিউটার বা ডিভাইস থেকে ছবি নির্বাচন করুন
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-4">
                    এখানে ছবি ড্র্যাগ করে এনে ছেড়ে দিন অথবা নিচের বাটনে ক্লিক করে ফাইল নির্বাচন করুন
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      leftIcon={<UploadCloud className="w-4 h-4" />}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      ফাইল ব্রাউজ করুন (Browse File)
                    </Button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
                    <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      JPG, PNG, WebP, GIF, SVG, AVIF
                    </span>
                    <span>•</span>
                    <span>যেকোনো সাইজ ও রেজোলিউশন সাপোর্টেড</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MEDIA LIBRARY (Secondary option for old images) */}
        {activeTab === 'library' && !selectedItem && (
          <div className="flex flex-col gap-3 animate-in fade-in-50 duration-150">
            {/* Search and upload bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="আগের ছবি সার্চ করুন..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1b7d95]"
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<UploadCloud className="w-4 h-4" />}
                onClick={() => setActiveTab('upload')}
              >
                নতুন ফাইল আপলোড
              </Button>
            </div>

            {/* Media Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
              {isLoading ? (
                <div className="col-span-full py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1b7d95]" />
                </div>
              ) : mediaItems.length > 0 ? (
                mediaItems.map((item: any) => {
                  const isSelected = selectedItem?.url === item.url;
                  return (
                    <div
                      key={item._id || item.url}
                      onClick={() => handleSelectItem(item)}
                      className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#1b7d95] ring-2 ring-[#1b7d95]/40 shadow-md scale-[0.98]'
                          : 'border-slate-200 dark:border-slate-800 hover:border-[#1b7d95]/50'
                      }`}
                    >
                      <Image
                        src={item.url}
                        alt={item.alt || item.filename || 'Image'}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 150px"
                        unoptimized
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#1b7d95] text-white flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 pt-3">
                        <p className="text-[11px] text-white truncate font-medium">{item.filename}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-10 text-center text-xs text-slate-400">
                  কোনো ছবি পাওয়া যায়নি। "নতুন ফাইল আপলোড" বাটনে ক্লিক করে ছবি আপলোড করুন!
                </div>
              )}
            </div>
          </div>
        )}

        {/* IMAGE SIZE, ALIGNMENT & CAPTION CONTROLS (Displayed when an image is uploaded or picked) */}
        {selectedItem && showSizeControls && (
          <div className="p-4 rounded-2xl border border-[#1b7d95]/25 bg-gradient-to-br from-[#1b7d95]/5 to-slate-50 dark:to-slate-900/60 dark:from-[#1b7d95]/10 flex flex-col gap-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
            {/* Header info of selected/uploaded image */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 shadow-sm">
                  <Image
                    src={selectedItem.url}
                    alt={selectedItem.filename || 'Thumb'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {selectedItem.filename}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> ক্লাউডিনারিতে আপলোড সম্পন্ন
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    নির্বাচিত সাইজ: <span className="font-bold text-[#1b7d95]">{width}</span> • অবস্থান:{' '}
                    <span className="font-bold text-[#1b7d95]">
                      {alignment === 'center' ? 'মাঝে (Center)' : alignment === 'left' ? 'বামে (Left Float)' : 'ডানে (Right Float)'}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetSelection}
                className="px-2.5 py-1 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> অন্য ছবি আপলোড
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Size Controls & Alignment */}
              <div className="space-y-3.5">
                {/* Size Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-[#1b7d95]" />
                      ইমেজের সাইজ নির্ধারণ করুন (Image Size):
                    </label>
                    <span className="text-xs font-bold text-[#1b7d95] bg-[#1b7d95]/15 px-2.5 py-0.5 rounded-md">
                      {width}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {SIZE_PRESETS.map((preset) => {
                      const isActive = width === preset.value && !isCustomMode;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => handlePresetClick(preset.value)}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive
                              ? 'bg-[#1b7d95] text-white shadow-sm ring-2 ring-[#1b7d95]/30'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Size Slider */}
                <div className="bg-white/90 dark:bg-slate-800/90 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-slate-400" />
                      কাস্টম সাইজ স্লাইডার (Custom %):
                    </span>
                    <span className="font-mono text-xs font-bold text-[#1b7d95]">{customWidth}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="100"
                    step="5"
                    value={customWidth}
                    onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
                    className="w-full accent-[#1b7d95] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>১৫%</span>
                    <span>৫০%</span>
                    <span>৭৫%</span>
                    <span>১০০%</span>
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    অবস্থান ও টেক্সট র‍্যাপ (Alignment):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAlignment('left')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                        alignment === 'left'
                          ? 'bg-[#1b7d95] text-white shadow-sm ring-2 ring-[#1b7d95]/30'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      বামে (Left)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlignment('center')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                        alignment === 'center'
                          ? 'bg-[#1b7d95] text-white shadow-sm ring-2 ring-[#1b7d95]/30'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <AlignCenter className="w-3.5 h-3.5" />
                      মাঝে (Center)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlignment('right')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                        alignment === 'right'
                          ? 'bg-[#1b7d95] text-white shadow-sm ring-2 ring-[#1b7d95]/30'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <AlignRight className="w-3.5 h-3.5" />
                      ডানে (Right)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Caption, Alt Text & Live Visual Preview */}
              <div className="space-y-3">
                {/* Caption input */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    ক্যাপশন (Caption - ছবির নিচে প্রদর্শিত হবে):
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="যেমন: ছবি - নিজস্ব প্রতিবেদক / সংগৃহীত"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1b7d95]"
                  />
                </div>

                {/* Alt Text input */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    অল্টারনেট টেক্সট (Alt Text - SEO ও স্ক্রিন রিডার):
                  </label>
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="ছবিটির স্পষ্ট বর্ণনা দিন..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1b7d95]"
                  />
                </div>

                {/* Live Preview Box */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#1b7d95]" />
                    লাইভ প্রিভিউ (Live Article Body Preview):
                  </label>
                  <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 min-h-[90px] flex flex-col justify-center">
                    <div className="w-full overflow-hidden">
                      <div
                        style={{
                          width: width,
                          marginLeft: alignment === 'right' ? 'auto' : alignment === 'center' ? 'auto' : '0',
                          marginRight: alignment === 'left' ? 'auto' : alignment === 'center' ? 'auto' : '0',
                          float: alignment === 'left' ? 'left' : alignment === 'right' ? 'right' : 'none',
                        }}
                        className="transition-all duration-200"
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                          <Image
                            src={selectedItem.url}
                            alt="Preview"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        {caption && (
                          <p className="text-[10px] text-center text-slate-500 italic mt-1 truncate">
                            {caption}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            বাতিল (Cancel)
          </Button>

          <div className="flex items-center gap-2">
            {selectedItem && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirm}
              >
                আর্টিকেলে যুক্ত করুন ({width})
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
