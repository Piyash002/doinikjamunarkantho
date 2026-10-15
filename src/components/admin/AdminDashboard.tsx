'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  FileText,
  Eye,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FolderTree,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

import { StatCard } from './ui/StatCard';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { StatCardSkeleton, Skeleton } from './ui/Skeleton';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminDashboard() {
  const [daysRange, setDaysRange] = useState(7);
  const [isDateSheetOpen, setIsDateSheetOpen] = useState(false);
  const [postsTab, setPostsTab] = useState<'recent' | 'top'>('recent');

  const { data, error, isLoading, mutate } = useSWR(
    `/api/admin/stats?days=${daysRange}`,
    fetcher,
    {
      refreshInterval: 60_000,
      revalidateOnFocus: true,
    }
  );

  const stats = data?.success ? data.data : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Heading & Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs uppercase font-bold text-[#1b7d95] tracking-wider">
            Editorial Operations
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Editorial Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time reader interest, content metrics, and upcoming publication schedules.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mobile Date Range Bottom Sheet Trigger */}
          <button
            type="button"
            onClick={() => setIsDateSheetOpen(true)}
            className="sm:hidden touch-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700"
          >
            <Calendar className="w-3.5 h-3.5 text-[#1b7d95]" />
            <span>{daysRange} Days</span>
          </button>

          {/* Desktop Segmented Buttons */}
          <div className="hidden sm:inline-flex rounded-xl p-1 bg-slate-200/60 dark:bg-slate-800 text-xs font-semibold">
            {[7, 14, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDaysRange(d)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  daysRange === d
                    ? 'bg-white dark:bg-slate-900 text-[#1b7d95] shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Link href="/admin/posts/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              <span>New Article</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Date Range Bottom Sheet Modal */}
      {isDateSheetOpen && (
        <div className="sm:hidden">
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-backdrop"
            onClick={() => setIsDateSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-3 animate-bottom-sheet"
          >
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-1 shrink-0" />
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">সময়কাল নির্বাচন করুন (Select Range)</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'গত ৭ দিন (Last 7 Days)', value: 7 },
                { label: 'গত ১৪ দিন (Last 14 Days)', value: 14 },
                { label: 'গত ৩০ দিন (Last 30 Days)', value: 30 },
                { label: 'গত ৩ মাস (Last 90 Days)', value: 90 },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setDaysRange(opt.value);
                    setIsDateSheetOpen(false);
                  }}
                  className={`w-full min-h-[48px] px-4 py-3 text-left rounded-2xl text-sm font-bold flex items-center justify-between transition-colors ${
                    daysRange === opt.value
                      ? 'bg-[#1b7d95]/15 text-[#1b7d95] dark:text-sky-300 border border-[#1b7d95]/30'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>{opt.label}</span>
                  {daysRange === opt.value && <span className="w-2.5 h-2.5 rounded-full bg-[#1b7d95]" />}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIsDateSheetOpen(false)}
              className="mt-2 min-h-[48px] w-full rounded-2xl bg-slate-100 dark:bg-slate-800 font-bold text-sm text-slate-600 dark:text-slate-300"
            >
              বন্ধ করুন (Close)
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards: 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isLoading || !stats ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Articles"
              value={stats.totals.totalPosts}
              hint={`${stats.totals.publishedToday} published today`}
              icon={<FileText className="w-5 h-5" />}
              accentColor="teal"
            />
            <StatCard
              title="Total Reader Views"
              value={stats.totals.totalViews}
              hint={`Database Total • ${stats.totals.todayViews.toLocaleString()} today`}
              icon={<Eye className="w-5 h-5" />}
              accentColor="emerald"
            />
            <StatCard
              title="Drafts in Progress"
              value={stats.totals.draftPosts}
              hint="Unpublished editor drafts"
              icon={<Clock className="w-5 h-5" />}
              accentColor="amber"
            />
            <StatCard
              title="Scheduled Articles"
              value={stats.totals.scheduledPosts}
              hint="Upcoming timed publication"
              icon={<Calendar className="w-5 h-5" />}
              accentColor="sky"
            />
          </>
        )}
      </div>

      {/* Primary Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reader Views Timeline Chart (2 cols desktop) */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Reader Traffic Interest
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                Daily article pageviews over the last {daysRange} days
              </p>
            </div>
            <Badge variant="info">Live Tracking</Badge>
          </div>

          <div className="h-64 sm:h-72 w-full mt-2">
            {isLoading || !stats ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : stats.viewsTimeline?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.viewsTimeline} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1b7d95" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1b7d95" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.25)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val: number) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#f8fafc' }}
                    formatter={(val: any) => [new Intl.NumberFormat('en-US').format(val), 'Views']}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#1b7d95"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#viewsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                No view data recorded yet in this timeframe.
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown (1 col desktop) */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Articles by Section
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-300">Published stories distribution</p>
              </div>
              <Link href="/admin/categories" className="text-xs font-semibold text-[#1b7d95] hover:underline">
                View All
              </Link>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              {isLoading || !stats ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-lg" />
                ))
              ) : stats.categoryBreakdown?.length > 0 ? (
                stats.categoryBreakdown.map((cat: any) => {
                  const maxCount = Math.max(...stats.categoryBreakdown.map((c: any) => c.count), 1);
                  const percentage = Math.round((cat.count / maxCount) * 100);
                  return (
                    <div key={cat.name} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-800 dark:text-slate-200 truncate">{cat.name}</span>
                        <span className="text-slate-600 dark:text-slate-300 font-bold">{cat.count}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-[#1b7d95] rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">No categories found.</div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center justify-between">
            <span>Total Categories: {stats?.totals.totalCategories || 0}</span>
            <span>Authors: {stats?.totals.totalAuthors || 0}</span>
          </div>
        </div>
      </div>

      {/* Secondary Row: Needs Attention & Recent Articles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Needs Attention Panel */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Needs Editorial Attention
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-300 mb-4">
            Stale drafts older than 3 days and upcoming scheduled posts
          </p>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading || !stats ? (
              <Skeleton className="h-32 w-full rounded-xl" />
            ) : stats.needsAttention?.staleDrafts?.length > 0 ||
              stats.needsAttention?.upcomingScheduled?.length > 0 ? (
              <>
                {stats.needsAttention.upcomingScheduled?.map((post: any) => (
                  <div key={post._id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {post.title}
                      </span>
                      <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                        Due: {new Date(post.publishedAt).toLocaleString()}
                      </span>
                    </div>
                    <Badge variant="info">Scheduled</Badge>
                  </div>
                ))}

                {stats.needsAttention.staleDrafts?.map((post: any) => (
                  <div key={post._id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {post.title}
                      </span>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Last edited: {new Date(post.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Link href={`/admin/posts/${post._id}/edit`}>
                      <Badge variant="warning">Stale Draft</Badge>
                    </Link>
                  </div>
                ))}
              </>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                All caught up! No stale drafts or pending items.
              </div>
            )}
          </div>
        </div>

        {/* Tabbed Articles Panel: Recent vs Top Viewed with Exact Views */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPostsTab('recent')}
                  className={`text-sm sm:text-base font-bold pb-1 transition-colors border-b-2 ${
                    postsTab === 'recent'
                      ? 'border-[#1b7d95] text-slate-900 dark:text-slate-100'
                      : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Recently Edited
                </button>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setPostsTab('top')}
                  className={`text-sm sm:text-base font-bold pb-1 transition-colors border-b-2 ${
                    postsTab === 'top'
                      ? 'border-[#1b7d95] text-slate-900 dark:text-slate-100'
                      : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  Top Viewed Articles (সর্বাধিক পঠিত)
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
                {postsTab === 'recent'
                  ? 'Latest activity across all editorial desks'
                  : 'Highest read articles with verified database view counts'}
              </p>
            </div>
            <Link href="/admin/posts" className="inline-flex items-center gap-1 text-xs font-semibold text-[#1b7d95] hover:underline shrink-0">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading || !stats ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : (postsTab === 'recent' ? stats.recentPosts : stats.topPosts)?.length > 0 ? (
              (postsTab === 'recent' ? stats.recentPosts : stats.topPosts).map((post: any) => (
                <div key={post._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex flex-col min-w-0 flex-1">
                    <Link
                      href={`/admin/posts/${post._id}/edit`}
                      className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-[#1b7d95] dark:hover:text-sky-400 line-clamp-1 transition-colors"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{post.category || 'General'}</span>
                      <span>•</span>
                      <span>By {post.author || 'Desk'}</span>
                      <span>•</span>
                      <span>{new Date(post.publishedAt || post.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{new Intl.NumberFormat('en-US').format(post.views || 0)} views</span>
                    </span>

                    {post.status && (
                      <Badge
                        variant={
                          post.status === 'published'
                            ? 'success'
                            : post.status === 'scheduled'
                            ? 'info'
                            : 'warning'
                        }
                      >
                        {post.status}
                      </Badge>
                    )}
                    <Link
                      href={`/admin/posts/${post._id}/edit`}
                      className="text-xs font-semibold text-[#1b7d95] hover:underline hidden sm:inline"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                {postsTab === 'recent' ? 'No recent articles found.' : 'No top viewed articles found.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
