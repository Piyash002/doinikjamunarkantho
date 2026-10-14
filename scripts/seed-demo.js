import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import slugify from 'slugify';

import { bangladeshLocations } from '../src/data/bangladeshLocations.js';
import AdSlot from '../src/models/AdSlot.js';
import Author from '../src/models/Author.js';
import Category from '../src/models/Category.js';
import Location from '../src/models/Location.js';
import Post from '../src/models/Post.js';
import Settings from '../src/models/Settings.js';

// Resolve project root and load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const categorySeed = [
  { name_bn: 'জাতীয়', name_en: 'National', homeLayout: 'hero' },
  { name_bn: 'রাজনীতি', name_en: 'Politics', homeLayout: 'lead-plus-list' },
  { name_bn: 'অর্থনীতি', name_en: 'Economy', homeLayout: 'lead-plus-list' },
  { name_bn: 'এক্সক্লুসিভ', name_en: 'Exclusive', homeLayout: 'grid-4' },
  { name_bn: 'সারাদেশ', name_en: 'Sarades', homeLayout: 'grid-4' },
  { name_bn: 'আন্তর্জাতিক', name_en: 'International', homeLayout: 'intl-3col' },
  { name_bn: 'খেলা', name_en: 'Sports', homeLayout: 'sports-3col' },
  { name_bn: 'বিনোদন', name_en: 'Entertainment', homeLayout: 'entertainment-3col' },
  { name_bn: 'স্বাস্থ্য', name_en: 'Health', homeLayout: 'grid-4' },
  { name_bn: 'লাইফস্টাইল', name_en: 'Lifestyle', homeLayout: 'grid-4' },
  { name_bn: 'তথ্যপ্রযুক্তি', name_en: 'Technology', homeLayout: 'grid-4' },
  { name_bn: 'অটোমোবাইল', name_en: 'Automobile', homeLayout: 'grid-4' },
  { name_bn: 'ট্যুরিজম', name_en: 'Tourism', homeLayout: 'grid-4' },
  { name_bn: 'শিক্ষা', name_en: 'Education', homeLayout: 'grid-4' },
  { name_bn: 'জবস', name_en: 'Jobs', homeLayout: 'grid-4' },
  { name_bn: 'প্রবাস', name_en: 'Overseas', homeLayout: 'grid-4' },
  { name_bn: 'মতামত', name_en: 'Opinion', homeLayout: 'lead-plus-list' },
  { name_bn: 'ধর্ম', name_en: 'Religion', homeLayout: 'grid-4' },
  { name_bn: 'ক্যাম্পাস', name_en: 'Campus', homeLayout: 'grid-4' },
  { name_bn: 'আইন-আদালত', name_en: 'Law', homeLayout: 'grid-4' },
  { name_bn: 'এভিয়েশন', name_en: 'Aviation', homeLayout: 'grid-4' },
  { name_bn: 'গণমাধ্যম', name_en: 'Media', homeLayout: 'grid-4' },
  { name_bn: 'ভিডিও', name_en: 'Video', homeLayout: 'grid-4' },
  { name_bn: 'কৃষি ও প্রকৃতি', name_en: 'Agriculture', homeLayout: 'grid-4' },
  { name_bn: 'কনভার্টার', name_en: 'Converter', homeLayout: 'grid-4' },
];

function buildImage(index, label) {
  const base = [
    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
  ];

  return {
    url: base[index % base.length],
    publicId: `${slugify(label, { lower: true, strict: true })}-${index + 1}`,
    caption: `Placeholder image for ${label}`,
  };
}

