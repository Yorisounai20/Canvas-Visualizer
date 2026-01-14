/**
 * Feature Flag System for Canvas Visualizer
 * 
 * Provides runtime-toggleable feature flags using localStorage.
 * No rebuild required - changes take effect on page reload.
 */

const FEATURE_FLAGS = {
  NEW_TIMELINE: 'cv_use_scrollable_timeline',
} as const;

/**
 * Check if the new scrollable timeline feature is enabled
 */
export function useNewTimeline(): boolean {
  // Check environment variable first (build-time override)
  const envFlag = import.meta.env.VITE_USE_NEW_TIMELINE;
  if (envFlag !== undefined) {
    return envFlag === 'true' || envFlag === '1';
  }
  
  // Check localStorage (runtime toggle)
  const storedValue = localStorage.getItem(FEATURE_FLAGS.NEW_TIMELINE);
  return storedValue === 'true';
}

/**
 * Enable the new timeline feature
 */
export function enableNewTimeline(): void {
  localStorage.setItem(FEATURE_FLAGS.NEW_TIMELINE, 'true');
  console.log('✅ New Timeline enabled. Reload the page to see changes.');
  console.log('To disable: window.disableNewTimeline()');
}

/**
 * Disable the new timeline feature (revert to original)
 */
export function disableNewTimeline(): void {
  localStorage.removeItem(FEATURE_FLAGS.NEW_TIMELINE);
  console.log('✅ New Timeline disabled. Reload the page to see changes.');
  console.log('To enable: window.enableNewTimeline()');
}

/**
 * Get current status of all feature flags
 */
export function getFeatureFlagStatus(): Record<string, boolean> {
  return {
    newTimeline: useNewTimeline(),
  };
}

// Expose helpers to window object for easy browser console access
if (typeof window !== 'undefined') {
  (window as any).enableNewTimeline = enableNewTimeline;
  (window as any).disableNewTimeline = disableNewTimeline;
  (window as any).getFeatureFlags = getFeatureFlagStatus;
}
