export function TopNav({ onCreateNote, onViewChange }) {
  return (
    <header className="top-nav">
      <div>
        <h1>The Cognitive Sanctuary</h1>
        <p>Local Intelligence Mode</p>
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