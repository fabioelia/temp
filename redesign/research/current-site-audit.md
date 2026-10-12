# Guglielmo USA (lespressousa.com): Current-Site Audit

**Audit date:** 12 Oct 2026  |  **Site:** https://lespressousa.com/ (WordPress + WooCommerce, Enfold 8.2, WP Engine behind Cloudflare)  |  **Purpose:** evidence base for the full redesign

**Method:** live, read-only inspection with Playwright/Chromium (desktop 1440x900; iPhone 390x844 at DPR 2), Chrome DevTools Protocol network and CPU throttling, axe-core 4.10.2 (WCAG 2.0/2.1/2.2 A and AA plus best-practice), and a polite crawl of all 191 sitemap URLs plus 166 further internal URLs (148 discovered paths and 18 sampled facet/search URLs) and 28 external links. The catalog API export covers 87 products. One item was added to the cart; checkout was observed but not filled or submitted. No forms were submitted and no accounts were created.

> Caveat: traffic went through an egress proxy, so absolute timings are indicative. Use them to compare pages and conditions, not as field data. Validate against CrUX and Search Console before setting targets.

## 1. Executive summary

**Overall score: 3.2 / 10.** The site works as a basic WooCommerce store, but it looks and behaves like a 2014 Enfold template. It hides its two biggest assets: Guglielmo's 70+ year Italian heritage, and a real B2B service operation (equipment, service, wholesale). Search engines and shoppers have trouble finding what is for sale.

- **SEO is broken at the foundation.** Every category, shop, tag and brand page is `noindex` (Enfold default; no SEO plugin). robots.txt blocks 52 of 54 CSS/JS files from Googlebot. Not one of the 191 URLs has a meta description or Open Graph tag. Only the 87 product pages and 26 content pages can rank, and two of those pages are the cart and the account login.
- **The catalog undermines conversion.** 40 of 87 products (46%) are out of stock with no badge in listings. 5 machines are $0 'Call for Price' with no quote CTA. 7 password-protected products (including an internal 'Order Adjustment') are public and in the sitemap. There are 0 reviews.
- **Discovery and PDPs are thin.** /shop/ shows 3 tiles. Filters are single-select link lists that sit 7,762px down the page on mobile. Search returns blog-style results without images or prices. PDPs have a median of 1 image and 54 words, with no shipping or returns info.
- **Checkout basics are fine** (guest checkout, PayPal/Venmo, Google Pay, single page), but **shipping cost stays invisible until a full address is entered**, and the coupon field is the most prominent element in the cart.
- **B2B, the higher-value audience, is under-served.** It sits behind 'Join Us', with a 14-field inquiry form, a 13-field franchise form asking about a $2.5M net worth, no phone on the B2B or Contact pages, a PDF distributor application, an empty 'Distributors' tab and no case studies.
- **Mobile and accessibility fall short.** Throttled mobile LCP is 7.2-13.8s and CLS 0.33 on home. There is no visible focus indicator, contrast failures on every page (up to 102 nodes), and up to 15 unlabeled fields per form. The median mobile font is 13px and about 70-75% of tap targets are under 24px.
- **Content credibility suffers.** 15+ typos ('prefect', 'avalble', 'conviniance', 'Gugliemo', 'LONGUES', 'experiance'), conflicting facts (60 vs 70 years; 20 vs 25 years; 7 vs 8 blends; 6 drip blends, cold brew and 'locally roasted' claimed vs 3 drip blends sold), raw shortcodes on /newsletter/ and /refer-a-friend/, invisible white text on /equipment-offering/, and 2006-2015 health claims.

Findings: **65** total (2 Critical, 23 High, 31 Medium, 9 Low).

### Scorecard

| Area | Score (1-10) | Justification |
|---|:---:|---|
| Brand & Storytelling | **3** | 70+ years of Italian roasting heritage is buried: the hero is a 137px strip using a 284x300 thumbnail stretched to 1440px with tagline-as-image, About is 3 paragraphs about 'L'Espresso USA', and 'The Story of Guglielmo' has 44 words plus an outbound link. |
| Visual Design | **3** | Stock 2014 Enfold template: grey 13px text, faint ghost buttons, mixed icon styles, 2014-15 product photos (75 of 156 catalog images) and inconsistent card layouts. It reads as dated and generic, not premium Italian. |
| Navigation & IA | **4** | The Shop mega-menu is usable, but B2B sits behind the vague label 'Join Us'. 'About' is not clickable, 'Espresso Blends' sits under About, Learn More anchors are wrong, Equipment pages are not in the menu, and the mobile menu is a flat list of 38 links. |
| Product Discovery | **3** | /shop/ shows only 3 tiles, filters are single-select link lists that sit 7,762px down on mobile, 46% of SKUs are out of stock with no label, and search returns blog-style results with no images or prices. |
| Product Detail Pages | **4** | The buy box is clean and the case-discount table is a real asset. But the median is 1 image and 54 words of description, there are no reviews or shipping/returns info, an internal 'Equipment Test' option is exposed to buyers, and 'Call for Price' pages have no quote CTA. |
| Cart & Checkout | **5** | Guest checkout plus PayPal/Venmo/Google Pay on a single page is solid. However, shipping cost is invisible until a full address is entered, 'Apply coupon' is the dominant button in the cart, and there is no express pay on the cart or PDP. |
| B2B Lead Generation | **3** | Leads go through a 14-field form (9 required) or a 13-field franchise form (9 required, $2.5M net-worth question). There is no phone on the B2B or Contact pages, the distributor path is a PDF, the Distributors tab is empty, and the pages contradict each other. |
| Mobile | **3** | On 3G with 4x CPU throttling, LCP is 7.2-13.8s and CLS is 0.33 on home. 73% of tap targets on home are under 24px, the median font is 13px, filters sit below the products, and the PDP buy box falls below the fold for returning visitors. |
| Performance | **4** | Desktop is acceptable (LCP 1.4-2.8s), but every page makes 120-136 requests (~50 CSS + ~55 JS, 56-61 render-blocking). Images are already served as WebP by content negotiation; GTM, Smartlook and Turnstile load sitewide. |
| Accessibility | **3** | Every audited page has critical axe violations. Contrast failures range from 14 to 102 nodes per page. There is no visible focus indicator, no skip link and 42 header tab stops; CF7 forms have up to 15 unlabeled fields, and 63% of images lack alt text. |
| SEO | **2** | /shop/ and all 18 categories, 5 tags and 11 brands are noindex (Enfold default; no SEO plugin). robots.txt blocks 52 of 54 CSS/JS files. There are 0 meta descriptions and 0 OG tags, about 41% of sitemap URLs cannot be indexed, and the homepage H1 is 'Front Page'. |
| Content Quality | **3** | 15+ typos and contradictory facts (60 vs 70 years, 20 vs 25 years, 7 vs 8 blends, 6 drip blends claimed vs 3 sold). Also: 2 broken shortcodes, invisible white text, health claims from 2006-2015 and 7 password-protected products published. |
| Trust & Social Proof | **2** | 0 reviews across 87 products and only 2 undated testimonials. No phone, email or address in the header, footer or Contact page; no shipping policy; '© Copyright Guglielmo USA -' with no year. Social links point to the Italian parent page. |
| **Overall (mean)** | **3.2** | |

### The 10 most severe findings

1. **SEO-01** (Critical): /shop/, 18 categories, 5 tags and 11 brands are `noindex`, so all commercial landing pages are excluded from Google.
2. **SEO-02** (Critical): robots.txt blocks /wp-content/plugins, /wp-content/themes, /wp-includes and every `?` URL. 52 of 54 CSS/JS files cannot be fetched for rendering, and there is no Sitemap directive.
3. **PLP-01** (High): 46% of SKUs are out of stock with no listing badge; the homepage features 2 of them. No back-in-stock alerts, and Gift Packs are 6/6 out of stock.
4. **HOME-01** (High): No value proposition, product or CTA above the fold: a blurred 137px hero strip with an image tagline, then icons.
5. **CHK-01** (High): Shipping cost is not shown in the cart or checkout until a full address is entered. No calculator, threshold or shipping policy.
6. **NAV-01 / B2B-01** (High): B2B is hidden behind 'Join Us'. The inquiry form has 14 fields (9 required) and no phone fallback; the Contact page has no phone, email or address.
7. **SRCH-01** (High): Search returns blog-style results (author and date, no image, price or stock), includes 'Front Page', has no synonyms ('decaf' misses DEK70) and no autocomplete.
8. **TRUST-01 / TRUST-02 / PDP-02** (High): 0 reviews and no contact details in the header or footer. PDPs have no delivery or returns info.
9. **PERF-02** (High): Mobile (Fast 3G, 4x CPU): FCP about 7s, LCP 7.2-13.8s, load about 14s; 120-136 requests and 56-61 render-blocking resources per page.
10. **A11Y-01 / A11Y-02 / A11Y-03** (High): Contrast failures on every page, no visible focus or skip link, and CF7 forms with up to 15 unlabeled fields. Critical axe violations on 12 of 12 pages audited.

## 2. Key metrics

### 2.1 Performance (lab, cold cache)

