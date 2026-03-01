import * as fs from 'fs';
import * as path from 'path';

export interface GradeLevel {
  id: string;
  label: string;
  description: string;
  group: 'school' | 'exam';
}

export const GRADE_LEVELS: GradeLevel[] = [
  { id: 'none',   label: 'No Limit',  description: 'No vocabulary restriction',           group: 'school' },
  { id: 'grade1', label: 'Grade 1',   description: 'Junior school — grade 1 (~150 words)', group: 'school' },
  { id: 'grade2', label: 'Grade 2',   description: 'Junior school — grade 2 (~300 words)', group: 'school' },
  { id: 'grade3', label: 'Grade 3',   description: 'Junior school — grade 3 (~500 words)', group: 'school' },
  { id: 'grade4', label: 'Grade 4',   description: 'Junior school — grade 4 (~700 words)', group: 'school' },
  { id: 'grade5', label: 'Grade 5',   description: 'Junior school — grade 5 (~900 words)', group: 'school' },
  { id: 'grade6', label: 'Grade 6',   description: 'Junior school — grade 6 (~1100 words)', group: 'school' },
  { id: 'grade7', label: 'Grade 7',   description: 'Junior school — grade 7 (~1400 words)', group: 'school' },
  { id: 'grade8', label: 'Grade 8',   description: 'Junior school — grade 8 (~1700 words)', group: 'school' },
  { id: 'grade9', label: 'Grade 9',   description: 'Junior school — grade 9 (~2000 words)', group: 'school' },
  { id: 'ket',    label: 'KET (A2)',  description: 'Cambridge Key English Test',            group: 'exam' },
  { id: 'pet',    label: 'PET (B1)',  description: 'Cambridge Preliminary English Test',    group: 'exam' },
  { id: 'gre',    label: 'GRE',       description: 'Graduate Record Examination',           group: 'exam' },
];

/** Max words included verbatim in the LLM prompt to avoid token bloat. */
const MAX_PROMPT_WORDS = 500;

const WORDLIST_DIR = path.join(process.cwd(), 'wordlists');

/** Module-level cache — reused across warm serverless invocations. */
const cache = new Map<string, string[]>();

function loadWordList(gradeId: string): string[] {
  if (cache.has(gradeId)) return cache.get(gradeId)!;

  const filePath = path.join(WORDLIST_DIR, `${gradeId}.txt`);
  try {
    const words = fs
      .readFileSync(filePath, 'utf8')
      .split('\n')
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.length > 0 && !line.startsWith('#'));
    cache.set(gradeId, words);
    return words;
  } catch {
    throw new Error(`Word list file not found for grade "${gradeId}" at ${filePath}`);
  }
}

/**
 * Returns the grade metadata or undefined when the id is unknown.
 */
export function findGradeLevel(id: string): GradeLevel | undefined {
  return GRADE_LEVELS.find((g) => g.id === id);
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
  const suffix =
    words.length > MAX_PROMPT_WORDS
      ? ` ... [${words.length - MAX_PROMPT_WORDS} more words omitted — maintain ${grade.label} vocabulary level throughout]`
      : '';

  return (
    `GRADE VOCABULARY CONSTRAINT (${grade.label} — ${grade.description}):\n` +
    `You MUST only use words from the list below (plus the target vocabulary words). ` +
    `Do NOT use words that are harder or less common than those in this list.\n` +
    `Approved words: ${sample.join(', ')}${suffix}`
  );
}

/** Returns the full word list for a given grade (useful for validation). */
export function getWordList(gradeId: string): string[] {
  if (gradeId === 'none') return [];
  return loadWordList(gradeId);
}
