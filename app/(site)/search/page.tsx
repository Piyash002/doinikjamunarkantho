import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import ArticleSiteHeader from '@/src/components/site/ArticleSiteHeader';
import SiteFooter from '@/src/components/site/SiteFooter';
import { connectToDatabase } from '@/src/lib/db';
import { getPublicTrendingTopics } from '@/src/services/adminTagService';
import { getNavCategories } from '@/src/services/news';
import { getPublicStaticPages } from '@/src/services/adminPageService';
import Post from '@/src/models/Post';
import Settings from '@/src/models/Settings';

export const revalidate = 60;

type SearchPageProps = {
  searchParams?: Promise<{ q?: string; page?: string }>;
};

function toBanglaNumber(n: number): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/\d/g, (d) => bn[parseInt(d, 10)]);
}

function formatBanglaTime(dateStr?: string | Date | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return 'এইমাত্র';
  if (diffSec < 3600) return `${toBanglaNumber(Math.floor(diffSec / 60))} মিনিট আগে`;
  if (diffSec < 86400) return `${toBanglaNumber(Math.floor(diffSec / 3600))} ঘণ্টা আগে`;
  return d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const resolved = searchParams ? await searchParams : {};
  const query = resolved.q?.trim() || '';
  return {
    title: query ? `"${query}" - অনুসন্ধান ফলাফল | দৈনিক যমুনা কণ্ঠ` : 'অনুসন্ধান | দৈনিক যমুনা কণ্ঠ',
    description: `দৈনিক যমুনা কণ্ঠে "${query}" সম্পর্কিত খবর ও প্রতিবেদন অনুসন্ধান করুন।`,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = searchParams ? await searchParams : {};
  const query = resolved.q?.trim() || '';
  const currentPage = Math.max(1, parseInt(resolved.page || '1', 10));
  const postsPerPage = 12;

  await connectToDatabase();

  const postFilter: any = {
    status: 'published',
    isDeleted: { $ne: true },
  };

  if (query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    postFilter.$or = [
      { title: regex },
      { excerpt: regex },
      { content: regex },
      { category: regex },
      { subCategory: regex },
      { tags: regex },
    ];
  }

  const [totalPosts, posts, rawSettings, rawNavCategories, rawTrendingTopics, rawStaticPagesList] = await Promise.all([
    query ? Post.countDocuments(postFilter) : Promise.resolve(0),
    query
      ? Post.find(postFilter)
          .sort({ publishedAt: -1, createdAt: -1 })
          .skip((currentPage - 1) * postsPerPage)
          .limit(postsPerPage)
          .lean()
      : Promise.resolve([]),
    Settings.findOne({}).lean(),
    getNavCategories().catch(() => []),
    getPublicTrendingTopics().catch(() => []),
    getPublicStaticPages().catch(() => []),
  ]);

  const settings = rawSettings ? JSON.parse(JSON.stringify(rawSettings)) : null;
  const navCategories = JSON.parse(JSON.stringify(rawNavCategories || []));
  const trendingTopics = JSON.parse(JSON.stringify(rawTrendingTopics || []));
  const staticPagesList = JSON.parse(JSON.stringify(rawStaticPagesList || []));

  const siteName = settings?.siteName || 'দৈনিক যমুনা কণ্ঠ';
  const logoUrl = settings?.logo?.url || '/logo.png';
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  return (
    <div className="portal article-portal bg-[#f8fafc] dark:bg-[#0b131b] text-slate-900 dark:text-slate-100 min-h-screen">
      <ArticleSiteHeader
        categories={navCategories || []}
        logoUrl={logoUrl}
        siteName={siteName}
        trendingTopics={trendingTopics || []}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        <header className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50">
            {query ? (
              <>
                <span className="text-slate-400 font-normal">অনুসন্ধান ফলাফল: </span>&quot;{query}&quot;
              </>
            ) : (
              'খবর অনুসন্ধান করুন'
            )}
          </h1>
          {query && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              মোট {toBanglaNumber(totalPosts)}টি প্রতিবেদন পাওয়া গেছে
            </p>
          )}
        </header>

        {!query ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg p-12 text-center border border-slate-200 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              কী খুঁজতে চান তা উপরের সার্চ বক্সে লিখুন।
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg p-12 text-center border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
              আপনার অনুসন্ধানের সাথে মিলে এমন কোনো খবর পাওয়া যায়নি
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              বানান সঠিক কিনা যাচাই করুন অথবা অন্য কোনো শব্দ দিয়ে অনুসন্ধান করুন।
            </p>
            <Link
              href="/"
              className="inline-block bg-[#083c4d] hover:bg-[#062c38] text-white font-semibold text-sm px-5 py-2.5 rounded-md transition-colors"
            >
              হোমপেজে ফিরে যান
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => {
              const catSlug = post.category || 'all';
              const articleHref = `/${encodeURIComponent(catSlug)}/${encodeURIComponent(String(post._id || post.slug))}`;
              const postImage = post.featuredImage?.url || '/logo.png';
              return (
                <article
                  key={String(post._id)}
                  className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col hover:shadow-md transition-shadow"
                >
                  <Link href={articleHref} className="block relative aspect-16/10 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={postImage}
                      alt={post.title}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </Link>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-[#1b7d95] dark:text-[#7dd1e1]">
                        {post.subCategory || post.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {formatBanglaTime(post.publishedAt || post.createdAt)}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-[#1b7d95] transition-colors mb-2">
                      <Link href={articleHref}>{post.title}</Link>
                    </h2>
                    {post.excerpt && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-auto">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      <SiteFooter
        settings={settings}
        navCategories={navCategories}
        staticPages={staticPagesList}
      />
    </div>
  );
}
