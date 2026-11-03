// Injected into the active tab on demand. Finds <video> elements and their caption tracks,
// and logs playback time while recording so caption cues can be mapped onto the recording.
(() => {
  if (window.__dubCapture) return;
  const state = { logging: null };
  // <video> elements, including ones inside open shadow roots (web-component players such as Mux or media-chrome)
  const videos = () => {
    const out = [], walk = (root) => {
      out.push(...root.querySelectorAll('video'));
      for (const el of root.querySelectorAll('*')) if (el.shadowRoot) walk(el.shadowRoot);
    };
    walk(document);
    return out;
  };
  const isProtected = (v) => !!v.mediaKeys; // Encrypted Media Extensions in use -> DRM content

  function scan() {
    return videos().map((v, i) => ({
      index: i,
      duration: Number.isFinite(v.duration) ? v.duration : null,
      width: v.videoWidth, height: v.videoHeight,
      protected: isProtected(v),
      tracks: [...v.textTracks].map((t, j) => ({ index: j, kind: t.kind, label: t.label, language: t.language })),
    }));
  }

  function cuesOf(track) {
    return track && track.cues ? [...track.cues].map((c) => ({ start: c.startTime, end: c.endTime, text: (c.text || '').replace(/<[^>]+>/g, '').trim() })) : [];
  }

  function start(videoIndex, trackIndex, allowProtected) {
    const v = videos()[videoIndex];
    if (!v) return { error: 'Video not found.' };
    if (isProtected(v) && !allowProtected) return { error: 'This video is DRM-protected; capture is disabled.' };
    const track = trackIndex != null ? v.textTracks[trackIndex] : null;
    if (track && track.mode === 'disabled') track.mode = 'hidden'; // loads cues without showing them
    const log = { t0: performance.now(), samples: [], cues: new Map(), v, track };
    const sample = () => log.samples.push([performance.now() - log.t0, v.currentTime, v.paused ? 1 : 0]);
    const grab = () => { for (const c of cuesOf(track)) log.cues.set(`${c.start}|${c.end}|${c.text}`, c); };
    log.handlers = { timeupdate: sample, seeked: sample, pause: sample, play: sample, ratechange: sample };
    for (const [e, h] of Object.entries(log.handlers)) v.addEventListener(e, h);
    if (track) { log.onCue = grab; track.addEventListener('cuechange', grab); }
    log.allowProtected = !!allowProtected;
    log.timer = setInterval(() => { sample(); grab(); if (isProtected(v) && !log.allowProtected) stop(); }, 250);
    sample(); grab();
    state.logging = log;
    return { ok: true, protected: false };
  }

  // What is playing, from what the page itself declares: <meta name="dub:series|season|episode|title">,
  // schema.org JSON-LD (TVEpisode / Movie with partOfSeries, partOfSeason, episodeNumber), og:title,
  // then an "S1:E3"-style label in the title. key = "series-slug/s01e03" (or "title-slug-year") names the
  // same episode across sites and encodes.
  function parseEpisodeLabel(text) {
    const t = String(text || '');
    const m = /\bS(?:eason)?\s*(\d{1,2})\s*[:,.]?\s*E(?:p(?:isode)?\.?)?\s*(\d{1,3})\b/i.exec(t) || /\bSeason\s*(\d{1,2})\s*,?\s*Ep(?:isode)?\.?\s*(\d{1,3})\b/i.exec(t) || /\b(\d{1,2})x(\d{2,3})\b/.exec(t);
    return m ? { season: Number(m[1]), episode: Number(m[2]), before: t.slice(0, m.index), after: t.slice(m.index + m[0].length) } : null;
  }
  const slug = (x) => String(x || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  function identify() {
    const meta = (n) => document.querySelector(`meta[name="${n}"], meta[property="${n}"]`)?.content?.trim() || '';
    let ld = {};
    for (const sc of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const j = JSON.parse(sc.textContent);
        for (const x of [].concat(j?.['@graph'] || j)) {
          const type = [].concat(x?.['@type'] || []).join(' ');
          if (/Episode|Movie/.test(type)) { ld = x; break; }
          if (/VideoObject/.test(type) && !ld.name) ld = x;
        }
      } catch (e) { /* not JSON */ }
    }
    const first = (...xs) => xs.find((x) => x != null && String(x).trim() !== '');
    let series = first(meta('dub:series'), ld.partOfSeries?.name, ld.partOfTVSeries?.name, ld.partOfSeason?.partOfSeries?.name);
    let season = Number(first(meta('dub:season'), ld.partOfSeason?.seasonNumber)) || null;
    let episode = Number(first(meta('dub:episode'), ld.episodeNumber)) || null;
    let name = first(meta('dub:title'), ld.name, meta('og:title'), document.title) || '';
    const year = Number(first(meta('dub:year'), String(ld.datePublished || ld.dateCreated || '').slice(0, 4))) || null;
    let from = meta('dub:series') || meta('dub:title') ? 'page tags' : ld.name ? 'schema.org' : 'page title';
    if (!(season && episode)) {
      const p = parseEpisodeLabel(name) || parseEpisodeLabel(document.title);
      if (p) { season = p.season; episode = p.episode; if (!series) series = p.before.replace(/[\s|:·–-]+$/, '').trim() || null; const rest = p.after.replace(/^[\s|:·–-]+/, '').replace(/\s+[|–—]\s+[^|–—]+$/, '').trim(); if (rest) name = rest; from += ' (episode label)'; }
    }
    const key = series && season && episode ? `${slug(series)}/s${String(season).padStart(2, '0')}e${String(episode).padStart(2, '0')}` : name ? slug(name) + (year ? '-' + year : '') : null;
    return { series: series || null, season, episode, name: name || null, year, key, from };
  }

  function stop() {
    const log = state.logging; if (!log) return { error: 'Not recording.' };
    state.logging = null;
    clearInterval(log.timer);
    for (const [e, h] of Object.entries(log.handlers)) log.v.removeEventListener(e, h);
    if (log.track && log.onCue) log.track.removeEventListener('cuechange', log.onCue);
    log.samples.push([performance.now() - log.t0, log.v.currentTime, log.v.paused ? 1 : 0]);
    return { samples: log.samples, cues: [...log.cues.values()].sort((a, b) => a.start - b.start), protectedDuring: isProtected(log.v) && !log.allowProtected, title: document.title, url: location.href, content: identify() };
  }

  window.__dubCapture = { scan, start, stop };
})();
