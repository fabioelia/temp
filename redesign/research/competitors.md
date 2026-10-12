# Competitor & Peer Benchmark: Guglielmo USA (lespressousa.com) redesign

Prepared 12 Oct 2026 for the design team. Inputs: live fetches of about 90 pages, using a browser user-agent, plus WebFetch and web search where pages blocked bots or rendered content client-side. Machine-readable companion: `competitors.json`, generated from the same data as the matrix in section 4.

**Access notes.** illy refuses WebFetch (403), but curl with a browser user-agent worked. Nespresso US serves almost no server-side HTML, so its navigation comes from embedded JSON and its subscription terms from search snippets. Blue Bottle, Clive Coffee and Miscela d'Oro USA sit behind Cloudflare challenges, and Ammirati Coffee's domain did not resolve. Findings for those sites come from search results and are marked as such. Facts about Guglielmo USA come from our own crawl in `raw-crawl/`.

---

## 1. Executive summary

1. **Guglielmo USA scores 11.5 of 52 on our feature matrix.** Every benchmark scores between 25.5 and 43 (illy 43, Nespresso 42, Lavazza 41). The gap lies in table-stakes features, not advanced ones: product data, filters, subscriptions, reviews, contact details and SEO basics.
2. **Our hardest UX problem is format and machine compatibility.** Guglielmo sells 36 mm capsules, 38 mm pods, 44 mm ESE pods, beans, ground coffee and drip coffee, plus the machines for each. Borbone, Kimbo and the parent shop caffeguglielmoshop.it organise their coffee menus by machine system, and illy prints "Suitable For" on every card. Guglielmo USA should make "Shop by your machine" its main browsing tool.
3. **Leaders show one consistent intensity scale, and Lavazza shows why consistency matters.** illy uses "5 of 9", Borbone uses 7 to 10, and Nespresso uses 1 to 13. Lavazza mixes x/5, x/10 and x/13 on a single homepage. We should define one 1–10 scale for all 7–8 blends, together with roast, notes, Arabica/Robusta share and best brew method.
4. **Subscriptions are universal except at Guglielmo.** Discounts run from 5% (Seattle Coffee Gear) to 25% (Lavazza My Way), usually with free shipping and self-service skip, pause and cancel. Lavazza and Nespresso also sell machine-plus-capsule plans; Lavazza's saves up to $130 on the machine.
5. **The best combined consumer-and-B2B sites put a Home/Business switch in the header.** Examples are Lavazza ("Lavazza for your HOME | BUSINESS"), Faema Canada ("For Home | For Business") and Nespresso ("For Business"). Guglielmo's business offer is currently buried under "Join Us".
6. **B2B best practice is a short qualifying finder plus self-service, not a long form.**
   - Finder: Lavazza Professional UK asks four steps (environment, headcount, drinks, contact). Chris' Coffee uses a commercial questionnaire.
   - Self-service: Segafredo, Counter Culture, Partners and Nespresso Pro run trade portals. Segafredo's has a PO-number field; Nespresso Pro has EasyOrder and Reorder.
7. **The closest analogues are importer/distributors that bundle coffee, equipment, service and finance.**
   - Faema Canada: lease and rent-to-own calculator via Econolease, a beans-vs-capsules cost calculator, a service centre and a logo wall of customers.
   - Chris' Coffee (NY): equipment loans and rentals, technicians on call 24 hours, a 90-mile delivery radius, and Organic, Fair Trade, Kosher and SQF certifications.
   - Counter Culture and Partners: triaged tech requests and scheduled preventive maintenance.
8. **A Guglielmo distributor already does this well.** Wake Up Espresso in Vienna (wakeup-espresso.com) lists Guglielmo first. It offers flavour tags, a 5+1 kg deal, a flexible subscription, machines tested before shipping, and personal onboarding by phone or WhatsApp video. It is the most transferable single model.
9. **Trust and brand depth are the cheapest wins.** Guglielmo's story page has 44 words, its claims conflict (60 vs 70 years, while the parent says since 1943, "over 80 years"), there is no phone or address, there are zero reviews, and the newsletter and referral pages show broken shortcodes. Peers lean on heritage numbers, certifications, review counts and founder stories. The parent can supply ISO 9001 and the "Beyond Fair Trade" claim shown on caffeguglielmo.cz.
10. **Platform is the root cause.** The current stack is WordPress with the Enfold theme and WooCommerce, loading about 101 asset files per page, with no meta descriptions, Open Graph tags or schema. 13 of the 17 benchmarks run Shopify, which comes with wallets, review apps and subscription apps. illy runs on Salesforce Commerce Cloud, Lavazza on Adobe Experience Manager and Nespresso on a proprietary stack. Vergnano is the only one besides Guglielmo on WordPress. A replatform, or at least a rebuilt theme with proper plugins, is a precondition for most Must-haves.

---

## 2. Baseline: Guglielmo USA today

- **Top nav (crawl).** Shop (By Blend / By Type and Format) | Equipment (Home, Office, Commercial) | About (Our Story, The Story of Guglielmo, Production, The Buzz, Where to Find, Espresso Blends) | Join Us (Business Solutions, Partner With Guglielmo USA, Franchise Info Request) | Learn More (Coffee & Your Health, Marketing, Machine Maintenance) | My Account.
- **Homepage.** Icon row → "Going quickly…" products → "Guglielmo near you" text list of Boston-area restaurants → "Join our family" text.
- **Catalog.** 87 products, about 40 out of stock. Commercial machines show $0 or "Call for price". "Order Adjustment" is listed publicly. No reviews, subscriptions, finder, intensity or compatibility data. Case discounts of 5–8% on 6/12/18 units are applied silently by a plugin.
- **Business.** Foodservice, office and hotel pages that end in a long inquiry form. The franchise page is a long form. The WP Store Locator has 3 distributors (MA, IL, PA).
- **Trust and SEO.** Contact page has a form only. No meta descriptions, no OG, no JSON-LD, most images lack alt text, about 48 JS and 53 CSS files per page. Payments are Authorize.net and PayPal; shipping is UPS. There are many typos.
- **NAP inconsistency to resolve.** The parent's distributor list (caffeguglielmoshop.it/guglielmo-nel-mondo) gives Guglielmo USA LLC at 266 Calvary St, Waltham MA 02453, tel. +1 617 612 0090, info@lespressousa.com and guglielmousa.com, which redirects to lespressousa.com. The brief describes the company as Boston-based. Confirm one address for the site, Google Business Profile and schema.

---

## 3. Competitor and peer profiles

Each profile covers the same points where they applied: nav · homepage order · audience split · filters · PDP · subscriptions and bundles · B2B · locator and franchise · content · trust and loyalty · localization and checkout · visual identity · good and bad.

### 3.1 Lavazza US (+ Lavazza Professional UK, Flavia)
URLs: https://www.lavazzausa.com/en · /en/business · /en/my-way-coffee-subscription · /en/whole-bean-coffee · https://www.lavazzapro.co.uk/ · https://flavia.com/

