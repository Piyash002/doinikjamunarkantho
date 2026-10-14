"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

type ArticleCategory = {
  name_bn: string;
  slug: string;
  name_en?: string;
  subCategories?: Array<{ name_bn: string; slug: string; name_en?: string }>;
};

type ArticleSiteHeaderProps = {
  siteName: string;
  logoUrl?: string;
  categories: ArticleCategory[];
  activeSlug?: string;
  trendingTopics?: Array<{ _id?: string; name: string; slug: string }>;
};

function subscribeToTheme(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  window.addEventListener("storage", onChange);
  window.addEventListener("theme-preference-change", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener("theme-preference-change", onChange);
  };
}

function getThemeSnapshot() {
  const savedTheme = window.localStorage.getItem("theme-preference");
  return savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export default function ArticleSiteHeader({
  siteName,
  logoUrl,
  categories,
  activeSlug,
  trendingTopics = [],
}: ArticleSiteHeaderProps) {
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, [isDark]);

  function toggleTheme() {
    const next = !getThemeSnapshot();
    window.localStorage.setItem("theme-preference", next ? "dark" : "light");
    document.documentElement.dataset.theme = next ? "dark" : "light";
    window.dispatchEvent(new Event("theme-preference-change"));
  }

  return (
    <>
      <div className="date-strip">
        <span>বাংলাদেশ সংস্করণ</span>
        <span className="date-divider" />
        <span>ঢাকা ও সারাদেশের সর্বশেষ সংবাদ</span>
        <a href="/">ই-পেপার <span aria-hidden="true">↗</span></a>
      </div>

      <header className="site-header article-site-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label={`${siteName} - হোম`}>
            <Image
              className="brand-logo"
              src={logoUrl || "/logo.png"}
              alt={siteName}
              width={300}
              height={72}
              priority
            />
          </Link>
          <nav className="main-nav" aria-label="প্রধান বিভাগ">
            {categories.map((category) => {
              const subCats = Array.isArray(category.subCategories) ? category.subCategories : [];
              const hasDropdown = subCats.length > 0 || category.name_bn === "সারাদেশ" || category.name_bn === "বিভাগ";
              const isActive = activeSlug === category.slug;

              return (
                <div className="nav-item-dropdown" key={category.slug}>
                  <Link
                    className={isActive ? "nav-link active" : "nav-link"}
                    href={`/${encodeURIComponent(category.slug)}`}
                  >
                    <span>{category.name_bn}</span>
                    {hasDropdown && (
                      <svg className="nav-dropdown-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    )}
                  </Link>
                  {hasDropdown && subCats.length > 0 && (
                    <div className="nav-dropdown-menu">
                      {subCats.map((sub) => (
                        <Link
                          key={sub.name_bn || sub.slug}
                          className="nav-dropdown-item"
                          href={`/${encodeURIComponent(category.slug)}?sub=${encodeURIComponent(sub.name_bn)}`}
                        >
                          {sub.name_bn}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
          <div className="header-actions">
            <button
              aria-label={isDark ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
              className="icon-button"
              onClick={toggleTheme}
              type="button"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </button>
            <button
              aria-label="খুঁজুন"
              aria-expanded={searchOpen}
              className="icon-button"
              onClick={() => setSearchOpen((open) => !open)}
              type="button"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <button
              aria-label="মেনু খুলুন"
              aria-expanded={menuOpen}
              className="icon-button menu-trigger"
              onClick={() => setMenuOpen(true)}
              type="button"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navbar 2: Trending Topics Bar (Dhaka Post Style) */}
        {trendingTopics.length > 0 && (
          <div className="header-trending-bar" aria-label="ট্রেন্ডিং টপিক">
            <div className="header-trending-inner">
              <span className="trending-badge-pill">
                <span>ট্রেন্ডিং</span>
                <svg className="trending-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </span>
              <div className="trending-topics-scroll">
                {trendingTopics.map((topic) => (
                  <Link
                    className="trending-topic-chip"
                    key={topic._id || topic.slug || topic.name}
                    href={`/topic/${encodeURIComponent(topic.slug || topic.name)}`}
                  >
                    {topic.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {searchOpen && (
          <form action="/search" className="search-bar">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 5 5" />
            </svg>
            <input aria-label="খবর খুঁজুন" name="q" placeholder="আপনি কী খুঁজছেন?" />
            <button className="search-clear" type="submit">খুঁজুন</button>
          </form>
        )}
      </header>
      {menuOpen && (
        <div className="menu-layer">
          <button
            aria-label="মেনু বন্ধ করুন"
            className="menu-backdrop"
            onClick={() => setMenuOpen(false)}
            type="button"
          />
          <aside aria-label="সব বিভাগ" className="menu-panel">
            <div className="menu-panel-header">
              <span>সব বিভাগ</span>
              <button aria-label="বন্ধ করুন" onClick={() => setMenuOpen(false)} type="button">×</button>
            </div>
            <p>আপনার পছন্দের খবর বেছে নিন</p>
            <div className="menu-category-grid">
              {categories.map((category) => (
                <Link
                  href={`/${encodeURIComponent(category.slug)}`}
                  key={category.slug}
                  onClick={() => setMenuOpen(false)}
                >
                  <span>•</span>{category.name_bn}<b aria-hidden="true">↗</b>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
