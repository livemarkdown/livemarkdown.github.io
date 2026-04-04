/**
 * Default sample Markdown content for the Live Markdown editor.
 */
/* ─── Sample Content ─────────────────────────────────────────── */
const SAMPLE = `# Welcome to Live Markdown ✦

> A powerful Markdown editor with live preview, math, diagrams, and more.

## Features at a Glance

MarkFlow supports **bold**, *italic*, ~~strikethrough~~, and \`inline code\`. You can write rich documents with full Markdown support.

---

## Code Blocks

\`\`\`javascript
// Fibonacci with memoization
function fib(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  return (memo[n] = fib(n-1, memo) + fib(n-2, memo));
}

console.log(fib(50)); // 12586269025
\`\`\`

\`\`\`python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left  = [x for x in arr if x < pivot]
    mid   = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)
\`\`\`

---

## Math Equations (LaTeX)

Inline math: The famous identity $e^{i\\pi} + 1 = 0$ by Euler.

Display math:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2}\\, dx = \\sqrt{\\pi}
$$

The quadratic formula:

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

Maxwell's equations:

$$
\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}, \\quad
\\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}
$$

---

## Diagrams (Mermaid)

\`\`\`mermaid
flowchart TD
    A([🚀 Start]) --> B{Is it valid?}
    B -- Yes --> C[Process Data]
    B -- No  --> D[Return Error]
    C --> E[(Database)]
    C --> F[Send Response]
    E --> F
    F --> G([✅ Done])
\`\`\`

\`\`\`mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant A as API
    participant D as Database
    U->>A: POST /login
    A->>D: SELECT * FROM users
    D-->>A: User record
    A-->>U: JWT Token
    U->>A: GET /data (token)
    A-->>U: 200 OK + data
\`\`\`

\`\`\`mermaid
pie title Tech Stack Distribution
    "JavaScript" : 38
    "Python" : 27
    "Rust" : 15
    "Go" : 12
    "Other" : 8
\`\`\`

---

## Tables

| Language | Paradigm | Typing | Performance |
| --- | --- | --- | --- |
| Rust | Multi-paradigm | Static | ⚡ Excellent |
| Python | Multi-paradigm | Dynamic | 🐢 Moderate |
| Haskell | Functional | Static | 🚀 Good |
| JavaScript | Multi-paradigm | Dynamic | ⚡ Good |

---

## Task Lists

- [x] Set up the project structure
- [x] Implement Markdown rendering
- [x] Add syntax highlighting
- [x] Add KaTeX math support
- [x] Add Mermaid diagram support
- [ ] Add collaborative editing
- [ ] Add custom themes
- [ ] Export to EPUB

---

## Blockquotes

> "The best way to predict the future is to invent it."
> — Alan Kay

> **Nested blockquote:**
> > "Simplicity is the ultimate sophistication."
> > — Leonardo da Vinci

---

## Links & Images

View the [source on GitHub](https://github.com/forhadkhan/livemarkdown).

Developed by [Forhad Khan](https://forhadkhan.com).

![FK Logo](https://f0rhad.github.io/assets/fk-400sqpx.jpg)

---

# H1
## H2
### H3

---

*Happy writing with MarkFlow! Use the toolbar above to insert elements, or type Markdown directly.*
`;