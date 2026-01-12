/**
 * Hammerhead Shark Preset
 * 
 * A 3D visualization preset that creates a hammerhead shark with bubbles and fins.
 * 
 * Shape allocation:
 * - 8 cubes: 3 head + 4 body + 1 tail
 * - 5 octahedrons: bubble effects
 * - 4 tetrahedrons: 1 dorsal fin + 2 pectoral fins + 1 tail fin
 */

export interface PresetShapeRequirements {
  cubes: number;
  octas: number;
  tetras: number;
  toruses: number;
  planes: number;
}

export const hammerheadPreset: PresetShapeRequirements = {
  cubes: 8,      // 8 cubes (3 head + 4 body + 1 tail)
  octas: 5,      // 5 bubble octas
  tetras: 4,     // 4 tetras (1 dorsal + 2 pectoral + 1 tail fin)
  toruses: 0,    // No toruses used
  planes: 0      // No planes used
};

export default hammerheadPreset;
