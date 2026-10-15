'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  CheckCircle,
  Eye,
  MousePointer,
} from 'lucide-react';

import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Modal } from '@/src/components/admin/ui/Modal';
import { Input } from '@/src/components/admin/ui/Input';
import { Select } from '@/src/components/admin/ui/Select';
import { Switch } from '@/src/components/admin/ui/Switch';
import { FormField } from '@/src/components/admin/ui/FormField';
import { Badge } from '@/src/components/admin/ui/Badge';
import { ImageUploader, ImageValue } from '@/src/components/admin/ui/ImageUploader';
import { DateTimePicker } from '@/src/components/admin/ui/DateTimePicker';
import { ConfirmDialog } from '@/src/components/admin/ui/ConfirmDialog';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { useToast } from '@/src/components/admin/ui/Toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const AD_POSITIONS = [
  { value: 'header-below', label: 'Header Below Banner (970x90 / 728x90)' },
  { value: 'sidebar', label: 'Homepage Sidebar (300x250 / 300x600)' },
  { value: 'between-sections', label: 'Between Homepage Sections (970x90)' },
  { value: 'sticky-bottom', label: 'Sticky Bottom Mobile Anchor (320x50)' },
  { value: 'in-article', label: 'Inside Article Body (300x250)' },
  { value: 'article-sidebar-top', label: 'Article Sidebar Top (300x250)' },
  { value: 'article-sidebar-mid', label: 'Article Sidebar Middle (300x600)' },
];

export default function AdsPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/ads', fetcher);
  const { success: toastSuccess, error: toastError } = useToast();

  const ads = data?.success && Array.isArray(data.data) ? data.data : [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [key, setKey] = useState('');
  const [position, setPosition] = useState('sidebar');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('#');
  const [sizeHint, setSizeHint] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isActive, setIsActive] = useState(true);

  function openCreateModal() {
    setEditingAd(null);
    setKey(`ad-${Date.now()}`);
    setPosition('sidebar');
    setImageUrl('');
    setLink('https://');
    setSizeHint('300x250');
    setStartDate(null);
    setEndDate(null);
    setIsActive(true);
    setIsModalOpen(true);
  }

  function openEditModal(ad: any) {
    setEditingAd(ad);
    setKey(ad.key || '');
    setPosition(ad.position || 'sidebar');
    setImageUrl(ad.imageUrl || '');
    setLink(ad.link || '#');
    setSizeHint(ad.sizeHint || '');
    setStartDate(ad.startDate ? new Date(ad.startDate) : null);
    setEndDate(ad.endDate ? new Date(ad.endDate) : null);
    setIsActive(ad.isActive !== false);
    setIsModalOpen(true);
  }

  async function handleSaveAd(e: React.FormEvent) {
    e.preventDefault();
    if (!key.trim()) return;

    try {
      setIsSaving(true);
      const payload = {
        key: key.trim(),
        position,
        imageUrl,
        link: link.trim() || '#',
        sizeHint,
        startDate,
        endDate,
        isActive,
      };

      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save ad slot.');

      setIsModalOpen(false);
      mutate();
      toastSuccess(editingAd ? 'Ad slot updated!' : 'Ad slot configured!');
    } catch (err: any) {
      toastError(err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAd() {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/admin/ads/${deleteConfirmId}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to delete ad slot.');

      setDeleteConfirmId(null);
      mutate();
      toastSuccess('Ad slot removed.');
    } catch (err: any) {
      toastError(err.message || 'Delete failed.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Advertisements & Banners"
        description="Place promotional creative banners across article pages, header, sidebar and home sections."
        actions={
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            Configure Ad Slot
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : ads.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad: any) => (
            <div
              key={ad._id || ad.key}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                    {ad.key}
                  </span>
                  <Badge variant={ad.isActive !== false ? 'success' : 'outline'}>
                    {ad.isActive !== false ? 'Active' : 'Paused'}
                  </Badge>
                </div>

                {ad.imageUrl ? (
                  <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <Image src={ad.imageUrl} alt={ad.key} fill className="object-cover" sizes="300px" unoptimized />
                  </div>
                ) : (
                  <div className="w-full aspect-[21/9] rounded-xl bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Megaphone className="w-5 h-5 mb-1 opacity-50" />
                    <span>No Creative Uploaded</span>
                  </div>
                )}

                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Position: <span className="text-[#1b7d95]">{ad.position}</span>
                  </span>
                  <span className="text-slate-400 truncate">Link: {ad.link || '#'}</span>
                  {ad.sizeHint && <span className="text-slate-400">Recommended Size: {ad.sizeHint}</span>}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{ad.impressions || 0} views</span>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(ad)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => setDeleteConfirmId(ad._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400">No ad slots created yet. Click &quot;Configure Ad Slot&quot; to add one.</div>
      )}

      {/* Ad Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAd ? 'Edit Ad Slot' : 'Configure Ad Slot'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveAd} className="flex flex-col gap-4">
          <FormField label="Slot Identifier Key" required hint="Unique programmatic key for template injection">
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. sidebar-top-banner"
              required
            />
          </FormField>

          <FormField label="Placement Position" required>
            <Select value={position} onChange={(e) => setPosition(e.target.value)}>
              {AD_POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </FormField>

          <ImageUploader
            value={imageUrl ? { url: imageUrl } : null}
            onChange={(val) => setImageUrl(val?.url || '')}
            label="Creative Banner Graphic"
            showCaption={false}
            showAlt={false}
          />

          <FormField label="Target Landing URL">
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://client-landing-page.com"
            />
          </FormField>

          <FormField label="Dimensions / Size Hint">
            <Input
              value={sizeHint}
              onChange={(e) => setSizeHint(e.target.value)}
              placeholder="e.g. 300x250, 728x90, 320x50"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Campaign Start Date (Optional)">
              <DateTimePicker
                value={startDate}
                onChange={setStartDate}
              />
            </FormField>

            <FormField label="Campaign End Date (Optional)">
              <DateTimePicker
                value={endDate}
                onChange={setEndDate}
              />
            </FormField>
          </div>

          <Switch
            checked={isActive}
            onChange={setIsActive}
            label="Ad Slot Display Active"
            description="When enabled, banner will display live to visitors"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              Save Slot
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteAd}
        title="Delete Ad Slot?"
        message="This advertisement slot configuration will be removed from display."
        confirmLabel="Delete Ad"
      />
    </div>
  );
}
