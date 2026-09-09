// Pure data and geometry helpers for the ring visualiser. No DOM, no three.js,
// so the whole file is unit-tested in Node. All lengths are millimetres.
// Sizes are approximations for visual comparison, not measurements of any stone.

export const SHAPES = [
  "Round",
  "Oval",
  "Emerald",
  "Pear",
  "Cushion",
  "Radiant",
  "Princess",
  "Asscher",
  "Marquise",
  "Heart",
];

// Typical length-to-width ratio and how much of the bounding box the outline
// fills, used to keep face-up area roughly constant for a given weight.
const SHAPE_PROFILE = {
  Round: { ratio: 1.0, fill: 0.785, depth: 0.61 },
  Oval: { ratio: 1.38, fill: 0.785, depth: 0.62 },
  Emerald: { ratio: 1.4, fill: 0.9, depth: 0.66 },
  Pear: { ratio: 1.5, fill: 0.7, depth: 0.62 },
  Cushion: { ratio: 1.08, fill: 0.86, depth: 0.66 },
  Radiant: { ratio: 1.2, fill: 0.88, depth: 0.66 },
  Princess: { ratio: 1.0, fill: 0.98, depth: 0.72 },
  Asscher: { ratio: 1.0, fill: 0.9, depth: 0.68 },
  Marquise: { ratio: 2.0, fill: 0.62, depth: 0.6 },
  Heart: { ratio: 1.0, fill: 0.72, depth: 0.6 },
};

// A 1 ct round brilliant of average proportions is about 6.5 mm across.
const ROUND_ONE_CARAT_MM = 6.5;

export function stoneDimensions(shape, carat) {
  const profile = SHAPE_PROFILE[shape];
  if (!profile) throw new Error(`Unknown shape: ${shape}`);
  if (!(carat > 0)) throw new Error("Carat must be positive");
  const roundDiameter = ROUND_ONE_CARAT_MM * Math.cbrt(carat);
  // Keep face-up area comparable to a round of the same weight, then adjust
  // for the shape's typical depth so deeper cuts hide a little weight.
  const area = (Math.PI / 4) * roundDiameter * roundDiameter;
  const depthAdjust = Math.sqrt(SHAPE_PROFILE.Round.depth / profile.depth);
  const width = Math.sqrt(area / (profile.fill * profile.ratio)) * depthAdjust;
  const length = width * profile.ratio;
  const depth = width * profile.depth;
  return { length: round(length), width: round(width), depth: round(depth) };
}

const round = (n) => Math.round(n * 100) / 100;

// Outline in a unit box (width 1, length 1), centred on the origin.
// x runs across the finger, y runs along it, y positive towards the fingertip.
export function outline(shape, steps = 64) {
  const raw = OUTLINES[shape] ? OUTLINES[shape](steps) : null;
  if (!raw) throw new Error(`Unknown shape: ${shape}`);
  return normalise(raw.length < steps ? resample(raw, steps) : raw);
}

