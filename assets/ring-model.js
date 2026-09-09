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
  return {
    length: round(length),
    width: round(width),
    depth: round(depth),
  };
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
      // Two circular arcs meeting at points top and bottom.
      const y = Math.sin(t);
      const x = Math.cos(t) * (1 - Math.abs(y) ** 1.6);
      return [x, y * 2];
    }),
  Pear: (s) =>
    ring(s, (t) => {
      // Round at the bottom, tapering to a point at the top.
      const y = Math.sin(t);
      const taper = y > 0 ? 1 - y ** 1.35 : 1;
      return [Math.cos(t) * Math.max(taper, 0.001), y * 1.5 + (y > 0 ? 0.35 * y : 0)];
    }),
  Heart: (s) =>
    ring(s, (t) => {
      // Classic heart curve, rotated so the point faces down the finger.
      const x = 16 * Math.sin(t) ** 3;
      const y =
        13 * Math.cos(t) -
        5 * Math.cos(2 * t) -
        2 * Math.cos(3 * t) -
        Math.cos(4 * t);
      return [x, y];
    }),
};

// Hand sizes as ring sizes. Inner diameters follow the standard UK/US charts.
export const RING_SIZES = [
  { id: "small", label: "Small (UK J / US 5)", diameter: 15.9 },
  { id: "medium", label: "Medium (UK M / US 6½)", diameter: 16.5 },
  { id: "large", label: "Large (UK P / US 8)", diameter: 18.1 },
];

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

const DEFAULT_STATE = { setting: "solitaire", shape: "Round", carat: 1, metal: "yellow", size: "medium" };

export function parseState(params) {
  const state = { ...DEFAULT_STATE };
  const setting = params.get("setting");
  if (SETTINGS.some((s) => s.id === setting)) state.setting = setting;
  const shape = params.get("shape");
  if (SHAPES.includes(shape)) state.shape = shape;
  const metal = params.get("metal");
  if (METALS.some((m) => m.id === metal)) state.metal = metal;
  const size = params.get("size");
  if (RING_SIZES.some((r) => r.id === size)) state.size = size;
  const carat = Number.parseFloat(params.get("carat"));
  if (Number.isFinite(carat)) {
    state.carat = Math.min(CARAT_RANGE.max, Math.max(CARAT_RANGE.min, Math.round(carat * 100) / 100));
  }
  return state;
}

export function describeRing(state) {
  const setting = SETTINGS.find((s) => s.id === state.setting) || SETTINGS[0];
  const metal = METALS.find((m) => m.id === state.metal) || METALS[0];
  const size = RING_SIZES.find((r) => r.id === state.size) || RING_SIZES[1];
  const dims = stoneDimensions(state.shape, state.carat);
  return (
    `${setting.label} setting; ${state.carat.toFixed(2)} ct ${state.shape} ` +
    `(about ${dims.length.toFixed(1)} × ${dims.width.toFixed(1)} mm); ` +
    `${metal.label.toLowerCase()}; ring size ${size.label}. ` +
    "Built in the ring visualiser with illustrative proportions, not a quotation or a specific stone."
  );
}
