import fitz  # PyMuPDF

def extract_pages(pdf_path):
    doc = fitz.open(pdf_path)
    pages = []
    
    for i, page in enumerate(doc):
        text = page.get_text()
        pages.append({
            "doc_id": pdf_path,
            "page": i + 1,
            "text": text
        })
    
    return pages