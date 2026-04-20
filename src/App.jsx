import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import './App.css'

import { INITIAL_NOTES } from './constants/navigation'
import {
  getAutoTitle,
  getAutoTags,
  summarizeContent,
  extractActionItems,
  getRelatedNotes,
  semanticSearch,
  normalizeText,
  stripRichText,
  sortNotesByPreference,
} from './utils/notes'
import { LeftRail, TopNav } from './components/layout'
import { Dashboard, Editor, Search, GraphView } from './components/features'
import { ToastContainer } from './components/common/Toast'

let toastId = 0
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const MIN_CHAT_RESPONSE_MS = 900

function App() {
  const prefersReducedMotion = useReducedMotion()
  const [theme, setTheme] = useState(() => {
    const storedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme
    }

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }

    return 'dark'
  })
  const [notes, setNotes] = useState(INITIAL_NOTES)
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedNoteId, setSelectedNoteId] = useState(INITIAL_NOTES[0].id)
  const [editorDraft, setEditorDraft] = useState(INITIAL_NOTES[0])
  const [searchInput, setSearchInput] = useState('python tips')
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [sortMode, setSortMode] = useState('favorites')
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem('theme', theme)
  }, [theme])

  function showToast(message, type = 'success') {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
  }

  function removeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) || null,
    [notes, selectedNoteId],
  )

  const sortedNotes = useMemo(() => sortNotesByPreference(notes, sortMode), [notes, sortMode])
  const relatedNotes = useMemo(() => getRelatedNotes(notes, selectedNote), [notes, selectedNote])
  const searchResults = useMemo(() => semanticSearch(notes, searchInput), [notes, searchInput])

  const noteNodes = useMemo(
    () =>
      sortedNotes.map((note, index) => ({
        id: note.id,
        title: note.title,
        x: 20 + ((index * 23) % 65),
        y: 24 + ((index * 19) % 55),
      })),
    [sortedNotes],
  )

  const cubeSpecs = useMemo(
    () => [
      { x: '8%', y: '14%', size: 12 },
      { x: '18%', y: '32%', size: 14 },
      { x: '30%', y: '16%', size: 10 },
      { x: '40%', y: '40%', size: 16 },
      { x: '52%', y: '22%', size: 12 },
      { x: '63%', y: '35%', size: 11 },
      { x: '74%', y: '18%', size: 14 },
      { x: '84%', y: '30%', size: 10 },
      { x: '14%', y: '66%', size: 13 },
      { x: '26%', y: '78%', size: 12 },
      { x: '45%', y: '72%', size: 11 },
      { x: '58%', y: '82%', size: 15 },
      { x: '71%', y: '68%', size: 12 },
      { x: '86%', y: '80%', size: 10 },
    ],
    [],
  )

  const ribbonSpecs = useMemo(
    () => [
      { className: 'ambient-ribbon ribbon-a', duration: 30, delay: 0 },
      { className: 'ambient-ribbon ribbon-b', duration: 36, delay: 2.5 },
      { className: 'ambient-ribbon ribbon-c', duration: 42, delay: 5 },
    ],
    [],
  )

  const sparkSpecs = useMemo(
    () => [
      { x: '12%', y: '18%' },
      { x: '23%', y: '62%' },
      { x: '36%', y: '26%' },
      { x: '48%', y: '74%' },
      { x: '61%', y: '34%' },
      { x: '72%', y: '58%' },
      { x: '84%', y: '22%' },
      { x: '91%', y: '70%' },
    ],
    [],
  )

  function switchToEditor(note) {
    setEditorDraft(note)
    setSelectedNoteId(note.id)
    setActiveView('editor')
  }

  function createNewNote() {
    const draft = {
      id: `n${Date.now()}`,
      title: 'Untitled Note',
      content: '',
      tags: ['general'],
      summary: 'Start writing to generate an AI summary.',
      actionItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inbox: true,
      favorite: false,
    }
    setEditorDraft(draft)
    setSelectedNoteId(draft.id)
    setActiveView('editor')
    showToast('New note created!', 'success')
  }

  function saveCurrentNote(contentOverride) {
    const baseDraft = typeof contentOverride === 'string'
      ? { ...editorDraft, content: contentOverride }
      : editorDraft

    const nextNote = {
      ...baseDraft,
      title:
        baseDraft.title && baseDraft.title !== 'Untitled Note'
          ? baseDraft.title
          : getAutoTitle(baseDraft.content),
      tags: getAutoTags(baseDraft.content),
      summary: summarizeContent(baseDraft.content),
      actionItems: extractActionItems(baseDraft.content),
      updatedAt: new Date().toISOString(),
    }

    setNotes((prev) => {
      const exists = prev.some((note) => note.id === nextNote.id)
      if (!exists) {
        return [nextNote, ...prev]
      }
      return prev.map((note) => (note.id === nextNote.id ? nextNote : note))
    })
    setEditorDraft(nextNote)
    setSelectedNoteId(nextNote.id)
    setActiveView('dashboard')
    showToast('Note saved successfully!', 'success')
  }

  function toggleFavorite(noteId) {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === noteId
          ? {
              ...note,
              favorite: !note.favorite,
              updatedAt: new Date().toISOString(),
            }
          : note,
      ),
    )
  }

  function requestDeleteNote(noteId) {
    const targetNote = notes.find((note) => note.id === noteId)
    if (!targetNote) {
      return
    }

    setDeleteTarget({ id: targetNote.id, title: targetNote.title })
  }

  function cancelDeleteNote() {
    setDeleteTarget(null)
  }

  function confirmDeleteNote() {
    if (!deleteTarget) {
      return
    }

    const noteId = deleteTarget.id
    const noteTitle = deleteTarget.title

    setNotes((prev) => prev.filter((note) => note.id !== noteId))
    if (selectedNoteId === noteId) {
      const fallback = notes.find((note) => note.id !== noteId)
      if (fallback) {
        setSelectedNoteId(fallback.id)
        setEditorDraft(fallback)
      }
    }
    setDeleteTarget(null)
    showToast(`"${noteTitle}" deleted.`, 'info')
  }

  function handleSelectNote(noteId, note) {
    setSelectedNoteId(noteId)
    setEditorDraft(note)
  }

  function handleSelectNoteFromSearch(note) {
    switchToEditor(note)
  }

  function handleSelectNoteFromGraph(noteId) {
    const note = notes.find((n) => n.id === noteId)
    if (note) {
      switchToEditor(note)
    }
  }

  function runSpark(action, contentOverride) {
    const contentSource = typeof contentOverride === 'string' ? contentOverride : editorDraft.content

    if (action === 'summary') {
      setEditorDraft((prev) => ({ ...prev, content: contentSource, summary: summarizeContent(contentSource) }))
    }

    if (action === 'actions') {
      setEditorDraft((prev) => ({ ...prev, content: contentSource, actionItems: extractActionItems(contentSource) }))
    }

    if (action === 'grammar') {
      const polishedText = stripRichText(contentSource)
        .replace(/\s{2,}/g, ' ')
        .replace(/\bi\b/g, 'I')
        .replace(/\s+,/g, ',')
        .replace(/\s+\./g, '.')
        .replace(/\s+!/g, '!')
        .replace(/\s+\?/g, '?')
        .trim()

      const polishedHtml = polishedText
        .split(/\n{2,}/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`)
        .join('')

      setEditorDraft((prev) => ({ ...prev, content: polishedHtml || prev.content }))
    }
  }

  async function chatWithNotes() {
    if (chatLoading) {
      return
    }

    const question = normalizeText(chatQuestion)
    if (!question.trim()) {
      setChatAnswer('Ask a question about your saved notes.')
      return
    }

    setChatLoading(true)
    setChatAnswer('Thinking...')
    const startedAt = Date.now()
    let finalAnswer = 'I could not find a relevant note in your local brain yet.'

    try {
      const payload = {
        question,
        notes: notes.map((note) => ({
          id: note.id,
          title: note.title,
          summary: note.summary,
          tags: note.tags,
          content: stripRichText(note.content).slice(0, 1200),
        })),
      }

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Chat endpoint returned an error')
      }

      const result = await response.json()
      if (result?.answer) {
        finalAnswer = result.answer
      } else {
        throw new Error('No answer in chat response')
      }
    } catch {
      const fallbackResults = semanticSearch(notes, question)
      const bestMatch = fallbackResults.direct[0] || fallbackResults.related[0]

      if (bestMatch) {
        finalAnswer = `From "${bestMatch.note.title}": ${bestMatch.note.summary} Top tags: ${bestMatch.note.tags
          .map((tag) => `#${tag}`)
          .join(' ')}.`
      }
    } finally {
      const elapsed = Date.now() - startedAt
      if (elapsed < MIN_CHAT_RESPONSE_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_CHAT_RESPONSE_MS - elapsed))
      }

      setChatAnswer(finalAnswer)
      setChatLoading(false)
    }
  }

  const viewTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.34, ease: [0.25, 0.1, 0.25, 1] }

  return (
    <div className={`app-shell theme-${theme}`}>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;700;800&family=Inter:wght@300;400;500;600&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <motion.div
        className="ambient-bg"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        aria-hidden="true"
      >
        <motion.span
          className="ambient-orb orb-a"
          animate={prefersReducedMotion ? {} : { x: [0, 5, -4, 0], y: [0, -4, 3, 0], scale: [1, 1.01, 0.995, 1] }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 42, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="ambient-orb orb-b"
          animate={prefersReducedMotion ? {} : { x: [0, -6, 5, 0], y: [0, 4, -3, 0], scale: [1, 0.99, 1.01, 1] }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 48, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          className="ambient-orb orb-c"
          animate={prefersReducedMotion ? {} : { x: [0, 4, -6, 0], y: [0, 3, -4, 0], scale: [1, 1.01, 0.99, 1] }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 54, repeat: Infinity, ease: 'easeInOut' }}
        />

        {ribbonSpecs.map((ribbon, index) => (
          <motion.span
            key={ribbon.className}
            className={ribbon.className}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    x: [0, 18, -16, 0],
                    y: [0, -14, 10, 0],
                    rotate: [0, 2.6, -1.9, 0],
                    opacity: [0.2, 0.35, 0.2],
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    duration: ribbon.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: ribbon.delay,
                  }
            }
          />
        ))}

        {sparkSpecs.map((spark, index) => (
          <motion.span
            key={`${spark.x}-${spark.y}`}
            className="ambient-spark"
            style={{ '--x': spark.x, '--y': spark.y }}
            animate={
              prefersReducedMotion
                ? {}
                : {
                    scale: [0.9, 1.3, 0.92],
                    opacity: [0.08, 0.42, 0.08],
                    y: [0, -4, 0],
                  }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    duration: 4.5 + (index % 4),
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.45,
                  }
            }
          />
        ))}

        <motion.div
          className="ambient-cube-grid"
          animate={
            prefersReducedMotion
              ? {}
              : {
                  opacity: [0.22, 0.34, 0.22],
                  scale: [1, 1.012, 1],
                }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  duration: 18,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
        />
        <motion.div
          className="ambient-cube-field"
          animate={
            prefersReducedMotion
              ? {}
              : {
                  rotate: [0, 0.6, -0.5, 0],
                  scale: [1, 1.01, 1],
                }
          }
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : {
                  duration: 26,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          style={{ transformOrigin: '50% 50%' }}
        >
          {cubeSpecs.map((cube, index) => (
            <motion.span
              key={`${cube.x}-${cube.y}`}
              className="ambient-cube"
              style={{ '--x': cube.x, '--y': cube.y, '--size': `${cube.size}px` }}
              animate={
                prefersReducedMotion
                  ? {}
                  : {
                      x: [0, 1.4, -1.2, 0],
                      y: [0, -2.8, 1.5, 0],
                      rotate: [45, 49, 43, 45],
                      scale: [1, 1.03, 0.99, 1],
                      opacity: [0.16, 0.3, 0.16],
                    }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : {
                      duration: 12 + (index % 5) * 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: index * 0.2,
                    }
              }
            />
          ))}
        </motion.div>
      </motion.div>

      <LeftRail
        activeView={activeView}
        onViewChange={setActiveView}
        onAddNote={createNewNote}
      />

      <motion.main
        className="main-stage"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={viewTransition}
      >
        <TopNav
          onCreateNote={createNewNote}
          onViewChange={setActiveView}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        />

        <AnimatePresence mode="wait">
          <motion.section
            key={activeView}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0 }
            }
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
            transition={viewTransition}
          >
            {activeView === 'dashboard' && (
              <Dashboard
                notes={sortedNotes}
                selectedNoteId={selectedNoteId}
                relatedNotes={relatedNotes}
                chatQuestion={chatQuestion}
                chatAnswer={chatAnswer}
                chatLoading={chatLoading}
                onSelectNote={handleSelectNote}
                onEditNote={switchToEditor}
                onDeleteNote={requestDeleteNote}
                onToggleFavorite={toggleFavorite}
                sortMode={sortMode}
                onSortModeChange={setSortMode}
                onSwitchToEditor={switchToEditor}
                onChatAsk={chatWithNotes}
                onChatQuestionChange={setChatQuestion}
              />
            )}

            {activeView === 'editor' && (
              <Editor
                note={editorDraft}
                onTitleChange={(title) => setEditorDraft((prev) => ({ ...prev, title }))}
                onContentChange={(content) => setEditorDraft((prev) => ({ ...prev, content }))}
                onInsertAtCursor={() => {}}
                onRunSpark={runSpark}
                onSave={saveCurrentNote}
                showSlashMenu={showSlashMenu}
                onToggleSlashMenu={() => setShowSlashMenu((prev) => !prev)}
              />
            )}

            {activeView === 'search' && (
              <Search
                searchInput={searchInput}
                onSearchChange={setSearchInput}
                searchResults={searchResults}
                onSelectNote={handleSelectNoteFromSearch}
              />
            )}

            {activeView === 'graph' && (
              <GraphView
                noteNodes={noteNodes}
                notes={notes}
                selectedNoteId={selectedNoteId}
                onSelectNote={handleSelectNoteFromGraph}
              />
            )}
          </motion.section>
        </AnimatePresence>
      </motion.main>

      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="confirm-overlay"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={viewTransition}
            onClick={cancelDeleteNote}
          >
            <motion.div
              className="confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.99 }}
              transition={viewTransition}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="confirm-head">
                <span className="material-symbols-outlined">delete</span>
                <h3 id="delete-confirm-title">Delete note?</h3>
              </div>
              <p>
                You are about to delete
                {' '}
                <strong>{deleteTarget.title}</strong>
                . This action cannot be undone.
              </p>

              <div className="confirm-actions">
                <button className="confirm-cancel" onClick={cancelDeleteNote}>Cancel</button>
                <button className="confirm-delete" onClick={confirmDeleteNote}>
                  <span className="material-symbols-outlined">delete</span>
                  Delete note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default App