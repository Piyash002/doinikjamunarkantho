import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/src/lib/apiResponse';
import { publishDueScheduledPosts } from '@/src/services/publishScheduledService';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return handleCronPublish(request);
}

export async function POST(request: NextRequest) {
  return handleCronPublish(request);
}

async function handleCronPublish(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { searchParams } = new URL(request.url);
    const secretFromParam = searchParams.get('secret');

    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret) {
      const isAuthorized =
        authHeader === `Bearer ${expectedSecret}` ||
        secretFromParam === expectedSecret;

      if (!isAuthorized) {
        return apiError('Unauthorized cron invocation.', 401);
      }
    }

    const result = await publishDueScheduledPosts();
    return apiSuccess({
      message: `Cron job executed successfully. Published ${result.publishedCount} article(s).`,
      ...result,
    });
  } catch (error) {
    console.error('Cron publish-scheduled error:', error);
    return apiError(error, 500);
  }
}
