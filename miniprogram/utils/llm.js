/**
 * utils/llm.js — Direct Qianfan LLM access for Word Guru miniprogram.
 *
 * Mirrors the prompt logic from src/app/api/generate-story/route.ts so that
 * story generation works without a backend when USE_DIRECT_LLM = true.
 */

const { LLM_CONFIG } = require('../config')
const storage        = require('./storage')
const { GRADE_LEVELS, getWordList } = require('./wordlists/index')

// ── Constants (kept in sync with route.ts) ────────────────────────────────────

const MAX_PROMPT_WORDS = 500

const THEME_DESCRIPTIONS = {
  enchanted_forest:   'a magical forest with talking animals, ancient trees, glowing mushrooms, and hidden fairy villages',
  underwater_kingdom: 'a beautiful underwater kingdom with mermaids, colorful fish, coral castles, and sea treasure',
  space_adventure:    'an exciting space adventure with spaceships, alien planets, friendly robots, and distant galaxies',
  dragon_realm:       'a realm of majestic dragons, knights, fire mountains, and hidden dragon eggs',
  magical_school:     'a school for young wizards where students learn spells, brew potions, and explore magical libraries',
  fairy_garden:       'a secret fairy garden full of tiny magical creatures, sparkling flowers, and enchanted ponds',
}

const DIFFICULTY_INSTRUCTIONS = {
  beginner:     'Use very simple, short sentences. Each target word should appear once.',
  intermediate: 'Use clear, engaging sentences. Each target word should appear 2-3 times in natural contexts.',
  advanced:     'Use descriptive language and varied sentence structures. Each target word should appear multiple times in diverse contexts.',
}

// ── Word-list prompt block ────────────────────────────────────────────────────

/**
 * Returns the grade-vocabulary constraint block to inject into the prompt,
 * or null when gradeId is 'none'.
 *
 * Priority: user-saved custom word list (from storage) → bundled JS wordlist.
 */
function buildWordListPromptBlock(gradeId) {
  if (!gradeId || gradeId === 'none') return null

  const grade = GRADE_LEVELS.find(g => g.id === gradeId)
  if (!grade) return null

  // Prefer user-customised list saved in wx.storage
  let words
  const customText = storage.getCustomWordList(gradeId)
  if (customText !== null) {
    words = customText
      .split('\n')
      .map(l => l.trim().toLowerCase())
      .filter(l => l.length > 0 && !l.startsWith('#'))
  } else {
    words = getWordList(gradeId)
  }

  if (!words || words.length === 0) return null

  const sample   = words.slice(0, MAX_PROMPT_WORDS)
  const overflow = words.length > MAX_PROMPT_WORDS
    ? ` ... [${words.length - MAX_PROMPT_WORDS} more words omitted — maintain ${grade.label} vocabulary level throughout]`
    : ''

  return (
    `GRADE VOCABULARY CONSTRAINT (${grade.label} — ${grade.description}):\n` +
    `You MUST only use words from the list below (plus the target vocabulary words). ` +
    `Do NOT use words that are harder or less common than those in this list.\n` +
    `Approved words: ${sample.join(', ')}${overflow}`
  )
}

// ── Prompt builder ────────────────────────────────────────────────────────────

/**
 * Builds the full story-generation prompt.
 * @param {{ words: string[], theme: string, difficulty: string, heroName: string, grade: string }} params
 * @returns {string}
 */
