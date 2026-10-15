import fs from 'node:fs';
import path from 'node:path';

const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key) process.env[key] = rest.join('=');
  }
}

import { connectToDatabase } from '../src/lib/db.js';
import Post from '../src/models/Post.js';

async function inspectViews() {
  await connectToDatabase();
  console.log('Connected to DB');

  const posts = await Post.find({ isDeleted: false }).select('title slug views viewCount publishedAt createdAt').lean();
  console.log(`Total posts found: ${posts.length}`);

  let sumViews = 0;
  let sumViewCount = 0;
  posts.forEach((p, idx) => {
    sumViews += (p.views || 0);
    sumViewCount += (p.viewCount || 0);
    console.log(`- [${p.slug}] views=${p.views}, viewCount=${p.viewCount}, publishedAt=${p.publishedAt}, createdAt=${p.createdAt}, title=${p.title?.substring(0, 30)}`);
  });

  console.log(`=== Total Sum of views: ${sumViews} ===`);
  console.log(`=== Total Sum of viewCount: ${sumViewCount} ===`);

  const agg = await Post.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: null, totalViews: { $sum: '$views' }, totalViewCount: { $sum: '$viewCount' } } },
  ]);
  console.log('Aggregate result:', agg);

  process.exit(0);
}

inspectViews().catch((err) => {
  console.error('Error inspecting views:', err);
  process.exit(1);
});
