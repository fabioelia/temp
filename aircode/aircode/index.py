"""Walk a repository, split files into overlapping chunks, and persist an index.

The index is a plain JSON file (`.aircode/index.json`) containing the chunk
text + metadata. Retrieval (see retrieve.py) builds BM25 statistics over these
chunks at query time — cheap enough for tens of thousands of chunks and needs
no embedding model resident, which keeps the "hot set" tiny (the report's
byte-movement north star).
"""

from __future__ import annotations

import json
import os
from dataclasses import asdict, dataclass
from pathlib import Path

# Extensions we treat as source we can help with. Everything else is skipped.
CODE_EXTS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".go", ".rs", ".java", ".kt", ".swift",
    ".c", ".h", ".cc", ".cpp", ".hpp", ".cs", ".rb", ".php", ".scala", ".m",
    ".sh", ".bash", ".zsh", ".sql", ".html", ".css", ".scss", ".vue", ".svelte",
    ".md", ".rst", ".toml", ".yaml", ".yml", ".json", ".cfg", ".ini",
}

# Directories that are never worth indexing.
SKIP_DIRS = {
    ".git", ".aircode", "node_modules", ".venv", "venv", "__pycache__", ".mypy_cache",
    ".pytest_cache", "dist", "build", "target", ".next", ".idea", ".vscode",
    "vendor", ".gradle", "Pods", ".terraform",
}

MAX_FILE_BYTES = 1_000_000  # skip anything larger than ~1 MB (generated/minified)


@dataclass
class Chunk:
    path: str          # repo-relative path
    start_line: int    # 1-indexed inclusive
    end_line: int      # 1-indexed inclusive
    text: str


def _looks_binary(sample: bytes) -> bool:
    return b"\x00" in sample


def iter_source_files(root: Path):
    """Yield indexable source files under root, honoring SKIP_DIRS / extensions."""
    for dirpath, dirnames, filenames in os.walk(root):
        # prune skip dirs in-place so os.walk doesn't descend into them
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith(".") or d in {".github"}]
        for name in filenames:
            p = Path(dirpath) / name
            if p.suffix.lower() not in CODE_EXTS:
                continue
            try:
                if p.stat().st_size > MAX_FILE_BYTES:
                    continue
                with open(p, "rb") as fh:
                    if _looks_binary(fh.read(1024)):
                        continue
            except OSError:
                continue
            yield p


def chunk_file(path: Path, rel: str, window: int = 60, overlap: int = 15) -> list[Chunk]:
    """Split a file into overlapping line windows.

    Overlap keeps a function that straddles a boundary retrievable from either
    side. Windowing by lines (rather than parsing every language) is simple,
    robust, and language-agnostic.
    """
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return []
    if not lines:
        return []
    step = max(1, window - overlap)
    chunks: list[Chunk] = []
    i = 0
    n = len(lines)
    while i < n:
        block = lines[i : i + window]
        text = "\n".join(block).strip()
        if text:
            chunks.append(Chunk(rel, i + 1, min(i + window, n), text))
        if i + window >= n:
            break
        i += step
    return chunks


def build_index(root: str | Path, window: int = 60, overlap: int = 15) -> list[Chunk]:
    root = Path(root).resolve()
    chunks: list[Chunk] = []
    for f in iter_source_files(root):
        rel = str(f.resolve().relative_to(root))
        chunks.extend(chunk_file(f, rel, window=window, overlap=overlap))
    return chunks


def index_dir(root: str | Path) -> Path:
    return Path(root).resolve() / ".aircode"


def save_index(root: str | Path, chunks: list[Chunk]) -> Path:
    d = index_dir(root)
    d.mkdir(exist_ok=True)
    out = d / "index.json"
    payload = {"version": 1, "chunks": [asdict(c) for c in chunks]}
    out.write_text(json.dumps(payload), encoding="utf-8")
    return out


def load_index(root: str | Path) -> list[Chunk]:
    out = index_dir(root) / "index.json"
    if not out.exists():
        raise FileNotFoundError(
            f"No index at {out}. Run `aircode index` in your project first."
        )
    payload = json.loads(out.read_text(encoding="utf-8"))
    return [Chunk(**c) for c in payload["chunks"]]
