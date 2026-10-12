/*!
 * Concept 01 "Centro" — core site script.
 * Shared helpers, the intensity-ring component, product cards, header/footer, drawers (cart, search, nav),
 * add-to-cart choreography and the page dispatcher. Page modules (js/page-*.js) load BEFORE this file and
 * register themselves on window.CENTRO_PAGES; this file runs them and ends with GUSA.motion.init().
 */
(function () {
  "use strict";

  var G = window.GUSA, $ = G.$, $$ = G.$$, esc = G.esc, money = G.fmt.money;
  var MO = G.motion, Mlib = MO && MO.lib;
  var live = !!(MO && MO.live);
  var C = window.CENTRO = { G: G, live: live };
  var uid = 0;

  /* ======================================================================
     Colour + blend helpers
     ====================================================================== */
  function hexRgb(h) { h = h.replace("#", ""); if (h.length === 3) h = h.replace(/./g, "$&$&"); var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function lum(h) { return hexRgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function shade(h, k) { return "#" + hexRgb(h).map(function (v) { var c = Math.round(v * (1 - k)); return ("0" + c.toString(16)).slice(-2); }).join(""); }
  C.lum = lum; C.contrast = contrast;

  var INK = "#1A1718";
  var SHORT = {
    "extra-bar": "Extra Bar", "5-stelle": "5 Stelle", "espresso-bar": "Espresso Bar", "espresso-classico": "Espresso Classico",
    "caffetteria": "Caffetteria", "copacabana": "Copacabana", "club-99": "Club 99", "silver-signature": "Silver Signature",
    "organic": "Organic Espresso", "decaf": "Decaf Espresso", "oro70": "ORO70", "rosso70": "ROSSO70", "dek70": "DEK70",
    "catanzaro-cz": "Catanzaro", "premium-blend-drip": "Premium Blend", "french-roast-drip": "French Roast", "decaf-drip": "Decaf Colombia"
  };
  var DISC = { "decaf": "#FFFFFF", "rosso70": "#ED1C24", "dek70": "#8EC5E0" };
  var CUT_BY_BLEND = {
    "extra-bar": "extra-bar-1kg", "5-stelle": "5-stelle-1kg", "espresso-bar": "espresso-bar-1kg", "espresso-classico": "classico-1kg",
    "caffetteria": "caffetteria-1kg", "copacabana": "copacabana-1kg", "club-99": "club-99-250g", "silver-signature": "silver-can",
    "organic": "organic-can", "decaf": "decaf-bag", "oro70": "oro70", "rosso70": "rosso70", "dek70": "dek70", "catanzaro-cz": "cz-capsule"
  };
  var CUT_BY_SLUG = {
    "5-stelle-1kg-beans": "5-stelle-1kg", "5-stelle-250g-ground": "5-stelle-moka", "5-stelle-250g-ground-fine-grinding": "5-stelle-espresso",
    "extra-bar-1kg-beans": "extra-bar-1kg", "extra-bar-250g-ground": "extra-bar-250g", "espresso-bar-1kg-beans": "espresso-bar-1kg",
    "espresso-classico-1kg-beans": "classico-1kg", "espresso-classico-beans-500g": "classico-1kg", "espresso-classico-250g-ground": "classico-250g",
    "espresso-classico-125g-ground-in-can": "classico-can", "caffetteria-1kg-beans": "caffetteria-1kg", "copacabana-1-kg-beans": "copacabana-1kg",
    "club-99-250g-ground": "club-99-250g", "special-edition-can": "silver-can", "organic-espresso": "organic-can",
    "espresso-decaf-250g-ground-can": "decaf-can", "espresso-decaf-250g-ground-bag": "decaf-bag", "oro70-capsules-10-pack": "oro70",
    "oro70-capsules-120-pack": "oro70", "rosso70-capsules-10-pack": "rosso70", "rosso70-capsules-120-pack": "rosso70",
    "dek70-capsules-120-pack": "dek70", "cz-capsules-40-pack": "cz-capsule", "brasilena-can-single": "brasilena-can"
  };
  var LABEL_BY_BLEND = {
    "premium-blend-drip": "assets/img/brand/usa-pack-premium-blend-drip-label.jpg",
    "french-roast-drip": "assets/img/brand/usa-pack-french-roast-drip-label.jpg",
    "decaf-drip": "assets/img/brand/usa-pack-decaf-colombia-drip-label.jpg"
  };
  var LIFESTYLE = {
    "extra-bar": "lifestyle-extra-bar-range.jpg", "5-stelle": "lifestyle-5-stelle-range.jpg", "espresso-classico": "lifestyle-espresso-classico-range.jpg",
    "club-99": "lifestyle-club-99-range.jpg", "silver-signature": "lifestyle-silver-signature-gift-set.jpg", "oro70": "usa-lifestyle-oro70-capsules-beans.jpg"
  };

  C.blends = function (line) {
    return (G.brand().blends || []).filter(function (b) { return !line || b.line === line; });
  };
  C.blendName = function (id) { return SHORT[id] || ((G.blend(id) || {}).name || id || ""); };
  C.blendTheme = function (id) {
    var b = G.blend(id);
    var bg = (b && b.color_hex) || INK, acc = (b && b.accent_hex) || "#FFF200";
    while (contrast("#FFFFFF", bg) < 4.5 && contrast(INK, bg) < 4.5) bg = shade(bg, 0.12);
    var fg = contrast("#FFFFFF", bg) >= contrast(INK, bg) ? "#FFFFFF" : INK;
    var dark = lum(bg) < 0.25, disc;
    if (DISC[id]) disc = DISC[id];
    else if (dark) disc = lum(acc) > 0.3 ? acc : "#FFF200";
    else disc = contrast(acc, bg) >= 2.5 ? acc : INK;
    return { bg: bg, fg: fg, acc: acc, disc: disc, dark: dark };
  };
  C.themeStyle = function (id) {
    var t = C.blendTheme(id);
    return "--blend:" + t.bg + ";--blend-fg:" + t.fg + ";--blend-acc:" + t.acc + ";--disc:" + t.disc;
  };
  C.cut = function (blendOrSlug, isSlug) {
    var n = isSlug ? CUT_BY_SLUG[blendOrSlug] : CUT_BY_BLEND[blendOrSlug];
    return n ? "img/cut/" + n + ".webp" : null;
  };
  C.labelImg = function (blend) { return LABEL_BY_BLEND[blend] ? G.img(LABEL_BY_BLEND[blend]) : null; };
  C.lifestyle = function (blend) { return LIFESTYLE[blend] ? G.img("assets/img/brand/" + LIFESTYLE[blend]) : null; };
  C.bucket = function (n) { return G.intensityBucket(n); };

  /* brand.json fields carry source notes in brackets: show clean customer-facing text */
  C.clean = function (s) {
    s = String(s || "").replace(/\s*\([^)]*\)/g, "").replace(/\s*-\s*(PROPOSED|UNVERIFIED).*$/i, "").trim();
    s = s.split(/[;,]\s*(?=softened|official|L'Espresso|"roasted)|\.\s/)[0].replace(/[.;,]+$/, "").trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  C.notes = function (b) {
    return (b && b.notes || []).map(function (n) { return C.clean(n).replace(/\.$/, ""); }).filter(Boolean);
  };
  var COMP = {
    "extra-bar": "Arabica & Robusta", "5-stelle": "Arabica-led: Central American & Brazilian Arabica", "espresso-bar": "Arabica & Robusta",
    "espresso-classico": "Robusta (Africa, Asia) & Arabica (Brazil, Central America)", "caffetteria": "Arabica & Robusta from South America, Africa & Asia",
    "copacabana": "20% Arabica · 80% Robusta", "club-99": "Central American Arabica, finished with fine Robusta", "silver-signature": "Fine Arabica coffees",
    "organic": "100% Arabica, certified organic", "decaf": "100% Arabica, decaffeinated (≤ 0.10% caffeine)", "oro70": "100% Arabica",
    "rosso70": "Arabica & Robusta, “Gusto Classico”", "dek70": "Decaffeinated (≤ 0.10% caffeine)", "catanzaro-cz": "Intense house capsule blend",
    "premium-blend-drip": "Central & South American beans", "french-roast-drip": "Dark-roasted blend", "decaf-drip": "Colombian, decaffeinated"
  };
  C.compShort = function (id) { return COMP[id] || C.clean((G.blend(id) || {}).composition); };
  C.lineLabel = function (line) { return { espresso: "Espresso blend", capsule: "Capsule line", drip: "Drip coffee" }[line] || "Blend"; };

  /* ======================================================================
     Product helpers: Format · Fits · Intensity
     ====================================================================== */
  var FITS = {
    "espresso-point-36": { short: "36 mm capsule", long: "36 mm capsule machines (Espresso Point®-type)", tab: "36 mm capsules" },
    "nespresso-original": { short: "Nespresso® Original*", long: "Nespresso® Original-line machines*", tab: "Espresso 70" },
    "ese-44": { short: "E.S.E. pod machine", long: "Any E.S.E. 44 mm pod machine", tab: "E.S.E. pods" },
    "espresso": { short: "Espresso machine", long: "Espresso machines & grinders", tab: "Espresso machine" },
    "moka": { short: "Moka pot", long: "Moka pots (stovetop)", tab: "Moka pot" },
    "drip": { short: "Drip brewer", long: "Drip, batch brewers & pour-over", tab: "Drip" },
    "pod-38": { short: "38 mm pod (retired)", long: "38 mm pod machines (format retired)", tab: "38 mm pods" }
  };
  var FITS_ORDER = ["espresso-point-36", "nespresso-original", "ese-44", "espresso", "moka", "drip"];
  var CARE_FITS = { "pod-holder-o-ring-mg147": ["ese-44"], "pod-holder-screen": ["ese-44"], "water-softener-rdl": ["espresso-point-36", "ese-44"],
    "puly-caff-plus-powder": ["espresso"], "pulygrind-grinder-cleaner-crystals": ["espresso"] };
  C.FITS = FITS; C.FITS_ORDER = FITS_ORDER;

  C.fits = function (p) {
    if (!p) return [];
    if (CARE_FITS[p.slug]) return CARE_FITS[p.slug];
    if (p.category === "machine") return p.system === "traditional" ? ["espresso"] : (p.system ? [p.system] : []);
    if (p.system) return [p.system];
    if (p.format === "beans") return ["espresso"];
    if (p.format === "ground") return ["moka", "espresso"];
    if (p.format === "drip-beans" || p.format === "drip-ground") return ["drip"];
    return [];
  };
  C.fitsLabel = function (p, long) {
    var f = C.fits(p);
    if (!f.length) return p.category === "care" && p.slug === "puly-milk-plus-cleaner" ? "Steam wands, all machines" : "";
    if (p.category === "machine") {
      return { "espresso-point-36": "Takes 36 mm capsules", "nespresso-original": "Takes Espresso 70 capsules", "ese-44": "Takes E.S.E. 44 mm pods", "espresso": p.slug === "grinder" ? "Beans for any espresso bar" : "Beans & ground coffee" }[f[0]] || "";
    }
    return f.map(function (k) { return FITS[k] ? FITS[k][long ? "long" : "short"] : k; }).join(" & ");
  };
  C.machineKind = function (p) {
    if (p.slug === "grinder") return "Commercial grinders";
    if (p.slug === "rocket-appartamento-tca-chrome-black") return "Home espresso machine";
    if (p.slug === "wega-and-other-commercial-machines") return "Commercial espresso";
    if (/2-group/.test(p.slug)) return "2-group capsule machine";
    return { "espresso-point-36": "Capsule machine", "nespresso-original": "Capsule machine", "ese-44": "Pod machine" }[p.system] || "Machine";
  };
  C.formatLabel = function (p) {
    if (p.category === "machine") return C.machineKind(p);
    if (p.format) {
      var f = G.products.formatLabel(p.format);
      if (p.format === "capsule") f = p.system === "nespresso-original" ? "Espresso 70 capsules" : "36 mm capsules";
      if (p.format === "pod") f = p.system === "pod-38" ? "38 mm pods" : "E.S.E. pods";
      var size = p.size ? p.size.replace(/ capsules| pods/, "") : "";
      if (/fine-grinding/.test(p.slug)) f = "Ground fine";
      return size ? f + " · " + size : f;
    }
    return { gift: "Gift set", merch: "Cups & gifts", beverage: "Coffee soda", care: "Care & cleaning", supplies: "Cups & supplies" }[p.category] || G.products.categoryLabel(p.category);
  };
  C.unitPrice = function (p) {
    var u = G.products.pricePerUnit(p);
    if (!u && p && p.price && p.size) {
      var m = /(\d+(?:\.\d+)?)\s*oz/.exec(p.size);
      if (m) u = { value: p.price / (parseFloat(m[1]) / 16), unit: "lb" };
    }
    if (!u) return "";
    return money(u.value) + (u.unit === "lb" ? "/lb" : "/cup");
  };
  C.available = function (p) { return !!(p && (p.in_stock || p.quote)); };
  C.bestOfBlend = function (blend) {
    var fam = G.products.family(blend);
    if (!fam.length) fam = G.products.filter({ blend: blend });
    var inS = fam.filter(function (p) { return p.in_stock; });
    var pick = inS.filter(function (p) { return p.format === "beans" && /1 kg/.test(p.size || ""); })[0] || inS[0] || fam[0];
    return pick || null;
  };
  C.productUrl = function (p) { return G.linkTo("product.html", "slug", typeof p === "string" ? p : p.slug); };
  C.searchText = function (p) { return [p.name, C.blendName(p.blend), p.format, p.system, C.fitsLabel(p), p.brand].join(" "); };

  /* ======================================================================
     Icons
     ====================================================================== */
  var IC = {
    search: '<path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm9.5 16.5-4.6-4.6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6"/>',
    bag: '<path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
    menu: '<path d="M3 7h18M3 12h18M3 17h18"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    truck: '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    repeat: '<path d="M4 12a7 7 0 0 1 12-5l3 3M20 12a7 7 0 0 1-12 5l-3-3"/><path d="M19 4v6h-6M5 20v-6h6"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8M3 21l6-6"/>',
    phone: '<path d="M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a3 3 0 0 1-3 3A15 15 0 0 1 3 6a3 3 0 0 1 3-3Z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    gift: '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M3 13h18M12 9v12M12 9S9 3 6.5 5 9 9 12 9Zm0 0s3-6 5.5-4S15 9 12 9Z"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z"/>',
    drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    cup: '<path d="M4 8h13v5a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6V8Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 4c0 1 1 1 1 2M12 4c0 1 1 1 1 2"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.8.8 3 2.6 3.5 5.2"/>'
  };
  C.icon = function (n, cls) { return '<svg class="ic ' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (IC[n] || "") + "</svg>"; };

  /* ======================================================================
     Intensity rings — the reusable 1–10 concentric meter
     ====================================================================== */
  C.rings = function (n, o) {
    o = o || {};
    n = Number(n) || 0;
    var size = o.size || 40, b = C.bucket(n);
    var label = n ? "Intensity " + n + " of 10" + (b ? ", " + b.label : "") : "Intensity not rated";
    var s = '<svg class="rings ' + (o.cls || "") + '" viewBox="0 0 100 100" width="' + size + '" height="' + size + '"' +
      (o.decorative ? ' aria-hidden="true"' : ' role="img" aria-label="' + label + '"') + (o.anim ? ' data-rings-fill' : "") + ">";
    for (var i = 10; i >= 1; i--) {
      var r = i * 4.9;
      if (i <= n) s += '<circle class="r-on ' + (i % 2 ? "a" : "b") + '" data-i="' + i + '" cx="50" cy="50" r="' + r.toFixed(1) + '"/>';
      else s += '<circle class="r-off" cx="50" cy="50" r="' + r.toFixed(1) + '"/>';
    }
    return s + "</svg>";
  };
  C.meter = function (n, o) {
    o = o || {};
    if (!n) return "";
    var b = C.bucket(n);
    return '<span class="meter ' + (o.lg ? "meter--lg" : "") + '">' + C.rings(n, { size: o.size || (o.lg ? 96 : 30), anim: o.anim, decorative: true }) +
      '<span><span class="meter__val">' + n + '</span><span class="sr-only"> of 10</span> <span class="meter__lbl">' + (o.lg ? "/10 · " : "") + b.label + "</span></span></span>";
  };

  /* Brand target (orange / yellow / red) with optional circular text — used for hero & "hit" moments */
  C.target = function (o) {
    o = o || {};
    var id = "tp" + (++uid);
    var s = '<svg class="target-svg ' + (o.cls || "") + '" viewBox="0 0 600 600" aria-hidden="true" focusable="false">';
    if (o.text) {
      s += '<defs><path id="' + id + '" d="M300,300 m-266,0 a266,266 0 1,1 532,0 a266,266 0 1,1 -532,0"/></defs>';
      s += '<g class="t-txt"><text><textPath href="#' + id + '" textLength="1660" lengthAdjust="spacing">' + esc(o.text) + "</textPath></text></g>";
    }
    if (o.hair !== false) s += '<circle class="t-h" cx="300" cy="300" r="238"/><circle class="t-h t-h2" cx="300" cy="300" r="296"/>';
    s += '<circle class="t-o" cx="300" cy="300" r="225"/><circle class="t-y" cx="300" cy="300" r="148.5"/><circle class="t-r" cx="300" cy="300" r="74.25"/>';
    return s + "</svg>";
  };

  /* ======================================================================
     Product card
     ====================================================================== */
  C.card = function (p, o) {
    o = o || {};
    var n = G.intensity(p), theme = p.blend ? C.themeStyle(p.blend) : "--blend:#1A1718;--blend-fg:#fff;--blend-acc:#FFF200";
    var sold = !p.in_stock && !p.quote;
    var facts = [];
    facts.push('<li><span class="k">Format</span><span class="v">' + esc(C.formatLabel(p)) + "</span></li>");
    var fits = C.fitsLabel(p);
    if (fits) facts.push('<li><span class="k">Fits</span><span class="v">' + esc(fits) + "</span></li>");
    if (n) facts.push('<li><span class="k">Intensity</span>' + C.meter(n, { size: 22 }) + "</li>");
    else if (p.category === "machine") {
      var blends = p.system && p.system !== "traditional" ? uniq(G.products.coffeeFor(p.system).map(function (x) { return x.blend; })).length : 0;
      facts.push('<li><span class="k">Coffee</span><span class="v">' + (blends ? blends + " Guglielmo blends fit" : "Any Guglielmo blend") + "</span></li>");
    } else if (p.category === "beverage") facts.push('<li><span class="k">From</span><span class="v">Calabria, by Acqua Calabria</span></li>');
    var tag = p.blend ? '<span class="tag tag--blend card__tag">' + esc(C.blendName(p.blend)) + "</span>" : (p.brand && p.brand !== "Guglielmo" && p.brand !== "OTHER" ? '<span class="tag tag--line card__tag">' + esc(p.brand) + "</span>" : "");
    var badge = "";
    if (sold) badge = '<span class="tag card__badge">Sold out</span>';
    else if (p.compare_at && p.price) badge = '<span class="tag tag--red card__badge">Save ' + Math.round((1 - p.price / p.compare_at) * 100) + "%</span>";
    else if (p.quote) badge = '<span class="tag tag--yellow card__badge">Quote</span>';
    var price, action;
    if (p.quote) {
      price = '<p class="price price--quote">Price on request<span class="unit">Purchase, lease or consignment</span></p>';
      action = '<a class="btn btn--sm btn--ghost" href="' + C.productUrl(p) + '">Request a quote</a>';
    } else {
      var u = C.unitPrice(p);
      price = '<p class="price">' + money(p.price) + (p.compare_at ? "<s>" + money(p.compare_at) + "</s>" : "") + (u ? '<span class="unit">' + u + "</span>" : "") + "</p>";
      action = sold ? '<button class="btn btn--sm btn--ghost" type="button" data-notify="' + p.slug + '">Notify me</button>'
        : '<button class="btn btn--sm btn--red" type="button" data-add="' + p.slug + '" aria-label="Add ' + esc(p.name) + ' to cart">' + C.icon("plus") + "Add</button>";
    }
    return '<article class="card' + (sold ? " is-soldout" : "") + '" style="' + theme + '" data-slug="' + p.slug + '">' +
      '<a class="card__media" href="' + C.productUrl(p) + '" tabindex="-1" aria-hidden="true"><span class="card__halo"></span>' +
      '<img src="' + G.img(p.images[0]) + '" alt="" loading="' + (o.eager ? "eager" : "lazy") + '" decoding="async" width="400" height="400"></a>' + tag + badge +
      '<div class="card__body"><h3 class="card__title"><a href="' + C.productUrl(p) + '">' + esc(p.name) + "</a></h3>" +
      '<ul class="card__facts">' + facts.join("") + "</ul>" +
      '<div class="card__buy">' + price + action + "</div></div></article>";
  };
  function uniq(a) { return a.filter(function (v, i) { return v && a.indexOf(v) === i; }); }
  C.uniq = uniq;

  C.quizTile = function () {
    return '<a class="quiz-tile" href="quiz.html"><span class="tgt" aria-hidden="true"></span><span class="eyebrow eyebrow--plain">Coffee finder</span>' +
      '<span class="poster">Not sure? Hit your mark.</span><p>Five quick questions about how you brew and what you like. We aim, you sip.</p>' +
      '<span class="btn btn--white btn--sm">Take the quiz ' + C.icon("arrow", "arr") + "</span></a>";
  };

  /* ======================================================================
     Header, mega menus, mode switch
     ====================================================================== */
  var page = document.body.getAttribute("data-page") || "";
  var NAV = {
    home: [
      { id: "coffee", label: "Coffee", href: "shop.html#cat=coffee", mega: "coffee" },
      { id: "machines", label: "Capsules & Machines", href: "shop.html#cat=single-serve,machine", mega: "machines" },
      { id: "quiz", label: "Find your blend", href: "quiz.html" },
      { id: "business", label: "For Business", href: "business.html" },
      { id: "story", label: "Our Story", href: "story.html" }
    ],
    business: [
      { id: "segments", label: "Solutions", href: "business.html#segments" },
      { id: "equipment", label: "Equipment", href: "business.html#equipment" },
      { id: "program", label: "Coffee program", href: "business.html#program" },
      { id: "services", label: "Service & support", href: "business.html#services" },
      { id: "partner", label: "Partner with us", href: "business.html#partner" }
    ]
  };
  var CURRENT = { shop: "coffee", product: "coffee", quiz: "quiz", business: "business", story: "story" };

  function navHTML(mode) {
    return NAV[mode].map(function (n) {
      var cur = mode === "home" && CURRENT[page] === n.id ? ' aria-current="page"' : "";
      if (n.mega) return '<li><button class="nav-link" type="button" aria-expanded="false" aria-controls="mega-' + n.mega + '" data-mega="' + n.mega + '"' + cur + ">" + n.label + C.icon("chev", "chev") + "</button></li>";
      return '<li><a class="nav-link" href="' + n.href + '"' + cur + ">" + n.label + "</a></li>";
    }).join("");
  }
  function ctaHTML(mode) {
    return mode === "business"
      ? '<a class="btn btn--red btn--sm btn--target mainbar__cta" href="business.html#contact" data-tasting>Book a tasting</a>'
      : '<a class="btn btn--red btn--sm btn--target mainbar__cta" href="quiz.html">Subscribe &amp; save</a>';
  }
  function countFits(k) { return G.products.all().filter(function (p) { return (p.category === "coffee" || p.category === "single-serve") && C.fits(p).indexOf(k) >= 0 && C.available(p); }).length; }
  function megaCoffee() {
    var machines = FITS_ORDER.map(function (k) { return '<li><a href="shop.html#fits=' + k + '">' + FITS[k].long.replace(/ \(.*\)/, "") + "<small>" + countFits(k) + "</small></a></li>"; }).join("");
    var blends = C.blends("espresso").map(function (b) {
      var p = C.bestOfBlend(b.id);
      return '<li><a href="' + (p ? C.productUrl(p) : "shop.html#blend=" + b.id) + '"><span class="sw" style="--c:' + b.color_hex + '"></span>' + esc(C.blendName(b.id)) + "<small>" + b.intensity + "/10</small></a></li>";
    }).join("");
    return '<div class="mega" id="mega-coffee" hidden><div class="wrap mega__in">' +
      '<div><h3>Shop by your machine</h3><ul>' + machines + "</ul></div>" +
      '<div><h3>Espresso blends</h3><ul>' + blends + "</ul></div>" +
      '<div><h3>By format</h3><ul><li><a href="shop.html#format=beans">Whole beans</a></li><li><a href="shop.html#format=ground">Ground</a></li><li><a href="shop.html#format=capsule">Capsules</a></li><li><a href="shop.html#format=pod">E.S.E. pods</a></li><li><a href="shop.html#fits=drip">Drip coffee</a></li><li><a href="shop.html#q=decaf">Decaf</a></li><li><a href="shop.html#cat=coffee&amp;sort=intensity">Strongest first</a></li></ul>' +
      '<h3 style="margin-top:24px">Learn</h3><ul><li><a href="index.html#intensity">Intensity guide</a></li><li><a href="index.html#blends">Blend explorer</a></li></ul></div>' +
      '<a class="mega__feature" href="quiz.html"><span class="tgt" aria-hidden="true"></span><span class="eyebrow eyebrow--plain">Coffee finder · 5 questions</span><span class="poster">Hit your mark</span><p>Tell us how you brew. We will match a blend, a format and a rhythm.</p></a>' +
      "</div></div>";
  }
  function megaMachines() {
    var vap = G.products.bySlug("espresso-plus-vap-capsule-machine");
    return '<div class="mega" id="mega-machines" hidden><div class="wrap mega__in">' +
      '<div><h3>Capsules &amp; pods</h3><ul><li><a href="shop.html#fits=espresso-point-36">36 mm capsules<small>' + countFits("espresso-point-36") + '</small></a></li><li><a href="shop.html#fits=nespresso-original">Espresso 70 · Nespresso®*<small>' + countFits("nespresso-original") + '</small></a></li><li><a href="shop.html#fits=ese-44">E.S.E. 44 mm pods<small>' + countFits("ese-44") + '</small></a></li><li><a href="shop.html#cat=single-serve&amp;q=decaf">Decaf capsules &amp; pods</a></li></ul></div>' +
      '<div><h3>Machines</h3><ul><li><a href="shop.html#cat=machine&amp;fits=espresso-point-36">36 mm capsule machines</a></li><li><a href="shop.html#cat=machine&amp;fits=ese-44">E.S.E. pod machines</a></li><li><a href="shop.html#cat=machine&amp;fits=nespresso-original">Espresso 70 machine</a></li><li><a href="' + C.productUrl("rocket-appartamento-tca-chrome-black") + '">Rocket Appartamento TCA</a></li><li><a href="business.html#equipment">Commercial machines</a></li></ul></div>' +
      '<div><h3>Care &amp; extras</h3><ul><li><a href="shop.html#cat=care">Care &amp; cleaning</a></li><li><a href="shop.html#cat=merch">Cups &amp; glasses</a></li><li><a href="shop.html#cat=beverage">Brasilena coffee soda</a></li><li><a href="shop.html#cat=gift">Gifts</a></li><li><a href="shop.html#cat=supplies">Office cup kits</a></li></ul></div>' +
      '<a class="mega__feature mega__feature--ink" href="' + C.productUrl("espresso-plus-vap-capsule-machine") + '"><span class="tgt" aria-hidden="true"></span><span class="eyebrow eyebrow--plain" style="color:var(--yellow)">Machine + capsules</span><span class="poster">Pays for itself</span><p>Espresso Plus VAP from ' + (vap ? money(vap.price) : "") + '. See the cost per shot with a capsule bundle.</p></a>' +
      "</div></div>";
  }

  function renderHeader() {
    var h = $("#site-header");
    if (!h) return;
    var mode = G.mode();
    var usa = '<a class="brand" href="index.html"><img src="' + G.img("assets/img/logo/guglielmo-logo-color.png") + '" alt="Guglielmo, il caffè che fa centro" width="1096" height="322"><span class="brand__usa" aria-label="USA">USA</span></a>';
    h.innerHTML =
      '<div class="topbar on-dark"><div class="wrap topbar__in">' +
      '<div class="mode-switch" role="group" aria-label="Shopping for"><span class="mode-switch__pill" aria-hidden="true"></span>' +
      '<button type="button" data-mode="home" aria-pressed="' + (mode === "home") + '">For Home</button><button type="button" data-mode="business" aria-pressed="' + (mode === "business") + '">For Business</button></div>' +
      '<p class="topbar__msg"><strong>Free shipping on orders $59+</strong><span class="long"> · Delivery in 3 business days across New England</span></p>' +
      '<ul class="topbar__links"><li><a href="find.html">Find us</a></li><li><a href="business.html#trade">Trade login</a></li><li><a href="tel:+16176120090">(617) 612-0090</a></li></ul>' +
      "</div></div>" +
      '<div class="mainbar"><div class="wrap mainbar__in">' +
      '<button class="icon-btn nav-toggle" type="button" aria-label="Open menu" aria-controls="nav-drawer" aria-expanded="false" data-open="nav">' + C.icon("menu") + "</button>" + usa +
      '<nav class="primary-nav" aria-label="Primary"><ul data-nav>' + navHTML(mode) + "</ul></nav>" +
      '<div class="mainbar__tools"><button class="icon-btn" type="button" data-open="search" aria-label="Search the shop" aria-controls="search-drawer" aria-expanded="false">' + C.icon("search") + "</button>" +
      '<button class="icon-btn" type="button" data-open="account" aria-label="Account" aria-expanded="false" aria-controls="account-pop">' + C.icon("user") + "</button>" +
      '<button class="icon-btn cart-btn" type="button" data-open="cart" aria-controls="cart-drawer" aria-expanded="false" aria-label="Cart">' + C.icon("bag") + '<span class="cart-count" data-cart-count>0</span></button>' +
      '<span data-cta>' + ctaHTML(mode) + "</span></div></div>" + megaCoffee() + megaMachines() +
      '<div class="popover" id="account-pop" hidden role="dialog" aria-labelledby="acct-h"><h2 id="acct-h">Welcome back</h2><p class="small muted">Manage subscriptions, reorder in two taps, track deliveries.</p>' +
      '<form class="field-row" id="acct-form"><div class="f"><label for="acct-email">Email</label><input id="acct-email" type="email" name="email" required autocomplete="email"></div>' +
      '<div class="f"><label for="acct-pw">Password</label><input id="acct-pw" type="password" name="pw" required autocomplete="current-password"></div>' +
      '<button class="btn btn--red btn--block" type="submit">Sign in</button><p class="tiny muted">Business customer? <a class="link" href="business.html#trade">Trade login</a></p></form></div>' +
      "</div>";
    bindHeader();
    placePill(false);
  }

  function placePill(animate) {
    var sw = $(".mode-switch"); if (!sw) return;
    var on = $('button[aria-pressed="true"]', sw), pill = $(".mode-switch__pill", sw);
    if (!on || !pill) return;
    pill.style.width = on.offsetWidth + "px";
    var x = on.offsetLeft - 3;
    if (animate && live) MO.animate(pill, { x: x }, { type: "spring", stiffness: 520, damping: 34 });
    else pill.style.transform = "translateX(" + x + "px)";
  }

  function setMode(m) {
    G.mode(m);
    $$(".mode-switch button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === m)); });
    placePill(true);
    var ul = $("[data-nav]"), cta = $("[data-cta]");
    var render = function () { ul.innerHTML = navHTML(m); cta.innerHTML = ctaHTML(m); bindMegaButtons(); C.enhance($("#site-header")); };
    if (ul) MO.swap(ul, render, m === "business" ? 1 : -1);
    var mn = $("#nav-drawer .drawer__body"); if (mn) mn.innerHTML = mobileNavHTML();
    bindMobileModeSwitch();
    toast(m === "business" ? "Business mode: wholesale, equipment and service up front." : "Home mode: coffee, capsules and machines up front.");
    document.dispatchEvent(new CustomEvent("centro:mode", { detail: m }));
  }

  var openMega = null;
  function closeMega() {
    if (!openMega) return;
    var m = $("#mega-" + openMega), b = $('[data-mega="' + openMega + '"]');
    if (m) m.hidden = true;
    if (b) b.setAttribute("aria-expanded", "false");
    openMega = null;
  }
  function showMega(id, btn) {
    if (openMega === id) return;
    closeMega();
    var m = $("#mega-" + id); if (!m) return;
    m.hidden = false; openMega = id; btn.setAttribute("aria-expanded", "true");
    if (live) MO.animate(m, { opacity: [0, 1], y: [-10, 0] }, { duration: 0.28, ease: MO.tokens.ease });
    if (live) MO.animate($$("li, .mega__feature", m), { opacity: [0, 1], y: [8, 0] }, { duration: 0.3, delay: MO.stagger(0.012) });
  }
  var hoverTimer;
  function bindMegaButtons() {
    $$("[data-mega]").forEach(function (b) {
      var id = b.getAttribute("data-mega");
      b.addEventListener("click", function () { if (openMega === id) closeMega(); else showMega(id, b); });
      b.addEventListener("mouseenter", function () { if (window.matchMedia("(hover: hover)").matches) { clearTimeout(hoverTimer); hoverTimer = setTimeout(function () { showMega(id, b); }, 90); } });
      b.addEventListener("mouseleave", function () { clearTimeout(hoverTimer); });
    });
  }
  function bindHeader() {
    $$(".mode-switch button").forEach(function (b) { b.addEventListener("click", function () { if (b.getAttribute("aria-pressed") !== "true") setMode(b.getAttribute("data-mode")); }); });
    bindMegaButtons();
    var mb = $(".mainbar");
    mb.addEventListener("mouseleave", function () { if (window.matchMedia("(hover: hover)").matches) { clearTimeout(hoverTimer); hoverTimer = setTimeout(closeMega, 160); } });
    mb.addEventListener("mouseenter", function () { clearTimeout(hoverTimer); });
    document.addEventListener("click", function (e) {
      if (openMega && !e.target.closest(".mega") && !e.target.closest("[data-mega]")) closeMega();
      var pop = $("#account-pop");
      if (pop && !pop.hidden && !e.target.closest("#account-pop") && !e.target.closest('[data-open="account"]')) togglePop(false);
    });
    $('[data-open="account"]').addEventListener("click", function () { togglePop($("#account-pop").hidden); });
    G.forms.demo($("#acct-form"), function () {
      $("#acct-form").innerHTML = '<div class="form-ok"><span class="tgt" aria-hidden="true"></span><span>Demo sign-in complete. In the live store you would land on your subscriptions and past orders.</span></div>';
    });
    window.addEventListener("resize", function () { placePill(false); });
  }
  function togglePop(open) {
    var pop = $("#account-pop"), btn = $('[data-open="account"]');
    pop.hidden = !open; btn.setAttribute("aria-expanded", String(open));
    if (open) { if (live) MO.animate(pop, { opacity: [0, 1], y: [-8, 0], scale: [0.97, 1] }, { duration: 0.25 }); var i = $("input", pop); if (i) i.focus(); }
  }

  /* ======================================================================
     Footer
     ====================================================================== */
  function renderFooter() {
    var f = $("#site-footer"); if (!f) return;
    var demo = ' href="#" data-demo';
    f.innerHTML =
      '<div class="sunrise" aria-hidden="true"></div>' +
      '<div class="wrap"><div class="foot-poster">' +
      '<p class="poster" lang="it">Il caffè <span>che fa</span> centro.</p>' +
      '<div class="foot-news"><h2>Get first word on new roasts</h2><p>Monthly notes from Copanello and Boston, brew tips, and 10% off your first order (proposed welcome offer).</p>' +
      '<form class="inline-form" id="news-form"><label class="sr-only" for="news-email">Email address</label><input id="news-email" type="email" name="email" placeholder="you@example.com" required autocomplete="email"><button class="btn btn--yellow" type="submit">Sign me up</button></form></div>' +
      "</div>" +
      '<div class="foot-cols">' +
      '<div><h3>Shop</h3><ul><li><a href="shop.html#cat=coffee">Coffee</a></li><li><a href="shop.html#cat=single-serve">Capsules &amp; pods</a></li><li><a href="shop.html#cat=machine">Machines</a></li><li><a href="quiz.html">Find your blend</a></li><li><a href="index.html#subscribe">Subscribe &amp; save</a></li><li><a href="shop.html#cat=gift,merch,beverage">Gifts &amp; Brasilena</a></li></ul></div>' +
      '<div><h3>Business</h3><ul><li><a href="business.html#segments">Solutions</a></li><li><a href="business.html#equipment">Equipment &amp; lease</a></li><li><a href="business.html#services">Service &amp; repair</a></li><li><a href="business.html#contact">Book a tasting</a></li><li><a href="business.html#partner">Become a distributor</a></li><li><a href="business.html#partner">Guglielmo Point franchise</a></li><li><a href="business.html#trade">Trade login</a></li></ul></div>' +
      '<div><h3>Support</h3><ul><li><a href="story.html#contact">Contact us</a></li><li><a href="product.html#5-stelle-1kg-beans">Shipping &amp; returns</a></li><li><a' + demo + '>Subscription FAQ</a></li><li><a' + demo + '>Machine support</a></li><li><a href="business.html#services">Request service</a></li></ul></div>' +
      '<div><h3>Company</h3><ul><li><a href="story.html">Our story</a></li><li><a href="find.html">Find Guglielmo</a></li><li><a href="story.html#roastery">The roastery</a></li><li><a href="business.html#partner">Distributors</a></li><li><a' + demo + '>Press</a></li></ul></div>' +
      '<div class="foot-contact"><h3>Talk to us</h3><strong><a href="tel:+16176120090" style="color:inherit;text-decoration:none">(617) 612-0090</a></strong>' +
      '<a href="mailto:info@lespressousa.com" style="color:var(--paper)">info@lespressousa.com</a><span>Mon–Fri, 9am–5pm ET</span><span>Greater Boston, MA</span>' +
      '<span style="margin-top:8px">Follow: Instagram · Facebook · YouTube</span></div>' +
      "</div>" +
      '<div class="foot-trust"><span>Since 1943</span><span>Roasted at Copanello since 1972</span><span>ISO 9001 roastery (Guglielmo S.p.A.)</span><span>Espresso Italiano certified blends</span><span>Boston importer since 2000</span></div>' +
      '<div class="foot-legal"><div class="foot-logo"><img src="' + G.img("assets/img/logo/guglielmo-logo-white.png") + '" alt="Guglielmo" width="1096" height="322" loading="lazy" decoding="async"><span class="brand__usa">USA</span></div>' +
      '<div><p style="margin:0 0 8px">© 2026 L\'Espresso USA, importer of Caffè Guglielmo. *Nespresso® and Espresso Point® are trademarks of their owners; Guglielmo is not affiliated with them.</p>' +
      '<ul><li><a' + demo + '>Terms</a></li><li><a' + demo + '>Privacy</a></li><li><a' + demo + '>Subscription terms</a></li><li><a' + demo + '>Accessibility</a></li></ul></div>' +
      '<div class="pay-row" aria-label="Payment methods"><span>Apple Pay</span><span>Google Pay</span><span>PayPal</span><span>Shop Pay</span><span>Visa</span><span>Mastercard</span><span>Amex</span></div></div>' +
      "</div>";
    G.forms.demo($("#news-form"), function () {
      var form = $("#news-form");
      form.insertAdjacentHTML("afterend", '<div class="form-ok" role="status"><span class="tgt" aria-hidden="true"></span><span>You are on the list. Watch for your welcome code.</span></div>');
      form.hidden = true;
      MO.bullseye($(".foot-news .form-ok .tgt"));
    });
    $$("[data-demo]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); toast("This page is outside the scope of the concept demo."); }); });
  }

  /* ======================================================================
     Drawers (cart, search, nav) with focus trap
     ====================================================================== */
  var scrim, current = null;
  function focusables(el) { return $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])', el).filter(function (x) { return x.offsetParent !== null || x === document.activeElement; }); }
  function lock(on) { document.documentElement.style.overflow = on ? "hidden" : ""; }
  C.openDrawer = function (panel, side, opener, focusEl) {
    if (current && current.panel === panel) return;
    if (current) C.closeDrawer(true);
    closeMega(); togglePop(false);
    current = { panel: panel, side: side, opener: opener || document.activeElement };
    scrim.hidden = false; panel.hidden = false; lock(true);
    if (opener) opener.setAttribute("aria-expanded", "true");
    MO.drawer(panel, true, side, scrim);
    setTimeout(function () { (focusEl || $(".drawer__close", panel) || panel).focus(); }, 30);
  };
  C.closeDrawer = function (instant) {
    if (!current) return;
    var c = current; current = null;
    if (c.opener && c.opener.setAttribute) c.opener.setAttribute("aria-expanded", "false");
    lock(false);
    var fin = function () { c.panel.hidden = true; if (!current) scrim.hidden = true; };
    if (instant) fin(); else MO.drawer(c.panel, false, c.side, scrim).then(fin);
    if (c.opener && c.opener.focus && !instant) c.opener.focus();
  };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (current) { C.closeDrawer(); return; }
      if (openMega) { var b = $('[data-mega="' + openMega + '"]'); closeMega(); if (b) b.focus(); }
      var pop = $("#account-pop"); if (pop && !pop.hidden) { togglePop(false); $('[data-open="account"]').focus(); }
    }
    if (e.key === "Tab" && current) {
      var f = focusables(current.panel); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!current.panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });

  function mobileNavHTML() {
    var mode = G.mode();
    var blends = C.blends("espresso").concat(C.blends("capsule")).map(function (b) { var p = C.bestOfBlend(b.id); return '<li><a href="' + (p ? C.productUrl(p) : "shop.html") + '"><span class="sw" style="--c:' + b.color_hex + '"></span>' + esc(C.blendName(b.id)) + "</a></li>"; }).join("");
    var machines = FITS_ORDER.map(function (k) { return '<li><a href="shop.html#fits=' + k + '">' + FITS[k].long.replace(/ \(.*\)/, "") + "</a></li>"; }).join("");
    var sw = '<div class="mode-switch mode-switch--m" role="group" aria-label="Shopping for" style="margin-bottom:16px"><span class="mode-switch__pill" aria-hidden="true" style="display:none"></span>' +
      '<button type="button" data-mode="home" aria-pressed="' + (mode === "home") + '"' + (mode === "home" ? ' style="background:var(--yellow);color:var(--ink)"' : "") + '>For Home</button><button type="button" data-mode="business" aria-pressed="' + (mode === "business") + '"' + (mode === "business" ? ' style="background:var(--yellow);color:var(--ink)"' : "") + ">For Business</button></div>";
    var main = mode === "business"
      ? NAV.business.map(function (n) { return '<a href="' + n.href + '">' + n.label + C.icon("arrow", "chev") + "</a>"; }).join("") + '<a href="index.html">Shop for home' + C.icon("arrow", "chev") + "</a>"
      : '<details><summary>Coffee' + C.icon("chev", "chev") + '</summary><ul><li><a href="shop.html#cat=coffee"><strong>All coffee</strong></a></li>' + machines + blends + "</ul></details>" +
        '<details><summary>Capsules &amp; Machines' + C.icon("chev", "chev") + '</summary><ul><li><a href="shop.html#cat=single-serve">All capsules &amp; pods</a></li><li><a href="shop.html#cat=machine">All machines</a></li><li><a href="shop.html#cat=care">Care &amp; cleaning</a></li><li><a href="shop.html#cat=merch,gift,beverage">Cups, gifts &amp; Brasilena</a></li></ul></details>' +
        '<a href="quiz.html">Find your blend' + C.icon("arrow", "chev") + '</a><a href="business.html">For Business' + C.icon("arrow", "chev") + '</a><a href="story.html">Our Story' + C.icon("arrow", "chev") + '</a><a href="find.html">Find us' + C.icon("arrow", "chev") + "</a>";
    return sw + '<nav class="mnav" aria-label="Mobile">' + main + "</nav>" +
      '<div style="margin-top:24px">' + (mode === "business" ? '<a class="btn btn--red btn--block btn--target" href="business.html#contact">Book a tasting</a>' : '<a class="btn btn--red btn--block btn--target" href="quiz.html">Find your blend &amp; subscribe</a>') + "</div>" +
      '<div class="mnav-contact"><strong>Talk to a person</strong><br><a href="tel:+16176120090">(617) 612-0090</a> · <a href="mailto:info@lespressousa.com">info@lespressousa.com</a><br>Mon–Fri, 9am–5pm ET · Greater Boston, MA</div>';
  }
  function bindMobileModeSwitch() {
    $$("#nav-drawer .mode-switch button").forEach(function (b) {
      b.addEventListener("click", function () { if (b.getAttribute("aria-pressed") !== "true") setMode(b.getAttribute("data-mode")); });
    });
  }

  function mountDrawers() {
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="scrim" hidden data-scrim></div>' +
      '<aside class="drawer drawer--right" id="cart-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="cart-h" tabindex="-1">' +
      '<div class="drawer__head"><h2 id="cart-h">Your cart</h2><button class="icon-btn drawer__close" type="button" aria-label="Close cart">' + C.icon("close") + "</button></div>" +
      '<div class="drawer__body" data-cart-body></div><div class="drawer__foot" data-cart-foot></div></aside>' +
      '<aside class="drawer drawer--right drawer--wide" id="search-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="search-h" tabindex="-1">' +
      '<div class="drawer__head"><h2 id="search-h">Search</h2><button class="icon-btn drawer__close" type="button" aria-label="Close search">' + C.icon("close") + "</button></div>" +
      '<div class="drawer__body"><form class="search-field" role="search" id="search-form"><label class="sr-only" for="search-q">Search coffee, capsules and machines</label>' + C.icon("search") +
      '<input id="search-q" type="search" placeholder="Try “5 Stelle”, “ESE pods” or “decaf”" autocomplete="off"></form><div data-search-results aria-live="polite"></div></div></aside>' +
      '<aside class="drawer drawer--left" id="nav-drawer" hidden role="dialog" aria-modal="true" aria-label="Menu" tabindex="-1">' +
      '<div class="drawer__head"><a class="brand" href="index.html"><img src="' + G.img("assets/img/logo/guglielmo-logo-color.png") + '" alt="Guglielmo USA home" width="1096" height="322" style="height:38px"></a><button class="icon-btn drawer__close" type="button" aria-label="Close menu">' + C.icon("close") + "</button></div>" +
      '<div class="drawer__body">' + mobileNavHTML() + "</div></aside>" +
      '<div class="toast" role="status" aria-live="polite" hidden data-toast></div>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    scrim = $("[data-scrim]");
    scrim.addEventListener("click", function () { C.closeDrawer(); });
    $$(".drawer__close").forEach(function (b) { b.addEventListener("click", function () { C.closeDrawer(); }); });
    bindMobileModeSwitch();
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-open]");
      if (t) {
        var k = t.getAttribute("data-open");
        if (k === "cart") { renderCart(); C.openDrawer($("#cart-drawer"), "right", t); }
        if (k === "search") { C.openDrawer($("#search-drawer"), "right", t, $("#search-q")); renderSearch($("#search-q").value); }
        if (k === "nav") C.openDrawer($("#nav-drawer"), "left", t);
      }
      var a = e.target.closest("#nav-drawer a, #search-drawer a");
      if (a && current) C.closeDrawer(true);
    });
    var sq = $("#search-q"), st;
    sq.addEventListener("input", function () { clearTimeout(st); st = setTimeout(function () { renderSearch(sq.value); }, 70); });
    $("#search-form").addEventListener("submit", function (e) { e.preventDefault(); if (sq.value.trim()) location.href = "shop.html#q=" + encodeURIComponent(sq.value.trim()); C.closeDrawer(true); });
  }

  /* ---------- cart drawer ---------- */
  C.shipMeter = function (s) {
    var pct = Math.min(100, Math.round((s.subtotal / G.pricing.FREE_SHIP_THRESHOLD) * 100));
    var hit = s.toFreeShipping <= 0 && s.subtotal > 0;
    return '<div class="ship-meter' + (hit ? " is-hit" : "") + '"><p class="ship-meter__txt">' + (hit ? "<strong>Bullseye.</strong> Your order ships free." : "You are <strong>" + money(s.toFreeShipping) + "</strong> away from free shipping.") + "</p>" +
      '<div class="ship-meter__bar" role="progressbar" aria-label="Progress to free shipping" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><div class="ship-meter__fill" style="width:' + pct + '%"></div><span class="ship-meter__goal" aria-hidden="true"></span></div></div>';
  };
  function lineHTML(l) {
    var p = l.product, sub = l.subscribe;
    return '<li class="cart-line" data-line="' + p.slug + '" data-sub="' + sub + '"><a class="cart-line__img" href="' + C.productUrl(p) + '" tabindex="-1" aria-hidden="true"><img src="' + G.img(p.images[0]) + '" alt="" loading="lazy" decoding="async" width="80" height="80"></a>' +
      "<div><h3><a href=\"" + C.productUrl(p) + '">' + esc(p.name) + "</a></h3>" +
      '<p class="meta">' + esc(C.formatLabel(p)) + (C.fitsLabel(p) ? " · " + esc(C.fitsLabel(p)) : "") + "</p>" +
      (sub ? '<span class="sub-badge">' + C.icon("repeat") + " Every " + sub + " weeks · 10% off</span><br>" : "") +
      '<div class="stepper" role="group" aria-label="Quantity for ' + esc(p.name) + '"><button type="button" data-q="-1" aria-label="Decrease quantity">' + C.icon("minus") + "</button><output aria-live=\"polite\">" + l.qty + '</output><button type="button" data-q="1" aria-label="Increase quantity">' + C.icon("plus") + "</button></div>" +
      '<button class="remove-btn" type="button" data-remove>Remove</button></div>' +
      '<p class="cart-line__price">' + money(l.total) + (l.saved > 0 ? "<s>" + money(l.full) + '</s><span class="save">You save ' + money(l.saved) + "</span>" : "") + "</p></li>";
  }
  function renderCart() {
    var body = $("[data-cart-body]"), foot = $("[data-cart-foot]");
    if (!body) return;
    var s = G.cart.summary();
    if (!s.lines.length) {
      body.innerHTML = '<div class="empty-state"><span class="tgt" aria-hidden="true"></span><h3 class="h3">Nothing in the target yet</h3><p class="muted">Start with the blend finder, or browse by your machine.</p><div class="btn-row" style="justify-content:center"><a class="btn btn--red btn--target" href="quiz.html">Find your blend</a><a class="btn btn--ghost" href="shop.html">Shop all</a></div></div>';
      foot.innerHTML = ""; foot.hidden = true;
      return;
    }
    foot.hidden = false;
    body.innerHTML = C.shipMeter(s) + '<ul class="cart-lines">' + s.lines.map(lineHTML).join("") + "</ul>";
    foot.innerHTML = '<div class="totals"><div><span>Subtotal</span><span class="num">' + money(s.subtotal) + "</span></div>" +
      (s.saved > 0 ? '<div class="save"><span>Savings (case &amp; subscription)</span><span class="num">−' + money(s.saved) + "</span></div>" : "") +
      "<div><span>Shipping</span><span class=\"num\">" + (s.shipping ? money(s.shipping) : "Free") + "</span></div>" +
      '<div class="grand"><span>Total</span><span class="num">' + money(s.total) + "</span></div></div>" +
      '<a class="btn btn--red btn--block btn--lg btn--target" href="checkout.html">Checkout</a><p class="tiny muted" style="text-align:center;margin-top:10px">Apple Pay, Google Pay, PayPal and Shop Pay accepted · Skip or pause subscriptions anytime</p>';
    C.enhance(body); C.enhance(foot);
  }
  C.renderCart = renderCart;
  document.addEventListener("click", function (e) {
    var line = e.target.closest(".cart-line"); if (!line) return;
    var slug = line.getAttribute("data-line"), sub = Number(line.getAttribute("data-sub")) || 0;
    var q = e.target.closest("[data-q]");
    var item = G.cart.items().filter(function (i) { return i.slug === slug && (i.subscribe || 0) === sub; })[0];
    if (q && item) { G.cart.setQty(slug, item.qty + Number(q.getAttribute("data-q")), sub); }
    if (e.target.closest("[data-remove]")) G.cart.remove(slug, sub);
  });

  function updateCount(s) {
    s = s || G.cart.summary();
    $$("[data-cart-count]").forEach(function (b) { b.textContent = s.count; b.setAttribute("data-zero", String(!s.count)); });
    $$(".cart-btn").forEach(function (b) { b.setAttribute("aria-label", "Cart, " + s.count + (s.count === 1 ? " item" : " items")); });
  }
  var prevHit = null;
  G.cart.onChange(function (s) {
    updateCount(s);
    if (current && current.panel.id === "cart-drawer") {
      var wasHit = prevHit;
      renderCart();
      var hit = s.toFreeShipping <= 0 && s.subtotal > 0;
      if (hit && wasHit === false) MO.bullseye($(".ship-meter__goal"));
    }
    prevHit = s.toFreeShipping <= 0 && s.subtotal > 0;
  });

  /* ---------- add to cart + toast ---------- */
  var toastTimer;
  function toast(msg, action) {
    var t = $("[data-toast]"); if (!t) return;
    t.innerHTML = "<span>" + msg + "</span>" + (action ? '<button class="btn btn--yellow btn--sm" type="button" data-open="cart">' + action + "</button>" : "");
    t.hidden = false;
    if (live) MO.animate(t, { opacity: [0, 1], y: [24, 0] }, { type: "spring", stiffness: 420, damping: 30 });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      if (live) MO.animate(t, { opacity: 0, y: 16 }, { duration: 0.2 }).finished.then(function () { t.hidden = true; });
      else t.hidden = true;
    }, action ? 4200 : 2600);
  }
  C.toast = toast;
  C.add = function (slug, qty, sub, fromEl, imgSrc) {
    var p = G.products.bySlug(slug);
    if (!p || !G.cart.add(slug, qty || 1, { subscribe: sub || 0 })) return false;
    var cartBtn = $$(".cart-btn").filter(function (b) { return b.offsetParent; })[0];
    MO.flyToCart(fromEl, cartBtn, imgSrc || G.img(p.images[0]));
    toast("Added <strong>" + esc(p.name) + "</strong>" + (sub ? " · every " + sub + " weeks" : ""), "View cart");
    return true;
  };
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-add]");
    if (b) {
      e.preventDefault();
      var card = b.closest(".card, .result, [data-add-scope]");
      var img = card ? $("img", card) : null;
      C.add(b.getAttribute("data-add"), 1, Number(b.getAttribute("data-sub")) || 0, img || b, img ? img.currentSrc || img.src : null);
    }
    var n = e.target.closest("[data-notify]");
    if (n) {
      var slug = n.getAttribute("data-notify"), buy = n.closest(".card__buy") || n.parentNode, id = "nt-" + (++uid);
      var wrapEl = document.createElement("form");
      wrapEl.className = "notify";
      wrapEl.innerHTML = '<label class="sr-only" for="' + id + '">Email for restock alert</label><input id="' + id + '" type="email" required placeholder="Email for restock alert"><button class="btn btn--sm btn--red" type="submit">Notify me</button>';
      buy.parentNode.replaceChild(wrapEl, buy);
      G.forms.demo(wrapEl, function () { wrapEl.innerHTML = '<p class="small" role="status"><strong>Done.</strong> We will email you when it is back.</p>'; });
      $("input", wrapEl).focus();
    }
  });

  /* ---------- search ---------- */
  var PAGES = [
    { k: "find store map near venue cafe restaurant where", t: "Find Guglielmo near you", h: "find.html" },
    { k: "business wholesale cafe restaurant office hotel tasting equipment lease service repair", t: "For Business: solutions & tasting", h: "business.html" },
    { k: "story history calabria copanello roastery 1943 family boston", t: "Our story: Calabria to Boston", h: "story.html" },
    { k: "quiz finder match recommend which blend help choose", t: "Find your blend (quiz)", h: "quiz.html" },
    { k: "subscribe subscription save delivery", t: "Subscribe & save 10%", h: "index.html#subscribe" },
    { k: "intensity strong mild bold balanced", t: "Intensity guide", h: "index.html#intensity" },
    { k: "franchise distributor retailer partner point", t: "Partner with us", h: "business.html#partner" }
  ];
  function hl(text, q) {
    var t = esc(text);
    q.split(/\s+/).filter(function (w) { return w.length > 1; }).forEach(function (w) { t = t.replace(new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>"); });
    return t;
  }
  function renderSearch(q) {
    var out = $("[data-search-results]"); if (!out) return;
    q = (q || "").trim();
    if (!q) {
      var pop = ["5 Stelle", "Extra Bar", "ESE pods", "Nespresso", "Decaf", "Moka", "Rocket", "Brasilena"];
      out.innerHTML = '<div class="search-group"><h3>Popular</h3><div class="chips">' + pop.map(function (w) { return '<button class="chip" type="button" data-q="' + w + '">' + w + "</button>"; }).join("") + "</div></div>" +
        '<div class="search-group"><h3>Not sure what you are looking for?</h3><a class="result" href="quiz.html"><span class="result__img"><span class="tgt" style="width:36px" aria-hidden="true"></span></span><span><strong>Hit your mark: the 60-second blend finder</strong><span>Five questions, one bullseye.</span></span></a></div>';
      $$("[data-q]", out).forEach(function (b) { b.addEventListener("click", function () { var i = $("#search-q"); i.value = b.getAttribute("data-q"); renderSearch(i.value); i.focus(); }); });
      return;
    }
    var ql = q.toLowerCase();
    var all = G.products.all().filter(function (p) {
      var hay = (C.searchText(p) + " " + p.category + " " + p.description).toLowerCase();
      return ql.split(/\s+/).every(function (t) { return hay.indexOf(t) >= 0; });
    });
    all = G.products.sort(all, "featured");
    var blends = C.blends().filter(function (b) { return (C.blendName(b.id) + " " + b.name + " " + (b.notes || []).join(" ")).toLowerCase().indexOf(ql) >= 0; }).slice(0, 4);
    var pages = PAGES.filter(function (p) { return ql.split(/\s+/).some(function (t) { return t.length > 2 && (p.k + " " + p.t.toLowerCase()).indexOf(t) >= 0; }); }).slice(0, 3);
    var html = "";
    if (blends.length) html += '<div class="search-group"><h3>Blends</h3><div class="result-list">' + blends.map(function (b) {
      var p = C.bestOfBlend(b.id);
      return '<a class="result" href="' + (p ? C.productUrl(p) : "shop.html#blend=" + b.id) + '"><span class="result__img" style="background:' + C.blendTheme(b.id).bg + '">' + C.rings(b.intensity, { size: 40, decorative: true }) + "</span><span><strong>" + hl(C.blendName(b.id), q) + "</strong><span>Intensity " + b.intensity + "/10 · " + esc(C.bucket(b.intensity).label) + "</span></span><b>" + C.icon("arrow") + "</b></a>";
    }).join("") + "</div></div>";
    html += '<div class="search-group"><h3>Products (' + all.length + ")</h3>" + (all.length ? '<div class="result-list">' + all.slice(0, 8).map(function (p) {
      return '<a class="result" href="' + C.productUrl(p) + '"><span class="result__img"><img src="' + G.img(p.images[0]) + '" alt="" loading="lazy" width="56" height="56"></span><span><strong>' + hl(p.name, q) + "</strong><span>" + esc(C.formatLabel(p)) + (p.in_stock || p.quote ? "" : " · Sold out") + "</span></span><b>" + (p.quote ? "Quote" : money(p.price)) + "</b></a>";
    }).join("") + "</div>" + (all.length > 8 ? '<p style="margin-top:12px"><a class="arrow-link" href="shop.html#q=' + encodeURIComponent(q) + '">See all ' + all.length + " results in the shop " + C.icon("arrow") + "</a></p>" : "")
      : '<p class="muted">No products match “' + esc(q) + '”. Try a blend name, a machine type, or <a class="link" href="quiz.html">let the finder pick for you</a>.</p>') + "</div>";
    if (pages.length) html += '<div class="search-group"><h3>Pages</h3><div class="result-list">' + pages.map(function (p) { return '<a class="result" href="' + p.h + '"><span class="result__img">' + C.icon("arrow") + "</span><span><strong>" + esc(p.t) + "</strong></span></a>"; }).join("") + "</div></div>";
    out.innerHTML = html;
  }

  /* ======================================================================
     Motion enhancements for dynamically rendered markup
     ====================================================================== */
  var PRESS_SEL = ".btn, .chip, .icon-btn, .nav-link, .opt, .swatch, .quiz-tile, .stepper button, .mode-switch button";
  C.enhance = function (root) {
    if (!live || !Mlib || !root) return;
    $$(PRESS_SEL, root).forEach(function (el) {
      if (el.__press) return; el.__press = true;
      Mlib.press(el, function () {
        MO.animate(el, { scale: 0.93 }, MO.tokens.spring);
        return function () { MO.animate(el, { scale: 1 }, MO.tokens.spring); };
      });
    });
    $$("[data-rings-fill]", root).forEach(ringFill);
  };
  /* Rings fill from the centre outward when a large meter enters view */
  function ringFill(svg) {
    if (!live || svg.__rf) return; svg.__rf = true;
    Mlib.inView(svg, function () {
      var on = $$(".r-on", svg).reverse();
      MO.animate(svg, { rotate: [-90, 0] }, { duration: 0.7, ease: MO.tokens.ease });
      if (on.length) MO.animate(on, { scale: [0, 1] }, { type: "spring", stiffness: 420, damping: 24, delay: Mlib.stagger(0.05) });
    }, { amount: 0.5 });
  }
  C.ringFill = ringFill;

  /* Brand target entry: rings snap in from the outside in, the text ring spins into place */
  C.targetIn = function (svg, delay) {
    if (!live || !svg) return;
    delay = delay || 0;
    var o = $(".t-o", svg), y = $(".t-y", svg), r = $(".t-r", svg), h = $$(".t-h", svg), t = $(".t-txt", svg);
    if (h.length) MO.animate(h, { scale: [0.6, 1], opacity: [0, 1] }, { duration: 0.8, delay: delay, ease: MO.tokens.ease });
    if (t) MO.animate(t, { rotate: [-120, 0], opacity: [0, 1] }, { duration: 1.1, delay: delay, ease: MO.tokens.ease });
    [o, y, r].forEach(function (c, i) { if (c) MO.animate(c, { scale: [0, 1], rotate: [-30, 0] }, { type: "spring", stiffness: 300, damping: 18, delay: delay + 0.08 + i * 0.12 }); });
  };

  /* ======================================================================
     Boot
     ====================================================================== */
  renderHeader();
  renderFooter();
  mountDrawers();
  updateCount();
  prevHit = (function (s) { return s.toFreeShipping <= 0 && s.subtotal > 0; })(G.cart.summary());

  var pages = window.CENTRO_PAGES || {};
  if (pages[page]) { try { pages[page](C); } catch (err) { if (window.console) console.error(err); } }

  // springy press on every button-like control present at load
  $$(PRESS_SEL).forEach(function (el) { el.setAttribute("data-m-press", ""); el.__press = true; });
  $$("[data-rings-fill]").forEach(ringFill);

  // snappy, poster-like timing: fast attack, crisp settle; springier presses
  if (MO.tokens) {
    MO.tokens.spring = { type: "spring", stiffness: 640, damping: 22, mass: 0.7 };
    MO.tokens.springSoft = { type: "spring", stiffness: 300, damping: 20 };
  }
  G.motion.init({ ease: [0.2, 0.95, 0.25, 1], duration: 0.5, distance: 22 });
})();
