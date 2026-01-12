/**
 * Tornado Vortex Preset
 * 
 * Creates a tornado visualization with swirling debris and vortex rings.
 * 
 * Shape allocation:
 * - 8 cubes: ground anchors
 * - 40 octahedrons: dust particles
 * - 25 tetrahedrons: debris
 * - 20 toruses: vortex rings
 * - 15 planes: wind panels
 */

import { PresetShapeRequirements } from './hammerhead';

export const tornadovortexPreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 40,
  tetras: 25,
  toruses: 20,
  planes: 15
};

export default tornadovortexPreset;
