/**
 * Cityscape Preset
 * 
 * Creates an urban city visualization with buildings, lights, and traffic.
 * 
 * Shape allocation:
 * - 12 cubes: buildings
 * - 30 octahedrons: city lights
 * - 15 tetrahedrons: vehicles
 * - 8 toruses: traffic rings
 * - 20 planes: windows
 */

import { PresetShapeRequirements } from './hammerhead';

export const cityscapePreset: PresetShapeRequirements = {
  cubes: 12,
  octas: 30,
  tetras: 15,
  toruses: 8,
  planes: 20
};

export default cityscapePreset;
