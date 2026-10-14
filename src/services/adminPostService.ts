import mongoose from 'mongoose';
import slugify from 'slugify';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/src/lib/db';
import Post from '@/src/models/Post';
import Category from '@/src/models/Category';
import { logActivity } from './adminAuditService';

export type AdminUserSession = {
  id: string;
  username: string;
  role: 'admin' | 'editor' | 'reporter';
};

export function generateBanglaSafeSlug(text: string): string {
  const clean = text.trim();
  // If text contains latin characters, slugify standard
  let slug = slugify(clean, { lower: true, strict: true, trim: true });
  // If slug is empty (due to unicode/Bangla characters only)
  if (!slug) {
    slug = clean
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  }
  return slug || `post-${Date.now()}`;
}

export async function checkSlugUnique(slug: string, currentId?: string): Promise<boolean> {
  await connectToDatabase();
  const query: Record<string, unknown> = { slug };
  if (currentId) {
    query._id = { $ne: currentId };
  }
  const count = await Post.countDocuments(query);
  return count === 0;
}

export async function getUniqueSlug(baseSlug: string, currentId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (!(await checkSlugUnique(slug, currentId))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

export async function getAdminPosts(params: {
  category?: string;
  status?: string;
  tag?: string;
  author?: string;
  search?: string;
  division?: string;
  district?: string;
  upazila?: string;
  isBreaking?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
  page?: number;
  limit?: number;
  session?: AdminUserSession;
}) {
  await connectToDatabase();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 25));

  // Determine base filter based on status tab
  const statusTab = params.status || 'all';
  const query: Record<string, unknown> = {};

  if (statusTab === 'trashed') {
    query.isDeleted = true;
  } else {
    query.isDeleted = false;
    if (statusTab === 'published') query.status = 'published';
    else if (statusTab === 'draft') query.status = 'draft';
    else if (statusTab === 'scheduled') query.status = 'scheduled';
  }

  // Reporter role restriction: reporters can only see/edit their own posts
  if (params.session && params.session.role === 'reporter') {
    query.$or = [
      { author: params.session.username },
      { authorId: params.session.id },
    ];
  } else if (params.author) {
    query.author = { $regex: params.author, $options: 'i' };
  }

  if (params.category && params.category !== 'all') {
    query.category = params.category;
  }

  if (params.tag) {
    query.tags = params.tag;
  }

  if (params.isBreaking) query.isBreaking = true;
  if (params.isFeatured) query.isFeatured = true;
  if (params.isTrending) query.isTrending = true;

  if (params.division) query.division = params.division;
  if (params.district) query.district = params.district;
  if (params.upazila) query.upazila = params.upazila;

  if (params.dateFrom || params.dateTo) {
    const dateQuery: Record<string, Date> = {};
    if (params.dateFrom) dateQuery.$gte = new Date(params.dateFrom);
    if (params.dateTo) {
      const end = new Date(params.dateTo);
      end.setHours(23, 59, 59, 999);
      dateQuery.$lte = end;
    }
    query.createdAt = dateQuery;
  }

  if (params.search) {
    const searchRegex = { $regex: params.search.trim(), $options: 'i' };
    query.$or = [
      { title: searchRegex },
      { excerpt: searchRegex },
      { slug: searchRegex },
    ];
  }

  // Sorting
  let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
  if (params.sort === 'oldest') sortOption = { createdAt: 1 };
  else if (params.sort === 'views') sortOption = { views: -1 };
  else if (params.sort === 'title') sortOption = { title: 1 };
  else if (params.sort === 'publishedAt') sortOption = { publishedAt: -1 };

  // Calculate status counts for UI tabs
  const baseCountQuery = params.session?.role === 'reporter'
    ? { $or: [{ author: params.session.username }, { authorId: params.session.id }] }
    : {};

  const [total, posts, allCount, publishedCount, draftCount, scheduledCount, trashedCount] = await Promise.all([
    Post.countDocuments(query),
    Post.find(query)
      .select('title slug category subCategory author status views featuredImage isBreaking isFeatured isTrending publishedAt createdAt updatedAt version isDeleted')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Post.countDocuments({ ...baseCountQuery, isDeleted: false }),
    Post.countDocuments({ ...baseCountQuery, isDeleted: false, status: 'published' }),
    Post.countDocuments({ ...baseCountQuery, isDeleted: false, status: 'draft' }),
    Post.countDocuments({ ...baseCountQuery, isDeleted: false, status: 'scheduled' }),
    Post.countDocuments({ ...baseCountQuery, isDeleted: true }),
  ]);

  return {
    posts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
    counts: {
      all: allCount,
      published: publishedCount,
      draft: draftCount,
      scheduled: scheduledCount,
      trashed: trashedCount,
    },
  };
}

