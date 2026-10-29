"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Printer, Copy, Check, Share2, Eye, Plus } from "lucide-react";
import { RetroPrinterIcon } from "./UnderImagePrintButton";

type ArticleActionsProps = {
  postId: string;
  shareCount: number;
  viewCount?: number;
  title: string;
  shareUrl?: string;
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

export default function ArticleActions({
  postId,
  shareCount: initialShareCount,
  viewCount: initialViewCount = 0,
  title,
  shareUrl,
}: ArticleActionsProps) {
  const [shareCount, setShareCount] = useState(initialShareCount);
  const [viewCount, setViewCount] = useState(initialViewCount);
  const fontSize = useSyncExternalStore(subscribeToFontSize, getSavedFontSize, () => 20);
  const [moreOpen, setMoreOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const requestInFlight = useRef(false);
  const viewRequestForPost = useRef<string | null>(null);

  // Track and update persistent view count
  useEffect(() => {
    if (viewRequestForPost.current === postId) return;
    viewRequestForPost.current = postId;
    fetch(`/api/posts/${encodeURIComponent(postId)}/view`, { method: "POST" })
      .then(async (response) => {
        if (!response.ok) return;
        const result = await response.json();
        if (typeof result.views === "number") {
          setViewCount(result.views);
        } else if (typeof result.viewCount === "number") {
          setViewCount(result.viewCount);
        }
      })
      .catch(() => { });
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

  const [currentUrl, setCurrentUrl] = useState(shareUrl || "");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (shareUrl) {
          const parsed = new URL(shareUrl, window.location.origin);
          if (
            (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
            window.location.hostname !== "localhost" &&
            window.location.hostname !== "127.0.0.1"
          ) {
            parsed.protocol = window.location.protocol;
            parsed.host = window.location.host;
          }
          setCurrentUrl(parsed.toString());
        } else {
          setCurrentUrl(window.location.href);
        }
      } catch {
        setCurrentUrl(window.location.href);
      }
    }
  }, [shareUrl]);

  const cleanUrl = currentUrl || shareUrl || (typeof window === "undefined" ? "" : window.location.href);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shortShareUrl = postId && origin ? `${origin}/p/${postId}` : cleanUrl;
  const encodedShareUrl = encodeURIComponent(shortShareUrl);
  const encodedUrl = encodedShareUrl;
  const encodedTitle = encodeURIComponent(title);
  const whatsappShareText = encodeURIComponent(`${title}\n\n${shortShareUrl}`);

  async function copyLink() {
    await registerShare();
    try {
      await navigator.clipboard.writeText(shortShareUrl);
      setCopied(true);
      setNotice("লিংক কপি হয়েছে।");
      window.setTimeout(() => setCopied(false), 2500);
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
      void navigator.share({ title, url: shortShareUrl }).catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setNotice("শেয়ার মেনু খোলা যায়নি।");
        }
      });
    } else {
      void copyLink();
    }
  }

  function openPrintModal() {
    window.dispatchEvent(new CustomEvent("open-print-modal"));
  }

  return (
    <>
      <div aria-label="শেয়ার ও পাঠ সেটিংস" className="article-actions">
        <div aria-label="শেয়ার ও ভিউ" className="article-share-tools">
          {/* Persistent View Count Badge */}
          <span className="article-stat-badge article-view-count" title="মোট পঠিত সংখ্যা (Views)">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <strong>{viewCount}</strong>
            <small>Views</small>
          </span>

          {/* Persistent Share Count Badge */}
          <span className="article-stat-badge article-share-count" title="মোট শেয়ার সংখ্যা (Shares)">
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <strong>{shareCount}</strong>
            <small>Shares</small>
          </span>

          {/* Print News Action Button (Sirajganj TV Style) */}
          <button
            aria-label="সংবাদটি প্রিন্ট ও JPG সেভ করুন"
            className="article-print-action-btn"
            onClick={openPrintModal}
            title="সংবাদটি প্রিন্ট ও JPG সেভ করুন"
            type="button"
          >
            <RetroPrinterIcon className="w-[18px] h-[18px]" />
            <span>প্রিন্ট নিউজ</span>
          </button>

          {/* Facebook */}
          <button
            aria-label="ফেসবুকে শেয়ার করুন"
            className="share-icon share-facebook"
            onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedShareUrl}`)}
            title="Facebook-এ শেয়ার করুন"
            type="button"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </button>

          {/* WhatsApp */}
          <button
            aria-label="হোয়াটসঅ্যাপে শেয়ার করুন"
            className="share-icon share-whatsapp"
            onClick={() => openShare(`https://api.whatsapp.com/send?text=${whatsappShareText}`)}
            title="WhatsApp-এ শেয়ার করুন"
            type="button"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12.031 0C5.395 0 .016 5.379.016 12.016c0 2.122.554 4.189 1.607 6.014L0 24l6.166-1.616a11.968 11.968 0 0 0 5.865 1.523h.005c6.633 0 12.013-5.379 12.013-12.016 0-3.208-1.25-6.224-3.52-8.496A11.95 11.95 0 0 0 12.031 0zm0 22.016h-.004a9.99 9.99 0 0 1-5.093-1.39l-.365-.217-3.784.992 1.01-3.69-.238-.378a9.954 9.954 0 0 1-1.542-5.317c0-5.523 4.492-10.016 10.019-10.016 2.674 0 5.187 1.042 7.078 2.934a9.946 9.946 0 0 1 2.933 7.082c0 5.525-4.492 10.018-10.014 10.018zm5.485-7.5c-.3-.15-1.776-.877-2.051-.977-.276-.1-.476-.15-.676.15-.2.3-.776.977-.951 1.176-.176.2-.351.226-.651.076-.3-.15-1.268-.468-2.416-1.492-.894-.797-1.498-1.782-1.674-2.082-.175-.3-.019-.462.131-.612.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525s-.676-1.63-.926-2.232c-.244-.586-.492-.507-.676-.516l-.576-.01c-.2 0-.525.075-.8.375s-1.05 1.026-1.05 2.502 1.075 2.903 1.225 3.103c.15.2 2.115 3.23 5.124 4.53.715.31 1.274.495 1.71.633.719.229 1.374.197 1.892.12.577-.087 1.776-.726 2.026-1.427.25-.7.25-1.302.175-1.427-.075-.125-.275-.2-.575-.35z" />
            </svg>
          </button>

          {/* Web Share */}
          <button
            aria-label="শেয়ার করুন"
            className="share-icon"
            onClick={shareOnWeb}
            title="শেয়ার করুন"
            type="button"
          >
            <Share2 className="w-[18px] height-[18px]" />
          </button>

          {/* Google News */}
          <button
            aria-label="Google News-এ দেখুন"
            className="share-icon share-google"
            onClick={() => openShare(`https://news.google.com/search?q=${encodedTitle}`)}
            title="Google News-এ দেখুন"
            type="button"
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
          </button>

          {/* More options */}
          <div className="share-more-wrap">
            <button
              aria-expanded={moreOpen}
              aria-label="আরও শেয়ার অপশন"
              className="share-icon"
              onClick={() => setMoreOpen((open) => !open)}
              title="আরও শেয়ার অপশন"
              type="button"
            >
              <Plus className="w-[18px] height-[18px]" />
            </button>
            {moreOpen && (
              <div className="share-more-menu">
                <button onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodedShareUrl}&text=${encodedTitle}`)} type="button">X (Twitter)-এ শেয়ার</button>
                <button onClick={() => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`)} type="button">LinkedIn</button>
                <button onClick={() => openShare(`https://t.me/share/url?url=${encodedShareUrl}&text=${encodedTitle}`)} type="button">Telegram</button>
                <button onClick={() => void copyLink()} type="button">লিংক কপি করুন</button>
              </div>
            )}
          </div>

          {/* Copy Link */}
          <button
            aria-label="লিংক কপি করুন"
            className="share-icon"
            onClick={() => void copyLink()}
            title={copied ? "লিংক কপি হয়েছে!" : "লিংক কপি করুন"}
            type="button"
          >
            {copied ? <Check className="w-[18px] height-[18px] text-emerald-600" /> : <Copy className="w-[18px] height-[18px]" />}
          </button>
        </div>

        {/* Text Zoom In / Zoom Out */}
        <div aria-label="লেখার আকার" className="article-font-tools">
          <button
            aria-label="লেখা বড় করুন"
            disabled={fontSize >= 28}
            onClick={() => changeFontSize(Math.min(28, fontSize + 2))}
            title="লেখা বড় করুন (Zoom In)"
            type="button"
          >
            অ+
          </button>
          <button
            aria-label="লেখা ছোট করুন"
            disabled={fontSize <= 16}
            onClick={() => changeFontSize(Math.max(16, fontSize - 2))}
            title="লেখা ছোট করুন (Zoom Out)"
            type="button"
          >
            অ-
          </button>
        </div>
      </div>
      <span aria-live="polite" className="article-action-notice" role="status">{notice}</span>
    </>
  );
}
