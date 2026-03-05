const storage = require('../../utils/storage')
const { GRADE_LEVELS, getWordList } = require('../../utils/wordlists/index')

const EDITABLE_GRADES = GRADE_LEVELS.filter(g => g.id !== 'none')

Page({
  data: {
    heroName: '',
    heroMsg: '',
    grades: EDITABLE_GRADES.map(g => ({
      id: g.id,
      label: g.label,
      description: g.description,
      isOpen: false,
      isCustom: false,
      wordCount: 0,
      text: '',
      msg: '',
    })),
    openGradeId: null,
  },

  onShow() {
    this.setData({ heroName: storage.getHeroName() })
  },

  onHeroNameInput(e) {
    this.setData({ heroName: e.detail.value })
  },

  onSaveHeroName() {
    const name = this.data.heroName.trim()
    storage.setHeroName(name || 'Alex')
    this.setData({ heroMsg: '✅ Saved!' })
    setTimeout(() => this.setData({ heroMsg: '' }), 3000)
  },

  onToggleGrade(e) {
    const id = e.currentTarget.dataset.id
    const isAlreadyOpen = this.data.openGradeId === id
    const newOpenId = isAlreadyOpen ? null : id

    if (!isAlreadyOpen) {
      this._loadGradeData(id)
    }
    this.setData({ openGradeId: newOpenId })
  },

  _loadGradeData(gradeId) {
    const customText = storage.getCustomWordList(gradeId)
    const isCustom = customText !== null
    const text = isCustom ? customText : getWordList(gradeId).join('\n')
    const wordCount = text.split('\n').filter(l => l.trim().length > 0).length
    this.setData({
      grades: this.data.grades.map(g =>
        g.id === gradeId ? { ...g, text, isCustom, wordCount } : g
      ),
    })
  },

  onWordListTextInput(e) {
    const gradeId = e.currentTarget.dataset.id
    const text = e.detail.value
    const wordCount = text.split('\n').filter(l => l.trim().length > 0).length
    this.setData({
      grades: this.data.grades.map(g =>
        g.id === gradeId ? { ...g, text, wordCount } : g
      ),
    })
  },

  onUploadWordList(e) {
    const gradeId = e.currentTarget.dataset.id
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['txt'],
      success: (res) => {
        const path = res.tempFiles[0].path
        wx.getFileSystemManager().readFile({
          filePath: path,
          encoding: 'utf8',
          success: (r) => {
            const text = r.data
            const wordCount = text.split('\n').filter(l => l.trim().length > 0).length
            this.setData({
              grades: this.data.grades.map(g =>
                g.id === gradeId ? { ...g, text, wordCount, msg: '📂 File loaded — tap Save' } : g
              ),
            })
            setTimeout(() => {
              this.setData({
                grades: this.data.grades.map(g =>
                  g.id === gradeId ? { ...g, msg: '' } : g
                ),
              })
            }, 5000)
          },
          fail: () => this._setGradeMsg(gradeId, '❌ Could not read file'),
        })
      },
      fail: () => {},
    })
  },

  onSaveWordList(e) {
    const gradeId = e.currentTarget.dataset.id
    const grade = this.data.grades.find(g => g.id === gradeId)
    if (!grade) return
    storage.setCustomWordList(gradeId, grade.text)
    this.setData({
      grades: this.data.grades.map(g =>
        g.id === gradeId ? { ...g, isCustom: true, msg: '✅ Saved!' } : g
      ),
    })
    setTimeout(() => this._setGradeMsg(gradeId, ''), 3000)
  },

  onResetWordList(e) {
    const gradeId = e.currentTarget.dataset.id
    storage.removeCustomWordList(gradeId)
    this._loadGradeData(gradeId)
    this._setGradeMsg(gradeId, '✅ Reset to built-in list')
    setTimeout(() => this._setGradeMsg(gradeId, ''), 3000)
  },

  _setGradeMsg(gradeId, msg) {
    this.setData({
      grades: this.data.grades.map(g =>
        g.id === gradeId ? { ...g, msg } : g
      ),
    })
  },
})
