import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError, checkRateLimit } from '@/src/lib/apiResponse';
import cloudinary from '@/src/lib/cloudinary';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = checkRateLimit(`upload:${ip}`, 40, 60_000);
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

      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;

      if (!cloudName || !apiKey || !apiSecret) {
        // In local development without Cloudinary credentials configured
        return apiSuccess({
          mockMode: true,
          cloudName: '',
          apiKey: '',
          timestamp,
          folder,
          signature: '',
          message: 'Cloudinary credentials not set in environment.',
        });
      }

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

    // Direct upload via FormData if Cloudinary is configured on server
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) return apiError('No file provided.', 400);

      // Validate file size and type
      if (file.size > 10 * 1024 * 1024) {
        return apiError('File size exceeds 10MB limit.', 400);
      }
      if (!file.type.startsWith('image/')) {
        return apiError('Only image files are allowed.', 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());

      if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'doinikjamunarkantho' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        return apiSuccess({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          width: uploadResult.width,
          height: uploadResult.height,
          fileSize: uploadResult.bytes,
          format: uploadResult.format,
        });
      } else {
        // Fallback: return base64 data URL for local development if Cloudinary is unconfigured
        const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
        return apiSuccess({
          url: dataUrl,
          publicId: `local-${Date.now()}`,
          width: 800,
          height: 600,
          fileSize: file.size,
          format: file.type.split('/')[1] || 'jpeg',
        });
      }
    }

    return apiError('Unsupported content type.', 400);
  } catch (error) {
    return apiError(error, 500);
  }
}
