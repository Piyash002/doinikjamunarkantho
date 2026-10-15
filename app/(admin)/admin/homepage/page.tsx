'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import Link from 'next/link';
import {
  LayoutTemplate,
  Pin,
  PinOff,
  Search,
  Check,
  Send,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ExternalLink,
  Layers,
  Loader2,
  Grid,
  Plus,
  Save,
  SlidersHorizontal,
  Eye,
} from 'lucide-react';

import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Modal } from '@/src/components/admin/ui/Modal';
import { Badge } from '@/src/components/admin/ui/Badge';
import { Input } from '@/src/components/admin/ui/Input';
import { Select } from '@/src/components/admin/ui/Select';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { useToast } from '@/src/components/admin/ui/Toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const LAYOUT_OPTIONS = [
  { value: 'lead-plus-list', label: '১টি বড় লিড + ৩টি ছোট থাম্বনেইল লিস্ট (জাতীয় / আন্তর্জাতিক)' },
  { value: 'grid-4', label: 'বড় লিড + ৪ কলাম গ্রিড কার্ড (সারাদেশ)' },
  { value: 'entertainment-3col', label: '৩ কলাম শোবিজ (বামে ৩টি + মাঝে ১টি বড় + ডানে ৩টি)' },
  { value: 'sports-3col', label: '৩ কলাম ফটো কার্ড (খেলাধুলা)' },
];

