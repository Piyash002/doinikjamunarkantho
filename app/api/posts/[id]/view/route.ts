import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/src/lib/db";
import Post from "@/src/models/Post";

export const runtime = "nodejs";

const BOT_USER_AGENT = /bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp|telegrambot|google-inspection/i;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const post = await Post.findById(id, { views: 1, viewCount: 1 }).lean();
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }
    const currentViews = post.views || post.viewCount || 0;
    return NextResponse.json({ views: currentViews, viewCount: currentViews });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to retrieve views." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const cookieName = `post-view-${id}`;
  const userAgent = request.headers.get("user-agent") || "";
  const alreadyViewed = request.cookies.has(cookieName);
  const isBot = !userAgent || BOT_USER_AGENT.test(userAgent);

  try {
    await connectToDatabase();

    // If duplicate view (already has cookie) or bot, return current count without incrementing
    if (alreadyViewed || isBot) {
      const current = await Post.findById(id, { views: 1, viewCount: 1 }).lean();
      const currentViews = current?.views || current?.viewCount || 0;
      return NextResponse.json({ counted: false, views: currentViews, viewCount: currentViews });
    }

    // Atomically increment views and viewCount persistently in database
    const post = await Post.findOneAndUpdate(
      { _id: id, status: "published" },
      { $inc: { views: 1, viewCount: 1 } },
      { new: true, projection: { views: 1, viewCount: 1 } }
    ).lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const currentViews = post.views || post.viewCount || 0;
    const response = NextResponse.json({ counted: true, views: currentViews, viewCount: currentViews });
    response.cookies.set(cookieName, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record post view." },
      { status: 500 }
    );
  }
}

