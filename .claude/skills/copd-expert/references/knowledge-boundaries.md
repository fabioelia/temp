# Knowledge boundaries: where this skill is thin, and what to do about it

A lookup table, not an essay. Run §A before any contested claim leaves your
mouth; scan §B when a question matches a trigger; read the one row of §C
you need. §D is the gaps retrieval cannot close. §E is what transports
across contexts and what does not. §F is how to maintain it.

**Every rate in this file is a measurement of some model or some corpus on
some task format on some date — including the rates about LLMs.** They are
cited as evidence for a *direction* and as the reason a gate exists, never
as this agent's error rate on your question. The gates stand on the
asymmetric cost of the error, not on the decimal. Transport the ordinal
claim (§E); a file about epistemics does not get to commit the fallacy it
documents.

**Triggers here are structural, never felt.** Do not wait to feel
uncertain. Hedging language is mimicked from pretraining, not computed:
measured in 2023 on then-current models over QA benchmarks, high-certainty
expressions ("it is well established") accompanied *lower* accuracy (~7% in
that setting) and accuracy varied >80% across certainty markers (Zhou,
Jurafsky & Hashimoto, EMNLP 2023, 2023.emnlp-main.335). Self-reported
confidence underperformed a cheap recalibration baseline on other models and
other tasks (arXiv 2409.03225). Direction, not rate: your hedges do not
track your correctness. So every trigger below is a property of the
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
| **A3 Absence is dated, sourced and queried** | Every absence claim — zero rows, "no RCT", "no model exists", "nobody has shown", "the first to" — is written **"not recorded in \<source\> \<version\> as of \<date\>, query \<string\>"**. Never "no association exists", never flat present tense. Time is a stripped condition exactly like a threshold: a true 2026-10-18 observation silently becomes false, and a reader cannot tell when it was looked for. If you did not run a query, the claim is `[unverified]`, not an absence. | Heuristic — no published rate for this confusion (see §D). Mechanically identical to A2's threshold error, and to §E's transport failure with *date* as the stripped condition. |
| **A4 Identifiers come from an API, never recall** | Every gene symbol↔ID↔alias, locus, rsID or ontology term is resolved by a call. Confidence is not a competence signal for this task. | GeneTuring (PMID 36993670, bioRxiv preprint): plain GPT-4o errs in ~99% of gene-name-conversion cases, ~99% accurate *with* API access, and incapacity awareness is low — the model does not know it cannot do it. **A different model, one benchmark's task format, one date: take the direction (recall fails, an API fixes it, the failure is not felt), not the rate.** |
| **A5 Numbers carry their quote** | Every effect size, CI, n or p is quoted with the sentence or table cell it came from. No quote ⇒ `[unverified]`. Do not try a different model instead. | Jansen et al., *Psychol Bull* 2025 (10.1037/bul0000501), 312,329 data points: unacceptable accuracy on 20% of variables; variance largest *between variables*, smallest between models — so only re-reading the source fixes it. |
| **A6 Citations: check the numbers, not just existence** | A resolving DOI is not a verified citation. Verify the numeric fields. Treat a bare URL as *raising* suspicion, and ignore formatting polish entirely. | Walters & Wilder, *Sci Rep* 2023 (10.1038/s41598-023-41032-5), GPT-4 on a 2023 bibliography-generation task: 18% fabricated; among *real* citations 24% carried a substantive error, concentrated in numeric fields (dates 16%, vol/issue/page 13%; author/title/journal each <7%). Formatting quality does not discriminate fabricated from real, and fabricated citations carried hyperlinks *more* often (18% vs 6%). |
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
| "what fraction of the signal", "how much of this is driven by", "adjust for / correct for cell composition", "X% of the signal is", "deconvolve", "scale it by", "use the reference value"; or you are about to multiply a reference expression value by a cell fraction, or reuse any absolute value (nTPM/TPM, MCID, prevalence, event rate, cell fraction) as a constant in a new context | §E transport | Name the number's generating conditions; drop to the highest transportable rung (existence → direction → rank order); take attribution counts from the study's own data | `copd-marker-resolver` (expression) · `copd-verifier` (effect sizes) | 250 / 300 w |
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

**Fourth trap, and the most important one: there is no single authoritative
per-blood-cell value.** Datasets disagree by orders of magnitude and can
invert the lineage ranking. Verified 2026-10-18 from the HPA bulk TSVs, TPM
column, same gene, same nominal unit:

