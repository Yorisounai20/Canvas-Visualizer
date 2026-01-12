/**
 * Ocean Waves Preset
 * 
 * Creates an ocean scene with waves, foam, fish, and underwater elements.
 * 
 * Shape allocation:
 * - 8 cubes: rocks
 * - 40 octahedrons: foam particles
 * - 20 tetrahedrons: fish
 * - 15 toruses: bubbles/vortex rings
 * - 25 planes: wave surfaces
 */

import { PresetShapeRequirements } from './hammerhead';

export const oceanwavesPreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 40,
  tetras: 20,
  toruses: 15,
  planes: 25
};

export default oceanwavesPreset;
