/**
 * Cosmic Preset
 * 
 * Creates a cosmic space scene with planets, stars, and orbital rings.
 * 
 * Shape allocation:
 * - 8 cubes: planet cores
 * - 30 octahedrons: stars
 * - 30 tetrahedrons: accent particles
 * - 20 toruses: orbital rings
 * - 10 planes: solar panels/structures
 */

import { PresetShapeRequirements } from './hammerhead';

export const cosmicPreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 30,
  tetras: 30,
  toruses: 20,
  planes: 10
};

export default cosmicPreset;
