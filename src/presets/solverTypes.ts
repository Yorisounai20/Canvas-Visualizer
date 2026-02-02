/**
 * PR 4: Preset Solver Types
 * 
 * Type definitions for the new solver pattern.
 * Solvers read poses, write transforms, create no objects.
 */

import { WorkspaceObject, PoseSnapshot } from '../types';

/**
 * Audio frequency data passed to solvers
 */
export interface AudioFrequencies {
  bass: number;   // 0-255
  mids: number;   // 0-255
  highs: number;  // 0-255
}

/**
 * Shape pool provided to solvers
 * These are the pre-allocated geometry objects
 */
export interface ShapePool {
  cubes: THREE.Mesh[];
  octahedrons: THREE.Mesh[];
  tetrahedrons: THREE.Mesh[];
  toruses: THREE.Mesh[];
  planes: THREE.Mesh[];
  sphere: THREE.Mesh;
}

/**
 * Context passed to solver functions
 */
export interface SolverContext {
  time: number;                      // Elapsed time in seconds
  audio: AudioFrequencies;           // Audio frequency data
  poses: Map<string, PoseSnapshot>;  // Available poses by name
  pool: ShapePool;                   // Pre-allocated shape pool
  blend: number;                     // Global blend factor (0-1)
  camera: THREE.PerspectiveCamera;   // Camera for positioning
  // Additional context
  rotationSpeed: number;             // Keyframe-controlled rotation
  cameraDistance: number;            // Keyframe-controlled distance
  cameraHeight: number;              // Keyframe-controlled height
  cameraRotation: number;            // Active camera rotation offset
  shake: { x: number; y: number; z: number }; // Camera shake
  workspaceObjects?: WorkspaceObject[]; // Optional workspace objects for pose-driven presets
  // Colors (for material.color.setStyle())
  colors?: {
    cube?: string;
    octahedron?: string;
    tetrahedron?: string;
    sphere?: string;
    torus?: string;
    plane?: string;
  };
}

/**
 * Solver function signature
 * 
 * A solver function animates the shape pool based on context.
 * It should:
 * - Read poses if needed
 * - Write transforms (position, rotation, scale, opacity)
 * - NOT create new objects
 * - NOT allocate geometry
 */
export type SolverFunction = (ctx: SolverContext) => void;

/**
 * Preset configuration with solver
 */
export interface PresetConfig {
  name: string;
  type: 'legacy' | 'pose';  // Legacy = old inline, Pose = new pose-driven
  solver: SolverFunction;
  requirements: {
    cubes: number;
    octas: number;
    tetras: number;
    toruses: number;
    planes: number;
  };
}
