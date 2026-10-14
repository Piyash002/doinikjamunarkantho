import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { categorySchema, categoryReorderSchema } from '@/src/lib/validators';
import {
  getAdminCategories,
  createAdminCategory,
  reorderAdminCategories,
} from '@/src/services/adminCategoryService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const categories = await getAdminCategories();
    return apiSuccess(categories);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Validation failed for category.', 400);
    }

    const category = await createAdminCategory(parsed.data, session as any);
    return apiSuccess(category, undefined, 201);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const parsed = categoryReorderSchema.safeParse(body);
    if (!parsed.success) {
      return apiError('Invalid reorder request payload.', 400);
    }

    const result = await reorderAdminCategories(parsed.data.items, session as any);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, 500);
  }
}
