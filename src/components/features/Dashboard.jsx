import { extractActionItems } from '../../utils/notes'
import { NoteCard } from '../notes/NoteCard'
import { ChatBox } from '../notes/ChatBox'

export function Dashboard({
  notes,
  selectedNoteId,
  relatedNotes,
  chatQuestion,
  chatAnswer,
  chatLoading,
  onSelectNote,
  onEditNote,
  onDeleteNote,
  onToggleFavorite,
  sortMode,
  onSortModeChange,
  onSwitchToEditor,
  onChatAsk,
  onChatQuestionChange,
}) {
  const favoriteCount = notes.filter((note) => note.favorite).length
  const tagCount = new Set(notes.flatMap((note) => note.tags || [])).size
  const taskCount = notes.reduce((total, note) => {
    if (note.actionItems?.length) {
      return total + note.actionItems.length
    }

    return total + extractActionItems(note.content || '').length
  }, 0)

  return (
    <section className="dashboard-grid">
      <div className="dash-top-row">
        <div className="dash-left panel">
          <h3>Overview</h3>
          <div className="dash-stats">
            <div className="dash-stat">
              <span className="material-symbols-outlined dash-stat-icon">star</span>
              <strong>{favoriteCount}</strong>
              <span>Favorites</span>
            </div>
            <div className="dash-stat">
              <span className="material-symbols-outlined dash-stat-icon">notes</span>
              <strong>{notes.length}</strong>
              <span>All notes</span>
            </div>
            <div className="dash-stat">
              <span className="material-symbols-outlined dash-stat-icon">sell</span>
              <strong>{tagCount}</strong>
              <span>Tags</span>
            </div>
            <div className="dash-stat">
              <span className="material-symbols-outlined dash-stat-icon">task_alt</span>
              <strong>{taskCount}</strong>
              <span>Tasks</span>
            </div>
          </div>
          <div className="sort-strip" aria-label="Note sorting">
            <button
              className={sortMode === 'favorites' ? 'active' : ''}
              onClick={() => onSortModeChange('favorites')}
              title="Favorites first"
            >
              <span className="material-symbols-outlined sort-icon">star</span>
            </button>
            <button
              className={sortMode === 'recent' ? 'active' : ''}
              onClick={() => onSortModeChange('recent')}
              title="Recent first"
            >
              <span className="material-symbols-outlined sort-icon">schedule</span>
            </button>
          </div>
        </div>

        <div className="dash-right panel">
          <h3>Contextual AI</h3>
          {selectedNoteId ? (
            <>
              <div className="context-sections">
                <section className="context-section">
                  <div className="context-box">
                    <p>{notes.find((n) => n.id === selectedNoteId)?.summary}</p>
                  </div>
                  <h4>Related Notes</h4>
                  <div className="related-list">
                    {relatedNotes.length ? (
                      relatedNotes.map((entry) => (
                        <button key={entry.note.id} onClick={() => onSwitchToEditor(entry.note)}>
                          <strong>{entry.note.title}</strong>
                          <span>{75 + entry.score * 8}% semantic match</span>
                        </button>
                      ))
                    ) : (
                      <p className="muted">No close related note yet.</p>
                    )}
                  </div>
                </section>

                <div className="context-right-column">
                  <div className="context-chat-wrap">
                    <ChatBox
                      question={chatQuestion}
                      answer={chatAnswer}
                      loading={chatLoading}
                      onQuestionChange={onChatQuestionChange}
                      onAsk={onChatAsk}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="muted">Select a note to load contextual AI.</p>
          )}

        </div>
      </div>

      <div className="dash-middle">
        <div className="stream-grid">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onSelect={() => onSelectNote(note.id, note)}
              onEdit={onSwitchToEditor}
              onDelete={onDeleteNote}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </div>
    </section>
  )
}