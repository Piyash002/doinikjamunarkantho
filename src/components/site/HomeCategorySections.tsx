'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Clock, MapPin, Search } from 'lucide-react';

export interface CategoryPostItem {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  featuredImage?: { url?: string } | null;
  image?: string;
  views?: number;
  publishedAt?: string | Date | null;
  createdAt?: string | Date | null;
}

export interface CategorySectionItem {
  _id: string;
  name_bn: string;
  name_en?: string;
  slug: string;
  homeOrder: number;
  homeLayout?: string;
  posts: CategoryPostItem[];
}

interface HomeCategorySectionsProps {
  sections: CategorySectionItem[];
  siteName?: string;
}

const BD_DIVISIONS = [
  'ঢাকা',
  'চট্টগ্রাম',
  'রাজশাহী',
  'খুলনা',
  'বরিশাল',
  'সিলেট',
  'রংপুর',
  'ময়মনসিংহ',
];

function toBanglaNumber(value: number | string) {
  const map: Record<string, string> = {
    0: '০',
    1: '১',
    2: '২',
    3: '৩',
    4: '৪',
    5: '৫',
    6: '৬',
    7: '৭',
    8: '৮',
    9: '৯',
  };
  return String(value)
    .split('')
    .map((char) => map[char] ?? char)
    .join('');
}

