import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { getAdminDashboardStats } from '@/src/services/adminStatsService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const days = Number(searchParams.get('days')) || 7;
    const stats = await getAdminDashboardStats(days);
    return apiSuccess(stats);
  } catch (error) {
    return apiError(error, 500);
  }
}
