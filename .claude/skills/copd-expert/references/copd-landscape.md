# COPD frontier knowledge map

**Snapshot: 2026-10-17.** This is a starting map, not ground truth. The
field moves monthly (ATS in May, ERS in September, CHEST in October,
company toplines in between). **Before relying on any fact for a
hypothesis, re-verify it against a primary source and refresh this file
when it is stale** (the orchestrator runs a frontier sweep at the start of
each run; see the copd-discovery skill).

Confidence: [H] verified primary/official source; [M] secondary or trade
press; [L] unverified. "⚑" marks a candidate unmade connection worth
probing.

## 0. What changed most in 2025-2026

- **IL-33 is the first non-T2 biologic class to work.** Tozorakimab (AZ;
  blocks reduced IL-33→ST2 *and* oxidised IL-33→RAGE/EGFR): OBERON/TITANIA
  (Sciurba NEJM 2026, doi:10.1056/NEJMoa2606998; ERS 8 Sep 2026), 300 mg
  q4w, former smokers RR 0.71 (0.57-0.88) and 0.66 (0.55-0.80); overall ~0.70;
  effect across all eosinophil strata incl. <150, and in current smokers;
  fewer CT mucus plugs. MIRANDA (q2w) positive topline Apr 2026. BLA
  priority review, decision ~Q1 2027. [H trial / M regulatory]
- **Rest of the IL-33/ST2 class split.** Itepekimab: AERIFY-1 −27%, AERIFY-2
  ~−2% (May 2025); **discontinued in COPD** (Sanofi Q2 2026). Astegolimab
  (anti-ST2): ALIENTO/ARNASA (Papi Lancet 2026), RR ~0.82-0.93, ARNASA primary
  missed. [H] ⚑ *Why does tozorakimab win?* Dual ST2 + RAGE/EGFR blockade vs
  low COVID-era event rates vs former-smoker biology.
- **T2 biologics approved for eosinophilic COPD.** Dupilumab BOREAS/NOTUS
  −30/−34%, FEV1 +83-160 mL; EU Jul 2024, FDA 27 Sep 2024 (BEC ≥300).
  Mepolizumab MATINEE −21% (−35% ED/hospital); FDA 22 May 2025, label BEC
  ≥150 though trial enrolled ≥300. Benralizumab GALATHEA/TERRANOVA (2019) and
  **RESOLUTE (2025) all failed.** [H] ⚑ Eosinophil *depletion* is not the
  mechanism; IL-5/IL-4Rα signalling and IL-13 effects on mucus/smooth muscle
  may be.
- **PDE:** ensifentrine (PDE3/4) FDA Jun 2024; Merck acquired Verona (~$10B,
  Oct 2025); glycopyrrolate FDC in development. Inhaled PDE4 tanimilast
  failed (PILASTER), discontinued Nov 2025. [H]
- **Cardioprotective repurposing keeps failing:** BLOCK-COPD (metoprolol,
  harm), BICS (bisoprolol, IRR 0.97), PACE (bisoprolol, Lancet Respir Med
  2026), pragmatic metoprolol NEJM Evid 2026 HR 0.87 (0.73-1.05). [H]
- **GOLD 2026** (10 Nov 2025): disease activity / low-disease-activity state
  as target; Group E = ≥1 moderate or severe exacerbation; biologics for
  triple-therapy patients with BEC ≥300; case-finding figures; incidental
  emphysema on screening CT; first AI chapter. [H]
- **AATD gene editing in clinic:** BEAM-302 base editor single dose, AAT
  5.0→14.4 µM, Z-AAT −84% (ERS 2026), pivotal cohort. WVE-006 RNA editing
  lower, plateauing. [M-H]

## 1. Definitions and diagnosis

- **GOLD 2023 definition + etiotypes** (Lancet Commission, Stolz Lancet
  2022;400:921): G genetic, D developmental, C cigarette/vaping, P
  pollution/biomass/occupational, I infection (TB, HIV), A asthma, U
  unknown. "Probable COPD" — only 23% met spirometric criteria in a 2025
  validation (PMID 39978605). [H]
- **GOLD 2025:** ensifentrine, dupilumab; dysbiosis section; pre/post-BD
  figure; PH-COPD traits; GLI Global race-neutral equations [M — confirm].
- **GOLD 2026 BEC rules:** ≥300 strongly favours ICS; <100 favours LABA+LAMA;
  repeat BEC 2-3 times. [H]
