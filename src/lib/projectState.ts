/**
 * Project state serialization utilities
 * Handles serialization and deserialization of project state for save/load
 */

import { ProjectState, ProjectSettings } from '../types';

/**
 * Serialize current editor state to ProjectState for saving
 */
export function serializeProjectState(
  settings: ProjectSettings,
  state: {
    sections: any[];
    presetKeyframes: any[];
    textKeyframes: any[];
    environmentKeyframes: any[];
    cameraDistance: number;
    cameraHeight: number;
    cameraRotation: number;
    cameraAutoRotate: boolean;
    ambientLightIntensity: number;
    directionalLightIntensity: number;
    showBorder: boolean;
    borderColor: string;
    showLetterbox: boolean;
    letterboxSize: number;
    bassColor: string;
    midsColor: string;
    highsColor: string;
    showSongName: boolean;
    customSongName: string;
    manualMode: boolean;
  }
): ProjectState {
  return {
    settings: {
      ...settings,
      lastModified: new Date().toISOString()
    },
    sections: state.sections,
    presetKeyframes: state.presetKeyframes,
    textKeyframes: state.textKeyframes,
    environmentKeyframes: state.environmentKeyframes,
    cameraDistance: state.cameraDistance,
    cameraHeight: state.cameraHeight,
    cameraRotation: state.cameraRotation,
    cameraAutoRotate: state.cameraAutoRotate,
    ambientLightIntensity: state.ambientLightIntensity,
    directionalLightIntensity: state.directionalLightIntensity,
    showBorder: state.showBorder,
    borderColor: state.borderColor,
    showLetterbox: state.showLetterbox,
    letterboxSize: state.letterboxSize,
    bassColor: state.bassColor,
    midsColor: state.midsColor,
    highsColor: state.highsColor,
    showSongName: state.showSongName,
    customSongName: state.customSongName,
    manualMode: state.manualMode
  };
}

/**
 * Deserialize loaded ProjectState back to editor state
 * Returns an object with setters to apply the state
 */
export function deserializeProjectState(projectState: ProjectState) {
  return {
    settings: projectState.settings,
    sections: projectState.sections,
    presetKeyframes: projectState.presetKeyframes,
    textKeyframes: projectState.textKeyframes,
    environmentKeyframes: projectState.environmentKeyframes,
    cameraDistance: projectState.cameraDistance,
    cameraHeight: projectState.cameraHeight,
    cameraRotation: projectState.cameraRotation,
    cameraAutoRotate: projectState.cameraAutoRotate,
    ambientLightIntensity: projectState.ambientLightIntensity,
    directionalLightIntensity: projectState.directionalLightIntensity,
    showBorder: projectState.showBorder,
    borderColor: projectState.borderColor,
    showLetterbox: projectState.showLetterbox,
    letterboxSize: projectState.letterboxSize,
    bassColor: projectState.bassColor,
    midsColor: projectState.midsColor,
    highsColor: projectState.highsColor,
    showSongName: projectState.showSongName,
    customSongName: projectState.customSongName,
    manualMode: projectState.manualMode
  };
}

/**
 * Validate project state structure
 */
export function validateProjectState(data: any): data is ProjectState {
  return (
    data &&
    typeof data === 'object' &&
    // Validate settings
    data.settings &&
    typeof data.settings === 'object' &&
    typeof data.settings.name === 'string' &&
    data.settings.resolution &&
    typeof data.settings.resolution.width === 'number' &&
    typeof data.settings.resolution.height === 'number' &&
    // Validate arrays
    Array.isArray(data.sections) &&
    Array.isArray(data.presetKeyframes) &&
    Array.isArray(data.textKeyframes) &&
    Array.isArray(data.environmentKeyframes) &&
    // Validate camera properties
    typeof data.cameraDistance === 'number' &&
    typeof data.cameraHeight === 'number' &&
    typeof data.cameraRotation === 'number' &&
    typeof data.cameraAutoRotate === 'boolean' &&
    // Validate colors
    typeof data.bassColor === 'string' &&
    typeof data.midsColor === 'string' &&
    typeof data.highsColor === 'string' &&
    typeof data.borderColor === 'string' &&
    // Validate boolean flags
    typeof data.showBorder === 'boolean' &&
    typeof data.showLetterbox === 'boolean' &&
    typeof data.manualMode === 'boolean'
  );
}
