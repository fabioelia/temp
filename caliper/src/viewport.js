// 3D viewport: renders bodies, handles orbit/zoom, and picks faces and edges.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { BASE_PLANES, toLocal, toWorld } from './frame.js';

const CAM_DIST = 4000;
const cssColor = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
};

export class Viewport {
  constructor(container) {
    this.el = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(this.renderer.domElement);
    this.canvas = this.renderer.domElement;
    this.canvas.style.touchAction = 'none';

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-100, 100, 100, -100, 1, CAM_DIST * 4);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(1, -1.3, 0.9).normalize().multiplyScalar(CAM_DIST);
    this.scene.add(this.camera);

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x59626f, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(0.5, 1.4, 1.1);
    this.camera.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.7);
    fill.position.set(-1.2, -0.3, 0.8);
    this.camera.add(fill);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = false;
    this.controls.screenSpacePanning = true;
    this.controls.zoomToCursor = true;
    this.controls.rotateSpeed = 0.9;
    this.controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN };
    this.controls.addEventListener('change', () => this.requestRender());
    this.controls.addEventListener('start', () => (this.userMoved = true));

    this.gridGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.overlay = new THREE.Group();
    this.planeGroup = new THREE.Group();
    this.sketchGroup = new THREE.Group();
    this.scene.add(this.gridGroup, this.bodyGroup, this.overlay, this.planeGroup, this.sketchGroup);
    this.planeGroup.visible = false;

    this.bodies = [];
    this.highlight = { hover: null, selected: [] };
    this.lineMaterials = new Set();
    this.raycaster = new THREE.Raycaster();
    this.extent = 100;
    this.pickFilter = 'any'; // any | face | edge | plane | none
    this.handlers = {}; // click(pick, evt), hover(pick), pointer(type, evt)
    this.drawMode = false;
    this.needsRender = true;
    this.fitted = false;

    this.readTheme();
    this.buildGrid();
    this.buildPlanes();
    this.bindPointer();

    new ResizeObserver(() => this.resize()).observe(container);
    this.resize();
    const loop = () => {
      if (this.needsRender) {
        this.needsRender = false;
        this.renderer.render(this.scene, this.camera);
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  requestRender() {
    this.needsRender = true;
  }

  readTheme() {
    this.colors = {
      bg: cssColor('--vp-bg', '#e9edf2'),
      grid: cssColor('--vp-grid', '#d5dbe3'),
      gridMajor: cssColor('--vp-grid-major', '#b9c2ce'),
      body: cssColor('--vp-body', '#b4c1d2'),
      edge: cssColor('--vp-edge', '#28303b'),
      hover: cssColor('--vp-hover', '#3b6cf0'),
      select: cssColor('--vp-select', '#e0962a'),
      sketch: cssColor('--vp-sketch', '#1f4fd8'),
      hole: cssColor('--vp-hole', '#c2410c'),
    };
    this.renderer.setClearColor(this.colors.bg);
  }

  applyTheme() {
    this.readTheme();
    this.buildGrid();
    for (const b of this.bodies) {
      b.mesh.material.color.copy(this.colors.body);
      b.lineObj.material.color.copy(this.colors.edge);
    }
    this.refreshHighlights();
    this.handlers.theme?.();
    this.requestRender();
  }

  resize() {
    const w = Math.max(1, this.el.clientWidth);
    const h = Math.max(1, this.el.clientHeight);
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    const half = 60;
    this.camera.left = (-half * w) / h;
    this.camera.right = (half * w) / h;
    this.camera.top = half;
    this.camera.bottom = -half;
    this.camera.updateProjectionMatrix();
    for (const m of this.lineMaterials) m.resolution.set(w, h);
    // Until the person moves the camera, keep the part framed as the layout settles.
    if (!this.userMoved && this.fitted) this.fit(false);
    this.requestRender();
  }

  // ---------- scene furniture ----------
  buildGrid() {
    this.gridGroup.clear();
    const size = Math.max(100, Math.ceil((this.extent * 1.6) / 50) * 50);
    const minor = [];
    const major = [];
    for (let v = -size; v <= size + 1e-6; v += 10) {
      const arr = Math.round(v) % 50 === 0 ? major : minor;
      arr.push(-size, v, 0, size, v, 0, v, -size, 0, v, size, 0);
    }
    const mk = (arr, color, opacity) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
      l.renderOrder = -2;
      return l;
    };
    this.gridGroup.add(mk(minor, this.colors.grid, 1), mk(major, this.colors.gridMajor, 1));
    const axis = (to, color) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, ...to], 3));
      const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color }));
      l.renderOrder = -1;
      return l;
    };
    const a = 25;
    this.gridGroup.add(axis([a, 0, 0], 0xd9453a), axis([0, a, 0], 0x2f9e55), axis([0, 0, a], 0x3b6cf0));
    this.requestRender();
  }

  buildPlanes() {
    this.planeGroup.clear();
    const s = Math.max(40, this.extent * 0.75);
    const tint = { XY: 0x3b6cf0, XZ: 0x2f9e55, YZ: 0xd9453a };
    for (const [name, f] of Object.entries(BASE_PLANES)) {
      const g = new THREE.BufferGeometry();
      const c = [
        [-s, -s],
        [s, -s],
        [s, s],
        [-s, s],
      ].map((p) => toWorld(f, p));
      g.setAttribute('position', new THREE.Float32BufferAttribute(c.flat(), 3));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: tint[name], transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }));
      m.userData.plane = name;
      const eg = new THREE.BufferGeometry();
      eg.setAttribute('position', new THREE.Float32BufferAttribute([...c[0], ...c[1], ...c[1], ...c[2], ...c[2], ...c[3], ...c[3], ...c[0]], 3));
      m.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: tint[name], transparent: true, opacity: 0.7 })));
      this.planeGroup.add(m);
    }
  }

  showPlanes(on, hover = null) {
    this.planeGroup.visible = on;
    for (const m of this.planeGroup.children) m.material.opacity = m.userData.plane === hover ? 0.4 : 0.14;
    this.requestRender();
  }

  // ---------- bodies ----------
  setBodies(bodies, { min, max } = {}) {
    for (const b of this.bodies) {
      b.mesh.geometry.dispose();
      b.lineObj.geometry.dispose();
      b.mesh.material.dispose();
      b.lineObj.material.dispose();
    }
    this.bodyGroup.clear();
    this.bodies = bodies.map((b) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(b.positions, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(b.normals, 3));
      g.setIndex(new THREE.BufferAttribute(b.indices, 1));
      const mesh = new THREE.Mesh(
        g,
        new THREE.MeshStandardMaterial({ color: this.colors.body, roughness: 0.62, metalness: 0.08, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }),
      );
      // Seams (where a round face closes on itself) are not drawn or pickable.
      const shown = [];
      for (const g of b.edgeGroups) if (!b.edges[g.i]?.seam) for (let k = g.start * 3; k < (g.start + g.count) * 3; k++) shown.push(b.lines[k]);
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(shown, 3));
      const lineObj = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: this.colors.edge }));
      this.bodyGroup.add(mesh, lineObj);
      return { ...b, mesh, lineObj };
    });
    if (min && max) {
      const ext = Math.max(...max.map((v, i) => Math.max(Math.abs(v), Math.abs(min[i]))));
      const snapped = Math.max(100, Math.ceil(ext / 50) * 50);
      if (snapped !== this.extent) {
        this.extent = snapped;
        this.buildGrid();
        this.buildPlanes();
      }
      this.bounds = { min, max };
    } else this.bounds = null;
    this.refreshHighlights();
    if (!this.fitted && this.bodies.length) {
      this.fitted = true;
      this.fit(false);
    }
    this.requestRender();
  }

  // ---------- highlights ----------
  lineMaterial(color, width, dashed = false) {
    const m = new LineMaterial({ color, linewidth: width, depthTest: false, transparent: true, dashed, dashSize: 2, gapSize: 1.5 });
    m.resolution.set(this.el.clientWidth || 1, this.el.clientHeight || 1);
    this.lineMaterials.add(m);
    return m;
  }

  fatLines(flat, color, width, dashed = false) {
    const g = new LineSegmentsGeometry();
    g.setPositions(flat);
    const l = new LineSegments2(g, this.lineMaterial(color, width, dashed));
    if (dashed) l.computeLineDistances();
    l.renderOrder = 5;
    return l;
  }

  disposeGroup(group) {
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        this.lineMaterials.delete(o.material);
        o.material.dispose();
      }
    });
    group.clear();
  }

  setHighlights(h) {
    this.highlight = { ...this.highlight, ...h };
    this.refreshHighlights();
  }

  refreshHighlights() {
    this.disposeGroup(this.overlay);
    const draw = (pick, color, strong) => {
      const body = this.bodies.find((b) => b.id === pick.b);
      if (!body) return;
      if (pick.kind === 'face') {
        const grp = body.faceGroups.find((g) => g.i === pick.i);
        if (!grp) return;
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', body.mesh.geometry.getAttribute('position'));
        g.setIndex(new THREE.BufferAttribute(body.indices.subarray(grp.start, grp.start + grp.count), 1));
        const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: strong ? 0.62 : 0.4, side: THREE.DoubleSide, depthWrite: false }));
        m.renderOrder = 3;
        this.overlay.add(m);
      } else {
        const grp = body.edgeGroups.find((g) => g.i === pick.i);
        if (!grp) return;
        this.overlay.add(this.fatLines(body.lines.subarray(grp.start * 3, (grp.start + grp.count) * 3), color, strong ? 4.5 : 3.5));
      }
    };
    for (const p of this.highlight.selected || []) draw(p, this.colors.select, true);
    const hv = this.highlight.hover;
    if (hv && hv.kind !== 'plane') draw(hv, this.colors.hover, false);
    this.requestRender();
  }

  // ---------- picking ----------
  ndc(evt) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((evt.clientX - r.left) / r.width) * 2 - 1, y: -((evt.clientY - r.top) / r.height) * 2 + 1, px: evt.clientX - r.left, py: evt.clientY - r.top, w: r.width, h: r.height };
  }

  pickAt(evt, filter = this.pickFilter) {
    if (filter === 'none') return null;
    const n = this.ndc(evt);
    this.raycaster.setFromCamera(new THREE.Vector2(n.x, n.y), this.camera);
    if (filter === 'plane' || (filter === 'sketchPlane' && this.planeGroup.visible)) {
      // Faces win over the origin planes when both are under the cursor.
      const face = this.pickFace();
      if (face && face.planar) return face;
      const hit = this.raycaster.intersectObjects(this.planeGroup.children, false)[0];
      return hit ? { kind: 'plane', name: hit.object.userData.plane } : null;
    }
    const face = filter !== 'edge' ? this.pickFace() : this.pickFace();
    if (filter !== 'face') {
      const edge = this.pickEdge(n, face ? face.depth : Infinity);
      if (edge) return edge;
    }
    return filter === 'edge' ? null : face;
  }

  pickFace() {
    const hit = this.raycaster.intersectObjects(
      this.bodies.map((b) => b.mesh),
      false,
    )[0];
    if (!hit) return null;
    const body = this.bodies.find((b) => b.mesh === hit.object);
    const at = hit.faceIndex * 3;
    const grp = body.faceGroups.find((g) => at >= g.start && at < g.start + g.count);
    if (!grp) return null;
    const desc = body.faces[grp.i];
    return { kind: 'face', b: body.id, i: grp.i, depth: hit.distance, point: hit.point.toArray(), planar: !!(desc && desc.n), desc };
  }

  pickEdge(n, faceDepth) {
    const cam = this.camera;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const origin = this.raycaster.ray.origin;
    const dir = this.raycaster.ray.direction;
    const worldPerPx = (cam.top - cam.bottom) / cam.zoom / n.h;
    let best = null;
    for (const body of this.bodies) {
      const L = body.lines;
      for (const g of body.edgeGroups) {
        if (body.edges[g.i]?.seam) continue;
        for (let k = g.start; k < g.start + g.count; k += 2) {
          a.set(L[k * 3], L[k * 3 + 1], L[k * 3 + 2]);
          b.set(L[k * 3 + 3], L[k * 3 + 4], L[k * 3 + 5]);
          const da = a.clone().sub(origin);
          const db = b.clone().sub(origin);
          const depthA = da.dot(dir);
          const depthB = db.dot(dir);
          // Distance in the screen plane (orthographic: drop the component along the view direction).
          const pa = da.addScaledVector(dir, -depthA);
          const pb = db.addScaledVector(dir, -depthB);
          const ab = pb.clone().sub(pa);
          const l2 = ab.lengthSq() || 1e-12;
          const t = Math.max(0, Math.min(1, -pa.dot(ab) / l2));
          const d = pa.addScaledVector(ab, t).length() / worldPerPx;
          if (d > 7) continue;
          const depth = depthA + (depthB - depthA) * t;
          if (depth > faceDepth + 6 * worldPerPx + 0.05) continue;
          if (!best || d < best.d - 0.5 || (Math.abs(d - best.d) <= 0.5 && depth < best.depth)) best = { kind: 'edge', b: body.id, i: g.i, d, depth, desc: body.edges[g.i] };
        }
      }
    }
    return best;
  }

  bindPointer() {
    let down = null;
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, button: e.button, moved: false };
      this.handlers.pointer?.('down', e);
    });
    c.addEventListener('pointermove', (e) => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) down.moved = true;
      this.handlers.pointer?.('move', e);
      if (!this.drawMode && !e.buttons) this.handlers.hover?.(this.pickAt(e));
    });
    c.addEventListener('pointerup', (e) => {
      this.handlers.pointer?.('up', e);
      if (down && !down.moved && down.button === 0 && !this.drawMode) this.handlers.click?.(this.pickAt(e), e);
      down = null;
    });
    c.addEventListener('pointerleave', () => {
      if (!this.drawMode) this.handlers.hover?.(null);
    });
    c.addEventListener('dblclick', (e) => this.handlers.pointer?.('dbl', e));
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Left-drag draws instead of orbiting while a sketch is open.
  setDrawMode(on) {
    this.drawMode = on;
    this.controls.mouseButtons.LEFT = on ? -1 : THREE.MOUSE.ROTATE;
    this.controls.mouseButtons.RIGHT = on ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN;
    this.controls.touches.ONE = on ? -1 : THREE.TOUCH.ROTATE;
  }

  // ---------- plane helpers (sketching) ----------
  screenToPlane(evt, frame) {
    const n = this.ndc(evt);
    this.raycaster.setFromCamera(new THREE.Vector2(n.x, n.y), this.camera);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(...frame.normal), new THREE.Vector3(...frame.origin));
    const hit = new THREE.Vector3();
    const ray = this.raycaster.ray;
    // Orthographic rays can start behind the plane; intersect the full line.
    const denom = plane.normal.dot(ray.direction);
    if (Math.abs(denom) < 1e-9) return null;
    const t = -(ray.origin.dot(plane.normal) + plane.constant) / denom;
    hit.copy(ray.origin).addScaledVector(ray.direction, t);
    return toLocal(frame, hit.toArray());
  }

  worldToScreen(p) {
    const v = new THREE.Vector3(...p).project(this.camera);
    return [((v.x + 1) / 2) * this.el.clientWidth, ((1 - v.y) / 2) * this.el.clientHeight];
  }

  pxToWorld() {
    return (this.camera.top - this.camera.bottom) / this.camera.zoom / Math.max(1, this.el.clientHeight);
  }

  // ---------- camera ----------
  lookFrom(dirIn, animate = true) {
    const dir = new THREE.Vector3(...dirIn).normalize();
    // Straight up/down views need a hair of tilt so "up" on screen is well defined.
    if (Math.abs(dir.z) > 0.9999) dir.set(0, -1e-4 * Math.sign(dir.z), dir.z).normalize();
    const target = this.controls.target.clone();
    const from = this.camera.position.clone().sub(target).normalize();
    const start = performance.now();
    const dur = animate ? 260 : 0;
    const q = new THREE.Quaternion().setFromUnitVectors(from, dir);
    const id = new THREE.Quaternion();
    const step = () => {
      const k = dur ? Math.min(1, (performance.now() - start) / dur) : 1;
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const d = from.clone().applyQuaternion(id.clone().slerp(q, e));
      this.camera.position.copy(target).addScaledVector(d, CAM_DIST);
      this.controls.update();
      this.requestRender();
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  }

  lookAtFrame(frame, animate = true) {
    const n = frame.normal;
    const y = frame.y;
    const s = Math.abs(n[2]) > 0.9999 ? -Math.sign(n[2]) * 1e-4 : 0;
    this.lookFrom([n[0] + y[0] * s, n[1] + y[1] * s, n[2] + y[2] * s], animate);
  }

  view(name) {
    const dirs = { iso: [1, -1.3, 0.9], top: [0, 0, 1], bottom: [0, 0, -1], front: [0, -1, 0], back: [0, 1, 0], right: [1, 0, 0], left: [-1, 0, 0] };
    this.lookFrom(dirs[name] || dirs.iso);
  }

  fit(animate = true, box = this.bounds) {
    const min = box ? box.min : [-40, -40, 0];
    const max = box ? box.max : [40, 40, 30];
    const center = new THREE.Vector3((min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2);
    const radius = Math.max(8, new THREE.Vector3(max[0] - min[0], max[1] - min[1], max[2] - min[2]).length() / 2);
    const offset = this.camera.position.clone().sub(this.controls.target);
    const aspect = this.el.clientWidth / Math.max(1, this.el.clientHeight);
    const zoom = Math.min(60 / radius, (60 * aspect) / radius) * 0.82;
    const z0 = this.camera.zoom;
    const t0 = this.controls.target.clone();
    const start = performance.now();
    const dur = animate ? 240 : 0;
    const step = () => {
      const k = dur ? Math.min(1, (performance.now() - start) / dur) : 1;
      this.controls.target.lerpVectors(t0, center, k);
      this.camera.position.copy(this.controls.target).add(offset);
      this.camera.zoom = z0 + (zoom - z0) * k;
      this.camera.updateProjectionMatrix();
      this.controls.update();
      this.requestRender();
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  }

  snapshot() {
    this.renderer.render(this.scene, this.camera);
    return this.canvas;
  }
}
