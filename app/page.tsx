"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Story = {
  category: string;
  title: string;
  excerpt: string;
  image: string;
  time: string;
};

const categories = [
  "সর্বশেষ",
  "জাতীয়",
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

const stories: Story[] = [
  {
    category: "জাতীয়",
    title: "নতুন পোশাকে পূজার সাজ, কেনাকাটায় জমজমাট ঢাকার বাজার",
    excerpt: "উৎসবকে সামনে রেখে রাজধানীর বিপণিবিতানগুলোতে বেড়েছে ক্রেতাদের ভিড়।",
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=85",
    time: "১২ মিনিট আগে",
  },
  {
    category: "রাজনীতি",
    title: "বিরোধী দল কমিটিতে না এলেও বৈঠকে অংশ নিতে পারে",
    excerpt: "আলোচনার মাধ্যমে সমাধানের পথ খোলা রাখতে চায় সংশ্লিষ্ট পক্ষগুলো।",
    image:
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=85",
    time: "২৭ মিনিট আগে",
  },
  {
    category: "সারাদেশ",
    title: "পুরান ঢাকার ঐতিহ্যবাহী ভবন ঘিরে নতুন করে আলোচনা",
    excerpt: "সংরক্ষণ ও নিরাপত্তা নিশ্চিত করতে সংশ্লিষ্ট দপ্তরকে নির্দেশনা।",
    image:
      "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=85",
    time: "৩৫ মিনিট আগে",
  },
  {
    category: "খেলা",
    title: "দুর্দান্ত জয়ে সিরিজে সমতা ফেরাল বাংলাদেশ",
    excerpt: "ব্যাটে-বলে দাপট দেখিয়ে শেষ পর্যন্ত স্বস্তির জয় তুলে নিয়েছে দল।",
    image:
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=900&q=85",
    time: "৪৮ মিনিট আগে",
  },
  {
    category: "অর্থনীতি",
    title: "রপ্তানি আয়ে ইতিবাচক ধারা, নতুন বাজারে বাড়ছে চাহিদা",
    excerpt: "চলতি অর্থবছরের প্রথম প্রান্তিকে বেশ কয়েকটি খাতে প্রবৃদ্ধি।",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=85",
    time: "১ ঘণ্টা আগে",
  },
  {
    category: "আন্তর্জাতিক",
    title: "জলবায়ু সম্মেলনে নবায়নযোগ্য জ্বালানিতে জোর বিশ্বনেতাদের",
    excerpt: "কার্বন নিঃসরণ কমাতে সমন্বিত পরিকল্পনার আহ্বান জানিয়েছেন তারা।",
    image:
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=900&q=85",
    time: "১ ঘণ্টা আগে",
  },
  {
    category: "বিনোদন",
    title: "নতুন সিনেমা নিয়ে দর্শকের সামনে আসছেন জনপ্রিয় অভিনেত্রী",
    excerpt: "শিগগিরই প্রেক্ষাগৃহে মুক্তি পাবে বহুল প্রতীক্ষিত ছবিটি।",
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=900&q=85",
    time: "২ ঘণ্টা আগে",
  },
  {
    category: "প্রযুক্তি",
    title: "কৃত্রিম বুদ্ধিমত্তায় বদলে যাচ্ছে তরুণদের কাজের ধরন",
    excerpt: "নতুন দক্ষতা শেখার পাশাপাশি সাইবার নিরাপত্তায়ও সতর্ক থাকার পরামর্শ।",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=85",
    time: "২ ঘণ্টা আগে",
  },
  {
    category: "স্বাস্থ্য",
    title: "ডেঙ্গু প্রতিরোধে বাড়ির আশপাশ পরিষ্কার রাখার পরামর্শ",
    excerpt: "জ্বর হলে অবহেলা না করে দ্রুত চিকিৎসকের পরামর্শ নিতে বলছেন বিশেষজ্ঞরা।",
    image:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=85",
    time: "৩ ঘণ্টা আগে",
  },
];

const popularStories = [
  "বন্যার্তদের পাশে দাঁড়াতে দেশজুড়ে মানুষের উদ্যোগ",
  "মনসুর খান প্লাজার আগুনে ক্ষতিগ্রস্ত পুরান ঢাকার ব্যবসায়ীরা",
  "ভালো বেতনের আশায় মালয়েশিয়ায় গিয়ে প্রতারণার শিকার",
  "শিক্ষাপ্রতিষ্ঠানে নতুন সময়সূচি, যা জানাল শিক্ষা মন্ত্রণালয়",
];

function NewsImage({
  src,
  alt,
  className,
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className: string;
  loading?: "eager" | "lazy";
}) {
  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={900}
      height={600}
      loading={loading}
      unoptimized
    />
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("সর্বশেষ");
  const [activeTab, setActiveTab] = useState<"সর্বশেষ" | "জনপ্রিয়">("সর্বশেষ");
  const [isDark, setIsDark] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const visibleStories = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("bn");

    return stories.filter((story) => {
      const matchesCategory =
        activeCategory === "সর্বশেষ" || story.category === activeCategory;
      const matchesSearch =
        !normalizedSearch ||
        `${story.title} ${story.excerpt} ${story.category}`
          .toLocaleLowerCase("bn")
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  function selectCategory(category: string) {
    setActiveCategory(category);
    setIsMenuOpen(false);
  }

  return (
    <main className="portal" data-theme={isDark ? "dark" : "light"}>
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#top"
            aria-label="দৈনিক যমুনা কণ্ঠ - হোম"
            onClick={() => selectCategory("সর্বশেষ")}
          >
            <span className="brand-mark" aria-hidden="true">
              য
            </span>
            <span className="brand-name">
              দৈনিক <strong>যমুনা কণ্ঠ</strong>
              <small>সত্যের সঙ্গে, মানুষের পাশে</small>
            </span>
          </a>

          <nav className="main-nav" aria-label="প্রধান বিভাগ">
            {categories.slice(0, 8).map((category) => (
              <button
                className={activeCategory === category ? "nav-link active" : "nav-link"}
                key={category}
                onClick={() => selectCategory(category)}
              >
                {category}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className="icon-button"
              aria-label={isDark ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
              onClick={() => setIsDark((current) => !current)}
            >
              {isDark ? "☀" : "☾"}
            </button>
            <button
              className="icon-button"
              aria-label="খুঁজুন"
              aria-expanded={isSearchOpen}
              onClick={() => setIsSearchOpen((current) => !current)}
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
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
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
              <button
                className="search-clear"
                type="button"
                onClick={() => setSearch("")}
              >
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
        <div className="category-strip" aria-label="সব সংবাদ বিভাগ">
          <span className="category-label">বিভাগ</span>
          {categories.map((category) => (
            <button
              className={
                activeCategory === category
                  ? "category-chip selected"
                  : "category-chip"
              }
              key={category}
              onClick={() => selectCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <section className="breaking-news" aria-label="ব্রেকিং নিউজ">
          <span className="breaking-label"><i /> ব্রেকিং</span>
          <span className="breaking-text">
            রাজধানীতে গণপরিবহনে নতুন নির্দেশনা, আজ থেকেই কার্যকর
          </span>
          <span className="breaking-time">সর্বশেষ আপডেট</span>
        </section>

        <div className="ad-leaderboard" aria-label="বিজ্ঞাপন">
          <span className="ad-kicker">স্পনসরড</span>
          <div>
            <strong>আপনার প্রতিদিনের গল্প শুরু হোক</strong>
            <span>নতুন সম্ভাবনা, নতুন পথচলা</span>
          </div>
          <span className="ad-cta">আরও জানুন <b>↗</b></span>
          <span className="ad-orbit orbit-one" />
          <span className="ad-orbit orbit-two" />
        </div>

        <section className="top-grid" aria-label="প্রধান সংবাদ">
          <div className="lead-story">
            <div className="lead-copy">
              <span className="eyebrow"><i /> আজকের প্রধান খবর</span>
              <h1>সিএনজিচালিত বাসেও ডিজেলের ভাড়া, যাত্রী ঠকিয়ে বাড়তি টাকা আদায়</h1>
              <p>
                ডিজেলের দাম বাড়ার বাসভাড়া সমন্বয় করেছে সরকার। তবে সেই সুযোগে
                সিএনজিচালিত বাসেও বাড়তি ভাড়া আদায়ের অভিযোগ উঠেছে।
              </p>
              <div className="story-meta">
                <span>নিজস্ব প্রতিবেদক</span><i /> <span>আজ, ১১:৪৫</span>
              </div>
              <a className="read-more" href="#news-feed">
                বিস্তারিত পড়ুন <span aria-hidden="true">↗</span>
              </a>
            </div>
            <a className="lead-image-wrap" href="#news-feed" aria-label="প্রধান খবর পড়ুন">
              <NewsImage
                alt="ঢাকার ব্যস্ত সড়কে চলাচল করছে একটি বাস"
                className="lead-image"
                loading="eager"
                src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1400&q=90"
              />
              <span className="image-caption">নগরজীবন <i /> ৩ মিনিট আগে</span>
            </a>
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
                <div className="opinion-avatar">আ</div>
                <div>
                  <h3>ডেঙ্গু ও মশার ঝুঁকি মোকাবিলায় চাই বাড়তি সচেতনতা</h3>
                  <p>ড. আনোয়ার হোসেন পারভেজ</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="quick-stories" aria-label="আরও গুরুত্বপূর্ণ খবর">
          {stories.slice(0, 3).map((story, index) => (
            <a className="quick-story" href="#news-feed" key={story.title}>
              <div>
                <span className="story-category">{story.category}</span>
                <h2>{index === 0 ? "মনসুর খান প্লাজার আগুনে পুরান ঢাকায় ক্ষয়ক্ষতি" : story.title}</h2>
                <p>{story.time}</p>
              </div>
              <NewsImage
                alt={story.title}
                className="quick-image"
                src={story.image}
              />
            </a>
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
                <h2>{search ? "খোঁজের ফলাফল" : activeCategory}</h2>
              </div>
              <button
                className="view-all"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("সর্বশেষ");
                }}
              >
                সব খবর <span aria-hidden="true">→</span>
              </button>
            </div>
            {visibleStories.length ? (
              <div className="story-grid">
                {visibleStories.map((story, index) => (
                  <article className={index === 0 ? "story-card featured-card" : "story-card"} key={story.title}>
                    <a href="#top" className="story-image-link" aria-label={`${story.title} পড়ুন`}>
                      <NewsImage
                        alt={story.title}
                        className="story-image"
                        src={story.image}
                      />
                      <span className="image-arrow" aria-hidden="true">↗</span>
                    </a>
                    <div className="story-card-copy">
                      <span className="story-category">{story.category}</span>
                      <h3><a href="#top">{story.title}</a></h3>
                      <p>{story.excerpt}</p>
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
                <button onClick={() => selectCategory("সর্বশেষ")}>সর্বশেষ খবর দেখুন</button>
              </div>
            )}
          </div>

          <aside className="feed-sidebar">
            <div className="sidebar-tabs" role="tablist" aria-label="খবরের তালিকা">
              {(["সর্বশেষ", "জনপ্রিয়"] as const).map((tab) => (
                <button
                  aria-selected={activeTab === tab}
                  className={activeTab === tab ? "sidebar-tab active" : "sidebar-tab"}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  role="tab"
                >
                  {tab}
                </button>
              ))}
            </div>
            <ol className="sidebar-list">
              {(activeTab === "সর্বশেষ"
                ? stories.slice(0, 5).map((story) => story.title)
                : popularStories
              ).map((title, index) => (
                <li key={title}>
                  <span className="list-number">
                    {["০১", "০২", "০৩", "০৪", "০৫"][index]}
                  </span>
                  <a href="#top">{title}</a>
                  {activeTab === "সর্বশেষ" && (
                    <span className="sidebar-time">{stories[index]?.time}</span>
                  )}
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
                <span className="brand-mark" aria-hidden="true">য</span>
                <span className="brand-name">দৈনিক <strong>যমুনা কণ্ঠ</strong><small>সত্যের সঙ্গে, মানুষের পাশে</small></span>
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
              {categories.slice(1, 6).map((category) => (
                <button key={category} onClick={() => selectCategory(category)}>{category}</button>
              ))}
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
              <strong>যমুনা কণ্ঠ অ্যাপ</strong>
              <a href="#footer">অ্যাপ ডাউনলোড <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© ২০২৬ দৈনিক যমুনা কণ্ঠ। সর্বস্বত্ব সংরক্ষিত।</span>
            <span>ঢাকা, বাংলাদেশ <i /> সম্পাদকীয় ও বাণিজ্যিক যোগাযোগ</span>
          </div>
        </footer>
      </div>

      {isMenuOpen && (
        <div className="menu-layer">
          <button
            aria-label="মেনু বন্ধ করুন"
            className="menu-backdrop"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside aria-label="সব বিভাগ" className="menu-panel">
            <div className="menu-panel-header">
              <span>সব বিভাগ</span>
              <button aria-label="বন্ধ করুন" onClick={() => setIsMenuOpen(false)}>×</button>
            </div>
            <p>আপনার পছন্দের খবর বেছে নিন</p>
            <div className="menu-category-grid">
              {categories.map((category) => (
                <button key={category} onClick={() => selectCategory(category)}>
                  <span>•</span>{category}<b aria-hidden="true">↗</b>
                </button>
              ))}
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
