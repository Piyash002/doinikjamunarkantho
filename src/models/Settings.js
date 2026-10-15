import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: 'দৈনিক যমুনা কণ্ঠ' },
    logo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    favicon: { type: String, default: '' },
    sitePrimaryColor: { type: String, default: '#083c4d' },
    siteSecondaryColor: { type: String, default: '#1b7d95' },
    siteAccentColor: { type: String, default: '#d6a74f' },
    adminPanelName: { type: String, default: 'যমুনা কণ্ঠ' },
    adminSubtitle: { type: String, default: 'Newsroom' },
    adminLogo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    adminFavicon: { type: String, default: '' },
    adminPrimaryColor: { type: String, default: '#0a2b3a' },
    adminTealColor: { type: String, default: '#1b7d95' },
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
    copyrightText: { type: String, default: '© ২০২৬ দৈনিক যমুনা কণ্ঠ। সর্বস্বত্ব সংরক্ষিত।' },
    defaultMetaDescription: { type: String, default: '' },
    defaultOgImage: { type: String, default: '' },
    googleAnalyticsId: { type: String, default: '' },
  },
  { timestamps: true, strict: false }
);

if (mongoose.models.Settings) {
  delete mongoose.models.Settings;
}

export default mongoose.model('Settings', settingsSchema);