export async function getAdminPostById(id: string, session?: AdminUserSession) {
  await connectToDatabase();
  const post = await Post.findById(id).lean();
  if (!post) return null;

  if (session && session.role === 'reporter') {
    const isOwner = post.author === session.username || (post.authorId && String(post.authorId) === String(session.id));
    if (!isOwner) throw new Error('You do not have permission to view or edit this post.');
  }

  return post;
}

export async function createAdminPost(data: any, session: AdminUserSession) {
  await connectToDatabase();

  // Role validation: reporters cannot publish
  if (session.role === 'reporter' && (data.status === 'published' || data.status === 'scheduled')) {
    data.status = 'draft';
  }

  const baseSlug = data.slug ? generateBanglaSafeSlug(data.slug) : generateBanglaSafeSlug(data.title);
  const slug = await getUniqueSlug(baseSlug);

  const publishedAt = data.status === 'published'
    ? (data.publishedAt ? new Date(data.publishedAt) : new Date())
    : (data.status === 'scheduled' ? new Date(data.publishedAt) : null);

  const newPost = await Post.create({
    ...data,
    slug,
    author: data.author || session.username,
    authorId: mongoose.isValidObjectId(session.id) ? session.id : null,
    publishedAt,
    version: 1,
    isDeleted: false,
    revisions: [
      {
        version: 1,
        title: data.title,
        excerpt: data.excerpt || '',
        content: data.content,
        lead: data.lead || '',
        updatedBy: session.username,
        savedAt: new Date(),
      },
    ],
  });

  if (newPost.status === 'published') {
    revalidatePath('/');
    revalidatePath(`/${encodeURIComponent(newPost.category)}/${encodeURIComponent(newPost.slug)}`);
  }

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: data.status === 'published' ? 'publish' : 'create',
    entity: 'post',
    entityId: String(newPost._id),
    details: `Created article "${newPost.title}" (${newPost.status})`,
  });

  return newPost;
}

