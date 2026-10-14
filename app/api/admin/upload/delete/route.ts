import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import cloudinary from '@/src/lib/cloudinary';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    const body = await request.json();
    const { publicId } = body;
    if (!publicId) return apiError('Public ID is required.', 400);

    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      await cloudinary.uploader.destroy(publicId);
    }

    return apiSuccess({ success: true });
  } catch (error) {
    return apiError(error, 500);
  }
}
