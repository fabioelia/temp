"""Build the designed audit report (redesign/audit/index.html) from research/current-site-audit.json
and a curated, resized set of screenshots (assets/img/audit/). Usage: python3 -I tools/build_audit.py
"""
import html
import json
import os

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SHOTS = os.path.join(ROOT, 'research/screenshots')
OUT_IMG = os.path.join(ROOT, 'assets/img/audit')
E = lambda s: html.escape(str(s), quote=True)

GALLERY = [
    ('desktop-home-fold.jpg', 'Homepage, desktop', 'A blurred 137 px strip with the tagline set as an image, then icons. Nothing says what is for sale or where to click.', 'HOME-01'),
    ('mobile-home-fold.jpg', 'Homepage, phone', '13 px text, tap targets under 24 px, and the first product is two screens down.', 'MOB-01'),
    ('desktop-shop-fold.jpg', 'Shop', '/shop/ shows three category tiles; filters are single-select link lists.', 'PLP-02'),
    ('mobile-cat-coffee-fold.jpg', 'Coffee category, phone', 'Filters sit 7,762 px down the page, below every product.', 'PLP-02'),
    ('desktop-pdp-coffee-fold.jpg', 'Coffee product page', 'One image, 54 words, no shipping or returns information, no reviews.', 'PDP-01 · PDP-02'),
    ('desktop-pdp-callforprice-fold.jpg', '"Call for Price" machine', 'A $0 product with no quote form or phone number next to it.', 'PLP-04'),
    ('desktop-cart-fold.jpg', 'Cart', '"Apply coupon" is the strongest button; shipping cost is unknown until a full address is entered.', 'CHK-01 · CHK-02'),
    ('desktop-search-decaf-full.jpg', 'Search for "decaf"', 'Blog-style results with author and date, no image, price or stock, and the "Front Page" page as a result.', 'SRCH-01'),
    ('desktop-newsletter-fold.jpg', 'Newsletter page', 'A raw [newsletter] shortcode instead of a signup form; "Refer a friend" shows [tcraf-refer-page].', 'CONT-03'),
    ('desktop-contact-fold.jpg', 'Contact', 'Four unlabelled fields and no phone, email or address anywhere on the page.', 'TRUST-01 · B2B-03'),
    ('desktop-business-solutions-fold.jpg', 'Business solutions', 'The business offer sits under "Join Us" and ends in a 14-field form.', 'NAV-01 · B2B-01'),
    ('desktop-franchise-fold.jpg', 'Franchise request', '13 fields, two essays and a $2.5M net-worth question before any information is shared.', 'B2B-02'),
    ('desktop-equipment-offering-fold.jpg', 'Equipment offering', 'The introduction is white text on a white background.', 'CONT-04'),
    ('desktop-order-adjustment-full.jpg', 'Public "Order Adjustment" product', 'An internal, password-protected $22.31 item is listed publicly and in the sitemap.', 'PLP-05'),
    ('mobile-menu-open-fold.jpg', 'Mobile menu', 'A flat list of 38 links with no hierarchy.', 'NAV-04'),
    ('mobile-pdp-coffee-fold.jpg', 'Product page, phone', 'Small text and controls; no delivery promise near the button.', 'MOB-01 · PDP-02'),
    ('mobile-pdp-coffee-returning-visitor-fold.jpg', 'Returning visitor, phone', 'The buy box falls below the first screen.', 'PDP-05'),
    ('mobile-cart-fold.jpg', 'Cart, phone', 'Shipping cost unknown; coupon field dominates.', 'CHK-01 · CHK-02'),
    ('mobile-checkout-fold.jpg', 'Checkout, phone', '15 visible fields, shipping cost still unknown at the top of the form.', 'CHK-03'),
    ('mobile-business-solutions-fold.jpg', 'Business solutions, phone', 'The first screen is header and breadcrumbs.', 'MOB-02 · NAV-01'),
]

