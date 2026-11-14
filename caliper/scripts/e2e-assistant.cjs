// Checks the assistant plumbing without spending tokens: once as a Claude artifact (window.claude
// mocked) and once against a stubbed Claude API. Usage: node scripts/e2e-assistant.cjs [base url] [shots dir]
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:4173/';
const dir = process.argv[3] || '.';
let failed = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} ${m}`); if (!c) failed++; };
const BOX = { name: 'Open box', params: [{ name: 'length', value: '60' }, { name: 'wall', value: '2' }], features: [
  { id: 'sketch1', type: 'sketch', name: 'Footprint', plane: 'XY', shapes: [{ id: 'r1', kind: 'rect', x: 0, y: 0, w: 'length', h: 40, r: 5 }] },
  { id: 'extrude1', type: 'extrude', name: 'Block', sketch: 'sketch1', distance: 25, op: 'new' },
  { id: 'shell1', type: 'shell', name: 'Hollow', faces: 'top', thickness: 'wall' } ] };

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

  // ---------- artifact mode ----------
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message)); p.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
    await p.addInitScript((BOX) => {
      const sample = async (input, opts) => {
        window.__sample = { turns: input.length, last: input[input.length - 1].content, first: input[0].content.slice(0, 40), tools: opts.tools.map((t) => t.name), cache: opts.cache };
        const set = opts.tools.find((t) => t.name === 'set_model'); const edit = opts.tools.find((t) => t.name === 'edit_model');
        const r1 = await set.execute(BOX, { signal: opts.signal });
        let r2; try { await edit.execute({ upsert: [{ id: 'x', type: 'nonsense' }] }, {}); } catch (e) { r2 = e.message; }
        const r3 = await edit.execute({ set_params: { length: 80 }, upsert: [{ id: 'fillet1', type: 'fillet', name: 'Too big', edges: { parallel: 'z' }, radius: 50 }] }, {});
        const r4 = await edit.execute({ remove: ['fillet1'], upsert: [{ id: 'chamfer1', type: 'chamfer', name: 'Bed edge', edges: { on: 'bottom' }, distance: 0.6 }] }, {});
        window.__reports = [r1, r2, r3, r4];
        opts.onText({ text: 'Built an open box.', delta: 'Built an open box.' });
        return { text: 'Built an open box.', truncated: false, modelTierApplied: 'default' };
      };
      sample.limits = async () => ({ maxPromptBytes: 262144, tools: { maxCount: 8 } });
      const downloads = { save: async ({ filename, data }) => { window.__saved = { filename, size: data.size ?? data.byteLength ?? data.length, head: data.arrayBuffer ? Array.from(new Uint8Array(await data.slice(0, 4).arrayBuffer())) : null }; return { status: 'saved' }; } };
      window.claude = { use: async (n) => (n === 'sample' ? sample : n === 'downloads' ? downloads : null) };
    }, BOX);
    await p.goto(base + 'artifact-preview.html');
    await p.waitForFunction(() => window.caliper?.store.results, null, { timeout: 60000 });
    await p.waitForTimeout(400);
    ok(await p.isHidden('#chat-settings-btn') && await p.isHidden('#chat-settings'), 'artifact mode: no API key settings shown');
    await p.fill('#chat-input', 'an open box please'); await p.click('#chat-send');
    await p.waitForFunction(() => window.__reports && !document.querySelector('#assistant.running'), null, { timeout: 30000 });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => ({ s: window.__sample, reports: window.__reports, doc: window.caliper.store.doc, res: { bodies: window.caliper.store.results.bodies.length, max: window.caliper.store.results.max }, undo: window.caliper.store.undoStack.length, chat: document.getElementById('chat-log').innerText }));
    ok(r.s.tools.join() === 'set_model,edit_model' && r.s.first.startsWith('You are the design assistant') && /CURRENT MODEL/.test(r.s.last) && /REQUEST: an open box please/.test(r.s.last) && r.s.cache === undefined, 'prompt carries the guide, the current model and the request');
    ok(r.reports[0].ok && r.reports[0].bodies[0].size_mm.join() === '60,40,25', `set_model report: ${JSON.stringify(r.reports[0]).slice(0, 160)}`);
    ok(/Unknown feature type "nonsense"/.test(r.reports[1]), 'invalid feature types are rejected back to the assistant');
    ok(!r.reports[2].ok && r.reports[2].errors[0].feature === 'fillet1' && r.reports[2].bodies[0].size_mm[0] === 80, `build errors are reported: ${JSON.stringify(r.reports[2].errors)}`);
    ok(r.reports[3].ok && r.doc.features.map((f) => f.id).join() === 'sketch1,extrude1,shell1,chamfer1' && r.doc.name === 'Open box', 'edit_model removes and adds features');
    ok(r.undo === 1 && /Built an open box/.test(r.chat) && /Model updated/.test(r.chat), `one undo step per assistant turn, reply shown (undo ${r.undo})`);
    await p.screenshot({ path: `${dir}/e2e-assistant.png` });
    await p.click('text=Undo this change'); await p.waitForTimeout(600);
    ok(await p.evaluate(() => window.caliper.store.doc.name.startsWith('Example')), 'undo restores the previous part');
    await p.click('#export-btn'); await p.click('[data-file="stl"]');
    await p.waitForFunction(() => window.__saved, null, { timeout: 20000 });
    const saved = await p.evaluate(() => window.__saved);
    ok(saved.filename.endsWith('.stl.zip') && saved.head.join() === '80,75,3,4' && saved.size > 1000, `artifact export goes through the save prompt as a zip (${saved.filename}, ${saved.size} bytes)`);
    ok(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' || ') : ''}`);
    await p.close();
  }

  // ---------- API key mode ----------
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    const requests = [];
    const sse = (events) => events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('');
    const msg = (id) => ({ type: 'message_start', message: { id, type: 'message', role: 'assistant', model: 'claude-opus-5-5', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 1 } } });
    await p.route('https://api.anthropic.com/**', async (route) => {
      const req = route.request();
      const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      const body = JSON.parse(req.postData());
      requests.push({ url: req.url(), headers: req.headers(), body });
      const n = requests.length;
      const events = n === 1
        ? [msg('msg_1'), { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'toolu_1', name: 'set_model', input: {} } },
           { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: JSON.stringify(BOX) } }, { type: 'content_block_stop', index: 0 },
           { type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 50 } }, { type: 'message_stop' }]
        : [msg('msg_2'), { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
           { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Here is your open box.' } }, { type: 'content_block_stop', index: 0 },
           { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 8 } }, { type: 'message_stop' }];
      await route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'text/event-stream' }, body: sse(events) });
    });
    await p.goto(base);
    await p.waitForFunction(() => window.caliper?.store.results, null, { timeout: 60000 });
    await p.waitForTimeout(300);
    await p.fill('#chat-input', 'box'); await p.click('#chat-send');
    ok(await p.isVisible('#chat-settings'), 'sending without a key opens the key settings');
    await p.fill('#api-key', 'sk-ant-test-key'); await p.click('#api-save');
    await p.fill('#chat-input', 'an open box please'); await p.click('#chat-send');
    await p.waitForFunction(() => /Here is your open box/.test(document.getElementById('chat-log').innerText) && !document.querySelector('#assistant.running'), null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => ({ doc: window.caliper.store.doc, bodies: window.caliper.store.results.bodies.length, chat: document.getElementById('chat-log').innerText }));
    ok(requests.length === 2, `two API rounds (${requests.length}); chat: ${r.chat.replace(/\n/g, ' | ').slice(0, 200)}`);
    const q = requests[0] || { headers: {}, body: {} };
    ok(/\/v1\/messages/.test(q.url || '') && q.headers['authorization'] === 'Bearer sk-ant-test-key' && q.headers['anthropic-dangerous-direct-browser-access'] === 'true' && /server-side-fallback-2026-07-01/.test(q.headers['anthropic-beta'] || ''), `request auth and beta header (${q.headers['anthropic-beta']})`);
    ok(q.body.model === 'claude-opus-5-5' && q.body.stream === true && q.body.thinking?.type === 'adaptive' && q.body.fallbacks === 'default' && q.body.tools?.length === 2 && q.body.max_tokens === 64000 && !('temperature' in q.body), `request shape (${JSON.stringify({ model: q.body.model, thinking: q.body.thinking, eff: q.body.output_config, fb: q.body.fallbacks })})`);
    const m2 = requests[1]?.body.messages || [];
    ok(m2.length === 3 && m2[1].role === 'assistant' && m2[1].content[0].type === 'tool_use' && m2[2].content[0].type === 'tool_result' && JSON.parse(m2[2].content[0].content).ok === true, 'tool result with the build report goes back to the API');
    ok(r.doc.name === 'Open box' && r.bodies === 1 && /Here is your open box/.test(r.chat), 'model replaced and reply shown');
    ok(errors.length === 0, `no page errors${errors.length ? ': ' + errors.join(' || ') : ''}`);
    await p.close();
  }
  await b.close();
  console.log(failed ? `${failed} FAILED` : 'ALL PASS');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('crashed:', e.message.split('\n').slice(0, 5).join('\n')); process.exit(2); });
