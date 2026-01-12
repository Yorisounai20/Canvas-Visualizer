/**
 * Orbital Dance Preset
 * 
 * Creates an orbital visualization with planets rotating around a center.
 * 
 * Shape allocation:
 * - 8 cubes: planetary bodies
 * - 30 octahedrons: orbital particles (performance limited)
 * - 30 tetrahedrons: accent elements (performance limited)
 */

import { PresetShapeRequirements } from './hammerhead';

export const orbitPreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 30,
  tetras: 30,
  toruses: 0,
  planes: 0
};

export default orbitPreset;