PAGE_LABELS = {
    'home_desktop': 'Home · desktop', 'shop_desktop': 'Shop · desktop', 'category_desktop': 'Category · desktop', 'pdp_desktop': 'Coffee product · desktop',
    'pdp_machine_desktop': 'Machine product · desktop', 'cart_desktop': 'Cart · desktop', 'home_mobile3g': 'Home · mobile 3G', 'pdp_mobile3g': 'Coffee product · mobile 3G',
    'shop_mobile3g': 'Shop · mobile 3G', 'cart_mobile3g': 'Cart · mobile 3G',
}


def prep_gallery():
    os.makedirs(OUT_IMG, exist_ok=True)
    out = []
    for f, title, cap, ref in GALLERY:
        p = os.path.join(SHOTS, f)
        if not os.path.exists(p):
            continue
        im = Image.open(p).convert('RGB')
        mobile = f.startswith('mobile')
        if mobile:
            im = im.crop((0, 0, im.width, min(im.height, round(im.width * 16 / 9))))
            im = im.resize((420, round(im.height * 420 / im.width)), Image.LANCZOS)
        else:
            im = im.crop((0, 0, im.width, min(im.height, round(im.width * 10 / 16))))
            im = im.resize((1100, round(im.height * 1100 / im.width)), Image.LANCZOS)
        name = f.replace('-full', '').replace('-fold', '')
        im.save(os.path.join(OUT_IMG, name), quality=74, optimize=True, progressive=True)
        out.append(dict(src='../assets/img/audit/' + name, title=title, cap=cap, ref=ref, mobile=mobile, w=im.width, h=im.height))
    return out


def ms(v):
    return '–' if v in (None, '') else (f'{v / 1000:.1f} s' if v >= 1000 else f'{round(v)} ms')


