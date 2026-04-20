# NoteTaking App - End-to-End Technical Documentation

This README documents the entire codebase from frontend boot to backend persistence, including every module, the UI component library, and all animation layers (Framer Motion + CSS).

## 1. What This Project Is

This repository contains a local-first note-taking UI and a standalone backend API.

- Frontend: React + Vite single-page app with a dashboard, editor, semantic search, graph view, local note chat, toasts, and delete confirmation modal.
- Backend: Express API with layered architecture (routes -> services -> domain -> repository -> JSON file storage).
- Current coupling: The frontend currently runs entirely in client state and does not call the backend endpoints yet.

## 2. Tech Stack

### Frontend

- React 19
- Vite 8
- Framer Motion 12
- ESLint 9
- React Compiler preset via Babel plugin in Vite config

### Backend

- Node.js (ES modules)
- Express 5
- CORS
- File-based persistence (`backend/src/data/notes.json`, created on first write/read)

## 3. Workspace Structure

```text
Notetaking-App/
	eslint.config.js
	index.html
	package.json
	README.md
	vite.config.js
	backend/
		package.json
		README.md
		src/
			app.js
			index.js
			config/
				env.js
			data/
				seedNotes.js
			domain/
				noteUtils.js
			repositories/
				noteRepository.js
			routes/
				chatRoutes.js
				notesRoutes.js
				searchRoutes.js
			services/
				noteService.js
	public/
	src/
		App.css
		App.jsx
		index.css
		main.jsx
		assets/
		components/
			common/
				index.js
				Toast.jsx
			features/
				Dashboard.jsx
				Editor.jsx
				Graph.jsx
				Search.jsx
				index.js
			layout/
				LeftRail.jsx
				TopNav.jsx
				index.js
			notes/
				ChatBox.jsx
				NoteCard.jsx
				index.js
		constants/
			navigation.js
		services/
		shared/
		utils/
			notes.js
```

Notes:

- `src/services`, `src/shared`, and `src/assets` are currently placeholders.
- `public` is currently unused by app code.

## 4. Runtime Boot Flow

### Frontend boot flow

1. `index.html` loads and mounts a `div#root`.
2. `src/main.jsx` creates React root and renders `<App />` inside `StrictMode`.
3. `src/App.jsx` initializes all app state from `INITIAL_NOTES` and renders the entire shell.
4. Navigation state (`activeView`) switches between dashboard, editor, search, and graph views.

### Backend boot flow

1. Run `npm run dev` inside `backend`.
2. `backend/src/index.js` loads `createApp()` and starts listening on configured port.
3. `backend/src/app.js` configures middleware, health endpoint, and API routers.
4. Repository lazily ensures a JSON file exists and seeds it from `seedNotes` when needed.

## 5. Frontend File-by-File (A to Z)

### Root frontend config files

#### `package.json`

- Declares frontend dependencies and scripts.
- `framer-motion` is explicitly installed and used in `App.jsx`.
- Scripts: `dev`, `build`, `lint`, `preview`.

#### `vite.config.js`

- Enables `@vitejs/plugin-react`.
- Adds Babel plugin with React Compiler preset.

#### `eslint.config.js`

- Flat-config ESLint setup for JS/JSX.
- Uses recommended JS rules, React Hooks rules, and React Refresh rules.

#### `index.html`

- Minimal HTML shell that includes the mount node.

### App entry and shell

#### `src/main.jsx`

- React entrypoint.
- Imports base CSS and renders `App`.

#### `src/App.jsx`

This is the orchestration center.

State managed in `App`:

- `notes`
- `activeView`
- `selectedNoteId`
- `editorDraft`
- `searchInput`
- `chatQuestion`, `chatAnswer`
- `showSlashMenu`
- `deleteTarget`
- `sortMode`
- `toasts`

Major responsibilities:

- Initializes notes from constants.
- Computes derived state via `useMemo`:
	- selected note
	- sorted notes
	- related notes
	- semantic search results
	- graph nodes
	- ambient cube specs
