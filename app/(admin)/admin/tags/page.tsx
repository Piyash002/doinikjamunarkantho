'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Tag as TagIcon, Plus, Edit, GitMerge, Trash2, Search } from 'lucide-react';
import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Input } from '@/src/components/admin/ui/Input';
import { Modal } from '@/src/components/admin/ui/Modal';
import { FormField } from '@/src/components/admin/ui/FormField';
import { Select } from '@/src/components/admin/ui/Select';
import { ConfirmDialog } from '@/src/components/admin/ui/ConfirmDialog';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { useToast } from '@/src/components/admin/ui/Toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TagsPage() {
  const [search, setSearch] = useState('');
  const { data, mutate, isLoading } = useSWR(`/api/admin/tags?search=${encodeURIComponent(search)}`, fetcher);
  const { success: toastSuccess, error: toastError } = useToast();

  const tags = data?.success && Array.isArray(data.data) ? data.data : [];

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create tag.');

      setIsCreateOpen(false);
      setNewTagName('');
      mutate();
      toastSuccess('Tag created successfully!');
    } catch (err: any) {
      toastError(err.message || 'Creation failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRenameTag(e: React.FormEvent) {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/tags/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName: renameTarget, newName: renameValue.trim() }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to rename tag.');

      setRenameTarget(null);
      setRenameValue('');
      mutate();
      toastSuccess('Tag renamed across all articles!');
    } catch (err: any) {
      toastError(err.message || 'Rename failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMergeTags(e: React.FormEvent) {
    e.preventDefault();
    if (!mergeSource || !mergeTarget) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/tags/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceTag: mergeSource, targetTag: mergeTarget }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to merge tags.');

      setMergeSource(null);
      setMergeTarget('');
      mutate();
      toastSuccess('Tags merged successfully across all articles!');
    } catch (err: any) {
      toastError(err.message || 'Merge failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTag() {
    if (!deleteTarget) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/tags/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deleteTarget }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to delete tag.');

      setDeleteTarget(null);
      mutate();
      toastSuccess('Tag deleted and removed from articles.');
    } catch (err: any) {
      toastError(err.message || 'Delete failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tags & Topics"
        description="Monitor topic keywords, article frequency, and merge or rename duplicate tags."
        actions={
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
            New Tag
          </Button>
        }
      />

      {/* Search Input */}
      <div className="w-full sm:max-w-md">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tags..."
          leftIcon={<Search className="w-4 h-4" />}
          showClear
          onClear={() => setSearch('')}
        />
      </div>

      {/* Tags List */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : tags.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map((tag: any) => (
            <div
              key={tag.name}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#1b7d95]/10 text-[#1b7d95] flex items-center justify-center shrink-0">
                  <TagIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                    {tag.name}
                  </span>
                  <span className="text-xs text-slate-400">
                    {tag.postCount || 0} articles
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Rename Tag"
                  onClick={() => {
                    setRenameTarget(tag.name);
                    setRenameValue(tag.name);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Merge into Another Tag"
                  onClick={() => {
                    setMergeSource(tag.name);
                    setMergeTarget('');
                  }}
                >
                  <GitMerge className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Delete Tag"
                  className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  onClick={() => setDeleteTarget(tag.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400">No tags found.</div>
      )}

      {/* Create Tag Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Tag" maxWidth="sm">
        <form onSubmit={handleCreateTag} className="flex flex-col gap-4">
          <FormField label="Tag Name" required>
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="e.g. বাজেট ২০২৬, চ্যাম্পিয়নস ট্রফি..."
              required
              autoFocus
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Tag
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rename Tag Modal */}
      <Modal isOpen={Boolean(renameTarget)} onClose={() => setRenameTarget(null)} title="Rename Tag" maxWidth="sm">
        <form onSubmit={handleRenameTag} className="flex flex-col gap-4">
          <p className="text-xs text-slate-500">
            Renaming &quot;{renameTarget}&quot; will automatically update this keyword in all attached articles.
          </p>
          <FormField label="New Tag Name" required>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              required
              autoFocus
            />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Rename
            </Button>
          </div>
        </form>
      </Modal>

      {/* Merge Tag Modal */}
      <Modal isOpen={Boolean(mergeSource)} onClose={() => setMergeSource(null)} title="Merge Duplicate Tags" maxWidth="sm">
        <form onSubmit={handleMergeTags} className="flex flex-col gap-4">
          <p className="text-xs text-slate-500">
            Merge &quot;<strong>{mergeSource}</strong>&quot; into a target tag. All articles using &quot;{mergeSource}&quot; will be transferred, and the old tag will be removed.
          </p>
          <FormField label="Target Tag to merge into" required>
            <Select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} required>
              <option value="">Select target tag...</option>
              {tags
                .filter((t: any) => t.name !== mergeSource)
                .map((t: any) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.postCount || 0} articles)
                  </option>
                ))}
            </Select>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setMergeSource(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!mergeTarget} isLoading={isSubmitting}>
              Merge Tags
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTag}
        title={`Delete tag "${deleteTarget}"?`}
        message="This tag will be pulled from all articles currently using it."
        confirmLabel="Delete Tag"
        isLoading={isSubmitting}
      />
    </div>
  );
}
