export function TopNav({
  onCreateNote,
  onViewChange,
  theme = "dark",
  onToggleTheme,
  isThemeSwitching = false,
}) {
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
        <button
          className={`theme-toggle ${isThemeSwitching ? "is-switching" : ""}`.trim()}
          onClick={onToggleTheme}
          title="Toggle light and dark theme"
          disabled={isThemeSwitching}
          aria-busy={isThemeSwitching}
        >
          <span className="material-symbols-outlined">
            {theme === "light" ? "dark_mode" : "light_mode"}
          </span>
          <span>
            {isThemeSwitching
              ? "Switching..."
              : theme === "light"
                ? "Dark"
                : "Light"}
          </span>
        </button>
        <button onClick={() => onViewChange("search")}>Semantic Search</button>
        <button onClick={() => onViewChange("graph")}>Network</button>
        <button className="primary" onClick={onCreateNote}>
          Create Note
        </button>
      </div>
    </header>
  );
}
