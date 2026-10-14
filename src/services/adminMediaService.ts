import { connectToDatabase } from '@/src/lib/db';
import Media from '@/src/models/Media';
import Post from '@/src/models/Post';
import cloudinary from '@/src/lib/cloudinary';
import { logActivity } from './adminAuditService';
import type { AdminUserSession } from './adminPostService';

export async function getAdminMedia(params: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  await connectToDatabase();
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 24));

  const query: Record<string, unknown> = {};
  if (params.search) {
    const s = params.search.trim();
    query.$or = [
      { filename: { $regex: s, $options: 'i' } },
      { alt: { $regex: s, $options: 'i' } },
      { caption: { $regex: s, $options: 'i' } },
    ];
  }

  const total = await Media.countDocuments(query);
  const items = await Media.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

export async function getMediaUsedIn(url: string, publicId?: string) {
  await connectToDatabase();
  const conditions: any[] = [{ 'featuredImage.url': url }, { 'gallery.url': url }];
  if (publicId) {
    conditions.push({ 'featuredImage.publicId': publicId }, { 'gallery.publicId': publicId });
  }

  const posts = await Post.find({
    isDeleted: false,
    $or: conditions,
  })
    .select('title slug category status publishedAt')
    .limit(10)
    .lean();

  return posts;
}

export async function saveMediaItem(data: {
  url: string;
  publicId?: string;
  filename: string;
  fileType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
}, session: AdminUserSession) {
  await connectToDatabase();
  const media = await Media.create({
    ...data,
    uploadedBy: session.username,
  });

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'create',
    entity: 'media',
    entityId: String(media._id),
    details: `Uploaded media asset "${media.filename}"`,
  });

  return media;
}

export async function updateMediaItem(id: string, data: {
  filename?: string;
  alt?: string;
  caption?: string;
}, session: AdminUserSession) {
  await connectToDatabase();
  const media = await Media.findByIdAndUpdate(id, data, { new: true });
  if (!media) throw new Error('Media item not found.');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'media',
    entityId: id,
    details: `Updated metadata for media asset "${media.filename}"`,
  });

  return media;
}

export async function deleteMediaItem(id: string, session: AdminUserSession) {
  await connectToDatabase();
  const media = await Media.findById(id);
  if (!media) throw new Error('Media item not found.');

  // Check if used in posts
  const usedPosts = await getMediaUsedIn(media.url, media.publicId);
  if (usedPosts.length > 0) {
    const titles = usedPosts.map((p) => `"${p.title}"`).join(', ');
    throw new Error(`Cannot delete image: it is currently used in ${usedPosts.length} article(s): ${titles}`);
  }

  // If publicId exists and Cloudinary is configured, try deleting from Cloudinary
  if (media.publicId && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      await cloudinary.uploader.destroy(media.publicId);
    } catch (err) {
      console.warn('Cloudinary destroy error:', err);
    }
  }

  await Media.findByIdAndDelete(id);

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'delete',
    entity: 'media',
    entityId: id,
    details: `Deleted media asset "${media.filename}"`,
  });

  return { success: true };
}
