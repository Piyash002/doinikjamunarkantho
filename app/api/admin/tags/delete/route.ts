import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { deleteAdminTag } from '@/src/services/adminTagService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const { name } = body;
    if (!name) return apiError('Tag name is required.', 400);

    const result = await deleteAdminTag(name, session as any);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, 500);
  }
}
