import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/src/lib/db";
import Post from "@/src/models/Post";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";

    const query: Record<string, unknown> = {
      status: "published",
    };

    if (category) {
      query.category = category;
    }

    const [featured, latest] = await Promise.all([
      Post.find({ ...query, isFeatured: true }).sort({ publishedAt: -1 }).limit(4).lean(),
      Post.find(query).sort({ publishedAt: -1 }).limit(8).lean(),
    ]);

    return NextResponse.json({ featured, latest });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load homepage data.",
      },
      { status: 500 }
    );
  }
}
