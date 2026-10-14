import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError, checkRateLimit } from '@/src/lib/apiResponse';
import cloudinary, {
  configureCloudinary,
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
} from '@/src/lib/cloudinary';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  configureCloudinary();
  const configured = isCloudinaryConfigured();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'eesshklj';

  return apiSuccess({
    configured,
    cloudName,
    hasKey: Boolean(process.env.CLOUDINARY_API_KEY || '753453721251931'),
    hasSecret: Boolean(process.env.CLOUDINARY_API_SECRET || '4GF5lJn4X7_lkjLk27GsX6DGx4Q'),
  });
}

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = checkRateLimit(`upload:${ip}`, 100, 60_000);
  if (!rate.allowed) {
    return apiError('Upload rate limit exceeded. Please wait a moment.', 429);
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    // If client is asking for a signed Cloudinary signature
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      const folder = body?.folder || 'doinikjamunarkantho';
      const timestamp = Math.round(Date.now() / 1000);

      configureCloudinary();

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'eesshklj';
      const apiKey = process.env.CLOUDINARY_API_KEY || '753453721251931';
      const apiSecret = process.env.CLOUDINARY_API_SECRET || '4GF5lJn4X7_lkjLk27GsX6DGx4Q';

      const signature = cloudinary.utils.api_sign_request(
        {
          timestamp,
          folder,
        },
        apiSecret
      );

      return apiSuccess({
        mockMode: false,
        cloudName,
        apiKey,
        timestamp,
        folder,
        signature,
      });
    }

    // Direct upload via multipart/form-data to Cloudinary (handles ANY size, ANY format)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) return apiError('কোনো ফাইল পাওয়া যায়নি (No file provided).', 400);

      // Read file buffer directly
      const buffer = Buffer.from(await file.arrayBuffer());

      if (buffer.length === 0) {
        return apiError('ফাইলটি খালি বা ত্রুটিপূর্ণ (Empty file provided).', 400);
      }

      // Stream upload directly to Cloudinary using auto format detection
      const uploadResult: any = await uploadBufferToCloudinary(buffer, {
        folder: 'doinikjamunarkantho',
        resource_type: 'auto', // Cloudinary automatically supports any image format (JPG, PNG, WebP, GIF, SVG, AVIF, HEIC, TIFF, etc.)
      });

      return apiSuccess({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width || 0,
        height: uploadResult.height || 0,
        fileSize: uploadResult.bytes || buffer.length,
        format: uploadResult.format || file.name.split('.').pop() || 'jpg',
      });
    }

    return apiError('Unsupported content type. Expected multipart/form-data.', 400);
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return apiError(
      error?.message || 'Cloudinary আপলোড ব্যর্থ হয়েছে। দয়া করে ইন্টারনেট ও ফাইল চেক করুন।',
      500
    );
  }
}
