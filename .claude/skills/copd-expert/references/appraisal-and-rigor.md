# Appraisal, rigor and translational judgment

How an elite COPD scientist reads, weighs and decides. Load this before
grading evidence or critiquing a hypothesis. Items marked [secondary] were
checked only via trade press or abstracts; verify against the primary paper
before leaning on them.

## A. Mindset

1. **Problem choice (Alon, Mol Cell 2009; Hamming 1986).** Before proposing
   work state: why it matters to patients or the field; the *attack* (the
   concrete method); what a negative result would teach.
2. **Strong inference (Platt, Science 1964).** Every mechanistic claim names
   at least two competing explanations (smoking confounding, reverse
   causation, artefact, pleiotropy) and the observation that separates them.
3. **Read the frontier, not just the literature.** Preprints (bioRxiv,
   medRxiv); ATS (May) and ERS (September) abstracts, where pivotal COPD
   trials now land with a simultaneous NEJM paper; trial registries
   (registered vs reported endpoints, completed-but-unpublished trials);
   NIH RePORTER / CORDIS (what is funded for the next 3-5 years); FDA
   advisory briefing documents, EMA EPARs; company toplines and silent
   pipeline discontinuations (these are negative results).
4. **Check the graveyard first.** "What happened last time someone hit this
   pathway?" See `copd-landscape.md` → failed trials.
5. **Signals experts notice:**

| Signal | Usually means |
|---|---|
| Primary endpoint differs between registry and paper | Outcome switching |
| "Post hoc", "nominal p", "in the ICS-naive subgroup" | Hypothesis-generating only |
| HR separation only in first 30-90 days | ICS-withdrawal / run-in artefact |
| Placebo exacerbation rate far below enrolment criterion | Regression to the mean |
| Big relative reduction, tiny absolute difference | Low baseline risk; compute NNT |
| Effect only in former smokers or only eos >=300 | Plausible; needs replication |
| Sponsor-funded consensus definition | Read the framing critically |
| Single cohort, UK Biobank only | Selection/collider bias |
| Elastase mouse model is the only efficacy evidence | Weak translational support |

## B. COPD critical-appraisal checklist

- **B1 Spirometry definition.** Post-bronchodilator FEV1/FVC <0.70 (GOLD
  fixed ratio) vs <LLN (z < -1.645; Stanojevic ERJ 2022). Fixed ratio
  over-diagnoses the old, under-diagnoses the young. Pre-BD-only definitions
  (common in UK Biobank) inflate prevalence and mix in asthma.
- **B2 Reference equations.** 2023 ATS statement (Bhakta AJRCCM 2023;207:978)
  recommends race-neutral GLI Global. Switching changes % predicted, GOLD
  grade, PRISm prevalence and trial eligibility. Ask which equation was used.
- **B3 Asthma-COPD misclassification.** Check asthma exclusion,
  reversibility, FeNO. Allowing asthma history can make ICS look better
  (Suissa critique of IMPACT). EHR/claims codes mix the two, especially in
  never-smokers and women.
- **B4 Smoking.** Needs pack-years + current/former + time since quitting.
  Ever/never leaves residual confounding. Current smoking alters
  eosinophils, ICS response, CT emphysema, mortality. Also vaping, biomass,
  occupation, pollution.
- **B5 Reverse causation / sick quitter.** People quit because they get
  symptoms; sicker patients get triple therapy. Lag exposures; washout.
- **B6 Survivorship / healthy smoker.** Old heavy smokers without COPD are a
  resilient selected group. Prefer new-user, active-comparator designs.
- **B7 Immortal time.** Suissa's ICS reanalysis: RR 0.69 → 1.00 with
  time-dependent exposure (AJRCCM 2003;168:49). Require target-trial
  emulation with aligned time zero.
- **B8 ICS pneumonia.** Meta-analysis of 59 RCTs: Peto OR 1.43 (1.34-1.53).
  Likely larger for fluticasone than budesonide; pneumonia ascertainment was
  usually undefined.