| Page | Condition | Requests | Transfer | JS (req / KB) | CSS (req / KB) | Img (req / KB) | Fonts | TTFB | FCP | LCP | CLS | TBT* | DCL | Load | Render-blocking |
|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| home | Desktop | 130 | 1,045 KB | 54 / 392 | 50 / 164 | 15 / 242 | 8 | 157 ms | 1.6s | 2.8s | 0.001 | 15 ms | 2.5s | 2.9s | 57 |
| shop | Desktop | 120 | 1,023 KB | 54 / 390 | 49 / 157 | 6 / 231 | 8 | 101 ms | 1.4s | 1.4s | 0.0 | 4 ms | 2.4s | 2.6s | 56 |
| category | Desktop | 131 | 1,304 KB | 54 / 392 | 49 / 163 | 18 / 505 | 7 | 183 ms | 1.6s | 2.6s | 0.0 | 18 ms | 2.5s | 2.6s | 56 |
| pdp | Desktop | 134 | 1,111 KB | 57 / 407 | 50 / 162 | 18 / 339 | 6 | 228 ms | 1.5s | 2.6s | 0.012 | 21 ms | 2.6s | 2.6s | 57 |
| pdp_machine | Desktop | 136 | 1,273 KB | 60 / 417 | 50 / 161 | 17 / 487 | 6 | 228 ms | 1.5s | 1.8s | 0.021 | 12 ms | 2.5s | 2.5s | 57 |
| cart | Desktop | 121 | 1,222 KB | 58 / 782 | 50 / 163 | 5 / 75 | 7 | 784 ms | 2.2s | 2.2s | 0.0 | 3 ms | 3.1s | 3.3s | 61 |
| home | Mobile 3G/4xCPU | 129 | 1,039 KB | 54 / 390 | 50 / 163 | 15 / 272 | 7 | 141 ms | 7.2s | 13.8s | 0.327 | 386 ms | 11.7s | 14.2s | 57 |
| pdp | Mobile 3G/4xCPU | 128 | 1,030 KB | 57 / 402 | 50 / 162 | 12 / 291 | 6 | 230 ms | 7.1s | 7.2s | 0.203 | 300 ms | 12.4s | 14.0s | 57 |
| shop | Mobile 3G/4xCPU | 119 | 1,153 KB | 54 / 393 | 49 / 159 | 6 / 389 | 7 | 103 ms | 6.9s | 7.2s | 0.007 | 390 ms | 13.2s | 14.1s | 56 |
| cart | Mobile 3G/4xCPU | 120 | 1,247 KB | 58 / 777 | 50 / 161 | 5 / 140 | 6 | 1191 ms | 8.2s | 8.2s | 0.002 | 302 ms | 13.2s | 14.0s | 61 |

\*TBT here is the sum of long-task time over 50 ms after FCP, as observed in-page (approximate). Under mobile throttling, TTFB from Navigation Timing is not reliable because the CDP latency is applied below it. For server response, use the desktop TTFB.

LCP elements: home is the hero CSS background `home-header-284x300.jpg` (a 284px thumbnail stretched to full width). /shop/ is `coffee-450x450.jpeg`. Category is `classico.jpg`. PDP is the description paragraph on desktop and the logo on mobile. The machine PDP is the H1.

Image formats: on desktop, home served 14 of 15 images as WebP, shop 4 of 6, category 9 of 18, PDP 12 of 18, machine PDP 9 WebP + 1 AVIF of 17. Serving is via content negotiation on the .jpg/.png URLs. Largest images: espressoplusvap_gallery1-450x609 (206 KB WebP), espressoplusvap_gallery2-450x485 (143 KB), bar_5_stelle_grani_1000.jpg (135 KB JPEG, the original loaded on the PDP), home-header-284x300 (111 KB), coffee-450x450.jpeg (102 KB JPEG).

Third parties on every page: Google Tag Manager (118 KB), Smartlook session recording, Cloudflare Turnstile (28 KB, even without a form), Google Fonts (6 files, 176 KB), maxcdn.bootstrapcdn. No 4xx/5xx subresources and no JS errors were observed (one aborted image request on the PDP). The only console message was Smartlook disabling itself under automation.

### 2.2 Accessibility (axe-core 4.10.2, desktop)

| Page | Critical rules | Serious rules | Moderate rules | Minor rules | Total failing nodes | Top issues (nodes) |
|---|--:|--:|--:|--:|--:|---|
| home | 1 | 5 | 6 | 0 | 54 | image-alt (1), color-contrast (18), target-size (12), link-name (10), link-in-text-block (6) |
| shop | 1 | 3 | 7 | 0 | 82 | image-alt (1), color-contrast (61), target-size (12), aria-input-field-name (1), heading-order (1) |
| category | 1 | 2 | 7 | 0 | 123 | image-alt (1), color-contrast (102), target-size (12), landmark-unique (2), heading-order (1) |
| pdp | 1 | 2 | 3 | 1 | 74 | image-alt (1), color-contrast (54), target-size (13), region (2), heading-order (1) |
| pdp_machine | 1 | 2 | 3 | 1 | 74 | image-alt (1), color-contrast (54), target-size (13), region (2), heading-order (1) |
| cart | 2 | 2 | 6 | 1 | 39 | image-alt (1), select-name (1), color-contrast (17), target-size (12), heading-order (1) |
| checkout | 2 | 3 | 6 | 1 | 49 | image-alt (1), select-name (1), color-contrast (27), target-size (12), link-in-text-block (1) |
| contact | 2 | 3 | 5 | 0 | 37 | label (4), image-alt (1), color-contrast (14), target-size (12), aria-input-field-name (1) |
| business_solutions | 1 | 5 | 6 | 0 | 58 | image-alt (1), target-size (23), color-contrast (22), aria-hidden-focus (4), aria-input-field-name (1) |
| more_information | 3 | 4 | 6 | 0 | 83 | label (12), select-name (3), image-alt (1), color-contrast (33), target-size (23) |
| franchise | 3 | 4 | 6 | 0 | 80 | label (15), image-alt (1), select-name (1), color-contrast (29), target-size (23) |
| where_to_buy | 1 | 3 | 6 | 0 | 36 | image-alt (1), color-contrast (25), aria-input-field-name (3), link-in-text-block (1), heading-order (1) |

Manual checks: no visible focus indicator (computed `outline: none` on nav links); no skip link; 42 focusable elements in the header before content; dropdowns open on keyboard focus but overlap. H1 is visually hidden on all non-product pages (axe `page-has-heading-one` on 10 of 12 pages). 1,195 of 1,895 images across sitemap pages lack alt (63%).

### 2.3 SEO crawl

