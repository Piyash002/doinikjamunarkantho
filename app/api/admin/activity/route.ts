import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { getAuditLogs } from '@/src/services/adminAuditService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || undefined;
    const entity = searchParams.get('entity') || undefined;
    const user = searchParams.get('user') || undefined;
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 25;

    const result = await getAuditLogs({ action, entity, user, page, limit });
    return apiSuccess(result.logs, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return apiError(error, 500);
  }
}
