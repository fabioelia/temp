# Caliper

A browser CAD tool for 3D-printable parts, in the spirit of Fusion's sketch → extrude → fillet workflow but with far fewer knobs, plus a Claude assistant that edits the same timeline you do.

- **Real solid modelling.** The geometry kernel is OpenCascade compiled to WebAssembly (through [replicad](https://replicad.xyz)), running in a worker. Fillets, chamfers, shells and booleans are exact B-rep operations, not mesh tricks, and STEP export keeps them exact.
- **Parametric timeline.** Every feature stays editable. Any number can be an expression over named parameters (`width/2 - wall`), and the model rebuilds as you type.
- **Sketching without constraints.** Rectangles, circles, polygons, slots, line paths and text snap to a grid and to each other; exact sizes go in the inspector. A shape drawn inside another becomes a cut-out.
- **Direct manipulation.** Click a face to sketch on it or push/pull it; click edges to fillet or chamfer them; click a face and Shell to hollow the part.
- **Assistant.** Describe a part or a change. Claude writes ordinary features and parameters (the same ones you can click and tweak), reads the build report, and fixes its own errors. Select a face or edge first to say "this".
- **Export.** Binary STL (three mesh qualities) and STEP. Projects save as JSON and autosave in the browser.

## Run it

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run build      # dist/index.html (single file) + dist/kernel.wasm (kernel) + dist/font.ttf
npm run preview    # serve the build on http://127.0.0.1:4173
```

`dist/` is a static site; host the three files together anywhere. `index.html` also works opened straight from disk, in which case the kernel and font are fetched from a public CDN instead.

Outside claude.ai the assistant calls the Claude API directly from the browser with a key you paste into its settings (stored in that browser only). `npm run artifact` additionally writes `dist/artifact.html`, the body-only page for publishing as a Claude artifact, where the assistant uses the viewer's own Claude instead of a key and exports go through the viewer's save prompt (as a `.zip`, because artifacts cannot save `.stl` directly).

## Using it

| To do this | Do this |
| --- | --- |
| Start a part | **Sketch** → pick a plane → drag a rectangle → **Finish sketch** → type the extrude distance. Or add a **Box** / **Cylinder**. Or ask the assistant. |
| Cut a pocket or hole | Click a flat face → **Sketch here** → draw → Finish → set Operation to **Cut** and a negative distance (or Extent: Through all). |
| Push or pull a face | Click a flat face → **Push / pull**. |
| Round or bevel | Click edges (Shift-click for more) → **Fillet** / **Chamfer**. Or click the tool first, then pick. Selecting a face stands for all the edges around it. |
| Hollow out | Click the face to open → **Shell** → wall thickness. |
| Repeat | Select a feature in the timeline → **Pattern** (rows or around an axis) or **Mirror**. |
| Change anything later | Click the feature in the timeline and edit its numbers. Double-click a sketch to reopen it. |
| Drive sizes from one place | Add a parameter (left panel) and type its name into any field. |

Mouse: drag orbits, right-drag pans, scroll zooms. While sketching, drag draws and right-drag orbits. Keys: `S` sketch, `E` extrude, `F` fillet, `Esc` back out, `Ctrl+Z` / `Ctrl+Shift+Z` undo and redo; in a sketch `R` `C` `P` `O` `L` `T` `V` pick the tools.

## How it is put together

| File | Role |
| --- | --- |
| `src/kernel/evaluate.js` | Replays a document (parameters + features) into solids. Pure: runs in the worker and in Node. Caches each step, so editing feature 8 does not rebuild features 1–7. |
| `src/kernel/worker.js`, `client.js` | The worker that owns OpenCascade, and its main-thread handle (latest rebuild wins). |
| `src/store.js` | Document, undo/redo, selection, autosave, timeline rollback while sketching or re-picking. |
| `src/viewport.js` | three.js view: bodies, face and edge picking, highlights, camera. |
| `src/sketcher.js`, `sketchgeo.js` | Drawing and editing 2D shapes on a plane. |
| `src/actions.js`, `ui.js`, `schema.js` | Commands, panels, and the per-feature field definitions the inspector is generated from. |
| `src/assistant.js`, `guide.js` | The chat, its two tools (`set_model`, `edit_model`), and the briefing that teaches Claude the document format. |
| `src/export.js` | Saving files (direct download, or zipped through the artifact save prompt). |

Picked faces and edges are stored with their position in the body *and* a geometric signature. When an earlier dimension changes, the kernel re-finds them and refreshes the signature, so a fillet follows its edge as the part grows. If the edge truly disappears, the feature reports that instead of silently filleting something else.

## Tests

```bash
npm test                 # kernel: documents checked against hand-computed volumes and bounds
npm run build && node scripts/make-artifact.mjs && npm run preview &
npm run test:e2e         # headless Chromium: modelling flows, exports, assistant plumbing
```

The end-to-end scripts need Playwright with Chromium available to `require('playwright')`. The assistant tests stub Claude (both the artifact capability and the API), so they check the plumbing — prompt contents, tool execution, build reports, undo — not the quality of Claude's designs.

## Limits worth knowing

- Sketches have no geometric constraints; shapes are positioned by numbers and snapping.
- A shell fails when the wall is thicker than a fillet or chamfer already on the body. Shell first, fillet after.
- No lofts, sweeps, threads or drafts yet, and no assemblies. Units are millimetres.
- Text uses one font (DejaVu Sans Bold) and shows as a placeholder box until extruded.

OpenCascade is LGPL-2.1; replicad and three.js are MIT; DejaVu fonts are under the Bitstream Vera licence.