export async function updateAdminPost(id: string, data: any, session: AdminUserSession) {
  await connectToDatabase();
  const existing = await Post.findById(id);
  if (!existing) throw new Error('Post not found.');

  // Reporter check
  if (session.role === 'reporter') {
    const isOwner = existing.author === session.username || (existing.authorId && String(existing.authorId) === String(session.id));
    if (!isOwner) throw new Error('You do not have permission to edit this post.');
    if (data.status === 'published' || data.status === 'scheduled') {
      throw new Error('Reporters cannot publish articles. Please save as draft.');
    }
  }

  // Optimistic locking check: if client sent a version and it doesn't match current document version
  if (data.version !== undefined && data.version !== existing.version) {
    const error = new Error('OPTIMISTIC_LOCK_CONFLICT');
    (error as any).code = 409;
    (error as any).currentVersion = existing.version;
    (error as any).currentUpdatedAt = existing.updatedAt;
    throw error;
  }

  // Handle slug update if changed
  let updatedSlug = existing.slug;
  if (data.slug && data.slug !== existing.slug) {
    const cleanSlug = generateBanglaSafeSlug(data.slug);
    updatedSlug = await getUniqueSlug(cleanSlug, String(existing._id));
  } else if (!data.slug && data.title && data.title !== existing.title && existing.status === 'draft') {
    const cleanSlug = generateBanglaSafeSlug(data.title);
    updatedSlug = await getUniqueSlug(cleanSlug, String(existing._id));
  }

  // Handle publishedAt
  let publishedAt = existing.publishedAt;
  if (data.status === 'published') {
    publishedAt = data.publishedAt ? new Date(data.publishedAt) : (existing.publishedAt || new Date());
  } else if (data.status === 'scheduled') {
    publishedAt = data.publishedAt ? new Date(data.publishedAt) : existing.publishedAt;
  } else if (data.status === 'draft') {
    // Keep or clear publishedAt
  }

  const newVersion = (existing.version || 1) + 1;

  // Add revision snapshot, keeping max 20 versions
  const revisions = Array.isArray(existing.revisions) ? existing.revisions : [];
  revisions.unshift({
    version: newVersion,
    title: data.title ?? existing.title,
    excerpt: data.excerpt ?? existing.excerpt,
    content: data.content ?? existing.content,
    lead: data.lead ?? existing.lead,
    updatedBy: session.username,
    savedAt: new Date(),
  });
  if (revisions.length > 20) {
    revisions.length = 20;
  }

  Object.assign(existing, {
    ...data,
    slug: updatedSlug,
    publishedAt,
    version: newVersion,
    revisions,
  });

  await existing.save();

  if (existing.status === 'published') {
    revalidatePath('/');
    revalidatePath(`/${encodeURIComponent(existing.category)}/${encodeURIComponent(existing.slug)}`);
  }

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: data.status === 'published' && existing.status !== 'published' ? 'publish' : 'update',
    entity: 'post',
    entityId: String(existing._id),
    details: `Updated article "${existing.title}" (v${newVersion})`,
  });

  return existing;
}

export async function restoreRevision(postId: string, revisionVersion: number, session: AdminUserSession) {
  await connectToDatabase();
  const post = await Post.findById(postId);
  if (!post) throw new Error('Post not found.');

  const rev = post.revisions.find((r: any) => r.version === revisionVersion);
  if (!rev) throw new Error('Revision version not found.');

  post.title = rev.title;
  post.content = rev.content;
  post.excerpt = rev.excerpt;
  post.lead = rev.lead || '';
  post.version = (post.version || 1) + 1;

  post.revisions.unshift({
    version: post.version,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    lead: post.lead,
    updatedBy: `${session.username} (Restored v${revisionVersion})`,
    savedAt: new Date(),
  });

  await post.save();

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'restore',
    entity: 'post',
    entityId: String(post._id),
    details: `Restored article "${post.title}" to revision v${revisionVersion}`,
  });

  return post;
}

export async function trashAdminPost(id: string, session: AdminUserSession) {
  await connectToDatabase();
  const post = await Post.findById(id);
  if (!post) throw new Error('Post not found.');

  post.isDeleted = true;
  post.deletedAt = new Date();
  await post.save();

  revalidatePath('/');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'delete',
    entity: 'post',
    entityId: String(post._id),
    details: `Moved article "${post.title}" to trash`,
  });

  return post;
}

export async function restoreAdminPost(id: string, session: AdminUserSession) {
  await connectToDatabase();
  const post = await Post.findById(id);
  if (!post) throw new Error('Post not found.');

  post.isDeleted = false;
  post.deletedAt = null;
  await post.save();

  if (post.status === 'published') {
    revalidatePath('/');
  }

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'restore',
    entity: 'post',
    entityId: String(post._id),
    details: `Restored article "${post.title}" from trash`,
  });

  return post;
}

export async function permanentDeletePost(id: string, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role === 'reporter') {
    throw new Error('Reporters cannot permanently delete articles.');
  }

  const post = await Post.findByIdAndDelete(id);
  if (!post) throw new Error('Post not found.');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'delete',
    entity: 'post',
    entityId: id,
    details: `Permanently deleted article "${post.title}"`,
  });

  return { success: true };
}

