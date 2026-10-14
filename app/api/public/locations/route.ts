import { NextResponse } from 'next/server';

import { getLocationOptions } from '@/src/data/bangladeshLocations';

export async function GET() {
  return NextResponse.json({ locations: getLocationOptions() });
}
