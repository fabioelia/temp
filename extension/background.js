// Orchestrates a capture: tab audio via an offscreen recorder, captions + playback timeline via the content script.
const S = chrome.storage.session;

async function inject(tabId) {
  await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ['content.js'] });
}
async function inFrame(tabId, frameId, fn, args = []) {
  const [r] = await chrome.scripting.executeScript({ target: { tabId, frameIds: [frameId] }, func: fn, args });
  return r?.result;
}
async function scan(tabId) {
  await inject(tabId);
  await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, world: 'MAIN', files: ['net.js'] }).catch(() => {});
  await new Promise((r) => setTimeout(r, 600)); // let net.js re-fetch caption files the page already loaded
  const res = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, func: () => window.__dubCapture?.scan() || [] });
  const net = await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, world: 'MAIN', func: () => window.__dubNet?.groups() || [] }).catch(() => []);
  return {
    videos: res.flatMap((r) => (r.result || []).map((v) => ({ ...v, frameId: r.frameId }))),
    net: net.flatMap((r) => (r.result || []).map((g) => ({ ...g, frameId: r.frameId }))),
  };
}

// WebVTT/SRT text -> cues on the media timeline. HLS segments carry X-TIMESTAMP-MAP; segments of one
// stream are placed relative to each other with it (the remaining constant offset is fixed later by
// Dub Studio's alignment against the speech).
function parseCaptionFiles(files) {
  const toS = (s) => { const m = s.trim().replace(',', '.').match(/(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)/); return m ? Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3]) : NaN; };
  const parsed = files.map(({ text }) => {
    const map = text.match(/X-TIMESTAMP-MAP=([^\n\r]+)/);
    let rel = 0;
    if (map) { const ts = map[1].match(/MPEGTS:(\d+)/), lo = map[1].match(/LOCAL:([\d:.]+)/); rel = (ts ? Number(ts[1]) / 90000 : 0) - (lo ? toS(lo[1]) : 0); }
    const cues = [];
    for (const block of text.replace(/\r/g, '').split(/\n\s*\n/)) {
      const lines = block.split('\n').filter((l) => l.trim()), i = lines.findIndex((l) => l.includes('-->'));
      if (i < 0) continue;
      const [a, b] = lines[i].split('-->'), start = toS(a), end = toS(b.trim().split(/\s+/)[0]);
      const raw = lines.slice(i + 1).join('\n');
      const speaker = (raw.match(/<v(?:\.[^ >]*)?\s+([^>]+)>/) || [])[1] || null;
      const textOnly = raw.replace(/<[^>]+>/g, '').trim();
      if (Number.isFinite(start) && Number.isFinite(end) && end > start && textOnly) cues.push({ start, end, text: textOnly, speaker });
    }
    return { rel, hasMap: !!map, cues };
  });
  const mapped = parsed.filter((p) => p.hasMap), base = mapped.length ? Math.min(...mapped.map((p) => p.rel)) : 0;
  const out = new Map();
  for (const p of parsed) for (const c of p.cues) {
    const shift = p.hasMap ? p.rel - base : 0, k = `${(c.start + shift).toFixed(2)}|${c.text}`;
    if (!out.has(k)) out.set(k, { ...c, start: c.start + shift, end: c.end + shift });
  }
  return [...out.values()].sort((a, b) => a.start - b.start);
}
async function ensureOffscreen() {
  if (await chrome.offscreen.hasDocument?.()) return;
  await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['USER_MEDIA'], justification: 'Record tab audio for Dub Studio' });
}

