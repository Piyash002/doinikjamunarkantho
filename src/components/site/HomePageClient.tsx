"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  navCategories?: Array<string | { name_bn?: string; name_en?: string; slug?: string }>;
  trendingKeywords?: string[];
  trendingTopics?: Array<{ _id: string; name: string; slug: string; order?: number }>;
  featuredPosts?: PostLike[];
  latestPosts?: PostLike[];
  popularPosts?: PostLike[];
  opinionPosts?: PostLike[];
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
  navCategories = FALLBACK_CATEGORIES,
  trendingKeywords = FALLBACK_TRENDING,
  trendingTopics = [],
  featuredPosts = [],
  latestPosts = [],
  popularPosts = [],
  opinionPosts = [],
}: HomePageClientProps) {
  const [activeCategory, setActiveCategory] = useState("সর্বশেষ");
  const [activeTab, setActiveTab] = useState("সর্বশেষ");
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const savedTheme = window.localStorage.getItem("theme-preference");
    const preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return savedTheme ? savedTheme === "dark" : preferDark;
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [nowMs, setNowMs] = useState<number | null>(null);

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

  const featuredStories = useMemo<StoryItem[]>(() => {
    const posts = Array.isArray(featuredPosts) ? featuredPosts : [];
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

  const sortedPopular = useMemo<StoryItem[]>(() => {
    const posts = popularStories.length ? popularStories : allStories;
    return [...posts].sort((a, b) => (Number(b.views || 0) || 0) - (Number(a.views || 0) || 0));
  }, [allStories, popularStories]);

  function selectCategory(category: string) {
    setActiveCategory(category);
    setIsMenuOpen(false);
  }

  return (
    <main className="portal" data-theme={isDark ? "dark" : "light"}>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label={`${siteName} - হোম`} onClick={() => selectCategory("সর্বশেষ")}>
            <Image
              className="brand-logo"
              src="/logo.png"
              alt={siteName}
              width={300}
              height={72}
              priority
              unoptimized
            />
          </a>

          <nav className="main-nav" aria-label="প্রধান বিভাগ">
            {normalizedCategories.map((category) => {
              const name = getCategoryName(category as string | { name_bn?: string; name_en?: string; slug?: string } | null | undefined);
              const slug = typeof category === "object" && category?.slug ? category.slug : "";
              if (slug && slug !== "all" && slug !== "latest") {
                return (
                  <Link
                    className="nav-link"
                    href={`/${encodeURIComponent(slug)}`}
                    key={name}
                  >
                    {name}
                  </Link>
                );
              }
              return (
                <button
                  className={activeCategory === name ? "nav-link active" : "nav-link"}
                  key={name}
                  onClick={() => selectCategory(name)}
                  type="button"
                >
                  {name}
                </button>
              );
            })}
          </nav>

          <div className="header-actions">
            <button
              className="icon-button"
              aria-label={isDark ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
              onClick={() => setIsDark((current) => !current)}
              type="button"
            >
              {isDark ? "☀" : "☾"}
            </button>
            <button
              className="icon-button"
              aria-label="খুঁজুন"
              aria-expanded={isSearchOpen}
              onClick={() => setIsSearchOpen((current) => !current)}
              type="button"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 5 5" />
              </svg>
            </button>
            <button
              className="icon-button menu-trigger"
              aria-label="মেনু খুলুন"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(true)}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Navbar 2: Trending Topics Bar directly below Category Navbar */}
        {trendingTopics.length > 0 && (
          <div className="header-trending-bar" aria-label="ট্রেন্ডিং টপিক">
            <div className="header-trending-inner">
              <span className="trending-badge-label">
                <span className="trending-pulse-dot" />
                ট্রেন্ডিং:
              </span>
              <div className="trending-topics-scroll">
                {trendingTopics.map((topic) => (
                  <Link
                    className="trending-topic-link"
                    key={topic._id || topic.slug}
                    href={`/topic/${encodeURIComponent(topic.slug || topic.name)}`}
                  >
                    #{topic.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {isSearchOpen && (
          <form
            className="search-bar"
            onSubmit={(event) => {
              event.preventDefault();
              document.getElementById("news-feed")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              autoFocus
              aria-label="খবর খুঁজুন"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="আপনি কী খুঁজছেন?"
              value={search}
            />
            {search && (
              <button className="search-clear" type="button" onClick={() => setSearch("")}>
                মুছুন
              </button>
            )}
          </form>
        )}
      </header>

      <div className="date-strip">
        <span>বাংলাদেশ সংস্করণ</span>
        <span className="date-divider" />
        <span>ঢাকা ও সারাদেশের সর্বশেষ সংবাদ</span>
        <a href="#news-feed">ই-পেপার <span aria-hidden="true">↗</span></a>
      </div>

      <div className="page-shell" id="top">
        <section className="breaking-news" aria-label="ব্রেকিং নিউজ">
          <span className="breaking-label"><i /> ব্রেকিং</span>
          <span className="breaking-text">
            {(trendingKeywords && trendingKeywords[0]) || "রাজনীতি"} নিয়ে আজকের গুরুত্বপূর্ণ আপডেট এখন অনলাইনে
          </span>
          <span className="breaking-time">সর্বশেষ আপডেট</span>
        </section>

        <div className="ad-leaderboard" aria-label="বিজ্ঞাপন">
          <span className="ad-kicker">স্পনসরড</span>
          <div>
            <strong>{siteName}</strong>
            <span>দৈনিক খবর, একই সঙ্গে ভরসা</span>
          </div>
          <span className="ad-cta">আরও জানুন <b>↗</b></span>
          <span className="ad-orbit orbit-one" />
          <span className="ad-orbit orbit-two" />
        </div>

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
            <div className="sponsor-card">
              <span className="sponsor-label">আজকের বিশেষ</span>
              <div className="sponsor-art">
                <span>নতুন দিন,</span>
                <strong>নতুন সম্ভাবনা</strong>
                <small>প্রতিটি মুহূর্তে থাকুন সতেজ</small>
              </div>
              <a href="#footer">আরও জানুন <span aria-hidden="true">↗</span></a>
            </div>
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

        <div className="ad-banner" aria-label="বিজ্ঞাপন">
          <div className="ad-airline">WEEKLY <strong>GETAWAY</strong></div>
          <div className="ad-banner-copy">
            <span>দূরের পথে</span>
            <strong>এবার একটু নিজের মতো</strong>
          </div>
          <span className="ad-banner-link">পরিকল্পনা করুন <b>↗</b></span>
          <span className="ad-small-label">বিজ্ঞাপন</span>
        </div>

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

      {isMenuOpen && (
        <div className="menu-layer">
          <button aria-label="মেনু বন্ধ করুন" className="menu-backdrop" onClick={() => setIsMenuOpen(false)} type="button" />
          <aside aria-label="সব বিভাগ" className="menu-panel">
            <div className="menu-panel-header">
              <span>সব বিভাগ</span>
              <button aria-label="বন্ধ করুন" onClick={() => setIsMenuOpen(false)} type="button">×</button>
            </div>
            <p>আপনার পছন্দের খবর বেছে নিন</p>
            <div className="menu-category-grid">
              {normalizedCategories.map((category) => {
                const name = getCategoryName(category as string | { name_bn?: string; name_en?: string; slug?: string } | null | undefined);
                const slug = typeof category === "object" && category?.slug ? category.slug : "";
                if (slug && slug !== "all" && slug !== "latest") {
                  return (
                    <Link
                      key={name}
                      href={`/${encodeURIComponent(slug)}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>•</span>{name}<b aria-hidden="true">↗</b>
                    </Link>
                  );
                }
                return (
                  <button key={name} onClick={() => selectCategory(name)} type="button">
                    <span>•</span>{name}<b aria-hidden="true">↗</b>
                  </button>
                );
              })}
            </div>
            <div className="menu-footer">
              <a href="#footer">আমাদের সম্পর্কে</a>
              <a href="#footer">যোগাযোগ</a>
              <a href="#footer">বিজ্ঞাপন</a>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
