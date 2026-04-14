import { useMemo, useRef, useState } from 'react'
import './App.css'

const INITIAL_NOTES = [
  {
    id: 'n1',
    title: 'Architecting Digital Stillness',
    content:
      'The modern interface is often a battleground for attention. I need to refine the editor layout for calm writing. ## Key Idea\nNegative space is a functional design tool.',
    tags: ['design', 'ux', 'productivity'],
    summary: 'A note about reducing interface noise and designing for focused thinking.',
    actionItems: ['Refine the editor layout for calm writing.'],
    createdAt: '2026-04-11T09:00:00.000Z',
    updatedAt: '2026-04-11T10:10:00.000Z',
    inbox: true,
  },
  {
    id: 'n2',
    title: 'Pythonic Concurrency Patterns',
    content:
      'Detailed analysis of asyncio and threading for backend services. TODO: benchmark worker pool strategy. I should compare throughput with queue backpressure.',
    tags: ['python', 'backend', 'performance'],
    summary: 'Compares Python concurrency approaches for scalable backend workloads.',
    actionItems: [
      'Benchmark worker pool strategy.',
      'Compare throughput with queue backpressure.',
    ],
    createdAt: '2026-04-10T18:00:00.000Z',
    updatedAt: '2026-04-10T19:20:00.000Z',
    inbox: false,
  },
  {
    id: 'n3',
    title: 'Neural Architecture Research',
    content:
      'An exploration into the structural patterns of artificial and biological cognition. Action: link this with graph view interactions.',
    tags: ['research', 'ai', 'graph'],
    summary: 'Examines overlaps between biological and machine cognition structures.',
    actionItems: ['Link this with graph view interactions.'],
    createdAt: '2026-04-09T12:40:00.000Z',
    updatedAt: '2026-04-12T07:30:00.000Z',
    inbox: false,
  },
]

const NAV_ITEMS = [
  { id: 'dashboard', icon: 'dashboard', label: 'Command Center' },
  { id: 'editor', icon: 'description', label: 'Focus Editor' },
  { id: 'graph', icon: 'hub', label: 'Graph' },
  { id: 'search', icon: 'search', label: 'Search' },
]

const CONCEPT_MAP = {
  money: ['budget', 'finance', 'saving'],
  python: ['backend', 'api', 'asyncio'],
  design: ['ux', 'interface', 'layout'],
  graph: ['node', 'connection', 'network'],
  focus: ['distraction', 'deep work', 'clarity'],
}

function normalizeText(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s#]/g, ' ')
}