export async function duplicateAdminPost(id: string, session: AdminUserSession) {
  await connectToDatabase();
  const original = await Post.findById(id).lean();
  if (!original) throw new Error('Original post not found.');

  const newTitle = `${original.title} (Copy)`;
  const baseSlug = generateBanglaSafeSlug(newTitle);
  const slug = await getUniqueSlug(baseSlug);

  const duplicate = await Post.create({
    ...original,
    _id: undefined,
    title: newTitle,
    slug,
    status: 'draft',
    publishedAt: null,
    views: 0,
    viewCount: 0,
    shareCount: 0,
    isDeleted: false,
    deletedAt: null,
    version: 1,
    author: session.username,
    authorId: session.id,
    revisions: [
      {
        version: 1,
        title: newTitle,
        excerpt: original.excerpt,
        content: original.content,
        lead: original.lead,
        updatedBy: session.username,
        savedAt: new Date(),
      },
    ],
  });

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'create',
    entity: 'post',
    entityId: String(duplicate._id),
    details: `Duplicated article "${original.title}" -> "${duplicate.title}"`,
  });

  return duplicate;
}

export async function bulkAdminPosts(
  ids: string[],
  action: 'publish' | 'unpublish' | 'trash' | 'restore' | 'delete' | 'change_category' | 'mark_featured' | 'unmark_featured',
  data: { category?: string },
  session: AdminUserSession
) {
  await connectToDatabase();

  if (session.role === 'reporter' && (action === 'publish' || action === 'delete' || action === 'restore')) {
    throw new Error('Reporters do not have permission for this bulk operation.');
  }

  let modifiedCount = 0;

  switch (action) {
    case 'publish':
      const publishRes = await Post.updateMany(
        { _id: { $in: ids }, isDeleted: false },
        { $set: { status: 'published', publishedAt: new Date() } }
      );
      modifiedCount = publishRes.modifiedCount;
      revalidatePath('/');
      break;

    case 'unpublish':
      const unpublishRes = await Post.updateMany(
        { _id: { $in: ids } },
        { $set: { status: 'draft' } }
      );
      modifiedCount = unpublishRes.modifiedCount;
      revalidatePath('/');
      break;

    case 'trash':
      const trashRes = await Post.updateMany(
        { _id: { $in: ids } },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
      modifiedCount = trashRes.modifiedCount;
      revalidatePath('/');
      break;

    case 'restore':
      const restoreRes = await Post.updateMany(
        { _id: { $in: ids } },
        { $set: { isDeleted: false, deletedAt: null } }
      );
      modifiedCount = restoreRes.modifiedCount;
      revalidatePath('/');
      break;

    case 'delete':
      const deleteRes = await Post.deleteMany({ _id: { $in: ids } });
      modifiedCount = deleteRes.deletedCount;
      break;

    case 'change_category':
      if (!data.category) throw new Error('Category is required.');
      const catRes = await Post.updateMany(
        { _id: { $in: ids } },
        { $set: { category: data.category } }
      );
      modifiedCount = catRes.modifiedCount;
      revalidatePath('/');
      break;

    case 'mark_featured':
      const featRes = await Post.updateMany(
        { _id: { $in: ids } },
        { $set: { isFeatured: true } }
      );
      modifiedCount = featRes.modifiedCount;
      revalidatePath('/');
      break;

    case 'unmark_featured':
      const unfeatRes = await Post.updateMany(
        { _id: { $in: ids } },
        { $set: { isFeatured: false } }
      );
      modifiedCount = unfeatRes.modifiedCount;
      revalidatePath('/');
      break;
  }

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'bulk_action',
    entity: 'post',
    details: `Executed bulk action "${action}" on ${ids.length} articles`,
  });

  return { modifiedCount };
}
