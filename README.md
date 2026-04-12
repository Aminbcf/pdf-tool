
## Setup

```bash
pip install -r requirements.txt
# requirements.txt uses faiss-cpu; swap for faiss-gpu if a CUDA GPU is available
```

## Running

```bash
# Start the server (model loading takes ~30-60 s on first run)
python main.py
# Visit http://localhost:8000
```

All commands must be run from the project root — Python resolves packages relative to `cwd`.

## Architecture — Hexagonal (Ports & Adapters)

```
domain/          ← pure Python, zero framework dependencies
  entities.py    ← Page, Message, Conversation, AskResult
  ports/         ← abstract interfaces (IPdfExtractor, IEmbeddingService,
                    ILanguageModel, IConversationHistory)

application/
  ask_question.py  ← AskQuestionUseCase: the only place that orchestrates the pipeline

adapters/
  inbound/
    api.py         ← FastAPI routes; constructs singletons, calls use case
  outbound/
    pdf_adapter.py        ← PyMuPDF → IPdfExtractor
    embedding_adapter.py  ← SentenceTransformer + FAISS → IEmbeddingService
    llm_adapter.py        ← Qwen2.5-3B-Instruct (4-bit NF4) → ILanguageModel
    history_adapter.py    ← JSON files in history/ → IConversationHistory

frontend/        ← vanilla HTML/CSS/JS, served by FastAPI StaticFiles
```

**Dependency rule:** domain has no imports from other layers. Application imports only from domain. Adapters import from domain and application; they never import each other.

## RAG Pipeline (per query)

1. `ILanguageModel.extract_keywords(query)` — LLM returns a JSON array of search terms.
2. `IPdfExtractor.extract_pages(pdf_path)` — PyMuPDF extracts every page as text.
3. `IEmbeddingService.search(query, keywords, pages)` — encodes original query and keyword string separately, averages the two vectors, searches a FAISS L2 index, returns top-k pages.
4. `ILanguageModel.answer(query, pages, history)` — injects retrieved pages as context into the Qwen prompt, includes last 6 history turns for continuity.

## Conversation History

Each session has a UUID as its key. History is persisted to `history/<uuid>.json`. The `FileConversationHistory` adapter maintains an in-process cache so repeated reads within a request don't re-open the file.

## API Surface

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/sessions` | Create a new session UUID |
| `GET`  | `/api/sessions` | List all sessions with labels |
| `POST` | `/api/sessions/{id}/upload` | Upload a PDF for the session |
| `POST` | `/api/sessions/{id}/ask` | Send a query, get answer + keywords + source pages |
| `GET`  | `/api/sessions/{id}/history` | Fetch full conversation history |

## Key Notes

- The FAISS index is rebuilt in memory on every `/ask` call. There is no persistent index file yet.
- `QwenAdapter` loads with `device_map="auto"` and 4-bit quantization — it falls back gracefully to CPU if no GPU is present, but inference will be slow.
- Session metadata (label, `hasPdf` flag) is stored in the browser's `localStorage`; the server only stores message history.
- The frontend serves from `frontend/` via FastAPI `StaticFiles`. API routes (`/api/*`) must stay above the static mount in `api.py` or they will be shadowed.
