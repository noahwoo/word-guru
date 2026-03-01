import * as fs from 'fs';
import * as path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { EDITABLE_GRADE_IDS } from '@/lib/grade-meta';
import {
  getCustomWordListText,
  hasCustomWordList,
  saveCustomWordList,
  deleteCustomWordList,
} from '@/lib/wordlists-config';
import { clearCachedWordList } from '@/lib/wordlists';

export const dynamic = 'force-dynamic';

const WORDLIST_DIR = path.join(process.cwd(), 'wordlists');

function builtInText(gradeId: string): string | null {
  try {
    return fs.readFileSync(path.join(WORDLIST_DIR, `${gradeId}.txt`), 'utf8');
  } catch {
    return null;
  }
}

function wordCount(text: string): number {
  return text
    .split('\n')
    .filter(l => l.trim().length > 0 && !l.trim().startsWith('#'))
    .length;
}

/** GET /api/wordlists/[grade] — returns current word list text and metadata */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ grade: string }> }
) {
  const { grade } = await params;
  if (!EDITABLE_GRADE_IDS.has(grade)) {
    return NextResponse.json({ error: 'Unknown grade' }, { status: 404 });
  }

  const customText = getCustomWordListText(grade);
  if (customText !== null) {
    return NextResponse.json({ text: customText, isCustom: true, wordCount: wordCount(customText) });
  }

  const built = builtInText(grade);
  if (built === null) {
    return NextResponse.json({ error: 'Built-in word list not found' }, { status: 404 });
  }
  return NextResponse.json({ text: built, isCustom: false, wordCount: wordCount(built) });
}

/** PUT /api/wordlists/[grade] — saves a custom word list */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ grade: string }> }
) {
  const { grade } = await params;
  if (!EDITABLE_GRADE_IDS.has(grade)) {
    return NextResponse.json({ error: 'Unknown grade' }, { status: 404 });
  }

  const body = await req.json();
  if (typeof body?.text !== 'string') {
    return NextResponse.json({ error: '"text" field required' }, { status: 400 });
  }

  saveCustomWordList(grade, body.text);
  clearCachedWordList(grade);

  return NextResponse.json({ success: true, wordCount: wordCount(body.text) });
}

/** DELETE /api/wordlists/[grade] — removes the custom list, reverting to built-in */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ grade: string }> }
) {
  const { grade } = await params;
  if (!EDITABLE_GRADE_IDS.has(grade)) {
    return NextResponse.json({ error: 'Unknown grade' }, { status: 404 });
  }

  if (!hasCustomWordList(grade)) {
    return NextResponse.json({ success: true, alreadyDefault: true });
  }

  deleteCustomWordList(grade);
  clearCachedWordList(grade);

  return NextResponse.json({ success: true });
}
