# Knowledge boundaries: where this skill is thin, and what to do about it

A lookup table, not an essay. Run §A before any contested claim leaves your
mouth; scan §B when a question matches a trigger; read the one row of §C
you need. §D is the gaps retrieval cannot close. §E is how to maintain it.

**Triggers here are structural, never felt.** Do not wait to feel
uncertain. Hedging language is mimicked from pretraining, not computed:
high-certainty expressions ("it is well established") correlate with a ~7%
*decrease* in accuracy, and accuracy varies >80% across certainty markers
(Zhou, Jurafsky & Hashimoto, EMNLP 2023, 2023.emnlp-main.335). Asking
yourself how confident you are underperforms a cheap recalibration
baseline (arXiv 2409.03225). So every trigger below is a property of the
*question, the field, or the sentence you are about to write* — a negation,
a number, a threshold, a bare gene token, a date word.

The one self-check with good evidence is **semantic entropy**: answer the
question 3-5 times, cluster the answers by *meaning*, and if the clusters
disagree, stop and retrieve (Farquhar et al., *Nature* 2024;630:625-630).
Use that; do not use your own confidence report.

---

## A. Assertion gate

Applies to any claim that **contradicts someone**, **carries a number**,
**asserts a negative** ("X is not a marker", "no trial has"), or **reverses
a position you already took**. Each gate has a measured warrant. A claim
failing any gate becomes a question or carries `[unverified]`.

| # | Gate | Warrant |
|---|---|---|
| **A1 Sufficiency, not relevance** | The retrieved passage must contain *the specific entity or quantity asked about*. Topical relevance is not sufficiency. If the passage is about the right gene but not the right comparison, you have nothing — widen or abstain. | Joren et al., *Sufficient Context*, arXiv 2411.06037 (ICLR 2025): models answer instead of abstaining when context is relevant but insufficient. HPA was relevant to CSF3R and insufficient. |
| **A2 Restate the threshold and the field** | If any step involved a cutoff (enrichment, FDR, p<5e-8, phase, "significant"), the output names the threshold *and* the table/field it came from, so a reader can check it. | BiomedSQL, arXiv 2505.20321 (COLM 2026): best agent 62.6% vs expert 90.0%; the commonest errors are wrong table selection and improper application of statistical thresholds. |
| **A3 Zero rows ≠ zero effect** | An empty result reads "not recorded in \<source\> as of \<date\>", never "no association exists". Write it that way. | Heuristic — no published rate for this confusion (see §D). Mechanically identical to A2's threshold error. |
| **A4 Identifiers come from an API, never recall** | Every gene symbol↔ID↔alias, locus, rsID or ontology term is resolved by a call. Confidence is not a competence signal for this task. | GeneTuring (PMID 36993670, bioRxiv preprint): plain GPT-4o errs in ~99% of gene-name-conversion cases, ~99% accurate *with* API access, and incapacity awareness is low — the model does not know it cannot do it. |
| **A5 Numbers carry their quote** | Every effect size, CI, n or p is quoted with the sentence or table cell it came from. No quote ⇒ `[unverified]`. Do not try a different model instead. | Jansen et al., *Psychol Bull* 2025 (10.1037/bul0000501), 312,329 data points: unacceptable accuracy on 20% of variables; variance largest *between variables*, smallest between models — so only re-reading the source fixes it. |
| **A6 Citations: check the numbers, not just existence** | A resolving DOI is not a verified citation. Verify the numeric fields. Treat a bare URL as *raising* suspicion, and ignore formatting polish entirely. | Walters & Wilder, *Sci Rep* 2023 (10.1038/s41598-023-41032-5): GPT-4 18% fabricated; among *real* citations 24% carry a substantive error, concentrated in numeric fields (dates 16%, vol/issue/page 13%; author/title/journal each <7%). Formatting quality does not discriminate fabricated from real, and fabricated citations carried hyperlinks *more* often (18% vs 6%). |
| **A7 Surface conflicts; never silently adopt** | When a retrieved document disagrees with what you believe, state both and adjudicate explicitly. Low internal confidence plus a disagreeing document is the peak-error configuration, not a licence to defer. | ClashEval, arXiv 2404.10198 (incl. drug dosages): models override their own correct prior >60% of the time, and adoption of the wrong external number *rises* as their own confidence falls. |
| **A8 Reversal needs a post-pushback source** | Changing a factual position after the user pushes back requires naming a source retrieved **after** the pushback. Verify unsourced premises embedded in a question ("given that X…") *before* answering what is built on them. | SycEval, arXiv 2502.08177: 58.19% sycophancy, regressive right→wrong 14.66%; an embedded unsourced premise induces more sycophancy than an explicit challenge (61.75% vs 56.52%). |
| **A9 At least one disconfirming query** | The search plan contains a query phrased to *break* the claim — "no association", "failed to replicate", "negative trial", "did not differ". Zero disconfirming queries ⇒ the search is incomplete by definition. | *Failing to Falsify*, arXiv 2604.02485 (ICLR 2026): prompting for counterexamples raised rule discovery 42%→56%. |
| **A10 Full-text, aliased search for any negative** | A claim of absence names its exact queries, at least one of them full-text rather than title/abstract, with an alias set. | Verified here 2026-10-18: `TITLE_ABS:(CSF3R) AND TITLE_ABS:(monocyte)` returns 16 hits and **does not** include the decisive paper (PMID 20067595). A wrong-shaped search returns a false negative that *confirms* the error. |

