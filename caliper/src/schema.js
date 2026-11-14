// What each feature is called, which fields the inspector shows for it, and its defaults.

const OPS = [
  ['new', 'New body'],
  ['join', 'Join'],
  ['cut', 'Cut'],
  ['intersect', 'Intersect'],
];
const AXIS = [
  ['x', 'X'],
  ['y', 'Y'],
  ['z', 'Z'],
];
const opField = { key: 'op', label: 'Operation', type: 'select', options: OPS, def: 'join' };
const atField = { key: 'at', label: 'Position', type: 'vec3', def: [0, 0, 0], hint: 'x, y, z of the base centre' };
const rotField = { key: 'rot', label: 'Rotation', type: 'vec3', def: [0, 0, 0], unit: '°', hint: 'degrees about x, y, z' };

export const EDGE_PRESETS = [
  ['pick', 'Picked edges'],
  ['all', 'All edges', 'all'],
  ['vertical', 'Vertical edges', { parallel: 'z' }],
  ['top', 'Top edges', { on: 'top' }],
  ['bottom', 'Bottom edges', { on: 'bottom' }],
];
export const FACE_PRESETS = [
  ['pick', 'Picked faces'],
  ['top', 'Top face', 'top'],
  ['bottom', 'Bottom face', 'bottom'],
  ['front', 'Front face', 'front'],
  ['back', 'Back face', 'back'],
  ['left', 'Left face', 'left'],
  ['right', 'Right face', 'right'],
];

