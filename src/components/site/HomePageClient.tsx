"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import ArticleSiteHeader from "./ArticleSiteHeader";
import HomeCategorySections, { CategorySectionItem } from "./HomeCategorySections";
import SiteFooter, { StaticPageItem } from "./SiteFooter";
import {
  toBanglaNumber,
  formatBanglaDate,
  formatBanglaTime,
} from "@/src/lib/dateUtils";

type CategoryInput = string | { name_bn?: string; name_en?: string; slug?: string } | null | undefined;

type PostLike = {
  _id?: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  category?: CategoryInput;
  categoryName?: string;
  featuredImage?: { url?: string };
  image?: string;
  publishedAt?: string | Date;
  createdAt?: string | Date;
  views?: number;
  viewCount?: number;
  isBreaking?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  homePosition?: number | null;
};

type StoryItem = {
  id: string;
  slug: string;
  categorySlug: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  time: string;
  views: number;
  publishedAt?: string | Date;
  createdAt?: string | Date;
  categoryKey: string;
};

type HomePageClientProps = {
  siteName?: string;
  logoUrl?: string;
  navCategories?: Array<string | { name_bn?: string; name_en?: string; slug?: string }>;
  trendingKeywords?: string[];
  trendingTopics?: Array<{ _id: string; name: string; slug: string; order?: number }>;
  featuredPosts?: PostLike[];
  latestPosts?: PostLike[];
  popularPosts?: PostLike[];
  opinionPosts?: PostLike[];
  breakingPosts?: PostLike[];
  trendingPosts?: PostLike[];
  categorySections?: CategorySectionItem[];
  ads?: Record<string, { imageUrl?: string; link?: string; position?: string; key?: string; sizeHint?: string }>;
  footerAddress?: string;
  phone?: string;
  email?: string;
  editorName?: string;
  copyrightText?: string;
  socialLinks?: {
    facebook?: string;
    x?: string;
    youtube?: string;
    instagram?: string;
  };
  whatsappChannel?: string;
  googlePlayLink?: string;
  staticPages?: StaticPageItem[];
};

const FALLBACK_CATEGORIES: string[] = [
  "সর্বশেষ",
  "জাতীয়",
  "রাজনীতি",
  "অর্থনীতি",
  "আন্তর্জাতিক",
  "সারাদেশ",
  "খেলা",
  "বিনোদন",
  "শিক্ষা",
  "স্বাস্থ্য",
  "প্রযুক্তি",
  "মতামত",
];

const FALLBACK_TRENDING: string[] = ["রাজনীতি", "খেলা", "অর্থনীতি", "সারাদেশ", "টেকনোলজি"];
const DEFAULT_SITE_NAME = "দৈনিক যমুনা কণ্ঠ";

function toEnglishPhone(phone = "") {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(phone).replace(/[০-৯]/g, (d) => String(bn.indexOf(d))).replace(/[^0-9+]/g, "");
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^\u0980-\u09FFa-z0-9]/g, "")
    .trim();
}

