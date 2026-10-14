import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { staticPageSchema } from '@/src/lib/validators';
import { updateAdminStaticPage, deleteAdminStaticPage } from '@/src/services/adminPageService';
import { sanitizePostHtml } from '@/src/lib/sanitize';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin']);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id } = await context.params;
    const body = await request.json();

    if (body.content) {
      body.content = sanitizePostHtml(body.content);
    }

    const parsed = staticPageSchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Validation failed for page.', 400);
    }

    const updated = await updateAdminStaticPage(id, parsed.data, session as any);
    return apiSuccess(updated);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin']);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id } = await context.params;
    const result = await deleteAdminStaticPage(id, session as any);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, 500);
  }
}
