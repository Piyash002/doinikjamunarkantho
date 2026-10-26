import type { Metadata } from 'next';
import { connectToDatabase } from '@/src/lib/db';
import Settings from '@/src/models/Settings';
import { getSiteOrigin, getSocialImageUrl, cleanExcerpt } from '@/src/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  let siteName = 'দৈনিক যমুনা কণ্ঠ';
  let favicon = '/favicon.ico';
  let description = 'বাংলাদেশ ও বিশ্বের সর্বশেষ সংবাদ, রাজনীতি, অর্থনীতি, খেলা ও বিনোদনের খবর পড়ুন।';
  let defaultOgImage = '';

  try {
    await connectToDatabase();
    const settings = await Settings.findOne({}).lean();
    if (settings?.siteName) siteName = settings.siteName;
    if (settings?.favicon) favicon = settings.favicon;
    if (settings?.defaultMetaDescription) description = settings.defaultMetaDescription;
    if (settings?.defaultOgImage) defaultOgImage = settings.defaultOgImage;
  } catch (e) {
    // fallback
  }

  const origin = getSiteOrigin();
  const socialImageUrl = getSocialImageUrl(defaultOgImage || '/logo.png', origin);
  const cleanDesc = cleanExcerpt(description, 180);

  return {
    metadataBase: new URL(origin),
    title: {
      default: `${siteName} | সত্যের সঙ্গে, মানুষের পাশে`,
      template: `%s | ${siteName}`,
    },
    description: cleanDesc,
    icons: {
      icon: favicon || '/favicon.ico',
      shortcut: favicon || '/logo.png',
      apple: favicon || '/logo.png',
    },
    openGraph: {
      type: 'website',
      url: origin,
      siteName,
      locale: 'bn_BD',
      title: `${siteName} | সত্যের সঙ্গে, মানুষের পাশে`,
      description: cleanDesc,
      images: [
        {
          url: socialImageUrl,
          secureUrl: socialImageUrl,
          width: 1200,
          height: 630,
          type: 'image/jpeg',
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} | সত্যের সঙ্গে, মানুষের পাশে`,
      description: cleanDesc,
      images: [socialImageUrl],
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
