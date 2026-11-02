// Runs in the page's own JavaScript world (injected on demand). Finds caption files the page loads
// over the network: whole .vtt/.srt files and HLS WebVTT segment playlists. Text is fetched with the
// page's own credentials; nothing is sent anywhere else.
(() => {
  if (window.__dubNet) return;
  // TTML / DFXP / IMSC -> caption cues [{ start, end, text, speaker }], using DOMParser.
  // Handles clock times (HH:MM:SS.fff, HH:MM:SS:FF frames), offset times (12.5s, 300ms, 1h, 25f, 12345678t ticks),
  // begin/end/dur, begin offsets inherited from enclosing <body>/<div>, <br/> line breaks, nested <span>s,
  // and speaker names from ttm:agent (IMSC) or ttm:role="speaker"-style spans.
  function ttmlToCues(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const tt = doc.documentElement;
    if (!tt || tt.localName !== 'tt') return [];
    const attr = (el, name) => { for (const a of el.attributes) if (a.localName === name) return a.value; return null; };
    const frameRate = Number(attr(tt, 'frameRate')) || 30;
    const [mn, md] = (attr(tt, 'frameRateMultiplier') || '1 1').split(/\s+/).map(Number);
    const fps = frameRate * (mn && md ? mn / md : 1);
    const subFrameRate = Number(attr(tt, 'subFrameRate')) || 1;
    const tickRate = Number(attr(tt, 'tickRate')) || (attr(tt, 'frameRate') ? frameRate * subFrameRate : 1);
    const time = (v) => {
      if (v == null) return null;
      v = v.trim();
      let m = v.match(/^(\d+):(\d\d):(\d\d)(?:\.(\d+))?$/);
      if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3] + (m[4] ? Number('0.' + m[4]) : 0);
      m = v.match(/^(\d+):(\d\d):(\d\d):(\d+)(?:\.(\d+))?$/);
      if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3] + (+m[4] + (m[5] ? +m[5] / subFrameRate : 0)) / fps;
      m = v.match(/^(\d+(?:\.\d+)?)(h|ms|m|s|f|t)$/);
      if (m) { const n = +m[1]; return { h: n * 3600, m: n * 60, s: n, ms: n / 1000, f: n / fps, t: n / tickRate }[m[2]]; }
      return null;
    };
    const agents = new Map();
    for (const a of doc.getElementsByTagNameNS('*', 'agent')) {
      const id = a.getAttribute('xml:id') || attr(a, 'id');
      const name = [...a.getElementsByTagNameNS('*', 'name')].map((n) => n.textContent.trim()).find(Boolean);
      if (id) agents.set(id, name || id);
    }
    const speakerOf = (el) => {
      for (let e = el; e && e.nodeType === 1; e = e.parentNode) {
        const ag = attr(e, 'agent'); if (ag) return ag.split(/\s+/).map((x) => agents.get(x) || x).join(' & ');
      }
      return null;
    };
    const textOf = (node) => {
      let out = '';
      for (const c of node.childNodes) {
        if (c.nodeType === 3) out += c.nodeValue;
        else if (c.nodeType === 1) out += c.localName === 'br' ? '\n' : textOf(c);
      }
      return out;
    };
    const cues = [];
    for (const p of doc.getElementsByTagNameNS('*', 'p')) {
      let base = 0;                                   // time containment: begins on ancestors add up
      for (let e = p.parentNode; e && e.nodeType === 1 && e !== tt; e = e.parentNode) base += time(attr(e, 'begin')) || 0;
      const b = time(attr(p, 'begin')), e = time(attr(p, 'end')), d = time(attr(p, 'dur'));
      if (b == null) continue;
      const start = base + b, end = e != null ? base + e : d != null ? start + d : null;
      const text = textOf(p).split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
      if (end != null && end > start && text) cues.push({ start, end, text, speaker: speakerOf(p) || [...p.getElementsByTagNameNS('*', 'span')].map(speakerOf).find(Boolean) || null });
    }
    return cues.sort((x, y) => x.start - y.start);
  }
  const items = new Map();            // url -> { url, text, at }
  const isCap = (u) => /\.(web)?vtt(\?|#|$)|\.srt(\?|#|$)|\.(ttml|dfxp)(\?|#|$)|[?&](fmt|format)=(web)?vtt|[?&](fmt|format)=ttml/i.test(u);
  const isTtml = (t) => /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<tt[\s>]/.test(t);
  const stamp = (t) => { const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`; };
  const ttmlToVtt = (xml) => 'WEBVTT\n\n' + ttmlToCues(xml).map((c) => `${stamp(c.start)} --> ${stamp(c.end)}\n${c.speaker ? `<v ${c.speaker}>` : ''}${c.text}\n`).join('\n');
  const isList = (u) => /\.m3u8(\?|#|$)/i.test(u);
  const keep = (url, text) => {
    if (!text || items.has(url)) return;
    const t = text.trimStart();
    if (t.startsWith('WEBVTT') || /^\d+\s*\n\d\d:\d\d/.test(t)) items.set(url, { url, text, at: performance.now() });
    else if (isTtml(t)) { try { items.set(url, { url, text: ttmlToVtt(t), at: performance.now(), from: 'ttml' }); } catch (e) {} }
    else if (t.startsWith('#EXTM3U')) playlist(url, text);
  };
  const seen = new Set();
  async function grab(url) {
    if (seen.has(url)) return; seen.add(url);
    try { const r = await origFetch(url, { credentials: 'include' }); if (r.ok) keep(url, await r.text()); } catch (e) {}
  }
  // HLS: subtitle playlists list WebVTT segments; fetch them (bounded) so the whole track is available.
  function playlist(url, text) {
    const lines = text.split(/\r?\n/);
    for (const l of lines) {
      const m = l.match(/#EXT-X-MEDIA:.*TYPE=SUBTITLES.*URI="([^"]+)"/);
      if (m) grab(new URL(m[1], url).href);
    }
    const segs = lines.filter((l) => l && !l.startsWith('#')).map((l) => new URL(l.trim(), url).href).filter(isCap);
    segs.slice(0, 600).forEach(grab);
  }
  // Hook fetch and XHR so segments requested during playback are captured as they arrive.
  const origFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const res = await origFetch(...args);
    try {
      const url = res.url || String(args[0]?.url || args[0]);
      if (isCap(url) || isList(url) || /vtt|subrip|ttml/i.test(res.headers.get('content-type') || '')) res.clone().text().then((t) => keep(url, t)).catch(() => {});
    } catch (e) {}
    return res;
  };
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u, ...rest) {
    this.addEventListener('load', () => {
      try {
        const url = this.responseURL || String(u);
        if ((isCap(url) || isList(url)) && (this.responseType === '' || this.responseType === 'text')) keep(url, this.responseText);
      } catch (e) {}
    });
    return open.call(this, m, u, ...rest);
  };
  // Caption files loaded before the extension was opened: re-fetch them from the resource timeline.
  function sweep() {
    for (const e of performance.getEntriesByType('resource')) if (isCap(e.name) || isList(e.name)) grab(e.name);
  }
  sweep();
  const timer = setInterval(sweep, 1000);
  // Streams: group segment URLs (…/eng/seg_0012.vtt -> …/eng/seg_#.vtt) so each language/track is one choice.
  const key = (u) => { try { const x = new URL(u); return x.origin + x.pathname.replace(/\d+(?=[^/]*$)/, '#'); } catch (e) { return u; } };
  function groups() {
    const g = new Map();
    for (const it of items.values()) { const k = key(it.url); if (!g.has(k)) g.set(k, []); g.get(k).push(it); }
    return [...g.entries()].map(([k, list]) => ({ key: k, files: list.length, label: decodeURIComponent(k.split('/').slice(-2).join('/')).slice(0, 60) }));
  }
  window.__dubNet = {
    groups,
    dump: (k) => [...items.values()].filter((it) => key(it.url) === k).sort((a, b) => a.at - b.at).map(({ url, text }) => ({ url, text })),
    stop: () => clearInterval(timer),
  };
})();