- **Pre-COPD** (Han AJRCCM 2021). RETHINC (Han NEJM 2022): LABA/LAMA did
  **not** help symptomatic smokers with preserved spirometry. No proven
  therapy. [H]
- **PRISm** (ratio ≥0.70, FEV1 <80%): 5-20%; excess CV and all-cause
  mortality; unstable (Rotterdam: ~49% to COPD, 16% normalise); enriched for
  obesity/diabetes/restriction. [H]
- **Exacerbations:** Rome proposal (Celli AJRCCM 2021) objective severity.
  **BAt model** (Baseline, Acuity, trigger; CICERO, Lancet Respir Med 2026,
  doi:10.1016/S2213-2600(25)00362-5) adds trigger endotypes (bacterial,
  viral, eosinophilic, CV, pauci-inflammatory). [H]
- **CT definitions:** COPDGene 2019 criteria; CT disease with normal
  spirometry progresses like mild COPD. PRM-fSAD precedes emphysema (Galbán
  Nat Med 2012). Mucus plugs predict mortality (Diaz JAMA 2023) and are now a
  trial endpoint. [H]
- **Small airways:** terminal bronchioles lost before emphysema (McDonough
  NEJM 2011; Koo Lancet Respir Med 2018); alveolar attachments the first
  site (PMID 37406359). [H]
- **Dysanapsis** (airway-to-lung size mismatch) is a smoking-independent
  risk factor (Smith JAMA 2020). [H]
- **Trajectories:** ~half of COPD arises from low peak lung function (Lange
  NEJM 2015). FEF25-75 trajectories age 7→53 with parental preconception
  determinants (Liu Lancet Respir Med 2026). Young / early-onset COPD is
  distinct. [H]

## 2. Pathobiology

**Type-2.** ~20-40% eosinophilic. Airway IL-13 signature (POSTN, CLCA1,
SERPINB2; Christenson AJRCCM 2015). BEC dynamic and imperfect.

**IL-33 / ST2 / RAGE.** Epithelial alarmin; COPD basal progenitors expand
IL-33 (Byers JCI 2013). Smoking down-regulates ST2 on ILC2s and shifts to
ILC1/IFN-γ (Kearley Immunity 2015). IL-33 oxidises rapidly (Cohen Nat Commun
2015); oxidised IL-33 signals via RAGE/EGFR → epithelial dysfunction and
mucus (Strickson ERJ 2023 [M]). *AGER* (RAGE) is a major emphysema/lung-
function locus; low sRAGE = more emphysema. ARO-RAGE inhaled siRNA lowers
sRAGE dose-dependently (Nat Med 2026, doi:10.1038/s41591-026-04607-z). ⚑ Drug-
induced sRAGE lowering confounds sRAGE as an emphysema biomarker; is RAGE
silencing protective or harmful to AT1 homeostasis? ⚑ Should *AGER*
genotype or sRAGE predict tozorakimab response?

**TSLP.** Tezepelumab COURSE (Lancet Respir Med 2025) −17% NS; −37% in BEC
≥150 (nominal). Ph3 JOURNEY/EMBARK ~2029. Lunsekimig (TSLP×IL-13) Ph2b/3;
verekitug (TSLPR) Ph2b ~2027. [H]

**Neutrophils, NETs, proteases.** NE, MMP-12 (GWAS locus), cathepsins. NETs
track severity and dysbiosis. CXCR2 antagonists failed. Pegtarazimod
(complement + MPO/NE) BRIGHT Ph2a n=21, oxygenation signal, best with NLR >9
[M]. ⚑ Brensocatib (DPP1) approved for bronchiectasis (Aug 2025 [M]),
untested in COPD.

**Mucus.** MUC5AC excess, relative MUC5B loss; sputum mucin concentration
predicts incident/progressive COPD (Kesimer NEJM 2017). Plugs persist for
years. ARO-MUC5AC exists [L status].

**Epithelial progenitors.** Basal-cell exhaustion; distal human-specific
progenitors RASC/TASC, SCGB3A2+ (Basil Nature 2022; Murthy Nature 2022) lost
or misdirected. AT2 stress/exhaustion (Sauler Nat Commun 2022). **snRNA-seq
of 141 lungs + spatial + proteomics (Zhang…Sauler Nat Genet 2026;58:376,
doi:10.1038/s41588-025-02480-z): regenerative epithelial states peak in early
disease then decline**; inflamed non-immune / pro-fibrotic niches rise;
plasma proteins map to cell states. ⚑ Therapeutic window in early disease.
AT2 cells are a genetic-susceptibility hub across respiratory diseases [M].

