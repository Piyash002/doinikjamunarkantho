import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { tagSchema } from '@/src/lib/validators';
import { getAdminTags, createAdminTag } from '@/src/services/adminTagService';

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
    const parsed = tagSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Tag name is required.', 400);
    }

    const tag = await createAdminTag(parsed.data.name, session as any);
    return apiSuccess(tag, undefined, 201);
  } catch (error) {
    return apiError(error, 500);
  }
}
