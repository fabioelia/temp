import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The OpenCascade glue references its .wasm via `new URL(..., import.meta.url)`, which would make the
// bundler inline all 23 MB of it. Caliper hands the kernel its bytes itself (see src/kernel/client.js).
const dropWasmUrl = () => ({
  name: 'caliper-drop-wasm-url',
  enforce: 'pre',
  transform(code, id) {
    if (!id.includes('replicad_single.js')) return null;
    return code.replace(/new URL\("replicad_single\.wasm",\s*import\.meta\.url\)/g, 'new URL("about:blank")');
  },
});

export default defineConfig({
  base: './',
  plugins: [dropWasmUrl(), viteSingleFile()],
  worker: { format: 'es', plugins: () => [dropWasmUrl()] },
  build: { target: 'es2022', chunkSizeWarningLimit: 5000, assetsInlineLimit: 100000000 },
  server: { host: '127.0.0.1', port: 5173 },
});
