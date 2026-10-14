import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error('AUTH_SECRET is missing from environment variables.');
  }
  return encoder.encode(value);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export async function signAdminToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyAdminToken(token) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}

export async function signPreviewToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(getSecret());
}

export async function verifyPreviewToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch {
    return null;
  }
}

export async function getAdminSessionFromRequest(request) {
  let token = request.cookies?.get?.('admin_token')?.value;
  if (!token) {
    const rawCookie = request.headers?.get?.('cookie') || request.headers?.get?.('Cookie');
    if (rawCookie) {
      const match = rawCookie.match(/(?:^|;\s*)admin_token=([^;]+)/);
      if (match) token = match[1];
    }
  }
  if (!token) {
    const authHeader = request.headers?.get?.('authorization') || request.headers?.get?.('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  if (!token) return null;

  try {
    return await verifyAdminToken(token);
  } catch (err) {
    console.error('verifyAdminToken error:', err?.message || err);
    return null;
  }
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function canPublish(role) {
  return role === 'admin' || role === 'editor';
}

export function canManageSettings(role) {
  return role === 'admin';
}

export function canManageUsers(role) {
  return role === 'admin';
}

export function canManageAds(role) {
  return role === 'admin';
}

export function canManageHomepage(role) {
  return role === 'admin';
}

export function canManageContent(role) {
  return role === 'admin' || role === 'editor' || role === 'reporter';
}

export function canEditPost(session, post) {
  if (!session) return false;
  if (session.role === 'admin' || session.role === 'editor') return true;
  if (session.role === 'reporter') {
    const authorMatches = post.author === session.username || (post.authorId && String(post.authorId) === String(session.id));
    return authorMatches;
  }
  return false;
}
