import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { getCookieOptions, signAdminToken } from '@/src/lib/auth';
import { connectToDatabase } from '@/src/lib/db';
import { loginSchema } from '@/src/lib/validators';
import AdminUser from '@/src/models/AdminUser';
import { apiError, apiSuccess, checkRateLimit } from '@/src/lib/apiResponse';
import { logActivity } from '@/src/services/adminAuditService';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const maxAttempts = process.env.NODE_ENV === 'production' ? 8 : 100;
    const rateCheck = checkRateLimit(`login:${ip}`, maxAttempts, 60_000);
    if (!rateCheck.allowed) {
      return apiError('Too many login attempts. Please wait 1 minute before trying again.', 429);
    }

    if (!process.env.AUTH_SECRET) {
      return apiError('Admin authentication is not configured.', 503);
    }

    await connectToDatabase();
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return apiError(result.error.errors[0]?.message || 'Invalid credentials format.', 400);
    }

    const { username, password, rememberMe } = result.data;

    // Fallback: If AdminUser collection is completely empty AND .env admin credentials exist,
    // auto-create the admin on the first login attempt, then continue normal login check.
    const userCount = await AdminUser.countDocuments();
    if (userCount === 0) {
      const envEmailOrUser = (process.env.ADMIN_EMAIL || process.env.ADMIN_USER || '').trim();
      const envPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || '';
      if (envEmailOrUser && envPass) {
        const seedEmail = (
          envEmailOrUser.includes('@')
            ? envEmailOrUser
            : `${envEmailOrUser}@doinikjamunarkantho.com`
        ).toLowerCase();
        const seedUsername = (
          process.env.ADMIN_USER ||
          (envEmailOrUser.includes('@') ? envEmailOrUser.split('@')[0] : envEmailOrUser)
        ).trim().toLowerCase();
        const seedName = (process.env.ADMIN_NAME || process.env.ADMIN_USER || 'Administrator').trim();
        const passwordHash = await bcrypt.hash(envPass, 12);

        await AdminUser.create({
          username: seedUsername,
          email: seedEmail,
          name: seedName,
          passwordHash,
          role: 'admin',
          isActive: true,
        });
      }
    }

    const admin = await AdminUser.findOne({
      $or: [
        { username: username.toLowerCase().trim() },
        { email: username.toLowerCase().trim() },
      ],
    });

    if (!admin || !admin.isActive) {
      return apiError('Invalid username or password.', 401);
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return apiError('Invalid username or password.', 401);
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = await signAdminToken({
      id: String(admin._id),
      username: admin.username,
      name: admin.name || admin.username,
      role: admin.role,
      avatar: admin.avatar?.url || '',
    });

    const cookieOptions = getCookieOptions();
    if (rememberMe) {
      cookieOptions.maxAge = 60 * 60 * 24 * 30; // 30 days
    }

    await logActivity({
      userId: String(admin._id),
      userName: admin.username,
      userRole: admin.role,
      action: 'login',
      entity: 'auth',
      details: `Successful sign in from IP ${ip}`,
      ip,
    });

    const response = apiSuccess({
      username: admin.username,
      name: admin.name || admin.username,
      role: admin.role,
      avatar: admin.avatar?.url || '',
    });

    response.cookies.set('admin_token', token, cookieOptions);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return apiError('An unexpected server error occurred during login.', 500);
  }
}
