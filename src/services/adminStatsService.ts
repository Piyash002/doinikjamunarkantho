import { connectToDatabase } from '@/src/lib/db';
import Post from '@/src/models/Post';
import Category from '@/src/models/Category';
import Author from '@/src/models/Author';
import AdSlot from '@/src/models/AdSlot';

export async function getAdminDashboardStats(daysRange = 7) {
  await connectToDatabase();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const rangeStart = new Date(now.getTime() - daysRange * 24 * 60 * 60 * 1000);

  const [
    totalPosts,
    publishedToday,
    draftPosts,
    scheduledPosts,
    totalViewsAgg,
    todayViewsAgg,
    totalCategories,
    totalAuthors,
    activeAds,
    topPosts,
    recentPosts,
    staleDrafts,
    upcomingScheduled,
    categoryBreakdown,
  ] = await Promise.all([
    Post.countDocuments({ isDeleted: false }),
    Post.countDocuments({ isDeleted: false, status: 'published', publishedAt: { $gte: startOfToday } }),
    Post.countDocuments({ isDeleted: false, status: 'draft' }),
    Post.countDocuments({ isDeleted: false, status: 'scheduled' }),
    Post.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalViews: {
            $sum: { $max: [{ $ifNull: ['$views', 0] }, { $ifNull: ['$viewCount', 0] }] }
          }
        }
      },
    ]),
    Post.aggregate([
      {
        $match: {
          isDeleted: false,
          $or: [
            { publishedAt: { $gte: startOfToday } },
            { updatedAt: { $gte: startOfToday } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalViews: {
            $sum: { $max: [{ $ifNull: ['$views', 0] }, { $ifNull: ['$viewCount', 0] }] }
          }
        }
      },
    ]),
    Category.countDocuments({ isActive: true }),
    Author.countDocuments({ isActive: true }),
    AdSlot.countDocuments({ isActive: true }),
    Post.find({ isDeleted: false, status: 'published' })
      .select('title slug category views viewCount publishedAt createdAt author')
      .sort({ views: -1 })
      .limit(10)
      .lean(),
    Post.find({ isDeleted: false })
      .select('title slug category status updatedAt publishedAt author views viewCount')
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean(),
    Post.find({ isDeleted: false, status: 'draft', updatedAt: { $lt: threeDaysAgo } })
      .select('title slug category updatedAt author')
      .sort({ updatedAt: 1 })
      .limit(5)
      .lean(),
    Post.find({ isDeleted: false, status: 'scheduled' })
      .select('title slug category publishedAt author')
      .sort({ publishedAt: 1 })
      .limit(5)
      .lean(),
    Post.aggregate([
      { $match: { isDeleted: false, status: 'published' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          views: {
            $sum: { $max: [{ $ifNull: ['$views', 0] }, { $ifNull: ['$viewCount', 0] }] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
  ]);

  // Generate date timeline for views chart
  // Aggregate views & post counts by date
  const timelineAgg = await Post.aggregate([
    {
      $match: {
        isDeleted: false,
        status: 'published',
        publishedAt: { $gte: rangeStart },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' } },
        views: {
          $sum: { $max: [{ $ifNull: ['$views', 0] }, { $ifNull: ['$viewCount', 0] }] }
        },
        posts: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill in any missing dates in the range for a continuous chart
  const dateMap = new Map<string, { views: number; posts: number }>();
  timelineAgg.forEach((item) => {
    dateMap.set(item._id, { views: item.views, posts: item.posts });
  });

  const viewsTimeline: { date: string; label: string; views: number; posts: number }[] = [];
  for (let i = daysRange - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const item = dateMap.get(dateStr) || { views: 0, posts: 0 };
    viewsTimeline.push({
      date: dateStr,
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: item.views,
      posts: item.posts,
    });
  }

  return {
    totals: {
      totalPosts,
      publishedToday,
      draftPosts,
      scheduledPosts,
      totalViews: totalViewsAgg[0]?.totalViews || 0,
      todayViews: todayViewsAgg[0]?.totalViews || 0,
      totalCategories,
      totalAuthors,
      activeAds,
    },
    viewsTimeline,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      name: c._id || 'General',
      count: c.count,
      views: c.views,
    })),
    topPosts: topPosts.map((p) => ({
      ...p,
      _id: String(p._id),
      views: Math.max(Number(p.views) || 0, Number(p.viewCount) || 0),
    })),
    recentPosts: recentPosts.map((p) => ({
      ...p,
      _id: String(p._id),
      views: Math.max(Number(p.views) || 0, Number(p.viewCount) || 0),
    })),
    needsAttention: {
      staleDrafts,
      upcomingScheduled,
    },
  };
}
