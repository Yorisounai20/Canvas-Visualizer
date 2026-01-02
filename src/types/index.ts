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

// PHASE 4: Preset parameters for parameter-driven animations
export interface PresetParameters {
  density: number;    // Object/particle count (1-100)
  speed: number;      // Animation speed multiplier (0.1-10.0)
  intensity: number;  // Audio reactivity strength (0-3.0)
  spread: number;     // Spatial distribution/radius (1-50)
}

export interface Section {
  id: number;
  start: number;
  end: number;
  animation: string;
  visible?: boolean;
  locked?: boolean;
  colorTag?: string;
  parameters?: PresetParameters; // PHASE 4: Editable preset parameters
}

export interface CameraKeyframe {
  time: number;
  distance: number;
  height: number;
  rotation: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  cameraId?: string; // Optional: ID of the camera object to use, if not specified uses main camera
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

// PHASE 5: Text Animator - Per-character animation system
export interface TextAnimatorKeyframe {
  id: string;
  time: number;
  text: string;
  visible: boolean;
  animation: 'fade' | 'slide' | 'scale' | 'bounce' | 'none';
  direction?: 'up' | 'down' | 'left' | 'right'; // For slide animation
  stagger: number; // Delay between each character (in seconds)
  duration: number; // Duration per character animation
  characterOffsets?: CharacterOffset[]; // Per-character position/rotation/scale
}

export interface CharacterOffset {
  index: number;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

// PHASE 5: Mask Reveals - Mask/matte system
export interface Mask {
  id: string;
  name: string;
  type: 'circle' | 'rectangle' | 'custom';
  enabled: boolean;
  inverted: boolean; // Invert mask (show inside vs outside)
  blendMode: 'normal' | 'add' | 'subtract' | 'multiply';
  feather: number; // Edge softness (0-100)
  // Circle-specific
  center?: { x: number; y: number }; // Normalized 0-1
  radius?: number; // Normalized 0-1
  // Rectangle-specific
  rect?: { x: number; y: number; width: number; height: number }; // Normalized 0-1
  // Custom path-specific
  path?: Array<{ x: number; y: number }>; // Normalized 0-1
}

export interface MaskRevealKeyframe {
  id: string;
  time: number;
  maskId: string;
  animation: 'wipe-left' | 'wipe-right' | 'wipe-up' | 'wipe-down' | 'expand-circle' | 'shrink-circle' | 'none';
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  // Target values for animation
  targetCenter?: { x: number; y: number };
  targetRadius?: number;
  targetRect?: { x: number; y: number; width: number; height: number };
}

// PHASE 5: Camera Rig - Null object parenting system
export interface CameraRig {
  id: string;
  name: string;
  enabled: boolean;
  type: 'orbit' | 'dolly' | 'crane' | 'custom' | 'rotation' | 'pan' | 'zoom';
  // Null object transforms
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  // Target tracking
  trackingTarget?: string; // ID of object to follow
  trackingOffset: { x: number; y: number; z: number };
  trackingSmooth: number; // Smoothing factor (0-1)
  // Orbit parameters
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitAxis?: 'x' | 'y' | 'z';
  // Dolly parameters
  dollySpeed?: number;
  dollyAxis?: 'x' | 'y' | 'z';
  // Crane parameters
  craneHeight?: number;
  craneTilt?: number;
  // Rotation parameters (always faces center)
  rotationDistance?: number;
  rotationSpeed?: number;
  // Pan parameters (horizontal sweeping)
  panSpeed?: number;
  panRange?: number; // Degrees of horizontal movement
  // Zoom parameters (smooth in/out)
  zoomSpeed?: number;
  zoomMinDistance?: number;
  zoomMaxDistance?: number;
}

export interface CameraRigKeyframe {
  id: string;
  time: number;
  rigId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  duration: number;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  // Optional preset application
  preset?: 'orbit' | 'dolly' | 'crane';
}

// PHASE 3: Workspace object schema for manual 3D object creation
// FINAL ARCHITECTURE: Extended to support cameras and lights
export interface WorkspaceObject {
  id: string;
  type: 'sphere' | 'box' | 'plane' | 'torus' | 'instances' | 'camera' | 'light';
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  color: string;
  wireframe: boolean;
  visible: boolean;
  mesh?: any; // THREE.Mesh reference (not serialized)
  // Camera-specific properties (when type === 'camera')
  cameraDistance?: number;
  cameraHeight?: number;
  cameraRotation?: number;
  isActiveCamera?: boolean;
  // Letterbox properties (when type === 'camera')
  showLetterbox?: boolean;
  letterboxSize?: number; // 0-100 pixels
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
