import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { adSlotSchema } from '@/src/lib/validators';
import { getAdminAds, createOrUpdateAdminAd } from '@/src/services/adminSettingsService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const ads = await getAdminAds();
    return apiSuccess(ads);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const parsed = adSlotSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Validation failed for ad slot.', 400);
    }

    const ad = await createOrUpdateAdminAd(parsed.data, session as any);
    return apiSuccess(ad, undefined, 201);
  } catch (error) {
    return apiError(error, 500);
  }
}
