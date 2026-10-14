import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from './auth';

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
};

export function apiSuccess<T>(data: T, meta?: ApiResponse['meta'], status = 200) {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  return NextResponse.json(body, { status });
}

export function apiError(error: string | Error | unknown, status = 400) {
  const message = error instanceof Error ? error.message : (typeof error === 'string' ? error : 'An unexpected error occurred.');
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function requireAuthSession(request: NextRequest, allowedRoles?: ('admin' | 'editor' | 'reporter')[]) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 }),
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.role as any)) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { success: false, error: 'Forbidden. You do not have permission to perform this action.' },
        { status: 403 }
      ),
    };
  }

  return { session, errorResponse: null };
}

// Simple in-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit = 10, windowMs = 60_000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}
