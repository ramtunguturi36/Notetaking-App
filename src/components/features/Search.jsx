export function Search({ searchInput, onSearchChange, searchResults, onSelectNote }) {
  return (
    <section className="search-overlay">
      <div className="search-panel">
        <div className="search-head">
          <span className="material-symbols-outlined">auto_awesome</span>
          <input
            value={searchInput}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search for ideas"
          />
        </div>
        <div className="search-results">
          <div>
            <h4>Direct Matches</h4>
            {searchResults.direct.length ? (
              searchResults.direct.map((entry) => (
                <button key={entry.note.id} onClick={() => onSelectNote(entry.note)}>
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
                <button key={entry.note.id} onClick={() => onSelectNote(entry.note)}>
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
  )
}