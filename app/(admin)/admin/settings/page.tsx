'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import Image from 'next/image';
import {
  Globe,
  ShieldCheck,
  Phone,
  Share2,
  FileText,
  Search,
  Code2,
  Save,
  RotateCcw,
  Trash2,
  Palette,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Input } from '@/src/components/admin/ui/Input';
import { Textarea } from '@/src/components/admin/ui/Textarea';
import { FormField } from '@/src/components/admin/ui/FormField';
import { Tabs } from '@/src/components/admin/ui/Tabs';
import { ImageUploader, ImageValue } from '@/src/components/admin/ui/ImageUploader';
import { BrandingLogoUploader } from '@/src/components/admin/ui/BrandingLogoUploader';
import { FaviconUploader } from '@/src/components/admin/ui/FaviconUploader';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { useToast } from '@/src/components/admin/ui/Toast';
import { useAdminSettings } from '@/src/components/admin/AdminSettingsContext';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const DEFAULT_CLIENT_PRIMARY = '#083c4d';
const DEFAULT_CLIENT_SECONDARY = '#1b7d95';
const DEFAULT_CLIENT_ACCENT = '#d6a74f';

const DEFAULT_ADMIN_PRIMARY = '#0a2b3a';
const DEFAULT_ADMIN_TEAL = '#1b7d95';

