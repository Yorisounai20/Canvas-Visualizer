/**
 * PR 3: Pose Reader API
 * 
 * Read-only API for presets to apply saved poses with smooth blending.
 * Enables pose-driven preset animation without modifying workspace state.
 * 
 * Example Usage (for PR 4 - Solver Separation):
 * 
 * const pose = getPose("hammerhead-neutral");
 * if (pose) {
 *   applyPose(pose, 0.5, workspaceObjects); // Blend 50% toward pose
 * }
 */

import { PoseSnapshot, WorkspaceObject } from '../types';
import { getPose } from './poseStore';

/**
 * Linear interpolation between two numbers
 */
function lerp(from: number, to: number, alpha: number): number {
  return from + (to - from) * alpha;
}

/**
 * Linear interpolation for 3D vectors
 */
function lerpVector3(
  from: { x: number; y: number; z: number },
  to: [number, number, number],
  alpha: number
): { x: number; y: number; z: number } {
  return {
    x: lerp(from.x, to[0], alpha),
    y: lerp(from.y, to[1], alpha),
    z: lerp(from.z, to[2], alpha)
  };
}

/**
 * Apply a pose to workspace objects with blending
 * 
 * @param pose The pose snapshot to apply
 * @param blend Blend factor (0.0 = current state, 1.0 = full pose)
 * @param targetObjects Array of workspace objects to apply pose to
 * @returns Number of objects updated
 * 
 * NOTE: This function modifies object transforms in-place for performance.
 * It does NOT write back to PoseStore or create new objects.
 */
export function applyPose(
  pose: PoseSnapshot,
  blend: number,
  targetObjects: WorkspaceObject[]
): number {
  // Clamp blend to 0-1 range
  const alpha = Math.max(0, Math.min(1, blend));
  
  let updatedCount = 0;
  
  // Create a map for fast object lookup by ID
  const objectMap = new Map<string, WorkspaceObject>();
  targetObjects.forEach(obj => {
    objectMap.set(obj.id, obj);
  });
  
  // Apply pose data to matching objects
  pose.objects.forEach(poseObj => {
    const targetObj = objectMap.get(poseObj.objectId);
    
    if (!targetObj || !targetObj.visible) {
      return; // Skip if object not found or not visible
    }
    
    // Blend position
    const newPosition = lerpVector3(targetObj.position, poseObj.position, alpha);
    targetObj.position.x = newPosition.x;
    targetObj.position.y = newPosition.y;
    targetObj.position.z = newPosition.z;
    
    // Blend rotation
    const newRotation = lerpVector3(targetObj.rotation, poseObj.rotation, alpha);
    targetObj.rotation.x = newRotation.x;
    targetObj.rotation.y = newRotation.y;
    targetObj.rotation.z = newRotation.z;
    
    // Blend scale
    const newScale = lerpVector3(targetObj.scale, poseObj.scale, alpha);
    targetObj.scale.x = newScale.x;
    targetObj.scale.y = newScale.y;
    targetObj.scale.z = newScale.z;
    
    // Blend opacity if present
    if (poseObj.opacity !== undefined && targetObj.opacity !== undefined) {
      targetObj.opacity = lerp(targetObj.opacity, poseObj.opacity, alpha);
    }
    
    // Apply visibility (at alpha > 0.5, use pose visibility)
    if (alpha > 0.5) {
      targetObj.visible = poseObj.visible;
    }
    
    updatedCount++;
  });
  
  return updatedCount;
}

/**
 * Apply a pose by name with blending
 * 
 * @param poseName Name of the saved pose
 * @param blend Blend factor (0.0 = current state, 1.0 = full pose)
 * @param targetObjects Array of workspace objects to apply pose to
 * @returns Number of objects updated, or -1 if pose not found
 */
export function applyPoseByName(
  poseName: string,
  blend: number,
  targetObjects: WorkspaceObject[]
): number {
  const pose = getPose(poseName);
  
  if (!pose) {
    console.warn(`Pose "${poseName}" not found`);
    return -1;
  }
  
  return applyPose(pose, blend, targetObjects);
}

/**
 * Get pose snapshot by name (re-exported from poseStore for convenience)
 */
export { getPose } from './poseStore';

/**
 * Check if a pose exists
 */
export function poseExists(poseName: string): boolean {
  return getPose(poseName) !== null;
}

/**
 * Smoothly transition between two poses
 * 
 * @param fromPoseName Starting pose name
 * @param toPoseName Target pose name
 * @param blend Transition progress (0.0 = from pose, 1.0 = to pose)
 * @param targetObjects Array of workspace objects
 * @returns Number of objects updated, or -1 if either pose not found
 */
export function transitionBetweenPoses(
  fromPoseName: string,
  toPoseName: string,
  blend: number,
  targetObjects: WorkspaceObject[]
): number {
  const fromPose = getPose(fromPoseName);
  const toPose = getPose(toPoseName);
  
  if (!fromPose) {
    console.warn(`From pose "${fromPoseName}" not found`);
    return -1;
  }
  
  if (!toPose) {
    console.warn(`To pose "${toPoseName}" not found`);
    return -1;
  }
  
  // First apply from pose completely
  applyPose(fromPose, 1.0, targetObjects);
  
  // Then blend toward to pose
  return applyPose(toPose, blend, targetObjects);
}
