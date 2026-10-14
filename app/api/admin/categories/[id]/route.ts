import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { categorySchema } from '@/src/lib/validators';
import { updateAdminCategory, deleteAdminCategory } from '@/src/services/adminCategoryService';

export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = categorySchema.partial().safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Validation failed for category.', 400);
    }

    const updated = await updateAdminCategory(id, parsed.data, session as any);
    return apiSuccess(updated);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const { id } = await context.params;
    const result = await deleteAdminCategory(id, session as any);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, 400);
  }
}
