'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { Search, UploadCloud, Check, X, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { compressImage } from '@/src/lib/imageCompressor';
import { useToast } from './Toast';

export interface SelectedMedia {
  url: string;
  publicId?: string;
  alt?: string;
  caption?: string;
}

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: SelectedMedia) => void;
  title?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Media Image',
}: MediaPickerModalProps) {
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  const { data, mutate, isLoading } = useSWR(
    isOpen ? `/api/admin/media?search=${encodeURIComponent(search)}&limit=30` : null,
    fetcher
  );

  const mediaItems = data?.success && Array.isArray(data.data) ? data.data : [];

  async function handleQuickUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const compressed = await compressImage(file, 2000, 0.85);
      const formData = new FormData();
      formData.append('file', compressed);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await res.json();
      if (!res.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed.');
      }

      const newMedia = {
        url: uploadData.data.url,
        publicId: uploadData.data.publicId || '',
        filename: file.name,
        fileSize: compressed.size,
        fileType: compressed.type,
      };

      await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedia),
      });

      mutate();
      setSelectedItem(newMedia);
      toastSuccess('Image uploaded and selected!');
    } catch (err: any) {
      toastError(err?.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  }

  function handleConfirm() {
    if (selectedItem) {
      onSelect({
        url: selectedItem.url,
        publicId: selectedItem.publicId || '',
        alt: selectedItem.alt || selectedItem.filename || '',
        caption: selectedItem.caption || '',
      });
      onClose();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="2xl">
      <div className="flex flex-col gap-4">
        {/* Search and upload bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search media library..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#1b7d95]"
            />
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleQuickUpload}
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isUploading}
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              Upload
            </Button>
          </label>
        </div>

        {/* Media Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
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
                  onClick={() => setSelectedItem(item)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#1b7d95] ring-2 ring-[#1b7d95]/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                  }`}
                >
                  <Image
                    src={item.url}
                    alt={item.alt || item.filename || 'Image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 200px"
                    unoptimized
                  />
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#1b7d95] text-white flex items-center justify-center shadow-md">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pt-4">
                    <p className="text-[11px] text-white truncate">{item.filename}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-slate-400">
              No images found. Upload one to get started!
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedItem}
            onClick={handleConfirm}
          >
            Use Selected Image
          </Button>
        </div>
      </div>
    </Modal>
  );
}
