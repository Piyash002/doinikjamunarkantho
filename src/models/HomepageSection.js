import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    slotIndex: { type: Number, required: true },
    label: { type: String, default: '' },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    postTitle: { type: String, default: '' },
    postSlug: { type: String, default: '' },
    postImage: { type: String, default: '' },
    postCategory: { type: String, default: '' },
    isPinned: { type: Boolean, default: false },
  },
  { _id: false }
);

const homepageSectionSchema = new mongoose.Schema(
  {
    sectionKey: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '' },
    layout: {
      type: String,
      enum: ['hero', 'lead-plus-list', 'grid-4', 'sports-3col', 'intl-3col', 'entertainment-3col', 'custom'],
      default: 'hero',
    },
    category: { type: String, default: '' },
    order: { type: Number, default: 0 },
    slots: [{ type: slotSchema, default: [] }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

homepageSectionSchema.index({ order: 1 });
homepageSectionSchema.index({ sectionKey: 1 }, { unique: true });

export default mongoose.models.HomepageSection || mongoose.model('HomepageSection', homepageSectionSchema);
