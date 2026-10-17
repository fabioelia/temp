// THE HARDLINE — the final maze.
//
// Operator: sees only the 3x3 patch of the maze around them: floor glyphs, low
//           walls, red "watched" cells, and the phone if it is close.
// Mentor:   has the whole map (glyphs, walls, watched cells, the phone) but not
//           where the Operator is standing.
//
// Rule: walk to the ringing phone without stepping on a watched cell (which throws
// you back to the start and costs time), then pick up.

import { GLYPH_IDS } from '../../shared/glyphs.js';
import { PENALTY_MS } from '../../shared/rooms.js';

const N = 6;
const DIRS = {
  n: { dx: 0, dy: -1, bit: 0, opp: 's' },
  e: { dx: 1, dy: 0, bit: 1, opp: 'w' },
  s: { dx: 0, dy: 1, bit: 2, opp: 'n' },
  w: { dx: -1, dy: 0, bit: 3, opp: 'e' },
};
const DIR_KEYS = Object.keys(DIRS);

const idx = (x, y) => y * N + x;
const inb = (x, y) => x >= 0 && y >= 0 && x < N && y < N;

function carve(rng) {
  // walls[idx] = {n,e,s,w}: true when a wall is present
  const walls = Array.from({ length: N * N }, () => ({ n: true, e: true, s: true, w: true }));
  const seen = new Set([0]);
  const stack = [[rng.int(N), rng.int(N)]];
  seen.clear();
  seen.add(idx(stack[0][0], stack[0][1]));
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const options = rng.shuffle(DIR_KEYS).filter((k) => {
      const d = DIRS[k];
      return inb(x + d.dx, y + d.dy) && !seen.has(idx(x + d.dx, y + d.dy));
    });
    if (!options.length) {
      stack.pop();
      continue;
    }
    const k = options[0];
    const d = DIRS[k];
    const nx = x + d.dx;
    const ny = y + d.dy;
    walls[idx(x, y)][k] = false;
    walls[idx(nx, ny)][d.opp] = false;
    seen.add(idx(nx, ny));
    stack.push([nx, ny]);
  }
  // knock out a few extra walls so there are loops and more than one route
  for (let i = 0; i < 5; i++) {
    const x = rng.int(N);
    const y = rng.int(N);
    const k = rng.pick(DIR_KEYS);
    const d = DIRS[k];
    if (!inb(x + d.dx, y + d.dy)) continue;
    walls[idx(x, y)][k] = false;
    walls[idx(x + d.dx, y + d.dy)][d.opp] = false;
  }
  return walls;
}

function bfs(walls, from, blocked = new Set()) {
  const dist = new Map([[from, 0]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    const x = cur % N;
    const y = Math.floor(cur / N);
    for (const k of DIR_KEYS) {
      if (walls[cur][k]) continue;
      const d = DIRS[k];
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (!inb(nx, ny)) continue;
      const ni = idx(nx, ny);
      if (dist.has(ni) || blocked.has(ni)) continue;
      dist.set(ni, dist.get(cur) + 1);
      q.push(ni);
    }
  }
  return dist;
}

const wallBits = (w) => `${+w.n}${+w.e}${+w.s}${+w.w}`;

function patchSignature(maze, x, y) {
  const parts = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (!inb(nx, ny)) {
        parts.push('XX');
        continue;
      }
      const c = maze.cells[idx(nx, ny)];
      parts.push(`${c.g}${wallBits(c.w)}${c.trap ? 'T' : ''}${c.exit ? 'E' : ''}`);
    }
  }
  return parts.join('|');
}

export function generateMaze(rng) {
  const pool = rng.sample(GLYPH_IDS, 8);
  for (let attempt = 0; attempt < 400; attempt++) {
    const walls = carve(rng);
    const exit = rng.int(N * N);
    const fromExit = bfs(walls, exit);
    const far = [...fromExit.entries()].filter(([, d]) => d >= 8).map(([i]) => i);
    if (!far.length) continue;
    const start = rng.pick(far);
    const forbidden = new Set([start, exit]);
    // never put a watched cell directly beside the start
    const sx = start % N;
    const sy = Math.floor(start / N);
    for (const k of DIR_KEYS) if (inb(sx + DIRS[k].dx, sy + DIRS[k].dy)) forbidden.add(idx(sx + DIRS[k].dx, sy + DIRS[k].dy));
    const candidates = rng.shuffle([...Array(N * N).keys()].filter((i) => !forbidden.has(i)));
    const traps = new Set(candidates.slice(0, 3));
    if (!bfs(walls, start, traps).has(exit)) continue;

    const cells = walls.map((w, i) => ({
      x: i % N,
      y: Math.floor(i / N),
      g: rng.pick(pool),
      w,
      trap: traps.has(i),
      exit: i === exit,
    }));
    const maze = { size: N, cells, start, exit };
    const sig = patchSignature(maze, start % N, Math.floor(start / N));
    let unique = true;
    for (let i = 0; i < N * N; i++) {
      if (i !== start && patchSignature(maze, i % N, Math.floor(i / N)) === sig) {
        unique = false;
        break;
      }
    }
    if (!unique) continue;
    return maze;
  }
  throw new Error('maze: could not generate');
}

function cellView(c) {
  return { x: c.x, y: c.y, g: c.g, w: wallBits(c.w), trap: c.trap, exit: c.exit };
}

function operatorView(state) {
  const px = state.pos % N;
  const py = Math.floor(state.pos / N);
  const cells = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (inb(px + dx, py + dy)) cells.push(cellView(state.maze.cells[idx(px + dx, py + dy)]));
    }
  }
  return { size: N, pos: { x: px, y: py }, cells, atExit: state.pos === state.maze.exit };
}

function mentorView(state) {
  return { size: N, cells: state.maze.cells.map(cellView) };
}

export default {
  id: 'maze',
  create(rng) {
    const maze = generateMaze(rng);
    const state = { maze, pos: maze.start };
    return { state, views: { operator: operatorView(state), mentor: mentorView(state) } };
  },

  act(state, action) {
    if (action?.type === 'answer') {
      if (state.pos !== state.maze.exit) return null;
      return { result: 'solved', events: { operator: { pickup: true } } };
    }
    if (action?.type !== 'move' || !(action.dir in DIRS)) return null;
    const x = state.pos % N;
    const y = Math.floor(state.pos / N);
    const d = DIRS[action.dir];
    if (state.maze.cells[state.pos].w[action.dir] || !inb(x + d.dx, y + d.dy)) {
      return { result: 'info', events: { operator: { bump: action.dir } } };
    }
    const next = idx(x + d.dx, y + d.dy);
    const from = { x, y };
    if (state.maze.cells[next].trap) {
      state.pos = state.maze.start;
      return {
        result: 'wrong',
        penaltyMs: PENALTY_MS,
        events: { operator: { trap: true, from, via: { x: x + d.dx, y: y + d.dy } } },
        views: { operator: operatorView(state) },
      };
    }
    state.pos = next;
    return {
      result: 'move',
      events: { operator: { from, dir: action.dir } },
      views: { operator: operatorView(state) },
    };
  },
};