function formatRelativeTime(dateValue?: string | Date | null) {
  if (!dateValue) return 'এইমাত্র';
  const date = new Date(dateValue);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  const hours = Math.max(0, Math.round(diffMs / 3600000));
  const days = Math.max(0, Math.round(diffMs / 86400000));

  if (minutes < 60) return `${toBanglaNumber(minutes || 1)} মিনিট আগে`;
  if (hours < 24) return `${toBanglaNumber(hours)} ঘণ্টা আগে`;
  if (days < 7) return `${toBanglaNumber(days)} দিন আগে`;

  return date.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getStoryUrl(post: CategoryPostItem, categorySlug: string) {
  const identifier = post.slug || post._id;
  const cat = categorySlug || 'news';
  return `/${encodeURIComponent(cat)}/${encodeURIComponent(identifier)}`;
}

function getPostImageUrl(post: CategoryPostItem, fallbackIndex = 0) {
  if (post.featuredImage?.url) return post.featuredImage.url;
  if (post.image) return post.image;

  const fallbacks = [
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=1200&q=80',
  ];
  return fallbacks[fallbackIndex % fallbacks.length];
}

export default function HomeCategorySections({ sections }: HomeCategorySectionsProps) {
  const [selectedDivision, setSelectedDivision] = useState('');

  if (!sections || sections.length === 0) {
    return null;
  }

  // Sort sections strictly by homeOrder ASC
  const sortedSections = [...sections].sort((a, b) => (a.homeOrder || 0) - (b.homeOrder || 0));

  return (
    <div className="home-category-sections w-full flex flex-col gap-10 sm:gap-14 my-8">
      {sortedSections.map((section, sectionIdx) => {
        const posts = section.posts || [];
        const layout = section.homeLayout || 'lead-plus-list';
        const categoryUrl = `/${encodeURIComponent(section.slug)}`;
        const isSarades = section.slug === 'sarades' || section.name_bn.includes('সারাদেশ');

        return (
          <section
            key={section._id || section.slug || sectionIdx}
            className="w-full bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-xs transition-colors"
            aria-label={section.name_bn}
          >
            {/* Dhaka Post Style Category Header */}
            <div className="flex items-center justify-between pb-3.5 mb-5 border-b-2 border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {/* Thick Left Brand Accent Bar */}
                <span className="w-1.5 h-6 sm:h-7 rounded-full bg-[#083c4d] dark:bg-teal-400" />
                <Link
                  href={categoryUrl}
                  className="group flex items-center gap-1.5 text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 hover:text-[#1b7d95] dark:hover:text-teal-400 tracking-tight transition-colors"
                >
                  <span>{section.name_bn}</span>
                </Link>
              </div>

              <Link
                href={categoryUrl}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#1b7d95] dark:text-teal-400 hover:text-[#083c4d] dark:hover:text-teal-300 hover:underline transition-colors"
              >
                <span>আরও দেখুন</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Special District Search Filter for Saradesh (Screenshot 2 Style) */}
            {isSarades && (
              <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-[#1b7d95]" />
                  <span>বিভাগ ভিত্তিক সংবাদ:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {BD_DIVISIONS.map((div) => (
                    <Link
                      key={div}
                      href={`/sarades?division=${encodeURIComponent(div)}`}
                      className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#1b7d95] hover:text-[#1b7d95] font-medium transition-all"
                    >
                      {div}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* If no posts published in this category yet */}
            {posts.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <p className="text-sm font-medium">এই বিভাগে সম্প্রতি কোনো সংবাদ প্রকাশিত হয়নি।</p>
                <Link
                  href={categoryUrl}
                  className="mt-2 text-xs text-[#1b7d95] hover:underline font-bold"
                >
                  বিভাগ পেজ দেখুন →
                </Link>
              </div>
            ) : layout === 'grid-4' ? (
              /* ========================================================== */
              /* LAYOUT 2: Grid-4 Layout (Like Screenshot 2 - সারাদেশ)       */
              /* ========================================================== */
              <div className="flex flex-col gap-6">
                {/* Big Lead Story */}
                {posts[0] && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="lg:col-span-7">
                      <Link
                        href={getStoryUrl(posts[0], section.slug)}
                        className="group relative block aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800"
                      >
                        <Image
                          src={getPostImageUrl(posts[0], 0)}
                          alt={posts[0].title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 1024px) 100vw, 60vw"
                          unoptimized
                        />
                      </Link>
                    </div>
                    <div className="lg:col-span-5 flex flex-col justify-center">
                      <Link href={getStoryUrl(posts[0], section.slug)} className="group">
                        <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 group-hover:text-[#1b7d95] dark:group-hover:text-teal-400 transition-colors leading-snug">
                          {posts[0].title}
                        </h3>
                      </Link>
                      {posts[0].excerpt && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mt-2.5 leading-relaxed">
                          {posts[0].excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-3 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatRelativeTime(posts[0].publishedAt || posts[0].createdAt)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4 Bottom Cards Grid */}
                {posts.length > 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {posts.slice(1, 5).map((post, idx) => (
                      <article
                        key={post._id || idx}
                        className="group flex flex-col gap-2.5 bg-slate-50/60 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                      >
                        <Link
                          href={getStoryUrl(post, section.slug)}
                          className="relative aspect-[16/10] w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 block"
                        >
                          <Image
                            src={getPostImageUrl(post, idx + 1)}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 25vw"
                            unoptimized
                          />
                        </Link>
                        <Link href={getStoryUrl(post, section.slug)}>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1b7d95] dark:group-hover:text-teal-400 line-clamp-2 leading-snug">
                            {post.title}
                          </h4>
                        </Link>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-auto">
                          {formatRelativeTime(post.publishedAt || post.createdAt)}
                        </span>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : layout === 'entertainment-3col' ? (
              /* ========================================================== */
              /* LAYOUT 3: Entertainment 3-Col (Like Screenshot 4 - বিনোদন) */
              /* ========================================================== */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                {/* Left Column: 3 News Items with Thumbnails */}
                <div className="lg:col-span-3 flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                  {posts.slice(1, 4).map((post, idx) => (
                    <article key={post._id || idx} className="group py-3 first:pt-0 last:pb-0">
                      <Link
                        href={getStoryUrl(post, section.slug)}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1b7d95] dark:group-hover:text-teal-400 line-clamp-2 leading-snug">
                            {post.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            {formatRelativeTime(post.publishedAt || post.createdAt)}
                          </span>
                        </div>
                        <div className="relative w-20 h-16 sm:w-22 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                          <Image
                            src={getPostImageUrl(post, idx + 1)}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="90px"
                            unoptimized
                          />
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>

                {/* Center Column: Big Featured Lead Card */}
                <div className="lg:col-span-6 flex flex-col">
                  {posts[0] && (
                    <article className="group flex flex-col h-full">
                      <Link
                        href={getStoryUrl(posts[0], section.slug)}
                        className="relative aspect-[16/11] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 block shadow-xs"
                      >
                        <Image
                          src={getPostImageUrl(posts[0], 0)}
                          alt={posts[0].title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          unoptimized
                        />
                      </Link>
                      <Link href={getStoryUrl(posts[0], section.slug)} className="mt-3">
                        <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100 group-hover:text-[#1b7d95] dark:group-hover:text-teal-400 transition-colors leading-snug">
                          {posts[0].title}
                        </h3>
                      </Link>
                      {posts[0].excerpt && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                          {posts[0].excerpt}
                        </p>
                      )}
                      <span className="text-xs text-slate-400 mt-2 block font-medium">
                        {formatRelativeTime(posts[0].publishedAt || posts[0].createdAt)}
                      </span>
                    </article>
                  )}
                </div>

                {/* Right Column: 3 News Items with Thumbnails */}
                <div className="lg:col-span-3 flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                  {posts.slice(4, 7).map((post, idx) => (
                    <article key={post._id || idx} className="group py-3 first:pt-0 last:pb-0">
                      <Link
                        href={getStoryUrl(post, section.slug)}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1b7d95] dark:group-hover:text-teal-400 line-clamp-2 leading-snug">
                            {post.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            {formatRelativeTime(post.publishedAt || post.createdAt)}
                          </span>
                        </div>
                        <div className="relative w-20 h-16 sm:w-22 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800">
                          <Image
                            src={getPostImageUrl(post, idx + 4)}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="90px"
                            unoptimized
                          />
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            ) : layout === 'sports-3col' ? (
              /* ========================================================== */
              /* LAYOUT 4: Sports 3-Col (খেলাধুলা স্টাইল)                     */
              /* ========================================================== */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {posts.slice(0, 3).map((post, idx) => (
                  <article
                    key={post._id || idx}
                    className="group flex flex-col gap-3 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800/40 p-3.5 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all shadow-xs"
                  >
                    <Link
                      href={getStoryUrl(post, section.slug)}
                      className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 block"
                    >
                      <Image
                        src={getPostImageUrl(post, idx)}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#083c4d]/90 text-white backdrop-blur-xs">
                        {section.name_bn}
                      </span>
                    </Link>
                    <Link href={getStoryUrl(post, section.slug)}>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1b7d95] dark:group-hover:text-teal-400 line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                    </Link>
                    {post.excerpt && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="text-[11px] text-slate-400 mt-auto">
                      {formatRelativeTime(post.publishedAt || post.createdAt)}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              /* ========================================================== */
              /* LAYOUT 1: Lead + List (Screenshot 1: জাতীয় & 3: আন্তর্জাতিক)*/
              /* ========================================================== */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 7 Columns: Big Featured Lead Story */}
                <div className="lg:col-span-7 flex flex-col">
                  {posts[0] && (
                    <article className="group flex flex-col">
                      <Link
                        href={getStoryUrl(posts[0], section.slug)}
                        className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 block shadow-xs"
                      >
                        <Image
                          src={getPostImageUrl(posts[0], 0)}
                          alt={posts[0].title}
                          fill
                          priority={sectionIdx === 0}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 1024px) 100vw, 60vw"
                          unoptimized
                        />
                      </Link>
                      <Link href={getStoryUrl(posts[0], section.slug)} className="mt-3.5">
                        <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 group-hover:text-[#1b7d95] dark:group-hover:text-teal-400 transition-colors leading-snug">
                          {posts[0].title}
                        </h3>
                      </Link>
                      {posts[0].excerpt && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mt-2 leading-relaxed">
                          {posts[0].excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-2.5 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatRelativeTime(posts[0].publishedAt || posts[0].createdAt)}</span>
                      </div>
                    </article>
                  )}
                </div>

                {/* Right 5 Columns: 3-4 List Items with Right Thumbnails */}
                <div className="lg:col-span-5 flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                  {posts.slice(1, 5).map((post, idx) => (
                    <article
                      key={post._id || idx}
                      className="group py-3.5 first:pt-0 last:pb-0"
                    >
                      <Link
                        href={getStoryUrl(post, section.slug)}
                        className="flex items-center justify-between gap-3 sm:gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#1b7d95] dark:group-hover:text-teal-400 line-clamp-2 leading-snug transition-colors">
                            {post.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 mt-1.5 block font-medium">
                            {formatRelativeTime(post.publishedAt || post.createdAt)}
                          </span>
                        </div>

                        <div className="relative w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-800 shadow-xs">
                          <Image
                            src={getPostImageUrl(post, idx + 1)}
                            alt={post.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="120px"
                            unoptimized
                          />
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
