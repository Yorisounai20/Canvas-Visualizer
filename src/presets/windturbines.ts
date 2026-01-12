/**
 * Wind Turbines Preset
 * 
 * Creates wind turbines with rotating blades and energy particles.
 * 
 * Shape allocation:
 * - 8 cubes: turbine towers
 * - 30 octahedrons: wind particles
 * - 15 tetrahedrons: energy particles
 * - 8 toruses: rotation rings
 * - 24 planes: turbine blades (3 per turbine)
 */

import { PresetShapeRequirements } from './hammerhead';

export const windturbinesPreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 30,
  tetras: 15,
  toruses: 8,
  planes: 24
};

export default windturbinesPreset;
