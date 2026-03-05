/**
 * Parses a story string containing [[word]] markers into a flat segments array
 * suitable for rendering with wx:for in WXML.
 *
 * Segment types:
 *   { type: 'text',    text: 'plain text chunk' }
 *   { type: 'word',    text: 'word', word: 'word' }
 *   { type: 'newline', text: '' }
 *
 * Example:
 *   "Once [[brave]] Alex..."  →
 *   [{ type:'text', text:'Once ' }, { type:'word', text:'brave', word:'brave' }, ...]
 */
function parseStory(storyText, vocabulary) {
  if (!storyText) return []

  // Split on [[word]] markers, keeping the delimiters
  const parts = storyText.split(/(\[\[[\w''-]+\]\])/g)
  const segments = []

  parts.forEach(part => {
    const match = part.match(/^\[\[([\w''-]+)\]\]$/)
    if (match) {
      const word = match[1]
      segments.push({ type: 'word', text: word, word })
      return
    }

    // For plain text parts, split on paragraph breaks
    const chunks = part.split(/\n\n+/)
    chunks.forEach((chunk, idx) => {
      if (chunk) {
        // Replace single newlines with spaces for cleaner display
        const cleaned = chunk.replace(/\n/g, ' ')
        segments.push({ type: 'text', text: cleaned })
      }
      if (idx < chunks.length - 1) {
        segments.push({ type: 'newline', text: '' })
      }
    })
  })

  // Add a unique index for wx:key
  return segments.map((seg, index) => ({ ...seg, index }))
}

module.exports = { parseStory }
