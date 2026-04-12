import React from 'react'

export default function TypingIndicator() {
  return (
    <div style={{ padding: '3px 28px', display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
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
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6"
            style={{ width: 12, height: 12 }}>
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'var(--text-3)',
                animationName: 'dotPulse',
                animationDuration: '1.3s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: `${i * 0.18}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
