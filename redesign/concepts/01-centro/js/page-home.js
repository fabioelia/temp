/* Concept 01 "Centro" — Home page module (registered before site.js runs it). */
(window.CENTRO_PAGES = window.CENTRO_PAGES || {}).home = function (C) {
  "use strict";
  var G = C.G, $ = G.$, $$ = G.$$, esc = G.esc, money = G.fmt.money, MO = G.motion;

  /* ---------- 1. Hero: target + packshots + stickers ---------- */
  var tgtHost = $("[data-hero-target]");
  tgtHost.innerHTML = C.target({ text: "IL CAFFÈ CHE FA CENTRO · THE COFFEE THAT HITS THE MARK · ", cls: "hero-target" });
  $("[data-sticker-rings]").innerHTML = C.rings(9, { size: 46, decorative: true });
  if (C.live) {
    var svg = $("svg", tgtHost);
    C.targetIn(svg, 0.1);
    var packs = $$(".hero-pack img");
    packs.forEach(function (img, i) {
      MO.animate(img, { y: [-70, 0], opacity: [0, 1], scale: [0.9, 1] }, { type: "spring", stiffness: 260, damping: 17, delay: 0.45 + [0.12, 0, 0.22][i] });
    });
    MO.animate($$("[data-hero-sticker]"), { scale: [0.4, 1], opacity: [0, 1] }, { type: "spring", stiffness: 420, damping: 18, delay: MO.stagger(0.12, { startDelay: 0.95 }) });
    // the text ring turns with the page as you scroll (poster wheel)
    var ring = $(".t-txt", svg);
    MO.scrub($("[data-hero-stage]"), function (p) { ring.style.transform = "rotate(" + (p * 140) + "deg)"; }, ["start start", "end start"]);
  }

  /* ---------- 2. Marquee of blend names ---------- */
  var mq = $("[data-blend-marquee]");
  var items = C.blends().filter(function (b) { return b.line !== "drip"; }).map(function (b) {
    var t = C.blendTheme(b.id);
    return '<span class="marquee__item"><i style="--c:' + t.bg + ";--c2:" + t.disc + '"></i>' + esc(C.blendName(b.id)) + "</span>";
  }).join("");
  mq.innerHTML = '<span class="sr-only">Our blends: ' + C.blends().filter(function (b) { return b.line !== "drip"; }).map(function (b) { return C.blendName(b.id); }).join(", ") + '</span><div class="marquee__track" data-m-marquee="46" aria-hidden="true"><div class="marquee__group">' + items + '</div><div class="marquee__group">' + items + "</div></div>";

  /* ---------- 3. Shop by your machine ---------- */
  var ART = {
    "espresso-point-36": '<ellipse cx="60" cy="92" rx="21" ry="6" fill="#B8121A"/><path d="M30 42 38 90q22 10 44 0l8-48z" fill="#ED1C24"/><path d="M36 52h48" stroke="#fff" stroke-opacity=".35" stroke-width="3"/><ellipse cx="60" cy="42" rx="30" ry="8.5" fill="#E9E4DA" stroke="#1A1718" stroke-width="2"/><circle cx="60" cy="42" r="4" fill="#ED1C24"/>',
    "nespresso-original": '<path d="M40 40h40l-5 34q-5 18-15 18t-15-18z" fill="#1A1718"/><path d="M45 52h30" stroke="#F5821F" stroke-width="3"/><path d="M47 62h26" stroke="#F5821F" stroke-width="3" stroke-opacity=".7"/><ellipse cx="60" cy="40" rx="27" ry="6.5" fill="#CCBA6C" stroke="#1A1718" stroke-width="2"/>',
    "ese-44": '<circle cx="60" cy="62" r="40" fill="#EADCC3" stroke="#B9A27E" stroke-width="5" stroke-dasharray="2.2 3"/><circle cx="60" cy="62" r="27" fill="#6B4226"/><circle cx="60" cy="62" r="19" fill="none" stroke="#8A5A36" stroke-width="2"/><circle cx="60" cy="62" r="11" fill="none" stroke="#8A5A36" stroke-width="2"/>',
    "espresso": '<rect x="70" y="56" width="40" height="11" rx="5.5" fill="#1A1718"/><path d="M26 50h52v10q0 20-26 20T26 60z" fill="#9C9690"/><path d="M26 50h52" stroke="#1A1718" stroke-width="4"/><ellipse cx="52" cy="50" rx="22" ry="4.5" fill="#5A3A22"/><g fill="#5A3A22"><ellipse cx="36" cy="96" rx="8" ry="11" transform="rotate(-25 36 96)"/><ellipse cx="56" cy="99" rx="8" ry="11" transform="rotate(15 56 99)"/></g><g stroke="#E9DCC5" stroke-width="2" fill="none"><path d="M33 88q5 8 6 16" transform="rotate(-25 36 96)"/><path d="M55 91q-3 8 2 16" transform="rotate(15 56 99)"/></g>',
    "moka": '<path d="M42 18h36l-3 8H45z" fill="#1A1718"/><path d="M40 26h40l-6 34H46z" fill="#B9B4AE"/><path d="M74 30l14-6-4 12" fill="#B9B4AE"/><path d="M80 32q22 6 14 26-3 6-14 6" fill="none" stroke="#1A1718" stroke-width="6" stroke-linecap="round"/><rect x="44" y="58" width="32" height="6" fill="#1A1718"/><path d="M46 64h28l8 40H38z" fill="#CFCAC4"/><path d="M50 72l-4 26M60 72v28M70 72l4 26" stroke="#B0AAA3" stroke-width="2"/><circle cx="60" cy="16" r="4" fill="#1A1718"/>',
    "drip": '<path d="M36 20h48l-12 26H48z" fill="#F5821F"/><rect x="44" y="46" width="32" height="5" fill="#1A1718"/><path d="M40 54h40l4 46q0 6-6 6H42q-6 0-6-6z" fill="#E7F0F5" stroke="#1A1718" stroke-width="3"/><path d="M40 74h42l2 26q0 6-6 6H42q-6 0-6-6z" fill="#5A3A22"/><path d="M80 62q14 0 14 14t-12 14" fill="none" stroke="#1A1718" stroke-width="5"/>'
  };
  var PLATE = { "espresso-point-36": "#FFE9D6", "nespresso-original": "#FFF8B8", "ese-44": "#FDE2E3", "espresso": "#F4F1EA", "moka": "#E3EEF4", "drip": "#FFF8B8" };
  var DESC = {
    "espresso-point-36": "Guglielmo’s own capsule. Fits Espresso Point®-type machines from Espresso del Capitano, RDL and Panafe.",
    "nespresso-original": "ORO70, ROSSO70 and DEK70 capsules for Nespresso® Original-line machines.*",
    "ese-44": "Paper pods, 44 mm. Fits any E.S.E. machine: Grimac, RDL and more.",
    "espresso": "Whole beans and fine ground for portafilter machines and grinders.",
    "moka": "Ground for the stovetop pot, the way Calabria makes coffee at home.",
    "drip": "Premium, French Roast and Decaf Colombia for batch and drip brewers."
  };
  var sys = $("[data-systems]");
  sys.innerHTML = C.FITS_ORDER.map(function (k) {
    var n = G.products.all().filter(function (p) { return (p.category === "coffee" || p.category === "single-serve") && C.fits(p).indexOf(k) >= 0 && C.available(p); }).length;
    var m = G.products.all().filter(function (p) { return p.category === "machine" && C.fits(p).indexOf(k) >= 0; }).length;
    return '<a class="sys" href="shop.html#fits=' + k + '" style="--plate:' + PLATE[k] + '"><span class="sys__art"><svg viewBox="0 0 120 120" aria-hidden="true">' + ART[k] + "</svg></span>" +
      '<span class="sys__t">' + esc(C.FITS[k].tab) + '</span><span class="sys__d">' + esc(DESC[k]) + '</span><span class="sys__n">' + n + " coffees" + (m && k !== "espresso" ? " · " + m + " machines" : "") + " " + C.icon("arrow") + "</span></a>";
  }).join("");

  /* ---------- 4. Blend explorer ---------- */
  var LINES = [{ id: "", label: "All" }, { id: "espresso", label: "Espresso blends" }, { id: "capsule", label: "Capsule lines" }, { id: "drip", label: "Drip" }];
  var lineSel = "", sel = "espresso-classico";
  var linesEl = $("[data-ex-lines]"), listEl = $("[data-ex-list]"), stage = $("[data-ex-stage]");
  function renderLines() {
    linesEl.innerHTML = LINES.map(function (l) { return '<button class="chip" type="button" aria-pressed="' + (lineSel === l.id) + '" data-line="' + l.id + '">' + l.label + "</button>"; }).join("");
  }
  function renderList() {
    listEl.innerHTML = C.blends(lineSel).map(function (b) {
      var t = C.blendTheme(b.id);
      return '<li><button class="swatch" type="button" aria-pressed="' + (b.id === sel) + '" data-blend="' + b.id + '" style="--c:' + t.bg + ";--cfg:" + t.fg + ";--c2:" + t.disc + '">' +
        '<span class="swatch__disc"><span>' + b.intensity + '</span></span><span class="swatch__name">' + esc(C.blendName(b.id)) + "</span></button></li>";
    }).join("");
  }
  function exCard(id) {
    var b = G.blend(id), t = C.blendTheme(id), cut = C.cut(id), label = C.labelImg(id);
    var dark = t.fg === "#FFFFFF";
    var ringVars = dark ? "--ring-a:#FFF200;--ring-b:#F5821F;--ring-line:rgba(255,255,255,.45);--ring-gap:" + t.bg : "--ring-a:#1A1718;--ring-b:#ED1C24;--ring-line:rgba(26,23,24,.35);--ring-gap:" + t.bg;
    var fam = G.products.family(id);
    var formats = fam.slice(0, 6).map(function (p) {
      return '<a class="fmt" href="' + C.productUrl(p) + '"><span>' + esc(C.formatLabel(p)) + "</span><b>" + (p.in_stock ? money(p.price) : "Sold out") + "</b></a>";
    }).join("");
    var best = C.bestOfBlend(id);
    var art = cut ? '<img src="' + cut + '" alt="' + esc(C.blendName(id)) + ' pack" loading="lazy" decoding="async">' : (label ? '<img class="is-label" src="' + label + '" alt="' + esc(C.blendName(id)) + ' label" loading="lazy" decoding="async">' : "");
    return '<article class="ex-card field" style="--blend:' + t.bg + ";--blend-fg:" + t.fg + ";--disc:" + t.disc + ";" + ringVars + '">' +
      '<div class="ex-card__art"><span class="ex-card__rings" aria-hidden="true"></span>' + art + "</div>" +
      '<div class="ex-card__info"><p class="ex-card__kicker">' + esc(C.lineLabel(b.line)) + " · " + esc(C.clean(b.roast)) + " roast</p>" +
      '<h3 class="poster ex-card__name">' + esc(C.blendName(id)) + "</h3>" +
      C.meter(b.intensity, { lg: true, anim: true, size: 84 }) +
      '<p class="ex-card__desc">' + esc(b.description) + "</p>" +
      '<dl class="ex-facts"><div><dt>Composition</dt><dd>' + esc(C.compShort(id)) + "</dd></div><div><dt>Tasting notes</dt><dd>" + esc(C.notes(b).slice(0, 3).join(" · ")) + "</dd></div><div><dt>Best for</dt><dd>" + esc((b.best_for || []).slice(0, 3).map(C.clean).join(", ")) + "</dd></div></dl>" +
      (formats ? '<div class="ex-formats">' + formats + "</div>" : "") +
      (best ? '<a class="btn btn--target ex-card__cta" href="' + C.productUrl(best) + '">Shop ' + esc(C.blendName(id)) + "</a>" : "") +
      "</div></article>";
  }
  function renderStage(first) {
    var go = function () {
      stage.innerHTML = exCard(sel);
      C.enhance(stage);
      if (C.live && !first) {
        var img = $(".ex-card__art img", stage);
        if (img) MO.animate(img, { scale: [0.8, 1], rotate: [-6, 0], opacity: [0, 1] }, { type: "spring", stiffness: 300, damping: 18 });
        MO.animate($(".ex-card__rings", stage), { rotate: [-60, 0], scale: [0.85, 1] }, { duration: 0.6, ease: MO.tokens.ease });
      }
    };
    if (first) go(); else MO.swap(stage, go, 1);
  }
  renderLines(); renderList(); renderStage(true);
  linesEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-line]"); if (!b) return;
    lineSel = b.getAttribute("data-line");
    renderLines();
    var ids = C.blends(lineSel).map(function (x) { return x.id; });
    if (ids.indexOf(sel) < 0) { sel = ids[0]; renderStage(); }
    renderList();
    MO.list($$(".swatch", listEl));
    C.enhance(linesEl); C.enhance(listEl);
  });
  listEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-blend]"); if (!b || b.getAttribute("data-blend") === sel) return;
    sel = b.getAttribute("data-blend");
    $$(".swatch", listEl).forEach(function (s) { s.setAttribute("aria-pressed", String(s === b)); });
    MO.bump($(".swatch__disc", b));
    renderStage();
  });

  /* ---------- 5. Intensity guide ---------- */
  $("[data-scale]").innerHTML = '<div class="scale__row">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) {
    return '<div class="scale__cell" data-b="' + C.bucket(n).id + '">' + C.rings(n, { size: 64, decorative: true }) + "<span>" + n + "</span></div>";
  }).join("") + '</div><div class="scale__brackets"><span data-b="mild">Mild 1–4</span><span data-b="balanced">Balanced 5–7</span><span data-b="bold">Bold 8–10</span></div>';
  var BUCKETS = [
    { id: "mild", label: "Mild", range: "1–4", top: 4, text: "Soft, round and low in bitterness: the gentle end of the scale.", note: "Calabria doesn’t really do mild. Our gentlest coffees score 5, so start with the lightest Balanced blends." },
    { id: "balanced", label: "Balanced", range: "5–7", top: 7, text: "Sweetness and strength in step. Easy as a straight shot, lovely with milk." },
    { id: "bold", label: "Bold", range: "8–10", top: 10, text: "Full body, dense crema, a dark-cocoa finish. Built to cut through steamed milk." }
  ];
  $("[data-buckets]").innerHTML = BUCKETS.map(function (bk) {
    var list = C.blends().filter(function (b) { return C.bucket(b.intensity).id === bk.id; }).sort(function (a, b) { return a.intensity - b.intensity; });
    if (bk.id === "mild") list = C.blends().filter(function (b) { return b.intensity === 5 && b.line !== "drip"; });
    var chips = list.map(function (b) {
      var p = C.bestOfBlend(b.id);
      return '<a class="chip" href="' + (p ? C.productUrl(p) : "shop.html") + '"><span class="dot" style="--c:' + C.blendTheme(b.id).bg + '"></span>' + esc(C.blendName(b.id)) + " <b>" + b.intensity + "</b></a>";
    }).join("");
    return '<article class="bucket bucket--' + bk.id + '" data-m="rise">' + C.rings(bk.top, { size: 132, anim: true, cls: "bucket__rings", decorative: true }) +
      '<h3 class="poster bucket__t">' + bk.label + " <span>" + bk.range + "</span></h3><p>" + bk.text + "</p>" +
      (bk.note ? '<p class="bucket__note">' + bk.note + "</p>" : "") +
      '<p class="bucket__k">' + (bk.id === "mild" ? "Closest to mild" : list.length + " blends") + '</p><div class="chips">' + chips + "</div>" +
      '<a class="arrow-link" href="shop.html#intensity=' + (bk.id === "mild" ? "balanced" : bk.id) + '">Shop ' + (bk.id === "mild" ? "the gentlest" : bk.label.toLowerCase()) + " " + C.icon("arrow") + "</a></article>";
  }).join("");

  /* ---------- 6. Quiz band ---------- */
  var qt = $("[data-quiz-target]");
  qt.innerHTML = C.target({ text: "HIT YOUR MARK · FIVE QUESTIONS · ONE BULLSEYE · " , cls: "quiz-target" });
  if (C.live) {
    var fired = false;
    MO.lib.inView(qt, function () {
      if (fired) return; fired = true;
      C.targetIn($("svg", qt), 0);
      setTimeout(function () { MO.bullseye($(".t-r", qt), ["#FFFFFF", "#FFF200", "#F5821F"]); }, 650);
    }, { amount: 0.5 });
  }
  var last = G.store.get("centro-quiz-last", null);
  if (last && last.blend) {
    var lm = $("[data-last-match]");
    lm.hidden = false;
    lm.innerHTML = 'Your last match: <a class="link" href="' + C.productUrl(last.slug) + '">' + esc(C.blendName(last.blend)) + "</a>";
  }

  /* ---------- 7. Bestsellers ---------- */
  var BEST = ["5-stelle-1kg-beans", "espresso-classico-250g-ground", "extra-bar-1kg-beans", "espresso-capsules-150", "rosso70-capsules-120-pack", "espresso-ese-pods-44-mm-o-150-pack", "club-99-250g-ground", "oro70-capsules-120-pack"];
  $("[data-best]").innerHTML = BEST.map(function (s) { return G.products.bySlug(s); }).filter(Boolean).map(function (p) { return C.card(p); }).join("");
  $("[data-best]").setAttribute("data-m-stagger", "0.05");

  /* ---------- 11. Find us ---------- */
  var L = G.locations(), venues = L.venues || [];
  var nTypes = {}; venues.forEach(function (v) { nTypes[v.type] = (nTypes[v.type] || 0) + 1; });
  $("[data-venue-count]").textContent = "Poured at " + venues.length + " cafés, pastry shops & restaurants.";
  var states = C.uniq(venues.map(function (v) { return v.state; }));
  $("[data-venue-lead]").textContent = (nTypes.restaurant || 0) + " restaurants, " + (nTypes.pastry || 0) + " pastry shops, " + (nTypes.cafe || 0) + " cafés and " + (nTypes.market || 0) + " markets across " + (states.length > 1 ? "Massachusetts and Maine" : "New England") + ". " + venues.filter(function (v) { return v.neighborhood === "North End"; }).length + " of them in Boston’s North End.";
  $("[data-venue-chips]").innerHTML = venues.filter(function (v) { return v.neighborhood === "North End"; }).slice(0, 8).map(function (v) {
    return '<a class="chip" href="find.html#q=' + encodeURIComponent(v.zip) + '"><span class="dot" style="--c:var(--red)"></span>' + esc(v.name) + "</a>";
  }).join("") + '<a class="chip" href="find.html">All ' + venues.length + " venues " + C.icon("arrow") + "</a>";
  var mapHost = $("[data-home-map]");
  var mapKey = G.map.data("region") ? "region" : "boston";
  mapHost.innerHTML = G.map.svg(mapKey, { water: "#CFE3EE", land: "#FFFFFF", district: "#FFFFFF", stroke: "#C9C1B4", strokeWidth: 1, className: "gusa-map home-map" });
  var svgMap = $("svg", mapHost);
  if (svgMap) {
    var pins = venues.map(function (v) {
      var pt = G.map.project(mapKey, v.lat, v.lng);
      if (!pt || !pt.inside) return "";
      return '<g class="pin" transform="translate(' + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ')"><circle r="7" fill="#F5821F"/><circle r="4.6" fill="#FFF200"/><circle r="2.3" fill="#ED1C24"/></g>';
    }).join("");
    svgMap.insertAdjacentHTML("beforeend", '<g class="pins">' + pins + "</g>");
    if (C.live) {
      var once = false;
      MO.lib.inView(mapHost, function () {
        if (once) return; once = true;
        MO.animate($$(".pin circle", svgMap), { scale: [0, 1] }, { type: "spring", stiffness: 500, damping: 16, delay: MO.stagger(0.004) });
      }, { amount: 0.4 });
    }
  }
  var hf = $("#home-find");
  hf.addEventListener("submit", function (e) { e.preventDefault(); var q = $("#home-find-q").value.trim(); location.href = "find.html" + (q ? "#q=" + encodeURIComponent(q) : ""); });
};
