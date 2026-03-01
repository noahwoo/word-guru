'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const THEMES = [
  { id: 'enchanted_forest', label: 'Enchanted Forest', emoji: '🌲', border: 'border-green-400', bg: 'bg-green-50' },
  { id: 'underwater_kingdom', label: 'Underwater Kingdom', emoji: '🐠', border: 'border-blue-400', bg: 'bg-blue-50' },
  { id: 'space_adventure', label: 'Space Adventure', emoji: '🚀', border: 'border-purple-400', bg: 'bg-purple-50' },
  { id: 'dragon_realm', label: 'Dragon Realm', emoji: '🐉', border: 'border-red-400', bg: 'bg-red-50' },
  { id: 'magical_school', label: 'Magical School', emoji: '🧙', border: 'border-yellow-400', bg: 'bg-yellow-50' },
  { id: 'fairy_garden', label: 'Fairy Garden', emoji: '🧚', border: 'border-pink-400', bg: 'bg-pink-50' },
];

const DIFFICULTIES = [
  { id: 'beginner', label: 'Beginner', emoji: '⭐', desc: 'Simple & short' },
  { id: 'intermediate', label: 'Intermediate', emoji: '⭐⭐', desc: 'Medium story' },
  { id: 'advanced', label: 'Advanced', emoji: '⭐⭐⭐', desc: 'Rich & detailed' },
];

const SAMPLE_WORDS = ['brave', 'mysterious', 'glimmer', 'ancient', 'enchanted'];

export default function Home() {
  const router = useRouter();
  const [wordInput, setWordInput] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('enchanted_forest');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [heroName, setHeroName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const addWord = () => {
    const trimmed = wordInput.trim().toLowerCase();
    if (trimmed && !words.includes(trimmed) && words.length < 10) {
      setWords([...words, trimmed]);
      setWordInput('');
    }
  };

  const removeWord = (w: string) => setWords(words.filter(x => x !== w));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addWord();
  };

  const generateStory = async () => {
    if (words.length < 2) {
      setError('Please add at least 2 words to begin! ✨');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words, theme: selectedTheme, difficulty, heroName: heroName || 'Alex' }),
      });
      if (!res.ok) throw new Error('Failed to generate story');
      const data = await res.json();
      sessionStorage.setItem('story-data', JSON.stringify(data));
      router.push('/story');
    } catch {
      setError('Oops! The magic spell fizzled. Please try again! 🪄');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg, #fef9f0 0%, #f0e6ff 50%, #e6f0ff 100%)' }}>
      {/* Header */}
      <div className="text-center pt-10 pb-6 px-4">
        <div className="text-6xl mb-3 float-animation inline-block">📖</div>
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: '#4a1080' }}>
          Word Guru
        </h1>
        <p className="text-lg" style={{ color: '#7c4aa0' }}>
          Learn new words through magical fairy tales! ✨
        </p>
        <Link
          href="/history"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-2xl font-bold text-purple-700 border-2 border-purple-200 bg-white hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm text-sm"
        >
          📚 Story History
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16 space-y-6">

        {/* Vocabulary Words */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-purple-100">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#4a1080' }}>📝 Your Vocabulary Words</h2>
          <p className="text-sm text-purple-400 mb-4">Add 2–10 words you want to learn</p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={wordInput}
              onChange={e => setWordInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a word and press Enter..."
              className="flex-1 px-4 py-2 rounded-xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none text-purple-900 font-medium"
            />
            <button
              onClick={addWord}
              disabled={!wordInput.trim() || words.length >= 10}
              className="px-5 py-2 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
            >
              Add
            </button>
          </div>
          {words.length === 0 && (
            <button
              onClick={() => setWords(SAMPLE_WORDS)}
              className="text-sm text-purple-400 underline hover:text-purple-600 mb-3 block"
            >
              ✨ Try sample words
            </button>
          )}
          <div className="flex flex-wrap gap-1 min-h-[40px]">
            {words.map(w => (
              <span key={w} className="word-tag">
                {w}
                <button onClick={() => removeWord(w)} className="ml-1 text-purple-400 hover:text-red-500 font-bold">×</button>
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">{words.length}/10 words added</p>
        </div>

        {/* Hero Name */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-yellow-100">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#4a1080' }}>🦸 Your Hero&apos;s Name</h2>
          <p className="text-sm text-yellow-500 mb-3">Name the main character of your story</p>
          <input
            type="text"
            value={heroName}
            onChange={e => setHeroName(e.target.value)}
            placeholder="Alex (default)"
            maxLength={20}
            className="w-full px-4 py-2 rounded-xl border-2 border-yellow-200 focus:border-yellow-400 focus:outline-none text-purple-900 font-medium"
          />
        </div>

        {/* Story Theme */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-blue-100">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#4a1080' }}>🗺️ Choose Your Story World</h2>
          <p className="text-sm text-blue-400 mb-4">Pick the setting for your fairy tale</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`theme-card rounded-2xl p-4 text-left border-2 ${
                  selectedTheme === theme.id
                    ? `${theme.border} ${theme.bg} shadow-md`
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-3xl mb-1">{theme.emoji}</div>
                <div className={`font-bold text-sm ${selectedTheme === theme.id ? 'text-gray-800' : 'text-gray-500'}`}>
                  {theme.label}
                </div>
                {selectedTheme === theme.id && (
                  <div className="text-xs text-green-600 font-semibold mt-1">✓ Selected</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-green-100">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#4a1080' }}>📊 Story Difficulty</h2>
          <p className="text-sm text-green-500 mb-4">How challenging should the story be?</p>
          <div className="flex gap-3">
            {DIFFICULTIES.map(d => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`flex-1 rounded-2xl p-3 text-center border-2 transition-all ${
                  difficulty === d.id
                    ? 'border-green-400 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="text-lg mb-1">{d.emoji}</div>
                <div className={`font-bold text-sm ${difficulty === d.id ? 'text-green-800' : 'text-gray-600'}`}>
                  {d.label}
                </div>
                <div className="text-xs text-gray-400 mt-1">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-red-600 text-center font-medium">
            {error}
          </div>
        )}

        <button
          onClick={generateStory}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl font-extrabold text-xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
          style={{ background: isLoading ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #db2777)' }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Weaving your fairy tale...
            </span>
          ) : '✨ Generate My Story!'}
        </button>
      </div>
    </main>
  );
}
