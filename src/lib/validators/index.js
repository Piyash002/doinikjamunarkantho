import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const loginSchema = z.object({
  username: z.string().trim().min(2).max(100),
  password: z.string().min(4).max(120),
  rememberMe: z.boolean().optional().default(false),
});

export const sortFieldSchema = z.enum(['newest', 'oldest', 'views', 'title', 'publishedAt', 'createdAt']).default('newest');

export const mediaSchema = z.object({
  url: z.string().trim().min(1),
  publicId: z.string().trim().optional().or(z.literal('')),
  caption: z.string().trim().max(250).optional().or(z.literal('')),
  alt: z.string().trim().max(250).optional().or(z.literal('')),
});

export const seoSchema = z.object({
  title: z.string().trim().max(250).optional().or(z.literal('')),
  description: z.string().trim().max(500).optional().or(z.literal('')),
});

export const postListQuerySchema = z.object({
  category: z.string().trim().optional(),
  status: z.enum(['all', 'draft', 'published', 'scheduled', 'trashed']).optional().default('all'),
  tag: z.string().trim().optional(),
  author: z.string().trim().optional(),
  search: z.string().trim().optional(),
  division: z.string().trim().optional(),
  district: z.string().trim().optional(),
  upazila: z.string().trim().optional(),
  isBreaking: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isTrending: z.coerce.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: sortFieldSchema.optional().default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const postCreateSchema = z.object({
  title: z.string().trim().min(2, 'শিরোনাম অন্তত ২ অক্ষরের হতে হবে').max(300),
  slug: z.string().trim().min(2).max(300).optional(),
  lead: z.string().trim().max(1000).optional().or(z.literal('')),
  excerpt: z.string().trim().max(1000).optional().or(z.literal('')),
  content: z.string().min(1, 'সংবাদের বিষয়বস্তু আবশ্যক'),
  category: z.string().trim().min(1, 'বিভাগ নির্বাচন করুন').max(100),
  subCategory: z.string().trim().max(100).optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1).max(50)).default([]),
  author: z.string().trim().max(150).optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  publishedAt: z.coerce.date().nullable().optional(),
  featuredImage: mediaSchema.nullable().optional(),
  gallery: z.array(mediaSchema).default([]),
  isBreaking: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  homePosition: z.number().int().min(1).nullable().optional(),
  division: z.string().trim().max(100).optional().or(z.literal('')),
  district: z.string().trim().max(100).optional().or(z.literal('')),
  upazila: z.string().trim().max(100).optional().or(z.literal('')),
  seo: seoSchema.optional(),
  version: z.number().int().optional(),
});

export const postUpdateSchema = postCreateSchema.partial().extend({
  version: z.number().int().optional(),
});

export const bulkPostsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'কমপক্ষে একটি সংবাদ নির্বাচন করুন'),
  action: z.enum(['publish', 'unpublish', 'trash', 'restore', 'delete', 'change_category', 'mark_featured', 'unmark_featured']),
  category: z.string().optional(),
});

export const categorySchema = z.object({
  name_bn: z.string().trim().min(2).max(100),
  name_en: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120).optional(),
  order: z.number().int().min(0).default(0),
  showInNav: z.boolean().default(true),
  showOnHome: z.boolean().default(true),
  homeLayout: z.enum(['hero', 'lead-plus-list', 'grid-4', 'sports-3col', 'intl-3col', 'entertainment-3col']).default('hero'),
  parent: z.string().trim().nullable().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const categoryReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number().int(),
    })
  ).min(1),
});

export const tagSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const tagMergeSchema = z.object({
  sourceTag: z.string().trim().min(1),
  targetTag: z.string().trim().min(1),
});

export const authorSchema = z.object({
  name: z.string().trim().min(2).max(150),
  designation: z.string().trim().max(200).optional().or(z.literal('')),
  bio: z.string().trim().max(1000).optional().or(z.literal('')),
  avatar: mediaSchema.nullable().optional(),
  isActive: z.boolean().default(true),
});

export const adSlotSchema = z.object({
  key: z.string().trim().min(2).max(100),
  imageUrl: z.string().trim().optional().or(z.literal('')),
  link: z.string().trim().max(500).optional().or(z.literal('#')),
  isActive: z.boolean().default(true),
  position: z.enum([
    'header-below',
    'sidebar',
    'between-sections',
    'sticky-bottom',
    'in-article',
    'article-sidebar-top',
    'article-sidebar-mid',
  ]).default('sidebar'),
  sizeHint: z.string().optional().or(z.literal('')),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
});

export const settingsSchema = z.object({
  siteName: z.string().trim().min(2).max(150).default('দৈনিক যমুনা কণ্ঠ'),
  logo: mediaSchema.nullable().optional(),
  favicon: z.string().trim().optional().or(z.literal('')),
  trendingKeywords: z.array(z.string().trim().min(1).max(50)).default([]),
  socialLinks: z.object({
    facebook: z.string().trim().max(300).optional().or(z.literal('')),
    x: z.string().trim().max(300).optional().or(z.literal('')),
    youtube: z.string().trim().max(300).optional().or(z.literal('')),
    instagram: z.string().trim().max(300).optional().or(z.literal('')),
  }).default({}),
  footerAddress: z.string().trim().max(500).optional().or(z.literal('')),
  editorName: z.string().trim().max(150).optional().or(z.literal('')),
  phone: z.string().trim().max(80).optional().or(z.literal('')),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  whatsappChannel: z.string().trim().max(300).optional().or(z.literal('')),
  googlePlayLink: z.string().trim().max(300).optional().or(z.literal('')),
  copyrightText: z.string().trim().max(300).optional().or(z.literal('')),
  googleAnalyticsId: z.string().trim().max(50).optional().or(z.literal('')),
  defaultOgImage: z.string().trim().optional().or(z.literal('')),
  defaultMetaDescription: z.string().trim().max(500).optional().or(z.literal('')),
});

export const userCreateSchema = z.object({
  username: z.string().trim().min(3).max(60),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে').max(120),
  name: z.string().trim().min(2).max(120).optional().or(z.literal('')),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  role: z.enum(['admin', 'editor', 'reporter']).default('editor'),
  avatar: mediaSchema.nullable().optional(),
  isActive: z.boolean().default(true),
});

export const userUpdateSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal('')),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  role: z.enum(['admin', 'editor', 'reporter']).optional(),
  password: z.string().min(6).max(120).optional().or(z.literal('')),
  avatar: mediaSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal('')),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  avatar: mediaSchema.nullable().optional(),
  currentPassword: z.string().min(1).optional().or(z.literal('')),
  newPassword: z.string().min(6).max(120).optional().or(z.literal('')),
});

export const staticPageSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(100),
  content: z.string().default(''),
  excerpt: z.string().trim().max(500).optional().or(z.literal('')),
  featuredImage: mediaSchema.nullable().optional(),
  seo: seoSchema.optional(),
  isActive: z.boolean().default(true),
});

export const trendingAndBreakingSchema = z.object({
  trendingKeywords: z.array(z.string().trim().min(1).max(60)).default([]),
  breakingNews: z.object({
    isActive: z.boolean().default(false),
    title: z.string().trim().max(250).optional().or(z.literal('')),
    link: z.string().trim().max(500).optional().or(z.literal('')),
  }).optional(),
});
