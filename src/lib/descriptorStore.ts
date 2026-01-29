// PR 6: Preset Descriptor Storage
// In-memory storage for preset descriptors with save/load support

import type { PresetDescriptor } from '../types';

// In-memory descriptor registry
const descriptors = new Map<string, PresetDescriptor>();

/**
 * Save a preset descriptor to the store
 */
export function saveDescriptor(descriptor: PresetDescriptor): void {
  descriptors.set(descriptor.id, descriptor);
}

/**
 * Get a preset descriptor by ID
 */
export function getDescriptor(id: string): PresetDescriptor | null {
  return descriptors.get(id) || null;
}

/**
 * Get a preset descriptor by solver name (for quick lookup)
 */
export function getDescriptorBySolver(solverName: string): PresetDescriptor | null {
  for (const descriptor of descriptors.values()) {
    if (descriptor.solver === solverName) {
      return descriptor;
    }
  }
  return null;
}

/**
 * Delete a preset descriptor
 */
export function deleteDescriptor(id: string): boolean {
  return descriptors.delete(id);
}

/**
 * List all preset descriptors
 */
export function listDescriptors(): PresetDescriptor[] {
  return Array.from(descriptors.values());
}

/**
 * Clear all descriptors
 */
export function clearDescriptors(): void {
  descriptors.clear();
}

/**
 * Load descriptors from array (for project loading)
 */
export function loadDescriptors(descriptorArray: PresetDescriptor[]): void {
  clearDescriptors();
  for (const descriptor of descriptorArray) {
    if (validateDescriptor(descriptor)) {
      descriptors.set(descriptor.id, descriptor);
    }
  }
}

/**
 * Export all descriptors as array (for project saving)
 */
export function exportDescriptors(): PresetDescriptor[] {
  return listDescriptors();
}

/**
 * Validate descriptor structure
 */
export function validateDescriptor(descriptor: any): descriptor is PresetDescriptor {
  return (
    typeof descriptor === 'object' &&
    typeof descriptor.id === 'string' &&
    typeof descriptor.name === 'string' &&
    typeof descriptor.solver === 'string' &&
    typeof descriptor.parameters === 'object'
  );
}

/**
 * Check if a descriptor exists by ID
 */
export function descriptorExists(id: string): boolean {
  return descriptors.has(id);
}

/**
 * Get descriptor count
 */
export function getDescriptorCount(): number {
  return descriptors.size;
}

/**
 * Update descriptor parameters (merge with existing)
 */
export function updateDescriptorParameters(
  id: string,
  parameters: Record<string, number>
): boolean {
  const descriptor = descriptors.get(id);
  if (!descriptor) return false;
  
  descriptor.parameters = { ...descriptor.parameters, ...parameters };
  descriptors.set(id, descriptor);
  return true;
}

// Default Descriptors for Built-in Presets

/**
 * Initialize store with default descriptors
 */
export function initializeDefaultDescriptors(): void {
  // Orbit preset descriptor
  const orbitDescriptor: PresetDescriptor = {
    id: 'default-orbit',
    name: 'Orbital Dance',
    solver: 'orbit',
    basePose: '', // No base pose (uses procedural animation)
    parameters: {
      speed: 1.0,           // Animation speed multiplier
      radius: 10.0,         // Orbit radius
      planetScale: 1.0,     // Planet size multiplier
      moonScale: 0.5,       // Moon size multiplier
      asteroidSpeed: 2.0,   // Asteroid rotation speed
      sunPulse: 1.0,        // Sun pulsing intensity
      audioReactivity: 1.0  // Audio response strength
    },
    metadata: {
      description: 'Solar system with orbiting planets, moons, and asteroids',
      author: 'Canvas Visualizer',
      created: new Date().toISOString(),
      tags: ['orbit', 'space', 'solar-system', 'procedural']
    }
  };

  saveDescriptor(orbitDescriptor);

  // TODO: Add more default descriptors as solvers are extracted
  // - Explosion preset
  // - Tunnel preset
  // - Wave preset
  // - etc.
}

// Initialize on module load
initializeDefaultDescriptors();
