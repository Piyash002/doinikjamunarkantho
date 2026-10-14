import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { restoreRevision } from '@/src/services/adminPostService';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; version: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id, version } = await context.params;
    const versionNum = Number(version);
    if (!versionNum) return apiError('Invalid version number.', 400);

    const post = await restoreRevision(id, versionNum, session as any);
    return apiSuccess(post);
  } catch (error) {
    return apiError(error, 500);
  }
}
