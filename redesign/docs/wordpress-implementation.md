# Taking the chosen concept into WordPress + WooCommerce

The five concepts are static, clickable demos on purpose: they let you choose a direction quickly, and their shared
data model (`assets/data/catalog.json`, `assets/js/gusa-kit.js`) already mirrors how WooCommerce should be configured.
Building them straight into WordPress first would have locked in one direction before you had seen five. Once you pick
a direction, it becomes a custom block theme on the existing store.

## 1. Recommended architecture

| Layer | Recommendation | Why |
|---|---|---|
| Theme | **Custom block theme** (Full Site Editing: `theme.json` + HTML templates + block patterns), replacing Enfold | Enfold loads ~48 scripts and ~53 stylesheets per page; a block theme ships only what each page uses, and the team can edit layouts in the Site Editor without a page builder |
| Design tokens | Concept `site.css` custom properties → `theme.json` (`settings.color.palette`, `typography.fontFamilies` with self-hosted fonts, `spacing.spacingSizes`) | One source of truth; editors only pick on-brand colors and type |
| Shop templates | WooCommerce block templates: Product Catalog, Single Product, Product Category, Cart, Checkout (blocks) | Cart/Checkout blocks support express payments and are much faster than the shortcode checkout |
| Filters | WooCommerce **Product Filters** blocks on new global attributes (see §2) | "Fits my machine", format, blend, intensity, audience without a filter plugin |
| Custom blocks | Small custom block plugin (`guglielmo-blocks`) for: intensity rings / sensory chart, compatibility table, cost-per-shot calculator, solution finder, store map, coffee quiz | These are the concept's signature features; port logic from `gusa-kit.js` |
| Hosting | Managed WordPress host with server page cache, Redis object cache, HTTP/3, image CDN | TTFB and LCP targets (§6) |

## 2. Catalog clean-up (do this first; every concept depends on it)
1. **Remove or hide** the public "Order Adjustment" product (make it private; use WooCommerce order edit for adjustments).
2. **Consolidate products into variable products per blend**: e.g. *5 Stelle* with attribute `pa_format` (Whole beans /
   Ground / Fine grind for moka / 36 mm capsules) and `pa_size` (250 g / 1 kg / 20 / 150 ct). Today each size is a separate
   simple product, which duplicates content and splits reviews.
3. **New global attributes:** `pa_system` (36 mm capsule, Espresso 70 / Nespresso®-compatible, ESE 44 mm pod, Traditional),
   `pa_intensity` (1–10), `pa_roast`, `pa_arabica_share`, `pa_audience` (Home, Office, Business). Delete the stray
   `pa_test` attribute and the "Region: Northern Italian" values that confuse a Calabrian brand story (replace with a
   "taste style" attribute if still wanted).
4. **Out of stock (≈40 of 86 products):** decide per item: discontinue (redirect to the closest product), "back soon" with a
   restock-alert form, or hide from catalog. Never leave dead ends in category grids.
5. **"Call for price" machines:** convert to a *quote request* product type (no price, CTA opens the lead form with the
   model prefilled) instead of $0 products.
6. **Images:** re-shoot or source high-resolution packshots (37 of 147 current product images are under 500 px); use
   consistent backgrounds and 1:1 + 4:5 crops; WebP/AVIF delivery.
7. **Copy:** rewrite all product descriptions from `research/brand-pack.md` blend profiles (tasting notes, composition,
   brewing, pairing). Fix typos and conflicting claims across the site.

## 3. Feature → plugin / build map