function buildRelativeTime(dateValue?: string | Date, nowValue?: number | null) {
  if (!dateValue) return "এই মুহূর্তে";

  if (typeof nowValue !== "number") {
    return new Date(dateValue).toLocaleDateString("bn-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const diffMs = nowValue - new Date(dateValue).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));
  const hours = Math.max(0, Math.round(diffMs / 3600000));
  const days = Math.max(0, Math.round(diffMs / 86400000));

  if (minutes < 60) {
    return `${toBanglaNumber(minutes)} মিনিট আগে`;
  }

  if (hours < 24) {
    return `${toBanglaNumber(hours)} ঘণ্টা আগে`;
  }

  if (days < 7) {
    return `${toBanglaNumber(days)} দিন আগে`;
  }

  return new Date(dateValue).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPostImage(post: PostLike | null | undefined, fallback: string) {
  const image = post?.featuredImage?.url || post?.image || fallback;
  return image || fallback;
}

function getCategoryName(category: CategoryInput) {
  if (!category) return "সর্বশেষ";
  if (typeof category === "string") return category;
  return category.name_bn || category.name_en || category.slug || "সর্বশেষ";
}

function getStoryTitle(post: PostLike | null | undefined) {
  return post?.title || "শিরোনাম অনুপস্থিত";
}

import { toCleanCategorySlug } from "@/src/lib/categorySlugs";

function getStoryUrl(story: StoryItem) {
  const uniqueId = story.slug || story.id;
  const cleanCat = toCleanCategorySlug(story.categorySlug);
  if (!uniqueId || !cleanCat) return "#news-feed";
  return `/${encodeURIComponent(cleanCat)}/${encodeURIComponent(uniqueId)}`;
}

function toStoryItem(post: PostLike | null | undefined, index = 0, nowValue?: number | null): StoryItem {
  const category = getCategoryName(post?.category || post?.categoryName || "");
  const rawCatSlug = typeof post?.category === "string" ? post.category : post?.category?.slug || "";
  const categorySlug = toCleanCategorySlug(rawCatSlug);
  const uniqueId = post?.slug || (post?._id ? String(post._id) : `story-${index}`);
  return {
    id: uniqueId,
    slug: post?.slug || uniqueId,
    categorySlug,
    category,
    title: getStoryTitle(post),
    excerpt: post?.excerpt || "",
    image: getPostImage(post, "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"),
    time: buildRelativeTime(post?.publishedAt || post?.createdAt, nowValue),
    views: Math.max(Number(post?.views) || 0, Number(post?.viewCount) || 0),
    publishedAt: post?.publishedAt,
    createdAt: post?.createdAt,
    categoryKey: normalizeText(String(post?.category || post?.categoryName || "")),
  };
}

export default function HomePageClient({
  siteName = DEFAULT_SITE_NAME,
  logoUrl = "/logo.png",
  footerAddress = "এস এস রোড সিরাজগঞ্জ, মুক্তিযোদ্ধা সংসদ গলি।",
  phone = "০১৬৭৭৯০৫৫৭০",
  email = "mdrubelhossainjournalits@gmail.com",
  editorName,
  copyrightText,
  socialLinks,
  whatsappChannel,
  googlePlayLink,
  staticPages = [],
  navCategories = FALLBACK_CATEGORIES,
  trendingKeywords = FALLBACK_TRENDING,
  trendingTopics = [],
  featuredPosts = [],
  latestPosts = [],
  popularPosts = [],
  opinionPosts = [],
  breakingPosts = [],
  trendingPosts = [],
  categorySections = [],
  ads = {},
}: HomePageClientProps) {
  const [activeCategory, setActiveCategory] = useState("সর্বশেষ");
  const [activeTab, setActiveTab] = useState("সর্বশেষ");
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme-preference");
    setIsDark(savedTheme === "dark");
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNowMs(new Date().getTime()));
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    window.localStorage.setItem("theme-preference", isDark ? "dark" : "light");
    return () => window.cancelAnimationFrame(frame);
  }, [isDark]);

  const normalizedCategories = useMemo(() => {
    const values = Array.isArray(navCategories) ? navCategories : FALLBACK_CATEGORIES;
    const seen = new Set<string>();
    return values.filter((category) => {
      const name = getCategoryName(category as string | { name_bn?: string; name_en?: string; slug?: string } | null | undefined);
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [navCategories]);

  const allStories = useMemo<StoryItem[]>(() => {
    const posts = Array.isArray(latestPosts) ? latestPosts : [];
    return posts.map((post, index) => toStoryItem(post, index, nowMs));
  }, [latestPosts, nowMs]);

  // Featured stories sorted by homePosition (1, 2, 3...) first, then newest
  const featuredStories = useMemo<StoryItem[]>(() => {
    const posts = Array.isArray(featuredPosts) ? [...featuredPosts] : [];
    posts.sort((a, b) => {
      const posA = typeof a?.homePosition === 'number' && a.homePosition > 0 ? a.homePosition : 9999;
      const posB = typeof b?.homePosition === 'number' && b.homePosition > 0 ? b.homePosition : 9999;
      if (posA !== posB) return posA - posB;
      const timeA = new Date(a?.publishedAt || a?.createdAt || 0).getTime();
      const timeB = new Date(b?.publishedAt || b?.createdAt || 0).getTime();
      return timeB - timeA;
    });
    return posts.map((post, index) => toStoryItem(post, index, nowMs));
  }, [featuredPosts, nowMs]);

  const popularStories = useMemo<StoryItem[]>(() => {
    const posts = Array.isArray(popularPosts) ? popularPosts : [];
    return posts.map((post, index) => toStoryItem(post, index, nowMs));
  }, [popularPosts, nowMs]);

  const opinionStories = useMemo<StoryItem[]>(() => {
    const posts = Array.isArray(opinionPosts) ? opinionPosts : [];
    return posts.map((post, index) => toStoryItem(post, index, nowMs));
  }, [opinionPosts, nowMs]);

  const visibleStories = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("bn");

    return allStories.filter((story) => {
      const matchesCategory =
        activeCategory === "সর্বশেষ" ||
        normalizeText(story.category) === normalizeText(activeCategory) ||
        story.categoryKey === normalizeText(activeCategory);

      const matchesSearch =
        !normalizedSearch ||
        `${story.title} ${story.excerpt} ${story.category}`
          .toLocaleLowerCase("bn")
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, allStories, search]);

  const leadStory: StoryItem =
    featuredStories[0] ||
    allStories[0] ||
    {
      id: "fallback-lead",
      slug: "",
      categorySlug: "",
      title: "সর্বশেষ সংবাদ",
      excerpt: "আজকের গুরুত্বপূর্ণ খবরগুলো অনলাইনে পড়ুন।",
      image: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1400&q=90",
      category: "জাতীয়",
      time: "এই মুহূর্তে",
      views: 0,
      categoryKey: "জাতীয়",
    };

  const quickStories = allStories.slice(1, 4);
  const opinionStory: StoryItem =
    opinionStories[0] ||
    allStories.find((story) => normalizeText(story.category) === "মতামত") ||
    allStories[0] ||
    leadStory;

  const headerAd = ads?.['header-below'];
  const sidebarAd = ads?.['sidebar'];
  const betweenSectionsAd = ads?.['between-sections'];

  const sidebarStories = useMemo(() => {
    const excludeIds = new Set([leadStory.id, opinionStory.id]);
    const filtered = allStories.filter((s) => !excludeIds.has(s.id));
    return filtered.slice(0, 3);
  }, [allStories, leadStory.id, opinionStory.id]);

  const sortedPopular = useMemo<StoryItem[]>(() => {
    const rawTrending = Array.isArray(trendingPosts) ? trendingPosts : [];
    const trendingItems = rawTrending.map((p, idx) => toStoryItem(p, idx, nowMs));

    const posts = popularStories.length ? popularStories : allStories;
    const sortedByViews = [...posts].sort((a, b) => (Number(b.views || 0) || 0) - (Number(a.views || 0) || 0));

    const seen = new Set<string>();
    const combined: StoryItem[] = [];
    for (const item of [...trendingItems, ...sortedByViews]) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    }
    return combined;
  }, [allStories, popularStories, trendingPosts, nowMs]);

  function selectCategory(category: string) {
    setActiveCategory(category);
    setIsMenuOpen(false);
  }

  const headerCategories = useMemo(() => {
    return (Array.isArray(navCategories) ? navCategories : [])
      .filter((c): c is { name_bn: string; slug: string; name_en?: string; _id?: string; order?: number } =>
        typeof c === "object" && c !== null && Boolean(c.slug)
      );
  }, [navCategories]);

  const breakingList = useMemo(() => {
    const explicitBreaking = Array.isArray(breakingPosts) && breakingPosts.length > 0 ? breakingPosts : [];
    const otherCandidates = [
      ...(Array.isArray(latestPosts) ? latestPosts : []),
      ...(Array.isArray(featuredPosts) ? featuredPosts : []),
    ].filter((p) => p?.isBreaking);

    const merged = [...explicitBreaking, ...otherCandidates];
    const seen = new Set<string>();
    const uniqueBreaking: StoryItem[] = [];

    for (const post of merged) {
      const item = toStoryItem(post, uniqueBreaking.length, nowMs);
      if (item.title && !seen.has(item.title)) {
        seen.add(item.title);
        uniqueBreaking.push(item);
      }
    }

    let selectedStories = uniqueBreaking;
    if (selectedStories.length === 0) {
      selectedStories = allStories.slice(0, 10);
    }

    if (selectedStories.length > 0) {
      return selectedStories.map((story) => ({
        id: story.id,
        title: story.title,
        url: getStoryUrl(story),
      }));
    }

    return [
      { id: "f1", title: "যমুনা নদীর পানি বৃদ্ধি পেয়ে নিম্নাঞ্চল প্লাবিত, পানিবন্দি হাজারো পরিবার", url: "#" },
      { id: "f2", title: "সারাদেশে বিদ্যুৎ ও জ্বালানি সাশ্রয়ে নতুন সমন্বিত কর্মপরিকল্পনা গ্রহণ", url: "#" },
      { id: "f3", title: "রপ্তানি আয়ে নতুন মাইলফলক, প্রবাসী আয়ে ইতিবাচক প্রবৃদ্ধি অব্যাহত", url: "#" },
      { id: "f4", title: "যশোরে বিশেষ অভিযানে বিপুল পরিমাণ চোরাচালান পণ্য ও মাদক উদ্ধার", url: "#" },
      { id: "f5", title: "চলতি সপ্তাহে সারাদেশে হালকা থেকে মাঝারি বৃষ্টিপাতের পূর্বাভাস", url: "#" },
    ];
  }, [breakingPosts, allStories, latestPosts, featuredPosts, nowMs]);

  const displayBreakingList = useMemo(() => {
    let list = breakingList;
    while (list.length > 0 && list.length < 8) {
      list = [...list, ...breakingList];
    }
    return list;
  }, [breakingList]);

  return (
    <main className="portal">
      <ArticleSiteHeader
        siteName={siteName}
        logoUrl={logoUrl}
        categories={headerCategories}
        activeSlug="latest"
        trendingTopics={trendingTopics}
      />

      <div className="page-shell" id="top">
        <section className="breaking-news" aria-label="সংবাদ শিরোনাম">
          <div className="breaking-label">
            সংবাদ শিরোনাম ::
          </div>
          <div className="breaking-ticker-wrap">
            <div className="breaking-track">
              {[...displayBreakingList, ...displayBreakingList].map((item, idx) => (
                <span key={`${item.id}-${idx}`} className="breaking-item">
                  <span className="breaking-bullet" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.6" />
                      <path
                        d="M11.5 6.5L8 10L11.5 13.5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <Link href={item.url} className="breaking-link">
                    {item.title}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </section>

        {headerAd?.imageUrl ? (
          <div className="ad-leaderboard dynamic-ad" aria-label="বিজ্ঞাপন">
            <a
              href={headerAd.link || "#"}
              target={headerAd.link && headerAd.link !== "#" ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="ad-link-wrap"
            >
              <img
                src={headerAd.imageUrl}
                alt="বিজ্ঞাপন"
                className="ad-image-responsive"
                loading="lazy"
              />
              <span className="ad-kicker">বিজ্ঞাপন</span>
            </a>
          </div>
        ) : null}

        <section className="top-grid" aria-label="প্রধান সংবাদ">
          <div className="lead-story">
            <div className="lead-copy">
              <span className="eyebrow"><i /> আজকের প্রধান খবর</span>
              <h1>{leadStory.title}</h1>
              <p>{leadStory.excerpt || "সবার আগে গুরুত্বপূর্ণ খবর পড়ুন।"}</p>
              <div className="story-meta flex items-center gap-2 flex-wrap text-xs text-slate-500">
                <span className="font-bold text-[#1b7d95] dark:text-teal-400">{leadStory.category || "জাতীয়"}</span>
                {leadStory.publishedAt && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>{formatBanglaDate(leadStory.publishedAt)}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>{formatBanglaTime(leadStory.publishedAt)}</span>
                  </>
                )}
                <span className="text-slate-400">({leadStory.time || "এই মুহূর্তে"})</span>
                {leadStory.views > 0 && (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md ml-auto">
                    👁️ {toBanglaNumber(leadStory.views)} ভিউ
                  </span>
                )}
              </div>
              <Link className="read-more" href={getStoryUrl(leadStory)}>
                বিস্তারিত পড়ুন <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <Link className="lead-image-wrap" href={getStoryUrl(leadStory)} aria-label="প্রধান খবর পড়ুন">
              <Image
                alt={leadStory.title}
                className="lead-image"
                loading="eager"
                src={leadStory.image || "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1400&q=90"}
                width={1400}
                height={900}
                unoptimized
              />
              <span className="image-caption">{leadStory.category || "জাতীয়"} <i /> {leadStory.time || "এই মুহূর্তে"}</span>
            </Link>
          </div>

          <aside className="top-sidebar">
            {sidebarAd?.imageUrl ? (
              <div className="sponsor-card dynamic-ad" aria-label="বিজ্ঞাপন">
                <a
                  href={sidebarAd.link || "#"}
                  target={sidebarAd.link && sidebarAd.link !== "#" ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="sponsor-ad-link"
                >
                  <img
                    src={sidebarAd.imageUrl}
                    alt="বিজ্ঞাপন"
                    className="sponsor-ad-img"
                    loading="lazy"
                  />
                  <span className="sponsor-label">বিজ্ঞাপন</span>
                </a>
              </div>
            ) : (
              <div className="top-sidebar-news-card">
                <div className="section-heading compact-heading">
                  <h2>সর্বশেষ সংবাদ</h2>
                  <a href="#news-feed" className="compact-more-link">
                    আরও <span aria-hidden="true">→</span>
                  </a>
                </div>
                <div className="top-sidebar-news-list">
                  {sidebarStories.map((story, idx) => (
                    <Link
                      key={story.id || idx}
                      href={getStoryUrl(story)}
                      className="top-sidebar-news-item"
                    >
                      <span className="sidebar-news-category">{story.category}</span>
                      <h3 className="sidebar-news-title">{story.title}</h3>
                      <span className="sidebar-news-time">{story.time}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className="opinion-card">
              <div className="section-heading compact-heading">
                <h2>মতামত</h2>
                <a href="#news-feed">সব দেখুন <span aria-hidden="true">→</span></a>
              </div>
              <div className="opinion-content">
                <div className="opinion-avatar">{(opinionStory.title || "আ").charAt(0)}</div>
                <div>
                  <h3>{opinionStory.title}</h3>
                  <p>{opinionStory.category || "স্টাফ রিপোর্টার"}</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="quick-stories" aria-label="আরও গুরুত্বপূর্ণ খবর">
          {(quickStories.length ? quickStories : allStories.slice(0, 3)).map((story, index) => (
            <Link className="quick-story" href={getStoryUrl(story)} key={story.id || `${story.title}-${index}`}>
              <div>
                <span className="story-category">{story.category}</span>
                <h2>{story.title}</h2>
                <p>{story.time}</p>
              </div>
              <Image
                alt={story.title}
                className="quick-image"
                src={story.image}
                width={280}
                height={180}
                unoptimized
              />
            </Link>
          ))}
        </section>

        {betweenSectionsAd?.imageUrl ? (
          <div className="ad-banner dynamic-ad" aria-label="বিজ্ঞাপন">
            <a
              href={betweenSectionsAd.link || "#"}
              target={betweenSectionsAd.link && betweenSectionsAd.link !== "#" ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="ad-banner-link-wrap"
            >
              <img
                src={betweenSectionsAd.imageUrl}
                alt="বিজ্ঞাপন"
                className="ad-banner-img"
                loading="lazy"
              />
              <span className="ad-small-label">বিজ্ঞাপন</span>
            </a>
          </div>
        ) : null}

        {/* Pinned Category News Sections (Dhaka Post Style, Serially Ordered by Admin) */}
        {categorySections && categorySections.length > 0 && (
          <HomeCategorySections sections={categorySections} siteName={siteName} />
        )}

        <section className="news-layout" id="news-feed">
          <div className="feed-column">
            <div className="section-heading feed-heading">
              <div>
                <span className="section-kicker">খবরের ঝলক</span>
                <h2>{search ? "খোঁজের ফলাফল" : activeCategory === "সর্বশেষ" ? "সর্বশেষ" : activeCategory}</h2>
              </div>
              <button
                className="view-all"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("সর্বশেষ");
                }}
                type="button"
              >
                সব খবর <span aria-hidden="true">→</span>
              </button>
            </div>

            {visibleStories.length ? (
              <div className="story-grid">
                {visibleStories.map((story, index) => (
                  <article className={index === 0 ? "story-card featured-card" : "story-card"} key={story.id || `${story.title}-${index}`}>
                    <Link href={getStoryUrl(story)} className="story-image-link" aria-label={`${story.title} পড়ুন`}>
                      <Image
                        alt={story.title}
                        className="story-image"
                        src={story.image}
                        width={560}
                        height={380}
                        unoptimized
                      />
                      <span className="image-arrow" aria-hidden="true">↗</span>
                    </Link>
                    <div className="story-card-copy">
                      <span className="story-category">{story.category}</span>
                      <h3><Link href={getStoryUrl(story)}>{story.title}</Link></h3>
                      <p>{story.excerpt || "পুরো খবর পড়ুন"}</p>
                      <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {story.publishedAt && (
                            <>
                              <span>{formatBanglaDate(story.publishedAt)}</span>
                              <span>•</span>
                              <span>{formatBanglaTime(story.publishedAt)}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>({story.time})</span>
                        </div>
                        {story.views > 0 && (
                          <span className="inline-flex items-center gap-1 font-bold text-[#1b7d95] dark:text-teal-400 bg-[#1b7d95]/10 px-2 py-0.5 rounded-md shrink-0">
                            👁️ {toBanglaNumber(story.views)}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span aria-hidden="true">⌕</span>
                <h3>এই বিভাগে এখনো কোনো খবর নেই</h3>
                <p>অন্য বিভাগ বেছে নিন অথবা নতুন কিছু খুঁজুন।</p>
                <button onClick={() => selectCategory("সর্বশেষ")} type="button">সর্বশেষ খবর দেখুন</button>
              </div>
            )}
          </div>

          <aside className="feed-sidebar">
            <div className="sidebar-tabs" role="tablist" aria-label="খবরের তালিকা">
              {["সর্বশেষ", "জনপ্রিয়"].map((tab) => (
                <button
                  aria-selected={activeTab === tab}
                  className={activeTab === tab ? "sidebar-tab active" : "sidebar-tab"}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  role="tab"
                  type="button"
                >
                  {tab}
                </button>
              ))}
            </div>
            <ol className="sidebar-list">
              {(activeTab === "সর্বশেষ" ? allStories.slice(0, 5) : sortedPopular.slice(0, 5)).map((story, index) => (
                <li key={story.id || `${story.title}-${index}`}>
                  <span className="list-number">{toBanglaNumber(index + 1).padStart(2, "০")}</span>
                  <div className="flex-1 min-w-0">
                    <Link href={getStoryUrl(story)}>{story.title}</Link>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-1 flex-wrap gap-1">
                      <span className="sidebar-time">{story.time}</span>
                      {story.views > 0 && (
                        <span className="inline-flex items-center gap-1 font-bold text-[#1b7d95] dark:text-teal-400 bg-[#1b7d95]/10 px-1.5 py-0.5 rounded-md text-[11px]">
                          👁️ {toBanglaNumber(story.views)} ভিউ
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="sidebar-promo">
              <span className="promo-icon">য</span>
              <p><strong>সঙ্গে থাকুন</strong><br />খবরের প্রতিটি মুহূর্তে</p>
              <span className="promo-arrow" aria-hidden="true">↗</span>
            </div>
          </aside>
        </section>

        <section className="newsletter">
          <div>
            <span className="section-kicker">দিনের সেরা খবর</span>
            <h2>খবর থাকুক আপনার হাতেই</h2>
            <p>গুরুত্বপূর্ণ খবরের আপডেট পেতে আমাদের সঙ্গে থাকুন।</p>
          </div>
          <a href="#top">সব খবর দেখুন <span aria-hidden="true">↗</span></a>
        </section>

        <SiteFooter
          siteName={siteName}
          logoUrl={logoUrl}
          footerAddress={footerAddress}
          phone={phone}
          email={email}
          editorName={editorName}
          copyrightText={copyrightText}
          socialLinks={socialLinks}
          whatsappChannel={whatsappChannel}
          googlePlayLink={googlePlayLink}
          navCategories={normalizedCategories
            .map((cat) => {
              if (typeof cat === "object" && cat !== null) {
                return {
                  name_bn: cat.name_bn || "",
                  slug: cat.slug || "",
                  name_en: cat.name_en,
                };
              }
              return { name_bn: String(cat), slug: "" };
            })
            .filter((c) => c.slug)}
          staticPages={staticPages}
        />
      </div>
    </main>
  );
}
