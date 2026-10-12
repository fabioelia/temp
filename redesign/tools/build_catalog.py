import json,re,os,sys
S=sys.argv[1]; OUT=sys.argv[2]
d=json.load(open(f'{S}/crawl/catalog.json'))
info=json.load(open('/home/user/temp/redesign/assets/img/products/_info.json'))
def clean(t):
    t=re.sub(r'\s+',' ',t or '').strip()
    fixes={'prefect':'perfect','of of':'of','steam want':'steam wand','softners':'softeners'}
    for a,b in fixes.items(): t=t.replace(a,b)
    return t
BLEND_BY_SLUG={
 '5-stelle':'5-stelle','extra-bar':'extra-bar','espresso-bar':'espresso-bar','espresso-classico':'espresso-classico',
 'caffetteria':'caffetteria','copacabana':'copacabana','club-99':'club-99','oro70':'oro70','rosso70':'rosso70','dek70':'dek70',
 'cz-capsules':'catanzaro','organic':'organic','special-edition':'silver-signature','decaf':'decaf','premium':'premium-drip','french-roast':'french-roast',
}
out=[]
for p in d:
    s=p['slug']; n=p['name']
    if s=='order-adjustment': continue
    cats=p['cats']; fmt=p['attrs'].get('Format',[])
    name=clean(n).replace('ROCKET APPARTAMENTO TCA (CHROME/BLACK) + ESPRESSO','Rocket Appartamento TCA').replace('OFFICE PLUS VAP','Office Plus VAP').replace('ESPRESSO PLUS VAP','Espresso Plus VAP').replace('  ',' ')
    # category
    lname=n.lower()
    if 'brasilena' in lname: cat='beverage'
    elif any(k in lname for k in ['cup set','glass','caramelle','candy']): cat='merch'
    elif 'Gift Packs' in cats: cat='gift'
    elif any(k in lname for k in ['puly','cleaner','softener','o-ring','screen']): cat='care'
    elif 'kit' in lname: cat='supplies'
    elif 'machine' in lname or 'grinder' in lname or 'rocket' in lname: cat='machine'
    elif any(k in lname for k in ['capsule','pods','pod ']): cat='single-serve'
    else: cat='coffee'
    # format/system
    system=None; form=None
    if cat=='single-serve':
        if '70' in n and 'Capsule' in n or 'ORO70' in n or 'ROSSO70' in n or 'DEK70' in n: system='nespresso-original'; form='capsule'
        elif 'Pods' in n or 'pod' in lname:
            system='ese-44' if '38' not in n else 'pod-38'; form='pod'
        else: system='espresso-point-36'; form='capsule'
    elif cat=='machine':
        if 'Pod' in n: system='ese-44'
        elif 'Compatible' in n: system='nespresso-original'
        elif 'Cap' in n or 'CAPS' in n or 'COMO' in n or 'Tube' in n or 'FOX' in n: system='espresso-point-36'
        else: system='traditional'
    elif cat=='coffee':
        if 'Drip' in n or 'drip' in s:
            form='drip-beans' if 'Beans' in n else 'drip-ground'
        elif 'Beans' in n or 'beans' in s: form='beans'
        else: form='ground'
    # blend
    blend=None
    for k,v in BLEND_BY_SLUG.items():
        if k in s: blend=v; break
    if cat=='single-serve' and blend is None:
        blend='decaf' if 'decaf' in s else 'espresso-classico'
    if cat in('machine','care','beverage','merch','supplies'): blend=None
    if s=='organic-espresso': blend='organic'
    if s=='threecanespresso' or s=='pitcher-classico': blend='espresso-classico'
    if 'jar' in s and '5-stelle' in s: blend='5-stelle'
    # size
    size=None
    m=re.search(r'(\d+(?:\.\d+)?)\s?(kg|g)\b',n,re.I)
    if m: size=m.group(1)+(' kg' if m.group(2).lower()=='kg' else ' g')
    m2=re.search(r'\((\d+)\s?(Pack|pack)\)|(\d+)\s?Ct|(\d+)\s?Pack',n)
    if m2:
        c=next(x for x in m2.groups() if x and x.isdigit())
        size=f'{c} ' + ('pods' if form=='pod' else 'capsules' if form=='capsule' else 'pack')
    if 'Drip' in n and not size: size='5 lb case' if p['price'] and p['price']>50 else '12 oz'
    # audience
    ideal=p['attrs'].get('Ideal For',[])
    aud=[a.lower() for a in ideal]
    if 'Commercial' in cats or 'Commercial' in ideal: aud=sorted(set(aud+['business']))
    if not aud:
        aud=['home','office'] if cat in ('single-serve','coffee','gift','merch','beverage','care','supplies') else ['home']
    if cat=='coffee' and size in ('1 kg','6 kg'): aud=sorted(set(aud+['business']))
    if 'Drip' in n and p['price'] and p['price']>50: aud=['office','business']
    aud=[a.replace('commercial','business') for a in aud]
    price=p['price'] if p['price'] else None
    regular=p['regular'] if p['regular'] and p['regular']!=p['price'] else None
    imgs=[]
    for i in range(4):
        k=f'{s}__{i}'
        if k in info: imgs.append('assets/img/products/'+info[k]['file'])
    brand=(p['attrs'].get('Brand') or ['Guglielmo'])[0].replace('PANAFE`','Panafe').replace('ESPRESSO del CAPITANO','Espresso del Capitano').replace('GRIMAC','Grimac')
    if 'rocket' in s: brand='Rocket Espresso'
    if 'brasilena' in s: brand='Brasilena'
    if 'puly' in s.lower(): brand='Puly'
    if s=='wega-and-other-commercial-machines': brand='WEGA / BFC'
    desc=clean(p['desc'])
    desc=re.sub(r'^Inquire today\s*','',desc)
    deal=clean(p['short']) if 'deal' in (p['short'] or '').lower() else None
    out.append(dict(id=p['id'],slug=s,name=name,category=cat,blend=blend,format=form,system=system,size=size,
        price=price,compare_at=regular,quote=price is None,in_stock=p['stock'],variable=p['type']=='variable',
        audience=aud,brand=brand,images=imgs,description=desc,bundle_offer=deal,
        region_style=p['attrs'].get('Region'),original_url=p['url']))
