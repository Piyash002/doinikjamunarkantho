import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { duplicateAdminPost } from '@/src/services/adminPostService';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id } = await context.params;
    const duplicated = await duplicateAdminPost(id, session as any);
    return apiSuccess(duplicated, undefined, 201);
  } catch (error) {
    return apiError(error, 500);
  }
}
