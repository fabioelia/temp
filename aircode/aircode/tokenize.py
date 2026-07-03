"""Code-aware tokenization for retrieval.

Plain whitespace tokenization is poor for source code: identifiers like
`getUserById` or `max_retry_count` carry most of the search signal but never
match a query for "user" or "retry". We keep the whole identifier *and* its
sub-tokens (split on snake_case underscores and camelCase boundaries), and
lowercase everything, so a query matches at both granularities.
"""

from __future__ import annotations

import re

# Split on anything that isn't alphanumeric or underscore, so snake_case
# identifiers survive as whole tokens.
_SPLIT = re.compile(r"[^A-Za-z0-9_]+")
# camelCase / PascalCase boundaries
_CAMEL = re.compile(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])")

# Light suffix stemmer (longest-suffix-first). Purely lexical retrieval is
# blind to morphology, so a query for "tokenizer" would miss the symbol
# "tokenize". Collapsing common suffixes to a shared stem fixes that. Applied
# symmetrically to documents and queries, so the two always meet at the stem.
_STEM_RULES = [
    ("izations", "ize"), ("ization", "ize"), ("izing", "ize"), ("izes", "ize"),
    ("ized", "ize"), ("izers", "ize"), ("izer", "ize"),
    ("isations", "ise"), ("isation", "ise"), ("ising", "ise"), ("iser", "ise"),
    ("tions", "tion"), ("ments", "ment"), ("nesses", "ness"),
    ("ingly", ""), ("edly", ""), ("ing", ""), ("edly", ""), ("ed", ""),
    ("ers", ""), ("er", ""), ("ors", ""), ("ors", ""),
    ("ies", "y"), ("es", ""), ("s", ""),
]


def _stem(tok: str) -> str:
    if len(tok) <= 4:
        return tok
    for suf, repl in _STEM_RULES:
        if tok.endswith(suf) and len(tok) - len(suf) + len(repl) >= 3:
            return tok[: len(tok) - len(suf)] + repl
    return tok


def _subtokens(raw: str) -> list[str]:
    """Break an identifier into parts by underscore and camelCase."""
    parts: list[str] = []
    for snake in raw.split("_"):
        if not snake:
            continue
        parts.extend(p for p in _CAMEL.split(snake) if p)
    return parts


def tokenize(text: str) -> list[str]:
    """Tokenize source text into lowercase terms, keeping whole identifiers and parts.

    `getUserById`     -> ['getuserbyid', 'get', 'user', 'by', 'id']
    `max_retry_count` -> ['max_retry_count', 'max', 'retry', 'count']
    `Foo.bar_baz`     -> ['foo', 'bar_baz', 'bar', 'baz']
    """
    tokens: list[str] = []

    def emit(t: str):
        tokens.append(t)
        st = _stem(t)
        if st != t:
            tokens.append(st)

    for raw in _SPLIT.split(text):
        if not raw:
            continue
        low = raw.lower()
        emit(low)
        parts = _subtokens(raw)
        if len(parts) > 1:
            for p in parts:
                pl = p.lower()
                if pl != low:
                    emit(pl)
    return tokens
