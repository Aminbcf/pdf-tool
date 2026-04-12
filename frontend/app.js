/* =========================================================
   PdfTool frontend
   ========================================================= */

const STORAGE_KEY = "pdftool_sessions";   // localStorage key
const CURRENT_KEY = "pdftool_current";

// ---------- persistence helpers ----------
function loadSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}
function getCurrentId() { return localStorage.getItem(CURRENT_KEY); }
function setCurrentId(id) { localStorage.setItem(CURRENT_KEY, id); }

// ---------- DOM references ----------
const btnNewChat    = document.getElementById("btn-new-chat");
const sessionList   = document.getElementById("session-list");
const uploadPanel   = document.getElementById("upload-panel");
const chatPanel     = document.getElementById("chat-panel");
const emptyState    = document.getElementById("empty-state");
const uploadBox     = document.getElementById("upload-box");
const fileInput     = document.getElementById("file-input");
const uploadStatus  = document.getElementById("upload-status");
const chatTitle     = document.getElementById("chat-title");
const messagesEl    = document.getElementById("messages");
const chatForm      = document.getElementById("chat-form");
const queryInput    = document.getElementById("query-input");
const btnSend       = document.getElementById("btn-send");
const btnChangePdf  = document.getElementById("btn-change-pdf");

let currentSessionId = null;

// =========================================================
// Session list rendering
// =========================================================
function renderSessions() {
  const sessions = loadSessions();
  sessionList.innerHTML = "";
  sessions.forEach(s => {
    const li = document.createElement("li");
    li.className = "session-item" + (s.id === currentSessionId ? " active" : "");
    li.dataset.id = s.id;
    li.innerHTML = `
      <div class="s-label">${escHtml(s.label || s.id.slice(0, 8))}</div>
      <div class="s-meta">${s.hasPdf ? "PDF ready" : "No PDF"}</div>
    `;
    li.addEventListener("click", () => switchSession(s.id));
    sessionList.appendChild(li);
  });
}

// =========================================================
// Panel switching
// =========================================================
function showPanel(which) {
  uploadPanel.classList.add("hidden");
  chatPanel.classList.add("hidden");
  emptyState.classList.add("hidden");
  if (which === "upload") uploadPanel.classList.remove("hidden");
  else if (which === "chat")  chatPanel.classList.remove("hidden");
  else                        emptyState.classList.remove("hidden");
}

// =========================================================
// Switch active session
// =========================================================
async function switchSession(id) {
  currentSessionId = id;
  setCurrentId(id);
  renderSessions();

  const sessions = loadSessions();
  const s = sessions.find(x => x.id === id);
  if (!s) return;

  if (!s.hasPdf) {
    uploadStatus.textContent = "";
    showPanel("upload");
    return;
  }

  chatTitle.textContent = s.label || id.slice(0, 8);
  showPanel("chat");
  await loadHistory(id);
}

// =========================================================
// New session
// =========================================================
async function createSession() {
  const res = await fetch("/api/sessions", { method: "POST" });
  const data = await res.json();
  const sessions = loadSessions();
  sessions.unshift({ id: data.session_id, label: "", hasPdf: false });
  saveSessions(sessions);
  await switchSession(data.session_id);
}

