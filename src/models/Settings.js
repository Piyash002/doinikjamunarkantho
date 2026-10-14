import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'SITE_NAME' },
    logo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    trendingKeywords: [{ type: String, trim: true }],
    socialLinks: {
      facebook: { type: String, default: '' },
      x: { type: String, default: '' },
      youtube: { type: String, default: '' },
      instagram: { type: String, default: '' },
    },
    footerAddress: { type: String, default: '' },
    editorName: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    whatsappChannel: { type: String, default: '' },
    googlePlayLink: { type: String, default: '' },
    copyrightText: { type: String, default: '© SITE_NAME' },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
