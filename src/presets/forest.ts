/**
 * Forest Preset
 * 
 * Creates a forest scene with trees, fireflies, birds, and foliage.
 * 
 * Shape allocation:
 * - 10 cubes: tree trunks
 * - 25 octahedrons: fireflies
 * - 15 tetrahedrons: birds
 * - 12 toruses: mushroom rings
 * - 30 planes: leaves
 */

import { PresetShapeRequirements } from './hammerhead';

export const forestPreset: PresetShapeRequirements = {
  cubes: 10,
  octas: 25,
  tetras: 15,
  toruses: 12,
  planes: 30
};

export default forestPreset;
