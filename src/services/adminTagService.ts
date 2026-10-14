import slugify from 'slugify';
import { connectToDatabase } from '@/src/lib/db';
import Tag from '@/src/models/Tag';
import Post from '@/src/models/Post';
import { logActivity } from './adminAuditService';
import type { AdminUserSession } from './adminPostService';

export async function getAdminTags(search?: string) {
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

  // Ensure all tags in Tag model exist or sync
  const query: Record<string, unknown> = {};
  if (search) {
    query.name = { $regex: search.trim(), $options: 'i' };
  }

  const tagDocs = await Tag.find(query).sort({ postCount: -1, name: 1 }).lean();

  // Combine tag docs and dynamic tags found in posts
  const resultTags: { _id?: string; name: string; slug: string; postCount: number }[] = tagDocs.map((t: any) => ({
    _id: String(t._id),
    name: t.name,
    slug: t.slug,
    postCount: countMap.get(t.name) ?? t.postCount ?? 0,
  }));

  // Add any tags from posts that are not yet in Tag collection
  if (!search) {
    const existingNames = new Set(resultTags.map((t) => t.name.toLowerCase()));
    for (const [name, count] of countMap.entries()) {
      if (!existingNames.has(name.toLowerCase())) {
        resultTags.push({
          name,
          slug: slugify(name, { lower: true, strict: true }) || name,
          postCount: count,
        });
      }
    }
  }

  return resultTags.sort((a, b) => b.postCount - a.postCount);
}

export async function createAdminTag(name: string, session: AdminUserSession) {
  await connectToDatabase();
  const cleanName = name.trim();
  const slug = slugify(cleanName, { lower: true, strict: true, trim: true }) || `tag-${Date.now()}`;

  const existing = await Tag.findOne({ $or: [{ name: cleanName }, { slug }] });
  if (existing) return existing;

  const tag = await Tag.create({ name: cleanName, slug, postCount: 0 });

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'create',
    entity: 'tag',
    entityId: String(tag._id),
    details: `Created tag "${cleanName}"`,
  });

  return tag;
}

export async function renameAdminTag(oldName: string, newName: string, session: AdminUserSession) {
  await connectToDatabase();
  const source = oldName.trim();
  const target = newName.trim();

  // Update in Tag model
  await Tag.findOneAndUpdate(
    { name: source },
    { name: target, slug: slugify(target, { lower: true, strict: true }) || target },
    { upsert: true }
  );

  // Update in all posts: pull oldName and addToSet target
  const posts = await Post.find({ tags: source });
  for (const post of posts) {
    post.tags = post.tags.map((t: string) => (t === source ? target : t));
    // Remove duplicates
    post.tags = Array.from(new Set(post.tags));
    await post.save();
  }

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'tag',
    details: `Renamed tag "${source}" to "${target}" across ${posts.length} articles`,
  });

  return { success: true, updatedPosts: posts.length };
}

export async function mergeAdminTags(sourceTag: string, targetTag: string, session: AdminUserSession) {
  await connectToDatabase();
  const source = sourceTag.trim();
  const target = targetTag.trim();

  if (source.toLowerCase() === target.toLowerCase()) {
    throw new Error('Source and target tags must be different.');
  }

  // Update all posts containing source to have target, and remove source
  const posts = await Post.find({ tags: source });
  for (const post of posts) {
    const updatedTags = post.tags.filter((t: string) => t !== source);
    if (!updatedTags.includes(target)) {
      updatedTags.push(target);
    }
    post.tags = updatedTags;
    await post.save();
  }

  // Delete source from Tag model
  await Tag.findOneAndDelete({ name: source });

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'tag',
    details: `Merged tag "${source}" into "${target}" across ${posts.length} articles`,
  });

  return { success: true, mergedCount: posts.length };
}

export async function deleteAdminTag(name: string, session: AdminUserSession) {
  await connectToDatabase();
  const cleanName = name.trim();

  await Tag.findOneAndDelete({ name: cleanName });

  // Remove tag from posts
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
    details: `Deleted tag "${cleanName}" and pulled from ${result.modifiedCount} articles`,
  });

  return { success: true };
}
