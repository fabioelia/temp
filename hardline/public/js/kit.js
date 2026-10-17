// Scene-building helpers shared by the Operator rooms.

import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { materials, tiled, glow, fadeTexture } from './textures.js';

export function mesh(geo, mat, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true, receive = true, parent = null, name = '' } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = cast;
  m.receiveShadow = receive;
  if (name) m.name = name;
  parent?.add(m);
  return m;
}

export function box(w, h, d, mat, opts = {}) {
  return mesh(new THREE.BoxGeometry(w, h, d), mat, opts);
}

export function cyl(rt, rb, h, mat, opts = {}, seg = 24) {
  return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, opts);
}

/** An invisible, generously sized pick target for a hotspot. */
export function hitbox(w, h, d, opts = {}) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }), { cast: false, receive: false, ...opts });
  return m;
}

/** Floor, ceiling and four walls (all facing inward). Returns the group. */
export function roomShell(parent, { w, h, d, wall = 'panel', floor = 'tile', ceil = 'concrete', wallRepeat = 4, floorRepeat = 6, wallTint = null, openFront = false }) {
  const M = materials();
  const g = new THREE.Group();
  const wallMat = tiled(M[wall], wallRepeat, Math.max(1, Math.round(wallRepeat * h / w)));
  const sideMat = tiled(M[wall], Math.round(wallRepeat * d / w), Math.max(1, Math.round(wallRepeat * h / w)));
  if (wallTint != null) {
    wallMat.color.set(wallTint);
    sideMat.color.set(wallTint);
  }
  const fl = floor ? mesh(new THREE.PlaneGeometry(w, d), tiled(M[floor], floorRepeat, Math.round(floorRepeat * d / w)), { rx: -Math.PI / 2, y: 0, cast: false, parent: g, name: 'floor' }) : null;
  const ce = mesh(new THREE.PlaneGeometry(w, d), tiled(M[ceil], 4, 4), { rx: Math.PI / 2, y: h, cast: false, parent: g });
  mesh(new THREE.PlaneGeometry(w, h), wallMat, { z: -d / 2, y: h / 2, cast: false, parent: g, name: 'backWall' });
  if (!openFront) mesh(new THREE.PlaneGeometry(w, h), wallMat, { z: d / 2, y: h / 2, ry: Math.PI, cast: false, parent: g });
  mesh(new THREE.PlaneGeometry(d, h), sideMat, { x: -w / 2, y: h / 2, ry: Math.PI / 2, cast: false, parent: g, name: 'leftWall' });
  mesh(new THREE.PlaneGeometry(d, h), sideMat, { x: w / 2, y: h / 2, ry: -Math.PI / 2, cast: false, parent: g, name: 'rightWall' });
  parent.add(g);
  return { group: g, floor: fl, ceiling: ce };
}

/**
 * A glossy wet floor. With reflections enabled a Reflector sits underneath a
 * translucent tile layer, so the room, lamps and displays mirror in the stone.
 */
export function wetFloor(stage, parent, { w, d, repeat = 6, tint = 0x5e8a6e, opacity = 0.8, roughness = null, base = 'tile' }) {
  const M = materials();
  const g = new THREE.Group();
  const tileMat = tiled(M[base], repeat, Math.round((repeat * d) / w));
  if (roughness != null) tileMat.roughness = roughness;
  if (stage.quality.reflections) {
    const rw = Math.round((stage.container.clientWidth || 1280) * 0.6);
    const rh = Math.round((stage.container.clientHeight || 720) * 0.6);
    const mirror = new Reflector(new THREE.PlaneGeometry(w, d), { clipBias: 0.003, textureWidth: rw, textureHeight: rh, color: tint });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.y = 0.0;
    g.add(mirror);
    tileMat.transparent = true;
    tileMat.opacity = opacity;
    tileMat.depthWrite = false;
    stage.onLowQuality(() => {
      mirror.visible = false;
      tileMat.opacity = 1;
      tileMat.transparent = false;
      tileMat.depthWrite = true;
    });
  }
  const tile = mesh(new THREE.PlaneGeometry(w, d), tileMat, { rx: -Math.PI / 2, y: 0.004, cast: false, parent: g, name: 'floor' });
  tile.renderOrder = 1;
  parent.add(g);
  return g;
}

