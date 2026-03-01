import { NextResponse } from 'next/server';
import { listStories } from '@/lib/history';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stories = listStories();
    return NextResponse.json(stories);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