// Spread `count` points along a polygon, keeping every corner and dividing
// the rest between edges in proportion to their length.
function resample(points, count) {
  const n = points.length;
  const lengths = points.map((p, i) => {
    const q = points[(i + 1) % n];
    return Math.hypot(q[0] - p[0], q[1] - p[1]);
  });
  const total = lengths.reduce((a, b) => a + b, 0);
  const extra = count - n;
  const out = [];
  let assigned = 0;
  points.forEach((p, i) => {
    const q = points[(i + 1) % n];
    const share = i === n - 1 ? extra - assigned : Math.round((lengths[i] / total) * extra);
    assigned += share;
    out.push(p);
    for (let k = 1; k <= share; k++) {
      const t = k / (share + 1);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  });
  return out;
}

function normalise(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sx = 1 / (maxX - minX);
  const sy = 1 / (maxY - minY);
  const cx = (maxX + minX) / 2;
  const cy = (maxY + minY) / 2;
  return points.map(([x, y]) => [(x - cx) * sx, (y - cy) * sy]);
}

const ring = (steps, fn) =>
  Array.from({ length: steps }, (_, i) => fn((i / steps) * Math.PI * 2));

const superellipse = (steps, n) =>
  ring(steps, (t) => [
    Math.sign(Math.cos(t)) * Math.abs(Math.cos(t)) ** (2 / n),
    Math.sign(Math.sin(t)) * Math.abs(Math.sin(t)) ** (2 / n),
  ]);

// A rectangle with corners cut at 45 degrees, as on emerald and Asscher cuts.
function cutCorners(w, h, cut) {
  return [
    [-w + cut, h],
    [w - cut, h],
    [w, h - cut],
    [w, -h + cut],
    [w - cut, -h],
    [-w + cut, -h],
    [-w, -h + cut],
    [-w, h - cut],
  ];
}

const OUTLINES = {
  Round: (s) => ring(s, (t) => [Math.cos(t), Math.sin(t)]),
  Oval: (s) => ring(s, (t) => [Math.cos(t), Math.sin(t) * 1.38]),
  Cushion: (s) => superellipse(s, 3.2).map(([x, y]) => [x, y * 1.08]),
  Princess: () => [
    [-1, 1],
    [1, 1],
    [1, -1],
    [-1, -1],
  ],
  Radiant: () => cutCorners(1, 1.2, 0.22),
  Emerald: () => cutCorners(1, 1.4, 0.24),
  Asscher: () => cutCorners(1, 1, 0.34),
  Marquise: (s) =>
    ring(s, (t) => {
      const y = Math.sin(t);
      const x = Math.cos(t) * (1 - Math.abs(y) ** 1.6);
      return [x, y * 2];
    }),
  Pear: (s) =>
    ring(s, (t) => {
      const y = Math.sin(t);
      const taper = y > 0 ? 1 - y ** 1.35 : 1;
      return [Math.cos(t) * Math.max(taper, 0.001), y * 1.5 + (y > 0 ? 0.35 * y : 0)];
    }),
  Heart: (s) =>
    ring(s, (t) => {
      const x = 16 * Math.sin(t) ** 3;
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      return [x, y];
    }),
};

/* Hands */

// Three measurements describe the hand: length from the wrist crease to the
// tip of the middle finger, span from thumb tip to little fingertip with the
// hand spread, and the width of the ring finger where a ring sits.
export const HAND_RANGE = {
  length: { min: 150, max: 230 },
  span: { min: 160, max: 260 },
  finger: { min: 14, max: 22 },
};

export const HAND_PRESETS = [
  { id: "small", label: "Small", length: 165, span: 185, finger: 15.6 },
  { id: "medium", label: "Medium", length: 180, span: 205, finger: 16.8 },
  { id: "large", label: "Large", length: 198, span: 228, finger: 18.4 },
];

export const HAND_TONES = [
  { id: "porcelain", label: "Porcelain", color: "#e9e4dc" },
  { id: "warm", label: "Warm", color: "#d9a98c" },
  { id: "deep", label: "Deep", color: "#6e4a34" },
  { id: "graphite", label: "Graphite", color: "#2b2b2b" },
];

// Inner diameter in millimetres for common UK and US ring sizes.
export const RING_SIZE_TABLE = [
  { uk: "H", us: "4", diameter: 14.9 },
  { uk: "I", us: "4½", diameter: 15.3 },
  { uk: "J", us: "5", diameter: 15.7 },
  { uk: "K", us: "5½", diameter: 16.1 },
  { uk: "L", us: "6", diameter: 16.5 },
  { uk: "M", us: "6½", diameter: 16.9 },
  { uk: "N", us: "7", diameter: 17.3 },
  { uk: "O", us: "7½", diameter: 17.7 },
  { uk: "P", us: "8", diameter: 18.1 },
  { uk: "Q", us: "8½", diameter: 18.5 },
  { uk: "R", us: "9", diameter: 18.9 },
  { uk: "S", us: "9½", diameter: 19.4 },
  { uk: "T", us: "10", diameter: 19.8 },
  { uk: "U", us: "10½", diameter: 20.2 },
  { uk: "V", us: "11", diameter: 20.6 },
];

// The ring size whose inner diameter is nearest a finger width.
export function ringSizeFor(fingerWidth) {
  return RING_SIZE_TABLE.reduce((best, size) =>
    Math.abs(size.diameter - fingerWidth) < Math.abs(best.diameter - fingerWidth) ? size : best,
  );
}

// Everything the renderer needs to build a left hand, palm down, from the
// three measurements. Fingers are listed little to index, thumb separately.
// x runs across the hand (index side positive), y towards the fingertips.
export function handProportions({ length, span, finger }) {
  const middle = length * 0.44;
  const palmLength = length - middle;
  const breadth = span * 0.4;
  const spreadFactor = clamp((span / length - 0.95) / 0.3, 0.35, 1.6);
  const fingers = [
    { id: "little", length: middle * 0.75, width: finger * 0.86, x: -0.36, spread: -14 },
    { id: "ring", length: middle * 0.95, width: finger, x: -0.12, spread: -5 },
    { id: "middle", length: middle, width: finger * 1.04, x: 0.12, spread: 2 },
    { id: "index", length: middle * 0.92, width: finger * 1.0, x: 0.36, spread: 10 },
  ].map((f) => ({
    ...f,
    length: round(f.length),
    width: round(f.width),
    base: { x: round(f.x * breadth), y: round(palmLength - Math.abs(f.x) * breadth * 0.18) },
    spread: round(f.spread * spreadFactor),
    segments: [0.42, 0.31, 0.27].map((s) => round(s * f.length)),
  }));
  return {
    length,
    span,
    palmLength: round(palmLength),
    breadth: round(breadth),
    wristWidth: round(breadth * 0.82),
    thickness: round(clamp(finger * 1.35, 18, 32)),
    fingers,
    thumb: {
      length: round(middle * 0.78),
      width: round(finger * 1.25),
      base: { x: round(breadth * 0.5), y: round(palmLength * 0.28) },
      angle: round(38 + 22 * spreadFactor),
      segments: [0.55, 0.45].map((s) => round(s * middle * 0.78)),
    },
    ringSize: ringSizeFor(finger),
  };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* Settings, metals, state */

export const SETTINGS = [
  { id: "solitaire", label: "Solitaire", prongs: 4, halo: false, sideStones: 0, bezel: false, pave: false },
  { id: "solitaire-six", label: "Six-prong solitaire", prongs: 6, halo: false, sideStones: 0, bezel: false, pave: false },
  { id: "halo", label: "Halo", prongs: 4, halo: true, sideStones: 0, bezel: false, pave: false },
  { id: "three-stone", label: "Three-stone", prongs: 4, halo: false, sideStones: 2, bezel: false, pave: false },
  { id: "bezel", label: "Bezel", prongs: 0, halo: false, sideStones: 0, bezel: true, pave: false },
  { id: "pave", label: "Pavé band", prongs: 4, halo: false, sideStones: 0, bezel: false, pave: true },
];

export const METALS = [
  { id: "yellow", label: "Yellow gold", color: "#f2c46d" },
  { id: "white", label: "White gold / platinum", color: "#e6e6e6" },
  { id: "rose", label: "Rose gold", color: "#e9b49b" },
];

export const CARAT_RANGE = { min: 0.3, max: 5, step: 0.05 };

const DEFAULT_STATE = {
  setting: "solitaire",
  shape: "Round",
  carat: 1,
  metal: "yellow",
  tone: "porcelain",
  length: 180,
  span: 205,
  finger: 16.8,
};

export function parseState(params) {
  const state = { ...DEFAULT_STATE };
  const setting = params.get("setting");
  if (SETTINGS.some((s) => s.id === setting)) state.setting = setting;
  const shape = params.get("shape");
  if (SHAPES.includes(shape)) state.shape = shape;
  const metal = params.get("metal");
  if (METALS.some((m) => m.id === metal)) state.metal = metal;
  const tone = params.get("tone");
  if (HAND_TONES.some((t) => t.id === tone)) state.tone = tone;
  const preset = HAND_PRESETS.find((p) => p.id === params.get("hand"));
  if (preset) Object.assign(state, { length: preset.length, span: preset.span, finger: preset.finger });
  for (const key of ["length", "span", "finger"]) {
    const value = Number.parseFloat(params.get(key));
    if (Number.isFinite(value)) {
      const { min, max } = HAND_RANGE[key];
      state[key] = Math.round(clamp(value, min, max) * 10) / 10;
    }
  }
  const carat = Number.parseFloat(params.get("carat"));
  if (Number.isFinite(carat)) {
    state.carat = Math.min(CARAT_RANGE.max, Math.max(CARAT_RANGE.min, Math.round(carat * 100) / 100));
  }
  return state;
}

// The preset the current measurements match, if any.
export function matchingPreset(state) {
  return HAND_PRESETS.find(
    (p) => p.length === state.length && p.span === state.span && Math.abs(p.finger - state.finger) < 0.05,
  );
}

export function describeRing(state) {
  const setting = SETTINGS.find((s) => s.id === state.setting) || SETTINGS[0];
  const metal = METALS.find((m) => m.id === state.metal) || METALS[0];
  const dims = stoneDimensions(state.shape, state.carat);
  const size = ringSizeFor(state.finger);
  return (
    `${setting.label} setting; ${state.carat.toFixed(2)} ct ${state.shape} ` +
    `(about ${dims.length.toFixed(1)} × ${dims.width.toFixed(1)} mm); ` +
    `${metal.label.toLowerCase()}; ring finger ${state.finger.toFixed(1)} mm wide ` +
    `(about UK ${size.uk} / US ${size.us}); hand ${(state.length / 10).toFixed(1)} cm long, ${(state.span / 10).toFixed(1)} cm span. ` +
    "Built in the ring visualiser with illustrative proportions, not a quotation or a specific stone."
  );
}
