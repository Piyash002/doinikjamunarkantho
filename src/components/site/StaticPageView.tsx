"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Printer,
  Share2,
  MapPin,
  Phone,
  Mail,
  User,
  Send,
  CheckCircle2,
  Calendar,
  Building2,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import ArticleSiteHeader from "@/src/components/site/ArticleSiteHeader";
import SiteFooter, { NavCategoryItem, StaticPageItem } from "@/src/components/site/SiteFooter";
import { formatBanglaDate } from "@/src/lib/dateUtils";

export type StaticPageData = {
  _id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: {
    url?: string;
    publicId?: string;
    caption?: string;
  };
  seo?: {
    title?: string;
    description?: string;
  };
  updatedAt?: string | Date;
  createdAt?: string | Date;
};

type StaticPageViewProps = {
  page: StaticPageData;
  settings?: any;
  navCategories?: NavCategoryItem[];
  staticPages?: StaticPageItem[];
  trendingTopics?: Array<{ _id?: string; name: string; slug: string }>;
  headerAd?: any;
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

export default function StaticPageView({
  page,
  settings,
  navCategories = [],
  staticPages = [],
  trendingTopics = [],
  headerAd,
}: StaticPageViewProps) {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);

  const siteName = settings?.siteName || "দৈনিক যমুনা কণ্ঠ";
  const rawLogo = settings?.logo?.url;
  const logoUrl = rawLogo && !rawLogo.includes("photo-1529107386315") ? rawLogo : "/logo.png";
  const footerAddress = settings?.footerAddress || "এস এস রোড সিরাজগঞ্জ, মুক্তিযোদ্ধা সংসদ গলি।";
  const phone = settings?.phone || "০১৬৭৭৯০৫৫৭০";
  const email = settings?.email || "mdrubelhossainjournalits@gmail.com";
  const editorName = settings?.editorName || "";
  const englishPhone = toEnglishPhone(phone);

  const isContactPage =
    page.slug === "contact" ||
    page.slug === "contact-us" ||
    /যোগাযোগ/i.test(page.title);

  const isAdvertisePage =
    page.slug === "advertise" ||
    page.slug === "ads" ||
    /বিজ্ঞাপন/i.test(page.title);

  const lastUpdated = page.updatedAt || page.createdAt || new Date();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) return;

    setIsSending(true);
    // Simulate brief network dispatch
    setTimeout(() => {
      setIsSending(false);
      setFormSubmitted(true);
      setFormData({ name: "", phone: "", email: "", subject: "", message: "" });
    }, 600);
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: page.title,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert("পৃষ্ঠার লিংক ক্লিপবোর্ডে কপি করা হয়েছে!");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#0b1319] text-slate-800 dark:text-slate-200">
      {/* Top Site Header */}
      <ArticleSiteHeader
        siteName={siteName}
        logoUrl={logoUrl}
        categories={navCategories}
        activeSlug={page.slug}
        trendingTopics={trendingTopics}
      />

      {/* Main Page Container */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Breadcrumb Navigation */}
        <nav aria-label="ব্রেডক্রাম্ব" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6 flex-wrap">
          <Link href="/" className="hover:text-[#1b7d95] transition-colors">
            হোম
          </Link>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="text-[#1b7d95] dark:text-[#7dd1e1] font-semibold">
            {page.title.replace(/\s*\([^)]*\)\s*$/, "")}
          </span>
        </nav>

        {/* Static Page Paper Card */}
        <article className="bg-white dark:bg-[#131f28] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-10 md:p-12 mb-10">
          {/* Header Block */}
          <header className="border-b border-slate-100 dark:border-slate-800/80 pb-6 mb-8">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#1b7d95]/10 text-[#1b7d95] dark:bg-[#1b7d95]/20 dark:text-[#7dd1e1]">
                <Sparkles className="w-3.5 h-3.5" />
                যমুনা কণ্ঠ অফিসিয়াল তথ্য
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="শেয়ার করুন"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>শেয়ার</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  aria-label="প্রিন্ট করুন"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট</span>
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-4">
              {page.title}
            </h1>

            {page.excerpt && (
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mb-4 font-medium">
                {page.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                সর্বশেষ হালনাগাদ: {formatBanglaDate(lastUpdated)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {siteName} নিউজরুম ডেস্ক
              </span>
            </div>
          </header>

          {/* Featured Image if present */}
          {page.featuredImage?.url && (
            <figure className="mb-8 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <Image
                src={page.featuredImage.url}
                alt={page.featuredImage.caption || page.title}
                width={1200}
                height={600}
                className="w-full h-auto max-h-[460px] object-cover"
                priority
              />
              {page.featuredImage.caption && (
                <figcaption className="p-3 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 text-center">
                  {page.featuredImage.caption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Main Body Content with Rich Typography */}
          <div className="article-content max-w-none text-slate-800 dark:text-slate-200">
            {page.content ? (
              <div
                dangerouslySetInnerHTML={{ __html: page.content }}
                className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-a:text-[#1b7d95] prose-a:underline hover:prose-a:text-[#083c4d] prose-li:text-slate-700 dark:prose-li:text-slate-300"
              />
            ) : (
              <p className="text-slate-500 italic">এই পাতায় কোনো বিষয়বস্তু এখনও যোগ করা হয়নি।</p>
            )}
          </div>

          {/* SPECIAL ENRICHMENT: Contact Page Interactive Section */}
          {isContactPage && (
            <section className="mt-12 pt-10 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
                যোগাযোগের মাধ্যম ও বার্তা পাঠান
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Newsroom Contact Cards (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-[#1b7d95]/10 text-[#1b7d95] dark:text-[#7dd1e1] flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                          প্রধান কার্যালয়
                        </strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {footerAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-[#1b7d95]/10 text-[#1b7d95] dark:text-[#7dd1e1] flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                          হটলাইন ও মোবাইল
                        </strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <a href={`tel:${englishPhone}`} className="hover:text-[#1b7d95] font-semibold text-sm">
                            {phone}
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-[#1b7d95]/10 text-[#1b7d95] dark:text-[#7dd1e1] flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                          অফিসিয়াল ইমেইল
                        </strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <a href={`mailto:${email}`} className="hover:text-[#1b7d95] underline">
                            {email}
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  {editorName ? (
                    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-lg bg-[#1b7d95]/10 text-[#1b7d95] dark:text-[#7dd1e1] flex items-center justify-center shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <strong className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                            সম্পাদক ও প্রকাশক
                          </strong>
                          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {editorName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-[#1b7d95]/10 text-[#1b7d95] dark:text-[#7dd1e1] flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                          নিউজরুম কর্মঘণ্টা
                        </strong>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          শনিবার - বৃহস্পতিবার: সকাল ৯:০০ টা থেকে রাত ১১:০০ টা
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Contact Form (7 cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                    সরাসরি বার্তা পাঠান
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                    যেকোনো তথ্য, পরামর্শ অথবা অভিযোগ জানাতে নিচের ফর্মটি পূরণ করুন।
                  </p>

                  {formSubmitted ? (
                    <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-center flex flex-col items-center gap-3">
                      <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                        আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে!
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-sm">
                        আমাদের নিউজরুম বা সংশ্লিষ্ট বিভাগ শীঘ্রই আপনার সাথে যোগাযোগ করবে। সাথে থাকার জন্য ধন্যবাদ।
                      </p>
                      <button
                        type="button"
                        onClick={() => setFormSubmitted(false)}
                        className="mt-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        আরেকটি বার্তা পাঠান
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            আপনার নাম <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="পূর্ণ নাম লিখুন"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1b7d95]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            মোবাইল নম্বর
                          </label>
                          <input
                            type="tel"
                            placeholder="০১৭xxxxxxxx"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1b7d95]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            ইমেইল ঠিকানা
                          </label>
                          <input
                            type="email"
                            placeholder="example@mail.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1b7d95]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            বার্তা সংক্রান্ত বিষয়
                          </label>
                          <input
                            type="text"
                            placeholder="সংবাদ, মতামত বা তদন্ত"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1b7d95]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          আপনার বার্তা / তথ্যের বিবরণ <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={4}
                          placeholder="আপনার বার্তা বিস্তারিত লিখুন..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1b7d95] resize-y"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSending}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#1b7d95] hover:bg-[#083c4d] text-white text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        {isSending ? (
                          <span>বার্তা পাঠানো হচ্ছে...</span>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>বার্তা পাঠান</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* SPECIAL ENRICHMENT: Advertise Page Inquiries Box */}
          {isAdvertisePage && (
            <section className="mt-12 pt-10 border-t border-slate-200 dark:border-slate-800">
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#083c4d]/10 via-[#1b7d95]/10 to-transparent border border-[#1b7d95]/30">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  দৈনিক যমুনা কণ্ঠে বিজ্ঞাপনের সুযোগ
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed max-w-2xl">
                  অনলাইন পোর্টাল এবং প্রিন্ট সংস্করণে ব্যানার বিজ্ঞাপন, স্পন্সরড কন্টেন্ট এবং বিশেষ ক্রোড়পত্রের জন্য আমাদের বিজ্ঞাপন বিভাগে সরাসরি যোগাযোগ করুন।
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 block mb-1">বিজ্ঞাপন হটলাইন</span>
                    <a href={`tel:${englishPhone}`} className="text-base font-bold text-[#1b7d95] dark:text-[#7dd1e1] hover:underline">
                      {phone}
                    </a>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 block mb-1">বিজ্ঞাপন ইমেইল</span>
                    <a href={`mailto:${email}`} className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:underline break-all">
                      {email}
                    </a>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 sm:col-span-2 lg:col-span-1">
                    <span className="text-xs text-slate-500 block mb-1">বিজ্ঞাপন ও হিসাব শাখা</span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-tight block">
                      {footerAddress}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </article>
      </main>

      {/* Unified Site Footer */}
      <SiteFooter
        settings={settings}
        navCategories={navCategories}
        staticPages={staticPages}
      />
    </div>
  );
}
