/**
 * Chill Vibes Preset
 * 
 * A relaxed visualization using all available shapes for smooth, flowing motion.
 * 
 * Shape allocation:
 * - 100 cubes: actively used for ambient structures
 * - 100 octahedrons: actively used for floating elements
 * - 100 tetrahedrons: actively used for particle effects
 */

import { PresetShapeRequirements } from './hammerhead';

export const chillPreset: PresetShapeRequirements = {
  cubes: 100,
  octas: 100,
  tetras: 100,
  toruses: 0,
  planes: 0
};

export default chillPreset;
