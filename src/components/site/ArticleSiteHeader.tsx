"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

type ArticleCategory = {
  name_bn: string;
  slug: string;
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
            {categories.map((category) => (
              <Link
                className={activeSlug === category.slug ? "nav-link active" : "nav-link"}
                href={`/${encodeURIComponent(category.slug)}`}
                key={category.slug}
              >
                {category.name_bn}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <button
              aria-label={isDark ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
              className="icon-button"
              onClick={toggleTheme}
              type="button"
            >
              {isDark ? "☀" : "☾"}
            </button>
            <button
              aria-label="খুঁজুন"
              aria-expanded={searchOpen}
              className="icon-button"
              onClick={() => setSearchOpen((open) => !open)}
              type="button"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 5 5" />
              </svg>
            </button>
            <button
              aria-label="মেনু খুলুন"
              aria-expanded={menuOpen}
              className="icon-button menu-trigger"
              onClick={() => setMenuOpen(true)}
              type="button"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Navbar 2: Trending Topics Bar directly below Categories */}
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
