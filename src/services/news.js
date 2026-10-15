import mongoose from 'mongoose';
import { connectToDatabase } from '@/src/lib/db';
import Category from '@/src/models/Category';
import Post from '@/src/models/Post';

export async function getHomeData() {
  await connectToDatabase();

  const [categories, featured, latest, trending, breaking] = await Promise.all([
    Category.find({ isActive: true }).sort({ order: 1 }).lean(),
    Post.find({ status: 'published', isDeleted: false, isFeatured: true })
      .sort({ homePosition: 1, publishedAt: -1, createdAt: -1 })
      .limit(10)
      .lean(),
    Post.find({ status: 'published', isDeleted: false })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(24)
      .lean(),
    Post.find({ status: 'published', isDeleted: false, isTrending: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(10)
      .lean(),
    Post.find({ status: 'published', isDeleted: false, isBreaking: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  return { categories, featured, latest, trending, breaking };
}

export async function getHomepageCategorySections() {
  await connectToDatabase();

  let pinnedCategories = await Category.find({
    isActive: true,
    showOnHome: true,
    parent: null,
  })
    .sort({ homeOrder: 1, order: 1 })
    .lean();

  if (pinnedCategories.length === 0) {
    pinnedCategories = await Category.find({
      isActive: true,
      parent: null,
    })
      .sort({ order: 1 })
      .limit(6)
      .lean();
  }

  const categorySections = await Promise.all(
    pinnedCategories.map(async (cat, idx) => {
      const posts = await Post.find({
        status: 'published',
        isDeleted: false,
        $or: [
          { category: cat.slug },
          { category: cat.name_bn },
          { category: cat.name_en },
        ],
      })
        .select('title slug category excerpt featuredImage views viewCount publishedAt createdAt')
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(8)
        .lean();

      return {
        _id: String(cat._id),
        name_bn: cat.name_bn,
        name_en: cat.name_en,
        slug: cat.slug,
        homeOrder: typeof cat.homeOrder === 'number' && cat.homeOrder > 0 ? cat.homeOrder : idx + 1,
        homeLayout: cat.homeLayout || 'lead-plus-list',
        posts: posts.map((p) => ({
          _id: String(p._id),
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt || '',
          category: p.category,
          featuredImage: p.featuredImage?.url ? { url: p.featuredImage.url } : null,
          views: Math.max(Number(p.views) || 0, Number(p.viewCount) || 0),
          publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
          createdAt: p.createdAt ? p.createdAt.toISOString() : null,
        })),
      };
    })
  );

  return categorySections;
}

export async function getPostsByCategory(categorySlug, page = 1, limit = 12) {
  await connectToDatabase();

  const query = { status: 'published', isDeleted: false };

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
  const filter = mongoose.isValidObjectId(slug)
    ? { $or: [{ _id: slug }, { slug }], status: 'published', isDeleted: false }
    : { slug, status: 'published', isDeleted: false };
  const post = await Post.findOne(filter).lean();
  return post;
}

export async function getLatestPosts(limit = 8) {
  await connectToDatabase();
  return Post.find({ status: 'published', isDeleted: false }).sort({ publishedAt: -1 }).limit(limit).lean();
}

export async function getPopularPosts(limit = 8) {
  await connectToDatabase();
  return Post.find({ status: 'published', isDeleted: false }).sort({ views: -1, publishedAt: -1 }).limit(limit).lean();
}

export async function getRelatedPosts(category, currentSlugOrId, limit = 4) {
  await connectToDatabase();

  const query = {
    status: 'published',
    isDeleted: false,
    category,
    ...(mongoose.isValidObjectId(currentSlugOrId)
      ? { _id: { $ne: currentSlugOrId } }
      : { slug: { $ne: currentSlugOrId } }),
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

export async function getNavCategories() {
  await connectToDatabase();
  const categories = await Category.find({
    isActive: true,
    showInNav: { $ne: false },
    parent: null,
  })
    .sort({ order: 1 })
    .select('_id name_bn name_en slug order')
    .lean();

  return categories.map((cat) => ({
    _id: String(cat._id),
    name_bn: cat.name_bn,
    name_en: cat.name_en,
    slug: cat.slug,
    order: cat.order,
  }));
}

export async function getSubCategories(parentId) {
  if (!parentId) return [];
  await connectToDatabase();
  const subs = await Category.find({
    isActive: true,
    parent: parentId,
  })
    .sort({ order: 1 })
    .select('_id name_bn name_en slug order')
    .lean();

  return subs.map((sc) => ({
    _id: String(sc._id),
    name_bn: sc.name_bn,
    name_en: sc.name_en,
    slug: sc.slug,
    order: sc.order,
  }));
}

export async function getNavCategoriesTree() {
  return getNavCategories();
}


