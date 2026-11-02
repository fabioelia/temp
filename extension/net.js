// Runs in the page's own JavaScript world (injected on demand). Finds caption files the page loads
// over the network: whole .vtt/.srt files and HLS WebVTT segment playlists. Text is fetched with the
// page's own credentials; nothing is sent anywhere else.
(() => {
  if (window.__dubNet) return;
  const items = new Map();            // url -> { url, text, at }
  const isCap = (u) => /\.(web)?vtt(\?|#|$)|\.srt(\?|#|$)|[?&](fmt|format)=(web)?vtt/i.test(u);
  const isList = (u) => /\.m3u8(\?|#|$)/i.test(u);
  const keep = (url, text) => {
    if (!text || items.has(url)) return;
    const t = text.trimStart();
    if (t.startsWith('WEBVTT') || /^\d+\s*\n\d\d:\d\d/.test(t)) items.set(url, { url, text, at: performance.now() });
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
      if (isCap(url) || isList(url) || /vtt|subrip/i.test(res.headers.get('content-type') || '')) res.clone().text().then((t) => keep(url, t)).catch(() => {});
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
