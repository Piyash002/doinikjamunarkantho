import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";

import ArticleActions from "@/src/components/site/ArticleActions";
import ArticleSiteHeader from "@/src/components/site/ArticleSiteHeader";
import PrintNewsModal, { type PrintNewsData } from "@/src/components/site/PrintNewsModal";
import UnderImagePrintButton from "@/src/components/site/UnderImagePrintButton";
import SiteFooter from "@/src/components/site/SiteFooter";
import StickyArticleAd from "@/src/components/site/StickyArticleAd";
import { connectToDatabase } from "@/src/lib/db";
import AdSlot from "@/src/models/AdSlot";
import Category from "@/src/models/Category";
import Settings from "@/src/models/Settings";
import { getPostBySlug } from "@/src/services/getPostBySlug";
import { getPublicTrendingTopics } from "@/src/services/adminTagService";
import { getNavCategories } from "@/src/services/news";
import { getPublicStaticPages } from "@/src/services/adminPageService";
import { toBanglaNumber } from "@/src/lib/dateUtils";

export const revalidate = 60;

type ArticleParams = {
  category: string;
  "id-or-slug": string;
};

type ArticlePageProps = {
  params: Promise<ArticleParams>;
};

type ArticleListPost = {
  _id: string | { toString(): string };
  slug: string;
  category: string;
  title: string;
  featuredImage?: { url?: string };
};

const loadPost = cache(getPostBySlug);

function decodeSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

import { toCleanCategorySlug } from "@/src/lib/categorySlugs";

function encodeSegment(value: string) {
  return encodeURIComponent(value);
}

function routeFor(categorySlug: string, postOrIdOrSlug: any) {
  const idOrSlug = typeof postOrIdOrSlug === 'object' && postOrIdOrSlug !== null
    ? String(postOrIdOrSlug.slug || postOrIdOrSlug._id)
    : String(postOrIdOrSlug);
  const cleanCategory = toCleanCategorySlug(categorySlug);
  return `/${encodeSegment(cleanCategory)}/${encodeSegment(idOrSlug)}`;
}

function routeForHomeCategory(categorySlug: string) {
  return `/${encodeSegment(categorySlug)}`;
}

function getSiteOrigin() {
  const configured = process.env.BASE_URL || process.env.URL;
  try {
    return new URL(configured || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

function toPlainText(value: string, maxLength = 160) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function formatBanglaDate(value?: Date | string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  });
}

function formatBanglaTime(value?: Date | string | null) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("bn-BD", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Dhaka",
  });
}

function formatBanglaPrintDateTime(value?: Date | string | null, isPrintTime = false) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";

  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  const toBanglaDigits = (num: number | string) =>
    String(num).replace(/\d/g, (digit) => banglaDigits[Number(digit)] || digit);

  const monthsBn = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];

  const dhakaStr = d.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  const dhakaDate = new Date(dhakaStr);

  const day = toBanglaDigits(dhakaDate.getDate());
  const month = monthsBn[dhakaDate.getMonth()];
  const year = toBanglaDigits(dhakaDate.getFullYear());

  const hours = dhakaDate.getHours();
  const minutes = toBanglaDigits(String(dhakaDate.getMinutes()).padStart(2, "0"));
  const hour12 = hours % 12 || 12;
  const hour12Bn = toBanglaDigits(hour12);
  const period = hours >= 12 ? "পি.এম" : "এ.এম";

  return `${month} ${day}, ${year}, ${hour12Bn}:${minutes} ${period}`;
}

