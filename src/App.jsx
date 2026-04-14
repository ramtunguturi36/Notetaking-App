import { useMemo, useState } from 'react'
import './App.css'

import { INITIAL_NOTES } from './constants/navigation'
import { getAutoTitle, getAutoTags, summarizeContent, extractActionItems, getRelatedNotes, semanticSearch, normalizeText } from './utils/notes'
import { LeftRail, TopNav } from './components/layout'
import { Dashboard, Editor, Search, GraphView } from './components/features'

function App() {
  const [notes, setNotes] = useState(INITIAL_NOTES)
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedNoteId, setSelectedNoteId] = useState(INITIAL_NOTES[0].id)
  const [editorDraft, setEditorDraft] = useState(INITIAL_NOTES[0])
  const [searchInput, setSearchInput] = useState('python tips')
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')
  const [showSlashMenu, setShowSlashMenu] = useState(false)

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) || null,
    [notes, selectedNoteId],
  )

  const relatedNotes = useMemo(() => getRelatedNotes(notes, selectedNote), [notes, selectedNote])
  const searchResults = useMemo(() => semanticSearch(notes, searchInput), [notes, searchInput])

  const noteNodes = useMemo(
    () =>
      notes.map((note, index) => ({
        id: note.id,
        title: note.title,
        x: 20 + ((index * 23) % 65),
        y: 24 + ((index * 19) % 55),
      })),
    [notes],
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
    }
    setEditorDraft(draft)
    setSelectedNoteId(draft.id)
    setActiveView('editor')
  }

  function saveCurrentNote() {
    const nextNote = {
      ...editorDraft,
      title:
        editorDraft.title && editorDraft.title !== 'Untitled Note'
          ? editorDraft.title
          : getAutoTitle(editorDraft.content),
      tags: getAutoTags(editorDraft.content),
      summary: summarizeContent(editorDraft.content),
      actionItems: extractActionItems(editorDraft.content),
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
  }

  function deleteNote(noteId) {
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
    if (selectedNoteId === noteId) {
      const fallback = notes.find((note) => note.id !== noteId)
      if (fallback) {
        setSelectedNoteId(fallback.id)
        setEditorDraft(fallback)
      }
    }
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

  function runSpark(action) {
    if (action === 'summary') {
      setEditorDraft((prev) => ({ ...prev, summary: summarizeContent(prev.content) }))
    }
    if (action === 'actions') {
      setEditorDraft((prev) => ({ ...prev, actionItems: extractActionItems(prev.content) }))
    }
    if (action === 'grammar') {
      const polished = editorDraft.content
        .replace(/\s{2,}/g, ' ')
        .replace(/\bi\b/g, 'I')
        .replace(/\s+\./g, '.')
      setEditorDraft((prev) => ({ ...prev, content: polished }))
    }
  }

  function chatWithNotes() {
    const question = normalizeText(chatQuestion)
    if (!question.trim()) {
      setChatAnswer('Ask a question about your saved notes.')
      return
    }

    const bestMatch = semanticSearch(notes, question).direct[0] || semanticSearch(notes, question).related[0]
    if (!bestMatch) {
      setChatAnswer('I could not find a relevant note in your local brain yet.')
      return
    }

    setChatAnswer(
      `From "${bestMatch.note.title}": ${bestMatch.note.summary} Top tags: ${bestMatch.note.tags
        .map((tag) => `#${tag}`)
        .join(' ')}.`,
    )
  }

  return (
    <div className="app-shell">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;700;800&family=Inter:wght@300;400;500;600&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />

      <LeftRail
        activeView={activeView}
        onViewChange={setActiveView}
        onAddNote={createNewNote}
      />

      <main className="main-stage">
        <TopNav
          onCreateNote={createNewNote}
          onViewChange={setActiveView}
        />

        {activeView === 'dashboard' && (
          <Dashboard
            notes={notes}
            selectedNoteId={selectedNoteId}
            relatedNotes={relatedNotes}
            chatQuestion={chatQuestion}
            chatAnswer={chatAnswer}
            onSelectNote={handleSelectNote}
            onEditNote={switchToEditor}
            onDeleteNote={deleteNote}
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
      </main>
    </div>
  )
}

export default App