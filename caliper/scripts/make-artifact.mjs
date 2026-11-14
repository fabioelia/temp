// Turns the single-file build into the body-only page a Claude artifact expects
// (the publisher wraps it in its own <html><head><body> skeleton), plus a wrapped
// copy for local preview. Publish dist/artifact.html together with kernel.wasm and font.ttf.
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
const body = html.slice(html.indexOf('>', html.indexOf('<body')) + 1, html.lastIndexOf('</body>'));
const keep = head
  .replace(/<meta charset[^>]*>/i, '')
  .replace(/<meta name="viewport"[^>]*>/i, '')
  .replace(/<meta name="description"[^>]*>/i, '')
  .trim();
// The bundle holds a literal U+FFFD (a text decoder's replacement character); publishers reject it
// as a likely encoding accident, so write it as a JS escape instead. Same program, ASCII-safe.
const page = `${keep}\n${body.trim()}\n`.replaceAll('\uFFFD', '\\uFFFD');
fs.writeFileSync(new URL('../dist/artifact.html', import.meta.url), page);
const skeleton = `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${page}</body></html>`;
fs.writeFileSync(new URL('../dist/artifact-preview.html', import.meta.url), skeleton);
console.log('wrote dist/artifact.html', (page.length / 1e6).toFixed(2), 'MB; title in first 8KB:', /<title>/.test(page.slice(0, 8192)));
