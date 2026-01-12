/**
 * Carousel Preset
 * 
 * Creates a carousel/merry-go-round with horses, lights, and decorations.
 * 
 * Shape allocation:
 * - 10 cubes: platform and horse structures
 * - 25 octahedrons: decorative lights
 * - 20 tetrahedrons: confetti
 * - 8 toruses: carousel rings
 * - 16 planes: panels and seats
 */

import { PresetShapeRequirements } from './hammerhead';

export const carouselPreset: PresetShapeRequirements = {
  cubes: 10,
  octas: 25,
  tetras: 20,
  toruses: 8,
  planes: 16
};

export default carouselPreset;
