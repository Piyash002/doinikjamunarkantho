import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import sanitizeHtml from "sanitize-html";

import ArticleActions from "@/src/components/site/ArticleActions";
import ArticleSiteHeader from "@/src/components/site/ArticleSiteHeader";
import StickyArticleAd from "@/src/components/site/StickyArticleAd";
import { connectToDatabase } from "@/src/lib/db";
import AdSlot from "@/src/models/AdSlot";
import Category from "@/src/models/Category";
import Settings from "@/src/models/Settings";
import { getPostBySlug } from "@/src/services/getPostBySlug";
import { getPublicTrendingTopics } from "@/src/services/adminTagService";

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

function encodeSegment(value: string) {
  return encodeURIComponent(value);
}

function routeFor(categorySlug: string, postSlug: string) {
  return `/${encodeSegment(categorySlug)}/${encodeSegment(postSlug)}`;
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
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
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
      ],
      ol: ["start"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      "*": ["class"],
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
      iframe: (_tagName, attributes) => ({
        tagName: "iframe",
        attribs: {
          ...attributes,
          class: "article-embed-frame",
          loading: "lazy",
          referrerpolicy: "strict-origin-when-cross-origin",
        },
      }),
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
  const slug = String(post.slug || "");
  const categorySlug = String(post.category || "");
  return (
    <li className={`article-news-list-item${showIndex ? " with-index" : ""}`}>
      {showIndex && <span className="article-news-index">{["০১", "০২", "০৩"][index || 0]}</span>}
      <Link className="article-news-list-title" href={routeFor(categorySlug, slug)}>{post.title}</Link>
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
  const canonical = routeFor(categorySlug, post.slug);
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

  const canonicalCategory = result.category?.slug || String(result.post.category);
  if (requestedCategory !== canonicalCategory) {
    permanentRedirect(routeFor(canonicalCategory, result.post.slug));
  }

  await connectToDatabase();
  const [settings, categories, stickyAd, trendingTopics] = await Promise.all([
    Settings.findOne({}).sort({ createdAt: -1 }).lean(),
    Category.find({ isActive: true, showInNav: true }).sort({ order: 1 }).select({ name_bn: 1, slug: 1 }).lean(),
    AdSlot.findOne({ position: "sticky-bottom", isActive: true, imageUrl: { $ne: "" } }).lean(),
    getPublicTrendingTopics().catch(() => []),
  ]);

  const { post, category, author, related, popular, latest, previous, next, ads } = result;
  const publishedAt = post.publishedAt || post.createdAt;
  const updatedAt = post.updatedAt;
  const authorName = author?.name || String(post.author || "নিজস্ব প্রতিবেদক");
  const authorAvatar = author?.avatar?.url || settings?.logo?.url || "/logo.png";
  const siteName = settings?.siteName || "SITE_NAME";
  let articleHtml = sanitizeArticle(post.content || "");
  const paragraphCount = (articleHtml.match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || []).length;
  if (!post.lead && !post.excerpt) {
    articleHtml = insertArticleAd(articleHtml, ads["in-article"], 1);
  }
  if (paragraphCount > 4) {
    articleHtml = insertArticleAd(articleHtml, ads["in-article"], 4);
  }
  const categoryName = category?.name_bn || canonicalCategory;
  const canonicalPath = routeFor(canonicalCategory, post.slug);
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

  return (
    <main className="portal article-portal">
      <ArticleSiteHeader
        categories={categories.map((item) => ({ name_bn: item.name_bn, slug: item.slug }))}
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
                    alt=""
                    className="article-author-avatar"
                    height={48}
                    src={authorAvatar}
                    width={48}
                  />
                  <div>
                    <strong>{authorName}</strong>
                    <p>
                      {formatBanglaDate(publishedAt)}{publishedAt ? ", " : ""}{formatBanglaTime(publishedAt)}
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
                  title={post.title}
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

            {post.lead || post.excerpt ? (
              <>
                <p className="article-lead">{post.lead || post.excerpt}</p>
                <ArticleAd ad={ads["in-article"]} className="article-ad-lead" />
              </>
            ) : null}

            <div className="article-content">
              <div dangerouslySetInnerHTML={{ __html: articleHtml }} />
            </div>

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
                <Link href={routeFor(String(previous.category), String(previous.slug))}>
                  <span>← আগের খবর</span><strong>{previous.title}</strong>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={routeFor(String(next.category), String(next.slug))}>
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
                    <Link href={routeFor(String(item.category), String(item.slug))}>{item.title}</Link>
                  </li>
                ))}
              </ol>
            </section>
            <ArticleAd ad={ads["article-sidebar-mid"]} className="article-sidebar-ad article-sidebar-last-ad" />
            <section aria-label="সম্পর্কিত খবর" className="article-related article-related-continuation">
              <ol start={3}>
                {related.slice(2, 4).map((item: ArticleListPost) => (
                  <li key={String(item._id)}>
                    <Link href={routeFor(String(item.category), String(item.slug))}>{item.title}</Link>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>

        <footer className="article-footer">
          <div className="article-footer-editor">
            <Link aria-label={`${siteName} - হোম`} href="/">
              <Image alt={siteName} height={54} src={settings?.logo?.url || "/logo.png"} width={225} />
            </Link>
            <p>ভারপ্রাপ্ত সম্পাদক: {settings?.editorName || "সম্পাদক"}</p>
          </div>
          <nav aria-label="ফুটার লিংক" className="article-footer-links">
            <Link href="/privacy">গোপনীয়তার নীতি</Link>
            <Link href="/terms">ব্যবহারের শর্তাবলি</Link>
            <Link href="/contact">যোগাযোগ</Link>
            <Link href="/about">আমাদের সম্পর্কে</Link>
            <Link href="/we">আমরা</Link>
            <Link href="/archive">আর্কাইভ</Link>
            <Link href="/advertise">বিজ্ঞাপন</Link>
          </nav>
          <address className="article-footer-contact">
            {settings?.footerAddress && <span>{settings.footerAddress}</span>}
            {settings?.phone && <a href={`tel:${settings.phone}`}>{settings.phone}</a>}
            {settings?.email && <a href={`mailto:${settings.email}`}>{settings.email}</a>}
          </address>
          <p className="article-footer-copyright">
            {settings?.copyrightText || `© ${new Date(publishedAt || post.createdAt).getFullYear()} ${siteName}। সর্বস্বত্ব সংরক্ষিত।`}
          </p>
        </footer>
      </div>
      {stickyAd?.imageUrl && <StickyArticleAd imageUrl={stickyAd.imageUrl} link={stickyAd.link || "#"} />}
      <script dangerouslySetInnerHTML={{ __html: safeJsonLd(newsArticleSchema) }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} type="application/ld+json" />
    </main>
  );
}
