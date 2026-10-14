import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { getAdminMedia, saveMediaItem } from '@/src/services/adminMediaService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 24;

    const result = await getAdminMedia({ search, page, limit });
    return apiSuccess(result.items, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
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
    if (!body.url) return apiError('Media URL is required.', 400);

    const media = await saveMediaItem({
      url: body.url,
      publicId: body.publicId || '',
      filename: body.filename || `upload-${Date.now()}`,
      fileType: body.fileType || 'image/jpeg',
      fileSize: body.fileSize || 0,
      width: body.width || 0,
      height: body.height || 0,
      alt: body.alt || '',
      caption: body.caption || '',
    }, session as any);

    return apiSuccess(media, undefined, 201);
  } catch (error) {
    return apiError(error, 500);
  }
}
