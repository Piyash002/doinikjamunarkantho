import HomePageClient from '@/src/components/site/HomePageClient';
import Settings from '@/src/models/Settings';
import { getHomeData, getNavCategories } from '@/src/services/news';
import { getPublicTrendingTopics } from '@/src/services/adminTagService';

const fallbackTrending: string[] = ['রাজনীতি', 'খেলা', 'অর্থনীতি', 'সারাদেশ', 'টেকনোলজি'];
const fallbackSiteName = 'দৈনিক যমুনা কণ্ঠ';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let navCategories: any[] = [];
  let trendingKeywords: string[] = fallbackTrending;
  let featuredPosts: any[] = [];
  let latestPosts: any[] = [];
  let popularPosts: any[] = [];
  let opinionPosts: any[] = [];
  let trendingTopics: any[] = [];
  let siteName = fallbackSiteName;
  let logoUrl = '/logo.png';

  try {
    const [settings, homeData, topicsData, navCats] = await Promise.all([
      Settings.findOne({}).lean(),
      getHomeData().catch(() => ({ categories: [], featured: [], latest: [], trending: [] })),
      getPublicTrendingTopics().catch(() => []),
      getNavCategories().catch(() => []),
    ]);

    navCategories = navCats || [];
    trendingTopics = topicsData || [];
    siteName = settings?.siteName || fallbackSiteName;
    const rawLogo = settings?.logo?.url;
    logoUrl = rawLogo && !rawLogo.includes('photo-1529107386315') ? rawLogo : '/logo.png';

    const settingsTrending = Array.isArray(settings?.trendingKeywords) ? settings.trendingKeywords : [];
    if (settingsTrending.length) {
      trendingKeywords = settingsTrending;
    } else if (Array.isArray(homeData?.trending) && homeData.trending.length) {
      trendingKeywords = homeData.trending
        .slice(0, 5)
        .map((post: any) => post?.title || 'সংবাদ')
        .filter(Boolean);
    }

    featuredPosts = Array.isArray(homeData?.featured) ? homeData.featured : [];
    latestPosts = Array.isArray(homeData?.latest) ? homeData.latest : [];
    popularPosts = [...latestPosts].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    opinionPosts = latestPosts.filter((post: any) => /মতামত|opinion/i.test(post?.category || post?.title || ''));
  } catch (error) {
    navCategories = [];
    trendingKeywords = fallbackTrending;
    trendingTopics = [];
    siteName = fallbackSiteName;
    featuredPosts = [];
    latestPosts = [];
    popularPosts = [];
    opinionPosts = [];
  }

  return (
    <HomePageClient
      siteName={siteName}
      logoUrl={logoUrl}
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
