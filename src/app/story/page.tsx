'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface VocabEntry {
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
                  onWordClick(word, rect.left + rect.width / 2, rect.bottom + window.scrollY);
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
  const tooltipRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleWordClick = (word: string, x: number, y: number) => {
    setTooltip((prev) => (prev?.word === word ? null : { word, x, y }));
    setCollectedWords((prev) => new Set([...prev, word]));
  };

  const handleBack = () => {
    if (historyId) {
      router.push('/history');
    } else {
      router.push('/');
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef9f0, #f0e6ff)' }}>
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef9f0, #f0e6ff)' }}>
        <div className="text-center">
          <div className="text-5xl mb-4 float-animation inline-block">📖</div>
          <p className="text-xl font-bold text-purple-700">Loading your story...</p>
        </div>
      </div>
    );
  }

  const vocabList = Object.entries(data.vocabulary);

  return (
    <main className="min-h-screen pb-16" style={{ background: 'linear-gradient(135deg, #fef9f0 0%, #f0e6ff 50%, #e6f0ff 100%)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-purple-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-purple-600 font-bold hover:text-purple-800 transition-colors"
        >
          {historyId ? '← History' : '← New Story'}
        </button>
        <div className="text-sm font-semibold text-purple-500">
          📚 {collectedWords.size}/{vocabList.length} words collected
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6 fade-in">

        {/* Story Title */}
        <div className="text-center">
          <div className="text-4xl mb-3 sparkle-animation inline-block">✨</div>
          <h1 className="text-3xl font-extrabold" style={{ color: '#4a1080' }}>{data.title}</h1>
          <p className="text-sm text-purple-400 mt-2">
            Tap the <span className="story-word text-xs px-1">golden words</span> to learn their meaning!
          </p>
        </div>

        {/* Story Text */}
        <div className="bg-white rounded-3xl shadow-lg p-8 border-2 border-purple-100 relative">
          <div className="story-text">
            {parseStory(data.story, data.vocabulary, handleWordClick)}
          </div>
        </div>

        {/* Word Tooltip */}
        {tooltip && data.vocabulary[tooltip.word] && (
          <div
            ref={tooltipRef}
            className="fixed z-50 bg-white rounded-2xl shadow-2xl border-2 border-amber-300 p-5 max-w-xs w-72 fade-in"
            style={{
              top: Math.min(tooltip.y + 8, window.innerHeight - 200),
              left: Math.max(8, Math.min(tooltip.x - 144, window.innerWidth - 300)),
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-extrabold text-amber-700 capitalize">{tooltip.word}</h3>
              <button onClick={() => setTooltip(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">×</button>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-semibold text-purple-700">Definition: </span>
              {data.vocabulary[tooltip.word].definition}
            </p>
            <p className="text-sm text-gray-600 bg-amber-50 rounded-xl p-2">
              <span className="font-semibold text-amber-700">Example: </span>
              {data.vocabulary[tooltip.word].example}
            </p>
          </div>
        )}

        {/* Vocabulary Treasure Chest */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-yellow-200">
          <h2 className="text-xl font-extrabold mb-1" style={{ color: '#4a1080' }}>🏆 Vocabulary Treasure Chest</h2>
          <p className="text-sm text-yellow-600 mb-4">Click the golden words in the story to collect them!</p>
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
                    <span className={`font-extrabold capitalize text-base ${collected ? 'text-amber-700' : 'text-gray-500'}`}>
                      {word}
                    </span>
                  </div>
                  {collected ? (
                    <div>
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

        {/* Completion Banner */}
        {collectedWords.size === vocabList.length && vocabList.length > 0 && (
          <div
            className="rounded-3xl p-6 text-center text-white shadow-xl fade-in"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
          >
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-2xl font-extrabold mb-2">Amazing! You collected all the words!</h2>
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
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fef9f0, #f0e6ff)' }}>
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
