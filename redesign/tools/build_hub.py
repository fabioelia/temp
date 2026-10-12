"""Build the presentation hub (redesign/index.html) from the research data and the concept folders.
Also crops screenshot thumbnails into assets/img/hub/.  Usage: python3 -I tools/build_hub.py
"""
import html
import json
import os

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
E = lambda s: html.escape(str(s), quote=True)

CONCEPTS = [
    dict(id='01-centro', n='01', name='Centro', tag='Italian pop modernism, built on the bullseye',
         thesis='Guglielmo owns one of the most graphic marks in coffee. Centro turns the bullseye and "il caffè che fa centro" into a full brand system: concentric rings, flat brand primaries, poster-scale type and a coffee finder that literally hits the mark.',
         audience='Home espresso drinkers, capsule owners, gift buyers, new customers',
         signature=['"Hit your mark" coffee-finder quiz', 'Intensity rings on every product', 'Subscribe & save on every coffee', 'Blend explorer by packaging colour'],
         pages=[('index.html', 'Home'), ('shop.html', 'Shop'), ('product.html', 'Product'), ('quiz.html', 'Coffee finder'), ('business.html', 'Business'), ('story.html', 'Story'), ('find.html', 'Find us'), ('checkout.html', 'Checkout')],
         motion='Snappy, springy, poster-like: rings rotate into place, a marquee of blend names, a bullseye ripple when the quiz lands.'),
    dict(id='02-calabria', n='02', name='Calabria', tag='Editorial heritage, told like a magazine',
         thesis='A roaster founded in Catanzaro in 1943 and roasting on the Ionian coast since 1972 deserves to be told like a magazine. Calabria positions Guglielmo next to illy: slow photographic chapters, a Tasting Room for every blend, and commerce placed inside the stories.',
         audience='Discerning home buyers, Italian-American loyalists, press and partners',
         signature=['Tasting Room with sensory profiles and blend comparison', 'Il Giornale magazine and long-form article', 'Scroll-drawn 1943 to today timeline', 'Shoppable "blend in this story" modules'],
         pages=[('index.html', 'Home'), ('shop.html', 'Shop'), ('product.html', 'Product'), ('tasting.html', 'Tasting Room'), ('journal.html', 'Il Giornale'), ('article.html', 'Article'), ('business.html', 'Business'), ('story.html', 'Story'), ('find.html', 'Find us'), ('checkout.html', 'Checkout')],
         motion='Slow tide: shutter reveals on photographs, gentle parallax, headlines that rise word by word, a timeline scrubbed by scroll.'),
    dict(id='03-pro', n='03', name='Pro', tag='Guglielmo Professional, business first',
         thesis='Wholesale, equipment and service for New England businesses, plus new distributors, are the growth engine. Pro leads with outcomes and makes the tasting, proposal and reorder flows effortless, with real cost-per-cup and margin maths. The consumer shop stays one click away.',
         audience='Café, restaurant and pastry owners, office managers, hotels, distributors',
         signature=['4-step Solution Finder with cost per cup, margin and lease estimate', 'Trade portal: reorder with PO, invoices, equipment, tickets', 'Service hub with triaged requests and maintenance checklists', 'Partner programmes: distributor, retailer, Guglielmo Point'],
         pages=[('index.html', 'Home'), ('solutions.html', 'Solution Finder'), ('portal.html', 'Trade portal'), ('service.html', 'Service'), ('partners.html', 'Partners'), ('business.html', 'Business'), ('shop.html', 'Shop'), ('product.html', 'Product'), ('story.html', 'Story'), ('find.html', 'Find us'), ('checkout.html', 'Checkout')],
         motion='Precise instrument: short, exact transitions; numbers that tween as inputs change; wizard steps that slide; no decoration.'),
    dict(id='04-crema', n='04', name='Crema', tag='A dark, cinematic showroom for machines and systems',
         thesis='Three incompatible single-serve systems confuse buyers today. Crema makes the choice effortless and the ritual desirable with cinematic product storytelling, then sells the machine and coffee together on an honest cost per shot.',
         audience='Machine buyers, capsule and pod owners, gift buyers',
         signature=['"Choose your system" comparison and recommender', 'Bundle builder with live cost per shot and yearly savings', 'Generative crema hero and scroll-scrubbed product scenes', 'Machine pages with spec callouts and compatible coffees'],
         pages=[('index.html', 'Home'), ('systems.html', 'Choose your system'), ('bundle.html', 'Bundle builder'), ('shop.html', 'Shop'), ('product.html', 'Product'), ('business.html', 'Business'), ('story.html', 'Story'), ('find.html', 'Find us'), ('checkout.html', 'Checkout')],
         motion='Cinematic: a generative crema swirl, sticky product scenes scrubbed by scroll, cards that re-order with spring physics.'),
    dict(id='05-quartiere', n='05', name='Quartiere', tag="Boston's Italian coffee family, community first",
         thesis='A family-run Boston importer whose Calabrian coffee is poured from the North End to Belmont, delivered in three business days and serviced in person. Quartiere builds the brand around people and places, makes finding Guglielmo central, and keeps loyal customers with a passport and referrals.',
         audience='Greater Boston locals, the Italian-American community nationwide, local venues',
         signature=['Il Quartiere: map-led venue stories', 'Il Passaporto loyalty stamp card and referral', 'Italian coffee recipes with the right blend', 'Locator with ZIP search and distributor map'],
         pages=[('index.html', 'Home'), ('community.html', 'Il Quartiere'), ('rewards.html', 'Il Passaporto'), ('recipes.html', 'Recipes'), ('find.html', 'Find us'), ('shop.html', 'Shop'), ('product.html', 'Product'), ('business.html', 'Business'), ('story.html', 'Our family'), ('checkout.html', 'Checkout')],
         motion='Friendly bounce: map pins drop with springs, stamps thunk onto the card, postcards tilt, awnings drift.'),
]

