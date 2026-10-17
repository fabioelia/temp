// The construct's alphabet. Every glyph is a set of stroke-only SVG paths in a
// 100x100 box. Players never see names: they have to describe the shapes.
//
// "l0.1 0" with round caps renders as a dot.

export const GLYPHS = {
  ringdot: ['M18 50a32 32 0 1 0 64 0a32 32 0 1 0 -64 0', 'M50 50l0.1 0'],
  spire: ['M50 12L88 82L12 82Z', 'M50 12L50 60'],
  quad: ['M50 16L50 84', 'M16 50L84 50', 'M24 24l0.1 0', 'M76 24l0.1 0', 'M24 76l0.1 0', 'M76 76l0.1 0'],
  bolt: ['M66 10L34 52L62 52L30 92'],
  trident: ['M22 14L22 50Q22 68 50 68Q78 68 78 50L78 14', 'M50 12L50 90'],
  spiral: ['M46 50a6 6 0 0 1 12 0a12 12 0 0 1 -24 0a18 18 0 0 1 36 0a24 24 0 0 1 -48 0a30 30 0 0 1 60 0'],
  diamond: ['M50 8L92 50L50 92L8 50Z', 'M32 32L68 68', 'M68 32L32 68'],
  waves: ['M10 32Q30 8 50 32Q70 56 90 32', 'M10 66Q30 42 50 66Q70 90 90 66'],
  hbar: ['M26 16L26 84', 'M74 16L74 84', 'M26 56L74 56', 'M50 30l0.1 0'],
  hook: ['M30 26Q30 10 50 10Q74 10 74 32Q74 50 50 58L50 70', 'M50 88l0.1 0'],
  slashbox: ['M16 16L84 16L84 84L16 84Z', 'M16 84L84 16'],
  chevrons: ['M18 14L50 38L82 14', 'M18 40L50 64L82 40', 'M18 66L50 90L82 66'],
  crescent: ['M64 12A38 38 0 1 0 64 88A30 30 0 1 1 64 12Z'],
  anchor: ['M50 14a8 8 0 1 0 0.01 0', 'M50 30L50 90', 'M32 44L68 44', 'M14 62Q20 90 50 90Q80 90 86 62'],
  star: ['M50 8L61 38L92 38L67 57L77 90L50 70L23 90L33 57L8 38L39 38Z'],
  hextri: ['M50 8L87 29L87 71L50 92L13 71L13 29Z', 'M50 32L70 66L30 66Z'],
  eye: ['M8 50Q50 8 92 50Q50 92 8 50Z', 'M50 38a12 12 0 1 0 0.01 0'],
  gate: ['M20 90L20 36Q20 12 50 12Q80 12 80 36L80 90', 'M20 90L80 90', 'M20 56L80 56', 'M50 56L50 90'],
};

export const GLYPH_IDS = Object.keys(GLYPHS);

/** Standalone SVG markup for a glyph (used by the Mentor's manual). */
export function glyphSVG(id, { size = 48, color = 'currentColor', stroke = 7, cls = '' } = {}) {
  const paths = GLYPHS[id];
  if (!paths) return '';
  const d = paths.map((p) => `<path d="${p}"/>`).join('');
  return (
    `<svg class="glyph ${cls}" viewBox="0 0 100 100" width="${size}" height="${size}" ` +
    `fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`
  );
}

/** Draw a glyph on a 2D canvas context, centered at (cx, cy) with the given size. */
export function drawGlyph(ctx, id, cx, cy, size, { color = '#7dff9c', lineWidth = 7 } = {}) {
  const paths = GLYPHS[id];
  if (!paths) return;
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 100, size / 100);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const p of paths) ctx.stroke(new Path2D(p));
  ctx.restore();
}
