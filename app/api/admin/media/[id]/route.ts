import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { updateMediaItem, deleteMediaItem } from '@/src/services/adminMediaService';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const updated = await updateMediaItem(id, body, session as any);
    return apiSuccess(updated);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id } = await context.params;
    const result = await deleteMediaItem(id, session as any);
    return apiSuccess(result);
  } catch (error: any) {
    return apiError(error?.message || 'Unable to delete image.', 400);
  }
}
