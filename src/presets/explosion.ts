/**
 * Explosion Preset
 * 
 * Creates an explosive particle effect visualization.
 * 
 * Shape allocation:
 * - 8 cubes: core explosion fragments
 * - 30 octahedrons: particle debris (performance limited)
 * - 30 tetrahedrons: shrapnel pieces (performance limited)
 */

import { PresetShapeRequirements } from './hammerhead';

export const explosionPreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 30,
  tetras: 30,
  toruses: 0,
  planes: 0
};

export default explosionPreset;
