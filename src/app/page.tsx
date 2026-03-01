'use client';

import { useEffect, useRef, useState } from 'react';
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

const GRADE_OPTIONS = [
  { id: 'none',   label: 'No Limit',  desc: 'Any vocabulary',  group: 'school' as const },
  { id: 'grade1', label: 'Grade 1',   desc: '~150 words',      group: 'school' as const },
  { id: 'grade2', label: 'Grade 2',   desc: '~300 words',      group: 'school' as const },
  { id: 'grade3', label: 'Grade 3',   desc: '~500 words',      group: 'school' as const },
  { id: 'grade4', label: 'Grade 4',   desc: '~700 words',      group: 'school' as const },
  { id: 'grade5', label: 'Grade 5',   desc: '~900 words',      group: 'school' as const },
  { id: 'grade6', label: 'Grade 6',   desc: '~1100 words',     group: 'school' as const },
  { id: 'grade7', label: 'Grade 7',   desc: '~1400 words',     group: 'school' as const },
  { id: 'grade8', label: 'Grade 8',   desc: '~1700 words',     group: 'school' as const },
  { id: 'grade9', label: 'Grade 9',   desc: '~2000 words',     group: 'school' as const },
  { id: 'ket',    label: 'KET (A2)',  desc: 'Cambridge A2',    group: 'exam' as const },
  { id: 'pet',    label: 'PET (B1)',  desc: 'Cambridge B1',    group: 'exam' as const },
  { id: 'gre',    label: 'GRE',       desc: 'Academic vocab',  group: 'exam' as const },
];

const SAMPLE_WORDS = ['brave', 'mysterious', 'glimmer', 'ancient', 'enchanted'];

export default function Home() {
  const router = useRouter();
  const [wordInput, setWordInput] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState('enchanted_forest');
  const [difficulty, setDifficulty] = useState('intermediate');
  const [grade, setGrade] = useState('none');
  const [heroName, setHeroName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileMsg, setFileMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill hero name from settings on first render
  useEffect(() => {
    const saved = localStorage.getItem('word-guru-hero-name');
    if (saved) setHeroName(saved);
  }, []);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = (evt.target?.result as string) ?? '';
      const parsed = text
        .split(/\r?\n/)
        .map(l => l.trim().toLowerCase())
        .filter(l => l.length > 0 && /^[a-z][a-z'-]*$/.test(l));
      if (parsed.length === 0) {
        setFileMsg('⚠️ No valid words found in file');
        setTimeout(() => setFileMsg(''), 4000);
        return;
      }
      setWords(prev => {
        const seen = new Set(prev);
        const toAdd = parsed.filter(w => !seen.has(w));
        return [...prev, ...toAdd].slice(0, 10);
      });
      setFileMsg(`✅ ${parsed.length} word${parsed.length !== 1 ? 's' : ''} loaded from file`);
      setTimeout(() => setFileMsg(''), 4000);
    };
    reader.onerror = () => {
      setFileMsg('❌ Could not read file');
      setTimeout(() => setFileMsg(''), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
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
        body: JSON.stringify({ words, theme: selectedTheme, difficulty, grade, heroName: heroName || 'Alex' }),
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
    <main className="min-h-screen pb-safe" style={{ background: 'linear-gradient(135deg, #fef9f0 0%, #f0e6ff 50%, #e6f0ff 100%)' }}>
      {/* Header */}
      <div className="text-center pt-8 sm:pt-10 pb-6 px-4">
        <div className="text-5xl sm:text-6xl mb-3 float-animation inline-block">📖</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2" style={{ color: '#4a1080' }}>
          Word Guru
        </h1>
        <p className="text-base sm:text-lg" style={{ color: '#7c4aa0' }}>
          Learn new words through magical fairy tales! ✨
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-4">
          <Link
            href="/history"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-2xl font-bold text-purple-700 border-2 border-purple-200 bg-white hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm text-sm"
          >
            📚 Story History
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-2xl font-bold text-purple-700 border-2 border-purple-200 bg-white hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm text-sm"
          >
            ⚙️ Settings
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-8 space-y-4 sm:space-y-6">

        {/* Vocabulary Words */}
        <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-6 border-2 border-purple-100">
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
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={words.length >= 10}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-600 text-sm font-semibold hover:bg-purple-100 hover:border-purple-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              📂 Upload from file
            </button>
            {fileMsg && (
              <span className="text-xs text-purple-500 animate-pulse">{fileMsg}</span>
            )}
            {words.length === 0 && !fileMsg && (
              <button
                onClick={() => setWords(SAMPLE_WORDS)}
                className="text-sm text-purple-400 underline hover:text-purple-600"
              >
                ✨ Try sample words
              </button>
            )}
          </div>
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
        <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-6 border-2 border-yellow-100">
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
        <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-6 border-2 border-blue-100">
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
        <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-6 border-2 border-green-100">
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

        {/* Vocabulary Level */}
        <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-6 border-2 border-indigo-100">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#4a1080' }}>🎓 Vocabulary Level</h2>
          <p className="text-sm text-indigo-400 mb-4">Restrict story words to match your learning level</p>

          {/* No Limit */}
          <button
            onClick={() => setGrade('none')}
            className={`w-full mb-4 rounded-2xl p-3 text-center border-2 transition-all ${
              grade === 'none'
                ? 'border-indigo-400 bg-indigo-50 shadow-md'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            }`}
          >
            <span className={`font-bold text-sm ${grade === 'none' ? 'text-indigo-800' : 'text-gray-600'}`}>
              🌟 No Limit — use any vocabulary
            </span>
          </button>

          {/* Junior School grades */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Junior School</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {GRADE_OPTIONS.filter(g => g.group === 'school' && g.id !== 'none').map(g => (
              <button
                key={g.id}
                onClick={() => setGrade(g.id)}
                className={`rounded-xl p-2 text-center border-2 transition-all ${
                  grade === g.id
                    ? 'border-indigo-400 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className={`font-bold text-sm ${grade === g.id ? 'text-indigo-800' : 'text-gray-600'}`}>{g.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{g.desc}</div>
              </button>
            ))}
          </div>

          {/* Exam levels */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Exam Prep</p>
          <div className="flex gap-2">
            {GRADE_OPTIONS.filter(g => g.group === 'exam').map(g => (
              <button
                key={g.id}
                onClick={() => setGrade(g.id)}
                className={`flex-1 rounded-xl p-3 text-center border-2 transition-all ${
                  grade === g.id
                    ? 'border-indigo-400 bg-indigo-50 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className={`font-bold text-sm ${grade === g.id ? 'text-indigo-800' : 'text-gray-600'}`}>{g.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{g.desc}</div>
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
