// Tiny safe expression evaluator for dimensions: numbers, parameters, + - * / ^ ( ), a few functions.
// Angles are in degrees, lengths in millimetres.

const FUNCS = {
  sin: (a) => Math.sin((a * Math.PI) / 180),
  cos: (a) => Math.cos((a * Math.PI) / 180),
  tan: (a) => Math.tan((a * Math.PI) / 180),
  asin: (a) => (Math.asin(a) * 180) / Math.PI,
  acos: (a) => (Math.acos(a) * 180) / Math.PI,
  atan: (a) => (Math.atan(a) * 180) / Math.PI,
  sqrt: Math.sqrt,
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
};
const CONSTS = { pi: Math.PI };

function tokenize(src) {
  const out = [];
  const re = /\s*(?:(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+)|([A-Za-z_][A-Za-z0-9_]*)|(.))/gy;
  let m;
  while ((m = re.exec(src)) && m[0] !== '') {
    if (m[1] !== undefined) out.push({ t: 'num', v: parseFloat(m[1]) });
    else if (m[2] !== undefined) out.push({ t: 'id', v: m[2] });
    else if (m[3].trim()) out.push({ t: 'op', v: m[3] });
  }
  return out;
}

export function evalExpr(src, scope = {}) {
  if (typeof src === 'number') {
    if (!Number.isFinite(src)) throw new Error('Not a number');
    return src;
  }
  if (typeof src !== 'string' || !src.trim()) throw new Error('Value is empty');
  const toks = tokenize(src.replace(/mm\b/g, ''));
  let i = 0;
  const peek = () => toks[i];
  const take = (v) => {
    if (toks[i] && toks[i].t === 'op' && toks[i].v === v) {
      i++;
      return true;
    }
    return false;
  };
  const expr = () => {
    let v = term();
    for (;;) {
      if (take('+')) v += term();
      else if (take('-')) v -= term();
      else return v;
    }
  };
  const term = () => {
    let v = unary();
    for (;;) {
      if (take('*')) v *= unary();
      else if (take('/')) v /= unary();
      else return v;
    }
  };
  const unary = () => {
    if (take('-')) return -unary();
    if (take('+')) return unary();
    return power();
  };
  const power = () => {
    const b = atom();
    return take('^') ? Math.pow(b, unary()) : b;
  };
  const atom = () => {
    const t = peek();
    if (!t) throw new Error('Expression ends too early');
    i++;
    if (t.t === 'num') return t.v;
    if (t.t === 'id') {
      if (take('(')) {
        const fn = FUNCS[t.v];
        if (!fn) throw new Error(`Unknown function "${t.v}"`);
        const args = [];
        if (!take(')')) {
          do args.push(expr());
          while (take(','));
          if (!take(')')) throw new Error('Missing )');
        }
        return fn(...args);
      }
      if (Object.prototype.hasOwnProperty.call(scope, t.v)) return scope[t.v];
      if (t.v in CONSTS) return CONSTS[t.v];
      throw new Error(`Unknown parameter "${t.v}"`);
    }
    if (t.v === '(') {
      const v = expr();
      if (!take(')')) throw new Error('Missing )');
      return v;
    }
    throw new Error(`Unexpected "${t.v}"`);
  };
  const v = expr();
  if (i < toks.length) throw new Error(`Unexpected "${toks[i].v}"`);
  if (!Number.isFinite(v)) throw new Error('Result is not a finite number');
  return v;
}

// Parameters are evaluated in order; each may use the ones above it.
export function resolveParams(params = []) {
  const scope = {};
  const errors = {};
  for (const p of params) {
    if (!p || !p.name) continue;
    try {
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(p.name)) throw new Error('Names use letters, digits and _');
      if (p.name in FUNCS || p.name in CONSTS) throw new Error('That name is reserved');
      scope[p.name] = evalExpr(p.value, scope);
    } catch (e) {
      errors[p.name] = e.message;
    }
  }
  return { scope, errors };
}

export function fmt(n, digits = 3) {
  if (!Number.isFinite(n)) return '–';
  const s = n.toFixed(digits);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}
