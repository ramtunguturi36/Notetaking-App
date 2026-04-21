import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAutoTags,
  summarizeContent,
  extractActionItems,
} from "../../utils/notes";

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toEditorHtml(content) {
  if (!content) {
    return "";
  }

  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    return content;
  }

  return escapeHtml(content).replace(/\n/g, "<br>");
}

export function Editor({
  note,
  onTitleChange,
  onContentChange,
  onRunSpark,
  onSave,
  showSlashMenu,
  onOpenSlashMenu,
  onCloseSlashMenu,
  onToggleSlashMenu,
}) {
  const editorRef = useRef(null);
  const slashInputRef = useRef(null);
  const [slashQuery, setSlashQuery] = useState("");
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const nextHtml = toEditorHtml(note.content);
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }, [note.content]);

  useEffect(() => {
    if (!showSlashMenu) {
      setSlashQuery("");
      return;
    }

    const timeoutId = setTimeout(() => {
      slashInputRef.current?.focus();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [showSlashMenu]);

  const syncContent = () => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    onContentChange(editor.innerHTML);
  };

  const getLiveContent = () => editorRef.current?.innerHTML || note.content;

  const applyCommand = (command, value = null) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(command, false, value);
    syncContent();
    refreshFormatState();
  };

  const closeSlashMenu = () => {
    onCloseSlashMenu();
    setSlashQuery("");
  };

  const refreshFormatState = () => {
    const commandNames = [
      "bold",
      "italic",
      "underline",
      "strikeThrough",
      "justifyLeft",
      "justifyCenter",
      "justifyRight",
      "justifyFull",
      "insertUnorderedList",
      "insertOrderedList",
    ];

    const nextState = commandNames.reduce((accumulator, commandName) => {
      accumulator[commandName] = document.queryCommandState(commandName);
      return accumulator;
    }, {});

    setFormatState(nextState);
  };

  const setBlockType = (value) => {
    if (!value) {
      return;
    }

    if (value === "p") {
      applyCommand("formatBlock", "<p>");
      return;
    }

    applyCommand("formatBlock", `<${value}>`);
  };

  const setFontFamily = (value) => {
    if (!value) {
      return;
    }

    applyCommand("fontName", value);
  };

  const setTextColor = (value) => {
    applyCommand("foreColor", value);
  };

  const setHighlightColor = (value) => {
    applyCommand("hiliteColor", value);
  };

  const setOrderedListType = (type) => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    editor.focus();
    if (!document.queryCommandState("insertOrderedList")) {
      document.execCommand("insertOrderedList", false);
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      syncContent();
      refreshFormatState();
      return;
    }

    const range = selection.getRangeAt(0);
    let container = range.startContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }

    const orderedList = container?.closest?.("ol");
    if (orderedList) {
      orderedList.style.listStyleType = type;
      orderedList.setAttribute("type", type === "upper-alpha" ? "A" : type === "lower-alpha" ? "a" : type === "upper-roman" ? "I" : type === "lower-roman" ? "i" : "1");
    }

    syncContent();
    refreshFormatState();
  };

  const insertParagraphAfterSelection = () => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    range.collapse(false);
    const paragraph = document.createElement("p");
    paragraph.innerHTML = "<br>";
    range.insertNode(paragraph);
    range.setStart(paragraph, 0);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const insertTable = (rows = 3, columns = 3) => {
    const safeRows = Math.max(2, Math.min(8, rows));
    const safeColumns = Math.max(2, Math.min(8, columns));

    const headerCells = Array.from({ length: safeColumns }, (_, index) => {
      const label = String.fromCharCode(65 + index);
      return `<th>Header ${label}</th>`;
    }).join("");

    const bodyRows = Array.from({ length: safeRows - 1 }, (_, rowIndex) => {
      const bodyCells = Array.from({ length: safeColumns }, (_, colIndex) => {
        return `<td>R${rowIndex + 1}C${colIndex + 1}</td>`;
      }).join("");

      return `<tr>${bodyCells}</tr>`;
    }).join("");

    const html = `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    applyCommand("insertHTML", html);
    insertParagraphAfterSelection();
    syncContent();
  };

  const insertTaskList = () => {
    const html = [
      '<ul class="editor-task-list" data-task-list="true">',
      '<li data-task-item="true"><input type="checkbox" contenteditable="false" /> <span>New task</span></li>',
      '<li data-task-item="true"><input type="checkbox" contenteditable="false" /> <span>Follow-up task</span></li>',
      '<li data-task-item="true"><input type="checkbox" contenteditable="false" /> <span>Done criteria</span></li>',
      "</ul>",
    ].join("");

    applyCommand("insertHTML", html);
    insertParagraphAfterSelection();
    syncContent();
  };

  const slashCommands = useMemo(
    () => [
      {
        id: "table-3x3",
        label: "Insert table",
        hint: "Create a 3 x 3 table",
        tags: "table grid rows columns",
        action: () => insertTable(3, 3),
      },
      {
        id: "table-4x2",
        label: "Insert wide table",
        hint: "Create a 4 x 2 table",
        tags: "table wide columns",
        action: () => insertTable(2, 4),
      },
      {
        id: "task-list",
        label: "Insert task list",
        hint: "Interactive checkboxes",
        tags: "task checklist todo",
        action: insertTaskList,
      },
      {
        id: "image-link",
        label: "Insert image link",
        hint: "Paste a hosted image URL",
        tags: "image link media",
        action: () =>
          applyCommand(
            "insertHTML",
            '<p><a href="https://example.com/image.png" target="_blank" rel="noopener noreferrer">Image Link</a></p>',
          ),
      },
    ],
    [],
  );

  const filteredSlashCommands = useMemo(() => {
    const query = slashQuery.trim().toLowerCase();
    if (!query) {
      return slashCommands;
    }

    return slashCommands.filter((item) => {
      const haystack = `${item.label} ${item.hint} ${item.tags}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [slashCommands, slashQuery]);

  const executeSlashCommand = (command) => {
    command.action();
    closeSlashMenu();
    editorRef.current?.focus();
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL", "https://");
    if (!url) {
      return;
    }

    applyCommand("createLink", url.trim());
  };

  const handleKeyDown = (event) => {
    const isCmd = event.metaKey || event.ctrlKey;

    if (isCmd && event.key.toLowerCase() === "b") {
      event.preventDefault();
      applyCommand("bold");
      return;
    }

    if (isCmd && event.key.toLowerCase() === "i") {
      event.preventDefault();
      applyCommand("italic");
      return;
    }

    if (isCmd && event.key.toLowerCase() === "u") {
      event.preventDefault();
      applyCommand("underline");
      return;
    }

    if (event.key === "Escape" && showSlashMenu) {
      event.preventDefault();
      closeSlashMenu();
      return;
    }

    if (event.key === "Enter" && showSlashMenu && filteredSlashCommands.length) {
      event.preventDefault();
      executeSlashCommand(filteredSlashCommands[0]);
      return;
    }

    if (event.key === "/") {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
        return;
      }

      const range = selection.getRangeAt(0);
      const beforeRange = range.cloneRange();
      beforeRange.setStart(editorRef.current, 0);
      const textBefore = beforeRange.toString();
      const opensSlashMenu = !textBefore || /(^|\n|\s)$/.test(textBefore);

      if (opensSlashMenu) {
        event.preventDefault();
        onOpenSlashMenu();
      }
    }
  };

  const handleEditorClick = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (target.type !== "checkbox") {
      return;
    }

    if (target.checked) {
      target.setAttribute("checked", "checked");
    } else {
      target.removeAttribute("checked");
    }

    syncContent();
  };

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
          {/* <button onClick={() => onRunSpark('summary', getLiveContent())}>TL;DR</button> */}
          <button onClick={() => onRunSpark("grammar", getLiveContent())}>
            Fix Grammar
          </button>
          <button onClick={() => onRunSpark("actions", getLiveContent())}>
            Generate Tasks
          </button>
          <button className="primary" onClick={() => onSave(getLiveContent())}>
            Save Note
          </button>
        </div>
      </div>

      <div className="floating-toolbar" role="toolbar" aria-label="Rich text toolbar">
        <div className="toolbar-group">
          <select
            className="toolbar-select"
            onChange={(event) => setBlockType(event.target.value)}
            defaultValue=""
            aria-label="Text style"
          >
            <option value="" disabled>
              Style
            </option>
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="blockquote">Quote</option>
            <option value="pre">Code Block</option>
          </select>

          <select
            className="toolbar-select"
            onChange={(event) => setFontFamily(event.target.value)}
            defaultValue=""
            aria-label="Font family"
          >
            <option value="" disabled>
              Font
            </option>
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>

        <div className="toolbar-group">
          <button
            className={formatState.bold ? "is-active" : ""}
            onClick={() => applyCommand("bold")}
          >
            B
          </button>
          <button
            className={formatState.italic ? "is-active" : ""}
            onClick={() => applyCommand("italic")}
          >
            I
          </button>
          <button
            className={formatState.underline ? "is-active" : ""}
            onClick={() => applyCommand("underline")}
          >
            U
          </button>
          <button
            className={formatState.strikeThrough ? "is-active" : ""}
            onClick={() => applyCommand("strikeThrough")}
          >
            S
          </button>
          <button onClick={() => applyCommand("removeFormat")}>Clear</button>
        </div>

        <div className="toolbar-group">
          <button
            className={formatState.justifyLeft ? "is-active" : ""}
            onClick={() => applyCommand("justifyLeft")}
          >
            Left
          </button>
          <button
            className={formatState.justifyCenter ? "is-active" : ""}
            onClick={() => applyCommand("justifyCenter")}
          >
            Center
          </button>
          <button
            className={formatState.justifyRight ? "is-active" : ""}
            onClick={() => applyCommand("justifyRight")}
          >
            Right
          </button>
          <button
            className={formatState.justifyFull ? "is-active" : ""}
            onClick={() => applyCommand("justifyFull")}
          >
            Justify
          </button>
        </div>

        <div className="toolbar-group">
          <button
            className={formatState.insertUnorderedList ? "is-active" : ""}
            onClick={() => applyCommand("insertUnorderedList")}
          >
            Bullets
          </button>
          <button
            className={formatState.insertOrderedList ? "is-active" : ""}
            onClick={() => applyCommand("insertOrderedList")}
          >
            Numbers
          </button>
          <button onClick={() => setOrderedListType("decimal")}>1</button>
          <button onClick={() => setOrderedListType("lower-alpha")}>a</button>
          <button onClick={() => setOrderedListType("upper-alpha")}>A</button>
          <button onClick={() => setOrderedListType("lower-roman")}>i</button>
          <button onClick={() => setOrderedListType("upper-roman")}>I</button>
        </div>

        <div className="toolbar-group">
          <button onClick={insertLink}>Link</button>
          <button onClick={() => applyCommand("unlink")}>Unlink</button>
          <button onClick={() => applyCommand("undo")}>Undo</button>
          <button onClick={() => applyCommand("redo")}>Redo</button>
        </div>

        <div className="toolbar-group toolbar-color-group">
          <label>
            Text
            <input
              type="color"
              defaultValue="#e5e2e1"
              onChange={(event) => setTextColor(event.target.value)}
              aria-label="Text color"
            />
          </label>
          <label>
            Mark
            <input
              type="color"
              defaultValue="#fff2a8"
              onChange={(event) => setHighlightColor(event.target.value)}
              aria-label="Highlight color"
            />
          </label>
        </div>

        <div className="toolbar-group">
          <button
            className={showSlashMenu ? "is-active" : ""}
            onClick={onToggleSlashMenu}
            title="Commands"
          >
            / Commands
          </button>
        </div>
      </div>

      {showSlashMenu && (
        <div className="slash-menu">
          <div className="slash-menu-head">
            <input
              ref={slashInputRef}
              type="text"
              value={slashQuery}
              onChange={(event) => setSlashQuery(event.target.value)}
              placeholder="Type to filter commands"
              aria-label="Filter slash commands"
            />
            <button type="button" onClick={closeSlashMenu}>
              Close
            </button>
          </div>

          <div className="slash-command-list">
            {filteredSlashCommands.length ? (
              filteredSlashCommands.map((command) => (
                <button
                  key={command.id}
                  type="button"
                  className="slash-command"
                  onClick={() => executeSlashCommand(command)}
                >
                  <strong>{command.label}</strong>
                  <span>{command.hint}</span>
                </button>
              ))
            ) : (
              <p className="slash-empty">No command found.</p>
            )}
          </div>
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
        onKeyUp={refreshFormatState}
        onMouseUp={refreshFormatState}
        onClick={handleEditorClick}
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
  );
}
