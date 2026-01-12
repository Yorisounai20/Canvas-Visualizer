/**
 * Empty Preset
 * 
 * A blank preset with no shapes, useful for custom visualizations or testing.
 * 
 * Shape allocation:
 * - 0 cubes
 * - 0 octahedrons
 * - 0 tetrahedrons
 * - 0 toruses
 * - 0 planes
 */

import { PresetShapeRequirements } from './hammerhead';

export const emptyPreset: PresetShapeRequirements = {
  cubes: 0,
  octas: 0,
  tetras: 0,
  toruses: 0,
  planes: 0
};

export default emptyPreset;
