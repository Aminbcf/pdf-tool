import React, { useRef, useEffect, useState } from 'react'
import Message from './Message.jsx'
import TypingIndicator from './TypingIndicator.jsx'

export default function ChatPanel({ sessionId, title, messages, loading, onSend, onChangePdf, onExport }) {
  const bottomRef = useRef()
  const textareaRef = useRef()
  const [query, setQuery] = useState('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, loading])

  function submit() {
    const q = query.trim()
    if (!q || loading) return
    setQuery('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    onSend(q)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  function handleInput(e) {
    setQuery(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 148) + 'px'
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '11px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-sidebar)',
        minHeight: 46,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"
            style={{ width: 14, height: 14, flexShrink: 0, opacity: 0.8 }}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6"/>
          </svg>
          <span style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {title}
          </span>
        </div>
        <ChangePdfButton onClick={onChangePdf} />
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-3)',
            fontSize: 13,
            padding: 40,
          }}>
            Ask anything about your PDF
          </div>
        ) : (
          messages.map(msg => (
            <Message key={msg.id} message={msg} sessionId={sessionId} onExport={onExport} />
          ))
        )}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-sidebar)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your PDF…"
            rows={1}
            style={{
              flex: 1,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 8,
              padding: '9px 13px',
              fontSize: 13.5,
              color: 'var(--text)',
              outline: 'none',
              resize: 'none',
              maxHeight: 148,
              lineHeight: 1.5,
              transition: 'border-color .12s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-light)')}
          />
          <SendButton disabled={!query.trim() || loading} onClick={submit} />
        </div>
        <p style={{ marginTop: 7, fontSize: 11, color: 'var(--text-3)', paddingLeft: 1 }}>
          Enter to send · Shift+Enter for newline · use the Export buttons under any answer to save as PDF or DOCX
        </p>
      </div>
    </div>
  )
}

function SendButton({ disabled, onClick }) {
  const [hover, setHover] = React.useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 36,
        height: 36,
        flexShrink: 0,
        background: disabled ? 'var(--bg-active)' : hover ? 'var(--accent-dim)' : 'var(--accent)',
        border: 'none',
        borderRadius: 8,
        color: disabled ? 'var(--text-3)' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background .12s, color .12s',
      }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 15, height: 15 }}>
        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
      </svg>
    </button>
  )
}

function ChangePdfButton({ onClick }) {
  const [hover, setHover] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'none',
        border: `1px solid ${hover ? 'var(--accent)' : 'var(--border-light)'}`,
        color: hover ? 'var(--accent)' : 'var(--text-2)',
        padding: '3px 9px',
        borderRadius: 5,
        fontSize: 11.5,
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'border-color .12s, color .12s',
        lineHeight: 1.6,
      }}
    >
      Change PDF
    </button>
  )
}
