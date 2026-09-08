// Demonstration data only. These are invented examples, never supplier inventory,
// grading reports, market valuations or quotations from Rich.
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
export const COLOURS = ["D", "E", "F", "G", "H", "I", "J", "K"];
export const CLARITIES = [
  "FL",
  "IF",
  "VVS1",
  "VVS2",
  "VS1",
  "VS2",
  "SI1",
  "SI2",
];
export const FLUORESCENCE = [
  "None",
  "Faint",
  "Medium",
  "Strong",
  "Very strong",
];
export const RANGE_LIMITS = {
  carat: [0.2, 5],
  price: [0, 500000],
  ratio: [0.9, 2.5],
  table: [40, 85],
  depth: [40, 85],
};
export const RANGE_LABELS = {
  carat: "Carat weight",
  price: "Budget",
  ratio: "Length-to-width ratio",
  table: "Table percentage",
  depth: "Depth percentage",
};
export const DEFAULT_FILTERS = {
  origin: "Natural",
  shapes: [],
  colours: [],
  clarities: [],
  caratMin: null,
  caratMax: null,
  priceMin: null,
  priceMax: null,
  cut: "",
  fluorescence: "",
  lab: "",
  polish: "",
  symmetry: "",
  ratioMin: null,
  ratioMax: null,
  tableMin: null,
  tableMax: null,
  depthMin: null,
  depthMax: null,
  sort: "price-asc",
};
const options = {
  origin: ["Natural"],
  shapes: SHAPES,
  colours: COLOURS,
  clarities: CLARITIES,
  cut: ["", "Excellent", "Very good"],
  fluorescence: ["", ...FLUORESCENCE],
  lab: ["", "GIA", "IGI"],
  polish: ["", "Excellent", "Very good"],
  symmetry: ["", "Excellent", "Very good"],
  sort: ["price-asc", "price-desc", "carat-desc", "carat-asc"],
};
const round = (n, places = 2) => Number(n.toFixed(places));
export const money = (value) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);

export const sampleDiamonds = SHAPES.flatMap((shape, si) =>
  Array.from({ length: 12 }, (_, variant) => {
    const carat = [0.5, 0.7, 0.9, 1, 1.2, 1.45, 1.5, 1.8, 1.95, 2, 2.5, 3][
      variant
    ];
    const ratio =
      [1, 1.42, 1.35, 1.55, 1.08, 1.3, 1, 1, 1.9, 1.03][si] +
      (si === 0 ? 0 : (variant % 3) * 0.04);
    const width = round((shape === "Round" ? 6.4 : 5.4) * Math.cbrt(carat));
    const depth = round(59 + ((si + variant) % 10) * 0.7, 1);
    return {
      id: `DEMO-N-${String(si + 1).padStart(2, "0")}-${String(variant + 1).padStart(2, "0")}`,
      isSample: true,
      origin: "Natural",
      shape,
      carat,
      colour: COLOURS[(si + variant) % COLOURS.length],
      clarity: CLARITIES[(si * 2 + variant) % CLARITIES.length],
      cut:
        shape === "Round"
          ? ["Excellent", "Excellent", "Very good", "Good"][variant % 4]
          : null,
      fluorescence: FLUORESCENCE[(si + variant) % FLUORESCENCE.length],
      polish: ["Excellent", "Very good", "Good"][variant % 3],
      symmetry: ["Excellent", "Excellent", "Very good", "Good"][
        (si + variant) % 4
      ],
      lab: variant % 4 === 3 ? "IGI" : "GIA",
      examplePrice:
        Math.round(
          (12500 *
            carat ** 1.65 *
            (0.83 + (si % 3) * 0.08) *
            (1 + (variant % 4) * 0.09)) /
            50,
        ) * 50,
      width,
      length: round(width * ratio),
      height: round((width * depth) / 100),
      ratio: round(ratio),
      table: 55 + ((si + variant) % 10),
      depth,
    };
  }),
);

export function validateRanges(filters) {
  const errors = [];
  for (const [key, [low, high]] of Object.entries(RANGE_LIMITS)) {
    const min = filters[`${key}Min`];
    const max = filters[`${key}Max`];
    for (const [suffix, value] of [
      ["Min", min],
      ["Max", max],
    ]) {
      if (
        value !== null &&
        (!Number.isFinite(value) || value < low || value > high)
      )
        errors.push({
          field: `${key}${suffix}`,
          message: `${RANGE_LABELS[key]} must be between ${low} and ${high}.`,
        });
    }
    if (Number.isFinite(min) && Number.isFinite(max) && min > max)
      errors.push({
        field: `${key}Max`,
        message: `${RANGE_LABELS[key]}: the maximum needs to be at least the minimum.`,
      });
  }
  return errors;
}

