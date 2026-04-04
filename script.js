/* ─── State ──────────────────────────────────────────────────── */
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const previewScroll = document.getElementById('preview-scroll');
const lineNums = document.getElementById('line-numbers');
let syncEnabled = true;
let isSyncing = false;
let currentTheme = 'dark';
let currentLayout = 'h';
let isFlipped = false;
let fsMode = null; // null | 'editor' | 'preview'
let spellCheckEnabled = false;

/* ─── Auto-save ──────────────────────────────────────────────── */
const AUTOSAVE_KEY = 'livemark_autosave';
let autosaveTimeout;

function autosave() {
    clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(() => {
        localStorage.setItem(AUTOSAVE_KEY, editor.value);
    }, 800);
}

/* ─── Mermaid init ───────────────────────────────────────────── */
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'JetBrains Mono',
});

/* ─── Marked config ─────────────────────────────────────────── */
const renderer = new marked.Renderer();

// Fenced code blocks
renderer.code = function (code, lang) {
    if (lang === 'mermaid') {
        const id = 'mermaid-' + Math.random().toString(36).slice(2);
        return `<div class="mermaid-wrap"><div class="mermaid" id="${id}">${escHtml(code)}</div></div>`;
    }
    const highlighted = lang && hljs.getLanguage(lang)
        ? hljs.highlight(code, { language: lang }).value
        : hljs.highlightAuto(code).value;
    const langLabel = lang ? `<span style="position:absolute;top:8px;left:12px;font-family:'Syne',sans-serif;font-size:10px;color:var(--text3);font-weight:600;letter-spacing:0.5px;text-transform:uppercase">${escHtml(lang)}</span>` : '';
    return `<div class="code-block-wrap"><pre>${langLabel}<code class="hljs ${lang ? `language-${lang}` : ''}">${highlighted}</code></pre><button class="copy-btn" onclick="copyCode(this)">Copy</button></div>`;
};

marked.use({ renderer, breaks: true, gfm: true });

function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ─── Render ─────────────────────────────────────────────────── */
let renderTimeout;
/**
 * Orchestrates the rendering process: pre-processing math, 
 * parsing Markdown via Marked, restoring math via KaTeX, 
 * and post-processing diagrams via Mermaid.
 */
async function renderPreview() {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(async () => {
        let md = editor.value;

        // Pre-process: protect math blocks before marked parses
        const mathBlocks = [];
        md = md.replace(/\$\$[\s\S]+?\$\$/g, m => {
            const idx = mathBlocks.length;
            mathBlocks.push({ type: 'block', raw: m });
            return `\x00MATHBLOCK${idx}\x00`;
        });
        md = md.replace(/\$[^$\n]+?\$/g, m => {
            const idx = mathBlocks.length;
            mathBlocks.push({ type: 'inline', raw: m });
            return `\x00MATHINLINE${idx}\x00`;
        });

        let html = marked.parse(md);

        // Restore math
        html = html.replace(/\x00MATHBLOCK(\d+)\x00/g, (_, i) => {
            try {
                return '<div>' + katex.renderToString(
                    mathBlocks[i].raw.slice(2, -2).trim(),
                    { displayMode: true, throwOnError: false }
                ) + '</div>';
            } catch (e) { return mathBlocks[i].raw; }
        });
        html = html.replace(/\x00MATHINLINE(\d+)\x00/g, (_, i) => {
            try {
                return katex.renderToString(
                    mathBlocks[i].raw.slice(1, -1).trim(),
                    { displayMode: false, throwOnError: false }
                );
            } catch (e) { return mathBlocks[i].raw; }
        });

        preview.innerHTML = html;

        // Run mermaid
        const mermaidEls = preview.querySelectorAll('.mermaid');
        if (mermaidEls.length) {
            try {
                await mermaid.run({ nodes: mermaidEls });
            } catch (e) {
                mermaidEls.forEach(el => {
                    el.innerHTML = `<span style="color:var(--danger);font-family:'JetBrains Mono',monospace;font-size:12px">Mermaid error: ${e.message}</span>`;
                });
            }
        }

        // KaTeX auto-render for any remaining LaTeX
        renderMathInElement(preview, {
            delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\(", right: "\\)", display: false },
                { left: "\\[", right: "\\]", display: true },
            ],
            throwOnError: false,
        });

        updateLineNumbers();
    }, 120);
}

