"""BM25 retrieval over indexed chunks — no embedding model, pure stdlib.

BM25 is a strong lexical ranker and a genuinely good fit for code search:
queries and code share exact identifiers, and there is no embedding model to
keep resident (which matters on a memory-bound laptop). We build corpus
statistics once per process from the loaded chunks, then score per query.
"""

from __future__ import annotations

import math
from collections import Counter
from dataclasses import dataclass

from .index import Chunk
from .tokenize import tokenize


@dataclass
class Hit:
    chunk: Chunk
    score: float


class BM25:
    def __init__(self, chunks: list[Chunk], k1: float = 1.5, b: float = 0.75):
        self.chunks = chunks
        self.k1 = k1
        self.b = b
        self.doc_tokens: list[list[str]] = [tokenize(c.text) for c in chunks]
        self.doc_len = [len(t) for t in self.doc_tokens]
        self.avgdl = (sum(self.doc_len) / len(self.doc_len)) if self.doc_len else 0.0
        self.term_freqs: list[Counter] = [Counter(t) for t in self.doc_tokens]
        # document frequency per term
        df: Counter = Counter()
        for tf in self.term_freqs:
            df.update(tf.keys())
        self.df = df
        self.N = len(chunks)

    def _idf(self, term: str) -> float:
        n_q = self.df.get(term, 0)
        # BM25 idf with +0.5 smoothing; clamp at 0 so ubiquitous terms don't go negative
        return max(0.0, math.log(1 + (self.N - n_q + 0.5) / (n_q + 0.5)))

    def search(self, query: str, top_k: int = 6) -> list[Hit]:
        q_terms = tokenize(query)
        if not q_terms or self.N == 0:
            return []
        idf = {t: self._idf(t) for t in set(q_terms)}
        scored: list[Hit] = []
        for i, tf in enumerate(self.term_freqs):
            dl = self.doc_len[i]
            s = 0.0
            for t in q_terms:
                f = tf.get(t, 0)
                if not f:
                    continue
                denom = f + self.k1 * (1 - self.b + self.b * (dl / self.avgdl if self.avgdl else 0))
                s += idf[t] * (f * (self.k1 + 1)) / denom
            if s > 0:
                scored.append(Hit(self.chunks[i], s))
        scored.sort(key=lambda h: h.score, reverse=True)
        return _dedupe_by_file(scored, top_k)


def _dedupe_by_file(hits: list[Hit], top_k: int) -> list[Hit]:
    """Prefer coverage across files: allow at most 2 chunks per file in the top_k."""
    out: list[Hit] = []
    per_file: Counter = Counter()
    for h in hits:
        if per_file[h.chunk.path] >= 2:
            continue
        per_file[h.chunk.path] += 1
        out.append(h)
        if len(out) >= top_k:
            break
    return out
