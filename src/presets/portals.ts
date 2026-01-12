/**
 * Portals Preset
 * 
 * Creates inter-dimensional portals with particles and warping effects.
 * 
 * Shape allocation:
 * - 8 cubes: portal frames
 * - 35 octahedrons: portal particles
 * - 20 tetrahedrons: warp effects
 * - 20 toruses: portal rings
 * - 10 planes: portal surfaces
 */

import { PresetShapeRequirements } from './hammerhead';

export const portalsPreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 35,
  tetras: 20,
  toruses: 20,
  planes: 10
};

export default portalsPreset;
