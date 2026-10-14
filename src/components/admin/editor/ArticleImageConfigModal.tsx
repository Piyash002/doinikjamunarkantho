'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Maximize2,
  Sliders,
  Sparkles,
  Check,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface ConfiguredImage {
  url: string;
  publicId?: string;
  filename?: string;
  width: string;
  alignment: 'center' | 'left' | 'right';
  caption: string;
  alt: string;
}

export interface ArticleImageConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: ConfiguredImage) => void;
  image: {
    url: string;
    publicId?: string;
    filename?: string;
    width?: number;
    height?: number;
  } | null;
}

const SIZE_PRESETS = [
  { label: '২৫% (ছোট)', value: '25%' },
  { label: '৫০% (মাঝারি)', value: '50%' },
  { label: '৭৫% (বড়)', value: '75%' },
  { label: '১০০% (পূর্ণ প্রস্থ)', value: '100%' },
];

export function ArticleImageConfigModal({
  isOpen,
  onClose,
  onConfirm,
  image,
}: ArticleImageConfigModalProps) {
  const [width, setWidth] = useState<string>('100%');
  const [customWidth, setCustomWidth] = useState<number>(100);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [alignment, setAlignment] = useState<'center' | 'left' | 'right'>('center');
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');

  useEffect(() => {
    if (image) {
      setWidth('100%');
      setCustomWidth(100);
      setIsCustomMode(false);
      setAlignment('center');
      setCaption('');
      setAltText(image.filename ? image.filename.replace(/\.[^/.]+$/, '') : '');
    }
  }, [image]);

  if (!image) return null;

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

  function handleConfirm() {
    if (!image) return;
    onConfirm({
      url: image.url,
      publicId: image.publicId,
      filename: image.filename,
      width,
      alignment,
      caption: caption.trim(),
      alt: altText.trim() || image.filename || '',
    });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ছবি ইনসার্ট করুন (Configure Image)"
      description="কম্পিউটার থেকে আপলোড করা ছবির সাইজ, অবস্থান ও ক্যাপশন নির্ধারণ করুন"
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4">
        {/* Uploaded Image Summary Header */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 shrink-0 shadow-xs">
              <Image
                src={image.url}
                alt={image.filename || 'Uploaded'}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {image.filename || 'Uploaded Image'}
                </p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> আপলোড সফল
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                সাইজ: <span className="font-bold text-[#1b7d95]">{width}</span> • অবস্থান:{' '}
                <span className="font-bold text-[#1b7d95]">
                  {alignment === 'center' ? 'মাঝে (Center)' : alignment === 'left' ? 'বামে (Left Float)' : 'ডানে (Right Float)'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: Size Presets & Alignment */}
          <div className="space-y-3.5">
            {/* Size Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-[#1b7d95]" />
                  ইমেজের সাইজ নির্ধারণ করুন:
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
                      className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all ${
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
            <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-slate-400" />
                  কাস্টম সাইজ স্লাইডার:
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

            {/* Alignment Options */}
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

          {/* Right Column: Caption, Alt Text & Live Preview */}
          <div className="space-y-3">
            {/* Caption */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                ক্যাপশন (ছবির নিচে প্রদর্শিত হবে):
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="যেমন: ছবি - নিজস্ব প্রতিবেদক / সংগৃহীত"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1b7d95]"
              />
            </div>

            {/* Alt Text */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                অল্টারনেট টেক্সট (SEO ও স্ক্রিন রিডার):
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
                লাইভ প্রিভিউ (Live Preview):
              </label>
              <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/50 min-h-[90px] flex flex-col justify-center">
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
                        src={image.url}
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

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            বাতিল (Cancel)
          </Button>

          <Button variant="primary" size="sm" onClick={handleConfirm}>
            আর্টিকেলে যুক্ত করুন ({width})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
