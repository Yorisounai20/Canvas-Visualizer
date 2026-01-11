/**
 * Type definitions for the Canvas Visualizer preset system.
 * These types define the structure of preset JSON files and the PresetManager API.
 */

/**
 * A single keyframe point in an automation curve.
 */
export interface AutomationKeyframe {
  /** Time in seconds */
  time: number;
  /** Value at this time */
  value: number;
  /** Easing function: linear, easeIn, easeOut, easeInOut, etc. */
  easing?: string;
}

/**
 * An automation curve for a single parameter.
 */
export interface Automation {
  /** Target parameter path (e.g., "camera.distance", "shapes.tailWave.amplitude") */
  target: string;
  /** Keyframes defining the curve */
  keyframes: AutomationKeyframe[];
}

/**
 * Audio-reactive modulation for a parameter.
 */
export interface AudioReactive {
  /** Target parameter path */
  target: string;
  /** Audio frequency band: bass, mids, or highs */
  band: 'bass' | 'mids' | 'highs';
  /** Modulation amount (multiplier or additive) */
  amount: number;
  /** Modulation mode: multiply or add */
  mode?: 'multiply' | 'add';
}

/**
 * A timed event that triggers an action.
 */
export interface PresetEvent {
  /** Time in seconds when event fires */
  time: number;
  /** Action identifier (e.g., "particleBurst", "shapeSpawn") */
  action: string;
  /** Arguments for the action */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: Record<string, any>;
}

/**
 * Camera configuration section.
 */
export interface CameraConfig {
  /** Starting distance from origin */
  distance?: number;
  /** Starting height (Y position) */
  height?: number;
  /** Starting rotation (degrees) */
  rotation?: number;
  /** Field of view */
  fov?: number;
}

/**
 * A complete preset definition.
 */
export interface PresetFile {
  /** Preset metadata */
  meta: {
    /** Preset name */
    name: string;
    /** Author name */
    author?: string;
    /** Version string */
    version?: string;
    /** Description */
    description?: string;
  };
  /** Preset duration in seconds */
  duration: number;
  /** Initial camera configuration */
  camera?: CameraConfig;
  /** Automation curves */
  automations?: Automation[];
  /** Audio-reactive modulations */
  audioReactive?: AudioReactive[];
  /** Timed events */
  events?: PresetEvent[];
  /** Static parameters (constant values) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
}

/**
 * Resolved values at a specific time point.
 * Returned by PresetManager.evaluate().
 */
export interface ResolvedPreset {
  /** Camera values at this time */
  camera?: {
    distance?: number;
    height?: number;
    rotation?: number;
    fov?: number;
  };
  /** All parameter values (automations + audioReactive + static params) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, number | string | boolean | any>;
  /** Events that fire at this exact time */
  events?: PresetEvent[];
}

/**
 * Context passed to setter and action functions.
 */
export interface PresetContext {
  /** Current time in seconds */
  t: number;
  /** Delta time since last frame (optional) */
  dt?: number;
  /** Audio snapshot (optional) */
  audio?: {
    bass: number;
    mids: number;
    highs: number;
  };
}

/**
 * Setter function signature.
 * Setters receive a value and context, and mutate Three.js objects directly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SetterFunction = (value: any, ctx: PresetContext) => void;

/**
 * Action function signature.
 * Actions receive arguments and context, and perform one-time operations.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ActionFunction = (args: any, ctx: PresetContext) => void;
