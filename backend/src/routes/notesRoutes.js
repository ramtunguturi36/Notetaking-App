import { Router } from 'express'

import { noteService } from '../services/noteService.js'

export const notesRoutes = Router()

notesRoutes.get('/', async (_request, response, next) => {
  try {
    response.json(await noteService.listNotes())
  } catch (error) {
    next(error)
  }
})

notesRoutes.get('/:id', async (request, response, next) => {
  try {
    const note = await noteService.getNoteById(request.params.id)

    if (!note) {
      response.status(404).json({ message: 'Note not found' })
      return
    }

    response.json(note)
  } catch (error) {
    next(error)
  }
})

notesRoutes.post('/', async (request, response, next) => {
  try {
    const note = await noteService.saveNote(request.body || {})
    response.status(201).json(note)
  } catch (error) {
    next(error)
  }
})

notesRoutes.put('/:id', async (request, response, next) => {
  try {
    const note = await noteService.saveNote({ ...(request.body || {}), id: request.params.id })
    response.json(note)
  } catch (error) {
    next(error)
  }
})

notesRoutes.delete('/:id', async (request, response, next) => {
  try {
    const removed = await noteService.deleteNote(request.params.id)

    if (!removed) {
      response.status(404).json({ message: 'Note not found' })
      return
    }

    response.status(204).end()
  } catch (error) {
    next(error)
  }
})