- Implements all core actions:
	- create note
	- save note
	- toggle favorite
	- request/cancel/confirm delete
	- select note (dashboard/search/graph)
	- editor spark actions (summary/grammar/tasks)
	- local chat answer generation
	- toast push/removal
- Renders global layout:
	- ambient background
	- left rail
	- top navigation
	- view body with animated transitions
	- delete confirmation modal
	- toast container

### Styling system

#### `src/index.css`

- Global base styles for `html`, `body`, `#root`.
- Basic font smoothing and default font stack.

#### `src/App.css`

Defines the entire visual language:

- Color and spacing tokens using CSS variables.
- Ambient background gradients and geometric cube styling.
- Navigation rail, top nav, dashboard panels, cards, editor, search, graph, and modal styles.
- Shared transition behavior on interactive controls.
- Responsive breakpoints for `max-width: 1180px` and `max-width: 780px`.
- Toast styles and keyframe animation (`@keyframes slideIn`).
- Confirmation modal style system.

### Constants and utilities

#### `src/constants/navigation.js`

- `INITIAL_NOTES`: seeded notes used by frontend state on load.
- `NAV_ITEMS`: left-rail route descriptors.

#### `src/utils/notes.js`

Provides pure utility functions used in `App.jsx` and `Editor.jsx`:

- `normalizeText(value)`
- `getAutoTitle(content)`
- `getAutoTags(content)`
- `summarizeContent(content)`
- `extractActionItems(content)`
- `getRelatedNotes(notes, selectedNote)`
- `semanticSearch(notes, query)`
- `sortNotesByPreference(notes, sortMode)`
- `CONCEPT_MAP`: fixed concept expansion dictionary used by semantic search

### Component library

#### Layout components

##### `src/components/layout/LeftRail.jsx`

- Vertical fixed rail with icon-only navigation.
- Maps over `NAV_ITEMS`.
- Emits callbacks:
	- `onViewChange(viewId)`
	- `onAddNote()`

##### `src/components/layout/TopNav.jsx`

- Header brand and action buttons.
- Buttons route to `search`, `graph`, and create-note flow.

##### `src/components/layout/index.js`

- Barrel export for layout components.

#### Feature components

##### `src/components/features/Dashboard.jsx`

3-column workspace:

- Left panel:
	- note stats (inbox/all)
	- sort controls (favorites/recent)
	- recent notes shortcuts
- Middle panel:
	- note card stream (`NoteCard` list)
- Right panel:
	- selected note context summary
	- related notes list
	- extracted tasks list
	- `ChatBox`

##### `src/components/features/Editor.jsx`

Focus editor with helper tools:

- Title input and action bar (TL;DR, grammar fix, task generation, save).
- Floating mini-toolbar:
	- bold
	- italic
	- checklist
	- heading
	- slash-menu toggle
- Slash menu commands:
	- insert markdown table
	- insert image markdown link
	- insert task line
- Textarea auto-toggles slash menu when user types `/` at end.
- Metadata panel renders summary, action items, and auto tags.

##### `src/components/features/Search.jsx`

- Semantic search panel with two buckets:
	- direct matches
	- related concepts
- Input change updates search query in parent.

##### `src/components/features/Graph.jsx`

- Renders node network view.
- Draws SVG line segments between adjacent nodes.
- Renders positioned node buttons for note selection.
- Uses precomputed `noteNodes` provided by `App`.

##### `src/components/features/index.js`

- Barrel export for all feature components.

#### Note-focused components

##### `src/components/notes/NoteCard.jsx`

- Displays note metadata, summary, and tags.
- Handles:
	- select card
	- favorite toggle
	- open/edit
	- delete
- Uses event propagation control for nested button behavior.

##### `src/components/notes/ChatBox.jsx`

- Simple text input + ask button + answer output.
- Delegates all logic to parent callbacks.