def build():
    a = json.load(open(os.path.join(ROOT, 'research/current-site-audit.json'), encoding='utf-8'))
    gal = prep_gallery()
    sev = a['severity_counts']
    total = sum(sev.values())

    # scorecard
    cards = []
    for s in a['scorecard']:
        v = float(s['score'])
        meter = ''.join(f'<i class="{"on" if i < round(v) else ""}"></i>' for i in range(10))
        cards.append(f'<div class="srow"><h4>{E(s["area"])}</h4><div class="gauge"><div class="meter" aria-hidden="true">{meter}</div><span class="val">{E(s["score"])}<small class="muted">/10</small></span></div><p>{E(s["justification"])}</p></div>')

    # top findings: critical + high subset referenced in md top 10 (take first 10 by severity order)
    order = {'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3}
    findings = sorted(a['findings'], key=lambda f: (order.get(f['severity'], 9), f['id']))

    def fcard(f, open_=False):
        rec = f.get('recommendation', '')
        return (f'<article class="finding {E(f["severity"])}" data-area="{E(f["area"])}" data-sev="{E(f["severity"])}">'
                f'<div class="top"><span class="sev">{E(f["severity"])}</span><strong class="num">{E(f["id"])}</strong><h4>{E(f["title"])}</h4></div>'
                f'<details{" open" if open_ else ""}><summary>Evidence and fix</summary><p>{E(f.get("evidence", ""))}</p><p class="rec"><strong>Fix:</strong> {E(rec)}</p></details></article>')

    top10 = ''.join(fcard(f) for f in findings[:10])
    allf = ''.join(fcard(f) for f in findings)
    areas = sorted({f['area'] for f in a['findings']})
    area_chips = ''.join(f'<button type="button" class="chip" data-filter-area="{E(x)}" aria-pressed="false">{E(x)}</button>' for x in areas)
    sev_chips = ''.join(f'<button type="button" class="chip" data-filter-sev="{E(x)}" aria-pressed="false">{E(x)} <span class="num">{sev.get(x, 0)}</span></button>' for x in ['Critical', 'High', 'Medium', 'Low'])

    # gallery
    def fig(g):
        return (f'<figure data-m="rise"><div class="frame"><img src="{g["src"]}" alt="Current site: {E(g["title"])}" loading="lazy" decoding="async" width="{g["w"]}" height="{g["h"]}"></div>'
                f'<figcaption><strong>{E(g["title"])}</strong> <span class="num ref">{E(g["ref"])}</span><br>{E(g["cap"])}</figcaption></figure>')
    figs = ('<div class="gallery">' + ''.join(fig(g) for g in gal if not g['mobile']) + '</div><h3>On a phone</h3><div class="phones">'
            + ''.join(fig(g) for g in gal if g['mobile']) + '</div>')

    # metrics table
    rows = []
    for k, label in PAGE_LABELS.items():
        m = a['metrics'].get(k)
        if not m:
            continue
        rows.append(f'<tr><th scope="row">{E(label)}</th><td class="num">{m.get("requests", "–")}</td><td class="num">{round(m.get("bytes", 0) / 1024):,} KB</td>'
                    f'<td class="num">{m.get("js", "–")} / {m.get("css", "–")}</td><td class="num">{m.get("render_blocking", "–")}</td><td class="num">{ms(m.get("ttfb_ms"))}</td>'
                    f'<td class="num">{ms(m.get("fcp_ms"))}</td><td class="num">{ms(m.get("lcp_ms"))}</td><td class="num">{m.get("cls", "–")}</td><td class="num">{ms(m.get("load_ms"))}</td></tr>')
    perf = ('<div class="tablewrap"><table><thead><tr><th scope="col">Page</th><th scope="col">Requests</th><th scope="col">Transfer</th><th scope="col">JS / CSS files</th>'
            '<th scope="col">Render-blocking</th><th scope="col">TTFB</th><th scope="col">FCP</th><th scope="col">LCP</th><th scope="col">CLS</th><th scope="col">Load</th></tr></thead><tbody>'
            + ''.join(rows) + '</tbody></table></div>')

    arows = []
    for k, v in a['axe'].items():
        tops = ', '.join(f'{t["rule"]} ({t["instances"]})' for t in v.get('top', [])[:4])
        arows.append(f'<tr><th scope="row">{E(k.replace("_", " ").title())}</th><td class="num">{v.get("critical", 0)}</td><td class="num">{v.get("serious", 0)}</td>'
                     f'<td class="num">{v.get("moderate", 0)}</td><td class="num">{v.get("total_instances", "–")}</td><td>{E(tops)}</td></tr>')
    axe = ('<div class="tablewrap"><table><thead><tr><th scope="col">Page</th><th scope="col">Critical rules</th><th scope="col">Serious rules</th><th scope="col">Moderate rules</th>'
           '<th scope="col">Failing nodes</th><th scope="col">Top issues</th></tr></thead><tbody>' + ''.join(arows) + '</tbody></table></div>')

    qw = ''.join(f'<li><span class="num ref">{E(q["refs"])}</span> {E(q["action"])}</li>' for q in a['quick_wins'])
    st = ''.join(f'<li><strong>{E(s["issue"])}.</strong> {E(s["detail"])}</li>' for s in a['structural_issues'])
    cat = a['catalog']
    crawl = a['crawl']

    page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Site Audit — Guglielmo USA Redesign</title>
<meta name="description" content="Audit of lespressousa.com: overall {a['overall_score']}/10, {total} findings across SEO, performance, accessibility, discovery, product pages, checkout, B2B and content.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap">
<link rel="stylesheet" href="../assets/css/hub.css">
<style>
  .overall {{ display: grid; grid-template-columns: auto minmax(0, 1fr); gap: clamp(20px, 4vw, 48px); align-items: center; }}
  @media (max-width: 720px) {{ .overall {{ grid-template-columns: minmax(0, 1fr); }} }}
  .dial {{ width: 180px; aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; text-align: center;
    background: conic-gradient(var(--accent) calc({a['overall_score']} * 36deg), var(--rule) 0); position: relative; }}
  .dial::after {{ content: ""; position: absolute; inset: 14px; border-radius: 50%; background: var(--paper); }}
  .dial span {{ position: relative; z-index: 1; font-family: var(--f-display); font-size: 3.2rem; line-height: 1; }}
  .dial small {{ display: block; font-family: var(--f-text); font-size: .85rem; color: var(--muted); }}
  .sevrow {{ display: flex; flex-wrap: wrap; gap: 8px; }}
  .sevrow span {{ border: 1px solid var(--rule); border-radius: 999px; padding: 4px 12px; font-size: .9rem; background: var(--card); }}
  .gallery figure.m .frame {{ aspect-ratio: 9 / 16; }}
  .gallery .ref, .quick .ref {{ font-size: .75rem; color: var(--accent); margin-right: 6px; }}
  .filters {{ display: flex; flex-wrap: wrap; gap: 8px; }}
  .chip {{ font: inherit; font-size: .85rem; min-height: 40px; border: 1px solid var(--rule); background: var(--card); color: var(--ink); border-radius: 999px; padding: 6px 12px; cursor: pointer; }}
  .chip[aria-pressed="true"] {{ background: var(--ink); color: var(--paper); border-color: var(--ink); }}
  .finding h4 {{ font-size: 1rem; }}
  .finding details summary {{ cursor: pointer; color: var(--muted); font-size: .88rem; }}
  .finding details p {{ margin-top: 8px; }}
  .quick, .struct {{ display: grid; gap: 10px; padding-left: 1.2em; margin: 0; }}
  .count {{ color: var(--muted); font-size: .9rem; }}
</style>
</head>
<body>
<div class="progress" data-m-progress aria-hidden="true"></div>
<header class="mast"><div class="wrap">
  <a class="brand" href="../index.html"><img src="../assets/img/logo/guglielmo-mark.svg" alt="" width="26" height="26">Guglielmo USA · Redesign</a>
  <nav aria-label="Report sections"><a href="../index.html">Overview</a><a href="index.html" aria-current="page">Audit</a><a href="../research/competitors.html">Benchmark</a><a href="../docs/strategy.html">Strategy</a><a href="../research/brand-pack.html">Brand pack</a><a href="../docs/wordpress.html">WordPress plan</a></nav>
</div></header>
<main>
<section class="hero wrap" data-m-hero>
  <span class="eyebrow" data-m="fade" data-m-order="1">Site audit · lespressousa.com · 12 October 2026</span>
  <div class="overall" style="margin-top:12px">
    <div class="dial" role="img" aria-label="Overall score {a['overall_score']} out of 10" data-m="ring" data-m-order="2"><span>{a['overall_score']}<small>out of 10</small></span></div>
    <div style="display:grid;gap:16px">
      <h1 data-m-split data-m-order="3">It sells coffee. It does not sell Guglielmo.</h1>
      <p class="lede" data-m="rise" data-m-order="4">A read-only inspection of every public page, the catalog and the checkout with Playwright, axe-core and network throttling. The store works, but search engines can't index its shop, shoppers can't tell what fits their machine, and business buyers can't find the business.</p>
      <div class="sevrow" data-m="rise" data-m-order="5"><span><strong>{total}</strong> findings</span>{''.join(f'<span>{E(k)} <strong class="num">{v}</strong></span>' for k, v in sev.items())}</div>
    </div>
  </div>
</section>

<section class="section"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">Scorecard</span></div>
  <div class="body"><h2>Thirteen areas, scored 1 to 10.</h2><div class="scorelist" data-m-stagger="0.03">{''.join(cards)}</div></div>
</div></section>

<section class="section"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">Most severe</span></div>
  <div class="body"><h2>Fix these first.</h2><div class="findings">{top10}</div></div>
</div></section>

<section class="section"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">Before</span></div>
  <div class="body"><h2>What visitors see today.</h2><p class="lede">Screens captured on 12 October 2026 at 1440 × 900 and on an iPhone-size viewport. Codes refer to the findings below.</p>{figs}</div>
</div></section>

<section class="section"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">By the numbers</span></div>
  <div class="body">
    <h2>Performance, accessibility, catalog.</h2>
    <div class="stats" data-m-stagger="0.05">
      <div class="stat"><span class="big"><span class="num" data-m-count="{cat['out_of_stock_pct']}" data-m-suffix="%">{cat['out_of_stock_pct']}%</span></span><p>of products out of stock ({cat['out_of_stock']} of {cat['products']}), with no badge in listings.</p></div>
      <div class="stat"><span class="big"><span class="num">{cat['median_unique_images']}</span></span><p>median images per product; median description {cat['median_desc_words']} words.</p></div>
      <div class="stat"><span class="big"><span class="num">{crawl['with_meta_description']}</span><small>/{crawl['sitemap_urls']}</small></span><p>sitemap URLs with a meta description (and {crawl['with_open_graph']} with Open Graph).</p></div>
      <div class="stat"><span class="big"><span class="num">{cat['reviews']}</span></span><p>product reviews across the whole catalog.</p></div>
    </div>
    <h3>Lab performance (cold cache)</h3>
    {perf}
    <p class="muted">Mobile figures use Fast 3G and 4× CPU throttling. Traffic went through an egress proxy, so treat timings as relative; validate against field data (CrUX, Search Console) before setting targets.</p>
    <h3>Accessibility (axe-core 4.10, WCAG 2.2 AA)</h3>
    {axe}
  </div>
</div></section>

<section class="section"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">All findings</span></div>
  <div class="body">
    <h2>Every finding, with evidence and a fix.</h2>
    <div class="filters" role="group" aria-label="Filter by severity">{sev_chips}</div>
    <div class="filters" role="group" aria-label="Filter by area">{area_chips}</div>
    <p class="count" aria-live="polite" id="count">{total} findings shown</p>
    <div class="findings" id="allfindings">{allf}</div>
  </div>
</div></section>

<section class="section"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">This week</span></div>
  <div class="body"><h2>Fifteen quick wins on the current WordPress.</h2><ol class="quick">{qw}</ol></div>
</div></section>

<section class="section"><div class="wrap folio">
  <div class="rail"><span class="eyebrow">Redesign</span></div>
  <div class="body"><h2>What only a redesign fixes.</h2><ol class="struct">{st}</ol>
  <div class="btns"><a class="btn" href="../index.html#concepts" data-m-press>See the five concepts</a><a class="btn ghost" href="../research/current-site-audit.html">Full written report</a></div></div>
</div></section>
</main>
<footer class="foot"><div class="wrap"><span>Audit of https://lespressousa.com/ · 12 October 2026 · read-only, no forms submitted</span><a href="../index.html">Back to the overview</a></div></footer>
<script src="https://cdn.jsdelivr.net/npm/motion@12.23.24/dist/motion.js"></script>
<script src="../assets/js/gusa-motion.js"></script>
<script>
  GUSA.motion.init({{ distance: 18 }});
  (function () {{
    var area = null, sev = null, list = document.getElementById("allfindings"), count = document.getElementById("count");
    function apply() {{
      var shown = [];
      Array.prototype.forEach.call(list.children, function (el) {{
        var ok = (!area || el.dataset.area === area) && (!sev || el.dataset.sev === sev);
        el.hidden = !ok; if (ok) shown.push(el);
      }});
      count.textContent = shown.length + (shown.length === 1 ? " finding" : " findings") + " shown";
      GUSA.motion.list(shown.slice(0, 24));
    }}
    document.querySelectorAll("[data-filter-area],[data-filter-sev]").forEach(function (b) {{
      b.addEventListener("click", function () {{
        var isArea = b.hasAttribute("data-filter-area"), val = b.getAttribute(isArea ? "data-filter-area" : "data-filter-sev");
        var on = b.getAttribute("aria-pressed") !== "true";
        document.querySelectorAll(isArea ? "[data-filter-area]" : "[data-filter-sev]").forEach(function (x) {{ x.setAttribute("aria-pressed", "false"); }});
        b.setAttribute("aria-pressed", on ? "true" : "false");
        if (isArea) area = on ? val : null; else sev = on ? val : null;
        apply();
      }});
    }});
  }})();
</script>
</body>
</html>
'''
    os.makedirs(os.path.join(ROOT, 'audit'), exist_ok=True)
    open(os.path.join(ROOT, 'audit/index.html'), 'w', encoding='utf-8').write(page)
    print('wrote audit/index.html', len(page) // 1024, 'KB; gallery', len(gal))


if __name__ == '__main__':
    build()