// =========================================================
// PDF upload
// =========================================================
async function uploadPdf(file) {
  if (!currentSessionId) return;
  uploadStatus.textContent = "Uploading…";

  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch(`/api/sessions/${currentSessionId}/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json();
      uploadStatus.textContent = err.detail || "Upload failed";
      return;
    }
    const data = await res.json();

    // Update local record
    const sessions = loadSessions();
    const s = sessions.find(x => x.id === currentSessionId);
    if (s) { s.hasPdf = true; s.label = data.filename; }
    saveSessions(sessions);

    uploadStatus.textContent = "";
    chatTitle.textContent = data.filename;
    showPanel("chat");
    messagesEl.innerHTML = "";
    renderSessions();
  } catch {
    uploadStatus.textContent = "Network error";
  }
}

// =========================================================
// Load conversation history
// =========================================================
async function loadHistory(sessionId) {
  messagesEl.innerHTML = "";
  try {
    const res = await fetch(`/api/sessions/${sessionId}/history`);
    if (!res.ok) return;
    const data = await res.json();
    data.messages.forEach(m => appendMessage(m.role, m.content));
    scrollToBottom();
  } catch { /* network error: ignore */ }
}

// =========================================================
// Send a message
// =========================================================
async function sendMessage(query) {
  appendMessage("user", query);
  queryInput.value = "";
  autoResize();
  btnSend.disabled = true;

  // Typing indicator
  const typingEl = document.createElement("div");
  typingEl.className = "message assistant";
  typingEl.innerHTML = `<div class="bubble typing-indicator"><span></span><span></span><span></span></div>`;
  messagesEl.appendChild(typingEl);
  scrollToBottom();

  try {
    const form = new FormData();
    form.append("query", query);
    const res = await fetch(`/api/sessions/${currentSessionId}/ask`, {
      method: "POST",
      body: form,
    });
    typingEl.remove();

    if (!res.ok) {
      const err = await res.json();
      appendMessage("assistant", `Error: ${err.detail || "Unknown error"}`);
    } else {
      const data = await res.json();
      appendMessage("assistant", data.answer, data.keywords, data.source_pages);
    }
  } catch {
    typingEl.remove();
    appendMessage("assistant", "Network error — please try again.");
  }

  btnSend.disabled = false;
  scrollToBottom();
}

// =========================================================
// DOM helpers
// =========================================================
function appendMessage(role, content, keywords = [], pages = []) {
  const div = document.createElement("div");
  div.className = `message ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;
  div.appendChild(bubble);

  if (role === "assistant" && (keywords.length || pages.length)) {
    const tags = document.createElement("div");
    tags.className = "meta-tags";
    keywords.forEach(k => {
      const t = document.createElement("span");
      t.className = "tag";
      t.textContent = k;
      tags.appendChild(t);
    });
    pages.forEach(p => {
      const t = document.createElement("span");
      t.className = "tag page";
      t.textContent = `p.${p}`;
      tags.appendChild(t);
    });
    div.appendChild(tags);
  }

  messagesEl.appendChild(div);
}

function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function autoResize() {
  queryInput.style.height = "auto";
  queryInput.style.height = Math.min(queryInput.scrollHeight, 160) + "px";
}

// =========================================================
// Event wiring
// =========================================================
btnNewChat.addEventListener("click", createSession);

btnChangePdf.addEventListener("click", () => {
  if (!currentSessionId) return;
  const sessions = loadSessions();
  const s = sessions.find(x => x.id === currentSessionId);
  if (s) { s.hasPdf = false; s.label = ""; }
  saveSessions(sessions);
  renderSessions();
  showPanel("upload");
});

// File input change
fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) uploadPdf(file);
});

// Drag-and-drop
uploadBox.addEventListener("dragover", e => {
  e.preventDefault();
  uploadBox.classList.add("dragover");
});
uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("dragover"));
uploadBox.addEventListener("drop", e => {
  e.preventDefault();
  uploadBox.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file) uploadPdf(file);
});
uploadBox.addEventListener("click", e => {
  if (e.target === uploadBox || e.target.tagName === "SVG" || e.target.tagName === "P") {
    fileInput.click();
  }
});

// Chat form submit
chatForm.addEventListener("submit", e => {
  e.preventDefault();
  const q = queryInput.value.trim();
  if (!q || !currentSessionId) return;
  sendMessage(q);
});

// Ctrl+Enter or Enter (without shift) submits
queryInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event("submit"));
  }
});
queryInput.addEventListener("input", autoResize);

// =========================================================
// Boot
// =========================================================
(async function init() {
  const sessions = loadSessions();
  renderSessions();

  const savedId = getCurrentId();
  if (savedId && sessions.find(s => s.id === savedId)) {
    await switchSession(savedId);
  } else if (sessions.length > 0) {
    await switchSession(sessions[0].id);
  } else {
    showPanel("empty");
  }
})();
