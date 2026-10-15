import { NextRequest } from 'next/server';
import { requireAuthSession, apiSuccess, apiError } from '@/src/lib/apiResponse';
import { connectToDatabase } from '@/src/lib/db';
import Category from '@/src/models/Category';
import Post from '@/src/models/Post';
import { logActivity } from '@/src/services/adminAuditService';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request);
  if (errorResponse || !session) return errorResponse;

  try {
    await connectToDatabase();

    const categories = await Category.find({ parent: null })
      .sort({ showOnHome: -1, homeOrder: 1, order: 1 })
      .lean();

    // Aggregate post counts
    const postCounts = await Post.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    postCounts.forEach((item) => {
      if (item._id) countMap.set(String(item._id), item.count);
    });

    const enriched = categories.map((cat: any) => ({
      _id: String(cat._id),
      name_bn: cat.name_bn,
      name_en: cat.name_en,
      slug: cat.slug,
      showOnHome: Boolean(cat.showOnHome),
      homeOrder: typeof cat.homeOrder === 'number' ? cat.homeOrder : 0,
      homeLayout: cat.homeLayout || 'lead-plus-list',
      order: cat.order || 0,
      showInNav: cat.showInNav ?? true,
      postCount: countMap.get(cat.slug) || countMap.get(cat.name_bn) || 0,
    }));

    return apiSuccess(enriched);
  } catch (error) {
    return apiError(error, 500);
  }
}

export async function PUT(request: NextRequest) {
  const { session, errorResponse } = await requireAuthSession(request, ['admin', 'editor']);
  if (errorResponse || !session) return errorResponse;

  try {
    await connectToDatabase();
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return apiError('No category updates provided.', 400);
    }

    const bulkOps = items.map((item: any) => {
      const updateFields: any = {};
      if (typeof item.homeOrder === 'number') updateFields.homeOrder = item.homeOrder;
      if (typeof item.showOnHome === 'boolean') updateFields.showOnHome = item.showOnHome;
      if (typeof item.homeLayout === 'string') updateFields.homeLayout = item.homeLayout;
      if (typeof item.order === 'number') updateFields.order = item.order;

      return {
        updateOne: {
          filter: { _id: item.id },
          update: { $set: updateFields },
        },
      };
    });

    await Category.bulkWrite(bulkOps);

    revalidatePath('/');
    revalidatePath('/', 'layout');

    await logActivity({
      userId: (session as any).id || (session as any)._id,
      userName: (session as any).username || (session as any).name || 'admin',
      userRole: (session as any).role || 'admin',
      action: 'reorder',
      entity: 'homepage',
      details: `Updated homepage pinned category serials and layouts (${items.length} categories)`,
    });

    return apiSuccess({ success: true, count: items.length });
  } catch (error) {
    return apiError(error, 500);
  }
}