| Feature (in concepts) | Implementation | Notes |
|---|---|---|
| Subscribe & save | **WooCommerce Subscriptions** (or WooPayments' built-in subscriptions) + "All Products for Subscriptions" for opt-in subscriptions on existing products | Every 2/4/6 weeks, skip/pause in My Account |
| Case discount 5/6/8 % | Keep current bulk-discount rules or move to **WooCommerce Dynamic Pricing / Discount Rules** | Show the tiers on the product page and in the cart |
| Machine + coffee bundles | **WooCommerce Product Bundles** | Replaces "Capsule package choice" variations; cost-per-shot block reads bundle price |
| Bundle builder (Crema) | Product Bundles with optional items, or **Composite Products** | Machine → coffee → accessories steps |
| Coffee finder quiz (Centro) | Custom block (logic from `quiz.html`), results link to products; optional email capture to Klaviyo | Keep it client-side for speed |
| Solution finder + lead forms (Pro) | Custom block + **Gravity Forms** (or Fluent Forms) with conditional logic → CRM (HubSpot free tier works) | Short forms: ≤ 6 fields, progressive profiling |
| Trade portal / reorder (Pro) | **B2BKing** or **Wholesale Suite** for trade roles, tiered pricing, net terms, quick-order form; WooCommerce "Order again" + saved lists | Gate trade pricing behind approved accounts |
| Service bookings | Gravity Forms + calendar booking (e.g. **Amelia** or **Bookly**) or a simple request form routed to the service team | Start with a request form |
| Store locator / map | Custom block rendering the SVG map + list (as in the concepts) from a "Venue" custom post type; or keep **WP Store Locator** restyled | The current WPSL instance shows only 3 entries; venue data lives on the homepage today |
| Loyalty + referral (Quartiere) | **WPLoyalty** (points, tiers, referral) or Smile.io | Replaces the broken refer-a-friend shortcode |
| Reviews | WooCommerce native reviews (verified owners) with **Judge.me** or **CusRev** for review requests by email | Ask every past customer; never seed fake reviews |
| Newsletter | **Klaviyo** (WooCommerce integration) or MailPoet | Replaces the broken `[newsletter]` shortcode |
| Search | WooCommerce product search block + **FiboSearch** (live suggestions, typo tolerance) | "decaf", "capsule", "5 stelle" must return the right things |
| Express checkout | **WooPayments** or **Stripe for WooCommerce** (Apple Pay, Google Pay, Link) + PayPal Payments (already installed) | Authorize.net CIM can stay for saved B2B cards if needed |
| Shipping | Keep UPS live rates; add free-shipping threshold ($59 proposed) and local delivery zones for New England | Show delivery promise on product page |
| Journal / recipes (Calabria, Quartiere) | Native posts + custom "Recipe" pattern; Schema via Rank Math | Replace 2012–2015 health-news page |
| SEO | **Rank Math** or **Yoast**: meta descriptions, Open Graph, Product/Organization/LocalBusiness/Breadcrumb schema; clean sitemap (exclude cart/checkout/legacy `/products-page/`) | 301-redirect legacy URLs |
| Consent & analytics | GA4 + Google Tag Manager via consent banner (Complianz / CookieYes) | None of the concepts load trackers |

## 4. Redirect map (old → new, partial)
| Old URL | New |
|---|---|
| `/products-page/*` (legacy WP e-Commerce) | `/shop/` |
| `/espressoblends/` | `/coffee/` (blend explorer) |
| `/dripcoffee/` | `/shop/?format=drip` |
| `/equipment/`, `/equipment-offering/` | `/machines/` |
| `/join-us/`, `/join-us/business-solutions/*` | `/business/` (+ segment anchors) |
| `/join-us/franchise-info-request/`, `/join-us/more-information/` | `/business/partner/` |
| `/about/distributors/`, `/about/where-to-buy/` (duplicates) | `/find-us/` |
| `/about/the-story-of-guglielmo/`, `/about/production/` | `/our-story/` |
| `/about/the-buzz/` | `/our-story/#customers` |
| `/learn-more/`, `/machine-maintenance/` | `/journal/` and `/business/service/` |
| `/refer-a-friend/`, `/newsletter/` | `/rewards/` and footer signup |

## 5. Phased plan

| Phase | Scope | Indicative effort |
|---|---|---|
| 0. Quick wins (current site) | Fix the top-15 audit items: remove Order Adjustment, fix broken shortcodes, meta descriptions, alt text, typos, contact details, hide dead out-of-stock items | 1 week |
| 1. Foundation | Catalog restructure (§2), block theme with chosen concept's design system, header/footer, Home, Shop, PDP, Cart/Checkout blocks, express pay, redirects, SEO | 5–7 weeks |
| 2. Growth | Subscriptions, bundles, quiz or system chooser, reviews programme, Klaviyo flows (welcome, replenishment, win-back), business landing + solution finder + CRM | 4–6 weeks |
| 3. Trade & community | Trade accounts and quick reorder, service booking, loyalty/referral, journal and recipes, venue map CPT | 4–6 weeks |

## 6. Targets to hold the build to
- Largest Contentful Paint < 2.5 s on 4G mobile, CLS < 0.1, INP < 200 ms; < 25 requests and < 1 MB on product pages.
- WCAG 2.2 AA (contrast, focus, labels, keyboard).
- Every product: ≥ 3 images ≥ 1200 px, full blend profile, compatibility info for single-serve, schema with price/availability.
- Forms: ≤ 6 fields for first contact; response promise shown (e.g. "We reply within one business day").
