# Guglielmo USA — Redesign Concepts: Shared Brief (all 5 concepts)

You are building ONE of five competing website concepts for **Guglielmo USA** (lespressousa.com), the Boston-based
importer of **Caffè Guglielmo**, an Italian espresso roaster from Calabria. The client runs WordPress + WooCommerce today;
these concepts are high-fidelity, clickable, static HTML/CSS/JS demos that will later be implemented as a WordPress block
theme with WooCommerce. Every concept must be **content-rich, image-rich, polished and functional** (filters, cart,
calculators and finders actually work on real catalog data).

## 1. The business in one paragraph
L'Espresso USA was founded in Boston in 2000 by Mimmo (Domenico) Elia and expanded to Canada in 2003. It imports and
distributes Guglielmo coffee across the US through its own operation in Greater Boston plus partner distributors in
Illinois and Pennsylvania. It sells to **consumers** (espresso blends in beans/ground, capsules, ESE pods, home capsule/pod
machines, a Rocket home espresso machine, cups, Brasilena coffee soda) and to **businesses** (cafés, restaurants, pastry shops,
offices, hotels, caterers: wholesale coffee, commercial WEGA/BFC machines and grinders, capsule systems, on-site installation,
service & training, free loaner machines, water treatment, purchase/lease programs). They also recruit **distributors**,
**retailers** and **Guglielmo Point franchisees**. Phone (617) 612-0090 · info@lespressousa.com.

