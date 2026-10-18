# COPD discovery ledger

The shared world model for `/copd-discovery` campaigns. **Only the
orchestrator writes here**; subagents return JSON and the orchestrator
validates, deduplicates and appends. Everything is plain text in git, so
the history of every idea is auditable.

| File | Contents |
|---|---|
| `hypotheses.jsonl` | One hypothesis per line, every status (including rejected and killed — the graveyard prevents re-proposing dead ideas) |
| `frontier.md` | Append-only frontier deltas from each run's scout sweep |
| `../runs/<date>-<slug>.md` | Per-run log: lanes, counts, rankings, follow-ups |
| `../analyses/<hypothesis-id>/` | Data-miner scripts, raw outputs, results |

## Hypothesis schema (one JSON object per line)

```json
{
  "id": "H-20261017-001",
  "created": "2026-10-17",
  "updated": "2026-10-17",
  "run": "2026-10-17-il33-paradox",
  "lane": "locus|cell|drug|analog|problem|alien|contrarian|frontier",
  "status": "proposed|rejected|survived|testing|supported|weakened|killed",
  "status_reason": "why it has this status",
  "statement": "One falsifiable sentence: intervention/target, direction, mechanism, cell type, population, outcome.",
  "tuple": {
    "target": "Ensembl or ChEMBL ID + symbol/name",
    "direction": "inhibit|activate|increase|decrease",
    "mechanism_nodes": ["GO/Reactome/gene IDs"],
    "cell_type": "CL ID + name",
    "population": "e.g. former smokers, BEC<150, HHIP risk-allele carriers",
    "outcome": "EFO/MONDO ID + name"
  },
  "mechanism_chain": [
    {"step": "A → B", "evidence_ids": ["PMID:..."]}
  ],
  "evidence": [
    {"id": "PMID:12345678", "type": "human-genetic|human-trial|human-observational|human-tissue|omics|animal|in-vitro|review",
     "finding": "one line", "quote": "supporting sentence", "fetched": "2026-10-17"}
  ],
  "novelty": {
    "pair": "N0|N1|N2|N3|N4",
    "sub_claim": "N0|N1|N2|N3|N4",
    "queries": [{"source": "europepmc", "query": "...", "hits": 0, "date": "2026-10-17"}]
  },
  "competing_explanations": ["..."],
  "graveyard_check": "what happened last time this pathway was hit",
  "kill_criterion": "result that would drop this hypothesis",
  "cheapest_test": "the cheapest decisive analysis or experiment",
  "scores": {"novelty": 0, "plausibility": 0, "convergence": 0, "genetic_support": 0,
             "testability": 0, "impact": 0, "falsifiability": 0, "safety_gate": 0,
             "weighted": 0.0},
  "critic": {"verdict": "fatal|major|minor|pass", "unresolved": ["..."]},
  "analyses": ["research/analyses/H-20261017-001/"],
  "certainty": "Established|Probable|Plausible-but-contested|Speculative",
  "parent_ids": [],
  "notes": ""
}
```

Weighted score = 0.15·(novelty + plausibility + convergence + genetic_support
+ testability) + 0.10·(impact + falsifiability). Safety is a gate, not a
weight.

IDs: `H-<YYYYMMDD>-<NNN>`, unique and never reused. To change a
hypothesis, append a new line with the same `id`, a later `updated` date
and the new state; the latest line for an ID is current.
