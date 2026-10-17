// THE VAULT — deduce the code from clues, then from how wrong you were.
//
// Operator: a vault with 3-4 dials. Each dial can show any of six glyphs (printed on a keypad
//           ring). Pulling the lever tries the code: a wrong try shows how many dials were in the
//           right place — and costs a strike.
// Mentor:   a legend turning each glyph into a letter, and a list of logical clues about the code
//           ("dial 2 is not C", "B comes before D", "exactly one of A, E, F is used", ...).
//
// The clues narrow the code to at most three possibilities; the feedback finishes the job.

import { GLYPH_IDS } from '../../shared/glyphs.js';
import { PENALTY_MS } from '../../shared/rooms.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const STAGES = [
  { dials: 3, symbols: 5 },
  { dials: 4, symbols: 6 },
  { dials: 4, symbols: 6 },
];
const MAX_CANDIDATES = [3, 3, 2];

function permutations(items, k) {
  const out = [];
  const rec = (acc, rest) => {
    if (acc.length === k) return out.push(acc);
    rest.forEach((x, i) => rec([...acc, x], [...rest.slice(0, i), ...rest.slice(i + 1)]));
  };
  rec([], items);
  return out;
}

const idx = (l) => LETTERS.indexOf(l);

/** Does `code` (array of letters) satisfy the clue? */
export function holds(clue, code) {
  switch (clue.t) {
    case 'not':
      return code[clue.pos] !== clue.letter;
    case 'in':
      return clue.letters.includes(code[clue.pos]);
    case 'before':
      return idx(code[clue.a]) < idx(code[clue.b]);
    case 'absent':
      return !code.includes(clue.letter);
    case 'count':
      return clue.letters.filter((l) => code.includes(l)).length === clue.n;
    default:
      return false;
  }
}

function clueText(c) {
  switch (c.t) {
    case 'not':
      return `Dial ${c.pos + 1} is NOT ${c.letter}.`;
    case 'in':
      return `Dial ${c.pos + 1} is one of ${c.letters.join(', ')}.`;
    case 'before':
      return `The letter on dial ${c.a + 1} comes earlier in the alphabet than the letter on dial ${c.b + 1}.`;
    case 'absent':
      return `${c.letter} is not used at all.`;
    case 'count':
      return `Exactly ${c.n} of ${c.letters.join(', ')} ${c.n === 1 ? 'is' : 'are'} used.`;
  }
}

function randomClue(rng, code, letters, dials) {
  const pick = () => rng.int(6);
  switch (pick()) {
    case 0: {
      const pos = rng.int(dials);
      return { t: 'not', pos, letter: rng.pick(letters.filter((l) => l !== code[pos])) };
    }
    case 1: {
      const pos = rng.int(dials);
      const others = rng.sample(letters.filter((l) => l !== code[pos]), 2);
      return { t: 'in', pos, letters: [code[pos], ...others].sort() };
    }
    case 2: {
      const a = rng.int(dials);
      let b = rng.int(dials);
      if (a === b) b = (b + 1) % dials;
      return idx(code[a]) < idx(code[b]) ? { t: 'before', a, b } : { t: 'before', a: b, b: a };
    }
    case 3: {
      const unused = letters.filter((l) => !code.includes(l));
      return unused.length ? { t: 'absent', letter: rng.pick(unused) } : null;
    }
    default: {
      const set = rng.sample(letters, 3).sort();
      return { t: 'count', letters: set, n: set.filter((l) => code.includes(l)).length };
    }
  }
}

function buildStage(state, rng) {
  const { dials, symbols } = STAGES[state.stage];
  const letters = LETTERS.slice(0, symbols);
  const all = permutations(letters, dials);
  for (let attempt = 0; attempt < 400; attempt++) {
    const code = rng.sample(letters, dials);
    let cands = all;
    const clues = [];
    for (let guard = 0; guard < 60 && cands.length > MAX_CANDIDATES[state.stage] && clues.length < 9; guard++) {
      const c = randomClue(rng, code, letters, dials);
      if (!c || !holds(c, code)) continue;
      const next = cands.filter((cd) => holds(c, cd));
      if (next.length < cands.length) {
        clues.push(c);
        cands = next;
      }
    }
    if (cands.length > MAX_CANDIDATES[state.stage] || clues.length < 3) continue;
    // the glyphs behind the letters, and the order they are printed on the vault's keypad ring
    const glyphs = rng.sample(GLYPH_IDS, symbols);
    const byLetter = Object.fromEntries(letters.map((l, i) => [l, glyphs[i]]));
    state.secret = code.map((l) => byLetter[l]);
    state.letters = letters;
    state.byLetter = byLetter;
    state.clues = clues;
    state.candidates = cands.length;
    const ring = rng.shuffle(glyphs);
    state.ring = ring;
    return {
      stage: state.stage,
      stageCount: STAGES.length,
      dials,
      glyphs: ring,
    };
  }
  throw new Error('vault: could not generate a stage');
}

function mentorView(state) {
  return {
    stage: state.stage,
    stageCount: STAGES.length,
    dials: STAGES[state.stage].dials,
    legend: state.letters.map((l) => ({ letter: l, glyph: state.byLetter[l] })),
    clues: state.clues.map((c) => ({ ...c, text: clueText(c) })),
  };
}

export default {
  id: 'vault',
  create(rng) {
    const state = { stage: 0 };
    const operator = buildStage(state, rng);
    return { state, views: { operator, mentor: mentorView(state) } };
  },

  act(state, action, rng) {
    if (action?.type !== 'open' || !Array.isArray(action.code)) return null;
    const dials = STAGES[state.stage].dials;
    if (action.code.length !== dials || !action.code.every((g) => state.ring.includes(g))) return null;
    const bulls = action.code.filter((g, i) => g === state.secret[i]).length;
    if (bulls !== dials) {
      return { result: 'wrong', penaltyMs: PENALTY_MS, events: { operator: { bulls, of: dials } } };
    }
    state.stage += 1;
    if (state.stage >= STAGES.length) return { result: 'solved' };
    const operator = buildStage(state, rng);
    return { result: 'stage', views: { operator, mentor: mentorView(state) } };
  },
};
