"""Render the research / strategy Markdown files into styled HTML report pages that share assets/css/hub.css.
Usage: python3 -I tools/render_docs.py
"""
import html
import os
import re

import markdown

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

PAGES = [
    # (source md, output html, page title, eyebrow)
    ('docs/strategy.md', 'docs/strategy.html', 'Digital Strategy', 'Strategy'),
    ('docs/concept-directions.md', 'docs/directions.html', 'Five Creative Directions', 'Directions'),
    ('docs/wordpress-implementation.md', 'docs/wordpress.html', 'WordPress Build Plan', 'Implementation'),
    ('research/competitors.md', 'research/competitors.html', 'Competitor Benchmark', 'Research'),
    ('research/brand-pack.md', 'research/brand-pack.html', 'Brand Content Pack', 'Research'),
]

LINK_MAP = {
    'strategy.md': 'strategy.html', 'concept-directions.md': 'directions.html', 'wordpress-implementation.md': 'wordpress.html',
    'competitors.md': 'competitors.html', 'brand-pack.md': 'brand-pack.html', 'current-site-audit.md': 'index.html',
}

NAV = [('index.html', 'Overview'), ('audit/index.html', 'Audit'), ('research/competitors.html', 'Benchmark'),
       ('docs/strategy.html', 'Strategy'), ('research/brand-pack.html', 'Brand pack'), ('docs/wordpress.html', 'WordPress plan')]

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} — Guglielmo USA Redesign</title>
<meta name="description" content="{desc}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap">
<link rel="stylesheet" href="{up}assets/css/hub.css">
</head>
<body>
<div class="progress" data-m-progress aria-hidden="true"></div>
<header class="mast"><div class="wrap">
  <a class="brand" href="{up}index.html"><img src="{up}assets/img/logo/guglielmo-mark.svg" alt="" width="26" height="26">Guglielmo USA · Redesign</a>
  <nav aria-label="Report sections">{nav}</nav>
</div></header>
<main class="doc wrap">
  <p class="toc"><span class="eyebrow">{eyebrow}</span></p>
  <article class="content" data-m="fade">
{body}
  </article>
</main>
<footer class="foot"><div class="wrap"><span>Prepared for Guglielmo USA (L'Espresso USA) · October 2026</span><a href="{up}index.html">Back to the overview</a></div></footer>
<script src="https://cdn.jsdelivr.net/npm/motion@12.23.24/dist/motion.js"></script>
<script src="{up}assets/js/gusa-motion.js"></script>
<script>GUSA.motion.init({{ distance: 16 }});</script>
</body>
</html>
"""


def render(src, out, title, eyebrow):
    text = open(os.path.join(ROOT, src), encoding='utf-8').read()
    # Python-Markdown needs a blank line before a list that follows a paragraph line
    lines, fixed = text.split('\n'), []
    item = re.compile(r'^\s*([-*+]|\d+\.)\s+')
    for i, ln in enumerate(lines):
        if item.match(ln) and fixed and fixed[-1].strip() and not item.match(fixed[-1]) and not fixed[-1].lstrip().startswith(('|', '#')) \
                and not fixed[-1].startswith((' ', '\t')):
            fixed.append('')
        fixed.append(ln)
    text = '\n'.join(fixed)
    depth = out.count('/')
    up = '../' * depth
    body = markdown.markdown(text, extensions=['tables', 'fenced_code', 'sane_lists', 'toc'])
    # wrap tables for horizontal scroll
    body = body.replace('<table>', '<div class="tablewrap"><table>').replace('</table>', '</table></div>')
    # matrix glyphs
    body = re.sub(r'(?<=>)\s*✓\s*(?=<)', '<span class="yes" aria-label="yes">✓</span>', body)
    body = re.sub(r'(?<=>)\s*◐\s*(?=<)', '<span class="part" aria-label="partial">◐</span>', body)
    body = re.sub(r'(?<=>)\s*✗\s*(?=<)', '<span class="no" aria-label="no">✗</span>', body)
    # internal md links → html
    for k, v in LINK_MAP.items():
        body = body.replace(f'href="{k}"', f'href="{v}"')
    # repo paths in backticks that point at rendered pages become links
    body = body.replace('<code>research/current-site-audit.md</code>', f'<a href="{up}audit/index.html">the site audit</a>')
    first_p = re.search(r'<p>(.*?)</p>', body, re.S)
    desc = re.sub('<[^>]+>', '', first_p.group(1))[:180] if first_p else title
    nav = ''.join(f'<a href="{up}{href}"' + (' aria-current="page"' if href == out else '') + f'>{label}</a>' for href, label in NAV)
    page = TEMPLATE.format(title=html.escape(title), desc=html.escape(desc, quote=True), up=up, nav=nav, eyebrow=eyebrow, body=body)
    open(os.path.join(ROOT, out), 'w', encoding='utf-8').write(page)
    print('wrote', out, len(page) // 1024, 'KB')


if __name__ == '__main__':
    for args in PAGES:
        if os.path.exists(os.path.join(ROOT, args[0])):
            render(*args)
        else:
            print('skip', args[0])
