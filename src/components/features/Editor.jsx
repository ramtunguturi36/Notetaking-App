import { useEffect, useRef } from 'react'
import { getAutoTags, summarizeContent, extractActionItems } from '../../utils/notes'

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toEditorHtml(content) {
  if (!content) {
    return ''
  }

  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    return content
  }

  return escapeHtml(content).replace(/\n/g, '<br>')
}

export function Editor({
  note,
  onTitleChange,
  onContentChange,
  onRunSpark,
  onSave,
  showSlashMenu,
  onToggleSlashMenu,
}) {
  const editorRef = useRef(null)

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) {
      return
    }

    const nextHtml = toEditorHtml(note.content)
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml
    }
  }, [note.content])

  const syncContent = () => {
    const editor = editorRef.current
    if (!editor) {
      return
    }

    onContentChange(editor.innerHTML)
  }

  const getLiveContent = () => editorRef.current?.innerHTML || note.content

  const applyCommand = (command, value = null) => {
    const editor = editorRef.current
    if (!editor) {
      return
    }

    editor.focus()
    document.execCommand(command, false, value)
    syncContent()
  }

  const insertHtmlAtCursor = (html) => {
    const editor = editorRef.current
    if (!editor) {
      return
    }

    editor.focus()
    document.execCommand('insertHTML', false, html)
    syncContent()
    onToggleSlashMenu()
  }

  const handleKeyDown = (event) => {
    const isCmd = event.metaKey || event.ctrlKey

    if (isCmd && event.key.toLowerCase() === 'b') {
      event.preventDefault()
      applyCommand('bold')
      return
    }

    if (isCmd && event.key.toLowerCase() === 'i') {
      event.preventDefault()
      applyCommand('italic')
      return
    }

    if (event.key === '/') {
      event.preventDefault()
      onToggleSlashMenu()
    }
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
          <button onClick={() => onRunSpark('summary', getLiveContent())}>TL;DR</button>
          <button onClick={() => onRunSpark('grammar', getLiveContent())}>Fix Grammar</button>
          <button onClick={() => onRunSpark('actions', getLiveContent())}>Generate Tasks</button>
          <button className="primary" onClick={() => onSave(getLiveContent())}>
            Save Note
          </button>
        </div>
      </div>

      <div className="floating-toolbar">
        <button onClick={() => applyCommand('bold')}>Bold</button>
        <button onClick={() => applyCommand('italic')}>Italic</button>
        <button onClick={() => applyCommand('insertUnorderedList')}>Checklist</button>
        <button onClick={() => applyCommand('formatBlock', 'h2')}>Heading</button>
        <button onClick={onToggleSlashMenu}>/</button>
      </div>

      {showSlashMenu && (
        <div className="slash-menu">
          <button onClick={() => insertHtmlAtCursor('<table><tr><th>Col A</th><th>Col B</th></tr><tr><td>1</td><td>2</td></tr></table><p></p>')}>
            Insert Table
          </button>
          <button onClick={() => insertHtmlAtCursor('<p><a href="https://example.com/image.png" target="_blank" rel="noopener noreferrer">Image Link</a></p>')}>
            Insert Image Link
          </button>
          <button onClick={() => insertHtmlAtCursor('<ul><li>New task</li></ul><p></p>')}>
            Insert Task List
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        className="editor-textarea"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Start writing your thought dump..."
        onInput={syncContent}
        onKeyDown={handleKeyDown}
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