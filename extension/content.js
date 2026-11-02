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

  function stop() {
    const log = state.logging; if (!log) return { error: 'Not recording.' };
    state.logging = null;
    clearInterval(log.timer);
    for (const [e, h] of Object.entries(log.handlers)) log.v.removeEventListener(e, h);
    if (log.track && log.onCue) log.track.removeEventListener('cuechange', log.onCue);
    log.samples.push([performance.now() - log.t0, log.v.currentTime, log.v.paused ? 1 : 0]);
    return { samples: log.samples, cues: [...log.cues.values()].sort((a, b) => a.start - b.start), protectedDuring: isProtected(log.v) && !log.allowProtected, title: document.title, url: location.href };
  }

  window.__dubCapture = { scan, start, stop };
})();
