import fitz  # PyMuPDF
from typing import List

from domain.ports.pdf_port import IPdfExtractor
from domain.entities import Page


class PyMuPDFAdapter(IPdfExtractor):
    def extract_pages(self, pdf_path: str) -> List[Page]:
        doc = fitz.open(pdf_path)
        return [
            Page(doc_id=pdf_path, page=i + 1, text=page.get_text())
            for i, page in enumerate(doc)
        ]
