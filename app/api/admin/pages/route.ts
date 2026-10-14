import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { staticPageSchema } from '@/src/lib/validators';
import { getAdminStaticPages, createAdminStaticPage } from '@/src/services/adminPageService';
import { sanitizePostHtml } from '@/src/lib/sanitize';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const pages = await getAdminStaticPages();
    return apiSuccess(pages);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    if (body.content) {
      body.content = sanitizePostHtml(body.content);
    }

    const parsed = staticPageSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Validation failed for page.', 400);
    }

    const page = await createAdminStaticPage(parsed.data, session as any);
    return apiSuccess(page, undefined, 201);
  } catch (error) {
    return apiError(error, 500);
  }
}
