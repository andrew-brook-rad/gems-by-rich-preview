// Band geometry and accent clearances in millimetres. Receive the renderer's
// THREE instance so the browser and geometry tests use exactly the same mesh.
import { CROWN_RATIO } from "./ring-stone-geometry.js";

export const BAND_SECTION = { tube: 0.9, width: 2.1 };
// Accent stones are round brilliants: total depth as a share of diameter.
export const ACCENT_DEPTH_RATIO = 0.61;

export function bandGeometry(THREE, innerRadius) {
  const { tube, width } = BAND_SECTION;
  const geometry = new THREE.TorusGeometry(innerRadius + tube, tube, 24, 96);
  // A torus starts in XY: its Z axis is its width, not a radial axis.
  geometry.scale(1, 1, width / (2 * tube));
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export function accentSeat(innerRadius, diameter) {
  const pavilion = diameter * (ACCENT_DEPTH_RATIO - CROWN_RATIO);
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
