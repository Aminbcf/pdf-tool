import React from 'react'

export default function Message({ message }) {
  const isUser = message.role === 'user'

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
            <MarkdownRenderer content={message.content} />

            {message.exportFormat && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                marginTop: 10, padding: '3px 9px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 5,
                fontSize: 11, color: 'var(--text-2)',
              }}>
                <DownloadIcon />
                Exported as {message.exportFormat.toUpperCase()}
              </div>
            )}

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
                  <span key={`p${i}`} style={{
                    fontSize: 11,
                    padding: '2px 7px',
                    borderRadius: 4,
                    color: 'var(--accent)',
                    border: '1px solid var(--accent)',
                    opacity: 0.75,
                  }}>
                    p.{p}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Markdown renderer — no external dependencies
// ---------------------------------------------------------------------------

function MarkdownRenderer({ content }) {
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
          {renderInline(line.slice(4))}
        </h3>
      )
      i++; continue
    }
    if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={i} style={{ fontSize: 14.5, fontWeight: 700, margin: '14px 0 4px', color: 'var(--text)' }}>
          {renderInline(line.slice(3))}
        </h2>
      )
      i++; continue
    }
    if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={i} style={{ fontSize: 16, fontWeight: 700, margin: '16px 0 5px', color: 'var(--text)' }}>
          {renderInline(line.slice(2))}
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
              {renderInline(it)}
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
              {renderInline(it)}
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
              {renderInline(l)}
              {j < paraLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      )
    }
  }

  return <div>{nodes}</div>
}

function renderInline(text) {
  const parts = []
  const regex = /(\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|`[^`\n]+?`)/g
  let last = 0
  let m
  let k = 0

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const token = m[0]
    if (token.startsWith('**')) {
      parts.push(<strong key={k++} style={{ fontWeight: 600 }}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      parts.push(<em key={k++}>{token.slice(1, -1)}</em>)
    } else {
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
    }
    last = regex.lastIndex
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts
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
