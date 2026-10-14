import { connectToDatabase } from '@/src/lib/db';
import Category from '@/src/models/Category';
import Post from '@/src/models/Post';

export async function getHomeData() {
  await connectToDatabase();

  const [categories, featured, latest, trending] = await Promise.all([
    Category.find({ isActive: true }).sort({ order: 1 }).lean(),
    Post.find({ status: 'published', isFeatured: true }).sort({ publishedAt: -1 }).limit(6).lean(),
    Post.find({ status: 'published' }).sort({ publishedAt: -1 }).limit(12).lean(),
    Post.find({ status: 'published', isTrending: true }).sort({ publishedAt: -1 }).limit(6).lean(),
  ]);

  return { categories, featured, latest, trending };
}

export async function getPostsByCategory(categorySlug, page = 1, limit = 12) {
  await connectToDatabase();

  const query = { status: 'published' };

  if (categorySlug && categorySlug !== 'all') {
    query.category = categorySlug;
  }

  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .sort({ publishedAt: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { posts, total, page, limit, hasMore: page * limit < total };
}

export async function getPostBySlug(slug) {
  await connectToDatabase();
  const post = await Post.findOne({ slug, status: 'published' }).lean();
  return post;
}

export async function getLatestPosts(limit = 8) {
  await connectToDatabase();
  return Post.find({ status: 'published' }).sort({ publishedAt: -1 }).limit(limit).lean();
}

export async function getPopularPosts(limit = 8) {
  await connectToDatabase();
  return Post.find({ status: 'published' }).sort({ views: -1, publishedAt: -1 }).limit(limit).lean();
}

export async function getRelatedPosts(category, currentSlug, limit = 4) {
  await connectToDatabase();

  const query = {
    status: 'published',
    category,
    slug: { $ne: currentSlug },
  };

  return Post.find(query).sort({ publishedAt: -1 }).limit(limit).lean();
}

export async function getHomeLayoutPayload() {
  const data = await getHomeData();
  return {
    categories: data.categories,
    featured: data.featured,
    latest: data.latest,
    trending: data.trending,
  };
}