/* ─── Line Numbers ───────────────────────────────────────────── */
function updateLineNumbers() {
    const lines = editor.value.split('\n');
    lineNums.innerHTML = lines.map((_, i) => `<div class="ln">${i + 1}</div>`).join('');
    lineNums.scrollTop = editor.scrollTop;
}

/* ─── Status Bar ─────────────────────────────────────────────── */
function updateStatusBar() {
    const val = editor.value;
    const words = val.trim() ? val.trim().split(/\s+/).length : 0;
    const readingMins = Math.max(1, Math.round(words / 200));
    document.getElementById('wc-words').textContent = words;
    document.getElementById('wc-chars').textContent = val.length;
    document.getElementById('wc-reading').textContent = `~${readingMins} min read`;
    updateCursorPos();
}

function updateCursorPos() {
    const val = editor.value;
    const pos = editor.selectionStart;
    const before = val.slice(0, pos);
    const lines = before.split('\n');
    document.getElementById('wc-ln').textContent = lines.length;
    document.getElementById('wc-col').textContent = lines[lines.length - 1].length + 1;
}

editor.addEventListener('keyup', updateCursorPos);
editor.addEventListener('click', updateCursorPos);


/* ─── Sync Scroll ────────────────────────────────────────────── */
editor.addEventListener('input', () => {
    updateLineNumbers();
    updateStatusBar();
    autosave();
    renderPreview();
    if (document.getElementById('find-bar').classList.contains('show')) {
        findInEditor(findInput.value);
    }
});

editor.addEventListener('scroll', () => {
    lineNums.scrollTop = editor.scrollTop;
    if (!syncEnabled || isSyncing) return;
    isSyncing = true;
    const ratio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    previewScroll.scrollTop = ratio * (previewScroll.scrollHeight - previewScroll.clientHeight);
    setTimeout(() => isSyncing = false, 50);
});

previewScroll.addEventListener('scroll', () => {
    if (!syncEnabled || isSyncing) return;
    isSyncing = true;
    const ratio = previewScroll.scrollTop / (previewScroll.scrollHeight - previewScroll.clientHeight || 1);
    editor.scrollTop = ratio * (editor.scrollHeight - editor.clientHeight);
    setTimeout(() => isSyncing = false, 50);
});

document.getElementById('sync-btn').addEventListener('click', function () {
    syncEnabled = !syncEnabled;
    this.classList.toggle('active', syncEnabled);
    showToast(syncEnabled ? 'Sync scroll ON' : 'Sync scroll OFF');
});

/* ─── Editor Events ─────────────────────────────────────────── */
editor.addEventListener('input', renderPreview);

editor.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
        e.preventDefault();
        insertAtCursor('  ');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        toggleFind();
    }
    if (e.key === 'Escape') {
        closeFindBar();
    }
});

/* ─── Toolbar Helpers ────────────────────────────────────────── */
function insertAtCursor(text) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.slice(0, start) + text + editor.value.slice(end);
    editor.selectionStart = editor.selectionEnd = start + text.length;
    editor.focus();
    renderPreview();
}

function wrapText(before, after) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const sel = editor.value.slice(start, end) || 'text';
    const replacement = before + sel + after;
    editor.value = editor.value.slice(0, start) + replacement + editor.value.slice(end);
    editor.selectionStart = start + before.length;
    editor.selectionEnd = start + before.length + sel.length;
    editor.focus();
    renderPreview();
}

function wrapBlock(before, after) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const sel = editor.value.slice(start, end) || 'code here';
    const nl = start > 0 && editor.value[start - 1] !== '\n' ? '\n' : '';
    const replacement = nl + before + sel + after + '\n';
    editor.value = editor.value.slice(0, start) + replacement + editor.value.slice(end);
    editor.selectionStart = start + nl.length + before.length;
    editor.selectionEnd = start + nl.length + before.length + sel.length;
    editor.focus();
    renderPreview();
}

