"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export type NavCategoryItem = {
  _id?: string;
  name_bn: string;
  slug: string;
  name_en?: string;
  order?: number;
};

export type StaticPageItem = {
  _id?: string;
  title: string;
  slug: string;
};

export type SiteFooterProps = {
  settings?: any;
  siteName?: string;
  logoUrl?: string;
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
  navCategories?: NavCategoryItem[];
  staticPages?: StaticPageItem[];
  onSelectCategory?: (categoryName: string) => void;
  className?: string;
};

function toEnglishPhone(phone: string): string {
  if (!phone) return "";
  const bnToEn: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  return String(phone)
    .replace(/[০-৯]/g, (ch) => bnToEn[ch] || ch)
    .replace(/[^0-9+]/g, "");
}

function cleanPageTitle(title: string): string {
  if (!title) return "";
  // Strip trailing English translation like "(About Us)" or "(Privacy Policy)" for sleek footer link
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim() || title;
}

const DEFAULT_STATIC_PAGES: StaticPageItem[] = [
  { title: "আমাদের সম্পর্কে", slug: "about" },
  { title: "গোপনীয়তা নীতি", slug: "privacy-policy" },
  { title: "ব্যবহারের শর্তাবলী", slug: "terms" },
  { title: "যোগাযোগ", slug: "contact" },
  { title: "বিজ্ঞাপন", slug: "advertise" },
];

