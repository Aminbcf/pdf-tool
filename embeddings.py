from pdfEmbeddings import extract_pages
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np




model = SentenceTransformer('all-MiniLM-L6-v2' , device='cuda')
# helper functions 
def encode_pages(pages):
    text = [p['text'] for p in pages]
    embeddings = model.encode(text)
    
    return embeddings

def build_faiss_index(embeddings):
    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)
    index.add(np.array(embeddings))
    return index

def search_old(query, model, index, pages, k=3):
    model = model = SentenceTransformer('all-MiniLM-L6-v2' , device='cuda')
    query_vec = model.encode([query])
    D, I = index.search(query_vec, k)
    
    results = []
    for idx in I[0]:
        results.append(pages[idx])
    
    return results  

def search(query):
    
    pages = extract_pages("ilovepdf_merged.pdf")
    embeddings = encode_pages(pages)
    index = build_faiss_index(embeddings)

    results = search_old(query, model, index, pages)

    return results



# test 

pages = extract_pages("ilovepdf_merged.pdf")
embeddings = encode_pages(pages)
index = build_faiss_index(embeddings)

results = search_old("Contact Qualification B2C", model, index, pages)

for r in results:
    print(f"{r['doc_id']} - Page {r['page']}")
    