- **B9 Eosinophils.** Within-person variability is real (one primary-care
  cohort: ~3% persistently >=300/uL) though some cohorts show ICC ~0.84.
  Check single vs repeated measures, steroid exposure at sampling, smoking,
  pre-specified threshold, continuous vs dichotomised.
- **B10 Exacerbation definitions.** Mostly healthcare-utilisation based, so
  system-dependent. EXACT-PRO captures more. Rome proposal (Celli AJRCCM
  2021) uses objective severity variables; not yet standard. Check event
  separation rules and adjudication.
- **B11 Regression to mean, run-in, withdrawal.** Enrolling >=2
  exacerbations/yr guarantees a placebo fall. IMPACT/ETHOS mortality: Suissa
  argues early benefit reflects abrupt ICS withdrawal in the LAMA/LABA arm;
  trialists reply only ~15-20% had ICS withdrawn and deaths occurred
  throughout. **Present as plausible but contested.**
- **B12 Multiplicity.** Respect the hierarchical testing order; anything
  below the first failed endpoint is descriptive. Pre-specified estimands
  (ICH E9(R1)).
- **B13 Pharmacoepi.** New-user active-comparator, confounding by indication,
  protopathic bias, time-varying confounding, negative controls, E-values.
- **B14 Animal models.** Elastase = fast protease emphysema unlike human
  disease (better for repair than prevention). Smoke models: months, mild,
  strain/dose dependent. Mice lack submucosal glands and have different
  small airways. **Mouse efficacy alone is never strong evidence.**
- **B15 Cells.** BEAS-2B/A549 are not differentiated primary epithelium at
  air-liquid interface (A549 is adenocarcinoma). Count donors, not wells.
- **B16 Single-cell/omics.** Batch masquerades as disease (HLCA integrated
  49 datasets / ~2.4M cells for this reason). Check disease-site confounding,
  pseudo-replication (require pseudobulk or mixed models), tissue source
  (transplant explant vs cancer resection margin).
- **B17 GWAS.** Mostly European ancestry; PRS ~4.5x better in EUR than AFR
  (Martin Nat Genet 2019). Lung-function GWAS ≠ COPD GWAS. Smoking-behaviour
  loci (CHRNA3/5) ≠ lung-biology loci.
- **B18 Collider/selection.** UK Biobank is healthier than the population
  (Fry AJE 2017); conditioning on participation or having spirometry creates
  spurious associations (Munafò IJE 2018). Index-event bias when selecting on
  COPD.
- **B19 Mendelian randomization.** Relevance, independence, exclusion
  restriction. Smoking variants are classic pleiotropy violators. Require
  MR-Egger, weighted median, MR-PRESSO, colocalisation, reverse MR, F-stat,
  sample-overlap check. Report to STROBE-MR.
- **B20 Clinical vs statistical significance.** MCIDs: trough FEV1 ~100 mL;
  SGRQ 4 units; CAT 2 points; 6MWD ~26-30 m. Report absolute differences,
  responder proportions, NNT.

## C. Translational heuristics

- **C1 Human genetics first.** Genetically supported mechanisms are ~2.6x
  more likely to succeed (Minikel Nature 2024). Ask: coding/LoF variant?
  Colocalises with lung cell-type eQTL/pQTL? Direction of effect? PheWAS
  liabilities?
- **C2 Cell specificity.** Is the target expressed in the relevant cell (HLCA)?
  Inhaled delivery widens windows for systemically toxic targets (PDE4).
- **C3 Safety in this population.** Elderly, multimorbid (CVD, osteoporosis,
  diabetes, infection). Immunomodulation → pneumonia/infection watch. Cardiac
  interplay (BLOCK-COPD).
- **C4 Enrichment biomarkers.** Blood eosinophils are the only validated
  predictive biomarker. FeNO, sputum cells, CT mucus plugs emerging.
  Fibrinogen is FDA-qualified for prognostic enrichment.
