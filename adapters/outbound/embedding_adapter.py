import json
import os
from typing import Dict, List, Tuple

import faiss
import torch
from sentence_transformers import SentenceTransformer

from domain.ports.embedding_port import IEmbeddingService
from domain.entities import Page

INDEXES_DIR = "indexes"


class FAISSEmbeddingAdapter(IEmbeddingService):
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        device = "cuda" if torch.cuda.is_available() else "cpu"
        self._model = SentenceTransformer(model_name, device=device)
        os.makedirs(INDEXES_DIR, exist_ok=True)
        # in-memory cache: session_id -> (faiss.Index, List[Page])
        self._cache: Dict[str, Tuple] = {}

    # ------------------------------------------------------------------
    # Persistence helpers
    # ------------------------------------------------------------------

    def _index_path(self, session_id: str) -> str:
        return os.path.join(INDEXES_DIR, f"{session_id}.faiss")

    def _pages_path(self, session_id: str) -> str:
        return os.path.join(INDEXES_DIR, f"{session_id}.pages.json")

    def index_session(self, session_id: str, pages: List[Page]) -> None:
        """Build a FAISS index from pages and persist it to disk."""
        if not pages:
            return
        texts = [p.text for p in pages]
        embeddings = self._model.encode(texts, convert_to_numpy=True).astype("float32")
        dim = embeddings.shape[1]
        index = faiss.IndexFlatL2(dim)
        index.add(embeddings)

        faiss.write_index(index, self._index_path(session_id))
        with open(self._pages_path(session_id), "w", encoding="utf-8") as f:
            json.dump(
                [{"doc_id": p.doc_id, "page": p.page, "text": p.text} for p in pages],
                f,
                ensure_ascii=False,
            )
        self._cache[session_id] = (index, pages)

    def has_index(self, session_id: str) -> bool:
        return session_id in self._cache or os.path.exists(self._index_path(session_id))

    def _load(self, session_id: str) -> Tuple:
        if session_id in self._cache:
            return self._cache[session_id]
        index = faiss.read_index(self._index_path(session_id))
        with open(self._pages_path(session_id), encoding="utf-8") as f:
            data = json.load(f)
        pages = [Page(**p) for p in data]
        self._cache[session_id] = (index, pages)
        return index, pages

    # ------------------------------------------------------------------
    # Port methods
    # ------------------------------------------------------------------

    def search_indexed(self, query: str, keywords: List[str], session_id: str, k: int = 3) -> List[Page]:
        index, pages = self._load(session_id)
        return self._query(query, keywords, index, pages, k)

    def search(self, query: str, keywords: List[str], pages: List[Page], k: int = 3) -> List[Page]:
        """Ephemeral search — builds an in-memory index without saving."""
        if not pages:
            return []
        texts = [p.text for p in pages]
        embeddings = self._model.encode(texts, convert_to_numpy=True).astype("float32")
        dim = embeddings.shape[1]
        index = faiss.IndexFlatL2(dim)
        index.add(embeddings)
        return self._query(query, keywords, index, pages, k)

    def _query(self, query: str, keywords: List[str], index, pages: List[Page], k: int) -> List[Page]:
        keyword_str = " ".join(keywords) if keywords else query
        query_vec = self._model.encode([query], convert_to_numpy=True).astype("float32")
        keyword_vec = self._model.encode([keyword_str], convert_to_numpy=True).astype("float32")
        combined_vec = ((query_vec + keyword_vec) / 2.0).astype("float32")
        k = min(k, len(pages))
        _, indices = index.search(combined_vec, k)
        return [pages[idx] for idx in indices[0] if idx < len(pages)]
