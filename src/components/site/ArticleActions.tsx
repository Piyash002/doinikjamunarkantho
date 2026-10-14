"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type ArticleActionsProps = {
  postId: string;
  shareCount: number;
  title: string;
};

function subscribeToFontSize(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("article-font-size-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("article-font-size-change", onChange);
  };
}

function getSavedFontSize() {
  const savedSize = Number(window.localStorage.getItem("article-font-size"));
  return Number.isFinite(savedSize) && savedSize >= 16 && savedSize <= 28 ? savedSize : 20;
}

export default function ArticleActions({ postId, shareCount: initialShareCount, title }: ArticleActionsProps) {
  const [shareCount, setShareCount] = useState(initialShareCount);
  const fontSize = useSyncExternalStore(subscribeToFontSize, getSavedFontSize, () => 20);
  const [moreOpen, setMoreOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const requestInFlight = useRef(false);
  const viewRequestForPost = useRef<string | null>(null);

  useEffect(() => {
    if (viewRequestForPost.current === postId) return;
    viewRequestForPost.current = postId;
    fetch(`/api/posts/${encodeURIComponent(postId)}/view`, { method: "POST" })
      .then(async (response) => {
        if (!response.ok) throw new Error("ভিউ গণনা করা যায়নি।");
      })
      .catch(() => setNotice("ভিউ আপডেট করা যায়নি।"));
  }, [postId]);

  useEffect(() => {
    document.documentElement.style.setProperty("--article-font-size", `${fontSize}px`);
  }, [fontSize]);

  function changeFontSize(nextSize: number) {
    window.localStorage.setItem("article-font-size", String(nextSize));
    window.dispatchEvent(new Event("article-font-size-change"));
  }

  async function registerShare() {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    try {
      const response = await fetch(`/api/posts/${encodeURIComponent(postId)}/share`, {
        method: "POST",
      });
      const result = (await response.json()) as { shareCount?: number; error?: string };
      if (!response.ok) throw new Error(result.error || "শেয়ার গণনা করা যায়নি।");
      if (typeof result.shareCount === "number") setShareCount(result.shareCount);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "শেয়ার গণনা করা যায়নি।");
    } finally {
      window.setTimeout(() => {
        requestInFlight.current = false;
      }, 650);
    }
  }

  async function copyLink() {
    await registerShare();
    try {
      await navigator.clipboard.writeText(window.location.href);
      setNotice("লিংক কপি হয়েছে।");
    } catch {
      setNotice("লিংক কপি করা যায়নি।");
    }
  }

  function openShare(url: string) {
    void registerShare();
    window.open(url, "_blank", "noopener,noreferrer,width=640,height=560");
  }

  function shareOnWeb() {
    if (navigator.share) {
      void registerShare();
      void navigator.share({ title, url: window.location.href }).catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setNotice("শেয়ার মেনু খোলা যায়নি।");
        }
      });
    } else {
      void copyLink();
    }
  }

  const pageUrl = typeof window === "undefined" ? "" : window.location.href;
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title);

  return (
    <>
      <div aria-label="শেয়ার ও পাঠ সেটিংস" className="article-actions">
        <div aria-label="শেয়ার" className="article-share-tools">
          <span className="article-share-count"><strong>{shareCount}</strong><small>Shares</small></span>
          <button
            aria-label="ফেসবুকে শেয়ার করুন"
            className="share-icon share-facebook"
            onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
            type="button"
          >f</button>
          <button
            aria-label="হোয়াটসঅ্যাপে শেয়ার করুন"
            className="share-icon share-whatsapp"
            onClick={() => openShare(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`)}
            type="button"
          >◉</button>
          <button aria-label="শেয়ার করুন" className="share-icon" onClick={shareOnWeb} type="button">↗</button>
          <button
            aria-label="Google News-এ দেখুন"
            className="share-icon share-google"
            onClick={() => openShare(`https://news.google.com/search?q=${encodedTitle}`)}
            type="button"
          >G</button>
          <div className="share-more-wrap">
            <button
              aria-expanded={moreOpen}
              aria-label="আরও শেয়ার অপশন"
              className="share-icon"
              onClick={() => setMoreOpen((open) => !open)}
              type="button"
            >+</button>
            {moreOpen && (
              <div className="share-more-menu">
                <button onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`)} type="button">X-এ শেয়ার</button>
                <button onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`)} type="button">LinkedIn</button>
                <button onClick={() => openShare(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`)} type="button">Telegram</button>
                <button onClick={() => void copyLink()} type="button">লিংক কপি</button>
              </div>
            )}
          </div>
          <button aria-label="লিংক কপি করুন" className="share-icon" onClick={() => void copyLink()} type="button">▣</button>
          <button aria-label="প্রিন্ট করুন" className="share-icon" onClick={() => window.print()} type="button">⎙</button>
        </div>
        <div aria-label="লেখার আকার" className="article-font-tools">
          <button aria-label="লেখা বড় করুন" disabled={fontSize >= 28} onClick={() => changeFontSize(Math.min(28, fontSize + 2))} type="button">অ+</button>
          <button aria-label="লেখা ছোট করুন" disabled={fontSize <= 16} onClick={() => changeFontSize(Math.max(16, fontSize - 2))} type="button">অ-</button>
        </div>
      </div>
      <span aria-live="polite" className="article-action-notice" role="status">{notice}</span>
    </>
  );
}
