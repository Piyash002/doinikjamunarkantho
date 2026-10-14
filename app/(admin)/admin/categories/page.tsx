'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Folder,
  ArrowUp,
  ArrowDown,
  Layout,
  Check,
  Eye,
  Home,
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

const LAYOUT_OPTIONS = [
  { id: 'hero', name: 'Hero Lead + 3 Columns', preview: '1 big lead + 3 side cards' },
  { id: 'lead-plus-list', name: 'Lead Story + Headline List', preview: 'Left lead + right text list' },
  { id: 'grid-4', name: '4-Column Grid', preview: '4 equal image cards' },
  { id: 'sports-3col', name: 'Sports 3-Column Layout', preview: '3 photo cards with match badge' },
  { id: 'intl-3col', name: 'International 3-Column', preview: '3 foreign news cards' },
  { id: 'entertainment-3col', name: 'Showbiz 3-Column', preview: '3 entertainment glamour cards' },
];

function SortableCategoryItem({
  category,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

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
          aria-label="Drag to reorder category"
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

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
              {category.name_bn}
            </span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              ({category.name_en})
            </span>
            {category.parent && (
              <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md font-mono">
                Sub: {category.parent?.name_bn || 'Parent'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="font-mono">/{category.slug}</span>
            <span>•</span>
            <span>{category.postCount || 0} articles</span>
            <span>•</span>
            <span className="capitalize">{category.homeLayout}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 mr-2">
          {category.showInNav && <Badge variant="info">Nav</Badge>}
          {category.showOnHome && <Badge variant="success">Home</Badge>}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          aria-label="Edit category"
        >
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          aria-label="Delete category"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/categories', fetcher);
  const { success: toastSuccess, error: toastError } = useToast();

  const [categories, setCategories] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [homeLayout, setHomeLayout] = useState('hero');
  const [parent, setParent] = useState('');
  const [showInNav, setShowInNav] = useState(true);
  const [showOnHome, setShowOnHome] = useState(true);
  const [isActive, setIsActive] = useState(true);

  // Sync SWR data to local state
  React.useEffect(() => {
    if (data?.success && Array.isArray(data.data)) {
      setCategories(data.data);
    }
  }, [data]);

  // DND Kit Sensors with Touch Sensor configured for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c._id === active.id);
      const newIndex = categories.findIndex((c) => c._id === over.id);
      const reordered = arrayMove(categories, oldIndex, newIndex);
      setCategories(reordered);

      // Persist order on server
      try {
        const items = reordered.map((c, idx) => ({ id: c._id, order: idx + 1 }));
        await fetch('/api/admin/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
        toastSuccess('Category order updated!');
      } catch {
        toastError('Failed to save category order.');
        mutate();
      }
    }
  }

  async function moveItem(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const reordered = arrayMove(categories, index, targetIndex);
    setCategories(reordered);

    try {
      const items = reordered.map((c, idx) => ({ id: c._id, order: idx + 1 }));
      await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      toastSuccess('Category order updated!');
    } catch {
      toastError('Failed to save category order.');
      mutate();
    }
  }

  function openCreateModal() {
    setEditingCategory(null);
    setNameBn('');
    setNameEn('');
    setHomeLayout('hero');
    setParent('');
    setShowInNav(true);
    setShowOnHome(true);
    setIsActive(true);
    setIsModalOpen(true);
  }

  function openEditModal(cat: any) {
    setEditingCategory(cat);
    setNameBn(cat.name_bn || '');
    setNameEn(cat.name_en || '');
    setHomeLayout(cat.homeLayout || 'hero');
    setParent(cat.parent?._id || cat.parent || '');
    setShowInNav(cat.showInNav !== false);
    setShowOnHome(cat.showOnHome !== false);
    setIsActive(cat.isActive !== false);
    setIsModalOpen(true);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!nameBn.trim() || !nameEn.trim()) {
      toastError('Both Bangla and English names are required.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name_bn: nameBn,
        name_en: nameEn,
        slug: generateBanglaSafeSlug(nameEn.trim() || nameBn.trim()),
        homeLayout,
        parent: parent || null,
        showInNav,
        showOnHome,
        isActive,
      };

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory._id}`
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save category.');
      }

      setIsModalOpen(false);
      mutate();
      toastSuccess(editingCategory ? 'Category updated!' : 'Category created!');
    } catch (err: any) {
      toastError(err.message || 'Operation failed.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/admin/categories/${deleteConfirmId}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to delete category.');

      setDeleteConfirmId(null);
      mutate();
      toastSuccess('Category deleted successfully.');
    } catch (err: any) {
      toastError(err.message || 'Delete failed.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories & Sections"
        description="Configure news sections, nested subcategories, homepage layout styles, and touch reordering."
        actions={
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            New Category
          </Button>
        }
      />

      {/* Navigation Tabs: Categories vs Sub Categories */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Link
          href="/admin/categories"
          className="px-4 py-2 text-sm font-bold text-white bg-[#083c4d] dark:bg-[#1b7d95] rounded-xl shadow-xs transition-all"
        >
          Primary Categories (মূল ক্যাটাগরি)
        </Link>
        <Link
          href="/admin/subcategories"
          className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 rounded-xl transition-all"
        >
          Sub Categories (সাব-ক্যাটাগরি)
        </Link>
      </div>

      {/* Reorder notice */}
      <div className="p-3 rounded-xl bg-[#1b7d95]/10 text-[#1b7d95] dark:text-sky-300 text-xs sm:text-sm font-medium flex items-center gap-2">
        <GripVertical className="w-4 h-4 shrink-0" />
        <span>Drag items with touch or mouse to adjust website menu order. Up/Down buttons also work on any screen.</span>
      </div>

      {/* Sortable List */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : categories.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map((c) => c._id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2.5">
              {categories.map((cat, idx) => (
                <SortableCategoryItem
                  key={cat._id}
                  category={cat}
                  onEdit={() => openEditModal(cat)}
                  onDelete={() => setDeleteConfirmId(cat._id)}
                  onMoveUp={() => moveItem(idx, 'up')}
                  onMoveDown={() => moveItem(idx, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === categories.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="p-12 text-center text-slate-400">No categories found. Click &quot;New Category&quot; to add one.</div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCategory} className="flex flex-col gap-4">
          <FormField label="Bangla Name" required>
            <Input
              value={nameBn}
              onChange={(e) => setNameBn(e.target.value)}
              placeholder="e.g. অর্থনীতি, খেলাধুলা, আন্তর্জাতিক..."
              required
            />
          </FormField>

          <FormField label="English Name" required>
            <Input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Economy, Sports, International..."
              required
            />
          </FormField>

          <FormField label="Parent Category (for Subcategories)">
            <Select value={parent} onChange={(e) => setParent(e.target.value)}>
              <option value="">None (Top-Level Category)</option>
              {categories
                .filter((c) => !editingCategory || c._id !== editingCategory._id)
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name_bn} ({c.name_en})
                  </option>
                ))}
            </Select>
          </FormField>

          {/* Visual Home Layout Style Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              Homepage Layout Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LAYOUT_OPTIONS.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setHomeLayout(opt.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                    homeLayout === opt.id
                      ? 'border-[#1b7d95] bg-[#1b7d95]/5 ring-1 ring-[#1b7d95]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{opt.name}</span>
                    {homeLayout === opt.id && <Check className="w-3.5 h-3.5 text-[#1b7d95]" />}
                  </div>
                  <span className="text-[11px] text-slate-400">{opt.preview}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Switch
              checked={showInNav}
              onChange={setShowInNav}
              label="Show in Top Header Navigation"
            />
            <Switch
              checked={showOnHome}
              onChange={setShowOnHome}
              label="Display Category Section on Homepage"
            />
            <Switch
              checked={isActive}
              onChange={setIsActive}
              label="Category Active"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSaving}>
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category?"
        message="If this category contains active articles, you must reassign them to another category first."
        confirmLabel="Delete Category"
      />
    </div>
  );
}
