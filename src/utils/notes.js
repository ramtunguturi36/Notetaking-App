function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export function stripRichText(value = '') {
  if (!value) {
    return ''
  }

  const normalized = String(value)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|ul|ol|table|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]+>/g, ' ')

  return decodeEntities(normalized)
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function normalizeText(value) {
  return stripRichText(value).toLowerCase().replace(/[^a-z0-9\s#]/g, ' ')
}

export function getAutoTitle(content) {
  const clean = stripRichText(content).replace(/[#*_`>-]/g, '').trim()
  if (!clean) {
    return 'Untitled Note'
  }
  const firstSentence = clean.split(/[.!?\n]/).find((part) => part.trim().length > 6) || clean
  return firstSentence.trim().split(' ').slice(0, 6).join(' ')
}

export function getAutoTags(content) {
  const text = normalizeText(content)
  const keywords = ['python', 'design', 'research', 'ai', 'finance', 'backend', 'graph', 'focus', 'productivity', 'meeting']
  const tags = keywords.filter((word) => text.includes(word)).slice(0, 4)
  if (!tags.length) {
    return ['general']
  }
  return tags
}

export function summarizeContent(content) {
  const cleaned = stripRichText(content).replace(/\s+/g, ' ').trim()
  if (!cleaned) {
    return 'No content to summarize yet.'
  }
  return `${cleaned.split(/[.!?]/).slice(0, 2).join('. ').trim()}.`
}

export function extractActionItems(content) {
  const lines = stripRichText(content)
    .split(/[\n.]/)
    .map((line) => line.trim())
    .filter(Boolean)

  return lines
    .filter((line) => /^(todo:?|action:?|i need to|i should|we need to)/i.test(line))
    .map((line) => line.replace(/^(todo:?|action:?)/i, '').trim())
    .filter(Boolean)
}

export function getRelatedNotes(notes, selectedNote) {
  if (!selectedNote) {
    return []
  }
  const selectedTagSet = new Set(selectedNote.tags)
  return notes
    .filter((note) => note.id !== selectedNote.id)
    .map((note) => {
      const overlap = note.tags.filter((tag) => selectedTagSet.has(tag)).length
      return { note, score: overlap }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

export const CONCEPT_MAP = {
  money: ['budget', 'finance', 'saving'],
  python: ['backend', 'api', 'asyncio'],
  design: ['ux', 'interface', 'layout'],
  graph: ['node', 'connection', 'network'],
  focus: ['distraction', 'deep work', 'clarity'],
}

export function semanticSearch(notes, query) {
  const cleanQuery = normalizeText(query).trim()
  if (!cleanQuery) {
    return { direct: [], related: [] }
  }

  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean)
  const expandedTokens = new Set(queryTokens)
  queryTokens.forEach((token) => {
    if (CONCEPT_MAP[token]) {
      CONCEPT_MAP[token].forEach((word) => expandedTokens.add(word))
    }
  })

  const scored = notes.map((note) => {
    const haystack = normalizeText(`${note.title} ${note.content} ${note.tags.join(' ')}`)
    let directScore = 0
    let relatedScore = 0

    queryTokens.forEach((token) => {
      if (haystack.includes(token)) {
        directScore += 3
      }
    })

    expandedTokens.forEach((token) => {
      if (!queryTokens.includes(token) && haystack.includes(token)) {
        relatedScore += 1
      }
    })

    return { note, directScore, relatedScore }
  })

  return {
    direct: scored
      .filter((item) => item.directScore > 0)
      .sort((a, b) => b.directScore - a.directScore)
      .slice(0, 6),
    related: scored
      .filter((item) => item.directScore === 0 && item.relatedScore > 0)
      .sort((a, b) => b.relatedScore - a.relatedScore)
      .slice(0, 6),
  }
}

export function sortNotesByPreference(notes, sortMode = 'recent') {
  const nextNotes = [...notes]

  if (sortMode === 'favorites') {
    return nextNotes.sort((left, right) => {
      const favoriteScore = Number(right.favorite) - Number(left.favorite)
      if (favoriteScore !== 0) {
        return favoriteScore
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    })
  }

  if (sortMode === 'favorites-only') {
    return nextNotes
      .filter((note) => note.favorite)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  }

  return nextNotes.sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
}