# Security Policy

## Supported Versions

LiveMarkdown is a single-page, client-side application with no backend or user accounts. The current version hosted at [livemarkdown.github.io](https://livemarkdown.github.io) is always the latest and only supported version.

| Version | Supported |
| ------- | --------- |
| Latest (main branch) | Yes |
| Older forks / self-hosted | No — please update to latest |

---

## Scope

Because LiveMarkdown runs entirely in the browser with no server, accounts, or stored user data, the attack surface is narrow. Issues we care most about:

- **Cross-site scripting (XSS)** via Markdown, math, or diagram input rendering
- **Malicious file processing** via drag & drop or file open (`.md` / `.txt`)
- **Unsafe use of `innerHTML`** or `eval()` in the codebase
- **Third-party CDN dependency vulnerabilities** (marked.js, highlight.js, KaTeX, Mermaid.js)
- **localStorage data exposure** (auto-save content)
- **Privacy leaks** — any unintended network request that sends editor content externally

Out of scope:
- Bugs that require physical access to a user's device
- Self-hosted or forked versions not maintained by this project
- Vulnerabilities in the user's own browser or OS

---

## Reporting a Vulnerability

**Please do not report security issues in public GitHub Issues.**

To report a vulnerability privately:

1. Open a [GitHub Security Advisory](https://github.com/forhadkhan/livemarkdown/security/advisories/new) — this is confidential and only visible to maintainers.
2. Or email the maintainer directly via the contact on [forhadkhan.com](https://forhadkhan.com).

Please include:

- A clear description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fix, if you have one

---

## Response Timeline

| Stage | Target time |
| ----- | ----------- |
| Initial acknowledgement | Within 48 hours |
| Triage and severity assessment | Within 5 days |
| Fix or workaround published | Within 14 days for high severity |
| Public disclosure | After fix is live, coordinated with reporter |

We follow responsible disclosure — we ask that you give us reasonable time to fix the issue before making it public.

---

## Third-Party Dependencies

LiveMarkdown loads the following libraries from `cdnjs.cloudflare.com`:

| Library | Version | Purpose |
| ------- | ------- | ------- |
| [marked.js](https://marked.js.org) | 9.1.6 | Markdown parsing |
| [highlight.js](https://highlightjs.org) | 11.9.0 | Syntax highlighting |
| [KaTeX](https://katex.org) | 0.16.9 | Math rendering |
| [Mermaid.js](https://mermaid.js.org) | 10.6.1 | Diagram rendering |

If you discover a vulnerability in one of these libraries that affects this project specifically, please report it here. For vulnerabilities in the library itself, report directly to that library's maintainers as well.

---

## Security Design Notes

- All Markdown rendering is sandboxed to the preview pane DOM — no `eval()` is used
- Mermaid is initialized with `securityLevel: 'loose'` to support diagrams — if you believe this creates a specific exploitable risk in context, please report it
- Editor content is saved only to the user's own `localStorage` — no data is transmitted to any server
- No analytics, tracking scripts, or external beacons are included

---

*This policy was last updated: 2026-03-20*