import mongoose from 'mongoose';

const authorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    designation: { type: String, default: '' },
    bio: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Author || mongoose.model('Author', authorSchema);
