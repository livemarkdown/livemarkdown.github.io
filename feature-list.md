# LiveMarkdown — Feature List

## Implemented

### Core Editor
- Live Markdown preview with 120ms debounce
- Line numbers synced to scroll position
- Tab key inserts 2-space soft indent
- Auto-save to `localStorage` (800ms debounce, restored on reload)
- Cursor position tracking (Ln / Col in status bar)

### Rendering & Visualization
- Full GitHub Flavored Markdown (GFM) via marked.js
- Syntax highlighting for 100+ languages via highlight.js
- LaTeX / KaTeX math — inline `$…$` and display `$$…$$`
- Mermaid diagrams — flowchart, sequence, pie, git, and more
- Per-code-block copy button

### Formatting Toolbar
- Bold, Italic, Strikethrough
- Inline code, Code block
- Heading 1, 2, 3
- Unordered list, Ordered list, Task list
- Link, Image, Blockquote, Table, Horizontal rule
- LaTeX math block, Mermaid diagram block

### Find & Replace
- Ctrl+F to open find bar
- Live match highlighting in editor (background overlay layer)
- Previous / Next match navigation
- Replace single match
- Replace all matches
- Match counter (e.g. 3/12)

### File Management
- Open `.md`, `.txt`, `.markdown` files via file picker
- Drag & drop `.md` / `.txt` files onto the editor
- Export as Markdown (`.md`)
- Export as self-contained HTML (`.html`)
- Export / Print as PDF via browser print dialog

### Layout & Navigation
- 4 layout modes: Editor Left, Editor Right, Editor Top, Editor Bottom
- Draggable divider to resize panes (mouse & touch)
- Independent fullscreen for editor pane
- Independent fullscreen for preview pane
- Escape to exit fullscreen

### Scrolling
- Synchronized scroll between editor and preview
- Sync scroll toggle button (on/off)

### Customization
- Dark mode / Light mode toggle
- Preview font family selector (Serif / Sans / Mono)
- Preview font size slider (13px – 22px)
- Spell check toggle (on/off)

### Status Bar
- Live word count
- Character count
- Line count
- Reading time estimate (~N min read)
- Cursor position (Ln, Col)
- Spell check toggle button

### Actions
- Load sample content (with confirmation if editor has content)
- Auto-format Markdown (normalize headings, lists, spacing)
- Clear editor (with confirmation modal)

### Accessibility & UX
- Keyboard shortcuts panel (`?` key or toolbar button)
- Tooltip on every toolbar button
- Toast notifications for all actions
- Confirmation modals for destructive actions
- Responsive design (mobile, tablet, desktop)
- Drag-over visual overlay when dropping files

---

## Planned — High Priority

### Editor
- Bracket / quote auto-close (`(`, `[`, `{`, `*`, `"`)
- Undo / redo history preservation across sessions

### Drag & drop file open
- Drop a .md file onto editor

### Navigation
- Table of contents panel (auto-generated from headings)
- Document outline sidebar with jump-to-heading

### File Management
- Paste HTML → Markdown conversion (clipboard)
- Export to `.docx` (Word)
- Multiple documents / tabs

### Distribution
- PWA manifest + service worker (install as app, offline use)

---

## Planned — Nice to Have

### Multiple documents / tabs
- Open several files at once

### Editor
- Typewriter scroll mode (cursor stays vertically centered)
- Word / character goal tracker with progress bar
- Snippets / text expansion (e.g. `/date`, `/table`)
- Emoji picker in toolbar

### Visualization
- Chart.js code blocks (render ` ```chart ` as live charts)
- PlantUML diagram support

### Customization
- Custom preview CSS injection
- Color scheme presets (GitHub, Dracula, Solarized)
- Editor font size control

### File Management
- Import from URL (fetch remote `.md` file)
- Shareable read-only link (encode content in URL)
- GitHub Gist save / load

### UX
- Focus / Zen mode (hide all UI, center text only)

### Export to .docx (Word)
- python-docx via backend or js lib

---

## Future / Advanced

### Editor
- Vim keybindings mode
- Emacs keybindings mode
- Minimap (VS Code-style overview scrollbar)
- Named version history with restore

### File Management
- Google Drive sync
- Dropbox sync

### Visualization
- Excalidraw hand-drawn diagram embed
- Presentation / slides mode (Reveal.js via `---` separator)

### Collaboration
- Real-time collaborative editing (WebSocket)