##### `src/components/notes/index.js`

- Barrel export for notes components.

#### Common shared components

##### `src/components/common/Toast.jsx`

- `Toast`: self-dismisses after 3000 ms.
- `ToastContainer`: maps and renders toast stack.
- Supports `success`, `error`, `info` visual variants.

##### `src/components/common/index.js`

- Barrel export for common components.

### Empty frontend folders

#### `src/services`

- No implementation yet. Intended location for HTTP/API client utilities.

#### `src/shared`

- No implementation yet. Intended location for shared cross-feature modules.

#### `src/assets`

- No assets committed yet.

## 6. Backend File-by-File (A to Z)

### Backend root

#### `backend/package.json`

- Backend runtime/dependency manifest.
- Scripts:
	- `dev`: node watch mode
	- `start`: production start

#### `backend/README.md`

- Backend run instructions and endpoint list.

### Backend boot and app wiring

#### `backend/src/index.js`

- Starts server using configured port from env module.

#### `backend/src/app.js`

- Creates Express app.
- Enables CORS and JSON body parsing (`1mb`).
- Registers routes:
	- `/api/health`
	- `/api/notes`
	- `/api/search`
	- `/api/chat`
- Adds centralized error handler.

#### `backend/src/config/env.js`

- Reads `PORT` with fallback `3001`.

### Backend data and business layers

#### `backend/src/data/seedNotes.js`

- Initial notes array used to bootstrap persistent JSON store.

#### `backend/src/domain/noteUtils.js`

Pure business logic and transformations:

- normalization
- title inference
- tag inference
- summary generation
- action item extraction
- draft generation
- note enrichment (normalization before save)
- semantic search with concept expansion

#### `backend/src/repositories/noteRepository.js`

Persistence abstraction over JSON file storage:

- determines data path (`../data/notes.json`)
- creates file if missing
- reads/writes full collection
- CRUD-like operations:
	- `list`
	- `getById`
	- `upsert`
	- `remove`

#### `backend/src/services/noteService.js`

Orchestration layer between routes, domain logic, and repository:

- `listNotes`
- `getNoteById`
- `saveNote`
- `deleteNote`
- `searchNotes`
- `askNotes`

Behavior notes:

- `saveNote` merges defaults + existing note + payload, then enriches result.
- `askNotes` uses semantic search and returns a generated natural-language answer.

### Backend routes

#### `backend/src/routes/notesRoutes.js`

CRUD HTTP handlers:

- `GET /api/notes`
- `GET /api/notes/:id`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

#### `backend/src/routes/searchRoutes.js`

- `POST /api/search` with `{ query }` body.

#### `backend/src/routes/chatRoutes.js`

- `POST /api/chat` with `{ question }` body.

## 7. End-to-End Data and Control Flows

### A) Create and save note (frontend current behavior)

1. User clicks create in rail/top nav.
2. `App.createNewNote` creates draft object with generated id and metadata defaults.
3. Editor updates `editorDraft` live.
4. Save invokes `App.saveCurrentNote`.
5. Utility pipeline updates title/tags/summary/actions.
6. Local `notes` state is inserted or replaced.
7. App routes back to dashboard and shows toast.

### B) Search flow

1. User edits search input.
2. `searchInput` state updates in `App`.
3. `semanticSearch(notes, query)` re-evaluates in memoized computation.
4. Results render in direct vs related sections.
5. Selecting result opens note in editor.

### C) Chat flow

1. User enters question.
2. `chatWithNotes()` normalizes query and runs semantic search.
3. Best direct match wins; fallback to best related.
4. UI displays generated answer from matched note summary and tags.

### D) Delete flow

1. User triggers delete on card.
2. `deleteTarget` is set.
3. Animated modal appears.
4. Confirm removes from `notes` and recalculates selected fallback if needed.
5. Info toast confirms deletion.

### E) Intended backend flow (available but not yet wired from frontend)

