import mongoose from 'mongoose';

const adminUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: '', trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    role: { type: String, enum: ['admin', 'editor', 'reporter'], default: 'admin' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);

