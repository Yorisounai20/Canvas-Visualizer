/**
 * Azure Dragon (Seiryu) Preset
 * 
 * Creates an elaborate dragon visualization with body, scales, and atmospheric effects.
 * 
 * Shape allocation:
 * - 40 cubes: dragon body segments
 * - 50 octahedrons: scale particles
 * - 46 tetrahedrons: 2 antlers + 4 whiskers + 20 mane + 20 clouds
 */

import { PresetShapeRequirements } from './hammerhead';

export const seiryuPreset: PresetShapeRequirements = {
  cubes: 40,
  octas: 50,
  tetras: 46,
  toruses: 0,
  planes: 0
};

export default seiryuPreset;