Brand mark: a **bullseye** (orange #F5821F ring, yellow #FFF200 ring, red #ED1C24 center) with a heavy stencil-like
"GUGLIELMO" wordmark whose "i" is dotted with a red ball. Italian tagline **"il caffè che fa centro"** = "the coffee that hits
the mark" (current US tagline: "The coffee that hits the spot"). The bullseye/"hitting the center" idea is the brand's
richest graphic and verbal device — use it with intent.

## 2. Read these files first (they are the source of truth)
- `redesign/research/current-site-audit.md` (+ `.json`) — what is broken today. Your concept must visibly fix these problems.
- `redesign/research/competitors.md` (+ `.json`) — benchmark of Lavazza, illy, Segafredo, Nespresso, distributors etc.
- `redesign/research/brand-pack.md` + `redesign/assets/data/brand.json` — verified company facts, timeline, blend profiles
  (composition, intensity, notes), taglines, story blocks, colors. **Never invent facts** beyond this pack. If you need a
  claim that isn't there, phrase it as a proposal or leave it out.
- `redesign/docs/strategy.md` — the agency's synthesized strategy: audiences, required features, IA.
- `redesign/assets/data/catalog.json` — 86 real products (prices, stock, formats, systems, images). Use `catalog.js`.
- `redesign/assets/img/stock/manifest.json` — curated photo library (pick images by description; credits in CREDITS.md).
- `redesign/assets/img/brand/manifest.json` — Guglielmo brand imagery (packshots, roastery, history).
- `redesign/assets/img/products/` — product packshots (referenced from the catalog). Some are low-res: show them on a
  neutral tile at modest size rather than blowing them up; prefer brand-pack packshots for hero use.
- `redesign/assets/img/logo/` — `guglielmo-logo-color.png` (light backgrounds), `guglielmo-logo-white.png` (dark),
  `guglielmo-mark.svg` (bullseye only). Set "USA" in your own type next to the logo where needed.

## 3. Shared code you must use (do not reimplement)
Load in this order on every page (paths are relative from `redesign/concepts/0N-name/`):
```html
<script src="../../assets/data/catalog.js"></script>
<script src="../../assets/data/brand.js"></script>
<script src="../../assets/data/locations.js"></script>
<script src="../../assets/data/maps.js"></script>   <!-- only on pages with a map -->
<script src="../../assets/js/gusa-kit.js"></script>
<script>GUSA.init({ concept: "0N", root: "../../" });</script>
<script src="js/site.js"></script>
```
Read `redesign/assets/js/gusa-kit.js` — it gives you: `GUSA.products.filter/sort/bySlug/family/machinesFor/coffeeFor/
pricePerUnit/formatLabel`, `GUSA.blend(id)` (brand blend profile), `GUSA.systems` (capsule/pod compatibility),
`GUSA.pricing` (case discount 5/6/8% at 6/12/18, proposed 10% subscribe & save, free shipping ≥ $59, cost-per-shot),
`GUSA.cart` (localStorage cart with summary & onChange), `GUSA.map.svg/project/nearest/geocode` (Boston + US SVG maps —
render counties as fill-only land; neighborhoods carry the detail), `GUSA.forms.demo(form, onSuccess)` (validates and never
submits), `GUSA.img(path)` (prefixes root), `GUSA.esc`, `GUSA.param`, `GUSA.linkTo`.
Product links are `product.html#<slug>` (hash, not query string). `GUSA.param('slug')` reads it. A PDP opened with no hash
must default to `5-stelle-1kg-beans`.

## 4. Required pages (identical set across concepts, so the client can compare)
All in `redesign/concepts/0N-name/`:
1. `index.html` — Home. Must answer in the first screen: what Guglielmo is, why it's different, and two clear paths
   (shop for home / solutions for business). Rich, image-led, content-deep (at least 7 meaningful sections).
2. `shop.html` — Product listing with working client-side filters: Category (Coffee, Capsules & pods, Machines, Gifts &
   cups, Brasilena, Care), **Fits my machine** (system), Format, Blend, For (home/office/business), In-stock toggle, sort,
   result count, active-filter chips, empty state. Out-of-stock products are de-emphasised (or hidden by default with a
   toggle) with "Notify me". Quote-only machines show "Request a quote", never "$0".
3. `product.html` — PDP driven by the hash slug, with: gallery, blend family switcher (format/size options across the
   blend's products), price + per-lb/per-cup price, **Subscribe & save** (every 2/4/6 weeks), case discount table,
   intensity scale + tasting notes + composition + roast (from brand.json), brew guide (espresso / moka / capsule),
   "Fits these machines" for capsules/pods, "Pairs with" cross-sells, shipping/returns promise, reviews area using only the
   two REAL testimonials from the current site (below) plus a "Write a review" CTA, sticky add-to-cart on mobile.
   Machines: specs, what's in the box, cost-per-shot bundle offer (machine + capsule pack), "Tested by our technicians
   before shipping" (true today: the site offers a "Fully test machine operation" option).
4. `business.html` — For Business: segment entry points (Cafés & restaurants, Offices, Hotels & hospitality, Catering &
   retail), services (delivery within 3 business days, installation & calibration, barista training, on-site repair with free
   loaner machine, water treatment, purchase/lease-to-own/consignment), equipment we sell & brands we service, a
   **Solution Finder** (3–4 questions → recommended system + blend + service plan), a SHORT lead form (≤ 6 fields) and a
   "Request a free tasting" CTA, plus routes to Become a distributor / retailer / Guglielmo Point franchise.
5. `story.html` — Our Story: Guglielmo in Calabria (timeline, roastery, quality certifications, Espresso Italiano
   certification) + the Elia family in Boston. Long-form, image-rich.
6. `find.html` — Where to find Guglielmo: SVG map of Greater Boston with pins (GUSA.map) + list, search by ZIP/town
   (GUSA.map.geocode/nearest), filter by type (café, restaurant, pastry), US distributor network map (MA, IL, PA), and a
   "Bring Guglielmo to your venue" CTA. Venues outside the map bounds (Haverhill, Georgetown) are listed with a note.
7. `checkout.html` — A simplified one-page checkout demo built from the live cart (GUSA.cart.summary()): express pay row
   (Apple Pay / Google Pay / PayPal / Shop Pay as styled buttons), contact, shipping, delivery options, payment, order
   summary with savings and free-shipping progress. Submitting shows an in-page confirmation (never navigates/submits).
8. One or more **signature page(s)** specific to your concept (see your direction).

Cross-concept principles from the strategy (non-negotiable): a **"For Home | For Business" switch** in the header
(remember the choice via `GUSA.store`; business mode swaps the primary nav and the primary CTA to "Book a tasting" /
"Get a proposal"); **Shop by your machine** as a first-class way into the catalog (36 mm capsules, Espresso 70
Nespresso®-compatible, ESE 44 mm pods, beans & ground for espresso machine/moka, drip); every product card shows
**Format · Fits · Intensity**; **one intensity scale 1–10** with buckets Mild 1–4 · Balanced 5–7 · Bold 8–10; contact block
with phone (617) 612-0090, info@lespressousa.com and hours (address: write "Greater Boston, MA" — the street address is
pending client confirmation).

Global components on every page: header with logo, primary nav (≤ 6 items), search (opens an overlay that searches the
catalog live), account icon, cart icon with live count, **cart drawer** (line items, qty steppers, subscription badge, savings,
free-shipping progress bar, checkout button → checkout.html); announcement bar (e.g. "Free shipping on orders $59+ ·
Delivery in 3 business days across New England"); rich footer (shop links, business links, company, contact info shown as
text, newsletter signup with GUSA.forms.demo, social links as text labels, legal); mobile nav drawer.

## 5. Real testimonials (the only reviews you may show)
- "I'm so pleased that I finally found the coffee that I love and that I don't have to go all the way to Italy to get it. I
  come from Calabria and that's the only coffee my family drinks!" — Customer in Glen Cove, NY
- "We are so excited that we have found you so that we can now order our favorite coffee… Thanks for the candy, my husband
  felt like it came directly from his Mom in Italy." — A. G., North Royalton, OH
You may design a reviews UI with rating summary as "No ratings yet — be the first", but never fabricate star ratings,
review counts, press quotes or awards.

## 6. Technical rules (hard requirements — the demos are published as a sandboxed web artifact)
- Each page is a complete HTML document (`<!doctype html>`, `<html lang="en">`, `<head>` with charset, viewport
  `width=device-width, initial-scale=1, viewport-fit=cover`, its own `<title>` like "5 Stelle — Guglielmo USA").
- Concept CSS in `css/site.css`, concept JS in `js/site.js` (plus optional page scripts). No build step.
- **External resources: ONLY Google Fonts** (`fonts.googleapis.com` / `fonts.gstatic.com`, always with a fallback stack)
  and, if truly needed, scripts from `https://cdnjs.cloudflare.com` pinned to an exact version. Everything else is blocked:
  **no external images, no iframes (no Google Maps/YouTube), no other CDNs, no analytics**. All images come from
  `../../assets/img/...`. Video: none (use imagery/motion instead).
- No `alert/confirm/prompt`, no `window.print`, no `<a download>`. `mailto:`/`tel:` links may be present but always show the
  address/number as visible text. Forms never submit: use `GUSA.forms.demo`.
- Storage only via the kit (it wraps localStorage in try/catch).
- Responsive from 360px to 1600px. At 390px: no horizontal scrolling (check `document.documentElement.scrollWidth <=
  innerWidth`), min 16px side gutters, tap targets ≥ 44px, readable 16px body text. Grids collapse; tables scroll inside their
  own container.
- Accessibility: semantic landmarks (header/nav/main/footer), one H1 per page, logical headings, alt text on every content
  image (empty alt for decorative), visible focus styles, labels on all inputs, color contrast ≥ 4.5:1 for text, works with
  keyboard (drawers trap/return focus, Esc closes), `prefers-reduced-motion` respected.
- Performance: `loading="lazy"` + `decoding="async"` on below-the-fold images, explicit width/height or aspect-ratio boxes
  to avoid layout shift, no heavy libraries. Animations must start from a visible state (page must look complete
  without scrolling-triggered reveals; reveals may only add subtle motion on top of visible content).
- Commit to your concept's look: a single theme is fine, but set `background` and `color` explicitly on `html/body` and
  every surface (and `color-scheme: dark` on `:root` if your look is dark) so it renders correctly in any host.
- Use CSS custom properties for the design tokens at the top of `site.css` (with a one-line layout-concept comment).
- Typography: Google Fonts only; do NOT use Inter, Roboto, Arial, Space Grotesk, Montserrat, Poppins or Playfair Display.
  Pick faces specific to your direction. Set a type scale and keep to it; `text-wrap: balance` on headings.
- Copy: write real, specific, warm, correct US-English copy (no lorem ipsum, no typos, no clichés like "unforgettable",
  "elevate", "indulge", "journey", no em-dash-heavy prose). Italian words sparingly and correctly accented
  (caffè, cialde, Calabria, "il caffè che fa centro").

## 7. Quality bar & QA (you must do this before you finish)
Use Playwright (Node; `NODE_PATH=/opt/node22/lib/node_modules`, chromium preinstalled at /opt/pw-browsers — never run
`playwright install`). For EVERY page at 1440×900 and 390×844: load via `file://`, capture console errors, check horizontal
overflow, take a full-page screenshot, then LOOK at the screenshots with the Read tool and fix everything that looks off
(overlaps, clipped text, broken images, awkward empty space, inconsistent spacing, bad crops, low-res images blown up).
Exercise the interactions in a script: filter the shop, open a PDP via hash, switch format, subscribe, add to cart, open the
drawer, go to checkout, submit the demo checkout, run the signature tool. Iterate until it is genuinely agency-quality.
Keep only these final screenshots (JPEG ~q70, max 1440 wide) in `redesign/concepts/0N-name/screens/`:
`home-desktop.jpg` (full page), `home-mobile.jpg` (full page), `shop-desktop.jpg`, `product-desktop.jpg`,
`business-desktop.jpg`, `signature-desktop.jpg` — delete any other screenshots you made. Put your QA scripts in the
scratchpad, not in the repo.

## 8. Write `redesign/concepts/0N-name/README.md`
Concept name, one-paragraph thesis, who it's for, what it fixes from the audit (reference finding IDs), IA/sitemap, page
list, signature features, design system (palette tokens with hex, type pairing, grid, motion principles, photography
direction), and WordPress/WooCommerce implementation notes (block theme templates/patterns, which plugins or custom
blocks each feature needs).

Do not modify anything outside your concept folder (shared assets are read-only for you). If you need an extra image
treatment, generate derived files inside your concept folder (e.g. `img/`), keeping the total under 6 MB per concept.
