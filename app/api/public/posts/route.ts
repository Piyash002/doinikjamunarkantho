import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/src/lib/db";
import { postListQuerySchema } from "@/src/lib/validators";
import Post from "@/src/models/Post";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const parsed = postListQuerySchema.safeParse(Object.fromEntries(searchParams.entries()));
    const page = parsed.success ? parsed.data.page : 1;
    const limit = parsed.success ? parsed.data.limit : 12;
    const category = parsed.success ? parsed.data.category : undefined;
    const search = parsed.success ? parsed.data.search : undefined;
    const tag = parsed.success ? parsed.data.tag : undefined;

    const query: Record<string, unknown> = {
      status: "published",
      isDeleted: false,
    };

    if (category) {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      posts,
      total,
      page,
      limit,
      hasMore: page * limit < total,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to fetch posts.",
      },
      { status: 500 }
    );
  }
}
