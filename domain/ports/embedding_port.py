from abc import ABC, abstractmethod
from typing import List
from domain.entities import Page


class IEmbeddingService(ABC):
    @abstractmethod
    def search(self, query: str, keywords: List[str], pages: List[Page], k: int = 3) -> List[Page]: ...

    @abstractmethod
    def index_session(self, session_id: str, pages: List[Page]) -> None: ...

    @abstractmethod
    def has_index(self, session_id: str) -> bool: ...

    @abstractmethod
    def search_indexed(self, query: str, keywords: List[str], session_id: str, k: int = 3) -> List[Page]: ...