| Gene | HPA consensus (19 cell types) | Monaco 2019 (30) | Verdict |
|---|---|---|---|
| **CCL20** | max = MAIT T-cell **2.7** | classical monocyte **73.2**, intermediate 24.2, myeloid DC 14.4 | T-cell-topped vs monocyte-topped. ~27x, **opposite lineage** ⇒ `unsettled` |
| **CSF3R** | classical **206.2** vs non-classical **18.8** (11.0x) | classical **532.8** vs non-classical **42.0** (12.7x) | Replicates in both ⇒ `supported` |

So: **quote at least two datasets for any marker-level claim and name which
you used.** There is no right answer, only a sourced one. The two-dataset
rule is what separates CSF3R (robust) from CCL20 (an artefact of which
atlas you opened). Note also that `TPM`/`pTPM`/`nTPM` columns give different
numbers for the same cell — the column changes the magnitude, though here
not the direction.

**Units are a condition, not a label.** `nTPM`/`pTPM`/`TPM` are
length-normalised *shares of that cell's own transcriptome* — not molecules
per cell. So a per-cell share may **not** be multiplied by a cell fraction
to apportion a bulk signal.

The best-sourced reason is **transcriptome heterogeneity, not an unmeasured
mass constant**. Monaco (PMID 30726743) reports that low-density neutrophils
"have a few highly expressed genes that crowd the total mRNA pool", and that
TMM and housekeeping normalisation "may overestimate the mRNA scaling
factor" for them. A top-heavy transcriptome distorts every share computed
within it, which breaks the arithmetic without needing any factor — and so,
unlike a factor, it cannot be applied in the wrong direction.

Do **not** reach for a per-cell mass correction instead: **no per-cell mRNA
mass ratio for any leukocyte pair was retrievable** (not recorded in Europe
PMC as of 2026-10-18; queries `"RNA per neutrophil"` 0 hits, `("pg total
RNA" OR "pg of RNA") AND (neutrophil AND monocyte AND lymphocyte)` 22 hits
with none a per-cell measurement). Any numeric factor is `[unverified]`.
What Monaco does report is *total RNA* yield per sorted cell — high for
plasmablasts, DCs and monocytes; low for LD granulocytes, progenitors and
CD4 T_TE. Read that as **lower than monocytes only**: it is subset-dependent,
not lineage-dependent, since plasmablasts are the highest-RNA cell measured
and a CD4 subset sits in the low group. Conditions on even that: total RNA
rather than mRNA, *low-density* granulocytes from the PBMC fraction rather
than normal-density circulating neutrophils, n=4 healthy donors, RiboGreen
linear range 1-200 ng — **and the authors disavow their own estimate**
("it is preferable not to use the total RNA yield estimates").
All four atlases are **healthy adult donors**, sorted by each study's own
protocol, so they carry no disease state and no activation state. Any "what
fraction of this bulk signal comes from cell X" question is answered from
the study's own counts and its own measurements — §E.

**Resources.** HPA per-gene XML (19 immune cell types) · the four bulk
TSVs (Monaco 4.97 MB, Schmiedel/DICE 1.64 MB, HPA consensus 2.75 MB, HPA
single-cell 16.3 MB — exact paths and columns in `data-sources.md`;
`rna_blood_cell*.tsv.zip` is 404, the live names use `immune_cell`) ·
CELLxGENE Census pseudobulk per `cell_type` · HLCA for lung · the primary
subset-comparison papers. Haemopedia/Haemosphere and DICE have no public
JSON API (404) — use the HPA redistributions as the proxy.

**Silent-failure endpoints make absence look like evidence.** HPA
`search_download.php` drops unrecognised `columns=` codes and returns 200
with `[{"Gene":"CCL20"}]`; GTEx `singleTissueEqtl` ignores `snpId=`
entirely and returns 250/page, so a per-variant query reads as a clean
negative when it is pagination plus a dead filter. Full table in
`data-sources.md`. This is gate A3 with teeth.

**Cheapest decisive query.**
```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/biodata.py blood-cells CSF3R
python3 ${CLAUDE_SKILL_DIR}/scripts/biodata.py fulltext-grep 20067595 CSF3R   # their source, before contradicting
```
The `blood-cells` payload returns `transportable_claim` (rank order,
fold-over-second, the conditions) next to the values, plus the units and
no-constant-arithmetic warning in `note` — quote that, not a bare nTPM.

**Return schema** — `copd-marker-resolver`, ≤250 words. Full schema in that
agent's definition.

