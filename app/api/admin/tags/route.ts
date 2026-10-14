import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import {
  getAdminTags,
  createAdminTag,
  updateAdminTag,
  reorderAdminTags,
} from '@/src/services/adminTagService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const tags = await getAdminTags(search);
    return apiSuccess(tags);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) {
      return apiError('Topic name is required.', 400);
    }

    const tag = await createAdminTag(
      {
        name,
        description: body.description || '',
        order: typeof body.order === 'number' ? body.order : undefined,
      },
      session as any
    );
    return apiSuccess(tag, undefined, 201);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();

    // Reorder multiple topics
    if (Array.isArray(body.items)) {
      const result = await reorderAdminTags(body.items, session as any);
      return apiSuccess(result);
    }

    // Update single topic
    if (!body.id) {
      return apiError('Topic ID is required for updating.', 400);
    }

    const updated = await updateAdminTag(
      body.id,
      {
        name: body.name,
        description: body.description,
        order: body.order,
        isTrending: body.isTrending,
      },
      session as any
    );
    return apiSuccess(updated);
  } catch (error) {
    return apiError(error, 500);
  }
}
