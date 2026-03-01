import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface VocabEntry {
  definition: string;
  example: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  title: string;
  words: string[];
  theme: string;
  difficulty: string;
  story: string;
  vocabulary: Record<string, VocabEntry>;
}

export type HistorySummary = Omit<HistoryEntry, 'story' | 'vocabulary'>;

/**
 * Resolve a writable data directory.
 * On Vercel (read-only filesystem) fall back to /tmp so the app
 * can still run — note that /tmp is ephemeral across invocations.
 */
function resolveDataDir(): string {
  const preferred = path.join(process.cwd(), 'data');
  try {
    fs.mkdirSync(preferred, { recursive: true });
    // quick write-access probe
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    return os.tmpdir();
  }
}

const HISTORY_FILE = path.join(resolveDataDir(), 'history.json');

function readAll(): HistoryEntry[] {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) as HistoryEntry[];
  } catch {
    return [];
  }
}

function writeAll(entries: HistoryEntry[]): void {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(entries, null, 2), 'utf8');
}

export function saveStory(
  entry: Omit<HistoryEntry, 'id' | 'createdAt'>
): HistoryEntry {
  const full: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  writeAll([full, ...readAll()]);
  return full;
}

export function listStories(): HistorySummary[] {
  return readAll().map(({ id, createdAt, title, words, theme, difficulty }) => ({
    id,
    createdAt,
    title,
    words,
    theme,
    difficulty,
  }));
}

export function getStory(id: string): HistoryEntry | null {
  return readAll().find((e) => e.id === id) ?? null;
}
