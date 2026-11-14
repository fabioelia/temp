// 2D sketching on a plane inside the 3D viewport: draw, snap, select and move shapes.
import * as THREE from 'three';
import { evalExpr, fmt } from './expr.js';
import { outline, pointInPolygon, distToPolyline, snapPoints, bounds } from './sketchgeo.js';

const GRID_STEPS = [0.1, 0.5, 1, 2, 5, 10, 50, 100];

export class Sketcher {
  // api: { sketch(): feature, scope(): params, change(fn, key), selectShape(id), selectedShape(): id, setTool(tool) }
  constructor(viewport, labelEl, api) {
    this.vp = viewport;
    this.label = labelEl;
    this.api = api;
    this.active = false;
    this.tool = 'select';
    this.draft = null;
    this.path = null;
    this.drag = null;
    this.cursor = null;
    this.snapHit = null;
    this.downAt = null;
    this.slotWidth = 6;
    this.root = new THREE.Group();
    this.root.matrixAutoUpdate = false;
    viewport.sketchGroup.add(this.root);
  }

  n = (v) => {
    try {
      return evalExpr(v, this.api.scope());
    } catch {
      return 0;
    }
  };

  enter(frame) {
    this.active = true;
    this.frame = frame;
    this.draft = null;
    this.path = null;
    const m = new THREE.Matrix4();
    m.makeBasis(new THREE.Vector3(...frame.x), new THREE.Vector3(...frame.y), new THREE.Vector3(...frame.normal));
    m.setPosition(...frame.origin);
    this.root.matrix.copy(m);
    this.root.matrixWorldNeedsUpdate = true;
    this.vp.setDrawMode(true);
    this.redraw();
  }

  exit() {
    this.active = false;
    this.draft = null;
    this.path = null;
    this.drag = null;
    this.label.hidden = true;
    this.vp.setDrawMode(false);
    this.vp.disposeGroup(this.root);
    this.vp.requestRender();
  }

  setTool(tool) {
    this.tool = tool;
    this.draft = null;
    this.path = null;
    this.label.hidden = true;
    this.redraw();
  }

  // ---------- pointer ----------
  snap(evt) {
    const raw = this.vp.screenToPlane(evt, this.frame);
    if (!raw) return null;
    this.snapHit = null;
    if (evt.altKey) return raw;
    const mmPerPx = this.vp.pxToWorld();
    const reach = 9 * mmPerPx;
    const sk = this.api.sketch();
    let best = null;
    const consider = (p, kind) => {
      const d = Math.hypot(p[0] - raw[0], p[1] - raw[1]);
      if (d < reach && (!best || d < best.d)) best = { p, d, kind };
    };
    consider([0, 0], 'origin');
    for (const s of sk?.shapes || []) {
      if (this.drag && s.id === this.drag.id) continue;
      for (const p of snapPoints(s, this.n)) consider(p, 'point');
    }
    if (this.path) consider(this.path[0], 'close');
    if (best) {
      this.snapHit = best;
      return best.p.slice();
    }
    const step = GRID_STEPS.find((g) => g / mmPerPx >= 5) || 100;
    return [Math.round(raw[0] / step) * step, Math.round(raw[1] / step) * step];
  }

  pointer(type, evt) {
    if (!this.active) return;
    if (type === 'down') {
      if (evt.button !== 0) return;
      this.downAt = { x: evt.clientX, y: evt.clientY };
      const p = this.snap(evt);
      if (!p) return;
      if (this.tool === 'select') {
        const raw = evt.altKey ? p : this.vp.screenToPlane(evt, this.frame);
        const hit = this.hitShape(raw);
        this.api.selectShape(hit ? hit.id : null);
        if (hit) this.drag = { id: hit.id, from: p, orig: JSON.parse(JSON.stringify(hit)), moved: false };
        this.redraw();
      } else if (this.tool === 'text') {
        this.commit({ kind: 'text', text: 'Text', size: 8, x: p[0], y: p[1] });
        this.api.setTool('select');
      } else if (this.tool !== 'path' && !this.draft) {
        this.draft = { a: p, b: p, fresh: true };
      }
    } else if (type === 'move') {
      const p = this.snap(evt);
      if (!p) return;
      this.cursor = p;
      if (this.drag && evt.buttons & 1) {
        const dx = p[0] - this.drag.from[0];
        const dy = p[1] - this.drag.from[1];
        if (dx || dy) this.drag.moved = true;
        const o = this.drag.orig;
        this.api.change((sk) => {
          const s = sk.shapes.find((x) => x.id === o.id);
          if (!s) return;
          if (s.kind === 'path') s.pts = o.pts.map((pt) => (Array.isArray(pt) ? [round(this.n(pt[0]) + dx), round(this.n(pt[1]) + dy), ...pt.slice(2)] : { ...pt, x: round(this.n(pt.x) + dx), y: round(this.n(pt.y) + dy) }));
          else {
            s.x = round(this.n(o.x ?? 0) + dx);
            s.y = round(this.n(o.y ?? 0) + dy);
          }
        }, `drag.${o.id}`);
      }
      if (this.draft) this.draft.b = p;
      this.showLabel(evt);
      this.redraw();
    } else if (type === 'up') {
      if (evt.button !== 0) return;
      const moved = this.downAt && Math.hypot(evt.clientX - this.downAt.x, evt.clientY - this.downAt.y) > 4;
      this.downAt = null;
      if (this.tool === 'select') {
        this.drag = null;
        return;
      }
      if (this.tool === 'text') return;
      const p = this.snap(evt);
      if (!p) return;
      if (this.tool === 'path') {
        if (moved) return;
        if (!this.path) this.path = [p];
        else if (this.path.length >= 3 && dist(p, this.path[0]) < 1e-6) this.commitPath();
        else if (dist(p, this.path[this.path.length - 1]) > 1e-6) this.path.push(p);
        this.redraw();
        return;
      }
      if (!this.draft) return;
      this.draft.b = p;
      if (moved || !this.draft.fresh) this.commitDraft();
      else this.draft.fresh = false;
      this.redraw();
    } else if (type === 'dbl') {
      if (this.tool === 'path' && this.path && this.path.length >= 3) this.commitPath();
    }
  }

