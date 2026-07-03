import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from aircode.index import Chunk, build_index, chunk_file, iter_source_files  # noqa: E402
from aircode.retrieve import BM25  # noqa: E402
from aircode.tokenize import tokenize  # noqa: E402


def test_tokenize_expands_identifiers():
    toks = tokenize("getUserById(max_retry_count)")
    for expected in ["getuserbyid", "get", "user", "by", "id", "max_retry_count", "max", "retry", "count"]:
        assert expected in toks, f"missing {expected} in {toks}"


def test_tokenize_lowercases_and_splits():
    assert tokenize("Foo.bar_baz") == ["foo", "bar_baz", "bar", "baz"] or set(
        ["foo", "bar_baz", "bar", "baz"]
    ).issubset(set(tokenize("Foo.bar_baz")))


def test_stemming_bridges_morphology():
    # a natural-language query should reach the code symbol despite the suffix
    assert "tokenize" in tokenize("the tokenizer runs")
    chunks = [
        Chunk("tok.py", 1, 3, "def tokenize(text):\n    return text.split()"),
        Chunk("net.py", 1, 3, "def connect(host):\n    return open(host)"),
    ]
    hits = BM25(chunks).search("what does the tokenizer do", top_k=2)
    assert hits and hits[0].chunk.path == "tok.py"


def test_bm25_ranks_relevant_chunk_first():
    chunks = [
        Chunk("auth.py", 1, 10, "def login(user, password):\n    return check_password(user, password)"),
        Chunk("math.py", 1, 5, "def add(a, b):\n    return a + b"),
        Chunk("db.py", 1, 8, "def connect(url):\n    return Session(url)"),
    ]
    bm25 = BM25(chunks)
    hits = bm25.search("how does password login work", top_k=3)
    assert hits, "expected at least one hit"
    assert hits[0].chunk.path == "auth.py", f"got {hits[0].chunk.path}"


def test_bm25_empty_query_returns_nothing():
    bm25 = BM25([Chunk("a.py", 1, 1, "x = 1")])
    assert bm25.search("", top_k=5) == []


def test_bm25_no_match_returns_nothing():
    bm25 = BM25([Chunk("a.py", 1, 1, "alpha beta gamma")])
    assert bm25.search("zzzzz nonexistent token", top_k=5) == []


def test_dedupe_caps_two_per_file():
    chunks = [Chunk("big.py", i * 10, i * 10 + 9, "retry retry retry error handler retry") for i in range(6)]
    bm25 = BM25(chunks)
    hits = bm25.search("retry error handler", top_k=6)
    assert len(hits) <= 2, f"expected <=2 chunks from one file, got {len(hits)}"


def test_chunk_file_overlap(tmp_path):
    f = tmp_path / "sample.py"
    f.write_text("\n".join(f"line{i}" for i in range(100)), encoding="utf-8")
    chunks = chunk_file(f, "sample.py", window=30, overlap=10)
    assert len(chunks) >= 3
    # consecutive chunks overlap: chunk[1] starts before chunk[0] ends
    assert chunks[1].start_line <= chunks[0].end_line


def test_build_index_skips_dirs(tmp_path):
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "app.py").write_text("def hello():\n    return 'hi'", encoding="utf-8")
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "junk.js").write_text("var x = 1", encoding="utf-8")
    chunks = build_index(tmp_path)
    paths = {c.path for c in chunks}
    assert any("app.py" in p for p in paths)
    assert not any("node_modules" in p for p in paths)


def test_iter_source_files_extension_filter(tmp_path):
    (tmp_path / "a.py").write_text("x=1", encoding="utf-8")
    (tmp_path / "b.png").write_bytes(b"\x89PNG\x00\x00")
    (tmp_path / "c.md").write_text("# doc", encoding="utf-8")
    files = {p.name for p in iter_source_files(tmp_path)}
    assert "a.py" in files and "c.md" in files
    assert "b.png" not in files
