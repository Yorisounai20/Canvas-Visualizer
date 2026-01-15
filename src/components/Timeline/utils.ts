/**
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
 * Convert pixel position to time in seconds based on current zoom level
 * @param px - Pixel position
 * @param pixelsPerSecond - Current pixels per second (BASE_PX_PER_SECOND * zoom)
 * @returns Time in seconds
 */
export function pixelsToTime(px: number, pixelsPerSecond: number): number {
  return px / pixelsPerSecond;
}

/**
 * Format time in seconds to human-readable string (MM:SS or MM:SS:FF)
 * @param seconds - Time in seconds
 * @param fps - Optional frames per second for frame display
 * @returns Formatted time string
 */
export function formatTime(seconds: number, fps?: number): string {
  const absSeconds = Math.abs(seconds);
  const sign = seconds < 0 ? '-' : '';
  const minutes = Math.floor(absSeconds / 60);
  const secs = Math.floor(absSeconds % 60);
  
  if (fps) {
    const frames = Math.floor((absSeconds % 1) * fps);
    return `${sign}${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }
  
  return `${sign}${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
 * @param timeSec - Time in seconds
 * @param fps - Frames per second (defaults to DEFAULT_FPS)
 * @returns Frame number (0-indexed)
 */
export function timeToFrame(timeSec: number, fps: number = DEFAULT_FPS): number {
  return Math.floor(timeSec * fps);
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
