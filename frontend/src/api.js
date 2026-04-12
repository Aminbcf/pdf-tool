export async function createSession() {
  const r = await fetch('/api/sessions', { method: 'POST' })
  if (!r.ok) throw new Error('Failed to create session')
  return r.json()
}

export async function listSessions() {
  const r = await fetch('/api/sessions')
  if (!r.ok) throw new Error('Failed to list sessions')
  return r.json()
}

export async function uploadPdf(sessionId, file) {
  const form = new FormData()
  form.append('file', file)
  const r = await fetch(`/api/sessions/${sessionId}/upload`, { method: 'POST', body: form })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || 'Upload failed')
  }
  return r.json()
}

export async function askQuestion(sessionId, query) {
  const form = new FormData()
  form.append('query', query)
  const r = await fetch(`/api/sessions/${sessionId}/ask`, { method: 'POST', body: form })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || 'Request failed')
  }
  return r.json()
}

export async function getHistory(sessionId) {
  const r = await fetch(`/api/sessions/${sessionId}/history`)
  if (!r.ok) throw new Error('Failed to load history')
  return r.json()
}

export async function exportDocument(sessionId, title, text, sourcePages, format = 'pdf') {
  const form = new FormData()
  form.append('title', title)
  form.append('text', text)
  form.append('source_pages', (sourcePages ?? []).join(','))
  form.append('format', format)
  const r = await fetch(`/api/sessions/${sessionId}/export`, { method: 'POST', body: form })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || 'Export failed')
  }
  return r.blob()
}
