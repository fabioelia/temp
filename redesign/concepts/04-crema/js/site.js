/* Guglielmo USA — concept 04 "Crema". Core: data enrichment, chrome (header, mode, search, drawers, cart), cards.
   Page scripts (js/home.js, js/shop.js, ...) load BEFORE this file and register window.CREMA_PAGES[page](C).
   Everything animated goes through Motion (GUSA.motion + window.Motion), guarded by GUSA.motion.live. */
(function () {
  "use strict";
  var G = window.GUSA;
  var $ = G.$, $$ = G.$$, esc = G.esc;
  var MO = G.motion || { live: false, drawer: function () { return Promise.resolve(); }, flyToCart: function () { return Promise.resolve(); }, number: function (el, to, f) { el.textContent = f ? f(to) : to; return Promise.resolve(); }, swap: function (c, r) { r(); return Promise.resolve(); }, list: function () {}, bump: function () {}, bullseye: function () {}, scrub: function (t, f) { f(1); return function () {}; }, init: function () {}, animate: function () { return { finished: Promise.resolve() }; } };
  var Mo = window.Motion || null;
  var LIVE = !!MO.live;
  var page = document.body.getAttribute("data-page") || "";
  var C = { G: G, MO: MO, Mo: Mo, live: LIVE, page: page };

  /* ======================================================================
     1. Icons
     ====================================================================== */
  var I = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4"/></svg>',
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 016 0V8"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6.5h11v9H3zM14 9.5h3.6l3.4 3.4v2.6h-7z"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg>',
    wrench: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5a4 4 0 00-5 5L4 16l4 4 5.5-5.5a4 4 0 005-5l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>',
    gauge: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="24" cy="26" r="17"/><path d="M24 26l7-8"/><circle cx="24" cy="26" r="2.2" fill="currentColor"/><path d="M11 26h3M34 26h3M24 13v3M15 17l2 2M33 17l-2 2"/><path d="M18 40h12"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 005.2 5.2l1.3-2 4 1.5v3a2 2 0 01-2.2 2A16 16 0 014.5 5.7a2 2 0 012-2.2z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l7 2.8v5.4c0 4.3-3 7.7-7 8.8-4-1.1-7-4.5-7-8.8V6.3z"/><path d="M9 12l2.2 2.2L15.5 10"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 8.5A7.5 7.5 0 006 7M4.5 15.5A7.5 7.5 0 0018 17"/><path d="M19.5 4v4.5H15M4.5 20v-4.5H9"/></svg>',
    drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5s6 6.3 6 10.5a6 6 0 01-12 0c0-4.2 6-10.5 6-10.5z"/></svg>',
    cup: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 9h12v4.5a5 5 0 01-5 5h-2a5 5 0 01-5-5z"/><path d="M16.5 10.5h1.2a2.3 2.3 0 010 4.6h-1.6M3 21h16"/><path d="M8.5 3.5c-.8 1 .8 2-.1 3M12.5 3.5c-.8 1 .8 2-.1 3"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c1-3 3.3-4.6 6-4.6s5 1.6 6 4.6"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16.5 14.6c2.2.2 3.8 1.6 4.5 3.9"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 7l2.5 2.5M14 9l2 2"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><path d="M3.5 7.5L12 11.5l8.5-4M12 11.5v9"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };
  /* system glyphs, drawn as precise line work */
  var GLYPH = {
    "espresso-point-36": '<svg class="sys-glyph" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M9 12h22l-3.5 18h-15z"/><path d="M7 12h26"/><path d="M14.5 30h11"/><text x="20" y="24" text-anchor="middle" font-size="7" font-family="ui-monospace,monospace" fill="currentColor" stroke="none">36</text></svg>',
    "nespresso-original": '<svg class="sys-glyph" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 11h16"/><path d="M13 11c0 7 2 13 4.5 17.5h5C25 24 27 18 27 11"/><path d="M17.5 28.5h5"/><text x="20" y="21" text-anchor="middle" font-size="6.5" font-family="ui-monospace,monospace" fill="currentColor" stroke="none">70</text></svg>',
    "ese-44": '<svg class="sys-glyph" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="20" cy="20" r="13"/><circle cx="20" cy="20" r="9" stroke-dasharray="1.6 1.8"/><text x="20" y="22.5" text-anchor="middle" font-size="6.5" font-family="ui-monospace,monospace" fill="currentColor" stroke="none">44</text></svg>',
    traditional: '<svg class="sys-glyph" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><ellipse cx="17" cy="20" rx="7.5" ry="11" transform="rotate(-30 17 20)"/><path d="M12.5 27c3-3 3.5-8 9-14"/><path d="M26 17h9M31 13v8"/></svg>',
    drip: '<svg class="sys-glyph" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M11 9h18l-6 9h-6z"/><path d="M20 21v3"/><path d="M12 26h16v4a4 4 0 01-4 4h-8a4 4 0 01-4-4z"/></svg>'
  };
  C.I = I; C.GLYPH = GLYPH;

  /* ======================================================================
     2. Data enrichment (facts only from catalog descriptions + brand pack)
     ====================================================================== */
  var CAFE = 4.5; // café espresso drink used for payback math (stated on every calculator)
  var SHOT_G = 7; // grams per single shot, the same dose as a Guglielmo capsule
  C.CAFE = CAFE; C.SHOT_G = SHOT_G;

  var SYS = {
    "espresso-point-36": {
      id: "espresso-point-36", name: "36 mm capsules", long: "Guglielmo 36 mm capsules", fitsShort: "36 mm machines",
      sub: "Sealed 7 g capsules for Espresso Point®-type machines.",
      what: "Sealed 7 g capsules of Guglielmo blends, the Italian bar format for home and office.",
      milk: "Yes, on steam-wand models", cleanup: "Spent capsules drop into a drawer. No grounds.", counter: "Compact, about 20 cm wide",
      img: "assets/img/brand/pack-5-stelle-capsule-point.jpg", tone: "Bar espresso at the press of a button",
      ownLabel: "An Espresso Point®-type capsule machine", ownEg: "Espresso del Capitano, RDL Mini Cap, Panafe, Grimac Tube"
    },
    "nespresso-original": {
      id: "nespresso-original", name: "Espresso 70 capsules", long: "Espresso 70 capsules (Nespresso® Original-compatible*)", fitsShort: "Nespresso® Original*",
      sub: "ORO70, ROSSO70 and DEK70 for Nespresso® Original machines.*",
      what: "Guglielmo capsules sized for the Nespresso® Original line*. Bring Calabrian espresso to the machine you already own.",
      milk: "With your machine’s own frother", cleanup: "Spent capsule into the bin. No grounds.", counter: "The machine you own (CA-FOX-E: 17 cm wide)",
      img: "assets/img/products/rosso70-capsules-120-pack__0.jpg", tone: "The easiest switch if you own one",
      ownLabel: "A Nespresso® Original-line machine*", ownEg: "Any Original-line model (not Vertuo)"
    },
    "ese-44": {
      id: "ese-44", name: "E.S.E. 44 mm pods", long: "E.S.E. 44 mm paper pods (cialde)", fitsShort: "E.S.E. machines",
      sub: "Pre-pressed paper pods for any E.S.E. pod machine.",
      what: "Pre-dosed coffee pressed between two paper filters: the Easy Serving Espresso standard, no tamping and no plastic shell.",
      milk: "Yes, on the Sweet Coffee Vapore", cleanup: "A spent paper pod. No tamping, no grounds.", counter: "Medium, about 26 cm wide",
      img: "assets/img/products/decaf-pods-180-ct__1.jpg", tone: "Paper pods, a café-style group",
      ownLabel: "An E.S.E. pod machine", ownEg: "Grimac Terry or Pallina, RDL Mini Pod or Sweet Coffee"
    },
    traditional: {
      id: "traditional", name: "Beans & ground", long: "Traditional espresso: beans and ground", fitsShort: "Espresso & moka",
      sub: "Whole beans for the grinder, ground coffee for the moka pot.",
      what: "The full ritual: grind, dose, tamp and pull on a portafilter machine, or brew Calabrian-style in a moka pot.",
      milk: "Yes, steam wand on the Rocket", cleanup: "Knock out the puck, rinse the basket. The most hands-on.", counter: "From a moka on the stove to 27 × 45 cm",
      img: "assets/img/brand/pack-extra-bar-1kg-beans.jpg", tone: "The full ritual, the lowest cost per cup",
      ownLabel: "An espresso machine or a moka pot", ownEg: "Portafilter machines, grinders, stovetop moka"
    }
  };
  C.SYS = SYS;
  C.SYS_ORDER = ["espresso-point-36", "nespresso-original", "ese-44", "traditional"];

  /* Machine specs, transcribed from today's product copy. box = what ships (from listed removable parts). */
  var MACHINES = {
    "espresso-plus-vap-capsule-machine": {
      short: "Espresso Plus VAP", made: "Made in Italy", steam: true, tank: "2.0 L", dims: [290, 200, 260], dimsLabel: "290 × 200 × 260 mm (L × W × H)",
      summary: "A compact 36 mm capsule machine with an aluminum lever, programmable doses and a steam wand for cappuccino. The heated, removable 2-liter tank and a 15-capsule drawer keep it tidy on a small counter.",
      features: ["Aluminum lever", "Automatic, programmable coffee doses", "Steam wand", "Automatic capsule ejection", "Automatic rinsing and heating of the infusion unit", "Automatic energy saving", "Heated, removable 2.0 L water tank", "Removable 15-capsule drawer with drawer-full LED", "Adjustable cup holder", "No-water warning light", "Electronic thermostat"],
      box: ["Espresso Plus VAP machine", "Removable 2.0 L water tank", "15-capsule receptacle", "Drip tray and adjustable cup holder", "Manufacturer’s manual"],
      strip: [["2.0 L", "Heated tank"], ["15", "Capsule drawer"], ["Steam", "Milk wand"], ["29 cm", "Deep"]],
      details: [["img/vap-detail-cupholder.jpg", "Adjustable cup holder, for a tazzina or a cappuccino cup"], ["img/vap-detail-tank.jpg", "Removable tank for easy refills"], ["img/vap-detail-doses.jpg", "Programmable dose buttons"], ["img/vap-detail-capsule.jpg", "Capsule goes in under the lever"], ["img/vap-detail-drawer.jpg", "Spent-capsule drawer slides out to empty"]],
      callouts: [[50, 9, "r", "Lever", "Aluminum"], [86, 37, "r", "Steam", "Wand for milk"], [13, 30, "l", "Tank", "2.0 L, heated"], [30, 62, "l", "Doses", "Programmable"], [55, 86, "r", "Cup holder", "Adjustable"]]
    },
    "tube-capsule-machine": {
      short: "Tube", made: "Grimac", steam: false, tank: null, dims: null,
      summary: "Grimac’s smallest capsule machine: a slim, single-button way into Guglielmo 36 mm capsules for espresso straight up. Pair it with a milk frother if you take cappuccino.",
      features: ["Takes Guglielmo 36 mm capsules", "Slim, compact body", "Espresso only: no steam wand"],
      box: ["Tube capsule machine", "Drip tray", "Manufacturer’s manual"],
      strip: [["36 mm", "Capsules"], ["$165", "Entry price"], ["Slim", "Footprint"], ["No", "Steam wand"]],
      callouts: [[45, 18, "l", "Top load", "36 mm capsule"], [56, 52, "r", "Spout", "Single shot"], [44, 80, "l", "Drip tray", "Removable"]],
      note: "Full specifications for the Tube are being confirmed with Grimac; our team will answer any question before you order."
    },
    "sweetcoffeevapore": {
      short: "Sweet Coffee Vapore", made: "Made in Italy", steam: true, tank: "2.5 L", dims: [255, 355, 330], dimsLabel: "255 × 355 × 330 mm (L × W × H)", weight: "13 kg",
      summary: "An RDL pod machine with a brass heat exchanger and a steam wand: E.S.E. espresso with café-style weight (13 kg) and real milk texture, plus a water softener in the tank.",
      features: ["Brass heat exchanger", "Coffee/steam heat exchanger with double resistor", "Steam wand", "In-tank water softener", "Safety thermostat for brewing and steam", "ABS frame", "2.5 L water tank"],
      box: ["Sweet Coffee Vapore machine", "In-tank water softener", "E.S.E. pod holder", "Drip tray", "Manufacturer’s manual"],
      strip: [["2.5 L", "Water tank"], ["13 kg", "Weight"], ["Brass", "Heat exchanger"], ["Steam", "Milk wand"]],
      callouts: [[13, 18, "l", "Steam", "Wand for milk"], [35, 45, "l", "Group", "E.S.E. 44 mm"], [74, 45, "r", "Controls", "Coffee & steam"], [55, 76, "r", "Drip tray", "Removable"], [8, 80, "l", "Pod holder", "Handle"]]
    },
    "rocket-appartamento-tca-chrome-black": {
      short: "Appartamento TCA", made: "Rocket Espresso", steam: true, tank: "1.9 L", dims: [270, 448, 358], dimsLabel: "270 W × 448 D × 358 H mm", weight: "22 kg",
      summary: "Rocket’s compact heat-exchanger machine, now with Temperature Control Adjustment. Pull a shot and steam milk at the same time, and set brew temperature to suit the blend, from Organic to Extra Bar.",
      features: ["Temperature Control Adjustment (TCA)", "Built-in heat exchanger", "1.8 L boiler with insulating cover", "Vibration pump", "1.9 L water tank", "Low water reserve sensor", "115 V, 60 Hz, 1200 W"],
      box: ["Appartamento TCA machine", "Portafilter with baskets", "Manufacturer’s manual", "Tested and drained by our technicians"],
      strip: [["1.8 L", "HX boiler"], ["1.9 L", "Water tank"], ["22 kg", "Weight"], ["1200 W", "115 V"]],
      callouts: [[57, 31, "r", "Boiler", "1.8 L heat exchanger"], [40, 41, "l", "Group", "TCA brew temperature"], [17, 57, "l", "Steam", "Wand for milk"], [68, 13, "r", "Tank", "1.9 L, low-water sensor"], [55, 70, "r", "Drip tray", "Steel cup tray"]]
    },
    "ca-fox-e-36-mm-capsule-machine": {
      short: "CA-FOX-E (36 mm)", made: "Panafè", steam: false, tank: "1.2 L", dims: [170, 370, 294], dimsLabel: "170 × 370 × 294 mm (L × W × H)", weight: "5.05 kg",
      summary: "A slim Panafè machine for Guglielmo 36 mm capsules with espresso, long and Americano doses, a brass capsule press for stable temperature and a double drip tray for different cups.",
      features: ["Espresso, long or Americano dosing", "Energy-saving model", "Top-loading capsule door", "Semi-automatic capsule ejection", "Brass capsule press", "Removable double drip tray", "Patented anodized heat exchanger", "Thermostat made in Italy", "1.2 L tank"],
      box: ["CA-FOX-E machine", "Removable 1.2 L tank", "Double drip tray", "Manufacturer’s manual"],
      strip: [["1.2 L", "Tank"], ["17 cm", "Wide"], ["5 kg", "Weight"], ["3", "Doses"]]
    },
    "ca-fox-e-compatible-capsule-machine": {
      short: "CA-FOX-E (Espresso 70)", made: "Panafè", steam: false, tank: "1.2 L", dims: [170, 370, 294], dimsLabel: "170 × 370 × 294 mm (L × W × H)",
      summary: "The same slim Panafè body, built for Guglielmo Espresso 70 capsules (compatible with Nespresso® Original*): espresso, long and Americano doses and a brass capsule press.",
      features: ["Espresso, long or Americano dosing", "Energy-saving model", "Top-loading capsule door", "Semi-automatic capsule ejection", "Brass capsule press", "Removable double drip tray", "Patented anodized heat exchanger", "1.2 L tank"],
      box: ["CA-FOX-E machine", "Removable 1.2 L tank", "Double drip tray", "Manufacturer’s manual"],
      strip: [["1.2 L", "Tank"], ["17 cm", "Wide"], ["70", "Capsule line"], ["3", "Doses"]]
    },
    "ca-como-e-cp": {
      short: "COMO-E CP", made: "Panafè", steam: false, tank: "1.2 L", dims: [250, 330, 400], dimsLabel: "25 × 33 × 40 cm", weight: "4.8 kg",
      summary: "A lightweight red Panafè capsule machine for 36 mm capsules with a food-grade aluminum heat exchanger and a removable tank and tray.",
      features: ["Small footprint", "Food-grade aluminum heat exchanger", "1.2 L removable tank", "Removable tray", "Color: red"],
      box: ["COMO-E CP machine", "Removable tank and tray", "Manufacturer’s manual"],
      strip: [["1.2 L", "Tank"], ["4.8 kg", "Weight"], ["Red", "Finish"], ["36 mm", "Capsules"]]
    },
    "ca-mycaps-v-capsule-machine": {
      short: "MY@CAPS/V", made: "Panafè", steam: true, tank: "2.0 L",
      summary: "Electronic controls, automatic dosing and independent coffee and steam circuits: a Panafè 36 mm machine built for cappuccino as much as espresso.",
      features: ["Electronic controls", "Automatic dosing", "Steam wand", "Independent heat exchanger (coffee) and U-boiler (steam)", "Brass capsule press", "NTC probe temperature control", "Removable double drip tray", "2.0 L tank"],
      box: ["MY@CAPS/V machine", "Removable tank", "Double drip tray", "Manufacturer’s manual"],
      strip: [["2.0 L", "Tank"], ["Steam", "Separate boiler"], ["NTC", "Temp. probe"], ["36 mm", "Capsules"]]
    },
    "mini-cap-vapore-capsule-machine": {
      short: "Mini Cap Vapore", made: "Made in Italy", steam: true, tank: "2.0 L", dims: [230, 330, 310], dimsLabel: "230 × 330 × 310 mm (L × W × H)", weight: "8 kg",
      summary: "RDL’s black 36 mm capsule machine with a steam wand, an aluminum heat exchanger with double resistor and a water softener in the tank.",
      features: ["Steam wand", "Automatic capsule ejection", "Aluminum heat exchanger", "Coffee/steam heat exchanger with double resistor", "In-tank water softener", "Safety thermostats", "2.0 L tank"],
      box: ["Mini Cap Vapore machine", "In-tank water softener", "Drip tray", "Manufacturer’s manual"],
      strip: [["2.0 L", "Tank"], ["8 kg", "Weight"], ["Steam", "Milk wand"], ["23 cm", "Wide"]]
    },
    "mini-pod-machine": {
      short: "Mini Pod", made: "Made in Italy", steam: false, tank: "2.0 L", dims: [230, 330, 310], dimsLabel: "230 × 330 × 310 mm (L × W × H)", weight: "8 kg",
      summary: "A striking RDL pod machine for 44 mm E.S.E. pods with a 15-bar pump. Manual operation, espresso only, in a range of color combinations.",
      features: ["Manual operation", "15 bar vibration pump", "Aluminum heat exchanger", "In-tank water softener", "Espresso only: no steam option", "2.0 L tank"],
      box: ["Mini Pod machine", "In-tank water softener", "Pod holder", "Manufacturer’s manual"],
      strip: [["15 bar", "Pump"], ["2.0 L", "Tank"], ["8 kg", "Weight"], ["No", "Steam"]],
      callouts: [[60, 9, "r", "Tank", "2.0 L, top fill"], [76, 30, "r", "Group", "E.S.E. 44 mm"], [42, 50, "l", "Pump", "15 bar"], [76, 72, "r", "Drip tray", "Removable"]]
    },
    "office-plus-vap-capsule-machine": {
      short: "Office Plus VAP", made: "Made in Italy", steam: true, tank: "3.0 L", dims: [400, 200, 250], dimsLabel: "400 × 200 × 250 mm (L × W × H)", weight: "8.5 kg",
      summary: "Espresso del Capitano’s light-commercial capsule machine: a 50-capsule receptacle, washable hopper, steam wand and an interchangeable water-softener filter.",
      features: ["Automatic coffee doses", "Steam wand", "Automatic capsule ejection", "Patented infusion system", "Removable 50-capsule receptacle", "Removable, washable hopper", "Interchangeable water-softener filter", "3.0 L tank"],
      box: ["Office Plus VAP machine", "50-capsule receptacle", "Washable hopper", "Water-softener filter", "Manufacturer’s manual"],
      strip: [["3.0 L", "Tank"], ["50", "Capsule drawer"], ["Steam", "Milk wand"], ["8.5 kg", "Weight"]]
    },
    "pallina-vapor-pod-machine": {
      short: "Pallina Vapor", made: "Made in Italy", steam: true, tank: "2.0 L", dims: [320, 202, 305], dimsLabel: "320 × 202 × 305 mm (L × W × H)", weight: "8 kg",
      summary: "Grimac’s pod machine with independently ignitable heat exchangers, a patented pre-infusion compensator and two inline water softeners.",
      features: ["Steam wand", "Two inline water softeners", "Patented pre-infusion compensator", "Independently ignitable heat exchangers", "Steel body, ABS side panels", "2.0 L tank"],
      box: ["Pallina Vapor machine", "Pod holder", "Drip tray", "Manufacturer’s manual"],
      strip: [["2.0 L", "Tank"], ["8 kg", "Weight"], ["Steam", "Milk wand"], ["20 cm", "Wide"]]
    },
    "terry-opale": {
      short: "Terry Opale", made: "Made in Italy", steam: false, tank: "2.0 L", dims: [374, 282, 370], dimsLabel: "374 × 282 × 370 mm (L × W × H)", weight: "10 kg",
      summary: "A Grimac E.S.E. pod machine with pod compression and a patented pre-infusion compensator. Espresso only; no steam.",
      features: ["Pod compression", "Patented pre-infusion compensator", "Inline water softener", "Steel body, ABS front", "Espresso only: no steam option", "2.0 L tank"],
      box: ["Terry Opale machine", "Pod holder", "Drip tray", "Manufacturer’s manual"],
      strip: [["2.0 L", "Tank"], ["10 kg", "Weight"], ["No", "Steam"], ["44 mm", "E.S.E. pods"]]
    },
    "terry-vapor-nuvola": {
      short: "Terry Vapor (Nuvola)", made: "Made in Italy", steam: true, tank: "3.0 L", weight: "10 kg",
      summary: "Dual brass boilers for steam and coffee at the same time, thermoblock heaters, a cup warmer and a large drip pan.",
      features: ["Dual brass boilers", "Thermoblock heaters", "Steam wand", "Cup warmer", "Large drip pan", "Two inline water softeners", "3.0 L tank"],
      box: ["Terry Vapor machine", "Pod holder", "Drip pan", "Manufacturer’s manual"],
      strip: [["3.0 L", "Tank"], ["2", "Brass boilers"], ["Steam", "Milk wand"], ["10 kg", "Weight"]]
    }
  };
  C.MACHINES = MACHINES;

  /* Better hero images than the low-res first catalog image (brand pack originals where they exist). */
  var IMG_OVERRIDE = {
    "extra-bar-1kg-beans": "assets/img/brand/pack-extra-bar-1kg-beans.jpg",
    "extra-bar-250g-ground": "assets/img/brand/pack-extra-bar-250g-ground.jpg",
    "copacabana-1-kg-beans": "assets/img/brand/pack-copacabana-1kg-beans.jpg",
    "espresso-decaf-250g-ground-can": "assets/img/brand/pack-decaf-250g-can.jpg",
    "espresso-capsules-150": "assets/img/brand/pack-espresso-capsule-point.jpg",
    "espresso-capsules-20-pack": "assets/img/brand/pack-espresso-capsule-point.jpg",
    "espresso-decaf-capsule-100": "assets/img/brand/pack-decaf-capsule-point.jpg",
    "5-stelle-capsules-150-pack": "assets/img/brand/pack-5-stelle-capsule-point.jpg",
    "special-edition-can": "assets/img/brand/pack-silver-signature-250g-can.jpg",
    "organic-espresso": "assets/img/brand/pack-organic-250g-can.jpg"
  };
  var IMG_BEST = { "espresso-classico-250g-ground": 1, "decaf-pods-180-ct": 1, "oro70-capsules-120-pack": 0, "ca-fox-e-compatible-capsule-machine": 0, "ca-como-e-cp": 1, "double-cap-2-group-capsule-machine": 1, "grinder": 2, "ca-mycaps-v-capsule-machine": 2, "mini-pod-machine": 2, "multi-cap-2-group-capsule-machine": 2, "office-plus-vap-capsule-machine": 3, "pallina-vapor-pod-machine": 1, "pulygrind-grinder-cleaner-crystals": 1, "wega-and-other-commercial-machines": 0, "espresso-plus-vap-capsule-machine": 0, "rocket-appartamento-tca-chrome-black": 0 };
  /* catalog images that show the wrong product (decaf pods on espresso ESE listings): excluded from galleries */
  var IMG_SKIP = { "espresso-ese-pods-44-mm-o-150-pack": [1], "espresso-pods-20-pack": [1], "espresso-ese-pods-44-mm-200-pack": [1], "espresso-plus-vap-capsule-machine": [2, 3] };

  function heroImg(p) {
    if (!p) return "";
    if (IMG_OVERRIDE[p.slug]) return G.img(IMG_OVERRIDE[p.slug]);
    var i = IMG_BEST[p.slug] != null ? IMG_BEST[p.slug] : 0;
    return G.img(p.images[i] || p.images[0] || "");
  }
  function gallery(p) {
    var out = [], seen = {};
    function push(src) { if (src && !seen[src]) { seen[src] = 1; out.push(src); } }
    push(heroImg(p));
    var skip = IMG_SKIP[p.slug] || [];
    p.images.forEach(function (src, i) { if (skip.indexOf(i) < 0) push(G.img(src)); });
    return out;
  }
  C.heroImg = heroImg; C.gallery = gallery;

  /* ======================================================================
     3. Formatting helpers
     ====================================================================== */
  var money = G.fmt.money;
  function moneyRound(n) { return n == null ? "" : (Math.abs(n) >= 100 ? "$" + Math.round(n).toLocaleString("en-US") : money(n)); }
  function moneyWhole(n) { return (n < 0 ? "−" : "") + "$" + Math.round(Math.abs(n)).toLocaleString("en-US"); }
  C.money = money; C.moneyRound = moneyRound; C.moneyWhole = moneyWhole;

  function blendName(id) {
    var b = G.blend(id);
    if (!b) return "";
    return b.name.replace(/ \(.*\)$/, "").replace(/ - .*$/, "");
  }
  C.blendName = blendName;

  function countOf(p) {
    if (!p || !p.size) return null;
    var m = /(\d+)\s*(capsules|pods)/.exec(p.size);
    if (m) return parseInt(m[1], 10);
    var g = /(\d+(?:\.\d+)?)\s*(kg|g)\b/.exec(p.size);
    if (g) return Math.floor((parseFloat(g[1]) * (g[2] === "kg" ? 1000 : 1)) / SHOT_G); // shots per bag at 7 g
    return null;
  }
  /* cost of one coffee (capsule, pod, or 7 g shot from beans/ground) */
  function perCup(p) {
    var n = countOf(p);
    return n && p.price ? p.price / n : null;
  }
  C.countOf = countOf; C.perCup = perCup;

  function isMachine(p) { return p && p.category === "machine"; }
  function machineKind(p) {
    if (p.slug === "grinder") return "Grinder";
    if (p.system === "ese-44") return "Pod machine";
    if (p.system === "traditional") return p.quote ? "Commercial espresso" : "Espresso machine";
    return /2-group/.test(p.slug) ? "2-group capsule" : "Capsule machine";
  }
  function fitsText(p) {
    if (isMachine(p)) {
      if (p.slug === "grinder") return "Whole beans";
      return p.system === "traditional" ? "Beans & ground" : "Takes " + (p.system === "ese-44" ? "44 mm pods" : p.system === "nespresso-original" ? "Espresso 70*" : "36 mm capsules");
    }
    if (p.system && SYS[p.system]) return SYS[p.system].fitsShort;
    if (p.format === "beans") return "Grinder + espresso";
    if (p.format === "ground") return /fine/i.test(p.slug) ? "Espresso machine" : "Moka & espresso";
    if (/drip/.test(p.format || "")) return "Drip brewers";
    return "";
  }
  function formatText(p) {
    if (isMachine(p)) return machineKind(p);
    if (p.format) return G.products.formatLabel(p.format) + (p.size ? ", " + p.size.replace(" capsules", "").replace(" pods", "") : "");
    return G.products.categoryLabel(p.category);
  }
  C.isMachine = isMachine; C.fitsText = fitsText; C.formatText = formatText; C.machineKind = machineKind;

  function intensityHTML(n, opts) {
    opts = opts || {};
    if (!n) return '<span class="faint">n/a</span>';
    var b = G.intensityBucket(n), t = "";
    for (var i = 1; i <= 10; i++) t += '<i class="' + (i <= n ? "on" + (n >= 8 ? " bold" : "") : "") + '"></i>';
    return '<span class="int' + (opts.lg ? " int--lg" : "") + '" role="img" aria-label="Intensity ' + n + ' of 10, ' + b.label + '"><span class="int-ticks" aria-hidden="true">' + t + "</span>" +
      (opts.noNum ? "" : '<span class="int-n" aria-hidden="true">' + n + (opts.bucket ? ' <span class="faint" style="font-weight:400">' + b.label + "</span>" : "") + "</span>") + "</span>";
  }
  C.intensityHTML = intensityHTML;

  function priceHTML(p, opts) {
    opts = opts || {};
    if (p.quote || !p.price) return '<p class="price">Quote <small>Priced to your setup</small></p>';
    var s = '<p class="price">' + money(p.price);
    if (p.compare_at && p.compare_at > p.price) s += "<s>" + money(p.compare_at) + "</s>";
    if (!opts.noUnit) {
      var u = G.products.pricePerUnit(p), pc = perCup(p);
      if (p.category === "single-serve" && pc) s += "<small>" + money(pc) + " a cup</small>";
      else if (u && u.unit === "lb") s += "<small>" + money(u.value) + "/lb · " + money(pc) + " a shot</small>";
      else if (isMachine(p)) s += "<small>" + (p.in_stock ? "Tested before it ships" : "Back soon") + "</small>";
    }
    return s + "</p>";
  }
  C.priceHTML = priceHTML;

  function link(p) { return G.linkTo("product.html", "slug", p.slug); }
  C.link = link;

  /* product card: Format · Fits · Intensity on every card (machines show Milk instead of Intensity) */
  function card(p, opts) {
    opts = opts || {};
    var n = G.intensity(p), m = MACHINES[p.slug];
    var third = isMachine(p)
      ? "<li><span>Milk</span>" + (p.quote ? "Steam wand" : m ? (m.steam ? "Steam wand" : "Espresso only") : "") + "</li>"
      : "<li><span>Intensity</span>" + intensityHTML(n) + "</li>";
    var kicker = isMachine(p) ? (p.brand === "OTHER" ? "Mazzer · Macap · WEGA" : p.brand) : (p.blend ? blendName(p.blend) : G.products.categoryLabel(p.category));
    var badge = "";
    if (p.quote) badge = '<span class="badge badge--ink">For business</span>';
    else if (!p.in_stock) badge = '<span class="badge badge--ink">Sold out</span>';
    else if (p.compare_at && p.compare_at > p.price) badge = '<span class="badge badge--ink">Save ' + moneyRound(p.compare_at - p.price) + "</span>";
    var action;
    if (p.quote) action = '<a class="btn btn--sm btn--ghost" href="business.html#tasting">Request a quote</a>';
    else if (!p.in_stock) action = '<button class="btn btn--sm btn--ghost" type="button" data-notify="' + esc(p.slug) + '">Notify me</button>';
    else action = '<button class="btn btn--sm btn--solid" type="button" data-add="' + esc(p.slug) + '" aria-label="Add ' + esc(p.name) + ' to cart">Add</button>';
    return '<article class="pcard' + (p.in_stock || p.quote ? "" : " is-out") + '" data-slug="' + esc(p.slug) + '">' +
      '<div class="pcard-media plinth">' + badge + '<img src="' + esc(heroImg(p)) + '" alt="' + esc(p.name) + '" width="400" height="400" loading="lazy" decoding="async"></div>' +
      '<div class="pcard-body"><p class="pcard-kicker">' + esc(kicker) + "</p>" +
      '<h3 class="pcard-title"><a href="' + link(p) + '">' + esc(p.name) + "</a></h3>" +
      '<ul class="facts"><li><span>Format</span>' + esc(formatText(p)) + "</li><li><span>Fits</span>" + esc(fitsText(p) || "Any kitchen") + "</li>" + third + "</ul>" +
      '<div class="pcard-foot">' + priceHTML(p) + action + "</div></div></article>";
  }
  C.card = card;

  function miniCard(p, extra) {
    return '<a class="mini-card" href="' + link(p) + '"><div class="plinth"><img src="' + esc(heroImg(p)) + '" alt="" width="200" height="200" loading="lazy" decoding="async"></div>' +
      "<strong>" + esc(p.name) + "</strong><span>" + (extra || (p.price ? money(p.price) : "Quote")) + "</span></a>";
  }
  C.miniCard = miniCard;

  /* ======================================================================
     4. Toast
     ====================================================================== */
  var toastEl;
  function toast(html, ms) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      toastEl.style.cssText = "position:fixed;left:50%;bottom:24px;z-index:120;transform:translateX(-50%);max-width:calc(100vw - 32px);background:#F4EADB;color:#1A120C;border-radius:999px;padding:12px 14px 12px 20px;display:flex;gap:14px;align-items:center;font-size:14px;font-weight:500;box-shadow:0 20px 40px -18px rgba(0,0,0,.7)";
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = html;
    toastEl.hidden = false;
    MO.animate(toastEl, { opacity: [0, 1], y: [16, 0] }, { duration: 0.35, ease: [0.22, 1, 0.36, 1] });
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () {
      Promise.resolve(MO.animate(toastEl, { opacity: [1, 0] }, { duration: 0.25 }).finished).then(function () { toastEl.hidden = true; });
    }, ms || 3600);
  }
  C.toast = toast;

  /* ======================================================================
     5. Drawers (cart, mobile nav, filters) with focus trap + Esc
     ====================================================================== */
  var scrim = $("#scrim");
  var openStack = [];
  function focusables(root) {
    return $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])', root)
      .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
  }
  function openPanel(panel, side, opts) {
    opts = opts || {};
    if (!panel || openStack.some(function (o) { return o.panel === panel; })) return;
    var rec = { panel: panel, side: side, back: document.activeElement, opts: opts };
    openStack.push(rec);
    if (scrim) scrim.hidden = false;
    panel.hidden = false;
    panel.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";
    if (opts.trigger) opts.trigger.setAttribute("aria-expanded", "true");
    MO.drawer(panel, true, side, scrim);
    var f = focusables(panel);
    var target = panel.querySelector("[data-autofocus]") || f[0];
    if (target) setTimeout(function () { target.focus(); }, 30);
  }
  function closePanel(panel) {
    var idx = -1;
    openStack.forEach(function (o, i) { if (o.panel === panel) idx = i; });
    if (idx < 0) return Promise.resolve();
    var rec = openStack.splice(idx, 1)[0];
    if (rec.opts.trigger) rec.opts.trigger.setAttribute("aria-expanded", "false");
    var last = !openStack.length;
    return Promise.resolve(MO.drawer(panel, false, rec.side, last ? scrim : null)).then(function () {
      panel.hidden = !!rec.opts.hideAfter || panel.hasAttribute("data-hide-closed");
      panel.classList.remove("is-open");
      panel.style.transform = "";
      if (last) { if (scrim) scrim.hidden = true; document.documentElement.style.overflow = ""; }
      if (rec.back && rec.back.focus) rec.back.focus();
    });
  }
  C.openPanel = openPanel; C.closePanel = closePanel;
  document.addEventListener("keydown", function (e) {
    var top = openStack[openStack.length - 1];
    if (!top) return;
    if (e.key === "Escape") { e.preventDefault(); closePanel(top.panel); return; }
    if (e.key === "Tab") {
      var f = focusables(top.panel);
      if (!f.length) return;
      var first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      else if (!top.panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });
  if (scrim) scrim.addEventListener("click", function () { var top = openStack[openStack.length - 1]; if (top) closePanel(top.panel); });

  /* ======================================================================
     6. Header: mode switch, nav, account, search
     ====================================================================== */
  var NAV = {
    home: [["Machines", "shop.html#category=machine", "machines"], ["Capsules & Pods", "shop.html#category=single-serve", "capsules"], ["Espresso Blends", "shop.html#category=coffee", "blends"], ["Choose your system", "systems.html", "systems"], ["For Business", "business.html", "business"], ["Story", "story.html", "story"]],
    business: [["Solutions", "business.html#segments", "business"], ["Equipment", "business.html#equipment", "equipment"], ["Coffee program", "business.html#program", "program"], ["Service", "business.html#service", "service"], ["Partner with us", "business.html#partner", "partner"], ["Story", "story.html", "story"]]
  };
  var CTA = { home: ["Build a bundle", "bundle.html"], business: ["Book a tasting", "business.html#tasting"] };
  function currentKey() {
    var h = location.hash || "";
    if (page === "shop") {
      if (/category=machine/.test(h)) return "machines";
      if (/category=single-serve|system=/.test(h)) return "capsules";
      if (/category=coffee/.test(h)) return "blends";
      return "";
    }
    return { systems: "systems", bundle: "systems", business: "business", story: "story" }[page] || "";
  }
  function renderNav() {
    var mode = G.mode();
    var key = currentKey();
    var html = NAV[mode].map(function (n) {
      return '<li><a href="' + n[1] + '"' + (n[2] === key ? ' aria-current="page"' : "") + ">" + n[0] + "</a></li>";
    }).join("");
    $$("[data-nav-list]").forEach(function (ul) { ul.innerHTML = html; });
    $$("[data-nav-mobile]").forEach(function (ul) {
      ul.innerHTML = NAV[mode].map(function (n) { return '<li><a href="' + n[1] + '">' + n[0] + "<span aria-hidden=\"true\">→</span></a></li>"; }).join("") +
        '<li><a href="find.html">Find Guglielmo<span aria-hidden="true">→</span></a></li>';
    });
    $$("[data-cta]").forEach(function (a) { a.textContent = CTA[mode][0]; a.setAttribute("href", CTA[mode][1]); });
    $$("[data-mode-btn]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mode-btn") === mode)); });
    document.documentElement.setAttribute("data-mode", mode);
  }
  $$("[data-mode-btn]").forEach(function (b) {
    b.addEventListener("click", function () {
      var m = b.getAttribute("data-mode-btn");
      if (m === G.mode()) return;
      G.mode(m);
      renderNav();
      var navs = $$("[data-nav-list]");
      if (navs.length && LIVE) MO.animate(navs, { opacity: [0, 1], y: [-6, 0] }, { duration: 0.4, ease: [0.22, 1, 0.36, 1] });
      toast(m === "business"
        ? 'For Business: solutions, equipment and service. <a class="btn btn--sm btn--ink" href="business.html">Open</a>'
        : 'For Home: machines, capsules and blends. <a class="btn btn--sm btn--ink" href="index.html">Open</a>');
    });
  });
  window.addEventListener("hashchange", renderNav);

  /* account popover (demo) */
  var acct = $("#acct-pop"), acctBtn = $("#acct-btn");
  if (acct && acctBtn) {
    acctBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = acct.hidden;
      acct.hidden = !open;
      acctBtn.setAttribute("aria-expanded", String(open));
      if (open) {
        MO.animate(acct, { opacity: [0, 1], y: [-8, 0] }, { duration: 0.3, ease: [0.22, 1, 0.36, 1] });
        var f = acct.querySelector("input"); if (f) f.focus();
      }
    });
    document.addEventListener("click", function (e) { if (!acct.hidden && !acct.contains(e.target)) { acct.hidden = true; acctBtn.setAttribute("aria-expanded", "false"); } });
    acct.addEventListener("keydown", function (e) { if (e.key === "Escape") { acct.hidden = true; acctBtn.setAttribute("aria-expanded", "false"); acctBtn.focus(); } });
    G.forms.demo(acct.querySelector("form"), function () {
      acct.querySelector("form").innerHTML = '<p class="form-ok"><strong>Demo only.</strong> Accounts, order history and subscription controls (skip, pause, swap) arrive with WooCommerce.</p>';
    });
  }

  /* mobile nav */
  var navDrawer = $("#nav-drawer"), menuBtn = $("#menu-btn");
  if (navDrawer && menuBtn) {
    menuBtn.addEventListener("click", function () { openPanel(navDrawer, "left", { trigger: menuBtn }); });
    $$("[data-close-nav]").forEach(function (b) { b.addEventListener("click", function () { closePanel(navDrawer); }); });
    navDrawer.addEventListener("click", function (e) { if (e.target.closest("a")) closePanel(navDrawer); });
  }

  /* search overlay: live catalog search */
  var sOverlay = $("#search"), sInput = $("#search-input"), sResults = $("#search-results"), sCount = $("#search-count");
  var sBack = null;
  function renderSearch() {
    var q = sInput.value.trim();
    var list = q ? G.products.sort(G.products.filter({ q: q }), "featured") : G.products.filter({ category: ["machine", "single-serve"], inStock: true }).slice(0, 8);
    sCount.textContent = q ? G.fmt.plural(list.length, "result") + " for “" + q + "”" : "Popular now: in-stock machines and capsules";
    sResults.innerHTML = list.slice(0, 12).map(function (p) {
      return '<a class="sr-item" href="' + link(p) + '"><div class="plinth"><img src="' + esc(heroImg(p)) + '" alt="" width="64" height="64" loading="lazy" decoding="async"></div><div><strong>' + esc(p.name) + "</strong><span>" +
        esc(formatText(p)) + " · " + (p.quote ? "Quote" : money(p.price)) + (p.in_stock || p.quote ? "" : " · Sold out") + "</span></div></a>";
    }).join("") || '<p class="muted">Nothing matches yet. Try “capsules”, “decaf” or a blend like “Extra Bar”.</p>';
    MO.list($$(".sr-item", sResults));
  }
  function openSearch() {
    if (!sOverlay) return;
    sBack = document.activeElement;
    sOverlay.hidden = false;
    document.documentElement.style.overflow = "hidden";
    openStack.push({ panel: sOverlay, side: "fade", back: sBack, opts: {} });
    MO.animate(sOverlay, { opacity: [0, 1] }, { duration: 0.3 });
    renderSearch();
    setTimeout(function () { sInput.focus(); }, 20);
  }
  function closeSearch() {
    openStack = openStack.filter(function (o) { return o.panel !== sOverlay; });
    Promise.resolve(MO.animate(sOverlay, { opacity: [1, 0] }, { duration: 0.2 }).finished).then(function () {
      sOverlay.hidden = true;
      document.documentElement.style.overflow = "";
      if (sBack) sBack.focus();
    });
  }
  if (sOverlay) {
    $$("[data-open-search]").forEach(function (b) { b.addEventListener("click", openSearch); });
    $$("[data-close-search]").forEach(function (b) { b.addEventListener("click", closeSearch); });
    sInput.addEventListener("input", renderSearch);
    $$("[data-q]", sOverlay).forEach(function (b) { b.addEventListener("click", function () { sInput.value = b.getAttribute("data-q"); renderSearch(); sInput.focus(); }); });
    sOverlay.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); closeSearch(); } });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && !/input|textarea|select/i.test((document.activeElement || {}).tagName || "") && sOverlay.hidden) { e.preventDefault(); openSearch(); }
    });
  }

  /* ======================================================================
     7. Cart drawer
     ====================================================================== */
  var cartDrawer = $("#cart-drawer"), cartBtn = $("#cart-btn");
  function updateCount() {
    var n = G.cart.count();
    $$("[data-cart-count]").forEach(function (el) { el.textContent = n; el.setAttribute("data-zero", String(n === 0)); });
    if (cartBtn) cartBtn.setAttribute("aria-label", "Cart, " + G.fmt.plural(n, "item"));
  }
  function shipMeter(s) {
    var pct = Math.min(100, (s.subtotal / G.pricing.FREE_SHIP_THRESHOLD) * 100);
    return '<div class="ship-meter"><p>' + (s.toFreeShipping > 0 ? "You’re <strong>" + money(s.toFreeShipping) + "</strong> away from free shipping." : "<strong>Free shipping unlocked.</strong> Delivery in 3 business days across New England.") +
      '</p><div class="meter" role="progressbar" aria-label="Progress to free shipping" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct) + '"><i style="--p:' + pct.toFixed(1) + '%"></i></div></div>';
  }
  C.shipMeter = shipMeter;
  function lineHTML(l, opts) {
    var p = l.product;
    var meta = [formatText(p)];
    var sub = l.subscribe ? '<span class="badge badge--sub">Every ' + l.subscribe + " weeks · −10%</span>" : "";
    var tier = G.pricing.caseDiscountRate(p, l.qty);
    if (tier && !l.subscribe) meta.push("Case discount −" + Math.round(tier * 100) + "%");
    return '<div class="line-item"><div class="plinth"><img src="' + esc(heroImg(p)) + '" alt="" width="72" height="72" loading="lazy" decoding="async"></div>' +
      '<div><h3><a href="' + link(p) + '">' + esc(p.name) + '</a></h3><p class="li-meta">' + esc(meta.join(" · ")) + "</p>" + (sub ? "<p style=\"margin:0 0 .5rem\">" + sub + "</p>" : "") +
      (opts && opts.readonly ? '<p class="li-meta">Qty ' + l.qty + "</p>" :
        '<div class="qty" role="group" aria-label="Quantity for ' + esc(p.name) + '"><button type="button" data-qty="-1" data-slug="' + esc(p.slug) + '" data-sub="' + l.subscribe + '" aria-label="Decrease quantity">−</button><output aria-live="polite">' + l.qty + '</output><button type="button" data-qty="1" data-slug="' + esc(p.slug) + '" data-sub="' + l.subscribe + '" aria-label="Increase quantity">+</button></div>' +
        '<button type="button" class="li-remove" data-remove="' + esc(p.slug) + '" data-sub="' + l.subscribe + '">Remove</button>') +
      '</div><div class="li-price">' + money(l.total) + (l.saved > 0 ? "<s>" + money(l.full) + "</s>" : "") + "</div></div>";
  }
  C.lineHTML = lineHTML;
  function renderCart() {
    updateCount();
    if (!cartDrawer) return;
    var s = G.cart.summary();
    var body = $(".drawer-body", cartDrawer), foot = $(".drawer-foot", cartDrawer);
    $("#cart-title-count", cartDrawer).textContent = s.count ? "(" + s.count + ")" : "";
    if (!s.lines.length) {
      body.innerHTML = '<div class="empty-cart"><p class="h-xl">Your cup is empty.</p><p>Start with the machine, the capsules, or both.</p><p style="display:grid;gap:10px;margin-top:1.5rem"><a class="btn btn--crema" href="bundle.html">Build a bundle</a><a class="btn btn--ghost" href="systems.html">Choose your system</a></p></div>';
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    body.innerHTML = shipMeter(s) + s.lines.map(function (l) { return lineHTML(l); }).join("");
    foot.innerHTML = (s.saved > 0 ? '<div class="sum-row save"><span>You save</span><span>−' + money(s.saved) + "</span></div>" : "") +
      '<div class="sum-row"><span>Subtotal</span><span>' + money(s.subtotal) + "</span></div>" +
      '<div class="sum-row"><span>Shipping</span><span>' + (s.shipping ? money(s.shipping) : "Free") + "</span></div>" +
      '<div class="sum-row total"><span>Total</span><span>' + money(s.total) + "</span></div>" +
      '<a class="btn btn--crema btn--block btn--lg" href="checkout.html" style="margin-top:14px">Checkout</a>' +
      '<p class="note" style="margin:.75rem 0 0;text-align:center">Apple Pay · Google Pay · PayPal · Shop Pay at checkout</p>';
  }
  C.renderCart = renderCart;
  if (cartDrawer) {
    cartDrawer.addEventListener("click", function (e) {
      var q = e.target.closest("[data-qty]"), r = e.target.closest("[data-remove]");
      if (q) {
        var slug = q.getAttribute("data-slug"), sub = +q.getAttribute("data-sub");
        var item = G.cart.items().filter(function (i) { return i.slug === slug && (i.subscribe || 0) === sub; })[0];
        if (item) G.cart.setQty(slug, Math.max(0, item.qty + +q.getAttribute("data-qty")), sub);
        var again = cartDrawer.querySelector('[data-qty="' + q.getAttribute("data-qty") + '"][data-slug="' + slug + '"][data-sub="' + sub + '"]');
        if (again) again.focus(); else { var c = cartDrawer.querySelector(".btn, button"); if (c) c.focus(); }
      }
      if (r) { G.cart.remove(r.getAttribute("data-remove"), +r.getAttribute("data-sub")); var b = cartDrawer.querySelector("[data-close-cart]"); if (b) b.focus(); }
    });
    $$("[data-close-cart]").forEach(function (b) { b.addEventListener("click", function () { closePanel(cartDrawer); }); });
  }
  function openCart() { renderCart(); openPanel(cartDrawer, "right", { trigger: cartBtn }); }
  C.openCart = openCart;
  if (cartBtn) cartBtn.addEventListener("click", openCart);
  G.cart.onChange(function () { renderCart(); });

  /* add to cart (delegated): flies the packshot into the cart icon */
  function addToCart(slug, qty, sub, fromEl, opts) {
    opts = opts || {};
    var p = G.products.bySlug(slug);
    if (!p) return;
    if (!G.cart.add(slug, qty || 1, { subscribe: sub || 0 })) return;
    var img = fromEl && (fromEl.closest(".pcard, .mini-card, .pack, [data-fly-root]") || document).querySelector("img");
    var origin = img || fromEl;
    var target = cartBtn && cartBtn.offsetParent ? cartBtn : (cartBtn || null);
    Promise.resolve(MO.flyToCart(origin, target, heroImg(p))).then(function () {
      if (opts.open) openCart();
      else toast("Added " + esc(p.name) + (sub ? " · every " + sub + " weeks" : "") + '. <button class="btn btn--sm btn--ink" type="button" data-toast-cart>View cart</button>');
    });
  }
  C.addToCart = addToCart;
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-add]");
    if (a) { e.preventDefault(); addToCart(a.getAttribute("data-add"), +(a.getAttribute("data-qty") || 1), +(a.getAttribute("data-sub") || 0), a); return; }
    var n = e.target.closest("[data-notify]");
    if (n) {
      var p = G.products.bySlug(n.getAttribute("data-notify"));
      toast("We’ll email you when " + esc(p ? p.name : "it") + ' is back. <a class="btn btn--sm btn--ink" href="' + (p ? link(p) : "#") + '">Details</a>');
      return;
    }
    if (e.target.closest("[data-toast-cart]")) { openCart(); }
  });

  /* ======================================================================
     8. Footer newsletter + misc
     ====================================================================== */
  $$("[data-newsletter]").forEach(function (f) {
    G.forms.demo(f, function (d) {
      f.outerHTML = '<p class="form-ok" role="status"><strong>You’re on the list.</strong> First-order code on its way to ' + esc(d.email || "your inbox") + " (demo: nothing was sent).</p>";
    });
  });
  var yr = $("#year"); if (yr) yr.textContent = "2026";

  /* scroll-scrubbed scene helper used by home + machine PDP:
     stage scales gently and the active callout/step follows scroll progress. Content stays visible at rest. */
  function scene(root, opts) {
    opts = opts || {};
    if (!root) return;
    var stage = $(".scene-img", root) || $(".m-stage", root);
    var steps = $$(".scene-step", root);
    var calls = $$(".callout", root);
    var glowEl = $(".scene-stage", root);
    var n = Math.max(steps.length, calls.length, 1);
    var last = -1;
    function setActive(i) {
      if (i === last) return;
      last = i;
      steps.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
      calls.forEach(function (c, k) { c.classList.toggle("is-active", k === (opts.callMap ? opts.callMap[i] : i - (opts.offset || 0))); });
      var c = calls[opts.callMap ? opts.callMap[i] : i - (opts.offset || 0)];
      if (c && LIVE) MO.animate(c.querySelector(".tag"), { scale: [0.92, 1], opacity: [0.6, 1] }, { type: "spring", stiffness: 380, damping: 24 });
    }
    setActive(0);
    if (!LIVE) { calls.forEach(function (c) { c.classList.remove("is-active"); }); return; }
    var narrow = window.matchMedia("(max-width: 900px)");
    MO.scrub(root, function (p) {
      if (stage && !narrow.matches) {
        var sc = 0.9 + Math.min(1, p * 1.6) * 0.12;
        stage.style.transform = "scale(" + sc.toFixed(4) + ")";
      }
      if (glowEl) glowEl.style.setProperty("--glow", Math.min(1, p * 2).toFixed(3));
      if (steps.length) {
        var mid = window.innerHeight * 0.55, idx = 0;
        steps.forEach(function (s, k) { if (s.getBoundingClientRect().top < mid) idx = k; });
        setActive(idx);
      } else {
        setActive(Math.min(n - 1, Math.floor(p * 1.25 * n)));
      }
    }, ["start end", "end start"]);
  }
  C.scene = scene;

  /* ======================================================================
     9. Boot: render chrome, run the page, then hand off to the motion layer
     ====================================================================== */
  renderNav();
  renderCart();
  if (!LIVE) document.documentElement.classList.add("m-static");
  var run = (window.CREMA_PAGES || {})[page];
  if (run) { try { run(C); } catch (err) { if (window.console) console.error(err); } }

  G.motion && G.motion.init && G.motion.init({ ease: [0.16, 1, 0.3, 1], duration: 0.85, distance: 34 });
})();
