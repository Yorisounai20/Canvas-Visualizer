/**
 * PR 8: Workspace → Preset Export
 * 
 * Enables exporting workspace arrangements as reusable presets.
 * Captures object layout and generates preset descriptors.
 */

import type { WorkspaceObject, PresetDescriptor, PoseSnapshot } from '../types';
import { savePose } from './poseStore';
import { saveDescriptor } from './descriptorStore';

/**
 * Export options for creating a preset from workspace
 */
export interface WorkspaceExportOptions {
  presetName: string;
  solverName: string;
  basePoseName?: string;
  includeParameters?: boolean;
  defaultParameters?: Record<string, number>;
}

/**
 * Result of workspace export
 */
export interface WorkspaceExportResult {
  success: boolean;
  presetId: string;
  poseId: string;
  descriptor: PresetDescriptor;
  message: string;
}

/**
 * Generate a unique ID for exported preset
 */
function generatePresetId(name: string): string {
  const timestamp = Date.now();
  const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `user-${sanitized}-${timestamp}`;
}

/**
 * Generate a unique ID for base pose
 */
function generatePoseId(presetName: string): string {
  const timestamp = Date.now();
  const sanitized = presetName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `pose-${sanitized}-${timestamp}`;
}

/**
 * Create a pose snapshot from workspace objects
 */
function createPoseFromWorkspace(
  objects: WorkspaceObject[],
  poseName: string
): PoseSnapshot {
  return {
    id: generatePoseId(poseName),
    name: poseName,
    timestamp: new Date().toISOString(),
    objectCount: objects.length,
    objects: objects
      .filter(obj => obj.mesh) // Only objects with meshes
      .map(obj => ({
        objectId: obj.id,
        position: [
          obj.mesh!.position.x,
          obj.mesh!.position.y,
          obj.mesh!.position.z
        ] as [number, number, number],
        rotation: [
          obj.mesh!.rotation.x,
          obj.mesh!.rotation.y,
          obj.mesh!.rotation.z
        ] as [number, number, number],
        scale: [
          obj.mesh!.scale.x,
          obj.mesh!.scale.y,
          obj.mesh!.scale.z
        ] as [number, number, number],
        visible: obj.mesh!.visible,
        material: obj.type, // Store type as material reference
        color: obj.color,
        opacity: obj.opacity
      }))
  };
}

/**
 * Get default parameters for common solver types
 */
function getDefaultParametersForSolver(solverName: string): Record<string, number> {
  const defaults: Record<string, Record<string, number>> = {
    orbit: {
      speed: 1.0,
      radius: 10.0,
      planetScale: 1.0,
      moonScale: 0.5,
      asteroidSpeed: 2.0,
      sunPulse: 1.0,
      audioReactivity: 1.0
    },
    explosion: {
      speed: 1.0,
      intensity: 1.0,
      spread: 1.0,
      rotation: 1.0,
      audioReactivity: 1.0
    },
    tunnel: {
      speed: 1.0,
      depth: 1.0,
      spacing: 1.0,
      rotation: 1.0,
      audioReactivity: 1.0
    },
    wave: {
      speed: 1.0,
      amplitude: 1.0,
      frequency: 1.0,
      phase: 0.0,
      audioReactivity: 1.0
    },
    spiral: {
      speed: 1.0,
      radius: 1.0,
      turns: 1.0,
      height: 1.0,
      audioReactivity: 1.0
    },
    custom: {
      speed: 1.0,
      intensity: 1.0,
      scale: 1.0,
      audioReactivity: 1.0
    }
  };

  return defaults[solverName] || defaults.custom;
}

/**
 * Export workspace as a reusable preset
 */
export function exportWorkspaceAsPreset(
  workspaceObjects: WorkspaceObject[],
  options: WorkspaceExportOptions
): WorkspaceExportResult {
  try {
    // Validate inputs
    if (!options.presetName || options.presetName.trim() === '') {
      return {
        success: false,
        presetId: '',
        poseId: '',
        descriptor: {} as PresetDescriptor,
        message: 'Preset name is required'
      };
    }

    if (!options.solverName || options.solverName.trim() === '') {
      return {
        success: false,
        presetId: '',
        poseId: '',
        descriptor: {} as PresetDescriptor,
        message: 'Solver name is required'
      };
    }

    if (workspaceObjects.length === 0) {
      return {
        success: false,
        presetId: '',
        poseId: '',
        descriptor: {} as PresetDescriptor,
        message: 'No workspace objects to export'
      };
    }

    // Generate IDs
    const presetId = generatePresetId(options.presetName);
    const basePoseName = options.basePoseName || `${options.presetName} Base`;
    
    // Create and save base pose
    const basePose = createPoseFromWorkspace(workspaceObjects, basePoseName);
    savePose(basePose.name, basePose);

    // Get or use provided parameters
    const parameters = options.defaultParameters || 
                      (options.includeParameters !== false 
                        ? getDefaultParametersForSolver(options.solverName)
                        : {});

    // Create preset descriptor
    const descriptor: PresetDescriptor = {
      id: presetId,
      name: options.presetName,
      solver: options.solverName,
      basePose: basePose.name,
      parameters,
      metadata: {
        description: `Custom preset created from workspace`,
        author: 'User',
        created: new Date().toISOString(),
        tags: ['user-created', 'workspace-export', options.solverName]
      }
    };

    // Save descriptor
    saveDescriptor(descriptor);

    return {
      success: true,
      presetId,
      poseId: basePose.id,
      descriptor,
      message: `Successfully exported "${options.presetName}" preset`
    };

  } catch (error) {
    return {
      success: false,
      presetId: '',
      poseId: '',
      descriptor: {} as PresetDescriptor,
      message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Validate workspace can be exported
 */
export function canExportWorkspace(workspaceObjects: WorkspaceObject[]): {
  valid: boolean;
  reason?: string;
} {
  if (workspaceObjects.length === 0) {
    return {
      valid: false,
      reason: 'No objects in workspace'
    };
  }

  const objectsWithMeshes = workspaceObjects.filter(obj => obj.mesh);
  if (objectsWithMeshes.length === 0) {
    return {
      valid: false,
      reason: 'No valid objects with meshes'
    };
  }

  return { valid: true };
}

/**
 * Get available solver names for export
 */
export function getAvailableSolvers(): string[] {
  return [
    'orbit',
    'explosion',
    'tunnel',
    'wave',
    'spiral',
    'chill',
    'pulse',
    'vortex',
    'custom'
  ];
}

/**
 * Generate suggested preset name from workspace
 */
export function suggestPresetName(workspaceObjects: WorkspaceObject[]): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const count = workspaceObjects.length;
  
  // Try to infer from groups
  const groups = new Set(workspaceObjects.map(obj => obj.group).filter(Boolean));
  if (groups.size > 0) {
    const mainGroup = Array.from(groups)[0];
    return `${mainGroup}-preset`;
  }
  
  // Fallback to generic name
  return `Custom Preset (${count} objects)`;
}
