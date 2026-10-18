#!/bin/bash
# H-20261018-001 genetic-evidence layer for HHIP -> Hedgehog -> SMO. Run 2026-10-18.
# All raw API responses land in raw/. Nothing downloaded is executed.
set -u
S=/home/user/temp/.claude/skills/copd-expert/scripts/biodata.py
G=https://api.platform.opentargets.org/api/v4/graphql
B=/home/user/temp/research/analyses/H-20261018-001
cd "$B" || exit 1

# 1. Open Targets: per-gene COPD association + tractability; COPD top-target ranking
for g in HHIP SMO GLI1 PTCH1; do python3 -I $S ot-target $g > raw/ot_$g.json; done
python3 -I $S ot-targets --n 40 > raw/ot_copd_top40.json
# 1b. provenance of HHIP genetic evidence (which COPD studies / credible sets)
curl -s $G -H 'Content-Type: application/json' -d '{"query":"{ disease(efoId:\"MONDO_0005002\"){ evidences(ensemblIds:[\"ENSG00000164161\"], datasourceIds:[\"gwas_credible_sets\"], size:40){ count rows{ score credibleSet{ study{ id traitFromSource nCases nControls projectId publicationFirstAuthor } } } } } }"}' -o raw/ot_hhip_credsets.json
curl -s $G -H 'Content-Type: application/json' -d '{"query":"{ disease(efoId:\"MONDO_0005002\"){ evidences(ensemblIds:[\"ENSG00000164161\"], datasourceIds:[\"ot_genetics_portal\",\"gwas_credible_sets\",\"eva\",\"gene_burden\",\"finngen\"], size:25){ count rows{ datasourceId score } } } }"}' -o raw/ot_hhip_genetic_evidence.json
# 1c. SMO/GLI1/PTCH1/SHH: any COPD genetic evidence at all? (expect 0)
curl -s $G -H 'Content-Type: application/json' -d '{"query":"{ disease(efoId:\"MONDO_0005002\"){ a: evidences(ensemblIds:[\"ENSG00000128602\"], datasourceIds:[\"gwas_credible_sets\",\"gene_burden\",\"eva\"]){ count } b: evidences(ensemblIds:[\"ENSG00000111087\"], datasourceIds:[\"gwas_credible_sets\",\"gene_burden\",\"eva\"]){ count } c: evidences(ensemblIds:[\"ENSG00000185920\"], datasourceIds:[\"gwas_credible_sets\",\"gene_burden\",\"eva\"]){ count } d: evidences(ensemblIds:[\"ENSG00000164690\"], datasourceIds:[\"gwas_credible_sets\",\"gene_burden\",\"eva\"]){ count } } }"}' -o raw/ot_pathway_genetic_counts.json

# 2. GWAS Catalog v2 associations mapped to each gene; classify traits
for g in HHIP SMO GLI1 PTCH1; do python3 -I $S gwas --gene $g --n 100 > raw/gwas_$g.json; done
python3 -I $S gwas --gene HHIP --n 400 > raw/gwas_HHIP_all.json
python3 -I classify_traits.py | tee raw/trait_classification.txt

# 3. GTEx v8 lung expression + lung eQTLs; HHIP eQTL re-checked in v8 and v10
for g in HHIP SMO GLI1 PTCH1 SHH GLI2; do python3 -I $S gtex-lung $g > raw/gtex_$g.json; done
curl -s "https://gtexportal.org/api/v2/association/singleTissueEqtl?gencodeId=ENSG00000164161.9&tissueSiteDetailId=Lung&datasetId=gtex_v8"  -o raw/gtex_eqtl_HHIP_v8.json
curl -s "https://gtexportal.org/api/v2/association/singleTissueEqtl?gencodeId=ENSG00000164161.10&tissueSiteDetailId=Lung&datasetId=gtex_v10" -o raw/gtex_eqtl_HHIP_v10.json

# 4. Trials + approved indications for SMO inhibitors
for d in vismodegib sonidegib glasdegib taladegib patidegib; do
  python3 -I $S trials --intr $d --cond "COPD OR emphysema OR chronic obstructive" > raw/trials_${d}_copd.json; done
python3 -I $S trials --cond "COPD OR emphysema" --intr "hedgehog OR smoothened" > raw/trials_hh_copd.json
for id in CHEMBL473417 CHEMBL2105737 CHEMBL2043437; do
  curl -s "https://www.ebi.ac.uk/chembl/api/data/drug_indication.json?molecule_chembl_id=${id}&limit=50" -o raw/chembl_ind_$id.json; done

# 5. Direction-of-effect prior art (kill criterion)
python3 -I $S novelty --a "SMO inhibitor" vismodegib "smoothened inhibitor" --c COPD emphysema "chronic obstructive" > raw/novelty_smo_copd.json
python3 -I $S epmc-search 'TITLE_ABS:(Hhip) AND TITLE_ABS:(mice OR mouse OR emphysema)' --n 10 --sort date > raw/epmc_hhip_mouse.json
python3 -I $S pubmed-fetch 41637659 36191777 > raw/pubmed_vismodegib_copd.json
curl -s "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=TITLE:%22Hedgehog-interacting%20protein%20orchestrates%20alveologenesis%22&format=json&resultType=core&pageSize=2" -o raw/epmc_hhip_alveologenesis.json
