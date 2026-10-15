import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/src/lib/db';
import { generateBanglaSafeSlug } from '@/src/lib/slug';
import StaticPage from '@/src/models/StaticPage';
import { logActivity } from './adminAuditService';
import type { AdminUserSession } from './adminPostService';

const DEFAULT_PAGES = [
  {
    title: 'আমাদের সম্পর্কে (About Us)',
    slug: 'about',
    excerpt: 'দৈনিক যমুনা কণ্ঠের লক্ষ্য, উদ্দেশ্য এবং পরিচিতি।',
    content: '<p>দৈনিক যমুনা কণ্ঠ বাংলাদেশের একটি অগ্রণী জাতীয় দৈনিক সংবাদপত্র। সত্যের সঙ্গে, মানুষের পাশে প্রতিপাদ্য নিয়ে আমরা বস্তুনিষ্ঠ সাংবাদিকতায় বিশ্বাসী।</p>',
    isActive: true,
  },
  {
    title: 'গোপনীয়তা নীতি (Privacy Policy)',
    slug: 'privacy-policy',
    excerpt: 'পাঠক ও ব্যবহারকারীদের তথ্যের সুরক্ষা এবং ব্যবহার সংক্রান্ত নীতি।',
    content: '<p>দৈনিক যমুনা কণ্ঠ আপনার তথ্যের গোপনীয়তা রক্ষায় প্রতিশ্রুতিবদ্ধ।</p>',
    isActive: true,
  },
  {
    title: 'ব্যবহারের শর্তাবলী (Terms of Service)',
    slug: 'terms',
    excerpt: 'আমাদের ওয়েবসাইট ব্যবহার সংক্রান্ত যাবতীয় নিয়ম ও শর্তাবলী।',
    content: '<p>দৈনিক যমুনা কণ্ঠ ওয়েবসাইট ব্যবহারের ক্ষেত্রে নিম্নলিখিত শর্তাবলী প্রযোজ্য।</p>',
    isActive: true,
  },
  {
    title: 'যোগাযোগ (Contact Us)',
    slug: 'contact',
    excerpt: 'আমাদের অফিস ও নিউজরুমের ঠিকানা এবং যোগাযোগের নম্বর।',
    content: '<p>আমাদের সাথে যোগাযোগ করতে ইমেইল করুন অথবা সরাসরি আমাদের প্রধান কার্যালয়ে আসুন।</p>',
    isActive: true,
  },
  {
    title: 'বিজ্ঞাপন (Advertise with us)',
    slug: 'advertise',
    excerpt: 'পত্রিকা ও অনলাইন পোর্টালে বিজ্ঞাপন প্রচারের সুযোগ ও মূল্য তালিকা।',
    content: '<p>দৈনিক যমুনা কণ্ঠে বিজ্ঞাপন দিয়ে আপনার ব্র্যান্ড বা ব্যবসাকে তুলে ধরুন লক্ষাধিক পাঠকের সামনে।</p>',
    isActive: true,
  },
];

export async function getAdminStaticPages() {
  await connectToDatabase();
  let pages = await StaticPage.find({}).sort({ createdAt: 1 }).lean();
  if (pages.length === 0) {
    await StaticPage.insertMany(DEFAULT_PAGES);
    pages = await StaticPage.find({}).sort({ createdAt: 1 }).lean();
  }
  return pages;
}

export async function getAdminStaticPageBySlug(slug: string) {
  await connectToDatabase();
  const page = await StaticPage.findOne({ slug }).lean();
  return page;
}

export async function createAdminStaticPage(data: any, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role !== 'admin') {
    throw new Error('Only administrators can create static pages.');
  }

  if (!data.slug) {
    const baseSlug = generateBanglaSafeSlug(data.title);
    let candidateSlug = baseSlug;
    let counter = 1;
    while (await StaticPage.findOne({ slug: candidateSlug })) {
      candidateSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    data.slug = candidateSlug;
  } else {
    const existing = await StaticPage.findOne({ slug: data.slug });
    if (existing) {
      throw new Error('A page with this URL slug already exists.');
    }
  }

  const page = await StaticPage.create({
    ...data,
    updatedBy: session.username,
  });

  revalidatePath(`/${page.slug}`);

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'create',
    entity: 'page',
    entityId: String(page._id),
    details: `Created static page "${page.title}" (/${page.slug})`,
  });

  return page;
}

export async function updateAdminStaticPage(id: string, data: any, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role !== 'admin') {
    throw new Error('Only administrators can edit static pages.');
  }

  const page = await StaticPage.findByIdAndUpdate(
    id,
    { ...data, updatedBy: session.username },
    { new: true }
  );
  if (!page) throw new Error('Page not found.');

  revalidatePath(`/${page.slug}`);

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'page',
    entityId: id,
    details: `Updated static page "${page.title}"`,
  });

  return page;
}

export async function deleteAdminStaticPage(id: string, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role !== 'admin') {
    throw new Error('Only administrators can delete static pages.');
  }

  const page = await StaticPage.findByIdAndDelete(id);
  if (!page) throw new Error('Page not found.');

  revalidatePath(`/${page.slug}`);

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'delete',
    entity: 'page',
    entityId: id,
    details: `Deleted static page "${page.title}"`,
  });

  return { success: true };
}

export const STATIC_PAGE_ALIASES: Record<string, string> = {
  privacy: 'privacy-policy',
  'privacy-policy': 'privacy-policy',
  terms: 'terms',
  tos: 'terms',
  'terms-of-service': 'terms',
  'terms-and-conditions': 'terms',
  about: 'about',
  'about-us': 'about',
  contact: 'contact',
  'contact-us': 'contact',
  advertise: 'advertise',
  ads: 'advertise',
};

export async function getPublicStaticPages() {
  await connectToDatabase();
  let pages = await StaticPage.find({ isActive: true })
    .select('title slug')
    .sort({ createdAt: 1 })
    .lean();

  if (pages.length === 0) {
    try {
      await StaticPage.insertMany(DEFAULT_PAGES);
      pages = await StaticPage.find({ isActive: true })
        .select('title slug')
        .sort({ createdAt: 1 })
        .lean();
    } catch {
      // ignore concurrent insert collisions
    }
  }

  return pages.map((p: any) => ({
    _id: String(p._id),
    title: p.title,
    slug: p.slug,
  }));
}

export async function getPublicStaticPageBySlug(slug: string) {
  if (!slug || typeof slug !== 'string') return null;
  await connectToDatabase();

  const trimmed = slug.trim();
  const normalized = trimmed.toLowerCase();
  const targetSlug = STATIC_PAGE_ALIASES[normalized] || normalized;

  let page = await StaticPage.findOne({
    isActive: true,
    $or: [{ slug: targetSlug }, { slug: normalized }, { slug: trimmed }],
  }).lean();

  if (!page) {
    page = await StaticPage.findOne({
      isActive: true,
      slug: new RegExp(`^${targetSlug}$`, 'i'),
    }).lean();
  }

  return page;
}
