import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/src/lib/db';
import Settings from '@/src/models/Settings';
import { apiSuccess, apiError } from '@/src/lib/apiResponse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await Settings.findOne({}).lean();
    if (!settings) {
      return apiSuccess({
        siteName: 'দৈনিক যমুনা কণ্ঠ',
        logo: { url: '/logo.png', publicId: '' },
        favicon: '',
        sitePrimaryColor: '#083c4d',
        siteSecondaryColor: '#1b7d95',
        siteAccentColor: '#d6a74f',
        adminPanelName: 'যমুনা কণ্ঠ',
        adminSubtitle: 'Newsroom',
        adminLogo: { url: '', publicId: '' },
        adminFavicon: '',
        adminPrimaryColor: '#0a2b3a',
        adminTealColor: '#1b7d95',
      });
    }

    return apiSuccess({
      siteName: settings.siteName || 'দৈনিক যমুনা কণ্ঠ',
      logo: settings.logo || { url: '/logo.png', publicId: '' },
      favicon: settings.favicon || '',
      sitePrimaryColor: settings.sitePrimaryColor || '#083c4d',
      siteSecondaryColor: settings.siteSecondaryColor || '#1b7d95',
      siteAccentColor: settings.siteAccentColor || '#d6a74f',
      adminPanelName: settings.adminPanelName || 'যমুনা কণ্ঠ',
      adminSubtitle: settings.adminSubtitle || 'Newsroom',
      adminLogo: settings.adminLogo || { url: '', publicId: '' },
      adminFavicon: settings.adminFavicon || '',
      adminPrimaryColor: settings.adminPrimaryColor || '#0a2b3a',
      adminTealColor: settings.adminTealColor || '#1b7d95',
    });
  } catch (error) {
    return apiError(error, 500);
  }
}
