import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ArticleSiteHeader from '@/src/components/site/ArticleSiteHeader';
import { connectToDatabase } from '@/src/lib/db';
import { getPublicTrendingTopics } from '@/src/services/adminTagService';
import AdSlot from '@/src/models/AdSlot';
import Category from '@/src/models/Category';
import Post from '@/src/models/Post';
import Settings from '@/src/models/Settings';

export const revalidate = 60;

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams?: Promise<{ page?: string; sub?: string }>;
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

function formatRelativeTime(dateValue?: string | Date | null): string {
  if (!dateValue) return 'এইমাত্র';
  const diffMs = Date.now() - new Date(dateValue).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  const hours = Math.max(0, Math.round(diffMs / 3600000));
  const days = Math.max(0, Math.round(diffMs / 86400000));

  if (minutes < 60) return `${toBanglaNumber(minutes || 1)} মিনিট আগে`;
  if (hours < 24) return `${toBanglaNumber(hours)} ঘণ্টা আগে`;
  if (days < 30) return `${toBanglaNumber(days)} দিন আগে`;

  return new Date(dateValue).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function parseKickerAndTitle(
  fullTitle: string,
  subCategory?: string,
  lead?: string
): { kicker: string; title: string } {
  const trimmed = fullTitle.trim();

  // If title has a slash (e.g. "রাষ্ট্রপতি/তরুণ সমাজ ও শিক্ষার্থীদের...")
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    const kicker = parts[0].trim();
    const title = parts.slice(1).join('/').trim();
    if (kicker && title) {
      return { kicker, title };
    }
  }

  // If subCategory exists, use as kicker
  if (subCategory && subCategory.trim()) {
    return { kicker: subCategory.trim(), title: trimmed };
  }

  // If short lead text (<= 25 chars), use as kicker
  if (lead && lead.trim() && lead.trim().length <= 25 && !lead.includes('<')) {
    return { kicker: lead.trim(), title: trimmed };
  }

  return { kicker: '', title: trimmed };
}