**A8 and the original failure are the same gate.** Contradicting without
evidence and capitulating without evidence are one error with two signs.
Both are answered by: retrieve first, then hold or revise on what you found.

Cheapest honest exit when a gate fails: **"What source are you working
from? Before I disagree I want to read it."**

---

## B. Trigger table

| Observable trigger (what is said, asked, or about to be written) | Thin area | First move | Delegate | Cap |
|---|---|---|---|---|
| "is X a marker of", "X is/isn't specific to", "canonical marker", "which cell expresses X"; **any subtype-level** claim (classical vs non-classical, cDC1 vs cDC2, Tcm vs Tem, AT1 vs AT2) | §C1 markers | `biodata.py blood-cells X` — the full table, not the `specific` field | `copd-marker-resolver` | 250 w |
| A token ≤5 uppercase chars used in a literature query or treated as a gene | §C1 aliases | `rest.genenames.org` / mygene before the query | inline | — |
| You are about to write an effect size, CI, n, p, HR/OR, % or "approximately" that you did not fetch this session | §C2 quantities | CT.gov v2 `resultsSection`, then `pubmed-fetch` | `copd-verifier` | 300 w |
| A citation is about to be emitted, or one was handed to you | §C2 citations | `pubmed-fetch` + Crossref `update-to` | `copd-verifier` | 300 w |
| "latest", "current", "now approved", "still in phase 3", "as of", "has anyone yet", "state of the art" | §C3 staleness | `epmc-search --sort date`; `trials --updated-since` | `copd-scout` | 1200 w |
| "does GSVA/deconvolution/coloc/MR/LDSC/CIBERSORT behave…", "is it valid to", or you are reasoning from first principles about a named method | §C4 methods | Find the benchmark that tried to break it | `copd-methods-check` | 300 w |
| "specify the coloc/MR/LDSC/fine-mapping analysis"; priors, windows, instruments, LD reference, which sumstats | §C5 stat-gen | Read the tool's docs, not your memory | `copd-methods-check` | 300 w |
| The question leaves COPD: IPF, bronchiectasis, lung cancer immunology, aging, cardiometabolic | §C6 adjacent | Treat as a frontier sweep in a field whose graveyard you do not know | `copd-researcher` (analog lane) | 1500 w |
| "has this been tried and failed", "why discontinued", "unpublished", "was there a negative trial" | §C7 negatives | Registry first, literature second | `copd-scout` | 1200 w |
| "what do clinicians actually do", dosing habits, referral, coding, local pathway | §C8 practice | **Do not retrieve a verdict.** State guidelines; declare the boundary | none | — |
| The user pushed back and you are inclined to fold | §A8 | Retrieve *now*; then hold or revise on what came back | `copd-verifier` | 300 w |

