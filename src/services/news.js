import { connectToDatabase } from '@/src/lib/db';
import Category from '@/src/models/Category';
import Post from '@/src/models/Post';

export async function getHomeData() {
  await connectToDatabase();

  const [categories, featured, latest, trending] = await Promise.all([
    Category.find({ isActive: true }).sort({ order: 1 }).lean(),
    Post.find({ status: 'published', isDeleted: false, isFeatured: true }).sort({ publishedAt: -1 }).limit(6).lean(),
    Post.find({ status: 'published', isDeleted: false }).sort({ publishedAt: -1 }).limit(12).lean(),
    Post.find({ status: 'published', isDeleted: false, isTrending: true }).sort({ publishedAt: -1 }).limit(6).lean(),
  ]);

  return { categories, featured, latest, trending };
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
  const post = await Post.findOne({ slug, status: 'published', isDeleted: false }).lean();
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

export async function getRelatedPosts(category, currentSlug, limit = 4) {
  await connectToDatabase();

  const query = {
    status: 'published',
    isDeleted: false,
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

export async function getNavCategoriesTree() {
  await connectToDatabase();
  const all = await Category.find({ isActive: true, showInNav: true })
    .sort({ order: 1 })
    .populate('parent', 'name_bn name_en slug')
    .lean();

  const primary = all.filter((c) => !c.parent);
  const subs = all.filter((c) => Boolean(c.parent));

  const DEFAULT_SUBCATEGORIES_MAP = {
    national: ['চট্টগ্রামের খবর', 'জাতীয় সংসদ', 'রাজধানীর খবর', 'আইন ও বিচার'],
    politics: ['আওয়ামী লীগ', 'বিএনপি', 'জাতীয় পার্টি', 'নির্বাচন', 'অন্যান্য দল'],
    economy: ['ব্যাংক ও বিমা', 'শেয়ারবাজার', 'বাণিজ্য', 'বাজেট', 'শিল্প ও কৃষি'],
    international: ['ভারত', 'মধ্যপ্রাচ্য', 'আমেরিকা', 'ইউরোপ', 'চীন ও এশিয়া'],
    sports: ['ক্রিকেট', 'ফুটবল', 'টেনিস', 'বিশ্বকাপ', 'অন্যান্য খেলা'],
    entertainment: ['বলিউড', 'ঢালিউড', 'হলিউড', 'নাটক ও ওটিটি', 'গান'],
    sarades: ['ঢাকা বিভাগ', 'চট্টগ্রাম বিভাগ', 'রাজশাহী বিভাগ', 'খুলনা বিভাগ', 'সিলেট বিভাগ', 'বরিশাল বিভাগ', 'রংপুর বিভাগ', 'ময়মনসিংহ বিভাগ'],
    technology: ['মোবাইল', 'ইন্টারনেট', 'কৃত্রিম বুদ্ধিমত্তা', 'বিজ্ঞান ও মহাকাশ'],
    health: ['পুষ্টি ও খাদ্য', 'রোগ প্রতিরোধ', 'চিকিৎসা সেবা', 'মানসিক স্বাস্থ্য'],
  };

  return primary.map((cat) => {
    const catId = String(cat._id);
    const children = subs.filter((sc) => {
      const pId = typeof sc.parent === 'object' ? String(sc.parent._id) : String(sc.parent);
      return pId === catId;
    });

    const subList =
      children.length > 0
        ? children.map((ch) => ({ name_bn: ch.name_bn, name_en: ch.name_en, slug: ch.slug }))
        : (DEFAULT_SUBCATEGORIES_MAP[cat.slug] || []).map((name) => ({ name_bn: name, name_en: name, slug: name }));

    return {
      _id: catId,
      name_bn: cat.name_bn,
      name_en: cat.name_en,
      slug: cat.slug,
      subCategories: subList,
    };
  });
}


