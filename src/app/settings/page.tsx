'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { GRADE_LEVELS } from '@/lib/grade-meta';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ListState {
  text: string;
  isCustom: boolean;
  wordCount: number;
  loading: boolean;
  saving: boolean;
  msg: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HERO_NAME_KEY = 'word-guru-hero-name';
const EDITABLE_GRADES = GRADE_LEVELS.filter(g => g.id !== 'none');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return text
    .split('\n')
    .filter(l => l.trim().length > 0 && !l.trim().startsWith('#'))
    .length;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  // -- Hero name ---
  const [heroName, setHeroName] = useState('');
  const [heroMsg, setHeroMsg] = useState('');

  // -- Word lists --
  const [openGrade, setOpenGrade] = useState<string | null>(null);
  const [listData, setListData] = useState<Record<string, ListState>>({});

  const uploadRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load saved hero name from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(HERO_NAME_KEY);
    if (saved) setHeroName(saved);
  }, []);

  // -------------------------------------------------------------------------
  // Hero name handlers
  // -------------------------------------------------------------------------

  const saveHeroName = () => {
    localStorage.setItem(HERO_NAME_KEY, heroName.trim());
    setHeroMsg('✅ Saved!');
    setTimeout(() => setHeroMsg(''), 3000);
  };

  // -------------------------------------------------------------------------
  // Word list handlers
  // -------------------------------------------------------------------------

  const patchList = (gradeId: string, patch: Partial<ListState>) =>
    setListData(prev => ({
      ...prev,
      [gradeId]: { ...prev[gradeId], ...patch },
    }));

  const fetchList = async (gradeId: string) => {
    patchList(gradeId, { loading: true, msg: '' });
    try {
      const res = await fetch(`/api/wordlists/${gradeId}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json() as { text: string; isCustom: boolean; wordCount: number };
      patchList(gradeId, {
        text: data.text,
        isCustom: data.isCustom,
        wordCount: data.wordCount,
        loading: false,
      });
    } catch {
      patchList(gradeId, { loading: false, msg: '❌ Failed to load word list' });
    }
  };

  const toggleGrade = async (gradeId: string) => {
    if (openGrade === gradeId) {
      setOpenGrade(null);
      return;
    }
    setOpenGrade(gradeId);
    if (listData[gradeId]?.text !== undefined && !listData[gradeId]?.loading) return;
    await fetchList(gradeId);
  };

  const handleTextChange = (gradeId: string, text: string) =>
    patchList(gradeId, { text, wordCount: countWords(text) });

  const saveWordList = async (gradeId: string) => {
    patchList(gradeId, { saving: true, msg: '' });
    try {
      const res = await fetch(`/api/wordlists/${gradeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: listData[gradeId].text }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json() as { wordCount: number };
      patchList(gradeId, { saving: false, isCustom: true, wordCount: data.wordCount, msg: '✅ Saved!' });
      setTimeout(() => patchList(gradeId, { msg: '' }), 3000);
    } catch {
      patchList(gradeId, { saving: false, msg: '❌ Save failed' });
    }
  };

  const resetWordList = async (gradeId: string) => {
    patchList(gradeId, { saving: true, msg: '' });
    try {
      await fetch(`/api/wordlists/${gradeId}`, { method: 'DELETE' });
      // Re-fetch the built-in version
      const res = await fetch(`/api/wordlists/${gradeId}`);
      if (!res.ok) throw new Error();
      const data = await res.json() as { text: string; isCustom: boolean; wordCount: number };
      patchList(gradeId, {
        text: data.text,
        isCustom: false,
        wordCount: data.wordCount,
        saving: false,
        msg: '✅ Reset to built-in list',
      });
      setTimeout(() => patchList(gradeId, { msg: '' }), 3000);
    } catch {
      patchList(gradeId, { saving: false, msg: '❌ Reset failed' });
    }
  };

  const handleFileUpload = (gradeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const text = (evt.target?.result as string) ?? '';
      handleTextChange(gradeId, text);
      patchList(gradeId, { msg: '📂 File loaded — click Save to apply' });
      setTimeout(() => patchList(gradeId, { msg: '' }), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <main
      className="min-h-screen pb-safe"
      style={{ background: 'linear-gradient(135deg, #fef9f0 0%, #f0e6ff 50%, #e6f0ff 100%)' }}
    >
      {/* Header */}
      <div className="text-center pt-8 sm:pt-10 pb-6 px-4">
        <div className="text-5xl mb-3">⚙️</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: '#4a1080' }}>Settings</h1>
        <p className="text-sm mb-4" style={{ color: '#7c4aa0' }}>Configure your Word Guru experience</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-2xl font-bold text-purple-700 border-2 border-purple-200 bg-white hover:bg-purple-50 hover:border-purple-400 transition-all shadow-sm text-sm"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-8 space-y-4 sm:space-y-6">

        {/* ── Hero / Role Name ─────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-6 border-2 border-yellow-100">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#4a1080' }}>🦸 Default Hero Name</h2>
          <p className="text-sm text-yellow-500 mb-4">
            Pre-filled as the story hero for every new story. You can still override it per story.
          </p>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={heroName}
              onChange={e => setHeroName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveHeroName()}
              placeholder="Alex (default)"
              maxLength={20}
              className="flex-1 px-4 py-2 rounded-xl border-2 border-yellow-200 focus:border-yellow-400 focus:outline-none text-purple-900 font-medium"
            />
            <button
              onClick={saveHeroName}
              className="px-5 py-2 rounded-xl font-bold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              Save
            </button>
          </div>
          {heroMsg && (
            <p className="text-sm text-green-600 mt-2 font-medium">{heroMsg}</p>
          )}
        </div>

        {/* ── Word Lists ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-lg p-4 sm:p-6 border-2 border-indigo-100">
          <h2 className="text-xl font-bold mb-1" style={{ color: '#4a1080' }}>🗂️ Grade Word Lists</h2>
          <p className="text-sm text-indigo-400 mb-5">
            Edit the vocabulary for each grade level. One word per line. Changes apply immediately to new stories.
          </p>

          <div className="space-y-2">
            {EDITABLE_GRADES.map(grade => {
              const state = listData[grade.id];
              const isOpen = openGrade === grade.id;

              return (
                <div key={grade.id} className="border-2 border-gray-100 rounded-2xl overflow-hidden">
                  {/* Accordion header */}
                  <button
                    onClick={() => toggleGrade(grade.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800">{grade.label}</span>
                      <span className="text-xs text-gray-400">{grade.description.split('—')[1]?.trim() ?? grade.description}</span>
                      {state && !state.loading && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          state.isCustom
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}>
                          {state.isCustom ? 'Custom' : 'Built-in'}
                        </span>
                      )}
                      {state && !state.loading && (
                        <span className="text-xs text-gray-400">{state.wordCount} words</span>
                      )}
                    </div>
                    <span className="text-gray-400 font-bold text-lg leading-none">
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* Accordion body */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-3 border-t border-gray-100">
                      {state?.loading ? (
                        <p className="text-sm text-indigo-400 py-4 text-center animate-pulse">Loading…</p>
                      ) : (
                        <>
                          <textarea
                            value={state?.text ?? ''}
                            onChange={e => handleTextChange(grade.id, e.target.value)}
                            rows={8}
                            spellCheck={false}
                            className="w-full font-mono text-sm border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-300 focus:outline-none resize-y text-gray-700 min-h-[160px]"
                            placeholder="One word per line…"
                          />
                          {/* Hidden file input */}
                          <input
                            ref={el => { uploadRefs.current[grade.id] = el; }}
                            type="file"
                            accept=".txt,text/plain"
                            className="hidden"
                            onChange={e => handleFileUpload(grade.id, e)}
                          />
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <button
                              onClick={() => uploadRefs.current[grade.id]?.click()}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-indigo-200 bg-indigo-50 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition-all"
                            >
                              📂 Upload file
                            </button>
                            {state?.isCustom && (
                              <button
                                onClick={() => resetWordList(grade.id)}
                                disabled={state?.saving}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-orange-200 bg-orange-50 text-orange-600 text-sm font-semibold hover:bg-orange-100 transition-all disabled:opacity-40"
                              >
                                🔄 Reset to default
                              </button>
                            )}
                            <button
                              onClick={() => saveWordList(grade.id)}
                              disabled={state?.saving}
                              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50"
                              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                            >
                              {state?.saving ? 'Saving…' : '💾 Save'}
                            </button>
                          </div>
                          {state?.msg && (
                            <p className="text-xs mt-2 text-indigo-600 font-medium">{state.msg}</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