function insertHeading(level) {
    const prefix = '#'.repeat(level) + ' ';
    const start = editor.selectionStart;
    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = editor.value.indexOf('\n', start);
    const line = editor.value.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
    const cleaned = line.replace(/^#+\s*/, '');
    editor.value = editor.value.slice(0, lineStart) + prefix + cleaned + (lineEnd === -1 ? '' : editor.value.slice(lineEnd));
    editor.selectionStart = editor.selectionEnd = lineStart + prefix.length + cleaned.length;
    editor.focus();
    renderPreview();
}

function insertLine(prefix) {
    const start = editor.selectionStart;
    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
    editor.value = editor.value.slice(0, lineStart) + prefix + editor.value.slice(lineStart);
    editor.selectionStart = editor.selectionEnd = lineStart + prefix.length + (start - lineStart);
    editor.focus();
    renderPreview();
}

function insertLink() {
    const start = editor.selectionStart, end = editor.selectionEnd;
    const sel = editor.value.slice(start, end) || 'Link text';
    const replacement = `[${sel}](https://example.com)`;
    editor.value = editor.value.slice(0, start) + replacement + editor.value.slice(end);
    editor.selectionStart = start + sel.length + 3;
    editor.selectionEnd = start + replacement.length - 1;
    editor.focus();
    renderPreview();
}

function insertImage() {
    const start = editor.selectionStart, end = editor.selectionEnd;
    const replacement = `![Alt text](https://example.com/image.png)`;
    editor.value = editor.value.slice(0, start) + replacement + editor.value.slice(end);
    editor.selectionStart = start + 2;
    editor.selectionEnd = start + 10;
    editor.focus();
    renderPreview();
}

function insertTable() {
    const tbl = '\n| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n| Cell | Cell | Cell |\n';
    insertAtCursor(tbl);
}

function insertMath() {
    wrapBlock('$$\n', '\n$$');
}

function insertMermaid() {
    const sample = '\n```mermaid\ngraph TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Result 1]\n  B -->|No| D[Result 2]\n```\n';
    insertAtCursor(sample);
}

/* ─── Copy code ─────────────────────────────────────────────── */
function copyCode(btn) {
    const code = btn.previousElementSibling.querySelector('code');
    navigator.clipboard.writeText(code.innerText).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
        }, 2000);
    });
}

/* ─── Find & Replace Logic ───────────────────────────────────── */
/**
 * editorMatches tracks the results of the current search query.
 * highlights is a background div that mirrors the editor for visual search feedback.
 */
let editorMatches = [];
let editorMatchIndex = -1;
const highlights = document.getElementById('editor-highlights');

function toggleFind() {
    const bar = document.getElementById('find-bar');
    if (bar.classList.contains('show')) {
        closeFindBar();
    } else {
        bar.classList.add('show');
        findInput.focus();
        findInEditor(findInput.value);
    }
}

function closeFindBar() {
    document.getElementById('find-bar').classList.remove('show');
    editorMatches = [];
    editorMatchIndex = -1;
    document.getElementById('find-count').textContent = '0/0';
    highlights.innerHTML = '';
}

document.getElementById('find-btn').addEventListener('click', toggleFind);
document.getElementById('find-close').addEventListener('click', closeFindBar);

const findInput = document.getElementById('find-input');
const replaceInput = document.getElementById('replace-input');

findInput.addEventListener('input', function () {
    editorMatchIndex = -1; // Reset index when query changes
    findInEditor(this.value);
});

findInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.shiftKey ? findPrev() : findNext(); }
    if (e.key === 'Escape') closeFindBar();
});

// Focus management to keep editor active
[
    document.getElementById('find-next'),
    document.getElementById('find-prev'),
    document.getElementById('btn-replace'),
    document.getElementById('btn-replace-all')
].forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
});

document.getElementById('find-next').addEventListener('click', findNext);
document.getElementById('find-prev').addEventListener('click', findPrev);
document.getElementById('btn-replace').addEventListener('click', replaceNext);
document.getElementById('btn-replace-all').addEventListener('click', replaceAll);

// Scroll Sync
editor.addEventListener('scroll', () => {
    highlights.scrollTop = editor.scrollTop;
    highlights.scrollLeft = editor.scrollLeft;
});

/**
 * Searches for matches in the textarea content.
 * Updates the highlight layer by inserting <mark> tags into a mirrored string.
 * @param {string} q - The search query.
 */
