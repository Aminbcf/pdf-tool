from domain.ports.pdf_port import IPdfExtractor
from domain.ports.embedding_port import IEmbeddingService
from domain.ports.llm_port import ILanguageModel
from domain.ports.history_port import IConversationHistory
from domain.entities import Message, AskResult


class AskQuestionUseCase:
    def __init__(
        self,
        pdf_extractor: IPdfExtractor,
        embedding_service: IEmbeddingService,
        llm: ILanguageModel,
        history: IConversationHistory,
    ):
        self._pdf = pdf_extractor
        self._emb = embedding_service
        self._llm = llm
        self._history = history

    def execute(self, session_id: str, query: str, pdf_path: str) -> AskResult:
        conversation = self._history.get_or_create(session_id)

        # Step 1 — extract semantic keywords from the raw query
        keywords = self._llm.extract_keywords(query)

        # Step 2 — retrieve relevant pages (from saved index when available)
        if self._emb.has_index(session_id):
            relevant_pages = self._emb.search_indexed(query, keywords, session_id)
        else:
            pages = self._pdf.extract_pages(pdf_path)
            relevant_pages = self._emb.search(query, keywords, pages)

        # Step 3 — generate grounded answer with conversation history
        answer = self._llm.answer(query, relevant_pages, conversation.messages)

        # Step 4 — persist both turns
        self._history.append(session_id, Message(role="user", content=query))
        self._history.append(session_id, Message(role="assistant", content=answer))

        return AskResult(
            answer=answer,
            keywords=keywords,
            source_pages=[p.page for p in relevant_pages],
        )
