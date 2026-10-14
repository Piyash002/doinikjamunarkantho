import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ArticleSiteHeader from '@/src/components/site/ArticleSiteHeader';
import { connectToDatabase } from '@/src/lib/db';
import { getPublicTrendingTopics } from '@/src/services/adminTagService';
import { getNavCategories } from '@/src/services/news';
import AdSlot from '@/src/models/AdSlot';
import Category from '@/src/models/Category';
import Post from '@/src/models/Post';
import Settings from '@/src/models/Settings';
import Tag from '@/src/models/Tag';

export const revalidate = 60;

type TopicPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
};

const BANGLA_NUMBERS: Record<string, string> = {
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

function toBanglaNumber(value: number | string): string {
  return String(value)
    .split('')
    .map((char) => BANGLA_NUMBERS[char] ?? char)
    .join('');
}

function formatBanglaDateTime(dateValue?: string | Date | null): string {
  if (!dateValue) return '';
  const d = new Date(dateValue);
  const dateStr = d.toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  });
  const timeStr = d.toLocaleTimeString('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Dhaka',
  });
  return `${dateStr}, ${timeStr}`;
}

function routeFor(categorySlug: string, postSlug: string): string {
  return `/${encodeURIComponent(categorySlug)}/${encodeURIComponent(postSlug)}`;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);

  await connectToDatabase();
  const [tag, settings] = await Promise.all([
    Tag.findOne({
      $or: [
        { slug },
        { slug: slug.toLowerCase() },
        { name: slug },
        { name: new RegExp(`^${slug}$`, 'i') },
      ],
    }).lean(),
    Settings.findOne({}).lean(),
  ]);

  const siteName = settings?.siteName || 'দৈনিক যমুনা কণ্ঠ';
  const topicName = tag?.name || slug;

  return {
    title: `${topicName} - খবর ও আপডেট | ${siteName}`,
    description:
      tag?.description ||
      `${topicName} সম্পর্কিত সব গুরুত্বপূর্ণ খবর, প্রতিবেদন ও সর্বশেষ আপডেট এক জায়গায়।`,
    openGraph: {
      title: `${topicName} - খবর ও আপডেট | ${siteName}`,
      description:
        tag?.description ||
        `${topicName} সম্পর্কিত সব গুরুত্বপূর্ণ খবর, প্রতিবেদন ও সর্বশেষ আপডেট এক জায়গায়।`,
      type: 'website',
    },
  };
}

