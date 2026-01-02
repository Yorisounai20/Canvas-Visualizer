import { DEFAULT_CAMERA_DISTANCE, DEFAULT_CAMERA_HEIGHT, DEFAULT_CAMERA_ROTATION } from '../types';

/**
 * Apply easing function to a value between 0 and 1
 */
export const applyEasing = (t: number, easing: string): number => {
  switch(easing) {
    case 'easeIn':
      return t * t * t; // Cubic ease in
    case 'easeOut':
      return 1 - Math.pow(1 - t, 3); // Cubic ease out
    case 'easeInOut':
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // Cubic ease in-out
    case 'linear':
    default:
      return t; // Linear (no easing)
  }
};

/**
 * Interpolate camera values between keyframes
 */
export const interpolateCameraKeyframes = (keyframes: any[], currentTime: number) => {
  if (!keyframes || keyframes.length === 0) {
    return {
      distance: DEFAULT_CAMERA_DISTANCE,
      height: DEFAULT_CAMERA_HEIGHT,
      rotation: DEFAULT_CAMERA_ROTATION
    };
  }

  // Sort keyframes by time
  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time);

  // Find the two keyframes to interpolate between
  let prevKeyframe = sortedKeyframes[0];
  let nextKeyframe = sortedKeyframes[sortedKeyframes.length - 1];

  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    if (currentTime >= sortedKeyframes[i].time && currentTime <= sortedKeyframes[i + 1].time) {
      prevKeyframe = sortedKeyframes[i];
      nextKeyframe = sortedKeyframes[i + 1];
      break;
    }
  }

  // If we're before the first keyframe or after the last, use the boundary values
  if (currentTime <= sortedKeyframes[0].time) {
    return {
      distance: sortedKeyframes[0].distance,
      height: sortedKeyframes[0].height,
      rotation: sortedKeyframes[0].rotation
    };
  }
  if (currentTime >= sortedKeyframes[sortedKeyframes.length - 1].time) {
    const last = sortedKeyframes[sortedKeyframes.length - 1];
    return {
      distance: last.distance,
      height: last.height,
      rotation: last.rotation
    };
  }

  // Interpolation between keyframes with easing
  const timeDiff = nextKeyframe.time - prevKeyframe.time;
  const linearProgress = timeDiff > 0 ? (currentTime - prevKeyframe.time) / timeDiff : 0;
  
  // Apply easing function to the progress
  const easing = prevKeyframe.easing || 'linear';
  const easedProgress = applyEasing(linearProgress, easing);

  return {
    distance: prevKeyframe.distance + (nextKeyframe.distance - prevKeyframe.distance) * easedProgress,
    height: prevKeyframe.height + (nextKeyframe.height - prevKeyframe.height) * easedProgress,
    rotation: prevKeyframe.rotation + (nextKeyframe.rotation - prevKeyframe.rotation) * easedProgress
  };
};
