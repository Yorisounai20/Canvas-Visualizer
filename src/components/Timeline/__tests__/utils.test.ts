import { describe, it, expect } from 'vitest';
import {
  BASE_PX_PER_SECOND,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_FPS,
  timeToPixels,
  pixelsToTime,
  formatTime,
  clampZoom,
  calculatePixelsPerSecond,
  roundToFrame,
  stepByFrames,
  timeToFrame,
  frameToTime,
  calculateTimelineWidth,
} from '../utils';

describe('Timeline Utils - Constants', () => {
  it('should have correct constant values', () => {
    expect(BASE_PX_PER_SECOND).toBe(40);
    expect(MIN_ZOOM).toBe(0.25);
    expect(MAX_ZOOM).toBe(4.0);
    expect(DEFAULT_FPS).toBe(30);
  });
});

describe('timeToPixels and pixelsToTime', () => {
  it('should convert time to pixels correctly', () => {
    expect(timeToPixels(1, 40)).toBe(40);
    expect(timeToPixels(2.5, 40)).toBe(100);
    expect(timeToPixels(0, 40)).toBe(0);
    expect(timeToPixels(10, 80)).toBe(800);
  });

  it('should convert pixels to time correctly', () => {
    expect(pixelsToTime(40, 40)).toBe(1);
    expect(pixelsToTime(100, 40)).toBe(2.5);
    expect(pixelsToTime(0, 40)).toBe(0);
    expect(pixelsToTime(800, 80)).toBe(10);
  });

  it('should verify inverse property (timeToPixels ↔ pixelsToTime)', () => {
    const testCases = [0, 1, 2.5, 5, 10, 17.3, 100];
    const pixelsPerSecond = 40;

    testCases.forEach(time => {
      const pixels = timeToPixels(time, pixelsPerSecond);
      const convertedBack = pixelsToTime(pixels, pixelsPerSecond);
      expect(convertedBack).toBeCloseTo(time, 10);
    });
  });

  it('should verify inverse property with different zoom levels', () => {
    const testCases = [1, 5, 10];
    const zoomLevels = [0.25, 0.5, 1, 2, 4];

    testCases.forEach(time => {
      zoomLevels.forEach(zoom => {
        const pps = BASE_PX_PER_SECOND * zoom;
        const pixels = timeToPixels(time, pps);
        const convertedBack = pixelsToTime(pixels, pps);
        expect(convertedBack).toBeCloseTo(time, 10);
      });
    });
  });
});

describe('formatTime', () => {
  it('should format time without frames correctly', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(30)).toBe('00:30');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(125)).toBe('02:05');
    expect(formatTime(3661)).toBe('61:01');
  });

  it('should format time with frames correctly', () => {
    expect(formatTime(0, 30)).toBe('00:00:00');
    expect(formatTime(1, 30)).toBe('00:01:00');
    expect(formatTime(1.5, 30)).toBe('00:01:15');
    expect(formatTime(2.033, 30)).toBe('00:02:00'); // 2.033s ≈ 2s + 1 frame at 30fps
  });

  it('should handle negative times', () => {
    expect(formatTime(-5)).toBe('-00:05');
    expect(formatTime(-65)).toBe('-01:05');
    expect(formatTime(-1.5, 30)).toBe('-00:01:15');
  });

  it('should handle fractional seconds correctly', () => {
    expect(formatTime(1.999)).toBe('00:01');
    expect(formatTime(59.999)).toBe('00:59');
  });
});

describe('clampZoom', () => {
  it('should clamp zoom to minimum', () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM);
    expect(clampZoom(0.1)).toBe(MIN_ZOOM);
    expect(clampZoom(-1)).toBe(MIN_ZOOM);
  });

  it('should clamp zoom to maximum', () => {
    expect(clampZoom(5)).toBe(MAX_ZOOM);
    expect(clampZoom(10)).toBe(MAX_ZOOM);
    expect(clampZoom(100)).toBe(MAX_ZOOM);
  });

  it('should not clamp valid zoom levels', () => {
    expect(clampZoom(0.25)).toBe(0.25);
    expect(clampZoom(1)).toBe(1);
    expect(clampZoom(2)).toBe(2);
    expect(clampZoom(4)).toBe(4);
  });
});

describe('calculatePixelsPerSecond', () => {
  it('should calculate pixels per second correctly', () => {
    expect(calculatePixelsPerSecond(1)).toBe(40);
    expect(calculatePixelsPerSecond(2)).toBe(80);
    expect(calculatePixelsPerSecond(0.5)).toBe(20);
  });

  it('should clamp zoom before calculating', () => {
    expect(calculatePixelsPerSecond(0.1)).toBe(BASE_PX_PER_SECOND * MIN_ZOOM);
    expect(calculatePixelsPerSecond(10)).toBe(BASE_PX_PER_SECOND * MAX_ZOOM);
  });
});

