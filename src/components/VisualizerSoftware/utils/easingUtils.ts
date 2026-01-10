import { DEFAULT_CAMERA_DISTANCE, DEFAULT_CAMERA_HEIGHT, DEFAULT_CAMERA_ROTATION } from '../types';

/**
 * Apply easing function to a value between 0 and 1
 * Comprehensive easing library with 20+ standard easing functions
 */
export const applyEasing = (t: number, easing: string): number => {
  // Clamp t to [0, 1] for safety
  t = Math.max(0, Math.min(1, t));
  
  switch(easing) {
    // Legacy cubic easings (kept for backwards compatibility)
    case 'easeIn':
      return t * t * t; // Cubic ease in
    case 'easeOut':
      return 1 - Math.pow(1 - t, 3); // Cubic ease out
    case 'easeInOut':
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // Cubic ease in-out
    
    // Sine easings - smooth and gentle
    case 'sineIn':
      return 1 - Math.cos((t * Math.PI) / 2);
    case 'sineOut':
      return Math.sin((t * Math.PI) / 2);
    case 'sineInOut':
      return -(Math.cos(Math.PI * t) - 1) / 2;
    
    // Quadratic easings - subtle acceleration
    case 'quadIn':
      return t * t;
    case 'quadOut':
      return 1 - (1 - t) * (1 - t);
    case 'quadInOut':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    
    // Cubic easings (new explicit names)
    case 'cubicIn':
      return t * t * t;
    case 'cubicOut':
      return 1 - Math.pow(1 - t, 3);
    case 'cubicInOut':
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    // Quartic easings - strong acceleration
    case 'quartIn':
      return t * t * t * t;
    case 'quartOut':
      return 1 - Math.pow(1 - t, 4);
    case 'quartInOut':
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    
    // Quintic easings - very strong acceleration
    case 'quintIn':
      return t * t * t * t * t;
    case 'quintOut':
      return 1 - Math.pow(1 - t, 5);
    case 'quintInOut':
      return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
    
    // Exponential easings - dramatic acceleration
    case 'expoIn':
      return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
    case 'expoOut':
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    case 'expoInOut':
      return t === 0 ? 0 : t === 1 ? 1 : t < 0.5 
        ? Math.pow(2, 20 * t - 10) / 2
        : (2 - Math.pow(2, -20 * t + 10)) / 2;
    
    // Circular easings - smooth circular motion
    case 'circIn':
      return 1 - Math.sqrt(1 - Math.pow(t, 2));
    case 'circOut':
      return Math.sqrt(1 - Math.pow(t - 1, 2));
    case 'circInOut':
      return t < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
    
    // Back easings - overshoot and return
    case 'backIn': {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return c3 * t * t * t - c1 * t * t;
    }
    case 'backOut': {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    case 'backInOut': {
      const c1 = 1.70158;
      const c2 = c1 * 1.525;
      return t < 0.5
        ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
        : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    }
    
    // Elastic easings - spring-like oscillation
    case 'elasticIn': {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    }
    case 'elasticOut': {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
    case 'elasticInOut': {
      const c5 = (2 * Math.PI) / 4.5;
      return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
        ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
    }
    
    // Bounce easings - bouncing ball effect
    case 'bounceIn':
      return 1 - applyEasing(1 - t, 'bounceOut');
    case 'bounceOut': {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    }
    case 'bounceInOut':
      return t < 0.5
        ? (1 - applyEasing(1 - 2 * t, 'bounceOut')) / 2
        : (1 + applyEasing(2 * t - 1, 'bounceOut')) / 2;
    
    // Linear (default)
    case 'linear':
    default:
      return t;
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
