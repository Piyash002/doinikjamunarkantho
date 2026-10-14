'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  TrendingUp,
  Plus,
  Edit,
  GitMerge,
  Trash2,
  Search,
  ArrowUp,
  ArrowDown,
  FileText,
  AlignLeft,
} from 'lucide-react';
import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Input } from '@/src/components/admin/ui/Input';
import { Textarea } from '@/src/components/admin/ui/Textarea';
import { Modal } from '@/src/components/admin/ui/Modal';
import { FormField } from '@/src/components/admin/ui/FormField';
import { Select } from '@/src/components/admin/ui/Select';
import { ConfirmDialog } from '@/src/components/admin/ui/ConfirmDialog';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { useToast } from '@/src/components/admin/ui/Toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TopicItem {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order?: number;
  postCount?: number;
  isTrending?: boolean;
}

export default function TrendingTopicsPage() {
  const [search, setSearch] = useState('');
  const { data, mutate, isLoading } = useSWR(
    `/api/admin/tags?search=${encodeURIComponent(search)}`,
    fetcher
  );
  const { success: toastSuccess, error: toastError } = useToast();

  const [topics, setTopics] = useState<TopicItem[]>([]);

  // Sync SWR data to local state
  useEffect(() => {
    if (data?.success && Array.isArray(data.data)) {
      setTopics(data.data);
    }
  }, [data]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createOrder, setCreateOrder] = useState<number | ''>('');

  const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editOrder, setEditOrder] = useState<number>(0);

  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Serialization: Move Up / Down
  async function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= topics.length) return;

    const newTopics = [...topics];
    const [movedItem] = newTopics.splice(index, 1);
    newTopics.splice(targetIndex, 0, movedItem);

    // Reassign sequential orders
    const updated = newTopics.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));

    setTopics(updated);

    try {
      const items = updated.map((t, idx) => ({ id: t._id, order: idx + 1 }));
      const res = await fetch('/api/admin/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Failed to save order.');
      toastSuccess('Topic order updated successfully!');
    } catch {
      toastError('Failed to persist topic order.');
      mutate();
    }
  }

  // 2. Create Topic
  async function handleCreateTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createName.trim(),
          description: createDescription.trim(),
          order: typeof createOrder === 'number' ? createOrder : undefined,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create topic.');

      setIsCreateOpen(false);
      setCreateName('');
      setCreateDescription('');
      setCreateOrder('');
      mutate();
      toastSuccess('Trending topic created successfully!');
    } catch (err: any) {
      toastError(err.message || 'Creation failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // 3. Edit Topic
  function openEditModal(topic: TopicItem) {
    setEditingTopic(topic);
    setEditName(topic.name);
    setEditDescription(topic.description || '');
    setEditOrder(topic.order || 0);
  }

  async function handleEditTopic(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTopic || !editName.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTopic._id,
          name: editName.trim(),
          description: editDescription.trim(),
          order: Number(editOrder) || editingTopic.order,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update topic.');

      setEditingTopic(null);
      mutate();
      toastSuccess('Topic updated successfully!');
    } catch (err: any) {
      toastError(err.message || 'Update failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // 4. Merge Topics
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
      if (!res.ok) throw new Error(resData.error || 'Failed to merge topics.');

      setMergeSource(null);
      setMergeTarget('');
      mutate();
      toastSuccess('Topics merged successfully across all articles!');
    } catch (err: any) {
      toastError(err.message || 'Merge failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // 5. Delete Topic
  async function handleDeleteTopic() {
    if (!deleteTarget) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/tags/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deleteTarget }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to delete topic.');

      setDeleteTarget(null);
      mutate();
      toastSuccess('Topic deleted and removed from articles.');
    } catch (err: any) {
      toastError(err.message || 'Delete failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Trending Topics"
        description="Manage trending topic keywords, descriptions, and custom serialization (order) across the portal."
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setCreateName('');
              setCreateDescription('');
              setCreateOrder(topics.length + 1);
              setIsCreateOpen(true);
            }}
          >
            New Topic
          </Button>
        }
      />

      {/* Search Input */}
      <div className="w-full sm:max-w-md">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search trending topics..."
          leftIcon={<Search className="w-4 h-4" />}
          showClear
          onClear={() => setSearch('')}
        />
      </div>

      {/* Topics List with Custom Serialization */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : topics.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {topics.map((topic, index) => {
            const isFirst = index === 0;
            const isLast = index === topics.length - 1;

            return (
              <div
                key={topic._id || topic.name}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {/* Header: Up/Down Buttons, Order Badge, Name, Count */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Up / Down Serialization Controls */}
                    <div className="flex flex-col -space-y-1">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMove(index, 'up')}
                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                        title="Move Up"
                        aria-label="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMove(index, 'down')}
                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-colors"
                        title="Move Down"
                        aria-label="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
                      #{topic.order || index + 1}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                          {topic.name}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {topic.postCount || 0} articles
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Edit Topic"
                      onClick={() => openEditModal(topic)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Merge into Another Topic"
                      onClick={() => {
                        setMergeSource(topic.name);
                        setMergeTarget('');
                      }}
                    >
                      <GitMerge className="w-4 h-4 text-amber-600" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      title="Delete Topic"
                      onClick={() => setDeleteTarget(topic.name)}
                      className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Description Snippet (Shown when available) */}
                {topic.description ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                    {topic.description}
                  </p>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">No description set</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No trending topics found.</p>
        </div>
      )}

      {/* Create Topic Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add New Trending Topic"
        maxWidth="md"
      >
        <form onSubmit={handleCreateTopic} className="flex flex-col gap-4">
          <FormField label="Topic Name" required hint="e.g. ডেঙ্গু, নির্বাচন, বাজেট, বিশ্বকাপ">
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="e.g. ডেঙ্গু"
              required
              autoFocus
            />
          </FormField>

          <FormField
            label="Topic Description / Summary"
            hint="Displayed as the topic header description on the public topic page"
          >
            <Textarea
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="ডেঙ্গু সম্পর্কিত সব গুরুত্বপূর্ণ খবর, আপডেট ও নির্দেশনা..."
              rows={3}
            />
          </FormField>

          <FormField label="Serialization Order" hint="Lower number appears earlier in trending list">
            <Input
              type="number"
              value={createOrder}
              onChange={(e) => setCreateOrder(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 1, 2, 3..."
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Create Topic
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Topic Modal */}
      <Modal
        isOpen={Boolean(editingTopic)}
        onClose={() => setEditingTopic(null)}
        title="Edit Trending Topic"
        maxWidth="md"
      >
        <form onSubmit={handleEditTopic} className="flex flex-col gap-4">
          <FormField label="Topic Name" required>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Topic name"
              required
            />
          </FormField>

          <FormField
            label="Topic Description"
            hint="Description shown at the top of this topic's dedicated news page"
          >
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Describe this topic..."
              rows={3}
            />
          </FormField>

          <FormField label="Serialization Order">
            <Input
              type="number"
              value={editOrder}
              onChange={(e) => setEditOrder(Number(e.target.value))}
            />
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditingTopic(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Merge Topic Modal */}
      <Modal
        isOpen={Boolean(mergeSource)}
        onClose={() => setMergeSource(null)}
        title={`Merge "${mergeSource}" Topic`}
      >
        <form onSubmit={handleMergeTags} className="flex flex-col gap-4">
          <p className="text-sm text-slate-500">
            Select a target topic to absorb all articles from{' '}
            <strong className="text-slate-800 dark:text-slate-200">"{mergeSource}"</strong>.
            The old topic will be safely deleted.
          </p>

          <FormField label="Target Topic" required>
            <Select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} required>
              <option value="">Select target topic...</option>
              {topics
                .filter((t) => t.name !== mergeSource)
                .map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.postCount || 0} articles)
                  </option>
                ))}
            </Select>
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setMergeSource(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isSubmitting} disabled={!mergeTarget}>
              Merge Topic
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={`Delete Topic "${deleteTarget}"?`}
        description="This will remove the topic from all associated articles. Articles themselves will NOT be deleted."
        confirmText="Delete Topic"
        confirmVariant="danger"
        loading={isSubmitting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTopic}
      />
    </div>
  );
}
