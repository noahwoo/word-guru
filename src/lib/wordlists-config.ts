/**
 * Persistent storage for user-customised grade word lists.
 *
 * Data is stored as a JSON map (gradeId → raw text) in the writable data
 * directory.  On Vercel the directory falls back to /tmp, so changes are
 * ephemeral across cold-starts but still work within a single invocation.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

type CustomWordLists = Record<string, string>; // gradeId → newline-separated text

function resolveDataDir(): string {
  const preferred = path.join(process.cwd(), 'data');
  try {
    fs.mkdirSync(preferred, { recursive: true });
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    return os.tmpdir();
  }
}

const CUSTOM_FILE = path.join(resolveDataDir(), 'wordlists-custom.json');

function readCustom(): CustomWordLists {
  if (!fs.existsSync(CUSTOM_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CUSTOM_FILE, 'utf8')) as CustomWordLists;
  } catch {
    return {};
  }
}

function writeCustom(data: CustomWordLists): void {
  fs.writeFileSync(CUSTOM_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/** Returns the user-saved text for a grade, or null if none exists. */
export function getCustomWordListText(gradeId: string): string | null {
  return readCustom()[gradeId] ?? null;
}

/** Returns true when the user has saved a custom list for this grade. */
export function hasCustomWordList(gradeId: string): boolean {
  return getCustomWordListText(gradeId) !== null;
}

/** Saves a custom word list (raw text, one word per line). */
export function saveCustomWordList(gradeId: string, text: string): void {
  writeCustom({ ...readCustom(), [gradeId]: text });
}

/** Removes the custom word list for a grade, reverting to the built-in file. */
export function deleteCustomWordList(gradeId: string): void {
  const { [gradeId]: _removed, ...rest } = readCustom();
  writeCustom(rest);
}
