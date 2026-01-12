/**
 * Wave Motion Preset
 * 
 * Creates flowing wave patterns synchronized to audio.
 * 
 * Shape allocation:
 * - 8 cubes: wave crests
 * - 30 octahedrons: wave segments
 * - 30 tetrahedrons: foam and spray (performance limited)
 */

import { PresetShapeRequirements } from './hammerhead';

export const wavePreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 30,
  tetras: 30,
  toruses: 0,
  planes: 0
};

export default wavePreset;
