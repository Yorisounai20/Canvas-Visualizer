/**
 * Ferris Wheel Preset
 * 
 * Creates a ferris wheel with gondolas, lights, and sparkles.
 * 
 * Shape allocation:
 * - 12 cubes: gondolas
 * - 30 octahedrons: decorative lights
 * - 15 tetrahedrons: sparkles
 * - 10 toruses: wheel structure
 * - 12 planes: seats
 */

import { PresetShapeRequirements } from './hammerhead';

export const ferriswheelPreset: PresetShapeRequirements = {
  cubes: 12,
  octas: 30,
  tetras: 15,
  toruses: 10,
  planes: 12
};

export default ferriswheelPreset;
