/*!
 * GUSA Kit — shared, framework-free logic for the Guglielmo USA redesign concepts.
 * Data: window.GUSA_CATALOG (assets/data/catalog.js), window.GUSA_BRAND (assets/data/brand.js),
 *       window.GUSA_LOCATIONS (assets/data/locations.js), window.GUSA_MAPS (assets/data/maps.js).
 * Load those data files BEFORE this script. Then call GUSA.init({ concept: "01", root: "../../" }).
 * Everything here is UI-agnostic: each concept renders its own markup.
 */
(function () {
  "use strict";

  var cfg = { concept: "demo", root: "../../" };
  var listeners = [];

  /* ---------- storage (never throws) ---------- */
  var memory = {};
  var store = {
    get: function (k, fallback) {
      try {
        var v = window.localStorage.getItem(k);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return k in memory ? memory[k] : fallback;
      }
    },
    set: function (k, v) {
      memory[k] = v;
      try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode etc. */ }
    }
  };

  /* ---------- formatting ---------- */
  var fmt = {
    money: function (n) {
      if (n == null || isNaN(n)) return "";
      return "$" + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    moneyShort: function (n) {
      if (n == null) return "";
      return Number(n) % 1 === 0 ? "$" + Number(n).toLocaleString("en-US") : fmt.money(n);
    },
    plural: function (n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  };

  /* ---------- catalog ---------- */
  function catalog() { return (window.GUSA_CATALOG && window.GUSA_CATALOG.products) || []; }
  function brand() { return window.GUSA_BRAND || {}; }

  var SYSTEMS = {
    "espresso-point-36": { id: "espresso-point-36", label: "Guglielmo 36 mm capsules", short: "36 mm capsule", fits: "Fits Lavazza Espresso Point®-type machines (Espresso del Capitano, RDL Mini Cap, Panafe CA-FOX-E 36 mm, MY@CAPS, COMO-E)" },
    "nespresso-original": { id: "nespresso-original", label: "Espresso 70 capsules", short: "Nespresso®-compatible", fits: "Fits Nespresso® Original-line machines. Not affiliated with Nespresso." },
    "ese-44": { id: "ese-44", label: "E.S.E. 44 mm pods", short: "ESE pod", fits: "Fits any E.S.E. pod machine (Grimac Terry, Pallina, RDL Mini Pod, Sweet Coffee)" },
    "traditional": { id: "traditional", label: "Traditional espresso", short: "Beans & ground", fits: "Portafilter machines, grinders, moka pots" }
  };

  var FORMAT_LABELS = {
    beans: "Whole beans", ground: "Ground", capsule: "Capsules", pod: "ESE pods",
    "drip-beans": "Drip, whole bean", "drip-ground": "Drip, ground"
  };
  var CATEGORY_LABELS = {
    coffee: "Coffee", "single-serve": "Capsules & pods", machine: "Machines", gift: "Gifts",
    merch: "Cups & gifts", beverage: "Brasilena", care: "Care & cleaning", supplies: "Cups & supplies"
  };

  function img(path) {
    if (!path) return "";
    if (/^(https?:|data:|blob:|\/)/.test(path)) return path;
    return cfg.root + path;
  }

  function blendInfo(id) {
    var b = brand().blends || [];
    for (var i = 0; i < b.length; i++) if (b[i].id === id) return b[i];
    return null;
  }

  var products = {
    all: function () { return catalog().slice(); },
    bySlug: function (slug) {
      var c = catalog();
      for (var i = 0; i < c.length; i++) if (c[i].slug === slug) return c[i];
      return null;
    },
    /* filter({category, blend, format, system, audience, inStock, q, quote}) — arrays allowed for any key */
    filter: function (f) {
      f = f || {};
      function match(val, want) {
        if (want == null || want === "" || (Array.isArray(want) && !want.length)) return true;
        var w = Array.isArray(want) ? want : [want];
        if (Array.isArray(val)) return val.some(function (v) { return w.indexOf(v) >= 0; });
        return w.indexOf(val) >= 0;
      }
      var q = (f.q || "").trim().toLowerCase();
      return catalog().filter(function (p) {
        if (!match(p.category, f.category)) return false;
        if (!match(p.blend, f.blend)) return false;
        if (!match(p.format, f.format)) return false;
        if (!match(p.system, f.system)) return false;
        if (!match(p.audience, f.audience)) return false;
        if (f.inStock && !p.in_stock) return false;
        if (f.hideQuote && p.quote) return false;
        if (q) {
          var hay = [p.name, p.blend, p.format, p.system, p.brand, p.category, p.description].join(" ").toLowerCase();
          if (q.split(/\s+/).some(function (t) { return hay.indexOf(t) < 0; })) return false;
        }
        return true;
      });
    },
    /* sort: "featured" | "price-asc" | "price-desc" | "name" — in-stock first for featured */
    sort: function (list, by) {
      var l = list.slice();
      if (by === "price-asc") l.sort(function (a, b) { return (a.price || 1e9) - (b.price || 1e9); });
      else if (by === "price-desc") l.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
      else if (by === "name") l.sort(function (a, b) { return a.name.localeCompare(b.name); });
      else l.sort(function (a, b) { return (b.in_stock - a.in_stock); });
      return l;
    },
    machinesFor: function (system) { return products.filter({ category: "machine", system: system }); },
    coffeeFor: function (system) { return products.filter({ category: "single-serve", system: system }); },
    /* group the coffee products of one blend into a selectable "family" for a PDP */
    family: function (blendId) {
      return catalog().filter(function (p) { return p.blend === blendId && (p.category === "coffee" || p.category === "single-serve"); });
    },
    pricePerUnit: function (p) {
      if (!p || !p.price || !p.size) return null;
      var m = /(\d+(?:\.\d+)?)\s*(kg|g|capsules|pods)/.exec(p.size);
      if (!m) return null;
      var n = parseFloat(m[1]);
      if (m[2] === "kg") return { value: p.price / (n * 1000 / 453.6), unit: "lb" };
      if (m[2] === "g") return { value: p.price / (n / 453.6), unit: "lb" };
      return { value: p.price / n, unit: "cup" };
    },
    formatLabel: function (f) { return FORMAT_LABELS[f] || f || ""; },
    categoryLabel: function (c) { return CATEGORY_LABELS[c] || c || ""; }
  };

  /* ---------- pricing rules (mirror today's WooCommerce rules + proposed subscription) ---------- */
  var pricing = {
    FREE_SHIP_THRESHOLD: 59,
    FLAT_SHIP: 8.95,
    SUBSCRIBE_DISCOUNT: 0.10,          // proposed: 10% off on any subscription line
    CASE_TIERS: [[18, 0.08], [12, 0.06], [6, 0.05]], // current site: case discount on coffee
    caseDiscountRate: function (p, qty) {
      if (!p || (p.category !== "coffee" && p.category !== "single-serve")) return 0;
      for (var i = 0; i < pricing.CASE_TIERS.length; i++) if (qty >= pricing.CASE_TIERS[i][0]) return pricing.CASE_TIERS[i][1];
      return 0;
    },
    lineTotal: function (p, qty, subscribe) {
      if (!p || !p.price) return 0;
      var rate = pricing.caseDiscountRate(p, qty);
      if (subscribe) rate = Math.max(rate, pricing.SUBSCRIBE_DISCOUNT);
      return Math.round(p.price * qty * (1 - rate) * 100) / 100;
    },
    /* "the machine pays for itself": cost per shot over the first N shots including the machine */
    costPerShot: function (machinePrice, packPrice, packCount, shots) {
      var packs = Math.ceil(shots / packCount);
      return (machinePrice + packs * packPrice) / shots;
    },
    /* compare with café spend */
    yearlySavings: function (cupsPerDay, cafePrice, perCup) {
      return Math.max(0, Math.round((cafePrice - perCup) * cupsPerDay * 365));
    }
  };

  /* ---------- cart ---------- */
  function cartKey() { return "gusa-cart-" + cfg.concept; }
  var cart = {
    items: function () { return store.get(cartKey(), []); },
    save: function (items) { store.set(cartKey(), items); listeners.forEach(function (fn) { try { fn(cart.summary()); } catch (e) {} }); },
    /* add(slug, qty, {subscribe: 0|2|4|6 (weeks)}) */
    add: function (slug, qty, opts) {
      var p = products.bySlug(slug);
      if (!p || p.quote) return false;
      qty = Math.max(1, qty || 1);
      var sub = (opts && opts.subscribe) || 0;
      var items = cart.items();
      var hit = items.filter(function (i) { return i.slug === slug && (i.subscribe || 0) === sub; })[0];
      if (hit) hit.qty += qty; else items.push({ slug: slug, qty: qty, subscribe: sub });
      cart.save(items);
      return true;
    },
    setQty: function (slug, qty, subscribe) {
      var items = cart.items().map(function (i) {
        if (i.slug === slug && (i.subscribe || 0) === (subscribe || 0)) i.qty = qty;
        return i;
      }).filter(function (i) { return i.qty > 0; });
      cart.save(items);
    },
    remove: function (slug, subscribe) { cart.setQty(slug, 0, subscribe); },
    clear: function () { cart.save([]); },
    count: function () { return cart.items().reduce(function (s, i) { return s + i.qty; }, 0); },
    summary: function () {
      var lines = cart.items().map(function (i) {
        var p = products.bySlug(i.slug);
        if (!p) return null;
        var full = (p.price || 0) * i.qty;
        var total = pricing.lineTotal(p, i.qty, i.subscribe);
        return { product: p, qty: i.qty, subscribe: i.subscribe || 0, full: full, total: total, saved: Math.round((full - total) * 100) / 100 };
      }).filter(Boolean);
      var subtotal = lines.reduce(function (s, l) { return s + l.total; }, 0);
      var saved = lines.reduce(function (s, l) { return s + l.saved; }, 0);
      var shipping = subtotal === 0 || subtotal >= pricing.FREE_SHIP_THRESHOLD ? 0 : pricing.FLAT_SHIP;
      return {
        lines: lines, count: cart.count(), subtotal: Math.round(subtotal * 100) / 100, saved: Math.round(saved * 100) / 100,
        shipping: shipping, total: Math.round((subtotal + shipping) * 100) / 100,
        toFreeShipping: Math.max(0, Math.round((pricing.FREE_SHIP_THRESHOLD - subtotal) * 100) / 100)
      };
    },
    onChange: function (fn) { listeners.push(fn); }
  };

  /* ---------- maps ---------- */
  var map = {
    data: function (key) { return (window.GUSA_MAPS || {})[key]; },
    /* project(lat,lng) -> {x, y, inside} in the map's viewBox coordinates */
    project: function (key, lat, lng) {
      var m = map.data(key); if (!m) return null;
      var p = m.proj, x, y;
      if (p.type === "equirect") { x = (lng - p.lng_min) * p.kx; y = (p.lat_max - lat) * p.ky; }
      else {
        var r = Math.PI / 180, phi1 = p.phi1 * r, phi2 = p.phi2 * r, phi0 = p.phi0 * r, lam0 = p.lam0 * r;
        var n = (Math.sin(phi1) + Math.sin(phi2)) / 2, C = Math.cos(phi1) * Math.cos(phi1) + 2 * n * Math.sin(phi1);
        var rho0 = Math.sqrt(C - 2 * n * Math.sin(phi0)) / n, rho = Math.sqrt(C - 2 * n * Math.sin(lat * r)) / n, th = n * (lng * r - lam0);
        x = (rho * Math.sin(th) - p.x0) * p.s; y = (p.y1 - (rho0 - rho * Math.cos(th))) * p.s;
      }
      return { x: x, y: y, inside: x >= 0 && y >= 0 && x <= m.width && y <= m.height };
    },
    /* Base SVG markup. Counties are a fill-only land layer (their edges are coarse); neighborhoods carry detail.
       opts: {water, land, district, stroke, strokeWidth, className} — pass CSS colors or var(--token) strings. */
    svg: function (key, opts) {
      var m = map.data(key); if (!m) return "";
      opts = opts || {};
      var water = opts.water || "#cfdde3", land = opts.land || "#f4efe6", district = opts.district || "#ece3d4", stroke = opts.stroke || "#b9ab95";
      var sw = opts.strokeWidth || 0.8;
      var s = '<svg class="' + (opts.className || "gusa-map") + '" viewBox="' + m.viewBox + '" role="img" aria-label="' + (key === "us" ? "Map of the United States" : "Map of Greater Boston") + '" preserveAspectRatio="xMidYMid slice">';
      s += '<rect width="' + m.width + '" height="' + m.height + '" fill="' + water + '"/>';
      m.paths.forEach(function (p) {
        if (p.kind === "county") s += '<path d="' + p.d + '" fill="' + land + '" stroke="' + land + '" stroke-width="1"/>';
      });
      m.paths.forEach(function (p) {
        if (p.kind !== "county") s += '<path d="' + p.d + '" fill="' + (key === "us" ? land : district) + '" stroke="' + stroke + '" stroke-width="' + sw + '"><title>' + p.name + "</title></path>";
      });
      s += "</svg>";
      return s;
    },
    /* venues ranked by distance from a lat/lng (miles) */
    nearest: function (lat, lng, list) {
      list = list || (window.GUSA_LOCATIONS || {}).venues || [];
      function d(a) {
        var R = 3958.8, r = Math.PI / 180, dLat = (a.lat - lat) * r, dLng = (a.lng - lng) * r;
        var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat * r) * Math.cos(a.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * R * Math.asin(Math.sqrt(h));
      }
      return list.map(function (v) { return Object.assign({ miles: Math.round(d(v) * 10) / 10 }, v); }).sort(function (a, b) { return a.miles - b.miles; });
    },
    /* rough geocoder for demo search: a few ZIPs / towns around Boston */
    places: {
      "02113": [42.3651, -71.0542], "02116": [42.3496, -71.0746], "02128": [42.3702, -71.0270], "02446": [42.3434, -71.1210],
      "02135": [42.3496, -71.1532], "02127": [42.3381, -71.0476], "02150": [42.3918, -71.0328], "02478": [42.3959, -71.1787],
      "02139": [42.3647, -71.1042], "02210": [42.3480, -71.0410], "01830": [42.7762, -71.0773],
      "boston": [42.3601, -71.0589], "north end": [42.3651, -71.0542], "cambridge": [42.3736, -71.1097], "brookline": [42.3318, -71.1212],
      "newton": [42.3370, -71.2092], "somerville": [42.3876, -71.0995], "east boston": [42.3702, -71.0389], "chelsea": [42.3918, -71.0328],
      "belmont": [42.3959, -71.1787], "south boston": [42.3381, -71.0476], "haverhill": [42.7762, -71.0773], "quincy": [42.2529, -71.0023]
    },
    geocode: function (q) {
      q = (q || "").trim().toLowerCase();
      return map.places[q] || null;
    }
  };

  /* ---------- demo forms: validate, never submit anywhere ---------- */
  var forms = {
    /* forms.demo(formEl, onSuccess) — prevents submission, checks required fields, calls onSuccess(data) */
    demo: function (form, onSuccess) {
      if (!form) return;
      form.setAttribute("novalidate", "");
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var ok = true, first = null;
        Array.prototype.forEach.call(form.querySelectorAll("[required]"), function (el) {
          var bad = !el.value || (el.type === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value)) || (el.type === "checkbox" && !el.checked);
          el.setAttribute("aria-invalid", bad ? "true" : "false");
          if (bad) { ok = false; first = first || el; }
        });
        if (!ok) { if (first) first.focus(); return; }
        var data = {};
        Array.prototype.forEach.call(form.elements, function (el) { if (el.name) data[el.name] = el.value; });
        if (onSuccess) onSuccess(data);
      });
    }
  };

  /* ---------- small DOM helpers ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function param(name) {
    // Query strings don't survive inside the published artifact, so fall back to the hash (#slug) and session memory.
    try { var v = new URLSearchParams(window.location.search).get(name); if (v) return v; } catch (e) {}
    var h = (window.location.hash || "").replace(/^#/, "");
    if (h) return h;
    try { return window.sessionStorage.getItem("gusa-param-" + name); } catch (e) { return null; }
  }
  /* link to a page with a parameter in a way that works both locally and inside the artifact viewer */
  function linkTo(page, name, value) {
    return page + "#" + encodeURIComponent(value);
  }
  function remember(name, value) { try { window.sessionStorage.setItem("gusa-param-" + name, value); } catch (e) {} }

  window.GUSA = {
    version: "1.0.0",
    init: function (o) { Object.assign(cfg, o || {}); return window.GUSA; },
    config: cfg,
    store: store, fmt: fmt, img: img, products: products, blend: blendInfo, brand: brand,
    systems: SYSTEMS, pricing: pricing, cart: cart, map: map, forms: forms,
    locations: function () { return window.GUSA_LOCATIONS || { venues: [], distributors: [] }; },
    $: $, $$: $$, esc: esc, param: param, linkTo: linkTo, remember: remember
  };
})();
