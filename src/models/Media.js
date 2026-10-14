import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: '', trim: true },
    filename: { type: String, required: true, trim: true },
    fileType: { type: String, default: 'image/jpeg' },
    fileSize: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    alt: { type: String, default: '', trim: true },
    caption: { type: String, default: '', trim: true },
    uploadedBy: { type: String, default: 'admin', trim: true },
    usedInCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ publicId: 1 });
mediaSchema.index({ filename: 'text', alt: 'text', caption: 'text' });

export default mongoose.models.Media || mongoose.model('Media', mediaSchema);
