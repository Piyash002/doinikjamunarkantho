import HomePageClient from '@/src/components/site/HomePageClient';
import Settings from '@/src/models/Settings';
import AdSlot from '@/src/models/AdSlot';
import { getHomeData, getNavCategories, getHomepageCategorySections } from '@/src/services/news';
import { getPublicTrendingTopics } from '@/src/services/adminTagService';
import { getPublicStaticPages } from '@/src/services/adminPageService';

const fallbackTrending: string[] = ['রাজনীতি', 'খেলা', 'অর্থনীতি', 'সারাদেশ', 'টেকনোলজি'];
const fallbackSiteName = 'দৈনিক যমুনা কণ্ঠ';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let navCategories: any[] = [];
  let categorySections: any[] = [];
  let staticPagesList: any[] = [];
  let trendingKeywords: string[] = fallbackTrending;
  let featuredPosts: any[] = [];
  let latestPosts: any[] = [];
  let popularPosts: any[] = [];
  let opinionPosts: any[] = [];
  let breakingPosts: any[] = [];
  let trendingPosts: any[] = [];
  let trendingTopics: any[] = [];
  let adsMap: Record<string, any> = {};
  let siteName = fallbackSiteName;
  let logoUrl = '/logo.png';
  let settings: any = null;

  try {
    const [fetchedSettings, homeData, topicsData, navCats, activeAds, fetchedCatSections, fetchedStaticPages] = await Promise.all([
      Settings.findOne({}).lean(),
      getHomeData().catch(() => ({ categories: [], featured: [], latest: [], trending: [], breaking: [] })),
      getPublicTrendingTopics().catch(() => []),
      getNavCategories().catch(() => []),
      AdSlot.find({ isActive: true, imageUrl: { $ne: '' } }).lean().catch(() => []),
      getHomepageCategorySections().catch(() => []),
      getPublicStaticPages().catch(() => []),
    ]);

    settings = fetchedSettings;
    navCategories = navCats || [];
    categorySections = fetchedCatSections || [];
    trendingTopics = topicsData || [];
    staticPagesList = fetchedStaticPages || [];
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

    const now = new Date();
    const validAds = (activeAds || []).filter((ad: any) => {
      if (!ad.isActive) return false;
      if (!ad.imageUrl || !ad.imageUrl.trim()) return false;
      if (ad.startDate && new Date(ad.startDate) > now) return false;
      if (ad.endDate && new Date(ad.endDate) < now) return false;
      return true;
    });

    for (const ad of validAds) {
      if (ad.position && !adsMap[ad.position]) {
        adsMap[ad.position] = ad;
      }
    }

    featuredPosts = Array.isArray(homeData?.featured) ? homeData.featured : [];
    latestPosts = Array.isArray(homeData?.latest) ? homeData.latest : [];
    breakingPosts = Array.isArray(homeData?.breaking) ? homeData.breaking : [];
    trendingPosts = Array.isArray(homeData?.trending) ? homeData.trending : [];
    popularPosts = [...latestPosts].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0));
    opinionPosts = latestPosts.filter((post: any) => /মতামত|opinion/i.test(post?.category || post?.title || ''));
  } catch (error) {
    navCategories = [];
    trendingKeywords = fallbackTrending;
    trendingTopics = [];
    adsMap = {};
    siteName = fallbackSiteName;
    featuredPosts = [];
    latestPosts = [];
    breakingPosts = [];
    trendingPosts = [];
    popularPosts = [];
    opinionPosts = [];
  }

  return (
    <HomePageClient
      siteName={siteName}
      logoUrl={logoUrl}
      footerAddress={settings?.footerAddress || "এস এস রোড সিরাজগঞ্জ, মুক্তিযোদ্ধা সংসদ গলি।"}
      phone={settings?.phone || "০১৬৭৭৯০৫৫৭০"}
      email={settings?.email || "mdrubelhossainjournalits@gmail.com"}
      editorName={settings?.editorName}
      copyrightText={settings?.copyrightText}
      socialLinks={settings?.socialLinks}
      whatsappChannel={settings?.whatsappChannel}
      googlePlayLink={settings?.googlePlayLink}
      staticPages={JSON.parse(JSON.stringify(staticPagesList))}
      navCategories={JSON.parse(JSON.stringify(navCategories))}
      trendingKeywords={trendingKeywords}
      trendingTopics={JSON.parse(JSON.stringify(trendingTopics))}
      featuredPosts={JSON.parse(JSON.stringify(featuredPosts))}
      latestPosts={JSON.parse(JSON.stringify(latestPosts))}
      breakingPosts={JSON.parse(JSON.stringify(breakingPosts))}
      trendingPosts={JSON.parse(JSON.stringify(trendingPosts))}
      popularPosts={JSON.parse(JSON.stringify(popularPosts))}
      opinionPosts={JSON.parse(JSON.stringify(opinionPosts))}
      categorySections={JSON.parse(JSON.stringify(categorySections))}
      ads={JSON.parse(JSON.stringify(adsMap))}
    />
  );
}
