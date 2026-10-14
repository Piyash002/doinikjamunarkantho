import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { mergeAdminTags } from '@/src/services/adminTagService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const { sourceTag, targetTag } = body;
    if (!sourceTag || !targetTag) {
      return apiError('Source tag and target tag are required.', 400);
    }

    const result = await mergeAdminTags(sourceTag, targetTag, session as any);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, 500);
  }
}
