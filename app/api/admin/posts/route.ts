import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { postListQuerySchema, postCreateSchema } from '@/src/lib/validators';
import { getAdminPosts, createAdminPost } from '@/src/services/adminPostService';
import { sanitizePostHtml } from '@/src/lib/sanitize';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const queryObj: Record<string, any> = {};
    searchParams.forEach((val, key) => {
      queryObj[key] = val;
    });

    const parsed = postListQuerySchema.safeParse(queryObj);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Invalid search parameters.', 400);
    }

    const result = await getAdminPosts({
      ...parsed.data,
      session: session as any,
    });

    return apiSuccess(result.posts, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      counts: result.counts,
    });
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();

    // Sanitize HTML content
    if (body.content) {
      body.content = sanitizePostHtml(body.content);
    }

    const parsed = postCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Validation failed for post.', 400);
    }

    const post = await createAdminPost(parsed.data, session as any);
    return apiSuccess(post, undefined, 201);
  } catch (error) {
    return apiError(error, 500);
  }
}
