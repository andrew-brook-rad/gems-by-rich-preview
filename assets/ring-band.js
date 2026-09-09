// Band geometry and accent clearances in millimetres. Receive the renderer's
// THREE instance so the browser and geometry tests use exactly the same mesh.
export const BAND_SECTION = { tube: 0.9, width: 2.1 };

export function bandGeometry(THREE, innerRadius) {
  const { tube, width } = BAND_SECTION;
  const geometry = new THREE.TorusGeometry(innerRadius + tube, tube, 24, 96);
  // A torus starts in XY: its Z axis is its width, not a radial axis.
  geometry.scale(1, 1, width / (2 * tube));
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export function accentSeat(innerRadius, diameter) {
  const pavilion = diameter * (0.61 - 0.16);
  const outer = innerRadius + 2 * BAND_SECTION.tube;
  return {
    radius: outer + pavilion + 0.12,
    pavilion,
    // A hollow rim touches the girdle from outside. Its inner edge clears
    // the pavilion, and two angled posts connect it to the shank.
    rimRadius: diameter / 2 + 0.12,
    rimTube: 0.10,
    rimZ: -0.04,
    postRadius: 0.07,
    baseY: diameter * 0.34,
  };
}
