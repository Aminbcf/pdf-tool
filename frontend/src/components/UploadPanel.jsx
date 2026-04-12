import React, { useState, useRef } from 'react'

export default function UploadPanel({ onUpload, uploading }) {
  const [dragover, setDragover] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function handleFile(file) {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are accepted')
      return
    }
    setError('')
    onUpload(file).catch(e => setError(e.message))
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragover(true) }}
        onDragLeave={() => setDragover(false)}
        onDrop={e => {
          e.preventDefault()
          setDragover(false)
          handleFile(e.dataTransfer.files[0])
        }}
        style={{
          width: '100%',
          maxWidth: 380,
          border: `1.5px dashed ${dragover ? 'var(--accent)' : 'var(--border-light)'}`,
          borderRadius: 12,
          padding: '52px 36px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: dragover ? 'var(--bg-hover)' : 'transparent',
          transition: 'border-color .15s, background .15s',
          userSelect: 'none',
        }}
      >
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center' }}>
          {uploading ? (
            <Spinner />
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
              style={{ color: dragover ? 'var(--accent)' : 'var(--text-3)', transition: 'color .15s' }}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6"/>
              <path d="M12 18v-6M9 15l3-3 3 3"/>
            </svg>
          )}
        </div>

        <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', marginBottom: 5 }}>
          {uploading ? 'Processing…' : 'Upload a PDF'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
          {uploading ? 'Building search index' : 'Drag and drop or click to browse'}
        </p>

        {error && (
          <p style={{ marginTop: 14, fontSize: 12, color: '#f87171' }}>{error}</p>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
    </div>
  )
}

function Spinner() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
  )
}
