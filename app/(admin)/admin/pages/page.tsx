'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { FileCode, Plus, Edit, Trash2, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Modal } from '@/src/components/admin/ui/Modal';
import { Input } from '@/src/components/admin/ui/Input';
import { FormField } from '@/src/components/admin/ui/FormField';
import { Badge } from '@/src/components/admin/ui/Badge';
import { ConfirmDialog } from '@/src/components/admin/ui/ConfirmDialog';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { useToast } from '@/src/components/admin/ui/Toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StaticPagesListPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/pages', fetcher);
  const { success: toastSuccess, error: toastError } = useToast();

  const pages = data?.success && Array.isArray(data.data) ? data.data : [];

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  async function handleCreatePage(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          slug: newSlug.trim().toLowerCase(),
          content: '<p>Write page content here...</p>',
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create page.');

      setIsCreateOpen(false);
      setNewTitle('');
      setNewSlug('');
      mutate();
      toastSuccess('Static page created!');
    } catch (err: any) {
      toastError(err.message || 'Creation failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeletePage() {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/admin/pages/${deleteConfirmId}`, { method: 'DELETE' });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to delete page.');

      setDeleteConfirmId(null);
      mutate();
      toastSuccess('Static page removed.');
    } catch (err: any) {
      toastError(err.message || 'Delete failed.');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Static CMS Pages"
        description="Edit About Us, Privacy Policy, Terms of Service, Contact, and Advertise editorial documents."
        actions={
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsCreateOpen(true)}>
            New Static Page
          </Button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : pages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page: any) => (
            <div
              key={page._id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#1b7d95]">
                    /{page.slug}
                  </span>
                  <Badge variant={page.isActive !== false ? 'success' : 'outline'}>
                    {page.isActive !== false ? 'Active' : 'Draft'}
                  </Badge>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {page.title}
                </h3>
                {page.excerpt && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {page.excerpt}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">
                  Updated: {new Date(page.updatedAt || page.createdAt).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/${page.slug}`}
                    target="_blank"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500"
                    title="View live page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/admin/pages/${page._id}/edit`}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#1b7d95]"
                    title="Edit with Tiptap"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => setDeleteConfirmId(page._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400">No static pages found.</div>
      )}

      {/* Create Page Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Static Page" maxWidth="sm">
        <form onSubmit={handleCreatePage} className="flex flex-col gap-4">
          <FormField label="Page Title" required>
            <Input
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (!newSlug) {
                  setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }
              }}
              placeholder="e.g. আমাদের সম্পর্কে (About Us)"
              required
            />
          </FormField>

          <FormField label="URL Slug" required hint="e.g. about, privacy-policy, terms">
            <Input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="about"
              required
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Create Page
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeletePage}
        title="Delete Static Page?"
        message="This document will no longer be accessible at its public URL route."
        confirmLabel="Delete Page"
      />
    </div>
  );
}