function findInEditor(q) {
    if (!q) {
        editorMatches = [];
        editorMatchIndex = -1;
        highlights.innerHTML = '';
        updateFindCount();
        return;
    }
    const text = editor.value;
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    editorMatches = [...text.matchAll(re)];

    if (editorMatchIndex === -1 && editorMatches.length > 0) {
        editorMatchIndex = 0;
    } else if (editorMatches.length === 0) {
        editorMatchIndex = -1;
    } else if (editorMatchIndex >= editorMatches.length) {
        editorMatchIndex = editorMatches.length - 1;
    }

    updateHighlightLayer();

    if (editorMatchIndex !== -1) {
        scrollMatchIntoView(editorMatchIndex);
    }
    updateFindCount();
}

function updateHighlightLayer() {
    const q = findInput.value;
    if (!q) {
        highlights.innerHTML = '';
        return;
    }
    const text = editor.value;
    let html = '';
    let lastIndex = 0;
    editorMatches.forEach((m, i) => {
        html += escHtml(text.substring(lastIndex, m.index));
        const isCurrent = (i === editorMatchIndex);
        html += `<mark class="${isCurrent ? 'current' : ''}">${escHtml(m[0])}</mark>`;
        lastIndex = m.index + m[0].length;
    });
    html += escHtml(text.substring(lastIndex));
    // Trailing newline fix
    highlights.innerHTML = html + (text.endsWith('\n') ? '\n ' : '');
}

function scrollMatchIntoView(index) {
    const m = editorMatches[index];
    if (!m) return;

    editor.setSelectionRange(m.index, m.index + m[0].length);

    const lines = editor.value.substr(0, m.index).split('\n').length;
    const lineHeight = 20.8;
    const targetScroll = (lines - 5) * lineHeight;
    // Only scroll if out of view or forced
    if (editor.scrollTop > targetScroll || editor.scrollTop + editor.clientHeight < targetScroll + (lineHeight * 5)) {
        editor.scrollTop = targetScroll;
    }
}

function findNext() {
    if (!editorMatches.length) return;
    editorMatchIndex = (editorMatchIndex + 1) % editorMatches.length;
    updateHighlightLayer();
    scrollMatchIntoView(editorMatchIndex);
    updateFindCount();
}

function findPrev() {
    if (!editorMatches.length) return;
    editorMatchIndex = (editorMatchIndex - 1 + editorMatches.length) % editorMatches.length;
    updateHighlightLayer();
    scrollMatchIntoView(editorMatchIndex);
    updateFindCount();
}

function updateFindCount() {
    document.getElementById('find-count').textContent =
        editorMatches.length ? `${editorMatchIndex + 1}/${editorMatches.length}` : '0/0';
}

/**
 * Replaces the currently focused match with the replacement string.
 * Updates indices and re-renders highlights.
 */
function replaceNext() {
    const q = findInput.value;
    const r = replaceInput.value;
    if (!q || editorMatchIndex === -1) return;

    const m = editorMatches[editorMatchIndex];
    if (!m) return;
    const val = editor.value;
    editor.value = val.substring(0, m.index) + r + val.substring(m.index + m[0].length);

    findInEditor(q);
    renderPreview();
    updateLineNumbers();
}

function replaceAll() {
    const q = findInput.value;
    const r = replaceInput.value;
    if (!q) return;
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    editor.value = editor.value.replace(re, r);
    findInEditor(q);
    renderPreview();
    updateLineNumbers();
    showToast(`Replaced all occurrences of "${q}"`);
}

/* ─── Divider Resize ─────────────────────────────────────────── */
const divider = document.getElementById('divider');
const main = document.getElementById('main');
const edPaneSel = document.getElementById('editor-pane');
const prPaneSel = document.getElementById('preview-pane');

/* ─── Resizing Logic ─────────────────────────────────────────── */
let isResizing = false;
let resizerMainRect = null;

function startResizing(e) {
    isResizing = true;
    resizerMainRect = main.getBoundingClientRect();
    divider.classList.add('dragging');
    document.body.classList.add('dragging');
    if (main.classList.contains('layout-v')) {
        document.body.classList.add('layout-v');
    }
}

