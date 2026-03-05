const storage = require('../../utils/storage')
const { parseStory } = require('../../utils/story-parser')

Page({
  data: {
    storyData: null,
    segments: [],
    collectedWords: [],
    showSheet: false,
    selectedWord: null,
    selectedInfo: null,
    loadError: '',
    fromHistory: false,
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.redirectTo({ url: '/pages/index/index' })
      return
    }

    const pages = getCurrentPages()
    const prevPage = pages.length >= 2 ? pages[pages.length - 2] : null
    const fromHistory = !!(prevPage && prevPage.route && prevPage.route.includes('history'))
    this.setData({ fromHistory })

    const story = storage.getStoryById(id)
    if (!story) {
      this.setData({ loadError: 'Could not find this story. It may have been cleared.' })
      return
    }

    const segments = parseStory(story.story, story.vocabulary)
    wx.setNavigationBarTitle({ title: story.title || 'Story' })

    this.setData({ storyData: story, segments })
  },

  onTapWord(e) {
    const word = e.currentTarget.dataset.word
    const info = this.data.storyData && this.data.storyData.vocabulary
      ? this.data.storyData.vocabulary[word]
      : null
    if (!info) return

    const already = this.data.collectedWords.includes(word)
    const newCollected = already
      ? this.data.collectedWords
      : [...this.data.collectedWords, word]

    this.setData({
      selectedWord: word,
      selectedInfo: info,
      showSheet: true,
      collectedWords: newCollected,
    })
  },

  onCloseSheet() {
    this.setData({ showSheet: false, selectedWord: null, selectedInfo: null })
  },

  onBackdropTap() {
    this.onCloseSheet()
  },

  onGoBack() {
    wx.navigateBack()
  },

  onCreateAnother() {
    wx.switchTab({ url: '/pages/index/index' })
  },
})