**Aging.** Senescence (p16/p21, SASP), telomeres (*TERT* emphysema),
PINK1 mitophagy → necroptosis (Mizumura JCI 2014), ferroptosis via NCOA4/GPX4
(Yoshida Nat Commun 2019), iron (*IREB2*, Cloonan Nat Med 2016), NAD+/
sirtuins. Senolytics reduce SASP ex vivo/mice; **no human COPD senolytic
trial results.** Proteomic organ-aging clocks (Nat Med 2026) untested as
COPD endpoints. [H/M]

**Adaptive immunity.** B-cell follicles increase with stage (Hogg NEJM
2004); anti-elastin autoantibodies; CD8 TRM, Th17; smoking imprints
long-lasting immune changes (Saint-André Nature 2024 [M]).

**Vascular.** VEGF loss → endothelial apoptosis; CT vascular pruning;
pulmonary-vascular COPD phenotype; inhaled treprostinil PERFECT stopped.

**Microbiome/virome.** Proteobacteria dominance ↔ neutrophilic inflammation;
rhinovirus; interferon deficiency. T2 immune history trains macrophages for
viral tolerance (Nature 2026). ⚑ Explains differing viral responses in
eosinophilic vs non-eosinophilic COPD?

**Epigenetics / somatic.** AHRR, F2RL3; GrimAge acceleration; sex-specific
methylation. After quitting, near-normal stem-cell clones repopulate airway
(Yoshida Nature 2020). ⚑ Exploitable regenerative reserve.

**CHIP.** Associated with COPD and lower FEV1%; Tet2 loss worsens smoke
emphysema (Miller Blood 2022). Little new large data since. ⚑ CHIP/IL-1β/IL-6
as COPD↔CVD bridge.

**Cardiopulmonary and cancer.** CV events peak 30 days post-exacerbation;
THARROS (NCT06283966) tests a cardiopulmonary composite. Emphysema 2-3x lung
cancer risk. **Swanton Cell 2026 (doi:10.1016/j.cell.2026.05.005):** 14-protein
plasma signature predicts lung cancer >5 y ahead; PM/EGFR/IL-1β drive a
KRT8+/CLDN4+ alveolar transitional state; IL-1β blockade limits PM tumour
promotion. ⚑ Same transitional states appear in COPD/IPF injury niches → a
shared COPD→cancer field effect.

**Sex.** Women: airway-predominant, higher risk per pack-year, severe early-
onset; mechanism unresolved.

**Non-smoking COPD** (~25-45% globally): biomass, PM2.5, occupation, post-TB,
prematurity/BPD, asthma, HIV. Biomass COPD: airway-predominant, less
emphysema, more eosinophilia. Trials exclude these patients.

## 3. Genetics and omics

- GWAS: Hobbs 2017 (22 loci); Sakornsakolpat Nat Genet 2019 (82); **Shrine
  Nat Genet 2023 (n≈580k, 1,020 signals, 559 genes)**; TOPMed WGS 2025 (LY86,
  MAGI1, GRK7; fine-mapped HTR4, RIN3); He…Martin Nat Genet 2026 (25 new
  East-Asian loci, PRSxtra). [H]
- Key loci: *HHIP*, *FAM13A*, *CHRNA3/5-IREB2*, *AGER*, *DSP* (opposite
  direction in IPF), *MMP12*, *SERPINA1* (Z, S), *TNS1*, *HTR4*, *ADGRG6*,
  *THSD4*, *TGFB2*, *RIN3*, *DDT/MIF*, *CYP2A6*, *SFTPD*. Many act in
  development (etiotype D).
- PRS: top vs bottom decile OR ~4-7 (Moll Lancet Respir Med 2020); not in
  clinic.
- Rare: SERPINA1 ZZ/MZ; TERT/TERC.
- MR: low sRAGE causal for emphysema [M]; proteomic MR hits incl. MMP12,
  IL-6R [M]; GLP-1 and IL-1 MR inconsistent [L].
- Biomarkers: fibrinogen FDA-qualified 2015 (prognostic enrichment); sRAGE;
  SP-D; CC16 (low from childhood → low lung function); UKB Olink COPD
  ProteinScore ~10 y ahead (Gadd Nat Aging 2024).

