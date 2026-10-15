import type { Metadata } from 'next';
import { connectToDatabase } from '@/src/lib/db';
import Settings from '@/src/models/Settings';

export async function generateMetadata(): Promise<Metadata> {
  let siteName = 'দৈনিক যমুনা কণ্ঠ';
  let favicon = '/logo.jpg';
  let description = 'বাংলাদেশ ও বিশ্বের সর্বশেষ সংবাদ, রাজনীতি, অর্থনীতি, খেলা ও বিনোদনের খবর পড়ুন।';
  try {
    await connectToDatabase();
    const settings = await Settings.findOne({}).lean();
    if (settings?.siteName) siteName = settings.siteName;
    if (settings?.favicon) favicon = settings.favicon;
    if (settings?.defaultMetaDescription) description = settings.defaultMetaDescription;
  } catch (e) {
    // fallback
  }

  return {
    title: {
      default: `${siteName} | সত্যের সঙ্গে, মানুষের পাশে`,
      template: `%s | ${siteName}`,
    },
    description,
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let sitePrimaryColor = '#083c4d';
  let siteSecondaryColor = '#1b7d95';
  let siteAccentColor = '#d6a74f';
  let favicon = '';
  try {
    await connectToDatabase();
    const settings = await Settings.findOne({}).lean();
    if (settings?.sitePrimaryColor) sitePrimaryColor = settings.sitePrimaryColor;
    if (settings?.siteSecondaryColor) siteSecondaryColor = settings.siteSecondaryColor;
    if (settings?.siteAccentColor) siteAccentColor = settings.siteAccentColor;
    if (settings?.favicon) favicon = settings.favicon;
  } catch (e) {
    // fallback
  }

  return (
    <>
      {favicon && <link rel="icon" href={favicon} />}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --navy: ${sitePrimaryColor};
              --color-brand-navy: ${sitePrimaryColor};
              --teal: ${siteSecondaryColor};
              --color-brand-teal: ${siteSecondaryColor};
              --accent: ${siteAccentColor};
              --color-brand-gold: ${siteAccentColor};
            }
            .site-header {
              background: ${sitePrimaryColor} !important;
            }
            .trending-badge-pill {
              background: ${siteSecondaryColor} !important;
            }
          `,
        }}
      />
      {children}
    </>
  );
}