function stopResizing() {
    if (!isResizing) return;
    isResizing = false;
    resizerMainRect = null;
    divider.classList.remove('dragging');
    document.body.classList.remove('dragging', 'layout-v');
}

function onResize(e) {
    if (!isResizing || !resizerMainRect) return;

    const isH = main.classList.contains('layout-h');
    const isFlipped = main.classList.contains('flipped');

    let pct;
    if (isH) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = clientX - resizerMainRect.left;
        pct = (x / resizerMainRect.width) * 100;
        if (isFlipped) pct = 100 - pct;
    } else {
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const y = clientY - resizerMainRect.top;
        pct = (y / resizerMainRect.height) * 100;
        if (isFlipped) pct = 100 - pct;
    }

    // Constraints
    pct = Math.max(10, Math.min(90, pct));

    edPaneSel.style.flex = `0 0 ${pct.toFixed(2)}%`;
    prPaneSel.style.flex = `0 0 ${(100 - pct).toFixed(2)}%`;
}

divider.addEventListener('mousedown', startResizing);
divider.addEventListener('touchstart', e => {
    if (e.cancelable) e.preventDefault();
    startResizing(e);
}, { passive: false });

document.addEventListener('mousemove', onResize);
document.addEventListener('touchmove', onResize, { passive: false });
document.addEventListener('mouseup', stopResizing);
document.addEventListener('touchend', stopResizing);

/* ─── Layout Buttons ─────────────────────────────────────────── */
function resetPaneSizes() {
    edPaneSel.style.flex = '';
    prPaneSel.style.flex = '';
}
function setLayout(type, flip) {
    // Remove layout classes
    main.classList.remove('layout-h', 'layout-v', 'flipped');
    resetPaneSizes();
    main.classList.add('layout-' + type);
    if (flip) main.classList.add('flipped');
    currentLayout = type; isFlipped = !!flip;
    // Update mermaid (needs rerender after layout change)
    renderPreview();
}

document.getElementById('layout-lr').addEventListener('click', () => { setLayout('h', false); setActiveLayout('layout-lr'); });
document.getElementById('layout-rl').addEventListener('click', () => { setLayout('h', true); setActiveLayout('layout-rl'); });
document.getElementById('layout-tb').addEventListener('click', () => { setLayout('v', false); setActiveLayout('layout-tb'); });
document.getElementById('layout-bt').addEventListener('click', () => { setLayout('v', true); setActiveLayout('layout-bt'); });

function setActiveLayout(id) {
    document.querySelectorAll('.dropdown-item').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(id);
    if (activeBtn) {
        activeBtn.classList.add('active');
        // Update trigger icon
        const iconSvg = activeBtn.querySelector('svg').cloneNode(true);
        const currentIconWrap = document.getElementById('current-layout-icon');
        if (currentIconWrap) {
            currentIconWrap.innerHTML = '';
            currentIconWrap.appendChild(iconSvg);
        }
    }
}

/* ─── Fullscreen ─────────────────────────────────────────────── */
document.getElementById('btn-fullscreen-editor').addEventListener('click', () => {
    if (fsMode === 'editor') {
        fsMode = null;
        document.body.classList.remove('fullscreen-editor');
    } else {
        fsMode = 'editor';
        document.body.classList.remove('fullscreen-preview');
        document.body.classList.add('fullscreen-editor');
    }
    updateFullscreenIcons();
});

document.getElementById('btn-fullscreen-preview').addEventListener('click', () => {
    if (fsMode === 'preview') {
        fsMode = null;
        document.body.classList.remove('fullscreen-preview');
    } else {
        fsMode = 'preview';
        document.body.classList.remove('fullscreen-editor');
        document.body.classList.add('fullscreen-preview');
    }
    updateFullscreenIcons();
});

function updateFullscreenIcons() {
    const eIcon = document.getElementById('btn-fullscreen-editor');
    const pIcon = document.getElementById('btn-fullscreen-preview');
    const exitSvg = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 1H1v3M8 1h3v3M8 11h3V8M4 11H1V8"/></svg>`;
    const enterSvg = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8"/></svg>`;
    eIcon.innerHTML = fsMode === 'editor' ? exitSvg : enterSvg;
    pIcon.innerHTML = fsMode === 'preview' ? exitSvg : enterSvg;
}

