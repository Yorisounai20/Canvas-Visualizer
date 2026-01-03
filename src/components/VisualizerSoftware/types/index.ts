export interface LogEntry {
  message: string;
  type: string;
  timestamp: string;
}

export interface AudioTrack {
  id: string;
  name: string;
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  analyser: AnalyserNode;
  gainNode: GainNode;
  volume: number; // 0-1
  muted: boolean;
  active: boolean; // true = this track's frequencies are visualized
}

export interface ParameterEvent {
  id: string;
  startTime: number; // seconds - when the event starts
  endTime: number; // seconds - when the event ends
  mode: 'manual' | 'automated'; // manual = fixed time, automated = react to audio
  audioTrackId?: string; // which track to react to (for automated mode)
  threshold?: number; // frequency threshold for automated triggering (0-1)
  parameters: {
    backgroundFlash?: number; // 0-1 intensity
    cameraShake?: number; // 0-1 intensity
    vignettePulse?: number; // 0-1 intensity
    saturationBurst?: number; // 0-1 intensity
    bloomBurst?: number; // 0-1 intensity (placeholder for future)
    fogPulse?: number; // 0-1 intensity (placeholder for future)
    // Post-FX parameters
    vignetteStrengthPulseRef?: number; // 0-1 intensity - temporarily increase vignette
    contrastBurst?: number; // 0-1 intensity - temporarily boost contrast
    colorTintFlash?: { r: number; g: number; b: number; intensity: number }; // RGB color flash
  };
}

export interface EnvironmentKeyframe {
  id: number;
  time: number;
  type: 'ocean' | 'forest' | 'space' | 'city' | 'abstract' | 'none';
  intensity: number; // 0-1, controls density/visibility of environment elements
  color?: string; // Optional color override
}

// Default camera settings constants
export const DEFAULT_CAMERA_DISTANCE = 15;
export const DEFAULT_CAMERA_HEIGHT = 0;
export const DEFAULT_CAMERA_ROTATION = 0;
export const KEYFRAME_ONLY_ROTATION_SPEED = 0; // Rotation now controlled by keyframes or camera rigs only
export const WAVEFORM_SAMPLES = 200; // Reduced from 800 for better performance
export const WAVEFORM_THROTTLE_MS = 33; // Throttle waveform rendering to ~30fps (1000ms / 30fps = 33ms)
export const FPS_UPDATE_INTERVAL_MS = 1000; // Update FPS counter every second
