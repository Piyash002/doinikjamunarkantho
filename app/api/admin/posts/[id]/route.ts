import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { postUpdateSchema } from '@/src/lib/validators';
import { getAdminPostById, updateAdminPost, trashAdminPost, permanentDeletePost } from '@/src/services/adminPostService';
import { sanitizePostHtml } from '@/src/lib/sanitize';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id } = await context.params;
    const post = await getAdminPostById(id, session as any);
    if (!post) return apiError('Post not found.', 404);
    return apiSuccess(post);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id } = await context.params;
    const body = await request.json();

    if (body.content) {
      body.content = sanitizePostHtml(body.content);
    }

    const parsed = postUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Validation failed.', 400);
    }

    const updated = await updateAdminPost(id, parsed.data, session as any);
    return apiSuccess(updated);
  } catch (error: any) {
    if (error?.code === 409 || error?.message === 'OPTIMISTIC_LOCK_CONFLICT') {
      return apiError('OPTIMISTIC_LOCK_CONFLICT: Another editor has saved changes to this post. Please refresh to load the latest version.', 409);
    }
    return apiError(error, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    if (permanent) {
      const result = await permanentDeletePost(id, session as any);
      return apiSuccess(result);
    }

    const trashed = await trashAdminPost(id, session as any);
    return apiSuccess(trashed);
  } catch (error) {
    return apiError(error, 500);
  }
}
