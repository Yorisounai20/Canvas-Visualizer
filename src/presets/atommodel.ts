/**
 * Atom Model Preset
 * 
 * Creates an atomic model with nucleus, electrons, and orbital paths.
 * 
 * Shape allocation:
 * - 3 cubes: atomic nucleus
 * - 15 octahedrons: electrons
 * - 20 tetrahedrons: energy particles
 * - 12 toruses: orbital paths
 * - 6 planes: orbital planes
 */

import { PresetShapeRequirements } from './hammerhead';

export const atommodelPreset: PresetShapeRequirements = {
  cubes: 3,
  octas: 15,
  tetras: 20,
  toruses: 12,
  planes: 6
};

export default atommodelPreset;
