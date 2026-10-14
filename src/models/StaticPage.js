import mongoose from 'mongoose';

const staticPageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    content: { type: String, default: '' },
    excerpt: { type: String, default: '' },
    featuredImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
    },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
);

staticPageSchema.index({ slug: 1 }, { unique: true });

export default mongoose.models.StaticPage || mongoose.model('StaticPage', staticPageSchema);