# feature × concept: 2 = signature / most developed, 1 = present
MATRIX = [
    ('For Home | For Business switch', [1, 1, 2, 1, 1]),
    ('Shop by your machine + compatibility on every product', [1, 1, 1, 2, 1]),
    ('One intensity scale (1–10) with tasting notes', [2, 2, 1, 1, 1]),
    ('Subscribe & save, case-discount tiers', [2, 1, 1, 1, 1]),
    ('Cart drawer, free-shipping progress, one-page checkout', [1, 1, 1, 1, 1]),
    ('Map of venues + distributor network', [1, 1, 1, 1, 2]),
    ('Business solution finder + short lead form', [1, 1, 2, 1, 1]),
    ('Coffee-finder quiz', [2, 0, 0, 0, 0]),
    ('Tasting Room: sensory profiles, compare blends', [0, 2, 0, 0, 0]),
    ('Magazine and long-form storytelling', [0, 2, 0, 0, 1]),
    ('Trade portal: reorder, invoices, equipment', [0, 0, 2, 0, 0]),
    ('Service hub and maintenance checklists', [0, 0, 2, 0, 0]),
    ('Cost-per-cup, margin and lease calculators', [0, 0, 2, 1, 0]),
    ('System chooser (36 mm / Espresso 70 / ESE / beans)', [1, 0, 0, 2, 0]),
    ('Machine + coffee bundle builder', [0, 0, 0, 2, 0]),
    ('Loyalty passport and referral', [0, 0, 0, 0, 2]),
    ('Recipes', [0, 0, 0, 0, 2]),
]


def thumbs():
    out = os.path.join(ROOT, 'assets/img/hub')
    os.makedirs(out, exist_ok=True)
    have = {}
    for c in CONCEPTS:
        sd = os.path.join(ROOT, 'concepts', c['id'], 'screens')
        got = {}
        for kind, src, box, w in (('desk', 'home-desktop.jpg', (1440, 990), 1200), ('phone', 'home-mobile.jpg', None, 360)):
            p = os.path.join(sd, src)
            if not os.path.exists(p):
                continue
            im = Image.open(p).convert('RGB')
            if kind == 'desk':
                crop_h = min(im.height, round(im.width * box[1] / box[0]))
                im = im.crop((0, 0, im.width, crop_h))
            else:
                crop_h = min(im.height, round(im.width * 19 / 9))
                im = im.crop((0, 0, im.width, crop_h))
            im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            name = f"{c['id']}-{kind}.jpg"
            im.save(os.path.join(out, name), quality=78, optimize=True, progressive=True)
            got[kind] = 'assets/img/hub/' + name
        have[c['id']] = got
    return have


def load_audit():
    p = os.path.join(ROOT, 'research/current-site-audit.json')
    if not os.path.exists(p):
        return None
    try:
        return json.load(open(p, encoding='utf-8'))
    except Exception:
        return None


