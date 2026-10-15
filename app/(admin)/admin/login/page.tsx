import React, { Suspense } from 'react';
import { connectToDatabase } from '@/src/lib/db';
import Settings from '@/src/models/Settings';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage() {
  let initialLogo = '';
  let initialBrandColor = '#0a2b3a';

  try {
    await connectToDatabase();
    const settings = await Settings.findOne({}).lean();
    if (settings?.adminLogo?.url) {
      initialLogo = settings.adminLogo.url;
    } else if (settings?.logo?.url) {
      initialLogo = settings.logo.url;
    }
    if (settings?.adminPrimaryColor) {
      initialBrandColor = settings.adminPrimaryColor;
    }
  } catch {
    // fallback gracefully
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
          Loading...
        </div>
      }
    >
      <LoginForm initialLogo={initialLogo} initialBrandColor={initialBrandColor} />
    </Suspense>
  );
}
