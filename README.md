# LiveMarkdown

**A fast, free, and privacy-focused online Markdown editor with real-time preview.** Built for developers, technical writers, and students — no installation, no account, no tracking.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-livemarkdown.github.io-3b82f6?style=flat-square&logo=github)](https://livemarkdown.github.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)
[![No Dependencies](https://img.shields.io/badge/Build-Zero%20dependencies-orange?style=flat-square)](#tech-stack)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](https://github.com/forhadkhan/livemarkdown/pulls)

![LiveMarkdown Preview](./assets/images/og-image.png)

---

## Try It

**[livemarkdown.github.io](https://livemarkdown.github.io)** - open in any modern browser and start writing.

---

## Features

### Editor
- **Multi-file tabs**: work on multiple files simultaneously with separate state persistence
- **Real-time preview**: renders as you type with a smooth 120ms debounce
- **Line numbers**: synced to scroll position
- **Find & replace**: `Ctrl+F`, live highlight overlay in the editor, prev/next navigation, replace one or all
- **Auto-save**: content persisted to `localStorage`, restored automatically on reload
- **Drag & drop**: drop any `.md` or `.txt` file directly onto the editor
- **Tab**: inserts 2-space soft indent
- **Spell check** toggle

### Rendering & Visualization
- **GitHub Flavored Markdown** (GFM) via marked.js — tables, task lists, strikethrough, autolinks
- **Syntax highlighting** for 100+ languages via highlight.js, with a per-block copy button
- **LaTeX math**: inline `$…$` and display `$$…$$` via KaTeX
- **Mermaid diagrams**: flowchart, sequence, pie, git graph, and more

### Export
| Format | How |
| ------ | --- |
| Markdown `.md` | Download raw source |
| HTML `.html` | Self-contained file with inline styles |
| PDF | Browser native print dialog |

### Layout & UX
- **4 layout modes**: Editor Left, Editor Right, Editor Top, Editor Bottom
- **Draggable divider**: resize panes freely with mouse or touch
- **Fullscreen**: for editor or preview independently
- **Synchronized scrolling**: editor and preview scroll together (toggleable)
- **Dark mode / Light mode** toggle
- **Preview font controls**: family (Serif / Sans / Mono) and size slider
- **Status bar**: live word count, character count, reading time, cursor position (Ln/Col)
- **Formatting toolbar**: bold, italic, strikethrough, headings, lists, links, tables, math, diagrams
- **Keyboard shortcuts panel**: press `?` or click the toolbar button

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + S` | Save active file (clears modified indicator) |
| `Alt + N` | Create new file tab |
| `Alt + W` | Close active file tab |
| `Ctrl + F` | Open find & replace bar |
| `?` | Open keyboard shortcuts panel |
| `Esc` | Close dialogs / exit fullscreen |
| `Tab` | Insert 2-space soft indent |

---

## Tech Stack

| Role | Library | Version |
| ---- | ------- | ------- |
| Markdown parsing | [Marked.js](https://marked.js.org/) | 9.1.6 |
| Syntax highlighting | [Highlight.js](https://highlightjs.org/) | 11.9.0 |
| Math rendering | [KaTeX](https://katex.org/) | 0.16.9 |
| Diagrams | [Mermaid.js](https://mermaid.js.org/) | 10.6.1 |
| Core | Vanilla JS (ES6+), HTML5, CSS3 | — |
| Fonts | Inter, JetBrains Mono, Crimson Pro | — |

**No build step. No bundler. No framework. Zero runtime dependencies beyond the CDN libraries above.**

---

## Getting Started

```bash
git clone https://github.com/forhadkhan/livemarkdown.git
cd livemarkdown
# Open index.html in any modern browser
open index.html
```

**That's it. No `npm install`, no config, no server required.**

---

## Repository Structure

```
livemarkdown/
├── index.html          # App shell + all SEO meta tags
├── style.css           # All styles — layout, themes, components
├── script.js           # All application logic
├── sample.js           # Default sample Markdown content
├── feature-list.md     # Full feature roadmap (implemented + planned)
├── robots.txt          # Crawler directives
├── sitemap.xml         # XML sitemap for search engines
├── llms.txt            # AI/LLM crawler description
├── humans.txt          # Credits
├── SECURITY.md         # Vulnerability reporting policy
├── .well-known/
│   └── security.txt    # RFC 9116 security contact
└── assets/
    └── images/
        └── og-image.png
```

---

## Two-Repo Setup

| Repo | Purpose |
| :--- | :--- |
| [`forhadkhan/livemarkdown`](https://github.com/forhadkhan/livemarkdown) | **Main development repo** - all development, issues, and PRs go here |
| [`livemarkdown/livemarkdown.github.io`](https://github.com/livemarkdown/livemarkdown.github.io) | **Deployment mirror** - exists to serve the `livemarkdown.github.io` domain via GitHub Pages |

If you want to contribute or open an issue, use the main repo: **[forhadkhan/livemarkdown](https://github.com/forhadkhan/livemarkdown)**.

---

## Contributing

1. Fork [`forhadkhan/livemarkdown`](https://github.com/forhadkhan/livemarkdown)
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Commit: `git commit -m 'Add your feature'`
5. Push: `git push origin feature/your-feature`
6. Open a Pull Request

For security issues, see [SECURITY.md](./SECURITY.md) — please do not use public issues for vulnerabilities.

---

## License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

---

Built with ❤️ by [Forhad Khan](https://forhadkhan.com)

**Acknowledgments** > developed with the collaborative assistance of:
[Claude 4.6 Sonnet](https://anthropic.com) (Anthropic) · [Gemini 3 Flash](https://deepmind.google) (Google)