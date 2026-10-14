"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import ArticleSiteHeader from "./ArticleSiteHeader";

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
  ads?: Record<string, { imageUrl?: string; link?: string; position?: string; key?: string; sizeHint?: string }>;
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

function toBanglaNumber(value: number | string) {
  const map: Record<string, string> = { 0: "০", 1: "১", 2: "২", 3: "৩", 4: "৪", 5: "৫", 6: "৬", 7: "৭", 8: "৮", 9: "৯" };
  return String(value)
    .split("")
    .map((char) => map[char] ?? char)
    .join("");
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

function getStoryUrl(story: StoryItem) {
  if (!story.slug || !story.categorySlug) return "#news-feed";
  return `/${encodeURIComponent(story.categorySlug)}/${encodeURIComponent(story.slug)}`;
}

function toStoryItem(post: PostLike | null | undefined, index = 0, nowValue?: number | null): StoryItem {
  const category = getCategoryName(post?.category || post?.categoryName || "");
  const categorySlug =
    typeof post?.category === "string" ? post.category : post?.category?.slug || "";
  return {
    id: post?._id || post?.slug || `story-${index}`,
    slug: post?.slug || "",
    categorySlug,
    category,
    title: getStoryTitle(post),
    excerpt: post?.excerpt || "",
    image: getPostImage(post, "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"),
    time: buildRelativeTime(post?.publishedAt || post?.createdAt, nowValue),
    views: post?.views || 0,
    categoryKey: normalizeText(String(post?.category || post?.categoryName || "")),
  };
}

export default function HomePageClient({
  siteName = DEFAULT_SITE_NAME,
  logoUrl = "/logo.png",
  navCategories = FALLBACK_CATEGORIES,
  trendingKeywords = FALLBACK_TRENDING,
  trendingTopics = [],
  featuredPosts = [],
  latestPosts = [],
  popularPosts = [],
  opinionPosts = [],
  breakingPosts = [],
  trendingPosts = [],
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
    const preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme ? savedTheme === "dark" : preferDark) {
      setIsDark(true);
    }
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
              <div className="story-meta">
                <span>{leadStory.category || "জাতীয়"}</span><i /> <span>{leadStory.time || "এই মুহূর্তে"}</span>
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
                      <span className="story-time">{story.time}</span>
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
                  <Link href={getStoryUrl(story)}>{story.title}</Link>
                  {activeTab === "সর্বশেষ" && <span className="sidebar-time">{story.time}</span>}
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

        <footer className="site-footer" id="footer">
          <div className="footer-main">
            <div className="footer-brand-block">
              <a className="brand footer-brand" href="#top">
                <span className="brand-name">{siteName}</span>
              </a>
              <p>সত্য ও বস্তুনিষ্ঠ সংবাদে, প্রতিদিন আপনার পাশে।</p>
              <div className="social-links" aria-label="সামাজিক যোগাযোগমাধ্যম">
                <a href="#footer" aria-label="ফেসবুক">f</a>
                <a href="#footer" aria-label="এক্স">𝕏</a>
                <a href="#footer" aria-label="ইনস্টাগ্রাম">◎</a>
                <a href="#footer" aria-label="ইউটিউব">▶</a>
              </div>
            </div>
            <div className="footer-links">
              <strong>আমাদের বিভাগ</strong>
              {normalizedCategories.slice(0, 5).map((category) => {
                const name = getCategoryName(category as string | { name_bn?: string; name_en?: string; slug?: string } | null | undefined);
                const slug = typeof category === "object" && category?.slug ? category.slug : "";
                if (slug && slug !== "all" && slug !== "latest") {
                  return (
                    <Link key={name} href={`/${encodeURIComponent(slug)}`}>
                      {name}
                    </Link>
                  );
                }
                return (
                  <button key={name} onClick={() => selectCategory(name)} type="button">
                    {name}
                  </button>
                );
              })}
            </div>
            <div className="footer-links">
              <strong>আরও জানুন</strong>
              <a href="#footer">আমাদের সম্পর্কে</a>
              <a href="#footer">যোগাযোগ</a>
              <a href="#footer">গোপনীয়তা নীতি</a>
              <a href="#footer">বিজ্ঞাপন</a>
            </div>
            <div className="footer-app">
              <span>পড়ুন, শুনুন, দেখুন</span>
              <strong>{siteName} অ্যাপ</strong>
              <a href="#footer">অ্যাপ ডাউনলোড <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© ২০২৬ {siteName}। সর্বস্বত্ব সংরক্ষিত।</span>
            <span>ঢাকা, বাংলাদেশ <i /> সম্পাদকীয় ও বাণিজ্যিক যোগাযোগ</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
