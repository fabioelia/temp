/* Home: shop-by-machine tiles, featured blends, Tasting Room teaser, Il Giornale row. */
(window.CAL_PAGES = window.CAL_PAGES || {}).home = function (C) {
  var G = window.GUSA, $ = G.$, $$ = G.$$, esc = G.esc;

  /* Shop by your machine (first-class way into the catalog) */
  var SYS = [
    { id: "espresso-point-36", n: "A", title: "36 mm capsules", fits: "Espresso Point®-type machines: Espresso del Capitano, RDL, Panafe", img: "assets/img/brand/pack-espresso-capsule-point.jpg" },
    { id: "nespresso-original", n: "B", title: "Espresso 70 capsules", fits: "Nespresso® Original-line machines. Not affiliated with Nespresso.", img: "assets/img/brand/usa-pack-oro70-capsules-10.jpg" },
    { id: "ese-44", n: "C", title: "E.S.E. 44 mm pods", fits: "Any E.S.E. pod machine: Grimac, RDL, Sweet Coffee", img: "assets/img/products/espresso-ese-pods-44-mm-o-150-pack__0.jpg" },
    { id: "traditional", n: "D", title: "Beans & ground", fits: "Espresso machines, grinders and the moka pot", img: "assets/img/brand/pack-5-stelle-250g-ground-moka.jpg" },
    { id: "drip", n: "E", title: "Drip & batch brew", fits: "Drip brewers, batch brewers and pour-over", img: "assets/img/brand/usa-pack-premium-blend-drip-label.jpg" }
  ];
  var all = G.products.all();
  var box = $("[data-machines]");
  if (box) box.innerHTML = SYS.map(function (s) {
    var n = all.filter(function (p) { return C.fitsOf(p).indexOf(s.id) >= 0 && p.in_stock; }).length;
    return '<a class="mtile" href="shop.html#fits=' + s.id + '"><span class="mtile__img"><img src="' + C.src(s.img) + '" alt="" loading="lazy" decoding="async" width="300" height="300"></span>' +
      '<span class="mtile__n">' + s.n + " · " + n + " in stock</span><span class=\"mtile__title\">" + esc(s.title) + '</span><span class="mtile__fits">' + esc(s.fits) + '</span><span class="mtile__go">Shop what fits →</span></a>';
  }).join("");

  /* Featured blends */
  var picks = ["extra-bar-1kg-beans", "espresso-classico-250g-ground", "club-99-250g-ground", "copacabana-1-kg-beans", "oro70-capsules-120-pack", "espresso-capsules-150"];
  var grid = $("[data-home-products]");
  if (grid) grid.innerHTML = picks.map(G.products.bySlug).filter(Boolean).map(function (p) { return C.card(p); }).join("");

  /* Tasting Room teaser: Extra Bar against Espresso Bar */
  var t = $("[data-teaser]");
  if (t) {
    var a = C.sensory("extra-bar"), b = C.sensory("espresso-bar");
    t.innerHTML = C.sensorySVG(a, b) +
      '<div class="teaser__rows"><div class="legend"><span><i></i>Extra Bar</span><span><i class="b"></i>Espresso Bar</span></div>' +
      '<div class="teaser__row"><span class="label">Extra Bar</span>' + C.gauge(9) + '<p class="small muted mt-1 mb-0">Dense crema, bold and cocoa-dark. Stands up to milk.</p></div>' +
      '<div class="teaser__row"><span class="label">Espresso Bar</span>' + C.gauge(6) + '<p class="small muted mt-1 mb-0">Silky and balanced, sweeter, with a gentle finish.</p></div>' +
      '<a class="link" href="tasting.html#compare">Compare any two <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg></a></div>';
    var s = $("[data-sensory]", t); s.__a = a; s.__b = b;
  }

  /* Il Giornale row */
  var j = $("[data-home-journal]");
  if (j) j.innerHTML = [C.JOURNAL[0], C.JOURNAL[2], C.JOURNAL[4]].map(function (a, i) { return C.storyCard(a, { clip: i === 0 }); }).join("");

  /* Venue count from the live store-locator data */
  var v = (G.locations().venues || []), line = $("[data-venue-line]");
  if (line && v.length) {
    var ne = v.filter(function (x) { return x.neighborhood === "North End" && x.zip !== "02128"; }).length;
    var states = {}; v.forEach(function (x) { states[x.state] = 1; });
    var names = { MA: "Massachusetts", ME: "Maine", NH: "New Hampshire", RI: "Rhode Island", CT: "Connecticut", VT: "Vermont" };
    var st = Object.keys(states).map(function (k) { return names[k] || k; });
    line.innerHTML = "Today Guglielmo is poured at <b>" + v.length + "</b> cafés, pastry shops, restaurants and markets in " + st.join(" and ") + ", " + (ne >= 20 ? "two dozen" : ne) + " of them in the North End alone.";
  }
};