document.addEventListener('keydown', e => {
    if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleFind();
    }
    if (e.key === 'Escape') {
        if (fsMode) {
            document.body.classList.remove('fullscreen-editor', 'fullscreen-preview');
            fsMode = null;
            updateFullscreenIcons();
        }
        closeFindBar();
    }
});

/* ─── Theme ──────────────────────────────────────────────────── */
document.getElementById('theme-btn').addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.getElementById('icon-moon').style.display = currentTheme === 'dark' ? '' : 'none';
    document.getElementById('icon-sun').style.display = currentTheme === 'light' ? '' : 'none';
    // switch hljs stylesheet
    document.getElementById('hljs-theme-dark').disabled = currentTheme === 'light';
    document.getElementById('hljs-theme-light').disabled = currentTheme === 'dark';
    // mermaid re-theme
    mermaid.initialize({ startOnLoad: false, theme: currentTheme === 'dark' ? 'dark' : 'default', securityLevel: 'loose' });
    renderPreview();
    showToast(currentTheme === 'dark' ? '🌙 Dark mode' : '☀️ Light mode');
});

/* ─── File Open ─────────────────────────────────────────────── */
document.getElementById('file-open').addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        editor.value = e.target.result;
        renderPreview();
        updateStatusBar();
        showToast(`Opened: ${file.name}`);
    };
    reader.readAsText(file);
    this.value = '';
});

/* ─── Drag & Drop ────────────────────────────────────────────── */
const editorWrap = document.getElementById('editor-wrap');
const dropOverlay = document.getElementById('drop-overlay');

editorWrap.addEventListener('dragover', e => {
    e.preventDefault();
    editorWrap.classList.add('drag-over');
});
editorWrap.addEventListener('dragleave', e => {
    if (!editorWrap.contains(e.relatedTarget)) {
        editorWrap.classList.remove('drag-over');
    }
});
editorWrap.addEventListener('drop', e => {
    e.preventDefault();
    editorWrap.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!/\.(md|txt|markdown)$/i.test(file.name)) {
        showToast('Please drop a .md or .txt file');
        return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
        editor.value = ev.target.result;
        renderPreview();
        updateStatusBar();
        showToast(`Opened: ${file.name}`);
    };
    reader.readAsText(file);
});

/* ─── Spell Check Toggle ─────────────────────────────────────── */
document.getElementById('spellcheck-btn').addEventListener('click', function () {
    spellCheckEnabled = !spellCheckEnabled;
    editor.setAttribute('spellcheck', spellCheckEnabled);
    // Force browser to re-evaluate spellcheck by briefly toggling focus
    editor.blur();
    editor.focus();
    this.textContent = `Spell: ${spellCheckEnabled ? 'ON' : 'OFF'}`;
    this.classList.toggle('active', spellCheckEnabled);
    showToast(`Spell check ${spellCheckEnabled ? 'enabled' : 'disabled'}`);
});

/* ─── Keyboard Shortcuts Panel ───────────────────────────────── */
const SHORTCUTS = [
    { section: 'Editor' },
    { key: 'Ctrl + F', desc: 'Find & replace' },
    { key: 'Ctrl + S', desc: 'No-op (auto-saved)' },
    { key: 'Tab', desc: 'Indent 2 spaces' },
    { key: 'Escape', desc: 'Close find bar / exit fullscreen' },
    { section: 'Format' },
    { key: 'Toolbar: B', desc: 'Bold selection' },
    { key: 'Toolbar: I', desc: 'Italic selection' },
    { key: 'Toolbar: S', desc: 'Strikethrough' },
    { key: 'Toolbar: <>', desc: 'Inline code' },
    { key: 'Toolbar: H1–3', desc: 'Heading levels' },
    { section: 'Navigation' },
    { key: '?', desc: 'Open this shortcuts panel' },
    { key: 'Ctrl + F', desc: 'Open find & replace' },
    { section: 'View' },
    { key: 'Fullscreen ⛶', desc: 'Toggle editor or preview fullscreen' },
    { key: 'Escape', desc: 'Exit fullscreen' },
    { key: 'Sync Scroll ↺', desc: 'Toggle synchronized scrolling' },
];

