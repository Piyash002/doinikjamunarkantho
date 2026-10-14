'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import { Plus, Edit, Trash2, Users, FileText, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Input } from '@/src/components/admin/ui/Input';
import { Textarea } from '@/src/components/admin/ui/Textarea';
import { Modal } from '@/src/components/admin/ui/Modal';
import { FormField } from '@/src/components/admin/ui/FormField';
import { ImageUploader, ImageValue } from '@/src/components/admin/ui/ImageUploader';
import { Switch } from '@/src/components/admin/ui/Switch';
import { ConfirmDialog } from '@/src/components/admin/ui/ConfirmDialog';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { useToast } from '@/src/components/admin/ui/Toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AuthorsPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/authors', fetcher);
  const { success: toastSuccess, error: toastError } = useToast();

  const authors = data?.success && Array.isArray(data.data) ? data.data : [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<ImageValue | null>(null);
  const [isActive, setIsActive] = useState(true);

  function openCreateModal() {
    setEditingAuthor(null);
    setName('');
    setDesignation('');
    setBio('');
    setAvatar(null);
    setIsActive(true);
    setIsModalOpen(true);
  }

  function openEditModal(author: any) {
    setEditingAuthor(author);
    setName(author.name || '');
    setDesignation(author.designation || '');
    setBio(author.bio || '');
    setAvatar(author.avatar || null);
    setIsActive(author.isActive !== false);
    setIsModalOpen(true);
  }

  async function handleSaveAuthor(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSaving(true);
      const payload = {
        name: name.trim(),
        designation: designation.trim(),
        bio: bio.trim(),
        avatar,
        isActive,
      };

      const url = editingAuthor ? `/api/admin/authors/${editingAuthor._id}` : '/api/admin/authors';
      const method = editingAuthor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save author.');
      }

      setIsModalOpen(false);
      mutate();
      toastSuccess(editingAuthor ? 'Author profile updated!' : 'Author profile created!');
    } catch (err: any) {
      toastError(err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAuthor() {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/admin/authors/${deleteConfirmId}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to delete author.');

      setDeleteConfirmId(null);
      mutate();
      toastSuccess('Author profile removed.');
    } catch (err: any) {
      toastError(err.message || 'Delete failed.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Authors & Reporters"
        description="Manage bylines, columnist biographies, designations, and article counts."
        actions={
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            Add Author
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : authors.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {authors.map((author: any) => (
            <div
              key={author._id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                {author.avatar?.url ? (
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                    <Image src={author.avatar.url} alt={author.name} fill className="object-cover" sizes="60px" unoptimized />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#0a2b3a] dark:bg-[#1b7d95] text-white flex items-center justify-center font-bold text-lg uppercase shrink-0 shadow-sm">
                    {author.name?.[0] || 'A'}
                  </div>
                )}

                <div className="flex flex-col min-w-0">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                    {author.name}
                  </h3>
                  <span className="text-xs font-semibold text-[#1b7d95] truncate">
                    {author.designation || 'Special Correspondent'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{author.postCount || 0} articles published</span>
                  </div>
                </div>
              </div>

              {author.bio && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {author.bio}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className={`text-xs font-semibold ${author.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {author.isActive !== false ? 'Active Byline' : 'Inactive'}
                </span>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(author)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    onClick={() => setDeleteConfirmId(author._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400">No authors found. Click &quot;Add Author&quot; to register team members.</div>
      )}

      {/* Author Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAuthor ? 'Edit Author' : 'Add New Author'}
        maxWidth="md"
      >
        <form onSubmit={handleSaveAuthor} className="flex flex-col gap-4">
          <ImageUploader
            value={avatar}
            onChange={setAvatar}
            label="Author Photo"
            showCaption={false}
            showAlt={false}
          />

          <FormField label="Full Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. রফিক আহমেদ / Rafiq Ahmed"
              required
            />
          </FormField>

          <FormField label="Designation / Title">
            <Input
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. জ্যেষ্ঠ প্রতিবেদক / Senior Reporter"
            />
          </FormField>

          <FormField label="Short Biography">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short bio or columnist introduction..."
              rows={3}
            />
          </FormField>

          <Switch
            checked={isActive}
            onChange={setIsActive}
            label="Author Active"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              Save Author
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteAuthor}
        title="Delete Author Profile?"
        message="If this author has published articles, you must reassign them to another author first."
        confirmLabel="Delete Author"
      />
    </div>
  );
}
