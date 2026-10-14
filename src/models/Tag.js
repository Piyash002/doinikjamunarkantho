import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true },
    postCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tagSchema.index({ slug: 1 }, { unique: true });
tagSchema.index({ postCount: -1 });
tagSchema.index({ name: 'text' });

export default mongoose.models.Tag || mongoose.model('Tag', tagSchema);
