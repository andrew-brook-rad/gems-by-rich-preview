// Facet triangles for a stone, from the extracted gem set in ring-stones.json.
// The set stores each shape as a unit stone: x and y span -0.5 to 0.5, z runs
// from 1 at the table down through 0 at the girdle to -1 at the culet. Facets
// are returned as flat, non-indexed triangles in millimetres so every face
// keeps its own normal and the surface reads as cut rather than polished.
export function stoneTriangles(stones, shape, dims, crown) {
  const source = stones.shapes[shape] || stones.shapes.Round;
  const scale = 1 / stones.quantization;
  const pavilion = dims.depth - crown;
  const { positions, indices } = source;
  const out = new Float32Array(indices.length * 3);
  for (let i = 0; i < indices.length; i++) {
    const v = indices[i] * 3;
    const z = positions[v + 2] * scale;
    out[i * 3] = positions[v] * scale * dims.width;
    out[i * 3 + 1] = positions[v + 1] * scale * dims.length;
    out[i * 3 + 2] = z >= 0 ? z * crown : z * pavilion;
  }
  return out;
}
