import json, re, collections, sys
LUNGKEY = re.compile(r'fev|fvc|vital capacity|lung|pulmonary|respirat|airflow|emphysem|asthma|bronch|copd|chronic obstructive|peak expiratory', re.I)
DECLINE = re.compile(r'declin|progress|longitudin|change in|rate of|slope|annual', re.I)
for g in ('HHIP','SMO','GLI1','PTCH1'):
    d = json.load(open(f'raw/gwas_{g}.json'))
    assoc = d['associations']
    cnt = collections.Counter()
    lung = []
    for a in assoc:
        for t in a['efo_traits']:
            cnt[t['efo_trait']] += 1
            if LUNGKEY.search(t['efo_trait']):
                lung.append((t['efo_trait'], a['p_value'], a['beta'], a.get('or_value','-'),
                             a['snp_allele'][0]['rs_id'] if a['snp_allele'] else '-',
                             a['snp_allele'][0]['effect_allele'] if a['snp_allele'] else '-',
                             a['accession_id'], a['pubmed_id']))
    print(f"\n### {g}: total_in_catalog={d['total']} fetched={len(assoc)} distinct_traits={len(cnt)}")
    print(" top traits:", cnt.most_common(8))
    print(f" lung/respiratory associations fetched: {len(lung)}")
    seen=set()
    for row in lung:
        k=(row[0],row[4])
        if k in seen: continue
        seen.add(k)
        print("  ", " | ".join(map(str,row)), "DECLINE" if DECLINE.search(row[0]) else "")
    print(" decline/progression-type lung traits:", sum(1 for r in lung if DECLINE.search(r[0])))
