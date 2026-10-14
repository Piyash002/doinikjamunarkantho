import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { getMediaUsedIn } from '@/src/services/adminMediaService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const publicId = searchParams.get('publicId') || undefined;
    if (!url) return apiError('URL parameter is required.', 400);

    const posts = await getMediaUsedIn(url, publicId);
    return apiSuccess(posts);
  } catch (error) {
    return apiError(error, 500);
  }
}
