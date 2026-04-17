export function normalizeText(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s#]/g, ' ')
}

export function getAutoTitle(content) {
  const clean = content.replace(/[#*_`>-]/g, '').trim()
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
  const cleaned = content.replace(/\s+/g, ' ').trim()
  if (!cleaned) {
    return 'No content to summarize yet.'
  }

  return `${cleaned.split(/[.!?]/).slice(0, 2).join('. ').trim()}.`
}

export function extractActionItems(content) {
  const lines = content
    .split(/[\n.]/)
    .map((line) => line.trim())
    .filter(Boolean)

  return lines
    .filter((line) => /^(todo:?|action:?|i need to|i should|we need to)/i.test(line))
    .map((line) => line.replace(/^(todo:?|action:?)/i, '').trim())
    .filter(Boolean)
}

export function createDraftNote(overrides = {}) {
  const now = new Date().toISOString()

  return {
    id: overrides.id || `n${Date.now()}`,
    title: 'Untitled Note',
    content: '',
    tags: ['general'],
    summary: 'Start writing to generate an AI summary.',
    actionItems: [],
    createdAt: now,
    updatedAt: now,
    inbox: true,
    ...overrides,
  }
}

export function enrichNote(note, timestamp = new Date().toISOString()) {
  const content = note.content || ''
  const title = note.title && note.title !== 'Untitled Note' ? note.title : getAutoTitle(content)

  return {
    ...note,
    title,
    content,
    tags: getAutoTags(content),
    summary: summarizeContent(content),
    actionItems: extractActionItems(content),
    createdAt: note.createdAt || timestamp,
    updatedAt: timestamp,
    inbox: note.inbox ?? true,
  }
}

const CONCEPT_MAP = {
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
