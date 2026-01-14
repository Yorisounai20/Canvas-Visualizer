/**
 * Timeline Utilities
 * Helper functions for timeline calculations, conversions, and formatting
 */

// Constants
export const BASE_PX_PER_SECOND = 40;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4.0;
export const DEFAULT_FPS = 30;

/**
 * Convert time (seconds) to pixel position
 * @param timeSec - Time in seconds
 * @param pixelsPerSecond - Pixels per second (BASE_PX_PER_SECOND * zoom)
 * @returns Pixel position
 */
export function timeToPixels(timeSec: number, pixelsPerSecond: number): number {
  return timeSec * pixelsPerSecond;
}

/**
 * Convert pixel position to time (seconds)
 * @param px - Pixel position
 * @param pixelsPerSecond - Pixels per second (BASE_PX_PER_SECOND * zoom)
 * @returns Time in seconds
 */
export function pixelsToTime(px: number, pixelsPerSecond: number): number {
  return px / pixelsPerSecond;
}

/**
 * Snap time to grid
 * @param time - Time in seconds
 * @param gridSize - Grid size in seconds (e.g., 0.1 for 100ms, 1/30 for frames)
 * @param snapEnabled - Whether snapping is enabled
 * @returns Snapped time
 */
export function snapTime(time: number, gridSize: number, snapEnabled: boolean): number {
  if (!snapEnabled || gridSize <= 0) {
    return time;
  }
  return Math.round(time / gridSize) * gridSize;
}

/**
 * Format time as MM:SS or MM:SS.f (with frames)
 * @param seconds - Time in seconds
 * @param fps - Frames per second (optional, for frame display)
 * @returns Formatted time string
 */
export function formatTime(seconds: number, fps?: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (fps) {
    const frames = Math.floor((seconds % 1) * fps);
    return `${mins}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  }
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Debounce function - delays execution until after wait time has elapsed
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
