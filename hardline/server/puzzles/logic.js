// THE LOGIC WALL — a circuit whose gates mean something different every time.
//
// Operator: a wall of switches, gate chips and wires, ending in one lamp. Every gate chip carries
//           a glyph and a letter. Nothing shows what the glyphs mean, and the wires don't light
//           up: pressing ENGAGE tests the switches, and a failed test costs a strike.
// Mentor:   which glyph is which gate (AND, OR, XOR, NAND, NOR, XNOR). The meanings are re-rolled
//           every attempt, so last time's notes are useless.
//
// Set the switches so the lamp lights. The Operator describes the wiring; the Mentor works it out.

import { GLYPH_IDS } from '../../shared/glyphs.js';
import { PENALTY_MS } from '../../shared/rooms.js';

export const GATES = ['AND', 'OR', 'XOR', 'NAND', 'NOR', 'XNOR'];
const SWITCHES = [4, 5, 6];
const LETTERS = 'ABCDEFGH';

export function applyGate(type, a, b) {
  switch (type) {
    case 'AND':
      return a && b;
    case 'OR':
      return a || b;
    case 'XOR':
      return a !== b;
    case 'NAND':
      return !(a && b);
    case 'NOR':
      return !(a || b);
    case 'XNOR':
      return a === b;
  }
}

/** Evaluate the whole circuit for a switch assignment. `typeOf(gate)` supplies each gate's function. */
export function evaluate(circuit, switches, typeOf) {
  const val = {};
  const read = (src) => (src.s !== undefined ? !!switches[src.s] : val[src.g]);
  for (const g of circuit.gates) val[g.id] = applyGate(typeOf(g), read(g.in[0]), read(g.in[1]));
  return read(circuit.output);
}

const keyOf = (s) => (s.s !== undefined ? `s${s.s}` : `g${s.g}`);

function buildCircuit(rng, n, fanout) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const pool = Array.from({ length: n }, (_, i) => ({ s: i }));
    const gates = [];
    let reused = !fanout;
    let ok = true;
    while (pool.length > 1) {
      const ai = rng.int(pool.length);
      const a = pool.splice(ai, 1)[0];
      const choices = pool.map((p, i) => i).filter((i) => keyOf(pool[i]) !== keyOf(a));
      if (!choices.length) {
        ok = false;
        break;
      }
      const bi = rng.pick(choices);
      const b = pool.splice(bi, 1)[0];
      const gate = { id: LETTERS[gates.length], in: [a, b] };
      gates.push(gate);
      pool.push({ g: gate.id });
      // once, feed one of the inputs forward again so a signal is used twice
      if (!reused && gates.length >= 1 && pool.length >= 1 && rng.chance(0.55)) {
        pool.push(rng.pick([a, b]));
        reused = true;
      }
    }
    if (ok && reused && gates.length <= LETTERS.length) return { gates, output: pool[0] };
  }
  throw new Error('logic: could not build a circuit');
}

function buildStage(state, rng) {
  const n = SWITCHES[state.stage];
  for (let attempt = 0; attempt < 500; attempt++) {
    const circuit = buildCircuit(rng, n, state.stage === 2);
    // give each gate a function-bearing glyph
    const typeOf = (g) => state.gateOfGlyph[g.glyph];
    circuit.gates.forEach((g) => (g.glyph = rng.pick(GATES.map((t) => state.glyphOf[t]))));
    // how many of the 2^n assignments light the lamp? not too many, never zero
    let sat = 0;
    for (let m = 0; m < 1 << n; m++) {
      const sw = Array.from({ length: n }, (_, i) => !!(m & (1 << i)));
      if (evaluate(circuit, sw, typeOf)) sat++;
    }
    if (sat < 1 || sat > Math.max(2, Math.floor((1 << n) / 4))) continue;
    if (new Set(circuit.gates.map((g) => g.glyph)).size < Math.min(3, circuit.gates.length)) continue;
    state.circuit = circuit;
    state.n = n;
    return {
      stage: state.stage,
      stageCount: SWITCHES.length,
      switches: n,
      gates: circuit.gates.map((g) => ({ id: g.id, glyph: g.glyph, in: g.in.map((s) => ({ ...s })) })),
      output: { ...circuit.output },
    };
  }
  throw new Error('logic: could not build a stage');
}

function mentorView(state) {
  return {
    stage: state.stage,
    stageCount: SWITCHES.length,
    table: GATES.map((type) => ({ type, glyph: state.glyphOf[type] })),
  };
}

export default {
  id: 'logic',
  create(rng) {
    const glyphs = rng.sample(GLYPH_IDS, GATES.length);
    const glyphOf = Object.fromEntries(GATES.map((t, i) => [t, glyphs[i]]));
    const gateOfGlyph = Object.fromEntries(GATES.map((t) => [glyphOf[t], t]));
    const state = { stage: 0, glyphOf, gateOfGlyph };
    const operator = buildStage(state, rng);
    return { state, views: { operator, mentor: mentorView(state) } };
  },

  act(state, action, rng) {
    if (action?.type !== 'engage' || !Array.isArray(action.switches) || action.switches.length !== state.n) return null;
    const lit = evaluate(state.circuit, action.switches.map(Boolean), (g) => state.gateOfGlyph[g.glyph]);
    if (!lit) return { result: 'wrong', penaltyMs: PENALTY_MS, events: { operator: {} } };
    state.stage += 1;
    if (state.stage >= SWITCHES.length) return { result: 'solved' };
    const operator = buildStage(state, rng);
    return { result: 'stage', views: { operator, mentor: mentorView(state) } };
  },
};
