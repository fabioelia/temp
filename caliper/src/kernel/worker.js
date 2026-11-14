// Geometry worker: owns the OpenCascade kernel so the page never blocks while solids rebuild.
import opencascade from 'replicad-opencascadejs';
import * as replicad from 'replicad';
import { createKernel } from './evaluate.js';

let kernel = null;

self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    if (type === 'init') {
      const OC = await opencascade({
        // This build of the glue only accepts bytes through the instantiate hook.
        instantiateWasm(imports, done) {
          WebAssembly.instantiate(data.wasm, imports).then(({ instance }) => done(instance));
          return {};
        },
      });
      replicad.setOC(OC);
      kernel = createKernel(replicad);
      self.postMessage({ id, result: true });
    } else if (type === 'font') {
      await replicad.loadFont(data.font);
      self.postMessage({ id, result: true });
    } else if (type === 'evaluate') {
      const t = performance.now();
      const { result, transfer } = kernel.evaluate(data.doc);
      result.ms = Math.round(performance.now() - t);
      self.postMessage({ id, result }, transfer);
    } else if (type === 'stl') {
      const out = kernel.exportSTL(data.bodies, data.quality);
      self.postMessage({ id, result: out }, [out.buffer]);
    } else if (type === 'step') {
      const out = await kernel.exportSTEP(data.bodies);
      self.postMessage({ id, result: out }, [out.buffer]);
    }
  } catch (e) {
    self.postMessage({ id, error: (e && e.message) || 'The geometry kernel hit an error.' });
  }
};
