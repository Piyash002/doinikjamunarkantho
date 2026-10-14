import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { trendingAndBreakingSchema } from '@/src/lib/validators';
import { getAdminSettings, updateAdminTrendingAndBreaking } from '@/src/services/adminSettingsService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const settings = await getAdminSettings();
    return apiSuccess({
      trendingKeywords: settings.trendingKeywords || [],
      breakingNews: (settings as any).breakingNews || { isActive: false, title: '', link: '' },
    });
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const parsed = trendingAndBreakingSchema.safeParse(body);
    if (!parsed.success) {
      const msg = (parsed.error as any).issues?.[0]?.message || (parsed.error as any).errors?.[0]?.message || 'Validation failed.';
      return apiError(msg, 400);
    }

    const updated = await updateAdminTrendingAndBreaking(parsed.data, session as any);
    return apiSuccess(updated);
  } catch (error) {
    return apiError(error, 500);
  }
}
