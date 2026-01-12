/**
 * Solar System Preset
 * 
 * Creates a solar system with planets, stars, comets, and orbits.
 * 
 * Shape allocation:
 * - 8 cubes: planets
 * - 40 octahedrons: stars
 * - 12 tetrahedrons: comets
 * - 16 toruses: orbital paths
 * - 8 planes: asteroid belt
 */

import { PresetShapeRequirements } from './hammerhead';

export const solarsystemPreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 40,
  tetras: 12,
  toruses: 16,
  planes: 8
};

export default solarsystemPreset;
