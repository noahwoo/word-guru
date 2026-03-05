/**
 * wx.storage helpers for Word Guru.
 *
 * Keys:
 *   'wg_hero_name'        string
 *   'wg_history'          HistoryEntry[]  (full entries, newest first)
 *   'wg_custom_wordlists' { [gradeId]: string }  (raw text, one word per line)
 */

const KEYS = {
  HERO_NAME: 'wg_hero_name',
  HISTORY: 'wg_history',
  CUSTOM_WORDLISTS: 'wg_custom_wordlists',
}

// ─── Hero name ───────────────────────────────────────────────────────────────

function getHeroName() {
  return wx.getStorageSync(KEYS.HERO_NAME) || 'Alex'
}

function setHeroName(name) {
  wx.setStorageSync(KEYS.HERO_NAME, name || 'Alex')
}

// ─── Story history ────────────────────────────────────────────────────────────

function _readHistory() {
  try {
    return wx.getStorageSync(KEYS.HISTORY) || []
  } catch {
    return []
  }
}

function _writeHistory(entries) {
  wx.setStorageSync(KEYS.HISTORY, entries)
}

/**
 * Save a story entry returned from the backend.
 * Assigns a local id and createdAt if not present (the backend already provides both).
 */
function addStory(entry) {
  const full = {
    ...entry,
    id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: entry.createdAt || new Date().toISOString(),
  }
  _writeHistory([full, ..._readHistory()])
  return full
}

/** Return all stories as summary objects (omit story text and vocabulary). */
function listStories() {
  return _readHistory().map(({ id, createdAt, title, words, theme, difficulty, grade }) => ({
    id, createdAt, title, words, theme, difficulty, grade,
  }))
}

/** Return a full story entry by id, or null. */
function getStoryById(id) {
  return _readHistory().find(e => e.id === id) || null
}

// ─── Custom word lists ────────────────────────────────────────────────────────

function _readCustom() {
  try {
    return wx.getStorageSync(KEYS.CUSTOM_WORDLISTS) || {}
  } catch {
    return {}
  }
}

function _writeCustom(data) {
  wx.setStorageSync(KEYS.CUSTOM_WORDLISTS, data)
}

/** Returns the user-saved text for a grade, or null if not customised. */
function getCustomWordList(gradeId) {
  const custom = _readCustom()
  return Object.prototype.hasOwnProperty.call(custom, gradeId) ? custom[gradeId] : null
}

/** Saves a custom word list (raw text, one word per line). */
function setCustomWordList(gradeId, text) {
  _writeCustom({ ..._readCustom(), [gradeId]: text })
}

/** Removes the custom list for a grade, reverting to built-in. */
function removeCustomWordList(gradeId) {
  const { [gradeId]: _removed, ...rest } = _readCustom()
  _writeCustom(rest)
}

module.exports = {
  getHeroName,
  setHeroName,
  addStory,
  listStories,
  getStoryById,
  getCustomWordList,
  setCustomWordList,
  removeCustomWordList,
}
