/**
 * Pulse Grid Preset
 * 
 * Creates a pulsing 4x4 grid of cubes and octahedrons.
 * 
 * Shape allocation:
 * - 16 cubes: 4x4 grid formation
 * - 16 octahedrons: 4x4 grid used
 * - 0 tetrahedrons: not used in this preset
 */

import { PresetShapeRequirements } from './hammerhead';

export const pulsePreset: PresetShapeRequirements = {
  cubes: 16,
  octas: 16,
  tetras: 0,
  toruses: 0,
  planes: 0
};

export default pulsePreset;
