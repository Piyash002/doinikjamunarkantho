import HomePageClient from '@/src/components/site/HomePageClient';
import Settings from '@/src/models/Settings';
import { getHomeData } from '@/src/services/news';
import { getPublicTrendingTopics } from '@/src/services/adminTagService';

const fallbackCategories: string[] = [
  'সর্বশেষ',
  'জাতীয়',
  'রাজনীতি',
  'অর্থনীতি',
  'আন্তর্জাতিক',
  'সারাদেশ',
  'খেলা',
  'বিনোদন',
  'শিক্ষা',
  'স্বাস্থ্য',
  'প্রযুক্তি',
  'মতামত',
];

const fallbackTrending: string[] = ['রাজনীতি', 'খেলা', 'অর্থনীতি', 'সারাদেশ', 'টেকনোলজি'];
const fallbackSiteName = 'দৈনিক যমুনা কণ্ঠ';

export const dynamic = 'force-dynamic';

function toDisplayCategoryName(category: { name_bn?: string; name_en?: string; slug?: string } | string | null | undefined) {
  if (!category) return 'সর্বশেষ';
  if (typeof category === 'string') return category;
  return category.name_bn || category.name_en || category.slug || 'সর্বশেষ';
}

export default async function HomePage() {
  let navCategories: Array<string | { name_bn?: string; name_en?: string; slug?: string }> = fallbackCategories;
  let trendingKeywords: string[] = fallbackTrending;
  let featuredPosts: any[] = [];
  let latestPosts: any[] = [];
  let popularPosts: any[] = [];
  let opinionPosts: any[] = [];
  let trendingTopics: any[] = [];
  let siteName = fallbackSiteName;

  try {
    const [settings, homeData, topicsData] = await Promise.all([
      Settings.findOne({}).lean(),
      getHomeData().catch(() => ({ categories: [], featured: [], latest: [], trending: [] })),
      getPublicTrendingTopics().catch(() => []),
    ]);

    trendingTopics = topicsData || [];
    siteName = settings?.siteName || fallbackSiteName;

    const categoryList = Array.isArray(homeData?.categories) ? homeData.categories : [];
    navCategories = [
      'সর্বশেষ',
      ...categoryList
        .filter((category) => category && category.isActive !== false)
        .map((category) => ({
          name_bn: category.name_bn || category.name_en || category.slug,
          name_en: category.name_en || category.slug,
          slug: category.slug,
        })),
    ];

    const settingsTrending = Array.isArray(settings?.trendingKeywords) ? settings.trendingKeywords : [];
    if (settingsTrending.length) {
      trendingKeywords = settingsTrending;
    } else if (Array.isArray(homeData?.trending) && homeData.trending.length) {
      trendingKeywords = homeData.trending
        .slice(0, 5)
        .map((post) => post?.title || 'সংবাদ')
        .filter(Boolean);
    }

    featuredPosts = Array.isArray(homeData?.featured) ? homeData.featured : [];
    latestPosts = Array.isArray(homeData?.latest) ? homeData.latest : [];
    popularPosts = [...latestPosts].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    opinionPosts = latestPosts.filter((post) => /মতামত|opinion/i.test(post?.category || post?.title || ''));
  } catch (error) {
    navCategories = fallbackCategories;
    trendingKeywords = fallbackTrending;
    trendingTopics = [];
    siteName = fallbackSiteName;
    featuredPosts = [] as any[];
    latestPosts = [] as any[];
    popularPosts = [] as any[];
    opinionPosts = [] as any[];
  }

  return (
    <HomePageClient
      siteName={siteName}
      navCategories={JSON.parse(JSON.stringify(navCategories))}
      trendingKeywords={trendingKeywords}
      trendingTopics={JSON.parse(JSON.stringify(trendingTopics))}
      featuredPosts={JSON.parse(JSON.stringify(featuredPosts))}
      latestPosts={JSON.parse(JSON.stringify(latestPosts))}
      popularPosts={JSON.parse(JSON.stringify(popularPosts))}
      opinionPosts={JSON.parse(JSON.stringify(opinionPosts))}
    />
  );
}
