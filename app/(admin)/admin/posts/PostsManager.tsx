'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import useSWR from 'swr';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  ExternalLink,
  Copy,
  Trash2,
  RotateCcw,
  CheckCircle,
  Eye,
} from 'lucide-react';

import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Input } from '@/src/components/admin/ui/Input';
import { Tabs } from '@/src/components/admin/ui/Tabs';
import { Badge } from '@/src/components/admin/ui/Badge';
import { DataTable, Column } from '@/src/components/admin/ui/DataTable';
import { Pagination } from '@/src/components/admin/ui/Pagination';
import { FilterSheet } from '@/src/components/admin/ui/FilterSheet';
import { ConfirmDialog } from '@/src/components/admin/ui/ConfirmDialog';
import { Dropdown } from '@/src/components/admin/ui/Dropdown';
import { useToast } from '@/src/components/admin/ui/Toast';
import { useAdminAuth } from '@/src/components/admin/AdminAuthContext';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PostsManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAdminAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  // Read URL params
  const currentStatus = searchParams.get('status') || 'all';
  const currentCategory = searchParams.get('category') || 'all';
  const currentAuthor = searchParams.get('author') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentPage = Number(searchParams.get('page')) || 1;
  const currentLimit = Number(searchParams.get('limit')) || 25;
  const isBreaking = searchParams.get('isBreaking') === 'true';
  const isFeatured = searchParams.get('isFeatured') === 'true';
  const isTrending = searchParams.get('isTrending') === 'true';

  // Local state for debounced search
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Sync search input after 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== currentSearch) {
        updateQuery({ search: searchInput || undefined, page: 1 });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function updateQuery(newParams: Record<string, string | number | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === 'all') {
        params.delete(k);
      } else {
        params.set(k, String(v));
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  // Fetch data with SWR
  const queryString = searchParams.toString();
  const { data, mutate, isLoading } = useSWR(
    `/api/admin/posts?${queryString}`,
    fetcher,
    { revalidateOnFocus: true }
  );

  const posts = data?.success && Array.isArray(data.data) ? data.data : [];
  const meta = data?.meta || {};
  const counts = meta?.counts || { all: 0, published: 0, draft: 0, scheduled: 0, trashed: 0 };

  const tabs = [
    { id: 'all', label: 'All Articles', count: counts.all },
    { id: 'published', label: 'Published', count: counts.published },
    { id: 'draft', label: 'Drafts', count: counts.draft },
    { id: 'scheduled', label: 'Scheduled', count: counts.scheduled },
    { id: 'trashed', label: 'Trash', count: counts.trashed },
  ];

  // Quick actions on an item
  async function handleTogglePublish(post: any) {
    try {
      const nextStatus = post.status === 'published' ? 'draft' : 'published';
      const res = await fetch(`/api/admin/posts/${post._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, version: post.version }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update status.');

      mutate();
      toastSuccess(`Article marked as ${nextStatus}!`);
    } catch (err: any) {
      toastError(err.message || 'Status update failed.');
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await fetch(`/api/admin/posts/${id}/duplicate`, { method: 'POST' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to duplicate post.');

      mutate();
      toastSuccess('Article duplicated as draft!');
    } catch (err: any) {
      toastError(err.message || 'Duplicate failed.');
    }
  }

  async function handleTrash(id: string) {
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to trash article.');

      mutate();
      toastSuccess('Article moved to trash.', {
        undoLabel: 'Undo',
        undoAction: async () => {
          await fetch(`/api/admin/posts/${id}/restore`, { method: 'POST' });
          mutate();
        },
      });
    } catch (err: any) {
      toastError(err.message || 'Trash failed.');
    }
  }

  async function handleRestore(id: string) {
    try {
      const res = await fetch(`/api/admin/posts/${id}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to restore article.');

      mutate();
      toastSuccess('Article restored from trash!');
    } catch (err: any) {
      toastError(err.message || 'Restore failed.');
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    try {
      setIsActionLoading(true);

      if (confirmDeleteId === 'bulk-delete') {
        const res = await fetch('/api/admin/posts/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selectedIds, action: 'delete' }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Bulk delete failed.');
        setSelectedIds([]);
        mutate();
        toastSuccess(`Permanently deleted ${resData.data?.modifiedCount || selectedIds.length} articles!`);
        setConfirmDeleteId(null);
        return;
      }

      if (confirmDeleteId === 'empty-trash') {
        const trashIds = posts.map((p: any) => p._id);
        if (trashIds.length === 0) return;
        const res = await fetch('/api/admin/posts/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: trashIds, action: 'delete' }),
        });
        const resData = await res.json();
        if (!res.ok) throw new Error(resData.error || 'Empty trash failed.');
        setSelectedIds([]);
        mutate();
        toastSuccess('Trash emptied successfully!');
        setConfirmDeleteId(null);
        return;
      }

      const url = isPermanentDelete
        ? `/api/admin/posts/${confirmDeleteId}/permanent`
        : `/api/admin/posts/${confirmDeleteId}`;
      const method = 'DELETE';

      const res = await fetch(url, { method });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete article.');
      }

      mutate();
      toastSuccess(isPermanentDelete ? 'Permanently deleted article.' : 'Moved article to trash.');
      setConfirmDeleteId(null);
    } catch (err: any) {
      toastError(err.message || 'Delete operation failed.');
    } finally {
      setIsActionLoading(false);
    }
  }

  // Bulk actions
  async function executeBulk(action: string) {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch('/api/admin/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Bulk operation failed.');

      setSelectedIds([]);
      mutate();
      toastSuccess(`Applied ${action} on ${resData.data.modifiedCount} articles!`);
    } catch (err: any) {
      toastError(err.message || 'Bulk operation failed.');
    }
  }

  // Table Columns for Desktop
  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Article Headline',
      sortable: true,
      render: (post) => (
        <div className="flex items-center gap-3">
          {post.featuredImage?.url ? (
            <div className="relative w-12 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
              <Image src={post.featuredImage.url} alt={post.title} fill className="object-cover" sizes="60px" unoptimized />
            </div>
          ) : (
            <div className="w-12 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs shrink-0">
              No Img
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <Link
              href={`/admin/posts/${post._id}/edit`}
              className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#1b7d95] dark:hover:text-sky-400 line-clamp-1 transition-colors"
            >
              {post.title}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400 font-mono">/{post.slug}</span>
              {post.isBreaking && <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded">BREAKING</span>}
              {post.isFeatured && <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded">FEATURED</span>}
              {post.isTrending && <span className="text-[10px] bg-purple-500 text-white font-bold px-1.5 py-0.2 rounded">TRENDING</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (post) => (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {post.category || 'General'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (post) => (
        <Badge
          variant={
            post.status === 'published'
              ? 'success'
              : post.status === 'scheduled'
              ? 'info'
              : 'warning'
          }
        >
          {post.status}
        </Badge>
      ),
    },
    {
      key: 'views',
      header: 'Views',
      sortable: true,
      render: (post) => (
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          {new Intl.NumberFormat('en-US').format(post.views || 0)}
        </span>
      ),
    },
    {
      key: 'publishedAt',
      header: 'Date',
      sortable: true,
      render: (post) => (
        <div className="flex flex-col text-xs text-slate-500">
          <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
          <span className="text-[11px] opacity-75">{new Date(post.publishedAt || post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (post) => (
        <div className="flex items-center justify-end gap-1.5">
          {currentStatus === 'trashed' ? (
            <>
              <button
                type="button"
                onClick={() => handleRestore(post._id)}
                className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                title="Restore Article (পুনরুদ্ধার করুন)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPermanentDelete(true);
                  setConfirmDeleteId(post._id);
                }}
                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete Permanently (স্থায়ীভাবে মুছুন)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/admin/posts/${post._id}/edit`}
                className="p-1.5 rounded-lg text-slate-500 hover:text-[#1b7d95] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Article"
              >
                <Edit className="w-4 h-4" />
              </Link>

              {post.status === 'published' && (
                <Link
                  href={`/${encodeURIComponent(post.category || 'general')}/${encodeURIComponent(post.slug)}`}
                  target="_blank"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="View on Public Site"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </>
          )}

          <Dropdown
            align="right"
            trigger={
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            }
            items={[
              {
                label: 'Duplicate as Draft',
                icon: <Copy className="w-4 h-4" />,
                onClick: () => handleDuplicate(post._id),
              },
              {
                label: post.status === 'published' ? 'Unpublish (Draft)' : 'Publish Now',
                icon: <CheckCircle className="w-4 h-4" />,
                onClick: () => handleTogglePublish(post),
              },
              currentStatus === 'trashed'
                ? {
                    label: 'Restore Article',
                    icon: <RotateCcw className="w-4 h-4" />,
                    onClick: () => handleRestore(post._id),
                  }
                : {
                    label: 'Move to Trash',
                    icon: <Trash2 className="w-4 h-4 text-rose-500" />,
                    danger: true,
                    onClick: () => handleTrash(post._id),
                  },
              ...(currentStatus === 'trashed'
                ? [
                    {
                      label: 'Delete Permanently',
                      icon: <Trash2 className="w-4 h-4 text-rose-600" />,
                      danger: true,
                      onClick: () => {
                        setIsPermanentDelete(true);
                        setConfirmDeleteId(post._id);
                      },
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  // Mobile Stacked Card View Render
  function renderMobileCard(post: any, isSelected: boolean) {
    return (
      <div
        className={`p-3.5 rounded-2xl border transition-all ${
          isSelected
            ? 'border-[#1b7d95] bg-[#1b7d95]/5 dark:bg-[#1b7d95]/10'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Card Thumbnail */}
          {post.featuredImage?.url ? (
            <div className="relative w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
              <Image src={post.featuredImage.url} alt={post.title} fill className="object-cover" sizes="100px" unoptimized />
            </div>
          ) : (
            <div className="w-20 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs shrink-0">
              No Img
            </div>
          )}

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge
                variant={
                  post.status === 'published'
                    ? 'success'
                    : post.status === 'scheduled'
                    ? 'info'
                    : 'warning'
                }
              >
                {post.status}
              </Badge>
              <span className="text-[11px] font-semibold text-slate-500 truncate">
                {post.category || 'General'}
              </span>
            </div>

            <Link
              href={`/admin/posts/${post._id}/edit`}
              className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-[#1b7d95]"
            >
              {post.title}
            </Link>

            <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
              <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {post.views || 0}
              </span>
            </div>
          </div>

          {/* Row Menu */}
          <div className="flex flex-col items-end gap-1">
            <Dropdown
              align="right"
              trigger={
                <button
                  type="button"
                  className="touch-target p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label="Article actions"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              }
              items={
                currentStatus === 'trashed'
                  ? [
                      {
                        label: 'Restore (পুনরুদ্ধার)',
                        icon: <RotateCcw className="w-4 h-4 text-emerald-600" />,
                        onClick: () => handleRestore(post._id),
                      },
                      {
                        label: 'Delete Permanently (স্থায়ীভাবে মুছুন)',
                        icon: <Trash2 className="w-4 h-4 text-rose-600" />,
                        danger: true,
                        onClick: () => {
                          setIsPermanentDelete(true);
                          setConfirmDeleteId(post._id);
                        },
                      },
                    ]
                  : [
                      {
                        label: 'Edit',
                        icon: <Edit className="w-4 h-4" />,
                        onClick: () => router.push(`/admin/posts/${post._id}/edit`),
                      },
                      {
                        label: 'Duplicate',
                        icon: <Copy className="w-4 h-4" />,
                        onClick: () => handleDuplicate(post._id),
                      },
                      {
                        label: post.status === 'published' ? 'Set as Draft' : 'Publish',
                        icon: <CheckCircle className="w-4 h-4" />,
                        onClick: () => handleTogglePublish(post),
                      },
                      {
                        label: 'Move to Trash',
                        icon: <Trash2 className="w-4 h-4 text-rose-500" />,
                        danger: true,
                        onClick: () => handleTrash(post._id),
                      },
                    ]
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header */}
      <PageHeader
        title="Articles & News"
        description="Publish, manage drafts, review schedules and organize news stories."
        actions={
          <div className="flex items-center gap-2">
            {currentStatus === 'trashed' && (Number(meta?.counts?.trashed) > 0 || posts.length > 0) && (
              <Button
                variant="danger"
                size="md"
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={() => {
                  setIsPermanentDelete(true);
                  setConfirmDeleteId('empty-trash');
                }}
              >
                Empty Trash
              </Button>
            )}
            <Link href="/admin/posts/new">
              <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                Write Article
              </Button>
            </Link>
          </div>
        }
      />

      {/* Status Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={currentStatus}
        onChange={(tabId) => updateQuery({ status: tabId, page: 1 })}
      />

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Debounced Search Input */}
        <div className="w-full lg:max-w-md">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search headline, excerpt or keywords..."
            leftIcon={<Search className="w-4 h-4" />}
            showClear
            onClear={() => setSearchInput('')}
          />
        </div>

        {/* Filter Sheet / Options */}
        <FilterSheet
          activeFilters={[
            ...(currentCategory !== 'all' ? [{ key: 'category', label: 'Category', displayValue: currentCategory }] : []),
            ...(currentAuthor ? [{ key: 'author', label: 'Author', displayValue: currentAuthor }] : []),
            ...(isBreaking ? [{ key: 'isBreaking', label: 'Flag', displayValue: 'Breaking' }] : []),
            ...(isFeatured ? [{ key: 'isFeatured', label: 'Flag', displayValue: 'Featured' }] : []),
            ...(isTrending ? [{ key: 'isTrending', label: 'Flag', displayValue: 'Trending' }] : []),
          ]}
          onRemoveFilter={(k) => updateQuery({ [k]: undefined, page: 1 })}
          onClearAll={() =>
            updateQuery({
              category: undefined,
              author: undefined,
              isBreaking: undefined,
              isFeatured: undefined,
              isTrending: undefined,
              page: 1,
            })
          }
        >
          {/* Category Dropdown */}
          <select
            value={currentCategory}
            onChange={(e) => updateQuery({ category: e.target.value, page: 1 })}
            className="w-full lg:w-auto min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[16px] sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="জাতীয়">জাতীয় (National)</option>
            <option value="রাজনীতি">রাজনীতি (Politics)</option>
            <option value="অর্থনীতি">অর্থনীতি (Economy)</option>
            <option value="সারাদেশ">সারাদেশ (Country)</option>
            <option value="আন্তর্জাতিক">আন্তর্জাতিক (International)</option>
            <option value="খেলা">খেলা (Sports)</option>
            <option value="বিনোদন">বিনোদন (Entertainment)</option>
            <option value="মতামত">মতামত (Opinion)</option>
          </select>

          {/* Sort Selector */}
          <select
            value={currentSort}
            onChange={(e) => updateQuery({ sort: e.target.value, page: 1 })}
            className="w-full lg:w-auto min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-[16px] sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="views">Sort: Most Viewed</option>
            <option value="title">Sort: Title A-Z</option>
          </select>
        </FilterSheet>
      </div>

      {/* Responsive Data Table */}
      <DataTable
        columns={columns}
        data={posts}
        isLoading={isLoading}
        selectable
        selectedIds={selectedIds}
        onSelectAll={(selected) => {
          setSelectedIds(selected ? posts.map((p: any) => p._id) : []);
        }}
        onSelectItem={(id, selected) => {
          setSelectedIds((prev) =>
            selected ? [...prev, id] : prev.filter((item) => item !== id)
          );
        }}
        renderMobileCard={renderMobileCard}
        bulkActions={
          currentStatus === 'trashed' ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => executeBulk('restore')}
              >
                Restore Selected ({selectedIds.length})
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setIsPermanentDelete(true);
                  setConfirmDeleteId('bulk-delete');
                }}
              >
                Delete Permanently ({selectedIds.length})
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => executeBulk('publish')}>
                Publish
              </Button>
              <Button variant="secondary" size="sm" onClick={() => executeBulk('unpublish')}>
                Set Draft
              </Button>
              <Button variant="danger" size="sm" onClick={() => executeBulk('trash')}>
                Move to Trash
              </Button>
            </>
          )
        }
      />

      {/* Pagination */}
      <Pagination
        page={currentPage}
        totalPages={meta.totalPages || 1}
        totalItems={meta.total || 0}
        limit={currentLimit}
        onPageChange={(p) => updateQuery({ page: p })}
        onLimitChange={(l) => updateQuery({ limit: l, page: 1 })}
      />

      {/* Confirmation Dialog for Deletions */}
      <ConfirmDialog
        isOpen={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title={
          confirmDeleteId === 'empty-trash'
            ? 'Empty Entire Trash?'
            : confirmDeleteId === 'bulk-delete'
            ? `Permanently Delete ${selectedIds.length} Articles?`
            : isPermanentDelete
            ? 'Delete Permanently?'
            : 'Move to Trash?'
        }
        message={
          confirmDeleteId === 'empty-trash'
            ? 'This will permanently remove ALL articles currently in the Trash. This action CANNOT be undone.'
            : confirmDeleteId === 'bulk-delete'
            ? `This will permanently delete ${selectedIds.length} selected articles from the database. This action CANNOT be undone.`
            : isPermanentDelete
            ? 'This action CANNOT be undone. The article and its revision history will be permanently deleted.'
            : 'You can restore this article from the Trash tab at any time.'
        }
        confirmLabel={
          confirmDeleteId === 'empty-trash'
            ? 'Empty Trash'
            : isPermanentDelete
            ? 'Delete Permanently'
            : 'Move to Trash'
        }
        isLoading={isActionLoading}
      />
    </div>
  );
}