export default function HomepageManagerPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'slots'>('categories');
  const { success: toastSuccess, error: toastError } = useToast();

  // 1. Categories SWR & State
  const {
    data: catData,
    mutate: mutateCats,
    isLoading: isLoadingCats,
  } = useSWR('/api/admin/homepage/categories', fetcher);

  const [categories, setCategories] = useState<any[]>([]);
  const [isSavingCats, setIsSavingCats] = useState(false);
  const [catSearch, setCatSearch] = useState('');

  React.useEffect(() => {
    if (catData?.success && Array.isArray(catData.data)) {
      setCategories(catData.data);
    }
  }, [catData]);

  // 2. Slots SWR & State
  const {
    data: slotData,
    mutate: mutateSlots,
    isLoading: isLoadingSlots,
  } = useSWR('/api/admin/homepage', fetcher);

  const [sections, setSections] = useState<any[]>([]);
  const [isPublishingSlots, setIsPublishingSlots] = useState(false);

  React.useEffect(() => {
    if (slotData?.success && Array.isArray(slotData.data)) {
      setSections(slotData.data);
    }
  }, [slotData]);

  // Search & Pin slot modal state
  const [pinTarget, setPinTarget] = useState<{ sectionIndex: number; slotIndex: number } | null>(null);
  const [postSearch, setPostSearch] = useState('');
  const { data: postsData, isLoading: isLoadingPosts } = useSWR(
    pinTarget ? `/api/admin/posts?search=${encodeURIComponent(postSearch)}&status=published&limit=15` : null,
    fetcher
  );

  const candidatePosts = postsData?.success && Array.isArray(postsData.data) ? postsData.data : [];

  /* ========================================================== */
  /* CATEGORY PINNING & REORDERING HANDLERS                     */
  /* ========================================================== */

  function handleTogglePinCategory(catId: string) {
    setCategories((prev) => {
      const next = [...prev];
      const target = next.find((c) => c._id === catId);
      if (!target) return prev;

      const willBePinned = !target.showOnHome;
      target.showOnHome = willBePinned;

      if (willBePinned) {
        // Find max existing homeOrder
        const pinned = next.filter((c) => c.showOnHome && c._id !== catId);
        const maxOrder = pinned.reduce((max, c) => Math.max(max, c.homeOrder || 0), 0);
        target.homeOrder = maxOrder + 1;
      }

      return [...next];
    });
  }

  function handleMoveCategory(catId: string, direction: 'up' | 'down') {
    setCategories((prev) => {
      // Get pinned categories sorted by homeOrder
      const pinned = prev
        .filter((c) => c.showOnHome)
        .sort((a, b) => (a.homeOrder || 0) - (b.homeOrder || 0));

      const currentIndex = pinned.findIndex((c) => c._id === catId);
      if (currentIndex === -1) return prev;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= pinned.length) return prev;

      // Swap homeOrder between adjacent items
      const tempOrder = pinned[currentIndex].homeOrder || (currentIndex + 1);
      pinned[currentIndex].homeOrder = pinned[targetIndex].homeOrder || (targetIndex + 1);
      pinned[targetIndex].homeOrder = tempOrder;

      // Normalize homeOrder sequence (1, 2, 3...)
      pinned.sort((a, b) => (a.homeOrder || 0) - (b.homeOrder || 0));
      pinned.forEach((c, idx) => {
        c.homeOrder = idx + 1;
      });

      return [...prev];
    });
  }

  function handleHomeOrderChange(catId: string, newOrder: number) {
    if (isNaN(newOrder) || newOrder < 1) return;
    setCategories((prev) => {
      const next = [...prev];
      const target = next.find((c) => c._id === catId);
      if (target) {
        target.homeOrder = newOrder;
      }
      return next;
    });
  }

  function handleLayoutChange(catId: string, layout: string) {
    setCategories((prev) => {
      const next = [...prev];
      const target = next.find((c) => c._id === catId);
      if (target) {
        target.homeLayout = layout;
      }
      return next;
    });
  }

  async function handleSaveCategories() {
    try {
      setIsSavingCats(true);
      const items = categories.map((cat, idx) => ({
        id: cat._id,
        homeOrder: cat.showOnHome ? (cat.homeOrder || idx + 1) : 999,
        showOnHome: Boolean(cat.showOnHome),
        homeLayout: cat.homeLayout || 'lead-plus-list',
      }));

      const res = await fetch('/api/admin/homepage/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save category serials.');
      }

      await mutateCats();
      toastSuccess('হোমপেজ ক্যাটাগরি পিন ও ক্রম সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      toastError(err.message || 'সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setIsSavingCats(false);
    }
  }

  /* ========================================================== */
  /* SLOTS & HERO STORIES HANDLERS                              */
  /* ========================================================== */

  function handlePinPost(post: any) {
    if (!pinTarget) return;
    const { sectionIndex, slotIndex } = pinTarget;

    const nextSections = [...sections];
    const sec = nextSections[sectionIndex];
    if (sec && sec.slots[slotIndex]) {
      sec.slots[slotIndex] = {
        ...sec.slots[slotIndex],
        postId: post._id,
        postTitle: post.title,
        postSlug: post.slug,
        postImage: post.featuredImage?.url || '',
        postCategory: post.category || '',
        isPinned: true,
      };
      setSections(nextSections);
      toastSuccess(`Pinned "${post.title}" to slot ${slotIndex + 1}!`);
    }
    setPinTarget(null);
  }

  function handleUnpin(sectionIndex: number, slotIndex: number) {
    const nextSections = [...sections];
    const sec = nextSections[sectionIndex];
    if (sec && sec.slots[slotIndex]) {
      sec.slots[slotIndex] = {
        ...sec.slots[slotIndex],
        postId: null,
        isPinned: false,
      };
      setSections(nextSections);
      toastSuccess(`Slot ${slotIndex + 1} set back to automatic latest.`);
    }
  }

  function moveSlot(sectionIndex: number, slotIndex: number, direction: 'up' | 'down') {
    const nextSections = [...sections];
    const slots = [...nextSections[sectionIndex].slots];
    const targetIndex = direction === 'up' ? slotIndex - 1 : slotIndex + 1;
    if (targetIndex < 0 || targetIndex >= slots.length) return;

    const temp = slots[slotIndex];
    slots[slotIndex] = slots[targetIndex];
    slots[targetIndex] = temp;

    slots.forEach((s, idx) => (s.slotIndex = idx + 1));
    nextSections[sectionIndex].slots = slots;
    setSections(nextSections);
  }

  async function handlePublishHomepageSlots() {
    try {
      setIsPublishingSlots(true);
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to publish homepage layout.');

      mutateSlots();
      toastSuccess('Homepage layout published and live site revalidated!');
    } catch (err: any) {
      toastError(err.message || 'Publishing failed.');
    } finally {
      setIsPublishingSlots(false);
    }
  }

  // Filtered pinned and unpinned categories
  const pinnedCategories = categories
    .filter((c) => c.showOnHome)
    .sort((a, b) => (a.homeOrder || 0) - (b.homeOrder || 0));

  const unpinnedCategories = categories
    .filter((c) => !c.showOnHome)
    .filter((c) => {
      if (!catSearch) return true;
      const s = catSearch.toLowerCase();
      return (
        c.name_bn?.toLowerCase().includes(s) ||
        c.name_en?.toLowerCase().includes(s) ||
        c.slug?.toLowerCase().includes(s)
      );
    });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Homepage Section Manager"
        description="ল্যান্ডিং পেজে ক্যাটাগরি ভিত্তিক সংবাদ পিন করুন, ক্রম (সিরিয়াল) নির্ধারণ করুন এবং প্রধান হিরো স্লট কনফিগার করুন।"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank">
              <Button variant="outline" size="md" leftIcon={<ExternalLink className="w-4 h-4" />}>
                লাইভ হোমপেজ দেখুন
              </Button>
            </Link>
            {activeTab === 'categories' ? (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Save className="w-4 h-4" />}
                isLoading={isSavingCats}
                onClick={handleSaveCategories}
              >
                ক্যাটাগরি ক্রম সংরক্ষণ করুন
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Send className="w-4 h-4" />}
                isLoading={isPublishingSlots}
                onClick={handlePublishHomepageSlots}
              >
                স্লট পরিবর্তন প্রকাশ করুন
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'categories'
              ? 'border-[#1b7d95] text-[#1b7d95] dark:text-sky-400 bg-[#1b7d95]/5'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Pin className="w-4 h-4" />
          <span>ক্যাটাগরি পিন ও ক্রম (Category Sections)</span>
          <Badge variant="info" className="ml-1">
            {pinnedCategories.length}টি পিন্ড
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('slots')}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'slots'
              ? 'border-[#1b7d95] text-[#1b7d95] dark:text-sky-400 bg-[#1b7d95]/5'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>হিরো ও স্লট স্টোরিজ (Hero & Story Slots)</span>
        </button>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: CATEGORY PIN & SERIAL ORDER MANAGER                 */}
      {/* ========================================================== */}
      {activeTab === 'categories' && (
        <div className="flex flex-col gap-6">
          {/* Top Info Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1b7d95]" />
                ল্যান্ডিং পেজে ক্যাটাগরি প্রদর্শনের ক্রম ও পিন ব্যবস্থাপনা
              </h3>
              <p className="text-xs text-teal-700 dark:text-teal-300">
                নিচে পিন করা ক্যাটাগরিগুলো তাদের সিরিয়াল (১, ২, ৩...) অনুযায়ী ঢাকা পোস্ট স্টাইলে ল্যান্ডিং পেজে একের পর এক প্রদর্শিত হবে।
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save className="w-4 h-4" />}
              isLoading={isSavingCats}
              onClick={handleSaveCategories}
            >
              পরিবর্তন প্রকাশ করুন
            </Button>
          </div>

          {isLoadingCats ? (
            <TableSkeleton rows={8} />
          ) : (
            <div className="flex flex-col gap-8">
              {/* 1. PINNED CATEGORIES SECTION */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                      হোমপেজে পিন করা ক্যাটাগরিসমূহ ({pinnedCategories.length}টি)
                    </h2>
                  </div>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    ক্রম অনুযায়ী উপরে থেকে নিচে সাজানো রয়েছে
                  </span>
                </div>

                {pinnedCategories.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400">
                    বর্তমানে কোনো ক্যাটাগরি পিন করা নেই। নিচের তালিকা থেকে ক্যাটাগরি পিন করুন।
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {pinnedCategories.map((cat, idx) => (
                      <div
                        key={cat._id}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                      >
                        {/* Left: Serial Badge, Move Buttons, Name */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Serial Badge */}
                          <div className="w-10 h-10 rounded-xl bg-[#083c4d] dark:bg-teal-700 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                            {cat.homeOrder || idx + 1}
                          </div>

                          {/* Up / Down Move Buttons */}
                          <div className="flex flex-col -space-y-1 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveCategory(cat._id, 'up')}
                              className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 disabled:opacity-20 transition-colors"
                              title="উপরে সরান"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === pinnedCategories.length - 1}
                              onClick={() => handleMoveCategory(cat._id, 'down')}
                              className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 disabled:opacity-20 transition-colors"
                              title="নিচে সরান"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Category Details */}
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-base text-slate-900 dark:text-slate-100 truncate">
                                {cat.name_bn}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                ({cat.name_en || cat.slug})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <span className="font-mono text-[#1b7d95]">/{cat.slug}</span>
                              <span>•</span>
                              <Badge variant="info">{cat.postCount || 0}টি সংবাদ</Badge>
                            </div>
                          </div>
                        </div>

                        {/* Right: Layout Selector, Direct Serial Input, Unpin Button */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                          {/* Layout Selector */}
                          <div className="flex items-center gap-2 min-w-[200px] sm:min-w-[240px]">
                            <select
                              value={cat.homeLayout || 'lead-plus-list'}
                              onChange={(e) => handleLayoutChange(cat._id, e.target.value)}
                              className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1b7d95]"
                            >
                              {LAYOUT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Serial Input */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-slate-400">সিরিয়াল:</span>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={cat.homeOrder || idx + 1}
                              onChange={(e) => handleHomeOrderChange(cat._id, parseInt(e.target.value, 10))}
                              className="w-14 text-center text-sm font-bold py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1b7d95]"
                            />
                          </div>

                          {/* Unpin Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            leftIcon={<PinOff className="w-3.5 h-3.5 text-rose-500" />}
                            onClick={() => handleTogglePinCategory(cat._id)}
                            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60"
                          >
                            আনপিন
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. UNPINNED / AVAILABLE CATEGORIES SECTION */}
              <div className="flex flex-col gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                      অন্যান্য ক্যাটাগরি সমূহ ({unpinnedCategories.length}টি)
                    </h2>
                    <p className="text-xs text-slate-400">
                      হোমপেজে যোগ করতে পছন্দের ক্যাটাগরির পাশে থাকা &quot;পিন করুন&quot; বাটনে ক্লিক করুন।
                    </p>
                  </div>

                  {/* Search box */}
                  <div className="w-full sm:w-64">
                    <Input
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      placeholder="ক্যাটাগরি খুঁজুন..."
                      leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {unpinnedCategories.map((cat) => (
                    <div
                      key={cat._id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {cat.name_bn}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="font-mono">/{cat.slug}</span>
                          <span>•</span>
                          <span>{cat.postCount || 0} সংবাদ</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => handleTogglePinCategory(cat._id)}
                      >
                        পিন করুন
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: SLOTS & HERO STORIES MANAGER                        */}
      {/* ========================================================== */}
      {activeTab === 'slots' && (
        <div className="flex flex-col gap-6">
          {isLoadingSlots ? (
            <TableSkeleton rows={8} />
          ) : sections.length > 0 ? (
            <div className="flex flex-col gap-8">
              {sections.map((sec, secIdx) => (
                <div
                  key={sec.sectionKey || secIdx}
                  className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#1b7d95]/10 text-[#1b7d95] flex items-center justify-center font-bold text-sm">
                        {secIdx + 1}
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                          {sec.title}
                        </h2>
                        <p className="text-xs text-slate-400">{sec.subtitle}</p>
                      </div>
                    </div>

                    <Badge variant="purple" className="capitalize">
                      {sec.layout}
                    </Badge>
                  </div>

                  {/* Numbered Slots Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {(sec.slots || []).map((slot: any, slotIdx: number) => {
                      const isPinned = slot.isPinned && slot.postId;
                      const displayTitle = isPinned
                        ? slot.postTitle
                        : slot.autoPost?.title || 'Automatic Latest Article';
                      const displayImage = isPinned ? slot.postImage : slot.autoPost?.image;
                      const displayCategory = isPinned ? slot.postCategory : slot.autoPost?.category;

                      return (
                        <div
                          key={slotIdx}
                          className={`relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                            isPinned
                              ? 'border-[#1b7d95] bg-[#1b7d95]/5 dark:bg-[#1b7d95]/10'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                          }`}
                        >
                          {/* Slot Header badge & order buttons */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {slot.label || `Slot ${slotIdx + 1}`}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <Badge variant={isPinned ? 'info' : 'default'}>
                                {isPinned ? 'Pinned' : 'Auto'}
                              </Badge>

                              <div className="flex items-center">
                                <button
                                  type="button"
                                  disabled={slotIdx === 0}
                                  onClick={() => moveSlot(secIdx, slotIdx, 'up')}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                  title="Move left/up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={slotIdx === sec.slots.length - 1}
                                  onClick={() => moveSlot(secIdx, slotIdx, 'down')}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                  title="Move right/down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Post Thumbnail & Title */}
                          <div className="flex items-center gap-2.5">
                            {displayImage ? (
                              <div className="relative w-14 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700">
                                <Image
                                  src={displayImage}
                                  alt="Story"
                                  fill
                                  className="object-cover"
                                  sizes="60px"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="w-14 h-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-xs shrink-0">
                                Auto
                              </div>
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                                {displayTitle}
                              </span>
                              {displayCategory && (
                                <span className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {displayCategory}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Slot Actions: Pin / Change / Unpin */}
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                            {isPinned ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  fullWidth
                                  onClick={() => setPinTarget({ sectionIndex: secIdx, slotIndex: slotIdx })}
                                >
                                  Replace
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-rose-600 hover:bg-rose-50"
                                  onClick={() => handleUnpin(secIdx, slotIdx)}
                                  title="Unpin (Revert to auto)"
                                >
                                  <PinOff className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                fullWidth
                                leftIcon={<Pin className="w-3.5 h-3.5" />}
                                onClick={() => setPinTarget({ sectionIndex: secIdx, slotIndex: slotIdx })}
                              >
                                Pin Story
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">Loading homepage layouts...</div>
          )}

          {/* Pin Article Selection Modal */}
          <Modal
            isOpen={Boolean(pinTarget)}
            onClose={() => setPinTarget(null)}
            title="Pin Article to Homepage Slot"
            maxWidth="lg"
          >
            <div className="flex flex-col gap-4">
              <Input
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                placeholder="Search headline to pin..."
                leftIcon={<Search className="w-4 h-4" />}
                autoFocus
              />

              <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {isLoadingPosts ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1b7d95]" />
                  </div>
                ) : candidatePosts.length > 0 ? (
                  candidatePosts.map((post: any) => (
                    <div
                      key={post._id}
                      onClick={() => handlePinPost(post)}
                      className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {post.featuredImage?.url && (
                          <div className="relative w-12 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                            <Image
                              src={post.featuredImage.url}
                              alt={post.title}
                              fill
                              className="object-cover"
                              sizes="60px"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {post.title}
                          </span>
                          <span className="text-xs text-slate-400">
                            {post.category || 'General'} •{' '}
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <Button type="button" variant="primary" size="sm" leftIcon={<Check className="w-4 h-4" />}>
                        Pin
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No published articles matched search.
                  </div>
                )}
              </div>
            </div>
          </Modal>
        </div>
      )}
    </div>
  );
}
