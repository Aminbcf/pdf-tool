from abc import ABC, abstractmethod
from typing import List
from domain.entities import Page


class IPdfExtractor(ABC):
    @abstractmethod
    def extract_pages(self, pdf_path: str) -> List[Page]: ...
