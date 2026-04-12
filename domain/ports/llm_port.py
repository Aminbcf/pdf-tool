from abc import ABC, abstractmethod
from typing import List
from domain.entities import Page, Message


class ILanguageModel(ABC):
    @abstractmethod
    def extract_keywords(self, query: str) -> List[str]: ...

    @abstractmethod
    def answer(self, query: str, context_pages: List[Page], history: List[Message]) -> str: ...
