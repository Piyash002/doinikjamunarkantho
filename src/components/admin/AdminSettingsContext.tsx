'use client';

import React, { createContext, useContext, useEffect } from 'react';
import useSWR from 'swr';
import type { ImageValue } from './ui/ImageUploader';

export interface AdminSettingsData {
  siteName: string;
  logo: ImageValue | null;
  favicon: string;
  sitePrimaryColor: string;
  siteSecondaryColor: string;
  siteAccentColor: string;

  adminPanelName: string;
  adminSubtitle: string;
  adminLogo: ImageValue | null;
  adminFavicon: string;
  adminPrimaryColor: string;
  adminTealColor: string;

  trendingKeywords?: string[];
  socialLinks?: Record<string, string>;
  footerAddress?: string;
  editorName?: string;
  phone?: string;
  email?: string;
  whatsappChannel?: string;
  googlePlayLink?: string;
  copyrightText?: string;
  defaultOgImage?: string;
  defaultMetaDescription?: string;
  googleAnalyticsId?: string;
}

interface AdminSettingsContextType {
  settings: AdminSettingsData | null;
  isLoading: boolean;
  mutateSettings: () => void;
  adminPanelName: string;
  adminSubtitle: string;
  adminLogo: ImageValue | null;
  effectiveLogo: ImageValue | null;
  adminFavicon: string;
  adminPrimaryColor: string;
  adminTealColor: string;
  siteName: string;
  siteLogo: ImageValue | null;
  siteFavicon: string;
  sitePrimaryColor: string;
  siteSecondaryColor: string;
}

const AdminSettingsContext = createContext<AdminSettingsContextType | null>(null);

const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) return json;
    }
  } catch {
    // fallback below
  }

  // Fallback to public settings if admin endpoint is unauthorized (e.g. on login page) or fails
  try {
    const pubRes = await fetch('/api/settings/public');
    if (pubRes.ok) {
      return await pubRes.json();
    }
  } catch {
    // ignore
  }

  return null;
};

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const { data, mutate, isLoading } = useSWR('/api/admin/settings', fetcher, {
    revalidateOnFocus: true,
  });

  const rawSettings = data?.success && data?.data ? data.data : null;

  const adminPanelName = rawSettings?.adminPanelName || 'যমুনা কণ্ঠ';
  const adminSubtitle = rawSettings?.adminSubtitle || 'Newsroom';
  const adminLogo = rawSettings?.adminLogo || null;
  const adminFavicon = rawSettings?.adminFavicon || '';
  const adminPrimaryColor = rawSettings?.adminPrimaryColor || '#0a2b3a';
  const adminTealColor = rawSettings?.adminTealColor || '#1b7d95';

  const siteName = rawSettings?.siteName || 'দৈনিক যমুনা কণ্ঠ';
  const siteLogo = rawSettings?.logo || null;
  const siteFavicon = rawSettings?.favicon || '';
  const sitePrimaryColor = rawSettings?.sitePrimaryColor || '#083c4d';
  const siteSecondaryColor = rawSettings?.siteSecondaryColor || '#1b7d95';

  // Real-time CSS injection for admin theme variables
  useEffect(() => {
    const styleId = 'admin-dynamic-branding-style';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      :root {
        --admin-brand: ${adminPrimaryColor};
        --admin-brand-teal: ${adminTealColor};
      }
      .bg-\\[\\#0a2b3a\\] {
        background-color: ${adminPrimaryColor} !important;
      }
      .bg-\\[\\#1b7d95\\] {
        background-color: ${adminTealColor} !important;
      }
      .text-\\[\\#1b7d95\\] {
        color: ${adminTealColor} !important;
      }
      .border-\\[\\#1b7d95\\] {
        border-color: ${adminTealColor} !important;
      }
      button.bg-\\[\\#0a2b3a\\], a.bg-\\[\\#0a2b3a\\] {
        background-color: ${adminPrimaryColor} !important;
      }
      button.bg-\\[\\#1b7d95\\], a.bg-\\[\\#1b7d95\\] {
        background-color: ${adminTealColor} !important;
      }
    `;
  }, [adminPrimaryColor, adminTealColor]);

  // Real-time favicon injection for admin panel browser tab
  useEffect(() => {
    if (adminFavicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = adminFavicon;
    }
  }, [adminFavicon]);

  const effectiveLogo = adminLogo?.url ? adminLogo : (siteLogo?.url ? siteLogo : null);

  return (
    <AdminSettingsContext.Provider
      value={{
        settings: rawSettings,
        isLoading,
        mutateSettings: mutate,
        adminPanelName,
        adminSubtitle,
        adminLogo,
        effectiveLogo,
        adminFavicon,
        adminPrimaryColor,
        adminTealColor,
        siteName,
        siteLogo,
        siteFavicon,
        sitePrimaryColor,
        siteSecondaryColor,
      }}
    >
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext);
  if (!context) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider');
  }
  return context;
}
