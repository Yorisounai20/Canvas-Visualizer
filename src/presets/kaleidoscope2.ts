/**
 * Kaleidoscope 2 Preset
 * 
 * Creates a kaleidoscope effect with colors, fractals, and mirrors.
 * 
 * Shape allocation:
 * - 6 cubes: center structure
 * - 35 octahedrons: color particles
 * - 25 tetrahedrons: fractal elements
 * - 15 toruses: rotation rings
 * - 30 planes: mirror surfaces
 */

import { PresetShapeRequirements } from './hammerhead';

export const kaleidoscope2Preset: PresetShapeRequirements = {
  cubes: 6,
  octas: 35,
  tetras: 25,
  toruses: 15,
  planes: 30
};

export default kaleidoscope2Preset;
