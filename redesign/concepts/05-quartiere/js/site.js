/*!
 * Guglielmo USA — Concept 05 "Quartiere" — site.js
 * Shared chrome (header, footer, drawers, search, cart), product cards, generated majolica tiles,
 * illustrated shopfronts / postmarks / recipe art, the neighborhood map, then the page module
 * (registered by js/page-*.js in window.Q_PAGES) and finally GUSA.motion.init with the
 * "friendly bounce" tuning.
 */
(function () {
  "use strict";

  var G = window.GUSA;
  var M = window.Motion || null;
  var MO = G.motion || { live: false, animate: function () { return { finished: Promise.resolve(), stop: function () {} }; } };
  var live = function () { return !!(G.motion && G.motion.live); };
  var $ = G.$, $$ = G.$$, esc = G.esc, money = G.fmt.money;
  var PAGE = document.body.getAttribute("data-page") || "";
  var uid = 0;
  function nid(p) { uid += 1; return (p || "q") + uid; }

  /* ------------------------------------------------------------------
     Icons (inline sprite)
     ------------------------------------------------------------------ */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20.5c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    bag: '<path d="M5 8h14l-1.1 11.9a1.6 1.6 0 0 1-1.6 1.4H7.7a1.6 1.6 0 0 1-1.6-1.4L5 8z"/><path d="M9 10V6.6a3 3 0 0 1 6 0V10"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h11"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    pin: '<path d="M12 21s-6.5-6.1-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.9 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>',
    phone: '<path d="M6.6 3.5h2.6l1.4 4.2-2 1.3a11 11 0 0 0 6.4 6.4l1.3-2 4.2 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    truck: '<path d="M3 6.5h11v9H3zM14 9.5h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
    wrench: '<path d="M14.5 5.5a4 4 0 0 0-5 5L4 16l4 4 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-2.5-.5-.5-2.5z"/>',
    cup: '<path d="M4 9.5h12v3.5a6 6 0 0 1-12 0V9.5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M3 21h15M8 3.5c-.8 1 .8 2 0 3.2M12 3.5c-.8 1 .8 2 0 3.2"/>',
    drop: '<path d="M12 3.5s6 6.5 6 10.5a6 6 0 0 1-12 0c0-4 6-10.5 6-10.5z"/>',
    users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c0-3.6 2.9-5.8 6.5-5.8s6.5 2.2 6.5 5.8"/><path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M18 14.5c2.2.6 3.5 2.4 3.5 5"/>',
    tag: '<path d="M3 12V4h8l9 9-8 8-9-9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    gift: '<rect x="3.5" y="8.5" width="17" height="4" rx="1"/><path d="M5 12.5v8h14v-8M12 8.5v12M12 8.5c-1.5-4-6.2-4-5.6-1.4.4 1.6 5.6 1.4 5.6 1.4zM12 8.5c1.5-4 6.2-4 5.6-1.4-.4 1.6-5.6 1.4-5.6 1.4z"/>',
    ticket: '<path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M14 6v2.5M14 11v2M14 15.5V18"/>',
    filter: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 3h5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/>',
    capsule: '<path d="M6 6.5h12v2H6zM7 8.5h10l-1.2 9.1a2 2 0 0 1-2 1.7h-3.6a2 2 0 0 1-2-1.7z"/>',
    pod: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5" stroke-dasharray="2 2"/>',
    bean: '<path d="M12 3c4.4 0 7 4 7 9s-2.6 9-7 9-7-4-7-9 2.6-9 7-9z"/><path d="M12 3.5c-2.2 3-2.2 5.5 0 8.5s2.2 5.5 0 8.5"/>',
    moka: '<path d="M8 21h8l-1.6-6.5H9.6zM9.6 14.5L8.4 10h7.2l-1.2 4.5M8.4 10l1.2-5h4.8l1.2 5M16.4 7h2.2l-1.8 4.5M11 3.2h2"/>',
    drip: '<path d="M6 4h12l-4 7h-4zM12 11v3M7 15h10v5H7z"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.6v.4"/>',
    store: '<path d="M4 10.5V20h16v-9.5M3 4h18l-1.2 4.2a2.6 2.6 0 0 1-5 0 2.6 2.6 0 0 1-5 0 2.6 2.6 0 0 1-5 0z"/><path d="M10 20v-5h4v5"/>',
    shield: '<path d="M12 3l7.5 3v6c0 4.5-3.2 7.7-7.5 9-4.3-1.3-7.5-4.5-7.5-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    stamp: '<path d="M9 4h6v5.2l3.5 2.3V14h-13v-2.5L9 9.2z"/><path d="M4 17h16v3H4z"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6"/>',
    zoomin: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M11 8v6M8 11h6"/>',
    zoomout: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M8 11h6"/>',
    reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/>',
    snow: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>',
    star5: '<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7z"/>',
    bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>'
  };
  function icon(name, cls) { return '<svg class="ico' + (cls ? " " + cls : "") + '" aria-hidden="true" focusable="false"><use href="#i-' + name + '"/></svg>'; }
  function injectSprite() {
    var s = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>';
    Object.keys(ICONS).forEach(function (k) { s += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + ICONS[k] + "</symbol>"; });
    s += '<filter id="q-ink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/><feComponentTransfer><feFuncA type="table" tableValues="0 .92"/></feComponentTransfer></filter>';
    s += "</defs></svg>";
    var d = document.createElement("div");
    d.innerHTML = s;
    document.body.insertBefore(d.firstChild, document.body.firstChild);
  }

  /* ------------------------------------------------------------------
     Majolica tiles, generated from the brand colors
     Corner quarter-bullseyes meet at every tile junction to rebuild the Guglielmo mark.
     ------------------------------------------------------------------ */
  var C = { o: "#F5821F", y: "#FFF200", r: "#ED1C24", g: "#1E4A37", g2: "#2D6A4F", p: "#F7F0E3", p2: "#EFE4CF", p3: "#E6D6B8", ink: "#1C2620" };
  function tileSVG(kind) {
    var s = 96, h = 48, o = "";
    if (kind === "bottega") {
      o += '<rect width="96" height="96" fill="' + C.p + '"/>';
      [[0, 0], [96, 0], [0, 96], [96, 96]].forEach(function (c) {
        o += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="21" fill="' + C.o + '"/><circle cx="' + c[0] + '" cy="' + c[1] + '" r="13.5" fill="' + C.y + '"/><circle cx="' + c[0] + '" cy="' + c[1] + '" r="6.5" fill="' + C.r + '"/>';
        o += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="30" fill="none" stroke="' + C.g + '" stroke-width="2"/>';
      });
      // four petals around the center
      for (var i = 0; i < 4; i++) {
        o += '<path transform="rotate(' + (i * 90) + ' 48 48)" d="M48 46 C40 36 40 22 48 14 C56 22 56 36 48 46Z" fill="' + C.g2 + '" stroke="' + C.g + '" stroke-width="1.6"/>';
        o += '<path transform="rotate(' + (i * 90 + 45) + ' 48 48)" d="M48 44 C45 38 45 31 48 27 C51 31 51 38 48 44Z" fill="' + C.o + '"/>';
      }
      o += '<circle cx="48" cy="48" r="6" fill="' + C.y + '" stroke="' + C.g + '" stroke-width="1.6"/><circle cx="48" cy="48" r="2.4" fill="' + C.r + '"/>';
      // edge half-dots that close into circles when tiled
      [[48, 0], [48, 96], [0, 48], [96, 48]].forEach(function (c) { o += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="4.5" fill="' + C.g + '"/>'; });
    } else if (kind === "sole") {
      o += '<rect width="96" height="96" fill="' + C.p + '"/>';
      [[0, 0], [96, 0], [0, 96], [96, 96]].forEach(function (c) { o += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="24" fill="' + C.g2 + '"/><circle cx="' + c[0] + '" cy="' + c[1] + '" r="16" fill="' + C.p + '"/><circle cx="' + c[0] + '" cy="' + c[1] + '" r="9" fill="' + C.y + '"/>'; });
      for (var j = 0; j < 8; j++) o += '<path transform="rotate(' + (j * 45) + ' 48 48)" d="M48 20 L52 34 L44 34Z" fill="' + C.o + '"/>';
      o += '<circle cx="48" cy="48" r="13" fill="' + C.y + '" stroke="' + C.o + '" stroke-width="3"/><circle cx="48" cy="48" r="5" fill="' + C.r + '"/>';
      [[48, 0], [48, 96], [0, 48], [96, 48]].forEach(function (c) { o += '<path transform="translate(' + c[0] + ' ' + c[1] + ') rotate(45)" d="M-7 0 C-3 -5 3 -5 7 0 C3 5 -3 5 -7 0Z" fill="' + C.g + '"/>'; });
    } else { // quiet: line-only tile for backgrounds
      o += '<rect width="96" height="96" fill="' + C.p2 + '"/>';
      [[0, 0], [96, 0], [0, 96], [96, 96]].forEach(function (c) { o += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="18" fill="none" stroke="' + C.p3 + '" stroke-width="2"/><circle cx="' + c[0] + '" cy="' + c[1] + '" r="7" fill="' + C.p3 + '"/>'; });
      for (var k = 0; k < 4; k++) o += '<path transform="rotate(' + (k * 90) + ' 48 48)" d="M48 44 C42 36 42 26 48 20 C54 26 54 36 48 44Z" fill="none" stroke="' + C.p3 + '" stroke-width="2"/>';
      o += '<circle cx="48" cy="48" r="3.5" fill="' + C.p3 + '"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '" viewBox="0 0 96 96">' + o + "</svg>";
  }
  function tileURL(kind) { return 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(tileSVG(kind)) + '")'; }
  function installTiles() {
    var r = document.documentElement.style;
    r.setProperty("--tile-bottega", tileURL("bottega"));
    r.setProperty("--tile-sole", tileURL("sole"));
    r.setProperty("--tile-quiet", tileURL("quiet"));
  }

  /* ------------------------------------------------------------------
     Small SVG illustrations
     ------------------------------------------------------------------ */
  function bullseye(size, cls) {
    return '<svg class="' + (cls || "") + '" width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" fill="#F5821F"/><circle cx="50" cy="50" r="33" fill="#FFF200"/><circle cx="50" cy="50" r="16.5" fill="#ED1C24"/></svg>';
  }
  /* Postmark: circular cancellation with a place name and a center line */
  function postmark(top, mid, bottom, color) {
    var id = nid("pm"); color = color || "#B3141B";
    return '<svg class="postcard__mark" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="' + id + '" d="M21 60a39 39 0 1 1 78 0"/></defs>' +
      '<g fill="none" stroke="' + color + '" stroke-width="2.2" opacity=".82" filter="url(#q-ink)"><circle cx="60" cy="60" r="47"/><circle cx="60" cy="60" r="31"/>' +
      '<path d="M8 96c10-5 18 5 28 0s18 5 28 0 18 5 28 0 18 5 28 0" /><path d="M8 105c10-5 18 5 28 0s18 5 28 0 18 5 28 0 18 5 28 0"/></g>' +
      '<g fill="' + color + '" opacity=".85" font-family="Figtree, sans-serif" font-weight="800" text-anchor="middle">' +
      '<text font-size="9.5" letter-spacing="1.6"><textPath href="#' + id + '" startOffset="50%">' + esc(top) + "</textPath></text>" +
      '<text x="60" y="58" font-size="13" letter-spacing=".5">' + esc(mid) + '</text><text x="60" y="72" font-size="8" letter-spacing="1.6">' + esc(bottom) + "</text></g></svg>";
  }

  /* Illustrated shopfront for a venue (honest stand-in until partner photography exists) */
  var FACADES = ["#B65A3C", "#E3CFA6", "#C98F45", "#8E6B5A", "#D9BC8E", "#A24E36", "#7E8F7A"];
  var AWNING = { cafe: "#2D6A4F", restaurant: "#B3141B", pastry: "#F5821F" };
  var TYPE_LABEL = { cafe: "Café", restaurant: "Restaurant", pastry: "Pastry shop" };
  function venueShort(v) { return v.name.split(" — ")[0]; }
  function venuePlace(v) { var p = v.name.split(" — ")[1]; return p || (v.address.indexOf("North Square") >= 0 || v.address.indexOf("Hanover") >= 0 ? "North End" : v.city); }
  function shopfront(v, i, label) {
    var id = nid("sf"), name = venueShort(v), fac = FACADES[(i || 0) % FACADES.length], aw = AWNING[v.type] || "#2D6A4F";
    var len = name.length, fs = Math.min(30, Math.max(15, 255 / (len * 0.6)));
    var dark = ["#B65A3C", "#8E6B5A", "#A24E36", "#7E8F7A"].indexOf(fac) >= 0;
    var s = '<svg class="shopfront" viewBox="0 0 320 210" role="img" aria-label="' + esc(label || ("Illustrated shopfront: " + name)) + '"><defs>' +
      '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE3A6"/><stop offset="1" stop-color="#E9A24B"/></linearGradient></defs>' +
      '<rect width="320" height="210" fill="' + fac + '"/>';
    if (dark) { s += '<g stroke="rgba(0,0,0,.12)" stroke-width="1">'; for (var y = 22; y < 210; y += 11) s += '<path d="M0 ' + y + 'h320"/>'; s += "</g>"; }
    s += '<rect y="0" width="320" height="14" fill="rgba(0,0,0,.22)"/><rect y="14" width="320" height="4" fill="rgba(255,255,255,.18)"/>' +
      '<rect x="16" y="24" width="288" height="54" rx="5" fill="#16382A" stroke="#1C2620" stroke-width="3"/>' +
      '<rect x="22" y="30" width="276" height="42" rx="3" fill="none" stroke="#E2BC62" stroke-width="1.2" opacity=".7"/>' +
      '<text x="160" y="' + (52 + fs * 0.18) + '" text-anchor="middle" font-family="Caprasimo, Georgia, serif" font-size="' + fs.toFixed(1) + '" fill="#E2BC62">' + esc(name) + "</text>" +
      '<text x="160" y="69" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="800" font-size="8" letter-spacing="2.4" fill="#F7F0E3">' + esc((TYPE_LABEL[v.type] || "") + " · " + venuePlace(v)).toUpperCase() + "</text>";
    // awning
    s += '<g><rect x="6" y="84" width="308" height="30" fill="#F7F0E3"/>';
    for (var x = 6, k = 0; x < 314; x += 22, k++) {
      var col = k % 2 === 0 ? aw : "#F7F0E3";
      s += '<rect x="' + x + '" y="84" width="22" height="30" fill="' + col + '"/><circle cx="' + (x + 11) + '" cy="114" r="11" fill="' + col + '"/>';
    }
    s += '<rect x="6" y="84" width="308" height="9" fill="rgba(0,0,0,.16)"/></g>';
    // window + door
    s += '<rect x="22" y="132" width="178" height="70" fill="url(#' + id + 'g)" stroke="#1C2620" stroke-width="3"/>' +
      '<path d="M111 132v70" stroke="#1C2620" stroke-width="3"/><rect x="22" y="188" width="178" height="14" fill="rgba(28,38,32,.28)"/>' +
      '<g fill="#F7F0E3" stroke="#1C2620" stroke-width="1.5"><path d="M40 180h14v-6a7 7 0 0 1-14 0z"/><path d="M60 180h14v-6a7 7 0 0 1-14 0z"/><path d="M150 180h16v-12h-16z"/></g>' +
      '<circle cx="86" cy="152" r="10" fill="#F5821F"/><circle cx="86" cy="152" r="6.6" fill="#FFF200"/><circle cx="86" cy="152" r="3.3" fill="#ED1C24"/>' +
      '<rect x="214" y="126" width="80" height="84" fill="#1C2620"/><rect x="222" y="134" width="64" height="40" fill="url(#' + id + 'g)" opacity=".9"/>' +
      '<circle cx="278" cy="186" r="3" fill="#E2BC62"/><rect x="0" y="204" width="320" height="6" fill="rgba(0,0,0,.28)"/></svg>';
    return s;
  }

  /* Recipe art: flat illustrations in the shop palette */
  function recipeArt(kind) {
    var ink = 'stroke="#1C2620" stroke-width="3" stroke-linejoin="round"';
    var a = '<svg viewBox="0 0 200 200" role="img" aria-label="' + ({ moka: "Illustration of a moka pot", shakerato: "Illustration of a caffè shakerato in a coupe", affogato: "Illustration of an affogato", granita: "Illustration of granita al caffè with cream", tiramisu: "Illustration of a slice of tiramisù", brasilena: "Illustration of a Brasilena float" }[kind] || "Recipe illustration") + '">';
    if (kind === "moka") {
      a += '<path d="M86 22c-6 8 6 12 0 20M104 18c-6 8 6 12 0 20" fill="none" stroke="#C9B79A" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M76 104l-8-38h64l-8 38z" fill="#D5D8D1" ' + ink + '/><path d="M70 66l8-16h44l8 16z" fill="#B9BEB5" ' + ink + '/><rect x="94" y="40" width="12" height="10" rx="3" fill="#1C2620"/>' +
        '<path d="M68 66l-18-8 4 14" fill="#B9BEB5" ' + ink + '/><path d="M132 72c16 2 20 20 6 30" fill="none" stroke="#1C2620" stroke-width="9" stroke-linecap="round"/>' +
        '<path d="M76 104h48l10 56H66z" fill="#C9CCC6" ' + ink + '/><path d="M84 112l-5 40M98 112v40M112 112l4 40" stroke="#A7ACA3" stroke-width="3"/>' +
        '<rect x="54" y="160" width="92" height="10" rx="3" fill="#1C2620"/><path d="M72 180c4-10 10-10 8-2 6-8 12-6 10 2 6-8 12-8 10 0 6-8 12-6 8 2" fill="#FFF200" stroke="#F5821F" stroke-width="3"/>';
    } else if (kind === "shakerato") {
      a += '<path d="M40 52h120l-60 66z" fill="#5A341C" ' + ink + '/><path d="M40 52h120l-12 13H52z" fill="#F2E3C4" ' + ink + '/>' +
        '<path d="M100 118v46" stroke="#1C2620" stroke-width="5"/><path d="M70 172h60" stroke="#1C2620" stroke-width="7" stroke-linecap="round"/>' +
        '<circle cx="78" cy="60" r="3" fill="#C9A06A"/><circle cx="110" cy="58" r="2.5" fill="#C9A06A"/><circle cx="128" cy="61" r="2" fill="#C9A06A"/>' +
        '<g transform="rotate(14 150 40)"><rect x="140" y="14" width="26" height="40" rx="5" fill="#C9CCC6" ' + ink + '/><rect x="136" y="8" width="34" height="10" rx="4" fill="#1C2620"/></g>' +
        '<rect x="28" y="140" width="18" height="18" rx="3" fill="#DCEFF2" ' + ink + ' transform="rotate(-12 37 149)"/><rect x="152" y="146" width="16" height="16" rx="3" fill="#DCEFF2" ' + ink + ' transform="rotate(10 160 154)"/>';
    } else if (kind === "affogato") {
      a += '<path d="M54 96h92l-10 74H64z" fill="#F7F0E3" ' + ink + '/><path d="M58 128h84l-6 42H64z" fill="#6B3E1F"/><path d="M54 96h92l-10 74H64z" fill="none" ' + ink + '/>' +
        '<path d="M66 100c0-24 68-24 68 0 0 8-8 14-34 14S66 108 66 100z" fill="#FFF6DD" ' + ink + '/><path d="M80 90c8-6 22-8 36-2" fill="none" stroke="#E9D9B0" stroke-width="3"/>' +
        '<path d="M100 104c4 6 2 14-2 20" stroke="#6B3E1F" stroke-width="6" stroke-linecap="round" fill="none"/>' +
        '<g transform="rotate(-28 130 40)"><path d="M112 28h36v18a18 18 0 0 1-36 0z" fill="#F7F0E3" ' + ink + '/><path d="M148 32c10 0 10 14 0 14" fill="none" stroke="#1C2620" stroke-width="3"/><circle cx="130" cy="30" r="4" fill="#F5821F"/></g>' +
        '<path d="M108 58c-4 10-6 24-6 38" stroke="#6B3E1F" stroke-width="4" fill="none" stroke-linecap="round"/>';
    } else if (kind === "granita") {
      a += '<path d="M62 72h76l-10 98H72z" fill="#7A4A2A" ' + ink + '/>';
      for (var i = 0; i < 26; i++) a += '<circle cx="' + (74 + (i * 37) % 52) + '" cy="' + (90 + (i * 23) % 70) + '" r="2.6" fill="#A87449"/>';
      a += '<path d="M60 74c-4-30 84-30 80 0z" fill="#FFFBF4" ' + ink + '/><path d="M80 52c6-14 34-14 40 0" fill="none" stroke="#1C2620" stroke-width="3"/><circle cx="100" cy="38" r="9" fill="#FFFBF4" ' + ink + '/>' +
        '<g><circle cx="160" cy="150" r="22" fill="#E3A548" ' + ink + '/><circle cx="160" cy="124" r="11" fill="#E3A548" ' + ink + '/></g><path d="M112 40l16-26" stroke="#B3141B" stroke-width="5" stroke-linecap="round"/>';
    } else if (kind === "tiramisu") {
      a += '<ellipse cx="100" cy="168" rx="84" ry="14" fill="#F7F0E3" ' + ink + '/>' +
        '<path d="M36 82l100-22 34 26v68l-34 8-100-6z" fill="#FFF6DD" ' + ink + '/>' +
        '<path d="M36 82l100-22 34 26-100 14z" fill="#5A341C" ' + ink + '/>' +
        '<path d="M70 100v58M36 116l34 4 100-14M36 140l34 4 100-14" stroke="#1C2620" stroke-width="3" fill="none"/>' +
        '<path d="M37 118l33 4v20l-33-4zM70 122l99-15v20l-99 15z" fill="#B9844D"/><path d="M37 142l33 4v14l-33-3zM70 146l99-15v14l-99 15z" fill="#FFF6DD"/>' +
        '<path d="M36 82l34 18v58l-34-4z" fill="none" ' + ink + '/><path d="M70 100l100-14" stroke="#1C2620" stroke-width="3"/>';
      for (var t = 0; t < 14; t++) a += '<circle cx="' + (60 + (t * 29) % 96) + '" cy="' + (78 + (t * 13) % 16) + '" r="1.8" fill="#2E1A0D"/>';
    } else if (kind === "brasilena") {
      a += '<path d="M70 60h60l-8 112H78z" fill="#C98A3C" opacity=".92" ' + ink + '/>';
      for (var b = 0; b < 9; b++) a += '<circle cx="' + (84 + (b * 17) % 32) + '" cy="' + (90 + (b * 19) % 70) + '" r="' + (2 + b % 3) + '" fill="none" stroke="#FFF6DD" stroke-width="2"/>';
      a += '<path d="M66 64c0-26 68-26 68 0 0 6-10 10-34 10S66 70 66 64z" fill="#FFFBF4" ' + ink + '/>' +
        '<path d="M112 70l26-62" stroke="#1C2620" stroke-width="9" stroke-linecap="round"/><path d="M112 70l26-62" stroke="#ED1C24" stroke-width="5" stroke-dasharray="8 8" stroke-linecap="round"/>' +
        '<g transform="translate(140 98)"><rect width="40" height="74" rx="6" fill="#F7D500" ' + ink + '/><rect y="22" width="40" height="28" fill="#A3310A"/><text x="20" y="41" text-anchor="middle" font-family="Caprasimo, Georgia, serif" font-size="9" fill="#F7D500">Brasilena</text></g>';
    }
    return a + "</svg>";
  }

  /* Rubber-stamp impression for Il Passaporto */
  var STAMP_ICONS = ["moka", "cup", "bean", "target", "capsule", "pod", "store", "leaf", "gift", "star5"];
  var STAMP_PLACES = ["North End", "East Boston", "Chelsea", "South Boston", "Seaport", "Brookline", "Brighton", "Newton", "Belmont", "Calabria"];
  var STAMP_COLORS = ["#B3141B", "#1E4A37", "#A24A08", "#B3141B", "#2D6A4F"];
  function stampInk(i) {
    var id = nid("st"), col = STAMP_COLORS[i % STAMP_COLORS.length], place = STAMP_PLACES[i % STAMP_PLACES.length];
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><defs><path id="' + id + '" d="M17 50a33 33 0 1 1 66 0"/></defs>' +
      '<g filter="url(#q-ink)" fill="none" stroke="' + col + '" stroke-width="3"><circle cx="50" cy="50" r="44"/><circle cx="50" cy="50" r="27" stroke-width="2"/></g>' +
      '<g filter="url(#q-ink)" fill="' + col + '" font-family="Figtree, sans-serif" font-weight="800" text-anchor="middle"><text font-size="9" letter-spacing="1.2"><textPath href="#' + id + '" startOffset="50%">' + esc(place.toUpperCase()) + "</textPath></text>" +
      '<text x="50" y="86" font-size="8" letter-spacing="1.4">N° ' + (i + 1) + "</text></g>" +
      '<g transform="translate(36 36) scale(1.17)" fill="none" stroke="' + col + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="url(#q-ink)">' + ICONS[STAMP_ICONS[i % STAMP_ICONS.length]] + "</g></svg>";
  }

  /* ------------------------------------------------------------------
     Catalog helpers
     ------------------------------------------------------------------ */
  var SYS = {
    "espresso-point-36": { label: "36 mm capsules", short: "36 mm capsule machines", ico: "capsule", desc: "Guglielmo capsules for Espresso Point-type machines" },
    "nespresso-original": { label: "Espresso 70", short: "Nespresso® Original-compatible", ico: "capsule", desc: "Capsules compatible with Nespresso® Original machines" },
    "ese-44": { label: "ESE 44 mm pods", short: "Any E.S.E. pod machine", ico: "pod", desc: "Paper pods (cialde) for any E.S.E. machine" },
    "traditional": { label: "Espresso & moka", short: "Espresso machine & moka", ico: "moka", desc: "Whole beans and ground coffee" },
    "drip": { label: "Drip & batch", short: "Drip & batch brewers", ico: "drip", desc: "Drip blends roasted for brewers" }
  };
  function fitsKey(p) {
    if (p.system && p.system !== "pod-38") return p.system;
    if (p.format === "beans" || p.format === "ground") return "traditional";
    if (p.format === "drip-beans" || p.format === "drip-ground") return "drip";
    return null;
  }
  function fitsText(p) {
    if (p.system === "pod-38") return "38 mm pods (discontinued)";
    if (p.category === "machine") {
      if (p.system === "traditional") return p.slug === "grinder" ? "Espresso beans" : "Beans & ground";
      return "Uses " + (SYS[p.system] ? SYS[p.system].label : "capsules");
    }
    if (p.format === "beans") return "Espresso machine · grinder";
    if (p.format === "ground") return /fine/i.test(p.name) ? "Espresso machine" : "Moka & espresso machine";
    var k = fitsKey(p);
    if (k) return SYS[k].short;
    if (p.category === "care") return /softener/i.test(p.name) ? "RDL & Grimac machines" : (/o-ring|screen/i.test(p.name) ? "Grimac pod machines" : "Espresso machines & grinders");
    return "Any table";
  }
  function formatText(p) {
    if (p.category === "machine") return p.quote ? "Commercial / quote" : (p.system === "traditional" ? "Espresso machine" : (p.system === "ese-44" ? "Pod machine" : "Capsule machine"));
    if (p.format) return G.products.formatLabel(p.format) + (p.size ? " · " + p.size : "");
    if (p.category === "beverage") return "Coffee soda" + (/24/.test(p.name) ? " · 24" : /6-Pack/.test(p.name) ? " · 6" : " · 1");
    if (p.category === "care") return "Care & parts";
    if (p.category === "supplies") return "Cups kit" + (p.size ? " · " + p.size : "");
    if (p.category === "gift") return "Gift set";
    return "Cups & gifts";
  }
  function blendName(id) { var b = G.blend(id); return b ? b.name.replace(/\s*\(.*\)$/, "") : ""; }
  function cleanNote(s) { return String(s).replace(/\s*\((?:[^()]|\([^)]*\))*\)\s*/g, "").replace(/\s+-\s+.*$/, "").trim(); }
  function roastShort(s) { return cleanNote(String(s || "").split(";")[0]).replace(/\.$/, ""); }
  function intensityHTML(n, lg) {
    if (!n) return '<span class="intensity muted">Not rated</span>';
    var b = G.intensityBucket(n), cells = "";
    for (var i = 1; i <= 10; i++) cells += "<i" + (i <= n ? ' class="on"' : "") + "></i>";
    return '<span class="intensity' + (lg ? " intensity--lg" : "") + '" data-bucket="' + b.id + '" role="img" aria-label="Intensity ' + n + ' of 10, ' + b.label + '"><span class="intensity__cells" aria-hidden="true">' + cells + "</span><span>" + n + " · " + b.label + "</span></span>";
  }
  function productImg(p, i) { return G.img((p.images && p.images[i || 0]) || "assets/img/logo/guglielmo-mark.svg"); }
  function perUnit(p) {
    var u = G.products.pricePerUnit(p);
    if (!u) return "";
    return money(u.value) + "/" + u.unit;
  }
  function isStampable(p) { return p && (p.category === "coffee" || p.category === "single-serve"); }
  function stampsFor(lines) { return lines.reduce(function (s, l) { return s + (isStampable(l.product) ? l.qty * (l.subscribe ? 2 : 1) : 0); }, 0); }
  function shortName(p) { return p.name.replace(/\s*\((.*)\)\s*$/, " · $1"); }

  /* Product card: every card shows Format · Fits · Intensity */
  function card(p, opts) {
    opts = opts || {};
    var out = !p.in_stock, q = p.quote, n = G.intensity(p);
    var eyebrow = p.blend ? blendName(p.blend) : (p.brand && p.brand !== "OTHER" ? p.brand : G.products.categoryLabel(p.category));
    var flag = q ? '<span class="tag tag--green pcard__flag">Quote</span>' : out ? '<span class="tag tag--out pcard__flag">Out of stock</span>' : (isStampable(p) ? '<span class="tag tag--yellow pcard__flag">Subscribe −10%</span>' : "");
    var foot;
    if (q) foot = '<p class="price">Price on request<span class="per">Lease & purchase options</span></p><a class="btn btn--green btn--sm" href="business.html#proposal">Request a quote</a>';
    else if (out) foot = '<p class="price">' + money(p.price) + '<span class="per">Back soon</span></p><button type="button" class="btn btn--ghost btn--sm" data-notify="' + p.slug + '" aria-expanded="false">Notify me</button>';
    else foot = '<p class="price">' + money(p.price) + (perUnit(p) ? '<span class="per">' + perUnit(p) + "</span>" : "") + '</p><button type="button" class="btn btn--red btn--sm" data-add="' + p.slug + '" aria-label="Add ' + esc(p.name) + ' to bag">' + icon("plus") + "Add</button>";
    return '<article class="pcard' + (out ? " is-out" : "") + (q ? " is-quote" : "") + '" data-slug="' + p.slug + '"' + (opts.hover !== false ? ' data-m-hover="lift"' : "") + ">" +
      '<a class="pcard__media" href="' + G.linkTo("product.html", "slug", p.slug) + '" tabindex="-1" aria-hidden="true">' + flag +
      '<img src="' + productImg(p) + '" alt="" width="400" height="400" loading="lazy" decoding="async"></a>' +
      '<div class="pcard__body"><p class="pcard__eyebrow">' + esc(eyebrow) + "</p>" +
      '<h3 class="pcard__title"><a href="' + G.linkTo("product.html", "slug", p.slug) + '">' + esc(shortName(p)) + "</a></h3>" +
      '<dl class="pcard__facts"><div><dt>Format</dt><dd>' + esc(formatText(p)) + '</dd></div><div><dt>Fits</dt><dd>' + esc(fitsText(p)) + '</dd></div><div><dt>Intensity</dt><dd>' + intensityHTML(n) + "</dd></div></dl>" +
      '<div class="pcard__foot">' + foot + "</div></div></article>";
  }

  /* ------------------------------------------------------------------
     Chrome: header / footer / drawers
     ------------------------------------------------------------------ */
  var NAV = {
    home: [["shop.html", "Shop", "shop product checkout"], ["find.html", "Find us", "find community"], ["recipes.html", "Recipes", "recipes"], ["rewards.html", "Il Passaporto", "rewards"], ["business.html", "For your business", "business"], ["story.html", "Our family", "story"]],
    business: [["business.html#segments", "Solutions", "business"], ["business.html#equipment", "Equipment", ""], ["business.html#services", "Service", ""], ["community.html", "Il Quartiere", "community"], ["find.html", "Find us", "find"], ["story.html", "Our family", "story"]]
  };
  var CTA = { home: ["shop.html#subscribe", "Subscribe & save"], business: ["business.html#tasting", "Book a tasting"] };

  function navItems(mode, cls) {
    return NAV[mode].map(function (n) {
      var cur = n[2].split(" ").indexOf(PAGE) >= 0 && n[2] !== "";
      return '<li><a href="' + n[0] + '"' + (cur ? ' aria-current="page"' : "") + ">" + n[1] + (cls ? icon("arrow") : "") + "</a></li>";
    }).join("");
  }

  function headerHTML() {
    var mode = G.mode();
    return '<a class="skip-link" href="#main">Skip to content</a>' +
      '<div class="announce"><div class="wrap announce__in"><p><span class="announce__item">' + icon("truck") + 'Free shipping on orders $59+</span><span class="announce__item">Delivered in 3 business days across New England</span><span class="announce__item">Shipping nationwide from Greater Boston</span></p></div></div>' +
      '<header class="site-header" id="site-header">' +
      '<div class="util"><div class="wrap util__in"><div class="mode-switch" role="group" aria-label="Show the site for"><span class="mode-switch__pill" aria-hidden="true"></span>' +
      '<button type="button" data-mode="home" aria-pressed="' + (mode === "home") + '">For Home</button><button type="button" data-mode="business" aria-pressed="' + (mode === "business") + '">For Business</button></div>' +
      '<div class="util__links"><a class="hide-sm" href="community.html">' + icon("store") + 'Il Quartiere</a><a class="hide-sm" href="find.html">' + icon("pin") + 'Find us</a><a href="tel:+16176120090">' + icon("phone") + '<span>(617) 612-0090</span></a></div></div></div>' +
      '<div class="bar"><div class="wrap bar__in">' +
      '<button type="button" class="icon-btn bar__menu" data-open="nav-drawer" aria-controls="nav-drawer" aria-expanded="false" aria-label="Open menu">' + icon("menu") + "</button>" +
      '<a class="brand" href="index.html" aria-label="Guglielmo USA, home"><img src="' + G.img("assets/img/logo/guglielmo-logo-color.png") + '" alt="Guglielmo" width="1096" height="322"><span class="brand__usa" aria-hidden="true">USA</span></a>' +
      '<nav class="primary" aria-label="Primary"><ul data-nav>' + navItems(mode) + "</ul></nav>" +
      '<div class="bar__actions"><button type="button" class="icon-btn" data-open="search-panel" aria-controls="search-panel" aria-expanded="false" aria-label="Search the shop">' + icon("search") + "</button>" +
      '<a class="icon-btn acct" href="rewards.html" aria-label="Account and Il Passaporto">' + icon("user") + "</a>" +
      '<button type="button" class="icon-btn" id="cart-btn" data-open="cart-drawer" aria-controls="cart-drawer" aria-expanded="false" aria-label="Open bag">' + icon("bag") + '<span class="cart-count" data-cart-count data-zero="true">0</span></button>' +
      '<a class="btn btn--red btn--sm bar__cta" data-cta href="' + CTA[mode][0] + '">' + CTA[mode][1] + "</a></div></div></div>" +
      '<div class="awning" aria-hidden="true"></div></header>';
  }

  function footerHTML() {
    return '<footer class="site-footer"><div class="tilebar" aria-hidden="true"></div><div class="wrap footer__top">' +
      '<div class="footer__brand"><a class="brand" href="index.html" aria-label="Guglielmo USA, home"><img src="' + G.img("assets/img/logo/guglielmo-logo-white.png") + '" alt="Guglielmo" width="1096" height="322" loading="lazy"><span class="brand__usa" aria-hidden="true">USA</span></a>' +
      "<p>Roasted at Copanello, Calabria, since 1943. Imported, delivered and serviced by L'Espresso USA, a Boston family business since 2000.</p>" +
      '<address class="footer__contact"><div>' + icon("phone") + '<span><a href="tel:+16176120090">(617) 612-0090</a> · orders &amp; service</span></div>' +
      "<div>" + icon("mail") + '<a href="mailto:info@lespressousa.com">info@lespressousa.com</a></div>' +
      "<div>" + icon("clock") + "<span>Mon–Fri 9:00–5:00 ET <span class=\"muted\">(hours to confirm)</span></span></div>" +
      "<div>" + icon("pin") + "<span>Greater Boston, MA</span></div></address></div>" +
      '<nav class="footer__col" aria-label="Shop"><h2>Shop</h2><ul><li><a href="shop.html#cat=coffee">Coffee</a></li><li><a href="shop.html#cat=single-serve">Capsules &amp; pods</a></li><li><a href="shop.html#cat=machine">Machines</a></li><li><a href="shop.html#subscribe">Subscribe &amp; save</a></li><li><a href="shop.html#cat=beverage">Brasilena</a></li><li><a href="shop.html#cat=gifts">Gifts &amp; cups</a></li><li><a href="recipes.html">Recipes</a></li></ul></nav>' +
      '<nav class="footer__col" aria-label="For business"><h2>For business</h2><ul><li><a href="business.html#segments">Cafés &amp; restaurants</a></li><li><a href="business.html#segments">Offices &amp; hotels</a></li><li><a href="business.html#finder">Solution finder</a></li><li><a href="business.html#services">Service &amp; repair</a></li><li><a href="business.html#tasting">Book a tasting</a></li><li><a href="business.html#partners">Become a distributor</a></li><li><a href="community.html#bring">Bring us to your venue</a></li></ul></nav>' +
      '<nav class="footer__col" aria-label="Company"><h2>Company</h2><ul><li><a href="story.html">Our family</a></li><li><a href="community.html">Il Quartiere</a></li><li><a href="find.html">Find Guglielmo</a></li><li><a href="rewards.html">Il Passaporto</a></li><li><a href="rewards.html#refer">Refer a friend</a></li><li><a href="story.html#letters">Letters from customers</a></li></ul></nav>' +
      '<div class="footer__news"><h2>La Posta</h2><p>One letter a month: new arrivals, a recipe, and where Guglielmo is pouring next. No spam, unsubscribe in one click.</p>' +
      '<form class="news-form" data-news novalidate><label class="sr-only" for="news-email-f">Email address</label><div class="news-row"><input class="input" id="news-email-f" name="email" type="email" required autocomplete="email" placeholder="you@example.com"><button class="btn btn--yellow" type="submit">Sign me up</button></div>' +
      '<p class="xs" style="margin-top:10px">We send a confirmation email first (double opt-in). <a href="rewards.html#posta">More about La Posta</a></p><div class="news-ok" role="status" aria-live="polite"></div></form></div></div>' +
      '<div class="wrap footer__trust"><span><strong>Since 1943</strong> · Caffè Guglielmo, Catanzaro</span><span><strong>ISO 9001</strong> quality system at the roastery*</span><span><strong>Espresso Italiano</strong> member since 2008*</span><span class="pay-row" aria-label="Payment methods"><span>Apple Pay</span><span>Google Pay</span><span>PayPal</span><span>Shop Pay</span><span>Visa</span><span>Mastercard</span><span>Amex</span></span></div>' +
      '<div class="wrap footer__legal"><span>© 2026 L\'Espresso USA · Guglielmo USA</span><ul aria-label="Social"><li><a href="#" aria-label="Facebook (demo link)">Facebook</a></li><li><a href="#" aria-label="Instagram (demo link)">Instagram</a></li><li><a href="#" aria-label="YouTube (demo link)">YouTube</a></li><li><a href="#" aria-label="Pinterest (demo link)">Pinterest</a></li></ul>' +
      '<ul aria-label="Legal"><li><a href="#">Terms</a></li><li><a href="#">Privacy</a></li><li><a href="#">Shipping &amp; returns</a></li><li><a href="#">Accessibility</a></li></ul>' +
      '<p class="footer__disclaimer">Nespresso® and Espresso Point® are trademarks of their owners; Guglielmo USA is not affiliated with them. *Certification status to be reconfirmed with Guglielmo S.p.A. before launch. Loyalty, referral and subscription terms shown are proposals.</p></div></footer>';
  }

  function drawersHTML() {
    var mode = G.mode();
    return '<div class="scrim" id="scrim" hidden></div>' +
      '<aside class="drawer drawer--right" id="cart-drawer" data-side="right" role="dialog" aria-modal="true" aria-labelledby="cart-title" hidden><div class="drawer__head"><h2 id="cart-title">Your bag</h2><button type="button" class="icon-btn" data-close aria-label="Close bag">' + icon("close") + '</button></div><div class="awning awning--sm" aria-hidden="true"></div><div class="drawer__body" id="cart-body"></div><div class="drawer__foot" id="cart-foot"></div></aside>' +
      '<aside class="drawer drawer--left" id="nav-drawer" data-side="left" role="dialog" aria-modal="true" aria-label="Menu" hidden><div class="drawer__head"><a class="brand" href="index.html"><img src="' + G.img("assets/img/logo/guglielmo-logo-color.png") + '" alt="Guglielmo USA home" width="1096" height="322" style="height:34px"></a><button type="button" class="icon-btn" data-close aria-label="Close menu">' + icon("close") + '</button></div><div class="awning awning--sm awning--red" aria-hidden="true"></div>' +
      '<div class="drawer__body"><div class="seg" role="group" aria-label="Show the site for" style="margin-bottom:12px"><button type="button" data-mode="home" aria-pressed="' + (mode === "home") + '">For Home</button><button type="button" data-mode="business" aria-pressed="' + (mode === "business") + '">For Business</button></div>' +
      '<nav aria-label="Mobile"><ul class="navd__links" data-nav-m>' + navItems(mode, true) + "</ul></nav>" +
      '<p style="margin:0 0 16px"><a class="btn btn--red btn--block" data-cta href="' + CTA[mode][0] + '">' + CTA[mode][1] + '</a></p>' +
      '<div class="navd__contact"><a href="community.html">Il Quartiere: the venues that pour Guglielmo</a><a href="tel:+16176120090">(617) 612-0090</a><a href="mailto:info@lespressousa.com">info@lespressousa.com</a><span class="muted">Greater Boston, MA</span></div></div></aside>' +
      '<div class="search-panel" id="search-panel" role="dialog" aria-modal="true" aria-label="Search" hidden><div class="wrap search-panel__in"><form class="search-row" role="search" data-search-form><label class="sr-only" for="q-search">Search coffee, machines, venues</label>' +
      '<input class="input" id="q-search" type="search" autocomplete="off" placeholder="Try “moka”, “Nespresso”, “decaf” or “North End”" data-autofocus><button type="button" class="icon-btn" data-close aria-label="Close search">' + icon("close") + "</button></form>" +
      '<div class="search-sugg" data-sugg></div><div class="search-results" data-results aria-live="polite"></div></div></div>' +
      '<div class="toast-zone" aria-live="polite" style="position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:120;display:grid;gap:8px;width:min(92vw,420px)"></div>';
  }

  function renderChrome() {
    var top = $("#q-chrome-top"), bot = $("#q-chrome-bottom");
    if (top) top.outerHTML = headerHTML();
    if (bot) bot.outerHTML = footerHTML() + drawersHTML();
    applyModeClass();
    positionModePill(false);
  }

  /* ---------- mode switch ---------- */
  function applyModeClass() {
    var m = G.mode();
    document.documentElement.classList.toggle("mode-business", m === "business");
    document.documentElement.classList.toggle("mode-home", m === "home");
  }
  function positionModePill(animate) {
    var sw = $(".mode-switch"); if (!sw) return;
    var on = sw.querySelector('[aria-pressed="true"]'), pill = sw.querySelector(".mode-switch__pill");
    if (!on || !pill) return;
    var left = on.offsetLeft, width = on.offsetWidth;
    if (animate && live()) MO.animate(pill, { left: left + "px", width: width + "px" }, { type: "spring", stiffness: 420, damping: 26 });
    else { pill.style.left = left + "px"; pill.style.width = width + "px"; }
  }
  function setMode(m) {
    if (m === G.mode()) return;
    G.mode(m);
    applyModeClass();
    $$("[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === m)); });
    positionModePill(true);
    var ul = $("[data-nav]"), ulm = $("[data-nav-m]");
    function swapNav() { if (ul) ul.innerHTML = navItems(m); if (ulm) ulm.innerHTML = navItems(m, true); $$("[data-cta]").forEach(function (a) { a.href = CTA[m][0]; a.textContent = CTA[m][1]; }); }
    if (ul && live()) MO.swap(ul, swapNav, m === "business" ? 1 : -1); else swapNav();
    toast(m === "business" ? "Showing the site for your business: solutions, equipment and service." : "Showing the site for home: coffee, capsules and machines.");
    document.dispatchEvent(new CustomEvent("q:mode", { detail: m }));
  }

  /* ---------- drawers with focus trap ---------- */
  var openId = null, lastFocus = null;
  function focusables(el) { return $$('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])', el).filter(function (x) { return x.offsetParent !== null || x === document.activeElement; }); }
  function openPanel(id, opener) {
    var panel = document.getElementById(id), scrim = $("#scrim");
    if (!panel) return;
    if (openId && openId !== id) closePanel(true);
    lastFocus = opener || document.activeElement;
    panel.hidden = false; scrim.hidden = false;
    document.documentElement.style.overflow = "hidden";
    openId = id;
    $$('[data-open="' + id + '"]').forEach(function (b) { b.setAttribute("aria-expanded", "true"); });
    if (id === "search-panel") {
      if (live()) { MO.animate(panel, { y: ["-100%", "0%"] }, { type: "spring", stiffness: 300, damping: 32 }); MO.animate(scrim, { opacity: [0, 1] }, { duration: 0.25 }); }
    } else MO.drawer(panel, true, panel.getAttribute("data-side") || "right", scrim);
    if (id === "cart-drawer") renderCart();
    if (id === "search-panel") runSearch("");
    setTimeout(function () { var f = panel.querySelector("[data-autofocus]") || focusables(panel)[0]; if (f) f.focus(); }, 60);
  }
  function closePanel(instant) {
    if (!openId) return;
    var id = openId, panel = document.getElementById(id), scrim = $("#scrim");
    openId = null;
    $$('[data-open="' + id + '"]').forEach(function (b) { b.setAttribute("aria-expanded", "false"); });
    document.documentElement.style.overflow = "";
    function hide() { panel.hidden = true; if (!openId) scrim.hidden = true; panel.style.transform = ""; }
    if (instant || !live()) hide();
    else if (id === "search-panel") { MO.animate(scrim, { opacity: [1, 0] }, { duration: 0.2 }); MO.animate(panel, { y: ["0%", "-100%"] }, { duration: 0.25, ease: [0.55, 0, 1, 0.45] }).finished.then(hide); }
    else MO.drawer(panel, false, panel.getAttribute("data-side") || "right", scrim).then(hide);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function trapKeys(e) {
    if (!openId) return;
    if (e.key === "Escape") { e.preventDefault(); closePanel(); return; }
    if (e.key !== "Tab") return;
    var f = focusables(document.getElementById(openId)); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ---------- toast ---------- */
  function toast(msg, action) {
    var zone = $(".toast-zone"); if (!zone) return;
    var t = document.createElement("div");
    t.setAttribute("role", "status");
    t.style.cssText = "display:flex;gap:12px;align-items:center;justify-content:space-between;background:#1C2620;color:#F7F0E3;padding:12px 16px;border-radius:14px;box-shadow:0 14px 30px -12px rgba(0,0,0,.5);font-weight:600;font-size:15px;line-height:1.35";
    t.innerHTML = "<span>" + esc(msg) + "</span>" + (action ? '<button type="button" class="btn btn--yellow btn--sm" style="flex:none">' + esc(action[0]) + "</button>" : "");
    if (action) t.querySelector("button").addEventListener("click", function () { action[1](t); t.remove(); });
    zone.appendChild(t);
    if (live()) MO.animate(t, { y: [30, 0], opacity: [0, 1], scale: [0.92, 1] }, { type: "spring", stiffness: 420, damping: 22 });
    setTimeout(function () {
      if (!t.isConnected) return;
      if (live()) MO.animate(t, { opacity: 0, y: 12 }, { duration: 0.25 }).finished.then(function () { t.remove(); }); else t.remove();
    }, action ? 4200 : 2800);
  }

  /* ------------------------------------------------------------------
     Cart
     ------------------------------------------------------------------ */
  function updateCount() {
    var n = G.cart.count();
    $$("[data-cart-count]").forEach(function (el) { el.textContent = n; el.setAttribute("data-zero", n ? "false" : "true"); });
    var btn = $("#cart-btn"); if (btn) btn.setAttribute("aria-label", "Open bag, " + G.fmt.plural(n, "item"));
  }
  function freeShipHTML(s) {
    var pct = Math.min(100, Math.round((s.subtotal / G.pricing.FREE_SHIP_THRESHOLD) * 100));
    var msg = s.toFreeShipping > 0 ? "You are <b>" + money(s.toFreeShipping) + "</b> away from free shipping." : "<b>Free shipping unlocked.</b> Delivered in 3 business days across New England.";
    return '<div class="cart-ship"><p>' + msg + '</p><div class="progress" role="progressbar" aria-label="Progress to free shipping" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><div class="progress__bar" style="width:' + pct + '%"></div><span class="progress__dot" style="left:' + pct + '%"></span></div></div>';
  }
  function subLabel(w) { return w ? "Every " + w + " weeks · −10%" : ""; }
  function renderCart() {
    var body = $("#cart-body"), foot = $("#cart-foot"); if (!body) return;
    var s = G.cart.summary();
    if (!s.lines.length) {
      body.innerHTML = '<div class="cart-empty"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="#EFE4CF"/><path d="M30 52h52v14a26 26 0 0 1-52 0z" fill="#FFFBF4" stroke="#1C2620" stroke-width="3"/><path d="M82 56h6a9 9 0 0 1 0 18h-6" fill="none" stroke="#1C2620" stroke-width="3"/><path d="M24 98h66" stroke="#1C2620" stroke-width="3" stroke-linecap="round"/><path d="M48 30c-4 5 4 8 0 13M60 26c-4 5 4 8 0 13" stroke="#C2AE8A" stroke-width="3" fill="none" stroke-linecap="round"/></svg>' +
        '<h3>Your bag is empty</h3><p class="muted">Un caffè? Start with the blend Calabria drinks at home.</p><div class="row" style="justify-content:center"><a class="btn btn--red" href="shop.html#cat=coffee">Shop coffee</a><a class="btn btn--ghost" href="find.html">Find a café</a></div></div>';
      foot.innerHTML = '<p class="xs muted" style="margin:0">Free shipping on orders $59+ · Delivered in 3 business days across New England.</p>';
      return;
    }
    var stamps = stampsFor(s.lines);
    body.innerHTML = freeShipHTML(s) + s.lines.map(function (l) {
      var p = l.product;
      return '<div class="cline" data-line="' + p.slug + '|' + l.subscribe + '"><img src="' + productImg(p) + '" alt="" width="72" height="72" loading="lazy">' +
        '<div><a class="cline__name" href="' + G.linkTo("product.html", "slug", p.slug) + '">' + esc(shortName(p)) + '</a><p class="cline__meta">' + esc(formatText(p)) + "</p>" +
        (l.subscribe ? '<span class="cline__sub">' + icon("calendar") + subLabel(l.subscribe) + "</span><br>" : "") +
        '<div class="qty" role="group" aria-label="Quantity for ' + esc(p.name) + '"><button type="button" data-qty="-1" aria-label="Decrease quantity">' + icon("minus") + "</button><output>" + l.qty + '</output><button type="button" data-qty="1" aria-label="Increase quantity">' + icon("plus") + "</button></div>" +
        '<br><button type="button" class="cline__rm" data-rm>Remove</button></div>' +
        '<div class="cline__price">' + money(l.total) + (l.saved > 0 ? "<s>" + money(l.full) + "</s>" : "") + "</div></div>";
    }).join("") +
      (stamps ? '<div class="cart-stamps"><span class="mini-stamp">' + bullseye(30) + "</span><span>This order earns <strong>" + G.fmt.plural(stamps, "stamp") + "</strong> in Il Passaporto. Ten stamps = a free 250 g bag. <a href=\"rewards.html\">How it works</a> <em>(proposed)</em></span></div>" : "");
    foot.innerHTML = '<div class="sumrow"><span>Subtotal</span><span class="num">' + money(s.subtotal) + "</span></div>" +
      (s.saved > 0 ? '<div class="sumrow sumrow--save"><span>You save</span><span class="num">−' + money(s.saved) + "</span></div>" : "") +
      '<div class="sumrow"><span>Shipping</span><span class="num">' + (s.shipping ? money(s.shipping) : "Free") + "</span></div>" +
      '<div class="sumrow sumrow--total"><span>Total</span><span class="num" data-cart-total>' + money(s.total) + "</span></div>" +
      '<a class="btn btn--red btn--block btn--lg" href="checkout.html" style="margin-top:12px">Checkout' + icon("arrow") + "</a>" +
      '<p class="xs muted center" style="margin:8px 0 0">Apple Pay · Google Pay · PayPal · Shop Pay at checkout</p>';
  }
  function cartLineEvent(e) {
    var line = e.target.closest(".cline"); if (!line) return;
    var parts = line.getAttribute("data-line").split("|"), slug = parts[0], sub = Number(parts[1]) || 0;
    var item = G.cart.items().filter(function (i) { return i.slug === slug && (i.subscribe || 0) === sub; })[0];
    if (!item) return;
    var q = e.target.closest("[data-qty]");
    if (q) { G.cart.setQty(slug, Math.max(0, item.qty + Number(q.getAttribute("data-qty"))), sub); renderCart(); var nl = $('[data-line="' + slug + "|" + sub + '"] [data-qty="' + q.getAttribute("data-qty") + '"]'); if (nl) nl.focus(); else focusables($("#cart-drawer"))[0].focus(); return; }
    if (e.target.closest("[data-rm]")) {
      if (live()) MO.animate(line, { opacity: 0, x: 40 }, { duration: 0.22 }).finished.then(function () { G.cart.remove(slug, sub); renderCart(); var f = focusables($("#cart-drawer")); if (f[1]) f[1].focus(); });
      else { G.cart.remove(slug, sub); renderCart(); }
    }
  }
  /* add with flyToCart; opts {subscribe, qty, silent} */
  function addToCart(slug, fromEl, opts) {
    opts = opts || {};
    var p = G.products.bySlug(slug); if (!p) return false;
    var ok = G.cart.add(slug, opts.qty || 1, { subscribe: opts.subscribe || 0 });
    if (!ok) return false;
    var cartBtn = $("#cart-btn");
    var imgEl = fromEl && (fromEl.closest(".pcard, .buy, .pdp, [data-fly]") || fromEl);
    var src = productImg(p);
    if (cartBtn && fromEl) G.motion.flyToCart(imgEl.querySelector ? (imgEl.querySelector("img") || fromEl) : fromEl, cartBtn, src);
    if (fromEl && live()) MO.animate(fromEl, { scale: [1, 0.92, 1.04, 1] }, { duration: 0.45 });
    if (!opts.silent) toast("Added: " + shortName(p) + (opts.qty > 1 ? " × " + opts.qty : "") + (opts.subscribe ? " (every " + opts.subscribe + " weeks)" : ""), ["View bag", function () { openPanel("cart-drawer", cartBtn); }]);
    return true;
  }

  /* ------------------------------------------------------------------
     Search overlay
     ------------------------------------------------------------------ */
  var SUGG = ["Espresso Classico", "moka", "Nespresso", "ESE pods", "decaf", "Brasilena", "North End", "Rocket"];
  function runSearch(q) {
    var res = $("[data-results]"), sugg = $("[data-sugg]"); if (!res) return;
    q = (q || "").trim();
    sugg.innerHTML = SUGG.map(function (s) { return '<button type="button" class="chip" data-sugg-q="' + esc(s) + '">' + esc(s) + "</button>"; }).join("");
    var list, venues = [], ql = q.toLowerCase();
    if (!q) list = G.products.sort(G.products.filter({ category: ["coffee", "single-serve"], inStock: true }), "featured").slice(0, 6);
    else {
      var syn = { nespresso: "nespresso-original", moka: "ground", ese: "ese-44", pod: "pod", pods: "pod", capsule: "capsule", capsules: "capsule", beans: "beans", drip: "drip" };
      list = G.products.filter({ q: q });
      Object.keys(syn).forEach(function (k) { if (ql.indexOf(k) >= 0) list = list.concat(G.products.all().filter(function (p) { return p.system === syn[k] || p.format === syn[k] || (syn[k] === "drip" && /drip/.test(p.format || "")); })); });
      var seen = {}; list = list.filter(function (p) { if (seen[p.slug]) return false; seen[p.slug] = 1; return true; });
      list = G.products.sort(list, "featured").slice(0, 8);
      venues = G.locations().venues.filter(function (v) { return (v.name + " " + v.city + " " + v.blurb + " " + v.address + " " + v.type).toLowerCase().indexOf(ql) >= 0 || (ql === "north end" && v.zip === "02113"); }).slice(0, 5);
    }
    var pages = [["recipes.html", "Recipes: moka, shakerato, affogato, granita, tiramisù", "moka recipe shakerato affogato granita tiramisu brasilena float"], ["business.html", "For your business: tastings, machines, service", "business wholesale cafe restaurant office hotel lease service repair tasting"], ["rewards.html", "Il Passaporto: stamps, rewards, refer a friend", "loyalty rewards passaporto refer friend newsletter"], ["story.html", "Our family: Calabria 1943 to Boston 2000", "story family history calabria copanello 1943 elia"], ["find.html", "Find Guglielmo near you", "find map near zip venue cafe"]];
    var pg = q ? pages.filter(function (p) { return p[2].indexOf(ql) >= 0 || p[1].toLowerCase().indexOf(ql) >= 0; }) : pages.slice(0, 3);
    var html = "<div><h3>" + (q ? G.fmt.plural(list.length, "product") + " for “" + esc(q) + "”" : "Popular right now") + '</h3><ul class="sr-list">' +
      (list.length ? list.map(function (p) { return '<li><a class="sr-item" href="' + G.linkTo("product.html", "slug", p.slug) + '"><img src="' + productImg(p) + '" alt="" width="52" height="52" loading="lazy"><span><span class="t">' + esc(shortName(p)) + '</span><br><span class="m">' + esc(formatText(p)) + " · " + esc(fitsText(p)) + '</span></span><span class="p">' + (p.quote ? "Quote" : money(p.price)) + "</span></a></li>"; }).join("") : '<li class="muted">No products match. Try a blend name or a machine type.</li>') + "</ul></div>";
    html += "<div>" + (venues.length ? "<h3>Venues</h3><ul class=\"sr-list\">" + venues.map(function (v) { return '<li><a class="sr-item" href="find.html#' + encodeURIComponent(v.zip) + '"><span><span class="t">' + esc(v.name) + '</span><br><span class="m">' + esc(v.blurb) + " · " + esc(v.city) + "</span></span></a></li>"; }).join("") + "</ul>" : "") +
      (pg.length ? '<h3 style="margin-top:12px">Pages</h3><ul class="sr-list">' + pg.map(function (p) { return '<li><a class="sr-item" href="' + p[0] + '"><span class="t">' + esc(p[1]) + "</span></a></li>"; }).join("") + "</ul>" : "") + "</div>";
    res.innerHTML = html;
  }

  /* ------------------------------------------------------------------
     Notify-me + newsletter + generic demo forms
     ------------------------------------------------------------------ */
  function notifyToggle(btn) {
    var cardEl = btn.closest(".pcard") || btn.parentElement;
    var existing = cardEl.querySelector(".notify");
    if (existing) { existing.remove(); btn.setAttribute("aria-expanded", "false"); return; }
    var id = nid("nt");
    var f = document.createElement("form");
    f.className = "notify";
    f.innerHTML = '<label class="sr-only" for="' + id + '">Email for back-in-stock alert</label><input class="input" id="' + id + '" type="email" name="email" required placeholder="Email me when it is back"><button class="btn btn--green btn--sm" type="submit">Notify me</button>';
    btn.closest(".pcard__foot") ? btn.closest(".pcard__foot").after(f) : btn.after(f);
    btn.setAttribute("aria-expanded", "true");
    G.forms.demo(f, function () { f.innerHTML = '<p class="xs" role="status" style="margin:0;font-weight:700;color:#1E4A37">' + icon("check") + " We will email you when it is back.</p>"; });
    f.querySelector("input").focus();
  }
  function successHTML(title, text) { return '<div class="form-success" role="status">' + icon("check") + "<div><strong>" + esc(title) + "</strong><p>" + text + "</p></div></div>"; }
  function wireNews() {
    $$("form[data-news]").forEach(function (f) {
      G.forms.demo(f, function (d) {
        var ok = f.querySelector(".news-ok");
        f.querySelector(".news-row").hidden = true;
        ok.innerHTML = successHTML("Grazie!", "Check " + esc(d.email || "your inbox") + " to confirm. Your first letter arrives with this month’s recipe.");
        if (live()) MO.animate(ok.firstChild, { scale: [0.9, 1], opacity: [0, 1] }, { type: "spring", stiffness: 400, damping: 20 });
      });
    });
  }

  /* ------------------------------------------------------------------
     Neighborhood map (Greater Boston), shared by home / find / community
     ------------------------------------------------------------------ */
  var HOOD_LABELS = ["North End", "East Boston", "South Boston", "Back Bay", "Charlestown", "Brighton", "Allston", "Dorchester", "Jamaica Plain", "South End", "Roxbury"];
  function makeMap(host, opts) {
    opts = opts || {};
    var data = G.map.data("boston"); if (!data || !host) return null;
    var venues = opts.venues || G.locations().venues;
    var api = { host: host, pins: [], view: [0, 0, 1000, 530], anim: null };
    var base = G.map.svg("boston", { water: "#BCD3CF", land: "#F1E8D6", district: "#E7D8BC", stroke: "#C2AE8A", strokeWidth: 0.9, className: "qmap__svg" });
    host.innerHTML = '<div class="qmap" data-map>' + base + (opts.controls !== false ? '<div class="qmap__controls"><button type="button" data-z="in" aria-label="Zoom in">' + icon("zoomin") + '</button><button type="button" data-z="out" aria-label="Zoom out">' + icon("zoomout") + '</button><button type="button" data-z="fit" aria-label="Show all venues">' + icon("reset") + "</button></div>" : "") +
      (opts.legend !== false ? '<div class="qmap__legend" aria-hidden="true"><span class="tag tag--cafe">Café</span><span class="tag tag--restaurant">Restaurant</span><span class="tag tag--pastry">Pastry</span></div>' : "") +
      (opts.north ? '<div class="qmap__north"><strong>↑ North Shore</strong>' + opts.north + "</div>" : "") +
      '<span class="qmap__credit">Map data: City of Boston, US Census</span></div>';
    var wrap = host.querySelector(".qmap"), svg = wrap.querySelector("svg");
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-label", opts.label || "Map of Greater Boston with the venues that pour Guglielmo");
    svg.querySelectorAll("path").forEach(function (p) { if (p.getAttribute("stroke") === "#C2AE8A") p.classList.add("qmap__hood"); });
    var NS = "http://www.w3.org/2000/svg";
    var labels = document.createElementNS(NS, "g"); labels.setAttribute("class", "qmap__labels"); labels.setAttribute("aria-hidden", "true");
    var pinsG = document.createElementNS(NS, "g"); pinsG.setAttribute("class", "qmap__pins");
    svg.appendChild(labels); svg.appendChild(pinsG);
    api.svg = svg; api.wrap = wrap; api.pinsG = pinsG;
    // labels: towns from data + a few neighborhoods (bbox centers)
    (data.labels || []).forEach(function (l) {
      var pt = G.map.project("boston", l.lat, l.lng); if (!pt || !pt.inside || l.t === "Boston") return;
      var t = document.createElementNS(NS, "text"); t.setAttribute("x", pt.x); t.setAttribute("y", pt.y); t.setAttribute("text-anchor", "middle"); t.setAttribute("class", "qmap__label qmap__label--town"); t.textContent = l.t; labels.appendChild(t);
    });
    requestAnimationFrame(function () {
      svg.querySelectorAll("path title").forEach(function (tt) {
        if (HOOD_LABELS.indexOf(tt.textContent) < 0) return;
        try {
          var b = tt.parentNode.getBBox(), t = document.createElementNS(NS, "text");
          t.setAttribute("x", b.x + b.width / 2); t.setAttribute("y", b.y + b.height / 2 + 4); t.setAttribute("text-anchor", "middle"); t.setAttribute("class", "qmap__label"); t.textContent = tt.textContent; labels.appendChild(t);
        } catch (e) {}
      });
    });
    var bay = document.createElementNS(NS, "text"); bay.setAttribute("x", 960); bay.setAttribute("y", 470); bay.setAttribute("text-anchor", "end"); bay.setAttribute("class", "qmap__label qmap__label--water"); bay.textContent = "Boston Harbor"; labels.appendChild(bay);

    function pinScale() { var w = svg.clientWidth || 600; return Math.max(0.22, Math.min(2.2, api.view[2] / w)); }
    function setView(v) {
      api.view = v;
      svg.setAttribute("viewBox", v.map(function (n) { return n.toFixed(2); }).join(" "));
      var k = pinScale().toFixed(3);
      api.pins.forEach(function (p) { p.scaleG.setAttribute("transform", "scale(" + k + ")"); });
      if (api.you) api.you.querySelector(".pin__scale").setAttribute("transform", "scale(" + k + ")");
    }
    function aspect() { var r = svg.getBoundingClientRect(); return r.width && r.height ? r.width / r.height : 1000 / 600; }
    function boundsView(pts, pad, minW) {
      pad = pad == null ? 70 : pad; minW = minW || 180;
      var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
      var x0 = Math.min.apply(null, xs) - pad, x1 = Math.max.apply(null, xs) + pad, y0 = Math.min.apply(null, ys) - pad * 1.3, y1 = Math.max.apply(null, ys) + pad * 0.7;
      var w = Math.max(minW, x1 - x0), h = Math.max(minW / 2, y1 - y0), a = aspect();
      if (w / h > a) h = w / a; else w = h * a;
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      return [cx - w / 2, cy - h / 2, w, h];
    }
    function animateView(to, dur) {
      if (api.anim && api.anim.stop) api.anim.stop();
      var from = api.view.slice();
      if (!live() || !M) { setView(to); return; }
      api.anim = M.animate(0, 1, { duration: dur || 0.85, ease: [0.22, 1, 0.36, 1], onUpdate: function (t) { setView(from.map(function (f, i) { return f + (to[i] - f) * t; })); } });
    }
    api.setView = setView; api.animateView = animateView; api.boundsView = boundsView;

    // pins
    venues.forEach(function (v, i) {
      var pt = G.map.project("boston", v.lat, v.lng);
      var g = document.createElementNS(NS, "g");
      g.setAttribute("class", "pin pin--" + v.type);
      g.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
      g.setAttribute("tabindex", pt.inside ? "0" : "-1");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", v.name + ", " + (TYPE_LABEL[v.type] || v.type) + ", " + v.address + ", " + v.city);
      var col = AWNING[v.type];
      g.innerHTML = '<g class="pin__scale"><ellipse class="pin__shadow" cx="0" cy="0" rx="9" ry="3.2"/><g class="pin__body">' +
        '<circle class="pin__halo" cx="0" cy="-30" r="21"/><path d="M0 0 L-6 -16 L6 -16Z" fill="' + col + '" stroke="#1C2620" stroke-width="2" stroke-linejoin="round"/>' +
        '<circle cx="0" cy="-30" r="16" fill="#F5821F" stroke="#1C2620" stroke-width="2.4"/><circle cx="0" cy="-30" r="10.5" fill="#FFF200"/><circle cx="0" cy="-30" r="5" fill="#ED1C24"/>' +
        '<circle cx="11" cy="-41" r="5.5" fill="' + col + '" stroke="#FFFBF4" stroke-width="2"/></g>' +
        '<text class="pin__label" x="0" y="-54" text-anchor="middle">' + esc(venueShort(v) + (v.name.indexOf(" — ") > 0 ? " · " + v.name.split(" — ")[1] : "")) + "</text></g>";
      if (!pt.inside) g.style.display = "none";
      pinsG.appendChild(g);
      var pin = { v: v, i: i, el: g, pt: pt, body: g.querySelector(".pin__body"), scaleG: g.querySelector(".pin__scale"), inside: pt.inside };
      api.pins.push(pin);
      g.addEventListener("click", function () { if (opts.onSelect) opts.onSelect(v, i, "map"); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (opts.onSelect) opts.onSelect(v, i, "map"); } });
    });

    api.visiblePins = function () { return api.pins.filter(function (p) { return p.inside && p.el.style.display !== "none"; }); };
    api.fit = function (animate, pts) {
      var list = pts || api.visiblePins().map(function (p) { return p.pt; });
      if (!list.length) list = api.pins.filter(function (p) { return p.inside; }).map(function (p) { return p.pt; });
      var v = boundsView(list, opts.pad || 60, 160);
      if (animate) animateView(v); else setView(v);
    };
    api.focusOn = function (pt, width) {
      var a = aspect(), w = width || 240, h = w / a;
      animateView([pt.x - w / 2, pt.y - h * 0.58, w, h]);
    };
    api.select = function (idx, zoom) {
      api.pins.forEach(function (p) { p.el.classList.toggle("is-active", p.i === idx); });
      var p = api.pins[idx]; if (!p) return;
      pinsG.appendChild(p.el);
      if (p.inside && zoom !== false) api.focusOn(p.pt, opts.zoomWidth || 240);
      if (live()) MO.animate(p.body, { y: [-18, 0], scale: [1.25, 1] }, { type: "spring", stiffness: 520, damping: 13 });
    };
    api.clear = function () { api.pins.forEach(function (p) { p.el.classList.remove("is-active"); }); };
    api.show = function (pred) { api.pins.forEach(function (p) { p.el.style.display = p.inside && pred(p.v) ? "" : "none"; }); };
    /* friendly bounce: pins drop in with a spring stagger */
    api.drop = function () {
      var bodies = api.visiblePins().map(function (p) { return p.body; });
      if (!live() || !bodies.length) return;
      MO.animate(bodies, { y: [-70, 0], opacity: [0, 1], rotate: [-14, 0] }, { type: "spring", stiffness: 480, damping: 15, mass: 0.9, delay: G.motion.stagger(0.055) });
    };
    api.you = null;
    api.setYou = function (lat, lng, label) {
      if (api.you) api.you.remove();
      var pt = G.map.project("boston", lat, lng);
      var g = document.createElementNS(NS, "g");
      g.setAttribute("class", "pin pin--you"); g.setAttribute("transform", "translate(" + pt.x + " " + pt.y + ")"); g.setAttribute("aria-hidden", "true");
      g.innerHTML = '<g class="pin__scale" transform="scale(' + pinScale() + ')"><g class="pin__body"><circle class="pin__you" r="10"/><circle r="22" fill="none" stroke="#1E4A37" stroke-width="2" stroke-dasharray="4 4"/></g><text class="pin__label" style="opacity:1" y="-30" text-anchor="middle">' + esc(label || "You") + "</text></g>";
      pinsG.insertBefore(g, pinsG.firstChild);
      api.you = g;
      if (live()) MO.animate(g.querySelector(".pin__body"), { scale: [0, 1.2, 1] }, { duration: 0.6 });
      return pt;
    };
    // controls
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("[data-z]"); if (!b) return;
      var z = b.getAttribute("data-z"), v = api.view;
      if (z === "fit") { api.clear(); api.fit(true); if (opts.onReset) opts.onReset(); return; }
      var f = z === "in" ? 0.65 : 1.5, w = Math.min(1400, Math.max(110, v[2] * f)), h = w * (v[3] / v[2]);
      animateView([v[0] + v[2] / 2 - w / 2, v[1] + v[3] / 2 - h / 2, w, h], 0.5);
    });
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { api.fit(false); }, 160); });
    requestAnimationFrame(function () { api.fit(false); });
    api.fit(false);
    if (opts.dropOnView !== false && live() && M && M.inView) {
      api.pins.forEach(function (p) { if (p.inside) p.body.style.opacity = "1"; });
      M.inView(wrap, function () { api.drop(); }, { amount: 0.35 });
    }
    return api;
  }

  /* US distributor map */
  function makeUSMap(host, opts) {
    opts = opts || {};
    var NS = "http://www.w3.org/2000/svg";
    host.innerHTML = G.map.svg("us", { water: "#BCD3CF", land: "#F1E8D6", stroke: "#C2AE8A", strokeWidth: 0.8, className: "qmap__svg" });
    var svg = host.querySelector("svg");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Map of the United States: Guglielmo distributors in Massachusetts, Illinois and Pennsylvania");
    var hi = { Massachusetts: "#2D6A4F", Illinois: "#F5821F", Pennsylvania: "#F5821F" };
    svg.querySelectorAll("path").forEach(function (p) { var t = p.querySelector("title"); if (t && hi[t.textContent]) { p.setAttribute("fill", hi[t.textContent]); p.setAttribute("stroke", "#1C2620"); p.setAttribute("stroke-width", "1.4"); } });
    var g = document.createElementNS(NS, "g"); svg.appendChild(g);
    var bodies = [];
    G.locations().distributors.forEach(function (d, i) {
      var pt = G.map.project("us", d.lat, d.lng), e = document.createElementNS(NS, "g");
      e.setAttribute("transform", "translate(" + pt.x + " " + pt.y + ")");
      e.innerHTML = '<g class="pin__body"><path d="M0 0 L-5 -12 L5 -12Z" fill="#1C2620"/><circle cx="0" cy="-22" r="12" fill="#F5821F" stroke="#1C2620" stroke-width="2"/><circle cx="0" cy="-22" r="8" fill="#FFF200"/><circle cx="0" cy="-22" r="3.8" fill="#ED1C24"/></g>' +
        '<text x="' + (i === 0 ? 0 : 0) + '" y="' + (i === 0 ? -42 : 18) + '" text-anchor="middle" class="pin__label" style="opacity:1">' + esc(d.state === "MA" ? "Boston HQ" : d.city + ", " + d.state) + "</text>";
      g.appendChild(e); bodies.push(e.querySelector(".pin__body"));
    });
    (opts.letters || []).forEach(function (l) {
      var pt = G.map.project("us", l.lat, l.lng), e = document.createElementNS(NS, "g");
      e.setAttribute("transform", "translate(" + pt.x + " " + pt.y + ")");
      e.innerHTML = '<g class="pin__body"><circle r="6" fill="#FFFBF4" stroke="#B3141B" stroke-width="2.5"/><circle r="2" fill="#B3141B"/></g><text x="' + (l.dx || 10) + '" y="' + (l.dy || 4) + '" text-anchor="' + (l.anchor || "start") + '" class="pin__label" style="opacity:1;font-size:12px">' + esc(l.t) + "</text>";
      g.appendChild(e); bodies.push(e.querySelector(".pin__body"));
    });
    if (live() && M && M.inView) M.inView(host, function () { MO.animate(bodies, { y: [-50, 0], opacity: [0, 1] }, { type: "spring", stiffness: 460, damping: 15, delay: G.motion.stagger(0.12) }); }, { amount: 0.4 });
  }

  /* ------------------------------------------------------------------
     Global events
     ------------------------------------------------------------------ */
  function wireGlobal() {
    document.addEventListener("click", function (e) {
      var t = e.target;
      var op = t.closest("[data-open]"); if (op) { e.preventDefault(); openPanel(op.getAttribute("data-open"), op); return; }
      if (t.closest("[data-close]") || t.id === "scrim") { closePanel(); return; }
      var md = t.closest("[data-mode]"); if (md) { setMode(md.getAttribute("data-mode")); return; }
      var add = t.closest("[data-add]"); if (add) { e.preventDefault(); addToCart(add.getAttribute("data-add"), add, { qty: Number(add.getAttribute("data-qty")) || 1, subscribe: Number(add.getAttribute("data-sub")) || 0 }); return; }
      var nt = t.closest("[data-notify]"); if (nt) { notifyToggle(nt); return; }
      var sg = t.closest("[data-sugg-q]"); if (sg) { var inp = $("#q-search"); inp.value = sg.getAttribute("data-sugg-q"); runSearch(inp.value); inp.focus(); return; }
      if (t.closest("#cart-body")) cartLineEvent(e);
      // close drawers when following an in-page link inside them
      if (openId && t.closest("#nav-drawer a, #search-panel a")) closePanel(true);
    });
    document.addEventListener("keydown", trapKeys);
    var si = $("#q-search");
    if (si) { si.addEventListener("input", function () { runSearch(si.value); }); }
    var sf = $("[data-search-form]"); if (sf) sf.addEventListener("submit", function (e) { e.preventDefault(); var a = $("[data-results] a"); if (a) a.click(); });
    G.cart.onChange(function () { updateCount(); if (openId === "cart-drawer") renderCart(); });
    window.addEventListener("resize", function () { positionModePill(false); });
    // header shadow once scrolled
    var hdr = $("#site-header");
    var onScroll = function () { if (hdr) hdr.classList.toggle("is-scrolled-shadow", window.scrollY > 40); };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    wireNews();
    updateCount();
  }

  /* ------------------------------------------------------------------
     Public API for page modules
     ------------------------------------------------------------------ */
  window.Q = {
    icon: icon, esc: esc, money: money, $: $, $$: $$, nid: nid, live: live,
    bullseye: bullseye, postmark: postmark, shopfront: shopfront, recipeArt: recipeArt, stampInk: stampInk, tileSVG: tileSVG,
    SYS: SYS, TYPE_LABEL: TYPE_LABEL, fitsKey: fitsKey, fitsText: fitsText, formatText: formatText, blendName: blendName, cleanNote: cleanNote, roastShort: roastShort,
    intensityHTML: intensityHTML, productImg: productImg, perUnit: perUnit, isStampable: isStampable, stampsFor: stampsFor, shortName: shortName, card: card,
    venueShort: venueShort, venuePlace: venuePlace,
    addToCart: addToCart, openPanel: openPanel, closePanel: closePanel, renderCart: renderCart, toast: toast, successHTML: successHTML,
    makeMap: makeMap, makeUSMap: makeUSMap, after: []
  };

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  installTiles();
  injectSprite();
  renderChrome();
  wireGlobal();
  var pageFn = (window.Q_PAGES || {})[PAGE];
  if (pageFn) { try { pageFn(window.Q); } catch (err) { if (window.console) console.error(err); } }

  /* Friendly bounce: springy, warm, never frantic. */
  if (G.motion && G.motion.tokens) {
    G.motion.tokens.spring = { type: "spring", stiffness: 520, damping: 22, mass: 0.85 };
    G.motion.tokens.springSoft = { type: "spring", stiffness: 260, damping: 15, mass: 0.9 };
  }
  G.motion.init({ ease: [0.34, 1.3, 0.64, 1], duration: 0.62, distance: 22 });
  window.Q.after.forEach(function (fn) { try { fn(); } catch (err) { if (window.console) console.error(err); } });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { positionModePill(false); });
})();
