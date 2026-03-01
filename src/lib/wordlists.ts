import * as fs from 'fs';
import * as path from 'path';
import { findGradeLevel } from '@/lib/grade-meta';
import { getCustomWordListText } from '@/lib/wordlists-config';

export type { GradeLevel } from '@/lib/grade-meta';
export { GRADE_LEVELS, EDITABLE_GRADE_IDS, findGradeLevel } from '@/lib/grade-meta';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Max words included verbatim in the LLM prompt to avoid token bloat. */
const MAX_PROMPT_WORDS = 500;

const WORDLIST_DIR = path.join(process.cwd(), 'wordlists');

/** Module-level cache — reused across warm serverless invocations. */
const cache = new Map<string, string[]>();

function parseWordText(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.trim().toLowerCase())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

/**
 * Loads a word list for the given grade.
 * Priority: user-saved custom list → built-in .txt file.
 */
function loadWordList(gradeId: string): string[] {
  if (cache.has(gradeId)) return cache.get(gradeId)!;

  // 1. Check for a user-customised list
  const customText = getCustomWordListText(gradeId);
  if (customText !== null) {
    const words = parseWordText(customText);
    cache.set(gradeId, words);
    return words;
  }

  // 2. Fall back to the built-in wordlist file
  const filePath = path.join(WORDLIST_DIR, `${gradeId}.txt`);
  try {
    const words = parseWordText(fs.readFileSync(filePath, 'utf8'));
    cache.set(gradeId, words);
    return words;
  } catch {
    throw new Error(`Word list not found for grade "${gradeId}" at ${filePath}`);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Removes the cached word list for a grade so it is re-read on the next call.
 * Call this after saving a custom list via wordlists-config.
 */
export function clearCachedWordList(gradeId: string): void {
  cache.delete(gradeId);
}

/**
 * Builds the word-restriction block to inject into the story prompt.
 * Returns null when gradeId is "none" (no restriction).
 */
export function buildWordListPromptBlock(gradeId: string): string | null {
  if (!gradeId || gradeId === 'none') return null;

  const grade = findGradeLevel(gradeId);
  if (!grade) throw new Error(`Unknown grade id: "${gradeId}"`);

  const words = loadWordList(gradeId);
  const sample = words.slice(0, MAX_PROMPT_WORDS);
  const overflow = words.length > MAX_PROMPT_WORDS
    ? ` ... [${words.length - MAX_PROMPT_WORDS} more words omitted — maintain ${grade.label} vocabulary level throughout]`
    : '';

  return (
    `GRADE VOCABULARY CONSTRAINT (${grade.label} — ${grade.description}):\n` +
    `You MUST only use words from the list below (plus the target vocabulary words). ` +
    `Do NOT use words that are harder or less common than those in this list.\n` +
    `Approved words: ${sample.join(', ')}${overflow}`
  );
}

/** Returns the full word list for a given grade (useful for validation/display). */
export function getWordList(gradeId: string): string[] {
  if (gradeId === 'none') return [];
  return loadWordList(gradeId);
}