def competitor_scores():
    c = json.load(open(os.path.join(ROOT, 'research/competitors.json'), encoding='utf-8'))
    sc = {}
    for row in c['matrix']:
        for k, v in row['values'].items():
            sc[k] = sc.get(k, 0) + {'yes': 1, 'partial': 0.5}.get(v, 0)
    return sorted(sc.items(), key=lambda x: -x[1]), len(c['matrix'])


def build():
    th = thumbs()
    audit = load_audit()
    scores, nfeat = competitor_scores()

    # ---- stats
    stats = [
        ('11.5', f'/{nfeat}', 'Feature score on our benchmark matrix. The 17 benchmarks score 25.5 to 43.'),
        ('101', '', 'Script and stylesheet files loaded on every page (48 scripts, 53 stylesheets).'),
        ('40', '/86', 'Products out of stock in the live catalog, still shown in category grids.'),
        ('0', '', 'Product reviews, meta descriptions and structured-data blocks on content pages.'),
        ('44', ' words', 'The whole "Story of Guglielmo" page, for a roaster founded in 1943.'),
    ]
    metric_line = ''
    if audit and isinstance(audit.get('metrics'), dict):
        m = audit['metrics']
        key = next((k for k in m if 'home' in k.lower()), None)
        if key:
            hm = m[key]
            parts = []
            if hm.get('requests'): parts.append(f"{hm['requests']} requests")
            if hm.get('bytes'): parts.append(f"{round(hm['bytes'] / 1048576, 1)} MB")
            if hm.get('lcp_ms'): parts.append(f"LCP {round(hm['lcp_ms'] / 1000, 1)} s")
            if parts:
                metric_line = 'Homepage today: ' + ' · '.join(parts) + '.'
    stat_html = ''.join(
        f'<div class="stat"><span class="big"><span class="num" data-m-count="{E(v)}" data-m-decimals="{1 if "." in v else 0}">{E(v)}</span><small>{E(s)}</small></span><p>{E(t)}</p></div>'
        for v, s, t in stats)

    # ---- scorecard
    score_html = ''
    if audit and audit.get('scorecard'):
        cards = []
        for s in audit['scorecard']:
            v = s.get('score', 0)
            try:
                v = float(v)
            except Exception:
                v = 0
            meter = ''.join(f'<i class="{"on" if i < round(v) else ""}"></i>' for i in range(10))
            cards.append(f'<div class="score"><div class="row"><h4>{E(s.get("area", ""))}</h4><span class="val num">{E(s.get("score", ""))}<small class="muted">/10</small></span></div><div class="meter" aria-hidden="true">{meter}</div><p>{E(s.get("justification", ""))}</p></div>')
        score_html = f'<div class="scores" data-m-stagger="0.04">{"".join(cards)}</div>'

    # ---- benchmark bars
    top = max(v for _, v in scores)
    bars = []
    for name, v in scores:
        us = 'Guglielmo' in name
        bars.append(f'<div class="bar{" us" if us else ""}"><span>{E(name)}</span><span class="track"><span class="fill" style="width:{v / nfeat * 100:.1f}%"></span></span><span class="num">{v:g}</span></div>')
    bars_html = f'<div class="bars" data-bars>{"".join(bars)}</div>'

    # ---- plates
    plates = []
    for c in CONCEPTS:
        t = th.get(c['id'], {})
        base = f"concepts/{c['id']}/"
        desk = f'<img src="{t["desk"]}" alt="{E(c["name"])} concept, homepage on desktop" loading="lazy" decoding="async" width="1200" height="825">' if t.get('desk') else f'<div class="pending">Screens pending</div>'
        phone = f'<div class="phone"><img src="{t["phone"]}" alt="{E(c["name"])} concept, homepage on a phone" loading="lazy" decoding="async" width="360" height="760"></div>' if t.get('phone') else ''
        links = ' · '.join(f'<a href="{base}{f}">{E(l)}</a>' for f, l in c['pages'])
        sig = ''.join(f'<li>{E(s)}</li>' for s in c['signature'])
        plates.append(f'''
<article class="plate" id="concept-{c['n']}">
  <a class="shots" href="{base}index.html" aria-label="Open the {E(c['name'])} concept" data-m="rise">
    <div class="desk" data-m-hover="lift">{desk}</div>{phone}
  </a>
  <div class="info" data-m-stagger="0.05">
    <span class="idx">CONCEPT {c['n']}</span>
    <h3>{E(c['name'])}</h3>
    <p class="lede">{E(c['tag'])}.</p>
    <p>{E(c['thesis'])}</p>
    <p class="muted"><strong>Built for:</strong> {E(c['audience'])}</p>
    <ul class="chips">{sig}</ul>
    <p class="muted"><strong>Motion:</strong> {E(c['motion'])}</p>
    <div class="btns"><a class="btn" href="{base}index.html" data-m-press>Open concept</a><a class="btn ghost" href="{base}README.md">Design notes</a></div>
    <p class="pagelinks">{links}</p>
  </div>
</article>''')

    # ---- matrix
    head = ''.join(f'<th class="c" scope="col">{c["n"]} {E(c["name"])}</th>' for c in CONCEPTS)
    rows = []
    for feat, vals in MATRIX:
        cells = ''.join('<td class="c">' + {2: '<span class="yes" title="Signature feature">●</span>', 1: '<span class="part" title="Included">○</span>', 0: '<span class="muted">–</span>'}[v] + '</td>' for v in vals)
        rows.append(f'<tr><th scope="row">{E(feat)}</th>{cells}</tr>')
    matrix_html = f'<div class="tablewrap"><table><thead><tr><th scope="col">Feature</th>{head}</tr></thead><tbody>{"".join(rows)}</tbody></table></div><p class="muted">● signature feature, most developed · ○ included · – not in this concept. Every concept can borrow any feature from the others.</p>'

    principles = [
        ('Two clear doors', 'A For Home | For Business switch in the header, each with its own navigation and main action.'),
        ('Shop by your machine', '36 mm capsules, Espresso 70 (Nespresso®-compatible), ESE pods, beans and ground: compatibility on every product.'),
        ('One intensity scale', '1 to 10 for every blend, with roast, composition, tasting notes and the best way to brew it.'),
        ('No dead ends', 'Out-of-stock items get "Notify me", quote-only machines say "Request a quote", and the public "Order Adjustment" item goes.'),
        ('Visible value', 'Case discounts, subscribe & save, free-shipping progress and honest cost-per-cup maths, shown where people decide.'),
        ('Short forms first', 'Six fields or fewer for a first contact, a tasting offer on every business page.'),
        ('One source of facts', 'Founded 1943, Copanello roastery since 1972, L\'Espresso USA since 2000: the same everywhere.'),
        ('Fast and accessible', 'A real performance budget, WCAG 2.2 AA, alt text, meta descriptions and structured data on every template.'),
    ]
    princ_html = ''.join(f'<li><strong>{E(a)}.</strong> {E(b)}</li>' for a, b in principles)

    roadmap = [
        ('Week 1', 'Quick wins on today\'s site', 'Remove "Order Adjustment", fix the broken newsletter and referral pages, add meta descriptions, alt text and contact details, hide dead out-of-stock items, correct typos and conflicting claims.'),
        ('Weeks 2–8', 'Foundation', 'Catalog restructure (variable products per blend, system and intensity attributes), block theme in the chosen direction, Home, Shop, Product, Cart and Checkout blocks, express payments, redirects, SEO.'),
        ('Weeks 9–14', 'Growth', 'Subscriptions, bundles, the quiz or system chooser, reviews programme, email flows, business landing and solution finder wired to a CRM.'),
        ('Weeks 15–20', 'Trade and community', 'Trade accounts and quick reorder, service booking, loyalty and referral, journal and recipes, venue map.'),
    ]
    road_html = ''.join(f'<div class="stat"><span class="eyebrow">{E(a)}</span><h4>{E(b)}</h4><p>{E(c)}</p></div>' for a, b, c in roadmap)

    decisions = [
        'Which direction (or which mix: for example Centro\'s brand system with Pro\'s business tooling and Crema\'s system chooser).',
        'The public business address: Guglielmo\'s distributor list shows 266 Calvary St, Waltham, MA 02453; the site says Boston.',
        'Heritage claims to use everywhere: founded 1943 by Guglielmo Papaleo in Catanzaro; roastery at Copanello since 1972.',
        'Commercial policies shown in the demos: 10% subscribe & save, free shipping at $59, a tasting kit, "Give $10, get $10" referral.',
        'Proposed intensity scores and tasting notes for each blend (Guglielmo publishes none) and the Extra Bar composition conflict.',
        'Photography: a press kit from Guglielmo SpA, high-resolution packshots, and a local shoot with partner venues in Boston.',
    ]
    dec_html = ''.join(f'<li>{E(d)}</li>' for d in decisions)

    audit_link = '<a class="btn" href="audit/index.html" data-m-press>Read the full audit</a>' if os.path.exists(os.path.join(ROOT, 'audit/index.html')) else ''
    thumbs_strip = ''.join(
        f'<a href="#concept-{c["n"]}" class="mini" data-m-hover="lift"><span class="num">{c["n"]}</span> {E(c["name"])}</a>' for c in CONCEPTS)

    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Guglielmo USA Redesign</title>
