// Type definitions for the visualizer application

// PHASE 2: Project state schema for save/load functionality
export interface ProjectSettings {
  name: string;
  resolution: {
    width: number;
    height: number;
  };
  fps: number;
  backgroundColor: string;
  createdAt: string;
  lastModified: string;
  audioFileName?: string;
}

// PHASE 2: Complete project state (everything that can be saved/loaded)
export interface ProjectState {
  settings: ProjectSettings;
  sections: Section[];
  presetKeyframes: PresetKeyframe[];
  textKeyframes: TextKeyframe[];
  // Camera, lighting, and other properties
  cameraDistance: number;
  cameraHeight: number;
  cameraRotation: number;
  cameraAutoRotate: boolean;
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  showBorder: boolean;
  borderColor: string;
  showLetterbox: boolean;
  letterboxSize: number;
  bassColor: string;
  midsColor: string;
  highsColor: string;
  showSongName: boolean;
  customSongName: string;
  manualMode: boolean;
}

export interface Section {
  id: number;
  start: number;
  end: number;
  animation: string;
  visible?: boolean;
  locked?: boolean;
  colorTag?: string;
}

export interface CameraKeyframe {
  time: number;
  distance: number;
  height: number;
  rotation: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface PresetKeyframe {
  id: number;
  time: number;
  preset: string;
}

export interface TextKeyframe {
  id: number;
  time: number;
  show: boolean;
  text?: string;
}

export interface LetterboxKeyframe {
  time: number;
  targetSize: number;
  duration: number;
  mode: 'instant' | 'smooth';
  invert: boolean;
}

export interface CameraShake {
  time: number;
  intensity: number;
  duration: number;
}

export interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error';
  timestamp: string;
}

export interface AnimationType {
  value: string;
  label: string;
  icon: string;
}

export interface AppState {
  // Audio
  isPlaying: boolean;
  audioReady: boolean;
  audioFileName: string;
  currentTime: number;
  duration: number;
  
  // Sections/Layers
  sections: Section[];
  selectedSectionId: number | null;
  
  // Camera
  cameraDistance: number;
  cameraHeight: number;
  cameraRotation: number;
  cameraAutoRotate: boolean;
  cameraKeyframes: CameraKeyframe[];
  cameraShakes: CameraShake[];
  
  // Colors
  bassColor: string;
  midsColor: string;
  highsColor: string;
  backgroundColor: string;
  borderColor: string;
  
  // Effects
  showLetterbox: boolean;
  letterboxSize: number;
  useLetterboxAnimation: boolean;
  letterboxKeyframes: LetterboxKeyframe[];
  maxLetterboxHeight: number;
  
  // UI
  showSongName: boolean;
  customSongName: string;
  showPresetDisplay: boolean;
  showFilename: boolean;
  showBorder: boolean;
  waveformMode: 'scrolling' | 'static';
  
  // Lighting
  ambientLightIntensity: number;
  directionalLightIntensity: number;
  
  // Export
  isExporting: boolean;
  exportProgress: number;
  exportFormat: string;
  exportResolution: string;
  
  // Debug
  errorLog: LogEntry[];
  fps: number;
}
