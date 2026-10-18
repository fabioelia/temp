# Discovery methods: operating procedure

How to find connections others have not made. The engine produces
**candidate hypotheses and evidence dossiers, not conclusions.** Every
claim traces to an ID (PMID, DOI, NCT, accession) fetched during the run.
Facts recalled from model memory never count as evidence.

```
SEED → EXPAND (LBD + KG + omics) → GENERATE (parallel, diversified)
     → NOVELTY GATE (N0-N4) → TRIANGULATE (genetics, omics, pharmacoepi)
     → RED-TEAM → TOURNAMENT (pairwise) → EVOLVE top-k
     → REPORT (kill criterion + cheapest decisive test)
```

## 1. Literature-based discovery (Swanson ABC)

A and C are never discussed together, but A→B and B→C are each published
(fish oil–Raynaud via blood viscosity, Swanson 1986 PMID 3797213;
magnesium–migraine via 11 B-links, Swanson 1988 PMID 3075738).

- **Open discovery:** start at C (COPD) → specific Bs → new As. Generates.
- **Closed discovery:** given A and C, find the linking Bs. Explains/vets.

Building blocks: PubTator3 (normalised entities + relations, Wei NAR 2024,
best for co-mention counts); SemMedDB subject-predicate-object triples
(typed, directional chains; precision ~0.7, noisy); embeddings
(Tshitoyan Nature 2019 predicted materials years early); **"alien"
discovery** (Sourati & Evans Nat Hum Behav 2023: modelling author networks
predicts discoveries far better; inverting it — high plausibility, low
reachability by current experts — yields ideas communities would not reach
soon).

Steps:
1. Pull the COPD corpus (MeSH "Pulmonary Disease, Chronic Obstructive",
   emphysema, chronic bronchitis, small-airway disease).
2. Rank B-terms by **specificity** (lift/χ² vs background), drop generic hubs
   ("inflammation", "oxidative stress").
3. For each B, retrieve A-candidates (drugs, genes, exposures, cell types)
   linked to B in the **non-COPD** literature; keep directional chains.
4. Score A–C: distinct B-paths × B specificity × predicate consistency,
   minus direct A–C co-mentions.
5. Author distance via OpenAlex: authors publishing on both A and COPD;
   keep "accessible" and "alien" lists separately.
6. Backtest when building pipelines: freeze corpus at ~2017, see if it
   surfaces later links (T2 biologics in COPD; GLP-1 RA and fewer
   exacerbations, Pradhan BMJ 2022). LLM steps leak future knowledge, so
   time-slicing only validates non-LLM components.

## 2. Knowledge-graph link prediction

Resources: Hetionet/Rephetio (metapath DWPC; the metapath *is* the
explanation), PrimeKG (Chandak Sci Data 2023, ~4M edges, indications and
contraindications), TxGNN (Huang Nat Med 2024, zero-shot repurposing with
path explanations), SPOKE, Open Targets (L2G genetics layer). COPD =
MONDO:0005002, EFO_0000341.

Pitfalls: **degree bias** (hubs over-predicted; compare to a
degree-preserving permuted graph, report percentile; Bonner Brief
Bioinform 2022). **Leakage** (KG edges mined from the same literature;
strip direct and 2-hop literature edges and re-score).

Use surviving metapaths through **COPD-specific** nodes (GWAS genes,
COPD-relevant cell types) as seeds the generator must turn into a
mechanistic, testable claim.

## 3. What worked in AI-scientist systems

| System | Pattern to copy |
|---|---|
| Google AI co-scientist (Gottweis arXiv:2502.18864) | Generate → reflect → **pairwise Elo tournament** → evolve; a Proximity agent clusters ideas to prevent collapse. More test-time compute → better. |
| FutureHouse Robin (arXiv:2505.13400) | Literature agent + data-analysis agent; real data closes the loop. |
| PaperQA2 (arXiv:2409.13740) | Retrieval with citation traversal and contradiction detection as the evidence/novelty engine. |
| Kosmos (arXiv:2511.02824) | Parallel agents read/write a shared **structured world model** (our ledger). |
| Virtual Lab (Swanson Nature 2025) | Run the same brief N times in parallel at high diversity, then one merge pass. |
| BioDiscoveryAgent | Critic agent improves experiment selection. |
| Sakana AI Scientist | Cautionary: automated self-review missed flawed experiments. |