export default function SettingsPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/settings', fetcher);
  const { mutateSettings } = useAdminSettings();
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('client-branding');
  const [isSaving, setIsSaving] = useState(false);

  // 1. Client Site Branding
  const [siteName, setSiteName] = useState('');
  const [logo, setLogo] = useState<ImageValue | null>(null);
  const [favicon, setFavicon] = useState('');
  const [sitePrimaryColor, setSitePrimaryColor] = useState(DEFAULT_CLIENT_PRIMARY);
  const [siteSecondaryColor, setSiteSecondaryColor] = useState(DEFAULT_CLIENT_SECONDARY);
  const [siteAccentColor, setSiteAccentColor] = useState(DEFAULT_CLIENT_ACCENT);

  // 2. Admin Panel Branding
  const [adminPanelName, setAdminPanelName] = useState('');
  const [adminSubtitle, setAdminSubtitle] = useState('');
  const [adminLogo, setAdminLogo] = useState<ImageValue | null>(null);
  const [adminFavicon, setAdminFavicon] = useState('');
  const [adminPrimaryColor, setAdminPrimaryColor] = useState(DEFAULT_ADMIN_PRIMARY);
  const [adminTealColor, setAdminTealColor] = useState(DEFAULT_ADMIN_TEAL);

  // 3. Editorial & Contact
  const [editorName, setEditorName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [footerAddress, setFooterAddress] = useState('');

  // 4. Social & Apps
  const [facebook, setFacebook] = useState('');
  const [x, setX] = useState('');
  const [youtube, setYoutube] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsappChannel, setWhatsappChannel] = useState('');
  const [googlePlayLink, setGooglePlayLink] = useState('');

  // 5. Footer & Legal
  const [copyrightText, setCopyrightText] = useState('');

  // 6. SEO Defaults
  const [defaultMetaDescription, setDefaultMetaDescription] = useState('');
  const [defaultOgImage, setDefaultOgImage] = useState('');

  // 7. Integrations
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');

  useEffect(() => {
    if (data?.success && data.data) {
      const s = data.data;

      // Client Branding
      setSiteName(s.siteName || '');
      setLogo(s.logo || null);
      setFavicon(s.favicon || '');
      setSitePrimaryColor(s.sitePrimaryColor || DEFAULT_CLIENT_PRIMARY);
      setSiteSecondaryColor(s.siteSecondaryColor || DEFAULT_CLIENT_SECONDARY);
      setSiteAccentColor(s.siteAccentColor || DEFAULT_CLIENT_ACCENT);

      // Admin Branding
      setAdminPanelName(s.adminPanelName || '');
      setAdminSubtitle(s.adminSubtitle || '');
      setAdminLogo(s.adminLogo || null);
      setAdminFavicon(s.adminFavicon || '');
      setAdminPrimaryColor(s.adminPrimaryColor || DEFAULT_ADMIN_PRIMARY);
      setAdminTealColor(s.adminTealColor || DEFAULT_ADMIN_TEAL);

      // Editorial & Contact
      setEditorName(s.editorName || '');
      setPhone(s.phone || '');
      setEmail(s.email || '');
      setFooterAddress(s.footerAddress || '');

      // Social
      const soc = s.socialLinks || {};
      setFacebook(soc.facebook || '');
      setX(soc.x || '');
      setYoutube(soc.youtube || '');
      setInstagram(soc.instagram || '');
      setWhatsappChannel(s.whatsappChannel || '');
      setGooglePlayLink(s.googlePlayLink || '');

      // Legal & SEO
      setCopyrightText(s.copyrightText || '');
      setDefaultMetaDescription(s.defaultMetaDescription || '');
      setDefaultOgImage(s.defaultOgImage || '');
      setGoogleAnalyticsId(s.googleAnalyticsId || '');
    }
  }, [data]);

  const tabs = [
    { id: 'client-branding', label: 'Client Site Branding', icon: <Globe className="w-4 h-4" /> },
    { id: 'admin-branding', label: 'Admin Panel Branding', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact Details', icon: <Phone className="w-4 h-4" /> },
    { id: 'social', label: 'Social & Apps', icon: <Share2 className="w-4 h-4" /> },
    { id: 'footer', label: 'Footer & Legal', icon: <FileText className="w-4 h-4" /> },
    { id: 'seo', label: 'Default SEO', icon: <Search className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Code2 className="w-4 h-4" /> },
  ];

  async function handleSaveSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        // Client Branding
        siteName: siteName.trim() || 'দৈনিক যমুনা কণ্ঠ',
        logo,
        favicon: favicon.trim(),
        sitePrimaryColor: sitePrimaryColor.trim() || DEFAULT_CLIENT_PRIMARY,
        siteSecondaryColor: siteSecondaryColor.trim() || DEFAULT_CLIENT_SECONDARY,
        siteAccentColor: siteAccentColor.trim() || DEFAULT_CLIENT_ACCENT,

        // Admin Branding
        adminPanelName: adminPanelName.trim() || 'যমুনা কণ্ঠ',
        adminSubtitle: adminSubtitle.trim() || 'Newsroom',
        adminLogo,
        adminFavicon: adminFavicon.trim(),
        adminPrimaryColor: adminPrimaryColor.trim() || DEFAULT_ADMIN_PRIMARY,
        adminTealColor: adminTealColor.trim() || DEFAULT_ADMIN_TEAL,

        // Editorial & Contact
        editorName: editorName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        footerAddress: footerAddress.trim(),

        // Social Links
        socialLinks: {
          facebook: facebook.trim(),
          x: x.trim(),
          youtube: youtube.trim(),
          instagram: instagram.trim(),
        },
        whatsappChannel: whatsappChannel.trim(),
        googlePlayLink: googlePlayLink.trim(),
        copyrightText: copyrightText.trim(),
        defaultMetaDescription: defaultMetaDescription.trim(),
        defaultOgImage: defaultOgImage.trim(),
        googleAnalyticsId: googleAnalyticsId.trim(),
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save settings.');

      mutate();
      mutateSettings();
      toastSuccess('ব্র্যান্ডিং ও সেটিংস সফলভাবে সংরক্ষিত হয়েছে! (Branding updated successfully)');
    } catch (err: any) {
      toastError(err.message || 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <TableSkeleton rows={8} />;
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Site Settings & Dynamic Branding"
        description="Manage public website name, logo, favicon, colors as well as admin panel name, logo, favicon, and theme colors dynamically."
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={isSaving}
            onClick={() => handleSaveSettings()}
          >
            Save All Settings
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-6 max-w-4xl">
        {/* ============================================================== */}
        {/* Tab 1: Client Website Branding */}
        {/* ============================================================== */}
        {activeTab === 'client-branding' && (
          <div className="flex flex-col gap-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#1b7d95]" />
                    Client Website Identity & Logos
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure the public reader-facing newspaper name, header logo, and browser favicon.
                  </p>
                </div>
              </div>

              {/* Site Name */}
              <FormField
                label="Public Website / Newspaper Name (পত্রিকা বা সাইটের নাম)"
                required
                hint="Displayed in browser title, header alt text, and footer copyright."
              >
                <div className="flex gap-2">
                  <Input
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="দৈনিক যমুনা কণ্ঠ"
                    required
                  />
                  {siteName && (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => setSiteName('দৈনিক যমুনা কণ্ঠ')}
                      title="Reset to default site name"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-400" />
                    </Button>
                  )}
                </div>
              </FormField>

              {/* Client Logo with Upload and Direct URL writing */}
              <BrandingLogoUploader
                value={logo}
                onChange={setLogo}
                label="Client Website Header Logo (সাইট হেডার লোগো)"
                hint="Upload an image file (.png, .svg, .webp, .jpg) or directly write/paste an image URL."
                fallbackText={siteName || 'দৈনিক যমুনা কণ্ঠ'}
              />

              {/* Client Favicon with Upload */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <FaviconUploader
                  value={favicon}
                  onChange={setFavicon}
                  label="Client Website Favicon (সাইট ব্রাউজার ফেভিকন)"
                  hint="Upload an image file (.ico, .png, .svg, .webp) or enter a direct image link."
                  siteTitlePreview={`${siteName || 'দৈনিক যমুনা কণ্ঠ'} | সত্যের সঙ্গে, মানুষের পাশে`}
                />
              </div>
            </div>

            {/* Client Theme Colors */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#1b7d95]" />
                    Client Website Color Theme (সাইটের কালার থিম)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Customize the primary site header bar, trending pills, and button accents.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setSitePrimaryColor(DEFAULT_CLIENT_PRIMARY);
                    setSiteSecondaryColor(DEFAULT_CLIENT_SECONDARY);
                    setSiteAccentColor(DEFAULT_CLIENT_ACCENT);
                  }}
                >
                  Reset Colors
                </Button>
              </div>

              {/* Site Primary (Header Background) */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Primary Header & Brand Color (মূল হেডার বার কালার)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={sitePrimaryColor}
                    onChange={(e) => setSitePrimaryColor(e.target.value)}
                    className="w-11 h-11 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <div className="flex-1 max-w-xs">
                    <Input
                      value={sitePrimaryColor}
                      onChange={(e) => setSitePrimaryColor(e.target.value)}
                      placeholder="#083c4d"
                    />
                  </div>
                  {/* Preset swatches */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {[
                      { label: 'Navy (Default)', hex: '#083c4d' },
                      { label: 'Dark Navy', hex: '#0a2b3a' },
                      { label: 'Royal Blue', hex: '#1d4ed8' },
                      { label: 'Crimson', hex: '#b91c1c' },
                      { label: 'Forest Green', hex: '#047857' },
                      { label: 'Charcoal', hex: '#1e293b' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setSitePrimaryColor(c.hex)}
                        title={c.label}
                        className="w-6 h-6 rounded-full border border-white dark:border-slate-800 shadow-xs hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Site Secondary (Teal / Badges) */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Secondary Accent / Trending Badge Color (হাইলাইট ও ট্রেন্ডিং কালার)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={siteSecondaryColor}
                    onChange={(e) => setSiteSecondaryColor(e.target.value)}
                    className="w-11 h-11 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <div className="flex-1 max-w-xs">
                    <Input
                      value={siteSecondaryColor}
                      onChange={(e) => setSiteSecondaryColor(e.target.value)}
                      placeholder="#1b7d95"
                    />
                  </div>
                  {/* Preset swatches */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {[
                      { label: 'Teal (Default)', hex: '#1b7d95' },
                      { label: 'Sky Blue', hex: '#0284c7' },
                      { label: 'Emerald', hex: '#10b981' },
                      { label: 'Amber', hex: '#d97706' },
                      { label: 'Rose', hex: '#e11d48' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setSiteSecondaryColor(c.hex)}
                        title={c.label}
                        className="w-6 h-6 rounded-full border border-white dark:border-slate-800 shadow-xs hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Site Accent (Gold / Buttons) */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Tertiary Accent Color (অতিরিক্ত অ্যাকসেন্ট / গোল্ড কালার)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={siteAccentColor}
                    onChange={(e) => setSiteAccentColor(e.target.value)}
                    className="w-11 h-11 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <div className="flex-1 max-w-xs">
                    <Input
                      value={siteAccentColor}
                      onChange={(e) => setSiteAccentColor(e.target.value)}
                      placeholder="#d6a74f"
                    />
                  </div>
                  {/* Preset swatches */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {[
                      { label: 'Gold (Default)', hex: '#d6a74f' },
                      { label: 'Warm Amber', hex: '#f59e0b' },
                      { label: 'Sunset Orange', hex: '#ea580c' },
                      { label: 'Purple', hex: '#7c3aed' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setSiteAccentColor(c.hex)}
                        title={c.label}
                        className="w-6 h-6 rounded-full border border-white dark:border-slate-800 shadow-xs hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Live Preview: Website Header Bar
                  </span>
                  <span className="text-[11px] text-slate-400">Structure & size preserved</span>
                </div>

                {/* Mock header bar */}
                <div
                  className="rounded-xl p-3 flex items-center justify-between text-white shadow-md transition-colors"
                  style={{ backgroundColor: sitePrimaryColor }}
                >
                  <div className="flex items-center gap-3">
                    {logo?.url ? (
                      <div className="relative h-9 w-32 flex items-center">
                        <Image
                          src={logo.url}
                          alt={siteName || 'Logo'}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <span className="font-extrabold text-lg tracking-tight">
                        {siteName || 'দৈনিক যমুনা কণ্ঠ'}
                      </span>
                    )}
                    <div className="hidden md:flex items-center gap-3 text-xs font-semibold text-white/90 border-l border-white/20 pl-3">
                      <span>সর্বশেষ</span>
                      <span>জাতীয়</span>
                      <span>রাজনীতি</span>
                      <span>খেলা</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white shadow-xs"
                      style={{ backgroundColor: siteSecondaryColor }}
                    >
                      ট্রেন্ডিং
                    </span>
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-lg text-slate-900 shadow-xs"
                      style={{ backgroundColor: siteAccentColor }}
                    >
                      ই-পেপার
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* Tab 2: Admin Panel Branding */}
        {/* ============================================================== */}
        {activeTab === 'admin-branding' && (
          <div className="flex flex-col gap-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#1b7d95]" />
                    Admin Panel Identity & Logos (এডমিন প্যানেল ব্র্যান্ডিং)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Customize the CMS name, sidebar brand icon, and administration favicon.
                  </p>
                </div>
              </div>

              {/* Admin Panel Name */}
              <FormField
                label="Admin Panel Title (এডমিন প্যানেল নাম)"
                hint="Displayed at the top of the sidebar and top navigation bar."
              >
                <div className="flex gap-2">
                  <Input
                    value={adminPanelName}
                    onChange={(e) => setAdminPanelName(e.target.value)}
                    placeholder="যমুনা কণ্ঠ"
                  />
                  {adminPanelName && (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => setAdminPanelName('যমুনা কণ্ঠ')}
                      title="Reset to default admin panel name"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-400" />
                    </Button>
                  )}
                </div>
              </FormField>

              {/* Admin Subtitle */}
              <FormField
                label="Admin Subtitle / System Tag (সাবটাইটেল / রোল নাম)"
                hint="Displayed directly under the panel name in the sidebar (e.g. Newsroom, CMS, Editorial)."
              >
                <div className="flex gap-2">
                  <Input
                    value={adminSubtitle}
                    onChange={(e) => setAdminSubtitle(e.target.value)}
                    placeholder="Newsroom"
                  />
                  {adminSubtitle && (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={() => setAdminSubtitle('Newsroom')}
                      title="Reset to default subtitle"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-400" />
                    </Button>
                  )}
                </div>
              </FormField>

              {/* Admin Logo with Upload and Direct URL writing */}
              <BrandingLogoUploader
                value={adminLogo}
                onChange={setAdminLogo}
                label="Admin Panel Logo / Icon (এডমিন লোগো বা আইকন)"
                hint="Upload an image file or directly write/paste an image URL for the admin brand icon."
                fallbackText={adminPanelName || 'যমুনা কণ্ঠ'}
              />

              {/* Admin Favicon with Upload */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <FaviconUploader
                  value={adminFavicon}
                  onChange={setAdminFavicon}
                  label="Admin Panel Favicon (এডমিন ব্রাউজার ফেভিকন)"
                  hint="Upload an icon (.ico, .png, .svg) for the admin dashboard browser tab or enter a direct link."
                  siteTitlePreview={`প্রশাসন | ${adminPanelName || 'যমুনা কণ্ঠ'}`}
                />
              </div>
            </div>

            {/* Admin Theme Colors */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#1b7d95]" />
                    Admin Panel Theme Colors (এডমিন প্যানেলের রঙ)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Customize the primary button color, sidebar brand background, and active navigation indicators.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setAdminPrimaryColor(DEFAULT_ADMIN_PRIMARY);
                    setAdminTealColor(DEFAULT_ADMIN_TEAL);
                  }}
                >
                  Reset Colors
                </Button>
              </div>

              {/* Admin Primary Color */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Admin Brand / Primary Button Color (এডমিন ব্র্যান্ড ও মূল বাটন কালার)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={adminPrimaryColor}
                    onChange={(e) => setAdminPrimaryColor(e.target.value)}
                    className="w-11 h-11 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <div className="flex-1 max-w-xs">
                    <Input
                      value={adminPrimaryColor}
                      onChange={(e) => setAdminPrimaryColor(e.target.value)}
                      placeholder="#0a2b3a"
                    />
                  </div>
                  {/* Preset swatches */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {[
                      { label: 'Navy Dark (Default)', hex: '#0a2b3a' },
                      { label: 'Obsidian Black', hex: '#0f172a' },
                      { label: 'Deep Indigo', hex: '#1e1b4b' },
                      { label: 'Midnight Blue', hex: '#1e3a5f' },
                      { label: 'Dark Emerald', hex: '#064e3b' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setAdminPrimaryColor(c.hex)}
                        title={c.label}
                        className="w-6 h-6 rounded-full border border-white dark:border-slate-800 shadow-xs hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Admin Accent / Teal Color */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Admin Accent / Active Link Color (অ্যাক্টিভ মেনু ও হাইলাইট কালার)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={adminTealColor}
                    onChange={(e) => setAdminTealColor(e.target.value)}
                    className="w-11 h-11 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <div className="flex-1 max-w-xs">
                    <Input
                      value={adminTealColor}
                      onChange={(e) => setAdminTealColor(e.target.value)}
                      placeholder="#1b7d95"
                    />
                  </div>
                  {/* Preset swatches */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {[
                      { label: 'Teal (Default)', hex: '#1b7d95' },
                      { label: 'Cyan / Sky', hex: '#38bdf8' },
                      { label: 'Mint Emerald', hex: '#10b981' },
                      { label: 'Royal Violet', hex: '#8b5cf6' },
                      { label: 'Amber Gold', hex: '#f59e0b' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setAdminTealColor(c.hex)}
                        title={c.label}
                        className="w-6 h-6 rounded-full border border-white dark:border-slate-800 shadow-xs hover:scale-110 transition-transform"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    Live Preview: Admin Sidebar Branding
                  </span>
                  <span className="text-[11px] text-slate-400">Structure & size preserved</span>
                </div>

                {/* Mock admin header snippet */}
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {adminLogo?.url ? (
                      <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-sm flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <Image
                          src={adminLogo.url}
                          alt="Logo"
                          width={36}
                          height={36}
                          className="w-full h-full object-contain p-0.5"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div
                        className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm"
                        style={{ backgroundColor: adminPrimaryColor }}
                      >
                        {(adminPanelName || 'য')[0]}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tracking-tight leading-tight truncate">
                        {adminPanelName || 'যমুনা কণ্ঠ'}
                      </span>
                      <span
                        className="text-[10px] uppercase font-bold tracking-wider"
                        style={{ color: adminTealColor }}
                      >
                        {adminSubtitle || 'Newsroom'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold shadow-xs"
                      style={{ backgroundColor: adminPrimaryColor }}
                    >
                      + New Post
                    </button>
                    <div
                      className="px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{
                        backgroundColor: `${adminTealColor}20`,
                        color: adminTealColor,
                      }}
                    >
                      Dashboard
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* Tab 3: Contact Details */}
        {/* ============================================================== */}
        {activeTab === 'contact' && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Contact & Editorial Office
            </h2>

            <FormField label="Editorial Phone Numbers">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+880 1700-000000, 02-9876543"
              />
            </FormField>

            <FormField label="Official Newsroom Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="news@jamunarkantho.com"
              />
            </FormField>

            <FormField label="Headquarters / Editorial Address">
              <Textarea
                value={footerAddress}
                onChange={(e) => setFooterAddress(e.target.value)}
                placeholder="বাড়ি নং ১২, রোড নং ৫, ধানমন্ডি, ঢাকা-১২০৫"
                rows={3}
              />
            </FormField>
          </div>
        )}

        {/* ============================================================== */}
        {/* Tab 4: Social & Apps */}
        {/* ============================================================== */}
        {activeTab === 'social' && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Social Channels & Apps
            </h2>

            <FormField label="Facebook Official Page">
              <Input
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/jamunarkantho"
              />
            </FormField>

            <FormField label="X / Twitter Handle">
              <Input
                value={x}
                onChange={(e) => setX(e.target.value)}
                placeholder="https://x.com/jamunarkantho"
              />
            </FormField>

            <FormField label="YouTube News Channel">
              <Input
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@jamunarkantho"
              />
            </FormField>

            <FormField label="Instagram Account">
              <Input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/jamunarkantho"
              />
            </FormField>

            <FormField label="WhatsApp Official Channel Link">
              <Input
                value={whatsappChannel}
                onChange={(e) => setWhatsappChannel(e.target.value)}
                placeholder="https://whatsapp.com/channel/..."
              />
            </FormField>

            <FormField label="Google Play Android App Link">
              <Input
                value={googlePlayLink}
                onChange={(e) => setGooglePlayLink(e.target.value)}
                placeholder="https://play.google.com/store/apps/details?id=..."
              />
            </FormField>
          </div>
        )}

        {/* ============================================================== */}
        {/* Tab 5: Footer & Legal */}
        {/* ============================================================== */}
        {activeTab === 'footer' && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Footer & Legal Notices
            </h2>

            <FormField label="Editor & Publisher Byline">
              <Input
                value={editorName}
                onChange={(e) => setEditorName(e.target.value)}
                placeholder="e.g. সম্পাদক ও প্রকাশক: মোঃ রফিকুল ইসলাম"
              />
            </FormField>

            <FormField label="Copyright Notice">
              <Input
                value={copyrightText}
                onChange={(e) => setCopyrightText(e.target.value)}
                placeholder="© ২০২৬ দৈনিক যমুনা কণ্ঠ। সর্বস্বত্ব সংরক্ষিত।"
              />
            </FormField>
          </div>
        )}

        {/* ============================================================== */}
        {/* Tab 6: SEO Defaults */}
        {/* ============================================================== */}
        {activeTab === 'seo' && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Default Global SEO
            </h2>

            <FormField
              label="Default Meta Description"
              hint="Used as fallback when pages lack dedicated descriptions"
            >
              <Textarea
                value={defaultMetaDescription}
                onChange={(e) => setDefaultMetaDescription(e.target.value)}
                placeholder="বাংলাদেশ ও বিশ্বের সর্বশেষ ব্রেকিং সংবাদ, রাজনীতি, অর্থনীতি, খেলা ও বিনোদন..."
                rows={3}
              />
            </FormField>

            <FormField label="Default OpenGraph (OG) Share Image URL">
              <Input
                value={defaultOgImage}
                onChange={(e) => setDefaultOgImage(e.target.value)}
                placeholder="https://.../og-banner.jpg"
              />
            </FormField>
          </div>
        )}

        {/* ============================================================== */}
        {/* Tab 7: Integrations */}
        {/* ============================================================== */}
        {activeTab === 'integrations' && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Analytics & External Integrations
            </h2>

            <FormField label="Google Analytics Measurement ID" hint="e.g. G-XXXXXXXXXX">
              <Input
                value={googleAnalyticsId}
                onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                placeholder="G-ABC123XYZ"
              />
            </FormField>
          </div>
        )}

        {/* Bottom Save Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            All updates are saved globally and revalidate website layouts immediately.
          </span>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
