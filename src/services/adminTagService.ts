import { generateBanglaSafeSlug } from '@/src/lib/slug';
import { connectToDatabase } from '@/src/lib/db';
import Tag from '@/src/models/Tag';
import Post from '@/src/models/Post';
import { logActivity } from './adminAuditService';
import type { AdminUserSession } from './adminPostService';

export interface AdminTagItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  isTrending: boolean;
  postCount: number;
}

export async function getAdminTags(search?: string): Promise<AdminTagItem[]> {
  await connectToDatabase();

  // Aggregate tag occurrences across all active posts
  const postTagCounts = await Post.aggregate([
    { $match: { isDeleted: false } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  postTagCounts.forEach((item) => {
    if (item._id) countMap.set(String(item._id).trim(), item.count);
  });

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  // Fetch all existing Tag documents sorted by order
  let tagDocs = await Tag.find(query).sort({ order: 1, createdAt: 1 }).lean();

  // Auto-sync tags found in posts that don't have a Tag document yet
  if (!search) {
    const existingNames = new Set(tagDocs.map((t: any) => t.name.toLowerCase()));
    let nextOrder = tagDocs.reduce((max: number, t: any) => Math.max(max, t.order || 0), 0) + 1;
    let needsRefetch = false;

    for (const [name, count] of countMap.entries()) {
      if (!existingNames.has(name.toLowerCase())) {
        try {
          const slug = generateBanglaSafeSlug(name);
          await Tag.create({
            name,
            slug,
            order: nextOrder++,
            description: '',
            isTrending: true,
            postCount: count,
          });
          needsRefetch = true;
        } catch {
          // ignore duplicate slug collision on auto-sync
        }
      }
    }

    if (needsRefetch) {
      tagDocs = await Tag.find(query).sort({ order: 1, createdAt: 1 }).lean();
    }
  }

  return tagDocs.map((t: any, index: number) => ({
    _id: String(t._id),
    name: t.name,
    slug: t.slug,
    description: t.description || '',
    order: typeof t.order === 'number' ? t.order : index + 1,
    isTrending: t.isTrending !== false,
    postCount: countMap.get(t.name) ?? t.postCount ?? 0,
  }));
}

export async function createAdminTag(
  input: string | { name: string; description?: string; order?: number },
  session: AdminUserSession
) {
  await connectToDatabase();
  const name = typeof input === 'string' ? input.trim() : input.name.trim();
  const description = typeof input === 'object' && input.description ? input.description.trim() : '';
  const slug = generateBanglaSafeSlug(name) || `topic-${Date.now()}`;

  const existing = await Tag.findOne({ $or: [{ name }, { slug }] });
  if (existing) {
    if (description && !existing.description) {
      existing.description = description;
      await existing.save();
    }
    return existing;
  }

  // Calculate next order so new topic goes after existing ones ("jeta age khe topic oita age e thajbe")
  let order = typeof input === 'object' && typeof input.order === 'number' ? input.order : undefined;
  if (typeof order !== 'number') {
    const lastTag = await Tag.findOne({}).sort({ order: -1 }).select({ order: 1 }).lean();
    order = (lastTag?.order || 0) + 1;
  }

  const tag = await Tag.create({
    name,
    slug,
    description,
    order,
    isTrending: true,
    postCount: 0,
  });

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'create',
    entity: 'tag',
    entityId: String(tag._id),
    details: `Created trending topic "${name}"`,
  });

  return tag;
}

export async function updateAdminTag(
  id: string,
  data: { name?: string; description?: string; order?: number; isTrending?: boolean },
  session: AdminUserSession
) {
  await connectToDatabase();
  const tag = await Tag.findById(id);
  if (!tag) {
    throw new Error('Topic not found.');
  }

  const oldName = tag.name;
  if (data.name && data.name.trim() !== tag.name) {
    const newName = data.name.trim();
    tag.name = newName;
    tag.slug = generateBanglaSafeSlug(newName);

    // Update in posts
    const posts = await Post.find({ tags: oldName });
    for (const post of posts) {
      post.tags = post.tags.map((t: string) => (t === oldName ? newName : t));
      post.tags = Array.from(new Set(post.tags));
      await post.save();
    }
  }

  if (typeof data.description === 'string') {
    tag.description = data.description.trim();
  }
  if (typeof data.order === 'number') {
    tag.order = data.order;
  }
  if (typeof data.isTrending === 'boolean') {
    tag.isTrending = data.isTrending;
  }

  await tag.save();

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'tag',
    entityId: String(tag._id),
    details: `Updated topic "${tag.name}"`,
  });

  return tag;
}

export async function reorderAdminTags(
  items: { id: string; order: number }[],
  session: AdminUserSession
) {
  await connectToDatabase();
  if (!Array.isArray(items) || items.length === 0) return { success: true };

  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.id },
      update: { $set: { order: item.order } },
    },
  }));

  await Tag.bulkWrite(bulkOps);

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'tag',
    details: `Reordered ${items.length} trending topics`,
  });

  return { success: true };
}

export async function renameAdminTag(oldName: string, newName: string, session: AdminUserSession) {
  await connectToDatabase();
  const source = oldName.trim();
  const target = newName.trim();

  await Tag.findOneAndUpdate(
    { name: source },
    { name: target, slug: generateBanglaSafeSlug(target) || target },
    { upsert: true }
  );

  const posts = await Post.find({ tags: source });
  for (const post of posts) {
    post.tags = post.tags.map((t: string) => (t === source ? target : t));
    post.tags = Array.from(new Set(post.tags));
    await post.save();
  }

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'tag',
    details: `Renamed topic "${source}" to "${target}" across ${posts.length} articles`,
  });

  return { success: true, updatedPosts: posts.length };
}

export async function mergeAdminTags(sourceTag: string, targetTag: string, session: AdminUserSession) {
  await connectToDatabase();
  const source = sourceTag.trim();
  const target = targetTag.trim();

  if (source.toLowerCase() === target.toLowerCase()) {
    throw new Error('Source and target topics must be different.');
  }

  const posts = await Post.find({ tags: source });
  for (const post of posts) {
    const updatedTags = post.tags.filter((t: string) => t !== source);
    if (!updatedTags.includes(target)) {
      updatedTags.push(target);
    }
    post.tags = updatedTags;
    await post.save();
  }

  await Tag.findOneAndDelete({ name: source });

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'tag',
    details: `Merged topic "${source}" into "${target}" across ${posts.length} articles`,
  });

  return { success: true, mergedCount: posts.length };
}

export async function deleteAdminTag(name: string, session: AdminUserSession) {
  await connectToDatabase();
  const cleanName = name.trim();

  await Tag.findOneAndDelete({ name: cleanName });

  const result = await Post.updateMany(
    { tags: cleanName },
    { $pull: { tags: cleanName } }
  );

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'delete',
    entity: 'tag',
    details: `Deleted topic "${cleanName}" and pulled from ${result.modifiedCount} articles`,
  });

  return { success: true };
}

export async function getPublicTrendingTopics(): Promise<AdminTagItem[]> {
  await connectToDatabase();
  const tags = await Tag.find({ isTrending: { $ne: false } })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return tags.map((t: any, index: number) => ({
    _id: String(t._id),
    name: t.name,
    slug: t.slug,
    description: t.description || '',
    order: typeof t.order === 'number' ? t.order : index + 1,
    isTrending: t.isTrending !== false,
    postCount: t.postCount || 0,
  }));
}
