export function NoteCard({ note, isSelected, onSelect, onEdit, onDelete }) {
  return (
    <article
      key={note.id}
      className={`note-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="card-top">
        <span>{note.inbox ? 'Inbox' : 'Processed'}</span>
        <button
          className="icon-btn"
          onClick={(event) => {
            event.stopPropagation()
            onEdit(note)
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
        <button onClick={() => onEdit(note)}>Edit</button>
        <button
          className="danger"
          onClick={(event) => {
            event.stopPropagation()
            onDelete(note.id)
          }}
        >
          Delete
        </button>
      </div>
    </article>
  )
}