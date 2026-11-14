import fs from 'node:fs';
import opencascade from 'replicad-opencascadejs';
import * as r from 'replicad';
import { createKernel } from '../src/kernel/evaluate.js';
export async function loadKernel() {
  const wasmBinary = fs.readFileSync(new URL('../node_modules/replicad-opencascadejs/dist/replicad_single.wasm', import.meta.url));
  const OC = await opencascade({ wasmBinary });
  r.setOC(OC);
  return createKernel(r);
}