function buildPrompt({ words, theme, difficulty, heroName, grade }) {
  const themeDesc      = THEME_DESCRIPTIONS[theme]      || THEME_DESCRIPTIONS.enchanted_forest
  const difficultyInstr = DIFFICULTY_INSTRUCTIONS[difficulty] || DIFFICULTY_INSTRUCTIONS.intermediate
  const safeHeroName   = (heroName || 'Alex').slice(0, 20).replace(/[^a-zA-Z0-9 ]/g, '')
  const wordListBlock  = buildWordListPromptBlock(grade || 'none')
  const hasGrade       = !!wordListBlock

  return `You are a magical storyteller creating fairy tales for 10-year-old children.

Create an engaging fairy tale story set in ${themeDesc}. The main hero is named ${safeHeroName}.

Target vocabulary words to include: ${words.join(', ')}
${hasGrade ? `\n${wordListBlock}\n` : ''}
Instructions:
1. WORD LIMIT: The story must be 200 words or fewer. Count carefully.
2. VOCABULARY LEVEL: Only use words that are as simple as or simpler than the target vocabulary words above. Do not introduce harder or more complex words than necessary.${hasGrade ? '\n3. GRADE CONSTRAINT: Strictly follow the grade vocabulary list above — do not use words outside that list except for the target vocabulary words.' : ''}
${hasGrade ? '4' : '3'}. ${difficultyInstr}
${hasGrade ? '5' : '4'}. Naturally weave ALL the target vocabulary words into the story.
${hasGrade ? '6' : '5'}. When you use a target vocabulary word in the story, wrap it with double brackets like this: [[word]]
${hasGrade ? '7' : '6'}. Make the story exciting, age-appropriate, and fun for children.
${hasGrade ? '8' : '7'}. Give the story a catchy title.

After the story, provide a JSON vocabulary section for each target word with:
- stems: the word split into its morphemes (roots, prefixes, suffixes) separated by middle dots (·), e.g. "un·break·able"
- construction: a brief explanation of how those morphemes combine, e.g. "un- (not) + break (to fracture) + -able (can be done)"
- definition: a clear, simple definition suitable for a 10-year-old
- example: a short, child-friendly example sentence

Respond with ONLY valid JSON in this exact format (no markdown, no extra text):
{
  "title": "Story Title Here",
  "story": "Full story text here with [[vocabulary]] words in double brackets...",
  "vocabulary": {
    "word1": {
      "stems": "pre·dict·ion",
      "construction": "pre- (before) + dict (to say) + -ion (noun suffix) → a forecast",
      "definition": "A clear, simple definition suitable for a 10-year-old",
      "example": "A short example sentence using the word"
    },
    "word2": {
      "stems": "en·chant·ed",
      "construction": "en- (into/cause) + chant (to sing) + -ed (past tense) → put under a magical spell",
      "definition": "...",
      "example": "..."
    }
  }
}`
}

// ── HTTP call ─────────────────────────────────────────────────────────────────

function postLLM(url, body, bearerToken) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method:  'POST',
      data:    body,
      header:  {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${bearerToken}`,
      },
      timeout: 90000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(`LLM request failed: HTTP ${res.statusCode}`))
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || 'Network error calling LLM'))
      },
    })
  })
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate a story directly from the miniprogram, bypassing the backend.
 *
 * @param {{ words: string[], theme: string, difficulty: string, heroName: string, grade: string }} params
 * @returns {Promise<{ title, story, vocabulary, words, theme, difficulty, grade }>}
 */
async function generateStory({ words, theme, difficulty, heroName, grade }) {
  const { url, model, bearerToken } = LLM_CONFIG

  if (!bearerToken || bearerToken === 'YOUR_BEARER_TOKEN_HERE') {
    throw new Error('LLM bearer token not configured. Set LLM_CONFIG.bearerToken in config.js')
  }

  const prompt = buildPrompt({ words, theme, difficulty, heroName, grade })

  const responseData = await postLLM(url, {
    model,
    stream:   false,
    messages: [{ role: 'user', content: prompt }],
  }, bearerToken)

  const rawText = responseData?.choices?.[0]?.message?.content ?? ''

  // Parse JSON — strip optional markdown fences the model might add
  let parsed
  try {
    const cleaned = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Could not parse story response from LLM')
    parsed = JSON.parse(match[0])
  }

  return {
    title:      parsed.title      || 'A Magical Tale',
    story:      parsed.story      || '',
    vocabulary: parsed.vocabulary || {},
    words,
    theme,
    difficulty,
    grade: grade || 'none',
  }
}

module.exports = { generateStory, buildPrompt, buildWordListPromptBlock }
