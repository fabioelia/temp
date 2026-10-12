/*!
 * GUSA Motion — the shared motion layer for the Guglielmo USA concepts, built on Motion (motion.dev).
 *
 * Load order on every page:
 *   <script src="https://cdn.jsdelivr.net/npm/motion@12.23.24/dist/motion.js"></script>
 *   <script src="../../assets/js/gusa-kit.js"></script>
 *   <script src="../../assets/js/gusa-motion.js"></script>
 *   then call GUSA.motion.init({ ...concept tuning }) from js/site.js after rendering.
 *
 * Rules this layer enforces:
 *  - Content is complete and visible at rest. Nothing is hidden waiting for an observer: an element only takes its
 *    "from" pose at the moment it enters the viewport, then settles to rest.
 *  - prefers-reduced-motion → every helper resolves instantly (no transforms, no parallax, no counters).
 *  - If Motion fails to load, every helper is a safe no-op.
 *
 * Declarative API (attributes on any element):
 *   data-m="rise|fade|scale|slide-l|slide-r|clip|ring|tilt"   enter animation when scrolled into view
 *   data-m-delay="0.1"                                     extra delay (s)
 *   data-m-stagger="0.06"   on a parent: animate its direct children in sequence when it enters view
 *   data-m-hero             on the hero: children with [data-m-order] play a load sequence (by order)
 *   data-m-split            on a heading: words rise in one by one (keeps text selectable & accessible)
 *   data-m-count="1943"     numbers count up to the value on enter (supports data-m-prefix/suffix/decimals)
 *   data-m-parallax="0.12"  image/element drifts with scroll inside its container (fraction of viewport)
 *   data-m-progress         element scales on X with page scroll progress (reading/scroll bar)
 *   data-m-hover="lift|grow|tilt"   pointer hover micro-interaction
 *   data-m-press            springy press feedback on buttons
 *   data-m-marquee="40"     continuous horizontal marquee (seconds per loop); duplicate content inside yourself
 */