### C2. Exact quantities, and citation integrity

**Why thin.** Directions of effect are recalled reliably; magnitudes, CIs,
n and p drift toward round and often-quoted values, worst on particular
variables rather than particular models (Jansen 2025 — §A5). Separately,
24% of the *real* citations GPT-4 emitted in one 2023 bibliography task
carried a substantive error, concentrated in numeric fields (Walters &
Wilder 2023 — §A6). What transports is **where** the errors land, not the
24%. So the gate is **not "is the paper real" but "are its numbers
right"**.

**Retraction status is never recalled.** Consumer chatbots tested in
2024-25 found <50% of retractions and mislabelled ~18% of valid papers as
retracted — other models, other prompts; the transportable part is that
retraction status is not a recallable property. Use Crossref: the per-DOI
check is whether `update-to` is present in the message; the corpus-level
filter `update-type:retraction` returns **76,296** records (verified
2026-10-18). **Europe PMC `pubType` is unreliable here** — it was `None` on
a confirmed retracted record while
`commentCorrectionList.commentCorrection[].type == "Retraction in"`
carried it. Read the correction list, and the per-DOI Crossref
`updated-by[]` with `source:"retraction-watch"`. Do not pull the Retraction
Watch CSV for a single check (200, but 67.6 MB). Watch for **"Author
Correction"** too: not a retraction, but it changes the numbers — one
exists on the Avila Cobos deconvolution benchmark (PMID 33268785). Fabrication base rate in the literature is now ~1 in 277
PubMed-indexed papers in early 2026, up from ~1 in 2,828 in 2023 (Topaz et
al., *Lancet* letter 2026; AI-assisted classifier, so method-dependent).
**Detection rule: a title absent from all four of PubMed, Crossref,
OpenAlex and Google Scholar ⇒ fabricated. One database missing it is not
enough.**

**Route 1 for any registered trial: the registry, not the paper.**
ClinicalTrials.gov v2 `resultsSection.outcomeMeasuresModule` →
`analyses[]` carries `paramType`, `paramValue`, `ciLowerLimit`,
`ciUpperLimit`, `pValue`, `statisticalMethod` and the covariate list, with
no paywall. Verified 2026-10-18: NCT02164513 (IMPACT) annual
moderate/severe exacerbation rate 0.91 (0.87-0.95) vs 1.07 (1.02-1.12) vs
1.21 (1.14-1.29); NCT03930732 (BOREAS) 1.01 (0.931-1.301) vs 0.776
(0.645-0.934), difference -0.324 (-0.508 to -0.140), p=0.0005, negative
binomial — while the pivotal NEJM paper (PMID 37272521) is **neither open
access nor in Europe PMC full text**. The registry had the number and the
paper did not.
```bash
curl -s "https://clinicaltrials.gov/api/v2/studies/NCT03930732?fields=resultsSection.outcomeMeasuresModule"
```
Caveats: `HasResults` is false for most trials, and registry results are
sponsor-entered. Where both exist, cite both and flag disagreement rather
than picking one.

Then `pubmed-fetch` for abstract numbers, Europe PMC OA full text for
tables, FDA advisory briefing documents / EMA EPARs for regulator-recomputed
effects (PDF only — see §D). Always report effect **with CI, absolute
difference, n, and vs MCID** (FEV1 ~100 mL, SGRQ 4, CAT 2, 6MWD ~26-30 m).

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

**GSVA — now verified from the primary source, cite these rather than
re-deriving them.** The original paper (Hänzelmann 2013, PMC3618321, OA
full text) states both directly:

