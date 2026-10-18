# Knowledge boundaries: where this skill is thin, and what to do about it

A lookup table, not an essay. Consult §A before any contested claim leaves
your mouth; scan §B when a question matches a trigger; read the one row in
§C you need. §D lists the gaps that retrieval cannot close.

**Why the triggers are structural, not felt.** Do not wait to feel
uncertain. Calibration studies find LLMs show minimal confidence difference
between their right and wrong answers (Omar et al., *medRxiv*
2025;e66917 — JMIR Med Inform; a 9-model/13-dataset biomedical calibration
study reports even the best models ~30% off target, biorxiv
10.1101/2025.02.11.637373 [secondary, abstract only]). Self-assessment is
therefore not an instrument. Every trigger below is a property of the
*question or the sentence you are about to write* — a negation, a number, a
cell-type attribution, a date word — detectable without introspection.

---

## A. Assertion gate

Apply to any claim that **contradicts someone**, **carries a number**, or
**asserts a negative** ("X is not a marker", "no trial has", "there is no
evidence"). All four must be true before it leaves your mouth. Otherwise
downgrade to a question or label `[unverified]`.

| # | Gate | Fails when |
|---|---|---|
| A1 | **Their source is in hand.** You asked what source they used, retrieved it, and read the passage that bears on the claim (`biodata.py fulltext-grep <id> <term>`). | You searched for *your* support instead of reading *theirs*. |
| A2 | **Field semantics checked.** For every database field in the chain you can state what the field measures, its threshold/filter, and what an absence means. | "Missing from the list" was read as "does not exist". |
| A3 | **Two independent sources agree**, or you say the question is unsettled. One field or one paper is a data point, never an adjudication. | Single HPA field; single GTEx call; single review. |
| A4 | **Negatives are search-shaped.** A claim of absence names the exact queries run, including a full-text (not title/abstract-only) query and at least one alias set. | `TITLE_ABS:` only. Verified: `TITLE_ABS:(CSF3R) AND TITLE_ABS:(monocyte)` returns 16 hits and **does not** contain the decisive paper (PMID 20067595). A wrong-shaped search returns a false negative that *confirms* the error. |

Cheapest honest exit when a gate fails: **"What source are you working
from? Before I disagree I want to read it."** That is not weakness; it is
the step whose absence caused this skill's worst recorded failure.

---

## B. Trigger table

| Observable trigger (phrase / question shape / situation) | Thin area | First move | Delegate to | Cap |
|---|---|---|---|---|
| "is X a marker of", "X is/isn't specific to", "canonical marker", "which cell expresses X", "X is a neutrophil gene", any claim attributing a gene to a cell type or subset | §C1 Cell-type markers | `biodata.py blood-cells X` (full table, not the `specific` field) | `copd-marker-resolver` | 250 w |
| A sentence you are writing contains an effect size, CI, n, p, HR/OR, %, or "approximately" — and you did not fetch it this session | §C2 Exact quantities | `biodata.py trials --cond ...` → CT.gov results, or `pubmed-fetch` | `copd-verifier` | 300 w |
| "latest", "current", "now approved", "still in phase 3", "as of", "has anyone", "state of the art", or any landscape claim with a date | §C3 Staleness | `epmc-search --sort date`, `trials --updated-since` | `copd-scout` (exists) | 1200 w |
| "does GSVA/deconvolution/coloc/MR/LDSC/CIBERSORT behave…", "is it valid to", "should I regress out", a method's failure mode, or you are about to reason from first principles about a named method | §C4 Methods behaviour | Find the method's own paper + benchmark papers that tried to break it | `copd-methods-check` | 300 w |
| "specify the coloc/MR/LDSC/finemapping analysis", priors, window sizes, instrument selection, which sumstats, overlapping samples | §C5 Stat-gen mechanics | Read the tool's documentation, not your memory of the method | `copd-methods-check` | 300 w |
| The question leaves COPD: IPF, bronchiectasis, lung cancer immunology, aging/senescence, cardiometabolic, asthma-only | §C6 Adjacent fields | Treat as a frontier sweep in a field whose graveyard you do not know | `copd-researcher` (analog lane) | 1500 w |
| "has this been tried and failed", "why was it discontinued", "unpublished", "was there a negative trial" | §C7 Negative results | Registry-first, not literature-first | `copd-scout` | 1200 w |
| "what do clinicians actually do", "is this used in practice", dosing, pathway, coding, workflow | §C8 Clinical texture | **Do not retrieve a verdict.** Say what guidelines state, label practice variation as outside scope | none | — |

Dispatch rule: one trigger, one agent, one message. Two or more triggers in
the same question → launch them in a single message, in parallel, and
compose only the returned schemas. The point of these agents is that their
searching stays out of your context; if you find yourself reading their raw
evidence, you have defeated them.

---

## C. The thin areas in detail

### C1. Cell-type marker attribution — the recorded failure

**Why thin.** Marker knowledge is held as a flat consensus list ("CSF3R =
neutrophil", "CD14 = classical monocyte") without the primary-paper
granularity that says *which comparison, which panel, which modality*. The
same hole applies to T-cell/ILC subsets, macrophage polarisation states, DC
subsets (cDC1/cDC2/pDC/AS-DC) and lung epithelial states.

**The failure was not a literature gap.** It was a field-choice gap, and
the correction lives in the *same* database that produced the error:

| HPA field | CSF3R content | What it means |
|---|---|---|
| `RNA blood cell specific nTPM` (gene JSON) | `{"neutrophil": 1924.2}` | Only cells above HPA's enrichment cutoff. Monocytes absent ⇒ *not enriched*. |
| per-gene XML `immuneCell` blocks (19 cell types) | Neutrophil 1924.2 · **Classical mono 279.2** · Myeloid DC 97.4 · **Intermediate 56.7** · **Non-classical 24.2** | The actual value table. Classical > non-classical **11.5x**. |

Retrieved 2026-10-18 via `biodata.py blood-cells CSF3R`. Both numbers are
HPA's; the first is a filtered view of the second.

**Second, structural trap.** Three different questions, three different
answers, one gene:

| Question | Right resource | Wrong resource |
|---|---|---|
| Is X a *discriminating marker* between subsets A and B? | Primary sorted-subset comparisons; the panel the question implies | Any whole-blood atlas |
| How much X mRNA is in sorted population A? | HPA/Monaco/Schmiedel bulk nTPM; DICE | A PBMC scRNA atlas (granulocytes absent by design) |
| Whose mRNA is X in this *bulk tissue*? | Deconvolution with a panel that contains the candidate cells | A marker-specificity paper |

A paper answering one is silent on the others. Markers derived against a
PBMC atlas cannot speak to granulocytes, because PBMC preparation removes
them.

**Resources.** HPA per-gene XML (all 19 immune cell types) ·
Monaco *Cell Rep* 2019 / Schmiedel *Cell* 2018 (DICE, dice-database.org —
browse only, no JSON API as of 2026-10-18) · CELLxGENE Census pseudobulk
per `cell_type` · HLCA for lung · the primary subset-comparison papers.

**Cheapest decisive query** (one command, settles the CSF3R class of
question):
```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/biodata.py blood-cells CSF3R
```
Then, if contradicting someone, their paper:
```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/biodata.py fulltext-grep 20067595 CSF3R
```

**Return schema** (`copd-marker-resolver`, ≤250 words):
```json
{"gene": "...", "question_type": "discriminating-marker|abundance-in-sorted|bulk-attribution",
 "values": [{"cell_type": "...", "metric": "nTPM|logFC|MFI", "value": 0, "source": "...", "retrieved": "..."}],
 "primary_papers": [{"id": "PMID", "comparison": "...", "modality": "mRNA|protein", "direction": "...", "quote": "..."}],
 "field_semantics": "what the fields used actually measure and what absence means",
 "verdict": "supported|contradicted|question-is-ill-posed|unsettled",
 "caveats": ["..."]}
```

### C2. Exact quantities

**Why thin.** Directions of effect are recalled reliably; magnitudes,
CIs, n and p-values are not, and drift silently toward round or
often-quoted numbers. Treat any remembered number as a placeholder.

**Resources, cheapest first.** ClinicalTrials.gov v2
`resultsSection.outcomeMeasuresModule` returns primary-outcome values with
95% CIs and no paywall — verified 2026-10-18 on NCT02164513 (IMPACT):
annual moderate/severe exacerbation rate 0.91 (0.87-0.95) vs 1.07
(1.02-1.12) vs 1.21 (1.14-1.29). Then `pubmed-fetch` for abstract numbers,
Europe PMC OA full text for tables, FDA/EMA review documents for
regulator-recomputed numbers.

**Cheapest decisive query.**
```bash
curl -s "https://clinicaltrials.gov/api/v2/studies/NCT02164513?fields=resultsSection.outcomeMeasuresModule"
```

**Return schema** (`copd-verifier`, ≤300 words):
```json
{"claims": [{"claim_as_stated": "...", "status": "confirmed|corrected|unverifiable|fabricated",
  "retrieved_value": "effect (95% CI), absolute diff, n", "vs_mcid": "...",
  "source": {"id": "...", "field": "...", "retrieved": "..."}}],
 "citation_audit": [{"id": "...", "exists": true, "supports_claim": "yes|partial|no"}],
 "net": "one line: what changes in the answer"}
```

### C3. Proximity to training cutoff

**Why thin.** The boundary is not felt (§ header). It is also uneven:
trial *status*, approvals and pipeline moves go stale in months; biology
and genetics in years. `copd-landscape.md` is a dated snapshot and says so.

**Trigger is lexical.** The words "latest / current / now / still / as of /
has anyone / state of the art", a present-tense regulatory or trial-status
verb, or a superlative about the field.

**Cheapest decisive query.** Date-sorted Europe PMC plus a registry delta:
```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/biodata.py epmc-search '<topic> AND "chronic obstructive"' --sort date --n 10
python3 ${CLAUDE_SKILL_DIR}/scripts/biodata.py trials --cond COPD --updated-since 2026-07-01
```
If the newest hit predates your snapshot, the snapshot is probably still
current — say so with the date. If it postdates it, the snapshot is stale
and you have the correction.

### C4. Methods behaviour and failure modes

**Why thin.** Methods are held as *descriptions*, so first-principles
reasoning about how one behaves under violated assumptions feels sound and
is unverified. This has already happened in this project once (a GSVA
inference presented without checking the literature).

**Anchor, verified 2026-10-18.** Noureen et al., *eLife* 2022;11:e71994
(PMC8916770) show per-cell gene-detection differences bias ssGSEA and GSVA
in single-cell data while sparing single-cell-native scorers (AUCell,
JASMINE) — a benchmark on cancer scRNA-seq, so transfer is an assumption,
not a result. **Unverified and still open: GSVA behaviour on *correlated*
gene sets specifically.** Do not state a direction for it.

**Resources.** The method's own paper; the Bioconductor/CRAN vignette (the
assumptions section is usually explicit); benchmark papers whose stated aim
was to break it; the tool's GitHub issues for known failure modes.

**Cheapest decisive query.** Europe PMC for the method name with
adversarial vocabulary — `"<method>" AND (bias OR pitfall OR benchmark OR
"fails" OR misleading)` — then read the one benchmark, not five reviews.

**Return schema** (`copd-methods-check`, ≤300 words):
```json
{"method": "...", "claim_tested": "...",
 "verdict": "established|contested|no-evidence-found|claim-ill-posed",
 "evidence": [{"id": "...", "design": "simulation|benchmark|theory", "finding": "...", "domain_tested": "..."}],
 "transfer_risk": "why the tested domain may not be the asker's domain",
 "assumption_violated": "...", "safer_alternative": "...",
 "what_remains_unverified": "..."}
```

### C5. Statistical-genetics mechanics

**Why thin.** Prose fluency about coloc/MR/LDSC/fine-mapping outruns the
ability to specify one correctly: priors (`p12`), window size, LD reference
and ancestry match, instrument selection and clumping thresholds, sample
overlap, which sumstats build. These are the parameters a reviewer checks
and the ones most often wrong.

**Rule.** Never hand over a specification from memory. Name the tool and
version, read its documentation, and state every parameter with its source
and default. `appraisal-and-rigor.md` §B17-B19 is the appraisal checklist;
this row is about *authoring*.

**Resources.** coloc vignette (Giambartolomei 2014; Wallace 2021 on
sensitivity to `p12`); TwoSampleMR / MR-Base docs and STROBE-MR; LDSC
README (ancestry-matched LD scores; `--no-intercept` semantics);
SuSiE/FINEMAP docs; eQTL Catalogue credible sets. Builds are mixed — see
`data-sources.md`.

Return schema: `copd-methods-check`, same as §C4.

### C6. Adjacent fields

**Why thin.** IPF, bronchiectasis, lung cancer immunology, aging biology
and cardiometabolic disease each have their own graveyard, their own
contested results and their own MCIDs, and none of that is loaded here.
The specific risk is importing a COPD prior into a field where it is wrong
— e.g. assuming an anti-fibrotic target behaves in emphysema as in IPF,
where the genetics point in *opposite* directions at shared loci.

**Rule.** When a question crosses out of COPD, say which field you have
entered and that your prior there is weaker. Route to
`copd-researcher` with an analog-disease lane, and require the graveyard
check in that field before any target claim.

### C7. Negative and unpublished results

**Why thin.** Training weights published, cited work; silent
discontinuations and completed-but-unpublished trials are the evidence most
likely to kill an idea and least likely to be recalled.

**Registry first, literature second.** ClinicalTrials.gov terminated /
withdrawn / completed-without-results, EU CTIS, company pipeline-page
diffs, FDA advisory briefing documents, conference abstracts with no
follow-up paper. Absence of a paper is weak evidence of absence of a trial.

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/biodata.py trials --cond COPD --intr <drug>  # read OverallStatus and HasResults
```

### C8. Clinical practice texture

**Why thin.** What clinicians actually do — local pathways, real dosing
habits, which patients get referred, how coding is done — is tacit,
geographically variable and barely in the literature.

**Do not retrieve a verdict here.** State what GOLD/ATS/ERS say, state
that real-world practice varies and that you cannot characterise it, and
stop. Combined with non-negotiable 7 (no patient-level advice), this is a
boundary to declare, not a gap to fill.

---

## D. What no cheap query fixes

| Gap | Why retrieval does not close it | What to do instead |
|---|---|---|
| Unpublished negative data | Not indexed anywhere | Registry delta (§C7) + say the evidence base is publication-biased |
| Practice texture | Tacit and variable | Declare the boundary (§C8) |
| Your own calibration | Confidence does not track correctness | Apply §A mechanically; do not consult your feeling |
| Whether a *novel* mechanistic inference is right | No source exists yet | Label `Speculative`, give the kill criterion |

## E. Maintaining this file

When a gap is found the hard way, add the row the same day: the observable
trigger in the asker's own words, the resource, the one command that
settles it, and the word cap. When a command here stops working, fix it in
`scripts/biodata.py` and `data-sources.md` and note the date. A trigger
that has never fired is probably worded as a feeling rather than a signal —
rewrite it as a phrase someone would actually type.
