import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { permanentDeletePost } from '@/src/services/adminPostService';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id } = await context.params;
    const result = await permanentDeletePost(id, session as any);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, 500);
  }
}
