import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { Trash2, Plus, Play, Pause, Square, X, ChevronDown } from 'lucide-react';
import ProjectsModal from './components/Modals/ProjectsModal';
import NewProjectModal from './components/Modals/NewProjectModal';
import SettingsModal from './components/Modals/SettingsModal';
import { saveProject, loadProject, isDatabaseAvailable } from './lib/database';
import { autosaveService } from './lib/autosaveService';
import { ProjectSettings, ProjectState, CameraFXClip, CameraFXKeyframe, CameraFXAudioModulation, WorkspaceObject } from './types';
import { 
  LogEntry, 
  AudioTrack, 
  ParameterEvent,
  EnvironmentKeyframe,
  DEFAULT_CAMERA_DISTANCE,
  DEFAULT_CAMERA_HEIGHT,
  DEFAULT_CAMERA_ROTATION,
  KEYFRAME_ONLY_ROTATION_SPEED,
  WAVEFORM_SAMPLES,
  WAVEFORM_THROTTLE_MS,
  FPS_UPDATE_INTERVAL_MS
} from './components/VisualizerSoftware/types';
import { 
  formatTime, 
  formatTimeInput, 
  parseTime, 
  parseTimeInput,
  applyEasing,
  animationTypes,
  generateWaveformData
} from './components/VisualizerSoftware/utils';
import { PostFXShader } from './components/VisualizerSoftware/shaders/PostFXShader';
import { VideoExportModal } from './components/VisualizerSoftware/components';
import { ParticleEmitter, ParticleSystemManager } from './lib/particleSystem';
import { createMaterial, createShapePools } from './visualizer/shapeFactory';
import hammerheadPreset from './presets/hammerhead';
import orbitPreset from './presets/orbit';
import explosionPreset from './presets/explosion';
import tunnelPreset from './presets/tunnel';
import wavePreset from './presets/wave';
import spiralPreset from './presets/spiral';
import chillPreset from './presets/chill';
import pulsePreset from './presets/pulse';
import vortexPreset from './presets/vortex';
import seiryuPreset from './presets/seiryu';
import cosmicPreset from './presets/cosmic';
import cityscapePreset from './presets/cityscape';
import oceanwavesPreset from './presets/oceanwaves';
import forestPreset from './presets/forest';
import portalsPreset from './presets/portals';
import discoballPreset from './presets/discoball';
import windturbinesPreset from './presets/windturbines';
import clockworkPreset from './presets/clockwork';
import neontunnelPreset from './presets/neontunnel';
import atommodelPreset from './presets/atommodel';
import carouselPreset from './presets/carousel';
import solarsystemPreset from './presets/solarsystem';
import datastreamPreset from './presets/datastream';
import ferriswheelPreset from './presets/ferriswheel';
import tornadovortexPreset from './presets/tornadovortex';
import stadiumPreset from './presets/stadium';
import kaleidoscope2Preset from './presets/kaleidoscope2';
import emptyPreset from './presets/empty';
// PR 4: Solver imports
import { solveOrbit } from './presets/solvers/orbitSolver';
import LayoutShell from './visualizer/LayoutShell';
import TopBar from './visualizer/TopBar';
import { 
  AudioTab,
  ControlsTab, 
  CameraTab, 
  PresetsTab, 
  EffectsTab,
  PostFXTab,
  EnvironmentsTab, 
  CameraFXTab, 
  CameraRigTab 
} from './components/Inspector';
import DebugConsole from './components/Debug/DebugConsole';
import { PerformanceOverlay } from './components/Performance/PerformanceOverlay';
import { PerformanceMonitor } from './lib/performanceMonitor';
import TimelineV2 from './components/Timeline/TimelineV2';
import { SceneExplorer } from './components/Workspace/SceneExplorer';
import WorkspaceControls from './components/Workspace/WorkspaceControls';
import ObjectPropertiesPanel from './components/Workspace/ObjectPropertiesPanel';
import WorkspaceLeftPanel from './components/Workspace/WorkspaceLeftPanel';
import WorkspaceRightPanel from './components/Workspace/WorkspaceRightPanel';
import WorkspaceLayout from './components/Workspace/WorkspaceLayout';
import ScenePanel from './components/Workspace/ScenePanel';
import SequencerPanel from './components/Workspace/SequencerPanel';
import TemplatesPanel from './components/Workspace/TemplatesPanel';
import AuthoringPanel from './components/Workspace/AuthoringPanel';
import WorkspaceStatusBar from './components/Workspace/WorkspaceStatusBar';

// Export video quality constants
const EXPORT_BITRATE_SD = 8000000;      // 8 Mbps for 960x540
const EXPORT_BITRATE_HD = 12000000;     // 12 Mbps for 1280x720
const EXPORT_BITRATE_FULLHD = 20000000; // 20 Mbps for 1920x1080
const EXPORT_PIXELS_HD = 1280 * 720;
const EXPORT_PIXELS_FULLHD = 1920 * 1080;
const EXPORT_TIMESLICE_MS = 1000;       // Request data every 1 second
const EXPORT_DATA_REQUEST_INTERVAL_MS = 2000; // Request data every 2 seconds

interface ThreeDVisualizerProps {
  onBackToDashboard?: () => void;
}

export default function ThreeDVisualizer({ onBackToDashboard }: ThreeDVisualizerProps = {}) {
  // Get authenticated user - TODO: Implement when auth is configured
  const user = undefined;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const postFXPassRef = useRef<ShaderPass | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const idleAnimationRef = useRef<number | null>(null);
  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const lightsRef = useRef<{ ambient: THREE.AmbientLight | null; directional: THREE.DirectionalLight | null }>({ ambient: null, directional: null });
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);
  const [audioFileName, setAudioFileName] = useState('');
  const objectsRef = useRef<{
    cubes: THREE.Mesh[];
    octas: THREE.Mesh[];
    tetras: THREE.Mesh[];
    toruses: THREE.Mesh[];
    planes: THREE.Mesh[];
    sphere: THREE.Mesh;
  } | null>(null);
  
  // Camera Rig Hint objects
  const rigHintsRef = useRef<{
    positionMarker: THREE.Mesh | null;
    targetMarker: THREE.Mesh | null;
    pathLine: THREE.Line | null;
    gridHelper: THREE.GridHelper | null;
    connectionLine: THREE.Line | null;
  }>({
    positionMarker: null,
    targetMarker: null,
    pathLine: null,
    gridHelper: null,
    connectionLine: null
  });
  
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bassColor, setBassColor] = useState('#8a2be2');
  const [midsColor, setMidsColor] = useState('#40e0d0');
  const [highsColor, setHighsColor] = useState('#c8b4ff');
  const [bassGain, setBassGain] = useState(1.0);
  const [midsGain, setMidsGain] = useState(1.0);
  const [highsGain, setHighsGain] = useState(1.0);
  const [showSongName, setShowSongName] = useState(false);
  const [customSongName, setCustomSongName] = useState('');
  const [textColor, setTextColor] = useState('#ffffff'); // User-defined text color
  const [textMaterialType, setTextMaterialType] = useState<'basic' | 'standard' | 'phong' | 'lambert'>('basic');
  const [textWireframe, setTextWireframe] = useState(false);
  const [textOpacity, setTextOpacity] = useState(0.9);
  const [textMetalness, setTextMetalness] = useState(0.5);
  const [textRoughness, setTextRoughness] = useState(0.5);
  const songNameMeshesRef = useRef<THREE.Mesh[]>([]);
  const fontRef = useRef<any>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [errorLog, setErrorLog] = useState<LogEntry[]>([]);
  const [customFontName, setCustomFontName] = useState('Helvetiker (Default)');
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE);
  const [cameraHeight, setCameraHeight] = useState(DEFAULT_CAMERA_HEIGHT);
  const [cameraRotation, setCameraRotation] = useState(DEFAULT_CAMERA_ROTATION);
  const [cameraAutoRotate, setCameraAutoRotate] = useState(false);
  
  // Camera Rig Visual Hints
  const [showRigHints, setShowRigHints] = useState(false);
  const [showRigPosition, setShowRigPosition] = useState(true);
  const [showRigTarget, setShowRigTarget] = useState(true);
  const [showRigPath, setShowRigPath] = useState(true);
  const [showRigGrid, setShowRigGrid] = useState(true);
  
  // Camera Rig Path Visualization
  const [showRigPaths, setShowRigPaths] = useState(true);
  const [showRigKeyframeMarkers, setShowRigKeyframeMarkers] = useState(true);
  const rigPathsRef = useRef<Map<string, {
    pathLine: THREE.Line | null;
    keyframeMarkers: THREE.Mesh[];
  }>>(new Map());
  
  // NEW: HUD visibility controls
  const [showPresetDisplay, setShowPresetDisplay] = useState(true);
  const [showFilename, setShowFilename] = useState(true);
  const [showBorder, setShowBorder] = useState(true);
  
  // NEW: Waveform mode control
  const [waveformMode, setWaveformMode] = useState<'scrolling' | 'static'>('scrolling');
  
  // NEW: Visual effects controls
  const DEFAULT_MAX_LETTERBOX_HEIGHT = 270; // Default maximum bar height for curtain mode
  const [letterboxSize, setLetterboxSize] = useState(0); // 0-100 pixels (current animated value)
  const [showLetterbox, setShowLetterbox] = useState(false);
  const [useLetterboxAnimation, setUseLetterboxAnimation] = useState(false); // Toggle for animated vs manual mode
  const [activeLetterboxInvert, setActiveLetterboxInvert] = useState(false); // Current active invert setting from keyframes
  const [letterboxSettingsExpanded, setLetterboxSettingsExpanded] = useState(false); // Collapsible settings
  const [maxLetterboxHeight, setMaxLetterboxHeight] = useState(DEFAULT_MAX_LETTERBOX_HEIGHT); // Maximum bar height for curtain mode (affects both top and bottom)
  const [backgroundColor, setBackgroundColor] = useState('#0a0a14');
  const [borderColor, setBorderColor] = useState('#9333ea'); // purple-600
  
  // View Mode: Editor (all panels visible) or Preview (canvas only)
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  
  // Workspace Mode: Manual 3D object creation and editing
  const [workspaceMode, setWorkspaceMode] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showAxes, setShowAxes] = useState(false);
  const [useWorkspaceObjects, setUseWorkspaceObjects] = useState(false); // Toggle between preset shapes and workspace objects
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  
  // PR 5: Preset Authoring Mode
  const [presetAuthoringMode, setPresetAuthoringMode] = useState(false);
  
  // Performance monitoring (PR 9: Guardrails)
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false);
  const perfMonitorRef = useRef<PerformanceMonitor | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false); // Track if typing in input to prevent shortcuts
  const [authoringPreset, setAuthoringPreset] = useState('orbit');
  const [mockTime, setMockTime] = useState(0);
  const [mockAudio, setMockAudio] = useState({ bass: 128, mids: 128, highs: 128 });
  
  // NEW: Skybox controls
  const [skyboxType, setSkyboxType] = useState<'color' | 'gradient' | 'image' | 'stars' | 'galaxy' | 'nebula'>('color');
  const [skyboxGradientTop, setSkyboxGradientTop] = useState('#1a1a3e');
  const [skyboxGradientBottom, setSkyboxGradientBottom] = useState('#0a0a14');
  const [skyboxImageUrl, setSkyboxImageUrl] = useState('');
  const skyboxMeshRef = useRef<THREE.Mesh | null>(null);
  const starFieldRef = useRef<THREE.Points | null>(null);
  const [starCount, setStarCount] = useState(5000);
  const [galaxyColor, setGalaxyColor] = useState('#8a2be2');
  const [nebulaColor1, setNebulaColor1] = useState('#ff1493');
  const [nebulaColor2, setNebulaColor2] = useState('#4169e1');
  const [ambientLightIntensity, setAmbientLightIntensity] = useState(0.5);
  const [directionalLightIntensity, setDirectionalLightIntensity] = useState(0.5);
  
  // NEW: Material controls for shapes
  const [cubeWireframe, setCubeWireframe] = useState(true);
  const [cubeOpacity, setCubeOpacity] = useState(0.6);
  const [cubeColor, setCubeColor] = useState('#8a2be2');
  const [cubeMaterialType, setCubeMaterialType] = useState<'basic' | 'standard' | 'phong' | 'lambert'>('basic');
  const [cubeMetalness, setCubeMetalness] = useState(0.5);
  const [cubeRoughness, setCubeRoughness] = useState(0.5);
  const [octahedronWireframe, setOctahedronWireframe] = useState(true);
  const [octahedronOpacity, setOctahedronOpacity] = useState(0.5);
  const [octahedronColor, setOctahedronColor] = useState('#40e0d0');
  const [octahedronMaterialType, setOctahedronMaterialType] = useState<'basic' | 'standard' | 'phong' | 'lambert'>('basic');
  const [octahedronMetalness, setOctahedronMetalness] = useState(0.5);
  const [octahedronRoughness, setOctahedronRoughness] = useState(0.5);
  const [tetrahedronWireframe, setTetrahedronWireframe] = useState(false);
  const [tetrahedronOpacity, setTetrahedronOpacity] = useState(0.7);
  const [tetrahedronColor, setTetrahedronColor] = useState('#c8b4ff');
  const [tetrahedronMaterialType, setTetrahedronMaterialType] = useState<'basic' | 'standard' | 'phong' | 'lambert'>('basic');
  const [tetrahedronMetalness, setTetrahedronMetalness] = useState(0.5);
  const [tetrahedronRoughness, setTetrahedronRoughness] = useState(0.5);
  const [sphereWireframe, setSphereWireframe] = useState(true);
  const [sphereOpacity, setSphereOpacity] = useState(0.4);
  const [sphereColor, setSphereColor] = useState('#8a2be2');
  const [sphereMaterialType, setSphereMaterialType] = useState<'basic' | 'standard' | 'phong' | 'lambert'>('basic');
  const [sphereMetalness, setSphereMetalness] = useState(0.5);
  const [sphereRoughness, setSphereRoughness] = useState(0.5);
  
  // Plane Materials
  const [planeWireframe, setPlaneWireframe] = useState(false);
  const [planeOpacity, setPlaneOpacity] = useState(0.7);
  const [planeColor, setPlaneColor] = useState('#ff6b6b');
  const [planeMaterialType, setPlaneMaterialType] = useState<'basic' | 'standard' | 'phong' | 'lambert'>('basic');
  const [planeMetalness, setPlaneMetalness] = useState(0.5);
  const [planeRoughness, setPlaneRoughness] = useState(0.5);
  
  // Torus Materials
  const [torusWireframe, setTorusWireframe] = useState(true);
  const [torusOpacity, setTorusOpacity] = useState(0.5);
  const [torusColor, setTorusColor] = useState('#4ecdc4');
  const [torusMaterialType, setTorusMaterialType] = useState<'basic' | 'standard' | 'phong' | 'lambert'>('basic');
  const [torusMetalness, setTorusMetalness] = useState(0.5);
  const [torusRoughness, setTorusRoughness] = useState(0.5);
  
  // NEW: Post-FX controls
  const [blendMode, setBlendMode] = useState<'normal' | 'additive' | 'multiply' | 'screen'>('normal');
  const [vignetteStrength, setVignetteStrength] = useState(0);
  const [vignetteSoftness, setVignetteSoftness] = useState(0.5);
  const [colorSaturation, setColorSaturation] = useState(1.0);
  const [colorContrast, setColorContrast] = useState(1.0);
  const [colorGamma, setColorGamma] = useState(1.0);
  const [colorTintR, setColorTintR] = useState(1.0);
  const [colorTintG, setColorTintG] = useState(1.0);
  const [colorTintB, setColorTintB] = useState(1.0);
  
  // NEW: Letterbox animation keyframes
  const [letterboxKeyframes, setLetterboxKeyframes] = useState<Array<{
    id?: number;         // Unique ID for each keyframe
    time: number;        // Time in seconds when this keyframe activates
    targetSize: number;  // Target letterbox size (0-100px)
    duration: number;    // Duration of the animation in seconds
    mode: 'instant' | 'smooth'; // Animation mode
    invert: boolean;     // Per-keyframe invert: true = curtain mode (100=closed, 0=open)
  }>>([]);
  const nextLetterboxKeyframeId = useRef(1); // Counter for generating unique IDs
  // NEW: Camera shake events
  const [cameraShakes, setCameraShakes] = useState<Array<{time: number, intensity: number, duration: number}>>([]);
  
  // NEW: Recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  // NEW: Video export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState('webm'); // 'webm' or 'mp4'
  const [exportResolution, setExportResolution] = useState('960x540'); // '960x540', '1280x720', '1920x1080'
  const [showExportModal, setShowExportModal] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Save/Load project state
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);
  const [lastAutosaveTime, setLastAutosaveTime] = useState<Date | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState('Untitled Project');
  
  // NEW: Tab state
  const [activeTab, setActiveTab] = useState('waveforms'); // PHASE 4: Start with waveforms tab
  
  // Debug console modal state
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  
  // Tab order for keyboard navigation (matches the order of tab buttons in the UI)
  const TAB_ORDER = ['waveforms', 'presets', 'controls', 'camera', 'cameraRig', 'camerafx', 'effects', 'environments', 'postfx', 'textAnimator'] as const;
  
  // Golden angle constant for natural spiral patterns (used in hourglass preset)
  const GOLDEN_ANGLE_DEGREES = 137.5;
  
  // Default frequency values when no audio is loaded (maintains visual rendering without audio response)
  const DEFAULT_FREQUENCY_VALUES = { bass: 0, mids: 0, highs: 0 };
  
  // Preset transition opacity constants
  const FULL_OPACITY = 1;
  const TRANSITION_SPEED = 0.02; // Rate at which blend increases per frame
  
  // PHASE 4: Multi-audio track system
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const audioTracksRef = useRef<AudioTrack[]>([]);
  
  // PHASE 4: Parameter events for flash effects
  const [parameterEvents, setParameterEvents] = useState<ParameterEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [parameterSettingsExpanded, setParameterSettingsExpanded] = useState(false); // Collapsible settings
  
  // Text Animator edit modal
  const [showTextAnimatorModal, setShowTextAnimatorModal] = useState(false);
  const [editingTextAnimatorId, setEditingTextAnimatorId] = useState<string | null>(null);
  
  // PHASE 4: Active parameter effect values (stored in refs for performance)
  const activeBackgroundFlashRef = useRef(0);
  const activeVignettePulseRef = useRef(0);
  const activeSaturationBurstRef = useRef(0);
  
  // PHASE 4 (Enhanced): Active Post-FX parameter values
  const activeVignetteStrengthPulseRef = useRef(0);
  const activeContrastBurstRef = useRef(0);
  const activeColorTintFlashRef = useRef({ r: 0, g: 0, b: 0 });
  
  // Environment system (similar to VisualizerEditor)
  const [environmentKeyframes, setEnvironmentKeyframes] = useState<EnvironmentKeyframe[]>([]);
  const [showEnvironmentSettings, setShowEnvironmentSettings] = useState(false);
  const nextEnvironmentKeyframeId = useRef(1);
  
  // PHASE 4: Track active automated events
  const activeAutomatedEventsRef = useRef<Map<string, number>>(new Map()); // eventId -> startTime
  
  // Particle system state - using only for template/defaults when creating new keyframes
  const [particleEmissionRate, setParticleEmissionRate] = useState(50);
  const [particleLifetime, setParticleLifetime] = useState(2.0);
  const [particleMaxCount, setParticleMaxCount] = useState(300); // Reduced from 500 for better performance
  const [particleSpawnX, setParticleSpawnX] = useState(0);
  const [particleSpawnY, setParticleSpawnY] = useState(0);
  const [particleSpawnZ, setParticleSpawnZ] = useState(0);
  const [particleSpawnRadius, setParticleSpawnRadius] = useState(2);
  const [particleStartColor, setParticleStartColor] = useState('#00ffff');
  const [particleEndColor, setParticleEndColor] = useState('#0000ff');
  const [particleStartSize, setParticleStartSize] = useState(0.5);
  const [particleEndSize, setParticleEndSize] = useState(0.1);
  const [particleAudioTrack, setParticleAudioTrack] = useState<'bass'|'mids'|'highs'|'all'>('highs');
  const [particleAudioAffects, setParticleAudioAffects] = useState(['size']);
  const [particleShape, setParticleShape] = useState<'sphere'|'cube'|'tetrahedron'|'octahedron'>('sphere');

  const particleManagerRef = useRef<ParticleSystemManager | null>(null);
  
  // Multi-emitter timeline system
  const [particleEmitterKeyframes, setParticleEmitterKeyframes] = useState<Array<{
    id: number;
    time: number; // start time in seconds
    duration: number; // how long emitter stays active
    emissionRate: number;
    lifetime: number;
    maxParticles: number;
    spawnX: number;
    spawnY: number;
    spawnZ: number;
    spawnRadius: number;
    startColor: string;
    endColor: string;
    startSize: number;
    endSize: number;
    audioTrack: 'bass' | 'mids' | 'highs' | 'all';
    shape: 'sphere' | 'cube' | 'tetrahedron' | 'octahedron';
    enabled: boolean;
  }>>([]);
  const nextParticleEmitterKeyframeId = useRef(1);
  const activeEmitterIds = useRef<Set<number>>(new Set()); // Track which emitters are currently active
  
  // NEW: Global camera keyframes (independent from presets)
  // REMOVED: Camera keyframes (orphaned global camera feature - replaced by Camera Rig)
  
  // NEW: Preset switching keyframes (timeline-based) - Enhanced with segments
  const [presetKeyframes, setPresetKeyframes] = useState<Array<{
    id: number;
    time: number; // start time
    endTime: number; // end time (duration of this preset)
    preset: string; // animation type (orbit, explosion, chill, etc.)
    speed: number; // animation speed multiplier (0.1 to 3.0, default 1.0)
  }>>([
    { id: 1, time: 0, endTime: 20, preset: 'orbit', speed: 1.0 },
    { id: 2, time: 20, endTime: 40, preset: 'explosion', speed: 1.0 },
    { id: 3, time: 40, endTime: 60, preset: 'chill', speed: 1.0 }
  ]);
  const nextPresetKeyframeId = useRef(4); // Counter for generating unique IDs
  const [presetSettingsExpanded, setPresetSettingsExpanded] = useState(false); // Collapsible settings
  const [presetKeyframesExpanded, setPresetKeyframesExpanded] = useState(true); // Collapsible preset keyframes list
  const [speedKeyframesExpanded, setSpeedKeyframesExpanded] = useState(true); // Collapsible speed keyframes list
  
  // NEW: Speed keyframes for dynamic speed changes within presets
  const [presetSpeedKeyframes, setPresetSpeedKeyframes] = useState<Array<{
    id: number;
    time: number; // time in seconds
    speed: number; // speed multiplier (0.1 to 3.0)
    easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  }>>([
    { id: 1, time: 0, speed: 1.0, easing: 'linear' }
  ]);
  const nextSpeedKeyframeId = useRef(2); // Counter for generating unique IDs
  
  // Legacy sections system (kept for backward compatibility with existing code)
  const [sections, setSections] = useState([
    { id: 1, start: 0, end: 20, animation: 'orbit' },
    { id: 2, start: 20, end: 40, animation: 'explosion' },
    { id: 3, start: 40, end: 60, animation: 'chill' }
  ]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [textKeyframes, setTextKeyframes] = useState<any[]>([]);
  const [workspaceObjects, setWorkspaceObjects] = useState<WorkspaceObject[]>([]);
  
  // Start with null to prevent canvas disappearing on first preset
  // (Previously initialized to 'orbit' which caused incorrect blend resets if first preset wasn't orbital)
  const prevAnimRef = useRef<string | null>(null);
  const transitionRef = useRef(FULL_OPACITY);
  
  // FPS tracking
  const [fps, setFps] = useState<number>(0);
  const fpsFrameCount = useRef(0);
  const fpsLastTime = useRef(0);
  
  // Timeline update throttling (reduce from 60 FPS to 10 FPS for better performance)
  const lastTimelineUpdateRef = useRef<number>(0);
  const TIMELINE_UPDATE_INTERVAL_MS = 100; // 10 FPS (100ms between updates)
  
  // Waveform state
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastWaveformRenderRef = useRef<number>(0);
  const waveformAnimationFrameRef = useRef<number | null>(null);

  // PHASE 5: Text Animator state - NOW WITH DURATION SUPPORT
  const [textAnimatorKeyframes, setTextAnimatorKeyframes] = useState<any[]>([]);
  const [selectedTextKeyframeId, setSelectedTextKeyframeId] = useState<string | null>(null);
  const textCharacterMeshesRef = useRef<Map<string, THREE.Mesh[]>>(new Map()); // keyframeId -> character meshes
  
  // REMOVED: Mask Reveals (orphaned feature)
  
  // PHASE 5: Camera Rig state
  const [cameraRigs, setCameraRigs] = useState<any[]>([]);
  const [cameraRigKeyframes, setCameraRigKeyframes] = useState<any[]>([]);
  const [activeCameraRigIds, setActiveCameraRigIds] = useState<string[]>([]);
  const [selectedRigId, setSelectedRigId] = useState<string | null>(null);
  const cameraRigNullObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map()); // rigId -> null object
  
  // Camera Rig Transitions (UI controls only - transition state for future enhancement)
  const [rigTransitionDuration, setRigTransitionDuration] = useState(1.0); // seconds
  const [rigTransitionEasing, setRigTransitionEasing] = useState<'linear' | 'easeIn' | 'easeOut' | 'easeInOut'>('easeInOut');
  const [enableRigTransitions, setEnableRigTransitions] = useState(true);
  const [enableSmoothTransitions, setEnableSmoothTransitions] = useState(true); // Alias for enableRigTransitions
  
  // Path Visualization
  const [showPaths, setShowPaths] = useState(false);
  const [showKeyframeMarkers, setShowKeyframeMarkers] = useState(false);
  
  // Framing Controls
  const [lookAtOffsetX, setLookAtOffsetX] = useState(0); // -10 to 10
  const [lookAtOffsetY, setLookAtOffsetY] = useState(0); // -10 to 10
  const [enableFramingLock, setEnableFramingLock] = useState(false);
  const [enableRuleOfThirds, setEnableRuleOfThirds] = useState(false);
  const [ruleOfThirdsBias, setRuleOfThirdsBias] = useState(0.3); // 0-1, how strongly to follow rule of thirds
  
  // Camera FX Layer (existing camera shake)
  const [cameraShakeIntensity, setCameraShakeIntensity] = useState(1.0); // multiplier for existing shake
  const [shakeIntensity, setShakeIntensity] = useState(1.0); // Alias for cameraShakeIntensity
  const [cameraShakeFrequency, setCameraShakeFrequency] = useState(50); // Hz
  const [shakeFrequency, setShakeFrequency] = useState(50); // Alias for cameraShakeFrequency
  const [enableHandheldDrift, setEnableHandheldDrift] = useState(false);
  const [handheldDriftIntensity, setHandheldDriftIntensity] = useState(0.2);
  const [enableFovRamping, setEnableFovRamping] = useState(false);
  const [fovRamping, setFovRamping] = useState(false); // Alias for enableFovRamping
  const [fovRampAmount, setFovRampAmount] = useState(5); // degrees
  
  // Camera FX System (Grid Tiling, Kaleidoscope, PIP)
  const [cameraFXClips, setCameraFXClips] = useState<CameraFXClip[]>([]);
  const [selectedFXClipId, setSelectedFXClipId] = useState<string | null>(null);
  const [cameraFXKeyframes, setCameraFXKeyframes] = useState<CameraFXKeyframe[]>([]);
  const [cameraFXAudioModulations, setCameraFXAudioModulations] = useState<CameraFXAudioModulation[]>([]);
  const [showFXOverlays, setShowFXOverlays] = useState(true);
  
  // Shot Presets
  const [selectedShotPreset, setSelectedShotPreset] = useState<string | null>(null);
  
  // PHASE 5: UI state for Phase 5 features
  const [showTextAnimatorPanel, setShowTextAnimatorPanel] = useState(false);
  const [showMaskPanel, setShowMaskPanel] = useState(false);
  const [showCameraRigPanel, setShowCameraRigPanel] = useState(false);

  // PHASE 5: Mask system state
  const [masks, setMasks] = useState<Array<{
    id: string;
    name: string;
    type: 'circle' | 'rectangle' | 'custom';
    enabled: boolean;
  }>>([]);
  const [maskRevealKeyframes, setMaskRevealKeyframes] = useState<Array<{
    id: string;
    time: number;
    maskId: string;
    animation: 'expand-circle' | 'wipe-left' | 'wipe-right' | 'fade';
    duration: number;
  }>>([]);

  // Memoized sorted letterbox keyframes for performance
  const sortedLetterboxKeyframes = useMemo(() => {
    return [...letterboxKeyframes].sort((a, b) => a.time - b.time);
  }, [letterboxKeyframes]);

  const addLog = (message: string, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setErrorLog(prev => [...prev, { message, type, timestamp }].slice(-10));
  };

  // Function to get current project state (used for both manual save and autosave)
  const getCurrentProjectState = (): ProjectState => {
    const projectSettings: ProjectSettings = {
      name: projectName,
      resolution: { width: 960, height: 540 },
      fps: 30,
      backgroundColor: backgroundColor || '#000000',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    return {
      settings: projectSettings,
      sections: [], // Software mode doesn't use sections
      presetKeyframes: presetKeyframes,
      textKeyframes: textKeyframes,
      environmentKeyframes: environmentKeyframes,
      cameraDistance,
      cameraHeight,
      cameraRotation,
      cameraAutoRotate,
      ambientLightIntensity,
      directionalLightIntensity,
      showBorder,
      borderColor,
      showLetterbox,
      letterboxSize,
      bassColor,
      midsColor,
      highsColor,
      showSongName,
      customSongName,
      manualMode: false,
      // Post-FX properties
      blendMode,
      vignetteStrength,
      vignetteSoftness,
      colorSaturation,
      colorContrast,
      colorGamma,
      colorTintR,
      colorTintG,
      colorTintB,
      // Timeline features
      letterboxKeyframes,
      cameraShakes,
      parameterEvents,
      presetSpeedKeyframes,
      textAnimatorKeyframes,
      cameraRigs,
      cameraRigKeyframes,
      particleEmitterKeyframes,
      cameraFXClips,
      cameraFXKeyframes,
      maskRevealKeyframes,
      workspaceObjects,
      // Workspace mode settings
      workspaceMode,
      useWorkspaceObjects,
      // Shape-specific material properties
      cubeWireframe,
      cubeOpacity,
      cubeColor,
      cubeMaterialType,
      cubeMetalness,
      cubeRoughness,
      octahedronWireframe,
      octahedronOpacity,
      octahedronColor,
      octahedronMaterialType,
      octahedronMetalness,
      octahedronRoughness,
      tetrahedronWireframe,
      tetrahedronOpacity,
      tetrahedronColor,
      tetrahedronMaterialType,
      tetrahedronMetalness,
      tetrahedronRoughness,
      sphereWireframe,
      sphereOpacity,
      sphereColor,
      sphereMaterialType,
      sphereMetalness,
      sphereRoughness,
      planeWireframe,
      planeOpacity,
      planeColor,
      planeMaterialType,
      planeMetalness,
      planeRoughness,
      torusWireframe,
      torusOpacity,
      torusColor,
      torusMaterialType,
      torusMetalness,
      torusRoughness,
      // Text properties
      textColor,
      textMaterialType,
      textWireframe,
      textOpacity,
      textMetalness,
      textRoughness,
      // Skybox properties
      skyboxType,
      skyboxGradientTop,
      skyboxGradientBottom,
      skyboxImageUrl,
      starCount,
      galaxyColor,
      nebulaColor1,
      nebulaColor2,
      // Audio gain properties
      bassGain,
      midsGain,
      highsGain,
      // Particle emitter default settings
      particleEmissionRate,
      particleLifetime,
      particleMaxCount,
      particleSpawnX,
      particleSpawnY,
      particleSpawnZ,
      particleSpawnRadius,
      particleStartColor,
      particleEndColor,
      particleStartSize,
      particleEndSize,
      particleAudioTrack,
      particleAudioAffects,
      particleShape
    };
  };

  // Save/Load project functionality (Software mode)
  const handleSaveProject = async () => {
    if (!isDatabaseAvailable()) {
      alert('Database is not configured. Please set VITE_DATABASE_URL in your .env file.');
      addLog('Save failed: Database not configured', 'error');
      return;
    }

    try {
      setIsSaving(true);
      addLog('Saving project...', 'info');

      const projectState = getCurrentProjectState();

      // Save to database
      const userId = user?.id;
      const savedProject = await saveProject(projectState, currentProjectId, userId);
      setCurrentProjectId(savedProject.id);
      
      addLog(`Project "${projectName}" saved successfully with all timeline features`, 'success');
    } catch (error) {
      console.error('Failed to save project:', error);
      addLog('Failed to save project: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      alert('Failed to save project. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadProject = async (projectId: string) => {
    try {
      addLog('Loading project...', 'info');
      
      const userId = user?.id;
      const projectState = await loadProject(projectId, userId);
      
      if (!projectState) {
        addLog('Project not found or you don\'t have permission to access it', 'error');
        alert('Project not found or you don\'t have permission to access it');
        return;
      }

      // Apply loaded state - basic properties
      setProjectName(projectState.settings.name);
      setEnvironmentKeyframes(projectState.environmentKeyframes);
      setPresetKeyframes(projectState.presetKeyframes || []);
      setTextKeyframes(projectState.textKeyframes || []);
      setCameraDistance(projectState.cameraDistance);
      setCameraHeight(projectState.cameraHeight);
      setCameraRotation(projectState.cameraRotation);
      setCameraAutoRotate(projectState.cameraAutoRotate);
      setShowBorder(projectState.showBorder);
      setBorderColor(projectState.borderColor);
      setShowLetterbox(projectState.showLetterbox);
      setLetterboxSize(projectState.letterboxSize);
      setBassColor(projectState.bassColor);
      setMidsColor(projectState.midsColor);
      setHighsColor(projectState.highsColor);
      setShowSongName(projectState.showSongName);
      setCustomSongName(projectState.customSongName);
      setAmbientLightIntensity(projectState.ambientLightIntensity);
      setDirectionalLightIntensity(projectState.directionalLightIntensity);
      
      // Restore Post-FX properties if they exist
      if (projectState.blendMode !== undefined) setBlendMode(projectState.blendMode);
      if (projectState.vignetteStrength !== undefined) setVignetteStrength(projectState.vignetteStrength);
      if (projectState.vignetteSoftness !== undefined) setVignetteSoftness(projectState.vignetteSoftness);
      if (projectState.colorSaturation !== undefined) setColorSaturation(projectState.colorSaturation);
      if (projectState.colorContrast !== undefined) setColorContrast(projectState.colorContrast);
      if (projectState.colorGamma !== undefined) setColorGamma(projectState.colorGamma);
      if (projectState.colorTintR !== undefined) setColorTintR(projectState.colorTintR);
      if (projectState.colorTintG !== undefined) setColorTintG(projectState.colorTintG);
      if (projectState.colorTintB !== undefined) setColorTintB(projectState.colorTintB);
      
      // Restore ALL timeline features
      if (projectState.letterboxKeyframes !== undefined) setLetterboxKeyframes(projectState.letterboxKeyframes);
      if (projectState.cameraShakes !== undefined) setCameraShakes(projectState.cameraShakes);
      if (projectState.parameterEvents !== undefined) setParameterEvents(projectState.parameterEvents);
      if (projectState.presetSpeedKeyframes !== undefined) setPresetSpeedKeyframes(projectState.presetSpeedKeyframes);
      if (projectState.textAnimatorKeyframes !== undefined) setTextAnimatorKeyframes(projectState.textAnimatorKeyframes);
      if (projectState.cameraRigs !== undefined) setCameraRigs(projectState.cameraRigs);
      if (projectState.cameraRigKeyframes !== undefined) setCameraRigKeyframes(projectState.cameraRigKeyframes);
      if (projectState.particleEmitterKeyframes !== undefined) setParticleEmitterKeyframes(projectState.particleEmitterKeyframes);
      if (projectState.cameraFXClips !== undefined) setCameraFXClips(projectState.cameraFXClips);
      if (projectState.cameraFXKeyframes !== undefined) setCameraFXKeyframes(projectState.cameraFXKeyframes);
      if (projectState.maskRevealKeyframes !== undefined) setMaskRevealKeyframes(projectState.maskRevealKeyframes);
      if (projectState.workspaceObjects !== undefined) setWorkspaceObjects(projectState.workspaceObjects);
      
      // Restore workspace mode settings
      if (projectState.workspaceMode !== undefined) setWorkspaceMode(projectState.workspaceMode);
      if (projectState.useWorkspaceObjects !== undefined) setUseWorkspaceObjects(projectState.useWorkspaceObjects);
      
      // Restore shape-specific material properties
      if (projectState.cubeWireframe !== undefined) setCubeWireframe(projectState.cubeWireframe);
      if (projectState.cubeOpacity !== undefined) setCubeOpacity(projectState.cubeOpacity);
      if (projectState.cubeColor !== undefined) setCubeColor(projectState.cubeColor);
      if (projectState.cubeMaterialType !== undefined) setCubeMaterialType(projectState.cubeMaterialType);
      if (projectState.cubeMetalness !== undefined) setCubeMetalness(projectState.cubeMetalness);
      if (projectState.cubeRoughness !== undefined) setCubeRoughness(projectState.cubeRoughness);
      if (projectState.octahedronWireframe !== undefined) setOctahedronWireframe(projectState.octahedronWireframe);
      if (projectState.octahedronOpacity !== undefined) setOctahedronOpacity(projectState.octahedronOpacity);
      if (projectState.octahedronColor !== undefined) setOctahedronColor(projectState.octahedronColor);
      if (projectState.octahedronMaterialType !== undefined) setOctahedronMaterialType(projectState.octahedronMaterialType);
      if (projectState.octahedronMetalness !== undefined) setOctahedronMetalness(projectState.octahedronMetalness);
      if (projectState.octahedronRoughness !== undefined) setOctahedronRoughness(projectState.octahedronRoughness);
      if (projectState.tetrahedronWireframe !== undefined) setTetrahedronWireframe(projectState.tetrahedronWireframe);
      if (projectState.tetrahedronOpacity !== undefined) setTetrahedronOpacity(projectState.tetrahedronOpacity);
      if (projectState.tetrahedronColor !== undefined) setTetrahedronColor(projectState.tetrahedronColor);
      if (projectState.tetrahedronMaterialType !== undefined) setTetrahedronMaterialType(projectState.tetrahedronMaterialType);
      if (projectState.tetrahedronMetalness !== undefined) setTetrahedronMetalness(projectState.tetrahedronMetalness);
      if (projectState.tetrahedronRoughness !== undefined) setTetrahedronRoughness(projectState.tetrahedronRoughness);
      if (projectState.sphereWireframe !== undefined) setSphereWireframe(projectState.sphereWireframe);
      if (projectState.sphereOpacity !== undefined) setSphereOpacity(projectState.sphereOpacity);
      if (projectState.sphereColor !== undefined) setSphereColor(projectState.sphereColor);
      if (projectState.sphereMaterialType !== undefined) setSphereMaterialType(projectState.sphereMaterialType);
      if (projectState.sphereMetalness !== undefined) setSphereMetalness(projectState.sphereMetalness);
      if (projectState.sphereRoughness !== undefined) setSphereRoughness(projectState.sphereRoughness);
      if (projectState.planeWireframe !== undefined) setPlaneWireframe(projectState.planeWireframe);
      if (projectState.planeOpacity !== undefined) setPlaneOpacity(projectState.planeOpacity);
      if (projectState.planeColor !== undefined) setPlaneColor(projectState.planeColor);
      if (projectState.planeMaterialType !== undefined) setPlaneMaterialType(projectState.planeMaterialType);
      if (projectState.planeMetalness !== undefined) setPlaneMetalness(projectState.planeMetalness);
      if (projectState.planeRoughness !== undefined) setPlaneRoughness(projectState.planeRoughness);
      if (projectState.torusWireframe !== undefined) setTorusWireframe(projectState.torusWireframe);
      if (projectState.torusOpacity !== undefined) setTorusOpacity(projectState.torusOpacity);
      if (projectState.torusColor !== undefined) setTorusColor(projectState.torusColor);
      if (projectState.torusMaterialType !== undefined) setTorusMaterialType(projectState.torusMaterialType);
      if (projectState.torusMetalness !== undefined) setTorusMetalness(projectState.torusMetalness);
      if (projectState.torusRoughness !== undefined) setTorusRoughness(projectState.torusRoughness);
      
      // Restore text properties
      if (projectState.textColor !== undefined) setTextColor(projectState.textColor);
      if (projectState.textMaterialType !== undefined) setTextMaterialType(projectState.textMaterialType);
      if (projectState.textWireframe !== undefined) setTextWireframe(projectState.textWireframe);
      if (projectState.textOpacity !== undefined) setTextOpacity(projectState.textOpacity);
      if (projectState.textMetalness !== undefined) setTextMetalness(projectState.textMetalness);
      if (projectState.textRoughness !== undefined) setTextRoughness(projectState.textRoughness);
      
      // Restore skybox properties
      if (projectState.skyboxType !== undefined) setSkyboxType(projectState.skyboxType);
      if (projectState.skyboxGradientTop !== undefined) setSkyboxGradientTop(projectState.skyboxGradientTop);
      if (projectState.skyboxGradientBottom !== undefined) setSkyboxGradientBottom(projectState.skyboxGradientBottom);
      if (projectState.skyboxImageUrl !== undefined) setSkyboxImageUrl(projectState.skyboxImageUrl);
      if (projectState.starCount !== undefined) setStarCount(projectState.starCount);
      if (projectState.galaxyColor !== undefined) setGalaxyColor(projectState.galaxyColor);
      if (projectState.nebulaColor1 !== undefined) setNebulaColor1(projectState.nebulaColor1);
      if (projectState.nebulaColor2 !== undefined) setNebulaColor2(projectState.nebulaColor2);
      
      // Restore audio gain properties
      if (projectState.bassGain !== undefined) setBassGain(projectState.bassGain);
      if (projectState.midsGain !== undefined) setMidsGain(projectState.midsGain);
      if (projectState.highsGain !== undefined) setHighsGain(projectState.highsGain);
      
      // Restore particle emitter default settings
      if (projectState.particleEmissionRate !== undefined) setParticleEmissionRate(projectState.particleEmissionRate);
      if (projectState.particleLifetime !== undefined) setParticleLifetime(projectState.particleLifetime);
      if (projectState.particleMaxCount !== undefined) setParticleMaxCount(projectState.particleMaxCount);
      if (projectState.particleSpawnX !== undefined) setParticleSpawnX(projectState.particleSpawnX);
      if (projectState.particleSpawnY !== undefined) setParticleSpawnY(projectState.particleSpawnY);
      if (projectState.particleSpawnZ !== undefined) setParticleSpawnZ(projectState.particleSpawnZ);
      if (projectState.particleSpawnRadius !== undefined) setParticleSpawnRadius(projectState.particleSpawnRadius);
      if (projectState.particleStartColor !== undefined) setParticleStartColor(projectState.particleStartColor);
      if (projectState.particleEndColor !== undefined) setParticleEndColor(projectState.particleEndColor);
      if (projectState.particleStartSize !== undefined) setParticleStartSize(projectState.particleStartSize);
      if (projectState.particleEndSize !== undefined) setParticleEndSize(projectState.particleEndSize);
      if (projectState.particleAudioTrack !== undefined) setParticleAudioTrack(projectState.particleAudioTrack);
      if (projectState.particleAudioAffects !== undefined) setParticleAudioAffects(projectState.particleAudioAffects);
      if (projectState.particleShape !== undefined) setParticleShape(projectState.particleShape);
      
      setCurrentProjectId(projectId);
      setShowProjectsModal(false);
      addLog(`Project "${projectState.settings.name}" loaded successfully with all timeline features`, 'success');
    } catch (error) {
      console.error('Failed to load project:', error);
      addLog('Failed to load project: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
      alert('Failed to load project. Check console for details.');
    }
  };

  const handleNewProject = () => {
    // Show the New Project modal
    setShowNewProjectModal(true);
  };

  const handleCreateNewProject = (settings: ProjectSettings, audioFile?: File) => {
    try {
      addLog('Creating new project...', 'info');
      
      // Stop playback
      if (isPlaying) {
        if (audioTracks.length > 0) stopMultiTrackAudio();
        else stopAudio();
      }
      
      // Set project name from settings
      setProjectName(settings.name);
      setCurrentProjectId(undefined);
      
      // Reset camera settings
      setCameraDistance(DEFAULT_CAMERA_DISTANCE);
      setCameraHeight(DEFAULT_CAMERA_HEIGHT);
      setCameraRotation(DEFAULT_CAMERA_ROTATION);
      setCameraAutoRotate(false);
      
      // Reset colors
      setBassColor('#8a2be2');
      setMidsColor('#40e0d0');
      setHighsColor('#c8b4ff');
      
      // Reset visual settings
      setShowBorder(true);
      setBorderColor('#9333ea');
      setShowLetterbox(false);
      setLetterboxSize(0);
      setShowSongName(false);
      setCustomSongName('');
      setBackgroundColor(settings.backgroundColor || '#0a0a14');
      
      // Reset lighting
      setAmbientLightIntensity(0.5);
      setDirectionalLightIntensity(0.5);
      
      // Reset Post-FX
      setBlendMode('normal');
      setVignetteStrength(0);
      setVignetteSoftness(0.5);
      setColorSaturation(1.0);
      setColorContrast(1.0);
      setColorGamma(1.0);
      setColorTintR(1.0);
      setColorTintG(1.0);
      setColorTintB(1.0);
      
      // Reset keyframes and events
      setEnvironmentKeyframes([]);
      setPresetKeyframes([]);
      setLetterboxKeyframes([]);
      setCameraShakes([]);
      setParameterEvents([]);
      
      // Reset audio (clear all tracks)
      setAudioTracks([]);
      audioTracksRef.current = [];
      setAudioReady(false);
      setAudioFileName('');
      setCurrentTime(0);
      setDuration(0);
      
      // Load audio file if provided
      if (audioFile) {
        addAudioTrack(audioFile);
      }
      
      // Close the modal
      setShowNewProjectModal(false);
      
      addLog('New project created successfully', 'success');
    } catch (error) {
      console.error('Failed to create new project:', error);
      addLog('Failed to create new project: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seekPosition = (x / rect.width) * duration;
    if (audioTracks.length > 0) {
      seekMultiTrack(seekPosition);
    } else {
      seekTo(seekPosition);
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setAudioFileName(f.name.replace(/\.[^/.]+$/, ''));
      // Use multi-track system for all audio loading
      addAudioTrack(f);
    }
  };

  const handleExportAndCloseModal = () => {
    exportVideo();
    setShowExportModal(false);
  };

  const loadCustomFont = async (file: File) => {
    try {
      addLog(`Loading custom font: ${file.name}`, 'info');
      const text = await file.text();
      const fontData = JSON.parse(text);
      const loader = new FontLoader();
      const font = loader.parse(fontData);
      fontRef.current = font;
      setFontLoaded(true);
      setCustomFontName(file.name);
      addLog(`Custom font "${file.name}" loaded successfully!`, 'success');
    } catch (e) {
      const error = e as Error;
      addLog(`Custom font load error: ${error.message}`, 'error');
      console.error('Font load error:', e);
    }
  };

  useEffect(() => {
    addLog('Starting font load...', 'info');
    const loader = new FontLoader();
    loader.load(
      'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
      (font: any) => {
        console.log('Font loaded successfully!');
        addLog('Font loaded successfully!', 'success');
        fontRef.current = font;
        setFontLoaded(true);
      },
      (progress: any) => {
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          console.log('Font loading progress:', percent + '%');
          addLog(`Font loading: ${percent}%`, 'info');
        }
      },
      (error: Error) => {
        console.error('Font loading error:', error);
        addLog(`Font load failed - upload custom font instead`, 'error');
      }
    );
    // Skip automatic font loading to avoid CORS errors
    // Users can upload their own .typeface.json font file
    addLog('Font system ready - upload custom font to use text', 'info');
    setCustomFontName('None (Upload Required)');
  }, []);

  // Load project from sessionStorage on mount
  useEffect(() => {
    const loadInitialProject = async () => {
      const projectId = sessionStorage.getItem('currentProjectId');
      if (projectId && isDatabaseAvailable()) {
        // Clear the sessionStorage to prevent loading on every refresh
        sessionStorage.removeItem('currentProjectId');
        
        try {
          // Load the project
          await handleLoadProject(projectId);
        } catch (error) {
          console.error('Failed to load project on mount:', error);
          addLog('Failed to load project automatically. Please try opening it again.', 'error');
        }
      }
    };
    
    loadInitialProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  const toggleSongName = () => {
    const scene = sceneRef.current;
    if (!scene) {
      addLog('Scene not ready!', 'error');
      return;
    }

    if (showSongName) {
      songNameMeshesRef.current.forEach(mesh => {
        scene.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
      songNameMeshesRef.current = [];
      setShowSongName(false);
      addLog('Song name hidden', 'info');
    } else {
      if (!fontRef.current) {
        alert('Font not loaded yet, please wait...');
        addLog('Font not ready yet!', 'error');
        return;
      }

      try {
        const text = customSongName || audioFileName || 'SONG NAME';
        addLog(`Creating 3D text: "${text}"`, 'info');
        const words = text.toUpperCase().split(' ');
        const meshes: THREE.Mesh[] = [];

        words.forEach((word, wordIndex) => {
          [...word].forEach((char, charIndex) => {
            const textGeo = new TextGeometry(char, {
              font: fontRef.current,
              size: 1.5,
              height: 0.3,
              curveSegments: 8
            });
            
            textGeo.computeBoundingBox();
            
            const freqIndex = (wordIndex + charIndex) % 3;
            
            // Create material based on selected type
            let material: THREE.Material;
            const baseColor = new THREE.Color(textColor);
            const commonProps = {
              color: baseColor,
              wireframe: textWireframe,
              transparent: true,
              opacity: textOpacity
            };
            
            switch (textMaterialType) {
              case 'standard':
                material = new THREE.MeshStandardMaterial({
                  ...commonProps,
                  metalness: textMetalness,
                  roughness: textRoughness
                });
                break;
              case 'phong':
                material = new THREE.MeshPhongMaterial({
                  ...commonProps,
                  shininess: 30
                });
                break;
              case 'lambert':
                material = new THREE.MeshLambertMaterial(commonProps);
                break;
              case 'basic':
              default:
                material = new THREE.MeshBasicMaterial(commonProps);
            }
            
            const mesh = new THREE.Mesh(textGeo, material);
            
            const xPos = (charIndex - word.length / 2) * 2 + (wordIndex - words.length / 2) * (word.length * 2 + 3);
            mesh.position.set(xPos, -6, 5);
            mesh.userData.baseY = -6;
            mesh.userData.baseX = xPos;
            mesh.userData.baseZ = 5;
            mesh.userData.isText = true;
            mesh.userData.charIndex = charIndex + wordIndex * 10;
            mesh.userData.freqIndex = freqIndex;
            
            mesh.scale.set(2, 2, 2);
            
            scene.add(mesh);
            meshes.push(mesh);
            console.log('Added mesh at position:', mesh.position, 'Scene children:', scene.children.length);
          });
        });
        
        songNameMeshesRef.current = meshes;
        setShowSongName(true);
        addLog(`Created ${meshes.length} text meshes at visible position`, 'success');
        console.log('All song name meshes:', scene.children.filter((c: THREE.Object3D) => c.userData.isText));
      } catch (e) {
        const error = e as Error;
        addLog(`Text creation error: ${error.message}`, 'error');
      }
    }
  };

  const getCurrentSection = () => sections.find(s => currentTime >= s.start && currentTime < s.end);
  
  // Get current preset from keyframes (finds active preset segment at current time)
  const getCurrentPreset = () => {
    const sorted = [...presetKeyframes].sort((a, b) => a.time - b.time);
    // Find the preset segment that contains current time
    for (let i = 0; i < sorted.length; i++) {
      if (currentTime >= sorted[i].time && currentTime < sorted[i].endTime) {
        return sorted[i].preset;
      }
    }
    // If after all segments or before first, use the first or last preset
    if (currentTime < sorted[0]?.time) {
      return sorted[0]?.preset || 'orbit';
    }
    // After all segments, use the last preset
    return sorted[sorted.length - 1]?.preset || 'orbit';
  };
  
  // Get current preset speed multiplier with keyframe interpolation
  const getCurrentPresetSpeed = () => {
    // Sort speed keyframes by time
    const sorted = [...presetSpeedKeyframes].sort((a, b) => a.time - b.time);
    
    // If no keyframes or before first keyframe, return first keyframe speed or default
    if (sorted.length === 0) return 1.0;
    if (currentTime <= sorted[0].time) return sorted[0].speed;
    
    // If after last keyframe, return last keyframe speed
    if (currentTime >= sorted[sorted.length - 1].time) {
      return sorted[sorted.length - 1].speed;
    }
    
    // Find the two keyframes we're between
    for (let i = 0; i < sorted.length - 1; i++) {
      const kf1 = sorted[i];
      const kf2 = sorted[i + 1];
      
      if (currentTime >= kf1.time && currentTime < kf2.time) {
        // Interpolate between the two keyframes
        const t = (currentTime - kf1.time) / (kf2.time - kf1.time);
        const easedT = applyEasing(t, kf1.easing);
        return kf1.speed + (kf2.speed - kf1.speed) * easedT;
      }
    }
    
    // Fallback to last keyframe speed
    return sorted[sorted.length - 1].speed;
  };

  const addSection = () => {
    const last = sections[sections.length-1];
    const startTime = last ? last.end : 0;
    const endTime = startTime + 20;
    setSections([...sections, {
      id: Date.now(), 
      start: startTime, 
      end: endTime, 
      animation: 'orbit'
    }]);
  };

  const deleteSection = (id: number) => setSections(sections.filter(s => s.id !== id));
  const updateSection = (id: number, f: string, v: any) => setSections(sections.map(s => s.id===id ? {...s,[f]:v} : s));
  
  // Section handlers for Timeline
  const handleSelectSection = (id: number) => setSelectedSectionId(id);
  const handleUpdateSection = (id: number, field: string, value: any) => updateSection(id, field, value);
  const handleAddSection = () => {
    const lastSection = sections[sections.length - 1];
    const newId = Math.max(...sections.map(s => s.id), 0) + 1;
    setSections([...sections, {
      id: newId,
      start: lastSection ? lastSection.end : 0,
      end: lastSection ? lastSection.end + 20 : 20,
      animation: 'orbit'
    }]);
  };
  
  // Wrapper functions for Timeline keyframe handlers
  const addPresetKeyframe = (time?: number) => {
    if (time !== undefined) {
      const sorted = [...presetKeyframes].sort((a, b) => a.time - b.time);
      const nextKeyframe = sorted.find(kf => kf.time > time);
      const defaultEndTime = nextKeyframe ? nextKeyframe.time : time + 20;
      
      const newKeyframe = {
        id: nextPresetKeyframeId.current++,
        time: time,
        endTime: Math.max(time + 1, Math.min(defaultEndTime, duration || time + 20)),
        preset: 'orbit',
        speed: 1.0
      };
      setPresetKeyframes([...presetKeyframes, newKeyframe].sort((a, b) => a.time - b.time));
    } else {
      handleAddPresetKeyframe();
    }
  };
  const deletePresetKeyframe = (id: number) => handleDeletePresetKeyframe(id);
  const updatePresetKeyframe = (id: number, preset: string) => handleUpdatePresetKeyframe(id, 'preset', preset);
  const movePresetKeyframe = (id: number, newTime: number) => handleUpdatePresetKeyframe(id, 'time', newTime);
  
  // REMOVED: Camera keyframe handlers (orphaned global camera feature)
  
  const addTextKeyframe = (time?: number) => {
    const useTime = time !== undefined ? time : currentTime;
    const newKeyframe = {
      id: Date.now(),
      time: useTime,
      show: true,
      text: 'Sample Text'
    };
    setTextKeyframes([...textKeyframes, newKeyframe].sort((a, b) => a.time - b.time));
  };
  const deleteTextKeyframe = (id: number) => {
    setTextKeyframes(textKeyframes.filter(kf => kf.id !== id));
  };
  const updateTextKeyframe = (id: number, show: boolean, text?: string) => {
    setTextKeyframes(textKeyframes.map(kf =>
      kf.id === id ? { ...kf, show, ...(text !== undefined && { text }) } : kf
    ));
  };
  const moveTextKeyframe = (id: number, newTime: number) => {
    setTextKeyframes(textKeyframes.map(kf =>
      kf.id === id ? { ...kf, time: newTime } : kf
    ).sort((a, b) => a.time - b.time));
  };
  
  const addEnvironmentKeyframe = (time?: number) => {
    const useTime = time !== undefined ? time : currentTime;
    handleAddEnvironmentKeyframe();
    // Update the last added keyframe's time
    if (time !== undefined) {
      setEnvironmentKeyframes(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].time = useTime;
        }
        return updated.sort((a, b) => a.time - b.time);
      });
    }
  };
  const deleteEnvironmentKeyframe = (id: number) => handleDeleteEnvironmentKeyframe(id);
  const updateEnvironmentKeyframe = (id: number, type: string, intensity: number, color?: string) =>
    handleUpdateEnvironmentKeyframe(id, type, intensity, color);
  const moveEnvironmentKeyframe = (id: number, newTime: number) => {
    setEnvironmentKeyframes(environmentKeyframes.map(kf =>
      kf.id === id ? { ...kf, time: newTime } : kf
    ).sort((a, b) => a.time - b.time));
  };
  
  // Preset keyframe handlers
  const handleAddPresetKeyframe = () => {
    // Find a good default end time: either 20 seconds from current time, or until next keyframe
    const sorted = [...presetKeyframes].sort((a, b) => a.time - b.time);
    const nextKeyframe = sorted.find(kf => kf.time > currentTime);
    const defaultEndTime = nextKeyframe ? nextKeyframe.time : currentTime + 20;
    
    const newKeyframe = {
      id: nextPresetKeyframeId.current++,
      time: currentTime,
      endTime: Math.max(currentTime + 1, Math.min(defaultEndTime, duration || currentTime + 20)), // At least 1 second duration
      preset: 'orbit', // Default preset
      speed: 1.0 // Default speed
    };
    setPresetKeyframes([...presetKeyframes, newKeyframe].sort((a, b) => a.time - b.time));
  };
  
  const handleDeletePresetKeyframe = (id: number) => {
    // Keep at least one keyframe
    if (presetKeyframes.length > 1) {
      setPresetKeyframes(presetKeyframes.filter(kf => kf.id !== id));
    }
  };
  
  const handleUpdatePresetKeyframe = (id: number, field: string, value: any) => {
    setPresetKeyframes(presetKeyframes.map(kf => {
      if (kf.id === id) {
        const updated = { ...kf, [field]: value };
        // When moving the start time, maintain the segment duration
        if (field === 'time') {
          const originalDuration = kf.endTime - kf.time;
          updated.endTime = value + originalDuration;
        }
        // Ensure endTime is always after time
        if (updated.endTime <= updated.time) {
          updated.endTime = updated.time + 1;
        }
        return updated;
      }
      return kf;
    }).sort((a, b) => a.time - b.time)); // Re-sort after time update
  };
  
  // Speed keyframe handlers
  const handleAddSpeedKeyframe = () => {
    // Calculate current speed from existing keyframes to use as default
    const sorted = [...presetSpeedKeyframes].sort((a, b) => a.time - b.time);
    let defaultSpeed = 1.0;
    
    if (sorted.length > 0) {
      if (currentTime <= sorted[0].time) {
        defaultSpeed = sorted[0].speed;
      } else if (currentTime >= sorted[sorted.length - 1].time) {
        defaultSpeed = sorted[sorted.length - 1].speed;
      } else {
        // Find interpolated speed at current time
        for (let i = 0; i < sorted.length - 1; i++) {
          const kf1 = sorted[i];
          const kf2 = sorted[i + 1];
          if (currentTime >= kf1.time && currentTime < kf2.time) {
            const t = (currentTime - kf1.time) / (kf2.time - kf1.time);
            const easedT = applyEasing(t, kf1.easing);
            defaultSpeed = kf1.speed + (kf2.speed - kf1.speed) * easedT;
            break;
          }
        }
      }
    }
    
    const newKeyframe = {
      id: nextSpeedKeyframeId.current++,
      time: currentTime,
      speed: defaultSpeed,
      easing: 'linear' as const
    };
    setPresetSpeedKeyframes([...presetSpeedKeyframes, newKeyframe].sort((a, b) => a.time - b.time));
  };
  
  const handleDeleteSpeedKeyframe = (id: number) => {
    // Keep at least one keyframe
    if (presetSpeedKeyframes.length > 1) {
      setPresetSpeedKeyframes(presetSpeedKeyframes.filter(kf => kf.id !== id));
    }
  };
  
  const handleUpdateSpeedKeyframe = (id: number, field: 'time' | 'speed' | 'easing', value: number | string) => {
    setPresetSpeedKeyframes(presetSpeedKeyframes.map(kf => {
      if (kf.id === id) {
        // Validate speed values to ensure they stay within valid range
        if (field === 'speed') {
          const speedValue = typeof value === 'number' ? value : parseFloat(value);
          const clampedSpeed = Math.max(0.1, Math.min(3.0, isNaN(speedValue) ? kf.speed : speedValue));
          return { ...kf, [field]: clampedSpeed };
        }
        return { ...kf, [field]: value };
      }
      return kf;
    }).sort((a, b) => a.time - b.time)); // Re-sort after time update
  };
  
  // Move handlers for all keyframe types (for timeline dragging)
  const moveSpeedKeyframe = (id: number, newTime: number) => {
    handleUpdateSpeedKeyframe(id, 'time', newTime);
  };
  
  const moveLetterboxKeyframe = (id: number, newTime: number) => {
    setLetterboxKeyframes(letterboxKeyframes.map(kf =>
      kf.id === id ? { ...kf, time: newTime } : kf
    ).sort((a, b) => a.time - b.time));
  };
  
  // Update handler for letterbox keyframe fields (including duration)
  const updateLetterboxKeyframe = (id: number, field: string, value: any) => {
    setLetterboxKeyframes(letterboxKeyframes.map(kf =>
      kf.id === id ? { ...kf, [field]: value } : kf
    ).sort((a, b) => a.time - b.time));
  };
  
  const moveTextAnimatorKeyframe = (id: string, newTime: number) => {
    setTextAnimatorKeyframes(textAnimatorKeyframes.map(kf =>
      kf.id === id ? { ...kf, time: newTime } : kf
    ).sort((a, b) => a.time - b.time));
  };
  
  // Update handler for text animator fields - supports both field-based and object-based updates
  const updateTextAnimatorKeyframe = (id: string, fieldOrUpdate: string | Partial<TextAnimatorKeyframe>, value?: any) => {
    setTextAnimatorKeyframes(textAnimatorKeyframes.map(kf => {
      if (kf.id !== id) return kf;
      
      // If fieldOrUpdate is a string, it's the old field-based API
      if (typeof fieldOrUpdate === 'string') {
        return { ...kf, [fieldOrUpdate]: value };
      }
      
      // Otherwise it's the new object-based API
      return { ...kf, ...fieldOrUpdate };
    }).sort((a, b) => a.time - b.time));
  };
  
  // REMOVED: Mask reveal handler (orphaned feature)
  
  const moveCameraRigKeyframe = (id: string, newTime: number) => {
    setCameraRigKeyframes(cameraRigKeyframes.map(kf =>
      kf.id === id ? { ...kf, time: newTime } : kf
    ).sort((a, b) => a.time - b.time));
  };
  
  // Move a Camera Rig (preserves duration)
  const moveCameraRig = (id: string, newStartTime: number, newEndTime: number) => {
    setCameraRigs(prev => prev.map(rig =>
      rig.id === id ? { ...rig, startTime: newStartTime, endTime: newEndTime } : rig
    ));
    addLog(`Moved camera rig to ${newStartTime.toFixed(2)}s - ${newEndTime.toFixed(2)}s`, 'info');
  };
  
  const updateCameraRigKeyframeField = (id: string, field: string, value: any) => {
    setCameraRigKeyframes(cameraRigKeyframes.map(kf =>
      kf.id === id ? { ...kf, [field]: value } : kf
    ));
  };
  
  const moveCameraFXKeyframe = (id: string, newTime: number) => {
    setCameraFXKeyframes(cameraFXKeyframes.map(kf =>
      kf.id === id ? { ...kf, time: newTime } : kf
    ).sort((a, b) => a.time - b.time));
  };
  
  const moveParticleEmitterKeyframe = (id: number, newTime: number) => {
    setParticleEmitterKeyframes(particleEmitterKeyframes.map(kf =>
      kf.id === id ? { ...kf, time: newTime } : kf
    ).sort((a, b) => a.time - b.time));
  };
  
  const moveParameterEvent = (id: string, newTime: number) => {
    // Note: ParameterEvent uses 'startTime' field, not 'time'
    setParameterEvents(parameterEvents.map(event =>
      event.id === id ? { ...event, startTime: newTime } : event
    ).sort((a, b) => a.startTime - b.startTime));
  };

  const resetCamera = () => {
    setCameraDistance(DEFAULT_CAMERA_DISTANCE);
    setCameraHeight(DEFAULT_CAMERA_HEIGHT);
    // Rotation is now keyframe-only, don't reset it here
  };

  // REMOVED: Global keyframe management (orphaned camera feature)

  // Camera shake event management
  const addCameraShake = () => {
    const newTime = currentTime > 0 ? currentTime : 0;
    setCameraShakes([...cameraShakes, { time: newTime, intensity: 5, duration: 0.2 }].sort((a, b) => a.time - b.time));
  };

  const deleteCameraShake = (index) => {
    setCameraShakes(cameraShakes.filter((_, i) => i !== index));
  };

  const updateCameraShake = (index, field, value) => {
    setCameraShakes(cameraShakes.map((shake, i) => 
      i === index ? { ...shake, [field]: value } : shake
    ));
  };

  // Particle emitter keyframe management
  const addParticleEmitterKeyframe = () => {
    const newKeyframe = {
      id: nextParticleEmitterKeyframeId.current++,
      time: currentTime > 0 ? currentTime : 0,
      duration: 5.0, // 5 second default duration
      emissionRate: particleEmissionRate,
      lifetime: particleLifetime,
      maxParticles: particleMaxCount,
      spawnX: particleSpawnX,
      spawnY: particleSpawnY,
      spawnZ: particleSpawnZ,
      spawnRadius: particleSpawnRadius,
      startColor: particleStartColor,
      endColor: particleEndColor,
      startSize: particleStartSize,
      endSize: particleEndSize,
      audioTrack: particleAudioTrack,
      shape: particleShape,
      enabled: true
    };
    setParticleEmitterKeyframes([...particleEmitterKeyframes, newKeyframe].sort((a, b) => a.time - b.time));
  };

  const deleteParticleEmitterKeyframe = (id: number) => {
    setParticleEmitterKeyframes(particleEmitterKeyframes.filter(kf => kf.id !== id));
  };

  const updateParticleEmitterKeyframe = (id: number, field: string, value: any) => {
    setParticleEmitterKeyframes(particleEmitterKeyframes.map(kf => 
      kf.id === id ? { ...kf, [field]: value } : kf
    ));
  };

  const initAudio = async (file) => {
    try {
      addLog(`Loading audio: ${file.name}`, 'info');
      if (audioContextRef.current) audioContextRef.current.close();
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      const buf = await ctx.decodeAudioData(await file.arrayBuffer());
      audioBufferRef.current = buf;
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      setDuration(buf.duration);
      setAudioReady(true);
      
      // Generate waveform data
      const waveform = generateWaveformData(buf);
      setWaveformData(waveform);
      
      addLog('Audio loaded successfully!', 'success');
    } catch (e) { 
      console.error(e);
      const error = e as Error;
      addLog(`Audio load error: ${error.message}`, 'error');
    }
  };

  const playAudio = () => {
    if (!audioContextRef.current || !audioBufferRef.current || !analyserRef.current) return;
    if (bufferSourceRef.current) bufferSourceRef.current.stop();
    const src = audioContextRef.current.createBufferSource();
    src.buffer = audioBufferRef.current;
    src.connect(analyserRef.current);
    analyserRef.current.connect(audioContextRef.current.destination);
    
    // Add onended handler to stop playback when audio finishes
    src.onended = () => {
      if (bufferSourceRef.current === src) {
        bufferSourceRef.current = null;
        pauseTimeRef.current = 0; // Reset to beginning
        setCurrentTime(0);
        setIsPlaying(false);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      }
    };
    
    src.start(0, pauseTimeRef.current);
    bufferSourceRef.current = src;
    startTimeRef.current = Date.now() - (pauseTimeRef.current * 1000);
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (bufferSourceRef.current) {
      pauseTimeRef.current = currentTime;
      bufferSourceRef.current.stop();
      bufferSourceRef.current = null;
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsPlaying(false);
  };

  const seekTo = (t: number) => {
    const play = isPlaying;
    if (play) stopAudio();
    pauseTimeRef.current = t;
    setCurrentTime(t);
    if (play) playAudio();
  };

  // PHASE 4: Multi-track audio functions
  const addAudioTrack = async (file: File) => {
    try {
      addLog(`Loading audio track: ${file.name}`, 'info');
      
      // Initialize AudioContext if not exists
      if (!audioContextRef.current) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;
      }
      
      const ctx = audioContextRef.current;
      const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
      
      // Create audio nodes for this track
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0; // Default volume at 100%
      
      const trackId = `track-${Date.now()}-${Math.random()}`;
      const newTrack: AudioTrack = {
        id: trackId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        buffer: buffer,
        source: null,
        analyser: analyser,
        gainNode: gainNode,
        volume: 1.0,
        muted: false,
        active: audioTracks.length === 0 // First track is active by default
      };
      
      const updatedTracks = [...audioTracks, newTrack];
      setAudioTracks(updatedTracks);
      audioTracksRef.current = updatedTracks;
      
      // Set duration from the first track or the longest track
      if (audioTracks.length === 0) {
        setDuration(buffer.duration);
        setAudioReady(true);
        // For backward compatibility, set the first track to the old refs
        audioBufferRef.current = buffer;
        analyserRef.current = analyser;
        // Generate waveform data for the main waveform display
        const waveform = generateWaveformData(buffer);
        setWaveformData(waveform);
      } else {
        setDuration(Math.max(duration, buffer.duration));
      }
      
      addLog(`Track "${newTrack.name}" loaded successfully!`, 'success');
    } catch (e) {
      console.error(e);
      const error = e as Error;
      addLog(`Track load error: ${error.message}`, 'error');
    }
  };

  const removeAudioTrack = (trackId: string) => {
    const track = audioTracks.find(t => t.id === trackId);
    if (track?.source) {
      track.source.stop();
      track.source.disconnect();
    }
    
    let updatedTracks = audioTracks.filter(t => t.id !== trackId);
    
    // If we removed the active track, make the first remaining track active
    if (track?.active && updatedTracks.length > 0) {
      updatedTracks = updatedTracks.map((t, i) => ({
        ...t,
        active: i === 0
      }));
    }
    
    setAudioTracks(updatedTracks);
    audioTracksRef.current = updatedTracks;
    
    // Update refs for backward compatibility
    if (updatedTracks.length > 0) {
      const activeTrack = updatedTracks.find(t => t.active) || updatedTracks[0];
      audioBufferRef.current = activeTrack.buffer;
      analyserRef.current = activeTrack.analyser;
    } else {
      audioBufferRef.current = null;
      analyserRef.current = null;
      setAudioReady(false);
    }
    
    addLog(`Track removed`, 'info');
  };

  const updateTrackVolume = (trackId: string, volume: number) => {
    const updatedTracks = audioTracks.map(track => {
      if (track.id === trackId) {
        track.gainNode.gain.value = track.muted ? 0 : volume;
        return { ...track, volume };
      }
      return track;
    });
    setAudioTracks(updatedTracks);
    audioTracksRef.current = updatedTracks;
  };

  const toggleTrackMute = (trackId: string) => {
    const updatedTracks = audioTracks.map(track => {
      if (track.id === trackId) {
        const newMuted = !track.muted;
        track.gainNode.gain.value = newMuted ? 0 : track.volume;
        return { ...track, muted: newMuted };
      }
      return track;
    });
    setAudioTracks(updatedTracks);
    audioTracksRef.current = updatedTracks;
  };

  const setActiveTrack = (trackId: string) => {
    const updatedTracks = audioTracks.map(track => ({
      ...track,
      active: track.id === trackId
    }));
    setAudioTracks(updatedTracks);
    audioTracksRef.current = updatedTracks;
    
    // Update refs for visualization
    const activeTrack = updatedTracks.find(t => t.active);
    if (activeTrack) {
      analyserRef.current = activeTrack.analyser;
      audioBufferRef.current = activeTrack.buffer;
    }
  };

  const playMultiTrackAudio = () => {
    if (!audioContextRef.current) return;
    
    // Use ref to get current tracks
    const tracks = audioTracksRef.current;
    if (tracks.length === 0) return;
    
    const ctx = audioContextRef.current;
    const startOffset = pauseTimeRef.current;
    
    // Track which sources have ended using a Set to avoid race conditions
    const endedSources = new Set<AudioBufferSourceNode>();
    const totalTracks = tracks.filter(t => t.buffer).length;
    
    // Start all tracks synchronized
    tracks.forEach(track => {
      if (!track.buffer) return;
      
      // Stop existing source if any to prevent duplicates
      if (track.source) {
        try {
          track.source.stop();
          track.source.disconnect();
        } catch (e) {
          // Ignore errors from already stopped sources
        }
        track.source = null;
      }
      
      // Create new source
      const source = ctx.createBufferSource();
      source.buffer = track.buffer;
      
      // Connect: source -> gain -> analyser -> destination
      source.connect(track.gainNode);
      track.gainNode.connect(track.analyser);
      track.analyser.connect(ctx.destination);
      
      // Set gain based on mute state
      track.gainNode.gain.value = track.muted ? 0 : track.volume;
      
      // Add onended handler - stop playback when all tracks finish
      source.onended = () => {
        endedSources.add(source);
        // When all tracks have ended, stop playback
        if (endedSources.size >= totalTracks) {
          pauseTimeRef.current = 0; // Reset to beginning
          setCurrentTime(0);
          setIsPlaying(false);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
          }
        }
      };
      
      // Start playback
      source.start(0, startOffset);
      track.source = source;
    });
    
    startTimeRef.current = Date.now() - (startOffset * 1000);
    setIsPlaying(true);
  };

  const stopMultiTrackAudio = () => {
    // Use ref to get current tracks with their sources
    const tracks = audioTracksRef.current;
    tracks.forEach(track => {
      if (track.source) {
        try {
          track.source.stop();
          track.source.disconnect();
        } catch (e) {
          // Ignore errors from already stopped sources
        }
        track.source = null;
      }
    });
    
    pauseTimeRef.current = currentTime;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsPlaying(false);
  };

  const seekMultiTrack = (t: number) => {
    // Save playing state before stopping
    const wasPlaying = isPlaying;
    
    // Stop all tracks to prevent duplicates
    if (wasPlaying) {
      stopMultiTrackAudio();
    }
    
    // Set new position
    pauseTimeRef.current = t;
    setCurrentTime(t);
    
    // Restart if it was playing
    if (wasPlaying) {
      // Need to use a microtask to ensure state updates have propagated
      Promise.resolve().then(() => {
        playMultiTrackAudio();
      });
    }
  };

  // PHASE 4: Parameter event functions
  const addParameterEvent = () => {
    const start = currentTime > 0 ? currentTime : 0;
    const newEvent: ParameterEvent = {
      id: `event-${Date.now()}-${Math.random()}`,
      startTime: start,
      endTime: start + 0.2, // Default 200ms duration
      mode: 'manual', // Default to manual mode
      audioTrackId: audioTracks.length > 0 ? audioTracks.find(t => t.active)?.id : undefined,
      threshold: 0.5, // Default threshold for automated mode
      parameters: {
        backgroundFlash: 0.5,
        cameraShake: 0,
        vignettePulse: 0,
        saturationBurst: 0
      }
    };
    setParameterEvents([...parameterEvents, newEvent].sort((a, b) => a.startTime - b.startTime));
    setEditingEventId(newEvent.id);
    setShowEventModal(true);
  };

  const updateParameterEvent = (eventId: string, updates: Partial<ParameterEvent>) => {
    setParameterEvents(parameterEvents.map(event => 
      event.id === eventId ? { ...event, ...updates } : event
    ).sort((a, b) => a.startTime - b.startTime));
  };

  const deleteParameterEvent = (eventId: string) => {
    setParameterEvents(parameterEvents.filter(e => e.id !== eventId));
    if (editingEventId === eventId) {
      setShowEventModal(false);
      setEditingEventId(null);
    }
  };

  // Environment keyframe handlers (similar to VisualizerEditor)
  const handleAddEnvironmentKeyframe = () => {
    const time = currentTime;
    const newKeyframe: EnvironmentKeyframe = {
      id: nextEnvironmentKeyframeId.current++,
      time,
      type: 'ocean',
      intensity: 0.5
    };
    setEnvironmentKeyframes([...environmentKeyframes, newKeyframe].sort((a, b) => a.time - b.time));
    addLog(`Added environment keyframe at ${formatTime(time)}`, 'success');
  };

  const handleDeleteEnvironmentKeyframe = (id: number) => {
    setEnvironmentKeyframes(environmentKeyframes.filter(kf => kf.id !== id));
    addLog('Deleted environment keyframe', 'info');
  };

  const handleUpdateEnvironmentKeyframe = (id: number, type: string, intensity: number, color?: string) => {
    setEnvironmentKeyframes(environmentKeyframes.map(kf => 
      kf.id === id ? { ...kf, type: type as EnvironmentKeyframe['type'], intensity, color } : kf
    ));
    addLog('Updated environment keyframe', 'success');
  };

  // Camera FX handlers
  const addCameraFXClip = (type: 'grid' | 'kaleidoscope' | 'pip') => {
    const startTime = currentTime;
    const newClip: CameraFXClip = {
      id: `fx-${Date.now()}`,
      name: `${type} FX`,
      type,
      startTime: parseFloat(startTime.toFixed(2)),
      endTime: parseFloat((startTime + 5).toFixed(2)),
      enabled: true,
      ...(type === 'grid' && { gridRows: 2, gridColumns: 2 }),
      ...(type === 'kaleidoscope' && { kaleidoscopeSegments: 6, kaleidoscopeRotation: 0 }),
      ...(type === 'pip' && { pipScale: 0.25, pipPositionX: 0.65, pipPositionY: 0.65, pipBorderWidth: 2, pipBorderColor: '#ffffff' })
    };
    setCameraFXClips([...cameraFXClips, newClip].sort((a, b) => a.startTime - b.startTime));
    setSelectedFXClipId(newClip.id);
    addLog(`Added ${type} FX clip at ${formatTime(startTime)}`, 'success');
  };

  const updateCameraFXClip = (id: string, updates: Partial<CameraFXClip>) => {
    setCameraFXClips(cameraFXClips.map(clip => 
      clip.id === id ? { ...clip, ...updates } : clip
    ));
  };

  const deleteCameraFXClip = (id: string) => {
    setCameraFXClips(cameraFXClips.filter(clip => clip.id !== id));
    setCameraFXKeyframes(cameraFXKeyframes.filter(kf => kf.clipId !== id));
    setCameraFXAudioModulations(cameraFXAudioModulations.filter(mod => mod.clipId !== id));
    if (selectedFXClipId === id) setSelectedFXClipId(null);
    addLog('Deleted Camera FX clip', 'info');
  };

  const addCameraFXKeyframe = (clipId: string, parameter: string, value: number) => {
    const time = currentTime;
    const newKeyframe: CameraFXKeyframe = {
      id: `kf-${Date.now()}`,
      clipId,
      time: parseFloat(time.toFixed(2)),
      parameter,
      value,
      easing: 'linear'
    };
    setCameraFXKeyframes([...cameraFXKeyframes, newKeyframe].sort((a, b) => a.time - b.time));
    addLog(`Added keyframe for ${parameter}`, 'success');
  };

  const updateCameraFXKeyframe = (id: string, updates: Partial<CameraFXKeyframe>) => {
    setCameraFXKeyframes(cameraFXKeyframes.map(kf => 
      kf.id === id ? { ...kf, ...updates } : kf
    ));
  };

  const deleteCameraFXKeyframe = (id: string) => {
    setCameraFXKeyframes(cameraFXKeyframes.filter(kf => kf.id !== id));
    addLog('Deleted Camera FX keyframe', 'info');
  };

  const addCameraFXAudioModulation = (clipId: string, parameter: string, audioTrack: 'bass' | 'mids' | 'highs', amount: number) => {
    const newModulation: CameraFXAudioModulation = {
      id: `mod-${Date.now()}`,
      clipId,
      parameter,
      audioTrack,
      amount
    };
    setCameraFXAudioModulations([...cameraFXAudioModulations, newModulation]);
    addLog(`Added audio modulation for ${parameter}`, 'success');
  };

  const updateCameraFXAudioModulation = (id: string, updates: Partial<CameraFXAudioModulation>) => {
    setCameraFXAudioModulations(cameraFXAudioModulations.map(mod => 
      mod.id === id ? { ...mod, ...updates } : mod
    ));
  };

  const deleteCameraFXAudioModulation = (id: string) => {
    setCameraFXAudioModulations(cameraFXAudioModulations.filter(mod => mod.id !== id));
    addLog('Deleted audio modulation', 'info');
  };

  // NEW: Recording functions
  const startRecording = () => {
    if (!rendererRef.current || !audioContextRef.current || !analyserRef.current) {
      addLog('Cannot record: scene or audio not ready', 'error');
      return;
    }
    // Recording logic would go here if needed
    addLog('Recording feature not fully implemented', 'info');
  };

  // NEW: Automated video export functions
  const exportVideo = async () => {
    if (!rendererRef.current || !audioContextRef.current || !audioBufferRef.current) {
      addLog('Cannot export: scene or audio not ready', 'error');
      return;
    }

    if (!audioReady) {
      addLog('Please load an audio file first', 'error');
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(0);
      addLog('Starting automated video export...', 'info');

      // Get audio duration and update state to prevent animation loop issues
      const duration = audioBufferRef.current.duration;
      setDuration(duration); // FIX: Ensure animation loop has correct duration
      
      // Reset playback state
      if (bufferSourceRef.current) {
        bufferSourceRef.current.stop();
        bufferSourceRef.current = null;
      }
      pauseTimeRef.current = 0;
      setCurrentTime(0);

      // Parse export resolution
      const [exportWidth, exportHeight] = exportResolution.split('x').map(Number);
      
      // Store original canvas size
      const originalWidth = 960;
      const originalHeight = 540;
      
      // Temporarily resize renderer to export resolution
      rendererRef.current.setSize(exportWidth, exportHeight);
      if (cameraRef.current) {
        cameraRef.current.aspect = exportWidth / exportHeight;
        cameraRef.current.updateProjectionMatrix();
      }
      addLog(`Rendering at ${exportResolution} for export`, 'info');

      // Set up streams with higher frame rate for better quality
      const canvasStream = rendererRef.current.domElement.captureStream(30);
      const audioDestination = audioContextRef.current.createMediaStreamDestination();
      analyserRef.current.connect(audioDestination);
      const audioStream = audioDestination.stream;
      
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);
      
      // Determine MIME type based on format
      let mimeType = 'video/webm;codecs=vp9,opus';
      let extension = 'webm';
      
      if (exportFormat === 'mp4') {
        // Note: MP4 export depends on browser support
        if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
          extension = 'mp4';
        } else {
          addLog('MP4 not supported, using WebM', 'info');
        }
      }
      
      // Calculate bitrate based on resolution for better quality
      const pixelCount = exportWidth * exportHeight;
      let videoBitrate = EXPORT_BITRATE_SD; // Default 8Mbps for 960x540
      if (pixelCount >= EXPORT_PIXELS_FULLHD) {
        videoBitrate = EXPORT_BITRATE_FULLHD; // 20Mbps for 1080p
      } else if (pixelCount >= EXPORT_PIXELS_HD) {
        videoBitrate = EXPORT_BITRATE_HD; // 12Mbps for 720p
      }
      
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: videoBitrate
      });
      
      recordedChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `visualizer_${exportResolution}_${Date.now()}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        addLog(`Video exported successfully at ${exportResolution} as ${extension.toUpperCase()}!`, 'success');
        setIsExporting(false);
        setExportProgress(100);
        
        // Restore original canvas size
        if (rendererRef.current) {
          rendererRef.current.setSize(originalWidth, originalHeight);
        }
        if (cameraRef.current) {
          cameraRef.current.aspect = originalWidth / originalHeight;
          cameraRef.current.updateProjectionMatrix();
        }
        
        // Reset playback state
        pauseTimeRef.current = 0;
        setCurrentTime(0);
        setIsPlaying(false);
      };
      
      // Start recording with timeslice to capture data periodically
      // This helps prevent memory issues and ensures consistent capture
      recorder.start(EXPORT_TIMESLICE_MS);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      addLog('Recording started', 'success');

      // Track progress
      const AUDIO_END_THRESHOLD = 0.1;
      const FINAL_FRAME_DELAY = 500;
      
      // Auto-play the audio using Web Audio API
      const src = audioContextRef.current.createBufferSource();
      src.buffer = audioBufferRef.current;
      src.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // Add onended handler as backup to ensure recording stops
      src.onended = () => {
        // Give a small delay to capture final frames
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          if (bufferSourceRef.current === src) {
            bufferSourceRef.current = null;
          }
        }, FINAL_FRAME_DELAY);
      };
      
      src.start(0, 0);
      bufferSourceRef.current = src;
      startTimeRef.current = Date.now();
      setIsPlaying(true);
      
      // Request data periodically to ensure consistent recording
      const dataRequestInterval = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          try {
            mediaRecorderRef.current.requestData();
          } catch (e) {
            console.warn('Failed to request data from recorder:', e);
          }
        }
      }, EXPORT_DATA_REQUEST_INTERVAL_MS);
      
      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const progress = (elapsed / duration) * 100;
        setExportProgress(Math.min(progress, 99));
        setCurrentTime(elapsed);
        
        // Stop when audio ends
        if (elapsed >= duration - AUDIO_END_THRESHOLD) {
          clearInterval(progressInterval);
          clearInterval(dataRequestInterval);
          setTimeout(() => {
            if (mediaRecorderRef.current) {
              mediaRecorderRef.current.stop();
              if (bufferSourceRef.current) {
                bufferSourceRef.current.stop();
                bufferSourceRef.current = null;
              }
            }
          }, FINAL_FRAME_DELAY);
        }
      }, 100);

      addLog(`Exporting ${duration.toFixed(1)}s video at ${exportResolution} as ${extension.toUpperCase()}...`, 'info');
      addLog(`Video bitrate: ${(videoBitrate / 1000000).toFixed(1)} Mbps, Frame rate: 30 FPS`, 'info');

    } catch (e) {
      const error = e as Error;
      addLog(`Export error: ${error.message}`, 'error');
      console.error('Export error:', e);
      setIsExporting(false);
      setExportProgress(0);
      
      // Restore original canvas size on error
      const originalWidth = 960;
      const originalHeight = 540;
      if (rendererRef.current) {
        rendererRef.current.setSize(originalWidth, originalHeight);
      }
      if (cameraRef.current) {
        cameraRef.current.aspect = originalWidth / originalHeight;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  };

  const getFreq = (d: Uint8Array) => ({
    bass: (d.slice(0,10).reduce((a,b)=>a+b,0)/10/255) * bassGain,
    mids: (d.slice(10,100).reduce((a,b)=>a+b,0)/90/255) * midsGain,
    highs: (d.slice(100,200).reduce((a,b)=>a+b,0)/100/255) * highsGain
  });

  // PHASE 5: Text Animator Functions
  const createTextAnimatorKeyframe = (time: number, text: string = 'Sample Text') => {
    const newKeyframe = {
      id: `text-anim-${Date.now()}`,
      time,
      text,
      visible: true,
      animation: 'fade' as const,
      direction: 'up' as const,
      stagger: 0.05, // 50ms between characters
      duration: 0.5, // 500ms per character
      characterOffsets: [],
      position: { x: 0, y: 5, z: 0 }, // Default position
      size: 1, // Default size
      color: '#00ffff' // Default cyan color
    };
    setTextAnimatorKeyframes(prev => [...prev, newKeyframe]);
    addLog(`Created text animator keyframe at ${formatTime(time)}`, 'success');
    return newKeyframe;
  };

  // REMOVED: Duplicate updateTextAnimatorKeyframe (already defined earlier with field-based updates)

  const deleteTextAnimatorKeyframe = (id: string) => {
    setTextAnimatorKeyframes(prev => prev.filter(kf => kf.id !== id));
    // Clean up character meshes
    const meshes = textCharacterMeshesRef.current.get(id);
    if (meshes && sceneRef.current) {
      meshes.forEach(mesh => {
        sceneRef.current!.remove(mesh);
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      textCharacterMeshesRef.current.delete(id);
    }
    addLog(`Deleted text animator keyframe`, 'info');
  };

  // PHASE 5: Mask Functions
  const createMask = (type: 'circle' | 'rectangle' | 'custom' = 'circle') => {
    const newMask = {
      id: `mask-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Mask`,
      type,
      enabled: true,
      inverted: false,
      blendMode: 'normal' as const,
      feather: 10,
      center: type === 'circle' ? { x: 0.5, y: 0.5 } : undefined,
      radius: type === 'circle' ? 0.3 : undefined,
      rect: type === 'rectangle' ? { x: 0.25, y: 0.25, width: 0.5, height: 0.5 } : undefined,
      path: type === 'custom' ? [] : undefined
    };
    setMasks(prev => [...prev, newMask]);
    addLog(`Created ${type} mask`, 'success');
    return newMask;
  };

  const updateMask = (id: string, updates: any) => {
    setMasks(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMask = (id: string) => {
    setMasks(prev => prev.filter(m => m.id !== id));
    setMaskRevealKeyframes(prev => prev.filter(kf => kf.maskId !== id));
    addLog(`Deleted mask`, 'info');
  };

  const createMaskRevealKeyframe = (maskId: string, time: number) => {
    const mask = masks.find(m => m.id === maskId);
    if (!mask) return;
    
    const newKeyframe = {
      id: `mask-reveal-${Date.now()}`,
      time,
      maskId,
      animation: 'expand-circle' as const,
      duration: 1.0,
      easing: 'easeInOut' as const,
      targetCenter: mask.center ? { ...mask.center } : { x: 0.5, y: 0.5 },
      targetRadius: mask.radius || 0.5,
      targetRect: mask.rect ? { ...mask.rect } : undefined
    };
    setMaskRevealKeyframes(prev => [...prev, newKeyframe]);
    addLog(`Created mask reveal keyframe at ${formatTime(time)}`, 'success');
    return newKeyframe;
  };

  const deleteMaskRevealKeyframe = (id: string) => {
    setMaskRevealKeyframes(prev => prev.filter(kf => kf.id !== id));
    addLog(`Deleted mask reveal keyframe`, 'info');
  };

  // PHASE 5: Camera Rig Functions
  const createCameraRig = (type: 'orbit' | 'dolly' | 'crane' | 'custom' | 'rotation' | 'pan' | 'zoom' = 'orbit') => {
    const newRig = {
      id: `rig-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Rig`,
      enabled: false,
      type,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      trackingTarget: null,
      trackingOffset: { x: 0, y: 0, z: 0 },
      trackingSmooth: 0.5,
      invertDirection: false,
      orbitRadius: type === 'orbit' ? 15 : undefined,
      orbitSpeed: type === 'orbit' ? 0.5 : undefined,
      orbitAxis: type === 'orbit' ? 'y' as const : undefined,
      dollySpeed: type === 'dolly' ? 1.0 : undefined,
      dollyAxis: type === 'dolly' ? 'z' as const : undefined,
      craneHeight: type === 'crane' ? 10 : undefined,
      craneTilt: type === 'crane' ? 0 : undefined,
      rotationDistance: type === 'rotation' ? 20 : undefined,
      rotationSpeed: type === 'rotation' ? 0.3 : undefined,
      panSpeed: type === 'pan' ? 0.5 : undefined,
      panRange: type === 'pan' ? 90 : undefined,
      zoomSpeed: type === 'zoom' ? 0.5 : undefined,
      zoomMinDistance: type === 'zoom' ? 10 : undefined,
      zoomMaxDistance: type === 'zoom' ? 40 : undefined
    };
    setCameraRigs(prev => [...prev, newRig]);
    
    // Create null object in scene
    if (sceneRef.current) {
      const nullObject = new THREE.Object3D();
      nullObject.name = newRig.name;
      sceneRef.current.add(nullObject);
      cameraRigNullObjectsRef.current.set(newRig.id, nullObject);
      
      // Create path visualization objects
      const pathColor = getRigPathColor(type);
      const pathLineGeometry = new THREE.BufferGeometry();
      const pathLine = new THREE.Line(
        pathLineGeometry,
        new THREE.LineBasicMaterial({ color: pathColor, opacity: 0.8, transparent: true })
      );
      pathLine.visible = false;
      sceneRef.current.add(pathLine);
      
      rigPathsRef.current.set(newRig.id, {
        pathLine,
        keyframeMarkers: []
      });
    }
    
    addLog(`Created ${type} camera rig`, 'success');
    return newRig;
  };

  const updateCameraRig = (id: string, updates: any) => {
    setCameraRigs(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    
    // Update null object
    const nullObject = cameraRigNullObjectsRef.current.get(id);
    if (nullObject && updates.position) {
      nullObject.position.set(updates.position.x, updates.position.y, updates.position.z);
    }
    if (nullObject && updates.rotation) {
      nullObject.rotation.set(updates.rotation.x, updates.rotation.y, updates.rotation.z);
    }
  };

  const deleteCameraRig = (id: string) => {
    setCameraRigs(prev => prev.filter(r => r.id !== id));
    setCameraRigKeyframes(prev => prev.filter(kf => kf.rigId !== id));
    
    // Remove null object
    const nullObject = cameraRigNullObjectsRef.current.get(id);
    if (nullObject && sceneRef.current) {
      sceneRef.current.remove(nullObject);
      cameraRigNullObjectsRef.current.delete(id);
    }
    
    // Remove path visualization objects
    const pathObjects = rigPathsRef.current.get(id);
    if (pathObjects && sceneRef.current) {
      if (pathObjects.pathLine) {
        sceneRef.current.remove(pathObjects.pathLine);
        pathObjects.pathLine.geometry.dispose();
        if (pathObjects.pathLine.material instanceof THREE.Material) {
          pathObjects.pathLine.material.dispose();
        }
      }
      pathObjects.keyframeMarkers.forEach(marker => {
        sceneRef.current?.remove(marker);
        marker.geometry.dispose();
        if (marker.material instanceof THREE.Material) {
          marker.material.dispose();
        }
      });
      rigPathsRef.current.delete(id);
    }
    
    // Remove from active rigs array
    setActiveCameraRigIds(prev => prev.filter(rigId => rigId !== id));
    
    addLog(`Deleted camera rig`, 'info');
  };

  const createCameraRigKeyframe = (rigId: string, time: number) => {
    const rig = cameraRigs.find(r => r.id === rigId);
    if (!rig) return;
    
    const newKeyframe = {
      id: `rig-kf-${Date.now()}`,
      time,
      rigId,
      position: { ...rig.position },
      rotation: { ...rig.rotation },
      duration: 1.0,
      easing: 'linear' as const,
      preset: undefined
    };
    setCameraRigKeyframes(prev => [...prev, newKeyframe]);
    addLog(`Created camera rig keyframe at ${formatTime(time)}`, 'success');
    return newKeyframe;
  };

  const updateCameraRigKeyframe = (id: string, updates: Partial<{
    time: number;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    duration: number;
    easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  }>) => {
    setCameraRigKeyframes(prev => prev.map(kf => kf.id === id ? { ...kf, ...updates } : kf));
  };


  const deleteCameraRigKeyframe = (id: string) => {
    setCameraRigKeyframes(prev => prev.filter(kf => kf.id !== id));
    addLog(`Deleted camera rig keyframe`, 'info');
  };

  // Helper function to calculate rig position at a given time
  const calculateRigPositionAtTime = (rig: any, time: number) => {
    // Get keyframes for this rig
    const sortedRigKeyframes = cameraRigKeyframes
      .filter(kf => kf.rigId === rig.id)
      .sort((a, b) => a.time - b.time);
    
    let rigPosition = { ...rig.position };
    let rigRotation = { ...rig.rotation };
    
    // Interpolate between keyframes if they exist
    if (sortedRigKeyframes.length > 0) {
      const currentKfIndex = sortedRigKeyframes.findIndex(kf => kf.time > time) - 1;
      if (currentKfIndex >= 0) {
        const currentKf = sortedRigKeyframes[currentKfIndex];
        const nextKf = sortedRigKeyframes[currentKfIndex + 1];
        
        if (nextKf && time < nextKf.time) {
          // Interpolate
          const timeIntoAnim = time - currentKf.time;
          const progress = Math.min(timeIntoAnim / currentKf.duration, 1);
          
          // Apply easing
          let easedProgress = progress;
          switch (currentKf.easing) {
            case 'easeIn':
              easedProgress = progress * progress * progress;
              break;
            case 'easeOut':
              easedProgress = 1 - Math.pow(1 - progress, 3);
              break;
            case 'easeInOut':
              easedProgress = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
              break;
          }
          
          rigPosition.x = currentKf.position.x + (nextKf.position.x - currentKf.position.x) * easedProgress;
          rigPosition.y = currentKf.position.y + (nextKf.position.y - currentKf.position.y) * easedProgress;
          rigPosition.z = currentKf.position.z + (nextKf.position.z - currentKf.position.z) * easedProgress;
          rigRotation.x = currentKf.rotation.x + (nextKf.rotation.x - currentKf.rotation.x) * easedProgress;
          rigRotation.y = currentKf.rotation.y + (nextKf.rotation.y - currentKf.rotation.y) * easedProgress;
          rigRotation.z = currentKf.rotation.z + (nextKf.rotation.z - currentKf.rotation.z) * easedProgress;
        } else {
          // Use current keyframe values
          rigPosition = { ...currentKf.position };
          rigRotation = { ...currentKf.rotation };
        }
      }
    }
    
    // Apply rig type-specific motion
    switch (rig.type) {
      case 'orbit':
        if (rig.orbitRadius && rig.orbitSpeed && rig.orbitAxis) {
          const orbitAngle = time * rig.orbitSpeed;
          if (rig.orbitAxis === 'y') {
            rigPosition.x = Math.cos(orbitAngle) * rig.orbitRadius;
            rigPosition.z = Math.sin(orbitAngle) * rig.orbitRadius;
          } else if (rig.orbitAxis === 'x') {
            rigPosition.y = Math.cos(orbitAngle) * rig.orbitRadius;
            rigPosition.z = Math.sin(orbitAngle) * rig.orbitRadius;
          } else if (rig.orbitAxis === 'z') {
            rigPosition.x = Math.cos(orbitAngle) * rig.orbitRadius;
            rigPosition.y = Math.sin(orbitAngle) * rig.orbitRadius;
          }
        }
        break;
      
      case 'dolly':
        if (rig.dollySpeed && rig.dollyAxis) {
          const dollyDistance = time * rig.dollySpeed;
          if (rig.dollyAxis === 'z') {
            rigPosition.z += dollyDistance;
          } else if (rig.dollyAxis === 'x') {
            rigPosition.x += dollyDistance;
          } else if (rig.dollyAxis === 'y') {
            rigPosition.y += dollyDistance;
          }
        }
        break;
      
      case 'crane':
        if (rig.craneHeight !== undefined) {
          rigPosition.y = rig.craneHeight;
        }
        if (rig.craneTilt !== undefined) {
          rigRotation.x = rig.craneTilt;
        }
        break;
    }
    
    return { position: rigPosition, rotation: rigRotation };
  };

  // Helper function to get color for rig type
  const getRigPathColor = (rigType: string): number => {
    switch (rigType) {
      case 'orbit': return 0x00ffff; // cyan
      case 'dolly': return 0x00ff00; // green
      case 'crane': return 0xff00ff; // magenta
      case 'custom': return 0xffffff; // white
      default: return 0x888888; // gray
    }
  };

  // Update path visualization for a rig
  const updateRigPathVisualization = (rig: any) => {
    if (!sceneRef.current || !rig) return;
    
    const pathObjects = rigPathsRef.current.get(rig.id);
    if (!pathObjects) return;
    
    // Determine time range for path sampling
    const rigKeyframes = cameraRigKeyframes.filter(kf => kf.rigId === rig.id).sort((a, b) => a.time - b.time);
    const startTime = 0;
    const endTime = duration > 0 ? duration : (rigKeyframes.length > 0 ? rigKeyframes[rigKeyframes.length - 1].time + 5 : 10);
    
    // Sample path points (max 60 samples for performance, min 2 for valid path)
    const sampleCount = Math.max(2, Math.min(60, Math.ceil((endTime - startTime) / 0.1)));
    const pathPoints: THREE.Vector3[] = [];
    
    for (let i = 0; i <= sampleCount; i++) {
      const t = startTime + (endTime - startTime) * (i / sampleCount);
      const { position } = calculateRigPositionAtTime(rig, t);
      pathPoints.push(new THREE.Vector3(position.x, position.y, position.z));
    }
    
    // Update path line
    if (pathObjects.pathLine && pathPoints.length > 1) {
      // Dispose old geometry to prevent memory leaks
      pathObjects.pathLine.geometry.dispose();
      pathObjects.pathLine.geometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
    }
    
    // Update keyframe markers
    // Remove old markers
    pathObjects.keyframeMarkers.forEach(marker => {
      sceneRef.current?.remove(marker);
      marker.geometry.dispose();
      if (marker.material instanceof THREE.Material) {
        marker.material.dispose();
      }
    });
    pathObjects.keyframeMarkers = [];
    
    // Create new markers at keyframe positions
    rigKeyframes.forEach(kf => {
      const { position } = calculateRigPositionAtTime(rig, kf.time);
      
      // Determine marker size based on easing type
      let markerSize = 0.3;
      switch (kf.easing) {
        case 'easeIn': markerSize = 0.25; break;
        case 'easeOut': markerSize = 0.35; break;
        case 'easeInOut': markerSize = 0.4; break;
        default: markerSize = 0.3; break;
      }
      
      const markerGeometry = new THREE.SphereGeometry(markerSize, 8, 8);
      const markerColor = getRigPathColor(rig.type);
      const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: markerColor, 
        opacity: 0.9, 
        transparent: true 
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(position.x, position.y, position.z);
      marker.visible = false; // Will be shown based on showRigKeyframeMarkers state
      
      sceneRef.current?.add(marker);
      pathObjects.keyframeMarkers.push(marker);
    });
  };

  // Shot Presets - predefined camera rig configurations
  const shotPresets = {
    'closeup': {
      name: 'Close-Up',
      description: 'Tight frame on subject',
      applyToRig: (rig: any) => ({
        ...rig,
        position: { x: 0, y: 0, z: 8 },
        orbitRadius: rig.type === 'orbit' ? 8 : rig.orbitRadius,
        rotationDistance: rig.type === 'rotation' ? 8 : rig.rotationDistance,
        zoomMinDistance: rig.type === 'zoom' ? 5 : rig.zoomMinDistance,
        zoomMaxDistance: rig.type === 'zoom' ? 12 : rig.zoomMaxDistance,
      })
    },
    'wide': {
      name: 'Wide Shot',
      description: 'Establish scene context',
      applyToRig: (rig: any) => ({
        ...rig,
        position: { x: 0, y: 5, z: 30 },
        orbitRadius: rig.type === 'orbit' ? 30 : rig.orbitRadius,
        rotationDistance: rig.type === 'rotation' ? 30 : rig.rotationDistance,
        zoomMinDistance: rig.type === 'zoom' ? 25 : rig.zoomMinDistance,
        zoomMaxDistance: rig.type === 'zoom' ? 40 : rig.zoomMaxDistance,
      })
    },
    'overhead': {
      name: 'Overhead',
      description: 'Bird\'s eye view',
      applyToRig: (rig: any) => ({
        ...rig,
        position: { x: 0, y: 20, z: 0 },
        rotation: { x: -Math.PI / 2, y: 0, z: 0 },
        craneHeight: rig.type === 'crane' ? 20 : rig.craneHeight,
        craneTilt: rig.type === 'crane' ? -Math.PI / 2 : rig.craneTilt,
      })
    },
    'lowAngle': {
      name: 'Low Angle',
      description: 'Dramatic upward view',
      applyToRig: (rig: any) => ({
        ...rig,
        position: { x: 0, y: -5, z: 15 },
        rotation: { x: 0.3, y: 0, z: 0 },
        craneHeight: rig.type === 'crane' ? -5 : rig.craneHeight,
        craneTilt: rig.type === 'crane' ? 0.3 : rig.craneTilt,
      })
    },
    'dutch': {
      name: 'Dutch Angle',
      description: 'Tilted perspective',
      applyToRig: (rig: any) => ({
        ...rig,
        rotation: { ...rig.rotation, z: 0.3 }, // ~17 degrees tilt
      })
    },
    'tracking': {
      name: 'Tracking',
      description: 'Follow subject smoothly',
      applyToRig: (rig: any) => ({
        ...rig,
        dollySpeed: rig.type === 'dolly' ? 1.5 : rig.dollySpeed,
        rotationSpeed: rig.type === 'rotation' ? 0.5 : rig.rotationSpeed,
        orbitSpeed: rig.type === 'orbit' ? 0.3 : rig.orbitSpeed,
      })
    }
  };

  const applyShotPreset = (presetKey: string) => {
    const preset = shotPresets[presetKey as keyof typeof shotPresets];
    if (!preset) return;

    // Apply preset to all active rigs
    activeCameraRigIds.forEach(rigId => {
      const rig = cameraRigs.find(r => r.id === rigId);
      if (rig) {
        const updatedRig = preset.applyToRig(rig);
        updateCameraRig(rigId, updatedRig);
      }
    });

    setSelectedShotPreset(presetKey);
    addLog(`Applied shot preset: ${preset.name}`, 'success');
  };

  // Handheld drift noise function (simplified Perlin noise using sine waves)
  const getHandheldNoise = (time: number, axis: number) => {
    // Use multiple sine waves at different frequencies for organic motion
    const freq1 = 0.5 + axis * 0.1;
    const freq2 = 1.2 + axis * 0.15;
    const freq3 = 2.3 + axis * 0.2;
    
    return (
      Math.sin(time * freq1) * 0.5 +
      Math.sin(time * freq2) * 0.3 +
      Math.sin(time * freq3) * 0.2
    );
  };

  // Shape requirements for each preset type
  // These define the MINIMUM number of shapes needed for each preset to render correctly
  // Performance-optimized: limiting shapes to what's visually necessary (typically 8 cubes, 30 octas, 30 tetras)
  const PRESET_SHAPE_REQUIREMENTS: Record<string, { cubes: number; octas: number; tetras: number; toruses: number; planes: number }> = {
    orbit: orbitPreset,                    // Imported from src/presets/orbit.ts
    explosion: explosionPreset,            // Imported from src/presets/explosion.ts
    tunnel: tunnelPreset,                  // Imported from src/presets/tunnel.ts
    wave: wavePreset,                      // Imported from src/presets/wave.ts
    spiral: spiralPreset,                  // Imported from src/presets/spiral.ts
    chill: chillPreset,                    // Imported from src/presets/chill.ts
    pulse: pulsePreset,                    // Imported from src/presets/pulse.ts
    vortex: vortexPreset,                  // Imported from src/presets/vortex.ts
    seiryu: seiryuPreset,                  // Imported from src/presets/seiryu.ts
    hammerhead: hammerheadPreset,          // Imported from src/presets/hammerhead.ts
    cosmic: cosmicPreset,                  // Imported from src/presets/cosmic.ts
    cityscape: cityscapePreset,            // Imported from src/presets/cityscape.ts
    oceanwaves: oceanwavesPreset,          // Imported from src/presets/oceanwaves.ts
    forest: forestPreset,                  // Imported from src/presets/forest.ts
    portals: portalsPreset,                // Imported from src/presets/portals.ts
    discoball: discoballPreset,            // Imported from src/presets/discoball.ts
    windturbines: windturbinesPreset,      // Imported from src/presets/windturbines.ts
    clockwork: clockworkPreset,            // Imported from src/presets/clockwork.ts
    neontunnel: neontunnelPreset,          // Imported from src/presets/neontunnel.ts
    atommodel: atommodelPreset,            // Imported from src/presets/atommodel.ts
    carousel: carouselPreset,              // Imported from src/presets/carousel.ts
    solarsystem: solarsystemPreset,        // Imported from src/presets/solarsystem.ts
    datastream: datastreamPreset,          // Imported from src/presets/datastream.ts
    ferriswheel: ferriswheelPreset,        // Imported from src/presets/ferriswheel.ts
    tornadovortex: tornadovortexPreset,    // Imported from src/presets/tornadovortex.ts
    stadium: stadiumPreset,                // Imported from src/presets/stadium.ts
    kaleidoscope2: kaleidoscope2Preset,    // Imported from src/presets/kaleidoscope2.ts
    empty: emptyPreset                     // Imported from src/presets/empty.ts
  };

  // Scene initialization - runs once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    let scene, camera, renderer;
    
    try {
      addLog('Initializing Three.js scene...', 'info');
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0a0a14, 10, 50);
      sceneRef.current = scene;
      
      // Initialize performance monitor (PR 9: Guardrails)
      if (!perfMonitorRef.current) {
        perfMonitorRef.current = new PerformanceMonitor();
      }
      
      camera = new THREE.PerspectiveCamera(75, 960/540, 0.1, 1000);
      camera.position.z = 15;
      cameraRef.current = camera;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
      renderer.setSize(960, 540);
      renderer.setClearColor(0x0a0a14);

      if (containerRef.current.children.length > 0) {
        containerRef.current.removeChild(containerRef.current.children[0]);
      }

      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      
      // Setup post-processing with EffectComposer
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);
      
      const postFXPass = new ShaderPass(PostFXShader);
      postFXPass.renderToScreen = true;
      composer.addPass(postFXPass);
      
      composerRef.current = composer;
      postFXPassRef.current = postFXPass;
      
      addLog('Scene initialized successfully', 'success');
    } catch (e) {
      console.error('Three.js initialization error:', e);
      const error = e as Error;
      addLog(`Three.js error: ${error.message}`, 'error');
      return;
    }

    // Calculate maximum shapes needed across all preset keyframes
    const calculateRequiredShapes = (): { cubes: number; octas: number; tetras: number; toruses: number; planes: number } => {
      let maxCubes = 0;
      let maxOctas = 0;
      let maxTetras = 0;
      let maxToruses = 0;
      let maxPlanes = 0;
      
      presetKeyframes.forEach(kf => {
        const req = PRESET_SHAPE_REQUIREMENTS[kf.preset] || { cubes: 100, octas: 100, tetras: 100, toruses: 0, planes: 0 };
        maxCubes = Math.max(maxCubes, req.cubes);
        maxOctas = Math.max(maxOctas, req.octas);
        maxTetras = Math.max(maxTetras, req.tetras);
        maxToruses = Math.max(maxToruses, req.toruses);
        maxPlanes = Math.max(maxPlanes, req.planes);
      });
      
      // Add 15 extra octas for environment system
      maxOctas += 15;
      
      // Ensure minimum allocations to support manual preset switching
      // Users can manually select presets not in the timeline, so we need reasonable defaults
      maxCubes = Math.max(maxCubes, 12);        // Support presets with up to 12 cubes (cityscape, stadium, ferriswheel)
      maxOctas = Math.max(maxOctas, 45);        // 30 base + 15 environment
      maxTetras = Math.max(maxTetras, 30);      // Support most presets with tetras
      maxToruses = Math.max(maxToruses, 25);    // Support presets with toruses (neontunnel uses 25)
      maxPlanes = Math.max(maxPlanes, 40);      // Support presets with planes (discoball uses 40)
      
      return { cubes: maxCubes, octas: maxOctas, tetras: maxTetras, toruses: maxToruses, planes: maxPlanes };
    };

    // Calculate required shapes based on preset keyframes
    const requiredShapes = calculateRequiredShapes();
    addLog(`Optimized shape allocation: ${requiredShapes.cubes} cubes, ${requiredShapes.octas} octas, ${requiredShapes.tetras} tetras, ${requiredShapes.toruses} toruses, ${requiredShapes.planes} planes`, 'info');

    // Use shapeFactory to create all shape pools
    const { cubes, octas, tetras, toruses, planes } = createShapePools(
      scene,
      {
        type: cubeMaterialType,
        color: cubeColor,
        wireframe: cubeWireframe,
        opacity: cubeOpacity,
        metalness: cubeMetalness,
        roughness: cubeRoughness
      },
      {
        type: octahedronMaterialType,
        color: octahedronColor,
        wireframe: octahedronWireframe,
        opacity: octahedronOpacity,
        metalness: octahedronMetalness,
        roughness: octahedronRoughness
      },
      {
        type: tetrahedronMaterialType,
        color: tetrahedronColor,
        wireframe: tetrahedronWireframe,
        opacity: tetrahedronOpacity,
        metalness: tetrahedronMetalness,
        roughness: tetrahedronRoughness
      },
      requiredShapes
    );

    // Create sphere separately (not part of shapePools)
    const sphereMaterial = createMaterial(
      sphereMaterialType,
      sphereColor,
      sphereWireframe,
      sphereOpacity,
      sphereMetalness,
      sphereRoughness
    );
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.5,16,16), sphereMaterial);
    scene.add(sphere);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientLightIntensity);
    scene.add(ambientLight);
    lightsRef.current.ambient = ambientLight;
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, directionalLightIntensity);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    lightsRef.current.directional = directionalLight;
    
    // Workspace mode: Grid and Axes helpers
    const workspaceGrid = new THREE.GridHelper(40, 40, 0x00ffff, 0x444444);
    workspaceGrid.visible = showGrid;
    scene.add(workspaceGrid);
    gridHelperRef.current = workspaceGrid;
    
    const workspaceAxes = new THREE.AxesHelper(10);
    workspaceAxes.visible = showAxes;
    scene.add(workspaceAxes);
    axesHelperRef.current = workspaceAxes;
    
    // Create camera rig hint objects
    // Position marker (camera location)
    const positionMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true })
    );
    positionMarker.visible = false;
    scene.add(positionMarker);
    
    // Target marker (look-at point)
    const targetMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true })
    );
    targetMarker.visible = false;
    scene.add(targetMarker);
    
    // Connection line (from camera to target)
    const connectionLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    const connectionLine = new THREE.Line(
      connectionLineGeometry,
      new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.5, transparent: true })
    );
    connectionLine.visible = false;
    scene.add(connectionLine);
    
    // Grid helper (reference grid)
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    gridHelper.visible = false;
    scene.add(gridHelper);
    
    // Path preview line (camera keyframe path)
    const pathLineGeometry = new THREE.BufferGeometry();
    const pathLine = new THREE.Line(
      pathLineGeometry,
      new THREE.LineBasicMaterial({ color: 0xff00ff, opacity: 0.7, transparent: true, linewidth: 2 })
    );
    pathLine.visible = false;
    scene.add(pathLine);
    
    rigHintsRef.current = {
      positionMarker,
      targetMarker,
      connectionLine,
      gridHelper,
      pathLine
    };
    
    // Initialize OrbitControls for mouse camera control (like Editor/Blender)
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.screenSpacePanning = false;
    orbitControls.minDistance = 5;
    orbitControls.maxDistance = 50;
    orbitControls.target.set(0, 0, 0); // Look at scene origin
    orbitControls.enabled = !isPlaying; // Disable when playing (keyframes/auto-rotate take over)
    orbitControlsRef.current = orbitControls;
    
    objectsRef.current = { cubes, octas, tetras, toruses, planes, sphere };
    addLog(`Added ${cubes.length} cubes, ${octas.length} octas, ${tetras.length} tetras, ${toruses.length} toruses, ${planes.length} planes`, 'info');

    // Initialize particle system manager
    const particleManager = new ParticleSystemManager();
    particleManagerRef.current = particleManager;

    return () => {
      // Cleanup on unmount only
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
        idleAnimationRef.current = null;
      }
      if (orbitControlsRef.current) {
        orbitControlsRef.current.dispose();
        orbitControlsRef.current = null;
      }
      if (rendererRef.current) {
        try {
          if (containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
            containerRef.current.removeChild(rendererRef.current.domElement);
          }
          rendererRef.current.dispose();
          rendererRef.current = null;
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }
      // Clear refs to help garbage collection
      sceneRef.current = null;
      cameraRef.current = null;
      composerRef.current = null;
      postFXPassRef.current = null;
      if (particleManagerRef.current) {
        particleManagerRef.current.dispose();
      }
      
      // Stop autosave on cleanup
      autosaveService.stop();
    };
  }, []); // Empty dependency array - only run once on mount

  // Track input focus to prevent keyboard shortcuts while typing
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable) {
        setIsInputFocused(true);
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.isContentEditable) {
        setIsInputFocused(false);
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Autosave integration - start/stop based on project ID
  useEffect(() => {
    if (currentProjectId && isDatabaseAvailable()) {
      // Start autosave when a project is loaded or created
      const userId = user?.id;
      autosaveService.start(
        currentProjectId,
        getCurrentProjectState,
        userId,
        (success, error) => {
          if (success) {
            setLastAutosaveTime(new Date());
            setIsAutosaving(false);
            addLog('Project auto-saved', 'info');
          } else {
            setIsAutosaving(false);
            addLog(`Autosave failed: ${error?.message || 'Unknown error'}`, 'error');
          }
        }
      );
      
      // Update activity on user interaction
      const updateActivity = () => autosaveService.updateActivity();
      window.addEventListener('mousemove', updateActivity);
      window.addEventListener('keydown', updateActivity);
      window.addEventListener('click', updateActivity);

      return () => {
        window.removeEventListener('mousemove', updateActivity);
        window.removeEventListener('keydown', updateActivity);
        window.removeEventListener('click', updateActivity);
      };
    } else {
      // Stop autosave if no project is loaded
      autosaveService.stop();
    }
  }, [currentProjectId, user]);

  // Show autosaving indicator briefly before autosave
  useEffect(() => {
    if (currentProjectId) {
      const checkAutosave = setInterval(() => {
        const settings = autosaveService.getSettings();
        if (settings.enabled && lastAutosaveTime) {
          const timeSinceLastSave = Date.now() - lastAutosaveTime.getTime();
          // Show indicator 10 seconds before next autosave
          if (timeSinceLastSave >= settings.intervalMs - 10000 && timeSinceLastSave < settings.intervalMs) {
            setIsAutosaving(true);
          }
        }
      }, 1000);

      return () => clearInterval(checkAutosave);
    }
  }, [currentProjectId, lastAutosaveTime]);

  // Idle render loop - manages rendering when not playing
  useEffect(() => {
    // Continuous idle render loop - keeps canvas live like Blender/Editor mode
    const idleRender = () => {
      // Stop idle render when playing (main animation loop takes over)
      if (isPlaying) {
        if (idleAnimationRef.current) {
          cancelAnimationFrame(idleAnimationRef.current);
          idleAnimationRef.current = null;
        }
        return;
      }
      
      idleAnimationRef.current = requestAnimationFrame(idleRender);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        const cam = cameraRef.current;
        
        // Update OrbitControls (for damping)
        if (orbitControlsRef.current) {
          orbitControlsRef.current.update();
        }
        
        // Only apply keyframe/manual camera positioning if OrbitControls hasn't been used
        // (Once user interacts with mouse, OrbitControls takes over until play is pressed)
        if (!orbitControlsRef.current || !orbitControlsRef.current.enabled) {
          // REMOVED: Global camera keyframe interpolation (orphaned feature)
          // Now only use direct camera distance/height values
          const currentDist = cameraDistance;
          const currentHeight = cameraHeight;
          const currentRot = 0;
          
          // Simple orbital camera positioning
          cam.position.set(
            Math.cos(currentRot) * currentDist,
            10 + currentHeight,
            Math.sin(currentRot) * currentDist
          );
          cam.lookAt(0, 0, 0);
        }
        
        // Update camera rig hints visibility and position
        if (rigHintsRef.current.positionMarker && showRigHints && showRigPosition) {
          rigHintsRef.current.positionMarker.visible = true;
          rigHintsRef.current.positionMarker.position.copy(cam.position);
        } else if (rigHintsRef.current.positionMarker) {
          rigHintsRef.current.positionMarker.visible = false;
        }
        
        if (rigHintsRef.current.targetMarker && showRigHints && showRigTarget) {
          rigHintsRef.current.targetMarker.visible = true;
          rigHintsRef.current.targetMarker.position.set(0, 0, 0);
        } else if (rigHintsRef.current.targetMarker) {
          rigHintsRef.current.targetMarker.visible = false;
        }
        
        if (rigHintsRef.current.connectionLine && showRigHints && showRigPosition && showRigTarget) {
          rigHintsRef.current.connectionLine.visible = true;
          const positions = new Float32Array([
            cam.position.x, cam.position.y, cam.position.z,
            0, 0, 0
          ]);
          rigHintsRef.current.connectionLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        } else if (rigHintsRef.current.connectionLine) {
          rigHintsRef.current.connectionLine.visible = false;
        }
        
        if (rigHintsRef.current.gridHelper && showRigHints && showRigGrid) {
          rigHintsRef.current.gridHelper.visible = true;
        } else if (rigHintsRef.current.gridHelper) {
          rigHintsRef.current.gridHelper.visible = false;
        }
        
        // REMOVED: Path preview for global camera keyframes (orphaned feature)
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    // Start or restart idle render loop when not playing
    if (!isPlaying) {
      if (!idleAnimationRef.current) {
        idleAnimationRef.current = requestAnimationFrame(idleRender);
      }
    }

    return () => {
      // Don't cleanup renderer here - only cancel animation frame
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
        idleAnimationRef.current = null;
      }
    };
  }, [isPlaying, currentTime, cameraDistance, cameraHeight, showRigHints, showRigPosition, showRigTarget, showRigGrid, showRigPath]);

  // Update scene background, fog, and lights when settings change
  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current) return;
    
    // Remove existing skybox mesh if it exists
    if (skyboxMeshRef.current) {
      sceneRef.current.remove(skyboxMeshRef.current);
      skyboxMeshRef.current.geometry.dispose();
      if (skyboxMeshRef.current.material instanceof THREE.Material) {
        skyboxMeshRef.current.material.dispose();
      }
      skyboxMeshRef.current = null;
    }
    
    // Remove existing star field if it exists
    if (starFieldRef.current) {
      sceneRef.current.remove(starFieldRef.current);
      starFieldRef.current.geometry.dispose();
      if (starFieldRef.current.material instanceof THREE.Material) {
        starFieldRef.current.material.dispose();
      }
      starFieldRef.current = null;
    }
    
    if (skyboxType === 'color') {
      // Standard solid color background
      const bgColor = new THREE.Color(backgroundColor);
      sceneRef.current.background = bgColor;
      sceneRef.current.fog = new THREE.Fog(backgroundColor, 10, 50);
      rendererRef.current.setClearColor(backgroundColor);
    } else if (skyboxType === 'gradient') {
      // Gradient skybox using a large sphere with gradient shader
      const skyboxGeometry = new THREE.SphereGeometry(500, 32, 32);
      const skyboxMaterial = new THREE.ShaderMaterial({
        uniforms: {
          topColor: { value: new THREE.Color(skyboxGradientTop) },
          bottomColor: { value: new THREE.Color(skyboxGradientBottom) }
        },
        vertexShader: `
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(h, 0.0)), 1.0);
          }
        `,
        side: THREE.BackSide
      });
      const skyboxMesh = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
      sceneRef.current.add(skyboxMesh);
      skyboxMeshRef.current = skyboxMesh;
      
      // Set scene background to null and clear color to black (skybox will be rendered)
      sceneRef.current.background = null;
      rendererRef.current.setClearColor(0x000000);
      sceneRef.current.fog = new THREE.Fog(backgroundColor, 10, 50);
    } else if (skyboxType === 'image') {
      // Image skybox using equirectangular texture
      if (skyboxImageUrl) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          skyboxImageUrl,
          (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            if (sceneRef.current) {
              sceneRef.current.background = texture;
              sceneRef.current.fog = new THREE.Fog(backgroundColor, 10, 50);
            }
          },
          undefined,
          (error) => {
            console.error('Error loading skybox image:', error);
            addLog('Failed to load skybox image', 'error');
            // Fallback to solid color
            if (sceneRef.current && rendererRef.current) {
              const bgColor = new THREE.Color(backgroundColor);
              sceneRef.current.background = bgColor;
              rendererRef.current.setClearColor(backgroundColor);
            }
          }
        );
      } else {
        // No image URL, fallback to solid color
        const bgColor = new THREE.Color(backgroundColor);
        sceneRef.current.background = bgColor;
        rendererRef.current.setClearColor(backgroundColor);
      }
    } else if (skyboxType === 'stars' || skyboxType === 'galaxy' || skyboxType === 'nebula') {
      // Procedural star field with optional galaxy/nebula effects
      sceneRef.current.background = new THREE.Color(0x000000);
      rendererRef.current.setClearColor(0x000000);
      sceneRef.current.fog = new THREE.Fog(0x000000, 10, 50);
      
      // Create star field
      const starGeometry = new THREE.BufferGeometry();
      const starPositions = new Float32Array(starCount * 3);
      const starColors = new Float32Array(starCount * 3);
      const starSizes = new Float32Array(starCount);
      
      for (let i = 0; i < starCount; i++) {
        // Random position on sphere
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 400 + Math.random() * 100;
        
        starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = radius * Math.cos(phi);
        
        // Star color and size based on type
        if (skyboxType === 'stars') {
          // Simple white stars with slight color variation
          const brightness = 0.8 + Math.random() * 0.2;
          starColors[i * 3] = brightness;
          starColors[i * 3 + 1] = brightness;
          starColors[i * 3 + 2] = brightness;
          starSizes[i] = Math.random() * 2 + 0.5;
        } else if (skyboxType === 'galaxy') {
          // Galaxy with purple/blue tint
          const color = new THREE.Color(galaxyColor);
          const mix = Math.random();
          starColors[i * 3] = color.r * (0.5 + mix * 0.5);
          starColors[i * 3 + 1] = color.g * (0.5 + mix * 0.5);
          starColors[i * 3 + 2] = color.b * (0.5 + mix * 0.5);
          starSizes[i] = Math.random() * 3 + 0.5;
        } else { // nebula
          // Nebula with pink/blue color variation
          const color1 = new THREE.Color(nebulaColor1);
          const color2 = new THREE.Color(nebulaColor2);
          const mix = Math.random();
          starColors[i * 3] = color1.r * mix + color2.r * (1 - mix);
          starColors[i * 3 + 1] = color1.g * mix + color2.g * (1 - mix);
          starColors[i * 3 + 2] = color1.b * mix + color2.b * (1 - mix);
          starSizes[i] = Math.random() * 4 + 1;
        }
      }
      
      starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
      starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
      
      const starMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
      });
      
      const starField = new THREE.Points(starGeometry, starMaterial);
      sceneRef.current.add(starField);
      starFieldRef.current = starField;
      
      // Add nebula clouds for nebula mode
      if (skyboxType === 'nebula') {
        const nebulaGeometry = new THREE.SphereGeometry(500, 32, 32);
        const nebulaMaterial = new THREE.ShaderMaterial({
          uniforms: {
            color1: { value: new THREE.Color(nebulaColor1) },
            color2: { value: new THREE.Color(nebulaColor2) },
            time: { value: 0 }
          },
          vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldPosition = worldPosition.xyz;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform vec3 color1;
            uniform vec3 color2;
            uniform float time;
            varying vec3 vWorldPosition;
            
            // Simple noise function
            float noise(vec3 p) {
              return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
            }
            
            void main() {
              vec3 pos = normalize(vWorldPosition);
              float n = noise(pos * 3.0);
              n += noise(pos * 6.0) * 0.5;
              n += noise(pos * 12.0) * 0.25;
              
              vec3 color = mix(color1, color2, n);
              float alpha = smoothstep(0.3, 0.7, n) * 0.3;
              gl_FragColor = vec4(color, alpha);
            }
          `,
          side: THREE.BackSide,
          transparent: true,
          blending: THREE.AdditiveBlending
        });
        const nebulaMesh = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        sceneRef.current.add(nebulaMesh);
        skyboxMeshRef.current = nebulaMesh;
      }
    }
  }, [backgroundColor, skyboxType, skyboxGradientTop, skyboxGradientBottom, skyboxImageUrl, starCount, galaxyColor, nebulaColor1, nebulaColor2]);

  useEffect(() => {
    if (lightsRef.current.ambient) {
      lightsRef.current.ambient.intensity = ambientLightIntensity;
    }
    if (lightsRef.current.directional) {
      lightsRef.current.directional.intensity = directionalLightIntensity;
    }
  }, [ambientLightIntensity, directionalLightIntensity]);

  // Update shape materials when material controls change
  useEffect(() => {
    if (!objectsRef.current) return;
    const { cubes, octas, tetras, sphere } = objectsRef.current;
    
    // Helper to update material properties
    const updateMaterial = (
      material: THREE.Material,
      color: string,
      wireframe: boolean,
      opacity: number,
      metalness?: number,
      roughness?: number
    ) => {
      if ('color' in material) {
        (material as any).color.setStyle(color);
      }
      if ('wireframe' in material) {
        (material as any).wireframe = wireframe;
      }
      if ('opacity' in material) {
        (material as any).opacity = opacity;
      }
      if (material instanceof THREE.MeshStandardMaterial && metalness !== undefined && roughness !== undefined) {
        material.metalness = metalness;
        material.roughness = roughness;
      }
    };
    
    // Update cubes
    cubes.forEach(cube => {
      updateMaterial(cube.material, cubeColor, cubeWireframe, cubeOpacity, cubeMetalness, cubeRoughness);
    });
    
    // Update octahedrons
    octas.forEach(octa => {
      updateMaterial(octa.material, octahedronColor, octahedronWireframe, octahedronOpacity, octahedronMetalness, octahedronRoughness);
    });
    
    // Update tetrahedrons
    tetras.forEach(tetra => {
      updateMaterial(tetra.material, tetrahedronColor, tetrahedronWireframe, tetrahedronOpacity, tetrahedronMetalness, tetrahedronRoughness);
    });
    
    // Update sphere
    updateMaterial(sphere.material, sphereColor, sphereWireframe, sphereOpacity, sphereMetalness, sphereRoughness);
  }, [cubeColor, cubeWireframe, cubeOpacity, cubeMetalness, cubeRoughness, octahedronColor, octahedronWireframe, octahedronOpacity, octahedronMetalness, octahedronRoughness, tetrahedronColor, tetrahedronWireframe, tetrahedronOpacity, tetrahedronMetalness, tetrahedronRoughness, sphereColor, sphereWireframe, sphereOpacity, sphereMetalness, sphereRoughness]);

  // Enable/disable OrbitControls based on play state
  useEffect(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = !isPlaying;
    }
  }, [isPlaying]);

  // Update camera rig path visualizations when rigs or keyframes change
  useEffect(() => {
    cameraRigs.forEach(rig => {
      updateRigPathVisualization(rig);
    });
  }, [cameraRigs, cameraRigKeyframes, duration]);

  useEffect(() => {
    if (!isPlaying || !rendererRef.current) return;
    const scene = sceneRef.current, cam = cameraRef.current, rend = rendererRef.current;
    const analyser = analyserRef.current;
    const obj = objectsRef.current;
    if (!obj) return;

    const anim = () => {
      if (!isPlaying) return;
      animationRef.current = requestAnimationFrame(anim);
      
      try {
        // FPS calculation
        fpsFrameCount.current++;
        const now = performance.now();
        
        // Initialize fpsLastTime on first frame
        if (fpsLastTime.current === 0) {
          fpsLastTime.current = now;
        }
        
        const elapsed = now - fpsLastTime.current;
        if (elapsed >= FPS_UPDATE_INTERVAL_MS) {
          const currentFps = Math.round((fpsFrameCount.current * FPS_UPDATE_INTERVAL_MS) / elapsed);
          setFps(currentFps);
          fpsFrameCount.current = 0;
          fpsLastTime.current = now;
        }
        
        // Use default frequency values (no audio response) when analyser is unavailable to maintain visual rendering
        let f = DEFAULT_FREQUENCY_VALUES;
        if (analyser) {
          const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        f = getFreq(data);
      }
      const el = (Date.now() - startTimeRef.current) * 0.001;
      // FIX: Prevent NaN if duration is not set (safety check for export)
      const t = duration > 0 ? (el % duration) : el;
      
      // Throttle timeline updates to 10 FPS (instead of 60 FPS) to improve performance
      // Only update currentTime state every TIMELINE_UPDATE_INTERVAL_MS milliseconds
      const timeSinceLastTimelineUpdate = now - lastTimelineUpdateRef.current;
      if (timeSinceLastTimelineUpdate >= TIMELINE_UPDATE_INTERVAL_MS) {
        setCurrentTime(t);
        lastTimelineUpdateRef.current = now;
      }
      
      const type = getCurrentPreset(); // Use keyframe-based preset switching
      const presetSpeed = getCurrentPresetSpeed(); // Get speed multiplier for current preset
      const elScaled = el * presetSpeed; // Apply speed multiplier to animations
      
      // REMOVED: Global camera keyframes interpolation (orphaned feature)
      // Use direct camera settings
      const activeCameraDistance = cameraDistance;
      const activeCameraHeight = cameraHeight;
      const activeCameraRotation = 0;

      // Animate letterbox based on keyframes (only if animation is enabled)
      if (showLetterbox && useLetterboxAnimation && sortedLetterboxKeyframes.length > 0) {
        // Find the current keyframe (most recent one that has passed)
        let currentKeyframeIndex = -1;
        for (let i = 0; i < sortedLetterboxKeyframes.length; i++) {
          if (t >= sortedLetterboxKeyframes[i].time) {
            currentKeyframeIndex = i;
          }
        }
        
        // Helper to get current target size
        // If we're before the first keyframe, start at 100 (fully closed) if first keyframe will open (targetSize < 100)
        // Otherwise start at the first keyframe's target
        const getCurrentSize = () => {
          if (currentKeyframeIndex >= 0) {
            return sortedLetterboxKeyframes[currentKeyframeIndex].targetSize;
          } else if (sortedLetterboxKeyframes.length > 0) {
            // Before first keyframe - if first keyframe is < 100, start at 100 (closed), else use its value
            const firstKeyframeTarget = sortedLetterboxKeyframes[0].targetSize;
            return firstKeyframeTarget < 100 ? 100 : firstKeyframeTarget;
          }
          return 0;
        };
        
        // Check if we should be animating toward the next keyframe
        if (currentKeyframeIndex < sortedLetterboxKeyframes.length - 1) {
          const nextKeyframe = sortedLetterboxKeyframes[currentKeyframeIndex + 1];
          const timeUntilNextKeyframe = nextKeyframe.time - t;
          
          // Use the next keyframe's invert setting during animation
          setActiveLetterboxInvert(nextKeyframe.invert);
          
          // If we're within the duration window before the next keyframe, animate toward it
          if (timeUntilNextKeyframe <= nextKeyframe.duration) {
            if (nextKeyframe.mode === 'smooth') {
              // Calculate progress (0 at start of animation, 1 at keyframe time)
              const progress = 1 - (timeUntilNextKeyframe / nextKeyframe.duration);
              const easeProgress = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2; // easeInOutQuad
              
              const startSize = getCurrentSize();
              const newSize = startSize + (nextKeyframe.targetSize - startSize) * easeProgress;
              setLetterboxSize(Math.round(newSize));
            } else {
              // Instant mode - jump immediately to target size
              setLetterboxSize(nextKeyframe.targetSize);
            }
          } else {
            // Not in animation window, hold at current keyframe's target
            setLetterboxSize(getCurrentSize());
            // Use current keyframe's invert when not animating
            if (currentKeyframeIndex >= 0) {
              setActiveLetterboxInvert(sortedLetterboxKeyframes[currentKeyframeIndex].invert);
            } else {
              // Before first keyframe, use first keyframe's invert setting
              setActiveLetterboxInvert(sortedLetterboxKeyframes[0].invert);
            }
          }
        } else {
          // We're past the last keyframe, hold at its target
          setLetterboxSize(getCurrentSize());
          if (currentKeyframeIndex >= 0) {
            setActiveLetterboxInvert(sortedLetterboxKeyframes[currentKeyframeIndex].invert);
          }
        }
      }

      // Calculate camera shake offset (from Effects tab shake events only)
      let shakeX = 0, shakeY = 0, shakeZ = 0;
      for (const shake of cameraShakes) {
        const timeSinceShake = t - shake.time;
        if (timeSinceShake >= 0 && timeSinceShake < shake.duration) {
          const progress = timeSinceShake / shake.duration;
          const decay = 1 - progress; // Linear decay
          const frequency = cameraShakeFrequency; // Use configurable frequency
          const amplitude = shake.intensity * decay * cameraShakeIntensity; // Apply intensity multiplier
          shakeX += Math.sin(timeSinceShake * frequency) * amplitude * 0.1;
          shakeY += Math.cos(timeSinceShake * frequency * 1.3) * amplitude * 0.1;
          shakeZ += Math.sin(timeSinceShake * frequency * 0.7) * amplitude * 0.05;
        }
      }

      // PHASE 4: Process parameter events for flash effects
      let bgFlash = 0;
      let vignetteFlash = 0;
      let saturationFlash = 0;
      let eventShakeX = 0, eventShakeY = 0, eventShakeZ = 0;
      
      // Reset Post-FX event accumulation values
      let vignetteStrengthPulse = 0;
      let contrastBurst = 0;
      let colorTintFlash = { r: 0, g: 0, b: 0 };
      
      for (const event of parameterEvents) {
        let shouldTrigger = false;
        let effectStartTime = event.startTime;
        const eventDuration = event.endTime - event.startTime;
        
        if (event.mode === 'manual') {
          // Manual mode: trigger between startTime and endTime
          shouldTrigger = t >= event.startTime && t < event.endTime;
        } else if (event.mode === 'automated') {
          // Automated mode: trigger when audio track exceeds threshold
          if (event.audioTrackId) {
            const track = audioTracksRef.current.find(tr => tr.id === event.audioTrackId);
            if (track && track.analyser) {
              // Get frequency data from the specific track
              const trackData = new Uint8Array(track.analyser.frequencyBinCount);
              track.analyser.getByteFrequencyData(trackData);
              const trackFreq = getFreq(trackData);
              
              // Check if bass frequency exceeds threshold
              const threshold = event.threshold || 0.5;
              if (trackFreq.bass > threshold) {
                // Start or continue the effect
                if (!activeAutomatedEventsRef.current.has(event.id)) {
                  activeAutomatedEventsRef.current.set(event.id, t);
                }
                effectStartTime = activeAutomatedEventsRef.current.get(event.id)!;
                const timeSinceStart = t - effectStartTime;
                shouldTrigger = timeSinceStart < eventDuration;
              } else {
                // Bass dropped below threshold, clean up if effect was active
                activeAutomatedEventsRef.current.delete(event.id);
              }
            }
          }
        }
        
        if (shouldTrigger) {
          const timeSinceEvent = t - effectStartTime;
          const progress = timeSinceEvent / eventDuration;
          // Ease out cubic for smooth return
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const intensity = 1 - easeOut;
          
          // Background flash
          if (event.parameters.backgroundFlash !== undefined) {
            bgFlash += event.parameters.backgroundFlash * intensity;
          }
          
          // Vignette pulse
          if (event.parameters.vignettePulse !== undefined) {
            vignetteFlash += event.parameters.vignettePulse * intensity;
          }
          
          // Saturation burst
          if (event.parameters.saturationBurst !== undefined) {
            saturationFlash += event.parameters.saturationBurst * intensity;
          }
          
          // Camera shake from automated parameter events
          if (event.parameters.cameraShake !== undefined) {
            const decay = intensity;
            const frequency = 50;
            const amplitude = event.parameters.cameraShake * decay;
            eventShakeX += Math.sin(timeSinceEvent * frequency) * amplitude * 0.1;
            eventShakeY += Math.cos(timeSinceEvent * frequency * 1.3) * amplitude * 0.1;
            eventShakeZ += Math.sin(timeSinceEvent * frequency * 0.7) * amplitude * 0.05;
          }
          
          // Post-FX: Vignette strength pulse
          if (event.parameters.vignetteStrengthPulse !== undefined) {
            vignetteStrengthPulse += event.parameters.vignetteStrengthPulse * intensity;
          }
          
          // Post-FX: Contrast burst
          if (event.parameters.contrastBurst !== undefined) {
            contrastBurst += event.parameters.contrastBurst * intensity;
          }
          
          // Post-FX: Color tint flash
          if (event.parameters.colorTintFlash !== undefined) {
            const tint = event.parameters.colorTintFlash;
            colorTintFlash.r += tint.r * tint.intensity * intensity;
            colorTintFlash.g += tint.g * tint.intensity * intensity;
            colorTintFlash.b += tint.b * tint.intensity * intensity;
          }
        }
      }
      
      // Store Post-FX values in refs for potential use in rendering
      activeVignetteStrengthPulseRef.current = vignetteStrengthPulse;
      activeContrastBurstRef.current = contrastBurst;
      activeColorTintFlashRef.current = colorTintFlash;
      
      // Combine manual shake events with automated parameter event shakes
      shakeX += eventShakeX;
      shakeY += eventShakeY;
      shakeZ += eventShakeZ;
      
      // Store active parameter values in refs (not state to avoid re-renders)
      activeBackgroundFlashRef.current = bgFlash;
      activeVignettePulseRef.current = vignetteFlash;
      activeSaturationBurstRef.current = saturationFlash;

      // Manage timeline-based particle emitters
      if (particleManagerRef.current && sceneRef.current) {
        particleEmitterKeyframes.forEach(kf => {
          const isInTimeRange = t >= kf.time && t < (kf.time + kf.duration);
          const isActive = activeEmitterIds.current.has(kf.id);
          
          if (isInTimeRange && !isActive && kf.enabled) {
            // Spawn this emitter
            const emitter = new ParticleEmitter({
              id: `timeline-emitter-${kf.id}`,
              name: `Timeline Emitter ${kf.id}`,
              enabled: true,
              emissionRate: kf.emissionRate,
              maxParticles: kf.maxParticles,
              lifetime: kf.lifetime,
              lifetimeVariance: 0.2,
              spawnPosition: new THREE.Vector3(kf.spawnX, kf.spawnY, kf.spawnZ),
              spawnRadius: kf.spawnRadius,
              spawnVelocity: new THREE.Vector3(0, 2, 0),
              velocityVariance: 1,
              startSize: kf.startSize,
              endSize: kf.endSize,
              startColor: new THREE.Color(kf.startColor),
              endColor: new THREE.Color(kf.endColor),
              startOpacity: 1,
              endOpacity: 0,
              gravity: new THREE.Vector3(0, -1, 0),
              drag: 0.1,
              audioReactive: true,
              audioTrack: kf.audioTrack,
              audioAffects: ['size'] as any,
              audioIntensity: 0.5,
              particleShape: kf.shape,
              wireframe: true,
              rotationSpeed: new THREE.Vector3(1, 1, 0)
            }, sceneRef.current);
            
            particleManagerRef.current.addEmitter(emitter);
            activeEmitterIds.current.add(kf.id);
          } else if (!isInTimeRange && isActive) {
            // Remove this emitter
            particleManagerRef.current.removeEmitter(`timeline-emitter-${kf.id}`);
            activeEmitterIds.current.delete(kf.id);
          }
        });
      }

      // Update particle system
      if (particleManagerRef.current && analyser) {
        const deltaTime = elapsed / 1000; // Convert to seconds
        particleManagerRef.current.update(deltaTime, {
          bass: f.bass,
          mids: f.mids,
          highs: f.highs
        });
      }

      // Handle preset transitions with blend effect
      if (prevAnimRef.current === null) {
        // First animation - no fade in, start at full opacity
        prevAnimRef.current = type;
        transitionRef.current = FULL_OPACITY;
      } else if (type !== prevAnimRef.current) {
        // Transitioning to a new preset - fade in from 0
        transitionRef.current = 0;
        prevAnimRef.current = type;
      }
      if (transitionRef.current < FULL_OPACITY) {
        transitionRef.current = Math.min(FULL_OPACITY, transitionRef.current + TRANSITION_SPEED);
      }
      const blend = transitionRef.current;

      if (type === 'empty') {
        // Empty preset - hide all shapes, only show camera position
        cam.position.set(0 + shakeX, activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        
        // Hide sphere
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
        
        // Hide all cubes
        obj.cubes.forEach((c) => {
          c.position.set(0, -1000, 0);
          c.scale.set(0.001, 0.001, 0.001);
          c.material.opacity = 0;
        });
        
        // Hide all octahedrons (except environment ones at indices 100-114)
        obj.octas.slice(0, 30).forEach((o) => {
          o.position.set(0, -1000, 0);
          o.scale.set(0.001, 0.001, 0.001);
          o.material.opacity = 0;
        });
        
        // Hide all tetrahedrons
        obj.tetras.forEach((t) => {
          t.position.set(0, -1000, 0);
          t.scale.set(0.001, 0.001, 0.001);
          t.material.opacity = 0;
        });
      } else if (type === 'orbit') {
        // PR 4: Solver pattern - extracted to orbitSolver.ts
        solveOrbit({
          time: elScaled,
          audio: { bass: f.bass, mids: f.mids, highs: f.highs },
          poses: new Map(), // Empty for now (will use in PR 5-8)
          pool: {
            cubes: obj.cubes,
            octahedrons: obj.octas,
            tetrahedrons: obj.tetras,
            toruses: obj.toruses,
            planes: obj.planes,
            sphere: obj.sphere
          },
          blend,
          camera: cam,
          rotationSpeed: KEYFRAME_ONLY_ROTATION_SPEED,
          cameraDistance: activeCameraDistance,
          cameraHeight: activeCameraHeight,
          cameraRotation: activeCameraRotation,
          shake: { x: shakeX, y: shakeY, z: shakeZ },
          colors: {
            cube: cubeColor,
            octahedron: octahedronColor,
            tetrahedron: tetrahedronColor,
            sphere: sphereColor
          }
        });
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'explosion') {
        cam.position.set(0 + shakeX, activeCameraHeight + shakeY, activeCameraDistance - f.bass*10 + shakeZ);
        cam.lookAt(0,0,0);
        obj.sphere.position.set(0, 0, 0);
        const ss = 1.5+f.bass+f.mids*0.5;
        obj.sphere.scale.set(ss,ss,ss);
        obj.sphere.rotation.x += 0.005;
        obj.sphere.rotation.y += 0.01;
        obj.sphere.rotation.z = 0;
        obj.sphere.material.opacity = (0.4+f.bass*0.4) * blend;
        obj.sphere.material.color.setStyle(sphereColor);
        obj.sphere.material.wireframe = true;
        obj.cubes.forEach((c,i) => {
          const rad = 15+f.bass*10;
          const a = (i/obj.cubes.length)*Math.PI*2;
          c.position.set(Math.cos(a+el)*rad, Math.sin(a+el)*rad, Math.cos(el*2+i)*5);
          c.rotation.x += 0.05+f.bass*0.1;
          c.rotation.y += 0.05+f.bass*0.1;
          const s = 2 + f.bass * 1.5;
          c.scale.set(s,s,s);
          c.rotation.z = 0;
          c.material.opacity = (0.6+f.bass*0.4) * blend;
          c.material.color.setStyle(cubeColor);
          c.material.wireframe = true;
        });
        obj.octas.forEach((o,i) => {
          const radius = 10 + i * 0.5 + f.mids * 8;
          const angle = el + i;
          o.position.x = Math.cos(angle) * radius;
          o.position.y = Math.sin(angle) * radius;
          o.position.z = 0;
          o.rotation.x += 0.1 + f.mids * 0.05;
          o.rotation.y += 0.1 + f.mids * 0.03;
          o.rotation.z = 0;
          const s = 1.2 + f.mids * 0.8;
          o.scale.set(s,s,s);
          o.material.opacity = (0.4 + f.mids * 0.5) * blend;
          o.material.color.setStyle(octahedronColor);
          o.material.wireframe = true;
        });
        obj.tetras.forEach((tr,i) => {
          const sp = 0.5+i*0.1, rad = 3+f.highs*5;
          tr.position.set(Math.cos(el*sp+i)*rad, Math.sin(el*sp*1.3+i)*rad, Math.sin(el*sp*0.7+i)*rad);
          tr.rotation.x += 0.03+f.highs*0.1;
          tr.rotation.y += 0.02+f.highs*0.08;
          tr.rotation.z = 0;
          const s = 0.5 + f.highs * 0.5;
          tr.scale.set(s,s,s);
          tr.material.opacity = (0.4+f.highs*0.6) * blend;
          tr.material.color.setStyle(tetrahedronColor);
          tr.material.wireframe = true;
        });
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'chill') {
        cam.position.set(0 + shakeX, 5 + activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0,0,0);
        obj.cubes.forEach((c,i) => {
          const a = (i/obj.cubes.length)*Math.PI*2;
          const rad = 6+Math.sin(el*0.5+i)*1;
          c.position.set(Math.cos(a+el*0.3)*rad, Math.sin(el*0.4+i)*1.5, Math.sin(a+el*0.3)*rad);
          c.rotation.x += 0.005;
          c.rotation.y += 0.005;
          const s = 0.8+f.bass*0.4;
          c.scale.set(s,s,s);
          c.material.opacity = (0.4+f.bass*0.3) * blend;
          c.material.color.setStyle(cubeColor);
        });
        obj.octas.forEach((o,i) => {
          o.rotation.x += 0.008 + f.mids * 0.05;
          o.rotation.y += 0.005 + f.mids * 0.03;
          o.position.y = Math.sin(el*0.6+i*0.3)*2 + f.mids * 2;
          const s = 0.8+f.mids*0.3;
          o.scale.set(s,s,s);
          o.material.opacity = (0.3+f.mids*0.3) * blend;
          o.material.color.setStyle(octahedronColor);
        });
        obj.tetras.forEach((t,i) => {
          const ringAngle = (i/obj.tetras.length)*Math.PI*2;
          const ringRadius = 10+Math.sin(el*0.3+i)*2;
          t.position.set(
            Math.cos(ringAngle+el*0.2)*ringRadius,
            Math.sin(el*0.5+i*0.5)*3,
            Math.sin(ringAngle+el*0.2)*ringRadius
          );
          t.rotation.x += 0.01+f.highs*0.02;
          t.rotation.y += 0.015+f.highs*0.03;
          const s = 0.6+f.highs*0.4;
          t.scale.set(s,s,s);
          t.material.opacity = (0.25+f.highs*0.35) * blend;
          t.material.color.setStyle(tetrahedronColor);
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, Math.sin(el*0.4)*2, 0);
        const sphereSize = 2.5+f.bass*0.5+f.mids*0.3;
        obj.sphere.scale.set(sphereSize,sphereSize,sphereSize);
        obj.sphere.rotation.x += 0.003;
        obj.sphere.rotation.y += 0.005;
        obj.sphere.material.color.setStyle(sphereColor);
        obj.sphere.material.opacity = (0.2+f.bass*0.2) * blend;
        obj.sphere.material.wireframe = false;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'wave') {
        const pathProgress = elScaled * 2;
        cam.position.set(Math.sin(pathProgress * 0.3) * 3 + shakeX, Math.cos(pathProgress * 0.4) * 2 + 2 + activeCameraHeight + shakeY, activeCameraDistance - 5 + shakeZ);
        cam.lookAt(Math.sin((pathProgress + 2) * 0.3) * 3, Math.cos((pathProgress + 2) * 0.4) * 2, -10);
        obj.octas.slice(0, 30).forEach((segment, i) => {
          const segmentTime = elScaled * 3 - i * 0.3;
          const waveValue = f.bass * Math.sin(segmentTime * 10 + i) + f.mids * Math.cos(segmentTime * 7 + i * 0.5) + f.highs * Math.sin(segmentTime * 15 + i * 2);
          const x = Math.sin(segmentTime * 0.3) * 3;
          const y = waveValue * 3;
          const z = -i * 1.5;
          segment.position.set(x, y, z);
          const thickness = 0.4 + f.bass * 0.4;
          segment.scale.set(thickness, thickness, 1);
          segment.rotation.x = 0;
          segment.rotation.y = 0;
          segment.rotation.z = 0;
          segment.material.color.setStyle(octahedronColor);
          segment.material.opacity = (0.8 + f.bass * 0.2) * blend;
          segment.material.wireframe = false;
        });
        const vectorscopePositions = [{x: -8, y: 5, z: -10}, {x: 8, y: -3, z: -15}, {x: -5, y: -5, z: -20}, {x: 10, y: 8, z: -25}, {x: -10, y: 2, z: -30}, {x: 6, y: -8, z: -35}];
        obj.cubes.forEach((c, i) => {
          const scopeIndex = i % vectorscopePositions.length;
          const scopePos = vectorscopePositions[scopeIndex];
          const t = elScaled * 5 + i * 0.8;
          const freqX = 2 + scopeIndex;
          const freqY = 3 + scopeIndex * 0.5;
          const radius = 2 + f.mids * 1.5;
          const tangleX = Math.sin(t * freqX + f.bass * 5) * radius;
          const tangleY = Math.cos(t * freqY + f.highs * 3) * radius;
          c.position.x = scopePos.x + tangleX;
          c.position.y = scopePos.y + tangleY;
          c.position.z = scopePos.z + Math.sin(t) * 0.5;
          const s = 0.4 + f.mids * 0.5;
          c.scale.set(s, s, s);
          c.rotation.x = 0;
          c.rotation.y = 0;
          c.rotation.z = t;
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (0.8 + f.mids * 0.2) * blend;
          c.material.wireframe = false;
        });
        obj.tetras.forEach((halo, i) => {
          const scopeIndex = Math.floor(i / 5) % vectorscopePositions.length;
          const ringIndex = i % 5;
          const scopePos = vectorscopePositions[scopeIndex];
          const angle = (ringIndex / 5) * Math.PI * 2 + elScaled * 2;
          const haloRadius = 2.5 + f.highs * 1.5;
          halo.position.x = scopePos.x + Math.cos(angle) * haloRadius;
          halo.position.y = scopePos.y + Math.sin(angle) * haloRadius;
          halo.position.z = scopePos.z;
          const s = 0.4 + f.highs * 0.6;
          halo.scale.set(s, s, s);
          halo.rotation.x = 0;
          halo.rotation.y = angle;
          halo.rotation.z = 0;
          halo.material.color.setStyle(tetrahedronColor);
          halo.material.opacity = (0.5 + f.highs * 0.4) * blend;
          halo.material.wireframe = true;
        });
        obj.octas.slice(100).forEach((marker, i) => {
          marker.position.set((i % 2 === 0 ? -1 : 1) * (10 + i * 2), Math.sin(el + i) * 2, -10 - i * 5);
          const s = 1 + f.mids * 0.5;
          marker.scale.set(s, s, s);
          marker.rotation.x = 0;
          marker.rotation.y = el + i;
          marker.rotation.z = 0;
          marker.material.color.setStyle(octahedronColor);
          marker.material.opacity = (0.3 + f.mids * 0.2) * blend;
          marker.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'spiral') {
        const a = activeCameraRotation;
        cam.position.set(Math.cos(a)*activeCameraDistance + shakeX, Math.sin(el*0.2)*5 + activeCameraHeight + shakeY, Math.sin(a)*activeCameraDistance + shakeZ);
        cam.lookAt(0,0,0);
        obj.cubes.forEach((c,i) => {
          const sa = el+i*0.5;
          const sr = 5+i*0.8;
          c.position.set(Math.cos(sa)*sr, Math.sin(el*2+i)*3+i-4, Math.sin(sa)*sr);
          c.rotation.x += 0.03;
          c.rotation.y += 0.02;
          const s = 1.5 + f.bass * 1.2;
          c.scale.set(s,s,s);
          c.material.opacity = (0.5 + f.bass * 0.4) * blend;
          c.material.color.setStyle(cubeColor);
        });
        obj.octas.forEach((o,i) => {
          const angle = elScaled * 2 + i * 0.3;
          const radius = 3 + Math.sin(el + i) * 2 + f.mids * 2;
          o.position.x = Math.cos(angle) * radius;
          o.position.y = i * 0.5 - 5;
          o.position.z = Math.sin(angle) * radius;
          o.rotation.x += 0.02 + f.mids * 0.05;
          o.rotation.y += 0.02 + f.mids * 0.03;
          const s = 1 + f.mids * 0.7;
          o.scale.set(s,s,s);
          o.material.opacity = (0.4 + f.mids * 0.4) * blend;
          o.material.color.setStyle(octahedronColor);
        });
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'pulse') {
        cam.position.set(0 + shakeX, activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0,0,0);
        obj.cubes.forEach((c,i) => {
          const gridX = (i % 4 - 1.5) * 5;
          const gridY = (Math.floor(i / 4) - 1) * 5;
          c.position.set(gridX, gridY, Math.sin(elScaled * 3 + i) * (2 + f.bass * 5));
          c.rotation.x = el + i;
          c.rotation.y = elScaled * 1.5;
          const s = 1.5 + f.bass * 2.5;
          c.scale.set(s,s,s);
          c.material.opacity = (0.5 + f.bass * 0.5) * blend;
          c.material.color.setStyle(cubeColor);
        });
        obj.octas.forEach((o,i) => {
          const gridPos = i % 16;
          const x = (gridPos % 4 - 1.5) * 4;
          const y = (Math.floor(gridPos / 4) - 1.5) * 4;
          o.position.set(x, y, Math.cos(elScaled * 2 + i * 0.1) * (1 + f.mids * 3));
          o.rotation.x += 0.02 + f.mids * 0.05;
          o.rotation.y += 0.01 + f.mids * 0.03;
          o.rotation.z += 0.05;
          const s = 0.8 + f.mids * 0.8;
          o.scale.set(s,s,s);
          o.material.opacity = (0.4 + f.mids * 0.5) * blend;
          o.material.color.setStyle(octahedronColor);
        });
        
        // Hide unused toruses, tetras, planes, and sphere
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        obj.sphere.position.set(0, -1000, 0); obj.sphere.scale.set(0.001, 0.001, 0.001); obj.sphere.material.opacity = 0;
      } else if (type === 'vortex') {
        cam.position.set(0 + shakeX, 15 + activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0,0,0);
        obj.cubes.forEach((c,i) => {
          const angle = elScaled * 2 + i * 0.8;
          const radius = 3 + i * 1.5 + f.bass * 5;
          const height = Math.sin(el + i * 0.5) * 10;
          c.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
          c.rotation.x += 0.1;
          c.rotation.y += 0.15;
          const s = 1.8 + f.bass * 1.5;
          c.scale.set(s,s,s);
          c.material.opacity = (0.6 + f.bass * 0.4) * blend;
          c.material.color.setStyle(cubeColor);
        });
        obj.octas.forEach((o,i) => {
          const angle = -elScaled * 3 + i * 0.5;
          const radius = 5 + Math.sin(el + i) * 3 + f.mids * 4;
          o.position.set(Math.cos(angle) * radius, (i % 10 - 5) * 2, Math.sin(angle) * radius);
          o.rotation.x += 0.08 + f.mids * 0.05;
          o.rotation.y += 0.05 + f.mids * 0.03;
          o.rotation.z += 0.05;
          const s = 1.2 + f.mids * 0.8;
          o.scale.set(s,s,s);
          o.material.opacity = (0.5 + f.mids * 0.4) * blend;
          o.material.color.setStyle(octahedronColor);
        });
        
        // Hide unused toruses, tetras, planes, and sphere
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        obj.sphere.position.set(0, -1000, 0); obj.sphere.scale.set(0.001, 0.001, 0.001); obj.sphere.material.opacity = 0;
      } else if (type === 'seiryu') {
        // Seiryu (Azure Dragon / 青龍) - Traditional Eastern dragon with very long serpentine body
        // Features: Extended sinuous body using 40 cubes for performance, deer-like antlers, whiskers, mane, scales, and a magical pearl
        // Note: Mountains should be added via the Environments tab for better customization
        
        const rotationSpeed = KEYFRAME_ONLY_ROTATION_SPEED;
        
        // === EXTENDED DRAGON BODY ===
        // Uses 40 cubes for the dragon body - optimized for performance while maintaining aesthetic
        const totalBodySegments = 40;
        
        // Store body positions for attachments
        const bodyPositions: { x: number; y: number; z: number; rx: number; ry: number }[] = [];
        
        // Guard against edge cases
        if (totalBodySegments < 2) return;
        
        // Dynamic camera that follows the dragon's sweeping movement
        const camFollowX = Math.sin(elScaled * 0.25) * 8;
        const camFollowY = 10 + Math.cos(elScaled * 0.12) * 4;
        cam.position.set(
          Math.sin(rotationSpeed + activeCameraRotation) * 12 + camFollowX + shakeX,
          camFollowY + activeCameraHeight + shakeY,
          activeCameraDistance + 15 + shakeZ
        );
        cam.lookAt(camFollowX * 0.2, -2, -35);
        
        // === Calculate body positions for segments ===
        for (let i = 0; i < totalBodySegments; i++) {
          const progress = i / (totalBodySegments - 1); // 0 to 1 from head to tail
          const segmentPhase = elScaled * 1.0 - i * 0.2; // Wave propagation with tighter spacing
          
          // Extended S-curve serpentine motion
          const waveAmplitude = 10 + f.bass * 5;
          const verticalWave = 5 + f.mids * 3;
          
          // Primary horizontal wave (large S-shape)
          const x = Math.sin(segmentPhase) * waveAmplitude * (0.3 + progress * 0.7);
          // Secondary vertical wave (undulating up/down)
          const y = Math.sin(segmentPhase * 0.6 + progress * Math.PI * 1.5) * verticalWave + 
                    Math.cos(segmentPhase * 0.25) * 2;
          // Z progression - dragon body extends far into the scene
          const z = progress * -80 + Math.sin(segmentPhase * 0.3) * 5;
          
          // Calculate rotation to follow the body curve
          const nextProgress = Math.min(progress + 0.04, 1);
          const nextPhase = elScaled * 1.0 - (i + 1) * 0.2;
          const nextX = Math.sin(nextPhase) * waveAmplitude * (0.3 + nextProgress * 0.7);
          const nextY = Math.sin(nextPhase * 0.6 + nextProgress * Math.PI * 1.5) * verticalWave;
          const nextZ = nextProgress * -80;
          
          const dx = nextX - x;
          const dy = nextY - y;
          const dz = nextZ - z;
          const rx = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
          const ry = Math.atan2(dx, dz);
          
          bodyPositions.push({ x, y, z, rx, ry });
        }
        
        // === DRAGON BODY - 40 CUBES ===
        obj.cubes.slice(0, totalBodySegments).forEach((c, i) => {
          const bp = bodyPositions[i];
          c.position.set(bp.x, bp.y, bp.z);
          c.rotation.x = bp.rx;
          c.rotation.y = bp.ry;
          c.rotation.z = Math.sin(elScaled * 1.0 - i * 0.2) * 0.15;
          
          // Scale: large head, tapering body, slight tail flare
          const progress = i / (totalBodySegments - 1);
          const isHead = i === 0;
          const isTail = i >= totalBodySegments - 3;
          let baseScale;
          if (isHead) {
            baseScale = 4.5; // Large majestic head
          } else if (isTail) {
            baseScale = 1.5 + f.bass * 0.4 + (totalBodySegments - 1 - i) * 0.15; // Tail flare
          } else {
            baseScale = 3.5 - progress * 2.0; // Gradual taper
          }
          const scaleSize = baseScale + f.bass * 0.4;
          c.scale.set(scaleSize * 1.3, scaleSize * 1.0, scaleSize * 1.8);
          
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (0.9 + f.bass * 0.1) * blend;
          c.material.wireframe = false;
        });
        
        // === Hide unused body cubes ===
        obj.cubes.slice(totalBodySegments).forEach((c) => {
          c.position.set(0, -1000, 0);
          c.scale.set(0.001, 0.001, 0.001);
          c.material.opacity = 0;
        });
        
        const head = obj.cubes[0];
        const headPos = bodyPositions[0];
        
        // === ANTLERS (Tetras 0-1) - Deer-like branching antlers ===
        obj.tetras.slice(0, 2).forEach((antler, i) => {
          const side = i === 0 ? 1 : -1;
          const antlerSway = Math.sin(elScaled * 2 + i) * 0.1;
          antler.position.x = head.position.x + side * 3;
          antler.position.y = head.position.y + 4 + f.highs * 0.6;
          antler.position.z = head.position.z + 1;
          antler.rotation.x = -0.6 + antlerSway;
          antler.rotation.y = side * 0.7 + headPos.ry;
          antler.rotation.z = side * 0.5;
          const antlerSize = 2.2 + f.highs * 0.5;
          antler.scale.set(antlerSize * 0.6, antlerSize * 3.5, antlerSize * 0.6);
          antler.material.color.setStyle(tetrahedronColor);
          antler.material.opacity = 0.95 * blend;
          antler.material.wireframe = false;
        });
        
        // === WHISKERS (Tetras 2-5) - Flowing whiskers/tendrils ===
        obj.tetras.slice(2, 6).forEach((whisker, i) => {
          const side = i < 2 ? 1 : -1;
          const whiskerIndex = i % 2;
          const flowPhase = elScaled * 3 + i * 0.5;
          const flowAmount = Math.sin(flowPhase) * 1.0;
          
          whisker.position.x = head.position.x + side * (2 + whiskerIndex * 0.6);
          whisker.position.y = head.position.y - 0.5 + whiskerIndex * 0.4;
          whisker.position.z = head.position.z + 3 + flowAmount;
          whisker.rotation.x = 0.4 + flowAmount * 0.25;
          whisker.rotation.y = side * (0.9 + flowAmount * 0.35) + headPos.ry;
          whisker.rotation.z = side * 0.25;
          const whiskerLen = 3.5 + f.highs * 1.0 - whiskerIndex * 0.6;
          whisker.scale.set(0.2, whiskerLen, 0.2);
          whisker.material.color.setStyle(tetrahedronColor);
          whisker.material.opacity = (0.8 + f.highs * 0.2) * blend;
          whisker.material.wireframe = false;
        });
        
        // === MANE/SPINES (Tetras 6-25) - Flowing mane along the body ===
        const maneCount = 20;
        obj.tetras.slice(6, 6 + maneCount).forEach((spine, i) => {
          // Distribute spines evenly along the body
          const spineBodyIdx = Math.floor((i / (maneCount - 1)) * Math.min(totalBodySegments - 1, 35));
          const bp = bodyPositions[Math.min(spineBodyIdx, bodyPositions.length - 1)];
          const flowPhase = elScaled * 2 - i * 0.15;
          const flowWave = Math.sin(flowPhase) * 0.6;
          
          spine.position.x = bp.x + Math.sin(bp.ry + Math.PI / 2) * 0.4;
          spine.position.y = bp.y + 2.2 + flowWave * 0.6 + f.mids * 0.4;
          spine.position.z = bp.z;
          spine.rotation.x = -0.9 + flowWave * 0.35 + bp.rx;
          spine.rotation.y = bp.ry + flowWave * 0.25;
          spine.rotation.z = flowWave * 0.35;
          const spineSize = 1.8 - i * 0.03 + f.mids * 0.35;
          spine.scale.set(spineSize * 0.5, spineSize * 2.2, spineSize * 0.4);
          spine.material.color.setStyle(tetrahedronColor);
          spine.material.opacity = (0.85 + f.mids * 0.15) * blend;
          spine.material.wireframe = false;
        });
        
        // === CLOUDS (Tetras 26-45) - Mystical clouds the dragon weaves through ===
        const cloudCount = 20;
        obj.tetras.slice(6 + maneCount, 6 + maneCount + cloudCount).forEach((cloud, i) => {
          const layer = Math.floor(i / 5);
          const cloudPhase = elScaled * 0.15 + i * 0.8;
          const driftY = Math.cos(cloudPhase * 0.5) * 3;
          
          cloud.position.x = ((i * 16 + elScaled * 3) % 100) - 50;
          cloud.position.y = 15 + layer * 5 + driftY;
          cloud.position.z = -30 - layer * 10 + Math.sin(cloudPhase) * 5;
          cloud.rotation.x = elScaled * 0.04 + i * 0.2;
          cloud.rotation.y = elScaled * 0.06;
          const cloudSize = 4.0 + (i % 4) * 1.2;
          cloud.scale.set(cloudSize * 2, cloudSize * 0.6, cloudSize * 1.5);
          cloud.material.color.setStyle(tetrahedronColor);
          cloud.material.opacity = (0.2 + f.highs * 0.12) * blend;
          cloud.material.wireframe = false;
        });
        
        // === Hide unused tetras ===
        obj.tetras.slice(6 + maneCount + cloudCount).forEach((t) => {
          t.position.set(0, -1000, 0);
          t.scale.set(0.001, 0.001, 0.001);
          t.material.opacity = 0;
        });
        
        // === SCALES/PARTICLES (Octas 0-49) - Shimmering scales around the dragon ===
        const scaleCount = 50;
        obj.octas.slice(0, scaleCount).forEach((particle, i) => {
          // Particles follow along the dragon's path
          const followIdx = Math.floor((i / scaleCount) * (totalBodySegments - 1));
          const bp = bodyPositions[Math.min(followIdx, bodyPositions.length - 1)];
          const orbitPhase = elScaled * 3 + i * (Math.PI * 2 / 25);
          const orbitRadius = 2.5 + Math.sin(elScaled + i) * 1.2;
          
          particle.position.x = bp.x + Math.cos(orbitPhase) * orbitRadius;
          particle.position.y = bp.y + Math.sin(orbitPhase) * orbitRadius * 0.6;
          particle.position.z = bp.z + Math.sin(orbitPhase * 0.5) * 2;
          particle.rotation.x = elScaled * 2.5;
          particle.rotation.y = elScaled * 2;
          const particleSize = 0.4 + f.mids * 0.3;
          particle.scale.set(particleSize, particleSize, particleSize);
          particle.material.color.setStyle(octahedronColor);
          particle.material.opacity = (0.5 + f.mids * 0.3) * blend;
          particle.material.wireframe = false;
        });
        
        // === Hide unused octahedrons ===
        obj.octas.slice(scaleCount).forEach((envOcta) => {
          envOcta.position.set(0, -1000, 0);
          envOcta.scale.set(0.001, 0.001, 0.001);
          envOcta.material.opacity = 0;
        });
        
        // === DRAGON PEARL (Sphere) - The magical pearl the dragon chases ===
        const pearlOrbitPhase = elScaled * 0.6;
        const pearlDistance = 12 + Math.sin(elScaled * 0.4) * 5;
        const pearlX = head.position.x + Math.sin(pearlOrbitPhase) * pearlDistance;
        const pearlY = head.position.y + 6 + Math.cos(pearlOrbitPhase * 1.2) * 4;
        const pearlZ = head.position.z + 10 + Math.cos(pearlOrbitPhase) * 6;
        
        obj.sphere.position.set(pearlX, pearlY, pearlZ);
        const pearlSize = 2.0 + f.bass * 0.7 + Math.sin(elScaled * 2.5) * 0.3;
        obj.sphere.scale.set(pearlSize, pearlSize, pearlSize);
        obj.sphere.rotation.x = elScaled * 1.5;
        obj.sphere.rotation.y = elScaled * 2;
        obj.sphere.material.color.setStyle(sphereColor);
        obj.sphere.material.opacity = (0.9 + f.bass * 0.1) * blend;
        obj.sphere.material.wireframe = false;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'hammerhead') {
        // Hammerhead Shark - Distinctive T-shaped head with smooth predatory swimming
        // GEOMETRY ALLOCATION:
        // Cubes 0-2: Hammer head (center core + left wing + right wing)
        // Cubes 3-6: Tapered body segments
        // Cube 7: Tail segment
        // Tetras 0: Dorsal fin (tall, sharp)
        // Tetras 1-2: Pectoral fins (left and right)
        // Tetras 3: Tail fin (asymmetric, vertical)
        
        const swimTime = elScaled * 0.6; // Slower, more gliding motion
        const rotationSpeed = KEYFRAME_ONLY_ROTATION_SPEED;
        
        // Camera positioned for 3/4 view to show hammer shape clearly
        const camAngle = rotationSpeed + activeCameraRotation;
        cam.position.set(
          Math.sin(camAngle) * activeCameraDistance * 0.9 + shakeX,
          4 + activeCameraHeight + Math.sin(swimTime * 0.3) * 0.5 + shakeY,
          Math.cos(camAngle) * activeCameraDistance * 0.6 + shakeZ
        );
        cam.lookAt(0, 0, -8);
        
        // === SWIMMING ANIMATION ===
        // Smooth gliding motion - low amplitude, calm and predatory
        const headSway = Math.sin(swimTime) * 0.3; // Subtle head movement
        const bodyWaveAmp = 0.4; // Low amplitude body wave
        const tailPhaseDelay = 1.2; // Tail lags behind body
        const BODY_SEGMENT_COUNT = 8; // Total body segments (head to tail)
        const SEGMENT_SPACING = 1 / (BODY_SEGMENT_COUNT - 1); // Progress increment per segment
        
        // Calculate body center line positions for each segment
        const bodyPositions: { x: number; y: number; z: number; yaw: number }[] = [];
        for (let i = 0; i < BODY_SEGMENT_COUNT; i++) {
          const progress = i / (BODY_SEGMENT_COUNT - 1); // 0 to 1 from head to tail
          // Body wave increases toward tail
          const wavePhase = swimTime - progress * tailPhaseDelay;
          const waveAmp = bodyWaveAmp * progress * progress; // Amplitude increases quadratically toward tail
          const x = Math.sin(wavePhase) * waveAmp * (3 + f.bass * 0.5);
          const y = Math.sin(swimTime * 0.4 - progress * 0.3) * 0.3;
          const z = -progress * 18; // Shark length ~18 units
          
          // Calculate yaw (y-rotation) based on swimming direction
          const nextProgress = Math.min(1, progress + SEGMENT_SPACING);
          const nextWavePhase = swimTime - nextProgress * tailPhaseDelay;
          const nextWaveAmp = bodyWaveAmp * nextProgress * nextProgress;
          const nextX = Math.sin(nextWavePhase) * nextWaveAmp * (3 + f.bass * 0.5);
          const nextZ = -nextProgress * 18;
          const yaw = Math.atan2(nextX - x, nextZ - z);
          
          bodyPositions.push({ x, y, z, yaw });
        }
        
        // === HEAD (3 CUBES FORMING |-------| SHAPE FROM TOP) ===
        // The hammerhead should look like: |-------| from above
        // Cube 0: The long horizontal hammer bar (the -------) - thinner bridge
        const hammerBar = obj.cubes[0];
        const headPos = bodyPositions[0];
        const hammerTotalWidth = 12; // Wide hammer bar but thinner
        hammerBar.position.set(headPos.x + headSway, headPos.y, headPos.z + 2); // Forward position
        hammerBar.scale.set(hammerTotalWidth, 1.0 + f.bass * 0.1, 1.2 + f.bass * 0.1); // Thinner bridge (reduced z from 2.0 to 1.2)
        hammerBar.rotation.set(0, headPos.yaw, 0);
        hammerBar.material.color.setStyle(cubeColor);
        hammerBar.material.opacity = 0.95 * blend;
        hammerBar.material.wireframe = false;
        
        // Cube 1: Left eye wing (the left |) - longer eye stalks
        const leftEyeWing = obj.cubes[1];
        leftEyeWing.position.set(
          headPos.x + headSway - hammerTotalWidth / 2,
          headPos.y,
          headPos.z + 2.5 // Forward of the bar
        );
        leftEyeWing.scale.set(1.5, 1.3 + f.highs * 0.1, 1.5); // Longer eye wings
        leftEyeWing.rotation.set(0, headPos.yaw, 0);
        leftEyeWing.material.color.setStyle(cubeColor);
        leftEyeWing.material.opacity = 0.95 * blend;
        leftEyeWing.material.wireframe = false;
        
        // Cube 2: Right eye wing (the right |) - longer eye stalks
        const rightEyeWing = obj.cubes[2];
        rightEyeWing.position.set(
          headPos.x + headSway + hammerTotalWidth / 2,
          headPos.y,
          headPos.z + 2.5 // Forward of the bar
        );
        rightEyeWing.scale.set(1.5, 1.3 + f.highs * 0.1, 1.5); // Longer eye wings
        rightEyeWing.rotation.set(0, headPos.yaw, 0);
        rightEyeWing.material.color.setStyle(cubeColor);
        rightEyeWing.material.opacity = 0.95 * blend;
        rightEyeWing.material.wireframe = false;
        
        // === TAPERED BODY (CUBES 3-6) ===
        // Body segments taper aggressively from head toward tail
        // Increased z-lengths significantly to eliminate gaps between segments
        const bodyTaperX = [2.5, 2.0, 1.6, 1.2]; // Width taper (slightly wider)
        const bodyTaperY = [1.8, 1.5, 1.2, 0.9]; // Height taper (slightly taller)
        const bodyTaperZ = [5.0, 4.5, 4.0, 3.5]; // Much longer lengths to close gaps
        
        for (let i = 0; i < 4; i++) {
          const cube = obj.cubes[3 + i];
          // Adjust positions to connect segments without gaps
          const segmentIndex = 1 + i; // Start from position 1 (just behind head)
          const pos = bodyPositions[segmentIndex];
          // Offset z more forward to overlap with previous segment
          cube.position.set(pos.x, pos.y, pos.z + 1.5);
          cube.scale.set(
            bodyTaperX[i] + f.bass * 0.1,
            bodyTaperY[i] + f.bass * 0.05,
            bodyTaperZ[i]
          );
          cube.rotation.set(0, pos.yaw, Math.sin(swimTime - (1 + i) * 0.3) * 0.05);
          cube.material.color.setStyle(cubeColor);
          cube.material.opacity = 0.9 * blend;
          cube.material.wireframe = false;
        }
        
        // === TAIL SEGMENT (CUBE 7) ===
        const tailCube = obj.cubes[7];
        const tailPos = bodyPositions[5]; // Position closer to body
        // Tail has strongest oscillation with phase delay
        const tailSwing = Math.sin(swimTime - tailPhaseDelay * 1.5) * 1.5;
        tailCube.position.set(tailPos.x + tailSwing * 0.3, tailPos.y, tailPos.z); // Adjusted to connect to body
        tailCube.scale.set(0.8, 0.6, 4.0); // Longer and thicker tail segment
        tailCube.rotation.set(0, tailPos.yaw + tailSwing * 0.15, 0);
        tailCube.material.color.setStyle(cubeColor);
        tailCube.material.opacity = 0.85 * blend;
        tailCube.material.wireframe = false;
        
        // === DORSAL FIN (TETRA 0) - Tall, sharp, positioned behind head ===
        const dorsalFin = obj.tetras[0];
        const dorsalPos = bodyPositions[2]; // Behind head, on first body segment
        dorsalFin.position.set(
          dorsalPos.x,
          dorsalPos.y + 2.5 + f.mids * 0.5, // Closer to body - reduced from 5.5 to 2.5
          dorsalPos.z
        );
        dorsalFin.rotation.set(0, dorsalPos.yaw, Math.PI); // Point upward
        dorsalFin.scale.set(3, 8 + f.mids * 0.8, 5); // MUCH taller and sharper
        dorsalFin.material.color.setStyle(tetrahedronColor);
        dorsalFin.material.opacity = 0.9 * blend;
        dorsalFin.material.wireframe = false;
        
        // === PECTORAL FINS (TETRAS 1-2) - Much longer and bigger, flat triangular ===
        const pectoralPos = bodyPositions[1]; // Just behind head
        
        // Left pectoral fin - MUCH longer and bigger
        const leftPectoral = obj.tetras[1];
        leftPectoral.position.set(
          pectoralPos.x - 3, // Out from body (same position)
          pectoralPos.y - 1.0, // Below body (same position)
          pectoralPos.z + 1 // Same position
        );
        leftPectoral.rotation.set(
          -0.3, // Slight backward angle
          pectoralPos.yaw - 0.8, // Angled outward
          -0.4 + Math.sin(swimTime * 1.5) * 0.1 // Slight downward angle with gentle movement
        );
        leftPectoral.scale.set(10, 1.2, 12); // MUCH longer and bigger (was 5, 0.6, 6)
        leftPectoral.material.color.setStyle(tetrahedronColor);
        leftPectoral.material.opacity = 0.85 * blend;
        leftPectoral.material.wireframe = false;
        
        // Right pectoral fin (mirror) - MUCH longer and bigger
        const rightPectoral = obj.tetras[2];
        rightPectoral.position.set(
          pectoralPos.x + 3, // Out from body (same position)
          pectoralPos.y - 1.0, // Same position
          pectoralPos.z + 1 // Same position
        );
        rightPectoral.rotation.set(
          -0.3,
          pectoralPos.yaw + 0.8,
          0.4 - Math.sin(swimTime * 1.5) * 0.1
        );
        rightPectoral.scale.set(10, 1.2, 12); // MUCH longer and bigger (was 5, 0.6, 6)
        rightPectoral.material.color.setStyle(tetrahedronColor);
        rightPectoral.material.opacity = 0.85 * blend;
        rightPectoral.material.wireframe = false;
        
        // === TAIL FIN (TETRA 3) - Asymmetric, vertical, top lobe larger ===
        const tailFin = obj.tetras[3];
        const tailFinSwing = Math.sin(swimTime - tailPhaseDelay * 2) * 0.6; // Most delayed, strongest swing
        tailFin.position.set(
          tailPos.x + tailSwing * 0.5,
          tailPos.y + 1.5, // Offset up more for asymmetry (top lobe larger)
          tailPos.z - 4 // Further behind tail segment
        );
        tailFin.rotation.set(
          Math.PI / 2 + 0.2, // Vertical orientation, slight upward bias
          tailPos.yaw + tailFinSwing,
          0
        );
        tailFin.scale.set(1.6, 8 + f.bass * 1.0, 6); // MUCH taller tail fin
        tailFin.material.color.setStyle(tetrahedronColor);
        tailFin.material.opacity = 0.9 * blend;
        tailFin.material.wireframe = false;
        
        // Hide remaining tetras (4-29)
        for (let i = 4; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0);
          obj.tetras[i].scale.set(0.001, 0.001, 0.001);
          obj.tetras[i].material.opacity = 0;
        }
        
        // === AMBIENT BUBBLES (OCTAS 0-4) - Sparse atmosphere ===
        for (let i = 0; i < 5; i++) {
          const bubble = obj.octas[i];
          const bubbleSpeed = 0.4 + (i % 3) * 0.15;
          const riseHeight = (elScaled * bubbleSpeed + i * 5) % 30;
          bubble.position.set(
            Math.sin(i * 2.5) * 12,
            riseHeight - 15,
            -10 - i * 3
          );
          const bubbleSize = 0.35 + f.highs * 0.15;
          bubble.scale.set(bubbleSize, bubbleSize, bubbleSize);
          bubble.rotation.x += 0.03;
          bubble.rotation.y += 0.02;
          bubble.material.color.setStyle(octahedronColor);
          bubble.material.opacity = (0.25 + f.highs * 0.15) * blend;
          bubble.material.wireframe = true;
        }
        
        // Hide remaining octahedrons (5+)
        for (let i = 5; i < obj.octas.length; i++) {
          obj.octas[i].position.set(0, -1000, 0);
          obj.octas[i].scale.set(0.001, 0.001, 0.001);
          obj.octas[i].material.opacity = 0;
        }
        
        // Hide sphere completely
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'kaleidoscope') {
        cam.position.set(0 + shakeX, activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        const segments = 6;
        obj.cubes.forEach((c, i) => {
          const segmentAngle = (Math.PI * 2) / segments;
          const segment = i % segments;
          const ring = Math.floor(i / segments);
          const angle = segment * segmentAngle + elScaled * (ring % 2 === 0 ? 1 : -1);
          const radius = 5 + ring * 3 + f.bass * 2;
          c.position.x = Math.cos(angle) * radius;
          c.position.y = Math.sin(angle) * radius;
          c.position.z = Math.sin(elScaled * 2 + i) * 2;
          c.rotation.x = angle;
          c.rotation.y = el + i;
          c.rotation.z = angle * 2;
          const s = 1.2 + f.bass * 0.8;
          c.scale.set(s, s, s);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (0.7 + f.bass * 0.3) * blend;
          c.material.wireframe = true;
        });
        obj.octas.forEach((o, i) => {
          const segmentAngle = (Math.PI * 2) / segments;
          const segment = i % segments;
          const ring = Math.floor(i / segments);
          const angle = segment * segmentAngle + elScaled * 1.5 * (ring % 2 === 0 ? -1 : 1);
          const radius = 8 + ring * 2 + f.mids * 3;
          o.position.x = Math.cos(angle) * radius;
          o.position.y = Math.sin(angle) * radius;
          o.position.z = Math.cos(el + i) * 1.5;
          o.rotation.x = angle + el;
          o.rotation.y = elScaled * 2;
          o.rotation.z = -angle;
          const s = 0.9 + f.mids * 0.6;
          o.scale.set(s, s, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (0.6 + f.mids * 0.4) * blend;
          o.material.wireframe = true;
        });
        obj.tetras.forEach((t, i) => {
          const segmentAngle = (Math.PI * 2) / segments;
          const segment = i % segments;
          const ring = Math.floor(i / segments);
          const angle = segment * segmentAngle - elScaled * 2;
          const radius = 3 + ring + f.highs * 2;
          t.position.x = Math.cos(angle) * radius;
          t.position.y = Math.sin(angle) * radius;
          t.position.z = 0;
          t.rotation.x = elScaled * 3 + i;
          t.rotation.y = elScaled * 2;
          t.rotation.z = angle;
          const s = 0.5 + f.highs * 0.5;
          t.scale.set(s, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (0.5 + f.highs * 0.5) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const sphereSize = 1 + f.bass * 0.5;
        obj.sphere.scale.set(sphereSize, sphereSize, sphereSize);
        obj.sphere.rotation.x = elScaled * 0.5;
        obj.sphere.rotation.y = el;
        obj.sphere.material.color.setStyle(sphereColor);
        obj.sphere.material.opacity = (0.3 + f.bass * 0.2) * blend;
        obj.sphere.material.wireframe = true;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'meteor') {
        const pathAngle = activeCameraRotation;
        cam.position.set(Math.cos(pathAngle) * activeCameraDistance + shakeX, 10 + activeCameraHeight + shakeY, Math.sin(pathAngle) * activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        obj.cubes.forEach((c, i) => {
          const speed = 0.5 + (i % 3) * 0.3;
          const meteorTime = (elScaled * speed + i * 2) % 10;
          const startX = ((i % 4) - 1.5) * 20;
          const startY = 15;
          const startZ = ((Math.floor(i / 4)) - 1) * 20;
          const fallProgress = meteorTime / 10;
          c.position.x = startX + Math.sin(meteorTime) * 5;
          c.position.y = startY - fallProgress * 30;
          c.position.z = startZ + Math.cos(meteorTime) * 5;
          const angle = meteorTime * 10;
          c.rotation.x = angle;
          c.rotation.y = angle * 1.3;
          c.rotation.z = angle * 0.7;
          const s = 1 + f.bass * 1.5 * (1 - fallProgress);
          c.scale.set(s, s * 2, s);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = ((1 - fallProgress) * 0.8 + f.bass * 0.2) * blend;
          c.material.wireframe = false;
        });
        obj.octas.forEach((o, i) => {
          const speed = 0.7 + (i % 4) * 0.2;
          const meteorTime = (elScaled * speed + i * 1.5) % 8;
          const startX = ((i % 6) - 2.5) * 15;
          const startY = 20;
          const startZ = ((Math.floor(i / 6)) - 2.5) * 15;
          const fallProgress = meteorTime / 8;
          o.position.x = startX + Math.cos(meteorTime * 2) * 3;
          o.position.y = startY - fallProgress * 40;
          o.position.z = startZ + Math.sin(meteorTime * 2) * 3;
          o.rotation.x += 0.15 + f.mids * 0.1;
          o.rotation.y += 0.1;
          o.rotation.z += 0.12;
          const s = 0.8 + f.mids * 0.6 * (1 - fallProgress);
          o.scale.set(s, s, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = ((1 - fallProgress) * 0.7 + f.mids * 0.3) * blend;
          o.material.wireframe = true;
        });
        obj.tetras.forEach((t, i) => {
          const speed = 0.3 + (i % 5) * 0.15;
          const meteorTime = (elScaled * speed + i) % 12;
          const fallProgress = meteorTime / 12;
          const trail = i % 5;
          t.position.x = ((i % 6) - 2.5) * 10 + Math.sin(meteorTime * 3) * 2;
          t.position.y = 25 - fallProgress * 50 - trail * 0.5;
          t.position.z = ((Math.floor(i / 6)) - 2.5) * 10;
          t.rotation.x = meteorTime * 5;
          t.rotation.y = meteorTime * 3;
          const s = 0.4 + f.highs * 0.4;
          t.scale.set(s, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = ((1 - fallProgress) * 0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'dna') {
        const helixRotation = activeCameraRotation;
        cam.position.set(Math.cos(helixRotation) * activeCameraDistance + shakeX, activeCameraHeight + shakeY, Math.sin(helixRotation) * activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        obj.cubes.forEach((c, i) => {
          const height = (i - obj.cubes.length / 2) * 2.5;
          const angle = el + i * 0.6;
          const radius = 4 + f.bass * 2;
          const strand = i % 2;
          const strandOffset = strand * Math.PI;
          c.position.x = Math.cos(angle + strandOffset) * radius;
          c.position.y = height;
          c.position.z = Math.sin(angle + strandOffset) * radius;
          c.rotation.x = 0;
          c.rotation.y = angle;
          c.rotation.z = 0;
          const s = 1 + f.bass * 0.8;
          c.scale.set(s, s * 0.5, s);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (0.8 + f.bass * 0.2) * blend;
          c.material.wireframe = false;
        });
        const rungs = Math.floor(obj.tetras.length / 4);
        obj.tetras.forEach((t, i) => {
          const rungIndex = Math.floor(i / 4);
          const segmentInRung = i % 4;
          const height = (rungIndex - rungs / 2) * 2.5;
          const angle = el + rungIndex * 0.6;
          const radius = 4 + f.bass * 2;
          const t1 = segmentInRung / 3;
          const x1 = Math.cos(angle) * radius;
          const z1 = Math.sin(angle) * radius;
          const x2 = Math.cos(angle + Math.PI) * radius;
          const z2 = Math.sin(angle + Math.PI) * radius;
          t.position.x = x1 + (x2 - x1) * t1;
          t.position.y = height;
          t.position.z = z1 + (z2 - z1) * t1;
          t.rotation.x = 0;
          t.rotation.y = angle;
          t.rotation.z = Math.PI / 2;
          const s = 0.3 + f.mids * 0.2;
          t.scale.set(s * 3, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (0.6 + f.mids * 0.3) * blend;
          t.material.wireframe = false;
        });
        obj.octas.forEach((o, i) => {
          const height = (i - obj.octas.length / 2) * 1.5;
          const angle = elScaled * 2 + i * 0.3;
          const radius = 6 + Math.sin(el + i) * 1 + f.highs * 1.5;
          o.position.x = Math.cos(angle) * radius;
          o.position.y = height;
          o.position.z = Math.sin(angle) * radius;
          o.rotation.x = el + i;
          o.rotation.y = elScaled * 2;
          o.rotation.z = 0;
          const s = 0.5 + f.highs * 0.4;
          o.scale.set(s, s, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (0.4 + f.highs * 0.3) * blend;
          o.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const centerSize = 0.5 + f.mids * 0.3;
        obj.sphere.scale.set(centerSize, 20, centerSize);
        obj.sphere.rotation.y = el;
        obj.sphere.material.color.setStyle(sphereColor);
        obj.sphere.material.opacity = (0.2 + f.mids * 0.1) * blend;
        obj.sphere.material.wireframe = true;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'fireworks') {
        cam.position.set(0 + shakeX, 5 + activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0, 5, 0);
        obj.cubes.forEach((c, i) => {
          const burstTime = (elScaled * 0.8 + i * 3) % 6;
          const burstProgress = Math.min(burstTime / 2, 1);
          const fadeProgress = Math.max((burstTime - 2) / 4, 0);
          const launchX = ((i % 4) - 1.5) * 10;
          const launchZ = ((Math.floor(i / 4)) - 1) * 10;
          if (burstTime < 2) {
            c.position.x = launchX;
            c.position.y = burstProgress * 15 + f.bass * 2;
            c.position.z = launchZ;
          } else {
            const explosionAngle = (i * 2.1) * Math.PI;
            const explosionRadius = (burstTime - 2) * 5 + f.bass * 3;
            c.position.x = launchX + Math.cos(explosionAngle) * explosionRadius;
            c.position.y = 15 - Math.pow(fadeProgress, 2) * 10;
            c.position.z = launchZ + Math.sin(explosionAngle) * explosionRadius;
          }
          c.rotation.x += 0.1;
          c.rotation.y += 0.15;
          c.rotation.z += 0.05;
          const s = (burstTime < 2 ? 1 : 1.5) + f.bass * 0.8;
          c.scale.set(s, s, s);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = ((1 - fadeProgress) * 0.9 + f.bass * 0.1) * blend;
          c.material.wireframe = burstTime < 2;
        });
        obj.octas.forEach((o, i) => {
          const burstTime = (elScaled * 0.8 + i * 2.5 + 1) % 6;
          const burstProgress = Math.min(burstTime / 2, 1);
          const fadeProgress = Math.max((burstTime - 2) / 4, 0);
          const launchX = ((i % 6) - 2.5) * 8;
          const launchZ = ((Math.floor(i / 6)) - 2.5) * 8;
          if (burstTime < 2) {
            o.position.x = launchX;
            o.position.y = burstProgress * 18 + f.mids * 2;
            o.position.z = launchZ;
          } else {
            const explosionAngle = (i * 1.7) * Math.PI;
            const explosionRadius = (burstTime - 2) * 6 + f.mids * 3;
            o.position.x = launchX + Math.cos(explosionAngle) * explosionRadius;
            o.position.y = 18 - Math.pow(fadeProgress, 2) * 12;
            o.position.z = launchZ + Math.sin(explosionAngle) * explosionRadius;
          }
          o.rotation.x += 0.12 + f.mids * 0.05;
          o.rotation.y += 0.1;
          o.rotation.z += 0.08;
          const s = (burstTime < 2 ? 0.8 : 1.2) + f.mids * 0.6;
          o.scale.set(s, s, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = ((1 - fadeProgress) * 0.8 + f.mids * 0.2) * blend;
          o.material.wireframe = true;
        });
        obj.tetras.forEach((t, i) => {
          const burstTime = (elScaled * 0.8 + i * 2 + 0.5) % 6;
          const fadeProgress = Math.max((burstTime - 2) / 4, 0);
          const launchX = ((i % 6) - 2.5) * 7;
          const launchZ = ((Math.floor(i / 6)) - 2.5) * 7;
          if (burstTime < 2) {
            t.position.set(launchX, 0, launchZ);
            t.scale.set(0.01, 0.01, 0.01);
            t.material.opacity = 0;
          } else {
            const angle1 = (i * 0.8) * Math.PI;
            const angle2 = (i * 1.3) * Math.PI;
            const radius = (burstTime - 2) * 7 + f.highs * 4;
            t.position.x = launchX + Math.cos(angle1) * radius;
            t.position.y = 18 - Math.pow(fadeProgress, 2) * 12 + Math.sin(angle2) * 3;
            t.position.z = launchZ + Math.sin(angle1) * radius;
            t.rotation.x += 0.2;
            t.rotation.y += 0.15;
            t.rotation.z += 0.1;
            const s = 0.6 + f.highs * 0.5;
            t.scale.set(s, s, s);
            t.material.color.setStyle(tetrahedronColor);
            t.material.opacity = ((1 - fadeProgress) * 0.7 + f.highs * 0.3) * blend;
            t.material.wireframe = true;
          }
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'matrix') {
        cam.position.set(0 + shakeX, 5 + activeCameraHeight + shakeY, activeCameraDistance + 10 + shakeZ);
        cam.lookAt(0, 0, -10);
        const columns = 8;
        obj.cubes.forEach((c, i) => {
          const column = i % columns;
          const columnX = (column - columns / 2 + 0.5) * 3;
          const fallSpeed = 2 + (column % 3) * 0.5;
          const fallOffset = (elScaled * fallSpeed + i * 2) % 30;
          c.position.x = columnX;
          c.position.y = 15 - fallOffset + Math.sin(el + i) * 0.5;
          c.position.z = -10 + Math.cos(elScaled * 0.5 + i) * 2;
          c.rotation.x = 0;
          c.rotation.y = 0;
          c.rotation.z = 0;
          const s = 0.8 + f.bass * 0.6;
          c.scale.set(s, s * 0.3, s);
          const brightness = 1 - (fallOffset / 30);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (brightness * 0.8 + f.bass * 0.2) * blend;
          c.material.wireframe = false;
        });
        obj.octas.forEach((o, i) => {
          const column = i % columns;
          const columnX = (column - columns / 2 + 0.5) * 3;
          const fallSpeed = 1.5 + (column % 4) * 0.4;
          const fallOffset = (elScaled * fallSpeed + i * 1.5) % 35;
          o.position.x = columnX + Math.sin(el + i) * 0.3;
          o.position.y = 18 - fallOffset;
          o.position.z = -8 + Math.cos(elScaled * 0.3 + i) * 3;
          o.rotation.x = 0;
          o.rotation.y = 0;
          o.rotation.z = el + i;
          const s = 0.6 + f.mids * 0.5;
          o.scale.set(s, s * 0.2, s);
          const brightness = 1 - (fallOffset / 35);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (brightness * 0.7 + f.mids * 0.3) * blend;
          o.material.wireframe = true;
        });
        obj.tetras.forEach((t, i) => {
          const column = i % columns;
          const columnX = (column - columns / 2 + 0.5) * 3;
          const fallSpeed = 2.5 + (column % 5) * 0.3;
          const fallOffset = (elScaled * fallSpeed + i) % 40;
          t.position.x = columnX + Math.sin(elScaled * 2 + i) * 0.5;
          t.position.y = 20 - fallOffset;
          t.position.z = -12 + Math.cos(elScaled * 0.4 + i) * 4;
          t.rotation.x = el + i;
          t.rotation.y = 0;
          t.rotation.z = 0;
          const s = 0.4 + f.highs * 0.4;
          t.scale.set(s, s * 0.15, s);
          const brightness = 1 - (fallOffset / 40);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (brightness * 0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'ripple') {
        cam.position.set(0 + shakeX, 15 + activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        obj.cubes.forEach((c, i) => {
          const rippleTime = elScaled * 2;
          const rippleRadius = (rippleTime + i * 0.8) % 20;
          const angle = (i / obj.cubes.length) * Math.PI * 2;
          c.position.x = Math.cos(angle) * rippleRadius;
          c.position.z = Math.sin(angle) * rippleRadius;
          const waveHeight = Math.sin((rippleRadius - rippleTime) * 0.5) * 3;
          c.position.y = waveHeight + f.bass * 2;
          c.rotation.x = 0;
          c.rotation.y = angle;
          c.rotation.z = 0;
          const s = 1.2 + f.bass * 0.8;
          c.scale.set(s, s * 0.5, s);
          const fade = 1 - (rippleRadius / 20);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (fade * 0.8 + f.bass * 0.2) * blend;
          c.material.wireframe = false;
        });
        obj.octas.forEach((o, i) => {
          const rippleTime = elScaled * 2;
          const rippleRadius = (rippleTime + i * 0.5 + 2) % 25;
          const angle = (i / obj.octas.length) * Math.PI * 2;
          o.position.x = Math.cos(angle) * rippleRadius;
          o.position.z = Math.sin(angle) * rippleRadius;
          const waveHeight = Math.sin((rippleRadius - rippleTime) * 0.6) * 2.5;
          o.position.y = waveHeight + f.mids * 1.5;
          o.rotation.x = el + i;
          o.rotation.y = angle;
          o.rotation.z = 0;
          const s = 0.9 + f.mids * 0.6;
          o.scale.set(s, s, s);
          const fade = 1 - (rippleRadius / 25);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (fade * 0.7 + f.mids * 0.3) * blend;
          o.material.wireframe = true;
        });
        obj.tetras.forEach((t, i) => {
          const rippleTime = elScaled * 2;
          const rippleRadius = (rippleTime + i * 0.3 + 1) % 22;
          const angle = (i / obj.tetras.length) * Math.PI * 2;
          t.position.x = Math.cos(angle) * rippleRadius;
          t.position.z = Math.sin(angle) * rippleRadius;
          const waveHeight = Math.sin((rippleRadius - rippleTime) * 0.7) * 2;
          t.position.y = waveHeight + f.highs * 1;
          t.rotation.x = elScaled * 2 + i;
          t.rotation.y = angle;
          t.rotation.z = el;
          const s = 0.6 + f.highs * 0.5;
          t.scale.set(s, s, s);
          const fade = 1 - (rippleRadius / 22);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (fade * 0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const pulseSize = 2 + f.bass * 3;
        obj.sphere.scale.set(pulseSize, pulseSize * 0.2, pulseSize);
        obj.sphere.rotation.y = el;
        obj.sphere.material.color.setStyle(sphereColor);
        obj.sphere.material.opacity = (0.3 + f.bass * 0.4) * blend;
        obj.sphere.material.wireframe = true;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'constellation') {
        const orbitAngle = activeCameraRotation;
        cam.position.set(Math.cos(orbitAngle) * activeCameraDistance + shakeX, activeCameraHeight + shakeY, Math.sin(orbitAngle) * activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        obj.cubes.forEach((c, i) => {
          const clusterAngle = (i / obj.cubes.length) * Math.PI * 2;
          const clusterRadius = 8 + Math.sin(el + i) * 2;
          const orbitOffset = Math.cos(elScaled * 0.5 + i * 0.3) * 2;
          c.position.x = Math.cos(clusterAngle) * clusterRadius + orbitOffset;
          c.position.y = Math.sin(i * 2) * 5 + Math.sin(el + i) * 1;
          c.position.z = Math.sin(clusterAngle) * clusterRadius + orbitOffset;
          c.rotation.x = elScaled * 0.3 + i;
          c.rotation.y = elScaled * 0.5;
          c.rotation.z = 0;
          const s = 0.8 + f.bass * 1;
          c.scale.set(s, s, s);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (0.8 + f.bass * 0.2) * blend;
          c.material.wireframe = false;
        });
        obj.octas.forEach((o, i) => {
          const nearestCube = obj.cubes[i % obj.cubes.length];
          const nextCube = obj.cubes[(i + 1) % obj.cubes.length];
          const t = (i % 5) / 5;
          o.position.x = nearestCube.position.x + (nextCube.position.x - nearestCube.position.x) * t;
          o.position.y = nearestCube.position.y + (nextCube.position.y - nearestCube.position.y) * t;
          o.position.z = nearestCube.position.z + (nextCube.position.z - nearestCube.position.z) * t;
          const pulse = Math.sin(elScaled * 5 + i) * 0.5 + 0.5;
          const s = (0.3 + f.mids * 0.4) * (0.5 + pulse * 0.5);
          o.scale.set(s, s * 3, s);
          const dx = nextCube.position.x - nearestCube.position.x;
          const dy = nextCube.position.y - nearestCube.position.y;
          const dz = nextCube.position.z - nearestCube.position.z;
          o.rotation.y = Math.atan2(dx, dz);
          o.rotation.x = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
          o.rotation.z = 0;
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = ((0.5 + pulse * 0.3) + f.mids * 0.2) * blend;
          o.material.wireframe = false;
        });
        obj.tetras.forEach((t, i) => {
          const attachedCube = obj.cubes[i % obj.cubes.length];
          const orbitAngle = elScaled * 3 + i;
          const orbitRadius = 1.5 + f.highs * 1;
          t.position.x = attachedCube.position.x + Math.cos(orbitAngle) * orbitRadius;
          t.position.y = attachedCube.position.y + Math.sin(orbitAngle * 0.5) * orbitRadius;
          t.position.z = attachedCube.position.z + Math.sin(orbitAngle) * orbitRadius;
          t.rotation.x += 0.1 + f.highs * 0.1;
          t.rotation.y += 0.08;
          t.rotation.z += 0.05;
          const s = 0.4 + f.highs * 0.5;
          t.scale.set(s, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'pendulum') {
        cam.position.set(0 + shakeX, 10 + activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        obj.cubes.forEach((c, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const anchorX = (col - 1.5) * 6;
          const anchorY = 10;
          const anchorZ = (row - 1) * 6;
          const swingSpeed = 1 + col * 0.2;
          const swingAngle = Math.sin(elScaled * swingSpeed + row) * (Math.PI / 3) + f.bass * 0.3;
          const pendulumLength = 5 + row;
          c.position.x = anchorX + Math.sin(swingAngle) * pendulumLength;
          c.position.y = anchorY - Math.cos(swingAngle) * pendulumLength;
          c.position.z = anchorZ;
          c.rotation.x = swingAngle;
          c.rotation.y = elScaled * 0.5;
          c.rotation.z = 0;
          const s = 1 + f.bass * 0.8;
          c.scale.set(s, s, s);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (0.8 + f.bass * 0.2) * blend;
          c.material.wireframe = false;
        });
        obj.octas.forEach((o, i) => {
          const cubeIndex = i % obj.cubes.length;
          const attachedCube = obj.cubes[cubeIndex];
          const row = Math.floor(cubeIndex / 4);
          const col = cubeIndex % 4;
          const anchorX = (col - 1.5) * 6;
          const anchorY = 10;
          const segments = 5;
          const segment = i % segments;
          const t = segment / segments;
          o.position.x = anchorX + (attachedCube.position.x - anchorX) * t;
          o.position.y = anchorY + (attachedCube.position.y - anchorY) * t;
          o.position.z = attachedCube.position.z;
          o.rotation.x = 0;
          o.rotation.y = 0;
          o.rotation.z = el + i;
          const s = 0.3 + f.mids * 0.3;
          o.scale.set(s, s * 4, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (0.5 + f.mids * 0.3) * blend;
          o.material.wireframe = false;
        });
        obj.tetras.forEach((t, i) => {
          const swingSpeed = 1.5 + (i % 3) * 0.3;
          const swingAngle = Math.sin(elScaled * swingSpeed + i) * (Math.PI / 4) + f.highs * 0.4;
          const layer = Math.floor(i / 10);
          const posInLayer = i % 10;
          const anchorX = (posInLayer - 4.5) * 3;
          const anchorY = 15 - layer * 3;
          const anchorZ = -5 + layer * 2;
          const pendulumLength = 3 + layer * 0.5;
          t.position.x = anchorX + Math.sin(swingAngle) * pendulumLength;
          t.position.y = anchorY - Math.cos(swingAngle) * pendulumLength;
          t.position.z = anchorZ;
          t.rotation.x = swingAngle + el;
          t.rotation.y = elScaled * 2;
          t.rotation.z = 0;
          const s = 0.5 + f.highs * 0.5;
          t.scale.set(s, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'tunnel') {
        cam.position.set(0 + shakeX, activeCameraHeight + shakeY, 5 + shakeZ);
        cam.lookAt(0, 0, -20);
        const tunnelSpeed = 10;
        obj.cubes.forEach((c, i) => {
          const ringIndex = Math.floor(i / 4);
          const posInRing = i % 4;
          const angle = (posInRing / 4) * Math.PI * 2;
          const tunnelRadius = 8 + f.bass * 2;
          const zProgress = ((elScaled * tunnelSpeed + ringIndex * 5) % 50) - 25;
          c.position.x = Math.cos(angle) * tunnelRadius;
          c.position.y = Math.sin(angle) * tunnelRadius;
          c.position.z = -zProgress;
          c.rotation.x = 0;
          c.rotation.y = 0;
          c.rotation.z = angle + el;
          const s = 2 + f.bass * 1.5;
          c.scale.set(s, s, s * 0.5);
          const depth = Math.abs(zProgress) / 25;
          c.material.color.setStyle(cubeColor);
          c.material.opacity = ((1 - depth * 0.5) + f.bass * 0.3) * blend;
          c.material.wireframe = true;
        });
        obj.octas.forEach((o, i) => {
          const ringIndex = Math.floor(i / 6);
          const posInRing = i % 6;
          const angle = (posInRing / 6) * Math.PI * 2;
          const tunnelRadius = 6 + f.mids * 1.5;
          const zProgress = ((elScaled * tunnelSpeed + ringIndex * 4 + 2) % 45) - 22.5;
          o.position.x = Math.cos(angle) * tunnelRadius;
          o.position.y = Math.sin(angle) * tunnelRadius;
          o.position.z = -zProgress;
          o.rotation.x = angle;
          o.rotation.y = el + i;
          o.rotation.z = 0;
          const s = 1.2 + f.mids * 0.8;
          o.scale.set(s, s, s);
          const depth = Math.abs(zProgress) / 22.5;
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = ((1 - depth * 0.5) + f.mids * 0.3) * blend;
          o.material.wireframe = true;
        });
        obj.tetras.forEach((t, i) => {
          const ringIndex = Math.floor(i / 6);
          const posInRing = i % 6;
          const angle = (posInRing / 6) * Math.PI * 2 + elScaled * 2;
          const tunnelRadius = 4 + Math.sin(el + i) * 1 + f.highs * 1;
          const zProgress = ((elScaled * tunnelSpeed + ringIndex * 3.5 + 1) % 40) - 20;
          t.position.x = Math.cos(angle) * tunnelRadius;
          t.position.y = Math.sin(angle) * tunnelRadius;
          t.position.z = -zProgress;
          t.rotation.x = elScaled * 3 + i;
          t.rotation.y = angle;
          t.rotation.z = elScaled * 2;
          const s = 0.7 + f.highs * 0.6;
          t.scale.set(s, s, s);
          const depth = Math.abs(zProgress) / 20;
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = ((1 - depth * 0.5) + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'flower') {
        cam.position.set(0 + shakeX, 12 + activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        const petals = 8;
        obj.cubes.forEach((c, i) => {
          const petalAngle = (i / petals) * Math.PI * 2;
          const bloomProgress = Math.sin(elScaled * 0.5) * 0.5 + 0.5;
          const petalRadius = 5 + bloomProgress * 5 + f.bass * 2;
          const petalHeight = Math.sin(petalAngle * 2 + el) * 2;
          c.position.x = Math.cos(petalAngle) * petalRadius;
          c.position.y = petalHeight + f.mids * 1;
          c.position.z = Math.sin(petalAngle) * petalRadius;
          c.rotation.x = petalAngle;
          c.rotation.y = elScaled * 0.3;
          c.rotation.z = Math.sin(el + i) * 0.5;
          const s = 1.5 + bloomProgress + f.bass * 0.8;
          c.scale.set(s * 0.5, s * 2, s);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (0.7 + f.bass * 0.3) * blend;
          c.material.wireframe = false;
        });
        obj.octas.forEach((o, i) => {
          const layer = Math.floor(i / 6);
          const posInLayer = i % 6;
          const angle = (posInLayer / 6) * Math.PI * 2 + elScaled * 2;
          const radius = 3 + layer + Math.sin(el + i) * 0.5 + f.mids * 1.5;
          o.position.x = Math.cos(angle) * radius;
          o.position.y = -layer * 0.5 + f.mids * 0.5;
          o.position.z = Math.sin(angle) * radius;
          o.rotation.x = angle;
          o.rotation.y = el + i;
          o.rotation.z = 0;
          const s = 0.6 + f.mids * 0.5;
          o.scale.set(s, s, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (0.6 + f.mids * 0.4) * blend;
          o.material.wireframe = true;
        });
        obj.tetras.forEach((t, i) => {
          const angle = (i / obj.tetras.length) * Math.PI * 2;
          const radius = 1 + Math.sin(elScaled * 3 + i) * 0.3;
          t.position.x = Math.cos(angle) * radius;
          t.position.y = Math.sin(elScaled * 2 + i) * 0.5 + f.highs * 0.5;
          t.position.z = Math.sin(angle) * radius;
          t.rotation.x = elScaled * 3 + i;
          t.rotation.y = elScaled * 2;
          t.rotation.z = 0;
          const s = 0.3 + f.highs * 0.4;
          t.scale.set(s, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (0.7 + f.highs * 0.3) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const centerSize = 2 + Math.sin(el) * 0.5 + f.bass * 1;
        obj.sphere.scale.set(centerSize, centerSize, centerSize);
        obj.sphere.rotation.y = el;
        obj.sphere.material.color.setStyle(sphereColor);
        obj.sphere.material.opacity = (0.8 + f.bass * 0.2) * blend;
        obj.sphere.material.wireframe = false;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'tornado') {
        const spiralRotation = activeCameraRotation;
        cam.position.set(Math.cos(spiralRotation) * activeCameraDistance + shakeX, 15 + activeCameraHeight + shakeY, Math.sin(spiralRotation) * activeCameraDistance + shakeZ);
        cam.lookAt(0, 5, 0);
        obj.cubes.forEach((c, i) => {
          const height = (i / obj.cubes.length) * 20 - 10;
          const heightFactor = 1 - Math.abs(height / 10);
          const radius = 2 + heightFactor * 6 + f.bass * 3;
          const angle = height * 0.5 + elScaled * 2;
          c.position.x = Math.cos(angle) * radius;
          c.position.y = height;
          c.position.z = Math.sin(angle) * radius;
          c.rotation.x = angle;
          c.rotation.y = el;
          c.rotation.z = height * 0.1;
          const s = 1 + heightFactor * 0.5 + f.bass * 0.8;
          c.scale.set(s, s * 0.5, s);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (heightFactor * 0.7 + f.bass * 0.3) * blend;
          c.material.wireframe = true;
        });
        obj.octas.forEach((o, i) => {
          const height = (i / obj.octas.length) * 25 - 12.5;
          const heightFactor = 1 - Math.abs(height / 12.5);
          const radius = 3 + heightFactor * 8 + f.mids * 4;
          const angle = height * 0.6 + elScaled * 3;
          o.position.x = Math.cos(angle) * radius;
          o.position.y = height + Math.sin(elScaled * 2 + i) * 0.5;
          o.position.z = Math.sin(angle) * radius;
          o.rotation.x += 0.1 + f.mids * 0.1;
          o.rotation.y = angle;
          o.rotation.z += 0.05;
          const s = 0.8 + heightFactor * 0.4 + f.mids * 0.6;
          o.scale.set(s, s, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (heightFactor * 0.6 + f.mids * 0.4) * blend;
          o.material.wireframe = true;
        });
        obj.tetras.forEach((t, i) => {
          const height = (i / obj.tetras.length) * 30 - 15;
          const heightFactor = 1 - Math.abs(height / 15);
          const radius = 1 + heightFactor * 10 + f.highs * 5;
          const angle = height * 0.7 + elScaled * 4 + i * 0.1;
          t.position.x = Math.cos(angle) * radius;
          t.position.y = height;
          t.position.z = Math.sin(angle) * radius;
          t.rotation.x = elScaled * 5 + i;
          t.rotation.y = angle;
          t.rotation.z = elScaled * 3;
          const s = 0.5 + f.highs * 0.5;
          t.scale.set(s, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (heightFactor * 0.5 + f.highs * 0.5) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'cube3d') {
        cam.position.set(Math.sin(elScaled * 0.2) * 5 + shakeX, Math.cos(elScaled * 0.15) * 5 + activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        obj.cubes.forEach((c, i) => {
          const dim = 2;
          const x = (i % dim) - dim / 2 + 0.5;
          const y = (Math.floor(i / dim) % dim) - dim / 2 + 0.5;
          const z = Math.floor(i / (dim * dim)) - dim / 2 + 0.5;
          const dist = Math.sqrt(x * x + y * y + z * z);
          const offset = 5 + dist * 2 + f.bass * 3;
          c.position.x = x * offset;
          c.position.y = y * offset;
          c.position.z = z * offset;
          c.rotation.x = el + i * 0.1;
          c.rotation.y = elScaled * 1.5 + i * 0.1;
          c.rotation.z = elScaled * 0.5;
          const s = 1.5 + f.bass * 1;
          c.scale.set(s, s, s);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (0.6 + f.bass * 0.4) * blend;
          c.material.wireframe = true;
        });
        const edgeCount = 12;
        obj.octas.forEach((o, i) => {
          const edge = i % edgeCount;
          const segmentOnEdge = Math.floor(i / edgeCount);
          const segmentsPerEdge = Math.ceil(obj.octas.length / edgeCount);
          const t = segmentsPerEdge > 1 ? (segmentOnEdge / (segmentsPerEdge - 1)) : 0;
          const corners = [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
          ];
          const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6],
            [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]
          ];
          const [start, end] = edges[edge];
          const startPos = corners[start];
          const endPos = corners[end];
          const scale = 7 + f.mids * 3;
          o.position.x = (startPos[0] + (endPos[0] - startPos[0]) * t) * scale;
          o.position.y = (startPos[1] + (endPos[1] - startPos[1]) * t) * scale;
          o.position.z = (startPos[2] + (endPos[2] - startPos[2]) * t) * scale;
          o.rotation.x = el + i;
          o.rotation.y = elScaled * 2;
          o.rotation.z = 0;
          const s = 0.6 + f.mids * 0.5;
          o.scale.set(s, s, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (0.7 + f.mids * 0.3) * blend;
          o.material.wireframe = false;
        });
        obj.tetras.forEach((t, i) => {
          const orbit = (i / obj.tetras.length) * Math.PI * 2;
          const radius = 12 + Math.sin(el + i) * 2 + f.highs * 3;
          t.position.x = Math.cos(orbit + el) * radius;
          t.position.y = Math.sin(orbit * 2 + el) * radius;
          t.position.z = Math.sin(orbit + el) * radius;
          t.rotation.x = elScaled * 3 + i;
          t.rotation.y = elScaled * 2;
          t.rotation.z = orbit;
          const s = 0.5 + f.highs * 0.5;
          t.scale.set(s, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (0.5 + f.highs * 0.5) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const coreSize = 3 + f.bass * 2;
        obj.sphere.scale.set(coreSize, coreSize, coreSize);
        obj.sphere.rotation.x = el;
        obj.sphere.rotation.y = elScaled * 1.5;
        obj.sphere.rotation.z = elScaled * 0.5;
        obj.sphere.material.color.setStyle(sphereColor);
        obj.sphere.material.opacity = (0.3 + f.bass * 0.2) * blend;
        obj.sphere.material.wireframe = true;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'fractal') {
        cam.position.set(0 + shakeX, 5 + activeCameraHeight + shakeY, activeCameraDistance + 5 + shakeZ);
        cam.lookAt(0, 0, 0);
        const branches = 4;
        obj.cubes.forEach((c, i) => {
          const level = Math.floor(i / branches);
          const branchIndex = i % branches;
          const angle = (branchIndex / branches) * Math.PI * 2;
          const levelHeight = level * 3;
          const spreadFactor = Math.pow(0.7, level);
          const radius = 2 * spreadFactor + f.bass * spreadFactor * 2;
          c.position.x = Math.cos(angle + elScaled * 0.5) * radius;
          c.position.y = levelHeight - 5;
          c.position.z = Math.sin(angle + elScaled * 0.5) * radius;
          c.rotation.x = angle;
          c.rotation.y = el + level;
          c.rotation.z = 0;
          const s = (1.5 - level * 0.15) + f.bass * 0.5;
          c.scale.set(s * 0.4, s * 2, s * 0.4);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = ((1 - level * 0.1) * 0.7 + f.bass * 0.3) * blend;
          c.material.wireframe = false;
        });
        obj.octas.forEach((o, i) => {
          const level = Math.floor(i / (branches * 2));
          const branchPair = i % (branches * 2);
          const branchIndex = Math.floor(branchPair / 2);
          const side = branchPair % 2;
          const angle = (branchIndex / branches) * Math.PI * 2;
          const levelHeight = level * 3;
          const spreadFactor = Math.pow(0.7, level);
          const radius = (2 + side) * spreadFactor + f.mids * spreadFactor;
          const sideAngle = angle + (side === 0 ? -0.3 : 0.3) + elScaled * 0.3;
          o.position.x = Math.cos(sideAngle) * radius;
          o.position.y = levelHeight - 5 + (side === 0 ? 0.5 : -0.5);
          o.position.z = Math.sin(sideAngle) * radius;
          o.rotation.x = sideAngle + el;
          o.rotation.y = elScaled * 2;
          o.rotation.z = 0;
          const s = (0.8 - level * 0.1) + f.mids * 0.4;
          o.scale.set(s, s * 0.5, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = ((1 - level * 0.1) * 0.6 + f.mids * 0.4) * blend;
          o.material.wireframe = true;
        });
        obj.tetras.forEach((t, i) => {
          const swarmAngle = (i / obj.tetras.length) * Math.PI * 2;
          const swarmRadius = 8 + Math.sin(el + i) * 3 + f.highs * 2;
          const swarmHeight = Math.sin(elScaled * 2 + i * 0.5) * 8;
          t.position.x = Math.cos(swarmAngle + el) * swarmRadius;
          t.position.y = swarmHeight;
          t.position.z = Math.sin(swarmAngle + el) * swarmRadius;
          t.rotation.x = elScaled * 3 + i;
          t.rotation.y = swarmAngle;
          t.rotation.z = el;
          const s = 0.3 + f.highs * 0.4;
          t.scale.set(s, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (0.5 + f.highs * 0.5) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -7, 0);
        const trunkSize = 1.5 + f.bass * 0.5;
        obj.sphere.scale.set(trunkSize, 3, trunkSize);
        obj.sphere.rotation.y = elScaled * 0.2;
        obj.sphere.material.color.setStyle(sphereColor);
        obj.sphere.material.opacity = (0.8 + f.bass * 0.2) * blend;
        obj.sphere.material.wireframe = false;
      } else if (type === 'orbit2') {
        cam.position.set(0 + shakeX, 8 + activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        const star1X = Math.cos(el) * 4;
        const star1Z = Math.sin(el) * 4;
        const star2X = -star1X;
        const star2Z = -star1Z;
        obj.cubes.slice(0, 4).forEach((c, i) => {
          c.position.set(star1X, 0, star1Z);
          const orbitAngle = elScaled * 3 + (i / 4) * Math.PI * 2;
          const orbitRadius = 2 + f.bass * 1;
          c.position.x += Math.cos(orbitAngle) * orbitRadius;
          c.position.y = Math.sin(orbitAngle * 2) * 0.5;
          c.position.z += Math.sin(orbitAngle) * orbitRadius;
          c.rotation.x = orbitAngle;
          c.rotation.y = el;
          c.rotation.z = 0;
          const s = 0.8 + f.bass * 0.6;
          c.scale.set(s, s, s);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (0.8 + f.bass * 0.2) * blend;
          c.material.wireframe = false;
        });
        obj.cubes.slice(4).forEach((c, i) => {
          c.position.set(star2X, 0, star2Z);
          const orbitAngle = -elScaled * 3 + (i / 4) * Math.PI * 2;
          const orbitRadius = 2 + f.bass * 1;
          c.position.x += Math.cos(orbitAngle) * orbitRadius;
          c.position.y = Math.sin(orbitAngle * 2) * 0.5;
          c.position.z += Math.sin(orbitAngle) * orbitRadius;
          c.rotation.x = orbitAngle;
          c.rotation.y = -el;
          c.rotation.z = 0;
          const s = 0.8 + f.bass * 0.6;
          c.scale.set(s, s, s);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (0.8 + f.bass * 0.2) * blend;
          c.material.wireframe = false;
        });
        obj.octas.slice(0, 15).forEach((o, i) => {
          const angle = elScaled * 5 + i;
          const radius = 6 + Math.sin(el + i) * 2 + f.mids * 3;
          o.position.x = star1X + Math.cos(angle) * radius;
          o.position.y = Math.sin(angle * 1.5) * 2;
          o.position.z = star1Z + Math.sin(angle) * radius;
          o.rotation.x += 0.1;
          o.rotation.y = angle;
          o.rotation.z = 0;
          const s = 0.5 + f.mids * 0.5;
          o.scale.set(s, s, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (0.6 + f.mids * 0.4) * blend;
          o.material.wireframe = true;
        });
        obj.octas.slice(15).forEach((o, i) => {
          const angle = -elScaled * 5 + i;
          const radius = 6 + Math.sin(el + i) * 2 + f.mids * 3;
          o.position.x = star2X + Math.cos(angle) * radius;
          o.position.y = Math.sin(angle * 1.5) * 2;
          o.position.z = star2Z + Math.sin(angle) * radius;
          o.rotation.x += 0.1;
          o.rotation.y = angle;
          o.rotation.z = 0;
          const s = 0.5 + f.mids * 0.5;
          o.scale.set(s, s, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (0.6 + f.mids * 0.4) * blend;
          o.material.wireframe = true;
        });
        obj.tetras.forEach((t, i) => {
          const streamAngle = (i / obj.tetras.length) * Math.PI * 2;
          const streamProgress = (elScaled * 2 + i) % (Math.PI * 2);
          const t1 = streamProgress / (Math.PI * 2);
          t.position.x = star1X + (star2X - star1X) * t1;
          t.position.y = Math.sin(streamProgress * 3) * 1.5;
          t.position.z = star1Z + (star2Z - star1Z) * t1;
          t.rotation.x = streamProgress * 5;
          t.rotation.y = streamAngle;
          t.rotation.z = el;
          const s = 0.4 + f.highs * 0.4;
          t.scale.set(s, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = ((1 - Math.abs(t1 - 0.5) * 2) * 0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'ribbon') {
        cam.position.set(Math.sin(elScaled * 0.1) * 8 + shakeX, 5 + activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        const ribbonLength = obj.cubes.length;
        obj.cubes.forEach((c, i) => {
          const t = i / ribbonLength;
          const pathAngle = t * Math.PI * 4 + el;
          const radius = 5 + Math.sin(t * Math.PI * 3) * 2;
          const height = Math.sin(t * Math.PI * 2 + elScaled * 2) * 4;
          c.position.x = Math.cos(pathAngle) * radius;
          c.position.y = height + f.bass * 2;
          c.position.z = Math.sin(pathAngle) * radius;
          const nextT = (i + 1) / ribbonLength;
          const nextAngle = nextT * Math.PI * 4 + el;
          const nextRadius = 5 + Math.sin(nextT * Math.PI * 3) * 2;
          const nextHeight = Math.sin(nextT * Math.PI * 2 + elScaled * 2) * 4;
          const dx = Math.cos(nextAngle) * nextRadius - c.position.x;
          const dy = nextHeight - c.position.y;
          const dz = Math.sin(nextAngle) * nextRadius - c.position.z;
          c.rotation.y = Math.atan2(dx, dz);
          c.rotation.x = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
          c.rotation.z = Math.sin(el + i) * 0.3;
          const s = 0.8 + f.bass * 0.6;
          c.scale.set(s * 0.3, s * 0.3, s * 2);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = ((1 - Math.abs(t - 0.5) * 2) * 0.8 + f.bass * 0.2) * blend;
          c.material.wireframe = false;
        });
        obj.octas.forEach((o, i) => {
          const cubeIndex = Math.min(Math.floor((i / obj.octas.length) * ribbonLength), ribbonLength - 1);
          const attachedCube = obj.cubes[cubeIndex];
          const side = (i % 2) === 0 ? 1 : -1;
          const offset = (1 + f.mids) * side;
          o.position.x = attachedCube.position.x + Math.cos(el + i) * offset;
          o.position.y = attachedCube.position.y + Math.sin(elScaled * 2 + i) * offset;
          o.position.z = attachedCube.position.z + Math.sin(el + i) * offset;
          o.rotation.x = elScaled * 2 + i;
          o.rotation.y = el;
          o.rotation.z = elScaled * 3;
          const s = 0.4 + f.mids * 0.4;
          o.scale.set(s, s, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (0.7 + f.mids * 0.3) * blend;
          o.material.wireframe = true;
        });
        obj.tetras.forEach((t, i) => {
          const orbitAngle = (i / obj.tetras.length) * Math.PI * 2 + elScaled * 3;
          const orbitRadius = 10 + Math.sin(el + i) * 2 + f.highs * 3;
          t.position.x = Math.cos(orbitAngle) * orbitRadius;
          t.position.y = Math.sin(orbitAngle * 2) * 3 + f.highs;
          t.position.z = Math.sin(orbitAngle) * orbitRadius;
          t.rotation.x = elScaled * 4 + i;
          t.rotation.y = orbitAngle;
          t.rotation.z = elScaled * 2;
          const s = 0.5 + f.highs * 0.5;
          t.scale.set(s, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (0.5 + f.highs * 0.5) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'hourglass') {
        cam.position.set(0 + shakeX, activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        obj.cubes.forEach((c, i) => {
          const angle = (i / obj.cubes.length) * Math.PI * 2;
          const yPos = ((i / obj.cubes.length) - 0.5) * 20;
          const narrowFactor = 1 - Math.abs(yPos / 10);
          const radius = (2 + narrowFactor * 4) + f.bass * narrowFactor * 2;
          c.position.x = Math.cos(angle + el) * radius;
          c.position.y = yPos;
          c.position.z = Math.sin(angle + el) * radius;
          c.rotation.x = 0;
          c.rotation.y = angle + el;
          c.rotation.z = yPos * 0.1;
          const s = 1 + f.bass * 0.8;
          c.scale.set(s, s * 0.5, s);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = (0.6 + f.bass * 0.4) * blend;
          c.material.wireframe = true;
        });
        const sandCount = obj.tetras.length;
        obj.tetras.forEach((t, i) => {
          const fallProgress = ((elScaled * 2 + i * 0.1) % 10) / 10;
          const topY = 8;
          const bottomY = -8;
          const neckY = 0;
          let y = 0;
          let radius = 0;
          if (fallProgress < 0.3) {
            const topProgress = fallProgress / 0.3;
            y = topY - topProgress * (topY - neckY);
            radius = 3 - topProgress * 2.5;
          } else {
            const bottomProgress = (fallProgress - 0.3) / 0.7;
            y = neckY - bottomProgress * (neckY - bottomY);
            radius = 0.5 + bottomProgress * 2.5;
          }
          const angle = i * GOLDEN_ANGLE_DEGREES * (Math.PI / 180) + el;
          t.position.x = Math.cos(angle) * radius * f.mids;
          t.position.y = y;
          t.position.z = Math.sin(angle) * radius * f.mids;
          t.rotation.x = elScaled * 3 + i;
          t.rotation.y = angle;
          t.rotation.z = el;
          const s = 0.3 + f.highs * 0.3;
          t.scale.set(s, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (0.7 + f.highs * 0.3) * blend;
          t.material.wireframe = false;
        });
        obj.octas.forEach((o, i) => {
          const ringAngle = (i / obj.octas.length) * Math.PI * 2;
          const ringY = ((i / obj.octas.length) - 0.5) * 16;
          const ringRadius = 7 + Math.sin(el + i) * 1 + f.mids * 2;
          o.position.x = Math.cos(ringAngle + elScaled * 0.5) * ringRadius;
          o.position.y = ringY;
          o.position.z = Math.sin(ringAngle + elScaled * 0.5) * ringRadius;
          o.rotation.x = ringAngle;
          o.rotation.y = el + i;
          o.rotation.z = 0;
          const s = 0.6 + f.mids * 0.5;
          o.scale.set(s, s, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (0.4 + f.mids * 0.3) * blend;
          o.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const neckSize = 0.8 + f.bass * 0.3;
        obj.sphere.scale.set(neckSize, neckSize * 0.5, neckSize);
        obj.sphere.rotation.y = el;
        obj.sphere.material.color.setStyle(sphereColor);
        obj.sphere.material.opacity = (0.5 + f.bass * 0.3) * blend;
        obj.sphere.material.wireframe = true;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'snowflake') {
        cam.position.set(0 + shakeX, activeCameraHeight + shakeY, activeCameraDistance + 10 + shakeZ);
        cam.lookAt(0, 0, 0);
        const arms = 6;
        obj.cubes.forEach((c, i) => {
          const armIndex = i % arms;
          const segmentIndex = Math.floor(i / arms);
          const armAngle = (armIndex / arms) * Math.PI * 2;
          const segmentDist = (segmentIndex + 1) * 2;
          c.position.x = Math.cos(armAngle + elScaled * 0.1) * segmentDist;
          c.position.y = Math.sin(elScaled * 0.2 + i * 0.1) * 0.5 + f.bass;
          c.position.z = Math.sin(armAngle + elScaled * 0.1) * segmentDist;
          c.rotation.x = 0;
          c.rotation.y = armAngle;
          c.rotation.z = el + i;
          const s = (1.2 - segmentIndex * 0.15) + f.bass * 0.6;
          c.scale.set(s * 0.5, s * 0.3, s * 1.5);
          c.material.color.setStyle(cubeColor);
          c.material.opacity = ((1 - segmentIndex * 0.1) * 0.8 + f.bass * 0.2) * blend;
          c.material.wireframe = false;
        });
        obj.octas.forEach((o, i) => {
          const armIndex = i % arms;
          const branchIndex = Math.floor(i / arms);
          const armAngle = (armIndex / arms) * Math.PI * 2;
          const mainDist = (branchIndex % 3 + 1) * 2;
          const branchAngle = armAngle + ((branchIndex % 2 === 0) ? 0.5 : -0.5);
          const branchDist = 1.5 + f.mids;
          o.position.x = Math.cos(armAngle + elScaled * 0.1) * mainDist + Math.cos(branchAngle) * branchDist;
          o.position.y = Math.sin(elScaled * 0.3 + i * 0.1) * 0.3 + f.mids * 0.5;
          o.position.z = Math.sin(armAngle + elScaled * 0.1) * mainDist + Math.sin(branchAngle) * branchDist;
          o.rotation.x = branchAngle;
          o.rotation.y = el + i;
          o.rotation.z = 0;
          const s = 0.6 + f.mids * 0.4;
          o.scale.set(s, s * 0.2, s);
          o.material.color.setStyle(octahedronColor);
          o.material.opacity = (0.7 + f.mids * 0.3) * blend;
          o.material.wireframe = true;
        });
        obj.tetras.forEach((t, i) => {
          const ringAngle = (i / obj.tetras.length) * Math.PI * 2;
          const ringRadius = 8 + Math.sin(el + i) * 2 + f.highs * 2;
          const ringFloat = Math.sin(elScaled * 0.5 + i) * 0.5;
          t.position.x = Math.cos(ringAngle + elScaled * 0.2) * ringRadius;
          t.position.y = ringFloat + f.highs * 0.5;
          t.position.z = Math.sin(ringAngle + elScaled * 0.2) * ringRadius;
          t.rotation.x = elScaled * 2 + i;
          t.rotation.y = ringAngle;
          t.rotation.z = el;
          const s = 0.3 + f.highs * 0.4;
          t.scale.set(s, s, s);
          t.material.color.setStyle(tetrahedronColor);
          t.material.opacity = (0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const coreSize = 1.5 + Math.sin(el) * 0.3 + f.bass * 0.8;
        obj.sphere.scale.set(coreSize, coreSize * 0.5, coreSize);
        obj.sphere.rotation.y = elScaled * 0.5;
        obj.sphere.material.color.setStyle(sphereColor);
        obj.sphere.material.opacity = (0.9 + f.bass * 0.1) * blend;
        obj.sphere.material.wireframe = false;
        
        // Hide unused toruses and planes
        for (let i = 0; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        for (let i = 0; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
      } else if (type === 'cosmic') {
        // Cosmic Rings - Orbital toruses with solar panel planes creating a space station aesthetic
        // GEOMETRY ALLOCATION:
        // Cubes 0-7: Planet cores orbiting in a spherical formation
        // Toruses 0-19: Orbital rings rotating around planets and central axis
        // Planes 0-9: Solar panels rotating and tilting
        // Octas 0-29: Distant stars twinkling
        // Tetras 0-29: Energy particles zipping around
        
        const cosmicTime = elScaled * 0.8;
        const rotationSpeed = KEYFRAME_ONLY_ROTATION_SPEED;
        
        // Camera orbits around the cosmic structure
        const camAngle = rotationSpeed + activeCameraRotation;
        cam.position.set(
          Math.sin(camAngle) * activeCameraDistance * 1.2 + shakeX,
          5 + activeCameraHeight + Math.sin(cosmicTime * 0.3) * 2 + shakeY,
          Math.cos(camAngle) * activeCameraDistance * 1.2 + shakeZ
        );
        cam.lookAt(0, 0, 0);
        
        // === PLANET CORES ===
        // 8 cubes arranged in a spherical pattern, pulsing with bass
        obj.cubes.forEach((cube, i) => {
          const orbitAngle = (i / 8) * Math.PI * 2 + cosmicTime * 0.3;
          const orbitRadius = 12 + Math.sin(cosmicTime + i) * 2;
          const elevation = Math.sin((i / 8) * Math.PI * 2 + cosmicTime * 0.2) * 8;
          
          cube.position.x = Math.cos(orbitAngle) * orbitRadius;
          cube.position.y = elevation;
          cube.position.z = Math.sin(orbitAngle) * orbitRadius;
          
          const scale = (1.2 + f.bass * 0.5) * blend;
          cube.scale.set(scale, scale, scale);
          cube.rotation.x = cosmicTime + i;
          cube.rotation.y = cosmicTime * 0.7 + i * 0.5;
          
          cube.material.color.setStyle(cubeColor);
          cube.material.opacity = (0.6 + f.bass * 0.3) * blend;
        });
        
        // === ORBITAL RINGS (TORUSES) ===
        // 20 toruses creating orbital paths and ring systems
        obj.toruses.forEach((torus, i) => {
          if (i < 8) {
            // First 8: rings orbit around each planet
            const planetIndex = i;
            const planetAngle = (planetIndex / 8) * Math.PI * 2 + cosmicTime * 0.3;
            const orbitRadius = 12 + Math.sin(cosmicTime + planetIndex) * 2;
            const elevation = Math.sin((planetIndex / 8) * Math.PI * 2 + cosmicTime * 0.2) * 8;
            
            const ringOrbitAngle = cosmicTime * 2 + i * Math.PI / 4;
            const ringRadius = 2.5;
            
            torus.position.x = Math.cos(planetAngle) * orbitRadius + Math.cos(ringOrbitAngle) * ringRadius;
            torus.position.y = elevation + Math.sin(ringOrbitAngle) * ringRadius;
            torus.position.z = Math.sin(planetAngle) * orbitRadius;
            
            torus.rotation.x = cosmicTime * 1.5 + i;
            torus.rotation.y = cosmicTime + i * 0.3;
            
            const scale = (0.6 + f.mids * 0.3) * blend;
            torus.scale.set(scale, scale, scale);
            
            torus.material.color.setStyle(cubeColor);
            torus.material.opacity = (0.5 + f.mids * 0.4) * blend;
          } else {
            // Remaining 12: large rings rotating around central axis
            const ringAngle = (i - 8) / 12 * Math.PI * 2 + cosmicTime * 0.5;
            const radius = 18 + (i % 3) * 4;
            
            torus.position.x = Math.cos(ringAngle) * radius;
            torus.position.y = Math.sin(ringAngle * 2 + cosmicTime) * 3;
            torus.position.z = Math.sin(ringAngle) * radius;
            
            torus.rotation.x = cosmicTime * 0.5 + i;
            torus.rotation.z = ringAngle;
            
            const scale = (1.5 + f.bass * 0.4) * blend;
            torus.scale.set(scale, scale, scale);
            
            torus.material.color.setStyle(octahedronColor);
            torus.material.opacity = (0.4 + f.bass * 0.3) * blend;
          }
        });
        
        // === SOLAR PANELS (PLANES) ===
        // 10 planes acting as solar panels, rotating and catching light
        obj.planes.forEach((plane, i) => {
          const panelAngle = (i / 10) * Math.PI * 2 + cosmicTime * 0.4;
          const radius = 20 + (i % 2) * 5;
          
          plane.position.x = Math.cos(panelAngle) * radius;
          plane.position.y = Math.sin(cosmicTime + i * 0.5) * 6;
          plane.position.z = Math.sin(panelAngle) * radius;
          
          // Panels slowly rotate and tilt
          plane.rotation.x = cosmicTime * 0.3 + i;
          plane.rotation.y = panelAngle;
          plane.rotation.z = Math.sin(cosmicTime + i) * 0.3;
          
          const scale = (1.2 + f.highs * 0.5) * blend;
          plane.scale.set(scale, scale, 1);
          
          plane.material.color.setStyle(tetrahedronColor);
          plane.material.opacity = (0.6 + f.mids * 0.3) * blend;
        });
        
        // === STARS (OCTAHEDRONS) ===
        // 30 octas as distant twinkling stars
        obj.octas.forEach((octa, i) => {
          if (i >= 30) return; // Skip environment octas
          
          const angle = (i / 30) * Math.PI * 2;
          const radius = 30 + (i % 5) * 8;
          const yPos = (i % 7 - 3) * 10;
          
          octa.position.x = Math.cos(angle + cosmicTime * 0.1) * radius;
          octa.position.y = yPos + Math.sin(cosmicTime + i) * 2;
          octa.position.z = Math.sin(angle + cosmicTime * 0.1) * radius;
          
          const twinkle = 0.3 + Math.sin(cosmicTime * 3 + i) * 0.2 + f.highs * 0.3;
          const scale = (0.5 + twinkle * 0.5) * blend;
          octa.scale.set(scale, scale, scale);
          
          octa.rotation.x += 0.02;
          octa.rotation.y += 0.03;
          
          octa.material.color.setStyle(tetrahedronColor);
          octa.material.opacity = twinkle * blend;
        });
        
        // === ENERGY PARTICLES (TETRAHEDRONS) ===
        // 30 tetras zipping around as energy particles
        obj.tetras.forEach((tetra, i) => {
          const pathAngle = (i / 30) * Math.PI * 2;
          const speed = 0.5 + (i % 3) * 0.3;
          const radius = 15 + (i % 4) * 5;
          
          const x = Math.cos(pathAngle + cosmicTime * speed) * radius;
          const y = Math.sin(cosmicTime * speed * 1.5 + i) * 8;
          const z = Math.sin(pathAngle + cosmicTime * speed) * radius;
          
          tetra.position.set(x, y, z);
          
          tetra.rotation.x = cosmicTime * 2 + i;
          tetra.rotation.y = cosmicTime * 1.5 + i;
          
          const scale = (0.4 + f.highs * 0.4) * blend;
          tetra.scale.set(scale, scale, scale);
          
          tetra.material.color.setStyle(octahedronColor);
          tetra.material.opacity = (0.7 + f.highs * 0.3) * blend;
        });
        
        // Sphere as central power core
        obj.sphere.position.set(0, 0, 0);
        const sphereScale = (2 + f.bass * 0.8) * blend;
        obj.sphere.scale.set(sphereScale, sphereScale, sphereScale);
        obj.sphere.rotation.y = cosmicTime * 0.5;
        obj.sphere.material.color.setStyle(cubeColor);
        obj.sphere.material.opacity = (0.4 + f.bass * 0.3) * blend;
      } else if (type === 'cityscape') {
        // Cityscape - Buildings with windows and traffic rings
        const cityTime = elScaled * 0.5;
        cam.position.set(Math.sin(elScaled * 0.1) * activeCameraDistance + shakeX, 8 + activeCameraHeight + shakeY, Math.cos(elScaled * 0.1) * activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        
        obj.cubes.forEach((cube, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const radius = 12 + (i % 3) * 3;
          cube.position.set(Math.cos(angle) * radius, (i % 4) * 3, Math.sin(angle) * radius);
          const height = (2 + (i % 3) * 1.5 + f.bass * 0.5) * blend;
          cube.scale.set(1.5, height, 1.5);
          cube.material.color.setStyle(cubeColor);
          cube.material.opacity = (0.7 + f.bass * 0.2) * blend;
        });
        
        obj.planes.forEach((plane, i) => {
          const buildingIdx = i % 12;
          const angle = (buildingIdx / 12) * Math.PI * 2;
          const radius = 12 + (buildingIdx % 3) * 3;
          const floor = Math.floor(i / 12);
          plane.position.set(Math.cos(angle) * radius, floor * 2, Math.sin(angle) * radius);
          plane.rotation.y = angle;
          plane.scale.set(0.8, 0.8, 1);
          plane.material.color.setStyle(tetrahedronColor);
          plane.material.opacity = (0.5 + f.highs * 0.4) * blend;
        });
        
        obj.toruses.forEach((torus, i) => {
          const y = -2 + (i % 4) * 0.5;
          const radius = 8 + (i % 4) * 4;
          const angle = cityTime + i;
          torus.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
          torus.rotation.x = Math.PI / 2;
          const scale = (0.5 + f.mids * 0.3) * blend;
          torus.scale.set(scale, scale, scale);
          torus.material.color.setStyle(octahedronColor);
          torus.material.opacity = (0.6 + f.mids * 0.3) * blend;
        });
        
        obj.octas.forEach((octa, i) => { if (i >= 30) return; octa.position.set((Math.random() - 0.5) * 30, (Math.random() * 10), (Math.random() - 0.5) * 30); const scale = (0.3 + f.highs * 0.3) * blend; octa.scale.set(scale, scale, scale); octa.material.color.setStyle(tetrahedronColor); octa.material.opacity = 0.6 * blend; });
        obj.tetras.forEach((tetra, i) => { const angle = cityTime * 2 + i; tetra.position.set(Math.cos(angle) * 15, 5 + Math.sin(cityTime + i) * 3, Math.sin(angle) * 15); tetra.scale.set(0.4, 0.4, 0.4); tetra.material.color.setStyle(octahedronColor); tetra.material.opacity = 0.7 * blend; });
        obj.sphere.position.set(0, -1000, 0); obj.sphere.scale.set(0.01, 0.01, 0.01);
      } else if (type === 'oceanwaves') {
        // Ocean Waves - Undulating water surfaces
        const oceanTime = elScaled * 1.2;
        cam.position.set(Math.sin(oceanTime * 0.2) * activeCameraDistance + shakeX, 6 + activeCameraHeight + shakeY, Math.cos(oceanTime * 0.2) * activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        
        obj.planes.forEach((plane, i) => {
          const x = ((i % 5) - 2) * 6;
          const z = (Math.floor(i / 5) - 2) * 6;
          const waveHeight = Math.sin(oceanTime + i * 0.3 + x * 0.1) * 2 * (1 + f.bass);
          plane.position.set(x, waveHeight, z);
          plane.rotation.x = Math.sin(oceanTime + i) * 0.2;
          plane.rotation.z = Math.cos(oceanTime + i) * 0.2;
          plane.scale.set(2, 2, 1);
          plane.material.color.setStyle(cubeColor);
          plane.material.opacity = (0.5 + f.mids * 0.3) * blend;
        });
        
        obj.toruses.forEach((torus, i) => {
          const angle = (i / 15) * Math.PI * 2 + oceanTime;
          const radius = 8 + Math.sin(oceanTime + i) * 3;
          torus.position.set(Math.cos(angle) * radius, Math.sin(oceanTime * 2 + i) * 4 - 2, Math.sin(angle) * radius);
          const scale = (0.6 + f.mids * 0.4) * blend;
          torus.scale.set(scale, scale, scale);
          torus.material.color.setStyle(octahedronColor);
          torus.material.opacity = (0.4 + f.highs * 0.3) * blend;
        });
        
        obj.cubes.forEach((cube, i) => { cube.position.set((Math.random() - 0.5) * 20, -4, (Math.random() - 0.5) * 20); cube.scale.set(1 + Math.random(), 1 + Math.random(), 1 + Math.random()); cube.material.color.setStyle(cubeColor); cube.material.opacity = 0.6 * blend; });
        obj.octas.forEach((octa, i) => { if (i >= 40) return; const angle = oceanTime + i; octa.position.set(Math.cos(angle) * 15, Math.sin(oceanTime * 3 + i) * 3, Math.sin(angle) * 15); const scale = (0.3 + f.highs * 0.3) * blend; octa.scale.set(scale, scale, scale); octa.material.color.setStyle(tetrahedronColor); octa.material.opacity = 0.5 * blend; });
        obj.tetras.forEach((tetra, i) => { const angle = oceanTime * 1.5 + i; tetra.position.set(Math.cos(angle) * 12, Math.sin(oceanTime + i) * 3, Math.sin(angle) * 12); tetra.rotation.x = oceanTime + i; tetra.scale.set(0.5, 0.5, 0.5); tetra.material.color.setStyle(octahedronColor); tetra.material.opacity = 0.7 * blend; });
        obj.sphere.position.set(0, -1000, 0); obj.sphere.scale.set(0.01, 0.01, 0.01);
      } else if (type === 'forest') {
        // Forest Scene - Trees with leaves
        const forestTime = elScaled * 0.6;
        cam.position.set(Math.sin(forestTime * 0.15) * activeCameraDistance + shakeX, 5 + activeCameraHeight + shakeY, Math.cos(forestTime * 0.15) * activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        
        obj.cubes.forEach((cube, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const radius = 8 + (i % 3) * 4;
          cube.position.set(Math.cos(angle) * radius, 2, Math.sin(angle) * radius);
          cube.scale.set(0.8, (4 + f.bass) * blend, 0.8);
          cube.rotation.y = angle;
          cube.material.color.setStyle(cubeColor);
          cube.material.opacity = 0.7 * blend;
        });
        
        obj.planes.forEach((plane, i) => {
          const treeIdx = i % 10;
          const angle = (treeIdx / 10) * Math.PI * 2;
          const radius = 8 + (treeIdx % 3) * 4;
          const leafAngle = (i / 3) * Math.PI * 2;
          plane.position.set(Math.cos(angle) * radius + Math.cos(leafAngle) * 2, 4 + Math.sin(forestTime + i) * 0.5, Math.sin(angle) * radius + Math.sin(leafAngle) * 2);
          plane.rotation.x = Math.sin(forestTime + i) * 0.3;
          plane.rotation.y = leafAngle;
          const scale = (1 + f.mids * 0.3) * blend;
          plane.scale.set(scale, scale, 1);
          plane.material.color.setStyle(octahedronColor);
          plane.material.opacity = (0.6 + f.mids * 0.2) * blend;
        });
        
        obj.toruses.forEach((torus, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const radius = 5 + (i % 3) * 3;
          torus.position.set(Math.cos(angle) * radius, 0.2 + Math.sin(forestTime + i) * 0.1, Math.sin(angle) * radius);
          torus.rotation.x = Math.PI / 2;
          const scale = (0.6 + f.bass * 0.3) * blend;
          torus.scale.set(scale, scale, 0.3);
          torus.material.color.setStyle(tetrahedronColor);
          torus.material.opacity = 0.7 * blend;
        });
        
        obj.octas.forEach((octa, i) => { if (i >= 25) return; octa.position.set((Math.random() - 0.5) * 25, 1 + Math.sin(forestTime * 2 + i) * 3, (Math.random() - 0.5) * 25); const scale = (0.2 + f.highs * 0.3) * blend; octa.scale.set(scale, scale, scale); octa.material.color.setStyle(tetrahedronColor); octa.material.opacity = (0.7 + f.highs * 0.3) * blend; });
        obj.tetras.forEach((tetra, i) => { const angle = forestTime + i; tetra.position.set(Math.cos(angle) * 15, 3 + Math.sin(forestTime * 2 + i) * 2, Math.sin(angle) * 15); tetra.rotation.x = forestTime + i; tetra.scale.set(0.4, 0.4, 0.4); tetra.material.color.setStyle(octahedronColor); tetra.material.opacity = 0.6 * blend; });
        obj.sphere.position.set(0, -1000, 0); obj.sphere.scale.set(0.01, 0.01, 0.01);
      } else if (type === 'portals') {
        // Portal Network: Spinning portal rings with energy swirls
        const t = elScaled;
        const camAngle = KEYFRAME_ONLY_ROTATION_SPEED;
        cam.position.set(Math.sin(camAngle + activeCameraRotation) * activeCameraDistance * 1.2 + shakeX, 8 + activeCameraHeight + shakeY, Math.cos(camAngle + activeCameraRotation) * activeCameraDistance * 1.2 + shakeZ);
        cam.lookAt(0, 0, 0);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 8, octas: 35, tetras: 20, toruses: 20, planes: 10 };
        
        // Portal frames (cubes)
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const angle = (i / req.cubes) * Math.PI * 2;
          const radius = 15;
          obj.cubes[i].position.set(Math.cos(angle) * radius, (i % 2) * 6 - 3, Math.sin(angle) * radius);
          obj.cubes[i].scale.set((1.5 + f.bass * 0.4) * blend, (1.5 + f.bass * 0.4) * blend, 0.5 * blend);
          obj.cubes[i].rotation.y = angle + Math.PI / 2;
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.8 + f.bass * 0.2) * blend;
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Portal rings (toruses) - spin at different speeds
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          const portalIdx = i % req.cubes;
          const angle = (portalIdx / req.cubes) * Math.PI * 2;
          const px = Math.cos(angle) * 15;
          const pz = Math.sin(angle) * 15;
          const py = (portalIdx % 2) * 6 - 3;
          const ringAngle = t * (1 + i * 0.2) + i;
          obj.toruses[i].position.set(px, py, pz);
          obj.toruses[i].rotation.x = Math.PI / 2;
          obj.toruses[i].rotation.y = ringAngle;
          obj.toruses[i].scale.set((2 + f.mids * 0.6) * blend, (2 + f.mids * 0.6) * blend, (2 + f.mids * 0.6) * blend);
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.5 + Math.sin(t + i) * 0.2 + f.mids * 0.3) * blend;
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Portal surfaces (planes) - ripple effect
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const portalIdx = i % req.cubes;
          const angle = (portalIdx / req.cubes) * Math.PI * 2;
          obj.planes[i].position.set(Math.cos(angle) * 15, (portalIdx % 2) * 6 - 3, Math.sin(angle) * 15);
          obj.planes[i].rotation.y = angle + Math.PI / 2;
          obj.planes[i].rotation.x = Math.sin(t * 2 + i) * 0.1;
          obj.planes[i].scale.set((2.5 + Math.sin(t * 3 + i) * 0.5 + f.highs * 0.4) * blend, (2.5 + Math.sin(t * 3 + i) * 0.5 + f.highs * 0.4) * blend, 1);
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.3 + Math.sin(t * 2 + i) * 0.2) * blend;
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Energy particles swirling between portals
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const swirlAngle = t * 2 + (i / maxOctas) * Math.PI * 4;
          const swirlRadius = 5 + (i % 10);
          obj.octas[i].position.set(Math.cos(swirlAngle) * swirlRadius, Math.sin(t + i) * 8, Math.sin(swirlAngle) * swirlRadius);
          obj.octas[i].scale.set((0.3 + f.highs * 0.3) * blend, (0.3 + f.highs * 0.3) * blend, (0.3 + f.highs * 0.3) * blend);
          obj.octas[i].rotation.x += 0.05; obj.octas[i].rotation.y += 0.06;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (0.7 + f.highs * 0.3) * blend;
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Warping effects (tetras)
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const angle = (i / req.tetras) * Math.PI * 2 + t * 3;
          obj.tetras[i].position.set(Math.cos(angle) * 10, Math.sin(t * 2 + i) * 6, Math.sin(angle) * 10);
          obj.tetras[i].rotation.x = t * 3 + i; obj.tetras[i].rotation.y = t * 2;
          obj.tetras[i].scale.set((0.6 + f.mids * 0.4) * blend, (0.6 + f.mids * 0.4) * blend, (0.6 + f.mids * 0.4) * blend);
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (0.6 + f.mids * 0.3) * blend;
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001);
          obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, Math.sin(t) * 2, 0);
        const sScale = (1.5 + f.bass * 0.6) * blend;
        obj.sphere.scale.set(sScale, sScale, sScale);
        obj.sphere.rotation.y = t * 0.5;
        obj.sphere.material.color.setStyle(cubeColor);
        obj.sphere.material.opacity = (0.5 + f.bass * 0.3) * blend;
      } else if (type === 'discoball') {
        // Disco Ball: Mirror panels rotating with light rings
        const t = elScaled;
        cam.position.set(Math.sin(t * 0.2) * activeCameraDistance * 1.3 + shakeX, 3 + activeCameraHeight + shakeY, Math.cos(t * 0.2) * activeCameraDistance * 1.3 + shakeZ);
        cam.lookAt(0, 0, 0);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 6, octas: 30, tetras: 25, toruses: 12, planes: 40 };
        
        // Central disco ball structure (cubes)
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const angle = (i / req.cubes) * Math.PI * 2;
          obj.cubes[i].position.set(Math.cos(angle) * 2, Math.sin(angle + Math.PI/2) * 2, Math.sin(angle) * 2);
          obj.cubes[i].scale.set((0.8 + f.bass * 0.3) * blend, (0.8 + f.bass * 0.3) * blend, (0.8 + f.bass * 0.3) * blend);
          obj.cubes[i].rotation.x = t; obj.cubes[i].rotation.y = t * 0.8;
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.9 + f.bass * 0.1) * blend;
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Light rings (toruses) orbiting the disco ball
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          const angle = t * 0.5 + (i / req.toruses) * Math.PI * 2;
          const radius = 6 + (i % 3) * 2;
          obj.toruses[i].position.set(Math.cos(angle) * radius, Math.sin(angle + i) * 4, Math.sin(angle) * radius);
          obj.toruses[i].rotation.x = angle; obj.toruses[i].rotation.y = t + i;
          obj.toruses[i].scale.set((0.7 + f.mids * 0.4) * blend, (0.7 + f.mids * 0.4) * blend, (0.7 + f.mids * 0.4) * blend);
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.6 + f.mids * 0.4) * blend;
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Mirror panels (planes) - rotate independently
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const layer = Math.floor(i / 8);
          const angleInLayer = (i % 8) / 8 * Math.PI * 2;
          const radius = 10 + layer * 3;
          obj.planes[i].position.set(Math.cos(angleInLayer + t * (0.3 + layer * 0.1)) * radius, (layer - 2) * 3, Math.sin(angleInLayer + t * (0.3 + layer * 0.1)) * radius);
          obj.planes[i].rotation.x = t + i * 0.1; obj.planes[i].rotation.y = angleInLayer; obj.planes[i].rotation.z = Math.sin(t + i) * 0.3;
          obj.planes[i].scale.set((1 + f.highs * 0.5) * blend, (1 + f.highs * 0.5) * blend, 1);
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.7 + f.highs * 0.3) * blend;
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Light beams (octas)
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const angle = (i / maxOctas) * Math.PI * 2 + t;
          obj.octas[i].position.set(Math.cos(angle) * 15, Math.sin(t * 1.5 + i) * 8, Math.sin(angle) * 15);
          obj.octas[i].scale.set((0.4 + f.highs * 0.6) * blend, (0.4 + f.highs * 0.6) * blend, (0.4 + f.highs * 0.6) * blend);
          obj.octas[i].rotation.x += 0.04; obj.octas[i].rotation.y += 0.05;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (0.5 + Math.sin(t * 3 + i) * 0.3 + f.highs * 0.2) * blend;
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Sparkles (tetras)
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const angle = (i / req.tetras) * Math.PI * 2 + t * 2;
          obj.tetras[i].position.set(Math.cos(angle) * 12, Math.sin(t * 3 + i) * 7, Math.sin(angle) * 12);
          obj.tetras[i].rotation.x = t * 4; obj.tetras[i].rotation.y = t * 3;
          obj.tetras[i].scale.set((0.3 + f.highs * 0.5 + Math.sin(t * 5 + i) * 0.2) * blend, (0.3 + f.highs * 0.5 + Math.sin(t * 5 + i) * 0.2) * blend, (0.3 + f.highs * 0.5 + Math.sin(t * 5 + i) * 0.2) * blend);
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (0.5 + Math.sin(t * 5 + i) * 0.5) * blend;
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, 0, 0);
        obj.sphere.scale.set((2 + f.bass * 0.5) * blend, (2 + f.bass * 0.5) * blend, (2 + f.bass * 0.5) * blend);
        obj.sphere.rotation.y = t * 0.3;
        obj.sphere.material.color.setStyle(cubeColor);
        obj.sphere.material.opacity = (0.8 + f.bass * 0.2) * blend;
      } else if (type === 'windturbines') {
        // Wind Turbines: Spinning blades with rotation rings
        const t = elScaled;
        cam.position.set(Math.sin(KEYFRAME_ONLY_ROTATION_SPEED + activeCameraRotation) * activeCameraDistance * 1.4 + shakeX, 8 + activeCameraHeight + shakeY, Math.cos(KEYFRAME_ONLY_ROTATION_SPEED + activeCameraRotation) * activeCameraDistance * 1.4 + shakeZ);
        cam.lookAt(0, 2, 0);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 8, octas: 30, tetras: 15, toruses: 8, planes: 24 };
        
        // Turbine towers (cubes)
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const angle = (i / req.cubes) * Math.PI * 2;
          obj.cubes[i].position.set(Math.cos(angle) * 18, 2, Math.sin(angle) * 18);
          obj.cubes[i].scale.set((0.8 * blend, (3 + f.bass * 0.3) * blend, 0.8 * blend));
          obj.cubes[i].rotation.y = angle + Math.PI / 2;
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.9 + f.bass * 0.1) * blend;
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Rotation rings (toruses) showing motion paths
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          const angle = (i / req.toruses) * Math.PI * 2;
          obj.toruses[i].position.set(Math.cos(angle) * 18, 5, Math.sin(angle) * 18);
          obj.toruses[i].rotation.y = angle + Math.PI / 2; obj.toruses[i].rotation.z = Math.PI / 2;
          obj.toruses[i].scale.set((2 + f.mids * 0.3) * blend, (2 + f.mids * 0.3) * blend, (2 + f.mids * 0.3) * blend);
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.3 + f.mids * 0.2) * blend;
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Turbine blades (planes) - 3 blades per turbine
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const turbineIdx = Math.floor(i / 3);
          const bladeIdx = i % 3;
          const turbineAngle = (turbineIdx / req.cubes) * Math.PI * 2;
          const bladeAngle = t * 2 + (bladeIdx / 3) * Math.PI * 2 / 3;
          const tx = Math.cos(turbineAngle) * 18;
          const tz = Math.sin(turbineAngle) * 18;
          obj.planes[i].position.set(tx + Math.cos(bladeAngle) * 2, 5 + Math.sin(bladeAngle) * 2, tz);
          obj.planes[i].rotation.y = turbineAngle + Math.PI / 2; obj.planes[i].rotation.z = bladeAngle;
          obj.planes[i].scale.set((1.5 * blend, 3 * blend, 1));
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.8 + f.highs * 0.2) * blend;
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Wind particles (octas)
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const flowX = -30 + (t * 5 + i * 2) % 60;
          obj.octas[i].position.set(flowX, 3 + Math.sin(i) * 4, (i % 5 - 2) * 8);
          obj.octas[i].scale.set((0.3 + f.highs * 0.3) * blend, (0.3 + f.highs * 0.3) * blend, (0.3 + f.highs * 0.3) * blend);
          obj.octas[i].rotation.x += 0.02; obj.octas[i].rotation.y += 0.03;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (0.4 + f.highs * 0.2) * blend;
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Energy flow (tetras)
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const turbineIdx = i % req.cubes;
          const turbineAngle = (turbineIdx / req.cubes) * Math.PI * 2;
          const heightFlow = 6 - (t * 3 + i) % 6;
          obj.tetras[i].position.set(Math.cos(turbineAngle) * 18, heightFlow, Math.sin(turbineAngle) * 18);
          obj.tetras[i].rotation.x = t * 2; obj.tetras[i].rotation.y = t * 3;
          obj.tetras[i].scale.set((0.4 + f.mids * 0.3) * blend, (0.4 + f.mids * 0.3) * blend, (0.4 + f.mids * 0.3) * blend);
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (0.7 * (1 - heightFlow / 6)) * blend;
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, -1000, 0); obj.sphere.scale.set(0.01, 0.01, 0.01);
      } else if (type === 'clockwork') {
        // Clock Mechanism: Interlocking gears and clock faces
        const t = elScaled;
        cam.position.set(Math.sin(t * 0.1) * activeCameraDistance * 1.1 + shakeX, 4 + activeCameraHeight + shakeY, Math.cos(t * 0.1) * activeCameraDistance * 1.1 + shakeZ);
        cam.lookAt(0, 0, 0);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 10, octas: 12, tetras: 8, toruses: 15, planes: 5 };
        
        // Mechanism parts (cubes) - pistons
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const angle = (i / req.cubes) * Math.PI * 2;
          const extend = Math.sin(t * 2 + i) * 1.5;
          obj.cubes[i].position.set(Math.cos(angle) * (8 + extend), 0, Math.sin(angle) * (8 + extend));
          obj.cubes[i].scale.set((0.6 + f.bass * 0.2) * blend, (1 + Math.abs(extend) * 0.3) * blend, (0.6 + f.bass * 0.2) * blend);
          obj.cubes[i].rotation.y = angle;
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.9 + f.bass * 0.1) * blend;
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Gears (toruses) - rotating at different speeds
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          const layer = Math.floor(i / 5);
          const angleInLayer = (i % 5) / 5 * Math.PI * 2;
          const radius = 4 + layer * 4;
          const rotSpeed = (i % 2 === 0 ? 1 : -1) * (1 + layer * 0.3);
          obj.toruses[i].position.set(Math.cos(angleInLayer) * radius, layer * 2 - 2, Math.sin(angleInLayer) * radius);
          obj.toruses[i].rotation.z = t * rotSpeed;
          obj.toruses[i].scale.set((1.5 + f.mids * 0.3) * blend, (1.5 + f.mids * 0.3) * blend, (0.3 * blend));
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.8 + f.mids * 0.2) * blend;
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Clock faces (planes)
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const angle = (i / req.planes) * Math.PI * 2;
          obj.planes[i].position.set(Math.cos(angle) * 12, i * 2 - 4, Math.sin(angle) * 12);
          obj.planes[i].rotation.y = angle + Math.PI / 2;
          obj.planes[i].scale.set((2.5 * blend, 2.5 * blend, 1));
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.6 + f.highs * 0.3) * blend;
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Hour markers (octas)
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const hourAngle = (i / 12) * Math.PI * 2 - t * 0.1;
          obj.octas[i].position.set(Math.cos(hourAngle) * 14, 0, Math.sin(hourAngle) * 14);
          obj.octas[i].scale.set((0.5 + f.highs * 0.3) * blend, (0.5 + f.highs * 0.3) * blend, (0.5 + f.highs * 0.3) * blend);
          obj.octas[i].rotation.x += 0.02; obj.octas[i].rotation.y += 0.03;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (0.8 + f.highs * 0.2) * blend;
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Pendulum weights (tetras)
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const swing = Math.sin(t * 1.5 + i) * 3;
          obj.tetras[i].position.set(swing, -4 - i * 0.5, 0);
          obj.tetras[i].rotation.x = t + i; obj.tetras[i].rotation.y = swing * 0.2;
          obj.tetras[i].scale.set((0.7 + f.mids * 0.3) * blend, (0.7 + f.mids * 0.3) * blend, (0.7 + f.mids * 0.3) * blend);
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (0.8 + f.mids * 0.2) * blend;
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, 0, 0);
        obj.sphere.scale.set((1.2 + f.bass * 0.4) * blend, (1.2 + f.bass * 0.4) * blend, (1.2 + f.bass * 0.4) * blend);
        obj.sphere.rotation.y = -t * 0.5;
        obj.sphere.material.color.setStyle(cubeColor);
        obj.sphere.material.opacity = (0.7 + f.bass * 0.3) * blend;
      } else if (type === 'neontunnel') {
        // Neon Tunnel: Pulsing rings with neon signs
        const t = elScaled;
        const tunnelProgress = t * 3;
        cam.position.set(shakeX, 2 + activeCameraHeight + shakeY, -10 + tunnelProgress % 40 + shakeZ);
        cam.lookAt(0, 0, tunnelProgress % 40 + 20);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 6, octas: 35, tetras: 20, toruses: 25, planes: 15 };
        
        // Support structures (cubes)
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const z = (i * 8) - (tunnelProgress % 48);
          obj.cubes[i].position.set(0, 0, z);
          obj.cubes[i].scale.set((0.5 + f.bass * 0.2) * blend, (0.5 + f.bass * 0.2) * blend, (1.5 * blend));
          obj.cubes[i].rotation.y = t * 0.5;
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.7 + f.bass * 0.3) * blend * Math.max(0, 1 - Math.abs(z - 10) / 30);
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Tunnel rings (toruses) - pulse outward
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          const z = (i * 4) - (tunnelProgress % 100);
          const pulse = Math.sin(t * 2 - i * 0.5) * 0.3;
          obj.toruses[i].position.set(0, 0, z);
          obj.toruses[i].rotation.x = Math.PI / 2;
          obj.toruses[i].scale.set((4 + pulse + f.bass * 0.5) * blend, (4 + pulse + f.bass * 0.5) * blend, (0.5 * blend));
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.6 + Math.sin(t * 3 - i) * 0.3) * blend * Math.max(0, 1 - Math.abs(z - 10) / 30);
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Neon signs (planes) - flicker
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const side = i % 4;
          const z = Math.floor(i / 4) * 6 - (tunnelProgress % 90);
          const angle = side * Math.PI / 2;
          const flicker = Math.sin(t * 10 + i * 2) > 0.7 ? 1 : 0.4;
          obj.planes[i].position.set(Math.cos(angle) * 6, Math.sin(angle) * 6, z);
          obj.planes[i].rotation.y = angle;
          obj.planes[i].scale.set((1.5 * blend, 1.5 * blend, 1));
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.8 * flicker + f.highs * 0.2) * blend * Math.max(0, 1 - Math.abs(z - 10) / 25);
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Glow particles (octas)
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const z = (i * 2) - (tunnelProgress % 70);
          const angle = (i / maxOctas) * Math.PI * 4;
          obj.octas[i].position.set(Math.cos(angle + t) * 5, Math.sin(angle + t) * 5, z);
          obj.octas[i].scale.set((0.3 + f.highs * 0.4) * blend, (0.3 + f.highs * 0.4) * blend, (0.3 + f.highs * 0.4) * blend);
          obj.octas[i].rotation.x += 0.06; obj.octas[i].rotation.y += 0.07;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (0.8 + f.highs * 0.2) * blend * Math.max(0, 1 - Math.abs(z - 10) / 25);
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Speed lines (tetras)
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const z = (i * 3) - (tunnelProgress * 2 % 60);
          const angle = (i / req.tetras) * Math.PI * 2;
          obj.tetras[i].position.set(Math.cos(angle) * 7, Math.sin(angle) * 7, z);
          obj.tetras[i].rotation.z = angle; obj.tetras[i].rotation.y = Math.PI / 2;
          obj.tetras[i].scale.set((0.2 * blend, 0.2 * blend, (2 + f.mids * 0.5) * blend));
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (0.7 + f.mids * 0.3) * blend * Math.max(0, 1 - Math.abs(z - 10) / 20);
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, -1000, 0); obj.sphere.scale.set(0.01, 0.01, 0.01);
      } else if (type === 'atommodel') {
        // Atom Model: Electron orbits with particles
        const t = elScaled;
        cam.position.set(Math.sin(t * 0.15) * activeCameraDistance * 1.2 + shakeX, 6 + activeCameraHeight + shakeY, Math.cos(t * 0.15) * activeCameraDistance * 1.2 + shakeZ);
        cam.lookAt(0, 0, 0);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 3, octas: 15, tetras: 20, toruses: 12, planes: 6 };
        
        // Nucleus (cubes)
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const angle = (i / req.cubes) * Math.PI * 2 + t;
          obj.cubes[i].position.set(Math.cos(angle) * 1.5, Math.sin(angle + Math.PI/3) * 1.5, Math.sin(angle) * 1.5);
          obj.cubes[i].scale.set((1.2 + f.bass * 0.4) * blend, (1.2 + f.bass * 0.4) * blend, (1.2 + f.bass * 0.4) * blend);
          obj.cubes[i].rotation.x = t; obj.cubes[i].rotation.y = t * 0.8;
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.9 + f.bass * 0.1) * blend;
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Electron orbits (toruses) at different angles
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          const orbitTilt = (i / req.toruses) * Math.PI;
          const orbitRadius = 6 + (i % 3) * 3;
          obj.toruses[i].position.set(0, 0, 0);
          obj.toruses[i].rotation.x = orbitTilt; obj.toruses[i].rotation.y = t * 0.3 + i;
          obj.toruses[i].scale.set((orbitRadius / 6 * blend, orbitRadius / 6 * blend, (0.1 * blend)));
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.4 + f.mids * 0.2) * blend;
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Orbital planes (planes)
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const tilt = (i / req.planes) * Math.PI / 2;
          obj.planes[i].position.set(0, 0, 0);
          obj.planes[i].rotation.x = tilt; obj.planes[i].rotation.z = t * 0.2 + i;
          obj.planes[i].scale.set((12 * blend, 12 * blend, 1));
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.15 + f.highs * 0.1) * blend;
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Electrons (octas)
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const orbitIdx = i % req.toruses;
          const orbitTilt = (orbitIdx / req.toruses) * Math.PI;
          const orbitRadius = 6 + (orbitIdx % 3) * 3;
          const orbitAngle = t * (1 + orbitIdx * 0.2) + (i / maxOctas) * Math.PI * 2;
          const ex = Math.cos(orbitAngle) * orbitRadius;
          const ey = Math.sin(orbitAngle) * orbitRadius * Math.cos(orbitTilt);
          const ez = Math.sin(orbitAngle) * orbitRadius * Math.sin(orbitTilt);
          obj.octas[i].position.set(ex, ey, ez);
          obj.octas[i].scale.set((0.4 + f.highs * 0.3) * blend, (0.4 + f.highs * 0.3) * blend, (0.4 + f.highs * 0.3) * blend);
          obj.octas[i].rotation.x += 0.05; obj.octas[i].rotation.y += 0.06;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (0.9 + f.highs * 0.1) * blend;
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Energy quantum (tetras) - jumping between orbits
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const jumpProgress = (t * 2 + i) % 2;
          const fromRadius = 6 + (i % 3) * 3;
          const toRadius = 6 + ((i + 1) % 3) * 3;
          const radius = fromRadius + (toRadius - fromRadius) * (jumpProgress < 1 ? jumpProgress : 2 - jumpProgress);
          const angle = t + i;
          obj.tetras[i].position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
          obj.tetras[i].rotation.x = t * 3; obj.tetras[i].rotation.y = t * 2;
          obj.tetras[i].scale.set((0.3 + f.mids * 0.3) * blend, (0.3 + f.mids * 0.3) * blend, (0.3 + f.mids * 0.3) * blend);
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (0.7 + f.mids * 0.3) * blend;
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, 0, 0);
        obj.sphere.scale.set((1 + f.bass * 0.5) * blend, (1 + f.bass * 0.5) * blend, (1 + f.bass * 0.5) * blend);
        obj.sphere.rotation.y = t;
        obj.sphere.material.color.setStyle(cubeColor);
        obj.sphere.material.opacity = (0.8 + f.bass * 0.2) * blend;
      } else if (type === 'carousel') {
        // Carousel: Rotating platform with horses and decorative panels
        const t = elScaled;
        cam.position.set(Math.sin(t * 0.15) * activeCameraDistance * 1.3 + shakeX, 5 + activeCameraHeight + shakeY, Math.cos(t * 0.15) * activeCameraDistance * 1.3 + shakeZ);
        cam.lookAt(0, 0, 0);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 10, octas: 25, tetras: 20, toruses: 8, planes: 16 };
        const carouselRotation = t * 0.5;
        
        // Platform/horses (cubes)
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const angle = (i / req.cubes) * Math.PI * 2 + carouselRotation;
          const bobHeight = Math.sin(t * 2 + i) * 1.5;
          obj.cubes[i].position.set(Math.cos(angle) * 8, bobHeight, Math.sin(angle) * 8);
          obj.cubes[i].scale.set((1 + f.bass * 0.3) * blend, (1.5 + f.bass * 0.2) * blend, (0.8 * blend));
          obj.cubes[i].rotation.y = angle + Math.PI / 2;
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.9 + f.bass * 0.1) * blend;
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Carousel rings (toruses)
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          const height = (i % 4 - 1.5) * 2;
          obj.toruses[i].position.set(0, height, 0);
          obj.toruses[i].rotation.x = Math.PI / 2; obj.toruses[i].rotation.z = carouselRotation * (1 + i * 0.1);
          obj.toruses[i].scale.set((9 + (i % 2) * 2 + f.mids * 0.4) * blend, (9 + (i % 2) * 2 + f.mids * 0.4) * blend, (0.5 * blend));
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.5 + f.mids * 0.3) * blend;
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Decorative panels (planes) - wave up and down
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const angle = (i / req.planes) * Math.PI * 2 + carouselRotation;
          const wave = Math.sin(t * 2 + i) * 0.5;
          obj.planes[i].position.set(Math.cos(angle) * 11, 3 + wave, Math.sin(angle) * 11);
          obj.planes[i].rotation.y = angle + Math.PI / 2; obj.planes[i].rotation.x = wave * 0.3;
          obj.planes[i].scale.set((1.5 * blend, 2 * blend, 1));
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.7 + f.highs * 0.3) * blend;
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Lights (octas)
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const angle = (i / maxOctas) * Math.PI * 2 + carouselRotation * 2;
          const radius = 10 + (i % 2) * 2;
          const height = (i % 5 - 2) * 1.5;
          obj.octas[i].position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
          obj.octas[i].scale.set((0.4 + f.highs * 0.4 + Math.sin(t * 4 + i) * 0.2) * blend, (0.4 + f.highs * 0.4 + Math.sin(t * 4 + i) * 0.2) * blend, (0.4 + f.highs * 0.4 + Math.sin(t * 4 + i) * 0.2) * blend);
          obj.octas[i].rotation.x += 0.03; obj.octas[i].rotation.y += 0.04;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (0.8 + f.highs * 0.2) * blend;
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Confetti (tetras)
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const angle = (t + i) * 1.5;
          const fallHeight = 8 - ((t * 2 + i * 0.5) % 10);
          obj.tetras[i].position.set(Math.cos(angle) * (3 + i % 5), fallHeight, Math.sin(angle) * (3 + i % 5));
          obj.tetras[i].rotation.x = t * 3 + i; obj.tetras[i].rotation.y = t * 2 + i;
          obj.tetras[i].scale.set((0.4 + f.mids * 0.3) * blend, (0.4 + f.mids * 0.3) * blend, (0.4 + f.mids * 0.3) * blend);
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (0.8 * Math.max(0, fallHeight / 8)) * blend;
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, -3, 0);
        obj.sphere.scale.set((3 + f.bass * 0.5) * blend, (0.5 * blend), (3 + f.bass * 0.5) * blend);
        obj.sphere.rotation.y = carouselRotation;
        obj.sphere.material.color.setStyle(cubeColor);
        obj.sphere.material.opacity = (0.6 + f.bass * 0.2) * blend;
      } else if (type === 'solarsystem') {
        // Solar System: Planets orbiting with orbital paths
        const t = elScaled;
        cam.position.set(Math.sin(t * 0.1) * activeCameraDistance * 1.5 + shakeX, 12 + activeCameraHeight + shakeY, Math.cos(t * 0.1) * activeCameraDistance * 1.5 + shakeZ);
        cam.lookAt(0, 0, 0);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 8, octas: 40, tetras: 12, toruses: 16, planes: 8 };
        
        // Planets (cubes)
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const orbitRadius = 5 + i * 2.5;
          const orbitSpeed = 0.5 / (1 + i * 0.3);
          const angle = t * orbitSpeed;
          obj.cubes[i].position.set(Math.cos(angle) * orbitRadius, Math.sin(angle * 0.3) * 1.5, Math.sin(angle) * orbitRadius);
          obj.cubes[i].scale.set((0.6 + i * 0.1 + f.bass * 0.2) * blend, (0.6 + i * 0.1 + f.bass * 0.2) * blend, (0.6 + i * 0.1 + f.bass * 0.2) * blend);
          obj.cubes[i].rotation.y = t + i;
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.9 + f.bass * 0.1) * blend;
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Orbital paths (toruses)
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          const orbitRadius = 5 + (i % req.cubes) * 2.5;
          obj.toruses[i].position.set(0, 0, 0);
          obj.toruses[i].rotation.x = Math.PI / 2; obj.toruses[i].rotation.z = Math.sin(t * 0.2 + i) * 0.1;
          obj.toruses[i].scale.set((orbitRadius / 5 * blend, orbitRadius / 5 * blend, (0.05 * blend)));
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.3 + f.mids * 0.2) * blend;
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Asteroid belt plane (planes)
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const angle = (i / req.planes) * Math.PI * 2 + t * 0.3;
          const radius = 18 + Math.sin(i) * 2;
          obj.planes[i].position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
          obj.planes[i].rotation.x = Math.PI / 2; obj.planes[i].rotation.z = angle;
          obj.planes[i].scale.set((0.8 * blend, 0.8 * blend, 1));
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.5 + f.highs * 0.2) * blend;
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Stars (octas)
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const angle = (i / maxOctas) * Math.PI * 4;
          const radius = 25 + (i % 10) * 3;
          obj.octas[i].position.set(Math.cos(angle) * radius, Math.sin(angle + Math.PI/3) * radius * 0.4, Math.sin(angle) * radius);
          obj.octas[i].scale.set((0.2 + f.highs * 0.3 + Math.sin(t * 4 + i) * 0.1) * blend, (0.2 + f.highs * 0.3 + Math.sin(t * 4 + i) * 0.1) * blend, (0.2 + f.highs * 0.3 + Math.sin(t * 4 + i) * 0.1) * blend);
          obj.octas[i].rotation.x += 0.01; obj.octas[i].rotation.y += 0.02;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (0.7 + f.highs * 0.3) * blend;
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Comets (tetras)
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const cometAngle = t * (2 + i * 0.5);
          const cometRadius = 15 + i * 2;
          obj.tetras[i].position.set(Math.cos(cometAngle) * cometRadius, Math.sin(cometAngle * 1.3) * 4, Math.sin(cometAngle) * cometRadius);
          obj.tetras[i].rotation.x = cometAngle; obj.tetras[i].rotation.y = cometAngle * 1.5;
          obj.tetras[i].scale.set((0.5 + f.mids * 0.3) * blend, (0.5 + f.mids * 0.3) * blend, (1 + f.mids * 0.5) * blend);
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (0.8 + f.mids * 0.2) * blend;
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, 0, 0);
        obj.sphere.scale.set((2.5 + f.bass * 0.6) * blend, (2.5 + f.bass * 0.6) * blend, (2.5 + f.bass * 0.6) * blend);
        obj.sphere.rotation.y = t * 0.2;
        obj.sphere.material.color.setStyle(cubeColor);
        obj.sphere.material.opacity = (0.95 + f.bass * 0.05) * blend;
      } else if (type === 'datastream') {
        // Data Stream: Flowing data panels and rings
        const t = elScaled;
        cam.position.set(Math.sin(t * 0.12) * activeCameraDistance * 1.2 + shakeX, 6 + activeCameraHeight + shakeY, Math.cos(t * 0.12) * activeCameraDistance * 1.2 + shakeZ);
        cam.lookAt(0, 2, 0);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 8, octas: 40, tetras: 25, toruses: 15, planes: 20 };
        
        // Servers (cubes)
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const angle = (i / req.cubes) * Math.PI * 2;
          obj.cubes[i].position.set(Math.cos(angle) * 12, (i % 2) * 4, Math.sin(angle) * 12);
          obj.cubes[i].scale.set((1.2 + f.bass * 0.3) * blend, (2 + f.bass * 0.4) * blend, (1.2 + f.bass * 0.3) * blend);
          obj.cubes[i].rotation.y = angle;
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.8 + f.bass * 0.2) * blend;
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Data rings (toruses) - rotating like loading indicators
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          const layer = Math.floor(i / 5);
          const angleInLayer = (i % 5) / 5 * Math.PI * 2;
          obj.toruses[i].position.set(Math.cos(angleInLayer) * 6, layer * 3, Math.sin(angleInLayer) * 6);
          obj.toruses[i].rotation.x = t * (1 + layer * 0.2) + i; obj.toruses[i].rotation.y = angleInLayer;
          obj.toruses[i].scale.set((1 + f.mids * 0.4) * blend, (1 + f.mids * 0.4) * blend, (1 + f.mids * 0.4) * blend);
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.6 + f.mids * 0.3) * blend;
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Data panels (planes) - scrolling with binary patterns
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const scrollY = (t * 3 + row) % 15 - 5;
          obj.planes[i].position.set((col - 1.5) * 3, scrollY, 8);
          obj.planes[i].rotation.y = Math.sin(t + i) * 0.05;
          obj.planes[i].scale.set((1.2 * blend, 1.8 * blend, 1));
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.7 + f.highs * 0.2) * blend * Math.max(0, 1 - Math.abs(scrollY) / 10);
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Bits (octas) - flowing in streams
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const stream = i % 8;
          const angle = (stream / 8) * Math.PI * 2;
          const flowDist = (t * 4 + i * 0.3) % 20;
          obj.octas[i].position.set(Math.cos(angle) * flowDist, Math.sin(i) * 6, Math.sin(angle) * flowDist);
          obj.octas[i].scale.set((0.2 + f.highs * 0.3) * blend, (0.2 + f.highs * 0.3) * blend, (0.2 + f.highs * 0.3) * blend);
          obj.octas[i].rotation.x += 0.08; obj.octas[i].rotation.y += 0.09;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (0.8 + f.highs * 0.2) * blend;
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Packets (tetras) - pulsing through network
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const serverIdx = i % req.cubes;
          const serverAngle = (serverIdx / req.cubes) * Math.PI * 2;
          const travelProgress = (t * 2 + i * 0.5) % 1;
          const radius = 12 * (1 - travelProgress);
          obj.tetras[i].position.set(Math.cos(serverAngle) * radius, 2 + Math.sin(travelProgress * Math.PI) * 3, Math.sin(serverAngle) * radius);
          obj.tetras[i].rotation.x = t * 4; obj.tetras[i].rotation.y = t * 3;
          obj.tetras[i].scale.set((0.5 + f.mids * 0.4) * blend, (0.5 + f.mids * 0.4) * blend, (0.5 + f.mids * 0.4) * blend);
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (travelProgress < 0.9 ? 0.9 : (1 - travelProgress) * 10) * blend;
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, 2, 0);
        obj.sphere.scale.set((1.5 + f.bass * 0.5) * blend, (1.5 + f.bass * 0.5) * blend, (1.5 + f.bass * 0.5) * blend);
        obj.sphere.rotation.y = t;
        obj.sphere.material.color.setStyle(cubeColor);
        obj.sphere.material.opacity = (0.7 + f.bass * 0.3) * blend;
      } else if (type === 'ferriswheel') {
        // Ferris Wheel: Rotating wheel structure
        const t = elScaled;
        cam.position.set(Math.sin(t * 0.08) * activeCameraDistance * 1.4 + shakeX, 3 + activeCameraHeight + shakeY, Math.cos(t * 0.08) * activeCameraDistance * 1.4 + shakeZ);
        cam.lookAt(0, 3, 0);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 12, octas: 30, tetras: 15, toruses: 10, planes: 12 };
        const wheelRotation = t * 0.3;
        
        // Gondolas (cubes) - stay level
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const angle = (i / req.cubes) * Math.PI * 2 + wheelRotation;
          const radius = 10;
          obj.cubes[i].position.set(Math.cos(angle) * radius, 3 + Math.sin(angle) * radius, 0);
          obj.cubes[i].scale.set((1 * blend, 1.5 * blend, 1 * blend));
          obj.cubes[i].rotation.y = 0; // Stay level
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.9 + f.bass * 0.1) * blend;
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Wheel structure (toruses)
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, 3, 0);
          obj.toruses[i].rotation.z = wheelRotation + (i / req.toruses) * Math.PI / 4;
          obj.toruses[i].scale.set((10 + i * 0.5 + f.mids * 0.3) * blend, (10 + i * 0.5 + f.mids * 0.3) * blend, (0.5 * blend));
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.6 + f.mids * 0.2) * blend;
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Seats (planes)
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const angle = (i / req.planes) * Math.PI * 2 + wheelRotation;
          const radius = 10;
          obj.planes[i].position.set(Math.cos(angle) * radius, 3 + Math.sin(angle) * radius - 0.5, 0);
          obj.planes[i].rotation.z = 0; // Stay horizontal
          obj.planes[i].scale.set((0.8 * blend, 0.8 * blend, 1));
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.8 + f.highs * 0.2) * blend;
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Lights (octas)
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const angle = (i / maxOctas) * Math.PI * 2 + wheelRotation * 2;
          const radius = 11 + (i % 3);
          obj.octas[i].position.set(Math.cos(angle) * radius, 3 + Math.sin(angle) * radius, Math.sin(i) * 0.5);
          obj.octas[i].scale.set((0.3 + f.highs * 0.4 + Math.sin(t * 5 + i) * 0.2) * blend, (0.3 + f.highs * 0.4 + Math.sin(t * 5 + i) * 0.2) * blend, (0.3 + f.highs * 0.4 + Math.sin(t * 5 + i) * 0.2) * blend);
          obj.octas[i].rotation.x += 0.04; obj.octas[i].rotation.y += 0.05;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (0.9 + f.highs * 0.1) * blend;
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Sparkles (tetras)
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const angle = (t * 2 + i) % (Math.PI * 2);
          const radius = 13 + (i % 4);
          obj.tetras[i].position.set(Math.cos(angle) * radius, 3 + Math.sin(angle) * radius, Math.sin(t + i) * 2);
          obj.tetras[i].rotation.x = t * 3; obj.tetras[i].rotation.y = t * 4;
          obj.tetras[i].scale.set((0.4 + f.mids * 0.3) * blend, (0.4 + f.mids * 0.3) * blend, (0.4 + f.mids * 0.3) * blend);
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (0.7 + Math.sin(t * 6 + i) * 0.3) * blend;
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, 3, 0);
        obj.sphere.scale.set((1 + f.bass * 0.4) * blend, (1 + f.bass * 0.4) * blend, (2 * blend));
        obj.sphere.rotation.z = wheelRotation;
        obj.sphere.material.color.setStyle(cubeColor);
        obj.sphere.material.opacity = (0.7 + f.bass * 0.3) * blend;
      } else if (type === 'tornadovortex') {
        // Tornado Vortex: Spiraling rings and chaotic debris
        const t = elScaled;
        cam.position.set(Math.sin(t * 0.2) * activeCameraDistance * 1.3 + shakeX, 8 + activeCameraHeight + shakeY, Math.cos(t * 0.2) * activeCameraDistance * 1.3 + shakeZ);
        cam.lookAt(0, 2, 0);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 8, octas: 40, tetras: 25, toruses: 20, planes: 15 };
        
        // Ground objects (cubes) - shaking
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const angle = (i / req.cubes) * Math.PI * 2;
          const shake = Math.sin(t * 10 + i) * (0.5 + f.bass * 0.5);
          obj.cubes[i].position.set(Math.cos(angle) * 15 + shake, -3 + shake * 0.3, Math.sin(angle) * 15 + shake);
          obj.cubes[i].scale.set((1 + f.bass * 0.3) * blend, (1 + f.bass * 0.3) * blend, (1 + f.bass * 0.3) * blend);
          obj.cubes[i].rotation.x += 0.02; obj.cubes[i].rotation.y += 0.03;
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.7 + f.bass * 0.3) * blend;
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Vortex rings (toruses) - spiral upward
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          const height = (i / req.toruses) * 15;
          const spiralAngle = t * 2 + height * 0.5;
          const radius = 3 + height * 0.4;
          obj.toruses[i].position.set(Math.cos(spiralAngle) * radius, height - 2, Math.sin(spiralAngle) * radius);
          obj.toruses[i].rotation.x = Math.PI / 2 + Math.sin(t + i) * 0.3; obj.toruses[i].rotation.y = spiralAngle;
          obj.toruses[i].scale.set((1.5 + f.mids * 0.5) * blend, (1.5 + f.mids * 0.5) * blend, (1.5 + f.mids * 0.5) * blend);
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.5 + f.mids * 0.3) * blend;
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Debris panels (planes) - tumbling chaotically
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const spiralAngle = t * 3 + i;
          const height = (t + i * 0.5) % 12;
          const radius = 4 + height * 0.5;
          obj.planes[i].position.set(Math.cos(spiralAngle) * radius, height - 2, Math.sin(spiralAngle) * radius);
          obj.planes[i].rotation.x = t * 4 + i; obj.planes[i].rotation.y = t * 3; obj.planes[i].rotation.z = t * 2;
          obj.planes[i].scale.set((1.2 * blend, 1.2 * blend, 1));
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.6 + f.highs * 0.3) * blend;
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Dust particles (octas) - swirling violently
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const spiralAngle = t * 4 + i * 0.5;
          const height = (t * 2 + i * 0.3) % 14;
          const radius = 2 + height * 0.6 + Math.sin(t * 3 + i) * 2;
          obj.octas[i].position.set(Math.cos(spiralAngle) * radius, height - 2, Math.sin(spiralAngle) * radius);
          obj.octas[i].scale.set((0.2 + f.highs * 0.4) * blend, (0.2 + f.highs * 0.4) * blend, (0.2 + f.highs * 0.4) * blend);
          obj.octas[i].rotation.x += 0.15; obj.octas[i].rotation.y += 0.18;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (0.7 + f.highs * 0.3) * blend;
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Flying debris (tetras)
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const wildAngle = t * 5 + i * 2;
          const height = 2 + Math.sin(t + i) * 8;
          const radius = 6 + Math.cos(t * 2 + i) * 4;
          obj.tetras[i].position.set(Math.cos(wildAngle) * radius, height, Math.sin(wildAngle) * radius);
          obj.tetras[i].rotation.x = t * 6 + i; obj.tetras[i].rotation.y = t * 5; obj.tetras[i].rotation.z = t * 4;
          obj.tetras[i].scale.set((0.5 + f.mids * 0.4) * blend, (0.5 + f.mids * 0.4) * blend, (0.5 + f.mids * 0.4) * blend);
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (0.8 + f.mids * 0.2) * blend;
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, -2, 0);
        obj.sphere.scale.set((0.5 + f.bass * 0.5) * blend, (0.5 + f.bass * 0.5) * blend, (0.5 + f.bass * 0.5) * blend);
        obj.sphere.rotation.y = t * 3;
        obj.sphere.material.color.setStyle(cubeColor);
        obj.sphere.material.opacity = (0.8 + f.bass * 0.2) * blend;
      } else if (type === 'stadium') {
        // Stadium: Bowl shape with lighting rigs
        const t = elScaled;
        cam.position.set(Math.sin(t * 0.1) * activeCameraDistance * 1.5 + shakeX, 12 + activeCameraHeight + shakeY, Math.cos(t * 0.1) * activeCameraDistance * 1.5 + shakeZ);
        cam.lookAt(0, 0, 0);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 12, octas: 35, tetras: 20, toruses: 10, planes: 24 };
        
        // Pillars (cubes)
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const angle = (i / req.cubes) * Math.PI * 2;
          obj.cubes[i].position.set(Math.cos(angle) * 18, 3, Math.sin(angle) * 18);
          obj.cubes[i].scale.set((1.5 * blend, (4 + f.bass * 0.5) * blend, 1.5 * blend));
          obj.cubes[i].rotation.y = angle;
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.8 + f.bass * 0.2) * blend;
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Lighting rigs (toruses)
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          const angle = (i / req.toruses) * Math.PI * 2 + t * 0.3;
          const radius = 16 + (i % 2) * 4;
          obj.toruses[i].position.set(Math.cos(angle) * radius, 8 + (i % 2) * 2, Math.sin(angle) * radius);
          obj.toruses[i].rotation.z = angle;
          obj.toruses[i].scale.set((1.5 + f.mids * 0.4) * blend, (1.5 + f.mids * 0.4) * blend, (1.5 + f.mids * 0.4) * blend);
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.7 + f.mids * 0.3) * blend;
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Stadium sections (planes) - forming bowl shape
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const tier = Math.floor(i / 8);
          const angleInTier = (i % 8) / 8 * Math.PI * 2;
          const radius = 14 + tier * 3;
          const height = -2 + tier * 2;
          const tilt = Math.PI / 6;
          obj.planes[i].position.set(Math.cos(angleInTier) * radius, height, Math.sin(angleInTier) * radius);
          obj.planes[i].rotation.y = angleInTier + Math.PI / 2; obj.planes[i].rotation.x = -tilt;
          obj.planes[i].scale.set((3 * blend, 2 * blend, 1));
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.8 + f.highs * 0.2) * blend;
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Crowd lights (octas) - wave effect
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const angle = (i / maxOctas) * Math.PI * 2;
          const wave = Math.sin(t * 3 - angle * 2) > 0.5 ? 1.5 : 0.8;
          const radius = 14 + (i % 3) * 2;
          obj.octas[i].position.set(Math.cos(angle) * radius, wave, Math.sin(angle) * radius);
          obj.octas[i].scale.set((0.4 * wave + f.highs * 0.3) * blend, (0.4 * wave + f.highs * 0.3) * blend, (0.4 * wave + f.highs * 0.3) * blend);
          obj.octas[i].rotation.x += 0.03; obj.octas[i].rotation.y += 0.04;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (wave * 0.6 + f.highs * 0.4) * blend;
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Fireworks (tetras)
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const burstTime = (t * 2 + i) % 3;
          const angle = (i / req.tetras) * Math.PI * 2;
          const burstRadius = burstTime < 1 ? 0 : (burstTime - 1) * 8;
          const burstHeight = 12 - burstTime * 2;
          obj.tetras[i].position.set(Math.cos(angle) * burstRadius, burstHeight, Math.sin(angle) * burstRadius);
          obj.tetras[i].rotation.x = t * 4; obj.tetras[i].rotation.y = t * 3;
          obj.tetras[i].scale.set((0.6 + f.mids * 0.4) * blend, (0.6 + f.mids * 0.4) * blend, (0.6 + f.mids * 0.4) * blend);
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (burstTime < 2 ? 0.9 : (3 - burstTime)) * blend;
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, -2, 0);
        obj.sphere.scale.set((8 * blend, 0.1 * blend, 8 * blend));
        obj.sphere.rotation.y = t * 0.5;
        obj.sphere.material.color.setStyle(cubeColor);
        obj.sphere.material.opacity = (0.5 + f.bass * 0.3) * blend;
      } else if (type === 'kaleidoscope2') {
        // Kaleidoscope Plus: Fractal patterns with mirrors
        const t = elScaled;
        cam.position.set(Math.sin(t * 0.3) * activeCameraDistance * 0.8 + shakeX, Math.cos(t * 0.2) * 3 + activeCameraHeight + shakeY, Math.cos(t * 0.3) * activeCameraDistance * 0.8 + shakeZ);
        cam.lookAt(0, 0, 0);
        
        const req = PRESET_SHAPE_REQUIREMENTS[type] || { cubes: 6, octas: 35, tetras: 25, toruses: 15, planes: 30 };
        
        // Center pieces (cubes)
        for (let i = 0; i < req.cubes && i < obj.cubes.length; i++) {
          const angle = (i / req.cubes) * Math.PI * 2 + t;
          obj.cubes[i].position.set(Math.cos(angle) * 3, Math.sin(angle + Math.PI/3) * 3, Math.sin(angle) * 3);
          obj.cubes[i].scale.set((1 + f.bass * 0.5) * blend, (1 + f.bass * 0.5) * blend, (1 + f.bass * 0.5) * blend);
          obj.cubes[i].rotation.x = t + i; obj.cubes[i].rotation.y = t * 0.7; obj.cubes[i].rotation.z = t * 1.3;
          obj.cubes[i].material.color.setStyle(cubeColor);
          obj.cubes[i].material.opacity = (0.9 + f.bass * 0.1) * blend;
        }
        for (let i = req.cubes; i < obj.cubes.length; i++) {
          obj.cubes[i].position.set(0, -1000, 0); obj.cubes[i].scale.set(0.001, 0.001, 0.001); obj.cubes[i].material.opacity = 0;
        }
        
        // Rotation rings (toruses) - create symmetry
        for (let i = 0; i < req.toruses && i < obj.toruses.length; i++) {
          const layer = Math.floor(i / 5);
          const angleInLayer = (i % 5) / 5 * Math.PI * 2;
          const radius = 6 + layer * 3;
          obj.toruses[i].position.set(Math.cos(angleInLayer + t * (1 + layer * 0.3)) * radius, Math.sin(angleInLayer + t * (1 + layer * 0.3)) * radius, 0);
          obj.toruses[i].rotation.z = t + i; obj.toruses[i].rotation.x = angleInLayer;
          obj.toruses[i].scale.set((1 + f.mids * 0.5) * blend, (1 + f.mids * 0.5) * blend, (1 + f.mids * 0.5) * blend);
          obj.toruses[i].material.color.setStyle(octahedronColor);
          obj.toruses[i].material.opacity = (0.6 + f.mids * 0.3) * blend;
        }
        for (let i = req.toruses; i < obj.toruses.length; i++) {
          obj.toruses[i].position.set(0, -1000, 0); obj.toruses[i].scale.set(0.001, 0.001, 0.001); obj.toruses[i].material.opacity = 0;
        }
        
        // Mirror segments (planes) - reflect in patterns
        for (let i = 0; i < req.planes && i < obj.planes.length; i++) {
          const symmetry = 6;
          const sym = i % symmetry;
          const layer = Math.floor(i / symmetry);
          const angle = (sym / symmetry) * Math.PI * 2 + t * 0.5;
          const radius = 8 + layer * 2;
          obj.planes[i].position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, layer - 2);
          obj.planes[i].rotation.x = t + i * 0.2; obj.planes[i].rotation.y = angle; obj.planes[i].rotation.z = Math.sin(t + i) * 0.5;
          obj.planes[i].scale.set((1.5 + Math.sin(t * 2 + i) * 0.5) * blend, (1.5 + Math.sin(t * 2 + i) * 0.5) * blend, 1);
          obj.planes[i].material.color.setStyle(tetrahedronColor);
          obj.planes[i].material.opacity = (0.6 + f.highs * 0.3) * blend;
        }
        for (let i = req.planes; i < obj.planes.length; i++) {
          obj.planes[i].position.set(0, -1000, 0); obj.planes[i].scale.set(0.001, 0.001, 0.001); obj.planes[i].material.opacity = 0;
        }
        
        // Color particles (octas) - kaleidoscope effect
        const maxOctas = Math.min(req.octas, obj.octas.length - 15);
        for (let i = 0; i < maxOctas; i++) {
          const symmetry = 8;
          const sym = i % symmetry;
          const angle = (sym / symmetry) * Math.PI * 2;
          const radius = 5 + (i / maxOctas) * 10 + Math.sin(t * 2 + i) * 2;
          obj.octas[i].position.set(Math.cos(angle + t) * radius, Math.sin(angle + t) * radius, Math.sin(t + i) * 3);
          obj.octas[i].scale.set((0.4 + f.highs * 0.5) * blend, (0.4 + f.highs * 0.5) * blend, (0.4 + f.highs * 0.5) * blend);
          obj.octas[i].rotation.x += 0.06; obj.octas[i].rotation.y += 0.07;
          obj.octas[i].material.color.setStyle(tetrahedronColor);
          obj.octas[i].material.opacity = (0.8 + f.highs * 0.2) * blend;
        }
        for (let i = maxOctas; i < obj.octas.length - 15; i++) {
          obj.octas[i].position.set(0, -1000, 0); obj.octas[i].scale.set(0.001, 0.001, 0.001); obj.octas[i].material.opacity = 0;
        }
        
        // Fractal pieces (tetras) - morph shapes
        for (let i = 0; i < req.tetras && i < obj.tetras.length; i++) {
          const morph = Math.sin(t + i * 0.5);
          const angle = (i / req.tetras) * Math.PI * 2 + t * 0.7;
          const radius = 12 + morph * 4;
          obj.tetras[i].position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.5, morph * 3);
          obj.tetras[i].rotation.x = t * 2 + i; obj.tetras[i].rotation.y = t * 3; obj.tetras[i].rotation.z = t + i;
          obj.tetras[i].scale.set((0.5 + Math.abs(morph) * 0.5 + f.mids * 0.4) * blend, (0.5 + Math.abs(morph) * 0.5 + f.mids * 0.4) * blend, (0.5 + Math.abs(morph) * 0.5 + f.mids * 0.4) * blend);
          obj.tetras[i].material.color.setStyle(octahedronColor);
          obj.tetras[i].material.opacity = (0.7 + f.mids * 0.3) * blend;
        }
        for (let i = req.tetras; i < obj.tetras.length; i++) {
          obj.tetras[i].position.set(0, -1000, 0); obj.tetras[i].scale.set(0.001, 0.001, 0.001); obj.tetras[i].material.opacity = 0;
        }
        
        obj.sphere.position.set(0, 0, 0);
        obj.sphere.scale.set((1.5 + Math.sin(t) * 0.5 + f.bass * 0.5) * blend, (1.5 + Math.sin(t) * 0.5 + f.bass * 0.5) * blend, (1.5 + Math.sin(t) * 0.5 + f.bass * 0.5) * blend);
        obj.sphere.rotation.x = t * 0.7; obj.sphere.rotation.y = t * 0.5; obj.sphere.rotation.z = t * 0.3;
        obj.sphere.material.color.setStyle(cubeColor);
        obj.sphere.material.opacity = (0.8 + f.bass * 0.2) * blend;
      }

      // ENVIRONMENT RENDERING - Independent from presets
      // Uses octahedrons indices 100-114 (15 objects created specifically for environment)
      // Positioned within visible camera range (default camera at z=15, looking at origin)
      const ENV_START_INDEX = 30;
      const ENV_MAX_COUNT = 15;
      
      // Find active environment keyframe
      const activeEnvKeyframe = [...environmentKeyframes]
        .reverse()
        .find(kf => kf.time <= t);
      
      if (activeEnvKeyframe && activeEnvKeyframe.type !== 'none') {
        const envType = activeEnvKeyframe.type;
        const envIntensity = activeEnvKeyframe.intensity;
        const envColor = activeEnvKeyframe.color;
        
        // Use octahedrons indices 100-114 (15 objects) for environment
        const envObjectCount = Math.min(Math.floor(envIntensity * ENV_MAX_COUNT), ENV_MAX_COUNT);
        
        if (envType === 'ocean') {
          // Ocean environment: light rays from above + animated particles
          // Positioned within the visible frame around the center
          for (let i = 0; i < envObjectCount; i++) {
            const idx = ENV_START_INDEX + i;
            if (idx >= obj.octas.length) break;
            const envObj = obj.octas[idx];
            
            // Light rays from surface - positioned in visible area
            // Spread rays across the visible area (-8 to +8 on X, -5 to +5 on Z)
            const rayX = ((i % 5) - 2) * 4; // -8 to +8
            const rayZ = ((Math.floor(i / 5)) - 1) * 5; // -5 to +5
            envObj.position.x = rayX + Math.sin(el * 0.5 + i) * 1.5;
            envObj.position.y = 6 + Math.sin(el + i) * 0.5; // Above center, visible in frame
            envObj.position.z = rayZ;
            envObj.rotation.x = Math.PI / 4;
            envObj.rotation.z = Math.sin(el * 0.3 + i) * 0.2;
            const raySize = 0.5 + f.highs * 0.3;
            envObj.scale.set(raySize * 0.3, raySize * 6, raySize * 0.3);
            (envObj.material as THREE.MeshBasicMaterial).color.setStyle(envColor || '#40e0d0');
            (envObj.material as THREE.MeshBasicMaterial).opacity = (0.3 + f.highs * 0.3) * envIntensity * blend;
            (envObj.material as THREE.MeshBasicMaterial).wireframe = false;
          }
        } else if (envType === 'forest') {
          // Forest environment: trees, ground fog
          // Positioned around the edges of the visible frame
          for (let i = 0; i < envObjectCount; i++) {
            const idx = ENV_START_INDEX + i;
            if (idx >= obj.octas.length) break;
            const envObj = obj.octas[idx];
            
            if (i % 3 === 0) {
              // Trees (tall vertical octas) - positioned at back of scene
              const treeX = ((i % 5) - 2) * 4; // -8 to +8
              const treeZ = -5 - (Math.floor(i / 5)) * 3; // Behind center
              envObj.position.set(treeX, 0, treeZ);
              envObj.rotation.set(0, el * 0.1 + i, 0);
              const treeHeight = 4 + (i % 3);
              envObj.scale.set(1, treeHeight, 1);
              (envObj.material as THREE.MeshBasicMaterial).color.setStyle(envColor || '#2d5016');
              (envObj.material as THREE.MeshBasicMaterial).opacity = (0.6 + f.mids * 0.2) * envIntensity * blend;
            } else {
              // Fog/foliage particles - floating in visible area
              const fogX = Math.sin(i * 3) * 6;
              const fogY = -2 + Math.sin(el * 0.3 + i) * 2;
              const fogZ = Math.cos(i * 2) * 4;
              envObj.position.set(fogX, fogY, fogZ);
              envObj.rotation.y += 0.02;
              envObj.scale.set(1.5, 1.5, 1.5);
              (envObj.material as THREE.MeshBasicMaterial).color.setStyle(envColor || '#4a7c59');
              (envObj.material as THREE.MeshBasicMaterial).opacity = (0.3 + f.bass * 0.1) * envIntensity * blend;
            }
            (envObj.material as THREE.MeshBasicMaterial).wireframe = true;
          }
        } else if (envType === 'space') {
          // Space environment: stars, distant planets
          // Positioned as a backdrop sphere around the scene
          for (let i = 0; i < envObjectCount; i++) {
            const idx = ENV_START_INDEX + i;
            if (idx >= obj.octas.length) break;
            const envObj = obj.octas[idx];
            
            if (i % 4 === 0) {
              // Distant planets - visible in background
              const planetDist = 12 + (i % 3) * 3;
              const planetAngle = (i / 4) * Math.PI * 2 + el * 0.1;
              envObj.position.x = Math.cos(planetAngle) * planetDist;
              envObj.position.y = ((i % 5) - 2) * 3;
              envObj.position.z = Math.sin(planetAngle) * planetDist - 5;
              envObj.rotation.x += 0.01;
              envObj.rotation.y += 0.02;
              const planetSize = 2 + (i % 3);
              envObj.scale.set(planetSize, planetSize, planetSize);
              (envObj.material as THREE.MeshBasicMaterial).color.setStyle(envColor || '#8b5cf6');
              (envObj.material as THREE.MeshBasicMaterial).opacity = (0.4 + f.mids * 0.2) * envIntensity * blend;
              (envObj.material as THREE.MeshBasicMaterial).wireframe = true;
            } else {
              // Stars (small dots) - distributed in visible area
              const starAngle = (i / envObjectCount) * Math.PI * 2;
              const starDist = 8 + (i % 5) * 2;
              const starX = Math.cos(starAngle + el * 0.05) * starDist;
              const starY = ((i % 7) - 3) * 2 + Math.sin(el * 0.3 + i) * 0.5;
              const starZ = Math.sin(starAngle + el * 0.05) * starDist - 3;
              envObj.position.set(starX, starY, starZ);
              const starTwinkle = 0.3 + Math.sin(el * 2 + i) * 0.15 + f.highs * 0.2;
              envObj.scale.set(starTwinkle, starTwinkle, starTwinkle);
              (envObj.material as THREE.MeshBasicMaterial).color.setStyle(envColor || '#ffffff');
              (envObj.material as THREE.MeshBasicMaterial).opacity = (0.7 + Math.sin(el * 3 + i) * 0.3) * envIntensity * blend;
              (envObj.material as THREE.MeshBasicMaterial).wireframe = false;
            }
          }
        } else if (envType === 'city') {
          // City environment: buildings, lights, grid floor
          // Positioned as a backdrop around the scene
          for (let i = 0; i < envObjectCount; i++) {
            const idx = ENV_START_INDEX + i;
            if (idx >= obj.octas.length) break;
            const envObj = obj.octas[idx];
            
            // Buildings in a grid - visible behind center
            const gridX = ((i % 5) - 2) * 4;
            const gridZ = -5 - Math.floor(i / 5) * 4;
            const buildingHeight = 3 + ((i * 7) % 5) + f.bass * 2;
            envObj.position.set(gridX, buildingHeight / 2 - 3, gridZ);
            envObj.rotation.y = 0;
            envObj.scale.set(1.5, buildingHeight, 1.5);
            
            // Window lights (pulsing with music)
            const lightIntensity = Math.sin(el * 2 + i) * 0.3 + f.mids * 0.5;
            (envObj.material as THREE.MeshBasicMaterial).color.setStyle(envColor || '#fbbf24');
            (envObj.material as THREE.MeshBasicMaterial).opacity = (0.3 + lightIntensity) * envIntensity * blend;
            (envObj.material as THREE.MeshBasicMaterial).wireframe = true;
          }
        } else if (envType === 'abstract') {
          // Abstract environment: geometric grid, floating shapes
          // Positioned as orbiting shapes in visible area
          for (let i = 0; i < envObjectCount; i++) {
            const idx = ENV_START_INDEX + i;
            if (idx >= obj.octas.length) break;
            const envObj = obj.octas[idx];
            
            // Floating geometric shapes in patterns - within visible range
            const layerAngle = (i / envObjectCount) * Math.PI * 2 + el * 0.5;
            const layerRadius = 6 + (i % 3) * 2;
            envObj.position.x = Math.cos(layerAngle) * layerRadius;
            envObj.position.y = Math.sin(el + i * 0.5) * 4;
            envObj.position.z = Math.sin(layerAngle) * layerRadius;
            envObj.rotation.x += 0.03 * (i % 3 + 1);
            envObj.rotation.y += 0.02 * (i % 2 + 1);
            envObj.rotation.z += 0.04;
            const shapeSize = 1 + f.bass * 0.5 + (i % 3) * 0.5;
            envObj.scale.set(shapeSize, shapeSize, shapeSize);
            (envObj.material as THREE.MeshBasicMaterial).color.setStyle(envColor || '#a78bfa');
            (envObj.material as THREE.MeshBasicMaterial).opacity = (0.5 + f.mids * 0.3) * envIntensity * blend;
            (envObj.material as THREE.MeshBasicMaterial).wireframe = (i % 2 === 0);
          }
        }
      } else if (!activeEnvKeyframe || activeEnvKeyframe.type === 'none') {
        // Hide all environment objects (indices 100-114)
        for (let i = 0; i < ENV_MAX_COUNT; i++) {
          const idx = ENV_START_INDEX + i;
          if (idx >= obj.octas.length) break;
          const envObj = obj.octas[idx];
          envObj.position.set(0, -1000, 0);
          envObj.scale.set(0.001, 0.001, 0.001);
          (envObj.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }

      if (showSongName && songNameMeshesRef.current.length > 0) {
        songNameMeshesRef.current.forEach((mesh) => {
          const freqIndex = mesh.userData.freqIndex;
          let bounce = 0;
          if (freqIndex === 0) bounce = f.bass * 2;
          else if (freqIndex === 1) bounce = f.mids * 2;
          else bounce = f.highs * 2;
          mesh.position.y = mesh.userData.baseY + bounce;
          mesh.lookAt(cam.position);
          // Update material properties
          const mat = mesh.material as THREE.Material & { color?: THREE.Color; wireframe?: boolean; opacity?: number };
          if (mat.color) mat.color.setStyle(textColor);
          if ('wireframe' in mat) mat.wireframe = textWireframe;
          if ('opacity' in mat) mat.opacity = textOpacity;
        });
      }

      // PHASE 5: Text Animator - Animate per-character text
      textAnimatorKeyframes.forEach(textKf => {
        if (!fontRef.current) return;
        
        // Get keyframe-specific properties with defaults
        const kfPosition = textKf.position ?? { x: 0, y: 5, z: 0 };
        const kfSize = textKf.size ?? 1;
        const kfColor = textKf.color ?? '#00ffff';
        
        const existingMeshes = textCharacterMeshesRef.current.get(textKf.id);
        
        // Check if we need to recreate meshes (text or size changed)
        const needsRecreate = existingMeshes && (
          existingMeshes.length !== textKf.text.length ||
          (existingMeshes[0]?.userData.textSize !== kfSize)
        );
        
        if (needsRecreate && existingMeshes) {
          // Clean up old meshes
          existingMeshes.forEach(mesh => {
            scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          });
          textCharacterMeshesRef.current.delete(textKf.id);
        }
        
        // Create character meshes if they don't exist
        if (!textCharacterMeshesRef.current.has(textKf.id)) {
          const characterMeshes: THREE.Mesh[] = [];
          const chars = textKf.text.split('');
          const charSpacing = 0.6 * kfSize; // Scale spacing with size
          let xOffset = -(textKf.text.length * charSpacing) / 2; // Center text
          
          chars.forEach((char, index) => {
            const textGeometry = new TextGeometry(char, {
              font: fontRef.current,
              size: 1 * kfSize, // Apply size multiplier
              height: 0.2 * kfSize,
              curveSegments: 12,
              bevelEnabled: true,
              bevelThickness: 0.03 * kfSize,
              bevelSize: 0.02 * kfSize,
              bevelSegments: 5
            });
            
            const textMaterial = new THREE.MeshBasicMaterial({
              color: kfColor, // Use keyframe color
              transparent: true,
              opacity: 0
            });
            
            const charMesh = new THREE.Mesh(textGeometry, textMaterial);
            // Use keyframe position instead of hardcoded (5, 0)
            charMesh.position.set(kfPosition.x + xOffset, kfPosition.y, kfPosition.z);
            
            // Store base position and size for animation and change detection
            charMesh.userData.baseX = kfPosition.x + xOffset;
            charMesh.userData.baseY = kfPosition.y;
            charMesh.userData.baseZ = kfPosition.z;
            charMesh.userData.textSize = kfSize;
            
            // Apply character-specific offsets if defined
            const offset = textKf.characterOffsets?.find((o: any) => o.index === index);
            if (offset) {
              charMesh.position.add(new THREE.Vector3(offset.position.x, offset.position.y, offset.position.z));
              charMesh.rotation.set(offset.rotation.x, offset.rotation.y, offset.rotation.z);
              charMesh.scale.set(offset.scale.x, offset.scale.y, offset.scale.z);
            } else {
              charMesh.scale.set(1, 1, 1);
            }
            
            scene.add(charMesh);
            characterMeshes.push(charMesh);
            xOffset += charSpacing; // Spacing between characters
          });
          
          textCharacterMeshesRef.current.set(textKf.id, characterMeshes);
        }
        
        // Animate characters based on time and animation type
        const meshes = textCharacterMeshesRef.current.get(textKf.id);
        if (!meshes) return;
        
        const timeSinceKeyframe = t - textKf.time;
        
        meshes.forEach((charMesh, index) => {
          const charStartTime = index * textKf.stagger;
          const charAnimTime = timeSinceKeyframe - charStartTime;
          
          if (charAnimTime < 0) {
            // Not started yet
            charMesh.visible = false;
            return;
          }
          
          if (!textKf.visible) {
            charMesh.visible = false;
            return;
          }
          
          charMesh.visible = true;
          
          // Calculate animation progress (0 to 1)
          const progress = Math.min(charAnimTime / textKf.duration, 1);
          
          // Get base positions from userData
          const baseX = charMesh.userData.baseX ?? 0;
          const baseY = charMesh.userData.baseY ?? 5;
          const baseZ = charMesh.userData.baseZ ?? 0;
          
          // Apply animation based on type
          switch (textKf.animation) {
            case 'fade':
              (charMesh.material as THREE.MeshBasicMaterial).opacity = progress;
              // Reset position to base
              charMesh.position.set(baseX, baseY, baseZ);
              break;
            
            case 'slide': {
              const distance = 3;
              let slideOffset = { x: 0, y: 0, z: 0 };
              switch (textKf.direction) {
                case 'up': slideOffset.y = -distance; break;
                case 'down': slideOffset.y = distance; break;
                case 'left': slideOffset.x = distance; break;
                case 'right': slideOffset.x = -distance; break;
              }
              charMesh.position.set(
                baseX + slideOffset.x * (1 - progress),
                baseY + slideOffset.y * (1 - progress),
                baseZ + slideOffset.z * (1 - progress)
              );
              (charMesh.material as THREE.MeshBasicMaterial).opacity = progress;
              break;
            }
            
            case 'scale': {
              const scale = progress;
              charMesh.scale.setScalar(scale);
              charMesh.position.set(baseX, baseY, baseZ);
              (charMesh.material as THREE.MeshBasicMaterial).opacity = progress;
              break;
            }
            
            case 'bounce': {
              const bounceHeight = Math.abs(Math.sin(progress * Math.PI)) * 2;
              charMesh.position.x = baseX;
              charMesh.position.y = baseY + bounceHeight;
              charMesh.position.z = baseZ;
              (charMesh.material as THREE.MeshBasicMaterial).opacity = progress;
              break;
            }
            
            default:
              (charMesh.material as THREE.MeshBasicMaterial).opacity = textKf.visible ? 1 : 0;
              charMesh.position.set(baseX, baseY, baseZ);
          }
          
          // Update color to use keyframe-specific color
          (charMesh.material as THREE.MeshBasicMaterial).color.setStyle(kfColor);
        });
      });

      // PHASE 5: Camera Rig - Apply rig transforms to camera
      // Support for multiple simultaneous rigs
      if (activeCameraRigIds.length > 0) {
        // Get all enabled rigs
        const activeRigs = cameraRigs.filter(r => activeCameraRigIds.includes(r.id) && r.enabled);
        
        if (activeRigs.length > 0) {
          // Initialize combined position and rotation
          let combinedPosition = { x: 0, y: 0, z: 0 };
          let combinedRotation = { x: 0, y: 0, z: 0 };
          
          // Process each active rig
          activeRigs.forEach(activeRig => {
            const rigNullObject = cameraRigNullObjectsRef.current.get(activeRig.id);
            
            // Find active rig keyframe or use rig's base position
            const sortedRigKeyframes = cameraRigKeyframes
              .filter(kf => kf.rigId === activeRig.id)
              .sort((a, b) => a.time - b.time);
            
            let rigPosition = { ...activeRig.position };
            let rigRotation = { ...activeRig.rotation };
            
            // Interpolate between keyframes
            if (sortedRigKeyframes.length > 0) {
              const currentKfIndex = sortedRigKeyframes.findIndex(kf => kf.time > t) - 1;
              if (currentKfIndex >= 0) {
                const currentKf = sortedRigKeyframes[currentKfIndex];
                const nextKf = sortedRigKeyframes[currentKfIndex + 1];
                
                if (nextKf && t < nextKf.time) {
                  // Interpolate
                  const timeIntoAnim = t - currentKf.time;
                  const progress = Math.min(timeIntoAnim / currentKf.duration, 1);
                  
                  // Apply easing
                  let easedProgress = progress;
                  switch (currentKf.easing) {
                    case 'easeIn':
                      easedProgress = progress * progress;
                      break;
                    case 'easeOut':
                      easedProgress = 1 - Math.pow(1 - progress, 2);
                      break;
                    case 'easeInOut':
                      easedProgress = progress < 0.5
                        ? 2 * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                      break;
                  }
                  
                  rigPosition.x = currentKf.position.x + (nextKf.position.x - currentKf.position.x) * easedProgress;
                  rigPosition.y = currentKf.position.y + (nextKf.position.y - currentKf.position.y) * easedProgress;
                  rigPosition.z = currentKf.position.z + (nextKf.position.z - currentKf.position.z) * easedProgress;
                  rigRotation.x = currentKf.rotation.x + (nextKf.rotation.x - currentKf.rotation.x) * easedProgress;
                  rigRotation.y = currentKf.rotation.y + (nextKf.rotation.y - currentKf.rotation.y) * easedProgress;
                  rigRotation.z = currentKf.rotation.z + (nextKf.rotation.z - currentKf.rotation.z) * easedProgress;
                } else {
                  // Use current keyframe values
                  rigPosition = { ...currentKf.position };
                  rigRotation = { ...currentKf.rotation };
                }
              }
            }
            
            // Apply direction multiplier
            const directionMultiplier = activeRig.invertDirection ? -1 : 1;
            
            // Apply rig type-specific motion
            switch (activeRig.type) {
              case 'orbit':
                if (activeRig.orbitRadius && activeRig.orbitSpeed && activeRig.orbitAxis) {
                  const orbitAngle = t * activeRig.orbitSpeed * directionMultiplier;
                  if (activeRig.orbitAxis === 'y') {
                    rigPosition.x = Math.cos(orbitAngle) * activeRig.orbitRadius;
                    rigPosition.z = Math.sin(orbitAngle) * activeRig.orbitRadius;
                  } else if (activeRig.orbitAxis === 'x') {
                    rigPosition.y = Math.cos(orbitAngle) * activeRig.orbitRadius;
                    rigPosition.z = Math.sin(orbitAngle) * activeRig.orbitRadius;
                  } else if (activeRig.orbitAxis === 'z') {
                    rigPosition.x = Math.cos(orbitAngle) * activeRig.orbitRadius;
                    rigPosition.y = Math.sin(orbitAngle) * activeRig.orbitRadius;
                  }
                }
                break;
              
              case 'dolly':
                if (activeRig.dollySpeed && activeRig.dollyAxis) {
                  const dollyDistance = t * activeRig.dollySpeed * directionMultiplier;
                  if (activeRig.dollyAxis === 'z') {
                    rigPosition.z += dollyDistance;
                  } else if (activeRig.dollyAxis === 'x') {
                    rigPosition.x += dollyDistance;
                  } else if (activeRig.dollyAxis === 'y') {
                    rigPosition.y += dollyDistance;
                  }
                }
                break;
              
              case 'crane':
                if (activeRig.craneHeight !== undefined) {
                  rigPosition.y = activeRig.craneHeight;
                }
                if (activeRig.craneTilt !== undefined) {
                  rigRotation.x = activeRig.craneTilt * directionMultiplier;
                }
                break;
              
              case 'rotation':
                // Camera continuously faces the center while maintaining distance
                if (activeRig.rotationDistance && activeRig.rotationSpeed) {
                  const rotationAngle = t * activeRig.rotationSpeed * directionMultiplier;
                  rigPosition.x = Math.cos(rotationAngle) * activeRig.rotationDistance;
                  rigPosition.z = Math.sin(rotationAngle) * activeRig.rotationDistance;
                  // Calculate rotation to face center
                  rigRotation.y = rotationAngle + Math.PI;
                }
                break;
              
              case 'pan':
                // Horizontal sweeping movement
                if (activeRig.panSpeed && activeRig.panRange) {
                  const panAngle = Math.sin(t * activeRig.panSpeed) * (activeRig.panRange * Math.PI / 180 / 2) * directionMultiplier;
                  rigRotation.y += panAngle; // Add to existing rotation for combination
                }
                break;
              
              case 'zoom':
                // Smooth zoom in/out movement
                if (activeRig.zoomSpeed && activeRig.zoomMinDistance !== undefined && activeRig.zoomMaxDistance !== undefined) {
                  const zoomProgress = (Math.sin(t * activeRig.zoomSpeed * directionMultiplier) + 1) / 2; // 0 to 1
                  const zoomDistance = activeRig.zoomMinDistance + (activeRig.zoomMaxDistance - activeRig.zoomMinDistance) * zoomProgress;
                  rigPosition.z += zoomDistance; // Add to existing z position for combination
                }
                break;
            }
            
            // Update null object position/rotation
            if (rigNullObject) {
              rigNullObject.position.set(rigPosition.x, rigPosition.y, rigPosition.z);
              rigNullObject.rotation.set(rigRotation.x, rigRotation.y, rigRotation.z);
            }
            
            // Accumulate transformations from all rigs
            combinedPosition.x += rigPosition.x;
            combinedPosition.y += rigPosition.y;
            combinedPosition.z += rigPosition.z;
            combinedRotation.x += rigRotation.x;
            combinedRotation.y += rigRotation.y;
            combinedRotation.z += rigRotation.z;
          });
          
          // Create a virtual null object for the combined transform
          const combinedNullObject = new THREE.Object3D();
          combinedNullObject.position.set(combinedPosition.x, combinedPosition.y, combinedPosition.z);
          combinedNullObject.rotation.set(combinedRotation.x, combinedRotation.y, combinedRotation.z);
          
          // Parent camera to combined transform
          const rigCameraOffset = new THREE.Vector3(0, 0, activeCameraDistance);
          const rigWorldPos = new THREE.Vector3();
          combinedNullObject.getWorldPosition(rigWorldPos);
          
          // Apply rig rotation to camera offset
          rigCameraOffset.applyEuler(combinedNullObject.rotation);
          
          // Calculate base camera position from rig
          let finalCameraPosition = rigWorldPos.clone().add(rigCameraOffset);
          
          // Apply Camera FX Layer
          // 1. Handheld drift using noise
          if (enableHandheldDrift) {
            const noiseX = getHandheldNoise(t, 0) * handheldDriftIntensity;
            const noiseY = getHandheldNoise(t, 1) * handheldDriftIntensity;
            const noiseZ = getHandheldNoise(t, 2) * handheldDriftIntensity * 0.5; // Reduce Z drift
            
            finalCameraPosition.x += noiseX;
            finalCameraPosition.y += noiseY;
            finalCameraPosition.z += noiseZ;
          }
          
          // 2. FOV ramping during movement (based on velocity)
          if (enableFovRamping && cameraRef.current) {
            // Calculate velocity (simplified - based on distance from default)
            const distFromDefault = Math.abs(activeCameraDistance - DEFAULT_CAMERA_DISTANCE);
            const velocityFactor = Math.min(distFromDefault / 20, 1);
            const fovAdjustment = velocityFactor * fovRampAmount;
            cameraRef.current.fov = 75 + fovAdjustment;
            cameraRef.current.updateProjectionMatrix();
          } else if (cameraRef.current) {
            // Reset FOV to default
            if (cameraRef.current.fov !== 75) {
              cameraRef.current.fov = 75;
              cameraRef.current.updateProjectionMatrix();
            }
          }
          
          // Only override camera position if rigs are active
          // (this overrides the preset camera positioning)
          cam.position.copy(finalCameraPosition);
          
          // Framing controls - adjust look-at target
          let lookAtTarget = new THREE.Vector3(0, 0, 0);
          
          if (enableFramingLock || lookAtOffsetX !== 0 || lookAtOffsetY !== 0) {
            // Apply look-at offset
            lookAtTarget.x += lookAtOffsetX;
            lookAtTarget.y += lookAtOffsetY;
            
            // Rule of thirds bias - shift look-at slightly off-center
            if (enableRuleOfThirds) {
              // Offset by 1/3 of viewport for rule of thirds composition
              const viewportWidth = 20; // Approximate scene width
              const viewportHeight = 15; // Approximate scene height
              lookAtTarget.x += (viewportWidth / 6) * Math.sin(t * 0.5); // Subtle oscillation
              lookAtTarget.y += (viewportHeight / 6) * Math.cos(t * 0.3);
            }
          }
          
          cam.lookAt(lookAtTarget);
        }
      }

      // PHASE 4: Apply background flash effect before rendering
      if (bgFlash > 0) {
        if (skyboxType === 'color') {
          // Standard color flash
          const baseColor = new THREE.Color(backgroundColor);
          const flashColor = new THREE.Color(0xffffff);
          const blendedColor = baseColor.lerp(flashColor, Math.min(bgFlash, 1));
          scene.background = blendedColor;
          rend.setClearColor(blendedColor);
        } else if (skyboxType === 'gradient' && skyboxMeshRef.current) {
          // Flash the gradient skybox by blending towards white
          const material = skyboxMeshRef.current.material as THREE.ShaderMaterial;
          const baseTop = new THREE.Color(skyboxGradientTop);
          const baseBottom = new THREE.Color(skyboxGradientBottom);
          const flashColor = new THREE.Color(0xffffff);
          material.uniforms.topColor.value = baseTop.lerp(flashColor, Math.min(bgFlash, 1));
          material.uniforms.bottomColor.value = baseBottom.lerp(flashColor, Math.min(bgFlash, 1));
        }
        // Note: Image skyboxes don't flash (would require shader manipulation)
      } else {
        if (skyboxType === 'color') {
          const baseColor = new THREE.Color(backgroundColor);
          scene.background = baseColor;
          rend.setClearColor(baseColor);
        } else if (skyboxType === 'gradient' && skyboxMeshRef.current) {
          // Reset gradient colors
          const material = skyboxMeshRef.current.material as THREE.ShaderMaterial;
          material.uniforms.topColor.value = new THREE.Color(skyboxGradientTop);
          material.uniforms.bottomColor.value = new THREE.Color(skyboxGradientBottom);
        }
      }

      // Update camera rig visual hints
      if (showRigHints && rigHintsRef.current) {
        const hints = rigHintsRef.current;
        
        // Update position marker (camera location)
        if (hints.positionMarker && showRigPosition) {
          hints.positionMarker.visible = true;
          hints.positionMarker.position.copy(cam.position);
        } else if (hints.positionMarker) {
          hints.positionMarker.visible = false;
        }
        
        // Update target marker (look-at point - scene origin)
        if (hints.targetMarker && showRigTarget) {
          hints.targetMarker.visible = true;
          hints.targetMarker.position.set(0, 0, 0);
        } else if (hints.targetMarker) {
          hints.targetMarker.visible = false;
        }
        
        // Update connection line
        if (hints.connectionLine && showRigPosition && showRigTarget) {
          hints.connectionLine.visible = true;
          const positions = hints.connectionLine.geometry.attributes.position;
          if (positions) {
            positions.setXYZ(0, cam.position.x, cam.position.y, cam.position.z);
            positions.setXYZ(1, 0, 0, 0);
            positions.needsUpdate = true;
          }
        } else if (hints.connectionLine) {
          hints.connectionLine.visible = false;
        }
        
        // Update grid helper
        if (hints.gridHelper && showRigGrid) {
          hints.gridHelper.visible = true;
        } else if (hints.gridHelper) {
          hints.gridHelper.visible = false;
        }
        
        // Update keyframe path preview
        // REMOVED: Path preview from global camera keyframes (orphaned feature)
      } else if (rigHintsRef.current) {
        // Hide all hints
        if (rigHintsRef.current.positionMarker) rigHintsRef.current.positionMarker.visible = false;
        if (rigHintsRef.current.targetMarker) rigHintsRef.current.targetMarker.visible = false;
        if (rigHintsRef.current.connectionLine) rigHintsRef.current.connectionLine.visible = false;
        if (rigHintsRef.current.gridHelper) rigHintsRef.current.gridHelper.visible = false;
        if (rigHintsRef.current.pathLine) rigHintsRef.current.pathLine.visible = false;
      }

      // Update camera rig path visualizations
      cameraRigs.forEach(rig => {
        const pathObjects = rigPathsRef.current.get(rig.id);
        if (pathObjects) {
          // Show/hide path line based on enabled state and showRigPaths setting
          if (pathObjects.pathLine) {
            pathObjects.pathLine.visible = rig.enabled && showRigPaths;
          }
          
          // Show/hide keyframe markers
          pathObjects.keyframeMarkers.forEach(marker => {
            marker.visible = rig.enabled && showRigPaths && showRigKeyframeMarkers;
          });
        }
      });

      // PHASE 5: Mask Reveals - Apply masks to renderer (post-render effect)
      // Note: Full mask implementation would require shader-based rendering or stencil buffer
      // For now, we'll prepare the mask data and apply basic visibility controls
      const activeMasks = masks.filter(m => m.enabled);
      if (activeMasks.length > 0) {
        // Mask rendering would be implemented here with custom shaders
        // This is a placeholder for the mask system infrastructure
        // Future implementation: Use WebGL stencil buffer or shader-based masking
      }

      // Update post-FX shader uniforms
      if (postFXPassRef.current) {
        const uniforms = postFXPassRef.current.uniforms;
        uniforms.vignetteStrength.value = vignetteStrength;
        uniforms.vignetteSoftness.value = vignetteSoftness;
        uniforms.saturation.value = colorSaturation;
        uniforms.contrast.value = colorContrast;
        uniforms.gamma.value = colorGamma;
        uniforms.tintR.value = colorTintR;
        uniforms.tintG.value = colorTintG;
        uniforms.tintB.value = colorTintB;
      }

      // PR 5: Preset Authoring Mode - Apply solver transformations to workspace objects
      if (workspaceMode && presetAuthoringMode && workspaceObjects.length > 0) {
        // When authoring mode is enabled, apply selected preset's solver to workspace objects
        // This provides live preview of how the preset would animate the objects
        
        // Convert workspace objects to a solver-compatible pool format
        const mockPool = {
          cubes: workspaceObjects.filter(obj => obj.type === 'box' && obj.mesh).map(obj => obj.mesh!),
          octahedrons: workspaceObjects.filter(obj => obj.type === 'sphere' && obj.mesh).map(obj => obj.mesh!),
          tetrahedrons: workspaceObjects.filter(obj => obj.type === 'torus' && obj.mesh).map(obj => obj.mesh!),
          toruses: workspaceObjects.filter(obj => obj.type === 'torus' && obj.mesh).map(obj => obj.mesh!),
          planes: workspaceObjects.filter(obj => obj.type === 'plane' && obj.mesh).map(obj => obj.mesh!),
          sphere: workspaceObjects.find(obj => obj.type === 'sphere' && obj.mesh)?.mesh || obj.sphere
        };

        // Build solver context with mock values from UI
        const authoringContext = {
          time: mockTime,
          audio: {
            bass: mockAudio.bass / 255, // Normalize to 0-1
            mids: mockAudio.mids / 255,
            highs: mockAudio.highs / 255
          },
          poses: new Map(), // Empty for now
          pool: mockPool,
          blend: 1.0, // Full opacity
          camera: cam,
          rotationSpeed: 0,
          cameraDistance: 20,
          cameraHeight: 0,
          cameraRotation: 0,
          shake: { x: 0, y: 0, z: 0 },
          colors: {
            cube: cubeColor,
            octahedron: octahedronColor,
            tetrahedron: tetrahedronColor,
            sphere: sphereColor
          }
        };

        // Call the selected solver (currently only orbit is extracted)
        if (authoringPreset === 'orbit' && mockPool.cubes.length > 0) {
          try {
            solveOrbit(authoringContext);
          } catch (error) {
            console.error('Authoring mode solver error:', error);
          }
        }
        // More solvers will be added as they're extracted in PR 4
      }

      // Camera FX Rendering
      const activeFXClips = cameraFXClips.filter(clip => 
        clip.enabled && t >= clip.startTime && t < clip.endTime
      );

      if (activeFXClips.length > 0) {
        // Apply Camera FX using viewport/scissor rendering
        const canvasWidth = rend.domElement.width;
        const canvasHeight = rend.domElement.height;

        // Pre-index keyframes and modulations by clipId for performance
        const keyframesByClip = new Map<string, Map<string, CameraFXKeyframe[]>>();
        const modulationsByClip = new Map<string, Map<string, CameraFXAudioModulation>>();
        
        activeFXClips.forEach(clip => {
          const paramMap = new Map<string, CameraFXKeyframe[]>();
          cameraFXKeyframes
            .filter(kf => kf.clipId === clip.id)
            .forEach(kf => {
              if (!paramMap.has(kf.parameter)) paramMap.set(kf.parameter, []);
              paramMap.get(kf.parameter)!.push(kf);
            });
          paramMap.forEach(kfs => kfs.sort((a, b) => a.time - b.time));
          keyframesByClip.set(clip.id, paramMap);
          
          const modMap = new Map<string, CameraFXAudioModulation>();
          cameraFXAudioModulations
            .filter(mod => mod.clipId === clip.id)
            .forEach(mod => modMap.set(mod.parameter, mod));
          modulationsByClip.set(clip.id, modMap);
        });

        const getInterpolatedValue = (clipId: string, parameter: string, defaultValue: number): number => {
          const paramMap = keyframesByClip.get(clipId);
          if (!paramMap) return defaultValue;
          
          const clipKeyframes = paramMap.get(parameter);
          if (!clipKeyframes || clipKeyframes.length === 0) return defaultValue;
          
          let prevKf = clipKeyframes[0];
          let nextKf = clipKeyframes[clipKeyframes.length - 1];
          
          for (let i = 0; i < clipKeyframes.length - 1; i++) {
            if (t >= clipKeyframes[i].time && t <= clipKeyframes[i + 1].time) {
              prevKf = clipKeyframes[i];
              nextKf = clipKeyframes[i + 1];
              break;
            }
          }
          
          if (prevKf === nextKf) return prevKf.value;
          
          const duration = nextKf.time - prevKf.time;
          const elapsedTime = t - prevKf.time;
          let progress = duration > 0 ? elapsedTime / duration : 0;
          
          if (nextKf.easing === 'easeIn') {
            progress = progress * progress;
          } else if (nextKf.easing === 'easeOut') {
            progress = 1 - (1 - progress) * (1 - progress);
          } else if (nextKf.easing === 'easeInOut') {
            progress = progress < 0.5 
              ? 2 * progress * progress 
              : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          }
          
          return prevKf.value + (nextKf.value - prevKf.value) * progress;
        };

        const applyAudioModulation = (clipId: string, baseValue: number, parameter: string): number => {
          const modMap = modulationsByClip.get(clipId);
          if (!modMap) return baseValue;
          
          const modulation = modMap.get(parameter);
          if (!modulation || !isPlaying) return baseValue;
          
          const audioValue = modulation.audioTrack === 'bass' ? f.bass :
                             modulation.audioTrack === 'mids' ? f.mids :
                             f.highs;
          
          return baseValue + (audioValue * modulation.amount * baseValue);
        };

        activeFXClips.forEach(clip => {
          if (clip.type === 'grid') {
            const rows = Math.round(applyAudioModulation(
              clip.id,
              getInterpolatedValue(clip.id, 'gridRows', clip.gridRows || 2),
              'gridRows'
            ));
            const cols = Math.round(applyAudioModulation(
              clip.id,
              getInterpolatedValue(clip.id, 'gridColumns', clip.gridColumns || 2),
              'gridColumns'
            ));

            rend.setScissorTest(true);
            const cellWidth = canvasWidth / cols;
            const cellHeight = canvasHeight / rows;

            for (let row = 0; row < rows; row++) {
              for (let col = 0; col < cols; col++) {
                const x = col * cellWidth;
                // WebGL uses bottom-left origin, so invert Y coordinate
                const y = (rows - 1 - row) * cellHeight;
                
                rend.setViewport(x, y, cellWidth, cellHeight);
                rend.setScissor(x, y, cellWidth, cellHeight);
                if (composerRef.current) {
                  composerRef.current.render();
                } else {
                  rend.render(scene, cam);
                }
              }
            }

            rend.setScissorTest(false);
            rend.setViewport(0, 0, canvasWidth, canvasHeight);

          } else if (clip.type === 'kaleidoscope') {
            const segments = Math.round(applyAudioModulation(
              clip.id,
              getInterpolatedValue(clip.id, 'kaleidoscopeSegments', clip.kaleidoscopeSegments || 6),
              'kaleidoscopeSegments'
            ));
            const rotation = applyAudioModulation(
              clip.id,
              getInterpolatedValue(clip.id, 'kaleidoscopeRotation', clip.kaleidoscopeRotation || 0),
              'kaleidoscopeRotation'
            );

            rend.setScissorTest(true);
            
            const wedgeAngle = (Math.PI * 2) / segments;
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            const radius = Math.sqrt(centerX * centerX + centerY * centerY);

            for (let i = 0; i < segments; i++) {
              const angle = (i * wedgeAngle) + (rotation * Math.PI / 180);
              
              const x1 = centerX + Math.cos(angle) * radius;
              const y1 = centerY + Math.sin(angle) * radius;
              const x2 = centerX + Math.cos(angle + wedgeAngle) * radius;
              const y2 = centerY + Math.sin(angle + wedgeAngle) * radius;
              
              const minX = Math.min(centerX, x1, x2);
              const maxX = Math.max(centerX, x1, x2);
              const minY = Math.min(centerY, y1, y2);
              const maxY = Math.max(centerY, y1, y2);
              
              rend.setViewport(minX, minY, maxX - minX, maxY - minY);
              rend.setScissor(minX, minY, maxX - minX, maxY - minY);
              
              if (i % 2 === 1 && cam) {
                const tempRot = cam.rotation.clone();
                cam.rotation.y *= -1;
                if (composerRef.current) {
                  composerRef.current.render();
                } else {
                  rend.render(scene, cam);
                }
                cam.rotation.copy(tempRot);
              } else {
                if (composerRef.current) {
                  composerRef.current.render();
                } else {
                  rend.render(scene, cam);
                }
              }
            }

            rend.setScissorTest(false);
            rend.setViewport(0, 0, canvasWidth, canvasHeight);

          } else if (clip.type === 'pip') {
            const scale = applyAudioModulation(
              clip.id,
              getInterpolatedValue(clip.id, 'pipScale', clip.pipScale || 0.25),
              'pipScale'
            );
            const posX = applyAudioModulation(
              clip.id,
              getInterpolatedValue(clip.id, 'pipPositionX', clip.pipPositionX || 0.65),
              'pipPositionX'
            );
            const posY = applyAudioModulation(
              clip.id,
              getInterpolatedValue(clip.id, 'pipPositionY', clip.pipPositionY || 0.65),
              'pipPositionY'
            );

            rend.setViewport(0, 0, canvasWidth, canvasHeight);
            if (composerRef.current) {
              composerRef.current.render();
            } else {
              rend.render(scene, cam);
            }

            const pipWidth = canvasWidth * scale;
            const pipHeight = canvasHeight * scale;
            const pipX = ((posX + 1) / 2) * (canvasWidth - pipWidth);
            const pipY = ((posY + 1) / 2) * (canvasHeight - pipHeight);

            rend.setScissorTest(true);
            rend.setViewport(pipX, pipY, pipWidth, pipHeight);
            rend.setScissor(pipX, pipY, pipWidth, pipHeight);
            if (composerRef.current) {
              composerRef.current.render();
            } else {
              rend.render(scene, cam);
            }
            rend.setScissorTest(false);
            
            rend.setViewport(0, 0, canvasWidth, canvasHeight);
          }
        });
      } else {
        // Normal render (no FX active)
        if (composerRef.current) {
          composerRef.current.render();
        } else {
          rend.render(scene, cam);
        }
      }
      } catch (error) {
        // Log error but continue animation to prevent export from breaking
        console.error('Animation loop error:', error);
      }
    };

    anim();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, sections, duration, bassColor, midsColor, highsColor, showSongName, vignetteStrength, vignetteSoftness, colorSaturation, colorContrast, colorGamma, colorTintR, colorTintG, colorTintB, cubeColor, octahedronColor, tetrahedronColor, sphereColor, textColor, textWireframe, textOpacity, cameraFXClips, cameraFXKeyframes, cameraFXAudioModulations, masks]);

  // Draw waveform on canvas - optimized with throttling
  useEffect(() => {
    if (!waveformCanvasRef.current || waveformData.length === 0) return;
    
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const renderWaveform = () => {
      const now = performance.now();
      const timeSinceLastRender = now - lastWaveformRenderRef.current;
      
      // Throttle to max 30fps for waveform rendering
      if (timeSinceLastRender < WAVEFORM_THROTTLE_MS) {
        if (isPlaying) {
          waveformAnimationFrameRef.current = requestAnimationFrame(renderWaveform);
        }
        return;
      }
      
      lastWaveformRenderRef.current = now;
      
      // Calculate current progress (0 to 1)
      const currentProgress = duration > 0 ? currentTime / duration : 0;
      
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      if (waveformMode === 'scrolling') {
        // Scrolling waveform parameters
        const BAR_WIDTH = 3;
        const BAR_GAP = 1;
        const totalBarWidth = BAR_WIDTH + BAR_GAP;
        const maxHeight = height * 0.4;
        const baseY = height;
        const playheadX = width / 2;
        const playedBarIndex = Math.floor(currentProgress * waveformData.length);
        
        // Colors for scrolling mode
        const SCROLLING_PLAYED_COLOR = 'rgba(255, 255, 255, 0.85)';
        const SCROLLING_UNPLAYED_COLOR = 'rgba(100, 100, 120, 0.35)';
        const SCROLLING_PLAYHEAD_COLOR = 'rgba(255, 255, 255, 0.6)';
        
        // Calculate scroll offset
        const totalWidth = waveformData.length * totalBarWidth;
        const scrollOffset = currentProgress * totalWidth;
        
        // Draw waveform bars (scrolling with centered playhead)
        for (let i = 0; i < waveformData.length; i++) {
          const barHeight = waveformData[i] * maxHeight;
          const x = playheadX + (i * totalBarWidth) - scrollOffset;
          
          // Only render bars that are visible in the viewport
          if (x > -totalBarWidth && x < width) {
            const y = baseY - barHeight;
            const isPlayed = i < playedBarIndex;
            
            ctx.fillStyle = isPlayed ? SCROLLING_PLAYED_COLOR : SCROLLING_UNPLAYED_COLOR;
            ctx.fillRect(x, y, BAR_WIDTH, barHeight);
          }
        }
        
        // Draw playhead line at center
        ctx.fillStyle = SCROLLING_PLAYHEAD_COLOR;
        ctx.fillRect(playheadX - 1, 0, 2, height);
      } else {
        // Static waveform parameters (entire waveform visible)
        const BAR_GAP = 0.5;
        const barWidth = Math.max(1, width / waveformData.length - BAR_GAP);
        const maxHeight = height * 0.8;
        const baseY = height / 2;
        
        // Colors matching app theme
        const PLAYED_COLOR = 'rgba(6, 182, 212, 0.9)';
        const UNPLAYED_COLOR = 'rgba(100, 100, 120, 0.4)';
        const PLAYHEAD_COLOR = 'rgba(255, 255, 255, 0.9)';
        
        const playheadX = currentProgress * width;
        
        // Draw waveform bars (static, entire waveform visible)
        for (let i = 0; i < waveformData.length; i++) {
          const barHeight = waveformData[i] * maxHeight;
          const x = (i / waveformData.length) * width;
          const y = baseY - barHeight / 2;
          
          const isPast = (i / waveformData.length) < currentProgress;
          
          ctx.fillStyle = isPast ? PLAYED_COLOR : UNPLAYED_COLOR;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
        
        // Draw playhead line (moves across the waveform)
        ctx.fillStyle = PLAYHEAD_COLOR;
        ctx.fillRect(playheadX - 1, 0, 2, height);
      }
      
      // Continue animation loop if playing
      if (isPlaying) {
        waveformAnimationFrameRef.current = requestAnimationFrame(renderWaveform);
      }
    };
    
    // Start rendering
    if (isPlaying) {
      waveformAnimationFrameRef.current = requestAnimationFrame(renderWaveform);
    } else {
      // Render once when not playing
      renderWaveform();
    }
    
    return () => {
      if (waveformAnimationFrameRef.current) {
        cancelAnimationFrame(waveformAnimationFrameRef.current);
        waveformAnimationFrameRef.current = null;
      }
    };
  }, [waveformData, currentTime, duration, waveformMode, isPlaying]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        if (showKeyboardShortcuts) {
          setShowKeyboardShortcuts(false);
        } else if (showSettingsModal) {
          setShowSettingsModal(false);
        } else if (showExportModal) {
          setShowExportModal(false);
        } else if (showEventModal) {
          setShowEventModal(false);
          setEditingEventId(null);
        } else if (showProjectsModal) {
          setShowProjectsModal(false);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        // Save project
        e.preventDefault();
        handleSaveProject();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        // Open project
        e.preventDefault();
        setShowProjectsModal(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        // New project
        e.preventDefault();
        handleNewProject();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        // Switch to Editor mode
        e.preventDefault();
        setViewMode('editor');
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        // Switch to Preview mode (Ctrl+Shift+P to avoid conflict with browser print)
        e.preventDefault();
        setViewMode('preview');
      } else if (e.key === 'g' || e.key === 'G') {
        // Toggle camera rig hints in editor mode, or toggle grid in workspace mode
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          if (workspaceMode) {
            setShowGrid(prev => !prev);
          } else {
            setShowRigHints(prev => !prev);
          }
        }
      } else if (e.key === 'a' || e.key === 'A') {
        // Toggle axes in workspace mode (only when no modifiers)
        if (workspaceMode && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          setShowAxes(prev => !prev);
        }
      } else if (e.key === 'u' || e.key === 'U') {
        // Toggle use workspace objects in workspace mode
        if (workspaceMode && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          setUseWorkspaceObjects(prev => !prev);
        }
      } else if (e.key === 'w' || e.key === 'W') {
        // Toggle workspace mode
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          setWorkspaceMode(prev => !prev);
        }
      } else if (e.key === 'p' || e.key === 'P') {
        // Toggle performance overlay (PR 9: Guardrails)
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
          setShowPerformanceOverlay(prev => !prev);
        }
      } else if (e.key === '`') {
        // Toggle debug console
        setShowDebugConsole(prev => !prev);
      } else if (e.key >= '1' && e.key <= '9') {
        // Number keys 1-9 for tab navigation
        const tabIndex = parseInt(e.key) - 1;
        if (tabIndex < TAB_ORDER.length) {
          setActiveTab(TAB_ORDER[tabIndex]);
        }
      } else if (e.key === '0') {
        // Number key 0 for the 10th tab (last tab in TAB_ORDER)
        setActiveTab(TAB_ORDER[TAB_ORDER.length - 1]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExportModal, showEventModal, showKeyboardShortcuts, showSettingsModal, showProjectsModal, showDebugConsole, workspaceMode]);

  // Initialize workspace mode defaults when entering workspace mode
  useEffect(() => {
    if (workspaceMode) {
      // Enable grid, axes, and workspace objects by default in workspace mode
      setShowGrid(true);
      setShowAxes(true);
      setUseWorkspaceObjects(true);
      addLog('Workspace mode enabled: Grid, axes, and workspace objects are now visible', 'info');
    }
  }, [workspaceMode]);

  // Update workspace grid and axes visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  useEffect(() => {
    if (axesHelperRef.current) {
      axesHelperRef.current.visible = showAxes;
    }
  }, [showAxes]);

  // Workspace object management callbacks
  const handleCreateObject = (type: 'sphere' | 'box' | 'plane' | 'torus' | 'instances') => {
    if (!sceneRef.current) return;
    
    const id = `workspace-${type}-${Date.now()}`;
    const newObject: WorkspaceObject = {
      id,
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${workspaceObjects.length + 1}`,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#8a2be2',
      wireframe: true,
      visible: true,
      opacity: 1.0,
      materialType: 'basic',
      metalness: 0.5,
      roughness: 0.5
    };
    
    // Create Three.js mesh
    let geometry: THREE.BufferGeometry;
    switch (type) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        break;
      case 'box':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'plane':
        geometry = new THREE.PlaneGeometry(2, 2);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
        break;
      case 'instances':
        // Create instanced mesh (simplified for now)
        geometry = new THREE.SphereGeometry(0.5, 16, 16);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(newObject.color),
      wireframe: newObject.wireframe
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(newObject.position.x, newObject.position.y, newObject.position.z);
    sceneRef.current.add(mesh);
    
    newObject.mesh = mesh;
    
    setWorkspaceObjects(prev => [...prev, newObject]);
    setSelectedObjectId(id);
    
    addLog(`Created ${type} object: ${newObject.name}`, 'success');
  };
  
  const handleSelectObject = (id: string | null) => {
    setSelectedObjectId(id);
  };
  
  const handleUpdateObject = (id: string, updates: Partial<WorkspaceObject>) => {
    setWorkspaceObjects(prev => {
      const newObjects = prev.map(obj => {
        if (obj.id === id) {
          const updated = { ...obj, ...updates };
          
          // Update Three.js mesh
          if (obj.mesh) {
            if (updates.position) {
              obj.mesh.position.set(updates.position.x, updates.position.y, updates.position.z);
            }
            if (updates.rotation) {
              obj.mesh.rotation.set(
                updates.rotation.x * Math.PI / 180,
                updates.rotation.y * Math.PI / 180,
                updates.rotation.z * Math.PI / 180
              );
            }
            if (updates.scale) {
              obj.mesh.scale.set(updates.scale.x, updates.scale.y, updates.scale.z);
            }
            
            // Handle material changes - may need to recreate material
            if (updates.materialType && updates.materialType !== obj.materialType) {
              // Material type changed - create new material
              const oldMaterial = obj.mesh.material;
              let newMaterial: THREE.Material;
              
              const materialProps = {
                color: new THREE.Color(updated.color),
                wireframe: updated.wireframe,
                transparent: (updated.opacity !== undefined && updated.opacity < 1),
                opacity: updated.opacity !== undefined ? updated.opacity : 1
              };
              
              switch (updates.materialType) {
                case 'standard':
                  newMaterial = new THREE.MeshStandardMaterial({
                    ...materialProps,
                    metalness: updated.metalness !== undefined ? updated.metalness : 0.5,
                    roughness: updated.roughness !== undefined ? updated.roughness : 0.5
                  });
                  break;
                case 'phong':
                  newMaterial = new THREE.MeshPhongMaterial(materialProps);
                  break;
                case 'lambert':
                  newMaterial = new THREE.MeshLambertMaterial(materialProps);
                  break;
                default:
                  newMaterial = new THREE.MeshBasicMaterial(materialProps);
              }
              
              obj.mesh.material = newMaterial;
              if (oldMaterial) oldMaterial.dispose();
            } else {
              // Update existing material properties
              if (obj.mesh.material) {
                const mat = obj.mesh.material as any;
                
                if (updates.color) {
                  mat.color = new THREE.Color(updates.color);
                }
                if (updates.wireframe !== undefined) {
                  mat.wireframe = updates.wireframe;
                }
                if (updates.opacity !== undefined) {
                  mat.opacity = updates.opacity;
                  mat.transparent = updates.opacity < 1;
                }
                if (updates.metalness !== undefined && 'metalness' in mat) {
                  mat.metalness = updates.metalness;
                }
                if (updates.roughness !== undefined && 'roughness' in mat) {
                  mat.roughness = updates.roughness;
                }
                
                mat.needsUpdate = true;
              }
            }
            
            if (updates.visible !== undefined) {
              obj.mesh.visible = updates.visible;
            }
          }
          
          return updated;
        }
        return obj;
      });
      return newObjects;
    });
  };
  
  const handleDeleteObject = (id: string) => {
    setWorkspaceObjects(prev => {
      const obj = prev.find(o => o.id === id);
      if (obj && obj.mesh && sceneRef.current) {
        sceneRef.current.remove(obj.mesh);
        if (obj.mesh.geometry) obj.mesh.geometry.dispose();
        if (obj.mesh.material) {
          if (Array.isArray(obj.mesh.material)) {
            obj.mesh.material.forEach((m: THREE.Material) => m.dispose());
          } else {
            obj.mesh.material.dispose();
          }
        }
      }
      
      if (selectedObjectId === id) {
        setSelectedObjectId(null);
      }
      
      addLog(`Deleted object: ${obj?.name || id}`, 'info');
      return prev.filter(o => o.id !== id);
    });
  };
  
  const handleToggleGrid = () => {
    setShowGrid(prev => !prev);
  };
  
  const handleToggleAxes = () => {
    setShowAxes(prev => !prev);
  };

  const handleToggleVisualizationSource = () => {
    setUseWorkspaceObjects(prev => !prev);
  };

  // Workspace action handlers (Phase 1 Part 2)
  const handleDuplicateObject = () => {
    if (!selectedObjectId || !sceneRef.current) {
      addLog('No object selected to duplicate', 'error');
      return;
    }
    
    const selectedObj = workspaceObjects.find(obj => obj.id === selectedObjectId);
    if (!selectedObj) return;
    
    const id = `workspace-${selectedObj.type}-${Date.now()}`;
    const duplicatedObject: WorkspaceObject = {
      ...selectedObj,
      id,
      name: `${selectedObj.name} Copy`,
      position: {
        x: selectedObj.position.x + 2, // Offset by 2 units
        y: selectedObj.position.y,
        z: selectedObj.position.z
      },
      mesh: undefined // Will create new mesh
    };
    
    // Create Three.js mesh
    let geometry: THREE.BufferGeometry;
    switch (selectedObj.type) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        break;
      case 'box':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
      case 'plane':
        geometry = new THREE.PlaneGeometry(2, 2);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }
    
    // Create material matching original
    let material: THREE.Material;
    const materialProps = {
      color: new THREE.Color(duplicatedObject.color),
      wireframe: duplicatedObject.wireframe,
      transparent: duplicatedObject.opacity < 1,
      opacity: duplicatedObject.opacity
    };
    
    switch (duplicatedObject.materialType) {
      case 'standard':
        material = new THREE.MeshStandardMaterial({
          ...materialProps,
          metalness: duplicatedObject.metalness,
          roughness: duplicatedObject.roughness
        });
        break;
      case 'phong':
        material = new THREE.MeshPhongMaterial(materialProps);
        break;
      case 'lambert':
        material = new THREE.MeshLambertMaterial(materialProps);
        break;
      default:
        material = new THREE.MeshBasicMaterial(materialProps);
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(duplicatedObject.position.x, duplicatedObject.position.y, duplicatedObject.position.z);
    mesh.rotation.set(
      duplicatedObject.rotation.x * Math.PI / 180,
      duplicatedObject.rotation.y * Math.PI / 180,
      duplicatedObject.rotation.z * Math.PI / 180
    );
    mesh.scale.set(duplicatedObject.scale.x, duplicatedObject.scale.y, duplicatedObject.scale.z);
    mesh.visible = duplicatedObject.visible;
    
    sceneRef.current.add(mesh);
    duplicatedObject.mesh = mesh;
    
    setWorkspaceObjects(prev => [...prev, duplicatedObject]);
    setSelectedObjectId(id);
    
    addLog(`Duplicated object: ${duplicatedObject.name}`, 'success');
  };
  
  const handleDeleteSelectedObject = () => {
    if (!selectedObjectId) {
      addLog('No object selected to delete', 'error');
      return;
    }
    handleDeleteObject(selectedObjectId);
  };
  
  const handleSelectAllObjects = () => {
    if (workspaceObjects.length === 0) {
      addLog('No objects to select', 'info');
      return;
    }
    // For now, just select the first object
    // TODO: Implement multi-select in future
    setSelectedObjectId(workspaceObjects[0].id);
    addLog(`Selected ${workspaceObjects.length} objects (multi-select coming soon)`, 'info');
  };
  
  const handleDeselectAll = () => {
    setSelectedObjectId(null);
    addLog('Deselected all objects', 'info');
  };
  
  const handleToggleObjectVisibility = () => {
    if (!selectedObjectId) {
      addLog('No object selected', 'error');
      return;
    }
    
    const selectedObj = workspaceObjects.find(obj => obj.id === selectedObjectId);
    if (!selectedObj) return;
    
    handleUpdateObject(selectedObjectId, { visible: !selectedObj.visible });
    addLog(`Object visibility: ${!selectedObj.visible ? 'visible' : 'hidden'}`, 'info');
  };
  
  // Undo/Redo placeholders (will implement with UndoRedoManager later)
  const handleUndo = () => {
    addLog('Undo functionality coming soon', 'info');
    // TODO: Implement undo with UndoRedoManager
  };
  
  const handleRedo = () => {
    addLog('Redo functionality coming soon', 'info');
    // TODO: Implement redo with UndoRedoManager
  };

  // Effect: Hide default audio-reactive shapes when using workspace objects
  useEffect(() => {
    if (!objectsRef.current) return;
    
    const { cubes, octas, tetras, sphere, toruses, planes } = objectsRef.current;
    
    if (useWorkspaceObjects) {
      // Hide all default shapes when using workspace objects
      sphere.visible = false;
      cubes.forEach(cube => { cube.visible = false; });
      octas.forEach(octa => { octa.visible = false; });
      tetras.forEach(tetra => { tetra.visible = false; });
      if (toruses) toruses.forEach(torus => { torus.visible = false; });
      if (planes) planes.forEach(plane => { plane.visible = false; });
      
      addLog('Using workspace objects: Default shapes hidden', 'info');
    } else {
      // Show all default shapes when using presets
      sphere.visible = true;
      cubes.forEach(cube => { cube.visible = true; });
      octas.forEach(octa => { octa.visible = true; });
      tetras.forEach(tetra => { tetra.visible = true; });
      if (toruses) toruses.forEach(torus => { torus.visible = true; });
      if (planes) planes.forEach(plane => { plane.visible = true; });
      
      addLog('Using preset shapes: Default shapes visible', 'info');
    }
  }, [useWorkspaceObjects]);

  // --- Canvas Area JSX (needs to be before workspaceContentJSX) ---
  const canvasAreaJSX = (
    <div className={`flex items-center justify-center w-full h-full bg-gray-950 ${
      viewMode === 'preview' ? 'py-0' : 'py-4'
    }`}>
      <div className="relative">
        <div ref={containerRef} className={`rounded-lg shadow-2xl overflow-hidden ${showBorder ? 'border-2' : ''}`} style={{width:'960px',height:'540px',borderColor:borderColor}} />
        {showLetterbox && (() => {
          // When invert=true: targetSize goes from 100 (fully closed) to 0 (fully open)
          // We need to map this to actual bar heights using the configurable maxLetterboxHeight
          // When invert=false: targetSize is direct pixel height: 100 -> 100px, 0 -> 0px
          const actualBarHeight = activeLetterboxInvert 
            ? Math.round((letterboxSize / 100) * maxLetterboxHeight)  // Scale to max height (both top and bottom)
            : letterboxSize;
          return (
            <>
              <div className="absolute top-0 left-0 right-0 bg-black pointer-events-none" style={{height: `${actualBarHeight}px`}} />
              <div className="absolute bottom-0 left-0 right-0 bg-black pointer-events-none" style={{height: `${actualBarHeight}px`}} />
            </>
          );
        })()}
        {showFilename && audioFileName && <div className="absolute text-white text-sm bg-black bg-opacity-70 px-3 py-2 rounded font-semibold" style={{top: `${showLetterbox ? (activeLetterboxInvert ? Math.round((letterboxSize / 100) * maxLetterboxHeight) : letterboxSize) + 16 : 16}px`, left: '16px'}}>{audioFileName}</div>}
        
        {/* Workspace Controls moved to WorkspaceLeftPanel - no longer needed as floating overlay */}
        
        {/* Playback controls overlay for Preview mode */}
        {viewMode === 'preview' && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm rounded-lg px-6 py-3 flex items-center gap-4 z-30 shadow-2xl border border-gray-700">
            <button 
              onClick={() => {
                if (isPlaying) {
                  if (audioTracks.length > 0) stopMultiTrackAudio();
                  else stopAudio();
                } else {
                  if (audioTracks.length > 0) playMultiTrackAudio();
                  else playAudio();
                }
              }}
              className="text-white hover:text-cyan-400 transition-colors p-1"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Workspace mode - Multi-panel layout
  const workspaceContentJSX = workspaceMode ? (
    <WorkspaceLayout
      // Left Side Panels
      scenePanel={
        <ScenePanel
          workspaceObjects={workspaceObjects}
          selectedObjectId={selectedObjectId}
          onSelectObject={handleSelectObject}
          onDeleteObject={handleDeleteObject}
          onCreateObject={handleCreateObject}
          showGrid={showGrid}
          onToggleGrid={handleToggleGrid}
          showAxes={showAxes}
          onToggleAxes={handleToggleAxes}
          useWorkspaceObjects={useWorkspaceObjects}
          onToggleVisualizationSource={handleToggleVisualizationSource}
        />
      }
      posesPanel={
        <SequencerPanel
          workspaceObjects={workspaceObjects}
          onUpdateObjects={setWorkspaceObjects}
          currentTime={currentTime}
        />
      }
      
      // Right Side Panels
      propertiesPanel={
        <ObjectPropertiesPanel
          selectedObject={workspaceObjects.find(obj => obj.id === selectedObjectId) || null}
          onUpdateObject={handleUpdateObject}
          onDeleteObject={handleDeleteObject}
          cameraDistance={cameraDistance}
          cameraHeight={cameraHeight}
          cameraRotation={cameraRotation}
          onSetCameraDistance={setCameraDistance}
          onSetCameraHeight={setCameraHeight}
          onSetCameraRotation={setCameraRotation}
          showLetterbox={showLetterbox}
          letterboxSize={letterboxSize}
          onSetShowLetterbox={setShowLetterbox}
          onSetLetterboxSize={setLetterboxSize}
        />
      }
      templatesPanel={
        <TemplatesPanel
          workspaceObjects={workspaceObjects}
          presetAuthoringMode={presetAuthoringMode}
          onTogglePresetAuthoring={() => setPresetAuthoringMode(!presetAuthoringMode)}
          selectedPreset={authoringPreset}
          onSelectPreset={setAuthoringPreset}
        />
      }
      authoringPanel={
        <AuthoringPanel
          presetAuthoringMode={presetAuthoringMode}
          onTogglePresetAuthoring={() => setPresetAuthoringMode(!presetAuthoringMode)}
          selectedPreset={authoringPreset}
          onSelectPreset={setAuthoringPreset}
          mockTime={mockTime}
          onMockTimeChange={setMockTime}
          mockAudio={mockAudio}
          onMockAudioChange={setMockAudio}
        />
      }
      
      // Bottom & Status
      timelinePanel={
        <div className="p-4 text-center text-gray-500">
          <div className="text-xs">Pose sequencer timeline will appear here</div>
          <div className="text-xs mt-1">Drag and sequence pose keyframes along a timeline</div>
        </div>
      }
      statusBar={
        <WorkspaceStatusBar
          workspaceObjects={workspaceObjects}
          selectedObjectId={selectedObjectId}
          fps={60}
          memoryUsage={0}
          performanceMode="balanced"
        />
      }
    >
      {canvasAreaJSX}
    </WorkspaceLayout>
  ) : null;

  // Old workspace panels for fallback
  const workspaceLeftPanelJSX = (
    <WorkspaceLeftPanel
      workspaceObjects={workspaceObjects}
      selectedObjectId={selectedObjectId}
      onSelectObject={handleSelectObject}
      onDeleteObject={handleDeleteObject}
      onCreateObject={handleCreateObject}
      showGrid={showGrid}
      onToggleGrid={handleToggleGrid}
      showAxes={showAxes}
      onToggleAxes={handleToggleAxes}
      useWorkspaceObjects={useWorkspaceObjects}
      onToggleVisualizationSource={handleToggleVisualizationSource}
      onUpdateObjects={setWorkspaceObjects}
      currentTime={currentTime}
    />
  );

  const workspaceRightPanelJSX = (
    <WorkspaceRightPanel
      workspaceObjects={workspaceObjects}
      selectedObjectId={selectedObjectId}
      selectedObject={workspaceObjects.find(obj => obj.id === selectedObjectId) || null}
      onUpdateObject={handleUpdateObject}
      onDeleteObject={handleDeleteObject}
      cameraDistance={cameraDistance}
      cameraHeight={cameraHeight}
      cameraRotation={cameraRotation}
      onSetCameraDistance={setCameraDistance}
      onSetCameraHeight={setCameraHeight}
      onSetCameraRotation={setCameraRotation}
      showLetterbox={showLetterbox}
      letterboxSize={letterboxSize}
      onSetShowLetterbox={setShowLetterbox}
      onSetLetterboxSize={setLetterboxSize}
      onDuplicateObject={handleDuplicateObject}
      onDeleteSelectedObject={handleDeleteSelectedObject}
      onSelectAll={handleSelectAllObjects}
      onDeselectAll={handleDeselectAll}
      onToggleObjectVisibility={handleToggleObjectVisibility}
      canUndo={false}
      canRedo={false}
      onUndo={handleUndo}
      onRedo={handleRedo}
      presetAuthoringMode={presetAuthoringMode}
      onTogglePresetAuthoring={() => setPresetAuthoringMode(!presetAuthoringMode)}
      selectedPreset={authoringPreset}
      onSelectPreset={setAuthoringPreset}
    />
  );


  // --- Extracted panel DOM constants ---
  const leftPanelJSX = (
    <div className="flex flex-col gap-1 py-2">
      <button
        onClick={() => setActiveTab('waveforms')}
        className={`flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-all ${
          activeTab === 'waveforms'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }`}
        title="Waveforms"
      >
        <span className="text-2xl">🎵</span>
        <span className="text-xs font-medium">Waveforms</span>
      </button>
      
      <button
        onClick={() => setActiveTab('presets')}
        className={`flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-all ${
          activeTab === 'presets'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }`}
        title="Presets"
      >
        <span className="text-2xl">⏱️</span>
        <span className="text-xs font-medium">Presets</span>
      </button>
      
      <button
        onClick={() => setActiveTab('controls')}
        className={`flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-all ${
          activeTab === 'controls'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }`}
        title="Controls"
      >
        <span className="text-2xl">🎨</span>
        <span className="text-xs font-medium">Controls</span>
      </button>
      
      <button
        onClick={() => setActiveTab('camera')}
        className={`flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-all ${
          activeTab === 'camera'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }`}
        title="Camera"
      >
        <span className="text-2xl">📷</span>
        <span className="text-xs font-medium">Camera</span>
      </button>
      
      <button
        onClick={() => setActiveTab('cameraRig')}
        className={`flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-all ${
          activeTab === 'cameraRig'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }`}
        title="Camera Rig"
      >
        <span className="text-2xl">🎥</span>
        <span className="text-xs font-medium text-center">Rig</span>
      </button>
      
      <button
        onClick={() => setActiveTab('camerafx')}
        className={`flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-all ${
          activeTab === 'camerafx'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }`}
        title="Camera FX"
      >
        <span className="text-2xl">🎬</span>
        <span className="text-xs font-medium">FX</span>
      </button>
      
      <button
        onClick={() => setActiveTab('effects')}
        className={`flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-all ${
          activeTab === 'effects'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }`}
        title="Effects"
      >
        <span className="text-2xl">✨</span>
        <span className="text-xs font-medium">Effects</span>
      </button>
      
      <button
        onClick={() => setActiveTab('environments')}
        className={`flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-all ${
          activeTab === 'environments'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }`}
        title="Environments"
      >
        <span className="text-2xl">🌍</span>
        <span className="text-xs font-medium">Environ</span>
      </button>
      
      <button
        onClick={() => setActiveTab('postfx')}
        className={`flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-all ${
          activeTab === 'postfx'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }`}
        title="Post-FX"
      >
        <span className="text-2xl">🎭</span>
        <span className="text-xs font-medium">Post-FX</span>
      </button>
      
      <button
        onClick={() => setActiveTab('textAnimator')}
        className={`flex flex-col items-center gap-2 px-3 py-4 rounded-lg transition-all ${
          activeTab === 'textAnimator'
            ? 'bg-purple-600 text-white shadow-lg'
            : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
        }`}
        title="Text Animator"
      >
        <span className="text-2xl">📝</span>
        <span className="text-xs font-medium">Text</span>
      </button>
    </div>
  );

  const timelinePanelJSX = (
    <TimelineV2
      sections={sections}
      currentTime={currentTime}
      duration={duration}
      animationTypes={animationTypes}
      selectedSectionId={selectedSectionId}
      audioBuffer={audioBufferRef.current}
      showWaveform={true}
      presetKeyframes={presetKeyframes}
      textKeyframes={textKeyframes}
      environmentKeyframes={environmentKeyframes}
      presetSpeedKeyframes={presetSpeedKeyframes}
      letterboxKeyframes={letterboxKeyframes}
      textAnimatorKeyframes={textAnimatorKeyframes}
      cameraRigs={cameraRigs}
      cameraRigKeyframes={cameraRigKeyframes}
      cameraFXKeyframes={cameraFXKeyframes}
      particleEmitterKeyframes={particleEmitterKeyframes}
      parameterEvents={parameterEvents}
      workspaceObjects={workspaceObjects}
      cameraFXClips={cameraFXClips}
      selectedFXClipId={selectedFXClipId}
      isPlaying={isPlaying}
      onSelectSection={handleSelectSection}
      onUpdateSection={handleUpdateSection}
      onAddSection={handleAddSection}
      onSeek={seekTo}
      onTogglePlayPause={() => {
        if (isPlaying) {
          if (audioTracks.length > 0) stopMultiTrackAudio();
          else stopAudio();
        } else {
          if (audioTracks.length > 0) playMultiTrackAudio();
          else playAudio();
        }
      }}
      onAddPresetKeyframe={addPresetKeyframe}
      onAddTextKeyframe={addTextKeyframe}
      onAddEnvironmentKeyframe={addEnvironmentKeyframe}
      onDeletePresetKeyframe={deletePresetKeyframe}
      onDeleteTextKeyframe={deleteTextKeyframe}
      onDeleteEnvironmentKeyframe={deleteEnvironmentKeyframe}
      onUpdatePresetKeyframe={updatePresetKeyframe}
      onUpdatePresetKeyframeField={handleUpdatePresetKeyframe}
      onUpdateLetterboxKeyframe={updateLetterboxKeyframe}
      onUpdateParticleEmitterKeyframe={updateParticleEmitterKeyframe}
      onUpdateParameterEvent={updateParameterEvent}
      onUpdateTextAnimatorKeyframe={updateTextAnimatorKeyframe}
      onUpdateCameraRig={updateCameraRig}
      onUpdateCameraRigKeyframe={updateCameraRigKeyframeField}
      onUpdateTextKeyframe={updateTextKeyframe}
      onUpdateEnvironmentKeyframe={updateEnvironmentKeyframe}
      onMovePresetKeyframe={movePresetKeyframe}
      onMoveTextKeyframe={moveTextKeyframe}
      onMoveEnvironmentKeyframe={moveEnvironmentKeyframe}
      onMoveSpeedKeyframe={moveSpeedKeyframe}
      onMoveLetterboxKeyframe={moveLetterboxKeyframe}
      onMoveTextAnimatorKeyframe={moveTextAnimatorKeyframe}
      onMoveCameraRig={moveCameraRig}
      onMoveCameraRigKeyframe={moveCameraRigKeyframe}
      onMoveCameraFXKeyframe={moveCameraFXKeyframe}
      onMoveParticleEmitterKeyframe={moveParticleEmitterKeyframe}
      onMoveParameterEvent={moveParameterEvent}
      onSelectFXClip={setSelectedFXClipId}
      onUpdateCameraFXClip={updateCameraFXClip}
      onDeleteCameraFXClip={deleteCameraFXClip}
      onAddCameraFXClip={addCameraFXClip}
    />
  );

  const topBarJSX = (
    <TopBar
      onBackToDashboard={onBackToDashboard}
      handleNewProject={handleNewProject}
      handleSaveProject={handleSaveProject}
      setShowProjectsModal={setShowProjectsModal}
      setShowKeyboardShortcuts={setShowKeyboardShortcuts}
      setShowExportModal={setShowExportModal}
      setShowSettingsModal={setShowSettingsModal}
      isSaving={isSaving}
      currentTime={currentTime}
      duration={duration}
      formatTime={formatTime}
      viewMode={viewMode}
      setViewMode={setViewMode}
      workspaceMode={workspaceMode}
      setWorkspaceMode={setWorkspaceMode}
      isAutosaving={isAutosaving}
      lastAutosaveTime={lastAutosaveTime}
    />
  );

  const inspectorJSX = (
    <div className="space-y-4">
      {/* Tab-Specific Controls */}
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-2">
          <span className="text-2xl">
            {activeTab === 'waveforms' && '🎵'}
            {activeTab === 'presets' && '⏱️'}
            {activeTab === 'controls' && '🎨'}
            {activeTab === 'camera' && '📷'}
            {activeTab === 'cameraRig' && '🎥'}
            {activeTab === 'camerafx' && '🎬'}
            {activeTab === 'effects' && '✨'}
            {activeTab === 'environments' && '🌍'}
            {activeTab === 'postfx' && '🎭'}
            {activeTab === 'textAnimator' && '📝'}
          </span>
          <span>
            {activeTab === 'waveforms' && 'Waveforms'}
            {activeTab === 'presets' && 'Presets'}
            {activeTab === 'controls' && 'Controls'}
            {activeTab === 'camera' && 'Camera'}
            {activeTab === 'cameraRig' && 'Camera Rig'}
            {activeTab === 'camerafx' && 'Camera FX'}
            {activeTab === 'effects' && 'Effects'}
            {activeTab === 'environments' && 'Environments'}
            {activeTab === 'postfx' && 'Post-FX'}
            {activeTab === 'textAnimator' && 'Text Animator'}
          </span>
        </p>
        
        {activeTab === 'waveforms' && (
          <AudioTab
            audioTracks={audioTracks}
            bassGain={bassGain}
            midsGain={midsGain}
            highsGain={highsGain}
            addAudioTrack={addAudioTrack}
            removeAudioTrack={removeAudioTrack}
            setActiveTrack={setActiveTrack}
            setBassGain={setBassGain}
            setMidsGain={setMidsGain}
            setHighsGain={setHighsGain}
          />
        )}
        
        {activeTab === 'presets' && (
          <PresetsTab
            currentTime={currentTime}
            duration={duration}
            presetKeyframes={presetKeyframes}
            handleAddPresetKeyframe={handleAddPresetKeyframe}
            handleDeletePresetKeyframe={handleDeletePresetKeyframe}
            handleUpdatePresetKeyframe={handleUpdatePresetKeyframe}
            presetSpeedKeyframes={presetSpeedKeyframes}
            handleAddSpeedKeyframe={handleAddSpeedKeyframe}
            handleDeleteSpeedKeyframe={handleDeleteSpeedKeyframe}
            handleUpdateSpeedKeyframe={handleUpdateSpeedKeyframe}
            animationTypes={animationTypes}
            getCurrentPreset={getCurrentPreset}
            getCurrentPresetSpeed={getCurrentPresetSpeed}
          />
        )}
        
        {activeTab === 'controls' && (
          <ControlsTab
            // Background controls (moved from Effects tab per user request)
            skyboxType={skyboxType}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
            setSkyboxType={setSkyboxType}
            setBackgroundColor={setBackgroundColor}
            setBorderColor={setBorderColor}
            // Global colors (kept for compatibility)
            bassColor={bassColor}
            midsColor={midsColor}
            highsColor={highsColor}
            setBassColor={setBassColor}
            setMidsColor={setMidsColor}
            setHighsColor={setHighsColor}
            cubeWireframe={cubeWireframe}
            cubeOpacity={cubeOpacity}
            cubeColor={cubeColor}
            cubeMaterialType={cubeMaterialType}
            cubeMetalness={cubeMetalness}
            cubeRoughness={cubeRoughness}
            setCubeWireframe={setCubeWireframe}
            setCubeOpacity={setCubeOpacity}
            setCubeColor={setCubeColor}
            setCubeMaterialType={setCubeMaterialType}
            setCubeMetalness={setCubeMetalness}
            setCubeRoughness={setCubeRoughness}
            octahedronWireframe={octahedronWireframe}
            octahedronOpacity={octahedronOpacity}
            octahedronColor={octahedronColor}
            octahedronMaterialType={octahedronMaterialType}
            octahedronMetalness={octahedronMetalness}
            octahedronRoughness={octahedronRoughness}
            setOctahedronWireframe={setOctahedronWireframe}
            setOctahedronOpacity={setOctahedronOpacity}
            setOctahedronColor={setOctahedronColor}
            setOctahedronMaterialType={setOctahedronMaterialType}
            setOctahedronMetalness={setOctahedronMetalness}
            setOctahedronRoughness={setOctahedronRoughness}
            tetrahedronWireframe={tetrahedronWireframe}
            tetrahedronOpacity={tetrahedronOpacity}
            tetrahedronColor={tetrahedronColor}
            tetrahedronMaterialType={tetrahedronMaterialType}
            tetrahedronMetalness={tetrahedronMetalness}
            tetrahedronRoughness={tetrahedronRoughness}
            setTetrahedronWireframe={setTetrahedronWireframe}
            setTetrahedronOpacity={setTetrahedronOpacity}
            setTetrahedronColor={setTetrahedronColor}
            setTetrahedronMaterialType={setTetrahedronMaterialType}
            setTetrahedronMetalness={setTetrahedronMetalness}
            setTetrahedronRoughness={setTetrahedronRoughness}
            sphereWireframe={sphereWireframe}
            sphereOpacity={sphereOpacity}
            sphereColor={sphereColor}
            sphereMaterialType={sphereMaterialType}
            sphereMetalness={sphereMetalness}
            sphereRoughness={sphereRoughness}
            setSphereWireframe={setSphereWireframe}
            setSphereOpacity={setSphereOpacity}
            setSphereColor={setSphereColor}
            setSphereMaterialType={setSphereMaterialType}
            setSphereMetalness={setSphereMetalness}
            setSphereRoughness={setSphereRoughness}
            planeWireframe={planeWireframe}
            planeOpacity={planeOpacity}
            planeColor={planeColor}
            planeMaterialType={planeMaterialType}
            planeMetalness={planeMetalness}
            planeRoughness={planeRoughness}
            setPlaneWireframe={setPlaneWireframe}
            setPlaneOpacity={setPlaneOpacity}
            setPlaneColor={setPlaneColor}
            setPlaneMaterialType={setPlaneMaterialType}
            setPlaneMetalness={setPlaneMetalness}
            setPlaneRoughness={setPlaneRoughness}
            torusWireframe={torusWireframe}
            torusOpacity={torusOpacity}
            torusColor={torusColor}
            torusMaterialType={torusMaterialType}
            torusMetalness={torusMetalness}
            torusRoughness={torusRoughness}
            setTorusWireframe={setTorusWireframe}
            setTorusOpacity={setTorusOpacity}
            setTorusColor={setTorusColor}
            setTorusMaterialType={setTorusMaterialType}
            setTorusMetalness={setTorusMetalness}
            setTorusRoughness={setTorusRoughness}
          />
        )}
        
        {activeTab === 'camera' && (
          <CameraTab
            cameraDistance={cameraDistance}
            cameraHeight={cameraHeight}
            cameraRotation={cameraRotation}
            cameraAutoRotate={cameraAutoRotate}
            setCameraDistance={setCameraDistance}
            setCameraHeight={setCameraHeight}
            setCameraRotation={setCameraRotation}
            setCameraAutoRotate={setCameraAutoRotate}
            showFilename={showFilename}
            borderColor={borderColor}
            setShowFilename={setShowFilename}
            setBorderColor={setBorderColor}
            showLetterbox={showLetterbox}
            letterboxSize={letterboxSize}
            setShowLetterbox={setShowLetterbox}
            setLetterboxSize={setLetterboxSize}
          />
        )}
        
        {activeTab === 'cameraRig' && (
          <CameraRigTab
            currentTime={currentTime}
            cameraRigs={cameraRigs}
            selectedRigId={selectedRigId}
            setSelectedRigId={setSelectedRigId}
            setCameraRigs={setCameraRigs}
            cameraRigKeyframes={cameraRigKeyframes}
            setCameraRigKeyframes={setCameraRigKeyframes}
            createCameraRigKeyframe={createCameraRigKeyframe}
            // Issue #5: Advanced Camera Rig Controls
            showPaths={showPaths}
            setShowPaths={setShowPaths}
            showKeyframeMarkers={showKeyframeMarkers}
            setShowKeyframeMarkers={setShowKeyframeMarkers}
            enableSmoothTransitions={enableSmoothTransitions}
            setEnableSmoothTransitions={setEnableSmoothTransitions}
            rigTransitionDuration={rigTransitionDuration}
            setRigTransitionDuration={setRigTransitionDuration}
            rigTransitionEasing={rigTransitionEasing}
            setRigTransitionEasing={setRigTransitionEasing}
            lookAtOffsetX={lookAtOffsetX}
            setLookAtOffsetX={setLookAtOffsetX}
            lookAtOffsetY={lookAtOffsetY}
            setLookAtOffsetY={setLookAtOffsetY}
            enableFramingLock={enableFramingLock}
            setEnableFramingLock={setEnableFramingLock}
            ruleOfThirdsBias={ruleOfThirdsBias}
            setRuleOfThirdsBias={setRuleOfThirdsBias}
            shakeIntensity={shakeIntensity}
            setShakeIntensity={setShakeIntensity}
            shakeFrequency={shakeFrequency}
            setShakeFrequency={setShakeFrequency}
            handheldDriftIntensity={handheldDriftIntensity}
            setHandheldDriftIntensity={setHandheldDriftIntensity}
            fovRamping={fovRamping}
            setFovRamping={setFovRamping}
          />
        )}
        
        {activeTab === 'camerafx' && (
          <CameraFXTab
            currentTime={currentTime}
            duration={duration}
            cameraFXClips={cameraFXClips}
            selectedFXClipId={selectedFXClipId}
            setSelectedFXClipId={setSelectedFXClipId}
            addCameraFXClip={addCameraFXClip}
            updateCameraFXClip={updateCameraFXClip}
            deleteCameraFXClip={deleteCameraFXClip}
            cameraFXKeyframes={cameraFXKeyframes}
            addCameraFXKeyframe={addCameraFXKeyframe}
            updateCameraFXKeyframe={updateCameraFXKeyframe}
            deleteCameraFXKeyframe={deleteCameraFXKeyframe}
            cameraFXAudioModulations={cameraFXAudioModulations}
            addCameraFXAudioModulation={addCameraFXAudioModulation}
            updateCameraFXAudioModulation={updateCameraFXAudioModulation}
            deleteCameraFXAudioModulation={deleteCameraFXAudioModulation}
            // Issue #4: Parameter Events
            parameterEvents={parameterEvents}
            audioTracks={audioTracks}
            addParameterEvent={addParameterEvent}
            updateParameterEvent={updateParameterEvent}
            deleteParameterEvent={deleteParameterEvent}
          />
        )}
        
        {activeTab === 'effects' && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-cyan-400 mb-2">✨ Visual Effects</h3>
            <p className="text-xs text-gray-400 mb-3">
              Background controls have been moved to the <span className="text-cyan-400 font-semibold">Controls</span> tab.
            </p>
            <p className="text-xs text-gray-500 italic">
              This tab is reserved for future visual effect features like fog, bloom, particles, and other scene effects.
            </p>
          </div>
        )}
        
        {activeTab === 'environments' && (
          <EnvironmentsTab
            currentTime={currentTime}
            environmentKeyframes={environmentKeyframes}
            handleAddEnvironmentKeyframe={handleAddEnvironmentKeyframe}
            handleDeleteEnvironmentKeyframe={handleDeleteEnvironmentKeyframe}
            handleUpdateEnvironmentKeyframe={handleUpdateEnvironmentKeyframe}
            particleEmitterKeyframes={particleEmitterKeyframes}
            addParticleEmitterKeyframe={addParticleEmitterKeyframe}
            deleteParticleEmitterKeyframe={deleteParticleEmitterKeyframe}
            updateParticleEmitterKeyframe={updateParticleEmitterKeyframe}
            particleEmissionRate={particleEmissionRate}
            particleLifetime={particleLifetime}
            particleMaxCount={particleMaxCount}
            particleSpawnX={particleSpawnX}
            particleSpawnY={particleSpawnY}
            particleSpawnZ={particleSpawnZ}
            particleSpawnRadius={particleSpawnRadius}
            particleStartColor={particleStartColor}
            particleEndColor={particleEndColor}
            particleStartSize={particleStartSize}
            particleEndSize={particleEndSize}
            particleShape={particleShape}
            particleAudioTrack={particleAudioTrack}
            particleAudioAffects={particleAudioAffects}
            setParticleEmissionRate={setParticleEmissionRate}
            setParticleLifetime={setParticleLifetime}
            setParticleMaxCount={setParticleMaxCount}
            setParticleSpawnX={setParticleSpawnX}
            setParticleSpawnY={setParticleSpawnY}
            setParticleSpawnZ={setParticleSpawnZ}
            setParticleSpawnRadius={setParticleSpawnRadius}
            setParticleStartColor={setParticleStartColor}
            setParticleEndColor={setParticleEndColor}
            setParticleStartSize={setParticleStartSize}
            setParticleEndSize={setParticleEndSize}
            setParticleShape={setParticleShape}
            setParticleAudioTrack={setParticleAudioTrack}
            setParticleAudioAffects={setParticleAudioAffects}
          />
        )}
        
        {activeTab === 'postfx' && (
          <PostFXTab
            blendMode={blendMode}
            vignetteStrength={vignetteStrength}
            vignetteSoftness={vignetteSoftness}
            colorSaturation={colorSaturation}
            colorContrast={colorContrast}
            colorGamma={colorGamma}
            colorTintR={colorTintR}
            colorTintG={colorTintG}
            colorTintB={colorTintB}
            setBlendMode={setBlendMode}
            setVignetteStrength={setVignetteStrength}
            setVignetteSoftness={setVignetteSoftness}
            setColorSaturation={setColorSaturation}
            setColorContrast={setColorContrast}
            setColorGamma={setColorGamma}
            setColorTintR={setColorTintR}
            setColorTintG={setColorTintG}
            setColorTintB={setColorTintB}
          />
        )}
        
        {activeTab === 'textAnimator' && (
          <div className="space-y-3">
            <div className="bg-gray-700 rounded p-3 space-y-3">
              <h4 className="text-xs text-gray-400 uppercase font-semibold">3D Text Settings</h4>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showSongName"
                  checked={showSongName}
                  onChange={(e) => setShowSongName(e.target.checked)}
                  disabled={!fontLoaded}
                  className="w-4 h-4 cursor-pointer"
                />
                <label 
                  htmlFor="showSongName" 
                  className={fontLoaded ? 'text-sm cursor-pointer text-white' : 'text-sm cursor-pointer text-gray-500'}
                >
                  Show 3D Text
                </label>
              </div>
              
              {!fontLoaded && (
                <p className="text-xs text-yellow-400">Loading font...</p>
              )}
              
              {fontLoaded && (
                <>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Custom Text</label>
                    <input
                      type="text"
                      value={customSongName}
                      onChange={(e) => setCustomSongName(e.target.value)}
                      placeholder="Enter text"
                      className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Text Color</label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-full h-10 rounded cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      Opacity: {textOpacity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={textOpacity}
                      onChange={(e) => setTextOpacity(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
            
            {/* Text Animator Keyframes Section */}
            <div className="bg-gray-700 rounded p-3 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs text-gray-400 uppercase font-semibold">📝 Text Animator Keyframes</h4>
                <button
                  onClick={() => {
                    createTextAnimatorKeyframe(currentTime);
                    addLog(`Created text animator keyframe at ${formatTime(currentTime)}`, 'success');
                  }}
                  disabled={!fontLoaded}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs flex items-center gap-1"
                >
                  <span>➕</span> Add Keyframe
                </button>
              </div>
              
              {!fontLoaded && (
                <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded p-2">
                  <p className="text-yellow-400 text-xs">⚠️ Font not loaded. Upload a font to use text animator.</p>
                </div>
              )}
              
              {textAnimatorKeyframes.length === 0 && fontLoaded && (
                <div className="text-center text-gray-500 py-4 text-xs">
                  No text keyframes yet. Click "Add Keyframe" to create one.
                </div>
              )}
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {textAnimatorKeyframes.map(kf => (
                  <div key={kf.id} className="bg-gray-800 rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-400 font-mono text-xs">{formatTime(kf.time)}</span>
                      <button
                        onClick={() => deleteTextAnimatorKeyframe(kf.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Text</label>
                      <input
                        type="text"
                        value={kf.text}
                        onChange={(e) => updateTextAnimatorKeyframe(kf.id, { text: e.target.value })}
                        className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded"
                      />
                    </div>
                    
                    {/* Position Controls */}
                    <div className="bg-gray-700 rounded p-2">
                      <label className="text-xs text-gray-400 block mb-1 font-semibold">Position</label>
                      <div className="grid grid-cols-3 gap-1">
                        <div>
                          <label className="text-xs text-gray-500">X</label>
                          <input
                            type="number"
                            step="0.5"
                            value={kf.position?.x ?? 0}
                            onChange={(e) => updateTextAnimatorKeyframe(kf.id, {
                              position: {
                                x: parseFloat(e.target.value) || 0,
                                y: kf.position?.y ?? 5,
                                z: kf.position?.z ?? 0
                              }
                            })}
                            className="w-full bg-gray-600 text-white text-xs px-1 py-0.5 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Y</label>
                          <input
                            type="number"
                            step="0.5"
                            value={kf.position?.y ?? 5}
                            onChange={(e) => updateTextAnimatorKeyframe(kf.id, {
                              position: {
                                x: kf.position?.x ?? 0,
                                y: parseFloat(e.target.value) || 5,
                                z: kf.position?.z ?? 0
                              }
                            })}
                            className="w-full bg-gray-600 text-white text-xs px-1 py-0.5 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Z</label>
                          <input
                            type="number"
                            step="0.5"
                            value={kf.position?.z ?? 0}
                            onChange={(e) => updateTextAnimatorKeyframe(kf.id, {
                              position: {
                                x: kf.position?.x ?? 0,
                                y: kf.position?.y ?? 5,
                                z: parseFloat(e.target.value) || 0
                              }
                            })}
                            className="w-full bg-gray-600 text-white text-xs px-1 py-0.5 rounded"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">
                          Size: {(kf.size ?? 1).toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="3"
                          step="0.1"
                          value={kf.size ?? 1}
                          onChange={(e) => updateTextAnimatorKeyframe(kf.id, { size: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Color</label>
                        <input
                          type="color"
                          value={kf.color ?? '#00ffff'}
                          onChange={(e) => updateTextAnimatorKeyframe(kf.id, { color: e.target.value })}
                          className="w-full h-6 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Visible</label>
                      <input
                        type="checkbox"
                        checked={kf.visible}
                        onChange={(e) => updateTextAnimatorKeyframe(kf.id, { visible: e.target.checked })}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-gray-500 italic">
              Note: Text keyframes are managed in the timeline
            </p>
          </div>
        )}
      </div>
    </div>
  );
  // --- End constants ---

  // Use custom workspace layout when in workspace mode
  if (workspaceMode) {
    return (
      <>
        {topBarJSX}
        {workspaceContentJSX}
        
        {/* Export Modal */}
        <VideoExportModal
          showExportModal={showExportModal}
          setShowExportModal={setShowExportModal}
          exportResolution={exportResolution}
          setExportResolution={setExportResolution}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          isExporting={isExporting}
          audioReady={audioReady}
          exportProgress={exportProgress}
          handleExportAndCloseModal={handleExportAndCloseModal}
        />

        {/* Other modals remain the same */}
        {showKeyboardShortcuts && <KeyboardShortcutsHelp onClose={() => setShowKeyboardShortcuts(false)} />}
        {showSettingsModal && <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />}
        {showProjectsModal && (
          <ProjectsModal
            isOpen={showProjectsModal}
            onClose={() => setShowProjectsModal(false)}
            onSaveProject={handleSaveProject}
            onLoadProject={handleLoadProject}
            isSaving={isSaving}
          />
        )}
        {showDebugConsole && debugLogs.length > 0 && (
          <DebugConsole logs={debugLogs} onClose={() => setShowDebugConsole(false)} />
        )}
      </>
    );
  }

  // Default editor mode layout
  return (
    <LayoutShell
      left={leftPanelJSX}
      inspector={inspectorJSX}
      timeline={timelinePanelJSX}
      top={topBarJSX}
      viewMode={viewMode}
      workspaceMode={workspaceMode}
    >
      {canvasAreaJSX}

      {/* Export Modal */}
      <VideoExportModal
        showExportModal={showExportModal}
        setShowExportModal={setShowExportModal}
        exportResolution={exportResolution}
        setExportResolution={setExportResolution}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        isExporting={isExporting}
        audioReady={audioReady}
        exportProgress={exportProgress}
        handleExportAndCloseModal={handleExportAndCloseModal}
      />

      {/* PHASE 4: Parameter Event Edit Modal */}
      {showEventModal && editingEventId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowEventModal(false)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-purple-400">⚡ Edit Event</h2>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {(() => {
              const event = parameterEvents.find(e => e.id === editingEventId);
              if (!event) return null;
              
              return (
                <div className="space-y-4">
                  {/* Mode Selection */}
                  <div>
                    <label className="text-sm text-gray-300 block mb-2">Event Mode</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateParameterEvent(editingEventId, { mode: 'manual' })}
                        className={`flex-1 px-3 py-2 rounded ${event.mode === 'manual' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                      >
                        ⏱️ Manual (Fixed Time)
                      </button>
                      <button
                        onClick={() => updateParameterEvent(editingEventId, { mode: 'automated' })}
                        className={`flex-1 px-3 py-2 rounded ${event.mode === 'automated' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                      >
                        🤖 Automated (Reactive)
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {event.mode === 'manual' ? 'Triggers at a specific time' : 'Triggers when audio track hits threshold'}
                    </p>
                  </div>

                  {/* Start Time and End Time (only for manual mode) */}
                  {event.mode === 'manual' && (
                    <>
                      <div>
                        <label className="text-sm text-gray-300 block mb-2">Start Time (MM:SS)</label>
                        <input
                          type="text" id="start-time-mm-ss" name="start-time-mm-ss"
                          pattern="[0-9]+:[0-9]{2}"
                          value={formatTimeInput(event.startTime)}
                          onChange={(e) => {
                            const newTime = parseTimeInput(e.target.value);
                            if (!isNaN(newTime) && newTime >= 0 && newTime <= duration) {
                              updateParameterEvent(editingEventId, { startTime: newTime });
                            }
                          }}
                          placeholder="0:00"
                          className="w-full px-3 py-2 bg-gray-700 rounded text-white font-mono"
                        />
                        <p className="text-xs text-gray-400 mt-1">When the event starts</p>
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-300 block mb-2">End Time (MM:SS)</label>
                        <input
                          type="text" id="end-time-mm-ss" name="end-time-mm-ss"
                          pattern="[0-9]+:[0-9]{2}"
                          value={formatTimeInput(event.endTime)}
                          onChange={(e) => {
                            const newTime = parseTimeInput(e.target.value);
                            if (!isNaN(newTime) && newTime >= event.startTime && newTime <= duration) {
                              updateParameterEvent(editingEventId, { endTime: newTime });
                            }
                          }}
                          placeholder="0:00"
                          className="w-full px-3 py-2 bg-gray-700 rounded text-white font-mono"
                        />
                        <p className="text-xs text-gray-400 mt-1">When the event ends (must be after start time)</p>
                      </div>
                    </>
                  )}

                  {/* Audio Track Selection (for automated mode) */}
                  {event.mode === 'automated' && (
                    <>
                      <div>
                        <label className="text-sm text-gray-300 block mb-2">React to Audio Track</label>
                        <select
                          value={event.audioTrackId || ''}
                          onChange={(e) => updateParameterEvent(editingEventId, { audioTrackId: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                        >
                          <option value="">Select a track...</option>
                          {audioTracks.map(track => (
                            <option key={track.id} value={track.id}>{track.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-sm text-gray-300 block mb-2">Frequency Threshold</label>
                        <input
                          type="range" id="frequency-threshold" name="frequency-threshold"
                          min="0"
                          max="1"
                          step="0.05"
                          value={event.threshold || 0.5}
                          onChange={(e) => updateParameterEvent(editingEventId, { threshold: parseFloat(e.target.value) })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{Math.round((event.threshold || 0.5) * 100)}% - Triggers when bass frequency exceeds this level</span>
                      </div>
                    </>
                  )}

                  {/* Duration for automated mode */}
                  {event.mode === 'automated' && (
                    <div>
                      <label className="text-sm text-gray-300 block mb-2">Effect Duration (seconds)</label>
                      <input
                        type="range" id="effect-duration-seconds" name="effect-duration-seconds"
                        min="0.05"
                        max="2"
                        step="0.05"
                        value={event.endTime - event.startTime}
                        onChange={(e) => {
                          const duration = parseFloat(e.target.value);
                          updateParameterEvent(editingEventId, { endTime: event.startTime + duration });
                        }}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-400">{(event.endTime - event.startTime).toFixed(2)}s (how long the effect lasts after triggering)</span>
                    </div>
                  )}

                  {/* Background Flash */}
                  <div>
                    <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                      <input
                        type="checkbox" id="checkbox-field-4753" name="checkbox-field-4753"
                        checked={(event.parameters.backgroundFlash ?? 0) > 0}
                        onChange={(e) => updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, backgroundFlash: e.target.checked ? 0.5 : 0 }
                        })}
                      />
                      ⚪ Background Flash
                    </label>
                    {(event.parameters.backgroundFlash ?? 0) > 0 && (
                      <div>
                        <input
                          type="range" id="range-field-4764" name="range-field-4764"
                          min="0"
                          max="1"
                          step="0.05"
                          value={event.parameters.backgroundFlash ?? 0}
                          onChange={(e) => updateParameterEvent(editingEventId, {
                            parameters: { ...event.parameters, backgroundFlash: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{Math.round((event.parameters.backgroundFlash ?? 0) * 100)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Camera Shake (Automated) */}
                  <div>
                    <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                      <input
                        type="checkbox" id="shake-checkbox-4783" name="shake-checkbox-4783"
                        checked={(event.parameters.cameraShake ?? 0) > 0}
                        onChange={(e) => updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, cameraShake: e.target.checked ? 0.5 : 0 }
                        })}
                      />
                      📷 Camera Shake (Automated)
                    </label>
                    {(event.parameters.cameraShake ?? 0) > 0 && (
                      <div>
                        <input
                          type="range" id="shake-range-4794" name="shake-range-4794"
                          min="0"
                          max="1"
                          step="0.05"
                          value={event.parameters.cameraShake ?? 0}
                          onChange={(e) => updateParameterEvent(editingEventId, {
                            parameters: { ...event.parameters, cameraShake: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{Math.round((event.parameters.cameraShake ?? 0) * 100)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Vignette Pulse */}
                  <div>
                    <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                      <input
                        type="checkbox" id="checkbox-field-4813" name="checkbox-field-4813"
                        checked={(event.parameters.vignettePulse ?? 0) > 0}
                        onChange={(e) => updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, vignettePulse: e.target.checked ? 0.5 : 0 }
                        })}
                      />
                      🌑 Vignette Pulse
                    </label>
                    {(event.parameters.vignettePulse ?? 0) > 0 && (
                      <div>
                        <input
                          type="range" id="range-field-4824" name="range-field-4824"
                          min="0"
                          max="1"
                          step="0.05"
                          value={event.parameters.vignettePulse ?? 0}
                          onChange={(e) => updateParameterEvent(editingEventId, {
                            parameters: { ...event.parameters, vignettePulse: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{Math.round((event.parameters.vignettePulse ?? 0) * 100)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Saturation Burst */}
                  <div>
                    <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                      <input
                        type="checkbox" id="checkbox-field-4843" name="checkbox-field-4843"
                        checked={(event.parameters.saturationBurst ?? 0) > 0}
                        onChange={(e) => updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, saturationBurst: e.target.checked ? 0.5 : 0 }
                        })}
                      />
                      🎨 Saturation Burst
                    </label>
                    {(event.parameters.saturationBurst ?? 0) > 0 && (
                      <div>
                        <input
                          type="range" id="range-field-4854" name="range-field-4854"
                          min="0"
                          max="1"
                          step="0.05"
                          value={event.parameters.saturationBurst ?? 0}
                          onChange={(e) => updateParameterEvent(editingEventId, {
                            parameters: { ...event.parameters, saturationBurst: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{Math.round((event.parameters.saturationBurst ?? 0) * 100)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Vignette Strength Pulse */}
                  <div>
                    <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                      <input
                        type="checkbox" id="checkbox-field-4873" name="checkbox-field-4873"
                        checked={(event.parameters.vignetteStrengthPulse ?? 0) > 0}
                        onChange={(e) => updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, vignetteStrengthPulse: e.target.checked ? 0.5 : 0 }
                        })}
                      />
                      🌫️ Vignette Pulse
                    </label>
                    {(event.parameters.vignetteStrengthPulse ?? 0) > 0 && (
                      <div>
                        <input
                          type="range" id="range-field-4884" name="range-field-4884"
                          min="0"
                          max="1"
                          step="0.05"
                          value={event.parameters.vignetteStrengthPulse ?? 0}
                          onChange={(e) => updateParameterEvent(editingEventId, {
                            parameters: { ...event.parameters, vignetteStrengthPulse: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{Math.round((event.parameters.vignetteStrengthPulse ?? 0) * 100)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Contrast Burst */}
                  <div>
                    <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                      <input
                        type="checkbox" id="checkbox-field-4903" name="checkbox-field-4903"
                        checked={(event.parameters.contrastBurst ?? 0) > 0}
                        onChange={(e) => updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, contrastBurst: e.target.checked ? 0.5 : 0 }
                        })}
                      />
                      🔆 Contrast Burst
                    </label>
                    {(event.parameters.contrastBurst ?? 0) > 0 && (
                      <div>
                        <input
                          type="range" id="range-field-4914" name="range-field-4914"
                          min="0"
                          max="1"
                          step="0.05"
                          value={event.parameters.contrastBurst ?? 0}
                          onChange={(e) => updateParameterEvent(editingEventId, {
                            parameters: { ...event.parameters, contrastBurst: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-400">{Math.round((event.parameters.contrastBurst ?? 0) * 100)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Color Tint Flash */}
                  <div>
                    <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
                      <input
                        type="checkbox" id="checkbox-field-4933" name="checkbox-field-4933"
                        checked={(event.parameters.colorTintFlash?.intensity ?? 0) > 0}
                        onChange={(e) => updateParameterEvent(editingEventId, {
                          parameters: { ...event.parameters, colorTintFlash: e.target.checked ? { r: 1, g: 0, b: 0, intensity: 0.5 } : undefined }
                        })}
                      />
                      🌈 Color Tint Flash
                    </label>
                    {(event.parameters.colorTintFlash?.intensity ?? 0) > 0 && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-red-400 block mb-1">R</label>
                            <input
                              type="range" id="r" name="r"
                              min="0"
                              max="2"
                              step="0.1"
                              value={event.parameters.colorTintFlash?.r ?? 1}
                              onChange={(e) => updateParameterEvent(editingEventId, {
                                parameters: { ...event.parameters, colorTintFlash: { ...event.parameters.colorTintFlash!, r: parseFloat(e.target.value) } }
                              })}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-green-400 block mb-1">G</label>
                            <input
                              type="range" id="g" name="g"
                              min="0"
                              max="2"
                              step="0.1"
                              value={event.parameters.colorTintFlash?.g ?? 0}
                              onChange={(e) => updateParameterEvent(editingEventId, {
                                parameters: { ...event.parameters, colorTintFlash: { ...event.parameters.colorTintFlash!, g: parseFloat(e.target.value) } }
                              })}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-blue-400 block mb-1">B</label>
                            <input
                              type="range" id="b" name="b"
                              min="0"
                              max="2"
                              step="0.1"
                              value={event.parameters.colorTintFlash?.b ?? 0}
                              onChange={(e) => updateParameterEvent(editingEventId, {
                                parameters: { ...event.parameters, colorTintFlash: { ...event.parameters.colorTintFlash!, b: parseFloat(e.target.value) } }
                              })}
                              className="w-full"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Intensity</label>
                          <input
                            type="range" id="intensity" name="intensity"
                            min="0"
                            max="1"
                            step="0.05"
                            value={event.parameters.colorTintFlash?.intensity ?? 0.5}
                            onChange={(e) => updateParameterEvent(editingEventId, {
                              parameters: { ...event.parameters, colorTintFlash: { ...event.parameters.colorTintFlash!, intensity: parseFloat(e.target.value) } }
                            })}
                            className="w-full"
                          />
                          <span className="text-xs text-gray-400">{Math.round((event.parameters.colorTintFlash?.intensity ?? 0) * 100)}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteParameterEvent(editingEventId)}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Delete Event
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={() => setShowKeyboardShortcuts(false)}>
          <div className="bg-gray-900 rounded-lg w-[500px] max-h-[70vh] overflow-hidden border border-gray-700 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
              <h2 className="text-xl font-bold text-white">⌨️ Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowKeyboardShortcuts(false)}
                className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                title="Close (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(70vh-140px)]">
              <div className="space-y-6">
                {/* Playback */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Playback</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Play/Pause audio</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">Space</kbd>
                    </div>
                  </div>
                </div>

                {/* View Mode */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">View Mode</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Editor mode</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">Ctrl+E</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Preview mode</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">Ctrl+Shift+P</kbd>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Tab Navigation</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Waveforms</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">1</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Presets</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">2</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Controls</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">3</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Camera Settings</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">4</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Camera Rig</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">5</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Camera FX</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">6</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Effects</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">7</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Environments</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">8</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Post-FX</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">9</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Text Animator</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">0</kbd>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Controls</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Close modals/dialogs</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">Esc</kbd>
                    </div>
                  </div>
                </div>

                {/* Debug */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Debug</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Toggle debug console</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">`</kbd>
                    </div>
                  </div>
                </div>

                {/* Camera */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Camera</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Toggle camera rig hints</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">G</kbd>
                    </div>
                  </div>
                </div>

                {/* Mouse Controls */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Mouse Controls (When Paused)</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Rotate camera around scene</span>
                      <span className="text-xs text-gray-500">Left drag</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Pan camera</span>
                      <span className="text-xs text-gray-500">Right drag</span>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Zoom in/out</span>
                      <span className="text-xs text-gray-500">Mouse wheel</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic">Mouse controls disable during playback</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <p className="text-sm text-gray-400 text-center">
                Press <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded">Esc</kbd> to close
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Projects Modal - Save/Load */}
      {showProjectsModal && (
        <ProjectsModal
          onClose={() => setShowProjectsModal(false)}
          onLoadProject={handleLoadProject}
          currentProjectId={currentProjectId}
        />
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <NewProjectModal
          onCreateProject={handleCreateNewProject}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Debug Console Modal - Toggled with ` key */}
      <DebugConsole 
        logs={errorLog} 
        isOpen={showDebugConsole} 
        onToggle={() => setShowDebugConsole(prev => !prev)} 
      />

      {/* Performance Overlay - PR 9: Guardrails - Toggle with P key */}
      {perfMonitorRef.current && (
        <PerformanceOverlay
          visible={showPerformanceOverlay}
          metrics={perfMonitorRef.current.getCurrentMetrics()}
          averages={perfMonitorRef.current.getAverageMetrics()}
          warnings={perfMonitorRef.current.getRecentWarnings()}
        />
      )}
    </LayoutShell>
  );
}