import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { settingsSchema } from '@/src/lib/validators';
import { getAdminSettings, updateAdminSettings } from '@/src/services/adminSettingsService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const settings = await getAdminSettings();
    return apiSuccess(settings);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      const msg = (parsed.error as any).issues?.[0]?.message || (parsed.error as any).errors?.[0]?.message || 'Validation failed for settings.';
      return apiError(msg, 400);
    }

    const settings = await updateAdminSettings(parsed.data as any, session as any);
    return apiSuccess(settings);
  } catch (error) {
    return apiError(error, 500);
  }
}