function routeFor(categorySlug: string, postSlug: string): string {
  return `/${encodeURIComponent(categorySlug)}/${encodeURIComponent(postSlug)}`;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';

// Contextual subcategory fallbacks when none are yet in the database
const DEFAULT_SUBCATEGORIES_MAP: Record<string, string[]> = {
  national: ['চট্টগ্রামের খবর', 'জাতীয় সংসদ', 'রাজধানীর খবর', 'আইন ও বিচার'],
  politics: ['আওয়ামী লীগ', 'বিএনপি', 'জাতীয় পার্টি', 'নির্বাচন', 'অন্যান্য দল'],
  economy: ['ব্যাংক ও বিমা', 'শেয়ারবাজার', 'বাণিজ্য', 'বাজেট', 'শিল্প ও কৃষি'],
  international: ['ভারত', 'মধ্যপ্রাচ্য', 'আমেরিকা', 'ইউরোপ', 'চীন ও এশিয়া'],
  sports: ['ক্রিকেট', 'ফুটবল', 'টেনিস', 'বিশ্বকাপ', 'অন্যান্য খেলা'],
  entertainment: ['বলিউড', 'ঢালিউড', 'হলিউড', 'নাটক ও ওটিটি', 'গান'],
  sarades: ['ঢাকা বিভাগ', 'চট্টগ্রাম বিভাগ', 'রাজশাহী বিভাগ', 'খুলনা বিভাগ', 'সিলেট বিভাগ'],
  technology: ['মোবাইল', 'ইন্টারনেট', 'কৃত্রিম বুদ্ধিমত্তা', 'বিজ্ঞান ও মহাকাশ'],
  health: ['পুষ্টি ও খাদ্য', 'রোগ প্রতিরোধ', 'চিকিৎসা সেবা', 'মানসিক স্বাস্থ্য'],
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const slug = decodeURIComponent(rawCategory);

  await connectToDatabase();
  const [cat, settings] = await Promise.all([
    Category.findOne({
      isActive: true,
      $or: [
        { slug },
        { slug: slug.toLowerCase() },
        { name_en: new RegExp(`^${slug}$`, 'i') },
        { name_bn: slug },
      ],
    }).lean(),
    Settings.findOne({}).lean(),
  ]);

  const siteName = settings?.siteName || 'দৈনিক যমুনা কণ্ঠ';
  const categoryName = cat?.name_bn || (slug === 'all' || slug === 'latest' ? 'সর্বশেষ' : slug);

  return {
    title: `${categoryName} খবর - ${siteName}`,
    description: `${categoryName} বিভাগের সর্বশেষ সংবাদ, বিশ্লেষণ ও ভিডিও প্রতিবেদন।`,
    openGraph: {
      title: `${categoryName} খবর - ${siteName}`,
      description: `${categoryName} বিভাগের সর্বশেষ সংবাদ ও প্রতিবেদন।`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { category: rawCategory } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentCategorySlug = decodeURIComponent(rawCategory);
  const selectedSub = resolvedSearchParams?.sub ? decodeURIComponent(resolvedSearchParams.sub) : '';
  const currentPage = Math.max(1, parseInt(resolvedSearchParams?.page || '1', 10));
  const postsPerPage = 13; // 1 lead + 4 secondary + 8 serial list

  await connectToDatabase();

  const isAllOrLatest =
    currentCategorySlug === 'all' ||
    currentCategorySlug === 'latest' ||
    currentCategorySlug === 'সর্বশেষ';

  // 1. Resolve Category
  let categoryDoc: any = null;
  if (!isAllOrLatest) {
    categoryDoc = await Category.findOne({
      isActive: true,
      $or: [
        { slug: currentCategorySlug },
        { slug: currentCategorySlug.toLowerCase() },
        { name_en: new RegExp(`^${currentCategorySlug}$`, 'i') },
        { name_bn: currentCategorySlug },
      ],
    }).lean();

    // If not found in Category collection, check if posts exist under this category
    if (!categoryDoc) {
      const existsInPosts = await Post.exists({
        status: 'published',
        isDeleted: { $ne: true },
        $or: [{ category: currentCategorySlug }, { subCategory: currentCategorySlug }],
      });
      if (existsInPosts) {
        categoryDoc = {
          name_bn: currentCategorySlug,
          name_en: currentCategorySlug,
          slug: currentCategorySlug,
        };
      } else {
        notFound();
      }
    }
  }

  const categoryName = isAllOrLatest ? 'সর্বশেষ' : categoryDoc?.name_bn || currentCategorySlug;
  const canonicalSlug = isAllOrLatest ? 'latest' : categoryDoc?.slug || currentCategorySlug;

  // 2. Fetch Subcategories
  let subCategoriesList: string[] = [];
  if (categoryDoc?._id) {
    const dbSubCats = await Category.find({
      parent: categoryDoc._id,
      isActive: true,
    })
      .sort({ order: 1 })
      .lean();

    if (dbSubCats.length > 0) {
      subCategoriesList = dbSubCats.map((sc) => sc.name_bn);
    }
  }

  // Fallback subcategories if none configured in DB
  if (subCategoriesList.length === 0 && DEFAULT_SUBCATEGORIES_MAP[canonicalSlug]) {
    subCategoriesList = DEFAULT_SUBCATEGORIES_MAP[canonicalSlug];
  }

  // 3. Build Post Query
  const postFilter: any = {
    status: 'published',
    isDeleted: { $ne: true },
  };

  if (!isAllOrLatest && categoryDoc) {
    const matchingIdentifiers = [
      categoryDoc.slug,
      categoryDoc.name_bn,
      categoryDoc.name_en?.toLowerCase(),
      categoryDoc._id ? String(categoryDoc._id) : '',
    ].filter(Boolean);

    if (selectedSub) {
      postFilter.$and = [
        {
          $or: [
            { category: { $in: matchingIdentifiers } },
            { subCategory: { $in: matchingIdentifiers } },
          ],
        },
        { subCategory: selectedSub },
      ];
    } else {
      postFilter.$or = [
        { category: { $in: matchingIdentifiers } },
        { subCategory: { $in: matchingIdentifiers } },
      ];
    }
  } else if (selectedSub) {
    postFilter.subCategory = selectedSub;
  }

  // 4. Parallel Data Fetching
  const [
    totalPosts,
    posts,
    latestPosts,
    popularPosts,
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
    Post.find({ status: 'published', isDeleted: { $ne: true } })
      .sort({ views: -1, publishedAt: -1 })
      .limit(5)
      .lean(),
    Settings.findOne({}).lean(),
    Category.find({ isActive: true, showInNav: true }).sort({ order: 1 }).lean(),
    AdSlot.findOne({ position: 'header-below', isActive: true }).lean(),
    AdSlot.findOne({ position: 'sidebar', isActive: true }).lean(),
    AdSlot.findOne({ position: 'between-sections', isActive: true }).lean(),
    getPublicTrendingTopics().catch(() => []),
  ]);

  const siteName = settings?.siteName || 'দৈনিক যমুনা কণ্ঠ';
  const logoUrl = settings?.logo?.url || '/logo.png';
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  // Split stories into sections:
  // Lead Story (1)
  const leadStory = posts[0] || null;
  // Secondary Stories Grid (4)
  const secondaryStories = posts.slice(1, 5);
  // Serial News Stream (Remaining on current page)
  const serialStories = posts.slice(5);

  return (
    <div className="portal article-portal bg-[#f8fafc] dark:bg-[#0b131b] text-slate-900 dark:text-slate-100 min-h-screen">
      {/* Site Header */}
      <ArticleSiteHeader
        activeSlug={canonicalSlug}
        categories={navCategories.map((c) => ({ name_bn: c.name_bn, slug: c.slug }))}
        logoUrl={logoUrl}
        siteName={siteName}
        trendingTopics={trendingTopics || []}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4">
        {/* Top Leaderboard Ad Banner (e.g. SUPER BOARD reference) */}
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
            <div className="relative overflow-hidden rounded-md border border-emerald-700/30 bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 px-4 py-3 sm:px-8 sm:py-4 text-white shadow-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className="bg-amber-400 text-emerald-950 font-black text-xs px-2.5 py-1 rounded-sm uppercase tracking-wider shadow-xs">
                    SUPER BOARD
                  </span>
                  <div>
                    <span className="text-xs sm:text-sm text-emerald-200 block">বাংলাদেশে সর্বপ্রথম ও একমাত্র</span>
                    <strong className="text-base sm:text-lg text-white font-bold tracking-wide">
                      ই-জিরো (E0) পণ্য
                    </strong>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-emerald-200/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/40">
                    স্পনসরড
                  </span>
                  <span className="hidden md:inline-block text-xs font-semibold text-amber-300 hover:text-white transition-colors cursor-pointer">
                    বিস্তারিত জানুন →
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Category Heading & Subcategories Bar (Exact Dhaka Post Reference) */}
        <header className="mb-6">
          <div className="flex items-baseline justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {categoryName}
            </h1>
            <span className="text-xs text-slate-400 font-medium">
              মোট {toBanglaNumber(totalPosts)}টি প্রতিবেদন
            </span>
          </div>

          {/* Subcategories Horizontal Bar */}
          {subCategoriesList.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto py-2.5 text-sm scrollbar-none border-b border-slate-100 dark:border-slate-800/60">
              <Link
                href={`/${encodeURIComponent(canonicalSlug)}`}
                className={`shrink-0 font-medium transition-colors ${
                  !selectedSub
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300'
                }`}
              >
                সব
              </Link>
              {subCategoriesList.map((subName) => {
                const isSelected = selectedSub === subName;
                return (
                  <div key={subName} className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <Link
                      href={`/${encodeURIComponent(canonicalSlug)}?sub=${encodeURIComponent(subName)}`}
                      className={`transition-colors whitespace-nowrap ${
                        isSelected
                          ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-600 pb-0.5'
                          : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      {subName}
                    </Link>
                  </div>
                );
              })}
              {selectedSub && (
                <Link
                  href={`/${encodeURIComponent(canonicalSlug)}`}
                  className="ml-auto text-xs text-rose-500 hover:underline shrink-0"
                >
                  ফিল্টার মুছুন ✕
                </Link>
              )}
            </div>
          )}
        </header>

        {/* Main Content Area: 2 Columns (Left 8 cols ~ 70%, Right 4 cols ~ 30%) */}
        {posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg p-12 text-center border border-slate-200 dark:border-slate-800 my-8">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
              এই বিভাগে এখনো কোনো প্রতিবেদন প্রকাশিত হয়নি
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              অন্য কোনো বিভাগ দেখুন অথবা হোমপেজে ফিরে যান।
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
            {/* Left Column (Main News Area) */}
            <main className="lg:col-span-8 flex flex-col gap-8">
              {/* 1. Lead / Hero Story (Split 2-Column: Title & Excerpt Left, Large Image Right) */}
              {leadStory && (
                <article className="bg-white dark:bg-slate-900 rounded-md p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  {(() => {
                    const { kicker, title } = parseKickerAndTitle(
                      leadStory.title,
                      leadStory.subCategory,
                      leadStory.lead
                    );
                    const leadUrl = routeFor(leadStory.category || canonicalSlug, leadStory.slug);
                    const imageUrl = leadStory.featuredImage?.url || FALLBACK_IMAGE;

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                        {/* Copy / Title Left */}
                        <div className="md:col-span-7 flex flex-col justify-between">
                          <div>
                            <Link href={leadUrl} className="group block">
                              <h2 className="text-xl sm:text-2xl font-bold leading-snug text-slate-950 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {kicker && (
                                  <span className="text-blue-600 dark:text-blue-400 font-bold mr-1.5">
                                    {kicker}/
                                  </span>
                                )}
                                {title}
                              </h2>
                            </Link>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed line-clamp-3">
                              {leadStory.lead || leadStory.excerpt || 'বিস্তারিত প্রতিবেদন পড়তে ক্লিক করুন...'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 mt-4 text-xs text-slate-400 font-medium">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {leadStory.category || categoryName}
                            </span>
                            <span>•</span>
                            <span>{formatRelativeTime(leadStory.publishedAt || leadStory.createdAt)}</span>
                          </div>
                        </div>

                        {/* Image Right */}
                        <div className="md:col-span-5">
                          <Link href={leadUrl} className="group block overflow-hidden rounded-sm aspect-[16/10] relative bg-slate-100 dark:bg-slate-800">
                            <Image
                              src={imageUrl}
                              alt={leadStory.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 400px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                              priority
                            />
                          </Link>
                        </div>
                      </div>
                    );
                  })()}
                </article>
              )}

              {/* 2. Secondary Stories Grid (2 Columns, 4 Cards - Exactly Matching Reference) */}
              {secondaryStories.length > 0 && (
                <section aria-label="গুরুত্বপূর্ণ সংবাদ" className="border-t border-slate-200 dark:border-slate-800 pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                    {secondaryStories.map((story) => {
                      const { kicker, title } = parseKickerAndTitle(
                        story.title,
                        story.subCategory,
                        story.lead
                      );
                      const storyUrl = routeFor(story.category || canonicalSlug, story.slug);
                      const imageUrl = story.featuredImage?.url || FALLBACK_IMAGE;

                      return (
                        <article
                          key={String(story._id)}
                          className="flex items-start justify-between gap-3.5 pb-4 border-b border-slate-200/70 dark:border-slate-800/80 group"
                        >
                          {/* Text Left */}
                          <div className="flex-1 min-w-0">
                            <Link href={storyUrl} className="block">
                              <h3 className="text-base sm:text-[17px] font-bold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-3">
                                {kicker && (
                                  <span className="text-blue-600 dark:text-blue-400 font-bold mr-1">
                                    {kicker}/
                                  </span>
                                )}
                                {title}
                              </h3>
                            </Link>
                            <span className="text-xs text-slate-400 mt-2 block">
                              {formatRelativeTime(story.publishedAt || story.createdAt)}
                            </span>
                          </div>

                          {/* Thumbnail Right */}
                          <Link
                            href={storyUrl}
                            className="shrink-0 w-[120px] sm:w-[130px] h-[80px] sm:h-[85px] relative rounded-xs overflow-hidden bg-slate-100 dark:bg-slate-800"
                          >
                            <Image
                              src={imageUrl}
                              alt={story.title}
                              fill
                              sizes="130px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 3. Serial News Stream (Remaining News Under This Category) */}
              {serialStories.length > 0 && (
                <section aria-label="আরও খবর" className="border-t border-slate-200 dark:border-slate-800 pt-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="w-1.5 h-5 bg-blue-600 rounded-xs" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {categoryName}-এর অন্যান্য সংবাদ
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                    {serialStories.map((story) => {
                      const { kicker, title } = parseKickerAndTitle(
                        story.title,
                        story.subCategory,
                        story.lead
                      );
                      const storyUrl = routeFor(story.category || canonicalSlug, story.slug);
                      const imageUrl = story.featuredImage?.url || FALLBACK_IMAGE;

                      return (
                        <article
                          key={String(story._id)}
                          className="flex items-start justify-between gap-3.5 pb-4 border-b border-slate-200/70 dark:border-slate-800/80 group"
                        >
                          <div className="flex-1 min-w-0">
                            <Link href={storyUrl} className="block">
                              <h4 className="text-base font-semibold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                {kicker && (
                                  <span className="text-blue-600 dark:text-blue-400 font-bold mr-1">
                                    {kicker}/
                                  </span>
                                )}
                                {title}
                              </h4>
                            </Link>
                            {story.excerpt && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                {story.excerpt}
                              </p>
                            )}
                            <span className="text-xs text-slate-400 mt-1.5 block">
                              {formatRelativeTime(story.publishedAt || story.createdAt)}
                            </span>
                          </div>

                          <Link
                            href={storyUrl}
                            className="shrink-0 w-[115px] h-[75px] relative rounded-xs overflow-hidden bg-slate-100 dark:bg-slate-800"
                          >
                            <Image
                              src={imageUrl}
                              alt={story.title}
                              fill
                              sizes="115px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <nav
                  aria-label="পৃষ্ঠা পরিবর্তন"
                  className="flex items-center justify-center gap-1.5 pt-6 pb-2"
                >
                  {currentPage > 1 && (
                    <Link
                      href={`/${encodeURIComponent(canonicalSlug)}?page=${currentPage - 1}${
                        selectedSub ? `&sub=${encodeURIComponent(selectedSub)}` : ''
                      }`}
                      className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      « পূর্ববর্তী
                    </Link>
                  )}

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .map((pageNum, idx, arr) => {
                      const prev = arr[idx - 1];
                      const isGap = prev && pageNum - prev > 1;
                      const isActive = pageNum === currentPage;

                      return (
                        <span key={pageNum} className="flex items-center">
                          {isGap && <span className="px-1 text-slate-400">...</span>}
                          <Link
                            href={`/${encodeURIComponent(canonicalSlug)}?page=${pageNum}${
                              selectedSub ? `&sub=${encodeURIComponent(selectedSub)}` : ''
                            }`}
                            className={`min-w-[36px] h-[36px] flex items-center justify-center text-sm font-bold rounded border transition-colors ${
                              isActive
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {toBanglaNumber(pageNum)}
                          </Link>
                        </span>
                      );
                    })}

                  {currentPage < totalPages && (
                    <Link
                      href={`/${encodeURIComponent(canonicalSlug)}?page=${currentPage + 1}${
                        selectedSub ? `&sub=${encodeURIComponent(selectedSub)}` : ''
                      }`}
                      className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      পরবর্তী »
                    </Link>
                  )}
                </nav>
              )}
            </main>

            {/* Right Column Sidebar (30% Width - Exactly Matching Reference) */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
              {/* Sidebar Display Ad (Clean Master style reference) */}
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
                  <div className="p-4 bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 text-white relative">
                    <span className="absolute top-2 right-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded">
                      বিজ্ঞাপন
                    </span>
                    <span className="text-xs font-bold text-amber-200 uppercase tracking-wider block">
                      এখন আরও শক্তিশালী
                    </span>
                    <strong className="text-xl sm:text-2xl font-black block mt-1 tracking-tight">
                      ক্লিন মাস্টার
                    </strong>
                    <p className="text-xs text-sky-100 mt-1 max-w-[200px]">
                      লিকুইড টয়লেট ক্লিনার • ৯৯.৯% জীবাণু ধ্বংস করে
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="bg-amber-400 text-sky-950 font-black text-xs px-3 py-1.5 rounded-full shadow-xs">
                        সবচেয়ে Safe Clean
                      </span>
                      <span className="text-[11px] text-sky-100 font-semibold">২টি সাইজে পাওয়া যাচ্ছে</span>
                    </div>
                  </div>
                )}
              </div>

              {/* "সর্বশেষ" Widget (Latest News with Thumbnails) */}
              <div className="bg-white dark:bg-slate-900 rounded-md p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="border-b-2 border-rose-600 pb-2 mb-3.5 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
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
                    const { kicker, title } = parseKickerAndTitle(
                      item.title,
                      item.subCategory,
                      item.lead
                    );
                    const itemUrl = routeFor(item.category || 'national', item.slug);
                    const itemImg = item.featuredImage?.url || FALLBACK_IMAGE;

                    return (
                      <article key={String(item._id)} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group">
                        <div className="flex-1 min-w-0">
                          <Link href={itemUrl} className="block">
                            <h4 className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                              {kicker && (
                                <span className="text-blue-600 dark:text-blue-400 font-bold mr-1">
                                  {kicker}/
                                </span>
                              )}
                              {title}
                            </h4>
                          </Link>
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            {formatRelativeTime(item.publishedAt || item.createdAt)}
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

              {/* "সর্বাধিক পঠিত" (Popular / Top Read News Widget) */}
              {popularPosts.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-md p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="border-b-2 border-blue-600 pb-2 mb-3.5 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      সর্বাধিক পঠিত
                    </h3>
                  </div>

                  <ol className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
                    {popularPosts.map((item, idx) => {
                      const itemUrl = routeFor(item.category || 'national', item.slug);
                      const badgeNumbers = ['০১', '০২', '০৩', '০৪', '০৫'];

                      return (
                        <li key={String(item._id)} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3 group">
                          <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                            {badgeNumbers[idx] || toBanglaNumber(idx + 1)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={itemUrl}
                              className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 block"
                            >
                              {item.title}
                            </Link>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                              পঠিত: {toBanglaNumber(item.views || 0)} বার
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {/* Quick App Promo / Stay Connected */}
              <div className="rounded-md bg-gradient-to-br from-slate-900 to-blue-950 text-white p-5 shadow-xs">
                <span className="text-xs uppercase tracking-wider text-blue-400 font-bold block mb-1">
                  মোবাইল সংস্করণ
                </span>
                <strong className="text-lg font-bold block mb-2">
                  {siteName} অ্যাপ
                </strong>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  দেশ-বিদেশের সব ব্রেকিং নিউজ সবার আগে পেতে আমাদের অ্যাপ ডাউনলোড করুন।
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                  <span>Google Play & App Store-এ উপলব্ধ</span>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Bottom Horizontal Advertisement Banner (Fresh Mustard Oil style reference) */}
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
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 bg-white/70 dark:bg-black/40 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    বিজ্ঞাপন
                  </span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer">
                    অর্ডার করুন →
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Site Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10 mt-12 text-slate-600 dark:text-slate-400 text-sm">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <Link href="/" className="inline-block mb-3">
                <Image
                  src={logoUrl}
                  alt={siteName}
                  width={220}
                  height={55}
                  className="h-10 w-auto object-contain"
                  unoptimized
                />
              </Link>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                সত্য ও বস্তুনিষ্ঠ সাংবাদিকতায় অবিচল। ২৪ ঘণ্টা দেশ ও আন্তর্জাতিক সংবাদের বিশ্বস্ত ঠিকানা।
              </p>
            </div>

            <div className="md:col-span-2">
              <strong className="text-slate-900 dark:text-slate-100 text-sm block mb-3 font-bold">
                জনপ্রিয় বিভাগসমূহ
              </strong>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {navCategories.slice(0, 12).map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${encodeURIComponent(cat.slug)}`}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-0.5"
                  >
                    {cat.name_bn}
                  </Link>
                ))}
              </div>
            </div>

            <div className="md:col-span-1">
              <strong className="text-slate-900 dark:text-slate-100 text-sm block mb-3 font-bold">
                যোগাযোগ ও সম্পাদকীয়
              </strong>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                সম্পাদক ও প্রকাশক: দৈনিক যমুনা কণ্ঠ
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ইমেইল: contact@jamunarkantho.com
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} {siteName}। সর্বস্বত্ব সংরক্ষিত।</span>
            <div className="flex items-center gap-4">
              <Link href="/about" className="hover:underline">আমাদের সম্পর্কে</Link>
              <Link href="/privacy" className="hover:underline">গোপনীয়তা নীতি</Link>
              <Link href="/contact" className="hover:underline">যোগাযোগ</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
