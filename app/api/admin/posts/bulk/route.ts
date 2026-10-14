import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { bulkPostsSchema } from '@/src/lib/validators';
import { bulkAdminPosts } from '@/src/services/adminPostService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const parsed = bulkPostsSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Invalid bulk action request.', 400);
    }

    const { ids, action, category } = parsed.data;
    const result = await bulkAdminPosts(ids, action, { category }, session as any);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, 500);
  }
}
