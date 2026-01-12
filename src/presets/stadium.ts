/**
 * Stadium Preset
 * 
 * Creates a stadium visualization with pillars, crowd lights, and fireworks.
 * 
 * Shape allocation:
 * - 12 cubes: pillars/columns
 * - 35 octahedrons: crowd lights
 * - 20 tetrahedrons: fireworks
 * - 10 toruses: lighting rigs
 * - 24 planes: stadium sections
 */

import { PresetShapeRequirements } from './hammerhead';

export const stadiumPreset: PresetShapeRequirements = {
  cubes: 12,
  octas: 35,
  tetras: 20,
  toruses: 10,
  planes: 24
};

export default stadiumPreset;