function getAutoTitle(content) {
  const clean = content.replace(/[#*_`>-]/g, '').trim()
  if (!clean) {
    return 'Untitled Note'
  }
  const firstSentence = clean.split(/[.!?\n]/).find((part) => part.trim().length > 6) || clean
  return firstSentence.trim().split(' ').slice(0, 6).join(' ')
}

function getAutoTags(content) {
  const text = normalizeText(content)
  const keywords = ['python', 'design', 'research', 'ai', 'finance', 'backend', 'graph', 'focus', 'productivity', 'meeting']
  const tags = keywords.filter((word) => text.includes(word)).slice(0, 4)
  if (!tags.length) {
    return ['general']
  }
  return tags
}

function summarizeContent(content) {
  const cleaned = content.replace(/\s+/g, ' ').trim()
  if (!cleaned) {
    return 'No content to summarize yet.'
  }
  return `${cleaned.split(/[.!?]/).slice(0, 2).join('. ').trim()}.`
}

function extractActionItems(content) {
  const lines = content
    .split(/[\n.]/)
    .map((line) => line.trim())
    .filter(Boolean)

  return lines
    .filter((line) => /^(todo:?|action:?|i need to|i should|we need to)/i.test(line))
    .map((line) => line.replace(/^(todo:?|action:?)/i, '').trim())
    .filter(Boolean)
}

function getRelatedNotes(notes, selectedNote) {
  if (!selectedNote) {
    return []
  }
  const selectedTagSet = new Set(selectedNote.tags)
  return notes
    .filter((note) => note.id !== selectedNote.id)
    .map((note) => {
      const overlap = note.tags.filter((tag) => selectedTagSet.has(tag)).length
      return { note, score: overlap }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}

function semanticSearch(notes, query) {
  const cleanQuery = normalizeText(query).trim()
  if (!cleanQuery) {
    return { direct: [], related: [] }
  }

  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean)
  const expandedTokens = new Set(queryTokens)
  queryTokens.forEach((token) => {
    if (CONCEPT_MAP[token]) {
      CONCEPT_MAP[token].forEach((word) => expandedTokens.add(word))
    }
  })

  const scored = notes.map((note) => {
    const haystack = normalizeText(`${note.title} ${note.content} ${note.tags.join(' ')}`)
    let directScore = 0
    let relatedScore = 0

    queryTokens.forEach((token) => {
      if (haystack.includes(token)) {
        directScore += 3
      }
    })

    expandedTokens.forEach((token) => {
      if (!queryTokens.includes(token) && haystack.includes(token)) {
        relatedScore += 1
      }
    })

    return { note, directScore, relatedScore }
  })

  return {
    direct: scored
      .filter((item) => item.directScore > 0)
      .sort((a, b) => b.directScore - a.directScore)
      .slice(0, 6),
    related: scored
      .filter((item) => item.directScore === 0 && item.relatedScore > 0)
      .sort((a, b) => b.relatedScore - a.relatedScore)
      .slice(0, 6),
  }
}

function App() {
  const [notes, setNotes] = useState(INITIAL_NOTES)
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedNoteId, setSelectedNoteId] = useState(INITIAL_NOTES[0].id)
  const [editorDraft, setEditorDraft] = useState(INITIAL_NOTES[0])
  const [searchInput, setSearchInput] = useState('python tips')
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatAnswer, setChatAnswer] = useState('')
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const textareaRef = useRef(null)

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

  function insertAtCursor(prefix, suffix = '') {
    const area = textareaRef.current
    if (!area) {
      return
    }
    const start = area.selectionStart
    const end = area.selectionEnd
    const before = editorDraft.content.slice(0, start)
    const selection = editorDraft.content.slice(start, end)
    const after = editorDraft.content.slice(end)
    const nextContent = `${before}${prefix}${selection}${suffix}${after}`
    setEditorDraft((prev) => ({ ...prev, content: nextContent }))
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

      <aside className="left-rail">
        <div className="brand">S</div>
        <nav className="rail-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`rail-btn ${activeView === item.id ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
              title={item.label}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </button>
          ))}
        </nav>
        <button className="fab-mini" onClick={createNewNote}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </aside>

      <main className="main-stage">
        <header className="top-nav">
          <div>
            <h1>The Cognitive Sanctuary</h1>
            <p>Local Intelligence Mode</p>
          </div>
          <div className="top-actions">
            <button onClick={() => setActiveView('search')}>Semantic Search</button>
            <button onClick={() => setActiveView('graph')}>Network</button>
            <button className="primary" onClick={createNewNote}>
              Create Note
            </button>
          </div>
        </header>

        {activeView === 'dashboard' && (
          <section className="dashboard-grid">
            <div className="dash-left panel">
              <h3>Navigation</h3>
              <ul>
                <li>Inbox ({notes.filter((note) => note.inbox).length})</li>
                <li>All Notes ({notes.length})</li>
                <li>Workspaces</li>
                <li>Tags</li>
              </ul>
              <h4>Recents</h4>
              <div className="recent-list">
                {notes.slice(0, 3).map((note) => (
                  <button key={note.id} onClick={() => switchToEditor(note)} className="recent-card">
                    <strong>{note.title}</strong>
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="dash-middle">
              <div className="stream-head">
                <h2>The Stream</h2>
                <span>AI title, summary, and tags</span>
              </div>
              <div className="stream-grid">
                {notes.map((note) => (
                  <article
                    key={note.id}
                    className={`note-card ${selectedNoteId === note.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedNoteId(note.id)
                      setEditorDraft(note)
                    }}
                  >
                    <div className="card-top">
                      <span>{note.inbox ? 'Inbox' : 'Processed'}</span>
                      <button
                        className="icon-btn"
                        onClick={(event) => {
                          event.stopPropagation()
                          switchToEditor(note)
                        }}
                      >
                        <span className="material-symbols-outlined">open_in_new</span>
                      </button>
                    </div>
                    <h3>{note.title}</h3>
                    <p>{note.summary}</p>
                    <div className="tags-row">
                      {note.tags.map((tag) => (
                        <span key={`${note.id}-${tag}`}>#{tag}</span>
                      ))}
                    </div>
                    <div className="card-actions">
                      <button onClick={() => switchToEditor(note)}>Edit</button>
                      <button
                        className="danger"
                        onClick={(event) => {
                          event.stopPropagation()
                          deleteNote(note.id)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="dash-right panel">
              <h3>Contextual AI</h3>
              {selectedNote ? (
                <>
                  <div className="context-box">
                    <p>{selectedNote.summary}</p>
                  </div>
                  <h4>Related Notes</h4>
                  <div className="related-list">
                    {relatedNotes.length ? (
                      relatedNotes.map((entry) => (
                        <button key={entry.note.id} onClick={() => switchToEditor(entry.note)}>
                          <strong>{entry.note.title}</strong>
                          <span>{75 + entry.score * 8}% semantic match</span>
                        </button>
                      ))
                    ) : (
                      <p className="muted">No close related note yet.</p>
                    )}
                  </div>
                  <h4>Extracted Tasks</h4>
                  <div className="task-list">
                    {selectedNote.actionItems.length ? (
                      selectedNote.actionItems.map((task) => (
                        <label key={task}>
                          <input type="checkbox" />
                          <span>{task}</span>
                        </label>
                      ))
                    ) : (
                      <p className="muted">No action items detected.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="muted">Select a note to load contextual AI.</p>
              )}

              <div className="chat-box">
                <h4>Chat with Your Notes</h4>
                <input
                  value={chatQuestion}
                  onChange={(event) => setChatQuestion(event.target.value)}
                  placeholder="What did I decide about graph view?"
                />
                <button onClick={chatWithNotes}>Ask</button>
                <p>{chatAnswer}</p>
              </div>
            </div>
          </section>
        )}

        {activeView === 'editor' && (
          <section className="editor-view">
            <div className="editor-header">
              <input
                className="title-input"
                value={editorDraft.title}
                onChange={(event) => setEditorDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Untitled Note"
              />
              <div className="editor-actions">
                <button onClick={() => runSpark('summary')}>TL;DR</button>
                <button onClick={() => runSpark('grammar')}>Fix Grammar</button>
                <button onClick={() => runSpark('actions')}>Generate Tasks</button>
                <button className="primary" onClick={saveCurrentNote}>
                  Save Note
                </button>
              </div>
            </div>

            <div className="floating-toolbar">
              <button onClick={() => insertAtCursor('**', '**')}>Bold</button>
              <button onClick={() => insertAtCursor('*', '*')}>Italic</button>
              <button onClick={() => insertAtCursor('- [ ] ')}>Checklist</button>
              <button onClick={() => insertAtCursor('## ')}>Heading</button>
              <button onClick={() => setShowSlashMenu((prev) => !prev)}>/</button>
            </div>

            {showSlashMenu && (
              <div className="slash-menu">
                <button onClick={() => insertAtCursor('\n| Col A | Col B |\n| --- | --- |\n| 1 | 2 |\n')}>Insert Table</button>
                <button onClick={() => insertAtCursor('\n![image](https://example.com/image.png)\n')}>Insert Image Link</button>
                <button onClick={() => insertAtCursor('\n- [ ] New task\n')}>Insert Task List</button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              className="editor-textarea"
              value={editorDraft.content}
              placeholder="Start writing your thought dump..."
              onChange={(event) => {
                const next = event.target.value
                setEditorDraft((prev) => ({ ...prev, content: next }))
                if (next.endsWith('/')) {
                  setShowSlashMenu(true)
                }
              }}
            />

            <section className="editor-metadata">
              <div>
                <h4>AI Summary</h4>
                <p>{editorDraft.summary || summarizeContent(editorDraft.content)}</p>
              </div>
              <div>
                <h4>Action Items</h4>
                <ul>
                  {(editorDraft.actionItems.length
                    ? editorDraft.actionItems
                    : extractActionItems(editorDraft.content)
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Auto Tags</h4>
                <div className="tags-row">
                  {getAutoTags(editorDraft.content).map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>
            </section>
          </section>
        )}

        {activeView === 'search' && (
          <section className="search-overlay">
            <div className="search-panel">
              <div className="search-head">
                <span className="material-symbols-outlined">auto_awesome</span>
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search for ideas"
                />
              </div>
              <div className="search-results">
                <div>
                  <h4>Direct Matches</h4>
                  {searchResults.direct.length ? (
                    searchResults.direct.map((entry) => (
                      <button key={entry.note.id} onClick={() => switchToEditor(entry.note)}>
                        <strong>{entry.note.title}</strong>
                        <p>{entry.note.summary}</p>
                      </button>
                    ))
                  ) : (
                    <p className="muted">No direct matches.</p>
                  )}
                </div>
                <div>
                  <h4>Related Concepts</h4>
                  {searchResults.related.length ? (
                    searchResults.related.map((entry) => (
                      <button key={entry.note.id} onClick={() => switchToEditor(entry.note)}>
                        <strong>{entry.note.title}</strong>
                        <p>Related by conceptual similarity</p>
                      </button>
                    ))
                  ) : (
                    <p className="muted">No related concepts found.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeView === 'graph' && (
          <section className="graph-view">
            <svg className="graph-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              {noteNodes.map((node, idx) => {
                const next = noteNodes[(idx + 1) % noteNodes.length]
                return (
                  <line
                    key={`${node.id}-${next.id}`}
                    x1={node.x}
                    y1={node.y}
                    x2={next.x}
                    y2={next.y}
                    stroke="rgba(192,193,255,0.25)"
                    strokeWidth="0.2"
                  />
                )
              })}
            </svg>

            <div className="graph-hud">
              <h2>Second Brain Visualizer</h2>
              <p>{notes.length} nodes connected</p>
            </div>

            {noteNodes.map((node) => {
              const active = selectedNoteId === node.id
              return (
                <button
                  key={node.id}
                  className={`graph-node ${active ? 'active' : ''}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onClick={() => {
                    const note = notes.find((item) => item.id === node.id)
                    if (note) {
                      switchToEditor(note)
                    }
                  }}
                >
                  <span>{node.title}</span>
                </button>
              )
            })}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