async function start({ tabId, frameId, videoIndex, trackIndex, net }) {
  const vids = (await scan(tabId)).videos;
  const v = vids.find((x) => x.frameId === frameId && x.index === videoIndex);
  if (!v) throw new Error('That video is no longer on the page.');
  if (v.protected) throw new Error('This video is DRM-protected, so Dub Studio Capture will not record it.');
  const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
  await ensureOffscreen();
  const r = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'start', streamId });
  if (r?.error) throw new Error(r.error);
  const recStart = Date.now();
  const c = await inFrame(tabId, frameId, (vi, ti) => window.__dubCapture.start(vi, ti), [videoIndex, trackIndex ?? null]);
  if (c?.error) { await chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop' }); throw new Error(c.error); }
  await S.set({ capture: { tabId, frameId, videoIndex, trackIndex, net: net || null, recStart, logStart: Date.now() } });
  return { ok: true };
}

// Map a time on the video's timeline to a time on the recording, using the logged playback samples.
function mapper(samples, offsetMs) {
  const seg = [];
  for (let i = 0; i + 1 < samples.length; i++) {
    const [ta, va, pa] = samples[i], [tb, vb] = samples[i + 1];
    const dt = (tb - ta) / 1000, dv = vb - va;
    if (!pa && dv >= 0 && dv <= dt * 2.5 + 0.3) seg.push({ ta: ta + offsetMs, va, tb: tb + offsetMs, vb });
  }
  return (vt) => {
    for (const s of seg) if (vt >= s.va && vt <= s.vb) return (s.ta + (vt - s.va) / Math.max(1e-6, s.vb - s.va) * (s.tb - s.ta)) / 1000;
    return null;
  };
}
const stamp = (t) => { const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${s.toFixed(3).padStart(6, '0')}`; };

async function stop() {
  const { capture } = await S.get('capture');
  if (!capture) throw new Error('Nothing is being recorded.');
  await S.remove('capture');
  const log = await inFrame(capture.tabId, capture.frameId, () => window.__dubCapture?.stop());
  const r = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'stop' });
  if (r?.error) throw new Error(r.error);
  if (log?.protectedDuring) throw new Error('The video became DRM-protected during recording; the capture was discarded.');
  const map = mapper(log?.samples || [], capture.logStart - capture.recStart);
  let source = log?.cues || [];
  if (capture.net) {
    const [r] = await chrome.scripting.executeScript({ target: { tabId: capture.tabId, frameIds: [capture.net.frameId] }, world: 'MAIN', func: (k) => window.__dubNet?.dump(k) || [], args: [capture.net.key] });
    source = parseCaptionFiles(r?.result || []);
  }
  const cues = [];
  for (const c of source) {
    const s = map(c.start), e = map(c.end) ?? (s != null ? s + (c.end - c.start) : null);
    if (s != null && e != null && e > s && c.text) cues.push({ start: s, end: e, text: c.text, speaker: c.speaker || null });
  }
  const base = `dub-capture/${(log?.title || 'capture').replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'capture'}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const vtt = 'WEBVTT\n\n' + cues.map((c) => `${stamp(c.start)} --> ${stamp(c.end)}\n${c.speaker ? `<v ${c.speaker}>` : ''}${c.text}\n`).join('\n');
  const meta = { format: 'dub-studio-capture', version: 2, source: log?.url, title: log?.title, recordedSeconds: r.seconds, cues: cues.length,
    captions: capture.net ? { from: 'network', stream: capture.net.key, note: 'Constant offset may remain; Dub Studio re-aligns captions to the speech on import.' } : { from: 'text track' } };
  await chrome.downloads.download({ url: r.url, filename: `${base}.webm` });
  await chrome.downloads.download({ url: 'data:text/vtt;charset=utf-8,' + encodeURIComponent(vtt), filename: `${base}.vtt` });
  await chrome.downloads.download({ url: 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(meta, null, 1)), filename: `${base}.json` });
  return { ok: true, seconds: r.seconds, cues: cues.length, file: base };
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.target !== 'background') return;
  const run = { scan: () => scan(msg.tabId), start: () => start(msg), stop, status: async () => (await S.get('capture')).capture || null }[msg.type];
  run().then((result) => reply({ result }), (e) => reply({ error: e.message || String(e) }));
  return true;
});
