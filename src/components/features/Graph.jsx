export function GraphView({ noteNodes, notes, selectedNoteId, onSelectNote }) {
  return (
    <section className="graph-view">
      <svg className="graph-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {noteNodes.map((node, idx) => {
          const next = noteNodes[(idx + 1) % noteNodes.length]
          return (
            <line
              key={`${node.id}-${next.id}`}
              x1={node.x}
              y1={node.y}
              x2={next.x}
              y2={next.y}
              stroke="rgba(192,193,255,0.25)"
              strokeWidth="0.2"
            />
          )
        })}
      </svg>

      <div className="graph-hud">
        <h2>Second Brain Visualizer</h2>
        <p>{notes.length} nodes connected</p>
      </div>

      {noteNodes.map((node) => {
        const active = selectedNoteId === node.id
        return (
          <button
            key={node.id}
            className={`graph-node ${active ? 'active' : ''}`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            onClick={() => onSelectNote(node.id)}
          >
            <span>{notes.find((n) => n.id === node.id)?.title || node.title}</span>
          </button>
        )
      })}
    </section>
  )
}