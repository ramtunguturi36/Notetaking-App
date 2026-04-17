import { createDraftNote, enrichNote, normalizeText, semanticSearch } from '../domain/noteUtils.js'
import { noteRepository } from '../repositories/noteRepository.js'

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

  async askNotes(question = '') {
    const normalized = normalizeText(question)

    if (!normalized.trim()) {
      return { answer: 'Ask a question about your saved notes.' }
    }

    const notes = await noteRepository.list()
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
