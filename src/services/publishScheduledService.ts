import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/src/lib/db';
import Post from '@/src/models/Post';
import { logActivity } from './adminAuditService';

export async function publishDueScheduledPosts() {
  await connectToDatabase();
  const now = new Date();

  // Find posts due for publishing
  const duePosts = await Post.find({
    isDeleted: false,
    status: 'scheduled',
    publishedAt: { $lte: now },
  });

  if (duePosts.length === 0) {
    return { publishedCount: 0, posts: [] };
  }

  const ids = duePosts.map((p) => p._id);
  await Post.updateMany(
    { _id: { $in: ids } },
    { $set: { status: 'published' } }
  );

  revalidatePath('/');
  for (const post of duePosts) {
    revalidatePath(`/${encodeURIComponent(post.category)}/${encodeURIComponent(post.slug)}`);
  }

  await logActivity({
    userName: 'Cron Service',
    userRole: 'system',
    action: 'publish',
    entity: 'post',
    details: `Automatically published ${duePosts.length} scheduled articles due at ${now.toISOString()}`,
  });

  return {
    publishedCount: duePosts.length,
    posts: duePosts.map((p) => ({ id: String(p._id), title: p.title, slug: p.slug })),
  };
}
