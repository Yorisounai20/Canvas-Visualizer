/**
 * PR 7: Preset Transitions (Safe Blending)
 * 
 * Enables smooth crossfading between presets without object allocation.
 * Uses dual-solver execution with transform blending.
 */

import * as THREE from 'three';

/**
 * Snapshot of an object's transform state
 */
export interface TransformSnapshot {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  color?: THREE.Color;
  opacity?: number;
}

/**
 * Transition state tracking
 */
export interface TransitionState {
  active: boolean;
  fromPreset: string;
  toPreset: string;
  progress: number; // 0-1
  duration: number; // seconds
  startTime: number; // timestamp
  mode: 'cut' | 'fade';
}

/**
 * Create a snapshot of an object's current transform
 */
export function snapshotTransform(mesh: THREE.Mesh): TransformSnapshot {
  return {
    position: mesh.position.clone(),
    rotation: mesh.rotation.clone(),
    scale: mesh.scale.clone(),
    color: mesh.material && 'color' in mesh.material 
      ? (mesh.material as any).color.clone() 
      : undefined,
    opacity: mesh.material && 'opacity' in mesh.material 
      ? (mesh.material as any).opacity 
      : undefined
  };
}

/**
 * Snapshot transforms for an array of meshes
 */
export function snapshotTransforms(meshes: THREE.Mesh[]): TransformSnapshot[] {
  return meshes.map(mesh => snapshotTransform(mesh));
}

/**
 * Apply a transform snapshot to a mesh
 */
export function applyTransform(mesh: THREE.Mesh, snapshot: TransformSnapshot): void {
  mesh.position.copy(snapshot.position);
  mesh.rotation.copy(snapshot.rotation);
  mesh.scale.copy(snapshot.scale);
  
  if (snapshot.color && mesh.material && 'color' in mesh.material) {
    (mesh.material as any).color.copy(snapshot.color);
  }
  
  if (snapshot.opacity !== undefined && mesh.material && 'opacity' in mesh.material) {
    (mesh.material as any).opacity = snapshot.opacity;
  }
}

/**
 * Linear interpolation for numbers
 */
function lerp(a: number, b: number, alpha: number): number {
  return a + (b - a) * alpha;
}

/**
 * Blend two transform snapshots with given alpha (0=A, 1=B)
 */
export function blendTransforms(
  a: TransformSnapshot,
  b: TransformSnapshot,
  alpha: number
): TransformSnapshot {
  // Clamp alpha to [0, 1]
  alpha = Math.max(0, Math.min(1, alpha));
  
  const blended: TransformSnapshot = {
    position: new THREE.Vector3(
      lerp(a.position.x, b.position.x, alpha),
      lerp(a.position.y, b.position.y, alpha),
      lerp(a.position.z, b.position.z, alpha)
    ),
    rotation: new THREE.Euler(
      lerp(a.rotation.x, b.rotation.x, alpha),
      lerp(a.rotation.y, b.rotation.y, alpha),
      lerp(a.rotation.z, b.rotation.z, alpha)
    ),
    scale: new THREE.Vector3(
      lerp(a.scale.x, b.scale.x, alpha),
      lerp(a.scale.y, b.scale.y, alpha),
      lerp(a.scale.z, b.scale.z, alpha)
    )
  };
  
  // Blend colors if both exist
  if (a.color && b.color) {
    blended.color = new THREE.Color(
      lerp(a.color.r, b.color.r, alpha),
      lerp(a.color.g, b.color.g, alpha),
      lerp(a.color.b, b.color.b, alpha)
    );
  } else if (b.color) {
    blended.color = b.color.clone();
  } else if (a.color) {
    blended.color = a.color.clone();
  }
  
  // Blend opacity if exists
  if (a.opacity !== undefined && b.opacity !== undefined) {
    blended.opacity = lerp(a.opacity, b.opacity, alpha);
  } else if (b.opacity !== undefined) {
    blended.opacity = b.opacity;
  } else if (a.opacity !== undefined) {
    blended.opacity = a.opacity;
  }
  
  return blended;
}

/**
 * Blend arrays of transform snapshots
 */
export function blendTransformArrays(
  a: TransformSnapshot[],
  b: TransformSnapshot[],
  alpha: number
): TransformSnapshot[] {
  const length = Math.min(a.length, b.length);
  const blended: TransformSnapshot[] = [];
  
  for (let i = 0; i < length; i++) {
    blended.push(blendTransforms(a[i], b[i], alpha));
  }
  
  return blended;
}

/**
 * Apply an array of transform snapshots to meshes
 */
export function applyTransforms(meshes: THREE.Mesh[], snapshots: TransformSnapshot[]): void {
  const length = Math.min(meshes.length, snapshots.length);
  
  for (let i = 0; i < length; i++) {
    applyTransform(meshes[i], snapshots[i]);
  }
}

/**
 * Create initial transition state
 */
export function createTransitionState(
  fromPreset: string,
  toPreset: string,
  duration: number = 1.0,
  mode: 'cut' | 'fade' = 'fade'
): TransitionState {
  return {
    active: true,
    fromPreset,
    toPreset,
    progress: 0,
    duration,
    startTime: Date.now(),
    mode
  };
}

/**
 * Update transition progress based on elapsed time
 */
export function updateTransition(state: TransitionState): TransitionState {
  if (!state.active) return state;
  
  const elapsed = (Date.now() - state.startTime) / 1000; // seconds
  
  if (state.mode === 'cut') {
    // Instant transition
    return {
      ...state,
      progress: 1,
      active: false
    };
  } else {
    // Fade transition
    const progress = Math.min(1, elapsed / state.duration);
    
    return {
      ...state,
      progress,
      active: progress < 1
    };
  }
}

/**
 * Check if a transition is complete
 */
export function isTransitionComplete(state: TransitionState): boolean {
  return !state.active || state.progress >= 1;
}

/**
 * Get smooth easing for transition (ease-in-out)
 */
export function easeInOutTransition(progress: number): number {
  // Smooth cubic easing
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}