  key(evt) {
    if (!this.active) return false;
    if (evt.key === 'Escape') {
      if (this.draft || this.path) {
        this.draft = null;
        this.path = null;
        this.label.hidden = true;
        this.redraw();
      } else if (this.tool !== 'select') this.api.setTool('select');
      else return false;
      return true;
    }
    if (evt.key === 'Enter' && this.path && this.path.length >= 3) {
      this.commitPath();
      return true;
    }
    if ((evt.key === 'Delete' || evt.key === 'Backspace') && this.api.selectedShape()) {
      const id = this.api.selectedShape();
      this.api.change((sk) => {
        sk.shapes = sk.shapes.filter((s) => s.id !== id);
      });
      this.api.selectShape(null);
      return true;
    }
    const tools = { r: 'rect', c: 'circle', l: 'path', p: 'polygon', o: 'slot', v: 'select', t: 'text' };
    if (!evt.ctrlKey && !evt.metaKey && tools[evt.key.toLowerCase()]) {
      this.api.setTool(tools[evt.key.toLowerCase()]);
      return true;
    }
    return false;
  }

  // ---------- shapes ----------
  draftShape() {
    const d = this.draft;
    if (!d) return null;
    const dx = d.b[0] - d.a[0];
    const dy = d.b[1] - d.a[1];
    const r = Math.hypot(dx, dy);
    switch (this.tool) {
      case 'rect':
        if (Math.abs(dx) < 1e-6 || Math.abs(dy) < 1e-6) return null;
        return { kind: 'rect', x: round((d.a[0] + d.b[0]) / 2), y: round((d.a[1] + d.b[1]) / 2), w: round(Math.abs(dx)), h: round(Math.abs(dy)) };
      case 'circle':
        if (r < 1e-6) return null;
        return { kind: 'circle', x: d.a[0], y: d.a[1], d: round(2 * r) };
      case 'polygon':
        if (r < 1e-6) return null;
        return { kind: 'polygon', x: d.a[0], y: d.a[1], d: round(2 * r), sides: 6, rot: round((Math.atan2(dy, dx) * 180) / Math.PI, 1) };
      case 'slot':
        if (r < 1e-6) return null;
        return { kind: 'slot', x: round((d.a[0] + d.b[0]) / 2), y: round((d.a[1] + d.b[1]) / 2), l: round(r + this.slotWidth), w: this.slotWidth, rot: round((Math.atan2(dy, dx) * 180) / Math.PI, 1) };
      default:
        return null;
    }
  }

  commit(shape) {
    const sk = this.api.sketch();
    const poly = outline(shape, this.n);
    const inside = shape.kind !== 'text' && (sk.shapes || []).some((s) => {
      if (s.hole) return false;
      const host = outline(s, this.n);
      return host.length > 2 && poly.every((p) => pointInPolygon(p, host));
    });
    if (inside) shape.hole = true;
    let id = null;
    this.api.change((doc) => {
      doc.shapes ||= [];
      const taken = new Set(doc.shapes.map((s) => s.id));
      for (let i = 1; ; i++) {
        if (!taken.has(`${shape.kind[0]}${i}`)) {
          id = `${shape.kind[0]}${i}`;
          break;
        }
      }
      doc.shapes.push({ id, ...shape });
    });
    this.api.selectShape(id);
  }

