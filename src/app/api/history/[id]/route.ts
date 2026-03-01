import { NextResponse } from 'next/server';
import { getStory } from '@/lib/history';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const story = getStory(id);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    return NextResponse.json(story);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load story';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