<meta name="description" content="Audit, competitor benchmark, strategy and five clickable design concepts for the Guglielmo USA website (lespressousa.com).">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap">
<link rel="stylesheet" href="assets/css/hub.css">
<style>
  .hero .grid {{ display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: clamp(24px, 5vw, 72px); align-items: end; }}
  @media (max-width: 900px) {{ .hero .grid {{ grid-template-columns: minmax(0, 1fr); }} }}
  .hero .mark {{ width: min(260px, 60vw); aspect-ratio: 1; justify-self: end; }}
  @media (max-width: 900px) {{ .hero .mark {{ display: none; }} }}
  .minis {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }}
  .mini {{ text-decoration: none; border: 1px solid var(--rule); background: var(--card); border-radius: 999px; padding: 8px 14px; font-weight: 600; min-height: 44px; display: inline-flex; align-items: center; gap: 8px; }}
  .mini .num {{ color: var(--accent); font-size: .8rem; }}
  .princ {{ list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 14px 28px; }}
  .princ li {{ border-top: 2px solid var(--ink); padding-top: 10px; }}
  .decide {{ display: grid; gap: 10px; padding-left: 1.2em; margin: 0; }}
  .pending {{ display: grid; place-items: center; height: 100%; color: var(--muted); font-family: var(--f-mono); font-size: .85rem; }}
  .files {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap: 12px; }}
  .files a {{ display: grid; gap: 4px; text-decoration: none; border: 1px solid var(--rule); border-radius: var(--radius); padding: 14px 16px; background: var(--card); }}
  .files a span {{ color: var(--muted); font-size: .88rem; }}
