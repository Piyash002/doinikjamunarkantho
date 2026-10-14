import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { userCreateSchema } from '@/src/lib/validators';
import { getAdminUsers, createAdminUser } from '@/src/services/adminUserService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin']);
  if (errorResponse || !session) return errorResponse;

  try {
    const users = await getAdminUsers(session as any);
    return apiSuccess(users);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Validation failed for user.', 400);
    }

    const user = await createAdminUser(parsed.data, session as any);
    return apiSuccess(user, undefined, 201);
  } catch (error) {
    return apiError(error, 500);
  }
}
