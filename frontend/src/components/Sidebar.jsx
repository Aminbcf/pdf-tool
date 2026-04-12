import React from 'react'

export default function Sidebar({ sessions, currentId, onNewSession, onSelectSession }) {
  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minWidth: 'var(--sidebar-w)',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 14px 13px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--accent)', opacity: 0.9, flexShrink: 0 }} />
          <span style={{ fontWeight: 600, fontSize: 13, letterSpacing: '-.01em', color: 'var(--text)' }}>
            PdfTool
          </span>
        </div>
        <NewButton onClick={onNewSession} />
      </div>

      {/* Session list */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '8px 6px' }}>
        {sessions.length === 0 ? (
          <p style={{ padding: '20px 10px', fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
            No sessions yet
          </p>
        ) : (
          sessions.map(s => (
            <SessionItem
              key={s.id}
              session={s}
              active={s.id === currentId}
              onClick={() => onSelectSession(s.id)}
            />
          ))
        )}
      </div>
    </aside>
  )
}

function NewButton({ onClick }) {
  const [hover, setHover] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'none',
        border: `1px solid ${hover ? 'var(--accent)' : 'var(--border-light)'}`,
        borderRadius: 5,
        color: hover ? 'var(--accent)' : 'var(--text-2)',
        padding: '3px 9px',
        fontSize: 11.5,
        cursor: 'pointer',
        transition: 'border-color .12s, color .12s',
        lineHeight: 1.6,
      }}
    >
      New
    </button>
  )
}

function SessionItem({ session, active, onClick }) {
  const [hover, setHover] = React.useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '7px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        background: active ? 'var(--bg-active)' : hover ? 'var(--bg-hover)' : 'transparent',
        marginBottom: 1,
        transition: 'background .1s',
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        overflow: 'hidden',
      }}
    >
      <div style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: session.hasPdf ? 'var(--accent)' : 'var(--text-3)',
        flexShrink: 0,
        opacity: session.hasPdf ? 0.8 : 0.5,
      }} />
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          fontSize: 12.5,
          fontWeight: active ? 500 : 400,
          color: active ? 'var(--text)' : 'var(--text-2)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.4,
        }}>
          {session.label || session.id.slice(0, 14)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
          {session.hasPdf ? 'PDF ready' : 'No PDF'}
        </div>
      </div>
    </div>
  )
}
