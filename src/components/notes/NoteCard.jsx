export function NoteCard({ note, isSelected, onSelect, onEdit, onDelete, onToggleFavorite }) {
  const createdAt = new Date(note.createdAt)
  const createdLabel = Number.isNaN(createdAt.getTime())
    ? 'Unknown date'
    : createdAt.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

  return (
    <article
      key={note.id}
      className={`note-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="card-top">
        <time className="card-date" dateTime={note.createdAt || ''}>{createdLabel}</time>
        <div className="card-top-actions">
          <button
            className={`icon-btn favorite-btn ${note.favorite ? 'active' : ''}`}
            aria-label={note.favorite ? `Remove ${note.title} from favorites` : `Favorite ${note.title}`}
            title={note.favorite ? 'Unfavorite note' : 'Favorite note'}
            onClick={(event) => {
              event.stopPropagation()
              onToggleFavorite(note.id)
            }}
          >
            <span className="material-symbols-outlined">
              {note.favorite ? 'star' : 'star_outline'}
            </span>
          </button>
          <button
            className="icon-btn"
            aria-label={`Open ${note.title}`}
            title="Open note"
            onClick={(event) => {
              event.stopPropagation()
              onEdit(note)
            }}
          >
            <span className="material-symbols-outlined">open_in_new</span>
          </button>
        </div>
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
          className="icon-btn danger card-delete-btn"
          aria-label={`Delete ${note.title}`}
          title="Delete note"
          onClick={(event) => {
            event.stopPropagation()
            onDelete(note.id)
          }}
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </article>
  )
}