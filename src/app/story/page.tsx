'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface VocabEntry {
  stems?: string;        // e.g. "en·chant·ed"
  construction?: string; // e.g. "en- (into) + chant (sing) + -ed (past tense)"
  definition: string;
  example: string;
}

interface StoryData {
  id?: string;
  title: string;
  story: string;
  vocabulary: Record<string, VocabEntry>;
  words: string[];
  theme: string;
  difficulty?: string;
}

interface TooltipState {
  word: string;
  // Viewport coordinates (from getBoundingClientRect — do NOT add scrollY)
  x: number;
  y: number;
}

function parseStory(
  story: string,
  vocabulary: Record<string, VocabEntry>,
  onWordClick: (word: string, x: number, y: number) => void
) {
  const parts = story.split(/(\[\[[\w'-]+\]\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[\[([\w'-]+)\]\]$/);
    if (match) {
      const word = match[1].toLowerCase();
      const isVocab = word in vocabulary;
      return (
        <span
          key={i}
          className={isVocab ? 'story-word' : 'font-semibold text-amber-700'}
          onClick={
            isVocab
              ? (e) => {
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  // Use viewport coords only — tooltip is position:fixed
                  onWordClick(word, rect.left + rect.width / 2, rect.bottom);
                }
              : undefined
          }
        >
          {match[1]}
        </span>
      );
    }
    return part.split('\n').map((line, j) =>
      j === 0 ? (
        <span key={`${i}-${j}`}>{line}</span>
      ) : (
        <span key={`${i}-${j}`}>
          <br />
          <br />
          {line}
        </span>
      )
    );
  });
}

function StoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const historyId = searchParams.get('id');

  const [data, setData] = useState<StoryData | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [collectedWords, setCollectedWords] = useState<Set<string>>(new Set());
  const [loadError, setLoadError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Detect mobile viewport
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load story data
  useEffect(() => {
    if (historyId) {
      fetch(`/api/history/${historyId}`)
        .then((r) => {
          if (!r.ok) throw new Error('Not found');
          return r.json();
        })
        .then((d: StoryData) => setData(d))
        .catch(() => setLoadError('Could not load this story.'));
      return;
    }

    const raw = sessionStorage.getItem('story-data');
    if (!raw) {
      router.replace('/');
      return;
    }
    try {
      setData(JSON.parse(raw));
    } catch {
      router.replace('/');
    }
  }, [historyId, router]);

  // Dismiss tooltip on outside tap / click
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip(null);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  const handleWordClick = (word: string, x: number, y: number) => {
    setTooltip((prev) => (prev?.word === word ? null : { word, x, y }));
    setCollectedWords((prev) => new Set([...prev, word]));
  };

  const handleBack = () => {
    router.push(historyId ? '/history' : '/');
  };

  // ── Loading / error states ────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #fef9f0, #f0e6ff)' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">😔</div>
          <p className="text-xl font-bold text-purple-700 mb-4">{loadError}</p>
          <button
            onClick={() => router.push('/history')}
            className="px-6 py-3 rounded-2xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
          >
            ← Back to History
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #fef9f0, #f0e6ff)' }}>
        <div className="text-center">
          <div className="text-5xl mb-4 float-animation inline-block">📖</div>
          <p className="text-xl font-bold text-purple-700">Loading your story...</p>
        </div>
      </div>
    );
  }

  const vocabList = Object.entries(data.vocabulary);

  // ── Tooltip content (shared between mobile sheet and desktop popup) ───────

  const tooltipContent = tooltip && data.vocabulary[tooltip.word] && (() => {
    const info = data.vocabulary[tooltip.word];
    return (
      <>
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-lg font-extrabold text-amber-700 capitalize">{tooltip.word}</h3>
            {info.stems && (
              <p className="text-xs font-mono text-indigo-500 tracking-widest mt-0.5">{info.stems}</p>
            )}
          </div>
          <button
            onClick={() => setTooltip(null)}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none ml-3 mt-0.5 p-1"
          >
            ×
          </button>
        </div>
        {info.construction && (
          <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-2 py-1.5 mb-2">
            {info.construction}
          </p>
        )}
        <p className="text-sm text-gray-700 mb-2">
          <span className="font-semibold text-purple-700">Definition: </span>
          {info.definition}
        </p>
        <p className="text-sm text-gray-600 bg-amber-50 rounded-xl p-2">
          <span className="font-semibold text-amber-700">Example: </span>
          {info.example}
        </p>
      </>
    );
  })();

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen pb-safe" style={{ background: 'linear-gradient(135deg, #fef9f0 0%, #f0e6ff 50%, #e6f0ff 100%)' }}>

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-purple-100 shadow-sm px-4 py-3 flex items-center justify-between pt-safe">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-purple-600 font-bold text-sm sm:text-base"
        >
          {historyId ? '← History' : '← New Story'}
        </button>
        <div className="text-xs sm:text-sm font-semibold text-purple-500">
          📚 {collectedWords.size}/{vocabList.length} collected
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 pt-6 sm:pt-8 space-y-5 sm:space-y-6 fade-in pb-8">

        {/* Story title */}
        <div className="text-center px-2">
          <div className="text-3xl sm:text-4xl mb-3 sparkle-animation inline-block">✨</div>
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#4a1080' }}>{data.title}</h1>
          <p className="text-xs sm:text-sm text-purple-400 mt-2">
            Tap the <span className="story-word px-1">golden words</span> to learn their meaning!
          </p>
        </div>

        {/* Story text */}
        <div className="bg-white rounded-3xl shadow-lg p-5 sm:p-8 border-2 border-purple-100 relative">
          <div className="story-text">
            {parseStory(data.story, data.vocabulary, handleWordClick)}
          </div>
        </div>

        {/* ── Mobile bottom-sheet tooltip ────────────────────────────────── */}
        {tooltip && isMobile && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setTooltip(null)}
            />
            {/* Sheet */}
            <div
              ref={tooltipRef}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t-2 border-amber-300 px-5 pt-4 pb-safe slide-up"
              style={{ paddingBottom: `max(env(safe-area-inset-bottom, 16px), 16px)` }}
            >
              {/* Drag handle hint */}
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              {tooltipContent}
            </div>
          </>
        )}

        {/* ── Desktop floating tooltip ───────────────────────────────────── */}
        {tooltip && !isMobile && (
          <div
            ref={tooltipRef}
            className="fixed z-50 bg-white rounded-2xl shadow-2xl border-2 border-amber-300 p-5 w-72 fade-in"
            style={{
              top:  Math.min(tooltip.y + 8,  window.innerHeight - 300),
              left: Math.max(8, Math.min(tooltip.x - 144, window.innerWidth - 296)),
            }}
          >
            {tooltipContent}
          </div>
        )}

        {/* Vocabulary treasure chest */}
        <div className="bg-white rounded-3xl shadow-lg p-5 sm:p-6 border-2 border-yellow-200">
          <h2 className="text-lg sm:text-xl font-extrabold mb-1" style={{ color: '#4a1080' }}>🏆 Vocabulary Treasure Chest</h2>
          <p className="text-xs sm:text-sm text-yellow-600 mb-4">Tap the golden words in the story to collect them!</p>
          <div className="space-y-3">
            {vocabList.map(([word, info]) => {
              const collected = collectedWords.has(word);
              return (
                <div
                  key={word}
                  className={`rounded-2xl p-4 border-2 transition-all ${
                    collected ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{collected ? '⭐' : '🔒'}</span>
                    <div>
                      <span className={`font-extrabold capitalize text-base ${collected ? 'text-amber-700' : 'text-gray-500'}`}>
                        {word}
                      </span>
                      {collected && info.stems && (
                        <p className="text-xs font-mono text-indigo-500 tracking-widest leading-tight">
                          {info.stems}
                        </p>
                      )}
                    </div>
                  </div>
                  {collected ? (
                    <div>
                      {info.construction && (
                        <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-2 py-1 mb-1">
                          {info.construction}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 mb-1">{info.definition}</p>
                      <p className="text-xs text-amber-600 italic">&quot;{info.example}&quot;</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Tap this word in the story to unlock! ✨</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion banner */}
        {collectedWords.size === vocabList.length && vocabList.length > 0 && (
          <div
            className="rounded-3xl p-6 text-center text-white shadow-xl fade-in"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
          >
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl sm:text-2xl font-extrabold mb-2">Amazing! You collected all the words!</h2>
            <p className="text-purple-200 mb-4">You&apos;re a true Word Guru! ✨</p>
            <button
              onClick={() => router.push('/')}
              className="bg-white text-purple-700 font-bold px-6 py-3 rounded-2xl hover:bg-purple-50 transition-colors"
            >
              Create Another Story →
            </button>
          </div>
        )}

        {collectedWords.size < vocabList.length && (
          <button
            onClick={handleBack}
            className="w-full py-3 rounded-2xl font-bold text-purple-600 border-2 border-purple-200 hover:bg-purple-50 transition-colors"
          >
            {historyId ? '← Back to History' : '← Create a New Story'}
          </button>
        )}
      </div>
    </main>
  );
}

export default function StoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #fef9f0, #f0e6ff)' }}>
          <div className="text-center">
            <div className="text-5xl mb-4 float-animation inline-block">📖</div>
            <p className="text-xl font-bold text-purple-700">Loading...</p>
          </div>
        </div>
      }
    >
      <StoryContent />
    </Suspense>
  );
}
