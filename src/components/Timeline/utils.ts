/**
 * Timeline Utilities
 * 
 * Provides core utility functions for timeline calculations,
 * time/pixel conversions, snapping, and formatting.
 */

// Constants for timeline calculations
export const BASE_PX_PER_SECOND = 40;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4.0;
export const DEFAULT_FPS = 30;

/**
 * Convert time (seconds) to pixels based on zoom level
 */
export function timeToPixels(timeSec: number, pixelsPerSecond: number = BASE_PX_PER_SECOND): number {
  return timeSec * pixelsPerSecond;
}

/**
 * Convert pixels to time (seconds) based on zoom level
 */
export function pixelsToTime(px: number, pixelsPerSecond: number = BASE_PX_PER_SECOND): number {
  return px / pixelsPerSecond;
}

/**
 * Snap time to grid if snapping is enabled
 * @param time - Time in seconds
 * @param gridSize - Grid size in seconds (e.g., 0.1 for 100ms grid)
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
 * Format time as MM:SS or MM:SS.ff (with frames)
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
 * Debounce function for performance optimization
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate pixels per second based on zoom level
 */
export function getPixelsPerSecond(zoom: number): number {
  return BASE_PX_PER_SECOND * zoom;
}
