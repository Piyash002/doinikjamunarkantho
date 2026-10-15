import mongoose from 'mongoose';

import { connectToDatabase } from '@/src/lib/db';
import AdSlot from '@/src/models/AdSlot';
import Author from '@/src/models/Author';
import Category from '@/src/models/Category';
import Post from '@/src/models/Post';

const ARTICLE_AD_POSITIONS = ['in-article', 'article-sidebar-top', 'article-sidebar-mid'];

export async function getPostBySlug(slug, previewToken = null) {
  await connectToDatabase();

  const idOrSlugFilter = mongoose.isValidObjectId(slug)
    ? { $or: [{ _id: slug }, { slug }] }
    : { slug };

  let post = await Post.findOne({ ...idOrSlugFilter, isDeleted: false, status: 'published' }).lean();

  // Lazy publication fallback: check if scheduled post is due now
  if (!post) {
    const scheduledDue = await Post.findOne({
      ...idOrSlugFilter,
      isDeleted: false,
      status: 'scheduled',
      publishedAt: { $lte: new Date() },
    });
    if (scheduledDue) {
      scheduledDue.status = 'published';
      await scheduledDue.save();
      post = scheduledDue.toObject();
    }
  }

  // Allow preview token for draft previewing
  if (!post && previewToken) {
    const previewPost = await Post.findOne({ ...idOrSlugFilter, isDeleted: false }).lean();
    if (previewPost) {
      post = previewPost;
    }
  }

  if (!post) return null;

  const categoryQuery = mongoose.isValidObjectId(post.category)
    ? {
        $or: [
          { _id: post.category },
          { slug: post.category },
          { name_bn: post.category },
          { name_en: post.category },
        ],
      }
    : {
        $or: [
          { slug: post.category },
          { name_bn: post.category },
          { name_en: post.category },
        ],
      };
  const [category, author, related, popular, latest, ads] = await Promise.all([
    Category.findOne(categoryQuery).lean(),
    post.author
      ? Author.findOne({
          $or: [
            { name: post.author },
            ...(mongoose.isValidObjectId(post.author) ? [{ _id: post.author }] : []),
          ],
        }).lean()
      : Promise.resolve(null),
    Post.find({
      status: 'published',
      isDeleted: false,
      category: post.category,
      _id: { $ne: post._id },
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(4)
      .lean(),
    Post.find({
      status: 'published',
      isDeleted: false,
      publishedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      _id: { $ne: post._id },
    })
      .sort({ views: -1, publishedAt: -1 })
      .limit(3)
      .lean(),
    Post.find({ status: 'published', isDeleted: false, _id: { $ne: post._id } })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(3)
      .lean(),
    AdSlot.find({
      position: { $in: ARTICLE_AD_POSITIONS },
      isActive: true,
      imageUrl: { $ne: '' },
    }).lean(),
  ]);

  const publishedAt = post.publishedAt || post.createdAt;
  const neighbors = await Promise.all([
    Post.findOne({
      status: 'published',
      isDeleted: false,
      category: post.category,
      _id: { $ne: post._id },
      publishedAt: { $lt: publishedAt },
    })
      .sort({ publishedAt: -1 })
      .lean(),
    Post.findOne({
      status: 'published',
      isDeleted: false,
      category: post.category,
      _id: { $ne: post._id },
      publishedAt: { $gt: publishedAt },
    })
      .sort({ publishedAt: 1 })
      .lean(),
  ]);

  return {
    post,
    category,
    author,
    related,
    popular,
    latest,
    previous: neighbors[0],
    next: neighbors[1],
    ads: Object.fromEntries(ads.map((ad) => [ad.position, ad])),
  };
}