describe('roundToFrame', () => {
  it('should round to nearest frame at 30fps', () => {
    expect(roundToFrame(0)).toBeCloseTo(0);
    expect(roundToFrame(0.033)).toBeCloseTo(0.033, 2); // 1 frame
    expect(roundToFrame(0.05)).toBeCloseTo(0.067, 2); // rounds to 2 frames (closer to 0.067 than 0.033)
    expect(roundToFrame(1.016)).toBeCloseTo(1.0, 2); // rounds down
    expect(roundToFrame(1.05)).toBeCloseTo(1.067, 2); // rounds up
  });

  it('should round to nearest frame at different fps', () => {
    expect(roundToFrame(0, 60)).toBeCloseTo(0);
    expect(roundToFrame(0.016, 60)).toBeCloseTo(0.0167, 3); // 1 frame at 60fps
    expect(roundToFrame(1, 24)).toBeCloseTo(1.0);
    expect(roundToFrame(1.02, 24)).toBeCloseTo(1.0, 2); // rounds to nearest frame
  });

  it('should handle edge cases', () => {
    expect(roundToFrame(0, 30)).toBe(0);
    expect(roundToFrame(0, 60)).toBe(0);
    expect(roundToFrame(-0.016, 30)).toBeCloseTo(0, 2);
  });
});

describe('stepByFrames', () => {
  it('should step forward by frames at 30fps', () => {
    expect(stepByFrames(0, 1, 30)).toBeCloseTo(0.0333, 3);
    expect(stepByFrames(1, 1, 30)).toBeCloseTo(1.0333, 3);
    expect(stepByFrames(0, 30, 30)).toBeCloseTo(1, 3); // 30 frames = 1 second
    expect(stepByFrames(5, 15, 30)).toBeCloseTo(5.5, 3); // 15 frames = 0.5 seconds
  });

  it('should step backward by frames at 30fps', () => {
    expect(stepByFrames(1, -1, 30)).toBeCloseTo(0.9667, 3);
    expect(stepByFrames(1, -30, 30)).toBeCloseTo(0, 3); // 30 frames back = 1 second
    expect(stepByFrames(5, -15, 30)).toBeCloseTo(4.5, 3);
  });

  it('should step by frames at different fps', () => {
    expect(stepByFrames(0, 1, 60)).toBeCloseTo(0.0167, 3);
    expect(stepByFrames(1, 60, 60)).toBeCloseTo(2, 3); // 60 frames at 60fps = 1 second
    expect(stepByFrames(0, 1, 24)).toBeCloseTo(0.0417, 3);
  });

  it('should default to 30fps', () => {
    expect(stepByFrames(0, 1)).toBeCloseTo(0.0333, 3);
    expect(stepByFrames(1, 30)).toBeCloseTo(2, 3);
  });
});

describe('timeToFrame and frameToTime', () => {
  it('should convert time to frame number', () => {
    expect(timeToFrame(0, 30)).toBe(0);
    expect(timeToFrame(1, 30)).toBe(30);
    expect(timeToFrame(0.5, 30)).toBe(15);
    expect(timeToFrame(2.5, 30)).toBe(75);
  });

  it('should convert frame number to time', () => {
    expect(frameToTime(0, 30)).toBeCloseTo(0);
    expect(frameToTime(30, 30)).toBeCloseTo(1);
    expect(frameToTime(15, 30)).toBeCloseTo(0.5);
    expect(frameToTime(75, 30)).toBeCloseTo(2.5);
  });

  it('should verify inverse property (timeToFrame ↔ frameToTime)', () => {
    const testTimes = [0, 1, 2.5, 5, 10];
    const fps = 30;

    testTimes.forEach(time => {
      const frame = timeToFrame(time, fps);
      const convertedBack = frameToTime(frame, fps);
      // Allow small tolerance due to frame rounding
      expect(convertedBack).toBeCloseTo(time, 2);
    });
  });

  it('should work with different fps values', () => {
    expect(timeToFrame(1, 60)).toBe(60);
    expect(frameToTime(60, 60)).toBeCloseTo(1);
    expect(timeToFrame(1, 24)).toBe(24);
    expect(frameToTime(24, 24)).toBeCloseTo(1);
  });

  it('should default to 30fps', () => {
    expect(timeToFrame(1)).toBe(30);
    expect(frameToTime(30)).toBeCloseTo(1);
  });
});

describe('calculateTimelineWidth', () => {
  it('should calculate timeline width correctly', () => {
    expect(calculateTimelineWidth(10, 1)).toBe(800); // 10s * 40px/s = 400px, but min 800px applies
    expect(calculateTimelineWidth(20, 1)).toBe(800); // 20s * 40px/s
    expect(calculateTimelineWidth(10, 2)).toBe(800); // 10s * 80px/s (zoom 2x)
    expect(calculateTimelineWidth(30, 1)).toBe(1200); // 30s * 40px/s = 1200px (exceeds min)
  });

  it('should respect minimum width', () => {
    expect(calculateTimelineWidth(1, 1)).toBe(800); // 40px < 800px min
    expect(calculateTimelineWidth(5, 1, 1000)).toBe(1000); // 200px < 1000px min
    expect(calculateTimelineWidth(0, 1)).toBe(800); // 0px < 800px min
  });

  it('should apply zoom correctly', () => {
    expect(calculateTimelineWidth(10, 0.5)).toBe(800); // 200px < 800px min
    expect(calculateTimelineWidth(50, 0.5)).toBe(1000); // 50s * 20px/s
    expect(calculateTimelineWidth(10, 4)).toBe(1600); // 10s * 160px/s (zoom 4x)
  });

  it('should clamp zoom in calculation', () => {
    expect(calculateTimelineWidth(10, 0.1)).toBe(800); // uses MIN_ZOOM (0.25)
    expect(calculateTimelineWidth(10, 10)).toBe(1600); // uses MAX_ZOOM (4.0)
  });
});
