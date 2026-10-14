'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useParams, useRouter } from 'next/navigation';
import { Save, Send, Eye, Loader2, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Input } from '@/src/components/admin/ui/Input';
import { Textarea } from '@/src/components/admin/ui/Textarea';
import { FormField } from '@/src/components/admin/ui/FormField';
import { Switch } from '@/src/components/admin/ui/Switch';
import { TiptapEditor } from '@/src/components/admin/editor/TiptapEditor';
import { useToast } from '@/src/components/admin/ui/Toast';
import { generateBanglaSafeSlug } from '@/src/lib/slug';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function EditStaticPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const { data, isLoading } = useSWR('/api/admin/pages', fetcher);
  const page = data?.success && Array.isArray(data.data)
    ? data.data.find((p: any) => p._id === id)
    : null;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setSlug(page.slug || '');
      setExcerpt(page.excerpt || '');
      setContent(page.content || '');
      setIsActive(page.isActive !== false);
    }
  }, [page]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSaving(true);
      const finalSlug = slug || generateBanglaSafeSlug(title);
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          slug: finalSlug,
          excerpt: excerpt.trim(),
          content,
          isActive,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update page.');

      toastSuccess('Static page saved and published!');
    } catch (err: any) {
      toastError(err.message || 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1b7d95]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title={`Edit: ${title || 'Static Page'}`}
        backHref="/admin/pages"
        description="Draft and format long-form corporate and editorial policy content."
        actions={
          <div className="flex items-center gap-2">
            <a href={`/${slug}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="md" leftIcon={<Eye className="w-4 h-4" />}>
                View Live Page
              </Button>
            </a>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={isSaving}
              onClick={handleSave}
            >
              Save Page
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <FormField label="Document Title" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Terms of Service"
              required
            />
          </FormField>

          <FormField label="Brief Overview">
            <Textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short introductory summary..."
              rows={2}
            />
          </FormField>

          <Switch
            checked={isActive}
            onChange={setIsActive}
            label="Page Status Active"
            description="When enabled, public visitors can view this document"
          />
        </div>

        {/* Tiptap Editor for Content */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
          <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Document Content
          </label>
          <TiptapEditor content={content} onChange={setContent} />
        </div>
      </form>
    </div>
  );
}
