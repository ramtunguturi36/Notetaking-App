import { NAV_ITEMS } from '../../constants/navigation'

export function LeftRail({ activeView, onViewChange, onAddNote }) {
  return (
    <aside className="left-rail">
      <div className="brand">S</div>
      <nav className="rail-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`rail-btn ${activeView === item.id ? 'active' : ''}`}
            onClick={() => onViewChange(item.id)}
            title={item.label}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
          </button>
        ))}
      </nav>
      <button className="fab-mini" onClick={onAddNote}>
        <span className="material-symbols-outlined">add</span>
      </button>
    </aside>
  )
}