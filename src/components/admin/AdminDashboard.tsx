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
          <div className="inline-flex rounded-xl p-1 bg-slate-200/60 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDaysRange(7)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                daysRange === 7
                  ? 'bg-white dark:bg-slate-900 text-[#1b7d95] shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setDaysRange(30)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                daysRange === 30
                  ? 'bg-white dark:bg-slate-900 text-[#1b7d95] shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              30 Days
            </button>
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
              hint={`${stats.totals.todayViews} views today`}
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
              <p className="text-xs text-slate-400">
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
                <AreaChart data={stats.viewsTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1b7d95" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1b7d95" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    labelStyle={{ fontWeight: 'bold' }}
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
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
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
                <p className="text-xs text-slate-400">Published stories distribution</p>
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
                        <span className="text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                        <span className="text-slate-500 font-bold">{cat.count}</span>
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
                <div className="py-8 text-center text-xs text-slate-400">No categories found.</div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex items-center justify-between">
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
          <p className="text-xs text-slate-400 mb-4">
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
              <div className="py-8 text-center text-xs text-slate-400">
                All caught up! No stale drafts or pending items.
              </div>
            )}
          </div>
        </div>

        {/* Recent Articles & Top Stories List */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Recently Edited Articles
              </h2>
              <p className="text-xs text-slate-400">Latest activity across all desks</p>
            </div>
            <Link href="/admin/posts" className="inline-flex items-center gap-1 text-xs font-semibold text-[#1b7d95] hover:underline">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading || !stats ? (
              <Skeleton className="h-40 w-full rounded-xl" />
            ) : stats.recentPosts?.length > 0 ? (
              stats.recentPosts.map((post: any) => (
                <div key={post._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex flex-col min-w-0 flex-1">
                    <Link
                      href={`/admin/posts/${post._id}/edit`}
                      className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-[#1b7d95] dark:hover:text-sky-400 line-clamp-1 transition-colors"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                      <span>{post.category || 'General'}</span>
                      <span>•</span>
                      <span>By {post.author || 'Desk'}</span>
                      <span>•</span>
                      <span>{new Date(post.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
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
              <div className="py-8 text-center text-xs text-slate-400">No recent articles found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
