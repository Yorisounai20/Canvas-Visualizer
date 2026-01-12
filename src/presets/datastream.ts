/**
 * Data Stream Preset
 * 
 * Creates a digital data stream visualization with servers and data packets.
 * 
 * Shape allocation:
 * - 8 cubes: servers
 * - 40 octahedrons: data bits
 * - 25 tetrahedrons: data packets
 * - 15 toruses: connection rings
 * - 20 planes: data panels
 */

import { PresetShapeRequirements } from './hammerhead';

export const datastreamPreset: PresetShapeRequirements = {
  cubes: 8,
  octas: 40,
  tetras: 25,
  toruses: 15,
  planes: 20
};

export default datastreamPreset;
