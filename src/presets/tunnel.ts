/**
 * Tunnel Rush Preset
 * 
 * Creates a rushing tunnel effect with depth perception.
 * 
 * Shape allocation:
 * - 8 cubes: tunnel structure segments
 * - 30 octahedrons: tunnel walls (performance limited)
 * - 30 tetrahedrons: speed indicators (performance limited)
 */

import { PresetShapeRequirements } from './hammerhead';

export const tunnelPreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 30,
  tetras: 30,
  toruses: 0,
  planes: 0
};

export default tunnelPreset;
