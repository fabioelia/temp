"""Wrap assets/data/*.json as window globals so the concept pages work from file:// and inside the artifact viewer."""
import json, os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'data')
for src, var in (('catalog.json', 'GUSA_CATALOG'), ('brand.json', 'GUSA_BRAND')):
    p = os.path.join(D, src)
    if not os.path.exists(p):
        print('skip', src); continue
    data = json.load(open(p, encoding='utf-8'))
    out = os.path.join(D, src.replace('.json', '.js'))
    open(out, 'w', encoding='utf-8').write(f'/* generated from {src} by tools/build_data_js.py */\nwindow.{var} = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('wrote', out, os.path.getsize(out) // 1024, 'KB')
