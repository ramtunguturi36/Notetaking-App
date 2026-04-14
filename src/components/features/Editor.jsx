import { useRef } from 'react'
import { getAutoTags, summarizeContent, extractActionItems } from '../../utils/notes'

export function Editor({
  note,
  onTitleChange,
  onContentChange,
  onInsertAtCursor,
  onRunSpark,
  onSave,
  showSlashMenu,
  onToggleSlashMenu,
}) {
  const textareaRef = useRef(null)

  const handleInsert = (prefix, suffix = '') => {
    const area = textareaRef.current
    if (!area) return
    
    const start = area.selectionStart
    const end = area.selectionEnd
    const before = note.content.slice(0, start)
    const selection = note.content.slice(start, end)
    const after = note.content.slice(end)
    const newContent = `${before}${prefix}${selection}${suffix}${after}`
    onContentChange(newContent)
  }

  const handleSlashMenu = () => {
    onToggleSlashMenu()
  }

  return (
    <section className="editor-view">
      <div className="editor-header">
        <input
          className="title-input"
          value={note.title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Untitled Note"
        />
        <div className="editor-actions">
          <button onClick={() => onRunSpark('summary')}>TL;DR</button>
          <button onClick={() => onRunSpark('grammar')}>Fix Grammar</button>
          <button onClick={() => onRunSpark('actions')}>Generate Tasks</button>
          <button className="primary" onClick={onSave}>
            Save Note
          </button>
        </div>
      </div>

      <div className="floating-toolbar">
        <button onClick={() => handleInsert('**', '**')}>Bold</button>
        <button onClick={() => handleInsert('*', '*')}>Italic</button>
        <button onClick={() => handleInsert('- [ ] ')}>Checklist</button>
        <button onClick={() => handleInsert('## ')}>Heading</button>
        <button onClick={handleSlashMenu}>/</button>
      </div>

      {showSlashMenu && (
        <div className="slash-menu">
          <button onClick={() => handleInsert('\n| Col A | Col B |\n| --- | --- |\n| 1 | 2 |\n')}>Insert Table</button>
          <button onClick={() => handleInsert('\n![image](https://example.com/image.png)\n')}>Insert Image Link</button>
          <button onClick={() => handleInsert('\n- [ ] New task\n')}>Insert Task List</button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={note.content}
        placeholder="Start writing your thought dump..."
        onChange={(event) => {
          const next = event.target.value
          onContentChange(next)
          if (next.endsWith('/')) {
            onToggleSlashMenu()
          }
        }}
      />

      <section className="editor-metadata">
        <div>
          <h4>AI Summary</h4>
          <p>{note.summary || summarizeContent(note.content)}</p>
        </div>
        <div>
          <h4>Action Items</h4>
          <ul>
            {(note.actionItems.length
              ? note.actionItems
              : extractActionItems(note.content)
            ).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Auto Tags</h4>
          <div className="tags-row">
            {getAutoTags(note.content).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        </div>
      </section>
    </section>
  )
}