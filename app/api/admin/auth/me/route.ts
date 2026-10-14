import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import AdminUser from '@/src/models/AdminUser';
import { connectToDatabase } from '@/src/lib/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    await connectToDatabase();
    const user = await AdminUser.findById(session.id).select('-passwordHash').lean();
    if (!user || !user.isActive) {
      return apiError('User account not found or deactivated.', 401);
    }

    return apiSuccess({
      id: String(user._id),
      username: user.username,
      name: user.name || user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar?.url || '',
      permissions: {
        canPublish: user.role === 'admin' || user.role === 'editor',
        canManageUsers: user.role === 'admin',
        canManageSettings: user.role === 'admin',
        canManageAds: user.role === 'admin',
        canManageHomepage: user.role === 'admin',
        canManageContent: true,
      },
    });
  } catch (error) {
    return apiError(error, 500);
  }
}