export async function seedDemoData() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required for demo seeding.');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000, autoIndex: true });

  // Note: We do NOT delete AdminUser! AdminUser is preserved safely.
  await Promise.all([
    Category.deleteMany({}),
    Post.deleteMany({}),
    Author.deleteMany({}),
    AdSlot.deleteMany({}),
    Settings.deleteMany({}),
    Location.deleteMany({}),
  ]);

  const categories = await Category.insertMany(
    categorySeed.map((entry, index) => ({
      ...entry,
      slug: slugify(entry.name_en, { lower: true, strict: true }) || `category-${index + 1}`,
      order: index + 1,
      showInNav: true,
      showOnHome: true,
      homeLayout: entry.homeLayout,
      isActive: true,
    }))
  );

  const authorSeed = ['আবদুল্লাহ আহমেদ', 'সালমা রহমান', 'নাসির উদ্দিন', 'মেহেরুন নেছা', 'ফারহান হক'];
  const authors = await Author.insertMany(
    authorSeed.map((name, index) => ({
      name,
      designation: ['সম্পাদক', 'স্টাফ রিপোর্টার', 'বিশেষ প্রতিবেদক'][index % 3],
      avatar: {
        url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
        publicId: `author-${index + 1}`,
      },
      bio: 'বাংলা সংবাদ পরিবেশনে নিবেদিত সাংবাদিক।',
      isActive: true,
    }))
  );

  const locationDocs = [];
  for (const division of bangladeshLocations) {
    for (const district of division.districts) {
      for (const upazila of district.upazilas) {
        locationDocs.push({
          division: division.division,
          district: district.name,
          upazila,
          divisions: [division.division],
          districts: [district.name],
          upazilas: [upazila],
        });
      }
    }
  }
  await Location.insertMany(locationDocs);

  await Settings.create({
    siteName: 'দৈনিক যমুনার কণ্ঠ',
    logo: {
      url: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80',
      publicId: 'site-logo',
    },
    trendingKeywords: ['রাজনীতি', 'খেলা', 'অর্থনীতি', 'সারাদেশ'],
    socialLinks: {
      facebook: 'https://facebook.com',
      x: 'https://x.com',
      youtube: 'https://youtube.com',
      instagram: 'https://instagram.com',
    },
    footerAddress: 'ঢাকা, বাংলাদেশ',
    whatsappChannel: 'https://wa.me/880000000000',
    googlePlayLink: 'https://play.google.com',
    copyrightText: '© ২০২৬ দৈনিক যমুনার কণ্ঠ',
  });

  await AdSlot.insertMany([
    {
      key: 'header-below',
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
      link: 'https://example.com',
      isActive: true,
      position: 'header-below',
    },
    {
      key: 'sidebar',
      imageUrl: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=900&q=80',
      link: 'https://example.com',
      isActive: true,
      position: 'sidebar',
    },
    {
      key: 'between-sections',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      link: 'https://example.com',
      isActive: true,
      position: 'between-sections',
    },
  ]);

  const posts = [];
  for (const category of categories) {
    for (let index = 0; index < 8; index += 1) {
      const title = `${category.name_bn} ${index + 1}: ${['সর্বশেষ', 'বিশেষ প্রতিবেদন', 'বিশ্লেষণ', 'সমস্যা', 'উন্নয়ন', 'সামাজিক', 'অভিযোগ', 'তথ্য'][index % 8]}`;
      const slug = `${category.slug}-post-${index + 1}`;
      const itemImage = buildImage(index, category.name_bn);

      posts.push({
        title,
        slug,
        excerpt: `এই প্রতিবেদনে ${category.name_bn} নিয়ে সাম্প্রতিক উন্নয়ন ও বিশ্লেষণ উপস্থাপন করা হয়েছে।`,
        content: `<h2>${category.name_bn}</h2><p>বাংলাদেশের সংবাদ পরিবেশে ${category.name_bn} নিয়ে সাম্প্রতিক আলোচনার পরিপ্রেক্ষিতে গুরুত্বপূর্ণ তথ্য তুলে ধরা হয়েছে।</p><p>এখানে বিস্তারিত বিশ্লেষণ, কারণ, প্রভাব ও ভবিষ্যৎ পথনির্দেশনা সংযুক্ত করা হয়েছে।</p>`,
        featuredImage: itemImage,
        gallery: Array.from({ length: 3 }, (_, galleryIndex) => buildImage(index + galleryIndex + 1, `${category.name_bn}-${galleryIndex + 1}`)),
        category: category.slug,
        subCategory: '',
        tags: [category.name_bn, 'বাংলাদেশ', 'সংবাদ'],
        author: authors[(index + category.order) % authors.length].name,
        status: 'published',
        publishedAt: new Date(Date.now() - (index + 1) * 3600000 * (category.order % 7 + 1)),
        isBreaking: index === 0,
        isFeatured: index < 2,
        isTrending: index < 3,
        homePosition: index + 1,
        division: '',
        district: '',
        upazila: '',
        views: 1000 + index * 150 + category.order * 30,
        seo: {
          title: `${title} | দৈনিক যমুনার কণ্ঠ`,
          description: `${category.name_bn} সম্পর্কিত সর্বশেষ সংবাদ ও বিশ্লেষণ।`,
        },
      });
    }
  }

  await Post.insertMany(posts);

  console.log('Demo content ready:', {
    categories: categories.length,
    authors: authors.length,
    posts: posts.length,
  });

  await mongoose.disconnect();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seedDemoData().catch((err) => {
    console.error(`Demo seeding failed: ${err?.message || 'Unknown error'}`);
    process.exit(1);
  });
}