| Fact (GSVA paper's own words) | Consequence for your analysis |
|---|---|
| Scores are computed "relative to the overall population" | **Scores are cohort-dependent.** Adding or removing samples changes *every* score, and scores from two cohorts are not comparable. Never pool or compare GSVA scores across datasets. |
| "many gene sets are highly overlapping and therefore not merely correlated, but essentially duplicated" | **FDR across overlapping set scores is invalid.** The tests are not independent in the way BH assumes. |
| `maxDiff=TRUE` (a current default) | **Cancels pathways whose genes move in both directions** — a real false-negative source for any mixed-direction signature. |

Current Bioconductor defaults to state when specifying a run:
`kcdf="auto"`, `kcdfNoneMinSampleSize=200`, `maxDiff=TRUE`, `tau=1`.

This corrects the record: an earlier first-principles inference in this
project that overlapping sets are not independent and could mechanically
produce correlated scores — correctly flagged unverified at the time — is
confirmed by the primary source. The lesson is unchanged: the inference was
only worth asserting *after* someone read PMC3618321.

**Separate anchor, verified 2026-10-18.** Noureen et al., *eLife*
2022;11:e71994 (PMC8916770): per-cell gene-detection differences bias
ssGSEA and GSVA in single-cell data while sparing single-cell-native
scorers (AUCell, JASMINE). Tested on cancer scRNA-seq, so transfer to bulk
COPD lung is an assumption, not a result.

**Still open:** no source found establishing a *direction* for the effect of
correlated gene sets on score magnitude. Cohort-dependence and invalid FDR
are established; "does correlation inflate or shrink my scores" is not.
Say so and give the empirical check (permute or subsample the signature on
the user's own data; compare against a rank-based or single-cell-native
scorer).

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
(Giambartolomei 2014; Wallace 2021 on `p12` sensitivity — **enumerate
vignette names from the CRAN index rather than guessing**: `a04_sensitivity`
exists, `a06_sensitivity` 404s) · TwoSampleMR / MR-Base + **STROBE-MR 2025
update, PMID 41223895 / PMC12611437, open access** — route that rather than
the 2021 original (PMID 34698778), which is not OA · LDSC README
(ancestry-matched LD scores, intercept handling) · SuSiE/FINEMAP (L,
window) · eQTL Catalogue credible sets. Builds are mixed — see
`data-sources.md`. `appraisal-and-rigor.md` §B17-B19 is the *appraisal*
checklist; this row is about *authoring*.

**Direction of effect and "is there a cis-instrument?" — use Open Targets
`target.credibleSets`, not GTEx.** One call returns signed `beta`,
`standardError`, lead `variant.id`, `isTransQtl` and `studyType` per
credible set, so instrument availability is answered directly and disease
direction chains to expression direction in two calls (NPNT: 153 sets = 84
sQTL + 34 eQTL + 16 tuQTL + 6 sc-eQTL). GTEx `singleTissueEqtl` fails
*silently* for this: rs34712979 is absent from the 320 returned NPNT lung
eQTLs because `snpId=` is ignored and results are paginated.

**GWAS Catalog signs are words, not numbers.** `beta: "0.0633781 unit
decrease"` is an unsigned magnitude plus an English direction term — parse
the word. Then read `reported_trait`: the top COPD hit is "COPD liability
(machine learning-based score)", a continuous proxy, so "decrease" means
lower predicted liability, not lower FEV1.

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

**Not cheaply resolvable — stop trying, and say which of these you hit.**
All checked 2026-10-18.

| Target | Why it does not yield | Best available proxy |
|---|---|---|
| GOLD / ATS / ERS guideline text | No API; registration wall | Europe PMC `PUB_TYPE:"Guideline"` — found JRS 7th ed (2026-07-14), Chest CT in COPD (2026-08-01), Spanish AATD CPG (2026-06-13) |
| Why a trial actually stopped | `whyStopped` is boilerplate ("Sponsor's decision", "Recruitment failure", or blank); nothing public distinguishes futility from a portfolio call | Require **four agreeing signals**: terminated + no results posted + no publication on the NCT ID + a line item in an SEC filing (EDGAR full-text search, `data-sources.md`) |
| Cell abundance in your own tissue | CELLxGENE abundance is dissociation-biased | Report proportions as dissociation-dependent; prefer within-study contrasts |
| Leaf-only CELLxGENE cell types | `is_rollup:false` → HTTP 500 | De-duplicate the CL hierarchy client-side; ancestor terms otherwise eat 40%+ of any signal-share calculation |
| FDA reviewer-adjusted estimates | PDF only | Read the PDF; do not expect a structured field |
| MR at scale | OpenGWAS 401 without a JWT | FinnGen, Pan-UKBB, GWAS Catalog sumstats |

**Evidence gaps — these rules are heuristic, not measured.** Labelled so
nobody later cites them as established: (a) no published rate for
marker-specificity vs signal-attribution confusion — our exact failure
class is unmeasured; (b) no rate for an LLM judge overturning a *correct*
human answer; (c) no measured rate for absence-of-record vs
absence-of-effect confusion (gate A3 is encoded anyway because the cost is
asymmetric).

## E. What transports and what does not

A number is a measurement made under conditions — population, platform and
units, normalisation, isolation protocol, disease state, date, model
measured (SKILL.md rule 14). Moving it to a new context without those
conditions imports them as hidden assumptions. The fix is not silence: it
is to carry the most transportable form of the claim that still answers the
question.

**The ladder, most to least transportable.**

| # | Form | Example | Safe for | Broken by |
|---|---|---|---|---|
| 1 | **Existence** | "CSF3R is expressed in classical monocytes" | Refuting an absence claim; justifying that a measurement is worth making | A detection/enrichment threshold being the only reason it appears or disappears — restate it (A2) |
| 2 | **Direction** | "higher in classical than non-classical" | Mechanism, hypothesis framing, sanity-checking someone's data | Sign flips across platforms (CCL20 inverts lineage between HPA and Monaco, §C1); or the comparison measured is not the one asked |
| 3 | **Rank order** | "neutrophil ≫ classical > intermediate > non-classical" | Marker-panel choice; predicting which cell dominates a sorted comparison | Normalisation reordering near-ties; a cell type absent from the panel by construction (no granulocytes in any PBMC atlas) |
| 4 | **Fold-change** | "classical ~11-13x non-classical in two atlases" | Powering a comparison; order-of-magnitude plausibility | Arms measured in different assays; ratios from different datasets do not compose |
| 5 | **Ratio / proportion / share** | "~20-40% eosinophilic"; "share of bulk signal" | Nothing until the threshold, the denominator and the measurement occasion are all stated | A moved threshold, a different denominator, or within-person instability (BEC moves; GOLD 2026 advises repeating 2-3x) |
| 6 | **Absolute value** | "279.2 nTPM"; "0.91 exacerbations/yr"; "MCID 100 mL" | Reproducing *that* table; serving as a declared anchor | Any change of population, platform, unit, normalisation, disease state, era or date — i.e. almost always |

Rungs 1-3 survive a change of dataset; 4 survives within an assay; 5-6
travel only with their conditions attached. **Report the highest rung that
answers the question, and attach the generating conditions to anything
below rung 4.** A number with its conditions beats no number; a number
without them is a liability.

**The corollary that bites hardest: when the quantity is itself a function
of the variable under study, an external constant assumes away the
hypothesis.** CSF3R, S100A8/A9 and inducible inflammatory
transcripts generally are activation-responsive, so per-cell expression — and therefore the share of
a bulk signal a given cell contributes — *moves with inflammation*. A
healthy-donor per-cell value used to adjust a disease comparison is biased
against the priming hypothesis it was meant to test. Same shape: reference
cell fractions used to "correct" a disease cohort; a pre-COVID event rate
used to power a post-COVID trial; an MCID estimated in one severity
stratum applied to another (rule 6).

**Attribution arithmetic comes from the study's own measurements.** To ask
"whose signal is this in bulk?", use that study's CBC/differential, its
sorted fractions or its matched single-cell data, and deconvolve with a
panel containing the candidate cells (§C1, trap three). Never multiply a
reference-atlas expression value by a reference cell fraction.

**Templates that keep the condition attached.**

| Instead of | Write |
|---|---|
| "CSF3R is 279.2 nTPM in classical monocytes" | "classical ≫ non-classical, 11-13x in HPA consensus and Monaco (healthy adult donors, sorted bulk, nTPM, retrieved 2026-10-18)" |
| "tozorakimab RR 0.71" | "RR 0.71 (0.57-0.88) in OBERON's *former-smoker* subgroup, on background inhaled therapy, COVID-era event rates" |
| "~30% of COPD is eosinophilic" | "~20-40% depending on the BEC cut and the occasion measured; BEC is unstable within person" |
| "no trial exists" | "not recorded in ClinicalTrials.gov as of \<date\>, query \<string\>" (A3) |
| "LLMs err ~99% on gene-name conversion" | "one benchmark, one model, one task format: recall fails, API access fixes it — direction, not rate" |

Trigger phrases that put you here are in §B. If you are about to write a
bare absolute value into a context that did not generate it, you are in the
failure this section exists for.

---

## F. Maintaining this file

When a gap is found the hard way, add the row the same day: the observable
trigger in the asker's own words, the resource, the one command that
settles it, the word cap. Mark each new rule **measured** (with the
citation) or **heuristic** — the distinction is the point of §D. Any number
you add carries its generating conditions in the same cell, and any rate
measured on another model or corpus says so (§E). When a
command here stops working, fix it in `scripts/biodata.py` and
`data-sources.md` and date it. A trigger that has never fired is probably
worded as a feeling rather than a signal; rewrite it as a phrase someone
would actually type.
