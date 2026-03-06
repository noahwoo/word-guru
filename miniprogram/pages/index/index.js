const { API, USE_DIRECT_LLM } = require('../../config')
const storage = require('../../utils/storage')
const request = require('../../utils/request')
const llm     = require('../../utils/llm')

const THEMES = [
  { id: 'enchanted_forest',  label: 'Enchanted Forest',   emoji: '🌲' },
  { id: 'underwater_kingdom', label: 'Underwater Kingdom', emoji: '🐠' },
  { id: 'space_adventure',   label: 'Space Adventure',     emoji: '🚀' },
  { id: 'dragon_realm',      label: 'Dragon Realm',        emoji: '🐉' },
  { id: 'magical_school',    label: 'Magical School',      emoji: '🧙' },
  { id: 'fairy_garden',      label: 'Fairy Garden',        emoji: '🧚' },
]

const DIFFICULTIES = [
  { id: 'beginner',     label: 'Beginner',      emoji: '⭐',      desc: 'Simple & short' },
  { id: 'intermediate', label: 'Intermediate',  emoji: '⭐⭐',    desc: 'Medium story' },
  { id: 'advanced',     label: 'Advanced',      emoji: '⭐⭐⭐',  desc: 'Rich & detailed' },
]

const GRADE_OPTIONS = [
  { id: 'none',   label: 'No Limit',  desc: 'Any vocabulary',   group: 'special' },
  { id: 'grade1', label: 'Grade 1',   desc: '~150 words',        group: 'school'  },
  { id: 'grade2', label: 'Grade 2',   desc: '~300 words',        group: 'school'  },
  { id: 'grade3', label: 'Grade 3',   desc: '~500 words',        group: 'school'  },
  { id: 'grade4', label: 'Grade 4',   desc: '~700 words',        group: 'school'  },
  { id: 'grade5', label: 'Grade 5',   desc: '~900 words',        group: 'school'  },
  { id: 'grade6', label: 'Grade 6',   desc: '~1100 words',       group: 'school'  },
  { id: 'grade7', label: 'Grade 7',   desc: '~1400 words',       group: 'school'  },
  { id: 'grade8', label: 'Grade 8',   desc: '~1700 words',       group: 'school'  },
  { id: 'grade9', label: 'Grade 9',   desc: '~2000 words',       group: 'school'  },
  { id: 'ket',    label: 'KET (A2)',  desc: 'Cambridge KET',     group: 'exam'    },
  { id: 'pet',    label: 'PET (B1)',  desc: 'Cambridge PET',     group: 'exam'    },
  { id: 'gre',    label: 'GRE',       desc: 'Graduate exam',     group: 'exam'    },
]

const SAMPLE_WORDS = ['brave', 'mysterious', 'glimmer', 'ancient', 'enchanted']

Page({
  data: {
    wordInput: '',
    words: [],
    themes: THEMES,
    selectedTheme: 'enchanted_forest',
    difficulties: DIFFICULTIES,
    difficulty: 'intermediate',
    gradeSchoolOptions: GRADE_OPTIONS.filter(g => g.group === 'school'),
    gradeExamOptions: GRADE_OPTIONS.filter(g => g.group === 'exam'),
    grade: 'none',
    gradeNoneSelected: true,
    heroName: '',
    isLoading: false,
    error: '',
    fileMsg: '',
  },

  onLoad() {
    this.setData({ heroName: storage.getHeroName() })
  },

  onShow() {
    // Refresh hero name if changed in settings
    this.setData({ heroName: storage.getHeroName() })
  },

  onWordInput(e) {
    this.setData({ wordInput: e.detail.value })
  },

  onAddWord() {
    const trimmed = this.data.wordInput.trim().toLowerCase().replace(/[^a-z'-]/g, '')
    if (!trimmed || this.data.words.includes(trimmed) || this.data.words.length >= 10) return
    this.setData({ words: [...this.data.words, trimmed], wordInput: '' })
  },

  onRemoveWord(e) {
    const word = e.currentTarget.dataset.word
    this.setData({ words: this.data.words.filter(w => w !== word) })
  },

  onUseSampleWords() {
    this.setData({ words: [...SAMPLE_WORDS] })
  },

  onUploadFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['txt'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].path
        wx.getFileSystemManager().readFile({
          filePath: tempFilePath,
          encoding: 'utf8',
          success: (r) => {
            const parsed = r.data
              .split(/\r?\n/)
              .map(l => l.trim().toLowerCase())
              .filter(l => l.length > 0 && /^[a-z][a-z'-]*$/.test(l))
            if (parsed.length === 0) {
              this._setFileMsg('⚠️ No valid words found')
              return
            }
            const seen = new Set(this.data.words)
            const newWords = [...this.data.words, ...parsed.filter(w => !seen.has(w))].slice(0, 10)
            this.setData({ words: newWords })
            this._setFileMsg(`✅ ${parsed.length} word(s) loaded`)
          },
          fail: () => this._setFileMsg('❌ Could not read file'),
        })
      },
      fail: () => {},
    })
  },

  _setFileMsg(msg) {
    this.setData({ fileMsg: msg })
    setTimeout(() => this.setData({ fileMsg: '' }), 4000)
  },

  onHeroNameInput(e) {
    this.setData({ heroName: e.detail.value })
  },

  onSelectTheme(e) {
    this.setData({ selectedTheme: e.currentTarget.dataset.id })
  },

  onSelectDifficulty(e) {
    this.setData({ difficulty: e.currentTarget.dataset.id })
  },

  onSelectGradeNone() {
    this.setData({ grade: 'none', gradeNoneSelected: true })
  },

  onSelectGrade(e) {
    this.setData({ grade: e.currentTarget.dataset.id, gradeNoneSelected: false })
  },

  onGenerateStory() {
    if (this.data.words.length < 2) {
      this.setData({ error: 'Please add at least 2 words to begin! ✨' })
      return
    }
    if (this.data.isLoading) return
    this.setData({ error: '', isLoading: true })

    const heroName = (this.data.heroName || 'Alex').slice(0, 20).replace(/[^a-zA-Z0-9 ]/g, '')

    const storyParams = {
      words:      this.data.words,
      theme:      this.data.selectedTheme,
      difficulty: this.data.difficulty,
      grade:      this.data.grade,
      heroName,
    }

    const storyPromise = USE_DIRECT_LLM
      ? llm.generateStory(storyParams)
      : request.post(API.GENERATE_STORY, storyParams)

    storyPromise.then(data => {
      const entry = storage.addStory(data)
      wx.navigateTo({ url: `/pages/story/story?id=${entry.id}` })
    }).catch(err => {
      this.setData({ error: `Oops! The magic spell fizzled. ${err.message || 'Please try again!'} 🪄` })
    }).finally(() => {
      this.setData({ isLoading: false })
    })
  },
})
