import { connectToDatabase } from '@/src/lib/db';
import Author from '@/src/models/Author';
import Post from '@/src/models/Post';
import { logActivity } from './adminAuditService';
import type { AdminUserSession } from './adminPostService';

export async function getAdminAuthors() {
  await connectToDatabase();
  const authors = await Author.find({}).sort({ name: 1 }).lean();

  // Aggregate post counts per author
  const postCounts = await Post.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$author', count: { $sum: 1 } } },
  ]);

  const countMap = new Map<string, number>();
  postCounts.forEach((item) => {
    if (item._id) countMap.set(String(item._id).trim(), item.count);
  });

  return authors.map((author: any) => ({
    ...author,
    postCount: countMap.get(author.name) || 0,
  }));
}

export async function createAdminAuthor(data: any, session: AdminUserSession) {
  await connectToDatabase();
  const author = await Author.create(data);

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'create',
    entity: 'author',
    entityId: String(author._id),
    details: `Created author profile for "${author.name}"`,
  });

  return author;
}

export async function updateAdminAuthor(id: string, data: any, session: AdminUserSession) {
  await connectToDatabase();
  const author = await Author.findByIdAndUpdate(id, data, { new: true });
  if (!author) throw new Error('Author not found.');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'author',
    entityId: id,
    details: `Updated author profile "${author.name}"`,
  });

  return author;
}

export async function deleteAdminAuthor(id: string, session: AdminUserSession) {
  await connectToDatabase();
  const author = await Author.findById(id);
  if (!author) throw new Error('Author not found.');

  const postCount = await Post.countDocuments({ author: author.name, isDeleted: false });
  if (postCount > 0) {
    throw new Error(`Cannot delete author: they have ${postCount} active articles. Please reassign their articles first.`);
  }

  await Author.findByIdAndDelete(id);

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'delete',
    entity: 'author',
    entityId: id,
    details: `Deleted author profile "${author.name}"`,
  });

  return { success: true };
}
