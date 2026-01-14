/**
 * Feature Flags System
 * 
 * Runtime feature flags for safe rollout and QA fallback.
 * Flags are stored in localStorage and can be toggled via dev tools.
 */

export type FeatureFlag = 'cv_use_scrollable_timeline';

const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  cv_use_scrollable_timeline: false, // New scrollable per-track timeline (PR B+)
};

/**
 * Get the value of a feature flag
 * Checks in order: localStorage → environment variable → default
 */
export function getFeatureFlag(flag: FeatureFlag): boolean {
  try {
    // 1. Check localStorage first (runtime toggle)
    const storedValue = localStorage.getItem(flag);
    if (storedValue !== null) {
      return storedValue === 'true';
    }

    // 2. Check environment variable (build-time configuration)
    if (flag === 'cv_use_scrollable_timeline') {
      const envVar = import.meta.env.VITE_USE_NEW_TIMELINE;
      if (envVar !== undefined) {
        return envVar === 'true' || envVar === '1';
      }
    }

    // 3. Fall back to default
    return DEFAULT_FLAGS[flag];
  } catch (error) {
    console.warn(`Error reading feature flag ${flag}:`, error);
    return DEFAULT_FLAGS[flag];
  }
}

/**
 * Set a feature flag value in localStorage
 */
export function setFeatureFlag(flag: FeatureFlag, value: boolean): void {
  try {
    localStorage.setItem(flag, String(value));
    console.log(`Feature flag ${flag} set to ${value}`);
  } catch (error) {
    console.error(`Error setting feature flag ${flag}:`, error);
  }
}

/**
 * Clear a feature flag from localStorage (revert to default)
 */
export function clearFeatureFlag(flag: FeatureFlag): void {
  try {
    localStorage.removeItem(flag);
    console.log(`Feature flag ${flag} cleared (using default: ${DEFAULT_FLAGS[flag]})`);
  } catch (error) {
    console.error(`Error clearing feature flag ${flag}:`, error);
  }
}

/**
 * Get all feature flags with their current values
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  const flags: Record<string, boolean> = {};
  for (const flag of Object.keys(DEFAULT_FLAGS) as FeatureFlag[]) {
    flags[flag] = getFeatureFlag(flag);
  }
  return flags as Record<FeatureFlag, boolean>;
}

/**
 * Helper for dev console: Enable new scrollable timeline
 * Usage in browser console: window.enableNewTimeline()
 */
if (typeof window !== 'undefined') {
  (window as any).enableNewTimeline = () => {
    setFeatureFlag('cv_use_scrollable_timeline', true);
    console.log('✅ New scrollable timeline enabled. Reload the page to see changes.');
  };

  (window as any).disableNewTimeline = () => {
    setFeatureFlag('cv_use_scrollable_timeline', false);
    console.log('✅ New scrollable timeline disabled. Reload the page to see changes.');
  };

  (window as any).getFeatureFlags = () => {
    const flags = getAllFeatureFlags();
    console.table(flags);
    return flags;
  };
}
