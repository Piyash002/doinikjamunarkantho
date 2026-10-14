import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/src/lib/db';
import HomepageSection from '@/src/models/HomepageSection';
import Post from '@/src/models/Post';
import { logActivity } from './adminAuditService';
import type { AdminUserSession } from './adminPostService';

const DEFAULT_SECTIONS = [
  {
    sectionKey: 'hero-lead',
    title: 'Lead Story & Hero Grid',
    subtitle: 'Primary hero banner and top 3 accompanying lead stories',
    layout: 'hero',
    category: '',
    order: 1,
    slots: [
      { slotIndex: 1, label: 'Main Lead Story', isPinned: false },
      { slotIndex: 2, label: 'Hero Side Top', isPinned: false },
      { slotIndex: 3, label: 'Hero Side Middle', isPinned: false },
      { slotIndex: 4, label: 'Hero Side Bottom', isPinned: false },
    ],
  },
  {
    sectionKey: 'top-featured',
    title: 'Featured Stories Grid',
    subtitle: 'Major highlighted editorial selections across the portal',
    layout: 'grid-4',
    category: '',
    order: 2,
    slots: [
      { slotIndex: 1, label: 'Featured 1', isPinned: false },
      { slotIndex: 2, label: 'Featured 2', isPinned: false },
      { slotIndex: 3, label: 'Featured 3', isPinned: false },
      { slotIndex: 4, label: 'Featured 4', isPinned: false },
    ],
  },
  {
    sectionKey: 'opinion-editorial',
    title: 'Opinion & Editorial (মতামত)',
    subtitle: 'Editorials, columnist essays and opinion pieces',
    layout: 'lead-plus-list',
    category: 'মতামত',
    order: 3,
    slots: [
      { slotIndex: 1, label: 'Lead Opinion', isPinned: false },
      { slotIndex: 2, label: 'Column 1', isPinned: false },
      { slotIndex: 3, label: 'Column 2', isPinned: false },
    ],
  },
  {
    sectionKey: 'sports-section',
    title: 'Sports News (খেলা)',
    subtitle: 'Cricket, Football and global athletics highlights',
    layout: 'sports-3col',
    category: 'খেলা',
    order: 4,
    slots: [
      { slotIndex: 1, label: 'Sports Lead', isPinned: false },
      { slotIndex: 2, label: 'Sports Card 2', isPinned: false },
      { slotIndex: 3, label: 'Sports Card 3', isPinned: false },
    ],
  },
];

export async function getAdminHomepageSections() {
  await connectToDatabase();

  // Find or initialize sections
  let sections = await HomepageSection.find({}).sort({ order: 1 }).lean();
  if (sections.length === 0) {
    await HomepageSection.insertMany(DEFAULT_SECTIONS);
    sections = await HomepageSection.find({}).sort({ order: 1 }).lean();
  }

  // Fetch recent posts to populate automatic suggestions for unpinned slots
  const latestPosts = await Post.find({ isDeleted: false, status: 'published' })
    .select('title slug category featuredImage views publishedAt')
    .sort({ publishedAt: -1 })
    .limit(20)
    .lean();

  const featuredPosts = await Post.find({ isDeleted: false, status: 'published', isFeatured: true })
    .select('title slug category featuredImage views publishedAt')
    .sort({ publishedAt: -1 })
    .limit(10)
    .lean();

  // Populate slot automatic post previews if unpinned
  const enrichedSections = sections.map((sec: any) => {
    const slots = (sec.slots || []).map((slot: any, idx: number) => {
      if (slot.isPinned && slot.postId) {
        return slot;
      }
      // Provide fallback auto post
      let autoPost = null;
      if (sec.category) {
        autoPost = latestPosts.find((p) => p.category === sec.category) || latestPosts[idx % latestPosts.length];
      } else if (sec.sectionKey === 'hero-lead') {
        autoPost = featuredPosts[idx] || latestPosts[idx];
      } else {
        autoPost = latestPosts[idx % latestPosts.length];
      }

      return {
        ...slot,
        autoPost: autoPost
          ? {
              _id: String(autoPost._id),
              title: autoPost.title,
              slug: autoPost.slug,
              image: autoPost.featuredImage?.url || '',
              category: autoPost.category,
            }
          : null,
      };
    });

    return {
      ...sec,
      slots,
    };
  });

  return enrichedSections;
}

export async function updateAdminHomepageSection(
  sectionKey: string,
  slots: any[],
  session: AdminUserSession
) {
  await connectToDatabase();
  if (session.role !== 'admin') {
    throw new Error('Only administrators can edit the homepage configuration.');
  }

  const section = await HomepageSection.findOneAndUpdate(
    { sectionKey },
    { $set: { slots } },
    { new: true, upsert: true }
  );

  return section;
}

export async function publishAdminHomepage(
  sectionsData: any[],
  session: AdminUserSession
) {
  await connectToDatabase();
  if (session.role !== 'admin') {
    throw new Error('Only administrators can publish homepage layout changes.');
  }

  for (const item of sectionsData) {
    if (item.sectionKey) {
      await HomepageSection.findOneAndUpdate(
        { sectionKey: item.sectionKey },
        {
          $set: {
            slots: item.slots,
            title: item.title,
            order: item.order,
          },
        },
        { upsert: true }
      );
    }
  }

  // Update homePosition flags on pinned posts
  for (const item of sectionsData) {
    if (item.sectionKey === 'hero-lead') {
      for (const slot of item.slots || []) {
        if (slot.isPinned && slot.postId) {
          await Post.findByIdAndUpdate(slot.postId, { homePosition: slot.slotIndex });
        }
      }
    }
  }

  revalidatePath('/');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'reorder',
    entity: 'homepage',
    details: 'Published homepage sections and pinned slot layout to live site',
  });

  return { success: true };
}
