"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Printer, Download, Loader2, X } from "lucide-react";
import { toJpeg } from "html-to-image";

export type PrintNewsData = {
  title: string;
  lead?: string;
  publishedDate: string;
  authorName: string;
  authorDesignation?: string;
  imageUrl?: string;
  imageCaption?: string;
  contentHtml: string;
  siteName: string;
  logoUrl?: string;
  tagline?: string;
  editorName?: string;
  phone?: string;
  footerAddress?: string;
  copyrightText?: string;
};

type PrintNewsModalProps = {
  data: PrintNewsData;
};

function formatCurrentBanglaDateTime(): string {
  const d = new Date();
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  const toBanglaDigits = (num: number | string) =>
    String(num).replace(/\d/g, (digit) => banglaDigits[Number(digit)] || digit);

  const monthsBn = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];

  const day = toBanglaDigits(d.getDate());
  const month = monthsBn[d.getMonth()];
  const year = toBanglaDigits(d.getFullYear());

  const hours = d.getHours();
  const minutes = toBanglaDigits(String(d.getMinutes()).padStart(2, "0"));
  const hour12 = hours % 12 || 12;
  const hour12Bn = toBanglaDigits(hour12);
  const period = hours >= 12 ? "পি.এম" : "এ.এম";

  return `${month} ${day}, ${year}, ${hour12Bn}:${minutes} ${period}`;
}

export default function PrintNewsModal({ data }: PrintNewsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSavingJpg, setIsSavingJpg] = useState(false);
  const [printDate, setPrintDate] = useState("");
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleOpen = useCallback(() => {
    setPrintDate(formatCurrentBanglaDateTime());
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (isSavingJpg) return;
    setIsOpen(false);
  }, [isSavingJpg]);

  // Listen for global open event
  useEffect(() => {
    const onOpen = () => handleOpen();
    window.addEventListener("open-print-modal", onOpen);
    return () => window.removeEventListener("open-print-modal", onOpen);
  }, [handleOpen]);

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveJpg = async () => {
    if (isSavingJpg || !sheetRef.current) return;
    try {
      setIsSavingJpg(true);

      const dataUrl = await toJpeg(sheetRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const cleanTitle = (data.title || "news-print")
        .replace(/[/\\?%*:|"<>#]/g, "")
        .trim()
        .slice(0, 45);
      const fileName = `${cleanTitle || "news-print"}.jpg`;

      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err) {
      console.error("Save JPG error:", err);
      alert("JPG ইমেজ সেভ করতে সমস্যা হয়েছে। দয়া করে প্রিন্ট অপশনটি ব্যবহার করুন।");
    } finally {
      setIsSavingJpg(false);
    }
  };

  if (!isOpen) return null;

  const currentPrintDate = printDate || formatCurrentBanglaDateTime();
  const tagline = data.tagline || "সত্যের পথে, মানুষের পাশে";

  return (
    <div
      className="newspaper-print-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="নিউজ প্রিন্ট প্রিভিউ"
    >
      {/* Close Button Top Right */}
      <button
        type="button"
        onClick={handleClose}
        className="newspaper-modal-close-btn"
        aria-label="বন্ধ করুন"
        title="বন্ধ করুন (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Scrollable Container */}
      <div className="newspaper-print-modal-scroll">
        {/* Newspaper Print Sheet with Exact Sirajganj TV Format */}
        <div ref={sheetRef} className="newspaper-print-sheet-box">
          {/* Masthead Logo */}
          <div className="newspaper-print-masthead">
            {data.logoUrl ? (
              <img
                src={data.logoUrl}
                alt={data.siteName}
                className="newspaper-print-logo"
                crossOrigin="anonymous"
              />
            ) : (
              <h1 className="newspaper-print-brand-fallback">{data.siteName}</h1>
            )}
            {/* Tagline below logo */}
            <div className="newspaper-print-tagline">
              <span>{tagline}</span>
            </div>
          </div>

          {/* Green Date Ribbon Strip */}
          <div className="newspaper-print-date-strip">
            <span className="newspaper-print-date-item">প্রিন্ট এর তারিখ: {currentPrintDate}</span>
            <span className="newspaper-print-date-sep">||</span>
            <span className="newspaper-print-date-item">প্রকাশের তারিখ: {data.publishedDate}</span>
          </div>

          {/* Centered Bold News Headline */}
          <h1 className="newspaper-print-headline">{data.title}</h1>

          {/* News Body Layout (Floated Left Image + Reporter, Text Flowing on Right & Underneath) */}
          <div className="newspaper-print-body">
            {data.imageUrl && (
              <div className="newspaper-print-media-box">
                <img
                  src={data.imageUrl}
                  alt={data.imageCaption || data.title}
                  className="newspaper-print-img"
                  crossOrigin="anonymous"
                />
                {data.imageCaption && (
                  <p className="newspaper-print-caption">{data.imageCaption}</p>
                )}
                <div className="newspaper-print-reporter">
                  <strong>{data.authorName}</strong>
                  <span>{data.authorDesignation ? `: ${data.authorDesignation}` : ": নিজস্ব প্রতিবেদক"}</span>
                </div>
              </div>
            )}

            {!data.imageUrl && (
              <div className="newspaper-print-reporter mb-3">
                <strong>{data.authorName}</strong>
                <span>{data.authorDesignation ? `: ${data.authorDesignation}` : ": নিজস্ব প্রতিবেদক"}</span>
              </div>
            )}

            {data.lead && (
              <p className="newspaper-print-lead">
                <strong>{data.lead}</strong>
              </p>
            )}

            <div
              className="newspaper-print-content"
              dangerouslySetInnerHTML={{ __html: data.contentHtml }}
            />
            <div className="newspaper-print-clearfix" />
          </div>

          {/* Optional Footer */}
          {data.editorName && (
            <div className="newspaper-print-footer">
              <p className="newspaper-print-footer-editor-title">সম্পাদক ও প্রকাশক:</p>
              <p className="newspaper-print-footer-editor-name">{data.editorName}</p>
              <div className="newspaper-print-footer-contacts">
                {data.phone && <span>মোবাইল : {data.phone}</span>}
                {data.footerAddress && (
                  <>
                    <span className="newspaper-print-footer-sep">•</span>
                    <span>কার্যালয় : {data.footerAddress}</span>
                  </>
                )}
              </div>
              <p className="newspaper-print-footer-copyright">
                {data.copyrightText || `© ${data.siteName}। সর্বস্বত্ব সংরক্ষিত`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Buttons at Bottom Right (Exact Sirajganj TV Reference: Red Print + Green Save) */}
      <div className="newspaper-print-modal-actions" aria-label="প্রিন্ট ও সেভ অপশন">
        {/* Red Print Button */}
        <button
          type="button"
          onClick={handlePrint}
          className="newspaper-action-btn-print"
          title="সংবাদটি প্রিন্ট করুন"
        >
          <Printer className="w-4 h-4" />
          <span>প্রিন্ট করুন</span>
        </button>

        {/* Green Save JPG Button */}
        <button
          type="button"
          onClick={handleSaveJpg}
          disabled={isSavingJpg}
          className="newspaper-action-btn-save"
          title="সংবাদটি JPG ইমেজ হিসেবে সেভ করুন"
        >
          {isSavingJpg ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{isSavingJpg ? "সেভ হচ্ছে..." : "সেভ করুন"}</span>
        </button>
      </div>
    </div>
  );
}
