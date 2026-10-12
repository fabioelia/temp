/*!
 * Concept 02 "Calabria" — site chrome, shared editorial components and the "slow tide" motion choreography.
 * Load order: catalog.js, brand.js, locations.js, (maps.js), gusa-kit.js, GUSA.init, motion.js, gusa-motion.js,
 * js/page-*.js (registers window.CAL_PAGES[page]), then this file. It renders the chrome, runs the page module,
 * and ends with GUSA.motion.init({...}) followed by the bespoke Motion scenes.
 */
(function () {
  "use strict";

  var G = window.GUSA, $ = G.$, $$ = G.$$, esc = G.esc, money = G.fmt.money;
  var MO = G.motion || { live: false, drawer: function () { return Promise.resolve(); }, flyToCart: function () { return Promise.resolve(); }, bump: function () {}, list: function () {}, swap: function (c, r) { r(); return Promise.resolve(); }, number: function (el, v, f) { el.textContent = f ? f(v) : v; return Promise.resolve(); } };
  var M = window.Motion;
  var PAGE = document.body.getAttribute("data-page") || "";
  var TIDE = [0.16, 1, 0.3, 1]; // long, soft settle: the "slow tide" curve

  /* ---------------------------------------------------------------- icons */
  var I = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h12"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M2 6h11v10H2zM13 9h4l4 4v3h-8"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>',
    wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 1-2-2Z"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M7 4 3 8l4 4M3 8h14M17 12l4 4-4 4M21 16H7"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V9Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17M3 21h16"/></svg>'
  };

  /* ---------------------------------------------------------------- shared data */
  function src(p) { if (!p) return ""; return /^assets\//.test(p) ? G.img(p) : p; }

  var NAV = {
    home: [
      { label: "Coffee", href: "shop.html#cat=coffee", pages: ["shop", "product"] },
      { label: "Machines", href: "shop.html#cat=machine" },
      { label: "Tasting Room", href: "tasting.html", pages: ["tasting"] },
      { label: "Il Giornale", href: "journal.html", pages: ["journal", "article"] },
      { label: "For Business", href: "business.html", pages: ["business"] },
      { label: "Our Story", href: "story.html", pages: ["story"] }
    ],
    business: [
      { label: "Solutions", href: "business.html#segments", pages: ["business"] },
      { label: "Equipment", href: "shop.html#cat=machine&for=business" },
      { label: "Wholesale coffee", href: "shop.html#for=business", pages: ["shop", "product"] },
      { label: "Tasting Room", href: "tasting.html", pages: ["tasting"] },
      { label: "Service", href: "business.html#services" },
      { label: "Our Story", href: "story.html", pages: ["story", "journal", "article"] }
    ]
  };
  var CTA = {
    home: { label: "Subscribe & save", href: "product.html#5-stelle-1kg-beans" },
    business: { label: "Book a tasting", href: "business.html#lead" }
  };

  /* Il Giornale: the magazine's stories (one is fully written in article.html) */
  var JOURNAL = [
    { slug: "from-copanello-to-the-north-end", no: "01", cat: "Origins", mins: 7, written: true,
      title: "From Copanello to the North End",
      dek: "A roastery on the Ionian coast, an importer in Boston and the 4,390 miles of counter between them.",
      img: "assets/img/stock/boston-community-north-square-01.jpg", alt: "Red-brick buildings with green copper bay windows around North Square in Boston's North End",
      place: "North Square, North End, Boston", coord: "42.364° N 71.054° W", blend: "espresso-classico" },
    { slug: "corso-mazzini-1943", no: "02", cat: "History", mins: 5,
      title: "Corso Mazzini, 1943",
      dek: "A grocery apprentice, a small shop in old Catanzaro and a single coffee machine: where the Guglielmo story starts.",
      img: "img/duo-bar-counter.jpg", alt: "Archival photo of an early Guglielmo coffee bar in Catanzaro, barista at a lever machine under the GUGLIELMO sign",
      place: "Catanzaro", coord: "38.91° N 16.59° E", blend: "silver-signature",
      open: ["Guglielmo Papaleo learned the trade as a shop boy in a grocery in the old town of Catanzaro, starting in 1935. In 1943 he opened a small shop of his own on Corso Mazzini, with one small coffee machine inside. The brand still counts its history from that year.", "By 1947 coffee had become the business: production and sale began, and the shop was enlarged so customers could taste the coffee on the spot. In 1950 the first Guglielmo bar opened, and two years later the business moved to the Stratò district, selling across the province from advertising vans shaped like a coffee pot with cups."] },
    { slug: "inside-copanello", no: "03", cat: "The roastery", mins: 6,
      title: "Inside the Copanello roastery",
      dek: "Every origin roasted on its own, up to about 300 °C, and only then blended. The four phases, in order.",
      img: "assets/img/brand/usa-roastery-roasting-plant.jpg", alt: "Orange-red drum roaster and stainless steel ducting inside the Copanello plant",
      place: "Copanello di Stalettì", coord: "38.76° N 16.56° E", blend: "extra-bar",
      open: ["Construction began at Copanello, on the Ionian coast, in 1968. The plant opened in 1972 with modern machinery, and the company became a joint-stock company the same year. It spans 10,000 square meters and has a capacity of 3,000 tonnes of coffee a year.", "Green coffee arrives from Brazil, Central America, Ethiopia, Indonesia and Vietnam, among other origins. It is cleaned of leaves, twigs and stones and evaluated by specialists before it goes near a roaster. Each origin is then roasted separately, with a roast time set for that origin, and the roasted coffees are blended into each recipe."] },
    { slug: "espresso-italiano-explained", no: "04", cat: "Quality", mins: 4,
      title: "Espresso Italiano Certificato, explained",
      dek: "What it means that Extra Bar and Club 99 beans carry the mark of the Istituto Nazionale Espresso Italiano.",
      img: "assets/img/stock/espresso-shot-topdown-stone-01.jpg", alt: "A white espresso cup with tight golden crema on dark slate, seen from above",
      place: "Tasting bench", coord: "", blend: "club-99",
      open: ["The Istituto Nazionale Espresso Italiano (INEI) certifies blends against a defined espresso: a set dose, water temperature, pressure, time and cup, judged by trained tasters. Caffè Guglielmo joined the institute in 2008.", "Our production page lists Extra Bar beans and Club 99 beans as certified \"Espresso Italiano\" under Annex No. 33 of Certificate No. 214, a CSQA-recognized scheme. We are confirming the current certificate status with Guglielmo before this page goes live."] },
    { slug: "moka-the-calabrian-way", no: "05", cat: "Brewing", mins: 4,
      title: "Moka, the Calabrian way",
      dek: "No tamping, a low flame, and the pot off the heat before it sputters. Our method for the stovetop.",
      img: "assets/img/stock/home-moka-pot-stove-01.jpg", alt: "A classic moka pot on a gas hob beside a jar of ground coffee in a sunlit kitchen",
      place: "A home kitchen", coord: "", blend: "espresso-classico",
      open: ["Espresso Classico is the blend that started the Guglielmo tradition and a staple in Southern Italian homes, built for the moka pot. Fill the base with water to just below the valve, then fill the basket with ground coffee and level it with a finger. Do not press it down.", "Use a low flame, leave the lid open, and take the pot off the heat as soon as the coffee turns pale and begins to gurgle. Stir in the pot before you pour, so the first and last cups taste the same."] },
    { slug: "brasilena", no: "06", cat: "Pantry", mins: 3,
      title: "Brasilena, Calabria's coffee soda",
      dek: "Born as a gazzosa al caffè in a 1930s village shop in Girifalco, and still made there from Calabrian mineral water.",
      img: "assets/img/brand/usa-brasilena-bottles-6pack.jpg", alt: "A six-pack carton of Brasilena coffee soda bottles with the sombrero-girl illustration",
      place: "Girifalco, province of Catanzaro", coord: "38.82° N 16.43° E", product: "brasilena-can-single",
      open: ["Brasilena is what Calabria drinks when it is too late for an espresso and too early for an aperitivo. It began in the 1930s, when the Cristofaro family's grandfather made a gazzosa al caffè in his small emporium in Girifalco, roasting the coffee himself.", "It is still made by the family's company, Acqua Calabria, at Monte Covello: real coffee infused in Calabrian mineral water, lightly sparkling and bittersweet. Brasilena comes from Calabria; it is not a Guglielmo product, but we import it because no Calabrian pantry is complete without it. Serve it ice-cold."] },
    { slug: "us-catanzaro-capsules", no: "07", cat: "Calcio", mins: 3,
      title: "Match day in a capsule",
      dek: "Guglielmo has long backed U.S. Catanzaro. Since 2023 the club's yellow-and-red capsules have reached the US.",
      img: "assets/img/brand/usa-pack-catanzaro-capsules-box.jpg", alt: "U.S. Catanzaro co-branded capsule box in yellow and red with the club crest",
      place: "Catanzaro", coord: "38.91° N 16.59° E", blend: "catanzaro-cz",
      open: ["Guglielmo has been a long-time main sponsor of U.S. Catanzaro, the club of the city where the company was born. The co-branded capsules wear the team's yellow and red, with the club crest beside the Guglielmo roundel.", "They arrived in the US in 2023, the year of Guglielmo's eightieth anniversary. Each box holds 40 capsules for Espresso Point-type 36 mm machines, with an intense, creamy blend inside."] },
    { slug: "aiming-for-the-center", no: "08", cat: "Design", mins: 4,
      title: "Aiming for the center",
      dek: "How a concentric target and four words, il caffè che fa centro, became the brand's signature.",
      img: "assets/img/brand/lifestyle-range-on-roundel.jpg", alt: "Guglielmo coffee bags and roasted beans in front of a giant orange, yellow and red roundel",
      place: "Studio", coord: "", blend: "5-stelle",
      open: ["The roundel is three rings: orange outside, yellow in the middle, red at the center. With it comes the slogan il caffè che fa centro, the coffee that hits the bullseye. Wikipedia dates the identity to 1985; the company's own timeline places it between 1972 and 1987.", "The story often told is that it replaced an earlier logo of William Tell, Guglielmo Tell in Italian, shooting at a target. We are checking that detail with the company's archive. What is certain is the idea: a cup that hits the mark."] }
  ];

  /* Tasting Room data. Sweetness and bitterness, pairings and pack art are the agency's proposals (see README). */
  var BLENDX = {
    "extra-bar": { sw: 4, bi: 7, ar: null, comp: "Arabica and Robusta · split not published", pair: ["Dark chocolate", "Cornetto with a cappuccino", "Tiramisù"], pack: "assets/img/brand/pack-extra-bar-1kg-beans.jpg", life: "assets/img/brand/lifestyle-extra-bar-range.jpg", hero: "extra-bar-1kg-beans", short: "Extra Bar" },
    "5-stelle": { sw: 7, bi: 5, ar: null, comp: "Arabica-led: Central American and Brazilian Arabica with other select origins · split not published", pair: ["Cornetto alla crema", "Almond biscotti", "Ricotta cannolo"], pack: "assets/img/brand/pack-5-stelle-1kg-beans.jpg", life: "assets/img/brand/lifestyle-5-stelle-range.jpg", hero: "5-stelle-1kg-beans", short: "5 Stelle" },
    "espresso-bar": { sw: 7, bi: 4, ar: null, comp: "Arabica and Robusta · split not published", pair: ["Biscotti", "Cornetto", "Almond pastries"], pack: "assets/img/brand/pack-espresso-bar-1kg-beans.jpg", hero: "espresso-bar-1kg-beans", short: "Espresso Bar" },
    "espresso-classico": { sw: 5, bi: 7, ar: null, comp: "African and Asian Robusta with Brazilian and Central American Arabica · split not published", pair: ["Crostata", "Mostaccioli (Calabrian honey biscuits)", "Fette biscottate at breakfast"], pack: "assets/img/brand/pack-espresso-classico-1kg-beans.png", life: "assets/img/brand/lifestyle-espresso-classico-range.jpg", hero: "espresso-classico-1kg-beans", short: "Classico" },
    "caffetteria": { sw: 4, bi: 8, ar: null, comp: "Arabica and Robusta from South America, Africa and Asia · split not published", pair: ["70% dark chocolate", "Affogato with fior di latte", "Tiramisù"], pack: "assets/img/brand/pack-caffetteria-1kg-beans.jpg", hero: "caffetteria-1kg-beans", short: "Caffetteria" },
    "copacabana": { sw: 5, bi: 7, ar: 20, comp: "20% Arabica, 80% Robusta", pair: ["Brioche with a cappuccino", "Chocolate cake", "Hazelnut biscotti"], pack: "assets/img/brand/pack-copacabana-1kg-beans.jpg", hero: "copacabana-1-kg-beans", short: "Copacabana" },
    "club-99": { sw: 7, bi: 4, ar: null, comp: "Prized Central American Arabica with a complement of Robusta · split not published", pair: ["Ricotta cannolo", "Amaretti", "Panna cotta"], pack: "assets/img/brand/usa-pack-club-99-250g-ground.jpg", life: "assets/img/brand/lifestyle-club-99-range.jpg", hero: "club-99-250g-ground", short: "Club 99" },
    "silver-signature": { sw: 6, bi: 4, ar: null, comp: "Fine Arabica coffees · share not published", pair: ["Lemon cake", "Amaretti", "Almond biscotti"], pack: "assets/img/brand/pack-silver-signature-250g-can.jpg", life: "assets/img/brand/lifestyle-silver-signature-gift-set.jpg", hero: "special-edition-can", short: "Silver" },
    "organic": { sw: 6, bi: 3, ar: 100, comp: "100% Arabica, certified organic", pair: ["Oat biscuits", "Fruit crostata", "Fresh ricotta with honey"], pack: "assets/img/brand/pack-organic-250g-can.jpg", hero: "organic-espresso", short: "Organic" },
    "decaf": { sw: 6, bi: 3, ar: 100, comp: "100% Arabica, decaffeinated to below 0.10% caffeine", pair: ["Panna cotta after dinner", "Tiramisù", "Dark chocolate"], pack: "assets/img/brand/pack-decaf-250g-can.jpg", hero: "espresso-decaf-250g-ground-bag", short: "Decaf" },
    "oro70": { sw: 7, bi: 3, ar: 100, comp: "100% Arabica", pair: ["Lemon biscotti", "Fruit tart", "Cornetto"], pack: "assets/img/brand/usa-pack-oro70-capsules-10.jpg", life: "assets/img/brand/usa-lifestyle-oro70-capsules-beans.jpg", hero: "oro70-capsules-120-pack", short: "ORO70" },
    "rosso70": { sw: 4, bi: 7, ar: null, comp: "Arabica and Robusta, Gusto Classico · split not published", pair: ["Cornetto", "Ricotta cannolo", "Dark chocolate"], pack: "assets/img/brand/usa-pack-rosso70-capsules-10.jpg", hero: "rosso70-capsules-120-pack", short: "ROSSO70" },
    "dek70": { sw: 5, bi: 3, ar: null, comp: "Decaffeinated, caffeine at most 0.10% · share not published", pair: ["Amaretti", "Dark chocolate", "Panna cotta"], pack: "assets/img/brand/usa-pack-dek70-capsules-10.jpg", hero: "dek70-capsules-120-pack", short: "DEK70" },
    "catanzaro-cz": { sw: 4, bi: 7, ar: null, comp: "Not published", pair: ["Crostata", "Dark chocolate", "Biscotti on match day"], pack: "assets/img/brand/usa-pack-catanzaro-capsule.jpg", hero: "cz-capsules-40-pack", short: "Catanzaro" }
  };
  var TASTING_ORDER = ["extra-bar", "5-stelle", "espresso-classico", "club-99", "espresso-bar", "caffetteria", "copacabana", "silver-signature", "organic", "decaf", "rosso70", "oro70", "dek70", "catanzaro-cz"];

  /* Sharper packshots for catalog items whose own image is small */
  var IMG_OVERRIDE = {
    "extra-bar-1kg-beans": "assets/img/brand/pack-extra-bar-1kg-beans.jpg",
    "copacabana-1-kg-beans": "assets/img/brand/pack-copacabana-1kg-beans.jpg",
    "espresso-classico-250g-ground": "assets/img/brand/pack-espresso-classico-250g-ground.png",
    "espresso-decaf-250g-ground-can": "assets/img/brand/pack-decaf-250g-can.jpg",
    "espresso-capsules-150": "assets/img/brand/pack-espresso-capsule-point.jpg",
    "espresso-capsules-20-pack": "assets/img/brand/pack-espresso-capsule-point.jpg",
    "espresso-decaf-capsule-100": "assets/img/brand/pack-decaf-capsule-point.jpg"
  };

  function imgOf(p, i) {
    if (!p) return "";
    if (!i && IMG_OVERRIDE[p.slug]) return src(IMG_OVERRIDE[p.slug]);
    var list = p.images || [];
    return src(list[i || 0] || list[0] || "");
  }

  /* ---------------------------------------------------------------- product facts */
  function fitsOf(p) {
    if (!p) return [];
    if (p.system === "espresso-point-36" || p.system === "nespresso-original" || p.system === "ese-44") return [p.system];
    if (p.system === "traditional") return ["traditional"];
    if (p.format === "beans" || p.format === "ground") return ["traditional"];
    if (p.format === "drip-beans" || p.format === "drip-ground") return ["drip"];
    if (p.slug === "water-softener-rdl") return ["ese-44", "espresso-point-36"];
    if (/^pod-holder/.test(p.slug)) return ["ese-44"];
    if (/^puly|^pulygrind/.test(p.slug)) return ["traditional"];
    return [];
  }
  function fitsLabel(p) {
    var s = p.system;
    if (p.category === "machine") {
      if (s === "espresso-point-36") return "Takes 36 mm capsules";
      if (s === "nespresso-original") return "Takes Espresso 70 capsules";
      if (s === "ese-44") return "Takes E.S.E. 44 mm pods";
      if (p.slug === "grinder") return "Whole-bean espresso";
      return "Beans & ground coffee";
    }
    if (s === "espresso-point-36") return "36 mm capsule machines";
    if (s === "nespresso-original") return "Nespresso® Original*";
    if (s === "ese-44") return "E.S.E. pod machines";
    if (s === "pod-38") return "38 mm pod machines";
    if (p.format === "beans") return p.blend === "decaf" && /6 kg/.test(p.size || "") ? "Bar grinders" : "Espresso machine + grinder";
    if (p.format === "ground") return /fine/i.test(p.name) ? "Moka pot" : "Moka & espresso machine";
    if (/drip/.test(p.format || "")) return "Drip & batch brewers";
    if (p.category === "care") return /softener/.test(p.slug) ? "RDL & Grimac machines" : (/pod-holder/.test(p.slug) ? "Pod machines" : "Espresso machines & grinders");
    if (p.category === "beverage") return "Serve ice-cold";
    if (p.category === "supplies") return "Office & events";
    return "Your counter";
  }
  function formatText(p) {
    if (p.category === "machine") {
      if (p.slug === "grinder") return "Espresso grinder";
      if (/wega/.test(p.slug)) return "Commercial espresso";
      if (/rocket/.test(p.slug)) return "Home espresso machine";
      return (p.system === "ese-44" ? "Pod machine" : "Capsule machine") + (/2-group/.test(p.slug) ? " · 2 group" : "");
    }
    if (p.format) return G.products.formatLabel(p.format) + (p.size ? " · " + p.size.replace(" capsules", "").replace(" pods", "") : "");
    if (p.category === "beverage") return /bottle/.test(p.slug) ? "Glass bottles" : "Cans";
    if (p.category === "gift") return "Gift set";
    if (p.category === "merch") return /candy|caramelle/.test(p.slug) ? "Hard candy" : "Cups & glassware";
    if (p.category === "care") return "Cleaning & care";
    if (p.category === "supplies") return "Cups & stirrer kit" + (p.size ? " · " + p.size : "");
    return G.products.categoryLabel(p.category);
  }
  function shortName(p) { return p.name.replace(/\s*\((\d+) Pack\)/, " ($1)"); }

  function gauge(n, opts) {
    opts = opts || {};
    if (!n) return '<span class="gauge__txt">Intensity —</span>';
    var b = G.intensityBucket(n), t = "";
    for (var i = 1; i <= 10; i++) t += '<i class="' + (i <= n ? "on" + (i === n ? " lead" : "") : "") + '"></i>';
    return '<span class="gauge' + (opts.lg ? " gauge--lg" : "") + '" role="img" aria-label="Intensity ' + n + ' of 10, ' + b.label + '"><span class="gauge__ticks" aria-hidden="true">' + t +
      '</span><span class="gauge__txt" aria-hidden="true"><b>' + n + '</b>/10 · ' + b.label + "</span></span>";
  }
  function unitPrice(p) {
    var u = G.products.pricePerUnit(p);
    if (!u) return "";
    return money(u.value) + " / " + u.unit;
  }
  function priceHTML(p) {
    if (p.quote) return '<span class="price">Price on request<small>Quoted with installation</small></span>';
    var up = unitPrice(p);
    return '<span class="price">' + money(p.price) + (p.compare_at ? '<s aria-label="was ' + money(p.compare_at) + '">' + money(p.compare_at) + "</s>" : "") +
      (up ? "<small>" + up + "</small>" : "") + "</span>";
  }
  function actionHTML(p) {
    if (p.quote) return '<a class="pcard__cta" href="business.html#lead" data-quote="' + esc(p.slug) + '">Request a quote</a>';
    if (!p.in_stock) return '<button class="pcard__cta" type="button" data-notify="' + esc(p.slug) + '">Notify me</button>';
    return '<button class="add-btn" type="button" data-add="' + esc(p.slug) + '" aria-label="Add ' + esc(p.name) + ' to bag">' + I.plus + "</button>";
  }
  function card(p, opts) {
    opts = opts || {};
    var b = p.blend ? G.blend(p.blend) : null;
    var kicker = b ? (BLENDX[p.blend] ? BLENDX[p.blend].short : b.name) : (p.brand && p.brand !== "OTHER" ? p.brand : G.products.categoryLabel(p.category));
    var flag = !p.in_stock && !p.quote ? '<span class="pcard__flag pcard__flag--out">Back soon</span>' : (p.compare_at && p.price < p.compare_at ? '<span class="pcard__flag pcard__flag--sale">Save ' + Math.round((1 - p.price / p.compare_at) * 100) + "%</span>" : "");
    var lazy = opts.eager ? "" : ' loading="lazy"';
    return '<article class="pcard' + (!p.in_stock && !p.quote ? " pcard--out" : "") + '" data-slug="' + esc(p.slug) + '">' +
      '<a class="pcard__media" href="' + G.linkTo("product.html", "slug", p.slug) + '" tabindex="-1" aria-hidden="true">' + flag +
      '<img src="' + imgOf(p) + '" alt=""' + lazy + ' decoding="async" width="400" height="400"></a>' +
      '<div class="pcard__body"><p class="pcard__kicker">' + esc(kicker) + "</p>" +
      '<h3 class="pcard__title"><a href="' + G.linkTo("product.html", "slug", p.slug) + '">' + esc(shortName(p)) + "</a></h3>" +
      '<dl class="facts"><div><dt>Format</dt><dd>' + esc(formatText(p)) + "</dd></div><div><dt>Fits</dt><dd>" + esc(fitsLabel(p)) +
      "</dd></div><div><dt>Intensity</dt><dd>" + gauge(G.intensity(p)) + "</dd></div></dl>" +
      '<div class="pcard__foot">' + priceHTML(p) + actionHTML(p) + "</div></div></article>";
  }

  function storyCard(a, opts) {
    opts = opts || {};
    var href = a.written ? "article.html" : "article.html#" + a.slug;
    return '<article class="story ' + (opts.cls || "") + '">' +
      '<div class="story__media"' + (opts.clip ? ' data-m="clip"' : "") + '><img src="' + src(a.img) + '" alt="' + esc(a.alt) + '" loading="lazy" decoding="async" width="800" height="600"></div>' +
      '<p class="story__meta"><span class="no">No. ' + a.no + "</span><span>" + esc(a.cat) + "</span><span>" + a.mins + " min read</span></p>" +
      '<h3 class="story__title"><a href="' + href + '">' + esc(a.title) + "</a></h3>" +
      (opts.noDek ? "" : '<p class="story__dek">' + esc(a.dek) + "</p>") + "</article>";
  }

  /* ---------------------------------------------------------------- sensory profile */
  var AXES = [
    { k: "intensity", label: "Intensity" }, { k: "body", label: "Body" }, { k: "crema", label: "Crema" },
    { k: "sweetness", label: "Sweetness" }, { k: "acidity", label: "Acidity" }, { k: "bitterness", label: "Bitterness" }
  ];
  function scoreBody(s) { s = (s || "").toLowerCase(); if (/medium-full/.test(s)) return 7; if (/medium-light/.test(s)) return 4; if (/full/.test(s)) return 8; if (/medium/.test(s)) return 5; if (/light/.test(s)) return 3; return 5; }
  function scoreAcid(s) { s = (s || "").toLowerCase(); if (/low-medium|medium-low/.test(s)) return 4; if (/low/.test(s)) return 2; if (/medium-high/.test(s)) return 6; if (/medium/.test(s)) return 5; if (/high/.test(s)) return 8; return 4; }
  function scoreCrema(s) { s = (s || "").toLowerCase(); if (/dense|thick/.test(s)) return 9; if (/rich|intense|prolonged/.test(s)) return 8; if (/excellent|very good|great/.test(s)) return 7; if (/creamy/.test(s)) return 6; if (/fine/.test(s)) return 5; if (/light/.test(s)) return 4; return 6; }
  function sensory(id) {
    var b = G.blend(id), x = BLENDX[id];
    if (!b || !x) return null;
    var prop = function (s) { return /PROPOSED/.test(s || ""); };
    return {
      id: id, name: b.name, short: x.short,
      v: { intensity: b.intensity, body: scoreBody(b.body), crema: scoreCrema(b.crema), sweetness: x.sw, acidity: scoreAcid(b.acidity), bitterness: x.bi },
      proposed: { intensity: true, body: prop(b.body), crema: prop(b.crema), sweetness: true, acidity: prop(b.acidity), bitterness: true },
      words: { body: clean(b.body), crema: clean(b.crema), acidity: clean(b.acidity) }
    };
  }
  function clean(s) { return String(s || "").replace(/\s*\((PROPOSED|official|L'Espresso USA|label)[^)]*\)/g, "").replace(/\s*\(.*$/, "").replace(/;.*$/, "").trim(); }

  /* radar geometry: 6 axes, 0–10 scale */
  var RC = 150, RR = 104;
  function pt(i, v) { var a = -Math.PI / 2 + i * Math.PI / 3; var r = RR * v / 10; return [RC + r * Math.cos(a), RC + r * Math.sin(a)]; }
  function polyPoints(vals, t) {
    t = t == null ? 1 : t;
    return AXES.map(function (ax, i) { var v = typeof vals === "function" ? vals(ax.k) : vals[ax.k]; var p = pt(i, v * t); return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
  }
  function sensorySVG(a, b, opts) {
    opts = opts || {};
    var rings = "";
    [2, 4, 6, 8, 10].forEach(function (lv) { rings += '<polygon class="grid-ring' + (lv === 10 ? " grid-ring--outer" : "") + '" points="' + polyPoints(function () { return lv; }) + '"/>'; });
    var spokes = AXES.map(function (ax, i) { var p = pt(i, 10); return '<line class="spoke" x1="' + RC + '" y1="' + RC + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '"/>'; }).join("");
    var labels = AXES.map(function (ax, i) {
      var p = pt(i, 12.6), anchor = Math.abs(p[0] - RC) < 4 ? "middle" : (p[0] > RC ? "start" : "end");
      var dy = i === 0 ? -4 : (i === 3 ? 12 : 4);
      var val = a ? a.v[ax.k] + (a.proposed[ax.k] ? "†" : "") : "";
      var valB = b ? " / " + b.v[ax.k] : "";
      return '<text class="axis-label" x="' + p[0].toFixed(1) + '" y="' + (p[1] + dy).toFixed(1) + '" text-anchor="' + anchor + '">' + ax.label +
        (opts.values === false ? "" : ' <tspan class="v">' + val + valB + "</tspan>") + "</text>";
    }).join("");
    var shapes = "";
    if (b) shapes += '<polygon class="shape shape--b" data-shape="b" points="' + polyPoints(b.v) + '"/>';
    if (a) shapes += '<polygon class="shape shape--a" data-shape="a" points="' + polyPoints(a.v) + '"/>';
    var dots = "";
    [["a", a], ["b", b]].forEach(function (pair) {
      if (!pair[1]) return;
      AXES.forEach(function (ax, i) { var p = pt(i, pair[1].v[ax.k]); dots += '<circle class="dot dot--' + pair[0] + '" data-dot="' + pair[0] + i + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="4.5"/>'; });
    });
    var hits = AXES.map(function (ax, i) { var p = pt(i, 10); return '<circle class="hit" data-axis="' + i + '" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="22"/>'; }).join("");
    var title = (a ? a.name : "") + (b ? " compared with " + b.name : "") + " sensory profile";
    var desc = AXES.map(function (ax) { return ax.label + " " + (a ? a.v[ax.k] : "") + (b ? " vs " + b.v[ax.k] : "") + " of 10"; }).join(", ");
    return '<div class="sensory" data-sensory>' +
      '<svg viewBox="-62 -14 424 330" role="img" aria-label="' + esc(title) + ": " + esc(desc) + '">' + rings + spokes + shapes + dots + labels + hits + "</svg></div>";
  }
  /* hover tooltip for a rendered chart */
  function bindSensoryTips(root, getA, getB) {
    $$("[data-sensory]", root).forEach(function (box) {
      if (box.__tips) return; box.__tips = true;
      var tip = document.createElement("div"); tip.className = "tip"; tip.hidden = true; box.appendChild(tip);
      $$(".hit", box).forEach(function (h) {
        h.addEventListener("pointerenter", function () {
          var i = +h.getAttribute("data-axis"), ax = AXES[i], a = getA && getA(), b = getB && getB();
          if (!a) return;
          var svg = $("svg", box), r = svg.getBoundingClientRect(), br = box.getBoundingClientRect(), vb = svg.viewBox.baseVal;
          var p = pt(i, Math.max(a.v[ax.k], b ? b.v[ax.k] : 0));
          tip.innerHTML = ax.label + ": " + a.short + " " + a.v[ax.k] + (b ? " · " + b.short + " " + b.v[ax.k] : "") + " /10";
          tip.style.left = ((p[0] - vb.x) / vb.width * r.width + r.left - br.left) + "px";
          tip.style.top = ((p[1] - vb.y) / vb.height * r.height + r.top - br.top) + "px";
          tip.hidden = false;
        });
        h.addEventListener("pointerleave", function () { tip.hidden = true; });
      });
    });
  }
  /* Grow a chart's shape(s) from the center: the sensory "draw-in" */
  function drawSensory(box, delay) {
    if (!MO.live || !M) return;
    var shapes = $$("[data-shape]", box), dots = $$(".dot", box);
    var targets = shapes.map(function (s) { return s.getAttribute("points").split(" ").map(function (q) { return q.split(",").map(Number); }); });
    shapes.forEach(function (s) { s.setAttribute("points", targets[0].map(function () { return RC + "," + RC; }).join(" ")); });
    dots.forEach(function (d) { d.style.opacity = 0; });
    M.animate(0, 1, {
      duration: 1.15, delay: delay || 0, ease: TIDE,
      onUpdate: function (t) {
        shapes.forEach(function (s, k) { s.setAttribute("points", targets[k].map(function (q) { return (RC + (q[0] - RC) * t).toFixed(1) + "," + (RC + (q[1] - RC) * t).toFixed(1); }).join(" ")); });
      }
    });
    M.animate(dots, { opacity: [0, 1], scale: [0.4, 1] }, { duration: 0.6, delay: M.stagger(0.05, { startDelay: (delay || 0) + 0.55 }), ease: TIDE });
  }
  /* Morph a chart to new values (compare tool) */
  function morphSensory(box, a, b) {
    var sA = $('[data-shape="a"]', box), sB = $('[data-shape="b"]', box);
    function read(s) { return s ? s.getAttribute("points").split(" ").map(function (q) { return q.split(",").map(Number); }) : null; }
    function to(v) { return AXES.map(function (ax, i) { return pt(i, v[ax.k]); }); }
    var fromA = read(sA), fromB = read(sB), toA = a ? to(a.v) : null, toB = b ? to(b.v) : null;
    function frame(t) {
      [[sA, fromA, toA, "a"], [sB, fromB, toB, "b"]].forEach(function (z) {
        if (!z[0] || !z[2]) return;
        var pts = z[2].map(function (q, i) { var f = z[1][i]; return [f[0] + (q[0] - f[0]) * t, f[1] + (q[1] - f[1]) * t]; });
        z[0].setAttribute("points", pts.map(function (q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" "));
        pts.forEach(function (q, i) { var d = $('[data-dot="' + z[3] + i + '"]', box); if (d) { d.setAttribute("cx", q[0].toFixed(1)); d.setAttribute("cy", q[1].toFixed(1)); } });
      });
    }
    if (!MO.live || !M) { frame(1); return; }
    M.animate(0, 1, { duration: 0.9, ease: TIDE, onUpdate: frame });
  }
  function compBar(id) {
    var x = BLENDX[id]; if (!x) return "";
    var bar;
    if (x.ar != null) {
      bar = (x.ar > 0 ? '<span class="ar" style="width:' + x.ar + '%"></span>' : "") + (x.ar < 100 ? '<span class="ro" style="width:' + (100 - x.ar) + '%"></span>' : "");
      return '<div class="comp" role="img" aria-label="Composition: ' + x.ar + '% Arabica, ' + (100 - x.ar) + '% Robusta"><div class="comp__bar" aria-hidden="true">' + bar +
        '</div><div class="comp__legend" aria-hidden="true"><span>Arabica ' + x.ar + "%</span><span>" + (x.ar < 100 ? "Robusta " + (100 - x.ar) + "%" : "No Robusta") + "</span></div></div>";
    }
    return '<div class="comp" role="img" aria-label="Composition: ' + esc(x.comp) + '"><div class="comp__bar" aria-hidden="true"><span class="unk"></span></div><div class="comp__legend" aria-hidden="true"><span>' + esc(x.comp) + "</span></div></div>";
  }

  /* "The blend in this story" module */
  function blendModule(id, label) {
    var b = G.blend(id), x = BLENDX[id]; if (!b || !x) return "";
    var p = G.products.bySlug(x.hero);
    if (!p || !p.in_stock) p = G.products.family(id).filter(function (q) { return q.in_stock; })[0] || p;
    var notes = (b.notes || []).map(function (n) { return n.replace(/\s*\(.*\)\s*$/, ""); }).slice(0, 3).join(" · ");
    return '<aside class="blendmod" aria-label="The blend in this story">' +
      '<div class="blendmod__img"><img src="' + src(x.pack) + '" alt="' + esc(b.name) + ' pack" loading="lazy" decoding="async" width="300" height="375"></div>' +
      '<div><p class="kicker">' + esc(label || "The blend in this story") + "</p>" +
      '<p class="blendmod__name">' + esc(b.name) + "</p>" + gauge(b.intensity) +
      '<p class="blendmod__notes">' + esc(notes) + "</p>" +
      (p ? '<div class="blendmod__buy">' + priceHTML(p) + (p.in_stock ? '<button class="btn btn--sm" type="button" data-add="' + esc(p.slug) + '">Add ' + esc(p.size || "") + " to bag</button>" : "") +
        '<a class="link" href="' + G.linkTo("product.html", "slug", p.slug) + '">Details ' + I.arrow + "</a></div>" : "") +
      "</div></aside>";
  }

  /* ---------------------------------------------------------------- chrome */
  function navHTML(mode) {
    return NAV[mode].map(function (n) {
      var cur = (n.pages || []).indexOf(PAGE) >= 0 && !(PAGE === "shop" && /machine/.test(n.href) && !/cat=machine/.test(location.hash));
      if (n.href.indexOf("cat=machine") >= 0 && PAGE === "shop" && /cat=machine/.test(location.hash)) cur = true;
      if (n.label === "Coffee" && PAGE === "shop" && /cat=machine/.test(location.hash)) cur = false;
      return '<li><a href="' + n.href + '"' + (cur ? ' aria-current="page"' : "") + ">" + n.label + "</a></li>";
    }).join("");
  }
  function renderChrome() {
    var mode = G.mode();
    document.body.classList.toggle("mode-business", mode === "business");
    var top = $("#chrome-top"), bottom = $("#chrome-bottom");
    var logo = G.img("assets/img/logo/guglielmo-logo-color.png");
    if (top) top.outerHTML =
      '<a class="skip" href="#main">Skip to content</a>' +
      '<div class="announce" role="note"><b>Free shipping</b> on orders $59+<span aria-hidden="true">·</span>Delivery in 3 business days across New England</div>' +
      '<header class="site-header" data-header>' +
      '<div class="utility"><div class="wrap">' +
      '<div class="mode-switch" role="group" aria-label="Shopping for"><button type="button" data-mode="home" aria-pressed="' + (mode === "home") + '">For Home</button><button type="button" data-mode="business" aria-pressed="' + (mode === "business") + '">For Business</button></div>' +
      '<p class="utility__coords">Roasted at Copanello <span>38.76° N 16.56° E</span> · Imported to Boston <span>42.36° N 71.06° W</span></p>' +
      '<nav aria-label="Utility"><ul><li><a href="find.html">Find us</a></li><li><a href="#" data-account>Trade login</a></li><li><a href="tel:+16176120090">(617) 612-0090</a></li></ul></nav>' +
      "</div></div>" +
      '<div class="masthead"><div class="wrap">' +
      '<button class="icon-btn menu-btn" type="button" data-nav-open aria-label="Open menu" aria-controls="nav-drawer" aria-expanded="false">' + I.menu + "</button>" +
      '<a class="brand" href="index.html" aria-label="Guglielmo USA, home"><img src="' + logo + '" alt="Guglielmo" width="116" height="34"><span class="brand__usa" aria-hidden="true">USA</span></a>' +
      '<nav class="primary-nav" aria-label="Primary"><ul data-nav>' + navHTML(mode) + "</ul></nav>" +
      '<div class="tools">' +
      '<button class="icon-btn" type="button" data-search-open aria-label="Search the shop and Il Giornale" aria-controls="search" aria-expanded="false">' + I.search + "</button>" +
      '<button class="icon-btn icon-btn--account" type="button" data-account aria-label="Account">' + I.user + "</button>" +
      '<button class="icon-btn" type="button" data-cart-open aria-label="Open bag" aria-controls="cart-drawer" aria-expanded="false">' + I.bag + '<span class="cart-count" data-cart-count aria-live="polite">0</span></button>' +
      '<a class="btn btn--sm" data-cta href="' + CTA[mode].href + '">' + CTA[mode].label + "</a>" +
      "</div></div></div></header>";

    if (bottom) bottom.outerHTML = footerHTML() + overlaysHTML();
  }

  function footerHTML() {
    var white = G.img("assets/img/logo/guglielmo-logo-white.png");
    return '<footer class="site-footer">' +
      '<section class="newsletter" aria-labelledby="nl-title"><div class="wrap">' +
      '<div><p class="kicker">Il Giornale, by email</p><h2 class="h2" id="nl-title">Letters from <em>Copanello</em>.</h2>' +
      '<p class="muted mt-2">New stories, blend notes and first word on limited capsules, once a month. No noise.</p></div>' +
      '<div data-nl><form class="newsletter__form" data-nl-form><div class="field"><label class="label" for="nl-email">Email address</label><input class="input" id="nl-email" name="email" type="email" autocomplete="email" required placeholder="you@example.com"></div><button class="btn btn--lemon" type="submit">Subscribe</button></form>' +
      '<p class="footnote mt-2">We send one letter a month. Unsubscribe in one click.</p></div>' +
      "</div></section>" +
      '<div class="wrap"><div class="foot-main">' +
      '<div class="foot-brand"><img src="' + white + '" alt="Guglielmo" width="170" height="50" loading="lazy">' +
      "<p>Caffè Guglielmo, roasted at Copanello on the Ionian coast of Calabria since 1972, from a story that began in Catanzaro in 1943. Imported, delivered and serviced across the US by L'Espresso USA, a Boston family business since 2000.</p></div>" +
      '<div class="foot-col"><h3>Shop</h3><ul><li><a href="shop.html#cat=coffee">Coffee</a></li><li><a href="shop.html#cat=single-serve">Capsules &amp; pods</a></li><li><a href="shop.html#cat=machine">Machines</a></li><li><a href="shop.html#cat=gifts">Gifts &amp; cups</a></li><li><a href="shop.html#cat=beverage">Brasilena</a></li><li><a href="shop.html#cat=care">Care &amp; cleaning</a></li><li><a href="tasting.html">Tasting Room</a></li></ul></div>' +
      '<div class="foot-col"><h3>Business</h3><ul><li><a href="business.html#segments">Solutions</a></li><li><a href="business.html#finder">Solution Finder</a></li><li><a href="business.html#services">Service &amp; repair</a></li><li><a href="business.html#lead">Book a tasting</a></li><li><a href="business.html#partners">Become a distributor</a></li><li><a href="business.html#partners">Guglielmo Point franchise</a></li><li><a href="#" data-account>Trade login</a></li></ul></div>' +
      '<div class="foot-col"><h3>Company</h3><ul><li><a href="story.html">Our Story</a></li><li><a href="journal.html">Il Giornale</a></li><li><a href="find.html">Find us</a></li><li><a href="story.html#certifications">Quality &amp; certification</a></li><li><a href="article.html">From Copanello to the North End</a></li></ul></div>' +
      '<div class="foot-col"><h3>Contact</h3><address>Guglielmo USA (L\'Espresso USA)<br>Greater Boston, MA<br><a href="tel:+16176120090">(617) 612-0090</a><br><a href="mailto:info@lespressousa.com">info@lespressousa.com</a><br>Monday to Friday, 9 a.m.–5 p.m. ET</address>' +
      '<h3 class="mt-3">Follow</h3><ul><li><a href="#">Instagram</a></li><li><a href="#">Facebook</a></li><li><a href="#">LinkedIn</a></li></ul></div>' +
      "</div></div>" +
      '<div class="wrap"><div class="foot-coords"><span>Torrefazione: Località Copanello 1, Stalettì (CZ), Italy · <b>38.76° N 16.56° E</b></span><span>Import &amp; service: Greater Boston, MA · <b>42.36° N 71.06° W</b></span><span>Distance between the two: 4,390 miles</span></div>' +
      '<div class="foot-legal"><span>© 2026 L\'Espresso USA, trading as Guglielmo USA. Nespresso® and Lavazza Espresso Point® are trademarks of their owners; Guglielmo is not affiliated with them.</span>' +
      '<ul><li><a href="#">Shipping &amp; returns</a></li><li><a href="#">Subscription terms</a></li><li><a href="#">Privacy</a></li><li><a href="#">Terms</a></li><li><a href="#">Accessibility</a></li></ul></div></div>' +
      "</footer>";
  }

  function overlaysHTML() {
    var mode = G.mode();
    return '<div class="scrim" data-scrim hidden></div>' +
      '<aside class="drawer drawer--right" id="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" hidden>' +
      '<div class="drawer__head"><h2 class="drawer__title" id="cart-title">Your bag</h2><button class="icon-btn" type="button" data-close aria-label="Close bag">' + I.close + "</button></div>" +
      '<div class="drawer__body" data-cart-body></div><div class="drawer__foot" data-cart-foot></div></aside>' +
      '<aside class="drawer drawer--left" id="nav-drawer" role="dialog" aria-modal="true" aria-label="Menu" hidden>' +
      '<div class="drawer__head"><a class="brand" href="index.html"><img src="' + G.img("assets/img/logo/guglielmo-logo-color.png") + '" alt="Guglielmo USA home" width="102" height="30" style="height:30px"></a><button class="icon-btn" type="button" data-close aria-label="Close menu">' + I.close + "</button></div>" +
      '<div class="drawer__body mnav"><div class="mode-switch mode-switch--lg mb-3" role="group" aria-label="Shopping for"><button type="button" data-mode="home" aria-pressed="' + (mode === "home") + '">For Home</button><button type="button" data-mode="business" aria-pressed="' + (mode === "business") + '">For Business</button></div>' +
      '<ul class="mnav__primary" data-mnav>' + mnavHTML(mode) + "</ul>" +
      '<ul class="mnav__secondary"><li><a href="find.html">Find us</a></li><li><a href="#" data-account>Account &amp; trade login</a></li><li><a href="tel:+16176120090">Call (617) 612-0090</a></li><li><a href="mailto:info@lespressousa.com">info@lespressousa.com</a></li></ul>' +
      '<a class="btn btn--block mt-3" data-cta href="' + CTA[mode].href + '">' + CTA[mode].label + "</a></div></aside>" +
      '<aside class="drawer drawer--right" id="panel-drawer" role="dialog" aria-modal="true" aria-labelledby="panel-title" hidden>' +
      '<div class="drawer__head"><h2 class="drawer__title" id="panel-title">Account</h2><button class="icon-btn" type="button" data-close aria-label="Close">' + I.close + "</button></div>" +
      '<div class="drawer__body" data-panel-body></div></aside>' +
      '<div class="search" id="search" role="dialog" aria-modal="true" aria-label="Search" hidden><div class="wrap">' +
      '<div class="search__bar">' + I.search + '<label class="sr-only" for="search-input">Search coffee, machines and stories</label><input class="search__input" id="search-input" type="search" autocomplete="off" placeholder="Search blends, capsules, machines, stories" data-search-input>' +
      '<button class="icon-btn" type="button" data-close aria-label="Close search">' + I.close + "</button></div>" +
      '<div class="search__body"><div><p class="label muted mb-2" data-search-status aria-live="polite">Popular right now</p><ul class="search__results" data-search-results></ul></div>' +
      '<div class="search__aside"><h3 class="label muted">From Il Giornale</h3><ul data-search-stories></ul><h3 class="label muted mt-3">Shop by machine</h3><ul><li><a href="shop.html#fits=espresso-point-36">36 mm capsules</a></li><li><a href="shop.html#fits=nespresso-original">Espresso 70 (Nespresso®-compatible)</a></li><li><a href="shop.html#fits=ese-44">E.S.E. 44 mm pods</a></li><li><a href="shop.html#fits=traditional">Beans &amp; ground</a></li></ul></div></div>' +
      "</div></div>" +
      '<div class="toast" role="status" aria-live="polite" data-toast hidden></div>';
  }
  function mnavHTML(mode) {
    return NAV[mode].map(function (n) { return '<li><a href="' + n.href + '">' + n.label + I.arrow.replace("<svg", '<svg width="22" height="22"') + "</a></li>"; }).join("");
  }

  function setMode(m) {
    G.mode(m);
    document.body.classList.toggle("mode-business", m === "business");
    $$("[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === m)); });
    var nav = $("[data-nav]"); if (nav) nav.innerHTML = navHTML(m);
    var mn = $("[data-mnav]"); if (mn) mn.innerHTML = mnavHTML(m);
    $$("[data-cta]").forEach(function (a) { a.href = CTA[m].href; a.textContent = CTA[m].label; });
    if (MO.live && M && nav) M.animate($$("li", nav), { opacity: [0, 1], y: [8, 0] }, { duration: 0.6, delay: M.stagger(0.05), ease: TIDE });
    document.dispatchEvent(new CustomEvent("cal:mode", { detail: m }));
  }

  /* ---------------------------------------------------------------- layers (drawers, search) with focus trap */
  var layer = null;
  function focusables(el) { return $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])', el).filter(function (x) { return x.offsetParent !== null || x === document.activeElement; }); }
  function openLayer(panel, opts) {
    opts = opts || {};
    if (layer && layer.panel === panel) return;
    if (layer) closeLayer(true);
    var scrim = $("[data-scrim]");
    var trigger = opts.trigger || document.activeElement;
    layer = { panel: panel, trigger: trigger, side: opts.side || "right" };
    panel.hidden = false;
    if (opts.side !== "top") scrim.hidden = false;
    document.documentElement.style.overflow = "hidden";
    if (trigger && trigger.setAttribute && trigger.hasAttribute("aria-expanded")) trigger.setAttribute("aria-expanded", "true");
    if (opts.side === "top") {
      if (MO.live && M) M.animate(panel, { y: ["-30px", "0px"], opacity: [0, 1] }, { duration: 0.5, ease: TIDE });
    } else MO.drawer(panel, true, opts.side || "right", scrim);
    var f = opts.focus ? $(opts.focus, panel) : focusables(panel)[0];
    setTimeout(function () { if (f) f.focus(); }, 30);
  }
  function closeLayer(instant) {
    if (!layer) return;
    var L = layer; layer = null;
    var scrim = $("[data-scrim]");
    function done() { L.panel.hidden = true; scrim.hidden = true; document.documentElement.style.overflow = ""; }
    if (L.trigger && L.trigger.setAttribute && L.trigger.hasAttribute("aria-expanded")) L.trigger.setAttribute("aria-expanded", "false");
    if (instant) done();
    else if (L.side === "top") { if (MO.live && M) M.animate(L.panel, { opacity: [1, 0], y: ["0px", "-20px"] }, { duration: 0.25 }).finished.then(done); else done(); }
    else MO.drawer(L.panel, false, L.side, scrim).then(done);
    if (L.trigger && L.trigger.focus && document.contains(L.trigger)) L.trigger.focus();
  }
  document.addEventListener("keydown", function (e) {
    if (!layer) return;
    if (e.key === "Escape") { e.preventDefault(); closeLayer(); return; }
    if (e.key === "Tab") {
      var f = focusables(layer.panel); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function openPanel(title, html, onReady, trigger) {
    var p = $("#panel-drawer");
    $("#panel-title").textContent = title;
    $("[data-panel-body]", p).innerHTML = html;
    if (onReady) onReady($("[data-panel-body]", p));
    openLayer(p, { side: "right", trigger: trigger });
  }

  /* ---------------------------------------------------------------- cart */
  function renderCart() {
    var s = G.cart.summary();
    $$("[data-cart-count]").forEach(function (c) { c.textContent = s.count; c.setAttribute("data-empty", String(!s.count)); });
    var body = $("[data-cart-body]"), foot = $("[data-cart-foot]");
    if (!body) return;
    var title = $("#cart-title"); if (title) title.textContent = s.count ? "Your bag (" + s.count + ")" : "Your bag";
    if (!s.lines.length) {
      body.innerHTML = '<div class="empty"><p class="h3">Your bag is empty.</p><p class="muted">Start in the Tasting Room, or pick the coffee for your machine.</p>' +
        '<div class="btn-row" style="justify-content:center"><a class="btn" href="tasting.html">Tasting Room</a><a class="btn btn--ghost" href="shop.html">Shop all</a></div></div>';
      foot.innerHTML = '<p class="footnote">Free shipping on orders $59+. Delivered in 3 business days across New England.</p>';
      return;
    }
    var pct = Math.min(1, s.subtotal / G.pricing.FREE_SHIP_THRESHOLD);
    body.innerHTML = '<div class="ship-progress">' +
      (s.toFreeShipping > 0 ? "<p>You're <b>" + money(s.toFreeShipping) + "</b> away from free shipping.</p>" : "<p><b>Free shipping unlocked.</b> Delivered in 3 business days across New England.</p>") +
      '<div class="bar' + (pct >= 1 ? " bar--done" : "") + '" role="progressbar" aria-label="Progress to free shipping" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct * 100) + '"><i style="transform:scaleX(' + pct + ')"></i></div></div>' +
      s.lines.map(function (l) {
        var p = l.product;
        return '<div class="line"><div class="line__img"><img src="' + imgOf(p) + '" alt="" loading="lazy"></div><div>' +
          '<a class="line__name" href="' + G.linkTo("product.html", "slug", p.slug) + '">' + esc(p.name) + "</a>" +
          '<span class="line__meta">' + esc(formatText(p)) + "</span>" +
          (l.subscribe ? '<span class="badge-sub">' + I.refresh.replace("<svg", '<svg width="14" height="14"') + " Every " + l.subscribe + " weeks · 10% off</span>" : "") +
          '<div class="line__row"><div class="qty qty--sm" role="group" aria-label="Quantity for ' + esc(p.name) + '"><button type="button" data-qty="-1" data-slug="' + esc(p.slug) + '" data-sub="' + l.subscribe + '" aria-label="Decrease quantity">−</button><output aria-live="polite">' + l.qty + "</output>" +
          '<button type="button" data-qty="1" data-slug="' + esc(p.slug) + '" data-sub="' + l.subscribe + '" aria-label="Increase quantity">+</button></div>' +
          '<div class="line__price">' + (l.saved > 0 ? "<s>" + money(l.full) + "</s>" : "") + money(l.total) + "</div></div>" +
          '<button class="line__remove" type="button" data-remove="' + esc(p.slug) + '" data-sub="' + l.subscribe + '">Remove</button></div></div>';
      }).join("");
    foot.innerHTML = '<div class="totals">' + (s.saved > 0 ? '<div class="save"><span>Savings (case &amp; subscription)</span><span>−' + money(s.saved) + "</span></div>" : "") +
      "<div><span>Subtotal</span><span>" + money(s.subtotal) + "</span></div>" +
      "<div><span>Shipping</span><span>" + (s.shipping ? money(s.shipping) : "Free") + "</span></div>" +
      '<div class="grand"><span>Total</span><span>' + money(s.total) + "</span></div></div>" +
      '<a class="btn btn--block" href="checkout.html">Checkout ' + I.arrow + "</a>" +
      '<p class="footnote mt-1 center">Apple Pay, Google Pay, PayPal and Shop Pay at checkout.</p>';
  }

  function toast(html) {
    var t = $("[data-toast]"); if (!t) return;
    t.innerHTML = html; t.hidden = false;
    if (MO.live && M) M.animate(t, { opacity: [0, 1], y: [16, 0] }, { duration: 0.5, ease: TIDE });
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      if (MO.live && M) M.animate(t, { opacity: [1, 0] }, { duration: 0.4 }).finished.then(function () { t.hidden = true; });
      else t.hidden = true;
    }, 3600);
  }

  function addToCart(slug, qty, sub, fromEl, opts) {
    opts = opts || {};
    var p = G.products.bySlug(slug); if (!p) return;
    if (!G.cart.add(slug, qty || 1, { subscribe: sub || 0 })) return;
    var cartBtn = $("[data-cart-open]");
    var imgEl = fromEl && (fromEl.closest(".pcard") ? $(".pcard__media img", fromEl.closest(".pcard")) : (fromEl.closest(".blendmod") ? $(".blendmod__img img", fromEl.closest(".blendmod")) : null));
    MO.flyToCart(imgEl || fromEl, cartBtn, imgOf(p)).then(function () {
      if (opts.open) openLayer($("#cart-drawer"), { trigger: cartBtn });
    });
    if (!opts.open) toast("<b>" + esc(shortName(p)) + "</b> added to your bag" + (sub ? ", every " + sub + " weeks" : "") + '. <button type="button" data-cart-open>View bag</button>');
  }

  /* ---------------------------------------------------------------- search */
  function renderSearch(q) {
    var list = $("[data-search-results]"), status = $("[data-search-status]"), stories = $("[data-search-stories]");
    if (!list) return;
    var res;
    if (!q) res = ["5-stelle-1kg-beans", "espresso-classico-250g-ground", "oro70-capsules-120-pack", "espresso-capsules-150", "espresso-ese-pods-44-mm-o-150-pack", "rocket-appartamento-tca-chrome-black"].map(G.products.bySlug).filter(Boolean);
    else res = G.products.sort(G.products.filter({ q: q }), "featured").slice(0, 10);
    status.textContent = q ? (res.length ? res.length + (res.length === 10 ? "+" : "") + " products for “" + q + "”" : "No products for “" + q + "”. Try a blend name, “capsule” or “decaf”.") : "Popular right now";
    list.innerHTML = res.map(function (p) {
      return '<li><a href="' + G.linkTo("product.html", "slug", p.slug) + '"><span class="thumb"><img src="' + imgOf(p) + '" alt="" loading="lazy"></span><span><b>' + esc(p.name) + "</b><small>" +
        esc(formatText(p)) + " · " + (p.quote ? "Price on request" : money(p.price)) + (p.in_stock ? "" : " · back soon") + "</small></span></a></li>";
    }).join("");
    var ql = (q || "").toLowerCase();
    var st = JOURNAL.filter(function (a) { return !ql || (a.title + " " + a.dek + " " + a.cat).toLowerCase().indexOf(ql) >= 0; }).slice(0, 4);
    stories.innerHTML = st.length ? st.map(function (a) { return '<li><a href="' + (a.written ? "article.html" : "article.html#" + a.slug) + '">' + esc(a.title) + "</a></li>"; }).join("") : '<li class="search__hint">No stories match.</li>';
  }

  /* ---------------------------------------------------------------- notify / account / quote */
  function notifyPanel(slug, trigger) {
    var p = G.products.bySlug(slug);
    openPanel("Notify me", '<p class="muted">We\'ll email you once when <b>' + esc(p ? p.name : "this item") + "</b> is back in our Boston warehouse.</p>" +
      '<form data-notify-form class="mt-3"><div class="field"><label class="label" for="notify-email">Email address</label><input class="input" id="notify-email" type="email" name="email" autocomplete="email" required></div>' +
      '<button class="btn btn--block mt-2" type="submit">Notify me</button></form>', function (root) {
      G.forms.demo($("form", root), function () { $("form", root).outerHTML = '<div class="form-ok mt-3"><p class="h3">You\'re on the list.</p><p class="mb-0">One email when it\'s back. Nothing else.</p></div>'; });
    }, trigger);
  }
  function accountPanel(trigger) {
    openPanel("Account", '<p class="muted">Reorder your usual, manage subscriptions (skip, pause, change the date) and see invoices.</p>' +
      '<form data-login class="mt-3"><div class="field"><label class="label" for="acc-email">Email</label><input class="input" id="acc-email" type="email" name="email" autocomplete="email" required></div>' +
      '<div class="field mt-2"><label class="label" for="acc-pass">Password</label><input class="input" id="acc-pass" type="password" name="password" autocomplete="current-password" required></div>' +
      '<button class="btn btn--block mt-3" type="submit">Sign in</button></form>' +
      '<hr class="mt-4"><p class="label muted mt-3">Trade accounts</p><p class="small muted">Cafés, restaurants and offices: sign in with the email on your account to reorder with your trade pricing and PO number.</p>' +
      '<a class="link" href="business.html#lead">Open a trade account ' + I.arrow + "</a>", function (root) {
      G.forms.demo($("form", root), function () { $("form", root).outerHTML = '<div class="form-ok mt-3"><p class="h3">Signed in (demo).</p><p class="mb-0">In the live store this opens your orders, subscriptions and trade invoices.</p></div>'; });
    }, trigger);
  }

  /* ---------------------------------------------------------------- global events */
  function bindGlobal() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("button, a"); if (!t) return;
      if (t.hasAttribute("data-mode")) { setMode(t.getAttribute("data-mode")); return; }
      if (t.hasAttribute("data-cart-open")) { e.preventDefault(); renderCart(); openLayer($("#cart-drawer"), { trigger: $("[data-header] [data-cart-open]") || t }); return; }
      if (t.hasAttribute("data-nav-open")) { openLayer($("#nav-drawer"), { side: "left", trigger: t }); return; }
      if (t.hasAttribute("data-search-open")) { renderSearch(""); openLayer($("#search"), { side: "top", trigger: t, focus: "[data-search-input]" }); return; }
      if (t.hasAttribute("data-close")) { closeLayer(); return; }
      if (t.hasAttribute("data-account")) { e.preventDefault(); accountPanel(t); return; }
      if (t.hasAttribute("data-notify")) { notifyPanel(t.getAttribute("data-notify"), t); return; }
      if (t.hasAttribute("data-quote")) { G.remember("quote", t.getAttribute("data-quote")); try { sessionStorage.setItem("cal-quote", t.getAttribute("data-quote")); } catch (x) {} return; }
      if (t.hasAttribute("data-add")) { e.preventDefault(); addToCart(t.getAttribute("data-add"), +(t.getAttribute("data-qty-n") || 1), +(t.getAttribute("data-sub") || 0), t); return; }
      if (t.hasAttribute("data-qty") && t.closest("#cart-drawer")) {
        var slug = t.getAttribute("data-slug"), sub = +t.getAttribute("data-sub");
        var line = G.cart.items().filter(function (i) { return i.slug === slug && (i.subscribe || 0) === sub; })[0];
        if (line) G.cart.setQty(slug, Math.max(0, line.qty + (+t.getAttribute("data-qty"))), sub);
        var out = t.parentNode.querySelector("output"); if (out && MO.bump) MO.bump(out);
        return;
      }
      if (t.hasAttribute("data-remove")) { G.cart.remove(t.getAttribute("data-remove"), +t.getAttribute("data-sub")); return; }
      if (layer && layer.panel.id === "nav-drawer" && t.tagName === "A" && t.closest("#nav-drawer")) closeLayer(true);
      if (layer && layer.panel.id === "search" && t.tagName === "A" && t.closest("#search")) closeLayer(true);
    });
    $("[data-scrim]").addEventListener("click", function () { closeLayer(); });
    var si = $("[data-search-input]");
    if (si) {
      si.addEventListener("input", function () { renderSearch(si.value.trim()); if (MO.list) MO.list($$("[data-search-results] li")); });
      si.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); location.href = "shop.html#q=" + encodeURIComponent(si.value.trim()); closeLayer(true); } });
    }
    $("#search").addEventListener("click", function (e) { if (e.target.id === "search") closeLayer(); });
    var nl = $("[data-nl-form]");
    if (nl) G.forms.demo(nl, function (d) { $("[data-nl]").innerHTML = '<div class="form-ok"><p class="h3">Grazie. You\'re subscribed.</p><p class="mb-0">The next letter from Copanello goes to ' + esc(d.email) + ".</p></div>"; });
    G.cart.onChange(function () { renderCart(); });
    window.addEventListener("hashchange", function () { document.dispatchEvent(new CustomEvent("cal:hash")); });
    // every interactive element gets press feedback from the motion layer
    $$(".btn, .add-btn, .chip, .icon-btn, .mode-switch button, .fchoice, .variant, .pcard__cta").forEach(function (b) { b.setAttribute("data-m-press", ""); });
  }

  /* ---------------------------------------------------------------- "slow tide" bespoke motion */
  function tide() {
    if (!MO.live || !M) return;
    // 1. clip-path shutters: the frame opens from the bottom while the photo inside settles from a slight zoom
    $$('[data-m="clip"]').forEach(function (fr) {
      var img = $("img", fr); if (!img || fr.closest("[data-m-hero]")) return;
      var fired = false;
      M.inView(fr, function () { if (fired) return; fired = true; M.animate(img, { scale: [1.14, 1] }, { duration: 1.6, ease: TIDE }); }, { amount: 0.12, margin: "0px 0px -6% 0px" });
    });
    // 2. horizon rules draw left to right
    $$(".horizon").forEach(function (h) {
      var fired = false;
      M.inView(h, function () { if (fired) return; fired = true; M.animate(h, { scaleX: [0, 1] }, { duration: 1.2, ease: TIDE }); }, { amount: 1 });
    });
    // 3. sensory charts draw in from the center when they enter
    $$("[data-sensory]").forEach(function (box) {
      if (box.hasAttribute("data-no-draw")) return;
      var fired = false;
      M.inView(box, function () { if (fired) return; fired = true; drawSensory(box, 0.1); }, { amount: 0.4 });
    });
    // 4. hero photo: the shutter opens on load and the image settles slowly
    $$("[data-m-hero] [data-m='clip'] img").forEach(function (img) { M.animate(img, { scale: [1.12, 1] }, { duration: 1.8, ease: TIDE }); });
  }

  /* ---------------------------------------------------------------- boot */
  renderChrome();
  bindGlobal();
  renderCart();

  window.CAL = {
    I: I, src: src, NAV: NAV, JOURNAL: JOURNAL, BLENDX: BLENDX, TASTING_ORDER: TASTING_ORDER, AXES: AXES,
    imgOf: imgOf, fitsOf: fitsOf, fitsLabel: fitsLabel, formatText: formatText, shortName: shortName, gauge: gauge, priceHTML: priceHTML, unitPrice: unitPrice,
    card: card, storyCard: storyCard, sensory: sensory, sensorySVG: sensorySVG, bindSensoryTips: bindSensoryTips, drawSensory: drawSensory, morphSensory: morphSensory,
    compBar: compBar, blendModule: blendModule, openPanel: openPanel, openLayer: openLayer, closeLayer: closeLayer, toast: toast, addToCart: addToCart,
    renderCart: renderCart, TIDE: TIDE, page: PAGE
  };

  var pageFn = (window.CAL_PAGES || {})[PAGE];
  if (pageFn) { try { pageFn(window.CAL); } catch (err) { if (window.console) console.error(err); } }

  // static intensity gauges written in the HTML as data-gauge="n"
  $$("[data-gauge]").forEach(function (el) { el.innerHTML = gauge(+el.getAttribute("data-gauge")); });
  // press feedback for anything rendered by the page module
  $$(".btn, .add-btn, .chip, .icon-btn, .fchoice, .variant, .pcard__cta, .compare__swap").forEach(function (b) { b.setAttribute("data-m-press", ""); });
  // headlines with italic words: split into word spans ourselves (keeping <em>) so the layer's word reveal preserves them
  if (MO.live) $$("[data-m-split]").forEach(function (h) {
    if (!h.children.length || h.getAttribute("data-m-split-done")) return;
    h.setAttribute("aria-label", h.textContent.replace(/\s+/g, " ").trim());
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            var s = document.createElement("span"); s.className = "m-word"; s.setAttribute("aria-hidden", "true");
            s.style.display = "inline-block"; s.style.willChange = "transform"; s.textContent = w; frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) { n.setAttribute("aria-hidden", "true"); walk(n); }
      });
    })(h);
    h.setAttribute("data-m-split-done", "1");
  });
  $$("[data-sensory]").forEach(function (box) { if (!box.__tips) bindSensoryTips(box.parentNode, function () { return box.__a; }, function () { return box.__b; }); });

  /* Motion tuning for Calabria: long, soft "slow tide" easing; short travel distances so nothing feels busy. */
  G.motion.init({ ease: TIDE, duration: 0.9, distance: 22 });
  tide();
  if (window.CAL_AFTER_MOTION) window.CAL_AFTER_MOTION.forEach(function (fn) { try { fn(window.CAL); } catch (err) { if (window.console) console.error(err); } });
})();