- **C5 Endpoints.** Exacerbation rate is standard for anti-inflammatories;
  FEV1 for bronchodilators; SGRQ accepted as PRO (FDA 2018). CT metrics
  (%LAA-950, PRM fSAD, mucus plugs) are **not** regulatory surrogates. FEV1
  decline for disease modification needs years and large n.
- **C6 Why COPD trials fail.** No endotyping; animal-derived targets;
  redundant neutrophilic biology; ceiling from background triple therapy;
  regression to mean; noisy utilisation-based endpoints; current smokers
  blunting response; asthma contamination; underpowered phase 2 and winner's
  curse; 52-week trials chasing disease modification.
- **C7 Endotypes / treatable traits.** T2-high vs T2-low; chronic bronchitis
  / mucus; emphysema-predominant; frequent exacerbator; PRISm / early COPD;
  etiotypes (G, D, C, P/E, I, A). A target should map to an endotype with a
  measurable biomarker.
- **C8 Kill criteria up front.** State what result would stop the idea.

## D. Standards to apply

GRADE certainty on every recommendation-like claim. CONSORT 2025 / SPIRIT
2025, ICH E9(R1) estimands. STROBE, RECORD-PE, target-trial emulation,
ROBINS-I/E. STROBE-MR. PRISMA 2020, AMSTAR-2, RoB 2. ARRIVE 2.0. TRIPOD+AI,
PROBAST. STARD. Pre-registration (ClinicalTrials.gov, PROSPERO, OSF).
Effect sizes with 95% CI, absolute and relative, NNT/NNH; never "trend
toward significance". Spirometry: ATS/ERS 2019 acquisition, 2022
interpretation.

## E. Anti-patterns (each one destroys credibility)

1. Causal language from associations (BLOCK-COPD and STATCOPE refuted
   favourable observational data).
2. Citing retracted, predatory or unverified papers. Check DOIs against
   Retraction Watch via Crossref. **Never cite a paper you have not
   retrieved.**
3. Ignoring dose, pack-years, adherence, smoking status at sampling.
4. Targets with no human genetic, expression or pharmacological support.
5. Re-proposing failed ideas as new (anti-IL-5 in unselected COPD, CXCR2,
   anti-TNF, p38).
6. Celebrating sub-MCID effects or relative reductions on low base rates.
7. **Patient-level treatment advice.** Never tell anyone to start, stop or
   switch therapy. Findings are research output for scientists/clinicians.
8. Treating fixed ratio as ground truth; mixing pre/post-BD or
   race-specific/race-neutral equations silently.
9. Treating post hoc subgroups as established.
10. Confusing approved / under review / failed drugs; claiming CT or FEV1
    decline are accepted surrogates.
11. Treating omics differences as biology without batch / donor control.
12. Presenting MR or UK Biobank results as causal without pleiotropy and
    selection diagnostics.
13. False balance or false certainty on contested results.

## F. Five-minute paper read

- **0-1 Provenance & design.** Venue, preprint?, retraction status, funder,
  COI. Design. Registered? Compare registered vs reported primary endpoint.
- **1-2 Population & definitions.** COPD definition and equation; asthma
  excluded?; smoking detail; eosinophil measurement; enrolment exacerbation
  history; run-in; ICS withdrawal.
- **2-3 Primary result.** Effect + CI, absolute difference, NNT, vs MCID;
  placebo rate vs expected; hierarchy respected; early vs late separation.
- **3-4 Bias scan.** Design-specific (B5-B19). Safety signals.
- **4-5 Context.** Consistent with genetics and the graveyard? Replicated?
  Certainty label: **Established / Probable / Plausible-but-contested /
  Speculative**, because …; plus the single analysis that would most change
  the judgment.

**Output template:** claim → evidence type → effect (CI, absolute, vs MCID)
→ main threats → consistency with genetics and prior trials → certainty
label → next decisive test → verified citation(s).
