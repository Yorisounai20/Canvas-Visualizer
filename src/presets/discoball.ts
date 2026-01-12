/**
 * Disco Ball Preset
 * 
 * Creates a disco ball effect with light beams, sparkles, and mirror panels.
 * 
 * Shape allocation:
 * - 6 cubes: disco ball structure
 * - 30 octahedrons: light beams
 * - 25 tetrahedrons: sparkles
 * - 12 toruses: light rings
 * - 40 planes: mirror panels
 */

import { PresetShapeRequirements } from './hammerhead';

export const discoballPreset: PresetShapeRequirements = {
  cubes: 6,
  octas: 30,
  tetras: 25,
  toruses: 12,
  planes: 40
};

export default discoballPreset;