Failure modes → mitigations:
- **Fabricated citations** (18% for GPT-4, Walters Sci Rep 2023) → every
  citation is a fetched ID; critic re-fetches and quotes the supporting
  sentence; any fabrication rejects the hypothesis.
- **Novelty that does not survive execution** (Si et al. 2024/2025: LLM ideas
  rated more novel but lost more on execution) → score feasibility; prefer
  ideas testable in existing data.
- **Homogeneity** (~5% unique among thousands of LLM ideas) → clustering,
  quotas, assigned contrarian/alien roles.
- **LLM-as-judge unreliability** → pairwise not absolute; rubric anchored to
  measured evidence.
- **Wrong direction of effect** → explicit drug-action vs genetic-direction vs
  disease-signature check.

## 4. Genetic / causal triangulation

Genetic support ~2x (Nelson Nat Genet 2015) to 2.6x (Minikel Nature 2024)
higher approval odds, more when the causal gene is confidently assigned.
COPD: 82 loci (Sakornsakolpat Nat Genet 2019); multi-ancestry lung function
(Shrine Nat Genet 2023); COPD–IPF shared loci often with **opposite** effect
(FAM13A, DSP; Hobbs Nat Genet 2017).

1. **Variant → gene:** Open Targets L2G, fine-mapping, coloc with GTEx lung /
   eQTLGen eQTLs; require PP.H4 > 0.8.
2. **Drug-target MR:** cis-pQTL (UKB-PPP, deCODE) or cis-eQTL instruments vs
   COPD, FEV1/FVC, exacerbation, emphysema GWAS; SMR/HEIDI.
3. **Direction check:** an inhibitor is supported only if *genetically lower*
   target activity means less COPD.
4. **Sensitivity:** MR-Egger, weighted median, Steiger, leave-one-out, coloc.
5. **PheWAS** of the instrument for safety/pleiotropy. **Smoking-behaviour
   associations are a red flag.**
6. **LDSC genetic correlation** to justify cross-disease borrowing.
7. **Triangulate** across designs with *different* biases (Lawlor IJE 2016);
   agreement among methods sharing a bias counts once.
8. **Negative controls** (outcome, exposure, sister-gene instrument).

## 5. Omics and pharmacoepi repurposing

- **Signature reversal** (CMap/LINCS L1000): build COPD signatures from lung
  tissue (LGRC/LTRC GSE47460), small-airway brushings, single-cell
  pseudobulk; keep compounds reversing ≥2 independent signatures in ≥2 cell
  contexts vs random-signature nulls. Low weight alone: reproducibility is
  limited and L1000 lacks lung fibroblasts/AT2.
- **Cell-type heritability:** MAGMA-celltyping, S-LDSC, scDRS on HLCA via
  CELLxGENE Census. Hypotheses must name the cell type and show expression.
- **Cross-disease analogies** (each needs a stated mechanistic bridge and
  rg): IPF (opposite-direction loci), asthma (T2), CVD (statins, beta-
  blockers, SGLT2i, GLP-1 RA), aging (senolytics, mTOR, NAD+), lung cancer
  (HHIP, CHRNA pleiotropy), CF/bronchiectasis (mucus, DPP1/brensocatib,
  acquired CFTR dysfunction).
- **Pharmacoepi:** FAERS disproportionality is a weak signal only (READUS-PV).
  EHR target-trial emulation, active-comparator new-user, negative controls,
  E-values (template: Pradhan BMJ 2022 GLP-1 RA vs SU, severe exacerbation
  HR 0.70).

## 6. Novelty gate (run by an agent independent of the generator)

1. **Normalise entities:** MeSH, ChEMBL (all brand and code names), HGNC
   aliases, target-class terms, COPD synonyms (emphysema, chronic bronchitis,
   airflow obstruction, FEV1/FVC, lung function decline).
2. **Tiered Europe PMC counts** (covers PubMed, PMC full text, preprints):
   (a) `TITLE_ABS:` A AND C; (b) full text A AND C; (c) mechanism class AND C;
   (d) the specific sub-claim (genotype stratum, cell type, endpoint).
   Also PubTator3 relations.
