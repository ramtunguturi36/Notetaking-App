import { createDraftNote, enrichNote, normalizeText, semanticSearch } from '../domain/noteUtils.js'
import { env } from '../config/env.js'
import { noteRepository } from '../repositories/noteRepository.js'

function truncate(value, maxLength = 1200) {
  return String(value || '').slice(0, maxLength)
}

function shapeNotesForPrompt(notes = []) {
  return notes.map((note) => ({
    id: note.id,
    title: note.title || 'Untitled',
    summary: truncate(note.summary, 280),
    tags: Array.isArray(note.tags) ? note.tags.slice(0, 8) : [],
    content: truncate(note.content, 700),
  }))
}

function buildPrompt(question, notes) {
  const context = notes
    .map((note, index) => {
      const tags = note.tags.length ? note.tags.map((tag) => `#${tag}`).join(' ') : 'none'
      return [
        `Note ${index + 1}:`,
        `Title: ${note.title}`,
        `Summary: ${note.summary || 'none'}`,
        `Tags: ${tags}`,
        `Content: ${note.content || 'none'}`,
      ].join('\n')
    })
    .join('\n\n')

  return [
    'You are an assistant for a personal notes app.',
    'Answer only using the provided notes context.',
    'If the notes do not contain enough evidence, say that clearly and suggest what to capture next.',
    'Keep answers concise (3-6 sentences) and practical.',
    '',
    `Question: ${question}`,
    '',
    'Notes context:',
    context,
  ].join('\n')
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function askOllama(prompt) {
  const response = await fetchWithTimeout(
    `${env.ollamaUrl.replace(/\/$/, '')}/api/generate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.ollamaModel,
        prompt,
        stream: false,
      }),
    },
    env.aiTimeoutMs,
  )

  if (!response.ok) {
    throw new Error('Ollama request failed')
  }

  const data = await response.json()
  return data?.response?.trim() || ''
}

async function askOpenAI(prompt) {
  if (!env.openaiApiKey) {
    throw new Error('OPENAI_API_KEY is missing')
  }

  const response = await fetchWithTimeout(
    `${env.openaiBaseUrl.replace(/\/$/, '')}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: env.openaiModel,
        messages: [
          { role: 'system', content: 'You answer questions from user-provided notes context.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
    },
    env.aiTimeoutMs,
  )

  if (!response.ok) {
    throw new Error('OpenAI-compatible request failed')
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content?.trim() || ''
}

async function askGemini(prompt) {
  if (!env.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is missing')
  }

  const base = env.geminiBaseUrl.replace(/\/$/, '')
  const model = encodeURIComponent(env.geminiModel)
  const url = `${base}/models/${model}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
        },
      }),
    },
    env.aiTimeoutMs,
  )

  if (!response.ok) {
    throw new Error('Gemini request failed')
  }

  const data = await response.json()
  const parts = data?.candidates?.[0]?.content?.parts || []
  const text = parts.map((part) => part?.text || '').join('').trim()
  return text
}

async function askModel(prompt) {
  if (env.aiProvider === 'none') {
    return ''
  }

  if (env.aiProvider === 'openai') {
    return askOpenAI(prompt)
  }

  if (env.aiProvider === 'ollama') {
    return askOllama(prompt)
  }

  if (env.aiProvider === 'gemini') {
    return askGemini(prompt)
  }

  if (env.aiProvider === 'auto') {
    try {
      return await askOpenAI(prompt)
    } catch {
      try {
        return await askGemini(prompt)
      } catch {
        return askOllama(prompt)
      }
    }
  }

  return ''
}

export const noteService = {
  async listNotes() {
    return noteRepository.list()
  },

  async getNoteById(id) {
    return noteRepository.getById(id)
  },

  async saveNote(payload = {}) {
    const now = new Date().toISOString()
    const noteId = payload.id || createDraftNote().id
    const existing = await noteRepository.getById(noteId)

    const merged = enrichNote(
      {
        ...createDraftNote({ id: noteId }),
        ...existing,
        ...payload,
        id: noteId,
        createdAt: existing?.createdAt || payload.createdAt || now,
        inbox: payload.inbox ?? existing?.inbox ?? true,
      },
      now,
    )

    return noteRepository.upsert(merged)
  },

  async deleteNote(id) {
    return noteRepository.remove(id)
  },

  async searchNotes(query = '') {
    const notes = await noteRepository.list()
    return semanticSearch(notes, query)
  },

  async askNotes(question = '', options = {}) {
    const normalized = normalizeText(question)

    if (!normalized.trim()) {
      return { answer: 'Ask a question about your saved notes.' }
    }

    const incomingNotes = Array.isArray(options.notes) ? options.notes : []
    const notes = incomingNotes.length ? incomingNotes : await noteRepository.list()

    const promptNotes = shapeNotesForPrompt(notes)
    if (promptNotes.length) {
      try {
        const prompt = buildPrompt(question, promptNotes)
        const modelAnswer = await askModel(prompt)
        if (modelAnswer) {
          return { answer: modelAnswer }
        }
      } catch {
        // Fall through to deterministic semantic fallback.
      }
    }

    const result = semanticSearch(notes, normalized)
    const bestMatch = result.direct[0] || result.related[0]

    if (!bestMatch) {
      return { answer: 'I could not find a relevant note in your local brain yet.' }
    }

    return {
      answer: `From "${bestMatch.note.title}": ${bestMatch.note.summary} Top tags: ${bestMatch.note.tags
        .map((tag) => `#${tag}`)
        .join(' ')}.`,
    }
  },
}
