export function TopNav({ onCreateNote, onViewChange, theme = 'dark', onToggleTheme }) {
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
        <button className="theme-toggle" onClick={onToggleTheme} title="Toggle light and dark theme">
          <span className="material-symbols-outlined">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
        <button onClick={() => onViewChange('search')}>Semantic Search</button>
        <button onClick={() => onViewChange('graph')}>Network</button>
        <button className="primary" onClick={onCreateNote}>
          Create Note
        </button>
      </div>
    </header>
  )
}