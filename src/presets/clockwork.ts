/**
 * Clockwork Preset
 * 
 * Creates a mechanical clockwork visualization with gears and mechanisms.
 * 
 * Shape allocation:
 * - 10 cubes: mechanism parts
 * - 12 octahedrons: time markers
 * - 8 tetrahedrons: weights
 * - 15 toruses: gears
 * - 5 planes: clock faces
 */

import { PresetShapeRequirements } from './hammerhead';

export const clockworkPreset: PresetShapeRequirements = {
  cubes: 10,
  octas: 12,
  tetras: 8,
  toruses: 15,
  planes: 5
};

export default clockworkPreset;