Dispatch rule: one trigger, one agent, one message; several triggers →
launch them in a single message, in parallel, and compose only the returned
schemas. These agents exist to keep searching out of your context. If you
find yourself reading their raw evidence, you have defeated them.

---

## C. The thin areas in detail

### C1. Cell-type marker attribution — the recorded failure

**Why thin, with the measured shape.** Marker knowledge is held as a flat
consensus list ("CSF3R = neutrophil") without the primary-paper granularity
that says *which comparison, which panel, which modality*. Hou & Ji,
*Nat Methods* 2024 (PMID 38528186) measured the degradation: >75%
full-or-partial agreement with manual annotation, but only ~85% *identical*
labels on repeated identical queries, κ≈0.65 across GPT-4 versions, and
worst performance **on subtypes rather than major lineages**. CSF3R was a
subtype question — classical vs non-classical monocyte.

Two rules follow directly: **a subtype-level marker claim always escalates
to a reference**, and **if the same marker query run twice gives different
answers, stop** — ~15% disagreement is the measured base rate, so one run
is not a result (this is §A's semantic-entropy check, applied).

**The failure was not a literature gap.** It was a field-choice gap, and
the correction lives in the *same* database that produced the error:

| HPA field | CSF3R content | What it means |
|---|---|---|
| `RNA blood cell specific nTPM` (gene JSON) | `{"neutrophil": 1924.2}` | Only cells above HPA's enrichment cutoff. Monocytes absent ⇒ *not enriched*. |
| per-gene XML `immuneCell` blocks (19 cell types) | Neutrophil 1924.2 · **Classical mono 279.2** · Myeloid DC 97.4 · **Intermediate 56.7** · **Non-classical 24.2** | The actual value table. Classical > non-classical **11.5x**. |

Retrieved 2026-10-18 via `biodata.py blood-cells CSF3R`. Both numbers are
HPA's; the first is a filtered view of the second. This is gates A1+A2 in
one object: relevant but insufficient, and a threshold silently applied.

**Alias collisions are real and verified.** `COPD` resolves to HGNC:649 =
**ARCN1**, whose `prev_symbol` is literally `COPD` (checked against the
HGNC REST API, 2026-10-18). Any ≤5-character uppercase token must be
resolved to an HGNC/Ensembl ID before it enters a literature query or the
counts are polluted. `data-sources.md` records the same trap in text-mined
annotations.

**Third trap: three questions, three answers, one gene.**

| Question | Right resource | Wrong resource |
|---|---|---|
| Is X a *discriminating marker* between subsets A and B? | Primary sorted-subset comparisons in a panel containing both | Any whole-blood atlas |
| How much X mRNA is in sorted population A? | HPA/Monaco/Schmiedel bulk nTPM; DICE | A PBMC scRNA atlas (no granulocytes by construction) |
| Whose mRNA is X in this *bulk tissue*? | Deconvolution with a panel containing the candidate cells | A marker-specificity paper |

A paper answering one is silent on the others. No published error rate
exists for this confusion — it is our exact failure class and it is
unmeasured (§D), so the rule is heuristic: name which question you are
answering.

**Resources.** HPA per-gene XML (19 immune cell types) · Monaco *Cell Rep*
2019 / Schmiedel *Cell* 2018 (DICE, dice-database.org — browse only, no
JSON API as of 2026-10-18) · CELLxGENE Census pseudobulk per `cell_type` ·
HLCA for lung · the primary subset-comparison papers.

**Cheapest decisive query.**
```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/biodata.py blood-cells CSF3R
python3 ${CLAUDE_SKILL_DIR}/scripts/biodata.py fulltext-grep 20067595 CSF3R   # their source, before contradicting
```

**Return schema** — `copd-marker-resolver`, ≤250 words. Full schema in that
agent's definition.

### C2. Exact quantities, and citation integrity

**Why thin.** Directions of effect are recalled reliably; magnitudes, CIs,
n and p drift toward round and often-quoted values, worst on particular
variables rather than particular models (Jansen 2025 — §A5). Separately,
~24% of *real* citations an LLM emits carry a substantive error concentrated
in numeric fields (Walters & Wilder 2023 — §A6). So the gate is **not "is
the paper real" but "are its numbers right"**.

**Retraction status is never recalled.** Chatbots find <50% of retractions
and mislabel ~18% of valid papers as retracted. Use Crossref: the per-DOI
check is whether `update-to` is present in the message; the corpus-level
filter `update-type:retraction` returns **76,296** records (verified
2026-10-18). Fabrication base rate in the literature is now ~1 in 277
PubMed-indexed papers in early 2026, up from ~1 in 2,828 in 2023 (Topaz et
al., *Lancet* letter 2026; AI-assisted classifier, so method-dependent).
**Detection rule: a title absent from all four of PubMed, Crossref,
OpenAlex and Google Scholar ⇒ fabricated. One database missing it is not
enough.**

**Cheapest decisive query for an effect size.** ClinicalTrials.gov v2
returns primary-outcome values with 95% CIs and no paywall — verified
2026-10-18 on NCT02164513 (IMPACT): annual moderate/severe exacerbation
rate 0.91 (0.87-0.95) vs 1.07 (1.02-1.12) vs 1.21 (1.14-1.29).
```bash
curl -s "https://clinicaltrials.gov/api/v2/studies/NCT02164513?fields=resultsSection.outcomeMeasuresModule"
```
Then `pubmed-fetch` for abstract numbers, Europe PMC OA full text for
tables, FDA advisory briefing documents / EMA EPARs for regulator-recomputed
effects. Always report effect **with CI, absolute difference, n, and vs
MCID** (FEV1 ~100 mL, SGRQ 4, CAT 2, 6MWD ~26-30 m).

### C3. Proximity to training cutoff

**Why thin.** The boundary is not felt, and the *declared* cutoff is not
the *effective* one — gaps of months to years (LLMLagBench, arXiv
2511.12116). Never reason from your own stated cutoff. Staleness is also
uneven: trial status, approvals and pipeline moves go stale in months;
biology and genetics in years. `copd-landscape.md` is a dated snapshot and
says so.

**Retrieval is not a cure.** One source (TempoMed-Bench, identifier
unverified) reports that adding agentic search did **not** resolve guideline
staleness. Design for *"the document I retrieved says X, version V, dated
D"* — not for *"we searched, therefore we are current"*.

**Trigger is lexical:** "latest / current / now / still / as of / has anyone
yet", a present-tense regulatory or trial-status verb, or a superlative
about the field.

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/biodata.py epmc-search '<topic> AND "chronic obstructive"' --sort date --n 10
python3 ${CLAUDE_SKILL_DIR}/scripts/biodata.py trials --cond COPD --updated-since 2026-07-01
```
State the newest retrieved record's own date and version in the answer.

### C4. Methods behaviour and failure modes

**Why thin.** Methods are held as *descriptions*, so a first-principles
inference about behaviour under violated assumptions feels sound and is
unverified. This has already happened in this project (a GSVA inference
presented without checking the literature).

**Anchor, verified 2026-10-18.** Noureen et al., *eLife* 2022;11:e71994
(PMC8916770): per-cell gene-detection differences bias ssGSEA and GSVA in
single-cell data while sparing single-cell-native scorers (AUCell,
JASMINE). Tested on cancer scRNA-seq, so transfer to bulk COPD lung is an
assumption, not a result. **Still open and unverified: GSVA behaviour on
*correlated* gene sets specifically.** Do not state a direction for it.

**Search adversarially** (this is gate A9 applied to methods):
`"<method>" AND (bias OR pitfall OR benchmark OR fails OR misleading)`.
Prefer simulation studies and independent benchmarks over reviews and over
the authors' own paper. Then read the vignette's assumptions section.

### C5. Statistical-genetics mechanics

**Why thin.** Prose fluency about coloc/MR/LDSC/fine-mapping outruns the
ability to *specify* one: `p12` priors, window size, LD reference and
ancestry match, instrument selection and clumping, sample overlap, genome
build. These are exactly what a reviewer checks and what is most often
wrong — and by A4 none of the identifiers in them may come from memory.

**Rule.** Never hand over a specification from memory. Name tool and
version; state every parameter with its source and its default. coloc
(Giambartolomei 2014; Wallace 2021 on `p12` sensitivity) · TwoSampleMR /
MR-Base + STROBE-MR · LDSC README (ancestry-matched LD scores, intercept
handling) · SuSiE/FINEMAP (L, window) · eQTL Catalogue credible sets.
Builds are mixed — see `data-sources.md`. `appraisal-and-rigor.md`
§B17-B19 is the *appraisal* checklist; this row is about *authoring*.

### C6. Adjacent fields

IPF, bronchiectasis, lung cancer immunology, aging biology and
cardiometabolic disease each have their own graveyard, contested results
and MCIDs, none loaded here. The specific risk is importing a COPD prior
where it is wrong — e.g. assuming an anti-fibrotic target behaves in
emphysema as in IPF, where genetics point in *opposite* directions at
shared loci. Say which field you have entered and that your prior there is
weaker; route to `copd-researcher` with an analog-disease lane; require the
graveyard check in *that* field before any target claim.

### C7. Negative and unpublished results

Training weights published, cited work; silent discontinuations and
completed-but-unpublished trials are the evidence most likely to kill an
idea and least likely to be recalled. **Registry first, literature
second**: ClinicalTrials.gov terminated/withdrawn/completed-without-results,
EU CTIS, company pipeline-page diffs, FDA advisory briefing documents,
conference abstracts with no follow-up paper. Absence of a paper is weak
evidence of absence of a trial (gate A3).
```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/biodata.py trials --cond COPD --intr <drug>   # read OverallStatus, HasResults
```

### C8. Clinical practice texture

What clinicians actually do — local pathways, real dosing habits, referral,
coding — is tacit, geographically variable and barely in the literature.
**Do not retrieve a verdict here.** State what GOLD/ATS/ERS say, state that
real-world practice varies and that you cannot characterise it, and stop.
With non-negotiable 7 (no patient-level advice), this is a boundary to
declare, not a gap to fill.

---

## D. What no cheap query fixes, and what is unmeasured

| Gap | Why | What to do instead |
|---|---|---|
| Unpublished negative data | Not indexed anywhere | Registry delta (§C7) + say the base is publication-biased |
| Practice texture | Tacit, variable | Declare the boundary (§C8) |
| Your own calibration | Confidence does not track correctness; hedges are mimicked | Apply §A mechanically; use semantic entropy, not introspection |
| Guideline staleness | Retrieval alone did not fix it (TempoMed-Bench, unverified) | Report the retrieved document's version and date |
| Whether a *novel* mechanistic inference is right | No source exists yet | Label `Speculative`; give the kill criterion |

**Evidence gaps — these rules are heuristic, not measured.** Labelled so
nobody later cites them as established: (a) no published rate for
marker-specificity vs signal-attribution confusion — our exact failure
class is unmeasured; (b) no rate for an LLM judge overturning a *correct*
human answer; (c) no measured rate for absence-of-record vs
absence-of-effect confusion (gate A3 is encoded anyway because the cost is
asymmetric).

## E. Maintaining this file

When a gap is found the hard way, add the row the same day: the observable
trigger in the asker's own words, the resource, the one command that
settles it, the word cap. Mark each new rule **measured** (with the
citation) or **heuristic** — the distinction is the point of §D. When a
command here stops working, fix it in `scripts/biodata.py` and
`data-sources.md` and date it. A trigger that has never fired is probably
worded as a feeling rather than a signal; rewrite it as a phrase someone
would actually type.