</style>
</head>
<body>
<div class="progress" data-m-progress aria-hidden="true"></div>
<header class="mast"><div class="wrap">
  <a class="brand" href="index.html"><img src="assets/img/logo/guglielmo-mark.svg" alt="" width="26" height="26">Guglielmo USA · Redesign</a>
  <nav aria-label="Sections"><a href="#concepts">Concepts</a><a href="#findings">Findings</a><a href="#benchmark">Benchmark</a><a href="#principles">Strategy</a><a href="#roadmap">Roadmap</a><a href="#decisions">Decisions</a></nav>
</div></header>
<main>
<section class="hero wrap" data-m-hero>
  <div class="grid">
    <div>
      <p class="eyebrow" data-m="fade" data-m-order="1">Website redesign proposal · lespressousa.com · October 2026</p>
      <h1 data-m-split data-m-order="2">Five ways to make Guglielmo USA hit the mark online.</h1>
      <p class="lede" style="margin-top:22px" data-m="rise" data-m-order="3">We audited the current site, benchmarked it against Lavazza, illy, Nespresso, Segafredo and the importers who do this best, and built five complete, clickable concepts on your real catalog. Each one fixes the same fundamentals and takes a different bet on how Guglielmo should grow.</p>
      <div class="minis" data-m="rise" data-m-order="4">{thumbs_strip}</div>
    </div>
    <img class="mark" src="assets/img/logo/guglielmo-mark.svg" alt="" width="260" height="260" data-m="ring" data-m-order="2">
  </div>
</section>

<section class="section" id="findings"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">01 · Where the site stands</span></div>
  <div class="body">
    <h2>A great coffee on a 2014 website.</h2>
    <p class="lede">The product is distinctive, certified and loved by the people who find it. The site makes it hard to find, hard to choose and hard to trust, and it hides the business offer behind "Join Us".</p>
    <div class="stats" data-m-stagger="0.05">{stat_html}</div>
    {f'<p class="muted">{E(metric_line)}</p>' if metric_line else ''}
    {score_html}
    <div class="btns">{audit_link}</div>
  </div>
</div></section>