  commitDraft() {
    const s = this.draftShape();
    this.draft = null;
    this.label.hidden = true;
    if (s) this.commit(s);
  }

  commitPath() {
    const pts = this.path.map((p) => [round(p[0]), round(p[1])]);
    this.path = null;
    this.label.hidden = true;
    this.commit({ kind: 'path', pts });
    this.redraw();
  }

  hitShape(p) {
    const sk = this.api.sketch();
    const reach = 7 * this.vp.pxToWorld();
    let best = null;
    for (const s of sk?.shapes || []) {
      const poly = outline(s, this.n);
      if (poly.length < 2) continue;
      const d = distToPolyline(p, poly);
      const inside = pointInPolygon(p, poly);
      if (d < reach || inside) {
        const b = bounds(poly);
        const area = (b.x1 - b.x0) * (b.y1 - b.y0);
        // Prefer outlines under the cursor, then the smallest containing shape (holes sit inside plates).
        const score = d < reach ? -1 / (area + 1) : area;
        if (!best || score < best.score) best = { s, score };
      }
    }
    return best ? best.s : null;
  }

  showLabel(evt) {
    let text = '';
    const s = this.draftShape();
    if (s) {
      if (s.kind === 'rect') text = `${fmt(s.w, 2)} × ${fmt(s.h, 2)}`;
      else if (s.kind === 'circle' || s.kind === 'polygon') text = `⌀ ${fmt(s.d, 2)}`;
      else if (s.kind === 'slot') text = `${fmt(s.l, 2)} long`;
    } else if (this.path && this.cursor) {
      const last = this.path[this.path.length - 1];
      text = this.snapHit?.kind === 'close' && this.path.length >= 3 ? 'Close path' : fmt(dist(last, this.cursor), 2);
    } else if (this.tool !== 'select' && this.cursor) text = `${fmt(this.cursor[0], 2)}, ${fmt(this.cursor[1], 2)}`;
    if (!text) {
      this.label.hidden = true;
      return;
    }
    const r = this.vp.el.getBoundingClientRect();
    this.label.textContent = text;
    this.label.style.left = `${evt.clientX - r.left + 14}px`;
    this.label.style.top = `${evt.clientY - r.top + 14}px`;
    this.label.hidden = false;
  }

  // ---------- drawing ----------
  redraw() {
    if (!this.active) return;
    const vp = this.vp;
    vp.disposeGroup(this.root);
    const c = vp.colors;
    const sk = this.api.sketch();
    const selected = this.api.selectedShape();
    const seg = (poly, closed = true) => {
      const flat = [];
      const m = closed ? poly.length : poly.length - 1;
      for (let i = 0; i < m; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        flat.push(a[0], a[1], 0, b[0], b[1], 0);
      }
      return flat;
    };
    const ext = vp.extent;
    this.root.add(vp.fatLines([-ext, 0, 0, ext, 0, 0], 0xd9453a, 1.2), vp.fatLines([0, -ext, 0, 0, ext, 0], 0x2f9e55, 1.2));

    const shapes = sk?.shapes || [];
    const polys = shapes.map((s) => outline(s, this.n));
    shapes.forEach((s, i) => {
      const poly = polys[i];
      if (poly.length < 2) return;
      const color = s.id === selected ? c.select : s.hole ? c.hole : c.sketch;
      this.root.add(vp.fatLines(seg(poly), color, s.id === selected ? 3.2 : 2.2, !!s.hole));
      if (!s.hole && poly.length > 2) {
        const shape = new THREE.Shape(poly.map((p) => new THREE.Vector2(p[0], p[1])));
        shapes.forEach((h, j) => {
          if (h.hole && polys[j].length > 2 && pointInPolygon(polys[j][0], poly)) shape.holes.push(new THREE.Path(polys[j].map((p) => new THREE.Vector2(p[0], p[1]))));
        });
        const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: c.sketch, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthTest: false }));
        fill.renderOrder = 4;
        this.root.add(fill);
      }
    });

    const d = this.draftShape();
    if (d) this.root.add(vp.fatLines(seg(outline(d, this.n)), c.select, 2.2));
    if (this.path) {
      const pts = this.cursor ? [...this.path, this.cursor] : this.path;
      if (pts.length > 1) this.root.add(vp.fatLines(seg(pts, false), c.select, 2.2));
    }
    if (this.snapHit && this.tool !== 'select') {
      const k = 4 * vp.pxToWorld();
      const [x, y] = this.snapHit.p;
      this.root.add(vp.fatLines(seg([[x - k, y - k], [x + k, y - k], [x + k, y + k], [x - k, y + k]]), c.select, 1.6));
    }
    vp.requestRender();
  }
}

const round = (v, digits = 3) => {
  const k = 10 ** digits;
  return Math.round(v * k) / k;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