3. **Read top hits;** classify as human-tested / preclinical / speculated /
   incidental mention.
4. **Citation chaining** of the closest 3-5 papers (OpenAlex / Semantic
   Scholar).
5. **Other channels:** ClinicalTrials.gov v2, patents (Lens.org / Google
   Patents), NIH RePORTER, ATS/ERS abstracts.
6. **Record** query strings, date, counts in the ledger.

| Grade | Meaning |
|---|---|
| N0 Known | Tested in humans or established |
| N1 Preclinical | Animal / in vitro test of A in C published |
| N2 Proposed | Speculated in a review, discussion or patent; untested |
| N3 Implicit | Only incidental co-mention, or both A–B and B–C published |
| N4 Unmade | Zero A–C co-mentions across full text, preprints, patents, trials |

Grade the **pair** and the **sub-claim** separately. Many good hypotheses
are an N1 pair with an N4 sub-claim.

**Hard rule, learned the hard way (see §10):** a `TITLE_ABS:`-only count
systematically overstates novelty. In the HHIP worked example it returned 1
hit where full text returned 10. **N4 may never be claimed without the
full-text, mechanism-class and review tiers all returning zero**, and
without reading the top hits of each. A reviewer who re-runs your search
with a wider scope and finds prior art has refuted the hypothesis, not just
annotated it.

## 7. Scoring rubric (1-5, anchored)

| Axis | 1 | 3 | 5 | Weight |
|---|---|---|---|---|
| Novelty | N0 | N2/N3 | N4 sub-claim, alien bridge | .15 |
| Mechanistic plausibility | No chain | ≥1 unsupported link | Every link cited in relevant cell type, direction consistent | .15 |
| Evidence convergence | 1 modality | 2 independent | ≥3 with *different* biases | .15 |
| Causal/genetic support | None/contradictory | GWAS gene, no coloc/MR | Colocalised cis-instrument, MR correct direction, clean PheWAS | .15 |
| Testability | Needs new RCT | New animal study | Testable now in public data or ≤4-week ex vivo assay | .15 |
| Clinical impact | Marginal | Subgroup, oral | Disease-modifying, large population, approved drug | .10 |
| Falsifiability | Vague | Measurable | Pre-registered kill criterion with expected direction/size | .10 |
| Safety (gate) | Unacceptable in elderly multimorbid | Manageable | Well tolerated | gate |

**Hard rejects:** any fabricated/unsupported citation; N0 at both pair and
sub-claim; falsifiability <3; unexplained direction contradiction; safety 1.

## 8. Red-team protocol

Critic sees only the dossier and is rewarded for fatal flaws:
1. Citation audit — fetch every ID, quote the supporting sentence, mark
   supports / partial / does-not-support.
2. Independent prior-art search with its own synonyms.
3. Disconfirmation search — null trials, adverse respiratory events,
   opposite-direction MR, knockout phenotypes pointing the other way.
4. Bias checklist — smoking/SES/indication confounding, reverse causation,
   LD neighbour genes, pleiotropy, developmental vs adult effect, KG degree
   bias, cell-context mismatch, immortal time.
5. Pre-mortem — "It is 2030 and the trial failed; three likeliest reasons."
6. Strongest alternative explanation of the same evidence.
7. Verdict: fatal / major / minor, revised scores.

Generator gets one rebuttal; then pairwise tournament among survivors.

## 9. Anti-convergence

1. **Obvious-idea list** (allowed only with an N3-N4 sub-claim): IL-5/IL-5R,
   IL-4Rα, IL-33/ST2, TSLP, PDE3/4, macrolides, statins, beta-blockers,
   GLP-1 RA, SGLT2i, generic senolytics.
2. Cluster quotas: ≤k per cluster to tournament; final top-N spans ≥M
   clusters.
3. Hub penalty by PubTator mention count.
4. Contrarian roles: "assume consensus mechanism is wrong"; "which common
   comorbidity drug worsens COPD?"; "opposite-direction IPF/COPD loci".
5. Alien roles: B-terms only from communities with zero coauthor overlap
   with COPD researchers.
6. Seed diversity: each worker gets a different seed subset.
7. Canonical tuple for dedupe:
   `(intervention/target ID, direction, mechanism node IDs, cell type CL ID,
   population/stratum, outcome EFO ID)`.

