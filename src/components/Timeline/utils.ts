/**
 * Timeline Utilities
 * 
 * Core utility functions for the scrollable timeline component.
 * Handles time-to-pixel conversions, snapping, and formatting.
 */

// Timeline zoom and scaling constants
export const BASE_PX_PER_SECOND = 40; // Base pixels per second at zoom level 1.0
export const MIN_ZOOM = 0.25; // Minimum zoom level (0.25x = 25%)
export const MAX_ZOOM = 4.0;  // Maximum zoom level (4.0x = 400%)
export const DEFAULT_FPS = 30; // Default frames per second for frame stepping

/**
 * Convert time in seconds to pixel position
 * Timeline utilities for time/pixel conversion and formatting
 * Part of the scrollable per-track timeline implementation (PR A)
 */

// Constants for timeline sizing and zoom
export const BASE_PX_PER_SECOND = 40;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4.0;
export const DEFAULT_FPS = 30;

/**
 * Convert time in seconds to pixels based on current zoom level
 * @param timeSec - Time in seconds
 * @param pixelsPerSecond - Current pixels per second (BASE_PX_PER_SECOND * zoom)
 * @returns Pixel position
 */
export function timeToPixels(timeSec: number, pixelsPerSecond: number): number {
  return timeSec * pixelsPerSecond;
}

/**
 * Convert pixel position to time in seconds
 * Convert pixel position to time in seconds based on current zoom level
 * @param px - Pixel position
 * @param pixelsPerSecond - Current pixels per second (BASE_PX_PER_SECOND * zoom)
 * @returns Time in seconds
 */
export function pixelsToTime(px: number, pixelsPerSecond: number): number {
  return px / pixelsPerSecond;
}

/**
 * Snap time to grid if snapping is enabled
 * @param time - Time in seconds to snap
 * @param gridSize - Grid size in seconds (e.g., 0.1 for 100ms grid)
 * @param snapEnabled - Whether snapping is enabled
 * @returns Snapped time in seconds
 */
export function snapTime(time: number, gridSize: number, snapEnabled: boolean): number {
  if (!snapEnabled || gridSize <= 0) {
    return time;
  }
  return Math.round(time / gridSize) * gridSize;
}

/**
 * Format time as MM:SS.mmm or HH:MM:SS.mmm
 * @param seconds - Time in seconds
 * @param fps - Optional FPS for frame-accurate display
 * @returns Formatted time string
 */
export function formatTime(seconds: number, fps?: number): string {
  // Handle negative times
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = Math.floor(absSeconds % 60);
  
  if (fps) {
    // Frame-accurate display
    const frames = Math.floor((absSeconds % 1) * fps);
    if (hours > 0) {
      return `${isNegative ? '-' : ''}${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
    }
    return `${isNegative ? '-' : ''}${minutes}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  } else {
    // Millisecond display
    const ms = Math.floor((absSeconds % 1) * 1000);
    if (hours > 0) {
      return `${isNegative ? '-' : ''}${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    return `${isNegative ? '-' : ''}${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
}

/**
 * Round time to nearest frame
 * @param time - Time in seconds
 * @param fps - Frames per second (default: 30)
 * @returns Time rounded to nearest frame
 */
export function roundToFrame(time: number, fps: number = DEFAULT_FPS): number {
  const frameTime = 1 / fps;
  return Math.round(time / frameTime) * frameTime;
}

/**
 * Clamp zoom level to valid range
 * @param zoom - Desired zoom level
 * @returns Clamped zoom level between MIN_ZOOM and MAX_ZOOM
 */
export function clampZoom(zoom: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

/**
 * Calculate pixels per second based on zoom level
 * @param zoom - Zoom level multiplier
 * @returns Pixels per second
 */
export function calculatePixelsPerSecond(zoom: number): number {
  return BASE_PX_PER_SECOND * clampZoom(zoom);
}

/**
 * Round time to nearest frame boundary
 * @param timeSec - Time in seconds
 * @param fps - Frames per second (defaults to DEFAULT_FPS)
 * @returns Time rounded to nearest frame
 */
export function roundToFrame(timeSec: number, fps: number = DEFAULT_FPS): number {
  const frameTime = 1 / fps;
  return Math.round(timeSec / frameTime) * frameTime;
}

/**
 * Step time forward or backward by a specific number of frames
 * @param currentTime - Current time in seconds
 * @param frames - Number of frames to step (positive or negative)
 * @param fps - Frames per second (defaults to DEFAULT_FPS)
 * @returns New time in seconds
 */
export function stepByFrames(
  currentTime: number,
  frames: number,
  fps: number = DEFAULT_FPS
): number {
  const frameTime = 1 / fps;
  return currentTime + (frames * frameTime);
}

/**
 * Get frame number from time
 * @param time - Time in seconds
 * @param fps - Frames per second (default: 30)
 * @returns Frame number (0-indexed)
 */
export function timeToFrame(time: number, fps: number = DEFAULT_FPS): number {
  return Math.floor(time * fps);
}

/**
 * Convert frame number to time
 * @param frame - Frame number (0-indexed)
 * @param fps - Frames per second (defaults to DEFAULT_FPS)
 * @returns Time in seconds
 */
export function frameToTime(frame: number, fps: number = DEFAULT_FPS): number {
  return frame / fps;
}

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate pixels per second from zoom level
 * @param zoom - Zoom level (0.25 to 4.0)
 * @returns Pixels per second
 */
export function getPixelsPerSecond(zoom: number): number {
  return BASE_PX_PER_SECOND * zoom;
}

/**
 * Calculate timeline width based on duration and zoom
 * @param durationSec - Duration in seconds
 * @param zoom - Zoom level multiplier
 * @param minWidth - Minimum width in pixels (default 800)
 * @returns Timeline width in pixels
 */
export function calculateTimelineWidth(
  durationSec: number,
  zoom: number,
  minWidth: number = 800
): number {
  const pixelsPerSecond = calculatePixelsPerSecond(zoom);
  const calculatedWidth = timeToPixels(durationSec, pixelsPerSecond);
  return Math.max(calculatedWidth, minWidth);
}
