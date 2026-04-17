import { Router } from 'express'

import { noteService } from '../services/noteService.js'

export const searchRoutes = Router()

searchRoutes.post('/', async (request, response, next) => {
  try {
    const { query = '' } = request.body || {}
    response.json(await noteService.searchNotes(query))
  } catch (error) {
    next(error)
  }
})