1. Frontend sends HTTP request to Express route.
2. Route calls service.
3. Service applies domain transformations and calls repository.
4. Repository reads/writes JSON file.
5. Response returns to frontend.

## 8. UI Component Library Architecture

### Composition model

- App is the container/controller.
- Children are mostly presentational + callback-driven.
- State lifting: almost all state is centralized in `App`.
- Rendering strategy: view switching by `activeView` with animated transitions.

### Interaction contracts

The component library uses a consistent parent-owned callback pattern:

- `onSelect...` events for item selection
- `onChange...` events for controlled inputs
- `onRun...` or `onAsk` for command actions
- `onDelete` as an intent signal, with confirmation handled centrally

### Barrel exports

Barrel files in each component category simplify imports and keep boundaries clear.

## 9. Animation System: Framer Motion and CSS

### Framer Motion integration (where and how)

Framer Motion is imported only in `src/App.jsx`:

- `AnimatePresence`
- `motion`
- `useReducedMotion`

Main animated regions:

1. Ambient background container fade-in.
2. Three animated background orbs with very slow infinite transform loops.
3. Fourteen animated cube particles with staggered delays and subtle float/rotate/opacity cycling.
4. Main stage initial enter animation.
5. View transition animation when switching dashboard/editor/search/graph.
6. Delete modal overlay fade transition.
7. Delete dialog pop-in/out transition.

Reduced motion behavior:

- `useReducedMotion()` disables transform-heavy animation and reduces transitions to immediate updates where configured.

### CSS animations and transitions

Defined in `src/App.css`:

- Ubiquitous transition properties on buttons, cards, inputs, and interactive controls.
- Hover lifts, border tinting, and shadow changes.
- Toast enter keyframe animation (`slideIn`).
- Responsive adaptations under tablet/mobile breakpoints.

Important nuance:

- Continuous scene animation is primarily Framer Motion driven.
- Interaction-level motion and toast keyframes are CSS driven.

## 10. Data Model

A note object shape used across frontend and backend:

```js
{
	id: string,
	title: string,
	content: string,
	tags: string[],
	summary: string,
	actionItems: string[],
	createdAt: ISODateString,
	updatedAt: ISODateString,
	inbox: boolean,
	favorite?: boolean
}
```

Observations:

- Frontend seeds include `favorite` consistently.
- Backend seed notes omit `favorite` in source seed file, but service merge/update logic can still preserve or set it when payload provides it.

## 11. API Contract

### Health

- `GET /api/health` -> `{ ok: true }`

### Notes

- `GET /api/notes`
- `GET /api/notes/:id`
- `POST /api/notes`
- `PUT /api/notes/:id`
- `DELETE /api/notes/:id`

### Semantic Search

- `POST /api/search`
- Body: `{ "query": "python" }`
- Response: `{ direct: [...], related: [...] }`

### Chat

- `POST /api/chat`
- Body: `{ "question": "What did I decide about graph view?" }`
- Response: `{ answer: "..." }`

## 12. Known Current Gaps

1. Frontend does not call backend endpoints yet.
2. Frontend and backend utility logic are duplicated (`src/utils/notes.js` and `backend/src/domain/noteUtils.js`).
3. Graph node positioning is deterministic pseudo-layout (not semantic force graph).
4. No automated tests are included in this repository.
5. `src/services` folder is present but empty, so API client abstraction is not implemented yet.

## 13. How to Run

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

Backend default URL:

- `http://localhost:3001`

## 14. Suggested Next Engineering Steps

1. Implement frontend API client layer in `src/services`.
2. Wire `App` CRUD/search/chat actions to backend endpoints.
3. Add optimistic updates + error toasts + retry behavior.
4. Add unit tests for utility/domain modules.
5. Add integration tests for routes and service layer.
6. Optionally replace JSON storage with SQLite/Postgres while preserving repository interface.

---

This document is intentionally exhaustive and aligned with the current repository state.