function sanitizeArticle(content: string) {
  return sanitizeHtml(content, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "figure",
      "figcaption",
      "iframe",
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "u",
      "s",
      "del",
      "ins",
      "mark",
      "div",
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading", "style", "data-width", "data-alignment"],
      iframe: [
        "src",
        "title",
        "width",
        "height",
        "frameborder",
        "allow",
        "allowfullscreen",
        "loading",
        "referrerpolicy",
        "class",
        "style",
      ],
      div: [
        "class",
        "style",
        "data-youtube-video",
        "data-width",
        "data-alignment",
        "data-spacing",
      ],
      ol: ["start"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      figure: ["class", "style"],
      figcaption: ["class"],
      span: ["class", "style"],
      mark: ["class", "style", "data-color"],
      "*": ["class"],
    },
    allowedStyles: {
      img: {
        width: [/.*/],
        'max-width': [/.*/],
        height: [/.*/],
        display: [/.*/],
        float: [/.*/],
        margin: [/.*/],
        'margin-left': [/.*/],
        'margin-right': [/.*/],
        clear: [/.*/],
      },
      div: {
        width: [/.*/],
        'max-width': [/.*/],
        height: [/.*/],
        display: [/.*/],
        margin: [/.*/],
        'margin-top': [/.*/],
        'margin-bottom': [/.*/],
        'margin-left': [/.*/],
        'margin-right': [/.*/],
        float: [/.*/],
        clear: [/.*/],
        'aspect-ratio': [/.*/],
      },
      iframe: {
        width: [/.*/],
        'max-width': [/.*/],
        height: [/.*/],
        display: [/.*/],
        margin: [/.*/],
        'aspect-ratio': [/.*/],
        border: [/.*/],
      },
      span: {
        color: [/.*/],
        'background-color': [/.*/],
      },
      mark: {
        'background-color': [/.*/],
        color: [/.*/],
      },
    },
    allowedIframeHostnames: [
      "www.youtube.com",
      "youtube.com",
      "www.youtube-nocookie.com",
      "youtube-nocookie.com",
      "www.facebook.com",
      "facebook.com",
    ],
    transformTags: {
      iframe: (_tagName, attributes) => {
        let src = attributes.src || '';
        if (src.includes('watch?v=')) {
          const videoId = src.split('watch?v=')[1]?.split('&')[0];
          if (videoId) src = `https://www.youtube-nocookie.com/embed/${videoId}`;
        } else if (src.includes('youtu.be/')) {
          const videoId = src.split('youtu.be/')[1]?.split('?')[0];
          if (videoId) src = `https://www.youtube-nocookie.com/embed/${videoId}`;
        }

        const existingClass = attributes.class || '';
        const finalClass = existingClass.includes('article-embed-frame')
          ? existingClass
          : `${existingClass} article-embed-frame`.trim();

        return {
          tagName: 'iframe',
          attribs: {
            ...attributes,
            src,
            class: finalClass,
            loading: attributes.loading || 'lazy',
            referrerpolicy: attributes.referrerpolicy || 'strict-origin-when-cross-origin',
            allow:
              'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
            allowfullscreen: 'true',
            frameborder: '0',
          },
        };
      },
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true),
    },
  });
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function insertArticleAd(content: string, ad?: { imageUrl?: string; link?: string }, afterParagraph = 1) {
  if (!ad?.imageUrl) return content;

  const adHtml = `<div class="article-injected-ad"><span>বিজ্ঞাপন</span><a href="${escapeHtmlAttribute(ad.link || "#")}" rel="sponsored noopener noreferrer" target="_blank"><img alt="বিজ্ঞাপন" height="250" loading="lazy" src="${escapeHtmlAttribute(ad.imageUrl)}" width="300"></a></div>`;
  let paragraph = 0;
  const inserted = content.replace(/<\/p>/gi, (closingTag) => {
    paragraph += 1;
    return paragraph === afterParagraph ? `${closingTag}${adHtml}` : closingTag;
  });

  return paragraph >= afterParagraph ? sanitizeArticle(inserted) : content;
}

function ArticleAd({ ad, className = "" }: { ad?: { imageUrl?: string; link?: string }; className?: string }) {
  if (!ad?.imageUrl) return null;
  return (
    <aside aria-label="বিজ্ঞাপন" className={`article-ad ${className}`}>
      <span>বিজ্ঞাপন</span>
      <a href={ad.link || "#"} rel="sponsored noopener noreferrer" target="_blank">
        <Image alt="বিজ্ঞাপন" className="article-ad-image" height={250} src={ad.imageUrl} width={300} />
      </a>
    </aside>
  );
}

