import cors from 'cors'
import express from 'express'

import { chatRoutes } from './routes/chatRoutes.js'
import { notesRoutes } from './routes/notesRoutes.js'
import { searchRoutes } from './routes/searchRoutes.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  app.get('/api/health', (_request, response) => {
    response.json({ ok: true })
  })

  app.use('/api/notes', notesRoutes)
  app.use('/api/search', searchRoutes)
  app.use('/api/chat', chatRoutes)

  app.use((error, _request, response, _next) => {
    const status = error?.status || 500
    response.status(status).json({
      message: error?.message || 'Unexpected server error',
    })
  })

  return app
}
