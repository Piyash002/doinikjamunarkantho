import { NextRequest, NextResponse } from 'next/server';
import { getPostBySlug } from '@/src/services/getPostBySlug';
import { toCleanCategorySlug } from '@/src/lib/categorySlugs';

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
    return NextResponse.redirect(targetUrl, 301);
  } catch {
    return NextResponse.redirect(new URL('/', request.url), 302);
  }
}
