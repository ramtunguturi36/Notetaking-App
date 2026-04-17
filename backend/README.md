# Backend

This backend is intentionally isolated from the Vite frontend.

## Run

1. `cd backend`
2. `npm install`
3. `npm run dev`

Server defaults to `http://localhost:3001`.

## API

- `GET /api/health`
- `GET /api/notes`
- `GET /api/notes/:id`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`
- `POST /api/search` with `{ "query": "..." }`
- `POST /api/chat` with `{ "question": "..." }`