<section class="section" id="benchmark"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">02 · Benchmark</span></div>
  <div class="body">
    <h2>How Guglielmo USA compares.</h2>
    <p class="lede">We scored 17 sites against {nfeat} features across shopping, subscriptions, business services, equipment and service, locators, content, trust and technical basics (✓ = 1, partial = ½).</p>
    {bars_html}
    <p class="muted">The gap is in table stakes, not polish: compatibility, intensity, filters, subscriptions, reviews, contact details and SEO. The closest models are importers that bundle coffee, equipment, service and finance (Faema Canada, Chris' Coffee) and a Guglielmo distributor in Vienna (Wake Up Espresso).</p>
    <div class="btns"><a class="btn" href="research/competitors.html" data-m-press>Read the benchmark</a><a class="btn ghost" href="research/brand-pack.html">Brand content pack</a></div>
  </div>
</div></section>

<section class="section" id="principles"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">03 · What every concept fixes</span></div>
  <div class="body">
    <h2>Eight principles, in all five designs.</h2>
    <ul class="princ" data-m-stagger="0.05">{princ_html}</ul>
    <div class="btns"><a class="btn ghost" href="docs/strategy.html">Read the strategy</a><a class="btn ghost" href="docs/directions.html">The five directions</a></div>
  </div>
</div></section>

<section class="section" id="concepts"><div class="wrap">
  <div class="folio" style="margin-bottom:clamp(32px,5vw,64px)"><div class="rail"><span class="eyebrow">04 · Five concepts</span></div>
  <div class="body"><h2>Pick a direction, or mix them.</h2><p class="lede">Every concept is a working, multi-page site on the real catalog: filters, product pages, cart, checkout, maps and calculators all work. Animation in all five is built on Motion. Open one, add something to the cart, try its signature tool.</p></div></div>
  <div class="plates">{''.join(plates)}</div>
</div></section>

<section class="section"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">05 · Compare</span></div>
  <div class="body"><h2>What each concept prototypes.</h2>{matrix_html}</div>
</div></section>

<section class="section" id="roadmap"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">06 · Roadmap</span></div>
  <div class="body">
    <h2>From demo to WordPress in about twenty weeks.</h2>
    <p class="lede">The chosen direction becomes a custom block theme on your existing WooCommerce store, replacing Enfold. Quick wins on today's site can start this week.</p>
    <div class="stats" data-m-stagger="0.06">{road_html}</div>
    <div class="btns"><a class="btn" href="docs/wordpress.html" data-m-press>WordPress build plan</a></div>
  </div>
</div></section>

<section class="section" id="decisions"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">07 · Decisions for you</span></div>
  <div class="body">
    <h2>What we need from you.</h2>
    <ol class="decide">{dec_html}</ol>
    <h3 style="margin-top:20px">Everything in this proposal</h3>
    <div class="files">
      <a href="audit/index.html"><strong>Site audit</strong><span>Scorecard, findings, screenshots, quick wins</span></a>
      <a href="research/competitors.html"><strong>Competitor benchmark</strong><span>17 sites, feature matrix, patterns, IA</span></a>
      <a href="research/brand-pack.html"><strong>Brand content pack</strong><span>Verified facts, timeline, blend profiles, stories</span></a>
      <a href="docs/strategy.html"><strong>Strategy</strong><span>Audiences, principles, features, navigation</span></a>
      <a href="docs/directions.html"><strong>Creative directions</strong><span>The five bets and their visual languages</span></a>
      <a href="docs/wordpress.html"><strong>WordPress build plan</strong><span>Theme, plugins, catalog clean-up, redirects</span></a>
    </div>
  </div>
</div></section>
</main>
<footer class="foot"><div class="wrap"><span>Prepared for Guglielmo USA (L'Espresso USA) · October 2026</span><span>Photography: Unsplash, Pexels and open-licence sources (see assets/img/stock/CREDITS.md); brand imagery © Guglielmo S.p.A.</span></div></footer>
<script src="https://cdn.jsdelivr.net/npm/motion@12.23.24/dist/motion.js"></script>
<script src="assets/js/gusa-motion.js"></script>
<script>
  GUSA.motion.init({{ distance: 22 }});
  (function () {{
    var M = window.Motion, bars = document.querySelector("[data-bars]");
    if (!GUSA.motion.live || !bars) return;
    M.inView(bars, function () {{
      M.animate(bars.querySelectorAll(".fill"), {{ scaleX: [0, 1] }}, {{ duration: 0.9, ease: GUSA.motion.tokens.ease, delay: M.stagger(0.035) }});
    }}, {{ amount: 0.25 }});
  }})();
</script>
</body>
</html>
'''
    open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(page)
    print('wrote index.html', len(page) // 1024, 'KB; thumbs:', {k: list(v) for k, v in th.items()})


if __name__ == '__main__':
    build()
