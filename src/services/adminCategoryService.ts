import slugify from 'slugify';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/src/lib/db';
import Category from '@/src/models/Category';
import Post from '@/src/models/Post';
import { logActivity } from './adminAuditService';
import type { AdminUserSession } from './adminPostService';

export async function getAdminCategories() {
  await connectToDatabase();
  const categories = await Category.find({})
    .sort({ order: 1, createdAt: -1 })
    .populate('parent', 'name_bn name_en slug')
    .lean();

  // Aggregate post count per category
  const postCounts = await Post.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  postCounts.forEach((item) => {
    countMap.set(item._id, item.count);
  });

  return categories.map((cat: any) => ({
    ...cat,
    postCount: countMap.get(cat.slug) || countMap.get(cat.name_bn) || 0,
  }));
}

export async function createAdminCategory(data: any, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role === 'reporter') {
    throw new Error('Reporters cannot create categories.');
  }

  const slug = data.slug
    ? slugify(data.slug, { lower: true, strict: true, trim: true })
    : slugify(data.name_en || data.name_bn, { lower: true, strict: true, trim: true });

  const category = await Category.create({
    ...data,
    slug: slug || `category-${Date.now()}`,
    parent: data.parent || null,
  });

  revalidatePath('/');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'create',
    entity: 'category',
    entityId: String(category._id),
    details: `Created category "${category.name_bn}" (${category.slug})`,
  });

  return category;
}

export async function updateAdminCategory(id: string, data: any, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role === 'reporter') {
    throw new Error('Reporters cannot edit categories.');
  }

  const category = await Category.findById(id);
  if (!category) throw new Error('Category not found.');

  if (data.slug && data.slug !== category.slug) {
    data.slug = slugify(data.slug, { lower: true, strict: true, trim: true });
  }

  Object.assign(category, {
    ...data,
    parent: data.parent || null,
  });

  await category.save();
  revalidatePath('/');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'category',
    entityId: String(category._id),
    details: `Updated category "${category.name_bn}"`,
  });

  return category;
}

export async function deleteAdminCategory(id: string, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role === 'reporter') {
    throw new Error('Reporters cannot delete categories.');
  }

  const category = await Category.findById(id);
  if (!category) throw new Error('Category not found.');

  // Check if posts exist in this category
  const usedCount = await Post.countDocuments({
    isDeleted: false,
    $or: [{ category: category.slug }, { category: category.name_bn }],
  });

  if (usedCount > 0) {
    throw new Error(`Cannot delete category: it is used by ${usedCount} active articles. Please reassign those articles first.`);
  }

  await Category.findByIdAndDelete(id);
  revalidatePath('/');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'delete',
    entity: 'category',
    entityId: id,
    details: `Deleted category "${category.name_bn}"`,
  });

  return { success: true };
}

export async function reorderAdminCategories(items: { id: string; order: number }[], session: AdminUserSession) {
  await connectToDatabase();
  if (session.role === 'reporter') {
    throw new Error('Reporters cannot reorder categories.');
  }

  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { $set: { order: item.order } },
    },
  }));

  await Category.bulkWrite(bulkOps);
  revalidatePath('/');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'reorder',
    entity: 'category',
    details: `Reordered ${items.length} categories`,
  });

  return { success: true };
}
