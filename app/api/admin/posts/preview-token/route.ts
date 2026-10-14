import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { signPreviewToken } from '@/src/lib/auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const { id, slug, category } = body;
    if (!id || !slug) {
      return apiError('Post id and slug are required to generate preview token.', 400);
    }

    const token = await signPreviewToken({
      postId: id,
      slug,
      category: category || 'general',
      requestedBy: session.username,
    });

    return apiSuccess({ token, previewUrl: `/${encodeURIComponent(category || 'general')}/${encodeURIComponent(slug)}?preview=${token}` });
  } catch (error) {
    return apiError(error, 500);
  }
}