export const FEATURES = {
  sketch: {
    label: 'Sketch',
    fields: [
      { key: 'plane', label: 'Plane', type: 'plane' },
      { key: 'offset', label: 'Offset', type: 'expr', def: 0, unit: 'mm', hint: 'distance from the plane' },
    ],
  },
  extrude: {
    label: 'Extrude',
    fields: [
      { key: 'sketch', label: 'Profile', type: 'sketch', showIf: (f) => f.face === undefined },
      { key: 'face', label: 'Face', type: 'faces', single: true, showIf: (f) => f.face !== undefined },
      {
        key: 'extent',
        label: 'Extent',
        type: 'select',
        options: [
          ['distance', 'Distance'],
          ['through', 'Through all'],
        ],
        def: 'distance',
        showIf: (f) => f.face === undefined,
      },
      { key: 'distance', label: 'Distance', type: 'expr', unit: 'mm', hint: 'negative goes the other way', showIf: (f) => f.extent !== 'through' },
      {
        key: 'side',
        label: 'Direction',
        type: 'select',
        options: [
          ['one', 'One side'],
          ['both', 'Symmetric'],
        ],
        def: 'one',
        showIf: (f) => f.face === undefined && f.extent !== 'through',
      },
      opField,
    ],
  },
  revolve: {
    label: 'Revolve',
    fields: [
      { key: 'sketch', label: 'Profile', type: 'sketch' },
      {
        key: 'axis',
        label: 'Axis',
        type: 'select',
        options: [
          ['y', 'Sketch vertical (Y)'],
          ['x', 'Sketch horizontal (X)'],
        ],
        def: 'y',
      },
      { key: 'axisOffset', label: 'Axis offset', type: 'expr', def: 0, unit: 'mm' },
      { key: 'angle', label: 'Angle', type: 'expr', def: 360, unit: '°' },
      opField,
    ],
  },
  box: {
    label: 'Box',
    fields: [
      { key: 'w', label: 'Width (X)', type: 'expr', unit: 'mm' },
      { key: 'd', label: 'Depth (Y)', type: 'expr', unit: 'mm' },
      { key: 'h', label: 'Height (Z)', type: 'expr', unit: 'mm' },
      atField,
      rotField,
      opField,
    ],
  },
  cylinder: {
    label: 'Cylinder',
    fields: [
      { key: 'd', label: 'Diameter', type: 'expr', unit: 'mm' },
      { key: 'h', label: 'Height', type: 'expr', unit: 'mm' },
      { key: 'axis', label: 'Axis', type: 'select', options: AXIS, def: 'z' },
      atField,
      rotField,
      opField,
    ],
  },
  sphere: {
    label: 'Sphere',
    fields: [{ key: 'd', label: 'Diameter', type: 'expr', unit: 'mm' }, { ...atField, hint: 'x, y, z of the centre' }, opField],
  },
  cone: {
    label: 'Cone',
    fields: [
      { key: 'd1', label: 'Base diameter', type: 'expr', unit: 'mm' },
      { key: 'd2', label: 'Top diameter', type: 'expr', unit: 'mm' },
      { key: 'h', label: 'Height', type: 'expr', unit: 'mm' },
      atField,
      rotField,
      opField,
    ],
  },
  torus: {
    label: 'Torus',
    fields: [
      { key: 'd', label: 'Ring diameter', type: 'expr', unit: 'mm' },
      { key: 'tube', label: 'Tube diameter', type: 'expr', unit: 'mm' },
      { ...atField, hint: 'x, y, z of the centre' },
      rotField,
      opField,
    ],
  },
  fillet: {
    label: 'Fillet',
    fields: [
      { key: 'edges', label: 'Edges', type: 'edges' },
      { key: 'radius', label: 'Radius', type: 'expr', unit: 'mm' },
    ],
  },
  chamfer: {
    label: 'Chamfer',
    fields: [
      { key: 'edges', label: 'Edges', type: 'edges' },
      { key: 'distance', label: 'Distance', type: 'expr', unit: 'mm' },
    ],
  },
  shell: {
    label: 'Shell',
    fields: [
      { key: 'faces', label: 'Open faces', type: 'faces' },
      { key: 'thickness', label: 'Wall thickness', type: 'expr', unit: 'mm' },
    ],
  },
  pattern: {
    label: 'Pattern',
    fields: [
      { key: 'features', label: 'Repeat', type: 'tools' },
      {
        key: 'kind',
        label: 'Layout',
        type: 'select',
        options: [
          ['linear', 'Rows (linear)'],
          ['circular', 'Around an axis'],
        ],
        def: 'linear',
      },
      { key: 'dir', label: 'Direction', type: 'select', options: AXIS, def: 'x', showIf: (f) => f.kind !== 'circular' },
      { key: 'count', label: 'Count', type: 'expr', def: 3 },
      { key: 'spacing', label: 'Spacing', type: 'expr', unit: 'mm', def: 10, showIf: (f) => f.kind !== 'circular' },
      { key: 'dir2', label: 'Second direction', type: 'select', options: AXIS, def: 'y', showIf: (f) => f.kind !== 'circular' },
      { key: 'count2', label: 'Second count', type: 'expr', def: 1, showIf: (f) => f.kind !== 'circular' },
      { key: 'spacing2', label: 'Second spacing', type: 'expr', unit: 'mm', def: 10, showIf: (f) => f.kind !== 'circular' },
      { key: 'axis', label: 'Axis', type: 'select', options: AXIS, def: 'z', showIf: (f) => f.kind === 'circular' },
      { key: 'center', label: 'Axis passes through', type: 'vec3', def: [0, 0, 0], showIf: (f) => f.kind === 'circular' },
      { key: 'angle', label: 'Total angle', type: 'expr', unit: '°', def: 360, showIf: (f) => f.kind === 'circular' },
    ],
  },
  mirror: {
    label: 'Mirror',
    fields: [
      {
        key: 'plane',
        label: 'Mirror plane',
        type: 'select',
        options: [
          ['YZ', 'YZ (left ↔ right)'],
          ['XZ', 'XZ (front ↔ back)'],
          ['XY', 'XY (top ↔ bottom)'],
        ],
        def: 'YZ',
      },
      { key: 'offset', label: 'Plane offset', type: 'expr', unit: 'mm', def: 0 },
      { key: 'features', label: 'Mirror', type: 'tools', optional: 'Whole bodies' },
    ],
  },
  move: {
    label: 'Move',
    fields: [
      { key: 'by', label: 'Move by', type: 'vec3', def: [0, 0, 0] },
      { key: 'rot', label: 'Rotate', type: 'vec3', def: [0, 0, 0], unit: '°', hint: 'degrees about x, y, z, around the body centre' },
      { key: 'copy', label: 'Keep the original (copy)', type: 'bool', def: false },
    ],
  },
};

