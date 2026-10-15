'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useSWR from 'swr';
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
  RotateCw,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Search,
  Smartphone,
  ListChecks,
  User,
  X,
} from 'lucide-react';

export const COMPOSER_STEPS = [
  { id: 'headline', label: '১. শিরোনাম', fullTitle: 'শিরোনাম ও সূচনা (Headline & Lead Hook)' },
  { id: 'image', label: '২. ছবি', fullTitle: 'মূল ছবি ও গ্যালারি (Featured Image & Media)' },
  { id: 'body', label: '৩. বডি', fullTitle: 'সংবাদের বিস্তারিত বিবরণ (Story Body)' },
  { id: 'category', label: '৪. ক্যাটাগরি', fullTitle: 'ক্যাটাগরি ও অবস্থান (Category & Location)' },
  { id: 'settings', label: '৫. সেটিংস', fullTitle: 'লেখক, ট্যাগ ও ফ্রন্টপেজ (Author & Desk Settings)' },
  { id: 'review', label: '৬. রিভিউ', fullTitle: 'চেকলিস্ট, প্রিভিউ ও প্রকাশ (Review & Publish)' },
] as const;

export type StepId = (typeof COMPOSER_STEPS)[number]['id'];

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
import { generateBanglaSafeSlug } from '@/src/lib/slug';

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
  const [lead, setLead] = useState(initialData?.lead || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [featuredImage, setFeaturedImage] = useState<ImageValue | null>(initialData?.featuredImage || null);
  const [gallery, setGallery] = useState<ImageValue[]>(initialData?.gallery || []);
  const [category, setCategory] = useState(initialData?.category || 'জাতীয়');
  const [subCategory, setSubCategory] = useState(initialData?.subCategory || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [author, setAuthor] = useState(initialData?.author || '');
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>(initialData?.status || 'published');
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

  // Mobile Step Wizard & Focus Mode States
  const [activeStep, setActiveStep] = useState<StepId>('headline');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isAuthorSheetOpen, setIsAuthorSheetOpen] = useState(false);
  const [authorSearchQuery, setAuthorSearchQuery] = useState('');
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [savedDraftInfo, setSavedDraftInfo] = useState<{ timestamp: number; title: string } | null>(null);

  // Helper to determine step completion status for progress indicators
  function isStepCompleted(step: StepId): boolean {
    switch (step) {
      case 'headline':
        return Boolean(title.trim());
      case 'image':
        return Boolean(featuredImage?.url);
      case 'body':
        return content.replace(/<[^>]*>/g, '').trim().length >= 30;
      case 'category':
        return Boolean(category);
      case 'settings':
        return Boolean(author);
      case 'review':
        return Boolean(title.trim() && content.trim());
      default:
        return false;
    }
  }

  // Keyboard open listener via visualViewport to hide sticky bottom bar
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleResize = () => {
      const diff = window.innerHeight - vv.height;
      setIsKeyboardOpen(diff > 140);
    };
    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  // Check for saved offline draft on initial mount
  useEffect(() => {
    if (isEditing || initialData?._id) return;
    try {
      const raw = localStorage.getItem('jamuna_admin_composer_draft');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.timestamp && (parsed.title || parsed.content)) {
          setSavedDraftInfo({
            timestamp: parsed.timestamp,
            title: parsed.title || 'শিরোনামহীন ড্রাফট',
          });
        }
      }
    } catch {}
  }, [isEditing, initialData]);

  // Offline draft saving to localStorage (debounced)
  useEffect(() => {
    if (isEditing) return;
    const timer = setTimeout(() => {
      if (title.trim() || content.trim()) {
        try {
          localStorage.setItem(
            'jamuna_admin_composer_draft',
            JSON.stringify({
              title,
              slug,
              lead,
              excerpt,
              content,
              category,
              subCategory,
              tags,
              author,
              featuredImage,
              timestamp: Date.now(),
            })
          );
        } catch {}
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, slug, lead, excerpt, content, category, subCategory, tags, author, featuredImage, isEditing]);

  function handleRestoreOfflineDraft() {
    try {
      const raw = localStorage.getItem('jamuna_admin_composer_draft');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.slug) setSlug(parsed.slug);
      if (parsed.lead) setLead(parsed.lead);
      if (parsed.excerpt) setExcerpt(parsed.excerpt);
      if (parsed.content) setContent(parsed.content);
      if (parsed.category) setCategory(parsed.category);
      if (parsed.subCategory) setSubCategory(parsed.subCategory);
      if (parsed.tags) setTags(parsed.tags);
      if (parsed.author) setAuthor(parsed.author);
      if (parsed.featuredImage) setFeaturedImage(parsed.featuredImage);
      setSavedDraftInfo(null);
      toastSuccess('পূর্ববর্তী অফলাইন ড্রাফট সফলভাবে পুনরুদ্ধার করা হয়েছে!');
    } catch {
      toastError('ড্রাফট পুনরুদ্ধার করতে সমস্যা হয়েছে।');
    }
  }

  function handleDiscardOfflineDraft() {
    localStorage.removeItem('jamuna_admin_composer_draft');
    setSavedDraftInfo(null);
    toastInfo('পূর্ববর্তী ড্রাফট বাতিল করা হয়েছে।');
  }

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

  // Dynamic Categories, Authors & Trending Topics
  const [availableCategories, setAvailableCategories] = useState<any[]>([]);
  const [availableTopics, setAvailableTopics] = useState<any[]>([]);
  const [fallbackAuthors, setFallbackAuthors] = useState<any[]>([]);
  const [isCustomAuthor, setIsCustomAuthor] = useState(false);
  const [isQuickAuthorModalOpen, setIsQuickAuthorModalOpen] = useState(false);
  const [isCreatingAuthor, setIsCreatingAuthor] = useState(false);

  // Quick Author Form State
  const [newAuthorName, setNewAuthorName] = useState('');
  const [newAuthorDesignation, setNewAuthorDesignation] = useState('');
  const [newAuthorBio, setNewAuthorBio] = useState('');
  const [newAuthorAvatar, setNewAuthorAvatar] = useState<ImageValue | null>(null);

  // SWR for Authors - auto-revalidates on focus and shares cache with /admin/authors
  const { data: authorsRes, mutate: mutateAuthors } = useSWR(
    '/api/admin/authors',
    (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json()),
    {
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  // SWR for Categories & Subcategories - auto-revalidates and shares cache
  const { data: categoriesRes } = useSWR(
    '/api/admin/categories',
    (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json()),
    {
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  const availableAuthors = useMemo(() => {
    if (authorsRes?.success && Array.isArray(authorsRes.data) && authorsRes.data.length > 0) {
      return authorsRes.data;
    }
    return fallbackAuthors;
  }, [authorsRes, fallbackAuthors]);

  const fetchAuthors = useCallback(() => {
    mutateAuthors();
    fetch('/api/admin/authors?_t=' + Date.now(), { cache: 'no-store' })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data)) {
          setFallbackAuthors(resData.data);
        }
      })
      .catch(() => {});
  }, [mutateAuthors]);

  const selectedAuthorDoc = useMemo(() => {
    if (!author || isCustomAuthor) return null;
    return availableAuthors.find((a: any) => a.name === author);
  }, [author, isCustomAuthor, availableAuthors]);

  // Set default author to first registered author when creating a new post
  useEffect(() => {
    if (!initialData?.author && availableAuthors.length > 0) {
      if (!author || author === 'নিজস্ব প্রতিবেদক') {
        const activeAuthors = availableAuthors.filter((a: any) => a.isActive !== false);
        const first = activeAuthors.length > 0 ? activeAuthors[0] : availableAuthors[0];
        if (first?.name) {
          setAuthor(first.name);
        }
      }
    }
  }, [availableAuthors, initialData?.author, author]);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data)) {
          setAvailableCategories(resData.data);
        }
      })
      .catch(() => {});

    fetch('/api/admin/tags')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data)) {
          setAvailableTopics(resData.data);
        }
      })
      .catch(() => {});

    fetchAuthors();
  }, [fetchAuthors]);

  async function handleQuickCreateAuthor(e: React.FormEvent) {
    e.preventDefault();
    if (!newAuthorName.trim()) return;

    try {
      setIsCreatingAuthor(true);
      const res = await fetch('/api/admin/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAuthorName.trim(),
          designation: newAuthorDesignation.trim(),
          bio: newAuthorBio.trim(),
          avatar: newAuthorAvatar,
          isActive: true,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to create author.');
      }

      toastSuccess(`লেখক "${newAuthorName}" সফলভাবে তৈরি ও নির্বাচিত করা হয়েছে!`);
      setAuthor(newAuthorName.trim());
      setIsCustomAuthor(false);
      setIsQuickAuthorModalOpen(false);
      setNewAuthorName('');
      setNewAuthorDesignation('');
      setNewAuthorBio('');
      setNewAuthorAvatar(null);
      fetchAuthors();
    } catch (err: any) {
      toastError(err.message || 'লেখক তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setIsCreatingAuthor(false);
    }
  }

  // Auto-generate slug from title
  useEffect(() => {
    if (title.trim()) {
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
      
      const successMsg =
        targetStatus === 'published'
          ? (isEditing ? 'সংবাদ সফলভাবে আপডেট ও প্রকাশিত হয়েছে!' : 'নতুন সংবাদ সফলভাবে প্রকাশিত হয়েছে!')
          : targetStatus === 'scheduled'
          ? 'সংবাদ সময়সূচী অনুযায়ী নির্ধারিত হয়েছে!'
          : 'সংবাদ খসড়া সফলভাবে সংরক্ষিত হয়েছে!';
      toastSuccess(successMsg);

      // Redirect to all articles page (/admin/posts)
      router.push('/admin/posts');
      router.refresh();
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

  // Category & Subcategory cascading lists
  const allCategoriesList = useMemo(() => {
    if (categoriesRes?.success && Array.isArray(categoriesRes.data) && categoriesRes.data.length > 0) {
      return categoriesRes.data;
    }
    return availableCategories;
  }, [categoriesRes, availableCategories]);

  const primaryCategoriesList = useMemo(() => {
    return allCategoriesList.filter((c: any) => !c.parent);
  }, [allCategoriesList]);

  const selectedCategoryDoc = useMemo(() => {
    if (!category) return null;
    const catNorm = String(category).trim().toLowerCase();
    return allCategoriesList.find((c: any) => {
      const slugNorm = (c.slug || '').trim().toLowerCase();
      const nameBnNorm = (c.name_bn || '').trim().toLowerCase();
      const nameEnNorm = (c.name_en || '').trim().toLowerCase();
      const idStr = String(c._id || '');
      return (
        slugNorm === catNorm ||
        nameBnNorm === catNorm ||
        nameEnNorm === catNorm ||
        idStr === catNorm ||
        c.name_bn === category ||
        c.slug === category
      );
    });
  }, [allCategoriesList, category]);

  const categorySubCategories = useMemo(() => {
    if (!selectedCategoryDoc) return [];
    const selId = String(selectedCategoryDoc._id || '');
    const selSlug = (selectedCategoryDoc.slug || '').toLowerCase();
    const selNameBn = selectedCategoryDoc.name_bn || '';
    const selNameEn = (selectedCategoryDoc.name_en || '').toLowerCase();

    return allCategoriesList.filter((c: any) => {
      if (!c.parent) return false;
      const p = c.parent;
      const pId = typeof p === 'object' ? String(p._id || '') : String(p);
      const pSlug = typeof p === 'object' ? (p.slug || '').toLowerCase() : String(p).toLowerCase();
      const pNameBn = typeof p === 'object' ? (p.name_bn || '') : String(p);
      const pNameEn = typeof p === 'object' ? (p.name_en || '').toLowerCase() : '';

      return (
        (selId && pId === selId) ||
        (selSlug && (pSlug === selSlug || pId === selSlug)) ||
        (selNameBn && (pNameBn === selNameBn || pId === selNameBn)) ||
        (selNameEn && (pNameEn === selNameEn || pSlug === selNameEn))
      );
    });
  }, [allCategoriesList, selectedCategoryDoc]);

  return (
    <div className="flex flex-col gap-6 pb-28 sm:pb-12">
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
              onClick={handlePreview}
              title="Preview"
              className="px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
              leftIcon={<Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            >
              <span className="hidden xs:inline">Preview</span>
            </Button>

            {/* Save Draft */}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleSubmit('draft')}
              className="px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
            >
              Draft
            </Button>

            {/* Publish Button */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleSubmit(status === 'scheduled' ? 'scheduled' : 'published')}
              leftIcon={<Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              className="px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm"
            >
              {status === 'scheduled' ? 'Schedule' : 'Publish'}
            </Button>
          </div>
        }
      />

      {/* Offline Saved Draft Recovery Banner */}
      {savedDraftInfo && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-xs sm:text-sm min-w-0">
              <span className="font-bold">অসংরক্ষিত ড্রাফট পাওয়া গেছে:</span> &quot;{savedDraftInfo.title}&quot; ({new Date(savedDraftInfo.timestamp).toLocaleTimeString()})
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <Button size="sm" variant="primary" onClick={handleRestoreOfflineDraft}>
              পুনরুদ্ধার করুন (Restore)
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDiscardOfflineDraft}>
              বাতিল
            </Button>
          </div>
        </div>
      )}

      {/* Top Progress Bar & Tappable Step Chips (Mobile & Desktop) */}
      <div className="flex flex-col gap-2.5">
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-[#1b7d95] transition-all duration-300"
            style={{
              width: `${((COMPOSER_STEPS.findIndex((s) => s.id === activeStep) + 1) / COMPOSER_STEPS.length) * 100}%`,
            }}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {COMPOSER_STEPS.map((step) => {
            const isActive = step.id === activeStep;
            const isDone = isStepCompleted(step.id);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#1b7d95] text-white shadow-sm ring-2 ring-[#1b7d95]/30'
                    : isDone
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-current shrink-0" />}
                <span>{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* MOBILE STEP WIZARD VIEW (< lg) - ONE STEP PER SCREEN             */}
      {/* ================================================================ */}
      <div className="lg:hidden flex flex-col gap-5 pb-20">
        {/* Step 1: Headline & Hook */}
        {activeStep === 'headline' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ধাপ ১: শিরোনাম ও সূচনা (Headline & Lead Hook)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                একটি আকর্ষণীয় ও স্পষ্ট শিরোনাম লিখুন।
              </p>
            </div>

            <FormField label="Article Headline (সংবাদের শিরোনাম)" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="শিরোনাম লিখুন..."
                className="font-bold text-base sm:text-lg min-h-[48px]"
                autoFocus
              />
            </FormField>

            <FormField label="Custom URL Slug (স্লাগ)">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-slug..."
                className="font-mono text-xs text-slate-500 min-h-[48px]"
              />
            </FormField>

            <FormField label="Lead Hook (প্রথম ১-২ অনুচ্ছেদ)" hint="সংবাদের প্রারম্ভিক মূল অংশ">
              <Textarea
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                placeholder="প্রথম কয়েক বাক্যে ঘটনার মূল বক্তব্য..."
                rows={2}
              />
            </FormField>

            <FormField label="Short Summary / Excerpt (সংক্ষিপ্ত সারাংশ)" hint="কার্ড প্রিভিউ ও সোশ্যাল শেয়ারের জন্য">
              <Textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="ফেসবুক ও গুগল সার্চের জন্য ১-২ লাইনের সারসংক্ষেপ..."
                rows={3}
                showCount
                maxLength={300}
              />
            </FormField>
          </div>
        )}

        {/* Step 2: Featured Image & Media */}
        {activeStep === 'image' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ধাপ ২: মূল ছবি ও মিডিয়া (Featured Image & Media)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ক্যামেরা, ফাইল গ্যালারি বা মিডিয়া লাইব্রেরি থেকে ছবি সংযুক্ত করুন।
              </p>
            </div>

            <ImageUploader
              value={featuredImage}
              onChange={setFeaturedImage}
              label="সংবাদের মূল ছবি (Featured Image)"
              onOpenMediaPicker={() => {
                const trigger = document.getElementById('composer-media-trigger');
                trigger?.click();
              }}
            />
          </div>
        )}

        {/* Step 3: Body Editor */}
        {activeStep === 'body' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  ধাপ ৩: সংবাদের বিস্তারিত (Story Body)
                </h2>
                <span className="text-xs text-slate-400">
                  শব্দ সংখ্যা: ~{Math.round(content.replace(/<[^>]*>/g, '').trim().length / 5)}
                </span>
              </div>

              {/* Fullscreen Focus Mode Button */}
              <button
                type="button"
                onClick={() => setIsFocusMode(!isFocusMode)}
                className="touch-target px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#1b7d95]" />
                <span>পূর্ণ পর্দা (Focus)</span>
              </button>
            </div>

            <TiptapEditor
              content={content}
              onChange={(newHtml) => {
                setContent(newHtml);
                setHasUnsavedChanges(true);
                setAutosaveStatus('unsaved');
              }}
            />
          </div>
        )}

        {/* Step 4: Category & Location */}
        {activeStep === 'category' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ধাপ ৪: ক্যাটাগরি ও অবস্থান (Category & Location)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সংবাদের বিভাগ ও স্থান নির্ধারণ করুন।
              </p>
            </div>

            {/* Category Picker Sheet Trigger Button */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Primary Category (মূল ক্যাটাগরি) *
              </label>
              <button
                type="button"
                onClick={() => setIsCategorySheetOpen(true)}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-left flex items-center justify-between text-base font-bold text-slate-900 dark:text-slate-100"
              >
                <span>📁 {category || 'ক্যাটাগরি নির্বাচন করুন'}</span>
                <span className="text-xs font-semibold text-[#1b7d95]">পরিবর্তন করুন (Change)</span>
              </button>
            </div>

            <FormField
              label="Sub-Category (সাব-ক্যাটাগরি)"
              hint={
                categorySubCategories.length > 0
                  ? `${categorySubCategories.length}টি সাব-ক্যাটাগরি উপলব্ধ`
                  : undefined
              }
            >
              {categorySubCategories.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <Select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                  >
                    <option value="">-- সাব-ক্যাটাগরি নির্বাচন করুন --</option>
                    {categorySubCategories.map((sc: any) => (
                      <option key={sc._id || sc.slug} value={sc.name_bn}>
                        📂 {sc.name_bn} {sc.name_en ? `(${sc.name_en})` : ''}
                      </option>
                    ))}
                    <option value="__custom__">✏️ অন্য কাস্টম সাব-ক্যাটাগরি লিখুন...</option>
                  </Select>

                  {(subCategory === '__custom__' ||
                    (subCategory && !categorySubCategories.some((sc: any) => sc.name_bn === subCategory))) && (
                    <Input
                      value={subCategory === '__custom__' ? '' : subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      placeholder="কাস্টম সাব-ক্যাটাগরির নাম লিখুন..."
                      autoFocus
                    />
                  )}
                </div>
              ) : (
                <Input
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="যেমন: ক্রিকেট, ফুটবল, আদালত..."
                />
              )}
            </FormField>

            {/* Trending Topics Selector */}
            <FormField label="Trending Topic (ট্রেন্ডিং টপিক)">
              <Select
                value={tags.find((t) => availableTopics.some((at) => at.name === t)) || ''}
                onChange={(e) => {
                  const selected = e.target.value;
                  if (!selected) return;
                  if (!tags.includes(selected)) {
                    setTags((prev) => [selected, ...prev]);
                  }
                  setIsTrending(true);
                  setHasUnsavedChanges(true);
                }}
              >
                <option value="">None (কোনো নির্দিষ্ট ট্রেন্ডিং টপিক নয়)</option>
                {availableTopics.map((top) => (
                  <option key={top._id || top.name} value={top.name}>
                    🔥 {top.name}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Regional Location Cascade */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-[#1b7d95]" />
                <span>আঞ্চলিক অবস্থান (Regional Location)</span>
              </div>

              <FormField label="Division (বিভাগ)">
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
                <FormField label="District (জেলা)">
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
                <FormField label="Upazila / Thana (উপজেলা / থানা)">
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

            <FormField label="Tags & Keywords (ট্যাগ)">
              <MultiSelect
                value={tags}
                onChange={setTags}
                placeholder="ট্যাগ লিখে Enter চাপুন..."
                allowCreate
              />
            </FormField>
          </div>
        )}

        {/* Step 5: Author, Flags & SEO */}
        {activeStep === 'settings' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ধাপ ৫: লেখক ও প্রকাশনা সেটিংস (Author & Editorial)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সংবাদের প্রতিবেদক, ফ্রন্টপেজ ফ্ল্যাগ ও সার্চ ইঞ্জিন অপটিমাইজেশন।
              </p>
            </div>

            {/* Author Picker Bottom Sheet Trigger */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Assigned Author (লেখক / প্রতিবেদক)
              </label>
              <button
                type="button"
                onClick={() => setIsAuthorSheetOpen(true)}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-left flex items-center justify-between text-base font-bold text-slate-900 dark:text-slate-100"
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="w-4 h-4 text-[#1b7d95] shrink-0" />
                  <span className="truncate">{author || 'লেখক নির্বাচন করুন'}</span>
                </div>
                <span className="text-xs font-semibold text-[#1b7d95] shrink-0">পরিবর্তন (Change)</span>
              </button>
            </div>

            {/* Editorial Flags */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Switch
                checked={isBreaking}
                onChange={setIsBreaking}
                label="ব্রেকিং নিউজ (Breaking News)"
                description="লাল ব্রেকিং নিউজ ব্যানারে স্ক্রল করবে"
              />

              <Switch
                checked={isFeatured}
                onChange={setIsFeatured}
                label="প্রধান শিরোনাম (Featured Lead Story)"
                description="হোমপেজের মূল লিড সেকশনে অগ্রাধিকার পাবে"
              />

              <Switch
                checked={isTrending}
                onChange={setIsTrending}
                label="ট্রেন্ডিং স্টোরি (Trending)"
                description="জনপ্রিয় ও আলোচিত সংবাদের তালিকায় স্থান পাবে"
              />
            </div>

            {/* SEO Settings */}
            <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#1b7d95]" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  গুগল সার্চ ও সোশ্যাল মেটা (SEO)
                </span>
              </div>

              <FormField label="Meta Title">
                <Input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title || 'Custom SEO Title...'}
                />
              </FormField>

              <FormField label="Meta Description">
                <Textarea
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder={excerpt || 'Search description...'}
                  rows={2}
                />
              </FormField>
            </div>
          </div>
        )}

        {/* Step 6: Review, Preview & Publish */}
        {activeStep === 'review' && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ধাপ ৬: রিভিউ ও প্রকাশনা (Review & Publish)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                প্রকাশের আগে চেকলিস্ট ও মোবাইল প্রিভিউ পরীক্ষা করুন।
              </p>
            </div>

            {/* Readiness Checklist */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                প্রকাশনা চেকলিস্ট (Readiness Checklist)
              </span>

              <div className="flex flex-col gap-2 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  {title.trim() ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={title.trim() ? 'text-slate-800 dark:text-slate-200' : 'text-rose-500'}>
                    {title.trim() ? 'শিরোনাম প্রস্তুত' : 'শিরোনাম লেখা আবশ্যক'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {featuredImage?.url ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span className={featuredImage?.url ? 'text-slate-800 dark:text-slate-200' : 'text-amber-600'}>
                    {featuredImage?.url ? 'ফিচার্ড ছবি সংযুক্ত রয়েছে' : 'ছবি ছাড়া টেক্সট নিউজ হিসেবে প্রকাশ পাবে'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {content.replace(/<[^>]*>/g, '').trim().length > 30 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={content.replace(/<[^>]*>/g, '').trim().length > 30 ? 'text-slate-800 dark:text-slate-200' : 'text-rose-500'}>
                    {content.replace(/<[^>]*>/g, '').trim().length > 30
                      ? `${Math.round(content.replace(/<[^>]*>/g, '').trim().length / 5)} শব্দের পূর্ণাঙ্গ সংবাদ`
                      : 'সংবাদের বিস্তারিত বিবরণ লেখা প্রয়োজন'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-800 dark:text-slate-200">
                    বিভাগ: {category} • লেখক: {author}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile News Feed Card Preview */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                মোবাইল ফিড প্রিভিউ (Mobile Feed Preview)
              </span>

              <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md flex items-start gap-3">
                {featuredImage?.url ? (
                  <div className="relative w-24 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                    <img src={featuredImage.url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-xs shrink-0">
                    ছবি নেই
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1b7d95]/10 text-[#1b7d95] dark:text-sky-300">
                      {category}
                    </span>
                    {isBreaking && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500 text-white">
                        ব্রেকিং
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                    {title || 'এখানে আপনার সংবাদ শিরোনাম প্রদর্শিত হবে'}
                  </h4>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {author} • এইমাত্র
                  </span>
                </div>
              </div>
            </div>

            {/* Publication Mode Radio Cards */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                প্রকাশনার ধরন নির্বাচন করুন
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'published', label: 'লাইভ প্রকাশ (Publish)', desc: 'অনলাইনে সাথে সাথে পাঠকদের জন্য উন্মুক্ত হবে' },
                  { id: 'draft', label: 'ড্রাফট (Save Draft)', desc: 'শুধুমাত্র এডমিন প্যানেলে সংরক্ষিত থাকবে' },
                  { id: 'scheduled', label: 'সিডিউল (Schedule)', desc: 'নির্দিষ্ট তারিখে স্বয়ংক্রিয়ভাবে প্রকাশ হবে' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setStatus(mode.id as any)}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      status === mode.id
                        ? 'border-[#1b7d95] bg-[#1b7d95]/10 text-[#1b7d95] dark:text-sky-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{mode.label}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        status === mode.id ? 'border-[#1b7d95] bg-[#1b7d95]' : 'border-slate-400'
                      }`}>
                        {status === mode.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{mode.desc}</span>
                  </button>
                ))}
              </div>

              {status === 'scheduled' && (
                <div className="mt-2 p-3.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20">
                  <FormField label="প্রকাশের সময় নির্ধারণ করুন" required>
                    <DateTimePicker value={publishedAt} onChange={setPublishedAt} />
                  </FormField>
                </div>
              )}
            </div>

            {/* Mobile Big Submit Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                leftIcon={<Send className="w-5 h-5" />}
                onClick={() => handleSubmit(status === 'scheduled' ? 'scheduled' : 'published')}
              >
                {status === 'scheduled' ? 'সিডিউল নিশ্চিত করুন' : status === 'published' ? 'এখনই প্রকাশ করুন (Publish Now)' : 'ড্রাফট হিসেবে সংরক্ষণ করুন'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* MOBILE STICKY BOTTOM ACTION BAR                                  */}
      {/* ================================================================ */}
      {!isKeyboardOpen && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-2 shadow-lg">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={activeStep === 'headline'}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => {
              const currentIdx = COMPOSER_STEPS.findIndex((s) => s.id === activeStep);
              if (currentIdx > 0) {
                setActiveStep(COMPOSER_STEPS[currentIdx - 1].id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            পিছনে
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isSubmitting}
            onClick={() => handleSubmit('draft')}
          >
            ড্রাফট
          </Button>

          {activeStep !== 'review' ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                const currentIdx = COMPOSER_STEPS.findIndex((s) => s.id === activeStep);
                if (currentIdx < COMPOSER_STEPS.length - 1) {
                  setActiveStep(COMPOSER_STEPS[currentIdx + 1].id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              পরবর্তী
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
              onClick={() => handleSubmit(status === 'scheduled' ? 'scheduled' : 'published')}
            >
              {status === 'scheduled' ? 'সিডিউল' : 'প্রকাশ'}
            </Button>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* DESKTOP TWO-COLUMN VIEW (hidden on mobile, visible on >= lg)     */}
      {/* ================================================================ */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>Story Body</span>
                <span className="text-xs text-slate-400 font-normal">Clean formatting enabled</span>
              </label>

              <button
                type="button"
                onClick={() => setIsFocusMode(true)}
                className="text-xs font-semibold text-[#1b7d95] hover:underline flex items-center gap-1"
              >
                <Maximize2 className="w-3.5 h-3.5" /> Fullscreen Focus
              </button>
            </div>

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
            </FormField>

            <FormField label="Meta Description" hint="Optimal length: 140-160 characters">
              <Textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder={excerpt || 'Compelling search engine description...'}
                rows={2}
              />
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

            <FormField label="Assigned Author (লেখক / প্রতিবেদক)">
              <div className="flex flex-col gap-2.5">
                <Select
                  value={isCustomAuthor ? '__custom__' : author}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomAuthor(true);
                    } else {
                      setIsCustomAuthor(false);
                      setAuthor(e.target.value);
                    }
                  }}
                >
                  <optgroup label="টিম ও লেখকবৃন্দ (Authors & Reporters)">
                    {availableAuthors.length > 0 ? (
                      availableAuthors
                        .filter((a: any) => a.isActive !== false)
                        .map((a: any) => (
                          <option key={a._id} value={a.name}>
                            👤 {a.name}{a.designation ? ` (${a.designation})` : ''}
                          </option>
                        ))
                    ) : (
                      <option value="" disabled>লেখক তালিকা লোড হচ্ছে...</option>
                    )}
                  </optgroup>

                  <optgroup label="সাধারণ রিপোর্টার পদবী">
                    <option value="নিজস্ব প্রতিবেদক">নিজস্ব প্রতিবেদক (Default)</option>
                    <option value="অনলাইন ডেস্ক">অনলাইন ডেস্ক</option>
                    <option value="বিশেষ প্রতিনিধি">বিশেষ প্রতিনিধি</option>
                  </optgroup>
                </Select>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => setIsQuickAuthorModalOpen(true)}
                    className="text-[#1b7d95] dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" /> নতুন লেখক যোগ করুন
                  </button>
                </div>
              </div>
            </FormField>
          </div>

          {/* Category & Tags */}
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Organization
            </h3>

            <FormField label="Primary Category" required>
              <Select
                value={selectedCategoryDoc?.name_bn || category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSubCategory('');
                }}
              >
                {primaryCategoriesList.length > 0 ? (
                  primaryCategoriesList.map((c: any) => (
                    <option key={c._id || c.slug} value={c.name_bn}>
                      📁 {c.name_bn} {c.name_en ? `(${c.name_en})` : ''}
                    </option>
                  ))
                ) : (
                  allCategoriesList
                    .filter((c: any) => !c.parent)
                    .map((c: any) => (
                      <option key={c._id || c.slug} value={c.name_bn}>
                        📁 {c.name_bn} {c.name_en ? `(${c.name_en})` : ''}
                      </option>
                    ))
                )}
              </Select>
            </FormField>

            <FormField
              label="Sub-Category (সাব-ক্যাটাগরি)"
              hint={
                categorySubCategories.length > 0
                  ? `${categorySubCategories.length}টি সাব-ক্যাটাগরি উপলব্ধ`
                  : 'এই ক্যাটাগরিতে কোনো সাব-ক্যাটাগরি নেই'
              }
            >
              {categorySubCategories.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <Select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                  >
                    <option value="">-- সাব-ক্যাটাগরি নির্বাচন করুন --</option>
                    {categorySubCategories.map((sc: any) => (
                      <option key={sc._id || sc.slug} value={sc.name_bn}>
                        📂 {sc.name_bn} {sc.name_en ? `(${sc.name_en})` : ''}
                      </option>
                    ))}
                    <option value="__custom__">✏️ অন্য কাস্টম সাব-ক্যাটাগরি লিখুন...</option>
                  </Select>

                  {(subCategory === '__custom__' ||
                    (subCategory && !categorySubCategories.some((sc: any) => sc.name_bn === subCategory))) && (
                    <Input
                      value={subCategory === '__custom__' ? '' : subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      placeholder="কাস্টম সাব-ক্যাটাগরির নাম লিখুন..."
                      autoFocus
                    />
                  )}
                </div>
              ) : (
                <Input
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="যেমন: ক্রিকেট, ফুটবল, আদালত..."
                />
              )}
            </FormField>

            {/* Trending Topic Selector */}
            <FormField label="Trending Topic">
              <Select
                value={tags.find((t) => availableTopics.some((at) => at.name === t)) || ''}
                onChange={(e) => {
                  const selected = e.target.value;
                  if (!selected) return;
                  if (!tags.includes(selected)) {
                    setTags((prev) => [selected, ...prev]);
                  }
                  setIsTrending(true);
                  setHasUnsavedChanges(true);
                }}
              >
                <option value="">None</option>
                {availableTopics.map((top) => (
                  <option key={top._id || top.name} value={top.name}>
                    🔥 {top.name}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Tags">
              <MultiSelect
                value={tags}
                onChange={setTags}
                placeholder="Add tags..."
                allowCreate
              />
            </FormField>
          </div>

          {/* Frontpage Flags */}
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
          </div>
        </div>
      </div>

      {/* In-Flow Desktop Action Card */}
      <div className="hidden lg:flex p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm items-center justify-between gap-3 my-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">বর্তমান স্ট্যাটাস:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
            {status}
          </span>
          {hasUnsavedChanges && (
            <span className="text-amber-500 font-medium">• অসংরক্ষিত পরিবর্তন</span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePreview}
            leftIcon={<Eye className="w-4 h-4" />}
          >
            প্রিভিউ
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={isSubmitting}
            onClick={() => handleSubmit('draft')}
          >
            ড্রাফট সংরক্ষণ
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            onClick={() => handleSubmit(status === 'scheduled' ? 'scheduled' : 'published')}
            leftIcon={<Send className="w-4 h-4" />}
          >
            {status === 'scheduled' ? 'সিডিউল করুন' : 'পাবলিশ করুন'}
          </Button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SEARCHABLE CATEGORY BOTTOM SHEET MODAL                            */}
      {/* ================================================================ */}
      <Modal
        isOpen={isCategorySheetOpen}
        onClose={() => setIsCategorySheetOpen(false)}
        title="ক্যাটাগরি নির্বাচন করুন"
        maxWidth="md"
      >
        <div className="flex flex-col gap-3">
          <Input
            value={categorySearchQuery}
            onChange={(e) => setCategorySearchQuery(e.target.value)}
            placeholder="ক্যাটাগরি খুঁজুন (Search category)..."
            leftIcon={<Search className="w-4 h-4" />}
            autoFocus
          />

          <div className="max-h-72 overflow-y-auto flex flex-col gap-1 divide-y divide-slate-100 dark:divide-slate-800">
            {primaryCategoriesList
              .filter((c: any) => {
                if (!categorySearchQuery) return true;
                const q = categorySearchQuery.toLowerCase();
                return (
                  c.name_bn?.toLowerCase().includes(q) ||
                  c.name_en?.toLowerCase().includes(q) ||
                  c.slug?.toLowerCase().includes(q)
                );
              })
              .map((c: any) => {
                const isSelected =
                  category === c.name_bn ||
                  category === c.slug ||
                  selectedCategoryDoc?.name_bn === c.name_bn;
                return (
                  <button
                    key={c._id || c.slug}
                    type="button"
                    onClick={() => {
                      setCategory(c.name_bn || c.slug);
                      setSubCategory('');
                      setIsCategorySheetOpen(false);
                    }}
                    className={`w-full min-h-[48px] px-3.5 py-3 text-left rounded-xl flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#1b7d95]/15 text-[#1b7d95] dark:text-sky-300 font-bold'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-sm sm:text-base">{c.name_bn}</span>
                      <span className="text-xs text-slate-400 font-mono">/{c.slug} • {c.name_en}</span>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-[#1b7d95]" />}
                  </button>
                );
              })}
          </div>
        </div>
      </Modal>

      {/* ================================================================ */}
      {/* SEARCHABLE AUTHOR BOTTOM SHEET MODAL                              */}
      {/* ================================================================ */}
      <Modal
        isOpen={isAuthorSheetOpen}
        onClose={() => setIsAuthorSheetOpen(false)}
        title="লেখক / প্রতিবেদক নির্বাচন করুন"
        maxWidth="md"
      >
        <div className="flex flex-col gap-3">
          <Input
            value={authorSearchQuery}
            onChange={(e) => setAuthorSearchQuery(e.target.value)}
            placeholder="লেখকের নাম খুঁজুন (Search author)..."
            leftIcon={<Search className="w-4 h-4" />}
            autoFocus
          />

          {/* Quick Standard Bylines */}
          <div className="flex items-center gap-1.5 flex-wrap pb-2 border-b border-slate-100 dark:border-slate-800">
            {['নিজস্ব প্রতিবেদক', 'অনলাইন ডেস্ক', 'বিশেষ প্রতিনিধি'].map((bl) => (
              <button
                key={bl}
                type="button"
                onClick={() => {
                  setAuthor(bl);
                  setIsCustomAuthor(false);
                  setIsAuthorSheetOpen(false);
                }}
                className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
                  author === bl
                    ? 'bg-[#1b7d95] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {bl}
              </button>
            ))}
          </div>

          <div className="max-h-72 overflow-y-auto flex flex-col gap-1 divide-y divide-slate-100 dark:divide-slate-800">
            {availableAuthors
              .filter((a: any) => {
                if (!authorSearchQuery) return true;
                const q = authorSearchQuery.toLowerCase();
                return (
                  a.name?.toLowerCase().includes(q) ||
                  a.designation?.toLowerCase().includes(q)
                );
              })
              .map((a: any) => {
                const isSelected = author === a.name;
                return (
                  <button
                    key={a._id}
                    type="button"
                    onClick={() => {
                      setAuthor(a.name);
                      setIsCustomAuthor(false);
                      setIsAuthorSheetOpen(false);
                    }}
                    className={`w-full min-h-[48px] px-3.5 py-3 text-left rounded-xl flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#1b7d95]/15 text-[#1b7d95] dark:text-sky-300 font-bold'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {a.avatar?.url ? (
                        <img src={a.avatar.url} alt={a.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#1b7d95]/15 text-[#1b7d95] font-bold text-xs flex items-center justify-center shrink-0">
                          {a.name.slice(0, 1)}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm">{a.name}</span>
                        {a.designation && <span className="text-xs text-slate-400">{a.designation}</span>}
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-[#1b7d95]" />}
                  </button>
                );
              })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              fullWidth
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setIsAuthorSheetOpen(false);
                setIsQuickAuthorModalOpen(true);
              }}
            >
              নতুন লেখক তৈরি করুন (+ Add Author)
            </Button>
          </div>
        </div>
      </Modal>

      {/* ================================================================ */}
      {/* FULLSCREEN FOCUS MODE MODAL FOR BODY EDITOR                      */}
      {/* ================================================================ */}
      {isFocusMode && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col p-4 sm:p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                পূর্ণ পর্দা ফোকাস মোড (Focus Mode)
              </h2>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<Minimize2 className="w-4 h-4" />}
              onClick={() => setIsFocusMode(false)}
            >
              প্রস্থান (Exit Focus)
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto pt-4">
            <TiptapEditor
              content={content}
              onChange={(newHtml) => {
                setContent(newHtml);
                setHasUnsavedChanges(true);
                setAutosaveStatus('unsaved');
              }}
            />
          </div>
        </div>
      )}

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

      {/* Quick Add Author Modal */}
      <Modal
        isOpen={isQuickAuthorModalOpen}
        onClose={() => setIsQuickAuthorModalOpen(false)}
        title="নতুন লেখক / প্রতিবেদক যোগ করুন"
        maxWidth="md"
      >
        <form onSubmit={handleQuickCreateAuthor} className="flex flex-col gap-4">
          <ImageUploader
            value={newAuthorAvatar}
            onChange={setNewAuthorAvatar}
            label="লেখকের ছবি (Photo)"
            showCaption={false}
            showAlt={false}
          />

          <FormField label="লেখকের পুরো নাম" required>
            <Input
              value={newAuthorName}
              onChange={(e) => setNewAuthorName(e.target.value)}
              placeholder="যেমন: রফিক আহমেদ"
              required
              autoFocus
            />
          </FormField>

          <FormField label="পদবী / ডেসিগনেশন">
            <Input
              value={newAuthorDesignation}
              onChange={(e) => setNewAuthorDesignation(e.target.value)}
              placeholder="যেমন: সিনিয়র রিপোর্টার / বিশেষ প্রতিনিধি"
            />
          </FormField>

          <FormField label="সংক্ষিপ্ত পরিচিতি (Bio)">
            <Textarea
              value={newAuthorBio}
              onChange={(e) => setNewAuthorBio(e.target.value)}
              placeholder="লেখকের সংক্ষিপ্ত পরিচিতি..."
              rows={3}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsQuickAuthorModalOpen(false)}
            >
              বাতিল
            </Button>
            <Button variant="primary" type="submit" isLoading={isCreatingAuthor}>
              সংরক্ষণ ও নির্বাচন করুন
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