- **Nav.** A utility bar holds Lavazza World, Machine Registration and Loyalty Program. A "Lavazza for your HOME | BUSINESS" toggle sits above the main nav, which reads Products | Subscriptions | Promotions | Lavazza Stories | Search | Cart | Account. The Products mega-menu has Coffee (Tablì Tabs, Whole Bean, Ground, Capsules & pods, K-Cup, Nespresso-compatible, Expert Capsules, FLAVIA Freshpacks), Coffee Machines, Accessories, Collections and "Brewing now" (Best Sellers, Coffee Bundles).
- **Homepage order.** Promo hero (Autumn Savings: code plus tiered "$5 off $49+ … $40 off $199+") → Tablì collection → My Lavazza Loyalty sign-up → Kits/Promotions → 3 subscription cards (Capsules / Machine+Capsules / Ground & Beans) → collection tabs (¡Tierra!, Espresso, Dolcevita) with product cards → Stories (Top Gastronomy chefs) → sustainability → recipes → service blocks (delivery, newsletter, customer service, loyalty).
- **Audience split.** The Business toggle swaps in a separate nav: Food Service Solutions (collections, preparations, equipment, in-store solutions, stories, Training Center) and @Work Solutions (Expert, Flavia, Bean to Cup, Cold Brew).
- **Filters.** The whole-bean listing page offers Collection, Format, Intensity, Pack Size, Blend, Aromatic Notes, Preparation, Roast and Color, plus sorting. A "Find your coffee match" quiz tile sits inside the grid.
- **PDP.** Format badge and intensity (7/10), short description, size selector, "Earns 25 [Beans]", Add to Cart and "Subscribe and Save 25%". Below are tabs: Profile & Roasting (aromatic notes, roast), Blend (composition, origin regions), Product Info, and Preparations (tip plus barista video). Back-in-stock "Notify me".
- **Subscription.** "Lavazza My Way": 25% off every delivery, flexible scheduling, free shipping on subscription orders over $50, $5 off the first subscription (code 5OFFSUB). Machine + capsules plan: Classy Plus at $149.99, up to $130 off the machine, plus 25% off capsules.
- **B2B.** Business pillars are Advisory Service, Enhance Your Experience (POS tools), Become a Coffee Connoisseur (Training Center) and Technical Assistance, plus "Business Customer Login". The UK pro site adds:
  - a 4-step solution finder: environment (Office / Manufacturing / Public / Semi-public / Back of house) → people (10–25, 26–50, 51–99, 100+) → drinks (multi-select) → contact
  - a "Workplace Coffee Calculator"
  - a 24-hour callback promise
  - a fully managed service
  - BLUE capsule, KLIX, FLAVIA and bean-to-cup machines
- **Content and trust.** Lavazza Stories (recipes, Calendar, Top Gastronomy, sports), ¡Tierra! sustainability, "since 1895", phone 833-933-0389. Loyalty is My Lavazza: 1 Bean per $1 and 2x on subscriptions. The site has EN and ES US locales. Payments: Apple Pay and PayPal.
- **Visual.** Deep navy and white, uppercase nav, chef and lifestyle photography, packshots on white.
- **Bad.** Inconsistent intensity scales on one page (Perfetto "3/5", Espresso "5/10", ¡Tierra! capsules "7/13"). No Open Graph tags. A stack of overlapping promotions (code, tiers and subscription discounts) makes the price message noisy.

### 3.2 illy US
URLs: https://www.illy.com/en-us · /en-us/coffee/whole-bean-coffee · /en-us/coffee-delivery · /en-us/professional-partners · /en-us/storesfind · /en-us/illy-lovers-loyalty-program

- **Nav.** Subscription | Coffee | Coffee Machines | Gifts & Accessories | Promotions | a sustainability group (A Cup of Love, Planet, Circularity) | Art | Università del Caffè | Professional | illy Lovers. The footer has a region selector covering 16 market/language sites plus the global site.
- **Homepage order.** "The Perfect Pair" hero → Our Coffee Selection carousel → "The Coffee You Love Delivered Automatically" → "Choose the subscription that's best for you" → Our Coffee Machines → gifts → illy Lovers.
- **Filters.** Intensity in buckets (Soft 3–4 / Medium 5–6 / Strong 7–9), "type of coffee you wish to prepare" (Espresso, Moka, Drip, Decaf, Arabica Selection), format, roast/origin, package size, and "available as part of a Subscription". Unavailable values show as "not selectable" rather than vanishing.
- **PDP** (Classico 500 g example):
  - "Flavor Intensity 5 of 9" and loyalty preview "+305" hearts
  - three icon facts: Selection ("100% Arabica"), How We're Brewing, Suitable For ("grinders and grind-on-demand machines")
  - long copy covering taste profile, sustainability, roast degree, packaging/storage, preparation method and a Subscribe & Save paragraph
  - shipping block: free over $50, 2nd-day and next-day options
  - subscription panel with packs and frequency ("Every 4 weeks")
  - PowerReviews ratings
