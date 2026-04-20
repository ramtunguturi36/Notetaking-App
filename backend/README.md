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

## AI Chat Configuration

The chat endpoint can use a real model provider and falls back to semantic retrieval if the model is unavailable.

Environment variables:

- `AI_PROVIDER` = `ollama` | `openai` | `auto` | `none` (default: `ollama`)
- `AI_TIMEOUT_MS` (default: `6000`)
- `OLLAMA_URL` (default: `http://localhost:11434`)
- `OLLAMA_MODEL` (default: `gemma4:e2b`)
- `OPENAI_BASE_URL` (default: `https://api.openai.com/v1`)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4o-mini`)

`POST /api/chat` also accepts optional `notes` in the payload:

```json
{
  "question": "What did I decide about focus mode?",
  "notes": [
    {
      "id": "n1",
      "title": "...",
      "summary": "...",
      "tags": ["..."],
      "content": "..."
    }
  ]
}
```
