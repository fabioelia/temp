# aircode

**An offline, codebase-aware coding assistant that runs on a MacBook Air.**

`aircode` is the buildable half of the "device-native" argument in
[`../LLM_ON_A_MACBOOK_AIR.md`](../LLM_ON_A_MACBOOK_AIR.md): you can't fit a 744B
frontier model on a laptop, but you *can* make a small local model punch far
above its weight by **externalizing knowledge**. The model does the reasoning;
a cheap on-disk retrieval index holds the memory. A 7B coder that has your
relevant code handed to it beats a much larger model that's guessing.

- **Runs fully offline** on Apple Silicon (or any machine) via [Ollama](https://ollama.com).
- **Zero Python dependencies** — standard library only. Nothing to `pip install`, nothing to break.
- **BM25 retrieval, no embedding model** — keeps the resident "hot set" tiny (the report's byte-movement north star), and lexical search is genuinely strong for code.
- **Grounded answers** — every reply is built from excerpts of *your* code, cited as `path:start-end`.

## Why this design (the one-paragraph version)

Frontier open models (GLM-5.1, DeepSeek V4, Kimi K2.6) are 700B–1.6T-parameter
MoE models needing 180–400 GB even quantized — a 10–25× miss on a 16–32 GB Air.
Most of those parameters are *memorized knowledge*, not reasoning circuitry. The
brain separates a small always-on cortex from vast, sparsely-queried long-term
memory. `aircode` mirrors that: a small resident model + an externalized code
index. That's the single device-native inversion that needs **no model
training** and works today.

## Install

**1. Install Ollama and pull a coder model** (this is the model that runs on your Mac):

```bash
# https://ollama.com/download  (or: brew install ollama)
ollama serve                       # start the local server (if not already running)
ollama pull qwen2.5-coder:7b       # ~4.7 GB at 4-bit — a good default for 16 GB
```

Model picks by Air memory (all 4-bit via Ollama):

| Unified memory | Recommended model | Command |
|---|---|---|
| 8 GB | `qwen2.5-coder:3b` | `ollama pull qwen2.5-coder:3b` |
| 16 GB | `qwen2.5-coder:7b` *(default)* | `ollama pull qwen2.5-coder:7b` |
| 24 GB | `qwen2.5-coder:14b` | `ollama pull qwen2.5-coder:14b` |
| 32 GB | `qwen2.5-coder:32b` (Q4) | `ollama pull qwen2.5-coder:32b` |

**2. Get aircode** (no dependencies, so either works):

```bash
# Option A — just run it, no install:
python3 -m aircode --help

# Option B — install the `aircode` command:
pip install -e .        # from this directory
```

## Use

```bash
cd /path/to/your/project

aircode index                       # build the retrieval index (.aircode/index.json)
aircode ask "where is auth handled and how do I add a role check?"
aircode chat                        # interactive REPL with follow-up memory
aircode search "retry backoff"      # see exactly what would be fed to the model (no LLM call)
aircode doctor                      # verify Ollama + model are ready
```

Point at a bigger model or a remote Ollama:

```bash
aircode ask "explain the scheduler" --model qwen2.5-coder:14b --show-sources
aircode chat --host http://192.168.1.10:11434
```

Re-run `aircode index` after significant code changes (it's fast; indexing is
lexical, not neural).

## Commands

| Command | What it does |
|---|---|
| `aircode index [PATH]` | Walk the repo, chunk source into overlapping windows, save `.aircode/index.json`. |
| `aircode ask "Q" [PATH]` | Retrieve relevant chunks, stream one grounded answer. `--show-sources` prints what was retrieved. |
| `aircode chat [PATH]` | Interactive REPL; keeps a short bounded history for follow-ups. |
| `aircode search "Q" [PATH]` | Show retrieval results only — no model call. Great for debugging relevance. |
| `aircode doctor` | Check the Ollama connection and list installed models. |

Flags (where relevant): `--model`, `--host`, `--top-k`, and for `index`,
`--window` / `--overlap`.

## How it works

```
your repo ──index──▶ overlapping line-window chunks ──▶ .aircode/index.json
                                                            │
your question ──▶ BM25 rank (code-aware tokenizer + stemmer) ──▶ top-k chunks
                                                            │
              system prompt + retrieved chunks + question ──▶ Ollama (local) ──▶ streamed answer
```

- **`tokenize.py`** — splits `getUserById` / `max_retry_count` into whole identifiers *and* sub-tokens, plus a light stemmer so "tokeni**zer**" matches the symbol "tokeni**ze**".
- **`index.py`** — language-agnostic overlapping-window chunking; skips `node_modules`, `.git`, build dirs, binaries, huge files.
- **`retrieve.py`** — BM25 over chunks, with per-file coverage caps so answers draw from several files.
- **`llm.py`** — tiny streaming Ollama client over `urllib` (no `requests`, no SDK).
- **`assistant.py`** — assembles the grounded prompt and streams the reply.

## What this is and isn't

- **Is:** a real, working, offline coding assistant; a concrete demonstration that "small model + externalized knowledge" is the right shape for on-device coding.
- **Isn't:** a magic way to run GLM-5.1 on an Air (you can't), and not a semantic/embedding retriever — retrieval is lexical BM25. That's deliberate (no resident embedding model), and it's strong for code, but a query with no shared vocabulary with the code may miss. Use `aircode search` to check relevance.

## Test

```bash
python3 -m pytest -q        # 14 tests, no network required (LLM path is mocked)
```

## License

MIT.
