'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { HistorySummary } from '@/lib/history';

const THEME_EMOJIS: Record<string, string> = {
  enchanted_forest: '🌲',
  underwater_kingdom: '🐠',
  space_adventure: '🚀',
  dragon_realm: '🐉',
  magical_school: '🧙',
  fairy_garden: '🧚',
};

const DIFFICULTY_STARS: Record<string, string> = {
  beginner: '⭐',
  intermediate: '⭐⭐',
  advanced: '⭐⭐⭐',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [stories, setStories] = useState<HistorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/history')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStories(data);
        } else {
          setError('Could not load history.');
        }
      })
      .catch(() => setError('Could not load history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main
      className="min-h-screen pb-16"
      style={{ background: 'linear-gradient(135deg, #fef9f0 0%, #f0e6ff 50%, #e6f0ff 100%)' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-purple-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-purple-600 font-bold hover:text-purple-800 transition-colors"
        >
          ← New Story
        </button>
        <h1 className="text-lg font-extrabold" style={{ color: '#4a1080' }}>
          📚 Story History
        </h1>
        <div className="w-24" />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-4 fade-in">
        {loading && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 float-animation inline-block">📖</div>
            <p className="text-xl font-bold text-purple-700">Loading history...</p>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center text-red-600 font-medium">
            {error}
          </div>
        )}

        {!loading && !error && stories.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="text-2xl font-extrabold mb-2" style={{ color: '#4a1080' }}>
              No stories yet!
            </h2>
            <p className="text-purple-500 mb-6">Generate your first magical story to see it here.</p>
            <button
              onClick={() => router.push('/')}
              className="px-8 py-3 rounded-2xl font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
            >
              ✨ Create a Story
            </button>
          </div>
        )}

        {!loading && stories.map((story) => (
          <button
            key={story.id}
            onClick={() => router.push(`/story?id=${story.id}`)}
            className="w-full text-left bg-white rounded-3xl shadow-md border-2 border-purple-100 p-5 hover:border-purple-300 hover:shadow-lg transition-all group"
          >
            <div className="flex items-start gap-4">
              {/* Theme emoji */}
              <div className="text-4xl shrink-0 mt-1">
                {THEME_EMOJIS[story.theme] ?? '📖'}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title + difficulty */}
                <div className="flex items-center gap-2 mb-1">
                  <h2
                    className="text-lg font-extrabold truncate group-hover:text-purple-700 transition-colors"
                    style={{ color: '#4a1080' }}
                  >
                    {story.title}
                  </h2>
                  <span className="text-sm shrink-0">
                    {DIFFICULTY_STARS[story.difficulty] ?? ''}
                  </span>
                </div>

                {/* Date */}
                <p className="text-xs text-gray-400 mb-3">{formatDate(story.createdAt)}</p>

                {/* Word tags */}
                <div className="flex flex-wrap gap-1">
                  {story.words.map((w) => (
                    <span key={w} className="word-tag text-xs py-0.5 px-2">
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="text-purple-300 group-hover:text-purple-600 transition-colors text-xl shrink-0 mt-1">
                →
              </div>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
