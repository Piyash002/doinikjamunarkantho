import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError, getZodErrorMessage } from '@/src/lib/apiResponse';
import { profileUpdateSchema } from '@/src/lib/validators';
import { getAdminUserProfile, updateAdminUserProfile } from '@/src/services/adminUserService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const profile = await getAdminUserProfile(session as any);
    return apiSuccess(profile);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(getZodErrorMessage(parsed.error, 'Validation failed for profile update.'), 400);
    }

    const updated = await updateAdminUserProfile(parsed.data as any, session as any);
    return apiSuccess(updated);
  } catch (error: any) {
    return apiError(error?.message || 'Failed to update profile.', 400);
  }
}
