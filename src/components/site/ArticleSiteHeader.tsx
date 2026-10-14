"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type NavCategory = {
  _id?: string;
  name_bn: string;
  slug: string;
  name_en?: string;
  order?: number;
};

type ArticleSiteHeaderProps = {
  siteName: string;
  logoUrl?: string;
  categories: NavCategory[];
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
  const savedTheme = window.localStorage.getItem("theme-preference") || window.localStorage.getItem("theme");
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
  const panelRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    if (menuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMenuOpen(false);
          return;
        }
        if (e.key === "Tab" && panelRef.current) {
          const focusable = panelRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [menuOpen]);

  function toggleTheme() {
    const next = !getThemeSnapshot();
    const nextTheme = next ? "dark" : "light";
    try {
      window.localStorage.setItem("theme-preference", nextTheme);
      window.localStorage.setItem("theme", nextTheme);
    } catch {}
    document.documentElement.dataset.theme = nextTheme;
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("theme-preference-change"));
  }

  const cleanLogoUrl = logoUrl && !logoUrl.includes("photo-1529107386315") ? logoUrl : "/logo.png";

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
              src={cleanLogoUrl}
              alt={siteName}
              width={220}
              height={44}
              priority
            />
          </Link>

          {/* TOP NAV BAR: Only top-level categories, plain links, no dropdowns, horizontally scrollable */}
          <nav className="main-nav" aria-label="প্রধান বিভাগ">
            <Link
              href="/"
              className={!activeSlug || activeSlug === "latest" || activeSlug === "all" ? "nav-link active" : "nav-link"}
            >
              সর্বশেষ
            </Link>
            {categories.map((category) => {
              const isActive = activeSlug === category.slug;
              return (
                <Link
                  key={category.slug || category._id}
                  className={isActive ? "nav-link active" : "nav-link"}
                  href={`/${encodeURIComponent(category.slug)}`}
                >
                  {category.name_bn}
                </Link>
              );
            })}
          </nav>

          {/* HEADER RIGHT-SIDE CONTROLS: Dark mode, Search, Hamburger. Each touch target >= 44px */}
          <div className="header-actions">
            <button
              aria-label={isDark ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
              className="icon-button"
              onClick={toggleTheme}
              type="button"
            >
              {isDark ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>
            <button
              aria-label="খুঁজুন"
              aria-expanded={searchOpen}
              className="icon-button"
              onClick={() => setSearchOpen((open) => !open)}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Search Overlay Bar */}
        {searchOpen && (
          <form action="/search" method="GET" className="search-bar">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.8" />
              <path d="m16 16 5 5" />
            </svg>
            <input autoFocus aria-label="খবর খুঁজুন" name="q" placeholder="আপনি কী খুঁজছেন?" />
            <button className="search-clear" type="submit">খুঁজুন</button>
          </form>
        )}
      </header>

      {/* SIDEBAR MENU: Full-screen overlay, top-level chips only, footer intact, closes on X/outside/Esc/tap */}
      {menuOpen && (
        <div className="menu-layer" role="dialog" aria-modal="true" aria-label="সব বিভাগ মেনু">
          <button
            aria-label="মেনু বন্ধ করুন"
            className="menu-backdrop"
            onClick={() => setMenuOpen(false)}
            type="button"
          />
          <aside ref={panelRef} className="menu-panel">
            <div className="menu-panel-header">
              <span>সব বিভাগ</span>
              <div className="header-actions">
                <button
                  aria-label={isDark ? "লাইট মোড চালু করুন" : "ডার্ক মোড চালু করুন"}
                  className="icon-button"
                  onClick={toggleTheme}
                  type="button"
                >
                  {isDark ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41 1.41" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                    </svg>
                  )}
                </button>
                <button
                  ref={closeBtnRef}
                  aria-label="বন্ধ করুন"
                  className="menu-close-btn"
                  onClick={() => setMenuOpen(false)}
                  type="button"
                >
                  ×
                </button>
              </div>
            </div>

            <p>আপনার পছন্দের খবর বেছে নিন</p>

            {/* ONLY top-level categories as chips */}
            <div className="menu-category-grid">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
              >
                <span>•</span>সর্বশেষ<b aria-hidden="true">↗</b>
              </Link>
              {categories.map((category) => (
                <Link
                  href={`/${encodeURIComponent(category.slug)}`}
                  key={category.slug || category._id}
                  onClick={() => setMenuOpen(false)}
                >
                  <span>•</span>{category.name_bn}<b aria-hidden="true">↗</b>
                </Link>
              ))}
            </div>

            {/* Existing footer part of the overlay unchanged */}
            <div className="menu-footer-block">
              <div className="menu-social-row">
                <span className="menu-social-title">অনুসরণ করুন:</span>
                <div className="menu-social-icons">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                  <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Channel">
                    <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                  </a>
                </div>
              </div>

              <div className="menu-app-promo">
                <a href="#download-app" className="menu-app-link">
                  <span>📱 Google Play / অ্যাপ ডাউনলোড</span>
                </a>
              </div>

              <div className="menu-footer-links">
                <a href="#about" onClick={() => setMenuOpen(false)}>আমাদের সম্পর্কে</a>
                <a href="#contact" onClick={() => setMenuOpen(false)}>যোগাযোগ</a>
                <a href="#privacy" onClick={() => setMenuOpen(false)}>গোপনীয়তা নীতি</a>
                <a href="#ad" onClick={() => setMenuOpen(false)}>বিজ্ঞাপন</a>
              </div>

              <div className="menu-footer-copy">
                <span>ঢাকা, বাংলাদেশ | সম্পাদকীয় ও বাণিজ্যিক যোগাযোগ</span>
                <span>© ২০২৬ {siteName}। সর্বস্বত্ব সংরক্ষিত।</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