export const SHAPES = {
  rect: {
    label: 'Rectangle',
    fields: [
      { key: 'w', label: 'Width', type: 'expr', unit: 'mm' },
      { key: 'h', label: 'Height', type: 'expr', unit: 'mm' },
      { key: 'r', label: 'Corner radius', type: 'expr', unit: 'mm', def: 0 },
      { key: 'x', label: 'Centre X', type: 'expr', unit: 'mm', def: 0 },
      { key: 'y', label: 'Centre Y', type: 'expr', unit: 'mm', def: 0 },
      { key: 'rot', label: 'Rotation', type: 'expr', unit: '°', def: 0 },
    ],
  },
  circle: {
    label: 'Circle',
    fields: [
      { key: 'd', label: 'Diameter', type: 'expr', unit: 'mm' },
      { key: 'x', label: 'Centre X', type: 'expr', unit: 'mm', def: 0 },
      { key: 'y', label: 'Centre Y', type: 'expr', unit: 'mm', def: 0 },
    ],
  },
  ellipse: {
    label: 'Ellipse',
    fields: [
      { key: 'w', label: 'Width', type: 'expr', unit: 'mm' },
      { key: 'h', label: 'Height', type: 'expr', unit: 'mm' },
      { key: 'x', label: 'Centre X', type: 'expr', unit: 'mm', def: 0 },
      { key: 'y', label: 'Centre Y', type: 'expr', unit: 'mm', def: 0 },
      { key: 'rot', label: 'Rotation', type: 'expr', unit: '°', def: 0 },
    ],
  },
  polygon: {
    label: 'Polygon',
    fields: [
      { key: 'sides', label: 'Sides', type: 'expr', def: 6 },
      { key: 'd', label: 'Diameter (corner to corner)', type: 'expr', unit: 'mm' },
      { key: 'x', label: 'Centre X', type: 'expr', unit: 'mm', def: 0 },
      { key: 'y', label: 'Centre Y', type: 'expr', unit: 'mm', def: 0 },
      { key: 'rot', label: 'Rotation', type: 'expr', unit: '°', def: 0 },
    ],
  },
  slot: {
    label: 'Slot',
    fields: [
      { key: 'l', label: 'Overall length', type: 'expr', unit: 'mm' },
      { key: 'w', label: 'Width', type: 'expr', unit: 'mm' },
      { key: 'x', label: 'Centre X', type: 'expr', unit: 'mm', def: 0 },
      { key: 'y', label: 'Centre Y', type: 'expr', unit: 'mm', def: 0 },
      { key: 'rot', label: 'Rotation', type: 'expr', unit: '°', def: 0 },
    ],
  },
  path: {
    label: 'Path',
    fields: [{ key: 'r', label: 'Corner radius', type: 'expr', unit: 'mm', def: 0 }],
  },
  text: {
    label: 'Text',
    fields: [
      { key: 'text', label: 'Text', type: 'text' },
      { key: 'size', label: 'Size', type: 'expr', unit: 'mm', def: 10 },
      { key: 'x', label: 'Start X', type: 'expr', unit: 'mm', def: 0 },
      { key: 'y', label: 'Baseline Y', type: 'expr', unit: 'mm', def: 0 },
      { key: 'rot', label: 'Rotation', type: 'expr', unit: '°', def: 0 },
    ],
  },
};

export const MAKES_TOOL = new Set(['extrude', 'revolve', 'box', 'cylinder', 'sphere', 'cone', 'torus']);

export const DEFAULTS = {
  box: { w: 40, d: 30, h: 20, at: [0, 0, 0] },
  cylinder: { d: 20, h: 20, at: [0, 0, 0] },
  sphere: { d: 20, at: [0, 0, 10] },
  cone: { d1: 20, d2: 8, h: 20, at: [0, 0, 0] },
  torus: { d: 30, tube: 6, at: [0, 0, 3] },
  fillet: { edges: { pick: [] }, radius: 2 },
  chamfer: { edges: { pick: [] }, distance: 1 },
  shell: { faces: { pick: [] }, thickness: 2 },
  pattern: { features: [], kind: 'linear', dir: 'x', count: 3, spacing: 20 },
  mirror: { plane: 'YZ' },
  move: { by: [0, 0, 0], rot: [0, 0, 0] },
  revolve: { axis: 'y', angle: 360 },
  extrude: { distance: 10 },
};

export function featureLabel(f) {
  return f.name || FEATURES[f.type]?.label || f.type;
}
