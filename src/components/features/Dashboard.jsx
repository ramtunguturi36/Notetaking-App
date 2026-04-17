import { NoteCard } from '../notes/NoteCard'
import { ChatBox } from '../notes/ChatBox'

export function Dashboard({
  notes,
  selectedNoteId,
  relatedNotes,
  chatQuestion,
  chatAnswer,
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
  const inboxCount = notes.filter((note) => note.inbox).length

  return (
    <section className="dashboard-grid">
      <div className="dash-left panel">
        <h3>Overview</h3>
        <div className="dash-stats">
          <div className="dash-stat">
            <span className="material-symbols-outlined dash-stat-icon">inbox</span>
            <strong>{inboxCount}</strong>
            <span>Inbox</span>
          </div>
          <div className="dash-stat">
            <span className="material-symbols-outlined dash-stat-icon">notes</span>
            <strong>{notes.length}</strong>
            <span>All notes</span>
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
        <h4>Recents</h4>
        <div className="recent-list">
          {notes.slice(0, 3).map((note) => (
            <button key={note.id} onClick={() => onSwitchToEditor(note)} className="recent-card">
              <strong>{note.title}</strong>
              <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
            </button>
          ))}
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

      <div className="dash-right panel">
        <h3>Contextual AI</h3>
        {selectedNoteId ? (
          <>
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
            <h4>Extracted Tasks</h4>
            <div className="task-list">
              {notes.find((n) => n.id === selectedNoteId)?.actionItems.length ? (
                notes
                  .find((n) => n.id === selectedNoteId)
                  .actionItems.map((task) => (
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

        <ChatBox
          question={chatQuestion}
          answer={chatAnswer}
          onQuestionChange={onChatQuestionChange}
          onAsk={onChatAsk}
        />
      </div>
    </section>
  )
}