import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/src/lib/db';
import Settings from '@/src/models/Settings';
import AdSlot from '@/src/models/AdSlot';
import { logActivity } from './adminAuditService';
import type { AdminUserSession } from './adminPostService';

export async function getAdminSettings() {
  await connectToDatabase();
  let settings = await Settings.findOne({}).lean();
  if (!settings) {
    settings = await Settings.create({
      siteName: 'দৈনিক যমুনা কণ্ঠ',
      sitePrimaryColor: '#083c4d',
      siteSecondaryColor: '#1b7d95',
      siteAccentColor: '#d6a74f',
      adminPanelName: 'যমুনা কণ্ঠ',
      adminSubtitle: 'Newsroom',
      adminPrimaryColor: '#0a2b3a',
      adminTealColor: '#1b7d95',
      trendingKeywords: ['জাতীয়', 'রাজনীতি', 'অর্থনীতি', 'আন্তর্জাতিক', 'খেলা', 'বিনোদন'],
      copyrightText: '© ২০২৬ দৈনিক যমুনা কণ্ঠ। সর্বস্বত্ব সংরক্ষিত।',
    });
  }
  return settings;
}

export async function updateAdminSettings(data: any, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role !== 'admin') {
    throw new Error('Only administrators can update site settings.');
  }

  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: data },
    { new: true, upsert: true }
  );

  try {
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
  } catch (e) {
    // Ignore in non-request context
  }

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'settings_update',
    entity: 'settings',
    details: 'Updated global site settings and branding',
  });

  return settings;
}

export async function updateAdminTrendingAndBreaking(
  data: {
    trendingKeywords?: string[];
    breakingNews?: {
      isActive: boolean;
      title?: string;
      link?: string;
    };
  },
  session: AdminUserSession
) {
  await connectToDatabase();
  if (session.role === 'reporter') {
    throw new Error('Reporters cannot update trending or breaking news.');
  }

  const updateFields: Record<string, unknown> = {};
  if (data.trendingKeywords) {
    updateFields.trendingKeywords = data.trendingKeywords;
  }

  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: updateFields },
    { new: true, upsert: true }
  );

  revalidatePath('/');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'settings',
    details: 'Updated trending keyword chips and breaking ticker',
  });

  return settings;
}

export async function getAdminAds() {
  await connectToDatabase();
  const ads = await AdSlot.find({}).sort({ position: 1 }).lean();
  return ads;
}

export async function createOrUpdateAdminAd(data: any, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role !== 'admin') {
    throw new Error('Only administrators can manage advertisements.');
  }

  const ad = await AdSlot.findOneAndUpdate(
    { key: data.key },
    { $set: data },
    { new: true, upsert: true }
  );

  revalidatePath('/');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'update',
    entity: 'ad',
    entityId: String(ad._id),
    details: `Updated ad slot "${ad.key}" (${ad.position})`,
  });

  return ad;
}

export async function deleteAdminAd(id: string, session: AdminUserSession) {
  await connectToDatabase();
  if (session.role !== 'admin') {
    throw new Error('Only administrators can delete advertisement slots.');
  }

  await AdSlot.findByIdAndDelete(id);
  revalidatePath('/');

  await logActivity({
    userId: session.id,
    userName: session.username,
    userRole: session.role,
    action: 'delete',
    entity: 'ad',
    entityId: id,
    details: `Deleted ad slot`,
  });

  return { success: true };
}
