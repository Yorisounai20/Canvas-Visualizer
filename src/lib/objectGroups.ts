/**
 * PR 2: Object Grouping Utilities
 * 
 * Helper functions for semantic object targeting.
 * Replaces hardcoded array indices with group/role queries.
 * 
 * Example Usage (for PR 4 - Solver Separation):
 * 
 * BEFORE:
 *   cube[0].position.set(...)  // Hardcoded index
 * 
 * AFTER:
 *   const headObjects = getObjectsByGroup(objects, "head");
 *   const leftFin = getObjectByRole(objects, "fin_left");
 */

import { WorkspaceObject } from '../types';

/**
 * Get all objects belonging to a specific group
 * @param objects Array of workspace objects
 * @param groupName The group to filter by (e.g., "head", "body", "fins")
 * @returns Array of objects in that group
 */
export function getObjectsByGroup(
  objects: WorkspaceObject[],
  groupName: string
): WorkspaceObject[] {
  return objects.filter(obj => obj.group === groupName && obj.visible);
}

/**
 * Get all objects with a specific role
 * @param objects Array of workspace objects
 * @param roleName The role to filter by (e.g., "fin_left", "antenna_1")
 * @returns Array of objects with that role
 */
export function getObjectsByRole(
  objects: WorkspaceObject[],
  roleName: string
): WorkspaceObject[] {
  return objects.filter(obj => obj.role === roleName && obj.visible);
}

/**
 * Get a single object by its role (returns first match)
 * @param objects Array of workspace objects
 * @param roleName The role to find
 * @returns First object with that role, or null if not found
 */
export function getObjectByRole(
  objects: WorkspaceObject[],
  roleName: string
): WorkspaceObject | null {
  return objects.find(obj => obj.role === roleName && obj.visible) || null;
}

/**
 * Get all unique group names from objects
 * @param objects Array of workspace objects
 * @returns Array of unique group names
 */
export function getUniqueGroups(objects: WorkspaceObject[]): string[] {
  const groups = new Set<string>();
  objects.forEach(obj => {
    if (obj.group) {
      groups.add(obj.group);
    }
  });
  return Array.from(groups).sort();
}

/**
 * Get count of objects in each group
 * @param objects Array of workspace objects
 * @returns Map of group name to object count
 */
export function getGroupCounts(objects: WorkspaceObject[]): Map<string, number> {
  const counts = new Map<string, number>();
  objects.forEach(obj => {
    if (obj.group) {
      counts.set(obj.group, (counts.get(obj.group) || 0) + 1);
    }
  });
  return counts;
}

/**
 * Rename a group for all objects
 * @param objects Array of workspace objects
 * @param oldGroupName Current group name
 * @param newGroupName New group name
 * @returns Updated objects array
 */
export function renameGroup(
  objects: WorkspaceObject[],
  oldGroupName: string,
  newGroupName: string
): WorkspaceObject[] {
  return objects.map(obj => {
    if (obj.group === oldGroupName) {
      return { ...obj, group: newGroupName };
    }
    return obj;
  });
}

/**
 * Check if a group name exists
 * @param objects Array of workspace objects
 * @param groupName Group name to check
 * @returns True if group exists
 */
export function groupExists(objects: WorkspaceObject[], groupName: string): boolean {
  return objects.some(obj => obj.group === groupName);
}
