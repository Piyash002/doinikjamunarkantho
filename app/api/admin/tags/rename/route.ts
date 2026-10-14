import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { renameAdminTag } from '@/src/services/adminTagService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const { oldName, newName } = body;
    if (!oldName || !newName) return apiError('Old name and new name are required.', 400);

    const result = await renameAdminTag(oldName, newName, session as any);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, 500);
  }
}
