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
  const labels = new Map();           // url -> human label (language / name) from manifests
  const isCap = (u) => /\.(web)?vtt(\?|#|$)|\.srt(\?|#|$)|\.(ttml|dfxp)(\?|#|$)|[?&](fmt|format)=(web)?vtt|[?&](fmt|format)=ttml|\/api\/timedtext\?/i.test(u);
  const isTtml = (t) => /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<tt[\s>]/.test(t);
  const stamp = (t) => { const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`; };
  const ttmlToVtt = (xml) => 'WEBVTT\n\n' + ttmlToCues(xml).map((c) => `${stamp(c.start)} --> ${stamp(c.end)}\n${c.speaker ? `<v ${c.speaker}>` : ''}${c.text}\n`).join('\n');
  const isList = (u) => /\.m3u8(\?|#|$)/i.test(u);
  // YouTube's caption formats (as CleanCut parses them): json3 { events: [{ tStartMs, dDurationMs, segs: [{ utf8 }] }] },
  // srv3 <timedtext><body><p t="ms" d="ms"> and the older <transcript><text start="s" dur="s">.
  const decode = (x) => x.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (a, e) => e[0] === '#' ? String.fromCodePoint(/^#x/i.test(e) ? parseInt(e.slice(2), 16) : +e.slice(1)) : ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[e.toLowerCase()]);
  const clean = (x) => decode(String(x).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
  const cuesToVtt = (cues) => 'WEBVTT\n\n' + cues.filter((c) => c.text).sort((a, b) => a.start - b.start).map((c) => `${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n');
  function json3ToVtt(t) {
    let doc; try { doc = JSON.parse(t); } catch (e) { return null; }
    if (!Array.isArray(doc?.events)) return null;
    return cuesToVtt(doc.events.filter((e) => Array.isArray(e?.segs)).map((e) => ({ start: e.tStartMs / 1000, end: (e.tStartMs + (e.dDurationMs > 0 ? e.dDurationMs : 2000)) / 1000, text: clean(e.segs.map((g) => g?.utf8 || '').join('')) })).filter((c) => Number.isFinite(c.start)));
  }
  function srv3ToVtt(t) {
    const cues = [], at = (a, n) => Number((new RegExp(`\\b${n}="([^"]*)"`).exec(a) || [])[1]);
    for (const m of t.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)) { const s0 = at(m[1], 't'), d = at(m[1], 'd'); if (Number.isFinite(s0)) cues.push({ start: s0 / 1000, end: (s0 + (d > 0 ? d : 2000)) / 1000, text: clean(m[2]) }); }
    for (const m of t.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) { const s0 = at(m[1], 'start'), d = at(m[1], 'dur'); if (Number.isFinite(s0)) cues.push({ start: s0, end: s0 + (d > 0 ? d : 2), text: clean(decode(m[2])) }); }
    return cues.length ? cuesToVtt(cues) : null;
  }
  const keep = (url, text) => {
    if (!text || items.has(url)) return;
    const t = text.trimStart();
    if (/\/api\/timedtext\?/.test(url) || /^\{\s*"wireMagic"|^\{\s*"events"/.test(t) || /^(<\?xml[^>]*>\s*)?<(timedtext|transcript)[\s>]/.test(t)) {
      const vtt = t.startsWith('{') ? json3ToVtt(t) : t.startsWith('<') ? srv3ToVtt(t) : t.startsWith('WEBVTT') ? t : null;
      if (vtt && vtt.length > 10) {
        if (!labels.has(url)) { const k = key(url), lab = [...labels.entries()].find(([u]) => key(u) === k)?.[1]; if (lab) labels.set(url, lab); }
        items.set(url, { url, text: vtt, at: performance.now(), from: 'youtube' });
        for (const [u] of needsCC) if (key(u + '&fmt=json3') === key(url)) needsCC.delete(u);
      }
      return;
    }
    if (t.startsWith('WEBVTT') || /^\d+\s*\n\d\d:\d\d/.test(t)) items.set(url, { url, text, at: performance.now() });
    else if (isTtml(t)) { try { items.set(url, { url, text: ttmlToVtt(t), at: performance.now(), from: 'ttml' }); } catch (e) {} }
    else if (t.startsWith('#EXTM3U')) playlist(url, text);
    else if (isMpd(url, t)) { try { mpd(url, text); } catch (e) {} }
  };
  const seen = new Set();
  const isMpd = (u, t) => /\.mpd(\?|#|$)/i.test(u) || /^\s*(<\?xml[^>]*>\s*)?<MPD[\s>]/.test(t || '');
  // DASH: text AdaptationSets (WebVTT/TTML as plain files or $Number$/SegmentTimeline segments).
  // Text segments wrapped in MP4 (stpp/wvtt) are not plain text and are skipped.
  function mpd(url, xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const base = (el, b) => { const x = [...el.children].find((c) => c.localName === 'BaseURL'); return x ? new URL(x.textContent.trim(), b).href : b; };
    const root = base(doc.documentElement, url);
    for (const period of [...doc.getElementsByTagNameNS('*', 'Period')]) {
      const pb = base(period, root);
      for (const as of [...period.getElementsByTagNameNS('*', 'AdaptationSet')]) {
        const reps = [...as.getElementsByTagNameNS('*', 'Representation')];
        for (const r of reps.length ? reps : [as]) {
          const mime = r.getAttribute('mimeType') || as.getAttribute('mimeType') || '', ct = as.getAttribute('contentType') || '';
          if (!(/text\/vtt|ttml/i.test(mime) || (ct === 'text' && !/mp4/i.test(mime)))) continue;
          const label = [as.getAttribute('lang'), [...as.children].find((c) => c.localName === 'Label')?.textContent, [...as.getElementsByTagNameNS('*', 'Role')].map((x) => x.getAttribute('value')).join(' ')].filter(Boolean).join(' · ');
          const rb = base(r, base(as, pb));
          const tpl = [...r.children, ...as.children].find((c) => c.localName === 'SegmentTemplate');
          if (!tpl) { labels.set(rb, label); grab(rb); continue; }
          const media = tpl.getAttribute('media'), start = Number(tpl.getAttribute('startNumber') || 1), rid = r.getAttribute('id') || '';
          const tl = [...tpl.children].find((c) => c.localName === 'SegmentTimeline');
          let count = 0;
          if (tl) for (const S of tl.children) count += 1 + Number(S.getAttribute('r') || 0);
          else { const dur = Number(tpl.getAttribute('duration')), ts = Number(tpl.getAttribute('timescale') || 1), pd = (doc.documentElement.getAttribute('mediaPresentationDuration') || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/);
            const total = pd ? (+pd[1] || 0) * 3600 + (+pd[2] || 0) * 60 + (+pd[3] || 0) : 0; count = dur ? Math.ceil(total / (dur / ts)) : 0; }
          for (let k = 0; k < Math.min(count, 600); k++) {
            const u = new URL(media.replace(/\$RepresentationID\$/g, rid).replace(/\$Number(%0(\d+)d)?\$/g, (_, f, w) => String(start + k).padStart(Number(w || 0), '0')), rb).href;
            labels.set(u, label); grab(u);
          }
        }
      }
    }
  }
  // JSON player configs and manifests. Generic track model: a "track" is an object with a caption type,
  // or an element of an array whose key names subtitles/captions/text tracks. Under it, every URL-like
  // string is a candidate; the nearest key names (e.g. "webvtt", "ttml", "dfxp") give its format.
  // The best format is fetched first and the others are fallbacks (mirrors, other formats).
  const urlKeys = ['url', 'src', 'file', 'uri', 'href', 'downloadUrl', 'location'];
  const kindRe = /subtitle|caption|text\/vtt|webvtt|ttml|dfxp|imsc|srt|timedtext|texttrack/i;
  const listRe = /subtitle|caption|timedtext|texttrack|text_?tracks?|cc$/i;
  const typeKeys = ['kind', 'type', 'mimeType', 'mime', 'format', 'role', 'contentType', 'trackType', 'textType', 'codec', 'codecs'];
  const pick = (o, ks) => { for (const k of ks) if (typeof o[k] === 'string' && o[k].trim()) return o[k].trim(); return ''; };
  const flag = (o, re) => Object.keys(o).some((k) => re.test(k) && (o[k] === true || o[k] === 'true' || o[k] === 1));
  const urlLike = (v) => typeof v === 'string' && v.length < 4096 && !/\s/.test(v) && !/^(data|blob|javascript):/i.test(v) && (/^(https?:)?\/\//.test(v) || isCap(v) || /^\/[^/]/.test(v) && /\.\w{2,5}(\?|$)/.test(v));
  const rank = (hint, u) => { const h = hint + ' ' + u; return /webvtt|\bvtt\b|\.vtt/i.test(h) ? 0 : /imsc|ttml|dfxp|\.xml/i.test(h) ? 1 : /srt|subrip/i.test(h) ? 2 : 3; };
  function candidates(obj, hint, out, depth) {
    if (!obj || typeof obj !== 'object' || depth > 5 || out.length > 40) return;
    for (const k in obj) {
      const v = obj[k], h = hint + ' ' + k + ' ' + (Array.isArray(obj) ? '' : pick(obj, typeKeys));
      if (urlLike(v) && (urlKeys.includes(k) || /^\d+$/.test(k) || /url|uri|href|src|path/i.test(k) || Array.isArray(obj) || isCap(v))) out.push({ url: v, rank: rank(h, v) });
      else if (v && typeof v === 'object') candidates(v, Array.isArray(obj) ? hint : hint + ' ' + k, out, depth + 1);
    }
  }
  const tracks = new Map();           // first candidate url -> { label, urls }
  function addTrack(obj, typedByList) {
    const t = pick(obj, typeKeys), typed = typedByList || kindRe.test(t);
    const own = urlKeys.map((k) => obj[k]).find(urlLike);
    if (!typed && !(own && isCap(own))) return false;
    if (/image|bitmap|png|jpe?g/i.test(t) || flag(obj, /^is_?image|image_?based/i)) return true;   // picture subtitles: no text
    const c = []; candidates(obj, '', c, 0);
    if (!c.length) return false;
    const urls = [...new Map(c.map((x) => { try { return [new URL(x.url, location.href).href, x.rank]; } catch (e) { return [null, 9]; } })).entries()]
      .filter(([u]) => u).sort((x, y) => x[1] - y[1]).map(([u]) => u);
    if (tracks.size >= 200 || tracks.has(urls[0])) return true;
    const lang = pick(obj, ['language', 'lang', 'srclang', 'languageCode', 'bcp47', 'locale']);
    const name = pick(obj, ['label', 'name', 'displayName', 'languageDescription', 'languageName', 'title']);
    const label = [name || lang, name && lang && !name.includes(lang) ? lang : '', flag(obj, /forced/i) ? 'forced' : '',
      flag(obj, /sdh|closed_?captions?|hearing|^is_?cc$|^cc$/i) || /caption/i.test(t) ? 'CC' : ''].filter(Boolean).join(' · ');
    tracks.set(urls[0], { label, urls });
    for (const u of urls) labels.set(u, label);
    grabFirst(urls);
    return true;
  }
  function scanJson(obj, budget = { n: 0 }, depth = 0, inList = false) {
    if (!obj || typeof obj !== 'object' || depth > 12 || budget.n++ > 20000) return;
    if (Array.isArray(obj)) { for (const x of obj) scanJson(x, budget, depth + 1, inList); return; }
    if (addTrack(obj, inList)) return;
    for (const k in obj) if (obj[k] && typeof obj[k] === 'object') {
      const list = listRe.test(k) && (Array.isArray(obj[k]) || Object.values(obj[k]).every((x) => x && typeof x === 'object'));
      if (list && !Array.isArray(obj[k])) for (const x of Object.values(obj[k])) scanJson(x, budget, depth + 1, true);
      else scanJson(obj[k], budget, depth + 1, list);
    }
  }
  // Player data that lists caption tracks itself (as CleanCut reads them):
  //  YouTube: a player response (ytInitialPlayerResponse, the player element's getPlayerResponse(), or a
  //   /youtubei/v1/player response after in-app navigation): captions.playerCaptionsTracklistRenderer.captionTracks.
  //   Manual tracks first, then automatic ones; every language is kept (the source language is what matters
  //   here). If a download comes back empty (YouTube can require a token only its player has), the viewer is
  //   asked to turn CC on once so the player's own request is read.
  //  Vimeo: the player config (window.playerConfig in the embed, or player.vimeo.com/video/<id>/config):
  //   request.text_tracks [{ url, lang, label, kind }].
  const meta = {};
  const needsCC = new Map();           // YouTube track URL (without fmt) -> label, while it has given nothing
  const single = new Set();            // whole-file tracks from player data
  function playerData(obj) {
    if (!obj || typeof obj !== 'object') return false;
    const vd = obj.videoDetails, ct = obj.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (vd?.videoId) {
      Object.assign(meta, { platform: 'youtube', id: vd.videoId, name: vd.title || null, channel: vd.author || null, runtime: Number(vd.lengthSeconds) || null });
      const list = (Array.isArray(ct) ? ct : []).filter((t) => typeof t?.baseUrl === 'string');
      const name = (t) => t.name?.simpleText || (t.name?.runs || []).map((r) => r?.text || '').join('') || t.languageCode;
      const auto = (t) => t.kind === 'asr' || /^a\./.test(t.vssId || '');
      list.sort((a, b) => auto(a) - auto(b));
      for (const t of list.slice(0, 8)) {
        let u; try { u = new URL(t.baseUrl, 'https://www.youtube.com/').href; } catch (e) { continue; }
        u = /[?&]fmt=/.test(u) ? u.replace(/([?&])fmt=[^&#]*/, '$1fmt=json3') : u + (u.includes('?') ? '&' : '?') + 'fmt=json3';
        const label = `${name(t)}${auto(t) ? ' (automatic)' : ''}`;
        labels.set(u, label); needsCC.set(u.split('&fmt=')[0], label); grab(u);
      }
      return true;
    }
    const tt = obj.request?.text_tracks;
    if (obj.video?.id != null && Array.isArray(tt)) {
      Object.assign(meta, { platform: 'vimeo', id: String(obj.video.id), name: obj.video.title || null, channel: obj.video.owner?.name || null, runtime: Number(obj.video.duration) || null });
      for (const t of tt) {
        if (typeof t?.url !== 'string') continue;
        let u; try { u = new URL(t.url, 'https://player.vimeo.com/').href; } catch (e) { continue; }
        labels.set(u, [t.label || t.lang, t.kind === 'captions' ? 'CC' : '', /forced/i.test(`${t.kind} ${t.label}`) ? 'forced' : ''].filter(Boolean).join(' · ')); single.add(u); grab(u);
      }
      return true;
    }
    return false;
  }
  // Try a track's URLs in order (best format first, then mirrors/other formats) until one gives captions.
  async function grabFirst(urls) {
    for (const u of urls.slice(0, 6)) { if (items.has(u)) return; await grab(u); if (items.has(u) || [...items.keys()].some((k) => k.startsWith(u.split('#')[0]))) return; }
  }
  async function grab(url) {
    if (seen.has(url)) return; seen.add(url);
    // With the page's cookies first; caption CDNs that answer "Access-Control-Allow-Origin: *" refuse
    // credentialed requests, and their links are signed anyway, so retry without cookies.
    for (const credentials of ['include', 'omit']) {
      try { const r = await origFetch(url, { credentials }); if (r.ok) keep(url, await r.text()); return; } catch (e) { /* refused: try the next way */ }
    }
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
      if (isCap(url) || isList(url) || isMpd(url) || /vtt|subrip|ttml|dash\+xml/i.test(res.headers.get('content-type') || '')) res.clone().text().then((t) => keep(url, t)).catch(() => {});
      else if (/\/youtubei\/v1\/player\b|player\.vimeo\.com\/video\/\d+\/config/.test(url)) res.clone().json().then((j) => { playerData(j) || scanJson(j); }).catch(() => {});
    } catch (e) {}
    return res;
  };
  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u, ...rest) {
    this.addEventListener('load', () => {
      try {
        const url = this.responseURL || String(u);
        if ((isCap(url) || isList(url) || isMpd(url)) && (this.responseType === '' || this.responseType === 'text')) keep(url, this.responseText);
      } catch (e) {}
    });
    return open.call(this, m, u, ...rest);
  };
  // Observe JSON the page parses (player configs, manifests) for subtitle tracks. Read-only: the parsed
  // value is returned unchanged and nothing the page sends is modified.
  const origParse = JSON.parse;
  JSON.parse = function (text, reviver) {
    const v = origParse.call(this, text, reviver);
    try { if (typeof text === 'string' && text.length < 5e6 && kindRe.test(text)) playerData(v) || scanJson(v); } catch (e) {}
    return v;
  };
  // Caption files loaded before the extension was opened: re-fetch them from the resource timeline.
  function readPlayer() {
    // The player's own current response wins; ytInitialPlayerResponse describes only the first video of
    // the visit (YouTube navigates in-app), so it is used only before anything else has been seen.
    try {
      const pr = document.getElementById('movie_player')?.getPlayerResponse?.();
      if (pr?.videoDetails?.videoId && pr.videoDetails.videoId !== meta.id) playerData(pr);
      else if (!meta.id && window.ytInitialPlayerResponse) playerData(window.ytInitialPlayerResponse);
    } catch (e) {}
    try { if (window.playerConfig && meta.platform !== 'vimeo') playerData(window.playerConfig); } catch (e) {}
  }
  function sweep() {
    readPlayer();
    for (const e of performance.getEntriesByType('resource')) if (isCap(e.name) || isList(e.name) || isMpd(e.name)) grab(e.name);
  }
  sweep();
  const timer = setInterval(sweep, 1000);
  // Streams: group segment URLs (…/eng/seg_0012.vtt -> …/eng/seg_#.vtt) so each language/track is one choice.
  // Whole-file tracks named by player data are their own stream (YouTube's differ only in the query, Vimeo's
  // only by a number); YouTube timed text is keyed by language and kind.
  const key = (u) => { try {
    const x = new URL(u);
    if (/\/api\/timedtext$/.test(x.pathname)) return `${x.origin}${x.pathname}?${['lang', 'kind', 'tlang', 'name'].map((k) => x.searchParams.get(k) || '').join('|')}`;
    if (single.has(u)) return x.origin + x.pathname;
    return x.origin + x.pathname.replace(/\d+(?=[^/]*$)/, '#');
  } catch (e) { return u; } };
  function groups() {
    const g = new Map();
    for (const it of items.values()) { const k = key(it.url); if (!g.has(k)) g.set(k, []); g.get(k).push(it); }
    return [...g.entries()].map(([k, list]) => {
      const named = list.map((it) => labels.get(it.url)).find(Boolean);
      return { key: k, files: list.length, label: (named ? named + ' — ' : '') + decodeURIComponent(k.split('/').slice(-2).join('/')).slice(0, 60) };
    });
  }
  window.__dubNet = {
    groups,
    dumpAll: () => groups().map((g) => ({ key: g.key, label: g.label, files: [...items.values()].filter((it) => key(it.url) === g.key).sort((a, b) => a.at - b.at).map(({ url, text }) => ({ url, text })) })),
    dump: (k) => [...items.values()].filter((it) => key(it.url) === k).sort((a, b) => a.at - b.at).map(({ url, text }) => ({ url, text })),
    stop: () => clearInterval(timer),
    meta: () => (meta.id ? { ...meta } : null),
    // YouTube tracks that gave nothing yet: the viewer can turn CC on once so the player's own request is read.
    hints: () => [...needsCC.values()].filter((label) => !groups().some((g) => g.label.startsWith(label))),
  };
})();
