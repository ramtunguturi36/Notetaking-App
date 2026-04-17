import { Router } from 'express'

import { noteService } from '../services/noteService.js'

export const chatRoutes = Router()

chatRoutes.post('/', async (request, response, next) => {
  try {
    const { question = '' } = request.body || {}
    response.json(await noteService.askNotes(question))
  } catch (error) {
    next(error)
  }
})
