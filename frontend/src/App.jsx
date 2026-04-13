import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ChatPanel from './components/ChatPanel.jsx'
import UploadPanel from './components/UploadPanel.jsx'
import { createSession, uploadPdf, askQuestion, getHistory, exportDocument, deleteSession } from './api.js'

const STORAGE_KEY = 'pdftool_sessions_v2'
const CURRENT_KEY = 'pdftool_current_v2'

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

function persistSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

export default function App() {
  const [sessions, setSessions] = useState(loadSessions)
  const [currentId, setCurrentId] = useState(null)
  const [messages, setMessages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentSession = sessions.find(s => s.id === currentId) ?? null
  const panel = currentId === null
    ? 'empty'
    : currentSession?.hasPdf ? 'chat' : 'upload'

  // Boot: restore last active session
  useEffect(() => {
    const initial = loadSessions()
    const savedId = localStorage.getItem(CURRENT_KEY)
    const target = (savedId && initial.find(s => s.id === savedId))
      ? savedId
      : initial[0]?.id ?? null

    if (target) {
      activateSession(target, initial)
    }
  }, [])

  async function activateSession(id, sessionList) {
    const all = sessionList ?? sessions
    const s = all.find(x => x.id === id)
    setCurrentId(id)
    localStorage.setItem(CURRENT_KEY, id)

    if (!s?.hasPdf) {
      setMessages([])
      return
    }

    try {
      const data = await getHistory(id)
      setMessages(
        data.messages.map((m, i) => ({
          id: `hist-${i}`,
          role: m.role,
          content: m.content,
          keywords: [],
          pages: [],
        }))
      )
    } catch {
      setMessages([])
    }
  }

  async function handleNewSession() {
    const { session_id } = await createSession()
    const fresh = { id: session_id, label: '', hasPdf: false }
    const updated = [fresh, ...sessions]
    setSessions(updated)
    persistSessions(updated)
    activateSession(session_id, updated)
  }

  async function handleUpload(file) {
    if (!currentId) return
    setUploading(true)
    try {
      const data = await uploadPdf(currentId, file)
      setSessions(prev => {
        const updated = prev.map(s =>
          s.id === currentId ? { ...s, hasPdf: true, label: data.filename } : s
        )
        persistSessions(updated)
        return updated
      })
      setMessages([])
    } catch (e) {
      throw e
    } finally {
      setUploading(false)
    }
  }

  async function handleSend(query) {
    if (!currentId || loading) return

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: query, keywords: [], pages: [] }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    try {
      const data = await askQuestion(currentId, query)
      const aiMsg = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        keywords: data.keywords ?? [],
        pages: data.source_pages ?? [],
        query,
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'assistant', content: `Error: ${e.message}`, keywords: [], pages: [] },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleExport(message, format) {
    if (!currentId) return
    const title = message.query || 'Answer'
    const blob = await exportDocument(currentId, title, message.content, message.pages ?? [], format)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `answer.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  async function handleDeleteSession(id) {
    try {
      await deleteSession(id)
    } catch (e) {
      console.error('Delete failed:', e)
    }
    const remaining = sessions.filter(s => s.id !== id)
    setSessions(remaining)
    persistSessions(remaining)

    if (currentId === id) {
      const next = remaining[0]?.id ?? null
      if (next) {
        activateSession(next, remaining)
      } else {
        setCurrentId(null)
        localStorage.removeItem(CURRENT_KEY)
        setMessages([])
      }
    }
  }

  function handleChangePdf() {
    if (!currentId) return
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id === currentId ? { ...s, hasPdf: false, label: '' } : s
      )
      persistSessions(updated)
      return updated
    })
    setMessages([])
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onNewSession={handleNewSession}
        onSelectSession={id => activateSession(id)}
        onDeleteSession={handleDeleteSession}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
        {panel === 'empty' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 40, height: 40, display: 'block', margin: '0 auto 14px', opacity: 0.4 }}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <path d="M14 2v6h6"/>
              </svg>
              <p style={{ fontSize: 13 }}>Select a session or start a new one</p>
            </div>
          </div>
        )}

        {panel === 'upload' && (
          <UploadPanel onUpload={handleUpload} uploading={uploading} />
        )}

        {panel === 'chat' && (
          <ChatPanel
            sessionId={currentId}
            title={currentSession?.label || currentId?.slice(0, 8) || ''}
            messages={messages}
            loading={loading}
            onSend={handleSend}
            onChangePdf={handleChangePdf}
            onExport={handleExport}
          />
        )}
      </main>
    </div>
  )
}