function showShortcutsModal() {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').textContent = 'Keyboard Shortcuts';
    const body = document.getElementById('modal-body');
    body.innerHTML = '';

    const table = document.createElement('div');
    table.className = 'shortcuts-table';
    SHORTCUTS.forEach(item => {
        if (item.section) {
            const sec = document.createElement('div');
            sec.className = 'shortcuts-section';
            sec.textContent = item.section;
            table.appendChild(sec);
        } else {
            const row = document.createElement('div');
            row.className = 'shortcuts-row';
            row.innerHTML = `<kbd>${item.key}</kbd><span>${item.desc}</span>`;
            table.appendChild(row);
        }
    });
    body.appendChild(table);

    const actionsDiv = document.getElementById('modal-actions');
    actionsDiv.innerHTML = '';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.className = 'btn';
    closeBtn.onclick = closeModal;
    actionsDiv.appendChild(closeBtn);
    overlay.classList.add('show');
}

document.getElementById('shortcuts-btn').addEventListener('click', showShortcutsModal);

document.addEventListener('keydown', e => {
    if (e.key === '?' && document.activeElement !== editor &&
        document.activeElement !== document.getElementById('find-input') &&
        document.activeElement !== document.getElementById('replace-input')) {
        e.preventDefault();
        showShortcutsModal();
    }
});

/* ─── Preview Font Controls ──────────────────────────────────── */
const fontFamilyMap = {
    serif: "'Crimson Pro', Georgia, serif",
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace"
};

document.getElementById('preview-font-select').addEventListener('change', function () {
    document.getElementById('preview').style.fontFamily = fontFamilyMap[this.value];
});

document.getElementById('preview-font-size').addEventListener('input', function () {
    const size = parseInt(this.value);
    document.getElementById('preview').style.fontSize = size + 'px';
    document.getElementById('preview-font-size-label').textContent = size + 'px';
});

/* ─── Dropdowns ──────────────────────────────────────────────── */
function setupDropdown(btnId, menuId) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    if (!btn || !menu) return;

    btn.addEventListener('click', e => {
        e.stopPropagation();
        document.querySelectorAll('.dropdown-content').forEach(m => {
            if (m !== menu) m.classList.remove('show');
        });
        menu.classList.toggle('show');
    });
}

setupDropdown('layout-btn', 'layout-menu');
setupDropdown('export-btn', 'export-menu');

document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-content').forEach(m => m.classList.remove('show'));
});

document.querySelectorAll('.export-item').forEach(item => {
    item.addEventListener('click', () => {
        const fmt = item.dataset.fmt;
        if (fmt === 'md') exportMd();
        if (fmt === 'html') exportHtml();
        if (fmt === 'pdf') exportPdf();
    });
});

function exportMd() {
    const blob = new Blob([editor.value], { type: 'text/markdown' });
    download(blob, 'document.md');
}

function exportHtml() {
    const style = `
    <style>
      body { font-family: 'Georgia', serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.75; }
      h1,h2,h3,h4,h5,h6 { font-family: sans-serif; margin: 1.4em 0 0.5em; }
      h1 { border-bottom: 2px solid #f59e0b; padding-bottom: 0.3em; }
      h2 { border-bottom: 1px solid #ddd; padding-bottom: 0.25em; }
      code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
      pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 6px; overflow-x: auto; }
      pre code { background: none; color: inherit; }
      blockquote { border-left: 3px solid #f59e0b; margin: 1em 0; padding: 6px 0 6px 18px; color: #555; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #ddd; padding: 8px 12px; }
      th { background: #f3f4f6; font-weight: 600; }
      img { max-width: 100%; }
      a { color: #0ea5e9; }
      hr { border: none; height: 2px; background: linear-gradient(90deg,#f59e0b,transparent); margin: 2em 0; }
    </style>
  `;
    const html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>Document</title>\n${style}\n</head>\n<body>\n${preview.innerHTML}\n</body>\n</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    download(blob, 'document.html');
}

function exportPdf() {
    showToast('Opening print dialog…');
    setTimeout(() => window.print(), 300);
}

function download(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(`Downloaded: ${filename}`);
}