| Metric | Value |
|---|---|
| Sitemap URLs (wp-sitemap.xml) | 191 (33 pages, 87 products, 71 taxonomy archives across 12 taxonomies incl. pa_test, pa_weight, pa_region) |
| Indexable (200, `index`) | 113 (26 pages + 87 products) incl. 7 password-protected products |
| Non-indexable | 78 of 191 (41%): 68 x 200 with `noindex, follow` (/shop/ and 67 product_cat, product_tag, product_brand and pa_* archives), 8 redirects, 2 x 404 |
| Redirecting sitemap URLs | 8 (4 x /products-page/* 301 to a noindex category, /checkout/ 302 to /cart/, /about/distributors/ 3-hop chain, gift-packs and /product/gifts/ to /shop/) |
| 404 in sitemap | 2 (/essence/taste/sweet/, /essence/aroma/flowers/) |
| Meta description / Open Graph / Twitter | 0 / 0 / 0 of 191 |
| JSON-LD | Product on 81 of 87 PDPs, including the 7 password-protected ones; none on the 5 call-for-price machines. Organization, WebSite, LocalBusiness and BreadcrumbList JSON-LD on 0 pages (breadcrumbs only as microdata) |
| robots.txt | `Disallow: /*?*`, `/wp-content/plugins`, `/wp-content/themes`, `/wp-includes`; no `Sitemap:`; blocks 52/54 same-origin CSS/JS on home |
| Internal links checked | 148 non-sitemap paths + 18 sampled facet/search URLs (out of ~700 discovered query URLs): 1 x 404 (Double-Cap PDF), 7 redirecting (e.g. `/shop` linked from 186 pages, `/espressoblends` from 71), plus 1 broken image (shopping_cart.png) |
| External links | 28 checked: 2 x 404 (health.gov 2015 report, eurekalert 2006), 1 dead domain (elpotromexicangrill.com), legacy http:// Twitter and Pinterest |
| HTTPS / mixed content | HTTPS everywhere, 0 http:// subresources; no HSTS or security headers observed |
| Favicon / PWA | 23x23 PNG favicon only; /favicon.ico and /apple-touch-icon.png return 0-byte 200 responses; no manifest |

### 2.4 Catalog (87 products, catalog.json)

Out of stock: **40 (46%)**. Price $0 'Call for Price': 5. Reviews: 0. Median description: 54 words (28 under 30 words). No short description: 72. Median unique images: 1. On sale: 9. Out of stock by category: Gift Packs 6/6, Pods 6/9, Home equipment 9/16, Commercial 5/9, Capsules 5/16, Specialty 5/15, Drip 3/8.

### 2.5 Search and store-locator tests

| Query | Results | Notes |
|---|--:|---|
| decaf | 8 | 7 products + 'Front Page'; misses DEK70 Capsules (decaf); includes out-of-stock Decaf Pods with no flag |
| capsule | 19 | Capsules mixed with capsule machines; 10 per page |
| 5 stelle | 5 | Correct; results in blog layout (date, author, excerpt) |
| machine | 34 | Includes cleaners and capsule packs; no type facet |

Store locator (WP Store Locator + Google Maps): the map renders and shows 25 results within 50 mi of Boston by default. The full dataset has 78 locations (74 MA, 2 ME, 2 no state): 41 with no URL, 51 with no phone, 0 with hours. The 'Distributors' tab is empty.

### 2.6 Forms

| Form | Fields | Required | Notes |
|---|--:|--:|---|
| Contact (/contact/) | 4 | 2 | Turnstile; no phone, email or address on the page; 4/4 fields unlabeled (axe) |
| Business inquiry (/join-us/more-information/) | 14 | 9 | Position, city and ZIP are required but not marked; 12 unlabeled; generic 'Send Request' |
| Franchise (/join-us/franchise-info-request/) | 13 | 9 | Full street address, 2 required essays, $2.5M net-worth and $1M liquidity yes/no; 15 unlabeled |
| Checkout | 15 visible | 10 | Guest allowed; phone required; payment: Card (Authorize.net), PayPal/Venmo, Google Pay |
| My Account | 3 + 2 | 2 + 2 | Login and Register each with Turnstile; no benefits stated |
| Newsletter / Refer a friend | 0 | | Raw shortcodes `[newsletter]` and `[tcraf-refer-page]` |

## 3. Detailed findings

### 3.1 SEO

#### SEO-01: All shop, category, tag and brand archives are noindex
**Severity:** Critical  |  **Screenshot:** `screenshots/desktop-cat-coffee-full.jpg`

- **Evidence:** <meta name="robots" content="noindex, follow"> on /shop/, all 18 product_cat archives (e.g. /product-category/coffee/, /product-category/coffee/capsules/), 5 product tags and 11 brand pages. No SEO plugin is installed, so Enfold's built-in robots logic applies, and it indexes only single posts and pages. Only 113 URLs are indexable: 26 pages (including /cart/ and /my-account/, which should be noindex) and 87 products. The pages that should rank for 'Guglielmo capsules', 'Italian espresso beans' or 'commercial espresso machine Boston' are therefore excluded from Google.
- **Recommendation:** Install Rank Math or Yoast (both override Enfold's robots output) and set product categories, the shop page and brand pages to index. Write a unique intro (120-250 words), title and meta description for each key category. Keep attribute archives (pa_*) and tag archives noindex.

#### SEO-02: robots.txt blocks rendering resources and every query-string URL; no Sitemap line
**Severity:** Critical

- **Evidence:** robots.txt disallows /wp-includes, /wp-content/plugins, /wp-content/themes and '/*?*'. Under Google's longest-match rules, 52 of 54 same-origin CSS/JS files on the homepage (53/54 on a PDP) are blocked for Googlebot, including jquery.min.js?ver=3.7.1 and every Enfold stylesheet. admin-ajax.php and ?wc-ajax endpoints are blocked too. Googlebot therefore renders an unstyled page, which hurts mobile-usability and layout signals. There is also no 'Sitemap:' directive.
- **Recommendation:** Replace with a minimal robots.txt: 'User-agent: *', 'Disallow: /wp-admin/', 'Allow: /wp-admin/admin-ajax.php', and targeted disallows for '/*?add-to-cart=', '/*?orderby=', '/*?filter_', '/*?s=', '/cart/', '/checkout/', '/my-account/'. Add 'Sitemap: https://lespressousa.com/wp-sitemap.xml' (or the SEO plugin's sitemap). Do not block /wp-content/ or /wp-includes/.

#### SEO-03: No meta descriptions, Open Graph or Twitter cards anywhere; generic titles
**Severity:** High

- **Evidence:** 0 of 191 sitemap URLs have a meta description, Open Graph or Twitter Card tags, so shares on Facebook, LinkedIn or Slack show no image or summary. Titles follow the pattern '<Page> – Guglielmo USA' with no keywords: 'Coffee – Guglielmo USA' is used by 6 URLs, and 17 other title strings are shared by 2-3 URLs (e.g. category 'Extra Bar' and attribute archive 'Extra Bar'). The homepage title is the tagline 'Guglielmo USA – The Coffee that hits the spot'.
- **Recommendation:** Through the SEO plugin, write templates (e.g. '{Product} | Italian Espresso | Guglielmo USA') and hand-written descriptions for the top 30 URLs, a default OG image (brand and product shot) and per-product OG images. Make the homepage title keyword-led, e.g. 'Guglielmo Italian Espresso Coffee, Capsules & Machines | Guglielmo USA'.

#### SEO-04: Sitemap is polluted: about 41% of its URLs are non-indexable
**Severity:** High  |  **Screenshot:** `screenshots/desktop-order-adjustment-full.jpg`

- **Evidence:** wp-sitemap.xml lists 191 URLs: 33 pages, 87 products and 71 taxonomy URLs across 12 taxonomies, including internal attributes like pa_test ('/test/fully-test-machine-operation/'), pa_weight and pa_region. 78 of the 191 (41%) cannot be indexed. 68 return 200 with noindex (/shop/ plus 67 taxonomy archives). 8 redirect: 4 legacy WP e-Commerce '/products-page/*' URLs 301 to /product-category/coffee/; /checkout/ 302s to /cart/; /about/distributors/ goes through a 3-hop chain via the broken intermediate '/about/about/where-to-buy/'; gift-packs and /product/gifts/ go to /shop/. 2 return 404 (/essence/taste/sweet/, /essence/aroma/flowers/). Cart, checkout and my-account are listed, /cart/ and /my-account/ are 'index, follow', and 7 password-protected products are 'index, follow'.
- **Recommendation:** Let the SEO plugin generate the sitemap with only pages, products, product categories and brands. Exclude pa_* attributes, tags, cart, checkout and my-account. Delete the 4 /products-page/ WordPress pages and /about/distributors/ (keep one-hop 301s). Unpublish or set private the 7 password-protected products.

#### SEO-05: Structured data incomplete: no Organization, WebSite, LocalBusiness or BreadcrumbList JSON-LD
**Severity:** Medium

- **Evidence:** Product JSON-LD (WooCommerce default) is present on 81 of 87 PDPs with offer, price and availability. It lacks gtin/mpn, shippingDetails, hasMerchantReturnPolicy and aggregateRating, which Google Merchant listings flag. The homepage and Contact page have 0 JSON-LD blocks. Breadcrumbs exist only as Enfold microdata. The 5 'Call for Price' machines output no Product markup at all. The 7 password-protected products (e.g. 'Order Adjustment', $22.31) still expose Product JSON-LD with price and InStock to crawlers.
- **Recommendation:** Add Organization (logo, sameAs, contactPoint) and WebSite with SearchAction on home, LocalBusiness on Contact (address, phone, hours, geo) and BreadcrumbList JSON-LD. Extend Product with brand, gtin or mpn, shippingDetails and hasMerchantReturnPolicy. Give quote-only machines Product markup without an Offer, and remove markup from private products.

#### SEO-06: H1s hidden or generic; category pages have no visible title
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-home-full.jpg`

- **Evidence:** Homepage H1 is 'Front Page' and is visually hidden (0x0). On every non-product page tested (/shop/, /product-category/coffee/, /contact/, /about/, /join-us/business-solutions/, /equipment-offering/, /cart/) the H1 is hidden by Enfold's title bar setting. 72 archive URLs have 2 H1s, and the 7 password-protected products have none. axe flags page-has-heading-one on 10 of 12 audited pages (every audited page except the two PDPs).
- **Recommendation:** Enable a visible title area or add a visible H1 in each layout: e.g. home 'Authentic Italian Espresso, Imported from Calabria Since …' (verify the date), and categories 'Guglielmo Espresso Capsules'. Keep one H1 per page and fix heading order.

#### SEO-07: Thin, duplicate and redirecting internal links
**Severity:** Medium

- **Evidence:** 28 of 87 products have under 30 words of description and 72 have no short description. The main menu links to '/shop' (301 to /shop/) on 186 pages, and '/espressoblends' (301) is linked from 71 pages. Join Us and Business Solutions use relative links ('business-solutions/', 'hotel/') that resolve at root and 301. /dripcoffee/ (137 words) and /about/the-story-of-guglielmo/ (44 words) are thin.
- **Recommendation:** Update menu URLs to their canonical trailing-slash versions and replace relative links with absolute ones. Then expand category and product copy as in PDP-01.

#### SEO-08: Broken links, broken image and a weak 404 page
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-404-full.jpg`

- **Evidence:** Internal 404: '/wp-content/uploads/2018/03Double-Cap-2-Group.pdf' (missing slash) on /equipment-offering/. Broken image: /wp-content/uploads/2014/07/shopping_cart.png (404) on /dripcoffee/. External: health.gov 2015 report (404), eurekalert 2006 release (404), and elpotromexicangrill.com (homepage 'Newest locations', domain does not resolve). Twitter and Pinterest links use http://. The 404 page is the generic Enfold 'Sorry, the post you are looking for…' with the tip 'tablet instead of laptop', and offers no products, categories or contact.
- **Recommendation:** Fix the PDF path and the drip-page image, and remove dead outbound links. Build a branded 404 with search, top categories, bestsellers and a phone/contact block.

#### SEO-09: Favicon, PWA and security headers
**Severity:** Low

- **Evidence:** Only a 23x23 PNG favicon (2014) is declared. /favicon.ico and /apple-touch-icon.png return HTTP 200 with 0 bytes (empty files). There is no web manifest (/manifest.json 404) and no theme-color. No HSTS, X-Content-Type-Options, Referrer-Policy or CSP headers were observed. http://www redirects in 2 hops (http://www, then https://www, then the https apex).
- **Recommendation:** Upload a 512x512 Site Icon (WordPress generates all sizes), add a manifest and theme-color, enable HSTS and basic security headers at Cloudflare, and collapse the www redirect into 1 hop.

#### SEO-10: Aggressive bot rate limiting
**Severity:** Low

- **Evidence:** During a polite crawl (~1 request/s) Cloudflare returned 429 'Just a moment…' challenge pages (noindex,nofollow) for 5 URLs. Verified search bots are normally exempt, but SEO tools, uptime monitors and link-preview fetchers may be challenged.
- **Recommendation:** Review Cloudflare Bot Fight Mode and rate-limit rules. Allow-list verified bots and set a rate-limit threshold above normal crawl rates.

### 3.2 Performance

#### PERF-01: 104+ CSS/JS files and 56-61 render-blocking resources per page
**Severity:** High

- **Evidence:** Every page loads about 50 stylesheets and 54-60 scripts. Chrome reports 56-61 resources as renderBlockingStatus='blocking' (home: 57, about 194 KB). By origin: Enfold 36, notice-bar plugin 7 (slick, tweecool, ticker CSS/JS for a bar that is not displayed), UPS shipping 2, Authorize.net CIM 2, Google Fonts 2, bootstrapcdn 1, CF7 1, bulk-discount 1. 8 synchronous scripts sit in <head>. Requests per page: home 130, shop 120, category 131, PDP 134, machine PDP 136, cart 121.
- **Recommendation:** Enable Enfold Performance > 'Merge and compress' for CSS and JS and 'disable unused ALB elements'. Deactivate notice-bar. Load CF7 and Turnstile only on form pages, and Authorize.net/UPS/PayPal assets only on cart and checkout (Asset CleanUp or Perfmatters). Defer non-critical JS. Target under 40 requests and under 15 render-blocking.

#### PERF-02: Mobile load times of 7-14s on a throttled connection
**Severity:** High

- **Evidence:** Measured with Playwright (iPhone 390x844, CDP Fast 3G: 562 ms RTT, 1.44 Mbps; 4x CPU), cold cache. Home: FCP 7.2s, LCP 13.8s, CLS 0.33, TBT 386 ms, load 14.2s. PDP: FCP 7.1s, LCP 7.2s, CLS 0.20, load 14.0s. Shop: FCP 6.9s, LCP 7.2s, load 14.1s. Cart: FCP 8.2s, LCP 8.2s, load 14.0s. All pages are 1.0-1.25 MB and about 120-130 requests. Requests went through an egress proxy, so treat the figures as relative.
- **Recommendation:** Apply PERF-01, PERF-03 and PERF-05. Set a performance budget for the redesign (<= 500 KB, <= 40 requests, LCP < 2.5s on Slow 4G) and monitor CrUX and Search Console Core Web Vitals.

#### PERF-03: Homepage LCP is a 284px thumbnail stretched as the hero, and the tagline is an image
**Severity:** High  |  **Screenshot:** `screenshots/desktop-home-fold.jpg`

- **Evidence:** The LCP element is the hero section's CSS background 'home-header-284x300.jpg' (110 KB WebP), a 284x300 crop scaled to 1440px wide, which looks visibly blurry. Desktop LCP is 2.8s and mobile-throttled LCP is 13.8s. The headline 'The Coffee that hits the Spot' is a raster PNG (guglielmo_headline.png, 820x100), so it is not crawlable or translatable and blurs on retina screens.
- **Recommendation:** Use a properly sized responsive <img> (srcset at 768/1280/1920, AVIF/WebP, fetchpriority=high, no lazy loading) and a live-text H1 and subhead.

#### PERF-04: Layout shift on mobile home (0.33) and PDP (0.20)
**Severity:** Medium  |  **Screenshot:** `screenshots/mobile-home-full.jpg`

- **Evidence:** Home CLS sources are the 'Guglielmo near you' content slider (.avia-content-slider) and the sections below it re-flowing after the slider initialises: 0.165, 0.067 and 0.052 shifts at about 12s. PDP CLS (0.20) comes from the mobile sidebar ('Recently viewed products') pushing .single-product-summary down. Desktop CLS is low (0-0.02).
- **Recommendation:** Reserve space for sliders (fixed aspect-ratio) or remove the slider, and move the 'Recently viewed' widget below the product summary on mobile.

#### PERF-05: Third-party and font weight on every page
**Severity:** Medium

- **Evidence:** Per page: Google Tag Manager 118 KB; Smartlook session recording (2 requests, 23 KB, plus recording traffic); Cloudflare Turnstile 28 KB loaded sitewide even where there are no forms (home, shop, PDP); Google Fonts 6 files and 176 KB plus 2 local font files (8 font requests and 220 KB on home); a bootstrapcdn icon CSS. The cart page loads 782 KB of JS (PayPal and payment SDKs).
- **Recommendation:** Self-host and subset 2 font weights (WOFF2, font-display:swap). Load Turnstile only with forms. Gate Smartlook and GTM tags behind consent (TRUST-03). Lazy-load the PayPal SDK until checkout or the payment step.

#### PERF-06: Image delivery is mostly fine but inconsistent
**Severity:** Medium

- **Evidence:** Good: about 70% of images are served as image/webp via content negotiation (e.g. home 14 of 15), with srcset on most WooCommerce images. Issues: some JPEGs are still served as JPEG (coffee-450x450.jpeg 102 KB on /shop/; brasilena_can-450x450.jpg 75 KB). The PDP downloads the full 1000px original (135 KB JPEG) for zoom on page load. Machine PDP gallery images are 206 KB and 143 KB. Above-the-fold icons use loading=eager correctly, but loading behaviour is mixed (Enfold lazy class vs the native attribute). 1 aborted image request was seen on the PDP.
- **Recommendation:** Regenerate thumbnails, serve AVIF/WebP for all formats, load zoom images on interaction, and standardise native lazy loading below the fold.

#### PERF-07: Cart/checkout TTFB and DOM size
**Severity:** Low

- **Evidence:** Uncached cart TTFB is 784 ms on desktop and 1.19s on the throttled run; other pages are 100-230 ms (Cloudflare and WP Engine cache HITs). The DOM is 572-1,122 nodes. HTML carries 22 KB of inline CSS and 15-27 KB of inline JS on every page.
- **Recommendation:** Audit the plugins that hook into cart totals (bulk discount, UPS live rates) and enable an object cache (Redis on WP Engine).

### 3.3 Accessibility

#### A11Y-01: Sitewide color-contrast failures
**Severity:** High  |  **Screenshot:** `screenshots/desktop-cat-coffee-full.jpg`

- **Evidence:** axe color-contrast failures (serious): home 18 nodes, shop 61, category 102, PDP 54, cart 17, checkout 27, contact 14, business solutions 22, more-information 33, franchise 29, where-to-buy 25. The main nav is #808080 on #fff (3.94:1) at 13px. Sidebar and filter links are light grey. Product-card 'Add to cart' and 'Show Details' buttons are near-invisible pale grey. The 'View cart' button on the add-to-cart notice is white on pale green. Links in body text are only distinguishable by color (1.69:1 against #666 text, 9 link-in-text-block violations).
- **Recommendation:** Set the minimum body/nav text to #595959 or darker (7:1 on white), make primary buttons #C2410C-like orange with white text at 4.5:1 or higher, and underline links in body copy.

#### A11Y-02: No visible keyboard focus, no skip link, 42 header tab stops
**Severity:** High  |  **Screenshot:** `screenshots/desktop-keyboard-focus-home.jpg`

- **Evidence:** Computed :focus styles on nav links, buttons and inputs are 'outline: none' with no box-shadow or color change. There is no skip link. The header contains 42 focusable elements, so a keyboard user tabs through every mega-menu link before reaching content. Dropdowns open on focus, but adjacent submenus (About and Join Us) stay open and overlap translucently.
- **Recommendation:** Add a global :focus-visible outline (2px, offset 2px, at least 3:1 contrast) and a 'Skip to content' link. Use disclosure-pattern menus (button with aria-expanded) so submenus open only on Enter or Space and close on Esc or blur.

#### A11Y-03: Form fields without programmatic labels (all Contact Form 7 forms)
**Severity:** High  |  **Screenshot:** `screenshots/desktop-contact-full.jpg`

- **Evidence:** axe 'label' (critical): /contact/ 4 of 4 fields, /join-us/more-information/ 12 fields, /join-us/franchise-info-request/ 15 fields, plus select-name violations (1-3 per form). The visible text 'Your Name (required)' is not tied to the input. Required state is shown only as text in the label. The footer category <select> and the select2 widget have no accessible name.
- **Recommendation:** Wrap each CF7 field in <label> (or use for/id), add autocomplete attributes (name, email, tel, postal-code, organization), mark required fields with aria-required and a visible asterisk legend, and add aria-label to the footer category select.

#### A11Y-04: Missing alt text and unnamed links
**Severity:** Medium

- **Evidence:** Across the 191 sitemap pages, 1,195 of 1,895 <img> elements (63%) have no alt. The footer logo has no alt on every page (axe image-alt, critical, on all 12 audited pages). Home has 10 slider image links with no accessible name (link-name). The /equipment-offering/ page has 19 of 20 images without alt.
- **Recommendation:** Use descriptive alt text for product and machine images, alt="" for decorative icons, alt='Guglielmo USA' on the footer logo, and aria-label on image-only links.

#### A11Y-05: Landmarks and heading structure
**Severity:** Medium

- **Evidence:** There are duplicate main landmarks (#main role=main wrapping <main>), contentinfo nested inside another landmark, and the WooCommerce <header> on archives nested as a banner landmark. Heading order jumps (H1 hidden, then H4 'GOING QUICKLY…', then H6 tagline, then H3 footer titles).
- **Recommendation:** Use one <main> and remove role attributes from wrappers. Build a logical H1 > H2 > H3 outline in the new templates.

#### A11Y-06: Small targets (WCAG 2.2 AA 2.5.8)
**Severity:** Medium  |  **Screenshot:** `screenshots/mobile-cat-coffee-fold.jpg`

- **Evidence:** axe target-size: 12-23 failing targets per page (mega-menu links 17-21px tall, sidebar links, social icons). On mobile, home has 32 of 44 visible interactive elements under 24px in one dimension, the category page 69 of 92, and the PDP 29 of 45 (breadcrumbs 15px tall, listing buttons 23px).
- **Recommendation:** Make every interactive target at least 24x24 (44x44 preferred on touch) with adequate spacing; enlarge breadcrumb and footer link line-height.

#### A11Y-07: Minor ARIA issues
**Severity:** Low

- **Evidence:** Social icons sit inside an aria-hidden container but remain focusable (aria-hidden-focus, 4 per page on B2B pages). The cart has empty table headers. The select2 widget has role=textbox without a name. image-redundant-alt appears in the mini-cart.
- **Recommendation:** Fix during template rebuild.

### 3.4 Navigation & IA

#### NAV-01: B2B is hidden behind the ambiguous label 'Join Us'
**Severity:** High  |  **Screenshot:** `screenshots/desktop-nav-dropdown-join-us.jpg`

- **Evidence:** The business audience (restaurants, cafes, offices, hotels, distributors, franchisees) has no 'For Business', 'Wholesale' or 'Commercial' entry point. B2B content is spread across Join Us (3 children), Business Solutions (Foodservice, Office & Corporate, Hospitality), /equipment/ and /equipment-offering/ (both missing from the menu), /machine-maintenance/ (a Learn More anchor) and Where to Find. 'Partner With Guglielmo USA' and 'Request More Information' are the same page under 2 names. There is no phone number in the header.
- **Recommendation:** In the current site, rename 'Join Us' to 'For Business' and add a header phone link. In the redesign, create a dedicated B2B hub (Solutions by segment, Equipment & Service, Wholesale Ordering, Become a Distributor/Franchise, Request a Quote).

#### NAV-02: Mislabeled and broken menu destinations
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-nav-dropdown-about.jpg`

- **Evidence:** 'About' top-level has no href. Its submenu repeats 'About' and 'Our Story' (both /about/). 'Espresso Blends' (product education) sits under About. Learn More > 'Coffee & Your Health' links to /learn-more/#marketing (wrong anchor), and 'Machine Maintenance' links to /learn-more/#machine although /machine-maintenance/ exists. The homepage 'Learn More' icon links to /about/.
- **Recommendation:** Make every top-level item a real link, remove duplicates, move Espresso Blends to Shop/Coffee, and fix the anchors and the icon link.

#### NAV-03: Shop menu mixes taxonomies and omits key categories
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-nav-dropdown-shop.jpg`

- **Evidence:** 'By Type and Format' mixes product tags (Whole Bean, Ground, Single Serve, Drip) with categories (Specialty Products) and points 'Shop All Coffee' to the same URL as the heading. Capsules (16 SKUs), Pods (9), Gift Packs, Organic and Accessories are not in the menu. Blends, formats and weights are modelled 3 times (categories, tags and pa_ attributes), which produces 71 overlapping taxonomy URLs.
- **Recommendation:** Define one taxonomy (Category = product type; attributes = blend, format, roast, size) and generate menu and filters from it. Lead with 'Coffee by format' (Beans, Ground, Capsules, Pods), then 'by blend', then Machines, then Accessories.

#### NAV-04: Mobile menu is a 38-link flat list
**Severity:** Medium  |  **Screenshot:** `screenshots/mobile-menu-open-fold.jpg`

- **Evidence:** Opening the burger shows 38 links with every submenu expanded (1,984px of scroll), and 'About' and 'Join Us' are duplicated as both parent and child. Search appears both in the overlay and beside the logo.
- **Recommendation:** Use accordion levels (Shop > Coffee > Beans…), put the 4-5 primary tasks first (Shop Coffee, Capsules, Machines, For Business, Where to Buy), and pin contact and account at the bottom.

#### NAV-05: Footer offers little utility
**Severity:** Low  |  **Screenshot:** `screenshots/desktop-home-full.jpg`

- **Evidence:** The footer has a 'Select a category' dropdown, a sitemap list that duplicates the header, no address, phone, email, hours, social links, newsletter or payment and trust badges, '© Copyright Guglielmo USA -' (no year, dangling dash), and a 'powered by Enfold WordPress Theme' link on 186 pages.
- **Recommendation:** Rebuild the footer with contact details, policies (Shipping, Returns, Privacy, Terms), a B2B contact, newsletter signup and social links. Remove the theme credit.

### 3.5 Brand & Storytelling

#### HOME-01: No value proposition, product or CTA above the fold
**Severity:** High  |  **Screenshot:** `screenshots/desktop-home-fold.jpg`

- **Evidence:** Desktop fold (1440x900): a 137px blurred hero strip with the tagline image, a row of 5 icon links (Our Coffee, Machines, Join Us, Where to Buy, Learn More), then three columns titled 'GOING QUICKLY…', 'GUGLIELMO NEAR YOU' and 'JOIN OUR FAMILY'. There are no product photos of the blends, no 'Shop now' button and no statement of who Guglielmo is (Italian roaster, imported, Certified Espresso Italiano). On mobile, the first screen (390x844) holds only the 82px header, an 80px hero strip and 5 stacked icon links (~510px).
- **Recommendation:** Hero with lifestyle and product imagery, an H1 value proposition (authentic Italian espresso from a family roaster), and 2 CTAs (Shop Coffee and Capsules, Solutions for Business). Follow with bestsellers, a 'find your blend' module, heritage proof points and a B2B band.

#### HOME-02: Homepage promotes out-of-stock products and a dated restaurant list
**Severity:** High  |  **Screenshot:** `screenshots/desktop-home-full.jpg`

- **Evidence:** 'GOING QUICKLY…' links 4 products, and 2 are out of stock: Brasilena Cans (6-Pack) and Silver Signature 250g Can. 'GUGLIELMO NEAR YOU' is a 5-slide carousel of 11 Boston-area restaurants and cafes; elpotromexicangrill.com no longer resolves. 'JOIN OUR FAMILY' is 4 text links. The content is Boston-centric for a site that ships nationally.
- **Recommendation:** Drive merchandising from live data (bestsellers or in-stock featured products) and replace the restaurant carousel with a 'Find Guglielmo near you' locator teaser plus 2-3 B2B client logos or testimonials.

#### HOME-03: Brand story is thin, dated and confusing
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-about-fold.jpg`

- **Evidence:** /about/ has 3 paragraphs on 'L'Espresso USA started in 2000 by Mimmo Elia… five distributor's nation wide… In 2003 we also expanded into the Canadian market', with a 2000s photo. 'The Story of Guglielmo' is 44 words plus a link to the Italian site and a video. Production copy is translated from Italian ('organoleptic', 'CEE 93/43 – D.LGS 155/97 (H.A.C.C.P.)'). Three brand names are in use (Guglielmo USA, L'Espresso USA, lespressousa.com), and the drip cards carry a separate 'L' logo.
- **Recommendation:** Write a heritage narrative (Guglielmo family roastery in Calabria, the US importer's role, Certified Espresso Italiano, ISO 9001) with timeline and photography, settle on one brand name, and explain the relationship between the Italian roaster and the US importer.

### 3.6 Product Discovery

#### PLP-01: 46% of the catalog is out of stock and unlabeled in listings
**Severity:** High  |  **Screenshot:** `screenshots/desktop-pdp-outofstock-full.jpg`

- **Evidence:** 40 of 87 products are out of stock: Gift Packs 6/6, Pods 6/9, Home machines 9/16, Commercial 5/9, Capsules 5/16, Drip 3/8. On category grids out-of-stock items carry no badge; only the button changes to a faint 'Read more' (e.g. /product-category/coffee/: 3 of 15 out of stock; /product-category/equipment/: 5 of 12). Out-of-stock PDPs show 'Out of stock' in the same orange as 'In stock', still show the case-discount table, and offer no back-in-stock alert or alternatives. The Gift Packs category 301s to /shop/.
- **Recommendation:** Show an 'Out of stock' badge on cards and sort out-of-stock items last (or hide discontinued ones). Add 'Notify me when available' (WooCommerce Back In Stock) and 'Similar in stock' on out-of-stock PDPs. Prune discontinued SKUs with 301s.

#### PLP-02: Shop landing and filters underperform; mobile filters sit below the products
**Severity:** High  |  **Screenshot:** `screenshots/mobile-shop-full.jpg`

- **Evidence:** /shop/ shows 3 category tiles (Coffee 44, Espresso Accessories 5, Machines and Parts 12) and no products. The tile counts contradict the filter counts beside them (Coffee 37, Machines and Parts 11). Category pages have no visible title or intro (hidden H1). Filters are 6 single-select WooCommerce layered-nav link lists (Product, Type, Format, Blend, Style, Intended Equipment Use), right-aligned in light grey. On mobile, the filter sidebar starts at 7,762px of a 9,707px category page, after all 15 products.
- **Recommendation:** Build a real PLP: visible H1 and intro, product grid on /shop/, a filter drawer on mobile ('Filter (3)' sticky button), multi-select facets with counts (Format, Blend, Roast/Intensity, Compatible system, Size), and applied-filter chips.

#### SRCH-01: Site search returns blog-style results without images or prices
**Severity:** High  |  **Screenshot:** `screenshots/desktop-search-decaf-full.jpg`

- **Evidence:** Search is WordPress core, rendered as posts. Results have no images, prices, stock or add-to-cart, and show the publish date and author username (e.g. 'February 14, 2025 … by marcoelia', 'June 27, 2014 … by Fabio F1V'). Tests: 'decaf' gives 8 results (7 products + the 'Front Page' page) and misses DEK70 Capsules (decaf) because there are no synonyms. 'capsule' gives 19 (includes machines). '5 stelle' gives 5. 'machine' gives 34 (includes capsules and cleaners) at 10 per page. There is no autocomplete. Out-of-stock items (e.g. Decaf Pods 180 Ct) are not flagged.
- **Recommendation:** Use a WooCommerce product search (FiboSearch, or Algolia/Searchanise in the redesign) with autocomplete, thumbnails, prices, stock, synonyms (decaf/dek/decaffeinato, capsule/cap/pod), typo tolerance and a product-grid results page. Exclude pages or show them in a separate 'Content' group.

#### PLP-03: Sorting, pagination and card content
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-cat-coffee-full.jpg`

- **Evidence:** The sort dropdown exposes 10 options, including 'Custom', 'Random', 'Product ID', 'Relevance' (outside search) and 'Average rating' (with 0 reviews). The default is 15 per page, so Coffee runs to 3 pages. Cards show only name and price, with no format, weight, roast or intensity, so retail and wholesale SKUs mix without labels ($6.69 250g bag next to $110 'French Roast Blend Drip Beans', which is 2 x 5 lb; $192 6 kg decaf). Card buttons ('Add to cart' / 'Show Details') are near-invisible.
- **Recommendation:** Limit sort to Featured, Best selling, Price low-high and high-low, and Newest. Use 24-36 per page or load-more. Add attribute badges (Beans / 1 kg / Intensity 4) and a 'Wholesale/Case' label. Show a single clear 'Add to cart' or 'Choose options' button.

#### PLP-04: $0 'Call for Price' machines are dead ends
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-pdp-callforprice-full.jpg`

- **Evidence:** 5 commercial products have price 0 and display 'Call for Price': Multi Cap 2 Group, Double Cap 2 Group, Maxi Cap Pro Evolution, Espresso Grinders, and WEGA and BFC Commercial Machines. They are also flagged out of stock, so cards show 'Read more'. The PDP has no phone number, quote button or form; only an inline 'contact us' text link in the description and PDF catalogs.
- **Recommendation:** Turn them into 'Request a quote' products: a prominent CTA that opens a short quote form pre-filled with the machine, a click-to-call phone number, lead time and 'service and installation included' messaging. Add Product markup without an Offer price.

#### PLP-05: Internal and test artifacts exposed to shoppers
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-order-adjustment-full.jpg`

- **Evidence:** 7 password-protected products are published and listed in the sitemap with 'index, follow': Order Adjustment ($22.31), Guglielmo Espresso Cup Set, Cappuccino Cup Set, Caffeino Glass, Brasilena Bottles 24-Pack, French Roast Drip Beans and Tube Capsule Machine. They appear in 'Recently viewed' and prev/next product arrows as 'Protected: …'. The internal attribute 'Equipment Test: Fully test machine operation' appears as a required select on machine PDPs and has its own archive URL. 'Uncategorized' shows in the footer category dropdown.
- **Recommendation:** Set these products to Private (or use a hidden B2B catalog plugin), remove pa_test from front-end variations (use a hidden order meta or a fixed 'Bench-tested before shipping' note), and hide Uncategorized.

### 3.7 Product Detail Pages

#### PDP-01: Thin product content and imagery
**Severity:** High  |  **Screenshot:** `screenshots/desktop-pdp-coffee-full.jpg`

- **Evidence:** Median of 1 unique image per product (57 of 87 have 1 or none) and median description of 54 words (28 under 30, 6 empty). 72 of 87 have no short description. Coffee PDPs lack structured attributes buyers compare: intensity, roast level, arabica/robusta ratio, tasting notes, brewing method, origin, caffeine and freshness/roast date. The icon row (beans, machine, Italy map) has no labels. 75 of 156 catalog images date from 2014-2015.
- **Recommendation:** Create a PDP content template: 3-6 images (pack front and back, beans/crema, lifestyle), an intensity/roast scale, flavor notes, a blend composition bar, 'Best for' (espresso, moka, drip), brew guide, ingredients and allergens, and FAQ. Use one product with variations for size and format per blend.

#### PDP-02: No reviews and no shipping or returns information on PDPs
**Severity:** High  |  **Screenshot:** `screenshots/desktop-pdp-coffee-full.jpg`

- **Evidence:** WooCommerce reviews are disabled: no Reviews tab, 0 reviews and rating 0 on all 87 products. None of the 4 PDPs sampled mention shipping cost, delivery time, a free-shipping threshold or returns. The only delivery promise ('within 3 business days') is on the B2B pages. Returns (18% restocking fee, machines only) are buried in /terms/.
- **Recommendation:** Enable reviews and send a post-purchase request (Judge.me or Trustpilot). Add a delivery and returns block under the add-to-cart button: ships in X days via UPS, free shipping over $X, coffee non-returnable, machines bench-tested.

#### PDP-03: Machine PDP variation UX and layout bugs
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-pdp-machine-full.jpg`

- **Evidence:** ESPRESSO PLUS VAP shows a price range '$259.00 – $399.00' and two selects: 'Equipment Test' (only option 'Fully test machine operation', preselected) and 'Capsule Package Choice' (None/+150/+300). The bundle value is explained in dense copy ('your first 150 coffees are $2.66 On sale $2.19/shot… that's a awesome deal'). The 'Sale!' badge overlaps the H1 ('…Capsule Machin[Sale!]'). On mobile, the add-to-cart button stays hidden until options are selected, and the price is at 884px (below the fold).
- **Recommendation:** Use visual bundle selector cards (Machine only / + 150 capsules, save $X / + 300 capsules, save $Y) with a per-cup price. Remove the test option. Move the sale badge onto the image.

#### PDP-04: Case-discount table is valuable but inconsistent
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-pdp-coffee-full.jpg`

- **Evidence:** The 'Case Discount' table (WooCommerce Bulk Discount) appears on coffee PDPs. Tiers vary by product with no explanation (5 Stelle 1 kg: 6/12/18+ for 5/6/8%; Espresso Classico 500g: 12/24/36+ for 2/3/7%). It does not say what a 'case' is, shows no per-unit price at each tier, and appears even when the item is out of stock. The descriptions repeat 'Buy a case of 6 and save'.
- **Recommendation:** Present tiered pricing as 'Buy 6+ → $30.88/bag (save 5%)' with a quantity stepper that preselects the tier. Standardise tiers per format, and explain case contents and wholesale accounts.

#### PDP-05: Returning visitors on mobile see the buy box below the fold
**Severity:** Medium  |  **Screenshot:** `screenshots/mobile-pdp-coffee-returning-visitor-fold.jpg`

- **Evidence:** On a 390x844 viewport the 'Recently viewed products' sidebar widget renders between the gallery and the product summary. On a fresh visit the 5 Stelle add-to-cart is at y=804px (just at the fold). After viewing one other product it moves to y=967px, below the fold, and the machine PDP H1 sits at 793px. The same widget causes CLS 0.20.
- **Recommendation:** Mobile PDP order: gallery, title, price, rating, key attributes, then add-to-cart (sticky on scroll). Put cross-sells and recently viewed after the description.

#### PDP-06: Related products and cross-sells are generic
**Severity:** Low

- **Evidence:** Every PDP shows 4 random 'Related products' from the same category (a 5 Stelle 1 kg page shows $105-110 drip bulk bags). There are no upsells (e.g. 1 kg to a case), no cross-sells (capsules with a machine, cups with coffee) and no 'Frequently bought together'. The cart has 0 cross-sells.
- **Recommendation:** Set curated upsells and cross-sells per product (capsule-machine compatibility, blend to the same blend in other formats) and add 'Pairs with' and 'Complete your setup' modules.

### 3.8 Cart & Checkout

#### CHK-01: Shipping cost is invisible until a full address is entered
**Severity:** High  |  **Screenshot:** `screenshots/desktop-cart-full.jpg`

- **Evidence:** The cart has no shipping row and no shipping calculator ('Subtotal $32.50 / Total $32.50'). Checkout shows 'Total $32.50' with no shipping or tax line until the address is complete (UPS live rates). No free-shipping threshold or delivery estimate appears anywhere in cart or checkout, and there is no shipping policy page. Unexpected shipping cost is the top-cited cause of checkout abandonment (Baymard).
- **Recommendation:** Enable the WooCommerce cart shipping calculator (ZIP only), show 'Shipping calculated at next step – from $X' or a flat-rate table, add a free-shipping progress bar, and publish a Shipping policy page linked from PDP, cart and footer.

#### CHK-02: Cart visual hierarchy favors the coupon over checkout
**Severity:** Medium  |  **Screenshot:** `screenshots/mobile-cart-fold.jpg`

- **Evidence:** The coupon field and the solid orange 'Apply coupon' button are the strongest elements in the cart table. 'Update cart' is a disabled-looking pastel button. 'Proceed to checkout' is a same-color button of similar weight below the totals. On mobile, the coupon block (3 full-width controls, two of them orange) sits between the line item and the totals, ahead of the checkout CTA. There are no product attributes (format, weight) in cart rows, no trust or secure-checkout messaging, and no express pay (PayPal or Google Pay) in the cart.
- **Recommendation:** Collapse the coupon field behind a 'Have a promo code?' link, make 'Checkout' the single primary button (sticky on mobile), add express-pay buttons in the cart, and add payment/security icons and a delivery estimate.

#### CHK-03: Checkout form length and step ambiguity
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-checkout-full.jpg`

- **Evidence:** Guest checkout is allowed, which is good. There are 15 visible fields and 10 required, including a required phone and a required terms checkbox. Optional Company and Order notes fields are shown expanded. Payment options are Credit Card (Authorize.net CIM; Visa/MC/Amex icons), PayPal or Venmo, and Google Pay, all placed at the bottom only; there is no Apple Pay. The submit button reads 'Continue to Payment', implying another step. There is no address autocomplete and no order-summary thumbnails.
- **Recommendation:** Put express checkout (PayPal, Apple Pay, Google Pay) at the top, collapse Company and Notes, make phone optional (or explain 'for delivery issues only'), add address autocomplete, and use 'Place order' with a clear 2-step indicator.

#### CHK-04: My Account gives no reason to register
**Severity:** Low  |  **Screenshot:** `screenshots/desktop-my-account-fold.jpg`

- **Evidence:** /my-account/ shows Login and Register forms, each with a Cloudflare Turnstile widget and pale (disabled-looking) buttons, but no benefits (order history, quick reorder, subscriptions, wholesale pricing). It sits in the main nav as text rather than an icon.
- **Recommendation:** Explain the benefits, add social or magic-link login, and plan B2B accounts with tier pricing and reorder in the redesign.

### 3.9 B2B Lead Generation

#### B2B-01: Business inquiry form is long and has no fallback
**Severity:** High  |  **Screenshot:** `screenshots/desktop-more-information-full.jpg`

- **Evidence:** /join-us/more-information/ ('Business Solutions Inquiry'): 14 fields, 9 required (name, email, phone, position, city, ZIP, company type, current coffee system, 'what can we help you with'), plus Turnstile and a generic 'Send Request' button. Only 3 labels say '(required)': position, city and ZIP are enforced without being marked. There is no promise of response time, no phone or email alternative on the page, and no privacy note. The 'Inquire about customized solutions' link on Business Solutions is small orange inline text.
- **Recommendation:** Step 1 (4 fields: name, business email, business type, ZIP), then optional step 2 (volume, current system, timeline). Add click-to-call and 'We reply within 1 business day', and track form submissions in GA4.

#### B2B-02: Franchise form asks for too much too early
**Severity:** High  |  **Screenshot:** `screenshots/desktop-franchise-full.jpg`

- **Evidence:** /join-us/franchise-info-request/: 13 fields, 9 required, including full street address (2 lines), state, ZIP and two required essay textareas ('plans, aspirations and long-term goals', 'Why would Guglielmo USA select you'). It asks yes/no about a $2.5 million net worth and $1 million liquid assets with no context, fees or FDD information. The Join Us page promises 'Over 35 locations worldwide' and 'Advertising reimbursement*' with no footnote.
- **Recommendation:** Publish a franchise overview (investment range, support, unit economics, FDD request) and a short qualifying form (name, email, phone, state, capital range dropdown). Move the essays to a later call.

#### B2B-03: Contact page is only a form; distributor path is a PDF
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-contact-full.jpg`

- **Evidence:** /contact/ has 4 fields (2 required) behind Turnstile and no phone, email, address, hours or map. Phone 617-612-0090 appears only on /equipment/ and as a distributor card on Where to Find. 'Becoming a Distributor' means downloading a 2020 PDF application, and 'Becoming a Retailer' links to the generic Contact form.
- **Recommendation:** Contact page: phone (click-to-call), email, warehouse address and map, hours, a separate B2B line, and a routing selector (Order question / Business inquiry / Service request). Replace the PDF with an online distributor application.

#### B2B-04: B2B value proposition lacks proof and is contradictory
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-business-solutions-full.jpg`

- **Evidence:** Business Solutions lists 6 services (delivery in 3 business days, service and training, no-cost machine loan, water treatment, procurement/lease, 'commitment to excellence') and 13 brand logos it services. There are no case studies, client logos, testimonials, service-area map, SLA or program tiers. Claims conflict: '70 years' vs '60 years', 'over 25 years' vs 'over 20 years' of service. The 'No cost machine loan' is described differently on two pages (event loan vs repair loaner). Segment pages contain typos ('LONGUES', 'Gugliemlo', 'preceded value').
- **Recommendation:** Build segment landing pages (Restaurants and cafes, Offices, Hotels, Retail) with a problem, solution and proof structure: client logos, a quote, a photo, equipment packages, the service promise with response times, and a quote CTA. Align all numbers to one fact sheet.

#### B2B-05: Where to Find: locator works, but data and tabs are poor
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-where-to-buy-full.jpg`

- **Evidence:** The WP Store Locator and Google Map load correctly on the default 'Locations' tab and show 25 results within 50 miles of Boston. The full dataset (via the locator's own AJAX endpoint) has 78 locations: 74 in Massachusetts, 2 in Maine, 2 without a state. 41 have no website, 51 no phone and 0 opening hours, and state values are inconsistent ('MA' vs 'Massachusetts'). The 'Distributors' tab is empty (66 bytes of HTML). The distributor cards list 3 distributors (MA, IL, PA), one titled just 'Espresso', with fax numbers and hotmail/prodigy emails. 'Can't find what your looking for?' contains a typo.
- **Recommendation:** Clean and enrich the locator data (category, hours, phone, website), add 'Use my location' and national zoom, separate 'Buy online' / 'Find a cafe' / 'Find a distributor' intents, and remove the empty tab.

### 3.10 Mobile

#### MOB-01: Small text and tap targets throughout on mobile
**Severity:** High  |  **Screenshot:** `screenshots/mobile-pdp-coffee-full.jpg`

- **Evidence:** At 390px wide, the median text size is 13px on home, PDP, cart, contact and business pages (14-15px on shop and category). On home, 53 of 63 text elements are under 14px. Interactive elements under 24px in one dimension: home 32/44, shop 42/51, category 69/92, PDP 29/45, cart 14/20. There is no horizontal overflow (good) and the viewport meta allows zoom.
- **Recommendation:** Mobile base font of at least 16px and minimum 44px touch targets, with a spacing scale in the new design system.

#### MOB-02: Mobile homepage and header waste the first screen
**Severity:** Medium  |  **Screenshot:** `screenshots/mobile-home-fold.jpg`

- **Evidence:** The 82px header holds the logo, a search icon placed against the logo, the burger and the cart. Below it are an 80px hero strip and 5 stacked icon links (~510px), so no product, offer or B2B CTA appears until the second screen. The header is not sticky, so the cart and menu disappear on scroll (on a 9,707px category page).
- **Recommendation:** Use a compact sticky header (56-64px) with menu, logo, search and cart, and a hero with a CTA and product carousel in the first screen.

### 3.11 Content Quality

#### CONT-01: Contradictory facts and claims the catalog cannot back
**Severity:** High  |  **Screenshot:** `screenshots/desktop-dripcoffee-full.jpg`

- **Evidence:** Blends: 'Eight distinct blends of espresso' (/espressoblends/) vs 'seven blends' (/join-us/business-solutions/foodservice-solutions/) vs 6 named blends plus 'Special Blends' in the menu. Heritage: '70 years' (/join-us/, office page) vs 'over 60 years' (/dripcoffee/) vs '70+ years' (story page). Service: 'over 25 years' (/join-us/, /equipment/) vs 'over 20 years' (/join-us/business-solutions/). Drip: /dripcoffee/ claims 'single origin, organic, flavored and cold brew blends', 'Six distinct blends', 'Two coffee roasts developed exclusively for the Cold Brew method' and 'locally roasted in small batches'. It shows 6 blend cards (Premium, Java Estate, Brazil Oro, Colombia, Decaf Colombia, French Roast), but the catalog sells only 3 drip blends (Premium, French Roast, Decaf) in 8 SKUs, 3 of them out of stock, and no cold brew. 'Locally roasted' conflicts with the imported-from-Italy positioning. About says 'five distributor's nation wide'; Where to Find lists 3.
- **Recommendation:** Create a single fact sheet (founding years, number of blends, service years, distributor count) approved by the client. Remove unsellable drip and cold-brew claims or add the products. Separate the L'Espresso drip line from Guglielmo espresso in the IA.

#### CONT-02: Typos and grammar errors on key commercial pages
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-espressoblends-full.jpg`

- **Evidence:** 'prefect' (x2: /espressoblends/, /dripcoffee/), 'avalble', 'conviniance' (/espressoblends/), 'Gugliemo' (/join-us/, /join-us/business-solutions/, office page), 'Gugliemlo', 'preceded value', 'LONGUES' (/hotel/), 'experiance' (office), 'Maintenace' (/machine-maintenance/), 'your looking' (/about/where-to-buy/), 'a awesome deal' (machine PDP), 'five distributor's nation wide' (/about/), 'it's spot' (/espressoblends/), 'chose' for 'choose' (/terms/).
- **Recommendation:** Proofread all copy (Grammarly or LanguageTool pass) and fix these this week; set an editorial QA step for the redesign.

#### CONT-03: Broken shortcodes render as raw text on two indexable pages
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-newsletter-fold.jpg`

- **Evidence:** /newsletter/ shows only '[newsletter]' and /refer-a-friend/ shows only '[tcraf-refer-page]'. The plugins are inactive. Both pages are in the sitemap with 'index, follow' (128 and 132 words, all chrome).
- **Recommendation:** Restore working newsletter signup and referral programs (Klaviyo or Mailchimp form; a WooCommerce referral plugin) or unpublish and 301 both pages.

#### CONT-04: Invisible white text on Equipment Offering
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-equipment-offering-full.jpg`

- **Evidence:** The intro paragraph on /equipment-offering/ ('Choosing the appropriate beverage equipment is an important financial decision…') renders in #FFFFFF on #FCFCFC, squeezed into a 93px-wide column 887px tall that overlaps the machine images. It shows as ghost text in the screenshot. The page also links to 'Office Plus', 'Multi Cap 2', 'MY Caps' and others that are out of stock or call-for-price, and one PDF link is broken.
- **Recommendation:** Fix the column layout and text color, and link each machine to a live PDP or quote form.

#### CONT-05: Outdated content, including medical health claims
**Severity:** Medium  |  **Screenshot:** `screenshots/desktop-learn-more-full.jpg`

- **Evidence:** 'Learn More > Coffee & Your Health' republishes 2006-2015 news (e.g. 'Italian-style coffee may reduce risk of prostate cancer', 'A Cup of Joe May Help Some Parkinson's Disease Symptoms … August 1, 2012', 'Scientific Report of the 2015 Dietary Guidelines'). 2 source links return 404. Disease-risk claims next to products create FDA and FTC health-claim risk. 'Marketing & Multimedia' embeds Italian TV commercials and ad-campaign images with no US relevance. The 'Machine Maintenance' section duplicates /machine-maintenance/. 'The Buzz' has 2 undated testimonials.
- **Recommendation:** Remove the health page or replace it with a neutral, sourced 'Coffee & caffeine FAQ' reviewed for compliance. Replace it with evergreen guides (how to choose capsules, espresso at home, machine care) that support SEO.

#### CONT-06: Naming and labeling inconsistencies
**Severity:** Low

- **Evidence:** 'Club 99 Capsules (50 Pack)' has the slug 'club-99-capsules-12-pack'. The page is called 'Where to Find' in the H1 and title, 'Where to Buy' in the URL and icon, and 'Distributors' in a legacy URL. 'Partner With Guglielmo USA' (menu) is 'Request More Information' (H1). 'Franchise Info request' uses inconsistent casing. 'puly CAFF plus®' vs 'Puly Milk Plus®'. 'ROCKET APPARTAMENTO TCA (CHROME/BLACK) + ESPRESSO' is in all caps.
- **Recommendation:** Adopt a product naming convention (Blend – Format – Size, e.g. '5 Stelle Whole Bean Espresso, 1 kg') and a page naming glossary.

### 3.12 Trust & Social Proof

#### TRUST-01: No visible contact details anywhere in the main chrome
**Severity:** High  |  **Screenshot:** `screenshots/desktop-contact-full.jpg`

- **Evidence:** Header: no phone or email. Footer: only a 'Contact Us' link and '© Copyright Guglielmo USA -'. Contact page: form only. The business address does not appear on any audited page; the phone appears on only 2 pages. For a company selling $259-$1,875 machines and B2B service contracts, this undermines credibility and lead capture.
- **Recommendation:** Add a header utility bar (phone, 'Free shipping over $X', 'For Business'), full NAP (name, address, phone) in the footer, and LocalBusiness schema.

#### TRUST-02: Zero product reviews and minimal social proof
**Severity:** High

- **Evidence:** 0 reviews and 0 ratings across 87 products. 'The Buzz' has 2 consumer testimonials (Glen Cove NY; North Royalton OH), undated. There are no B2B client logos or case studies, and no press. Certifications that differentiate the brand (Certified Espresso Italiano by INEI for Club 99 and Extra Bar; ISO 9001; HACCP) appear only deep in /about/production/ text.
- **Recommendation:** Collect reviews (post-purchase emails, import Italian reviews if permitted). Surface certifications as badges on home and PDPs. Add a B2B logo wall and 2-3 case studies.

#### TRUST-03: Policies incomplete; session recording without consent
**Severity:** Medium

- **Evidence:** There is no Shipping policy page. Returns are covered only for machines inside the /terms/ FAQ (18% restocking fee, 30 days); coffee and food are non-returnable. Smartlook session recording and GTM run on every page while the theme reports 'av-cookies-no-cookie-consent' (no consent banner). The privacy policy lists 'Guglielmo NET, Lespresso, L'Espresso USA' as subsidiaries.
- **Recommendation:** Publish Shipping, Returns and Warranty pages linked from footer and checkout. Add a consent manager (e.g. Complianz) that blocks Smartlook and marketing tags until opt-in for state privacy laws, and update the privacy policy.

#### TRUST-04: Social links are legacy and off-brand for the US
**Severity:** Low

- **Evidence:** Social icons appear only in the content-page sidebar, not in the footer. Facebook links to the Italian parent page (it-it.facebook.com/CaffeGuglielmoOfficialFanpage). Twitter (http://twitter.com/CaffeGuglielmo) and Pinterest use http. YouTube points to a channel /feed URL. There is no Instagram, the most relevant channel for coffee. Sidebar social links are inside an aria-hidden container.
- **Recommendation:** Confirm the US-owned or parent channels with the client, link them over https in the footer, add Instagram, and embed UGC or Instagram content on home.

## 4. Top 15 quick wins (fixable in the current WordPress within a week)

1. **Install Rank Math or Yoast. Set /shop/, product categories and brands to index (removes Enfold's noindex), and write titles and meta descriptions for the top 30 URLs plus a default OG image.** _(SEO-01)_
2. **Replace robots.txt: allow /wp-content and /wp-includes, disallow only specific query parameters, cart, checkout and account, and add a Sitemap line.** _(SEO-02)_
3. **Clean the sitemap (pages, products and categories only). Set the 7 password-protected products (Order Adjustment etc.) to Private, delete the 4 /products-page/ pages, and fix the /about/distributors/ 3-hop chain.** _(SEO-04 / PLP-05)_
4. **Fix or unpublish /newsletter/ and /refer-a-friend/ (raw shortcodes) and 301 them.** _(CONT-03)_
5. **Proofread and fix the 15+ typos and align the numbers (years, blends, distributors). Remove the cold-brew, 'locally roasted' and six-drip-blend claims.** _(CONT-01 / CONT-02)_
6. **Fix the invisible Equipment Offering text, the broken Double-Cap PDF and shopping_cart.png, the Learn More anchors, the homepage 'Learn More' icon link, and the '/shop' and '/espressoblends' menu URLs (trailing slash).** _(CONT-04 / SEO-08 / NAV-02)_
7. **Add phone and email to the header, full address, phone, email and hours to the footer and Contact page, plus LocalBusiness and Organization JSON-LD.** _(TRUST-01 / B2B-03)_
8. **Add 'Out of stock' badges, sort out-of-stock products last (or hide discontinued ones), add back-in-stock alerts, and replace the 2 out-of-stock products in the homepage 'Going quickly' block.** _(PLP-01 / HOME-02)_
9. **Enable the cart shipping calculator, add a free-shipping threshold message, and publish a Shipping policy page linked from PDP, cart and footer.** _(CHK-01)_
10. **Enable WooCommerce reviews and set up an automated post-purchase review request.** _(PDP-02)_
11. **Give the 5 'Call for Price' products a 'Request a quote' button (pre-filled form) and a click-to-call phone number.** _(PLP-04)_
12. **Remove the 'Equipment Test' variation from machine PDPs and fix the Sale badge overlapping the H1.** _(PDP-03 / PLP-05)_
13. **Turn on Enfold 'Merge & compress CSS/JS', deactivate the notice-bar plugin, and load CF7, Turnstile and payment scripts only where needed (Asset CleanUp). Expect 40-60 fewer requests.** _(PERF-01 / PERF-05)_
14. **CSS pass: darker text and nav (#595959), visible :focus-visible outline, skip link, underlined body links. Alt on the footer logo; real <label>s on CF7 fields.** _(A11Y-01..04)_
15. **Rename 'Join Us' to 'For Business', cut the business inquiry form to 5-6 fields with a 'reply within 1 business day' promise and phone link, and make the homepage H1 a visible value proposition instead of the hidden 'Front Page'.** _(B2B-01 / NAV-01)_

## 5. Structural issues that require the redesign

1. **Dual-audience information architecture.** Separate, clearly signposted B2C shop and B2B hub (segments, equipment and service, wholesale accounts, distributors, franchise) instead of 'Join Us'. Patching menus cannot fix this. (NAV-01, B2B-01..05)
2. **Theme and front-end stack.** Enfold 8.x with Avia Layout Builder ships about 104 CSS/JS files and nested landmark markup, and hides H1s by default. A new lightweight block theme or headless front end with a design system (tokens, WCAG 2.2 AA components) is needed to hit the Core Web Vitals and accessibility targets. (PERF-01..04, A11Y-01..06)
3. **Catalog and data model.** Blends, formats and sizes are modelled 3 times (categories, tags and 9 pa_* attribute taxonomies). 87 mostly simple products, 46% out of stock, retail and wholesale SKUs mixed, quote-only machines at $0. Rebuild as variable products per blend (format x size), with a consistent attribute schema driving filters, structured data and B2B tier pricing. (NAV-03, PLP-01..05, PDP-04)
4. **Product discovery engine.** Faceted PLPs with a mobile filter drawer, plus product search with autocomplete, synonyms and merchandising rules (FiboSearch at minimum; Algolia or Searchanise preferred). (PLP-02, PLP-03, SRCH-01)
5. **PDP template and content production.** New PDP layout (sticky mobile buy box, gallery, intensity and roast scales, tasting notes, brew guide, reviews, delivery and returns block, bundles, subscriptions) plus a photography and copy program for all 87 SKUs. (PDP-01..06)
6. **Checkout and retention.** Express pay at the top (Apple Pay, Google Pay, PayPal), transparent shipping rules or a free-shipping threshold, capsule subscriptions or auto-reorder, and B2B accounts with net terms, reorder and case pricing. (CHK-01..04)
7. **B2B lead funnel.** Segment landing pages with proof (case studies, logos), quote-request flows tied to products, a progressive multi-step form connected to a CRM (HubSpot or Pipedrive) with routing and SLA. Online distributor and franchise applications. (B2B-01..04)
8. **Brand storytelling and content strategy.** Heritage narrative, certifications, roastery imagery, one brand name (Guglielmo USA vs L'Espresso), an evergreen education hub replacing the 2006-2015 health page, and an editorial QA process. (HOME-01..03, CONT-01..05)
9. **SEO foundations for the migration.** URL map and 301 plan (products-page, distributors, taxonomy archives), an SEO plugin, schema (Organization, LocalBusiness, Product with shipping and returns, BreadcrumbList), indexable category landing copy, and a clean XML sitemap. (SEO-01..08)
10. **Store locator and distributor data.** National locator with clean, enriched data (category, hours, phone, website), geolocation, and separate cafe, retail and distributor intents. (B2B-05)
11. **Mobile-first layout system.** Typography (16px base), 44px targets, a sticky compact header, mobile filter and buy-box patterns, and a performance budget per template. (MOB-01, MOB-02, PDP-05)
12. **Privacy and analytics governance.** Consent management for Smartlook and GTM, GA4 ecommerce and lead events, and policy pages. (TRUST-03)

## 6. Appendix

### 6.1 Screenshot index (`/home/user/temp/redesign/research/screenshots/`)

Naming is `{desktop|mobile}-{page}-{fold|full}.jpg`. Desktop is 1440x900; mobile is 390x844 at DPR 2 (iPhone UA). Full-page shots are JPEG q70 and fold shots JPEG q80.

- Core pages (desktop and mobile, fold and full): home, shop, cat-coffee, cat-capsules, pdp-coffee, pdp-machine, pdp-callforprice, cart (1 item), checkout (observed only), my-account, about, where-to-buy, join-us, business-solutions, equipment-offering, contact, newsletter, refer-a-friend, franchise.
- Interaction states: `desktop-nav-dropdown-{shop,about,join-us,learn-more}.jpg`, `mobile-menu-open-fold.jpg`, `mobile-menu-open-shop-expanded.jpg`, `mobile-menu-open-full.jpg`, `desktop-search-open.jpg`, `desktop-keyboard-focus-home.jpg`, `{desktop,mobile}-pdp-coffee-added-to-cart-fold.jpg`, `mobile-pdp-coffee-returning-visitor-fold.jpg`, `desktop-where-to-buy-distributors-tab-fold.jpg`.
- Search: `desktop-search-{decaf,capsule,5-stelle,machine}-full.jpg`, `desktop-search-product-decaf-full.jpg`, `mobile-search-decaf-fold.jpg`.
- Other evidence: `desktop-404-full.jpg`, `desktop-order-adjustment-full.jpg` (password-protected product), `desktop-pdp-blank-tube-capsule-machine-fold.jpg`, `desktop-pdp-outofstock-full.jpg`, `desktop-cat-commercial-full.jpg`, `desktop-learn-more-full.jpg`, `desktop-dripcoffee-full.jpg`, `desktop-espressoblends-full.jpg`, `desktop-hotel-full.jpg`, `desktop-more-information-full.jpg`.

### 6.2 Raw data

Machine-readable results are in `current-site-audit.json` (scorecard, findings, metrics, axe, crawl, catalog). The raw run outputs (perf, axe, crawl, UX probes) are copied to `raw-crawl/audit-run-2026-10-12/`.
