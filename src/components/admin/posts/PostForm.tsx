'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  Send,
  Eye,
  History,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Sparkles,
  MapPin,
  Layers,
  Flag,
  Globe,
  Loader2,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';

import { PageHeader } from '../ui/PageHeader';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { MultiSelect } from '../ui/MultiSelect';
import { Switch } from '../ui/Switch';
import { DateTimePicker } from '../ui/DateTimePicker';
import { ImageUploader, ImageValue } from '../ui/ImageUploader';
import { FormField } from '../ui/FormField';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { useAdminAuth } from '../AdminAuthContext';
import { TiptapEditor } from '../editor/TiptapEditor';
import { bangladeshLocations } from '@/src/data/bangladeshLocations';
import { generateBanglaSafeSlug } from '@/src/services/adminPostService';

export interface PostFormProps {
  initialData?: any;
  isEditing?: boolean;
}

export function PostForm({ initialData, isEditing = false }: PostFormProps) {
  const router = useRouter();
  const { user } = useAdminAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  // Core Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(initialData?.slug));
  const [lead, setLead] = useState(initialData?.lead || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [featuredImage, setFeaturedImage] = useState<ImageValue | null>(initialData?.featuredImage || null);
  const [gallery, setGallery] = useState<ImageValue[]>(initialData?.gallery || []);
  const [category, setCategory] = useState(initialData?.category || 'জাতীয়');
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [author, setAuthor] = useState(initialData?.author || user?.username || 'admin');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>(initialData?.status || 'draft');
  const [publishedAt, setPublishedAt] = useState<Date | null>(
    initialData?.publishedAt ? new Date(initialData.publishedAt) : null
  );

  // Flags & Home Position
  const [isBreaking, setIsBreaking] = useState(Boolean(initialData?.isBreaking));
  const [isFeatured, setIsFeatured] = useState(Boolean(initialData?.isFeatured));
  const [isTrending, setIsTrending] = useState(Boolean(initialData?.isTrending));
  const [homePosition, setHomePosition] = useState<number | undefined>(initialData?.homePosition || undefined);

  // Location Cascades
  const [division, setDivision] = useState(initialData?.division || '');
  const [district, setDistrict] = useState(initialData?.district || '');
  const [upazila, setUpazila] = useState(initialData?.upazila || '');

  // SEO State
  const [seoTitle, setSeoTitle] = useState(initialData?.seo?.title || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seo?.description || '');

  // Version for Optimistic Locking
  const [version, setVersion] = useState<number>(initialData?.version || 1);
  const [revisions, setRevisions] = useState<any[]>(initialData?.revisions || []);
  const [isRevisionsModalOpen, setIsRevisionsModalOpen] = useState(false);

  // Status & Autosave tracking
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Mobile Accordion Collapsible Sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    content: true,
    media: true,
    publishing: true,
    category: true,
    flags: false,
    seo: false,
  });

  const toggleSection = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Auto-generate slug from title if user hasn't explicitly edited slug
  useEffect(() => {
    if (!slugManuallyEdited && title.trim()) {
      const generated = generateBanglaSafeSlug(title);
      setSlug(generated);
    }
    setHasUnsavedChanges(true);
    setAutosaveStatus('unsaved');
  }, [title]);

  // Unsaved changes warning on beforeunload
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Autosave Draft interval every 30 seconds
  useEffect(() => {
    if (!hasUnsavedChanges || !title.trim() || !isEditing) return;

    const interval = setInterval(() => {
      saveDraftSilently();
    }, 30_000);

    return () => clearInterval(interval);
  }, [hasUnsavedChanges, isEditing, title, slug, content, excerpt, lead, category]);

  async function saveDraftSilently() {
    if (!initialData?._id) return;
    try {
      setAutosaveStatus('saving');
      const payload = {
        title,
        slug,
        lead,
        excerpt,
        content,
        category,
        subCategory,
        tags,
        author,
        status: 'draft',
        featuredImage,
        gallery,
        isBreaking,
        isFeatured,
        isTrending,
        homePosition,
        division,
        district,
        upazila,
        seo: { title: seoTitle, description: seoDescription },
        version,
      };

      const res = await fetch(`/api/admin/posts/${initialData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setVersion(resData.data.version);
        setRevisions(resData.data.revisions || []);
        setAutosaveStatus('saved');
        setHasUnsavedChanges(false);
      }
    } catch {
      setAutosaveStatus('unsaved');
    }
  }

  // Handle Form Submission
  async function handleSubmit(targetStatus: 'draft' | 'published' | 'scheduled') {
    if (!title.trim()) {
      toastError('Please enter an article headline.');
      return;
    }
    if (!content.trim()) {
      toastError('Please write some content for the article.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        title,
        slug,
        lead,
        excerpt: excerpt || title,
        content,
        category,
        subCategory,
        tags,
        author,
        status: targetStatus,
        publishedAt: targetStatus === 'scheduled' ? publishedAt : (targetStatus === 'published' ? (publishedAt || new Date()) : null),
        featuredImage,
        gallery,
        isBreaking,
        isFeatured,
        isTrending,
        homePosition: homePosition || null,
        division,
        district,
        upazila,
        seo: {
          title: seoTitle || title,
          description: seoDescription || excerpt,
        },
        version,
      };

      const url = isEditing ? `/api/admin/posts/${initialData._id}` : '/api/admin/posts';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok || !resData.success) {
        if (res.status === 409) {
          toastError('Another editor saved changes to this post! Please refresh to inspect their updates before overwriting.');
          return;
        }
        throw new Error(resData.error || 'Failed to save article.');
      }

      setHasUnsavedChanges(false);
      setAutosaveStatus('saved');
      toastSuccess(targetStatus === 'published' ? 'Article published successfully!' : 'Article draft saved!');

      if (!isEditing) {
        router.push(`/admin/posts/${resData.data._id}/edit`);
      } else {
        setVersion(resData.data.version);
        setRevisions(resData.data.revisions || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Operation failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Live signed preview token
  async function handlePreview() {
    if (!initialData?._id) {
      toastInfo('Please save draft once before previewing live post layout.');
      return;
    }

    try {
      const res = await fetch('/api/admin/posts/preview-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: initialData._id, slug, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      window.open(data.data.previewUrl, '_blank');
    } catch (err: any) {
      toastError(err.message || 'Failed to generate preview token.');
    }
  }

  // Restore Revision Version
  async function handleRestoreRevision(revVersion: number) {
    if (!initialData?._id) return;
    try {
      const res = await fetch(`/api/admin/posts/${initialData._id}/revisions/${revVersion}`, {
        method: 'POST',
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);

      const restored = resData.data;
      setTitle(restored.title);
      setContent(restored.content);
      setExcerpt(restored.excerpt || '');
      setLead(restored.lead || '');
      setVersion(restored.version);
      setRevisions(restored.revisions || []);
      setIsRevisionsModalOpen(false);

      toastSuccess(`Restored version v${revVersion} successfully!`);
    } catch (err: any) {
      toastError(err.message || 'Failed to restore revision.');
    }
  }

  // Division / District / Upazila cascading lists
  const selectedDivisionObj = bangladeshLocations.find((d) => d.division === division);
  const districtOptions = selectedDivisionObj ? selectedDivisionObj.districts : [];
  const selectedDistrictObj = districtOptions.find((d) => d.name === district);
  const upazilaOptions = selectedDistrictObj ? selectedDistrictObj.upazilas : [];

  return (
    <div className="flex flex-col gap-6 pb-20 sm:pb-8">
      {/* Page Header with Save status & Revisions trigger */}
      <PageHeader
        title={isEditing ? 'Edit Article' : 'Write New Article'}
        backHref="/admin/posts"
        description="Write compelling journalism with multimedia, real-time autosave, and SEO optimization."
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Autosave Status Indicator */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800">
              {autosaveStatus === 'saving' && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1b7d95]" />}
              {autosaveStatus === 'saved' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              {autosaveStatus === 'unsaved' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
              <span className="capitalize">{autosaveStatus}</span>
            </div>

            {/* Revision History Button (if editing) */}
            {isEditing && revisions.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<History className="w-4 h-4" />}
                onClick={() => setIsRevisionsModalOpen(true)}
              >
                Revisions ({revisions.length})
              </Button>
            )}

            {/* Preview Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Eye className="w-4 h-4" />}
              onClick={handlePreview}
            >
              Preview
            </Button>

            {/* Save Draft */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleSubmit('draft')}
              className="hidden sm:inline-flex"
            >
              Save Draft
            </Button>

            {/* Publish Button */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleSubmit(status === 'scheduled' ? 'scheduled' : 'published')}
              leftIcon={<Send className="w-4 h-4" />}
              className="hidden sm:inline-flex"
            >
              {status === 'scheduled' ? 'Schedule' : 'Publish'}
            </Button>
          </div>
        }
      />

      {/* Main Two-Column Layout on Desktop / Single-Column Accordions on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editor & Content (2 cols on desktop) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Section 1: Headline & Slug */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <FormField label="Article Headline" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter an impactful headline in Bangla or English..."
                className="font-bold text-base sm:text-lg"
              />
            </FormField>

            <FormField label="URL Slug" hint="Editable slug for browser URL. Supports Bangla Unicode and English characters.">
              <Input
                value={slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setSlug(e.target.value);
                }}
                placeholder="article-url-slug"
                className="font-mono text-xs sm:text-sm"
              />
            </FormField>

            <FormField label="Lead Hook (First 1-2 Paragraphs)" hint="Displayed in bold as the opening hook of the story">
              <Textarea
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                placeholder="First few sentences that immediately hook the reader..."
                rows={2}
              />
            </FormField>
          </div>

          {/* Section 2: Rich Text Tiptap Editor */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
            <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Story Body</span>
              <span className="text-xs text-slate-400 font-normal">Clean formatting enabled</span>
            </label>

            <TiptapEditor
              content={content}
              onChange={(newHtml) => {
                setContent(newHtml);
                setHasUnsavedChanges(true);
                setAutosaveStatus('unsaved');
              }}
            />
          </div>

          {/* Section 3: Short Excerpt for Cards & Social Share */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
            <FormField label="Short Summary / Excerpt" hint="Used for card snippets, social sharing, and search previews">
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Write a brief 1-2 sentence overview for news card previews..."
                rows={3}
                showCount
                maxLength={300}
              />
            </FormField>
          </div>

          {/* Section 4: SEO Metadata with Live Google Search Snippet */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#1b7d95]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Search Engine Optimization (SEO)
              </h3>
            </div>

            <FormField label="Meta Title" hint="Optimal length: 50-60 characters">
              <Input
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder={title || 'Custom SEO Title...'}
              />
              <div className="text-right text-[11px] text-slate-400 mt-1">
                {(seoTitle || title).length} characters
              </div>
            </FormField>

            <FormField label="Meta Description" hint="Optimal length: 140-160 characters">
              <Textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder={excerpt || 'Compelling search engine description...'}
                rows={2}
              />
              <div className="text-right text-[11px] text-slate-400 mt-1">
                {(seoDescription || excerpt).length} characters
              </div>
            </FormField>

            {/* Google Search Snippet Preview */}
            <div className="mt-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Google Search Snippet Preview
              </span>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate">
                {seoTitle || title || 'Headline goes here'} | দৈনিক যমুনা কণ্ঠ
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-500 font-mono truncate">
                https://jamunarkantho.com/{encodeURIComponent(category)}/{encodeURIComponent(slug || 'slug')}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                {seoDescription || excerpt || 'Article excerpt will appear here in Google search engine result pages.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Settings Panel (1 col on desktop) */}
        <div className="flex flex-col gap-6">
          {/* Featured Image */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <ImageUploader
              value={featuredImage}
              onChange={setFeaturedImage}
              label="Featured Image"
            />
          </div>

          {/* Publishing & Status Settings */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Publishing Desk
            </h3>

            <FormField label="Publication Status">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="draft">Draft (Private)</option>
                <option value="published">Published (Live)</option>
                <option value="scheduled">Scheduled (Timed)</option>
              </Select>
            </FormField>

            {status === 'scheduled' && (
              <FormField label="Publish Date & Time" required>
                <DateTimePicker
                  value={publishedAt}
                  onChange={setPublishedAt}
                />
              </FormField>
            )}

            <FormField label="Assigned Author">
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name..."
              />
            </FormField>
          </div>

          {/* Category & Tags */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Organization
            </h3>

            <FormField label="Primary Category" required>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="জাতীয়">জাতীয় (National)</option>
                <option value="রাজনীতি">রাজনীতি (Politics)</option>
                <option value="অর্থনীতি">অর্থনীতি (Economy)</option>
                <option value="সারাদেশ">সারাদেশ (Countrywide)</option>
                <option value="আন্তর্জাতিক">আন্তর্জাতিক (International)</option>
                <option value="খেলা">খেলা (Sports)</option>
                <option value="বিনোদন">বিনোদন (Entertainment)</option>
                <option value="মতামত">মতামত (Opinion)</option>
                <option value="শিক্ষা">শিক্ষা (Education)</option>
                <option value="স্বাস্থ্য">স্বাস্থ্য (Health)</option>
                <option value="প্রযুক্তি">প্রযুক্তি (Technology)</option>
              </Select>
            </FormField>

            <FormField label="Sub-Category (Optional)">
              <Input
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. ক্রিকেট, ফুটবল, নির্বাচন..."
              />
            </FormField>

            {/* Cascading Location Dropdowns (Shown for সারাদেশ or anytime location is tagged) */}
            {(category === 'সারাদেশ' || division) && (
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-[#1b7d95]" />
                  <span>Regional Location</span>
                </div>

                <FormField label="Division">
                  <Select
                    value={division}
                    onChange={(e) => {
                      setDivision(e.target.value);
                      setDistrict('');
                      setUpazila('');
                    }}
                  >
                    <option value="">Select Division</option>
                    {bangladeshLocations.map((loc) => (
                      <option key={loc.division} value={loc.division}>
                        {loc.division}
                      </option>
                    ))}
                  </Select>
                </FormField>

                {division && (
                  <FormField label="District">
                    <Select
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        setUpazila('');
                      }}
                    >
                      <option value="">Select District</option>
                      {districtOptions.map((dist) => (
                        <option key={dist.name} value={dist.name}>
                          {dist.name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                )}

                {district && (
                  <FormField label="Upazila / Thana">
                    <Select
                      value={upazila}
                      onChange={(e) => setUpazila(e.target.value)}
                    >
                      <option value="">Select Upazila</option>
                      {upazilaOptions.map((upz) => (
                        <option key={upz} value={upz}>
                          {upz}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                )}
              </div>
            )}

            <FormField label="Tags & Keywords" hint="Type keyword and press Enter">
              <MultiSelect
                value={tags}
                onChange={setTags}
                placeholder="Add tags..."
                allowCreate
              />
            </FormField>
          </div>

          {/* Editorial Flags & Homepage Pin */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Frontpage Flags
            </h3>

            <Switch
              checked={isBreaking}
              onChange={setIsBreaking}
              label="Breaking News"
              description="Displays in the red breaking news ticker banner"
            />

            <Switch
              checked={isFeatured}
              onChange={setIsFeatured}
              label="Featured Lead Story"
              description="Candidate for lead story hero placements"
            />

            <Switch
              checked={isTrending}
              onChange={setIsTrending}
              label="Trending Story"
              description="Appears in popular & trending lists"
            />

            <FormField label="Homepage Slot Order (Optional)">
              <Input
                type="number"
                min={1}
                max={10}
                value={homePosition || ''}
                onChange={(e) => setHomePosition(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="1 (Lead), 2, 3..."
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM ACTION BAR (Hidden on desktop >= 768px) */}
      <div className="sm:hidden fixed bottom-16 inset-x-0 z-30 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth
          isLoading={isSubmitting}
          onClick={() => handleSubmit('draft')}
        >
          Draft
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePreview}
          aria-label="Preview"
        >
          <Eye className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          fullWidth
          isLoading={isSubmitting}
          onClick={() => handleSubmit(status === 'scheduled' ? 'scheduled' : 'published')}
        >
          {status === 'scheduled' ? 'Schedule' : 'Publish'}
        </Button>
      </div>

      {/* Revisions History Modal */}
      <Modal
        isOpen={isRevisionsModalOpen}
        onClose={() => setIsRevisionsModalOpen(false)}
        title="Revision History"
        maxWidth="lg"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-500 mb-2">
            You can restore any of the last 20 automatically saved snapshots of this article.
          </p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
            {revisions.map((rev) => (
              <div key={rev.version} className="py-3 flex items-center justify-between gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Version v{rev.version}
                  </span>
                  <span className="text-xs text-slate-400">
                    Saved by {rev.updatedBy || 'Author'} • {new Date(rev.savedAt).toLocaleString()}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestoreRevision(rev.version)}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
