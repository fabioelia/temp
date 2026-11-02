// Records the tab's audio (tab capture stream) to Opus/WebM, and keeps it audible while recording.
let rec = null, chunks = [], ctx = null, stream = null, startedAt = 0;
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg.target !== 'offscreen') return;
  (async () => {
    if (msg.type === 'start') {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: msg.streamId } } });
      ctx = new AudioContext(); ctx.createMediaStreamSource(stream).connect(ctx.destination); // tab capture mutes the tab otherwise
      chunks = [];
      rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 160000 });
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.start(1000); startedAt = performance.now();
      reply({ ok: true });
    } else if (msg.type === 'stop') {
      if (!rec) { reply({ error: 'Not recording.' }); return; }
      const done = new Promise((r) => { rec.onstop = r; });
      rec.stop(); await done;
      stream.getTracks().forEach((t) => t.stop()); try { await ctx.close(); } catch (e) {}
      const blob = new Blob(chunks, { type: 'audio/webm' });
      reply({ ok: true, url: URL.createObjectURL(blob), bytes: blob.size, seconds: (performance.now() - startedAt) / 1000 });
      rec = null;
    }
  })().catch((e) => reply({ error: e.message || String(e) }));
  return true;
});
