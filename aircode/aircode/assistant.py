"""Glue: retrieve relevant code, build a grounded prompt, stream the answer.

This is where the "small model + externalized knowledge" thesis becomes real.
The model never has to have memorized the repo; we retrieve the few chunks that
matter and put them in the prompt, so a 7B coder answers as if it knew the
codebase.
"""

from __future__ import annotations

from typing import Iterator

from .index import Chunk
from .retrieve import BM25, Hit

SYSTEM_PROMPT = (
    "You are aircode, a precise offline coding assistant running locally on the "
    "user's machine. You are given excerpts retrieved from the user's own "
    "codebase. Ground every answer in those excerpts. When you cite code, refer "
    "to it as path:start-end. If the excerpts don't contain the answer, say so "
    "and state what file or symbol you'd need. Prefer concrete diffs and runnable "
    "code over prose. Never invent APIs that aren't shown or standard."
)


def format_context(hits: list[Hit], budget_chars: int = 8000) -> str:
    """Render retrieved chunks into a context block, capped to a char budget."""
    parts: list[str] = []
    used = 0
    for h in hits:
        c = h.chunk
        header = f"--- {c.path}:{c.start_line}-{c.end_line} (score {h.score:.1f}) ---"
        body = f"{header}\n{c.text}\n"
        if used + len(body) > budget_chars and parts:
            break
        parts.append(body)
        used += len(body)
    return "\n".join(parts) if parts else "(no relevant code found in the index)"


def build_messages(question: str, hits: list[Hit], history: list[dict] | None = None) -> list[dict]:
    context = format_context(hits)
    history = history or []
    user = (
        f"Relevant code from the project:\n\n{context}\n\n"
        f"Question: {question}"
    )
    return [{"role": "system", "content": SYSTEM_PROMPT}, *history, {"role": "user", "content": user}]


class Assistant:
    def __init__(self, chunks: list[Chunk], model: str, host: str, top_k: int = 6):
        self.bm25 = BM25(chunks)
        self.model = model
        self.host = host
        self.top_k = top_k
        self.history: list[dict] = []

    def retrieve(self, question: str) -> list[Hit]:
        return self.bm25.search(question, top_k=self.top_k)

    def answer_stream(self, question: str) -> tuple[list[Hit], Iterator[str]]:
        # imported lazily so retrieval/tests don't require the llm module's network path
        from .llm import chat_stream

        hits = self.retrieve(question)
        messages = build_messages(question, hits, self.history)

        def gen() -> Iterator[str]:
            collected: list[str] = []
            for piece in chat_stream(messages, model=self.model, host=self.host):
                collected.append(piece)
                yield piece
            self.history.append({"role": "user", "content": question})
            self.history.append({"role": "assistant", "content": "".join(collected)})
            # keep history bounded so the resident context stays small
            if len(self.history) > 8:
                self.history = self.history[-8:]

        return hits, gen()
