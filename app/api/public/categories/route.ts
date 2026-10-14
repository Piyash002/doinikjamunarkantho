import { NextResponse } from 'next/server';

import { connectToDatabase } from '@/src/lib/db';
import Category from '@/src/models/Category';

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load categories.',
      },
      { status: 500 }
    );
  }
}