## 10. Worked example (ILLUSTRATIVE — procedure demo, not a recommendation)

**Seed:** HHIP (4q31), among the strongest COPD/lung-function GWAS signals.
Risk haplotype reduces HHIP expression (Zhou HMG 2012, PMID 22140090);
HHIP antagonises Hedgehog; Hhip+/- mice get age-related emphysema (Lao PNAS
2016, PMID 27444019); mesenchymal Hh expansion causes emphysema (Wang JCI
2018, PMID 29999500). Inferred: SMO inhibition protective.

**Novelty gate (run 2026-10-17):** drug names × COPD in TITLE_ABS = 2 hits,
incl. a 2022 review (PMID 36191777) and a 2026 mouse vismodegib study (PMID
41637659). Pair = **N1** — the obvious ABC link was already made.

**Pivot attempt:** refined H*: *adult (not only developmental) mesenchymal Hh
activity mediates HHIP risk, so SMO inhibition should help most in
risk-allele carriers.* Graded **N4** on title/abstract-only counts.

**Then the critic ran it (2026-10-18) and returned MAJOR.** This is the
instructive part — read it before trusting any dossier:

- **Novelty was overstated.** `TITLE_ABS:` gave 1 hit; the same query over
  full text gave **10**, and a 2022 review (PMID 36191777) already proposes
  Hh inhibition for genetically susceptible COPD. True grade **N3, not N4.**
- **Two of three mechanism links only partially supported.** Lao PNAS 2016
  (PMID 27444019) attributes Hhip+/- emphysema to oxidative stress and
  rescues it with N-acetylcysteine, with no Hh/GLI readout and no
  SMO-dependence; Wang JCI 2018 (PMID 29999500) is forced *ectopic*
  Hh gain-of-function, not HHIP loss. Each was cited for a mechanism its
  paper never tested.
- **Wrong cell context in humans.** Adult human HHIP is epithelial;
  fibroblast dominance is mouse-specific, and the causal 4q31 enhancer acts
  SMAD3-dependently and **Hedgehog-independently** (PMID 38417378,
  EBioMedicine 2024).
- **Direction of effect contradicted.** Human tissue shows Hh signalling
  deficient or down in COPD epithelium (PMID 31877414, 30833624, 39844999),
  and GLI1 nuclear translocation is *required* for AT2 proliferation
  (PMID 42399584) — so SMO inhibition predicts **harm**, not protection.
- **The "ongoing, not developmental" premise has no supporting experiment.**
  No adult inducible Hhip deletion exists; the best model (PMID 40333979,
  Sci Adv 2025) places the effect in alveologenesis and its therapeutic was
  **neonatal** HHIP-Fc. HHIP is overwhelmingly a *height* locus (p ≤ 1e-300)
  — developmental pleiotropy.
- **The nominated cheap test was not runnable.** GTEx v8 has no significant
  HHIP lung cis-eQTL; the real coloc is with a lung *splicing* QTL and is
  already published (PMID 40798880).
- **Target substitution.** Genetic support is for HHIP; **SMO has zero
  genetic evidence for COPD** (Open Targets 0.083, literature only).
- **Safety gate 2.** FAERS for vismodegib/sonidegib is dominated by muscle
  spasms, raised CPK, dysgeusia and weight loss — the worst possible profile
  in sarcopenic, cachectic, elderly patients.
- **Kill criterion confounded with power.** FEV1-decline and
  emphysema-progression GWAS are small, so a null would be uninformative.
  Fix: pre-specify a detectable effect size and add a positive-control locus
  (e.g. FAM13A) to show the design can detect progression at all.

**Lessons to carry into every run:**
1. **Never grade N4 from `TITLE_ABS:` alone.** Run the full-text tier, the
   mechanism-class tier and the review literature before claiming zero.
2. **Check what each cited paper actually measured**, not what it is
   commonly cited for.
3. **Mouse cell-type localisation does not transfer to humans** — verify in
   adult human tissue (HLCA, LTRC).
4. **Run the direction-of-effect check on the drug target itself**, not on
   the upstream GWAS gene. Genetic support for a pathway member is not
   genetic support for the node your drug hits.
5. **Confirm the nominated cheap test is actually executable** (the
   instrument exists, in the right tissue) before promising it.
