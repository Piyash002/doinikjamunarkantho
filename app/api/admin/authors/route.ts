import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { authorSchema } from '@/src/lib/validators';
import { getAdminAuthors, createAdminAuthor } from '@/src/services/adminAuthorService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const authors = await getAdminAuthors();
    return apiSuccess(authors);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const parsed = authorSchema.safeParse(body);
    if (!parsed.success) {
      const msg = (parsed.error as any).issues?.[0]?.message || (parsed.error as any).errors?.[0]?.message || 'Validation failed for author.';
      return apiError(msg, 400);
    }

    const author = await createAdminAuthor(parsed.data as any, session as any);
    return apiSuccess(author, undefined, 201);
  } catch (error) {
    return apiError(error, 500);
  }
}
