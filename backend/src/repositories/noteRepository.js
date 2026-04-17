import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { INITIAL_NOTES } from '../data/seedNotes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataFilePath = path.join(__dirname, '..', 'data', 'notes.json')

async function ensureDataFile() {
  try {
    await fs.access(dataFilePath)
  } catch {
    await fs.writeFile(dataFilePath, `${JSON.stringify(INITIAL_NOTES, null, 2)}\n`, 'utf8')
  }
}

async function readAll() {
  await ensureDataFile()
  const raw = await fs.readFile(dataFilePath, 'utf8')

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeAll(notes) {
  await fs.writeFile(dataFilePath, `${JSON.stringify(notes, null, 2)}\n`, 'utf8')
}

export const noteRepository = {
  async list() {
    return readAll()
  },

  async getById(id) {
    const notes = await readAll()
    return notes.find((note) => note.id === id) || null
  },

  async upsert(note) {
    const notes = await readAll()
    const index = notes.findIndex((item) => item.id === note.id)

    if (index >= 0) {
      notes[index] = note
    } else {
      notes.unshift(note)
    }

    await writeAll(notes)
    return note
  },

  async remove(id) {
    const notes = await readAll()
    const next = notes.filter((note) => note.id !== id)

    if (next.length === notes.length) {
      return false
    }

    await writeAll(next)
    return true
  },
}
