import type { Metadata, Viewport } from 'next';
import AdminShell from '@/src/components/admin/AdminShell';
import { connectToDatabase } from '@/src/lib/db';
import Settings from '@/src/models/Settings';
import './admin.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a2b3a' },
    { media: '(prefers-color-scheme: dark)', color: '#090d16' },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  let adminTitle = 'দৈনিক যমুনা কণ্ঠ';
  let adminFavicon = '/favicon.ico';
  try {
    await connectToDatabase();
    const settings = await Settings.findOne({}).lean();
    if (settings?.adminPanelName) {
      adminTitle = settings.adminPanelName;
    } else if (settings?.siteName) {
      adminTitle = settings.siteName;
    }
    if (settings?.adminFavicon) {
      adminFavicon = settings.adminFavicon;
    }
  } catch (e) {
    // fallback
  }

  return {
    title: {
      default: `প্রশাসন | ${adminTitle}`,
      template: `%s | প্রশাসন`,
    },
    manifest: '/manifest.json',
    icons: {
      icon: adminFavicon,
      shortcut: adminFavicon,
      apple: adminFavicon,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let initialBrandColor = '#0a2b3a';
  let initialTealColor = '#1b7d95';
  let adminFavicon = '';
  try {
    await connectToDatabase();
    const settings = await Settings.findOne({}).lean();
    if (settings?.adminPrimaryColor) initialBrandColor = settings.adminPrimaryColor;
    if (settings?.adminTealColor) initialTealColor = settings.adminTealColor;
    if (settings?.adminFavicon) adminFavicon = settings.adminFavicon;
  } catch (e) {
    // fallback
  }

  return (
    <>
      {adminFavicon && <link rel="icon" href={adminFavicon} />}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --admin-brand: ${initialBrandColor};
              --admin-brand-teal: ${initialTealColor};
            }
            .bg-\\[\\#0a2b3a\\] { background-color: ${initialBrandColor} !important; }
            .bg-\\[\\#1b7d95\\] { background-color: ${initialTealColor} !important; }
            .text-\\[\\#1b7d95\\] { color: ${initialTealColor} !important; }
            .border-\\[\\#1b7d95\\] { border-color: ${initialTealColor} !important; }
          `,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('admin_theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.classList.remove('dark');document.documentElement.removeAttribute('data-theme')}}catch(e){}})();`,
        }}
      />
      <AdminShell>{children}</AdminShell>
    </>
  );
}
