/**
 * PR 1: Pose Store
 * 
 * In-memory registry for pose snapshots.
 * Poses are persisted via the project save/load system.
 */

import { PoseSnapshot } from '../types';

// Global pose registry (in-memory)
const PoseStore = new Map<string, PoseSnapshot>();

/**
 * Save a pose to the store
 */
export function savePose(name: string, snapshot: PoseSnapshot): void {
  PoseStore.set(name, { ...snapshot, name });
}

/**
 * Get a pose by name
 */
export function getPose(name: string): PoseSnapshot | null {
  return PoseStore.get(name) || null;
}

/**
 * Delete a pose by name
 */
export function deletePose(name: string): boolean {
  return PoseStore.delete(name);
}

/**
 * List all poses
 */
export function listPoses(): PoseSnapshot[] {
  return Array.from(PoseStore.values());
}

/**
 * Clear all poses (used when loading a project)
 */
export function clearPoses(): void {
  PoseStore.clear();
}

/**
 * Load poses into the store (used when loading a project)
 */
export function loadPoses(poses: PoseSnapshot[]): void {
  clearPoses();
  poses.forEach(pose => {
    PoseStore.set(pose.name, pose);
  });
}

/**
 * Get the current pose store as an array (for serialization)
 */
export function exportPoses(): PoseSnapshot[] {
  return listPoses();
}