/** A faint volumetric cone of light, for the "dust in a beam" look. */
export function lightCone(parent, { color = 0x9dffbf, radius = 2, height = 5, opacity = 0.09, x = 0, y = 0, z = 0 }) {
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    alphaMap: fadeTexture(),
    toneMapped: false,
  });
  const geo = new THREE.CylinderGeometry(0.05, radius, height, 32, 1, true);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/** Slowly drifting dust motes. Call the returned `update(dt)` from a tick. */
export function dust(parent, { w, h, d, count = 260, color = 0x9dffbf, size = 0.03, center = [0, 0, 0] }) {
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = center[0] + (Math.random() - 0.5) * w;
    pos[i * 3 + 1] = Math.random() * h;
    pos[i * 3 + 2] = center[2] + (Math.random() - 0.5) * d;
    vel[i * 3] = (Math.random() - 0.5) * 0.03;
    vel[i * 3 + 1] = (Math.random() - 0.3) * 0.04;
    vel[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false });
  const pts = new THREE.Points(geo, mat);
  parent.add(pts);
  return {
    points: pts,
    update(dt) {
      for (let i = 0; i < count; i++) {
        pos[i * 3] += vel[i * 3] * dt * 10;
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt * 10;
        pos[i * 3 + 2] += vel[i * 3 + 2] * dt * 10;
        if (pos[i * 3 + 1] > h) pos[i * 3 + 1] = 0;
        if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = h;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

/**
 * Wireframe skin on the room's edges that flickers and tears now and then, as if
 * the construct is only just holding the geometry together.
 */
export function glitchEdges(parent, { w, h, d, y = 0, color = 0x2dff7a }) {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w - 0.04, h - 0.04, d - 0.04, Math.round(w / 2), Math.round(h / 2), Math.round(d / 2)));
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const lines = new THREE.LineSegments(geo, mat);
  lines.position.y = y + h / 2;
  parent.add(lines);

  const tearMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
  const tear = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.06), tearMat);
  parent.add(tear);
  let next = 2 + Math.random() * 3;
  let life = 0;
  return {
    update(dt, t) {
      mat.opacity = 0.08 + 0.05 * Math.sin(t * 1.3) + (Math.random() < 0.02 ? 0.25 : 0);
      next -= dt;
      if (next < 0) {
        next = 2.5 + Math.random() * 5;
        life = 0.16;
        const side = Math.floor(Math.random() * 3);
        tear.scale.set(2 + Math.random() * 5, 1 + Math.random() * 3, 1);
        tear.position.set((Math.random() - 0.5) * (w - 1), 0.4 + Math.random() * (h - 0.8), side === 0 ? -d / 2 + 0.03 : (Math.random() - 0.5) * (d - 1));
        tear.rotation.y = side === 0 ? 0 : side === 1 ? Math.PI / 2 : 0;
        if (side === 1) tear.position.set(-w / 2 + 0.03, tear.position.y, (Math.random() - 0.5) * (d - 1));
        if (side === 2) tear.position.set(w / 2 - 0.03, tear.position.y, (Math.random() - 0.5) * (d - 1));
      }
      if (life > 0) {
        life -= dt;
        tearMat.opacity = life > 0 ? 0.35 * Math.random() : 0;
      }
    },
  };
}

/** A glowing strip light (emissive mesh) plus an optional point light. */
export function strip(parent, { w = 3, d = 0.12, color = 0xbfffd2, intensity = 2.6, x = 0, y = 0, z = 0, ry = 0, light = 0, lightDist = 9 }) {
  const m = mesh(new THREE.BoxGeometry(w, 0.05, d), glow(color, intensity), { x, y, z, ry, cast: false, receive: false, parent });
  if (light) {
    const pl = new THREE.PointLight(color, light, lightDist, 2);
    pl.position.set(x, y - 0.3, z);
    parent.add(pl);
  }
  return m;
}

export const COLORS = {
  red: 0xff3030,
  blue: 0x3a6bff,
  green: 0x30ff70,
  amber: 0xffb020,
  yellow: 0xffe033,
  white: 0xf2f6ff,
  violet: 0xa45cff,
  cyan: 0x2fe6ff,
  magenta: 0xff3aa8,
  orange: 0xff8a20,
};
