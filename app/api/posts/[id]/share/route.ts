import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/src/lib/db";
import Post from "@/src/models/Post";

export const runtime = "nodejs";

const BOT_USER_AGENT = /bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp|telegrambot|google-inspection/i;

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent") || "";
  if (!userAgent || BOT_USER_AGENT.test(userAgent)) {
    return NextResponse.json({ counted: false });
  }

  try {
    await connectToDatabase();
    const cookieName = `post-share-${id}`;
    if (request.cookies.has(cookieName)) {
      const post = await Post.findOne({ _id: id, status: "published" }).select({ shareCount: 1 }).lean();
      if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
      return NextResponse.json({ counted: false, shareCount: post?.shareCount || 0 });
    }

    const post = await Post.findOneAndUpdate(
      { _id: id, status: "published" },
      { $inc: { shareCount: 1 } },
      { new: true, projection: { shareCount: 1, slug: 1, category: 1 } }
    ).lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    revalidatePath(`/${encodeURIComponent(post.category)}/${encodeURIComponent(post.slug)}`);
    const response = NextResponse.json({ counted: true, shareCount: post.shareCount });
    response.cookies.set(cookieName, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record post share." },
      { status: 500 }
    );
  }
}
