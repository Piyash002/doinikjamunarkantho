'use client';

import React, { useState, useRef } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import {
  UploadCloud,
  Search,
  Copy,
  Trash2,
  Edit,
  ExternalLink,
  Check,
  FileText,
  Loader2,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Input } from '@/src/components/admin/ui/Input';
import { Modal } from '@/src/components/admin/ui/Modal';
import { FormField } from '@/src/components/admin/ui/FormField';
import { Pagination } from '@/src/components/admin/ui/Pagination';
import { ConfirmDialog } from '@/src/components/admin/ui/ConfirmDialog';
import { compressImage } from '@/src/lib/imageCompressor';
import { useToast } from '@/src/components/admin/ui/Toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MediaPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { success: toastSuccess, error: toastError } = useToast();

  const { data, mutate, isLoading } = useSWR(
    `/api/admin/media?search=${encodeURIComponent(search)}&page=${page}&limit=24`,
    fetcher,
    { revalidateOnFocus: true }
  );

  const mediaItems = data?.success && Array.isArray(data.data) ? data.data : [];
  const meta = data?.meta || {};

  // Uploading state with multi-file progress
  const [uploadQueue, setUploadQueue] = useState<{ id: string; name: string; progress: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Selected item modal for preview, rename & used-in inspection
  const [activeMedia, setActiveMedia] = useState<any>(null);
  const [editFilename, setEditFilename] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Used-in articles list
  const [usedInPosts, setUsedInPosts] = useState<any[]>([]);
  const [isLoadingUsedIn, setIsLoadingUsedIn] = useState(false);

  // Delete Confirmation
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleFilesUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    for (const file of fileList) {
      if (!file.type.startsWith('image/')) continue;

      const queueId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setUploadQueue((prev) => [...prev, { id: queueId, name: file.name, progress: 20 }]);

      try {
        const compressed = await compressImage(file, 2000, 0.85);
        setUploadQueue((prev) =>
          prev.map((item) => (item.id === queueId ? { ...item, progress: 50 } : item))
        );

        const formData = new FormData();
        formData.append('file', compressed);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await res.json();
        if (!res.ok || !uploadData.success) {
          throw new Error(uploadData.error || 'Upload failed');
        }

        setUploadQueue((prev) =>
          prev.map((item) => (item.id === queueId ? { ...item, progress: 80 } : item))
        );

        await fetch('/api/admin/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: uploadData.data.url,
            publicId: uploadData.data.publicId || '',
            filename: file.name,
            fileSize: compressed.size,
            fileType: compressed.type,
            width: uploadData.data.width || 0,
            height: uploadData.data.height || 0,
          }),
        });

        setUploadQueue((prev) => prev.filter((item) => item.id !== queueId));
        mutate();
        toastSuccess(`"${file.name}" uploaded and compressed!`);
      } catch (err: any) {
        setUploadQueue((prev) => prev.filter((item) => item.id !== queueId));
        toastError(`Failed to upload ${file.name}: ${err.message}`);
      }
    }
  }

  function openMediaDetails(item: any) {
    setActiveMedia(item);
    setEditFilename(item.filename || '');
    setEditAlt(item.alt || '');
    setEditCaption(item.caption || '');

    // Fetch used-in articles
    setIsLoadingUsedIn(true);
    fetch(`/api/admin/media/used-in?url=${encodeURIComponent(item.url)}&publicId=${encodeURIComponent(item.publicId || '')}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setUsedInPosts(resData.data || []);
        }
      })
      .catch(() => setUsedInPosts([]))
      .finally(() => setIsLoadingUsedIn(false));
  }

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMedia) return;

    try {
      setIsSavingDetails(true);
      const res = await fetch(`/api/admin/media/${activeMedia._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: editFilename,
          alt: editAlt,
          caption: editCaption,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update media details.');

      toastSuccess('Media details saved!');
      setActiveMedia(null);
      mutate();
    } catch (err: any) {
      toastError(err.message || 'Save failed.');
    } finally {
      setIsSavingDetails(false);
    }
  }

  function copyToClipboard(url: string) {
    navigator.clipboard.writeText(url);
    toastSuccess('Image URL copied to clipboard!');
  }

  async function handleDeleteMedia() {
    if (!deleteConfirmItem) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/media/${deleteConfirmItem._id}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to delete image.');

      setDeleteConfirmItem(null);
      setActiveMedia(null);
      mutate();
      toastSuccess('Image asset deleted successfully.');
    } catch (err: any) {
      toastError(err.message || 'Cannot delete image: it may be used in articles.');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Media Asset Library"
        description="Upload, compress, search, and manage imagery used across news articles."
        actions={
          <label className="cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFilesUpload(e.target.files)}
            />
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={<UploadCloud className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Files
            </Button>
          </label>
        }
      />

      {/* Upload Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFilesUpload(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-[#1b7d95] bg-[#1b7d95]/5'
            : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-400'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-[#1b7d95]/10 text-[#1b7d95] flex items-center justify-center mb-2">
          <UploadCloud className="w-6 h-6" />
        </div>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Drop files to upload, or tap to choose from device/camera
        </span>
        <span className="text-xs text-slate-400 mt-1">
          Supports multi-file upload with client-side auto compression up to 2000px
        </span>
      </div>

      {/* Active Upload Progress Bars */}
      {uploadQueue.length > 0 && (
        <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 uppercase">Uploading {uploadQueue.length} items</span>
          {uploadQueue.map((item) => (
            <div key={item.id} className="flex flex-col gap-1 text-xs">
              <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
                <span className="truncate">{item.name}</span>
                <span>{item.progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-[#1b7d95] transition-all duration-300" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Bar */}
      <div className="w-full sm:max-w-md">
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by filename, caption or alt text..."
          leftIcon={<Search className="w-4 h-4" />}
          showClear
          onClear={() => setSearch('')}
        />
      </div>

      {/* Responsive Media Grid: 2 cols mobile, 4-6 desktop */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : mediaItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {mediaItems.map((item: any) => (
            <div
              key={item._id || item.url}
              onClick={() => openMediaDetails(item)}
              className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs cursor-pointer hover:shadow-md hover:border-[#1b7d95] transition-all"
            >
              <Image
                src={item.url}
                alt={item.alt || item.filename || 'Image'}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                unoptimized
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-6 flex flex-col justify-end">
                <p className="text-xs font-semibold text-white truncate">{item.filename}</p>
                <span className="text-[10px] text-slate-300">
                  {item.fileSize ? `${Math.round(item.fileSize / 1024)} KB` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400">No media assets found. Upload files to populate your media library.</div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={meta.totalPages || 1}
        totalItems={meta.total || 0}
        onPageChange={setPage}
      />

      {/* Media Details & Inspector Modal */}
      <Modal
        isOpen={Boolean(activeMedia)}
        onClose={() => setActiveMedia(null)}
        title="Asset Details"
        maxWidth="2xl"
      >
        {activeMedia && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left: Image preview & URL copy */}
            <div className="flex flex-col gap-3">
              <div className="relative aspect-video sm:aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Image
                  src={activeMedia.url}
                  alt={activeMedia.alt || 'Asset'}
                  fill
                  className="object-contain"
                  sizes="400px"
                  unoptimized
                />
              </div>

              <div className="flex items-center gap-2">
                <Input value={activeMedia.url} readOnly className="text-xs font-mono" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(activeMedia.url)}
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <a
                  href={activeMedia.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-500"
                  title="Open full size"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Used In List */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-2 mt-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#1b7d95]" />
                  <span>Articles using this image:</span>
                </span>
                {isLoadingUsedIn ? (
                  <span className="text-xs text-slate-400">Checking usage in articles...</span>
                ) : usedInPosts.length > 0 ? (
                  <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                    {usedInPosts.map((post) => (
                      <span key={post._id} className="text-xs text-slate-600 dark:text-slate-300 truncate">
                        • {post.title}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Not currently used in any published article.</span>
                )}
              </div>
            </div>

            {/* Right: Metadata edit form */}
            <form onSubmit={handleSaveDetails} className="flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <FormField label="File Name">
                  <Input
                    value={editFilename}
                    onChange={(e) => setEditFilename(e.target.value)}
                  />
                </FormField>

                <FormField label="Alt Text (SEO & Accessibility)">
                  <Input
                    value={editAlt}
                    onChange={(e) => setEditAlt(e.target.value)}
                    placeholder="Short description of image..."
                  />
                </FormField>

                <FormField label="Caption / Photographer Credit">
                  <Input
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    placeholder="Credit: Staff Reporter"
                  />
                </FormField>

                <div className="flex flex-col gap-1 text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Dimensions: {activeMedia.width} x {activeMedia.height} px</span>
                  <span>Size: {activeMedia.fileSize ? `${Math.round(activeMedia.fileSize / 1024)} KB` : 'N/A'}</span>
                  <span>Uploaded by: {activeMedia.uploadedBy || 'Admin'}</span>
                  <span>Date: {new Date(activeMedia.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setDeleteConfirmItem(activeMedia)}
                >
                  Delete
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setActiveMedia(null)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" isLoading={isSavingDetails}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmItem)}
        onClose={() => setDeleteConfirmItem(null)}
        onConfirm={handleDeleteMedia}
        title="Delete Image Asset?"
        message="If this image is used in any published articles, the deletion will be rejected for safety."
        confirmLabel="Delete Asset"
        isLoading={isDeleting}
      />
    </div>
  );
}