export default async function TopicPage({ params, searchParams }: TopicPageProps) {
  const { slug: rawSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentSlug = decodeURIComponent(rawSlug);
  const currentPage = Math.max(1, parseInt(resolvedSearchParams?.page || '1', 10));
  const postsPerPage = 12;

  await connectToDatabase();

  // Find tag / topic document
  const tagDoc: any = await Tag.findOne({
    $or: [
      { slug: currentSlug },
      { slug: currentSlug.toLowerCase() },
      { name: currentSlug },
      { name: new RegExp(`^${currentSlug}$`, 'i') },
    ],
  }).lean();

  const topicName = tagDoc?.name || currentSlug;
  const topicDescription =
    tagDoc?.description ||
    `${topicName} সম্পর্কিত সব গুরুত্বপূর্ণ খবর, বিশ্লেষণ, সাক্ষাৎকার ও সর্বশেষ আপডেট এক জায়গায়।`;

  // Query posts matching this topic in their tags or title
  const postFilter: any = {
    status: 'published',
    isDeleted: { $ne: true },
    $or: [
      { tags: topicName },
      { tags: currentSlug },
      { tags: new RegExp(`^${topicName}$`, 'i') },
      { title: { $regex: topicName, $options: 'i' } },
    ],
  };

  const [
    totalPosts,
    posts,
    latestPosts,
    settings,
    navCategories,
    headerAd,
    sidebarAd,
    betweenAd,
    trendingTopics,
  ] = await Promise.all([
    Post.countDocuments(postFilter),
    Post.find(postFilter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((currentPage - 1) * postsPerPage)
      .limit(postsPerPage)
      .lean(),
    Post.find({ status: 'published', isDeleted: { $ne: true } })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(8)
      .lean(),
    Settings.findOne({}).lean(),
    getNavCategories().catch(() => []),
    AdSlot.findOne({ position: 'header-below', isActive: true }).lean(),
    AdSlot.findOne({ position: 'sidebar', isActive: true }).lean(),
    AdSlot.findOne({ position: 'between-sections', isActive: true }).lean(),
    getPublicTrendingTopics().catch(() => []),
  ]);

  if (!tagDoc && posts.length === 0) {
    notFound();
  }

  const siteName = settings?.siteName || 'দৈনিক যমুনা কণ্ঠ';
  const logoUrl = settings?.logo?.url || '/logo.png';
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  // Formatted date matching Dhaka Post screenshot: "ডেঙ্গু - October 14, 2026"
  const formattedToday = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="portal article-portal bg-[#f8fafc] dark:bg-[#0b131b] text-slate-900 dark:text-slate-100 min-h-screen">
      {/* Site Header */}
      <ArticleSiteHeader
        categories={navCategories || []}
        logoUrl={logoUrl}
        siteName={siteName}
        trendingTopics={trendingTopics || []}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4">
        {/* Top Leaderboard Ad Banner (Akij Board / Lumino style reference) */}
        <section aria-label="বিজ্ঞাপন" className="mb-6">
          {headerAd?.imageUrl ? (
            <a
              href={headerAd.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <Image
                src={headerAd.imageUrl}
                alt="বিজ্ঞাপন"
                width={1280}
                height={120}
                className="w-full h-auto max-h-[130px] object-cover"
                unoptimized
              />
            </a>
          ) : (
            <div className="relative overflow-hidden rounded-md border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 px-4 py-3 sm:px-8 sm:py-4 text-white shadow-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-sm uppercase tracking-wider">
                    AKIJ BOARD
                  </span>
                  <div>
                    <span className="text-xs text-slate-400 block">Bangladesh's First Ever</span>
                    <strong className="text-base sm:text-lg text-white font-bold tracking-wide">
                      SYNCHRO MELAMINE BOARD
                    </strong>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <span className="text-[11px] bg-white/10 px-2 py-0.5 rounded border border-white/20">
                    বিজ্ঞাপন
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Topic Header Block (Exact Match with Screenshot 3) */}
        <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-5">
          {/* Title + Date */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-slate-50 tracking-tight">
            {topicName} <span className="font-normal text-slate-500 dark:text-slate-400 text-2xl sm:text-3xl">- {formattedToday}</span>
          </h1>

          {/* Social Share Counts & Buttons */}
          <div className="flex items-center gap-2.5 mt-3.5 mb-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="px-2.5 py-1 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {toBanglaNumber(posts.length * 12 + 15)} Shares
            </span>
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center rounded-sm bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
              title="Share on Facebook"
              aria-label="Share on Facebook"
            >
              f
            </button>
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors"
              title="Share"
              aria-label="Share"
            >
              ↗
            </button>
            <button
              type="button"
              className="w-7 h-7 flex items-center justify-center rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors"
              title="Copy link"
              aria-label="Copy link"
            >
              ❐
            </button>
          </div>

          {/* Subtitle / Topic Description */}
          {topicDescription && (
            <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl">
              {topicDescription}
            </p>
          )}
        </header>

        {/* Main Content Area: 2 Columns (Left: Articles List, Right: Sidebar) */}
        {posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg p-12 text-center border border-slate-200 dark:border-slate-800 my-8">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
              "{topicName}" সংক্রান্ত কোনো প্রতিবেদন পাওয়া যায়নি
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              অন্য কোনো বিষয় খুঁজুন অথবা হোমপেজে ফিরে যান।
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-md transition-colors"
            >
              হোমপেজে ফিরে যান
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Topic Articles List (Matching Screenshot 3) */}
            <main className="lg:col-span-8 flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
              {posts.map((story) => {
                const storyUrl = routeFor(story.category || 'national', story.slug);
                const imageUrl = story.featuredImage?.url || FALLBACK_IMAGE;

                return (
                  <article
                    key={String(story._id)}
                    className="py-5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group"
                  >
                    {/* Copy Left */}
                    <div className="flex-1 min-w-0">
                      <Link href={storyUrl} className="block">
                        <h2 className="text-lg sm:text-xl font-bold leading-snug text-slate-950 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {story.title}
                        </h2>
                      </Link>

                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>{formatBanglaDateTime(story.publishedAt || story.createdAt)}</span>
                        {story.category && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {story.category}
                            </span>
                          </>
                        )}
                      </div>

                      {story.excerpt && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                          {story.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Image Right (Screenshot 3 style) */}
                    <Link
                      href={storyUrl}
                      className="shrink-0 w-[140px] sm:w-[175px] h-[95px] sm:h-[115px] relative rounded-xs overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-xs"
                    >
                      <Image
                        src={imageUrl}
                        alt={story.title}
                        fill
                        sizes="175px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    </Link>
                  </article>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <nav
                  aria-label="পৃষ্ঠা পরিবর্তন"
                  className="flex items-center justify-center gap-1.5 pt-8 pb-4"
                >
                  {currentPage > 1 && (
                    <Link
                      href={`/topic/${encodeURIComponent(currentSlug)}?page=${currentPage - 1}`}
                      className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      « পূর্ববর্তী
                    </Link>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isActive = pageNum === currentPage;
                    return (
                      <Link
                        key={pageNum}
                        href={`/topic/${encodeURIComponent(currentSlug)}?page=${pageNum}`}
                        className={`min-w-[36px] h-[36px] flex items-center justify-center text-sm font-bold rounded border transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {toBanglaNumber(pageNum)}
                      </Link>
                    );
                  })}

                  {currentPage < totalPages && (
                    <Link
                      href={`/topic/${encodeURIComponent(currentSlug)}?page=${currentPage + 1}`}
                      className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      পরবর্তী »
                    </Link>
                  )}
                </nav>
              )}
            </main>

            {/* Right Column: Sidebar (Screenshot 3 style) */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
              {/* "সর্বশেষ" Widget */}
              <div className="bg-white dark:bg-slate-900 rounded-md p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-2 mb-3.5 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    সর্বশেষ
                  </h3>
                  <Link
                    href="/latest"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    সব দেখুন →
                  </Link>
                </div>

                <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
                  {latestPosts.map((item) => {
                    const itemUrl = routeFor(item.category || 'national', item.slug);
                    const itemImg = item.featuredImage?.url || FALLBACK_IMAGE;

                    return (
                      <article
                        key={String(item._id)}
                        className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                      >
                        <div className="flex-1 min-w-0">
                          <Link href={itemUrl} className="block">
                            <h4 className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                              {item.title}
                            </h4>
                          </Link>
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            {formatBanglaDateTime(item.publishedAt || item.createdAt)}
                          </span>
                        </div>

                        <Link
                          href={itemUrl}
                          className="shrink-0 w-[72px] h-[50px] relative rounded-xs overflow-hidden bg-slate-100 dark:bg-slate-800"
                        >
                          <Image
                            src={itemImg}
                            alt={item.title}
                            fill
                            sizes="72px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Display Ad (Akij Board style banner from Screenshot 3) */}
              <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                {sidebarAd?.imageUrl ? (
                  <a
                    href={sidebarAd.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative"
                  >
                    <Image
                      src={sidebarAd.imageUrl}
                      alt="বিজ্ঞাপন"
                      width={380}
                      height={320}
                      className="w-full h-auto object-cover"
                      unoptimized
                    />
                    <span className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                      Ad
                    </span>
                  </a>
                ) : (
                  <div className="p-5 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white relative">
                    <span className="absolute top-2 right-2 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded">
                      বিজ্ঞাপন
                    </span>
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                      AKIJ BOARD • LUMINO
                    </span>
                    <strong className="text-lg sm:text-xl font-bold block mt-1 tracking-tight">
                      SYNCHRO MELAMINE BOARD
                    </strong>
                    <p className="text-xs text-slate-300 mt-2">
                      Now you can feel the natural wooden texture in your interior.
                    </p>
                    <div className="mt-4">
                      <span className="inline-block bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-sm">
                        Explore Collection →
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        {/* Bottom Banner Ad */}
        <section aria-label="বিজ্ঞাপন" className="mt-10 mb-8">
          {betweenAd?.imageUrl ? (
            <a
              href={betweenAd.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 shadow-xs"
            >
              <Image
                src={betweenAd.imageUrl}
                alt="বিজ্ঞাপন"
                width={1280}
                height={140}
                className="w-full h-auto max-h-[140px] object-cover"
                unoptimized
              />
            </a>
          ) : (
            <div className="relative overflow-hidden rounded-md border border-amber-300/40 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-amber-950/40 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                    ফ্রেশ
                  </span>
                  <strong className="text-lg sm:text-2xl font-extrabold text-amber-950 dark:text-amber-100">
                    সরিষার তেল
                  </strong>
                  <span className="hidden md:inline-block text-slate-400">•</span>
                  <span className="hidden md:inline-block text-base sm:text-xl font-bold text-amber-800 dark:text-amber-300 italic">
                    বাংলার সেই স্বাদ
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 bg-white/70 dark:bg-black/40 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  বিজ্ঞাপন
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 mt-12 text-slate-600 dark:text-slate-400 text-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} {siteName}। সর্বস্বত্ব সংরক্ষিত।</span>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:underline">হোম</Link>
              <Link href="/privacy" className="hover:underline">গোপনীয়তা নীতি</Link>
              <Link href="/contact" className="hover:underline">যোগাযোগ</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
