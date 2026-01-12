/**
 * Vortex Storm Preset
 * 
 * Creates a swirling vortex effect with rotating particles.
 * 
 * Shape allocation:
 * - 8 cubes: vortex core
 * - 30 octahedrons: swirling particles (performance limited)
 * - 30 tetrahedrons: debris in vortex (performance limited)
 */

import { PresetShapeRequirements } from './hammerhead';

export const vortexPreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 30,
  tetras: 30,
  toruses: 0,
  planes: 0
};

export default vortexPreset;
