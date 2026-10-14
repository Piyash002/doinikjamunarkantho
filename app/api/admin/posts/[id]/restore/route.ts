import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { restoreAdminPost } from '@/src/services/adminPostService';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id } = await context.params;
    const restored = await restoreAdminPost(id, session as any);
    return apiSuccess(restored);
  } catch (error) {
    return apiError(error, 500);
  }
}
