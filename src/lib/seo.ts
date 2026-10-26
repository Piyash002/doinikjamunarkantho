import type { Metadata } from 'next';

/**
 * Returns the canonical site origin (protocol + host, no trailing slash).
 * Falls back gracefully depending on environment variables and context.
 */
export function getSiteOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.BASE_URL ||
    process.env.URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  if (configured) {
    try {
      const url = new URL(configured);
      return url.origin;
    } catch {
      // If configured is something like 'doinikjamunarkantho.com' without protocol
      if (!configured.startsWith('http://') && !configured.startsWith('https://')) {
        return `https://${configured.replace(/\/+$/, '')}`;
      }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://doinikjamunarkantho.com';
  }

  return 'http://localhost:3000';
}

/**
 * Converts any image URL (Cloudinary, Unsplash, local asset) into an optimal
 * OpenGraph & WhatsApp card image (1200x630, <300KB, JPEG format).
 */
export function getSocialImageUrl(rawUrl?: string | null, siteOrigin?: string): string {
  const origin = siteOrigin || getSiteOrigin();

  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return `${origin}/logo.png`;
  }

  const url = rawUrl.trim();

  // Cloudinary image: transform to optimal 1200x630, auto-quality, smart crop, jpeg
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    if (url.includes('c_fill,w_1200,h_630')) {
      return url;
    }
    return url.replace(
      '/image/upload/',
      '/image/upload/c_fill,w_1200,h_630,g_auto,q_auto,f_jpg/'
    );
  }

  // Unsplash image: request 1200x630 crop
  if (url.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('w', '1200');
      parsed.searchParams.set('h', '630');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('q', '80');
      parsed.searchParams.set('fm', 'jpg');
      return parsed.toString();
    } catch {
      return url;
    }
  }

  // Relative image URL: resolve against origin
  if (url.startsWith('/')) {
    return `${origin}${url}`;
  }

  // Protocol relative
  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  // Upgrade http to https in production unless localhost
  if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
    return url.replace(/^http:\/\//i, 'https://');
  }

  return url;
}

/**
 * Cleans HTML, BBCode, extra whitespace, and truncates text neatly for social snippets.
 */
export function cleanExcerpt(text?: string | null, maxLength = 180): string {
  if (!text || typeof text !== 'string') return '';

  const stripped = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (stripped.length <= maxLength) return stripped;

  const cut = stripped.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxLength * 0.75 ? cut.slice(0, lastSpace) : cut) + '...';
}

export interface SocialMetadataOptions {
  title: string;
  description?: string | null;
  canonicalPathOrUrl: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  publishedTime?: string | Date | null;
  modifiedTime?: string | Date | null;
  authors?: string[];
  section?: string | null;
  tags?: string[];
  siteName?: string;
}

/**
 * Builds standard OpenGraph and Twitter card metadata tailored for WhatsApp,
 * Facebook, Messenger, LinkedIn, Telegram, and X (Twitter).
 */
export function buildArticleMetadata(options: SocialMetadataOptions): Metadata {
  const origin = getSiteOrigin();
  const siteName = options.siteName || 'দৈনিক যমুনা কণ্ঠ';
  const cleanTitle = options.title.trim();
  const cleanDesc = cleanExcerpt(options.description || cleanTitle, 180);

  const canonicalUrl = options.canonicalPathOrUrl.startsWith('http')
    ? options.canonicalPathOrUrl
    : new URL(options.canonicalPathOrUrl, origin).toString();

  const ogImageUrl = getSocialImageUrl(options.imageUrl, origin);
  const imageAlt = options.imageAlt || cleanTitle;

  const publishedIso = options.publishedTime
    ? new Date(options.publishedTime).toISOString()
    : undefined;
  const modifiedIso = options.modifiedTime
    ? new Date(options.modifiedTime).toISOString()
    : publishedIso;

  return {
    title: cleanTitle,
    description: cleanDesc,
    metadataBase: new URL(origin),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: cleanTitle,
      description: cleanDesc,
      siteName,
      locale: 'bn_BD',
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: 1200,
          height: 630,
          type: 'image/jpeg',
          alt: imageAlt,
        },
      ],
      ...(publishedIso ? { publishedTime: publishedIso } : {}),
      ...(modifiedIso ? { modifiedTime: modifiedIso } : {}),
      ...(options.authors && options.authors.length ? { authors: options.authors } : {}),
      ...(options.section ? { section: options.section } : {}),
      ...(options.tags && options.tags.length ? { tags: options.tags } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description: cleanDesc,
      images: [ogImageUrl],
    },
  };
}
