import * as fs from 'fs';
import * as path from 'path';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readAll(): HistoryEntry[] {
  ensureDataDir();
  if (!fs.existsSync(HISTORY_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')) as HistoryEntry[];
  } catch {
    return [];
  }
}

function writeAll(entries: HistoryEntry[]): void {
  ensureDataDir();
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