- **Subscription.** "Subscribe & Save 20% Off + Free Shipping on all Recurring Orders". A build-your-own "Coffee Only Subscription" page lists every eligible SKU with its "Suitable For" machine type. Subscriptions earn 1.5x loyalty hearts.
- **Bundles.** Coffee Case Packs, Machine Gifts & Bundles, Curated Coffee Bundles.
- **B2B.** Professional hub "illy for your business" with tiles for Cafés, Bakeries, Restaurants, Hotel and Offices (small vs medium-large enterprises), a franchise page (`/professional-partners/business-types/coffee-supply-for-shop-franchise-illy`), Chef Ambassador, a "Partner with illy – three simple steps" CTA, and a reserved-area login.
- **Locator.** ZIP search with filters for illy Caffès and illy Shop.
- **Content.** illy Art Collection cups, contemporary art exhibitions, Università del Caffè, Ernesto Illy Foundation, recipe guide, how-to guides (espresso, moka, French press, Turkish).
- **Trust and loyalty.** B Corp, "since 1933", "1% of the best Arabica". illy Lovers gives 500 welcome hearts and 20% off. Refer a Friend, machine registration, tutorials, manuals, spare parts, and a "collect my old machine" service.
- **Checkout.** Apple Pay, Klarna, PayPal.
- **Visual.** illy red (#d12420) on warm off-white (#f6f0ec) with espresso-brown (#512c1f) accents; Manrope plus the "Illy Script" display face; gallery-like whitespace and art-led imagery.
- **Bad.** Heavy client-side rendering (the business page is a Livestory embed) and bot-blocking. A quantity dropdown runs to 100.

### 3.3 Segafredo Zanetti US (Massimo Zanetti Beverage USA)
URLs: https://segafredocoffee.com/ (segafredousa.com redirects here; segafredo.us is a parked domain) · https://foodservice.segafredocoffee.com/ · https://wholesale.segafredocoffee.com/

- **Nav.** Shop | Espresso | Coffee | Single-Serve | Serviceware | Craft (Brewing Manual, Drink Recipes, Essentials). Foodservice and News sit in the footer.
- **Homepage order.** "Coffee, uncompromised." → brand statement → "Made for busy mornings" → "Roasted for the ambitious" with 4 signature roasts (Brillante, Crescendo, Vivace, Enzo) → "Raise the coffee bar" → "Subscriptions get always free shipping / Keep going. Never run out." → featured product → Coffee Essentials articles → newsletter.
- **PDP.** Reviews summary (Vivace: 57 reviews, 4.77), price, "Character: Medium Body, Smooth Acidity / Tasting Notes: …", origin narrative (Colombia/Brazil), a pour-over brewing tip, review list, and shipping and returns. Rich Product, Offer and ShippingDetails schema. Free shipping on $35+. Shop Pay, Apple Pay and PayPal.
- **B2B.** Separate Shopify stores:
  - Foodservice: Our Coffee | Foodservice Programs | Contact | About | Login, covering cold brew for Nitrotap, Cold Italian Espresso and ESE pods.
  - Contracted Wholesale: Become a Partner | Login, with a cart that has a "Purchase Order Number" field.
- **Visual.** Dark roast-brown (#4f3833) with a teal accent, Inter body and Oswald condensed headings; energetic "go-getters" tone.
- **Bad.** No homepage meta description. The global franchise network (Segafredo Zanetti Espresso) is invisible to US visitors. B2B is split across three domains.

### 3.4 Nespresso US + Nespresso Professional US
URLs: https://www.nespresso.com/us/en · https://www.nespresso.com/pro/us/en

- **Nav** (from embedded JSON): Coffee (Vertuo / Original, Starbucks by Nespresso, Blue Bottle, Iced) | Machines (Vertuo, Original, Compare Machines, Build your bundle, ReLove refurbished) | Accessories | Collections | Subscription & Loyalty (Create / Manage subscription, AutoReplenish, Status and Benefits, Nespresso Club) | Sustainability & Recycling (Order Recycling Bags, Find a Drop-off Location, B Corp, Circularity) | Store Locator | For Business. The footer has eGift Cards, Referral Rewards, Registered Machines and wallets (Apple Pay, Google Pay, PayPal, cards).
- **Subscription** (verified only through search; markets vary). Credit-based plans where the monthly fee becomes coffee credit, often with a 10% bonus, plus AutoReplenish auto-delivery.
- **Nespresso Pro.** Nav: Your Business (Office, Restaurant/Café, Hotel, Small Business) | Machines | Coffees | Accessories (serveware, dispensers, display solutions) | Services (Order, Delivery, Recurring Order, After Sales) | Contact (1.800.566.0571, chat, email). There is a customer gate ("Yes, I am already a customer / No, I'm not a customer yet" leading to fast registration). Account tools include My Company Information, My EasyOrders (saved orders), My Subscriptions, Reorder and Express Checkout. In other markets, Pro subscriptions bundle a machine, coffee and maintenance for a monthly fee.
- **Visual.** Black and gold luxury, the proprietary "Nespresso Lucas" typeface, product-hero photography.
- **Bad.** The server sends almost no content (title plus footer), so the site depends on JavaScript for SEO, scrapers and accessibility.

### 3.5 Italian roasters (strongest three, plus brief notes)

**Caffè Borbone** (https://www.caffeborbone.com/en-us; Shopify Plus)
- **Nav.** Products | Offers & Promo | The Borbone World | Sustainability. The Coffee menu is organised by system: Nespresso home, Nespresso Professional, Dolce Gusto, A Modo Mio, Lavazza Blue and In Black, Bialetti, Caffitaly, Espresso Point, compostable pods.
- **Homepage.** "More you buy, more you save!" (up to 20% off multiples) → "Your favourite blends. Even at the office." (Nespresso Professional compatibles) → Choose your coffee → iconic pods → Bluemoon machine → newsletter.
- **Merchandising.** Colour-coded blends with intensity: Blue 8, Black 10, Red 9, Gold 7, Dek 8, Light 7.
- **Commerce tools.** Recharge subscriptions, Klarna, Shop Pay, and a loyalty app with points, tiers and referral. Sustainability report, ESG rating, certifications.
- **Bad.** The en-us store charges USD but its banner says "Free shipping in Italy for orders over €40". The B2B offer is a single teaser.

**Kimbo** (https://kimbo.it/ Shopify, Italian only; https://www.kimbo.co.uk/ UK subsidiary)
- **Homepage.** "Scegli il tuo caffè" by format (capsules, compostable pods, beans, ground) → "Selezionati per te" → "Scegli le tue capsule" by compatible system → Sapiente specialty line → origins → newsletter.
- **Features.** "Che caffè sei?" quiz, tasting kits, gift boxes, Professional pages (bars and pastry shops, specialty stores), training courses, certifications, sustainability report.
- **Kimbo UK.** Sells catering pods and sachets, in-cup coffee and POS material, and sells barista courses as bookable products (BSA Level 1, VRQ Level 2, Latte Art, Brewing).
- **Visual.** Very dark espresso brown (#330e00) with Inter.
- **Bad.** No English site. A "test-collezione" collection URL is live in product links.

**Caffè Vergnano** (https://www.caffevergnano.com/en/ WordPress; US site https://www.caffevergnano.us/)
- **Nav.** Vergnano World | Business | Products | Riserva Torino | Blog, with a region selector (Europe, Middle East, Asia, Americas; 17 country sites).
- **Business section.** Cafes and Restaurants, Open a Caffè Vergnano 1882 Coffee Shop, Bar Women in Coffee, Vergnano Academy, Automated Distribution & OCS, Street Coffee.
- **Cafés page.** Introduces the "Espresso Perfect Serve": iconic black cup, helical spoon and "Caffeino" glass of water. It sells 1882 and Classic lines plus merchandising, and offers "Request a consultation" and "Download the brochure".
- **Franchise page.**
  - concept story
  - "Modular solutions tailored to your needs"
  - brochure form with a Company/Private toggle
  - four pillars: Dedicated designer, Made-in-Italy furnishings, Dedicated product offering, Ongoing support
  - Academy training
  - "Find the closest Caffè Vergnano 1882" locator with radius
- **Visual.** Bronze/gold (#86704d) and red, video-led ("Make time count").
- **Bad.**
  - Italian strings on English pages ("Scarica la brochure", "Compila il form").
  - Three consent checkboxes on every brochure form.
  - caffevergnano.us shows raw PHP in its `<title>`.
  - Distributor microsites in Canada (Molisana Imports) and the UAE (Stree F&B, Babadi) are brochure pages with only email contacts.

**Also reviewed (weaker).**
- **Saquella** (https://www.saquella.it/en/): audience-first nav Retail | Horeca | Vending | Company | Business | Contact, with Business subdivided into Bar, Restaurants, Hotel and Offices. No commerce.
- **Danesi** (https://danesicaffe.it/): Italian-only WooCommerce with an "Ordina dal telefono" block that gives expert hours and a 10% newsletter discount. /en/ redirects to an unrelated Italian blog post.
- **Caffè Mauro** (https://caffemauro.com/en/): thin brand site with a separate shop and an Italian meta description on the EN page.

### 3.6 Distributors and importers (closest analogues)

**Faema Canada** (https://faema.ca/; Shopify; Canada's distributor of residential and commercial coffee and restaurant equipment "since 1957/1958")
- **Nav.** For Home | For Business | About Us | Locations | Service | Contact Us. For Business is split into Coffee, Pizza, Baking, Pasta, Gelato, Juice, Water and Additional Solutions; For Home into Home Products, Consumables, Product Care, JURA, ROCKET.
- **Leasing** (/pages/commercial-leasing, financed directly by Econolease):
  - three options: Lease / lease-to-own (24–60 months), Rent-Try-Buy (52 weeks, 60% of payments credited toward buyout), Loan (26/39/52 weeks)
  - "approval up to $50,000 OAC"
  - explainer videos
  - calculator inputs: equipment cost, payment type, established or start-up, term
  - calculator outputs: payment, plus email or print of the estimate
- **Beans vs Capsules calculator** (/pages/cost-benefit-calculator):
  - Household or Professional mode, with presets for small, medium and large office, hotel lobby, dealership and clinic
  - outputs: cost per cup, daily/monthly/yearly cost, annual and 5-year savings, pod waste per year
  - CTAs: print, email, link to the 1 kg beans product, and a JURA Professional free office trial
- **Service centre.**
  - walk-in residential repair
  - "We come to you" on-site commercial service across the GTA
  - diagnostics, descaling, gaskets, calibration, scheduled maintenance, genuine parts, warranty claims, certified refurbishment
  - weakness: "Request service" opens an email template (brand, model, serial, residential/commercial, issue)
- **Trust and commerce.** Customer and years counters, "notable customers" logo wall, "largest coffee equipment showroom in North America", Locations page, LocalBusiness and Product schema. Free shipping $75+, financing from 0%, Affirm, Apple Pay, open-box and certified-renewed products.
- **Visual.** Red (#c8102e) and near-black, Jost and Assistant fonts; retail-utilitarian.

**Chris' Coffee** (https://www.chriscoffee.com/; Latham NY; "leading importer of Italian-made home espresso machines", roaster since 1975)
- **Nav.** Home Espresso | Grinders | Commercial | Coffee | Accessories | Parts | Sale | B2B.
- **B2B page** (/pages/local), titled "bean to brew":
  - 64,000 sq ft facility, roasting 2,300 lb/hr
  - private-label packaging with low minimums and no plate charges
  - Organic (QAI), Fair Trade, Kosher and SQF certifications
  - "Equipment loans, rentals, sales"
  - technicians on call 24 hours
  - 11 delivery and service vehicles covering a 90-mile radius
  - 19,000 customers
  - commercial machine questionnaire
- **Repair page.** Factory-trained techs; repair request form leads to an RMA after a signed Service & Repair Agreement.
- **Also.** Fractional (pre-measured) packs, open-box units, manuals and FAQs, phone (518) 452-5995 in the trust bar, free shipping $50+, 30-day returns, 10% off for newsletter sign-up, Affirm.
- **Bad.** "Over 45 years" and "over 50 years" appear on the same page, the same consistency problem Guglielmo has.

**Whole Latte Love** (https://www.wholelattelove.com/; US equipment retailer since 1997)
- **Catalog.** Deep machine taxonomy: Semi-Auto, Super-Auto, Prosumer, Single vs Dual Boiler, Machine Packages, Commercial, Refurbished. Parts & Care has part diagrams, maintenance packages and water filters.
- **"Better Together Pricing".** A bundler that pairs machine, grinder, accessories and coffee for exclusive discounts.
- **Support and media.** Submit a Tech Ticket, support library, Machine Library, weekly livestreams, 1,000+ YouTube videos, CoffeeCast virtual product demo.
- **Commerce.** "20K+ reviews", coffee subscription 10% off, free shipping $75+, price match, phone 585-924-7170.
- **Visual.** Noe Display serif headings; promotion-heavy homepage.

**Seattle Coffee Gear** (https://www.seattlecoffeegear.com/)
- **Nav.** Shop Gear | Shop Coffee | Commercial | Sale, plus phone and Live Chat. Coffee facets cover roast, taste profile and brew method (including "Superautomatic Friendly" and "European Favorites"). It carries Miscela d'Oro, an imported Italian brand.
- **Commercial.** "Get started with a free consultation", commercial support, commercial machines, grinders and brewing.
- **Commerce.** Subscribe & Save 5%, Bundle & Save, Affirm, free shipping $49+ with a cart progress message, 30-day price guarantee, retail stores, classes and events, podcast, Repairs & Service, Store schema.

**Wake Up Espressomaschinen** (https://www.wakeup-espresso.com/; Vienna; listed by Guglielmo S.p.A. as its Austrian distributor; Shopify)
- **Nav.** Kaffee (Guglielmo first, then Kremoso, Escaffè, Ionia, Trombetta, La Messicana; by format: beans, moka ground, espresso ground, cialde; Probiersets) | Espressomaschinen (single boiler, heat exchanger, dual boiler, lever, machine sets) | Kaffeemühlen | Zubehör | Über uns (Einschulungen, Maschinenservice, Gastro & Büro, Versand & Rabatte, Kontakt, FAQ) | Blog. The announcement bar shows "5+1 kg Rabatte · Einschulungen im Store · Gratis Versand ab 89 €".
- **Cards.** Flavour tags ("schokoladig", "würzig", "kräftig") and staff picks ("Mario's Favorite", "Teams Favorite").
- **Long-form copy.** Explains which machine type suits which drinker. Machines are "tested before shipping, grinder pre-set". Every machine includes personal onboarding by phone or WhatsApp video, and the founder is a technician.
- **Subscription and deals.** Kaffee-Abo every 30 days, 3 months or 6 months with an extra discount, cancel anytime. 5+1 kg cartons. Yotpo reviews and Klarna.
- **Takeaway.** The model for a Guglielmo specialist importer, using the same blends.

**Other Guglielmo distributors** (from caffeguglielmoshop.it/guglielmo-nel-mondo)
- Portugal, UK, Belgium, Poland, Czech Republic, Switzerland (two), Austria, Denmark, USA, South Korea, Canada, France and Germany (three).
- **caffeguglielmo.cz.** Shoptet store with star ratings, a free-shipping threshold, "80 years of roasting", "first in Italy to join Beyond Fair Trade" and gift sets. Headline: "Looking for coffee for home or office?"
- **orizontline.ch.** Vending and OCS, rental, water systems, repair centre, showroom, plus an online "Stato della riparazione" repair-status lookup.
- **mini-italia.ca.** Montreal food importer; Guglielmo is not featured.
- **caffeguglielmouk.com.** Does not resolve.
- **Parent shop caffeguglielmoshop.it.** Menu by capsule system (ESE 44 mm, Espresso Point, Nespresso, A Modo Mio, Dolce Gusto), Fidelity Card points, "Il Pacco da giù" care package, an ISO 9001 certificate PDF, and an EN toggle.

**Northeast importers we could not load.**
- **Ammirati Coffee** (Pelham NY). illy's NY-metro distributor (2021 press release on illy.com) and Trucillo importer for NY/NJ/CT. Sells La Cimbali and super-automatic machines, maintenance and tech support. Its website did not resolve.
- **Miscela d'Oro USA** (misceladorousa.com). Official US importer of the Messina roaster. Behind a Cloudflare challenge; per Trustpilot, 4.5 stars from 15 reviews.

### 3.7 DTC best-in-class

**Trade Coffee** (https://www.drinktrade.com/)
- **Nav.** Build my trial | Shop (Coffee, Equipment, Rare, Gifts, Redeem, Corporate Gifting) | Our Story / Roasters | Learn | Subscribe.
- **Homepage.** "Take our quiz – about 2 min" or "Already know what you love?" → Discovery Trial ("3 bags, 3 roasters, first bag free, free shipping, cancel anytime") → how matching works → roasters → "435,000+ coffee drinkers".
- **Quiz.** Brew method, milk/sugar, roast, flavour. Results map onto Trade's own "Trade Roast Level", and post-delivery ratings refine the next coffee.
- **Other.** Trade Credit, Refer a Friend. Afterpay, Klarna, Okendo/Yotpo. GT Alpina serif and coral (#f45048).

**Counter Culture** (https://counterculturecoffee.com/)
- **Nav.** Find your Fave (quiz) | Shop (build-your-own bundle, bundle sets, gifts) | Subscribe ("save up to 30%", office subscriptions, gift subscriptions) | Learn (Training Centers, Transparency Report, Brew Guides, Classes, Events) | Wholesale (Wholesale Login, Become a Partner, Store Locator, Maintenance Requests).
- **Tech Request** (/pages/tech-service) triages "I'm a CCC Cafe Partner / I'm a Business (Non-Partner) / I make coffee at home". Partners get installation, calibration, scheduled PM and same-day emergency service.
- **Partner page.** Account managers, equipment and bar-design consultation, tech services, training (Counter Intelligence Online and certification), with a testimonial in each block.
- **Other.** Free shipping $30+, Bazaarvoice reviews, Founders Grotesk with bold orange/periwinkle/cobalt colour blocks.

**Stumptown** (https://www.stumptowncoffee.com/)
- **Nav.** Coffee Quiz (first item) | Shop | Subscribe | Brew Guides | Locations | Wholesale ("Serve Stumptown").
- **Homepage.** Campaign hero → Product Finder → merch → featured coffee → product grid.
- **Wholesale page.** Segments (Cafes & Restaurants, Office, Hospitality, Grocery, Retail & Events) → Proud Partners stories → testimonials → benefits (training incl. on-demand videos and train-the-trainer; growth "from 1 location to 30+"; consultation on design, bar flow and equipment; menu development; POS, signage, sleeves, digital assets) → contact.
- **Other.** Cart says "You are $45 away from free shipping!" and offers a 'Select a nonprofit' option. Visual is vintage Americana: SC Laurell and Windsor, warm off-white with gold.

**Partners Coffee** (https://www.partnerscoffee.com/)
- **Menu.** Our Lineup | Company (About, Reviews, FAQ) | Wholesale (Learn & Apply, Office Coffee, Log In to wholesale.partnerscoffee.com) | Education (Brew School, Brew Guides, Blog) | Cafes & Retailers (Find Us, Catering) | Quiz.
- **Office program.** Apply → wholesale pricing, free shipping and an "Office Coffee ordering portal".
- **Wholesale.** Account managers, in-house techs (pre-install, install, preventive maintenance, early and late availability, discounted service rates for partners), own delivery fleet, education, cross-promotion.
- **Other.** 6,100+ Okendo reviews, Affirm, Shop Pay.

**La Colombe** (https://www.lacolombe.com/)
- **Nav.** Roasted Coffee (Bundle & Save, Subscriptions, Member Pricing, Bulk Coffee) | Draft Latte | Cold Brew | Ready to Drink | Gifts & Sets | Membership | Cafés.
- **Membership.** Paid, $44 a year: free shipping with no minimum, 15% member pricing and cashback credits, 20% welcome discount, auto-renew.
- **Visual.** Navy (#0f223e) with light blue and cream; script plus grotesk type.

**Blue Bottle** (blocked; from official FAQ snippets). Subscriptions can be changed, paused or cancelled anytime. Customers get an email before each shipment so they can skip. Subscription shipping is free, and multi-bag orders are up to 17% off.

---

## 4. Feature matrix

Legend: ✓ = present and well executed · ◐ = partial, weak or only on a sister site · ✗ = absent. Cells are based on the pages fetched on 12 Oct 2026. Nespresso subscription and PDP details are partly from search (client-rendered site). For Lavazza, B2B cells include Lavazza Professional UK. For Kimbo, cells include Kimbo UK.

Column key: **LAV** = Lavazza US; **ILLY** = illy US; **SEG** = Segafredo US; **NES** = Nespresso US; **BOR** = Caffè Borbone; **KIM** = Kimbo; **VER** = Caffè Vergnano; **FAE** = Faema Canada; **WLL** = Whole Latte Love; **SCG** = Seattle Coffee Gear; **CHR** = Chris' Coffee; **WUP** = Wake Up Espresso (AT); **TRD** = Trade Coffee; **CCC** = Counter Culture; **STU** = Stumptown; **PAR** = Partners Coffee; **LAC** = La Colombe; **GUG** = Guglielmo USA today

**Shop & Product**

| Feature | LAV | ILLY | SEG | NES | BOR | KIM | VER | FAE | WLL | SCG | CHR | WUP | TRD | CCC | STU | PAR | LAC | GUG |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Shop by format (beans / ground / capsules / pods) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ | ◐ | ◐ | ✓ | ✓ | ✓ |
| Shop/filter by machine system or compatibility | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ◐ | ◐ | ◐ | ✓ | ◐ | ◐ | ◐ | ✗ | ✗ | ✗ | ✗ | ◐ |
| One consistent intensity or roast scale on cards + PDP | ◐ | ✓ | ◐ | ✓ | ✓ | ◐ | ◐ | ✗ | ◐ | ◐ | ✗ | ◐ | ✓ | ◐ | ◐ | ◐ | ◐ | ✗ |
| Tasting notes / flavor profile on PDP | ✓ | ✓ | ✓ | ✓ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ |
| Blend composition + origin on PDP | ✓ | ✓ | ✓ | ✓ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Brew / preparation guidance on PDP (text or video) | ✓ | ✓ | ✓ | ✓ | ◐ | ◐ | ✗ | ◐ | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ | ✗ |
| Faceted PLP filters (intensity, roast, notes, size...) | ✓ | ✓ | ◐ | ✓ | ◐ | ◐ | ✗ | ◐ | ✓ | ✓ | ◐ | ◐ | ✓ | ✓ | ◐ | ◐ | ✓ | ✗ |
| Product ratings & reviews on PDP | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Visible case / bulk / quantity-tier pricing | ◐ | ✓ | ✓ | ◐ | ✓ | ◐ | ✗ | ✓ | ◐ | ◐ | ✓ | ✓ | ✗ | ◐ | ✓ | ◐ | ✓ | ◐ |
| Bundles, tasting kits or build-a-box | ✓ | ✓ | ◐ | ✓ | ◐ | ✓ | ✗ | ◐ | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ |
| Coffee quiz / product finder | ✓ | ✗ | ✗ | ◐ | ✗ | ✓ | ✗ | ◐ | ◐ | ◐ | ◐ | ◐ | ✓ | ✓ | ✓ | ✓ | ◐ | ✗ |

**Subscription & Loyalty**

| Feature | LAV | ILLY | SEG | NES | BOR | KIM | VER | FAE | WLL | SCG | CHR | WUP | TRD | CCC | STU | PAR | LAC | GUG |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Subscribe & save on PDP | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ◐ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Self-serve flexibility (frequency, skip, pause, cancel) | ✓ | ✓ | ◐ | ✓ | ◐ | ✗ | ◐ | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Machine + coffee bundle or machine-and-capsule plan | ✓ | ✓ | ◐ | ✓ | ◐ | ◐ | ✗ | ◐ | ✓ | ✓ | ◐ | ✓ | ◐ | ✗ | ◐ | ✗ | ✗ | ◐ |
| Loyalty points / rewards | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ◐ | ✗ | ✗ | ✗ | ✓ | ✗ |
| Referral program | ✗ | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Gift cards / gift subscriptions / corporate gifting | ✗ | ◐ | ✗ | ✓ | ✓ | ✓ | ✗ | ✓ | ◐ | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |

**B2B / Trade**

| Feature | LAV | ILLY | SEG | NES | BOR | KIM | VER | FAE | WLL | SCG | CHR | WUP | TRD | CCC | STU | PAR | LAC | GUG |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Home vs Business split visible in header | ✓ | ◐ | ◐ | ✓ | ◐ | ◐ | ✓ | ✓ | ◐ | ✓ | ✓ | ◐ | ◐ | ✓ | ✓ | ✓ | ◐ | ◐ |
| Segment landing pages (cafe, restaurant, office, hotel) | ✓ | ✓ | ◐ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ◐ | ◐ | ◐ | ✗ | ◐ | ✓ | ✓ | ◐ | ✓ |
| Solution finder / short qualifying multi-step lead form | ✓ | ◐ | ◐ | ◐ | ✗ | ✗ | ◐ | ✓ | ✗ | ◐ | ✓ | ✗ | ✗ | ◐ | ◐ | ◐ | ✗ | ✗ |
| Trade login + online reorder portal | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ◐ | ✗ | ✗ | ◐ | ✗ | ✗ | ✓ | ✓ | ✓ | ◐ | ✗ |
| B2B proof: case studies, client logos, partner quotes | ✓ | ◐ | ✗ | ◐ | ✗ | ✗ | ◐ | ✓ | ◐ | ◐ | ◐ | ✗ | ◐ | ✓ | ✓ | ✓ | ✗ | ◐ |
| Training / academy for business customers | ✓ | ✓ | ✗ | ◐ | ✗ | ✓ | ✓ | ◐ | ◐ | ✓ | ◐ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| POS / marketing / merchandising support for partners | ✓ | ◐ | ✓ | ◐ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ◐ | ✓ | ✓ | ✗ | ◐ |
| Franchise or branded-cafe program page | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ◐ |

**Equipment & Service**

| Feature | LAV | ILLY | SEG | NES | BOR | KIM | VER | FAE | WLL | SCG | CHR | WUP | TRD | CCC | STU | PAR | LAC | GUG |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Equipment catalog with transparent prices (or clear quote CTA) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ◐ | ◐ | ◐ |
| Commercial lease / rental / financing program | ◐ | ✗ | ✗ | ◐ | ✗ | ✗ | ✗ | ✓ | ◐ | ◐ | ✓ | ✗ | ✗ | ◐ | ✗ | ◐ | ✗ | ◐ |
| Consumer financing (Affirm / Klarna / Afterpay) | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| Online service / repair request (ticket, RMA) | ◐ | ◐ | ✗ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ | ◐ | ✗ | ◐ |
| Preventive-maintenance or managed-service plans | ✓ | ✗ | ✗ | ◐ | ✗ | ✗ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✗ | ✓ | ✗ | ✓ | ✗ | ◐ |
| Machine registration, manuals, tutorials, parts | ✓ | ✓ | ✗ | ✓ | ◐ | ✗ | ✗ | ◐ | ✓ | ✓ | ✓ | ◐ | ✗ | ✗ | ✗ | ✗ | ✗ | ◐ |
| Water filtration / treatment offer | ◐ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ◐ |
| Refurbished / open-box / take-back / recycling | ✗ | ✓ | ✗ | ✓ | ◐ | ◐ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

**Locator & Community**

| Feature | LAV | ILLY | SEG | NES | BOR | KIM | VER | FAE | WLL | SCG | CHR | WUP | TRD | CCC | STU | PAR | LAC | GUG |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Store / cafe / stockist locator | ◐ | ✓ | ✗ | ✓ | ✗ | ✗ | ✓ | ✓ | ◐ | ✓ | ◐ | ◐ | ✗ | ✓ | ✓ | ✓ | ✓ | ◐ |
| Physical showroom, training center or flagship | ✓ | ✓ | ✗ | ✓ | ✗ | ◐ | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Classes, events or livestreams | ◐ | ◐ | ✗ | ◐ | ✗ | ✓ | ✓ | ◐ | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ | ✗ |

**Content & Brand**

| Feature | LAV | ILLY | SEG | NES | BOR | KIM | VER | FAE | WLL | SCG | CHR | WUP | TRD | CCC | STU | PAR | LAC | GUG |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Deep brand / origin / founder story | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Recipes & brew-guide library | ✓ | ✓ | ✓ | ✓ | ◐ | ✓ | ✓ | ◐ | ✓ | ✓ | ◐ | ◐ | ✓ | ✓ | ✓ | ✓ | ◐ | ✗ |
| Sustainability / certifications page | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ◐ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Video content (how-to, brand film) | ✓ | ✓ | ◐ | ✓ | ◐ | ◐ | ✓ | ◐ | ✓ | ✓ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ◐ | ✗ |
| Editorial blog / magazine | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ | ◐ |

**Conversion & Trust**

| Feature | LAV | ILLY | SEG | NES | BOR | KIM | VER | FAE | WLL | SCG | CHR | WUP | TRD | CCC | STU | PAR | LAC | GUG |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Free-shipping threshold shown (ideally cart progress bar) | ✓ | ✓ | ✓ | ◐ | ◐ | ◐ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ | ✓ | ✗ |
| Express wallets (Apple Pay / Shop Pay / Google Pay) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ |
| Phone / chat / human help visible | ✓ | ◐ | ◐ | ✓ | ◐ | ◐ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ | ◐ | ◐ | ◐ | ◐ | ✗ |
| Trust proof (heritage, certifications, counters, review counts) | ✓ | ✓ | ◐ | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ◐ | ◐ |
| Email capture with first-order incentive | ◐ | ✓ | ◐ | ◐ | ◐ | ◐ | ✗ | ◐ | ◐ | ◐ | ✓ | ◐ | ✓ | ◐ | ◐ | ◐ | ✓ | ✗ |

**Technical / SEO**

| Feature | LAV | ILLY | SEG | NES | BOR | KIM | VER | FAE | WLL | SCG | CHR | WUP | TRD | CCC | STU | PAR | LAC | GUG |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Homepage meta description | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Open Graph tags | ✗ | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Structured data (Organization / Product / LocalBusiness) | ✓ | ◐ | ✓ | ◐ | ✓ | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✗ |
| Accessibility statement / alt-text hygiene | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ | ◐ | ◐ | ✓ | ◐ | ◐ | ✓ | ✓ | ◐ | ✓ | ✗ |
| Modern commerce stack (Shopify, SFCC, AEM or equivalent) and lean front end | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ◐ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Localization (languages, regions, currency) done right | ✓ | ✓ | ✗ | ✓ | ◐ | ✗ | ✓ | ◐ | ✗ | ✗ | ✗ | ◐ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

| Site | LAV | ILLY | SEG | NES | BOR | KIM | VER | FAE | WLL | SCG | CHR | WUP | TRD | CCC | STU | PAR | LAC | GUG |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Coverage score (✓=1, ◐=0.5) of 52 | 41 | 43 | 25.5 | 42 | 27 | 27.5 | 25.5 | 34 | 34.5 | 39.5 | 34 | 32.5 | 30 | 36.5 | 35 | 37 | 30 | 11.5 |

---

## 5. UX patterns worth stealing

| # | Pattern | Who does it best | Why it works | Apply at Guglielmo USA |
|---|---|---|---|---|
| 1 | Header audience switch (Home / Business) that swaps the whole nav | Lavazza US | One domain, two clear journeys; B2B is never more than 1 click away | "For Home / For Business" pill in the utility bar; each mode has its own top nav and CTA |
| 2 | Coffee menu organised by machine system | Caffè Borbone; Kimbo; parent caffeguglielmoshop.it | Shoppers think "what fits my machine", not "which blend" | "Shop by your machine": pick system (36 mm capsule, 38 mm pod, ESE 44 mm, Nespresso-compatible, espresso machine, moka, drip) → filtered grid |
| 3 | "Suitable For" plus three icon facts on every card and PDP | illy | Removes compatibility doubt at a glance | Icon row: Format · Fits · Intensity |
| 4 | Intensity buckets as filter chips (Soft / Medium / Strong) | illy | Easier than a 1–13 slider; keeps facets short | Mild 1–4 / Balanced 5–7 / Bold 8–10 on a single 1–10 scale |
| 5 | Quiz tile embedded in the product grid | Lavazza ("Find your coffee match", PLAY) | Catches undecided browsers in context | 5-question "Trova il tuo caffè" quiz tile in the coffee grid |
| 6 | Quiz → curated trial | Trade (2-min quiz → 3-bag Discovery Trial, first bag free) | Converts a quiz into a low-risk first order | Quiz result offers a "Calabria Tasting Kit" plus subscribe toggle |
| 7 | Points earned shown on PDP | illy (+305 hearts), Lavazza ("Earns 25") | Makes loyalty concrete at the moment of decision | Phase 3 points line under price |
| 8 | Subscription on PDP with packs and frequency selector | illy | Same page, no separate funnel | Toggle "One-time / Subscribe & save X%", frequency 2/4/6/8 weeks |
| 9 | Machine + capsules plan | Lavazza My Way (machine up to $130 off + 25% capsules) | Machine at a discount, recurring capsule revenue | Discounted capsule machine (Espresso Plus VAP, Tube) with a 6-month capsule subscription |
| 10 | Visible quantity-tier messaging | Borbone ("more you buy, more you save", up to 20%); Wake Up (5+1 kg) | Turns bulk pricing into a reason to buy | Tier table on PDP: 6 / 12 / 18 units with per-unit price |
| 11 | Four-step B2B solution finder | Lavazza Professional UK | Qualifies leads in under a minute; reads like help, not a form | Venue → cups/day → needs (coffee, machine, service, water, training) → contact |
| 12 | Lease / rent-to-own calculator with emailable estimate | Faema Canada (Econolease) | Converts "call for price" into a monthly number; captures lead email | Calculator on WEGA/BFC/Rocket pages and a Lease page |
| 13 | Beans-vs-capsules cost calculator with business presets | Faema Canada | Quantifies the office pitch | "What does office coffee cost per cup?" tool → proposal CTA |
| 14 | Tech-request triage by customer type | Counter Culture | Routes partners to priority service, prospects to sales, consumers to support | Service form: Partner / Business / Home → machine, serial, photos, urgency |
| 15 | Wholesale page as a proof stack (segments → partner stories → benefits → contact) | Stumptown; Partners | Answers "what do I get" before asking for details | Segments → Boston partner stories → pillars (coffee, equipment, service, water, training, POS) → finder |
| 16 | Trade portal with PO number and reorder | Segafredo contracted wholesale; Nespresso Pro EasyOrder | Cuts phone and email order handling | Phase 2 trade login with saved orders and PO field |
| 17 | Founder-led expertise and onboarding | Wake Up (machine tested, grinder pre-dialled, WhatsApp onboarding) | Turns the importer's know-how into a feature | "Set up by our techs" plus a 15-min video onboarding for every machine |
| 18 | Free-shipping progress bar in cart | Stumptown ("$45 away"); Seattle Coffee Gear | Lifts average order value with zero friction | Threshold message in mini-cart and on PDP |
| 19 | Locator with filters by type and radius | illy (illy Caffès / illy Shop); Vergnano (radius) | Proves local presence; drives foot traffic for partners | "Find Guglielmo": Cafés & restaurants / Retailers / Distributors |
| 20 | Perfect-serve kit | Vergnano (cup, spoon, Caffeino water glass) | Brand visibility in venues; justifies premium | Partner kit using the existing Guglielmo cups and Caffeino glass |

---

## 6. Anti-patterns to avoid

1. **Inconsistent product scales.** Lavazza shows 3/5, 5/10 and 7/13 on one homepage. Define one scale and use it everywhere.
2. **Locale leakage.** Borbone's en-us store prices in USD under an Italian free-shipping banner. Vergnano's EN pages show Italian strings and caffevergnano.us puts raw PHP in its title. Danesi's /en goes to an Italian blog post. Never let parent-site copy or untranslated strings leak into the US site.
3. **Test or admin artefacts in production.** Kimbo's "test-collezione" URL, Lavazza's `{multipleValueDisclaimer}` token in the markup, and Guglielmo's own "Order Adjustment" SKU and raw shortcodes. Add a pre-launch QA checklist.
4. **"Call for price" and $0 machines.** Faema and Chris' show a price, a monthly figure or a "Request quote" flow instead.
5. **Long, unqualified B2B forms and gated brochures behind three consent boxes** (Vergnano). Keep the first step short and progressive, and gate only high-value assets.
6. **mailto-based service requests** (Faema). Requests aren't tracked and photos and serials get lost. Use a real form feeding a ticket inbox.
7. **Contradictory heritage claims.** Chris' Coffee says "over 45" and "over 50 years" on one page. Guglielmo says 60 vs 70 years, and 7 vs 8 blends. Keep one source of truth for facts (founded 1943; L'Espresso USA since 2000).
8. **Brochure-only distributor microsites** (Vergnano Canada and UAE). They have no products, prices or path to buy. Distributors need commerce or at least "where to buy".
9. **Client-rendered everything** (Nespresso, parts of illy). Server-render product and category content for SEO and robustness.
10. **Promo stacking** (Lavazza: code, plus tiered dollars off, plus subscription percent). Choose one primary offer per season.
11. **Catalog sprawl in the mega-menu.** Faema mixes pizza ovens and gelato into coffee navigation; Whole Latte Love's mega-menu has 60+ links. Guglielmo should keep Brasilena, candy and cups in a "Gifts & Italian pantry" group, not in the coffee tree.
12. **Fragmented B2B domains without a bridge** (Segafredo runs three Shopify stores). If a trade portal is separate, link it from the header and footer of the main site.
13. **Over-showing out-of-stock items.** Instead of 40 of 87 SKUs dead-ending, hide them from listings or show them with "Notify me" (Lavazza, illy).

---

## 7. Recommended feature set for Guglielmo USA

### Must-have (launch)
| Feature | Rationale | Benchmark |
|---|---|---|
| Home / Business switch in header with two parallel nav trees | Serves both audiences; ends B2B being buried under "Join Us" | Lavazza US; Faema Canada; Nespresso |
| "Shop by your machine" selector + compatibility badge on every SKU | 36 mm capsules, 38 mm pods and 44 mm ESE pods make compatibility the #1 question | Borbone; illy "Suitable For"; Kimbo |
| Standard coffee PDP (1–10 intensity, roast, notes, Arabica/Robusta %, origin, brew methods, cost per cup) | Blends currently get 1–2 sentences and no intensity | illy; Lavazza; Segafredo |
| Faceted listing filters (format, system, intensity, roast, decaf, size, home/office/bar) | 87 SKUs across several pod formats need filters | Lavazza 9 facets; illy; Seattle Coffee Gear |
| Subscribe & Save on PDP with self-serve skip, pause and cancel | No subscription today on a repeat-purchase category | illy 20%; Lavazza 25%; Wake Up |
| Visible volume-tier table (6/12/18, case packs) | Makes the hidden 5–8% plugin discount persuasive | Borbone; illy Case Packs; Wake Up 5+1 |
| Reviews + star ratings + review schema | Zero reviews; every benchmark has social proof | Segafredo (Judge.me); Partners (Okendo) |
| Catalog hygiene: remove "Order Adjustment", back-in-stock alerts, "Request a quote" instead of $0 | About 40/87 out of stock, $0 machines | Lavazza / illy "Notify me"; Faema; Chris' Coffee |
| B2B solution finder (4 steps) replacing the long form | Better lead quality and conversion | Lavazza Professional UK; Chris' Coffee |
| "Book a tasting / consultation" CTA on all business pages | An importer's strongest hook is tasting on the client's own machine | Vergnano; Seattle Coffee Gear; Stumptown |
| Service request form with triage, serial and photos | On-site service has no online entry point | Counter Culture; Whole Latte Love; Chris' Coffee |
| "Find Guglielmo" map (venues, retailers, distributors) | Replaces the text list and 3-pin locator | illy locator; Vergnano finder |
| Real brand story (Calabria 1943, Copanello, L'Espresso USA 2000, Mimmo Elia) with consistent facts | 44-word page and conflicting claims | illy; Wake Up; Chris' Coffee |
| Contact and trust essentials (phone, verified address, hours, ISO 9001, certifications) | Contact page has no phone or address | Faema; Danesi phone block |
| Apple Pay / Google Pay / PayPal + free-shipping progress bar | Only PayPal plus card today | Stumptown; Seattle Coffee Gear; Segafredo |
| SEO baseline (meta, OG, Product/Organization/LocalBusiness schema, alt text, performance budget) | None present; about 101 assets per page | Faema; Segafredo |
| Working newsletter with first-order incentive; remove broken shortcode pages | Newsletter and referral pages are broken | Chris' Coffee 10%; illy 20% |

### Should-have (phase 2)
| Feature | Rationale | Benchmark |
|---|---|---|
| Coffee finder quiz ending in a subscribe CTA | Guides newcomers through 7–8 blends and 4 formats | Lavazza; Trade; Kimbo "Che caffè sei?" |
| Machine + capsule starter bundles / machine-with-subscription | Locks in capsule revenue per machine sold | Lavazza My Way; Whole Latte Love Better Together; Wake Up |
| Tasting / discovery kit | Low-risk first order for homes and offices | Kimbo Kit degustazione; Trade; Wake Up Probiersets |
| Trade portal (login, reorder, saved orders, PO, account pricing, invoices) | Cuts manual order handling for repeat wholesale | Segafredo; Nespresso Pro EasyOrder; Partners |
| Lease / rent-to-own page with calculator + Affirm/Klarna for Rocket | Replaces "call for price" with a monthly number | Faema Econolease; Chris' Coffee; Seattle Coffee Gear |
| Service plans page (PM tiers, response time, coverage map, water treatment) | Productizes service and water treatment | Counter Culture; Chris' Coffee; Partners |
| Segment pages with case studies, client logos, partner quotes | Turns the restaurant list into B2B proof | Stumptown; Faema; Lavazza Food Service Stories |
| Guglielmo Point franchise landing page (concept, formats, support, investment range, steps, brochure, map) | A bare long form offers nothing to evaluate | Vergnano 1882; illy franchise page |
| "Become a distributor / retailer" page with territory map | Only 3 distributors today | Vergnano distributor page; Guglielmo nel mondo |
| Brew guides and recipes hub (incl. Brasilena mocktails, affogato) | SEO plus product education per format | illy Recipe Guide; Segafredo Brewing Manual |
| Machine support hub (manuals, descaling videos, parts, registration) | Fewer support calls; sells Puly cleaners and gaskets | illy; Nespresso; Whole Latte Love |
| Office beans-vs-capsules cost calculator | Quantifies the office pitch and captures leads | Faema; Lavazza Pro calculator |

### Could-have (phase 3)
| Feature | Rationale | Benchmark |
|---|---|---|
| Loyalty points shown on PDP, 2x on subscriptions | Rewards repeat buyers; mirrors the parent's Fidelity Card | illy Lovers; My Lavazza; caffeguglielmoshop.it |
| Referral program | Word of mouth drives Italian-American communities | illy; Nespresso; Trade |
| Bookable barista training and classes | Raises drink quality at partners; builds community | Kimbo UK; Counter Culture; Wake Up |
| Capsule recycling / machine take-back | Answers the capsule-waste objection | Nespresso; illy |
| Gift cards, gift subscriptions, corporate gifting | Capsules, cups and sweets are strong gifts | Nespresso; Trade; Counter Culture |
| Italian-American care package ("Il Pacco da giù" spirit) | Distinctive, brand-owned gift | caffeguglielmoshop.it |
| Video / WhatsApp onboarding and virtual demo for machine buyers | Brings importer expertise online | Wake Up; Whole Latte Love CoffeeCast |
| Repair status lookup | Fewer "where's my machine" calls | Orizont Line |
| Refurbished / open-box machines | Entry price point; monetizes trade-ins | Chris' Coffee; Seattle Coffee Gear; Faema |
| Perfect-serve partner kit (cup, spoon, Caffeino glass, POS) | Brand visibility in venues | Vergnano; Stumptown POS kit |

---

## 8. Recommended information architecture (combined consumer + business importer)

### 8.1 Global header
- **Utility bar:** For Home | For Business (switch, remembered per visitor) · Find Guglielmo · Trade Login · phone (617) · Free shipping over $X
- **Main bar:** Logo · mode-specific top nav (below) · Search · Account · Cart
- **Persistent CTA:** Home mode "Subscribe & Save"; Business mode "Book a Tasting"

### 8.2 Top nav, Home mode
1. **Coffee**
   - Shop by machine: Guglielmo capsule machines (36 mm), pod machines (38 mm), ESE 44 mm pods, Nespresso-compatible (if sold), espresso machine, moka, drip
   - By format: Whole Bean · Ground · Capsules · ESE & Pods · Drip (American) · Decaf & Organic
   - By blend: Extra Bar · 5 Stelle · Espresso Bar · Espresso Classico · Caffetteria · Copacabana · Club 99 · Oro / Rosso / DEK 70 capsules
   - Tasting Kit · Best Sellers · Coffee Finder (quiz)
2. **Machines**
   - Capsule & Pod Machines (by system)
   - Home Espresso (Rocket)
   - Grinders
   - Machine + Coffee Bundles
   - Care & Cleaning (Puly, water softener, gaskets)
   - "Commercial machines →" (switches to Business)
3. **Subscribe**
   - How it works · Coffee subscription · Machine + capsule plan · Manage my subscription
4. **Gifts & Italian Pantry**
   - Cups & Caffeino glass · Brasilena · Espresso candy · Gift sets · Gift cards (phase 3)
5. **Learn**
   - Our Story (Calabria 1943 → Boston 2000) · Our Blends & Intensity Guide · Brew Guides · Recipes · Machine Support (manuals, descaling, registration) · Journal
6. **Find Guglielmo**
   - Cafés & Restaurants map · Retailers · Distributors

### 8.3 Top nav, Business mode
1. **Solutions**
   - Cafés & Espresso Bars · Restaurants & Pizzerias · Offices (OCS) · Hotels & Catering · Retail & Grocery
2. **Coffee Program**
   - Wholesale blends & formats · Request a tasting · Perfect serve & POS kit · Training
3. **Equipment**
   - Commercial espresso (WEGA, BFC) · Office capsule systems (Multi Cap, Double Cap, Maxi Cap) · Grinders · Water treatment · Lease & Financing (calculator)
4. **Service & Support**
   - Request service · Maintenance plans · Coverage area · Manuals & parts · Repair status (phase 3)
5. **Partner With Us**
   - Guglielmo Point franchise · Become a distributor / retailer · Case studies
6. **CTAs:** Trade Login / Reorder · primary button "Get a Proposal" (opens the solution finder)

### 8.4 Footer
- **Shop:** Coffee · Machines · Subscribe · Gifts · Tasting Kit · Gift Cards
- **Business:** Solutions · Equipment · Lease & Financing · Service Plans · Franchise · Become a Distributor · Trade Login
- **Support:** Contact · Shipping & Returns · Subscription FAQ · Machine Support · Request Service · Order Status
- **Company:** Our Story · Guglielmo in Italy (parent link) · Find Guglielmo · Press / The Buzz · Careers
- **Contact block (NAP):** verified address · phone · email · hours · Google Map link
- **Trust row:** founded 1943 · ISO 9001 (parent) · certifications · payment icons (Apple Pay, Google Pay, PayPal, cards)
- **Other:** newsletter with incentive · social · legal (Terms, Privacy, Subscription Terms, Accessibility Statement)

### 8.5 Key flows to design
1. **Consumer coffee purchase:** Shop by machine → filtered listing → PDP with "Fits your machine" confirmation → One-time / Subscribe → cart with free-shipping bar → wallet checkout.
2. **Subscription:** PDP toggle or quiz result → frequency → account "Manage subscription" (skip, pause, swap blend, change date, cancel).
3. **B2B lead:** Business mode → Solution page → "Get a Proposal" finder (venue → cups/day → needs → contact) → confirmation with "Book a tasting" calendar → CRM routing.
4. **Service request:** Service & Support → triage (Partner / Business / Home) → machine, serial, photos, urgency → ticket number → (phase 3) status lookup.
5. **Franchise and distributor:** landing page → brochure or download → short application → call booking.
6. **Trade reorder (phase 2):** Login → last orders → reorder with PO number → net-terms checkout.

---

## 9. Sources (primary URLs fetched)
- Lavazza: https://www.lavazzausa.com/en · https://www.lavazzausa.com/en/business · https://www.lavazzausa.com/en/my-way-coffee-subscription · https://www.lavazzausa.com/en/whole-bean-coffee · https://www.lavazzausa.com/en/whole-bean-coffee/espresso-barista-gran-crema · https://www.lavazzapro.co.uk/ · https://flavia.com/
- illy: https://www.illy.com/en-us · https://www.illy.com/en-us/coffee/whole-bean-coffee · https://www.illy.com/en-us/coffee/whole-bean-coffee/whole-bean-classico-coffee-medium-roast-500g/I0003859ST.html · https://www.illy.com/en-us/coffee-delivery/coffee-subscription-home · https://www.illy.com/en-us/professional-partners · https://www.illy.com/en-us/storesfind · https://www.illy.com/en-us/company/store-events/press/press-releases/illy-ammirati
- Segafredo: https://segafredocoffee.com/ · https://segafredocoffee.com/products/vivace-medium-roast · https://foodservice.segafredocoffee.com/ · https://wholesale.segafredocoffee.com/ · https://www.segafredo.it/en
- Nespresso: https://www.nespresso.com/us/en · https://www.nespresso.com/pro/us/en · https://www.contact.nespresso.com/faq/gb/en/detail/5787 (subscription model, UK)
- Italian roasters: https://www.caffeborbone.com/en-us · https://kimbo.it/ · https://www.kimbo.co.uk/ · https://www.caffevergnano.com/en/ · https://www.caffevergnano.com/en/business/cafes-and-restaurants/ · https://www.caffevergnano.com/en/business/why-choose-caffe-vergnano-1882/ · https://www.caffevergnano.us/ · https://www.caffevergnano.ca/ · https://www.caffevergnano.ae/ · https://www.saquella.it/en/ · https://danesicaffe.it/ · https://caffemauro.com/en/
- Distributors: https://faema.ca/ · https://faema.ca/pages/commercial-leasing · https://faema.ca/pages/cost-benefit-calculator · https://faema.ca/pages/service-centre · https://www.chriscoffee.com/ · https://www.chriscoffee.com/pages/local · https://www.chriscoffee.com/pages/repair-services · https://www.wholelattelove.com/ · https://www.seattlecoffeegear.com/ · https://www.1st-line.com/ · https://www.wakeup-espresso.com/ · https://www.caffeguglielmo.cz/ · https://www.orizontline.ch/ · https://www.mini-italia.ca/en · https://www.caffeguglielmoshop.it/ · https://www.caffeguglielmoshop.it/guglielmo-nel-mondo/
- DTC: https://www.drinktrade.com/ · https://www.drinktrade.com/blogs/education/coffee-quiz-answers-explained · https://counterculturecoffee.com/ · https://counterculturecoffee.com/pages/tech-service · https://counterculturecoffee.com/pages/partner-with-us · https://www.stumptowncoffee.com/ · https://www.stumptowncoffee.com/pages/wholesale · https://www.partnerscoffee.com/ · https://www.partnerscoffee.com/pages/wholesale · https://www.partnerscoffee.com/pages/office-coffee · https://www.lacolombe.com/ · https://www.lacolombe.com/pages/membership · https://www.bluebottlecoffee.com/us/eng/subscriptions (search snippet only)
