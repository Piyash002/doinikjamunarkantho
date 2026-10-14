import { NextRequest, NextResponse } from 'next/server';

import { connectToDatabase } from '@/src/lib/db';
import Post from '@/src/models/Post';

export const runtime = 'nodejs';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    await connectToDatabase();

    const post = await Post.findOne({ slug, status: 'published' }).lean();

    if (!post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load post.',
      },
      { status: 500 }
    );
  }
}
