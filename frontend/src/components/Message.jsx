import React, { useState } from 'react'
import { pdfUrl } from '../api.js'

export default function Message({ message, sessionId, onExport }) {
  const isUser = message.role === 'user'

  const openPage = (page) => {
    if (!sessionId || !page) return
    window.open(pdfUrl(sessionId, page), '_blank', 'noopener')
  }

  return (
    <div style={{
      padding: '3px 28px',
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      animation: 'fadeIn .18s ease-out',
    }}>
      {isUser ? (
        <div style={{
          background: 'var(--user-bg)',
          borderRadius: '10px 10px 2px 10px',
          padding: '9px 14px',
          maxWidth: '65%',
          fontSize: 13.5,
          color: 'var(--text)',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {message.content}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', maxWidth: 700, width: '100%' }}>
          <AssistantIcon />
          <div style={{ flex: 1, paddingTop: 1, minWidth: 0 }}>
            <MarkdownRenderer content={message.content} onPageClick={openPage} />

            {(message.keywords?.length > 0 || message.pages?.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                {message.keywords?.map((k, i) => (
                  <span key={i} style={{
                    fontSize: 11,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: 'var(--bg-active)',
                    color: 'var(--text-2)',
                    border: '1px solid var(--border-light)',
                  }}>
                    {k}
                  </span>
                ))}
                {message.pages?.map((p, i) => (
                  <PageChip key={`p${i}`} page={p} onClick={() => openPage(p)} />
                ))}
              </div>
            )}

            {onExport && message.pages !== undefined && (
              <ExportRow message={message} onExport={onExport} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page chip — clickable, opens PDF at the correct page in a new tab
// ---------------------------------------------------------------------------

function PageChip({ page, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={`Open page ${page} in PDF`}
      style={{
        fontSize: 11,
        padding: '2px 7px',
        borderRadius: 4,
        color: hover ? '#fff' : 'var(--accent)',
        background: hover ? 'var(--accent)' : 'transparent',
        border: '1px solid var(--accent)',
        cursor: 'pointer',
        opacity: hover ? 1 : 0.85,
        transition: 'background .12s, color .12s, opacity .12s',
        fontFamily: 'inherit',
        lineHeight: 1.4,
      }}
    >
      p.{page}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Export PDF / DOCX action row
// ---------------------------------------------------------------------------

function ExportRow({ message, onExport }) {
  const [busy, setBusy] = useState(null) // 'pdf' | 'docx' | null

  async function run(format) {
    if (busy) return
    setBusy(format)
    try {
      await onExport(message, format)
    } catch (e) {
      console.error('Export failed:', e)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      <ExportButton label="Export PDF"  busy={busy === 'pdf'}  onClick={() => run('pdf')}  />
      <ExportButton label="Export DOCX" busy={busy === 'docx'} onClick={() => run('docx')} />
    </div>
  )
}

function ExportButton({ label, busy, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={busy}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 9px',
        background: hover && !busy ? 'var(--bg-active)' : 'var(--bg-surface)',
        border: `1px solid ${hover && !busy ? 'var(--accent)' : 'var(--border-light)'}`,
        borderRadius: 5,
        fontSize: 11.5,
        color: hover && !busy ? 'var(--accent)' : 'var(--text-2)',
        cursor: busy ? 'wait' : 'pointer',
        transition: 'border-color .12s, color .12s, background .12s',
        fontFamily: 'inherit',
      }}
    >
      <DownloadIcon />
      {busy ? 'Exporting…' : label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Markdown renderer — no external dependencies
// ---------------------------------------------------------------------------

function MarkdownRenderer({ content, onPageClick }) {
  const nodes = []
  const lines = content.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Blank line — skip
    if (!line.trim()) { i++; continue }

    // Fenced code block
    if (line.startsWith('```')) {
      const end = lines.findIndex((l, j) => j > i && l.startsWith('```'))
      const code = end === -1
        ? lines.slice(i + 1).join('\n')
        : lines.slice(i + 1, end).join('\n')
      nodes.push(
        <pre key={i} style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 6,
          padding: '10px 14px',
          overflowX: 'auto',
          margin: '8px 0',
          fontSize: 12,
          lineHeight: 1.5,
        }}>
          <code style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{code}</code>
        </pre>
      )
      i = end === -1 ? lines.length : end + 1
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={i} style={{ fontSize: 13.5, fontWeight: 600, margin: '12px 0 3px', color: 'var(--text)' }}>
          {renderInline(line.slice(4), onPageClick)}
        </h3>
      )
      i++; continue
    }
    if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={i} style={{ fontSize: 14.5, fontWeight: 700, margin: '14px 0 4px', color: 'var(--text)' }}>
          {renderInline(line.slice(3), onPageClick)}
        </h2>
      )
      i++; continue
    }
    if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={i} style={{ fontSize: 16, fontWeight: 700, margin: '16px 0 5px', color: 'var(--text)' }}>
          {renderInline(line.slice(2), onPageClick)}
        </h1>
      )
      i++; continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '10px 0' }} />)
      i++; continue
    }

    // Unordered list — collect consecutive items
    if (/^[-*] /.test(line)) {
      const items = []
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*] /, ''))
        i++
      }
      nodes.push(
        <ul key={i} style={{ margin: '4px 0 6px', paddingLeft: 20 }}>
          {items.map((it, j) => (
            <li key={j} style={{ margin: '2px 0', fontSize: 13.5, lineHeight: 1.7, color: 'var(--text)' }}>
              {renderInline(it, onPageClick)}
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list — collect consecutive items
    if (/^\d+\. /.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      nodes.push(
        <ol key={i} style={{ margin: '4px 0 6px', paddingLeft: 22 }}>
          {items.map((it, j) => (
            <li key={j} style={{ margin: '2px 0', fontSize: 13.5, lineHeight: 1.7, color: 'var(--text)' }}>
              {renderInline(it, onPageClick)}
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Paragraph — collect lines until blank / heading / list / code
    const paraLines = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('```') &&
      !/^[-*] /.test(lines[i]) &&
      !/^\d+\. /.test(lines[i]) &&
      !/^---+$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i])
      i++
    }
    if (paraLines.length) {
      nodes.push(
        <p key={i} style={{ margin: '4px 0 6px', fontSize: 13.5, lineHeight: 1.7, color: 'var(--text)' }}>
          {paraLines.map((l, j) => (
            <React.Fragment key={j}>
              {renderInline(l, onPageClick)}
              {j < paraLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      )
    }
  }

  return <div>{nodes}</div>
}

// Matches **bold**, *italic*, `code`, AND (p. N[, p. M, ...]) page citations
const INLINE_REGEX = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`|\(\s*p\.?\s*\d+(?:\s*,\s*p\.?\s*\d+)*\s*\)|p\.\s*\d+)/gi

function renderInline(text, onPageClick) {
  const parts = []
  let last = 0
  let m
  let k = 0

  while ((m = INLINE_REGEX.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const token = m[0]

    if (token.startsWith('**')) {
      parts.push(<strong key={k++} style={{ fontWeight: 600 }}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      parts.push(<em key={k++}>{token.slice(1, -1)}</em>)
    } else if (token.startsWith('`')) {
      parts.push(
        <code key={k++} style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 3,
          padding: '1px 5px',
          fontFamily: 'monospace',
          fontSize: '0.88em',
        }}>
          {token.slice(1, -1)}
        </code>
      )
    } else {
      // Page citation — could be "(p. 3)", "(p. 3, p. 5)" or bare "p. 3"
      const pageNumbers = [...token.matchAll(/\d+/g)].map(x => parseInt(x[0], 10))
      const wrappedInParens = token.startsWith('(')
      parts.push(
        <span key={k++}>
          {wrappedInParens ? '(' : ''}
          {pageNumbers.map((n, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && ', '}
              <CitationLink page={n} onClick={onPageClick} />
            </React.Fragment>
          ))}
          {wrappedInParens ? ')' : ''}
        </span>
      )
    }
    last = INLINE_REGEX.lastIndex
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function CitationLink({ page, onClick }) {
  const handle = (e) => {
    e.preventDefault()
    if (onClick) onClick(page)
  }
  return (
    <a
      href="#"
      onClick={handle}
      title={`Open page ${page} in PDF`}
      style={{
        color: 'var(--accent)',
        textDecoration: 'none',
        borderBottom: '1px dotted var(--accent)',
        cursor: 'pointer',
      }}
    >
      p. {page}
    </a>
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function AssistantIcon() {
  return (
    <div style={{
      width: 22,
      height: 22,
      borderRadius: 5,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 2,
    }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6"
        style={{ width: 12, height: 12 }}>
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      style={{ width: 11, height: 11 }}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  )
}
