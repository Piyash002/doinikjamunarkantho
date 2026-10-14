'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
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
} from 'lucide-react';

import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Modal } from '@/src/components/admin/ui/Modal';
import { Badge } from '@/src/components/admin/ui/Badge';
import { Input } from '@/src/components/admin/ui/Input';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { useToast } from '@/src/components/admin/ui/Toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HomepageManagerPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/homepage', fetcher);
  const { success: toastSuccess, error: toastError } = useToast();

  const [sections, setSections] = useState<any[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // Search & Pin modal state
  const [pinTarget, setPinTarget] = useState<{ sectionIndex: number; slotIndex: number } | null>(null);
  const [postSearch, setPostSearch] = useState('');
  const { data: postsData, isLoading: isLoadingPosts } = useSWR(
    pinTarget ? `/api/admin/posts?search=${encodeURIComponent(postSearch)}&status=published&limit=15` : null,
    fetcher
  );

  const candidatePosts = postsData?.success && Array.isArray(postsData.data) ? postsData.data : [];

  // Sync SWR data to local state
  React.useEffect(() => {
    if (data?.success && Array.isArray(data.data)) {
      setSections(data.data);
    }
  }, [data]);

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

    // re-index slot indices
    slots.forEach((s, idx) => (s.slotIndex = idx + 1));
    nextSections[sectionIndex].slots = slots;
    setSections(nextSections);
  }

  async function handlePublishHomepage() {
    try {
      setIsPublishing(true);
      const res = await fetch('/api/admin/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to publish homepage layout.');

      mutate();
      toastSuccess('Homepage layout published and live site revalidated!');
    } catch (err: any) {
      toastError(err.message || 'Publishing failed.');
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Homepage Section Manager"
        description="Configure editorial layout slots, pin lead articles, reorder stories, and instantly publish updates."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank">
              <Button variant="outline" size="md" leftIcon={<ExternalLink className="w-4 h-4" />}>
                View Live Home
              </Button>
            </Link>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Send className="w-4 h-4" />}
              isLoading={isPublishing}
              onClick={handlePublishHomepage}
            >
              Publish Changes
            </Button>
          </div>
        }
      />

      {/* Main Sections List */}
      {isLoading ? (
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
                  const displayTitle = isPinned ? slot.postTitle : slot.autoPost?.title || 'Automatic Latest Article';
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
                            <Image src={displayImage} alt="Story" fill className="object-cover" sizes="60px" unoptimized />
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
                        <Image src={post.featuredImage.url} alt={post.title} fill className="object-cover" sizes="60px" unoptimized />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {post.title}
                      </span>
                      <span className="text-xs text-slate-400">
                        {post.category || 'General'} • {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <Button type="button" variant="primary" size="sm" leftIcon={<Check className="w-4 h-4" />}>
                    Pin
                  </Button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">No published articles matched search.</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
