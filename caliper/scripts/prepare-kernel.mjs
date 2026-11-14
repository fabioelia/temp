// Gzips the OpenCascade WebAssembly kernel into public/kernel.wasm (7 MB instead of 23 MB).
import fs from 'node:fs';
import zlib from 'node:zlib';
const src = new URL('../node_modules/replicad-opencascadejs/dist/replicad_single.wasm', import.meta.url);
const out = new URL('../public/kernel.wasm', import.meta.url);
if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(src).mtimeMs) {
  fs.mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
  fs.writeFileSync(out, zlib.gzipSync(fs.readFileSync(src), { level: 9 }));
  console.log('wrote public/kernel.wasm', (fs.statSync(out).size / 1e6).toFixed(1), 'MB');
}

// Font for sketch text (DejaVu Sans Bold, free to redistribute).
const font = new URL('../node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf', import.meta.url);
const fontOut = new URL('../public/font.ttf', import.meta.url);
if (!fs.existsSync(fontOut)) fs.copyFileSync(font, fontOut);
