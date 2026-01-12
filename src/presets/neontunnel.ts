/**
 * Neon Tunnel Preset
 * 
 * Creates a neon-lit tunnel with glowing rings and speed lines.
 * 
 * Shape allocation:
 * - 6 cubes: tunnel support structures
 * - 35 octahedrons: neon glow particles
 * - 20 tetrahedrons: speed lines
 * - 25 toruses: neon rings
 * - 15 planes: neon signs
 */

import { PresetShapeRequirements } from './hammerhead';

export const neontunnelPreset: PresetShapeRequirements = {
  cubes: 6,
  octas: 35,
  tetras: 20,
  toruses: 25,
  planes: 15
};

export default neontunnelPreset;
