import { NAV_ITEMS } from '../../constants/navigation'

export function LeftRail({ activeView, onViewChange, onAddNote }) {
  return (
    <aside className="left-rail">
      <div className="rail-brand">
        <div className="brand">S</div>
      </div>
      <nav className="rail-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`rail-btn ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
            aria-label={item.label}
            title={item.label}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
          </button>
        ))}
      </nav>
      <div className="rail-footer">
        <button className="fab-mini" onClick={onAddNote}>
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </aside>
  )
}