## 4. Pipeline (Oct 2026)

| Agent | Trials | Status | Conf |
|---|---|---|---|
| Dupilumab (IL-4Rα) | BOREAS, NOTUS | Approved, BEC ≥300 | H |
| Mepolizumab (IL-5) | MATINEE | Approved (FDA label ≥150) | H |
| Benralizumab (IL-5R) | GALATHEA, TERRANOVA, RESOLUTE | All failed | H |
| Tozorakimab (IL-33) | OBERON, TITANIA, MIRANDA | Positive; FDA decision ~Q1 2027 | H/M |
| Itepekimab (IL-33) | AERIFY-1/2 | Split; discontinued | H |
| Astegolimab (ST2) | ALIENTO, ARNASA | Marginal | H |
| Tezepelumab (TSLP) | COURSE → JOURNEY/EMBARK | Ph3 ~2029 | H |
| Lunsekimig (TSLP×IL-13) | Ph2b/3 | Ongoing | H |
| Verekitug (TSLPR) | VENTURE | ~2027-28 | H |
| Rademikibart (IL-4Rα), *acute* exacerbation | Seabreeze Ph2 | −81% treatment failure (company) | M |
| Ensifentrine (PDE3/4) | ENHANCE | Approved Jun 2024 | H |
| Tanimilast (inh. PDE4) | PILASTER/PILLAR | Failed | H |
| β-blockers | BLOCK-COPD, BICS, PACE | Neutral/harm | H |
| Triple therapy mortality | IMPACT, ETHOS | Contested (ICS-withdrawal debate) | H |
| ICS de-escalation BEC <300 | COPERNICOS (ERS 2026) | No significant harm; NI not formally shown | M |
| Azithromycin | Albert 2011, BACE | Works, mostly non-eos former smokers | H |
| Statins | STATCOPE | Negative | H |
| Metformin | Small RCTs negative | Undertested | M |
| GLP-1 RA | Observational ~20% fewer exacerbations | **No RCT** ⚑ | H |
| Senolytics / NAD+ | Preclinical | — | H |
| Regenerative | Retinoids, MSCs failed; P63+ progenitor Ph1 | Stalled | M/L |
| AAT augmentation | RAPID slowed density loss | SPARTA unknown | L |
| Efdoralprin alfa (AAT-Fc) | ElevAATe Ph2 | Superior functional AAT | H |
| Fazirsiran (RNAi) | REDWOOD Ph3 | No readout found | M |
| BEAM-302 | Ph1/2 | Pivotal cohort | H |
| Alvelestat (NE, AATD) | Ph3 planned 2027 | — | M |
| ARO-RAGE (inh. siRNA) | Ph1/2a | Target engagement | H/L |

**Meta-lessons:** COVID-era trials under-ran event rates; former-smoker
splits matter (smoking suppresses ST2 / oxidises IL-33); nothing modifies
FEV1 decline or emphysema progression; biologic effects cluster at 20-35%.

## 5. Cohorts and what they share

| Cohort | Content | Access |
|---|---|---|
| COPDGene | ~10k NHW/AA smokers, 10 y, insp/exp CT, WGS, RNA-seq, SomaScan | dbGaP phs000179, BioData Catalyst |
| SPIROMICS | ~2.9k, SOURCE young smokers, mucins, bronchoscopy | dbGaP / BioLINCC |
| ECLIPSE | 2,164, 3 y, biomarkers, rapid decliners | dbGaP phs001252 |
| MESA Lung | Population CT, proteomics, dysanapsis | BioLINCC / dbGaP |
| UK Biobank | 500k, spirometry, WGS, Olink (UKB-PPP) | Application |
| LTRC | Lung tissue + CT; transcriptome GSE47460 | GEO public |
| Lung Health Study | Cessation, long-term mortality | BioLINCC |
| TOPMed | WGS across cohorts | dbGaP |
| HLCA / LungMAP | >2.4M cells; developmental atlas | CELLxGENE public |
| SpiroMeta / UKB, FinnGen, BBJ | Lung-function / COPD GWAS | **Summary stats public** |
| Airway brushings (Spira/Lenburg, Groningen) | Bronchial transcriptomes (e.g., GSE37147) | GEO public |

## 6. Open problems (ranked) — where new connections matter

1. **Susceptibility:** why only ~20-30% of heavy smokers get COPD, and why
   ~25-45% of patients never smoked. Gene × exposure × development.
