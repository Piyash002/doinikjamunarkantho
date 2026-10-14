import mongoose from 'mongoose';

const adSlotSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    imageUrl: { type: String, default: '' },
    link: { type: String, default: '#' },
    sizeHint: { type: String, default: '' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    position: {
      type: String,
      enum: [
        'header-below',
        'sidebar',
        'between-sections',
        'sticky-bottom',
        'in-article',
        'article-sidebar-top',
        'article-sidebar-mid',
      ],
      default: 'sidebar',
    },
  },
  { timestamps: true }
);

export default mongoose.models.AdSlot || mongoose.model('AdSlot', adSlotSchema);
