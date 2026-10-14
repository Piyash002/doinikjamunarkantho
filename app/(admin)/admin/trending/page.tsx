'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  TrendingUp,
  Zap,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Save,
  Check,
} from 'lucide-react';

import { PageHeader } from '@/src/components/admin/ui/PageHeader';
import { Button } from '@/src/components/admin/ui/Button';
import { Input } from '@/src/components/admin/ui/Input';
import { Switch } from '@/src/components/admin/ui/Switch';
import { FormField } from '@/src/components/admin/ui/FormField';
import { TableSkeleton } from '@/src/components/admin/ui/Skeleton';
import { useToast } from '@/src/components/admin/ui/Toast';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TrendingPage() {
  const { data, mutate, isLoading } = useSWR('/api/admin/trending', fetcher);
  const { success: toastSuccess, error: toastError } = useToast();

  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  // Breaking ticker
  const [breakingActive, setBreakingActive] = useState(false);
  const [breakingTitle, setBreakingTitle] = useState('');
  const [breakingLink, setBreakingLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (data?.success && data.data) {
      setKeywords(data.data.trendingKeywords || []);
      const b = data.data.breakingNews || {};
      setBreakingActive(Boolean(b.isActive));
      setBreakingTitle(b.title || '');
      setBreakingLink(b.link || '');
    }
  }, [data]);

  function handleAddKeyword() {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    if (keywords.includes(trimmed)) {
      toastError('Keyword already in trending list.');
      return;
    }
    setKeywords([...keywords, trimmed]);
    setNewKeyword('');
  }

  function handleRemoveKeyword(item: string) {
    setKeywords(keywords.filter((k) => k !== item));
  }

  function moveKeyword(idx: number, direction: 'up' | 'down') {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= keywords.length) return;

    const copy = [...keywords];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setKeywords(copy);
  }

  async function handleSave() {
    try {
      setIsSaving(true);
      const res = await fetch('/api/admin/trending', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trendingKeywords: keywords,
          breakingNews: {
            isActive: breakingActive,
            title: breakingTitle,
            link: breakingLink,
          },
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save changes.');

      mutate();
      toastSuccess('Trending chips and breaking ticker updated!');
    } catch (err: any) {
      toastError(err.message || 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Trending & Breaking News"
        description="Configure real-time top trending topic chips and control the breaking news ticker."
        actions={
          <Button variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />} isLoading={isSaving} onClick={handleSave}>
            Save Changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breaking News Ticker Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Breaking News Ticker Banner
              </h2>
              <p className="text-xs text-slate-400">Real-time red alert bar shown at top of website</p>
            </div>
          </div>

          <Switch
            checked={breakingActive}
            onChange={setBreakingActive}
            label="Display Breaking News Alert"
            description="When enabled, all visitors see an urgent flashing headline"
          />

          <FormField label="Breaking News Headline" hint="Keep concise and impactful">
            <Input
              value={breakingTitle}
              onChange={(e) => setBreakingTitle(e.target.value)}
              placeholder="e.g. জাতীয় সংসদ নির্বাচন: প্রধান নির্বাচন কমিশনারের জরুরি সংবাদ সম্মেলন..."
            />
          </FormField>

          <FormField label="Article Link (Optional)">
            <Input
              value={breakingLink}
              onChange={(e) => setBreakingLink(e.target.value)}
              placeholder="https://jamunarkantho.com/national/slug or /category/slug"
            />
          </FormField>

          {/* Live ticker banner preview */}
          {breakingActive && (
            <div className="p-3 rounded-xl bg-rose-600 text-white flex items-center gap-2 text-xs font-bold animate-pulse">
              <span className="bg-white text-rose-600 px-2 py-0.5 rounded text-[10px] tracking-wider uppercase font-black">
                জরুরি সংবাদ
              </span>
              <span className="truncate">{breakingTitle || 'ব্রেকিং হেডলাইন এখানে প্রদর্শিত হবে...'}</span>
            </div>
          )}
        </div>

        {/* Trending Topic Chips Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-[#1b7d95]/10 text-[#1b7d95] flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Trending Keyword Chips
              </h2>
              <p className="text-xs text-slate-400">Highlighted quick topic chips shown below top nav</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add keyword (e.g. বাজেট ২০২৬)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
            />
            <Button type="button" variant="secondary" size="md" onClick={handleAddKeyword}>
              Add
            </Button>
          </div>

          {/* List with drag / order controls */}
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {keywords.map((kw, idx) => (
              <div
                key={kw}
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 text-center text-xs font-bold text-slate-400">{idx + 1}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{kw}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveKeyword(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                    title="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === keywords.length - 1}
                    onClick={() => moveKeyword(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                    title="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="p-1 text-slate-400 hover:text-rose-600 ml-1"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
