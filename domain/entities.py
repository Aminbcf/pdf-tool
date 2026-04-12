from dataclasses import dataclass, field
from typing import List
import uuid


@dataclass
class Page:
    doc_id: str
    page: int
    text: str


@dataclass
class Message:
    role: str   # "user" or "assistant"
    content: str


@dataclass
class Conversation:
    id: str
    label: str = ""
    messages: List[Message] = field(default_factory=list)

    @classmethod
    def new(cls, label: str = "") -> "Conversation":
        return cls(id=str(uuid.uuid4()), label=label)


@dataclass
class AskResult:
    answer: str
    keywords: List[str]
    source_pages: List[int]
