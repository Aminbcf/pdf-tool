from abc import ABC, abstractmethod
from typing import List
from domain.entities import Conversation, Message


class IConversationHistory(ABC):
    @abstractmethod
    def get_or_create(self, session_id: str) -> Conversation: ...

    @abstractmethod
    def set_label(self, session_id: str, label: str) -> None: ...

    @abstractmethod
    def append(self, session_id: str, message: Message) -> None: ...

    @abstractmethod
    def list_sessions(self) -> List[Conversation]: ...

    @abstractmethod
    def delete(self, session_id: str) -> None: ...
