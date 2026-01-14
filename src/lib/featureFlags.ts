/**
 * Feature Flags Utility
 * 
 * Manages runtime feature flags for gradual rollout of new features.
 * Flags can be controlled via localStorage and environment variables.
 */

export interface FeatureFlags {
  cv_use_scrollable_timeline: boolean;
}

/**
 * Get the value of a feature flag
 * @param flagName - Name of the feature flag
 * @returns boolean indicating if the feature is enabled
 */
export function getFeatureFlag(flagName: keyof FeatureFlags): boolean {
  // Check environment variable first (takes precedence)
  const envVarName = `REACT_APP_${flagName.toUpperCase()}`;
  const envValue = import.meta.env[envVarName];
  
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }
  
  // Check localStorage
  try {
    const stored = localStorage.getItem(flagName);
    if (stored !== null) {
      return stored === 'true';
    }
  } catch (error) {
    console.warn(`Failed to read feature flag ${flagName} from localStorage:`, error);
  }
  
  // Default to false if not set
  return false;
}

/**
 * Set a feature flag value in localStorage
 * @param flagName - Name of the feature flag
 * @param value - Boolean value to set
 */
export function setFeatureFlag(flagName: keyof FeatureFlags, value: boolean): void {
  try {
    localStorage.setItem(flagName, value.toString());
    console.log(`Feature flag ${flagName} set to ${value}`);
  } catch (error) {
    console.error(`Failed to set feature flag ${flagName}:`, error);
  }
}

/**
 * Check if the new scrollable timeline should be used
 * @returns true if TimelineV2 should be used instead of the legacy Timeline
 */
export function useScrollableTimeline(): boolean {
  return getFeatureFlag('cv_use_scrollable_timeline');
}

/**
 * Enable the new scrollable timeline
 */
export function enableScrollableTimeline(): void {
  setFeatureFlag('cv_use_scrollable_timeline', true);
}

/**
 * Disable the new scrollable timeline (revert to legacy)
 */
export function disableScrollableTimeline(): void {
  setFeatureFlag('cv_use_scrollable_timeline', false);
}
