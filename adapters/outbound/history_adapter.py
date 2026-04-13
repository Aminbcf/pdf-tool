import json
import os
from typing import List

from domain.ports.history_port import IConversationHistory
from domain.entities import Conversation, Message


class FileConversationHistory(IConversationHistory):
    """Persists each conversation as a JSON file under `storage_dir`."""

    def __init__(self, storage_dir: str = "history"):
        os.makedirs(storage_dir, exist_ok=True)
        self._dir = storage_dir
        self._cache: dict = {}

    def _path(self, session_id: str) -> str:
        return os.path.join(self._dir, f"{session_id}.json")

    def _save(self, conv: Conversation) -> None:
        with open(self._path(conv.id), "w", encoding="utf-8") as f:
            json.dump(
                {
                    "id": conv.id,
                    "label": conv.label,
                    "messages": [
                        {"role": m.role, "content": m.content} for m in conv.messages
                    ],
                },
                f,
                indent=2,
                ensure_ascii=False,
            )

    def get_or_create(self, session_id: str) -> Conversation:
        if session_id in self._cache:
            return self._cache[session_id]

        path = self._path(session_id)
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            conv = Conversation(
                id=data["id"],
                label=data.get("label", ""),
                messages=[Message(**m) for m in data["messages"]],
            )
        else:
            conv = Conversation(id=session_id)

        self._cache[session_id] = conv
        return conv

    def set_label(self, session_id: str, label: str) -> None:
        conv = self.get_or_create(session_id)
        conv.label = label
        self._save(conv)

    def append(self, session_id: str, message: Message) -> None:
        conv = self.get_or_create(session_id)
        conv.messages.append(message)
        self._save(conv)

    def list_sessions(self) -> List[Conversation]:
        sessions = []
        for fname in sorted(os.listdir(self._dir)):
            if fname.endswith(".json"):
                session_id = fname[:-5]
                sessions.append(self.get_or_create(session_id))
        return sessions

    def delete(self, session_id: str) -> None:
        self._cache.pop(session_id, None)
        path = self._path(session_id)
        if os.path.exists(path):
            os.remove(path)