order={'coffee':0,'single-serve':1,'machine':2,'gift':3,'merch':4,'beverage':5,'care':6,'supplies':7}
out.sort(key=lambda x:(order[x['category']],x['blend'] or 'zz',x['name']))
meta=dict(source='https://lespressousa.com/wp-json/wc/store/v1/products (crawled 2026-10-12)',
 systems={'espresso-point-36':'Guglielmo 36 mm capsules — fit Lavazza Espresso Point®-type machines (Espresso del Capitano, RDL, Panafe)',
          'nespresso-original':'Espresso 70 line (ORO70/ROSSO70/DEK70) — compatible with Nespresso® Original-line machines',
          'ese-44':'E.S.E. 44 mm paper pods (cialde) — fit any ESE pod machine (Grimac, RDL)',
          'pod-38':'38 mm pods — discontinued','traditional':'Traditional portafilter espresso machine (beans/ground)'},
 notes='Prices in USD. quote=true means "call for price" today. Case discount on coffee: 5% (6+), 6% (12+), 8% (18+). Order Adjustment item removed.')
json.dump(dict(meta=meta,products=out),open(OUT,'w'),indent=1,ensure_ascii=False)
from collections import Counter
print(Counter(x['category'] for x in out)); print(Counter(x['system'] for x in out)); print(Counter(x['blend'] for x in out))
for x in out: print(f"{x['category']:12} {str(x['blend']):18} {str(x['format']):12} {str(x['system']):20} {str(x['size']):14} {str(x['price']):8} {x['in_stock']!s:5} {','.join(x['audience']):22} {x['name']}")