export function filterDiamonds(diamonds, filters) {
  if (validateRanges(filters).length) return [];
  const gradePasses = (actual, minimum) =>
    !minimum ||
    ["Good", "Very good", "Excellent"].indexOf(actual) >=
      ["Good", "Very good", "Excellent"].indexOf(minimum);
  const inRange = (value, key) =>
    (filters[`${key}Min`] === null || value >= filters[`${key}Min`]) &&
    (filters[`${key}Max`] === null || value <= filters[`${key}Max`]);
  const matches = diamonds.filter(
    (d) =>
      d.origin === filters.origin &&
      (!filters.shapes.length || filters.shapes.includes(d.shape)) &&
      (!filters.colours.length || filters.colours.includes(d.colour)) &&
      (!filters.clarities.length || filters.clarities.includes(d.clarity)) &&
      inRange(d.carat, "carat") &&
      inRange(d.examplePrice, "price") &&
      inRange(d.ratio, "ratio") &&
      inRange(d.table, "table") &&
      inRange(d.depth, "depth") &&
      (d.shape !== "Round" || gradePasses(d.cut, filters.cut)) &&
      gradePasses(d.polish, filters.polish) &&
      gradePasses(d.symmetry, filters.symmetry) &&
      (!filters.fluorescence || d.fluorescence === filters.fluorescence) &&
      (!filters.lab || d.lab === filters.lab),
  );
  const field = filters.sort.startsWith("carat") ? "carat" : "examplePrice";
  const direction = filters.sort.endsWith("desc") ? -1 : 1;
  return matches.sort(
    (a, b) => (a[field] - b[field]) * direction || a.id.localeCompare(b.id),
  );
}

export function readFilters(search) {
  const params = new URLSearchParams(search);
  const filters = structuredClone(DEFAULT_FILTERS);
  for (const [key, allowed] of Object.entries(options)) {
    const value = params.get(`ds_${key}`);
    if (Array.isArray(filters[key]))
      filters[key] = [
        ...new Set((value || "").split(",").filter((v) => allowed.includes(v))),
      ];
    else if (allowed.includes(value)) filters[key] = value;
  }
  for (const [key, [low, high]] of Object.entries(RANGE_LIMITS)) {
    for (const suffix of ["Min", "Max"]) {
      const raw = params.get(`ds_${key}${suffix}`);
      if (raw !== null && raw.trim() !== "") {
        const value = Number(raw);
        if (Number.isFinite(value) && value >= low && value <= high)
          filters[`${key}${suffix}`] = value;
      }
    }
    if (
      filters[`${key}Min`] !== null &&
      filters[`${key}Max`] !== null &&
      filters[`${key}Min`] > filters[`${key}Max`]
    ) {
      filters[`${key}Min`] = null;
      filters[`${key}Max`] = null;
    }
  }
  return filters;
}

export function writeFilters(filters, url) {
  const next = new URL(url);
  for (const key of Object.keys(DEFAULT_FILTERS)) {
    const value = filters[key];
    const param = `ds_${key}`;
    next.searchParams.delete(param);
    if (
      Array.isArray(value)
        ? value.length
        : value !== null && value !== DEFAULT_FILTERS[key]
    )
      next.searchParams.set(
        param,
        Array.isArray(value) ? value.join(",") : String(value),
      );
  }
  return next;
}

export function describeFilters(filters) {
  const parts = [
    filters.origin,
    `Shapes: ${filters.shapes.join(", ") || "open to any"}`,
  ];
  for (const key of Object.keys(RANGE_LIMITS)) {
    const min = filters[`${key}Min`];
    const max = filters[`${key}Max`];
    if (min !== null || max !== null)
      parts.push(
        `${RANGE_LABELS[key]}: ${min ?? "any"}–${max ?? "any"}${key === "price" ? " MYR, stone only" : ""}`,
      );
  }
  if (filters.colours.length)
    parts.push(`Colour: ${filters.colours.join(", ")}`);
  if (filters.clarities.length)
    parts.push(`Clarity: ${filters.clarities.join(", ")}`);
  for (const key of ["cut", "fluorescence", "lab", "polish", "symmetry"])
    if (filters[key])
      parts.push(
        `${key === "cut" ? "Round cut minimum" : key}: ${filters[key]}`,
      );
  return parts.join("; ");
}
