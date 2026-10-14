import slugify from 'slugify';

export function generateBanglaSafeSlug(text: string): string {
  const clean = text.trim();
  // If text contains latin characters, slugify standard
  let slug = slugify(clean, { lower: true, strict: true, trim: true });
  // If slug is empty (due to unicode/Bangla characters only)
  if (!slug) {
    slug = clean
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  }
  return slug || `post-${Date.now()}`;
}
