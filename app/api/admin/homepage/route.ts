import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { getAdminHomepageSections, publishAdminHomepage } from '@/src/services/adminHomepageService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    const sections = await getAdminHomepageSections();
    return apiSuccess(sections);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const sections = Array.isArray(body.sections) ? body.sections : [];
    const result = await publishAdminHomepage(sections, session as any);
    return apiSuccess(result);
  } catch (error) {
    return apiError(error, 500);
  }
}
