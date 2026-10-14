import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name_bn: { type: String, required: true, trim: true },
    name_en: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    order: { type: Number, default: 0 },
    showInNav: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: true },
    homeLayout: {
      type: String,
      enum: ['hero', 'lead-plus-list', 'grid-4', 'sports-3col', 'intl-3col', 'entertainment-3col'],
      default: 'hero',
    },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ order: 1 });

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
