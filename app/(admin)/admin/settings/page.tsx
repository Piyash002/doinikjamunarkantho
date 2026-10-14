'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  Settings as SettingsIcon,
  Globe,
  Phone,
  Share2,
  FileText,
  Search,
  Code2,
  Save,
  Check,
} from 'lucide-react';

import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Input } from '@/src/components/admin/ui/Input';
import { Textarea } from '@/src/components/admin/ui/Textarea';
import { FormField } from '@/src/components/admin/ui/FormField';
import { Tabs } from '@/src/components/admin/ui/Tabs';
import { ImageUploader, ImageValue } from '@/src/components/admin/ui/ImageUploader';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { useToast } from '@/src/components/admin/ui/Toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/settings', fetcher);
  const { success: toastSuccess, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // General
  const [siteName, setSiteName] = useState('');
  const [logo, setLogo] = useState<ImageValue | null>(null);
  const [favicon, setFavicon] = useState('');
  const [editorName, setEditorName] = useState('');

  // Contact
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [footerAddress, setFooterAddress] = useState('');

  // Social
  const [facebook, setFacebook] = useState('');
  const [x, setX] = useState('');
  const [youtube, setYoutube] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsappChannel, setWhatsappChannel] = useState('');
  const [googlePlayLink, setGooglePlayLink] = useState('');

  // Footer & Legal
  const [copyrightText, setCopyrightText] = useState('');

  // SEO Defaults
  const [defaultMetaDescription, setDefaultMetaDescription] = useState('');
  const [defaultOgImage, setDefaultOgImage] = useState('');

  // Integrations
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState('');

  useEffect(() => {
    if (data?.success && data.data) {
      const s = data.data;
      setSiteName(s.siteName || '');
      setLogo(s.logo || null);
      setFavicon(s.favicon || '');
      setEditorName(s.editorName || '');
      setPhone(s.phone || '');
      setEmail(s.email || '');
      setFooterAddress(s.footerAddress || '');

      const soc = s.socialLinks || {};
      setFacebook(soc.facebook || '');
      setX(soc.x || '');
      setYoutube(soc.youtube || '');
      setInstagram(soc.instagram || '');
      setWhatsappChannel(s.whatsappChannel || '');
      setGooglePlayLink(s.googlePlayLink || '');

      setCopyrightText(s.copyrightText || '');
      setDefaultMetaDescription(s.defaultMetaDescription || '');
      setDefaultOgImage(s.defaultOgImage || '');
      setGoogleAnalyticsId(s.googleAnalyticsId || '');
    }
  }, [data]);

  const tabs = [
    { id: 'general', label: 'General & Logo', icon: <Globe className="w-4 h-4" /> },
    { id: 'contact', label: 'Contact Details', icon: <Phone className="w-4 h-4" /> },
    { id: 'social', label: 'Social & Apps', icon: <Share2 className="w-4 h-4" /> },
    { id: 'footer', label: 'Footer & Legal', icon: <FileText className="w-4 h-4" /> },
    { id: 'seo', label: 'Default SEO', icon: <Search className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Code2 className="w-4 h-4" /> },
  ];

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSaving(true);
      const payload = {
        siteName,
        logo,
        favicon,
        editorName,
        phone,
        email,
        footerAddress,
        socialLinks: {
          facebook,
          x,
          youtube,
          instagram,
        },
        whatsappChannel,
        googlePlayLink,
        copyrightText,
        defaultMetaDescription,
        defaultOgImage,
        googleAnalyticsId,
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save settings.');

      mutate();
      toastSuccess('Site settings and branding updated!');
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
        title="Site Settings & Branding"
        description="Manage newspaper identification, editorial contacts, social accounts, SEO defaults, and external integrations."
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Save className="w-4 h-4" />}
            isLoading={isSaving}
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-6 max-w-3xl">
        {/* Tab 1: General */}
        {activeTab === 'general' && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              General Identity & Branding
            </h2>

            <FormField label="Newspaper / Site Name" required>
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="দৈনিক যমুনা কণ্ঠ"
                required
              />
            </FormField>

            <ImageUploader
              value={logo}
              onChange={setLogo}
              label="Primary Site Header Logo"
              showCaption={false}
              showAlt={false}
            />

            <FormField label="Editor & Publisher Byline">
              <Input
                value={editorName}
                onChange={(e) => setEditorName(e.target.value)}
                placeholder="e.g. সম্পাদক ও প্রকাশক: মোঃ রফিকুল ইসলাম"
              />
            </FormField>

            <FormField label="Favicon Image URL (Optional)">
              <Input
                value={favicon}
                onChange={(e) => setFavicon(e.target.value)}
                placeholder="https://.../favicon.ico"
              />
            </FormField>
          </div>
        )}

        {/* Tab 2: Contact */}
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

        {/* Tab 3: Social Links */}
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

        {/* Tab 4: Footer */}
        {activeTab === 'footer' && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Footer & Legal Notices
            </h2>

            <FormField label="Copyright Notice">
              <Input
                value={copyrightText}
                onChange={(e) => setCopyrightText(e.target.value)}
                placeholder="© ২০২৬ দৈনিক যমুনা কণ্ঠ। সর্বস্বত্ব সংরক্ষিত।"
              />
            </FormField>
          </div>
        )}

        {/* Tab 5: SEO */}
        {activeTab === 'seo' && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Default Global SEO
            </h2>

            <FormField label="Default Meta Description" hint="Used as fallback when pages lack dedicated descriptions">
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

        {/* Tab 6: Integrations */}
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

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" size="lg" isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
