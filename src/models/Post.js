import mongoose from 'mongoose';

const mediaItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    caption: { type: String, default: '' },
  },
  { _id: false }
);

const seoSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const postRevisionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    lead: { type: String, default: '' },
    updatedBy: { type: String, default: '' },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    featuredImage: { type: mediaItemSchema, default: null },
    gallery: [{ type: mediaItemSchema, default: [] }],
    category: { type: String, required: true, trim: true },
    subCategory: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    author: { type: String, default: '' },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'draft' },
    publishedAt: { type: Date, default: null },
    isBreaking: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    homePosition: { type: Number, default: null },
    division: { type: String, default: '' },
    district: { type: String, default: '' },
    upazila: { type: String, default: '' },
    views: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    lead: { type: String, default: '' },
    seo: { type: seoSchema, default: {} },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    version: { type: Number, default: 1 },
    revisions: [{ type: postRevisionSchema, default: [] }],
  },
  { timestamps: true }
);

postSchema.index({ isDeleted: 1, status: 1, publishedAt: -1 });
postSchema.index({ isDeleted: 1, category: 1, status: 1, publishedAt: -1 });
postSchema.index({ isDeleted: 1, author: 1 });
postSchema.index({ views: -1 });
postSchema.index({ shareCount: -1 });
postSchema.index({ title: 'text', content: 'text' });

export default mongoose.models.Post || mongoose.model('Post', postSchema);
