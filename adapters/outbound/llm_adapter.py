import json
import re
from typing import List

import torch
from transformers import pipeline, BitsAndBytesConfig

from domain.ports.llm_port import ILanguageModel
from domain.entities import Page, Message


class QwenAdapter(ILanguageModel):
    def __init__(self, model_id: str = "Qwen/Qwen2.5-3B-Instruct"):
        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )
        self._pipe = pipeline(
            "text-generation",
            model=model_id,
            model_kwargs={"quantization_config": quant_config},
            device_map="auto",
        )

    def extract_keywords(self, query: str) -> List[str]:
        messages = [
            {
                "role": "system",
                "content": (
                    "Extract the key search terms from the user query. "
                    "Return ONLY a valid JSON array of strings, nothing else. "
                    'Example output: ["machine learning", "neural networks"]'
                ),
            },
            {"role": "user", "content": query},
        ]
        output = self._pipe(messages, max_new_tokens=64, do_sample=False)
        raw = output[0]["generated_text"][-1]["content"].strip()

        # Robustly parse: find first [...] block in the output
        match = re.search(r"\[.*?\]", raw, re.DOTALL)
        if match:
            try:
                keywords = json.loads(match.group())
                if isinstance(keywords, list) and keywords:
                    return [str(k) for k in keywords]
            except json.JSONDecodeError:
                pass

        # Fallback: meaningful words from the original query
        return [w for w in query.lower().split() if len(w) > 3]

    def answer(self, query: str, context_pages: List[Page], history: List[Message]) -> str:
        context_blocks = "\n\n".join(
            f"[Page {p.page}]\n{p.text.strip()}" for p in context_pages
        )
        system_content = (
            "You are a PDF assistant. Answer the user's question using ONLY the provided context.\n"
            "Format your response using Markdown:\n"
            "- Use ## for main sections and ### for subsections when the answer is long\n"
            "- Use **bold** for key terms and important values\n"
            "- Use bullet points (- item) or numbered lists (1. item) where listing information\n"
            "- Use `code` for technical terms, filenames, or short values\n"
            "Always cite page numbers like (p. 3) when referencing information.\n"
            "If the context is insufficient, say 'I don't know'.\n\n"
            f"--- Context ---\n{context_blocks}\n--- End Context ---"
        )

        messages = [{"role": "system", "content": system_content}]
        # Include last 6 turns to stay within token budget
        for m in history[-6:]:
            messages.append({"role": m.role, "content": m.content})
        messages.append({"role": "user", "content": query})

        output = self._pipe(messages, max_new_tokens=512, do_sample=True, temperature=0.1)
        return output[0]["generated_text"][-1]["content"]
