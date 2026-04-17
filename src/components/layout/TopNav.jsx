export function TopNav({ onCreateNote, onViewChange }) {
  return (
    <header className="top-nav">
      <div className="top-nav-brand">
        <div className="nav-badge">
          <span className="material-symbols-outlined nav-icon">lightbulb</span>
        </div>
        <div className="nav-text">
          <h1>Sanctuary</h1>
          <p>Local Intelligence</p>
        </div>
      </div>
      <div className="top-actions">
        <button onClick={() => onViewChange('search')}>Semantic Search</button>
        <button onClick={() => onViewChange('graph')}>Network</button>
        <button className="primary" onClick={onCreateNote}>
          Create Note
        </button>
      </div>
    </header>
  )
}