function NewsListItem({
  post,
  index,
  showIndex = false,
}: {
  post: ArticleListPost;
  index?: number;
  showIndex?: boolean;
}) {
  const postUniqueId = String(post.slug || post._id || "");
  const categorySlug = toCleanCategorySlug(String(post.category || ""));
  return (
    <li className={`article-news-list-item${showIndex ? " with-index" : ""}`}>
      {showIndex && <span className="article-news-index">{["০১", "০২", "০৩"][index || 0]}</span>}
      <Link className="article-news-list-title" href={routeFor(categorySlug, postUniqueId)}>{post.title}</Link>
      {post.featuredImage?.url && (
        <Image
          alt=""
          className="article-news-list-image"
          height={75}
          loading="lazy"
          src={post.featuredImage.url}
          width={130}
        />
      )}
    </li>
  );
}

function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { "id-or-slug": rawSlug } = await params;
  const slug = decodeSegment(rawSlug);
  const result = await loadPost(slug);
  if (!result) return { title: "খবর পাওয়া যায়নি" };

  const { post, category } = result;
  const categorySlug = category?.slug || String(post.category);
  const postUniqueId = String(post._id || post.slug);
  const canonical = routeFor(categorySlug, postUniqueId);
  const image = post.featuredImage?.url;
  const title = post.seo?.title || post.title;
  const description = post.seo?.description || toPlainText(post.excerpt || post.content || post.title);
  const publishedTime = post.publishedAt || post.createdAt;
  const canonicalUrl = new URL(canonical, getSiteOrigin()).toString();

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title,
      description,
      ...(image ? { images: [{ url: image, alt: post.featuredImage?.caption || post.title }] } : {}),
      ...(publishedTime ? { publishedTime: new Date(publishedTime).toISOString() } : {}),
      ...(post.author ? { authors: [String(post.author)] } : {}),
      ...(Array.isArray(post.tags) ? { tags: post.tags } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { category: rawCategory, "id-or-slug": rawSlug } = await params;
  const requestedCategory = decodeSegment(rawCategory);
  const slug = decodeSegment(rawSlug);
  const result = await loadPost(slug);
  if (!result) notFound();

  const canonicalCategory = toCleanCategorySlug(result.category?.slug || result.post.category);
  const postUniqueId = String(result.post.slug || result.post._id);
  if (requestedCategory !== canonicalCategory || slug !== postUniqueId) {
    permanentRedirect(routeFor(canonicalCategory, postUniqueId));
  }

  await connectToDatabase();
  const [settings, categories, stickyAd, trendingTopics, staticPagesList] = await Promise.all([
    Settings.findOne({}).sort({ createdAt: -1 }).lean(),
    getNavCategories().catch(() => []),
    AdSlot.findOne({ position: "sticky-bottom", isActive: true, imageUrl: { $ne: "" } }).lean(),
    getPublicTrendingTopics().catch(() => []),
    getPublicStaticPages().catch(() => []),
  ]);

  const { post, category, author, related, popular, latest, previous, next, ads } = result;
  const publishedAt = post.publishedAt || post.createdAt;
  const updatedAt = post.updatedAt;
  const authorName = author?.name || String(post.author || "নিজস্ব প্রতিবেদক");
  const authorAvatar = author?.avatar?.url || settings?.logo?.url || "/logo.png";
  const siteName = settings?.siteName || 'দৈনিক যমুনা কণ্ঠ';
  const cleanPrintHtml = sanitizeArticle(post.content || "");
  let articleHtml = cleanPrintHtml;
  const paragraphCount = (articleHtml.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || []).length;
  if (!post.lead && !post.excerpt) {
    articleHtml = insertArticleAd(articleHtml, ads["in-article"], 1);
  }
  if (paragraphCount > 4) {
    articleHtml = insertArticleAd(articleHtml, ads["in-article"], 4);
  }
  const categoryName = category?.name_bn || canonicalCategory;
  const canonicalPath = routeFor(canonicalCategory, postUniqueId);
  const canonicalUrl = new URL(canonicalPath, getSiteOrigin()).toString();

  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: toPlainText(post.seo?.description || post.excerpt || post.content || post.title),
    ...(post.featuredImage?.url ? { image: [post.featuredImage.url] } : {}),
    ...(publishedAt ? { datePublished: new Date(publishedAt).toISOString() } : {}),
    ...(updatedAt ? { dateModified: new Date(updatedAt).toISOString() } : {}),
    mainEntityOfPage: canonicalUrl,
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: siteName,
      ...(settings?.logo?.url ? { logo: { "@type": "ImageObject", url: settings.logo.url } } : {}),
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "হোম", item: new URL("/", getSiteOrigin()).toString() },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: new URL(`/${encodeSegment(canonicalCategory)}`, getSiteOrigin()).toString(),
      },
      { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  const printData: PrintNewsData = {
    title: post.title,
    lead: post.lead,
    publishedDate: formatBanglaPrintDateTime(publishedAt, false),
    authorName,
    authorDesignation: author?.designation,
    imageUrl: post.featuredImage?.url,
    imageCaption: post.featuredImage?.caption,
    contentHtml: cleanPrintHtml,
    siteName,
    logoUrl: settings?.logo?.url,
    tagline: "সত্যের পথে, মানুষের পাশে",
    editorName: settings?.editorName || "মোঃ রুবেল হোসাইন তুহিন তালুকদার",
    phone: settings?.phone || "০১৬৭৭-৯০৫৫৭০ / ০১৩১১৮৫০৮৮০",
    footerAddress: settings?.footerAddress,
    copyrightText: settings?.copyrightText,
  };

  return (
    <main className="portal article-portal">
      {/* Interactive Print & Save JPG Modal (Exact Sirajganj TV Format) */}
      <PrintNewsModal data={printData} />

      {/* Newspaper Print Sheet - Strictly displayed on print / PDF download */}
      <div className="newspaper-print-sheet" aria-hidden="true">
        {/* Top Masthead Logo */}
        <div className="newspaper-print-masthead">
          {settings?.logo?.url ? (
            <img
              src={settings.logo.url}
              alt={siteName}
              className="newspaper-print-logo"
              crossOrigin="anonymous"
            />
          ) : (
            <h1 className="newspaper-print-brand-fallback">{siteName}</h1>
          )}
        </div>

        {/* Green Date & Publication Ribbon */}
        <div className="newspaper-print-date-strip">
          <span>প্রিন্ট এর তারিখ: {formatBanglaPrintDateTime(new Date(), true)}</span>
          <span className="newspaper-print-date-sep">||</span>
          <span>প্রকাশের তারিখ: {formatBanglaPrintDateTime(publishedAt, false)}</span>
        </div>

        {/* Prominent News Headline */}
        <h1 className="newspaper-print-headline">{post.title}</h1>

        {/* News Body Layout: Floated Left Featured Media + Caption + Reporter, with Article Body Flowing smoothly */}
        <div className="newspaper-print-body">
          {post.featuredImage?.url && (
            <div className="newspaper-print-media-box">
              <img
                src={post.featuredImage.url}
                alt={post.featuredImage.caption || post.title}
                className="newspaper-print-img"
                crossOrigin="anonymous"
              />
              {post.featuredImage.caption && (
                <p className="newspaper-print-caption">{post.featuredImage.caption}</p>
              )}
              <div className="newspaper-print-reporter">
                <strong>{authorName}</strong>
                <span>{author?.designation ? `: ${author.designation}` : ": নিজস্ব প্রতিবেদক"}</span>
              </div>
            </div>
          )}

          {!post.featuredImage?.url && (
            <div className="newspaper-print-reporter mb-3">
              <strong>{authorName}</strong>
              <span>{author?.designation ? `: ${author.designation}` : ": নিজস্ব প্রতিবেদক"}</span>
            </div>
          )}

          {post.lead && (
            <p className="newspaper-print-lead">
              <strong>{post.lead}</strong>
            </p>
          )}

          <div
            className="newspaper-print-content"
            dangerouslySetInnerHTML={{ __html: cleanPrintHtml }}
          />
          <div className="newspaper-print-clearfix" />
        </div>

        {/* Bottom Publisher & Editorial Footer */}
        <div className="newspaper-print-footer">
          <div className="newspaper-print-footer-rule" />
          <p className="newspaper-print-footer-editor-title">সম্পাদক ও প্রকাশক:</p>
          <p className="newspaper-print-footer-editor-name">
            {settings?.editorName || "মোঃ রুবেল হোসাইন তুহিন তালুকদার"}
          </p>
          <div className="newspaper-print-footer-contacts">
            <span>মোবাইল : {settings?.phone || "০১৬৭৭-৯০৫৫৭০ / ০১৩১১৮৫০৮৮০"}</span>
            {settings?.footerAddress && (
              <>
                <span className="newspaper-print-footer-sep">•</span>
                <span>কার্যালয় : {settings.footerAddress}</span>
              </>
            )}
          </div>
          <p className="newspaper-print-footer-copyright">
            {settings?.copyrightText
              ? settings.copyrightText
              : `© কপিরাইট ${new Date(publishedAt || post.createdAt).getFullYear()}, ${siteName}। সর্বস্বত্ব সংরক্ষিত`}
          </p>
        </div>
      </div>

      <ArticleSiteHeader
        categories={categories || []}
        logoUrl={settings?.logo?.url || undefined}
        siteName={siteName}
        trendingTopics={trendingTopics || []}
      />
      <div className="page-shell article-page-shell">
        <nav aria-label="Breadcrumb" className="article-breadcrumb">
          <Link href={routeForHomeCategory(canonicalCategory)}>{categoryName}</Link>
          <span aria-hidden="true">/</span>
          <span>{post.title}</span>
        </nav>
        <div className="article-columns">
          <article className="article-main">
            <header className="article-heading">
              <Link className="article-category-label" href={routeForHomeCategory(canonicalCategory)}>{categoryName}</Link>
              <h1>{post.title}</h1>
              <div className="article-head-divider" />
              <div className="article-meta-row">
                <div className="article-author-meta">
                  <Image
                    alt={authorName}
                    className="article-author-avatar"
                    height={48}
                    src={authorAvatar}
                    width={48}
                  />
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <strong>{authorName}</strong>
                      {author?.designation && (
                        <span className="article-author-designation"> • {author.designation}</span>
                      )}
                    </div>
                    <p>
                      {formatBanglaDate(publishedAt)}{publishedAt ? ", " : ""}{formatBanglaTime(publishedAt)}
                      {(post.views || post.viewCount) ? (
                        <span className="font-semibold text-slate-500"> • {toBanglaNumber(post.views || post.viewCount)} বার পঠিত</span>
                      ) : null}
                    </p>
                    {updatedAt && publishedAt && new Date(updatedAt).getTime() !== new Date(publishedAt).getTime() && (
                      <p className="article-updated">আপডেট: {formatBanglaDate(updatedAt)}, {formatBanglaTime(updatedAt)}</p>
                    )}
                  </div>
                </div>
                <ArticleActions
                  key={String(post._id)}
                  postId={String(post._id)}
                  shareCount={post.shareCount || 0}
                  viewCount={post.views || post.viewCount || 0}
                  title={post.title}
                  shareUrl={canonicalUrl}
                />
              </div>
            </header>

            {post.featuredImage?.url && (
              <figure className="article-featured-figure">
                <Image
                  alt={post.featuredImage.caption || post.title}
                  className="article-featured-image"
                  height={900}
                  priority
                  sizes="(max-width: 760px) 100vw, (max-width: 1200px) 70vw, 900px"
                  src={post.featuredImage.url}
                  width={1600}
                />
                {post.featuredImage.caption && <figcaption>{post.featuredImage.caption}</figcaption>}
              </figure>
            )}

            {/* Print News button directly under image (Sirajganj TV style) */}
            <UnderImagePrintButton />

            {post.lead || post.excerpt ? (
              <>
                <p className="article-lead">{post.lead || post.excerpt}</p>
                <ArticleAd ad={ads["in-article"]} className="article-ad-lead" />
              </>
            ) : null}

            <div className="article-content">
              <div dangerouslySetInnerHTML={{ __html: articleHtml }} />
            </div>

            {/* Author Profile Card if bio or designation is available */}
            {author && (author.bio || author.designation) && (
              <section aria-label="লেখক পরিচিতি" className="article-author-profile-box">
                <div className="article-author-profile-avatar">
                  {author.avatar?.url ? (
                    <Image
                      src={author.avatar.url}
                      alt={author.name}
                      width={64}
                      height={64}
                      className="article-author-profile-img"
                    />
                  ) : (
                    <div className="article-author-profile-initials">
                      {author.name?.[0] || 'A'}
                    </div>
                  )}
                </div>
                <div className="article-author-profile-content">
                  <span className="article-author-profile-label">লেখক পরিচিতি</span>
                  <h3 className="article-author-profile-name">{author.name}</h3>
                  {author.designation && (
                    <p className="article-author-profile-designation">{author.designation}</p>
                  )}
                  {author.bio && (
                    <p className="article-author-profile-bio">{author.bio}</p>
                  )}
                </div>
              </section>
            )}


            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="article-tags">
                <strong>ট্যাগ:</strong>
                {post.tags.map((tag: string) => (
                  <a href={`/tag/${encodeSegment(tag)}`} key={tag}>{tag}</a>
                ))}
              </div>
            )}

            <nav aria-label="আগের ও পরের খবর" className="article-prev-next">
              {previous ? (
                <Link href={routeFor(String(previous.category), String(previous.slug || previous._id))}>
                  <span>← আগের খবর</span><strong>{previous.title}</strong>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={routeFor(String(next.category), String(next.slug || next._id))}>
                  <span>পরের খবর →</span><strong>{next.title}</strong>
                </Link>
              ) : <span />}
            </nav>

            <section aria-label="জনপ্রিয় ও সর্বশেষ খবর" className="article-bottom-lists">
              <div className="article-bottom-list">
                <h2>জনপ্রিয়</h2>
                <ol>
                  {popular.map((item: ArticleListPost, index: number) => (
                    <NewsListItem index={index} key={String(item._id)} post={item} showIndex />
                  ))}
                </ol>
              </div>
              <div className="article-bottom-list">
                <h2>সর্বশেষ</h2>
                <ol>
                  {latest.map((item: ArticleListPost, index: number) => (
                    <NewsListItem index={index} key={String(item._id)} post={item} />
                  ))}
                </ol>
              </div>
            </section>
          </article>

          <aside aria-label="আরও খবর ও বিজ্ঞাপন" className="article-sidebar">
            <ArticleAd ad={ads["article-sidebar-top"]} className="article-sidebar-ad" />
            <section className="article-related">
              <h2>আরও পড়ুন</h2>
              <ol>
                {related.slice(0, 2).map((item: ArticleListPost) => (
                  <li key={String(item._id)}>
                    <Link href={routeFor(String(item.category), String(item.slug || item._id))}>{item.title}</Link>
                  </li>
                ))}
              </ol>
            </section>
            <ArticleAd ad={ads["article-sidebar-mid"]} className="article-sidebar-ad article-sidebar-last-ad" />
            <section aria-label="সম্পর্কিত খবর" className="article-related article-related-continuation">
              <ol start={3}>
                {related.slice(2, 4).map((item: ArticleListPost) => (
                  <li key={String(item._id)}>
                    <Link href={routeFor(String(item.category), String(item.slug || item._id))}>{item.title}</Link>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>

        <SiteFooter
          settings={settings}
          navCategories={categories}
          staticPages={staticPagesList}
        />
      </div>
      {stickyAd?.imageUrl && <StickyArticleAd imageUrl={stickyAd.imageUrl} link={stickyAd.link || "#"} />}
      <script dangerouslySetInnerHTML={{ __html: safeJsonLd(newsArticleSchema) }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} type="application/ld+json" />
    </main>
  );
}
