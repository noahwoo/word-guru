const storage = require('../../utils/storage')

const THEME_EMOJIS = {
  enchanted_forest:  '🌲',
  underwater_kingdom:'🐠',
  space_adventure:   '🚀',
  dragon_realm:      '🐉',
  magical_school:    '🧙',
  fairy_garden:      '🧚',
}

const DIFF_STARS = {
  beginner:     '⭐',
  intermediate: '⭐⭐',
  advanced:     '⭐⭐⭐',
}

function formatDate(iso) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

Page({
  data: {
    stories: [],
    loading: true,
    empty: false,
  },

  onShow() {
    this._loadHistory()
  },

  _loadHistory() {
    this.setData({ loading: true })
    const all = storage.listStories()
    const stories = all.map(s => ({
      ...s,
      themeEmoji: THEME_EMOJIS[s.theme] || '📖',
      diffStars: DIFF_STARS[s.difficulty] || '',
      formattedDate: formatDate(s.createdAt),
    }))
    this.setData({ stories, loading: false, empty: stories.length === 0 })
  },

  onTapStory(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/story/story?id=${id}` })
  },

  onCreateStory() {
    wx.switchTab({ url: '/pages/index/index' })
  },
})
