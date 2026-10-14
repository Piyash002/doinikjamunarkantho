import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectToDatabase } from "@/src/lib/db";
import Post from "@/src/models/Post";

export const runtime = "nodejs";

const BOT_USER_AGENT = /bot|crawler|spider|slurp|preview|facebookexternalhit|whatsapp|telegrambot|google-inspection/i;

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid post id." }, { status: 400 });
  }

  const cookieName = `post-view-${id}`;
  const userAgent = request.headers.get("user-agent") || "";
  if (request.cookies.has(cookieName) || !userAgent || BOT_USER_AGENT.test(userAgent)) {
    return NextResponse.json({ counted: false });
  }

  try {
    await connectToDatabase();
    const post = await Post.findOneAndUpdate(
      { _id: id, status: "published" },
      [{
        $set: {
          views: { $add: [{ $ifNull: ["$views", 0] }, 1] },
          viewCount: { $add: [{ $ifNull: ["$views", 0] }, 1] },
        },
      }],
      { new: true, projection: { views: 1, viewCount: 1 } }
    ).lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    const response = NextResponse.json({ counted: true, views: post.views, viewCount: post.viewCount });
    response.cookies.set(cookieName, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record post view." },
      { status: 500 }
    );
  }
}