(function () {
  "use strict";

  var M = window.Motion || null;
  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var live = !!(M && M.animate) && !reduce;

  var T = {
    ease: [0.22, 1, 0.36, 1],          // "espresso pour": fast start, long soft settle
    easeIn: [0.55, 0, 1, 0.45],
    dur: 0.7,
    distance: 28,
    spring: { type: "spring", stiffness: 380, damping: 28, mass: 0.9 },
    springSoft: { type: "spring", stiffness: 160, damping: 22 }
  };

  function els(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }
  function done() { return Promise.resolve(); }

  function animate(target, keyframes, options) {
    if (!live || !target) return { finished: done(), stop: function () {}, then: function (f) { return done().then(f); } };
    return M.animate(target, keyframes, options);
  }

  var POSES = {
    rise: function (d) { return { opacity: [0.001, 1], y: [d, 0] }; },
    fade: function () { return { opacity: [0.001, 1] }; },
    scale: function () { return { opacity: [0.001, 1], scale: [0.94, 1] }; },
    "slide-l": function (d) { return { opacity: [0.001, 1], x: [-d * 1.4, 0] }; },
    "slide-r": function (d) { return { opacity: [0.001, 1], x: [d * 1.4, 0] }; },
    clip: function () { return { clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"] }; },
    ring: function () { return { opacity: [0.001, 1], scale: [0.6, 1], rotate: [-12, 0] }; },
    tilt: function (d) { return { opacity: [0.001, 1], y: [d, 0], rotateX: [12, 0] }; }
  };

  /* Enter-on-view: the element stays at rest until it enters, then plays from its pose. */
  function onEnter(el, play, opts) {
    if (!live) return;
    var fired = false;
    M.inView(el, function () {
      if (fired) return;
      fired = true;
      play(el);
    }, { amount: (opts && opts.amount) || 0.12, margin: "0px 0px -6% 0px" });
  }

  function reveal(el) {
    var kind = el.getAttribute("data-m") || "rise";
    var pose = (POSES[kind] || POSES.rise)(T.distance);
    var delay = num(el.getAttribute("data-m-delay"), 0);
    onEnter(el, function () { animate(el, pose, { duration: T.dur, ease: T.ease, delay: delay }); });
  }

  function staggerGroup(el) {
    var gap = num(el.getAttribute("data-m-stagger"), 0.06);
    var kids = Array.prototype.slice.call(el.children);
    if (!kids.length) return;
    onEnter(el, function () {
      animate(kids, { opacity: [0.001, 1], y: [T.distance * 0.8, 0] }, { duration: T.dur, ease: T.ease, delay: M.stagger(gap) });
    });
  }

  function splitWords(el) {
    if (el.getAttribute("data-m-split-done")) return;
    var text = el.textContent;
    el.setAttribute("aria-label", text.trim());
    el.setAttribute("data-m-split-done", "1");
    var html = "";
    text.split(/(\s+)/).forEach(function (w) {
      if (/^\s+$/.test(w) || !w) { html += w; return; }
      html += '<span class="m-word" aria-hidden="true" style="display:inline-block;will-change:transform">' +
        w.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }) + "</span>";
    });
    el.innerHTML = html;
  }
  function split(el, delay) {
    if (!live) return;
    splitWords(el);
    var words = els(".m-word", el);
    return animate(words, { opacity: [0.001, 1], y: ["0.45em", "0em"], rotate: [3, 0] },
      { duration: 0.8, ease: T.ease, delay: M.stagger(0.055, { startDelay: delay || 0 }) });
  }

  function hero(root) {
    if (!live) return;
    var items = els("[data-m-order]", root).sort(function (a, b) { return num(a.getAttribute("data-m-order"), 0) - num(b.getAttribute("data-m-order"), 0); });
    items.forEach(function (el, i) {
      var d = 0.08 + i * 0.12;
      if (el.hasAttribute("data-m-split")) { split(el, d); return; }
      var kind = el.getAttribute("data-m") || "rise";
      animate(el, (POSES[kind] || POSES.rise)(T.distance), { duration: 0.9, ease: T.ease, delay: d });
    });
  }

  function formatCount(v, el) {
    var dec = num(el.getAttribute("data-m-decimals"), 0);
    var raw = el.getAttribute("data-m-count") || "";
    var parts = Number(v).toFixed(dec).split(".");
    var group = el.getAttribute("data-m-grouping") !== "off" && !/^(19|20)\d\d$/.test(raw);
    if (group) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (el.getAttribute("data-m-prefix") || "") + parts.join(".") + (el.getAttribute("data-m-suffix") || "");
  }
  function counter(el) {
    var to = num(el.getAttribute("data-m-count"), 0);
    el.textContent = formatCount(to, el);          // final value is the resting state
    var isYear = /^(19|20)\d\d$/.test(String(to));
    var from = num(el.getAttribute("data-m-from"), isYear ? to - 60 : 0);
    onEnter(el, function () {
      if (!M.animate) return;
      M.animate(from, to, { duration: isYear ? 1.4 : 1.1, ease: T.ease, onUpdate: function (v) { el.textContent = formatCount(v, el); } });
    }, { amount: 0.6 });
  }

  function parallax(el) {
    if (!live || !M.scroll) return;
    var k = num(el.getAttribute("data-m-parallax"), 0.12);
    var host = el.parentElement || el;
    var range = Math.round(k * 100);
    M.scroll(animate(el, { y: [-range + "px", range + "px"] }, { ease: "linear" }), { target: host, offset: ["start end", "end start"] });
  }

  function progress(el) {
    if (!live || !M.scroll) return;
    el.style.transformOrigin = "0 50%";
    M.scroll(animate(el, { scaleX: [0, 1] }, { ease: "linear" }));
  }

  function hoverFx(el) {
    if (!live || !M.hover) return;
    var kind = el.getAttribute("data-m-hover") || "lift";
    M.hover(el, function () {
      if (kind === "grow") animate(el, { scale: 1.03 }, T.springSoft);
      else if (kind === "tilt") animate(el, { rotate: -1.2, y: -4 }, T.springSoft);
      else animate(el, { y: -6 }, T.springSoft);
      return function () { animate(el, { y: 0, scale: 1, rotate: 0 }, T.springSoft); };
    });
  }

  function pressFx(el) {
    if (!live || !M.press) return;
    M.press(el, function () {
      animate(el, { scale: 0.95 }, T.spring);
      return function () { animate(el, { scale: 1 }, T.spring); };
    });
  }

  function marquee(el) {
    if (!live) return;
    var secs = num(el.getAttribute("data-m-marquee"), 40);
    animate(el, { x: ["0%", "-50%"] }, { duration: secs, ease: "linear", repeat: Infinity });
  }

  /* ---------- imperative helpers for commerce moments ---------- */

  /* Product image flies along an arc into the cart icon, then the badge springs. */
  function flyToCart(fromEl, cartEl, imgSrc) {
    if (!fromEl || !cartEl) return done();
    var badge = cartEl.querySelector("[data-cart-count]") || cartEl;
    if (!live) return done();
    var a = fromEl.getBoundingClientRect(), b = cartEl.getBoundingClientRect();
    var ghost = document.createElement(imgSrc ? "img" : "div");
    if (imgSrc) { ghost.src = imgSrc; ghost.alt = ""; }
    var size = Math.min(110, Math.max(48, a.width * 0.35));
    ghost.setAttribute("aria-hidden", "true");
    ghost.style.cssText = "position:fixed;z-index:9999;pointer-events:none;object-fit:contain;border-radius:50%;width:" + size + "px;height:" + size + "px;left:" +
      (a.left + a.width / 2 - size / 2) + "px;top:" + (a.top + a.height / 2 - size / 2) + "px;background:" + (imgSrc ? "transparent" : "currentColor");
    document.body.appendChild(ghost);
    var dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    return M.animate(ghost, { x: [0, dx * 0.35, dx], y: [0, dy - 120, dy], scale: [1, 0.8, 0.18], opacity: [1, 1, 0.2] },
      { duration: 0.75, ease: T.ease }).finished.then(function () {
        ghost.remove();
        return bump(badge);
      });
  }

  function bump(el) {
    return animate(el, { scale: [1, 1.35, 1] }, { duration: 0.45, ease: T.ease }).finished;
  }

  /* Drawer / sheet: side = "right" | "left" | "bottom". Toggle [hidden] yourself before opening / after closing. */
  function drawer(panel, open, side, scrim) {
    side = side || "right";
    var axis = side === "bottom" ? "y" : "x";
    var off = side === "left" ? "-100%" : "100%";
    if (scrim) animate(scrim, { opacity: open ? [0, 1] : [1, 0] }, { duration: 0.25 });
    var kf = {}; kf[axis] = open ? [off, "0%"] : ["0%", off];
    return animate(panel, kf, open ? { type: "spring", stiffness: 300, damping: 34 } : { duration: 0.28, ease: T.easeIn }).finished;
  }

  /* Count a number element from its current value to a new one (calculators, totals). */
  function number(el, to, fmtFn) {
    fmtFn = fmtFn || function (v) { return Math.round(v).toLocaleString("en-US"); };
    var from = num(el.getAttribute("data-m-value"), 0);
    el.setAttribute("data-m-value", to);
    if (!live) { el.textContent = fmtFn(to); return done(); }
    return M.animate(from, to, { duration: 0.6, ease: T.ease, onUpdate: function (v) { el.textContent = fmtFn(v); } }).finished;
  }

  /* Bullseye "hit": concentric rings ripple out from an element (the brand's "il caffè che fa centro"). */
  function bullseye(el, colors) {
    if (!el) return done();
    if (!live) return done();
    colors = colors || ["#ED1C24", "#FFF200", "#F5821F"];
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var size = Math.max(r.width, r.height);
    var rings = colors.map(function (c, i) {
      var d = document.createElement("div");
      d.setAttribute("aria-hidden", "true");
      d.style.cssText = "position:fixed;pointer-events:none;z-index:9998;border-radius:50%;border:" + (6 - i) + "px solid " + c +
        ";width:" + size + "px;height:" + size + "px;left:" + (cx - size / 2) + "px;top:" + (cy - size / 2) + "px";
      document.body.appendChild(d);
      return d;
    });
    return Promise.all(rings.map(function (d, i) {
      return M.animate(d, { scale: [0.2, 2.2 + i * 0.5], opacity: [1, 0] }, { duration: 0.9, delay: i * 0.09, ease: T.ease }).finished
        .then(function () { d.remove(); });
    }));
  }

  /* Swap content with a quick cross-fade/slide (quiz steps, tabs, filter results). */
  function swap(container, render, dir) {
    if (!live) { render(); return done(); }
    var d = (dir || 1) * 18;
    return M.animate(container, { opacity: 0, x: -d }, { duration: 0.16, ease: T.easeIn }).finished.then(function () {
      render();
      return M.animate(container, { opacity: [0, 1], x: [d, 0] }, { duration: 0.35, ease: T.ease }).finished;
    });
  }

  /* Re-animate a list after filtering (cards settle into place). */
  function list(items) {
    if (!live || !items || !items.length) return done();
    return M.animate(items, { opacity: [0.001, 1], y: [14, 0], scale: [0.98, 1] },
      { duration: 0.45, ease: T.ease, delay: M.stagger(0.025, { startDelay: 0.02 }) }).finished;
  }

  /* Scroll-linked value 0→1 for a section (for bespoke scenes). Returns a stop fn. */
  function scrub(target, onProgress, offset) {
    if (!live || !M.scroll) { onProgress(1); return function () {}; }
    return M.scroll(function (p) { onProgress(p); }, { target: target, offset: offset || ["start end", "end start"] });
  }

  function init(opts) {
    opts = opts || {};
    if (opts.ease) T.ease = opts.ease;
    if (opts.duration) T.dur = opts.duration;
    if (opts.distance != null) T.distance = opts.distance;
    document.documentElement.classList.toggle("m-live", live);
    document.documentElement.classList.toggle("m-reduced", reduce);
    if (!live) return;
    els("[data-m-hero]").forEach(hero);
    els("[data-m-split]").forEach(function (el) {
      if (el.closest("[data-m-hero]")) return;
      onEnter(el, function () { split(el, 0); });
    });
    els("[data-m]").forEach(function (el) { if (!el.closest("[data-m-hero]") || !el.hasAttribute("data-m-order")) reveal(el); });
    els("[data-m-stagger]").forEach(staggerGroup);
    els("[data-m-count]").forEach(counter);
    els("[data-m-parallax]").forEach(parallax);
    els("[data-m-progress]").forEach(progress);
    els("[data-m-hover]").forEach(hoverFx);
    els("[data-m-press]").forEach(pressFx);
    els("[data-m-marquee]").forEach(marquee);
  }

  var api = {
    lib: M, live: live, reduced: reduce, tokens: T, init: init, animate: animate,
    reveal: reveal, split: split, hero: hero, counter: counter,
    flyToCart: flyToCart, bump: bump, drawer: drawer, number: number, bullseye: bullseye,
    swap: swap, list: list, scrub: scrub,
    stagger: function (g, o) { return M && M.stagger ? M.stagger(g, o) : 0; },
    spring: T.spring
  };
  window.GUSA = window.GUSA || {};
  window.GUSA.motion = api;
})();
