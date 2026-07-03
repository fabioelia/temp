"""Command-line interface for aircode.

    aircode index [PATH]           build/refresh the retrieval index
    aircode ask "question" [PATH]  one-shot grounded answer
    aircode chat [PATH]            interactive REPL
    aircode search "query" [PATH]  show what retrieval would feed the model (no LLM)
    aircode doctor                 check the Ollama connection / models
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import __version__
from .index import build_index, load_index, save_index
from .llm import DEFAULT_HOST, DEFAULT_MODEL, OllamaError, list_models
from .retrieve import BM25


def _load_or_hint(root: str):
    try:
        return load_index(root)
    except FileNotFoundError as e:
        print(str(e), file=sys.stderr)
        sys.exit(2)


def cmd_index(args):
    root = Path(args.path).resolve()
    print(f"Indexing {root} ...", file=sys.stderr)
    chunks = build_index(root, window=args.window, overlap=args.overlap)
    out = save_index(root, chunks)
    files = len({c.path for c in chunks})
    print(f"Indexed {len(chunks)} chunks from {files} files -> {out}", file=sys.stderr)


def cmd_search(args):
    chunks = _load_or_hint(args.path)
    bm25 = BM25(chunks)
    hits = bm25.search(args.query, top_k=args.top_k)
    if not hits:
        print("(no matches)")
        return
    for h in hits:
        c = h.chunk
        print(f"\n# {c.path}:{c.start_line}-{c.end_line}  (score {h.score:.2f})")
        preview = "\n".join(c.text.splitlines()[:12])
        print(preview)


def cmd_ask(args):
    from .assistant import Assistant

    chunks = _load_or_hint(args.path)
    asst = Assistant(chunks, model=args.model, host=args.host, top_k=args.top_k)
    hits, stream = asst.answer_stream(args.question)
    if args.show_sources:
        srcs = ", ".join(f"{h.chunk.path}:{h.chunk.start_line}-{h.chunk.end_line}" for h in hits)
        print(f"\033[2m[context: {srcs or 'none'}]\033[0m", file=sys.stderr)
    try:
        for piece in stream:
            sys.stdout.write(piece)
            sys.stdout.flush()
        print()
    except OllamaError as e:
        print(f"\n{e}", file=sys.stderr)
        sys.exit(1)


def cmd_chat(args):
    from .assistant import Assistant

    chunks = _load_or_hint(args.path)
    asst = Assistant(chunks, model=args.model, host=args.host, top_k=args.top_k)
    print(f"aircode {__version__} — model={args.model}. Ask about your code. Ctrl-D or 'exit' to quit.")
    while True:
        try:
            q = input("\n\033[1m›\033[0m ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if q.lower() in {"exit", "quit"}:
            break
        if not q:
            continue
        hits, stream = asst.answer_stream(q)
        srcs = ", ".join(f"{h.chunk.path}:{h.chunk.start_line}-{h.chunk.end_line}" for h in hits)
        print(f"\033[2m[{srcs or 'no context'}]\033[0m")
        try:
            for piece in stream:
                sys.stdout.write(piece)
                sys.stdout.flush()
            print()
        except OllamaError as e:
            print(f"\n{e}", file=sys.stderr)


def cmd_doctor(args):
    print(f"aircode {__version__}")
    print(f"host:  {args.host}")
    print(f"model: {args.model}")
    try:
        models = list_models(args.host)
    except OllamaError as e:
        print(f"\n[FAIL] {e}")
        sys.exit(1)
    print(f"\n[OK] Ollama reachable. {len(models)} model(s) installed:")
    for m in models:
        mark = "  <- default" if m == args.model else ""
        print(f"  - {m}{mark}")
    if args.model not in models:
        print(f"\n[warn] '{args.model}' not installed. Run: ollama pull {args.model}")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="aircode", description="Offline, codebase-aware coding assistant.")
    p.add_argument("--version", action="version", version=f"aircode {__version__}")
    sub = p.add_subparsers(dest="cmd", required=True)

    def add_common(sp, with_path=True):
        if with_path:
            sp.add_argument("path", nargs="?", default=".", help="project root (default: .)")
        sp.add_argument("--model", default=DEFAULT_MODEL, help=f"Ollama model (default: {DEFAULT_MODEL})")
        sp.add_argument("--host", default=DEFAULT_HOST, help=f"Ollama host (default: {DEFAULT_HOST})")
        sp.add_argument("--top-k", type=int, default=6, help="chunks to retrieve (default: 6)")

    sp = sub.add_parser("index", help="build/refresh the retrieval index")
    sp.add_argument("path", nargs="?", default=".")
    sp.add_argument("--window", type=int, default=60, help="chunk size in lines")
    sp.add_argument("--overlap", type=int, default=15, help="chunk overlap in lines")
    sp.set_defaults(func=cmd_index)

    sp = sub.add_parser("search", help="show retrieval results (no LLM call)")
    sp.add_argument("query")
    add_common(sp)
    sp.set_defaults(func=cmd_search)

    sp = sub.add_parser("ask", help="one-shot grounded answer")
    sp.add_argument("question")
    add_common(sp)
    sp.add_argument("--show-sources", action="store_true", help="print retrieved sources to stderr")
    sp.set_defaults(func=cmd_ask)

    sp = sub.add_parser("chat", help="interactive REPL")
    add_common(sp)
    sp.set_defaults(func=cmd_chat)

    sp = sub.add_parser("doctor", help="check Ollama connection & models")
    add_common(sp, with_path=False)
    sp.set_defaults(func=cmd_doctor)

    return p


def main(argv: list[str] | None = None):
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    main()
