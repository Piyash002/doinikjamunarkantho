'use client';

import React, { useState, useMemo } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Folder,
  FolderTree,
  ArrowUp,
  ArrowDown,
  Filter,
  Layers,
  CheckCircle,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Modal } from '@/src/components/admin/ui/Modal';
import { generateBanglaSafeSlug } from '@/src/lib/slug';
import { Input } from '@/src/components/admin/ui/Input';
import { Select } from '@/src/components/admin/ui/Select';
import { Switch } from '@/src/components/admin/ui/Switch';
import { FormField } from '@/src/components/admin/ui/FormField';
import { Badge } from '@/src/components/admin/ui/Badge';
import { ConfirmDialog } from '@/src/components/admin/ui/ConfirmDialog';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { useToast } from '@/src/components/admin/ui/Toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SortableSubCategoryItem({
  subCategory,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subCategory._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const parentName = subCategory.parent?.name_bn || subCategory.parent?.name_en || 'ক্যাটাগরি নির্দিষ্ট নয়';
  const parentSlug = subCategory.parent?.slug || '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all ${
        isDragging
          ? 'bg-sky-50 dark:bg-slate-800 border-[#1b7d95] shadow-xl ring-2 ring-[#1b7d95]/30'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Touch & mouse drag handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="touch-target p-1.5 -ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing rounded-lg"
          aria-label="Drag to reorder subcategory"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Up / Down button fallbacks */}
        <div className="flex flex-col -space-y-1">
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
            aria-label="Move up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
            aria-label="Move down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex flex-col min-w-0 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              {subCategory.name_bn}
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              ({subCategory.name_en})
            </span>

            {/* Prominent Parent Category Badge */}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#083c4d]/10 dark:bg-sky-950/50 text-[#083c4d] dark:text-sky-300 border border-[#083c4d]/20 dark:border-sky-800">
              <Folder className="w-3 h-3 text-[#1b7d95]" />
              <span>মূল ক্যাটাগরি: {parentName}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono">
              /{parentSlug ? `${parentSlug}/` : ''}{subCategory.slug}
            </span>
            <span>•</span>
            <span>{subCategory.postCount || 0} টি সংবাদ</span>
            <span>•</span>
            <span>{subCategory.isActive !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 mr-2">
          {subCategory.showInNav && <Badge variant="info">Nav</Badge>}
          {subCategory.isActive !== false ? (
            <Badge variant="success">সক্রিয়</Badge>
          ) : (
            <Badge variant="neutral">নিষ্ক্রিয়</Badge>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          aria-label="Edit subcategory"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          aria-label="Delete subcategory"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function SubCategoriesPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/categories', fetcher);
  const { success: toastSuccess, error: toastError } = useToast();

  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [selectedParentFilter, setSelectedParentFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [parent, setParent] = useState('');
  const [showInNav, setShowInNav] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Extract all categories
  const allCategories: any[] = useMemo(() => {
    return data?.success && Array.isArray(data.data) ? data.data : [];
  }, [data]);

  // Primary categories only (parent == null)
  const primaryCategories: any[] = useMemo(() => {
    return allCategories.filter((c) => !c.parent);
  }, [allCategories]);

  // Sync subcategories to local state
  React.useEffect(() => {
    if (allCategories.length > 0) {
      const subs = allCategories.filter((c) => Boolean(c.parent));
      setSubCategories(subs);
    }
  }, [allCategories]);

  // Filtered by selected parent category
  const filteredSubCategories = useMemo(() => {
    if (selectedParentFilter === 'all') return subCategories;
    return subCategories.filter((sc) => {
      const parentId = sc.parent?._id || sc.parent;
      return parentId === selectedParentFilter;
    });
  }, [subCategories, selectedParentFilter]);

  // DND Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = subCategories.findIndex((c) => c._id === active.id);
      const newIndex = subCategories.findIndex((c) => c._id === over.id);
      const reordered = arrayMove(subCategories, oldIndex, newIndex);
      setSubCategories(reordered);

      try {
        const items = reordered.map((c, idx) => ({ id: c._id, order: idx + 1 }));
        await fetch('/api/admin/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
        toastSuccess('Subcategory order updated!');
      } catch {
        toastError('Failed to save subcategory order.');
        mutate();
      }
    }
  }

  async function moveItem(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredSubCategories.length) return;

    const activeItem = filteredSubCategories[index];
    const targetItem = filteredSubCategories[targetIndex];

    const oldIndex = subCategories.findIndex((c) => c._id === activeItem._id);
    const newIndex = subCategories.findIndex((c) => c._id === targetItem._id);

    const reordered = arrayMove(subCategories, oldIndex, newIndex);
    setSubCategories(reordered);

    try {
      const items = reordered.map((c, idx) => ({ id: c._id, order: idx + 1 }));
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      toastSuccess('Subcategory order updated!');
    } catch {
      toastError('Failed to save subcategory order.');
      mutate();
    }
  }

  function openCreateModal() {
    setEditingSubCategory(null);
    setNameBn('');
    setNameEn('');
    // Default to the first primary category or currently filtered parent
    setParent(selectedParentFilter !== 'all' ? selectedParentFilter : primaryCategories[0]?._id || '');
    setShowInNav(true);
    setIsActive(true);
    setIsModalOpen(true);
  }

  function openEditModal(subCat: any) {
    setEditingSubCategory(subCat);
    setNameBn(subCat.name_bn || '');
    setNameEn(subCat.name_en || '');
    setParent(subCat.parent?._id || subCat.parent || '');
    setShowInNav(subCat.showInNav !== false);
    setIsActive(subCat.isActive !== false);
    setIsModalOpen(true);
  }

  async function handleSaveSubCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!nameBn.trim() || !nameEn.trim()) {
      toastError('বাংলা ও ইংরেজি উভয় নাম পূরণ করা আবশ্যক।');
      return;
    }

    if (!parent) {
      toastError('মূল ক্যাটাগরি (Parent Category) নির্বাচন করা আবশ্যক।');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name_bn: nameBn.trim(),
        name_en: nameEn.trim(),
        slug: generateBanglaSafeSlug(nameEn.trim() || nameBn.trim()),
        parent,
        showInNav,
        showOnHome: false,
        isActive,
      };

      const url = editingSubCategory
        ? `/api/admin/categories/${editingSubCategory._id}`
        : '/api/admin/categories';
      const method = editingSubCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save subcategory.');
      }

      setIsModalOpen(false);
      mutate();
      toastSuccess(editingSubCategory ? 'Subcategory updated!' : 'Subcategory created successfully!');
    } catch (err: any) {
      toastError(err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSubCategory() {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/admin/categories/${deleteConfirmId}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to delete subcategory.');

      setDeleteConfirmId(null);
      mutate();
      toastSuccess('Subcategory deleted successfully.');
    } catch (err: any) {
      toastError(err.message || 'Delete failed.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sub Categories (সাব-ক্যাটাগরি)"
        description="মূল ক্যাটাগরির অধীনে সাব-ক্যাটাগরি তৈরি, সম্পাদনা ও পুনর্বিন্যাস করুন।"
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
          >
            New Sub Category
          </Button>
        }
      />

      {/* Navigation Tabs: Categories vs Sub Categories */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Link
          href="/admin/categories"
          className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition-all"
        >
          Primary Categories (মূল ক্যাটাগরি)
        </Link>
        <Link
          href="/admin/subcategories"
          className="px-4 py-2 text-sm font-bold text-white bg-[#083c4d] dark:bg-[#1b7d95] rounded-xl shadow-xs transition-all"
        >
          Sub Categories (সাব-ক্যাটাগরি)
        </Link>
      </div>

      {/* Filter by Parent Category */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            মূল ক্যাটাগরি অনুযায়ী ফিল্টার:
          </span>
        </div>
        <div className="w-full sm:w-72">
          <Select
            value={selectedParentFilter}
            onChange={(e) => setSelectedParentFilter(e.target.value)}
          >
            <option value="all">সকল মূল ক্যাটাগরি ({primaryCategories.length})</option>
            {primaryCategories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name_bn} ({cat.name_en})
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Reorder notice */}
      <div className="p-3 rounded-xl bg-[#1b7d95]/10 text-[#1b7d95] dark:text-sky-300 text-xs sm:text-sm font-medium flex items-center gap-2">
        <GripVertical className="w-4 h-4 shrink-0" />
        <span>মাউস বা স্পর্শ করে টেনে সাব-ক্যাটাগরিগুলোর ক্রম সাজাতে পারেন। Up/Down বোতামও ব্যবহার করা যাবে।</span>
      </div>

      {/* Sortable List */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : filteredSubCategories.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredSubCategories.map((c) => c._id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2.5">
              {filteredSubCategories.map((subCat, idx) => (
                <SortableSubCategoryItem
                  key={subCat._id}
                  subCategory={subCat}
                  onEdit={() => openEditModal(subCat)}
                  onDelete={() => setDeleteConfirmId(subCat._id)}
                  onMoveUp={() => moveItem(idx, 'up')}
                  onMoveDown={() => moveItem(idx, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === filteredSubCategories.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Folder className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-slate-500 font-medium">কোনো সাব-ক্যাটাগরি পাওয়া যায়নি।</p>
          <p className="text-xs text-slate-400 mt-1">
            উপরে &quot;New Sub Category&quot; বাটনে ক্লিক করে নতুন সাব-ক্যাটাগরি যুক্ত করুন।
          </p>
        </div>
      )}

      {/* Create / Edit Sub Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubCategory ? 'সাব-ক্যাটাগরি সম্পাদনা করুন' : 'নতুন সাব-ক্যাটাগরি তৈরি করুন'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveSubCategory} className="flex flex-col gap-4">
          <FormField
            label="মূল ক্যাটাগরি (Parent Category)"
            required
            hint="এই সাব-ক্যাটাগরিটি কোন ক্যাটাগরির অধীনে থাকবে তা নির্বাচন করুন"
          >
            <Select value={parent} onChange={(e) => setParent(e.target.value)} required>
              <option value="">-- মূল ক্যাটাগরি নির্বাচন করুন --</option>
              {primaryCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name_bn} ({c.name_en})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="সাব-ক্যাটাগরির বাংলা নাম" required>
            <Input
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              placeholder="যেমন: ক্রিকেট, ফুটবল, নির্বাচন, ঢাকা বিভাগ..."
              required
            />
          </FormField>

          <FormField label="সাব-ক্যাটাগরির ইংরেজি নাম" required>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Cricket, Football, Election, Dhaka Division..."
              required
            />
          </FormField>

          <div className="flex flex-col gap-3 pt-2">
            <Switch
              checked={showInNav}
              onChange={setShowInNav}
              label="ওয়েবসাইটের ড্রপডাউন মেনুতে প্রদর্শন করুন"
            />
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="সাব-ক্যাটাগরি সক্রিয় রাখুন"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              বাতিল
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteSubCategory}
        title="সাব-ক্যাটাগরি মুছে ফেলবেন?"
        message="যদি এই সাব-ক্যাটাগরির অধীনে সক্রিয় কোনো সংবাদ থাকে, তবে আগে সেগুলোর ক্যাটাগরি পরিবর্তন করে নিতে হবে।"
        confirmLabel="মুছে ফেলুন"
      />
    </div>
  );
}
