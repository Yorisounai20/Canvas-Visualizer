/**
 * Spiral Galaxy Preset
 * 
 * Creates a spiral galaxy formation with rotating arms.
 * 
 * Shape allocation:
 * - 8 cubes: galactic core
 * - 30 octahedrons: spiral arm particles (performance limited)
 * - 30 tetrahedrons: star clusters (performance limited)
 */

import { PresetShapeRequirements } from './hammerhead';

export const spiralPreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 30,
  tetras: 30,
  toruses: 0,
  planes: 0
};

export default spiralPreset;