/* ─── Action Buttons ─────────────────────────────────────────── */
document.getElementById('btn-clear').addEventListener('click', () => {
    showModal(
        'Clear Editor',
        'This will delete all content in the editor. This action cannot be undone.',
        [
            { label: 'Cancel', cls: 'btn', action: closeModal },
            { label: 'Clear', cls: 'btn btn-danger', action: () => { editor.value = ''; renderPreview(); closeModal(); showToast('Editor cleared'); } }
        ]
    );
});

document.getElementById('btn-format').addEventListener('click', () => {
    editor.value = formatMarkdown(editor.value);
    renderPreview();
    showToast('Markdown formatted');
});

document.getElementById('btn-sample').addEventListener('click', () => {
    if (editor.value.trim()) {
        showModal(
            'Load Sample',
            'Loading the sample will replace your current content. Continue?',
            [
                { label: 'Cancel', cls: 'btn', action: closeModal },
                { label: 'Load Sample', cls: 'btn btn-accent', action: () => { editor.value = SAMPLE; renderPreview(); closeModal(); showToast('Sample loaded'); } }
            ]
        );
    } else {
        editor.value = SAMPLE;
        renderPreview();
        showToast('Sample loaded');
    }
});

/* ─── Format Markdown ────────────────────────────────────────── */
function formatMarkdown(md) {
    // Normalize heading spacing
    md = md.replace(/^(#{1,6})([^#\s])/gm, '$1 $2');
    // Ensure blank line before/after headings
    md = md.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2');
    md = md.replace(/^(#{1,6} .+)\n([^\n#])/gm, '$1\n\n$2');
    // Normalize list markers
    md = md.replace(/^[\*\+] /gm, '- ');
    // Remove trailing whitespace
    md = md.split('\n').map(l => l.trimEnd()).join('\n');
    // Collapse 3+ blank lines to 2
    md = md.replace(/\n{3,}/g, '\n\n');
    // Ensure ends with single newline
    md = md.trim() + '\n';
    return md;
}

/* ─── Modal ──────────────────────────────────────────────────── */
function showModal(title, body, actions) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').textContent = body;
    const actionsDiv = document.getElementById('modal-actions');
    actionsDiv.innerHTML = '';
    actions.forEach(a => {
        const btn = document.createElement('button');
        btn.textContent = a.label;
        btn.className = a.cls;
        btn.onclick = a.action;
        actionsDiv.appendChild(btn);
    });
    document.getElementById('modal-overlay').classList.add('show');
}
function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
}
document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
});

/* ─── Toast ──────────────────────────────────────────────────── */
let toastTimeout;
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => t.classList.remove('show'), 2500);
}

/* ─── Mobile Menu ────────────────────────────────────────────── */
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navbar = document.getElementById('navbar');
if (mobileMenuBtn && navbar) {
    mobileMenuBtn.addEventListener('click', () => {
        navbar.classList.toggle('menu-open');
    });
}

/* ─── Toolbar Toggle ─────────────────────────────────────────── */
const toggleToolbarBtn = document.getElementById('btn-toggle-toolbar');
const toolbarElement = document.getElementById('toolbar');
const toolbarIcon = document.getElementById('toolbar-toggle-icon');

if (toggleToolbarBtn && toolbarElement) {
    toggleToolbarBtn.addEventListener('click', () => {
        const isHidden = toolbarElement.style.display === 'none';
        toolbarElement.style.display = isHidden ? 'flex' : 'none';
        
        // Toggle icon path (chevron-up when visible, chevron-down when hidden)
        if (isHidden) {
            toolbarIcon.innerHTML = '<path d="m18 15-6-6-6 6"/>'; // Chevron up
            showToast('Toolbar shown');
        } else {
            toolbarIcon.innerHTML = '<path d="m6 9 6 6 6-6"/>'; // Chevron down
            showToast('Toolbar hidden');
        }
    });
}

/* ─── Init ───────────────────────────────────────────────────── */
(function init() {
    const saved = localStorage.getItem(AUTOSAVE_KEY);
    if (saved && saved.trim()) {
        editor.value = saved;
        showToast('Restored from auto-save');
    } else {
        editor.value = SAMPLE;
    }
    renderPreview();
    updateLineNumbers();
    updateStatusBar();
}());