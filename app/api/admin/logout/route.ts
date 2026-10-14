import { NextRequest } from 'next/server';
import { getCookieOptions, getAdminSessionFromRequest } from '@/src/lib/auth';
import { apiSuccess } from '@/src/lib/apiResponse';
import { logActivity } from '@/src/services/adminAuditService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (session) {
    await logActivity({
      userId: String(session.id),
      userName: String(session.username),
      userRole: String(session.role),
      action: 'logout',
      entity: 'auth',
      details: 'User logged out',
    });
  }

  const response = apiSuccess({ message: 'Logged out successfully.' });
  const cookieOptions = getCookieOptions();
  response.cookies.set('admin_token', '', { ...cookieOptions, sameSite: 'lax', maxAge: 0 });
  return response;
}
