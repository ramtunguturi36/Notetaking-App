import { Router } from 'express'

import { noteService } from '../services/noteService.js'

export const chatRoutes = Router()

chatRoutes.post('/', async (request, response, next) => {
  try {
    const { question = '', notes } = request.body || {}
    response.json(await noteService.askNotes(question, { notes }))
  } catch (error) {
    next(error)
  }
})