export default function SiteFooter({
  settings,
  siteName: propSiteName,
  logoUrl: propLogoUrl,
  footerAddress: propFooterAddress,
  phone: propPhone,
  email: propEmail,
  editorName: propEditorName,
  copyrightText: propCopyrightText,
  socialLinks: propSocialLinks,
  whatsappChannel: propWhatsappChannel,
  googlePlayLink: propGooglePlayLink,
  navCategories = [],
  staticPages = [],
  onSelectCategory,
  className = "",
}: SiteFooterProps) {
  // Merge from props and settings
  const siteName = propSiteName || settings?.siteName || "দৈনিক যমুনা কণ্ঠ";
  const rawLogo = propLogoUrl || settings?.logo?.url;
  const logoUrl = rawLogo && !rawLogo.includes("photo-1529107386315") ? rawLogo : "/logo.png";
  const footerAddress = propFooterAddress || settings?.footerAddress || "এস এস রোড সিরাজগঞ্জ, মুক্তিযোদ্ধা সংসদ গলি।";
  const phone = propPhone || settings?.phone || "০১৬৭৭৯০৫৫৭০";
  const email = propEmail || settings?.email || "mdrubelhossainjournalits@gmail.com";
  const editorName = propEditorName !== undefined ? propEditorName : (settings?.editorName || "");
  const currentYear = new Date().getFullYear();
  const copyrightText =
    propCopyrightText || settings?.copyrightText || `© ${currentYear} ${siteName}। সর্বস্বত্ব সংরক্ষিত।`;

  const social = propSocialLinks || settings?.socialLinks || {};
  const facebook = social.facebook || "";
  const x = social.x || "";
  const youtube = social.youtube || "";
  const instagram = social.instagram || "";
  const whatsapp = propWhatsappChannel || settings?.whatsappChannel || "";
  const playLink = propGooglePlayLink || settings?.googlePlayLink || "";

  // Dynamic static pages list from database (fallback to defaults if empty)
  const activePages = staticPages && staticPages.length > 0 ? staticPages : DEFAULT_STATIC_PAGES;

  // Filter valid navigation categories
  const displayCategories = navCategories
    .filter((cat) => cat && cat.slug && cat.slug !== "all" && cat.slug !== "latest")
    .slice(0, 8);

  const englishPhone = toEnglishPhone(phone);

  return (
    <footer className={`site-footer ${className}`} id="footer">
      <div className="footer-main">
        {/* 1. Brand & Socials Column */}
        <div className="footer-brand-block">
          <Link className="brand footer-brand inline-flex items-center gap-2 mb-2" href="/">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={siteName}
                width={200}
                height={50}
                className="h-10 w-auto object-contain"
                unoptimized
              />
            ) : (
              <span className="brand-name font-bold text-xl">{siteName}</span>
            )}
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed my-2">
            সত্য ও বস্তুনিষ্ঠ সাংবাদিকতায় অবিচল। ২৪ ঘণ্টা দেশ ও আন্তর্জাতিক সংবাদের বিশ্বস্ত ঠিকানা।
          </p>

          {/* Social Links */}
          <div className="social-links mt-3" aria-label="সামাজিক যোগাযোগমাধ্যম">
            {facebook ? (
              <a
                href={facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ফেসবুক পেজ"
                className="hover:scale-105 transition-transform"
                title="ফেসবুক"
              >
                f
              </a>
            ) : null}
            {x ? (
              <a
                href={x}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="এক্স (টুইটার)"
                className="hover:scale-105 transition-transform"
                title="এক্স"
              >
                𝕏
              </a>
            ) : null}
            {instagram ? (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ইনস্টাগ্রাম"
                className="hover:scale-105 transition-transform"
                title="ইনস্টাগ্রাম"
              >
                ◎
              </a>
            ) : null}
            {youtube ? (
              <a
                href={youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="ইউটিউব চ্যানেল"
                className="hover:scale-105 transition-transform"
                title="ইউটিউব"
              >
                ▶
              </a>
            ) : null}
            {whatsapp ? (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="হোয়াটসঅ্যাপ চ্যানেল"
                className="hover:scale-105 transition-transform text-[#25d366]"
                title="হোয়াটসঅ্যাপ"
              >
                💬
              </a>
            ) : null}
          </div>

          {playLink && (
            <div className="mt-4">
              <a
                href={playLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-slate-400 transition-colors"
              >
                <span>📱 মোবাইল অ্যাপ ডাউনলোড করুন</span>
              </a>
            </div>
          )}
        </div>

        {/* 2. Popular Categories Column */}
        <div className="footer-links">
          <strong className="text-slate-900 dark:text-slate-100 font-bold mb-1">আমাদের বিভাগ</strong>
          {displayCategories.map((category) => {
            const name = category.name_bn || category.name_en || category.slug;
            return (
              <Link
                key={category.slug}
                href={`/${encodeURIComponent(category.slug)}`}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {name}
              </Link>
            );
          })}
        </div>

        {/* 3. Dynamic Static Pages ("আরও জানুন") Column */}
        <div className="footer-links">
          <strong className="text-slate-900 dark:text-slate-100 font-bold mb-1">আরও জানুন</strong>
          {activePages.map((page) => (
            <Link
              key={page.slug}
              href={`/${encodeURIComponent(page.slug)}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {cleanPageTitle(page.title)}
            </Link>
          ))}
        </div>

        {/* 4. Contact & Office Column */}
        <div className="footer-contact-block">
          <strong className="text-slate-900 dark:text-slate-100 font-bold mb-1">যোগাযোগ ও কার্যালয়</strong>
          {footerAddress && (
            <p className="footer-contact-item">
              <span className="contact-label font-semibold text-slate-700 dark:text-slate-300">অফিস:</span>{" "}
              {footerAddress}
            </p>
          )}
          {phone && (
            <p className="footer-contact-item">
              <span className="contact-label font-semibold text-slate-700 dark:text-slate-300">মোবাইল:</span>{" "}
              <a href={`tel:${englishPhone}`} className="hover:underline">
                {phone}
              </a>
            </p>
          )}
          {email && (
            <p className="footer-contact-item">
              <span className="contact-label font-semibold text-slate-700 dark:text-slate-300">ইমেইল:</span>{" "}
              <a href={`mailto:${email}`} className="hover:underline">
                {email}
              </a>
            </p>
          )}
          {editorName ? (
            <p className="footer-contact-item">
              <span className="contact-label font-semibold text-slate-700 dark:text-slate-300">
                সম্পাদক ও প্রকাশক:
              </span>{" "}
              {editorName}
            </p>
          ) : null}
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom">
        <span>{copyrightText}</span>
        <div className="footer-bottom-contact">
          {footerAddress && <span>অফিস: {footerAddress}</span>}
          {phone && (
            <>
              <i aria-hidden="true" />
              <span>
                মোবাইল:{" "}
                <a href={`tel:${englishPhone}`} className="hover:underline">
                  {phone}
                </a>
              </span>
            </>
          )}
          {email && (
            <>
              <i aria-hidden="true" />
              <span>
                ইমেইল:{" "}
                <a href={`mailto:${email}`} className="hover:underline">
                  {email}
                </a>
              </span>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
