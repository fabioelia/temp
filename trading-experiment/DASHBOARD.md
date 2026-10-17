# Dashboard refresh (part of every daily run)

Live dashboard (private; share it from the page's Share menu): https://claude.ai/artifact/AnTpL4hR5ii5BgLWzKr26v

It is a "Dashboard" artifact type. Its page (`files/index.html`) already exists and reads five attached data files. **Do not republish the page or any
of the type's own files.** Each day only the five data files change.

| Dataset id | File produced by `tracker.py` |
|---|---|
| `summary` | `trading-experiment/data/export/summary.json` |
| `equity` | `trading-experiment/data/export/equity.json` |
| `positions` | `trading-experiment/data/export/positions.json` |
| `orders` | `trading-experiment/data/export/orders.json` |
| `trades` | `trading-experiment/data/export/trades.json` |

`tracker.py day ...` and `tracker.py report` rewrite those files. Then:

1. **Upload all five** in one message, as five parallel `Artifact` calls, each with `url` = the dashboard URL above, `asset: true`, and `file_path` = the absolute path
   of one export file. Each result gives a new `/_blob/<id>`; keep the url exactly as returned.
2. **Read the dataset documents** to get their current versions and old file ids:
   `ArtifactData` action `list`, collection `datasets`.
3. **Point each dataset at its new file** with one `ArtifactData` `batch` of five `update` writes (collection `datasets`, doc_id = the dataset id, `if_version` = the version
   you just read):
   `{"source": {"kind": "file", "url": "<new /_blob/ url>", "name": "<file>.json", "format": "json"}, "updated": {"at": "<ISO UTC now>", "by": "Trading routine"}}`
4. **Delete the five superseded files** (the 32-hex id after `/_blob/` in each old url) with the `Artifact` tool, `action: "delete"`, `url` = the dashboard, `path` = that id.
   Only after step 3 succeeded, so nothing is left pointing at a deleted file.
5. Optionally read `data/users/me` docs `check` and `runs` (via `ArtifactData` `get`). If `check` reports a thrown error from the page, fix only what the code confirms.

The only thing the daily run may change on the dashboard is those five files and their dataset documents. If an upload fails, skip the dashboard for the day, say so in the
journal, and carry on: the repo (`STATUS.md`, `data/`) is the source of truth.