2. **No disease-modifying therapy;** no feasible endpoint (PRM-fSAD, CT
   density, mucus score, proteomic/aging clocks?).
3. **Regeneration failure:** progenitor exhaustion, niche signals (WNT, FGF,
   hedgehog/HHIP), senescence; early-disease window (Nat Genet 2026).
4. **IL-33 paradox** across tozorakimab / itepekimab / astegolimab; AGER/sRAGE
   as response predictor?
5. **Eosinophil biology:** anti-IL-5R fails, anti-IL-5 and IL-4Rα partly
   work; need better T2 biomarker.
6. **Non-T2 / neutrophilic (~60%)**: IL-33, IL-1, complement, DPP1,
   microbiome.
7. **Exacerbation endotyping** in real time (Rome, BAt); acute biologics.
8. **Early detection / pre-COPD / PRISm:** who progresses; RETHINC failed;
   PRS + proteomic + CT stratification unbuilt.
9. **Early-life origins:** raising peak lung function; mechanisms of
   developmental loci.
10. **COPD-CVD causal link:** CHIP, IL-1β/IL-6, hyperinflation, hypoxaemia,
    post-exacerbation thrombosis; β-blockers fail.
11. **COPD → lung cancer:** PM/IL-1β transitional states, immune exclusion,
    CHIP; can one blockade prevent both?
12. **Small-airway disappearance** mechanism.
13. **Mucus plugs:** driver or marker; does clearing them change mortality?
14. **Sex and ancestry** mechanisms; equity of race-neutral equations.
15. **Non-tobacco etiotypes** excluded from trials.
16. **Accelerated aging** hypothesis; untested geroprotectors; clocks as
    surrogates.
17. **Metabolic repurposing** (GLP-1 RA, SGLT2i): weight/hyperinflation vs
    direct mechanism; no RCT.
18. **Microbiome causality;** macrolide-responder signature.
19. **AATD editing:** does AAT >11 µM halt density loss? MZ population.
20. **Trial methodology:** post-COVID low event rates; new composites; GOLD
    2026 "low disease activity".
21. **Single-cell communities → plasma-measurable strata** predicting drug
    response.

## 7. People and labs

- Channing/Brigham: Silverman, Cho, Hersh, Moll (genetics, PRS, CHIP);
  DeMeo (sex, epigenetics); Washko, San José Estépar, Diaz (quantitative CT,
  mucus plugs); Celli (Rome).
- Barcelona: Agustí (GOLD, trajectories); Faner (B cells, omics).
- Michigan: Han (pre-COPD). UAB: Bhatt (PRISm, BOREAS/NOTUS). Weill Cornell:
  Martinez (early COPD), Choi (mitophagy).
- Manchester: Singh (early-phase), Vestbo (COPERNICOS).
- Leicester: Brightling, Greening (IL-33, CICERO); Wain, Tobin (GWAS).
- KCL: Bafadhel (eosinophils). Kiel: Rabe. Pittsburgh: Sciurba. Temple:
  Criner.
- Yale: Sauler, Kaminski (single-cell atlas). Penn: Morrisey; Duke: Tata
  (distal progenitors).
- UBC: Sin, Hackett, Leung (biomarkers, micro-CT). Leuven: Vanaudenaerde,
  Janssens.
- UCSF: Woodruff, Christenson (T2 COPD). Groningen: van den Berge.
- Baylor: Polverino (B cells, metformin). Melbourne: Dharmage
  (trajectories). Pune: Salvi (biomass). Beijing: Chen Wang.
- Crick: Swanton (PM/IL-1β). MGH/Broad: Martin (multi-ancestry PRS);
  Natarajan, Miller (CHIP).
- AATD: McElvaney, Stockley, Barjaktarevic.

**Where results surface first:** ATS (May), ERS (Sept), CHEST (Oct);
company press releases and SEC 6-K/10-Q (discontinuations); medRxiv/bioRxiv;
ClinicalTrials.gov / EU CTIS terminations; then NEJM, Lancet, Lancet Respir
Med, AJRCCM, ERJ, Nat Genet / Nat Med.

**Unverified as of snapshot:** SPARTA results; fazirsiran REDWOOD readout;
TILIA; ARO-MUC5AC status; whether GOLD 2025 mandated GLI Global; P63+ cell
therapy Ph2; brensocatib COPD trials; MIRANDA effect sizes; COPERNICOS
effect sizes; mepolizumab EU COPD status.
