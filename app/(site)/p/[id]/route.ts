import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug } from '@/src/services/getPostBySlug';
import { toCleanCategorySlug } from '@/src/lib/categorySlugs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const decodedId = decodeURIComponent(id || '').trim();

  if (!decodedId) {
    return NextResponse.redirect(new URL('/', request.url), 302);
  }

  try {
    const result = await getPostBySlug(decodedId);
    if (!result || !result.post) {
      return NextResponse.redirect(new URL('/', request.url), 302);
    }

    const categorySlug = toCleanCategorySlug(result.category?.slug || result.post.category);
    const postSlug = result.post.slug || String(result.post._id);

    const targetUrl = new URL(`/${encodeURIComponent(categorySlug)}/${encodeURIComponent(postSlug)}`, request.url);

    // If social media bot (WhatsApp, Facebook, Twitter, Telegram, etc.), return Open Graph metadata directly
    const userAgent = request.headers.get('user-agent') || '';
    const isBot = /facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|LinkedInBot|Slackbot|SkypeUriPreview/i.test(userAgent);

    if (isBot) {
      const siteOrigin = new URL(request.url).origin;
      const title = result.post.seo?.title || result.post.title || 'দৈনিক যমুনা কণ্ঠ';
      const desc = result.post.seo?.description ||
        (result.post.excerpt || result.post.content || '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 160);

      const rawImage = result.post.featuredImage?.url;
      const imageUrl = rawImage
        ? (rawImage.startsWith('http') ? rawImage : `${siteOrigin}${rawImage}`)
        : `${siteOrigin}/logo.png`;

      const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="দৈনিক যমুনা কণ্ঠ">
  <meta property="og:locale" content="bn_BD">
  <meta property="og:url" content="${targetUrl.toString()}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(desc)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(desc)}">
  <meta name="twitter:image" content="${imageUrl}">
  <meta http-equiv="refresh" content="0;url=${targetUrl.toString()}">
</head>
<body>
  <script>window.location.replace("${targetUrl.toString()}");</script>
</body>
</html>`;

      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return NextResponse.redirect(targetUrl, 301);
  } catch {
    return NextResponse.redirect(new URL('/', request.url), 302);
  }
}

