import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { Trash2, Plus, Play, Square, Video, X, BadgeHelp, ChevronDown } from 'lucide-react';
import { 
  LogEntry, 
  AudioTrack, 
  ParameterEvent,
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
  interpolateCameraKeyframes,
  animationTypes,
  generateWaveformData
} from './components/VisualizerSoftware/utils';
import { PostFXShader } from './components/VisualizerSoftware/shaders/PostFXShader';
import { VideoExportModal } from './components/VisualizerSoftware/components';

export default function ThreeDVisualizer() {
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
  const songNameMeshesRef = useRef<THREE.Mesh[]>([]);
  const fontRef = useRef<any>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [errorLog, setErrorLog] = useState<LogEntry[]>([]);
  const [customFontName, setCustomFontName] = useState('Helvetiker (Default)');
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE);
  const [cameraHeight, setCameraHeight] = useState(DEFAULT_CAMERA_HEIGHT);
  const [cameraRotation, setCameraRotation] = useState(DEFAULT_CAMERA_ROTATION);
  
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
  
  // NEW: Tab state
  const [activeTab, setActiveTab] = useState('waveforms'); // PHASE 4: Start with waveforms tab
  
  // Tab order for keyboard navigation (matches the order of tab buttons in the UI)
  const TAB_ORDER = ['waveforms', 'controls', 'camera', 'keyframes', 'effects', 'postfx', 'presets', 'textAnimator', 'masks', 'cameraRig'] as const;
  
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
  
  // PHASE 4: Active parameter effect values (stored in refs for performance)
  const activeBackgroundFlashRef = useRef(0);
  const activeVignettePulseRef = useRef(0);
  const activeSaturationBurstRef = useRef(0);
  
  // PHASE 4 (Enhanced): Active Post-FX parameter values
  const activeVignetteStrengthPulseRef = useRef(0);
  const activeContrastBurstRef = useRef(0);
  const activeColorTintFlashRef = useRef({ r: 0, g: 0, b: 0 });
  
  // PHASE 4: Track active automated events
  const activeAutomatedEventsRef = useRef<Map<string, number>>(new Map()); // eventId -> startTime
  
  // NEW: Global camera keyframes (independent from presets)
  const [cameraKeyframes, setCameraKeyframes] = useState([
    { time: 0, distance: 15, height: 0, rotation: 0, easing: 'linear' },
    { time: 20, distance: 15, height: 0, rotation: 0, easing: 'linear' },
    { time: 40, distance: 15, height: 0, rotation: 0, easing: 'linear' }
  ]);
  
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
  
  // Legacy sections system (kept for backward compatibility with existing code)
  const [sections, setSections] = useState([
    { id: 1, start: 0, end: 20, animation: 'orbit' },
    { id: 2, start: 20, end: 40, animation: 'explosion' },
    { id: 3, start: 40, end: 60, animation: 'chill' }
  ]);
  // Start with null to prevent canvas disappearing on first preset
  // (Previously initialized to 'orbit' which caused incorrect blend resets if first preset wasn't orbital)
  const prevAnimRef = useRef<string | null>(null);
  const transitionRef = useRef(FULL_OPACITY);
  
  // FPS tracking
  const [fps, setFps] = useState<number>(0);
  const fpsFrameCount = useRef(0);
  const fpsLastTime = useRef(0);
  
  // Waveform state
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastWaveformRenderRef = useRef<number>(0);
  const waveformAnimationFrameRef = useRef<number | null>(null);

  // PHASE 5: Text Animator state
  const [textAnimatorKeyframes, setTextAnimatorKeyframes] = useState<any[]>([]);
  const [selectedTextKeyframeId, setSelectedTextKeyframeId] = useState<string | null>(null);
  const textCharacterMeshesRef = useRef<Map<string, THREE.Mesh[]>>(new Map()); // keyframeId -> character meshes
  
  // PHASE 5: Mask Reveals state
  const [masks, setMasks] = useState<any[]>([]);
  const [maskRevealKeyframes, setMaskRevealKeyframes] = useState<any[]>([]);
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const maskMaterialsRef = useRef<Map<string, THREE.Material>>(new Map()); // Store mask materials
  
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
  
  // Framing Controls
  const [lookAtOffsetX, setLookAtOffsetX] = useState(0); // -10 to 10
  const [lookAtOffsetY, setLookAtOffsetY] = useState(0); // -10 to 10
  const [enableFramingLock, setEnableFramingLock] = useState(false);
  const [enableRuleOfThirds, setEnableRuleOfThirds] = useState(false);
  
  // Camera FX Layer
  const [cameraShakeIntensity, setCameraShakeIntensity] = useState(1.0); // multiplier for existing shake
  const [cameraShakeFrequency, setCameraShakeFrequency] = useState(50); // Hz
  const [enableHandheldDrift, setEnableHandheldDrift] = useState(false);
  const [handheldDriftIntensity, setHandheldDriftIntensity] = useState(0.2);
  const [enableFovRamping, setEnableFovRamping] = useState(false);
  const [fovRampAmount, setFovRampAmount] = useState(5); // degrees
  
  // Shot Presets
  const [selectedShotPreset, setSelectedShotPreset] = useState<string | null>(null);
  
  // PHASE 5: UI state for Phase 5 features
  const [showTextAnimatorPanel, setShowTextAnimatorPanel] = useState(false);
  const [showMaskPanel, setShowMaskPanel] = useState(false);
  const [showCameraRigPanel, setShowCameraRigPanel] = useState(false);

  // Memoized sorted letterbox keyframes for performance
  const sortedLetterboxKeyframes = useMemo(() => {
    return [...letterboxKeyframes].sort((a, b) => a.time - b.time);
  }, [letterboxKeyframes]);

  const addLog = (message: string, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setErrorLog(prev => [...prev, { message, type, timestamp }].slice(-10));
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
            let color;
            if (freqIndex === 0) color = bassColor;
            else if (freqIndex === 1) color = midsColor;
            else color = highsColor;
            
            const material = new THREE.MeshBasicMaterial({
              color: new THREE.Color(color),
              wireframe: false,
              transparent: true,
              opacity: 0.9
            });
            
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
  
  // Get current preset speed multiplier
  const getCurrentPresetSpeed = () => {
    const sorted = [...presetKeyframes].sort((a, b) => a.time - b.time);
    for (let i = 0; i < sorted.length; i++) {
      if (currentTime >= sorted[i].time && currentTime < sorted[i].endTime) {
        return sorted[i].speed || 1.0;
      }
    }
    if (currentTime < sorted[0]?.time) {
      return sorted[0]?.speed || 1.0;
    }
    return sorted[sorted.length - 1]?.speed || 1.0;
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
        // Ensure endTime is always after time
        if (field === 'time' && updated.endTime <= value) {
          updated.endTime = value + 1;
        }
        if (field === 'endTime' && value <= updated.time) {
          updated.endTime = updated.time + 1;
        }
        return updated;
      }
      return kf;
    }).sort((a, b) => a.time - b.time)); // Re-sort after time update
  };

  const resetCamera = () => {
    setCameraDistance(DEFAULT_CAMERA_DISTANCE);
    setCameraHeight(DEFAULT_CAMERA_HEIGHT);
    // Rotation is now keyframe-only, don't reset it here
  };

  // Global keyframe management functions
  const addKeyframe = () => {
    const lastKeyframe = cameraKeyframes[cameraKeyframes.length - 1] || {
      time: 0,
      distance: DEFAULT_CAMERA_DISTANCE,
      height: DEFAULT_CAMERA_HEIGHT,
      rotation: DEFAULT_CAMERA_ROTATION,
      easing: 'linear'
    };
    
    // Find the largest gap between keyframes and place new keyframe there
    let newTime = duration > 0 ? duration / 2 : 30;
    
    if (cameraKeyframes.length >= 2) {
      const sortedKf = [...cameraKeyframes].sort((a, b) => a.time - b.time);
      let maxGap = 0;
      let gapStartTime = 0;
      
      for (let i = 0; i < sortedKf.length - 1; i++) {
        const gap = sortedKf[i + 1].time - sortedKf[i].time;
        if (gap > maxGap) {
          maxGap = gap;
          gapStartTime = sortedKf[i].time + gap / 2;
        }
      }
      newTime = gapStartTime;
    }
    
    setCameraKeyframes([...cameraKeyframes, {
      time: newTime,
      distance: lastKeyframe.distance,
      height: lastKeyframe.height,
      rotation: lastKeyframe.rotation,
      easing: 'linear'
    }]);
  };

  const deleteKeyframe = (keyframeIndex) => {
    // Keep at least one keyframe
    if (cameraKeyframes.length > 1) {
      setCameraKeyframes(cameraKeyframes.filter((_, i) => i !== keyframeIndex));
    }
  };

  const updateKeyframe = (keyframeIndex, field, value) => {
    setCameraKeyframes(cameraKeyframes.map((kf, i) => 
      i === keyframeIndex ? { ...kf, [field]: value } : kf
    ));
  };

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

      // Get audio duration
      const duration = audioBufferRef.current.duration;
      
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

      // Set up streams
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
      
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 5000000
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
      
      // Start recording
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      addLog('Recording started', 'success');

      // Auto-play the audio using Web Audio API
      const src = audioContextRef.current.createBufferSource();
      src.buffer = audioBufferRef.current;
      src.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      src.start(0, 0);
      bufferSourceRef.current = src;
      startTimeRef.current = Date.now();
      setIsPlaying(true);

      // Track progress
      const AUDIO_END_THRESHOLD = 0.1;
      const FINAL_FRAME_DELAY = 500;
      
      const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const progress = (elapsed / duration) * 100;
        setExportProgress(Math.min(progress, 99));
        setCurrentTime(elapsed);
        
        // Stop when audio ends
        if (elapsed >= duration - AUDIO_END_THRESHOLD) {
          clearInterval(progressInterval);
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
      characterOffsets: []
    };
    setTextAnimatorKeyframes(prev => [...prev, newKeyframe]);
    addLog(`Created text animator keyframe at ${formatTime(time)}`, 'success');
    return newKeyframe;
  };

  const updateTextAnimatorKeyframe = (id: string, updates: any) => {
    setTextAnimatorKeyframes(prev => 
      prev.map(kf => kf.id === id ? { ...kf, ...updates } : kf)
    );
  };

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

  // Scene initialization - runs once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    let scene, camera, renderer;
    
    try {
      addLog('Initializing Three.js scene...', 'info');
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0a0a14, 10, 50);
      sceneRef.current = scene;
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

    // Helper function to create materials
    const createMaterial = (
      type: 'basic' | 'standard' | 'phong' | 'lambert',
      color: string,
      wireframe: boolean,
      opacity: number,
      metalness: number = 0.5,
      roughness: number = 0.5
    ): THREE.Material => {
      const baseColor = new THREE.Color(color);
      const commonProps = {
        color: baseColor,
        wireframe,
        transparent: true,
        opacity
      };

      switch (type) {
        case 'standard':
          return new THREE.MeshStandardMaterial({
            ...commonProps,
            metalness,
            roughness
          });
        case 'phong':
          return new THREE.MeshPhongMaterial({
            ...commonProps,
            shininess: 30
          });
        case 'lambert':
          return new THREE.MeshLambertMaterial(commonProps);
        case 'basic':
        default:
          return new THREE.MeshBasicMaterial(commonProps);
      }
    };

    const cubes: THREE.Mesh[] = [];
    for (let i=0; i<8; i++) {
      const cubeMaterial = createMaterial(
        cubeMaterialType,
        cubeColor,
        cubeWireframe,
        cubeOpacity,
        cubeMetalness,
        cubeRoughness
      );
      const c = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), cubeMaterial);
      const a = (i/8)*Math.PI*2;
      c.position.x = Math.cos(a)*8;
      c.position.z = Math.sin(a)*8;
      scene.add(c);
      cubes.push(c);
    }

    const octas: THREE.Mesh[] = [];
    for (let r=0; r<3; r++) {
      for (let i=0; i<6+r*4; i++) {
        const octaMaterial = createMaterial(
          octahedronMaterialType,
          octahedronColor,
          octahedronWireframe,
          octahedronOpacity,
          octahedronMetalness,
          octahedronRoughness
        );
        const o = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), octaMaterial);
        const a = (i/(6+r*4))*Math.PI*2;
        const rad = 5+r*2;
        o.position.x = Math.cos(a)*rad;
        o.position.y = Math.sin(a)*rad;
        o.position.z = -r*2;
        scene.add(o);
        octas.push(o);
      }
    }

    const tetras: THREE.Mesh[] = [];
    for (let i=0; i<30; i++) {
      const tetraMaterial = createMaterial(
        tetrahedronMaterialType,
        tetrahedronColor,
        tetrahedronWireframe,
        tetrahedronOpacity,
        tetrahedronMetalness,
        tetrahedronRoughness
      );
      const t = new THREE.Mesh(new THREE.TetrahedronGeometry(0.3), tetraMaterial);
      t.position.set((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10);
      scene.add(t);
      tetras.push(t);
    }

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
    
    objectsRef.current = { cubes, octas, tetras, sphere };
    addLog(`Added ${cubes.length} cubes, ${octas.length} octas, ${tetras.length} tetras`, 'info');

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
    };
  }, []); // Empty dependency array - only run once on mount

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
          // Update camera position based on current settings (even when not playing)
          const currentDist = cameraKeyframes && cameraKeyframes.length > 0 
            ? interpolateCameraKeyframes(cameraKeyframes, currentTime).distance 
            : cameraDistance;
          const currentHeight = cameraKeyframes && cameraKeyframes.length > 0 
            ? interpolateCameraKeyframes(cameraKeyframes, currentTime).height 
            : cameraHeight;
          const currentRot = cameraKeyframes && cameraKeyframes.length > 0 
            ? interpolateCameraKeyframes(cameraKeyframes, currentTime).rotation 
            : 0;
          
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
        
        // Update path preview
        if (rigHintsRef.current.pathLine && showRigHints && showRigPath && cameraKeyframes && cameraKeyframes.length >= 2) {
          rigHintsRef.current.pathLine.visible = true;
          const pathPoints: THREE.Vector3[] = [];
          for (let i = 0; i < cameraKeyframes.length - 1; i++) {
            const kf1 = cameraKeyframes[i];
            const kf2 = cameraKeyframes[i + 1];
            for (let j = 0; j <= 10; j++) {
              const t = kf1.time + (kf2.time - kf1.time) * (j / 10);
              const interp = interpolateCameraKeyframes(cameraKeyframes, t);
              const rot = interp.rotation;
              const dist = interp.distance;
              const height = interp.height;
              pathPoints.push(new THREE.Vector3(
                Math.cos(rot) * dist,
                10 + height,
                Math.sin(rot) * dist
              ));
            }
          }
          rigHintsRef.current.pathLine.geometry.setFromPoints(pathPoints);
        } else if (rigHintsRef.current.pathLine) {
          rigHintsRef.current.pathLine.visible = false;
        }
        
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
  }, [isPlaying, currentTime, cameraDistance, cameraHeight, cameraKeyframes, showRigHints, showRigPosition, showRigTarget, showRigGrid, showRigPath]);

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
      const t = el % duration;
      setCurrentTime(t);
      const type = getCurrentPreset(); // Use keyframe-based preset switching
      const presetSpeed = getCurrentPresetSpeed(); // Get speed multiplier for current preset
      const elScaled = elScaled * presetSpeed; // Apply speed multiplier to animations
      
      // Interpolate camera settings from global keyframes or use global settings
      let activeCameraDistance, activeCameraHeight, activeCameraRotation;
      
      if (cameraKeyframes && cameraKeyframes.length > 0) {
        const interpolated = interpolateCameraKeyframes(cameraKeyframes, t);
        activeCameraDistance = interpolated.distance;
        activeCameraHeight = interpolated.height;
        activeCameraRotation = interpolated.rotation;
      } else {
        activeCameraDistance = cameraDistance;
        activeCameraHeight = cameraHeight;
        activeCameraRotation = 0; // Default to 0 when no keyframes (rotation only via keyframes)
      }

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

      if (type === 'orbit') {
        const rotationSpeed = KEYFRAME_ONLY_ROTATION_SPEED;
        const r = activeCameraDistance - f.bass * 5;
        cam.position.set(Math.cos(rotationSpeed + activeCameraRotation)*r + shakeX, 10 + activeCameraHeight + shakeY, Math.sin(rotationSpeed + activeCameraRotation)*r + shakeZ);
        cam.lookAt(0,0,0);
        obj.sphere.position.set(0, 0, 0);
        const sunScale = 3 + f.bass * 2;
        obj.sphere.scale.set(sunScale, sunScale, sunScale);
        obj.sphere.rotation.x = 0;
        obj.sphere.rotation.y += 0.01;
        obj.sphere.rotation.z = 0;
        obj.sphere.material.color.setStyle(bassColor);
        obj.sphere.material.opacity = (0.9 + f.bass * 0.1) * blend;
        obj.sphere.material.wireframe = false;
        obj.cubes.forEach((planet, i) => {
          const orbitRadius = 5 + i * 1.8;
          const orbitSpeed = 0.8 / (1 + i * 0.3);
          const angle = elScaled * orbitSpeed + i * 0.5;
          const tilt = Math.sin(i) * 0.3;
          planet.position.x = Math.cos(angle) * orbitRadius;
          planet.position.z = Math.sin(angle) * orbitRadius;
          planet.position.y = Math.sin(angle * 2) * tilt;
          const sizeVariation = [0.8, 0.6, 1.0, 0.7, 2.5, 2.2, 1.8, 1.6][i];
          const planetSize = sizeVariation + f.bass * 0.3;
          planet.scale.set(planetSize, planetSize, planetSize);
          planet.rotation.x = tilt;
          planet.rotation.y += 0.02 + i * 0.005;
          planet.rotation.z = 0;
          const colorIndex = i % 3;
          planet.material.color.setStyle(colorIndex === 0 ? bassColor : colorIndex === 1 ? midsColor : highsColor);
          planet.material.opacity = (0.8 + f.bass * 0.2) * blend;
          planet.material.wireframe = false;
        });
        obj.octas.slice(0, 24).forEach((moon, i) => {
          const planetIndex = Math.floor(i / 3) % obj.cubes.length;
          const planet = obj.cubes[planetIndex];
          const moonOrbitRadius = 1.2 + (i % 3) * 0.3;
          const moonOrbitSpeed = 3 + (i % 3);
          const moonAngle = elScaled * moonOrbitSpeed + i;
          moon.position.x = planet.position.x + Math.cos(moonAngle) * moonOrbitRadius;
          moon.position.y = planet.position.y + Math.sin(moonAngle) * moonOrbitRadius * 0.5;
          moon.position.z = planet.position.z + Math.sin(moonAngle) * moonOrbitRadius;
          const moonSize = 0.3 + f.mids * 0.2;
          moon.scale.set(moonSize, moonSize, moonSize);
          moon.rotation.x += 0.05;
          moon.rotation.y += 0.03;
          moon.rotation.z = 0;
          moon.material.color.setStyle(midsColor);
          moon.material.opacity = (0.6 + f.mids * 0.4) * blend;
          moon.material.wireframe = false;
        });
        obj.octas.slice(24).forEach((rogue, i) => {
          const layer = Math.floor(i / 6);
          const posInLayer = i % 6;
          const rogueDist = 25 + layer * 8;
          const rogueAngle = (posInLayer / 6) * Math.PI * 2 + layer * 0.5;
          rogue.position.x = Math.cos(rogueAngle) * rogueDist;
          rogue.position.y = (posInLayer % 3 - 1) * 6;
          rogue.position.z = Math.sin(rogueAngle) * rogueDist;
          const rogueSize = 4 + layer * 2 + (i % 3);
          rogue.scale.set(rogueSize, rogueSize, rogueSize);
          rogue.rotation.x = elScaled * 0.05 + i;
          rogue.rotation.y = elScaled * 0.03;
          rogue.rotation.z = 0;
          rogue.material.color.setStyle(midsColor);
          rogue.material.opacity = (0.4 + f.mids * 0.2) * blend;
          rogue.material.wireframe = true;
        });
        obj.tetras.forEach((asteroid, i) => {
          const beltRadius = 11 + (i % 5) * 0.5;
          const beltSpeed = 0.3;
          const angle = elScaled * beltSpeed + i * 0.2;
          const scatter = Math.sin(i * 10) * 2;
          asteroid.position.x = Math.cos(angle) * (beltRadius + scatter);
          asteroid.position.z = Math.sin(angle) * (beltRadius + scatter);
          asteroid.position.y = Math.sin(angle * 3 + i) * 0.5 + f.highs * 0.5;
          asteroid.rotation.x += 0.02;
          asteroid.rotation.y += 0.03;
          asteroid.rotation.z += 0.01;
          const asteroidSize = 0.2 + f.highs * 0.3;
          asteroid.scale.set(asteroidSize, asteroidSize, asteroidSize);
          asteroid.material.color.setStyle(highsColor);
          asteroid.material.opacity = (0.5 + f.highs * 0.4) * blend;
          asteroid.material.wireframe = true;
        });
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
        obj.sphere.material.color.setStyle(bassColor);
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          tr.material.color.setStyle(highsColor);
          tr.material.wireframe = true;
        });
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
          c.material.color.setStyle(bassColor);
        });
        obj.octas.forEach((o,i) => {
          o.rotation.x += 0.008 + f.mids * 0.05;
          o.rotation.y += 0.005 + f.mids * 0.03;
          o.position.y = Math.sin(el*0.6+i*0.3)*2 + f.mids * 2;
          const s = 0.8+f.mids*0.3;
          o.scale.set(s,s,s);
          o.material.opacity = (0.3+f.mids*0.3) * blend;
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, Math.sin(el*0.4)*2, 0);
        const sphereSize = 2.5+f.bass*0.5+f.mids*0.3;
        obj.sphere.scale.set(sphereSize,sphereSize,sphereSize);
        obj.sphere.rotation.x += 0.003;
        obj.sphere.rotation.y += 0.005;
        obj.sphere.material.color.setStyle(bassColor);
        obj.sphere.material.opacity = (0.2+f.bass*0.2) * blend;
        obj.sphere.material.wireframe = false;
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
          segment.material.color.setStyle(bassColor);
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
          c.material.color.setStyle(midsColor);
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
          halo.material.color.setStyle(highsColor);
          halo.material.opacity = (0.5 + f.highs * 0.4) * blend;
          halo.material.wireframe = true;
        });
        obj.octas.slice(30).forEach((marker, i) => {
          marker.position.set((i % 2 === 0 ? -1 : 1) * (10 + i * 2), Math.sin(el + i) * 2, -10 - i * 5);
          const s = 1 + f.mids * 0.5;
          marker.scale.set(s, s, s);
          marker.rotation.x = 0;
          marker.rotation.y = el + i;
          marker.rotation.z = 0;
          marker.material.color.setStyle(midsColor);
          marker.material.opacity = (0.3 + f.mids * 0.2) * blend;
          marker.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
        });
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
        });
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
        });
      } else if (type === 'seiryu') {
        const rotationSpeed = KEYFRAME_ONLY_ROTATION_SPEED;
        cam.position.set(Math.sin(rotationSpeed + activeCameraRotation) * 5 + shakeX, 8 + Math.cos(elScaled * 0.2) * 3 + activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        obj.cubes.forEach((c, i) => {
          const segmentTime = elScaled * 1.5 - i * 0.6;
          const progress = i / obj.cubes.length;
          const isHead = i === 0;
          const x = Math.sin(segmentTime) * (6 + f.bass * 3);
          const y = Math.cos(segmentTime * 0.5) * 4 + Math.sin(segmentTime * 1.5) * 2;
          const z = progress * -15 + Math.sin(segmentTime * 0.3) * 3;
          c.position.set(x, y, z);
          const baseScale = isHead ? 5 : 1.3;
          const scaleSize = baseScale + f.bass * 0.8;
          c.scale.set(scaleSize, scaleSize * 0.8, scaleSize * 1.2);
          const nextT = elScaled * 1.5 - (i + 1) * 0.6;
          const lookX = Math.sin(nextT) * 6;
          const lookY = Math.cos(nextT * 0.5) * 4;
          const lookZ = (progress + 0.1) * -15;
          c.rotation.x = Math.atan2(lookY - y, lookZ - z);
          c.rotation.y = Math.atan2(lookX - x, lookZ - z);
          c.material.color.setStyle(bassColor);
          c.material.opacity = (0.8 + f.bass * 0.2) * blend;
          c.material.wireframe = isHead ? false : true;
        });
        const head = obj.cubes[0];
        obj.tetras.slice(0, 2).forEach((horn, i) => {
          const side = i === 0 ? 1 : -1;
          const hornOffset = 3.5 + f.highs * 0.5;
          horn.position.x = head.position.x + side * hornOffset * 0.7;
          horn.position.y = head.position.y + hornOffset;
          horn.position.z = head.position.z + 1;
          horn.rotation.x = -0.3;
          horn.rotation.y = side * 0.4;
          horn.rotation.z = side * 0.2;
          const hornSize = 2 + f.highs * 0.5;
          horn.scale.set(hornSize * 0.6, hornSize * 2.5, hornSize * 0.6);
          horn.material.color.setStyle(highsColor);
          horn.material.opacity = (0.9 + f.highs * 0.1) * blend;
          horn.material.wireframe = false;
        });
        obj.octas.slice(0, 10).forEach((mountain, i) => {
          const mountainX = (i - 5) * 8;
          const mountainHeight = 3 + (i % 3) * 2;
          const mountainZ = -25 - (i % 2) * 5;
          mountain.position.set(mountainX, -5 + mountainHeight, mountainZ);
          mountain.rotation.x = 0;
          mountain.rotation.y = elScaled * 0.1 + i;
          const s = 8 + (i % 3) * 3;
          mountain.scale.set(s, mountainHeight * 2, s);
          mountain.material.color.setStyle(midsColor);
          mountain.material.opacity = (0.4 + f.mids * 0.2) * blend;
          mountain.material.wireframe = true;
        });
        obj.octas.slice(10).forEach((o, i) => {
          const bodyIndex = (i % obj.cubes.length);
          const orbitAngle = (i / 4) * Math.PI * 2 + elScaled * 3;
          const bodyCube = obj.cubes[bodyIndex];
          const orbitRadius = 1.2 + f.mids * 1.5;
          o.position.x = bodyCube.position.x + Math.cos(orbitAngle) * orbitRadius;
          o.position.y = bodyCube.position.y + Math.sin(orbitAngle) * orbitRadius;
          o.position.z = bodyCube.position.z;
          o.rotation.x += 0.1 + f.mids * 0.1;
          o.rotation.y += 0.08;
          const s = 0.5 + f.mids * 0.4;
          o.scale.set(s, s, s);
          o.material.color.setStyle(midsColor);
          o.material.opacity = (0.7 + f.mids * 0.3) * blend;
          o.material.wireframe = false;
        });
        obj.tetras.slice(2).forEach((cloud, i) => {
          const driftSpeed = 0.2;
          const layer = Math.floor(i / 10);
          cloud.position.x = ((elScaled * driftSpeed + i * 4) % 50) - 25;
          cloud.position.y = 5 + layer * 3 + Math.sin(el + i) * 0.5;
          cloud.position.z = -10 - layer * 8 + Math.cos(elScaled * 0.3 + i) * 2;
          cloud.rotation.x += 0.01;
          cloud.rotation.y += 0.02;
          const cloudSize = 1.5 + (i % 3) * 0.5;
          cloud.scale.set(cloudSize, cloudSize * 0.6, cloudSize);
          cloud.material.color.setStyle(highsColor);
          cloud.material.opacity = (0.3 + f.highs * 0.2) * blend;
          cloud.material.wireframe = false;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
      } else if (type === 'hammerhead') {
        // Hammerhead Shark - Swimming shark with distinctive hammer-shaped head
        // Constants for shark anatomy
        const TAIL_SEGMENT_COUNT = 2;
        const HAMMER_CUBE_COUNT = 3; // 3 cubes form the T-shaped hammer
        const DORSAL_FIN_INDEX = 0; // Use first tetrahedron for dorsal fin
        const TAIL_FIN_INDEX = 1; // Use second tetrahedron for tail fin
        
        const swimSpeed = elScaled * 0.8;
        const rotationSpeed = KEYFRAME_ONLY_ROTATION_SPEED;
        
        // Camera follows shark from side/above angle
        cam.position.set(
          Math.sin(rotationSpeed + activeCameraRotation) * activeCameraDistance * 0.8 + Math.sin(swimSpeed * 0.3) * 2 + shakeX,
          5 + activeCameraHeight + Math.sin(swimSpeed * 0.5) * 1 + shakeY,
          activeCameraDistance * 0.8 + shakeZ
        );
        cam.lookAt(0, 0, -5);
        
        // Shark body using cubes - serpentine swimming motion
        obj.cubes.forEach((c, i) => {
          const progress = i / obj.cubes.length;
          const isHead = i === 0;
          const isHammer = i < HAMMER_CUBE_COUNT; // First 3 cubes form hammer
          const isTail = i >= obj.cubes.length - TAIL_SEGMENT_COUNT;
          
          // Swimming path - gentle side-to-side motion
          const swayAmount = (1 - progress) * 2 + f.bass * 1.5;
          const x = Math.sin(swimSpeed - i * 0.4) * swayAmount;
          const yPos = Math.sin(swimSpeed * 0.6 - i * 0.3) * 0.5;
          const z = progress * -20 - 5;
          
          // Hammer T-shape positioning
          if (isHammer) {
            if (i === 0) {
              // Left end of hammer
              c.position.set(x - 6, yPos + 0.5, z + 2);
            } else if (i === 1) {
              // Center of hammer (vertical part of T)
              c.position.set(x, yPos, z);
            } else {
              // Right end of hammer
              c.position.set(x + 6, yPos + 0.5, z + 2);
            }
          } else {
            c.position.set(x, yPos, z);
          }
          
          // Scale: MUCH LARGER for prominence
          let scaleX = 2.5;
          let scaleY = 2;
          let scaleZ = 3;
          if (isHammer && i !== 1) {
            // Hammer end cubes - stretched horizontally
            scaleX = 5 + f.highs * 0.5; // Very wide for hammer ends
            scaleY = 2 + f.highs * 0.3;
            scaleZ = 2 + f.highs * 0.3;
          } else if (isHead) {
            // Center/head cube
            scaleX = 2.5 + f.bass * 0.5;
            scaleY = 2.5 + f.bass * 0.5;
            scaleZ = 4 + f.bass * 0.8; // Longer for head
          } else if (isTail) {
            const tailProgress = (i - (obj.cubes.length - TAIL_SEGMENT_COUNT)) / TAIL_SEGMENT_COUNT;
            scaleX = 1.5 - tailProgress * 0.7;
            scaleY = 1.2 - tailProgress * 0.6;
            scaleZ = 2 + f.bass * 0.5;
          }
          c.scale.set(scaleX, scaleY, scaleZ);
          
          // Rotation to follow swimming path
          const nextI = Math.min(i + 1, obj.cubes.length - 1);
          const nextProgress = nextI / obj.cubes.length;
          const nextSwayAmount = (1 - nextProgress) * 2 + f.bass * 1.5;
          const nextX = Math.sin(swimSpeed - nextI * 0.4) * nextSwayAmount;
          const nextYPos = Math.sin(swimSpeed * 0.6 - nextI * 0.3) * 0.5;
          const nextZ = nextProgress * -20 - 5;
          
          if (!isHammer || i === 1) {
            // Only rotate non-hammer cubes (and center of hammer)
            c.rotation.y = Math.atan2(nextX - x, nextZ - z);
            c.rotation.x = Math.atan2(nextYPos - yPos, nextZ - z) * 0.5;
            c.rotation.z = Math.sin(swimSpeed - i * 0.4) * 0.1;
          } else {
            // Hammer ends align with center
            const center = obj.cubes[1];
            c.rotation.y = center.rotation.y;
            c.rotation.x = 0;
            c.rotation.z = 0;
          }
          
          // Color hammer differently
          if (isHammer) {
            c.material.color.setStyle(highsColor);
          } else {
            c.material.color.setStyle(bassColor);
          }
          c.material.opacity = (0.9 + f.bass * 0.1) * blend;
          c.material.wireframe = false;
        });
        
        // PROMINENT DORSAL FIN using tetrahedron (triangle shape)
        const dorsalFin = obj.tetras[DORSAL_FIN_INDEX];
        const bodySegment = Math.floor(obj.cubes.length * 0.35);
        const body = obj.cubes[bodySegment];
        dorsalFin.position.x = body.position.x;
        dorsalFin.position.y = body.position.y + 5 + f.mids * 1; // VERY TALL
        dorsalFin.position.z = body.position.z;
        dorsalFin.rotation.x = 0; // Point up
        dorsalFin.rotation.y = body.rotation.y;
        dorsalFin.rotation.z = Math.PI; // Flip to point upward
        const dorsalSize = 5 + f.mids * 0.8; // VERY LARGE
        dorsalFin.scale.set(dorsalSize * 0.5, dorsalSize * 1.2, dorsalSize * 0.4);
        dorsalFin.material.color.setStyle(midsColor);
        dorsalFin.material.opacity = (0.9 + f.mids * 0.1) * blend;
        dorsalFin.material.wireframe = false;
        
        // PROMINENT TAIL FIN using tetrahedron (triangle shape)
        const tailFin = obj.tetras[TAIL_FIN_INDEX];
        const tail = obj.cubes[obj.cubes.length - 1];
        tailFin.position.x = tail.position.x;
        tailFin.position.y = tail.position.y + Math.sin(swimSpeed * 3) * 1; // Animated vertical movement
        tailFin.position.z = tail.position.z - 3;
        tailFin.rotation.x = Math.PI / 2; // Vertical orientation
        tailFin.rotation.y = tail.rotation.y;
        tailFin.rotation.z = Math.sin(swimSpeed * 3) * 0.4; // Animated wagging
        const tailSize = 4 + f.bass * 0.8; // VERY LARGE
        tailFin.scale.set(tailSize * 0.6, tailSize * 1.3, tailSize * 0.3);
        tailFin.material.color.setStyle(midsColor);
        tailFin.material.opacity = (0.9 + f.bass * 0.1) * blend;
        tailFin.material.wireframe = false;
        
        // Hide remaining tetras
        const USED_TETRAS = 2; // Dorsal fin + tail fin
        obj.tetras.slice(USED_TETRAS).forEach(t => {
          t.position.set(0, -1000, 0);
          t.scale.set(0.001, 0.001, 0.001);
          t.material.opacity = 0;
        });
        
        // Minimal bubbles for atmosphere - only 5 bubbles total
        obj.octas.forEach((bubble, i) => {
          if (i < 5) {
            // Sparse rising bubbles
            const bubbleSpeed = 0.5 + (i % 2) * 0.2;
            const riseHeight = (elScaled * bubbleSpeed + i * 4) % 25;
            const xOffset = Math.sin(i * 3) * 10;
            const zOffset = -8 - i * 4;
            
            bubble.position.x = xOffset;
            bubble.position.y = riseHeight - 12;
            bubble.position.z = zOffset;
            
            const bubbleSize = 0.4 + f.highs * 0.2;
            bubble.scale.set(bubbleSize, bubbleSize, bubbleSize);
            bubble.rotation.x += 0.05;
            bubble.rotation.y += 0.03;
            
            bubble.material.color.setStyle(highsColor);
            bubble.material.opacity = (0.3 + f.highs * 0.2) * blend; // More subtle
            bubble.material.wireframe = true;
          } else {
            // Hide the rest
            bubble.position.set(0, -1000, 0);
            bubble.scale.set(0.001, 0.001, 0.001);
            bubble.material.opacity = 0;
          }
        });
        
        // Hide sphere completely - no background distractions
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = (0.5 + f.highs * 0.5) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const sphereSize = 1 + f.bass * 0.5;
        obj.sphere.scale.set(sphereSize, sphereSize, sphereSize);
        obj.sphere.rotation.x = elScaled * 0.5;
        obj.sphere.rotation.y = el;
        obj.sphere.material.color.setStyle(bassColor);
        obj.sphere.material.opacity = (0.3 + f.bass * 0.2) * blend;
        obj.sphere.material.wireframe = true;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = ((1 - fallProgress) * 0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
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
          c.material.color.setStyle(strand === 0 ? bassColor : midsColor);
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
          t.material.color.setStyle(highsColor);
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
          o.material.color.setStyle(highsColor);
          o.material.opacity = (0.4 + f.highs * 0.3) * blend;
          o.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const centerSize = 0.5 + f.mids * 0.3;
        obj.sphere.scale.set(centerSize, 20, centerSize);
        obj.sphere.rotation.y = el;
        obj.sphere.material.color.setStyle(midsColor);
        obj.sphere.material.opacity = (0.2 + f.mids * 0.1) * blend;
        obj.sphere.material.wireframe = true;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
            t.material.color.setStyle(highsColor);
            t.material.opacity = ((1 - fadeProgress) * 0.7 + f.highs * 0.3) * blend;
            t.material.wireframe = true;
          }
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = (brightness * 0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = (fade * 0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const pulseSize = 2 + f.bass * 3;
        obj.sphere.scale.set(pulseSize, pulseSize * 0.2, pulseSize);
        obj.sphere.rotation.y = el;
        obj.sphere.material.color.setStyle(bassColor);
        obj.sphere.material.opacity = (0.3 + f.bass * 0.4) * blend;
        obj.sphere.material.wireframe = true;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = (0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = (0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = ((1 - depth * 0.5) + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
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
          c.material.color.setStyle(i < petals ? bassColor : midsColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = (0.7 + f.highs * 0.3) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const centerSize = 2 + Math.sin(el) * 0.5 + f.bass * 1;
        obj.sphere.scale.set(centerSize, centerSize, centerSize);
        obj.sphere.rotation.y = el;
        obj.sphere.material.color.setStyle(highsColor);
        obj.sphere.material.opacity = (0.8 + f.bass * 0.2) * blend;
        obj.sphere.material.wireframe = false;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = (heightFactor * 0.5 + f.highs * 0.5) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = (0.5 + f.highs * 0.5) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const coreSize = 3 + f.bass * 2;
        obj.sphere.scale.set(coreSize, coreSize, coreSize);
        obj.sphere.rotation.x = el;
        obj.sphere.rotation.y = elScaled * 1.5;
        obj.sphere.rotation.z = elScaled * 0.5;
        obj.sphere.material.color.setStyle(bassColor);
        obj.sphere.material.opacity = (0.3 + f.bass * 0.2) * blend;
        obj.sphere.material.wireframe = true;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = (0.5 + f.highs * 0.5) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -7, 0);
        const trunkSize = 1.5 + f.bass * 0.5;
        obj.sphere.scale.set(trunkSize, 3, trunkSize);
        obj.sphere.rotation.y = elScaled * 0.2;
        obj.sphere.material.color.setStyle(bassColor);
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
          c.material.color.setStyle(bassColor);
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
          c.material.color.setStyle(midsColor);
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
          o.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = ((1 - Math.abs(t1 - 0.5) * 2) * 0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = (0.5 + f.highs * 0.5) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        obj.sphere.material.opacity = 0;
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
          c.material.color.setStyle(bassColor);
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
          t.material.color.setStyle(highsColor);
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
          o.material.color.setStyle(midsColor);
          o.material.opacity = (0.4 + f.mids * 0.3) * blend;
          o.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const neckSize = 0.8 + f.bass * 0.3;
        obj.sphere.scale.set(neckSize, neckSize * 0.5, neckSize);
        obj.sphere.rotation.y = el;
        obj.sphere.material.color.setStyle(bassColor);
        obj.sphere.material.opacity = (0.5 + f.bass * 0.3) * blend;
        obj.sphere.material.wireframe = true;
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
          c.material.color.setStyle(bassColor);
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
          o.material.color.setStyle(midsColor);
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
          t.material.color.setStyle(highsColor);
          t.material.opacity = (0.6 + f.highs * 0.4) * blend;
          t.material.wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        const coreSize = 1.5 + Math.sin(el) * 0.3 + f.bass * 0.8;
        obj.sphere.scale.set(coreSize, coreSize * 0.5, coreSize);
        obj.sphere.rotation.y = elScaled * 0.5;
        obj.sphere.material.color.setStyle(highsColor);
        obj.sphere.material.opacity = (0.9 + f.bass * 0.1) * blend;
        obj.sphere.material.wireframe = false;
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
          if (freqIndex === 0) mesh.material.color.setStyle(bassColor);
          else if (freqIndex === 1) mesh.material.color.setStyle(midsColor);
          else mesh.material.color.setStyle(highsColor);
        });
      }

      // PHASE 5: Text Animator - Animate per-character text
      textAnimatorKeyframes.forEach(textKf => {
        if (!fontRef.current) return;
        
        // Create character meshes if they don't exist
        if (!textCharacterMeshesRef.current.has(textKf.id)) {
          const characterMeshes: THREE.Mesh[] = [];
          const chars = textKf.text.split('');
          let xOffset = -(textKf.text.length * 0.6) / 2; // Center text
          
          chars.forEach((char, index) => {
            const textGeometry = new TextGeometry(char, {
              font: fontRef.current,
              size: 1,
              height: 0.2,
              curveSegments: 12,
              bevelEnabled: true,
              bevelThickness: 0.03,
              bevelSize: 0.02,
              bevelSegments: 5
            });
            
            const textMaterial = new THREE.MeshBasicMaterial({
              color: bassColor,
              transparent: true,
              opacity: 0
            });
            
            const charMesh = new THREE.Mesh(textGeometry, textMaterial);
            charMesh.position.set(xOffset, 5, 0);
            
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
            xOffset += 0.6; // Spacing between characters
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
          
          // Apply animation based on type
          switch (textKf.animation) {
            case 'fade':
              (charMesh.material as THREE.MeshBasicMaterial).opacity = progress;
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
              const baseY = 5;
              charMesh.position.y = baseY + slideOffset.y * (1 - progress);
              charMesh.position.x += slideOffset.x * (1 - progress);
              (charMesh.material as THREE.MeshBasicMaterial).opacity = progress;
              break;
            }
            
            case 'scale': {
              const scale = progress;
              charMesh.scale.setScalar(scale);
              (charMesh.material as THREE.MeshBasicMaterial).opacity = progress;
              break;
            }
            
            case 'bounce': {
              const bounceHeight = Math.abs(Math.sin(progress * Math.PI)) * 2;
              charMesh.position.y = 5 + bounceHeight;
              (charMesh.material as THREE.MeshBasicMaterial).opacity = progress;
              break;
            }
            
            default:
              (charMesh.material as THREE.MeshBasicMaterial).opacity = textKf.visible ? 1 : 0;
          }
          
          // Update color
          (charMesh.material as THREE.MeshBasicMaterial).color.setStyle(bassColor);
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
        if (hints.pathLine && showRigPath && cameraKeyframes.length >= 2) {
          hints.pathLine.visible = true;
          // Generate path from camera keyframes
          const pathPoints: THREE.Vector3[] = [];
          const sortedKf = [...cameraKeyframes].sort((a, b) => a.time - b.time);
          
          // Sample points along the interpolated path
          for (let i = 0; i < sortedKf.length - 1; i++) {
            const kf1 = sortedKf[i];
            const kf2 = sortedKf[i + 1];
            const steps = 10;
            
            for (let s = 0; s <= steps; s++) {
              const progress = s / steps;
              const interpolated = interpolateCameraKeyframes(cameraKeyframes, kf1.time + (kf2.time - kf1.time) * progress);
              const angle = interpolated.rotation;
              const dist = interpolated.distance;
              const height = interpolated.height;
              
              const x = Math.cos(angle) * dist;
              const y = height;
              const z = Math.sin(angle) * dist;
              pathPoints.push(new THREE.Vector3(x, y, z));
            }
          }
          
          if (pathPoints.length > 0) {
            hints.pathLine.geometry.setFromPoints(pathPoints);
            hints.pathLine.geometry.attributes.position.needsUpdate = true;
          }
        } else if (hints.pathLine) {
          hints.pathLine.visible = false;
        }
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

      // Render with post-processing
      if (composerRef.current) {
        composerRef.current.render();
      } else {
        rend.render(scene, cam);
      }
    };

    anim();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, sections, duration, bassColor, midsColor, highsColor, showSongName, vignetteStrength, vignetteSoftness, colorSaturation, colorContrast, colorGamma, colorTintR, colorTintG, colorTintB]);

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
        } else if (showExportModal) {
          setShowExportModal(false);
        } else if (showEventModal) {
          setShowEventModal(false);
          setEditingEventId(null);
        }
      } else if (e.key === 'g' || e.key === 'G') {
        // Toggle camera rig hints
        setShowRigHints(prev => !prev);
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
  }, [showExportModal, showEventModal, showKeyboardShortcuts]);

  return (
    <div className="flex flex-col gap-4 min-h-screen bg-gray-900 p-4">
      <div className="flex flex-col items-center">
        <div className="mb-4 text-center relative" style={{width: '960px'}}>
          <h1 className="text-3xl font-bold text-purple-400 mb-2">3D Timeline Visualizer</h1>
          <p className="text-cyan-300 text-sm">Upload audio and watch the magic!</p>
          
          {/* Export and Help Buttons - Top Right */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            {/* Keyboard Shortcuts Button */}
            <button
              onClick={() => setShowKeyboardShortcuts(true)}
              className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <BadgeHelp size={18} />
            </button>
            
            {/* Export Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
              title="Video Export"
            >
              <Video size={18} />
              <span className="text-sm font-semibold">Export</span>
            </button>
          </div>
        </div>

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
        </div>
      </div>

      {/* Waveform Display - Between Canvas and Tabs - Always visible */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-4">
          {/* Time Display and Preset Info - No Audio Upload */}
          <div className="flex-shrink-0 bg-gray-700 rounded-lg px-4 py-3">
            <p className="text-white text-lg font-mono font-bold">{formatTime(currentTime)} / {formatTime(duration)}</p>
            {showPresetDisplay && (() => {
              const currentPreset = getCurrentPreset();
              const animType = animationTypes.find(a => a.value === currentPreset);
              return animType && (
                <p className="text-cyan-400 text-xs mt-1">
                  {animType.icon} {animType.label}
                </p>
              );
            })()}
            
            {/* Play/Stop Button */}
            {audioReady && <button onClick={isPlaying ? (audioTracks.length > 0 ? stopMultiTrackAudio : stopAudio) : (audioTracks.length > 0 ? playMultiTrackAudio : playAudio)} className="mt-3 w-full bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm">{isPlaying ? <><Square size={14} /> Stop</> : <><Play size={14} /> Play</>}</button>}
          </div>
          
          {/* Combined Waveform from all tracks */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="bg-black rounded-lg p-2 cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all" onClick={audioReady ? handleWaveformClick : undefined} title="Click to seek">
              {audioReady && audioTracks.length > 0 ? (
                <canvas 
                  ref={waveformCanvasRef} 
                  width={800} 
                  height={120}
                  className="w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-[120px] text-gray-500 text-sm">
                  {audioTracks.length === 0 ? 'Add audio tracks in the Waveforms tab to see combined visualization' : 'Upload an audio file to see the waveform'}
                </div>
              )}
            </div>
            
            {/* Timeline Slider - Always visible when audio is ready */}
            {audioReady && duration > 0 && (
              <div className="flex items-center gap-3">
                <input 
                  type="range" id="currentTime" name="currentTime" 
                  min="0" 
                  max={duration} 
                  step="0.1" 
                  value={currentTime} 
                  onChange={(e) => seekTo(parseFloat(e.target.value))} 
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer" 
                  style={{background:`linear-gradient(to right, #06b6d4 0%, #06b6d4 ${(currentTime/duration)*100}%, #374151 ${(currentTime/duration)*100}%, #374151 100%)`}} 
                />
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <input 
                    type="checkbox" 
                    id="waveformMode" 
                    checked={waveformMode === 'static'} 
                    onChange={(e) => setWaveformMode(e.target.checked ? 'static' : 'scrolling')} 
                    className="w-3 h-3 cursor-pointer"
                    aria-label="Toggle between scrolling and static waveform modes"
                  />
                  <label htmlFor="waveformMode" className="cursor-pointer whitespace-nowrap">Static</label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex gap-2 mb-4 border-b border-gray-700">
          <button 
            onClick={() => setActiveTab('waveforms')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'waveforms' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            🎵 Waveforms
          </button>
          <button 
            onClick={() => setActiveTab('controls')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'controls' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            🎨 Controls
          </button>
          <button 
            onClick={() => setActiveTab('camera')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'camera' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            📷 Camera Settings
          </button>
          <button 
            onClick={() => setActiveTab('cameraRig')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'cameraRig' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            🎥 Camera Rig
          </button>
          <button 
            onClick={() => setActiveTab('effects')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'effects' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            ✨ Effects
          </button>
          <button 
            onClick={() => setActiveTab('postfx')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'postfx' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            🎭 Post-FX
          </button>
          <button 
            onClick={() => setActiveTab('presets')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'presets' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            ⏱️ Presets
          </button>
          <button 
            onClick={() => setActiveTab('textAnimator')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'textAnimator' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            📝 Text Animator
          </button>
          <button 
            onClick={() => setActiveTab('masks')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'masks' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            🎭 Masks
          </button>
        </div>

        {/* Waveforms Tab - PHASE 4 */}
        {activeTab === 'waveforms' && (
          <div>
            <div className="mb-4 bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-cyan-400">🎵 Audio Tracks</h3>
                <label className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded cursor-pointer flex items-center gap-1">
                  <Plus size={14} /> Add Track
                  <input 
                    type="file" id="file-field-2867" name="file-field-2867" 
                    accept="audio/*" 
                    onChange={(e) => { if (e.target.files?.[0]) addAudioTrack(e.target.files[0]); }}
                    className="hidden"
                  />
                </label>
              </div>
              
              {audioTracks.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No audio tracks loaded. Click "Add Track" to upload audio files.
                </div>
              ) : (
                <div className="space-y-3">
                  {audioTracks.map((track, index) => (
                    <div key={track.id} className="bg-gray-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="activeTrack"
                            checked={track.active}
                            onChange={() => setActiveTrack(track.id)}
                            className="cursor-pointer"
                            title="Active track (frequencies drive visualization)"
                          />
                          <span className="text-sm text-white font-medium">{track.name}</span>
                          {track.active && <span className="text-xs text-cyan-400 bg-cyan-900 px-2 py-0.5 rounded">Active</span>}
                        </div>
                        <button
                          onClick={() => removeAudioTrack(track.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Remove track"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      {/* Waveform visualization for this track */}
                      <div className="bg-black rounded p-2 mb-2 h-16">
                        <canvas
                          ref={(canvas) => {
                            if (canvas && track.buffer) {
                              const ctx = canvas.getContext('2d');
                              if (ctx) {
                                const waveform = generateWaveformData(track.buffer, 200);
                                canvas.width = canvas.offsetWidth;
                                canvas.height = 64;
                                ctx.fillStyle = '#000';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.fillStyle = track.active ? '#06b6d4' : '#4b5563';
                                const barWidth = canvas.width / waveform.length;
                                waveform.forEach((val, i) => {
                                  const height = val * canvas.height;
                                  ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 1, height);
                                });
                                // Playback indicator
                                if (track.buffer) {
                                  const progress = currentTime / track.buffer.duration;
                                  ctx.strokeStyle = '#fff';
                                  ctx.lineWidth = 2;
                                  ctx.beginPath();
                                  ctx.moveTo(progress * canvas.width, 0);
                                  ctx.lineTo(progress * canvas.width, canvas.height);
                                  ctx.stroke();
                                }
                              }
                            }
                          }}
                          className="w-full h-full"
                        />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTrackMute(track.id)}
                          className={`px-2 py-1 text-xs rounded ${track.muted ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200'}`}
                        >
                          {track.muted ? '🔇 Muted' : '🔊 On'}
                        </button>
                        <label className="flex-1 flex items-center gap-2">
                          <span className="text-xs text-gray-400">Vol</span>
                          <input
                            type="range" id="range-field-2950" name="range-field-2950"
                            min="0"
                            max="1"
                            step="0.01"
                            value={track.volume}
                            onChange={(e) => updateTrackVolume(track.id, parseFloat(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-400 w-8">{Math.round(track.volume * 100)}%</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls Tab */}
        {activeTab === 'controls' && (
          <div>
            {/* Parameter Events Timeline - Moved to top */}
            <div className="mb-4 bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-cyan-400">⚡ Parameter Events Timeline</h3>
                <button
                  onClick={() => setParameterSettingsExpanded(!parameterSettingsExpanded)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title={parameterSettingsExpanded ? "Collapse settings" : "Expand settings"}
                >
                  <ChevronDown 
                    size={20} 
                    className={`transition-transform ${parameterSettingsExpanded ? '' : '-rotate-90'}`}
                  />
                </button>
              </div>
              
              {/* Timeline bar visualization */}
              <div className="relative bg-gray-800 rounded h-12 mb-3 overflow-hidden">
                {/* Timeline markers for each parameter event */}
                {parameterEvents.map(event => {
                  if (event.mode === 'manual') {
                    const startPos = duration > 0 ? Math.min((event.startTime / duration) * 100, 100) : 0;
                    const endPos = duration > 0 ? Math.min((event.endTime / duration) * 100, 100) : 0;
                    const width = Math.max(0, endPos - startPos);
                    return (
                      <div
                        key={event.id}
                        className="absolute top-0 bottom-0 bg-cyan-500 bg-opacity-40 hover:bg-opacity-60 transition-colors cursor-pointer border-l-2 border-r-2 border-cyan-400"
                        style={{ left: `${startPos}%`, width: `${width}%` }}
                        title={`${formatTime(event.startTime)} → ${formatTime(event.endTime)}`}
                      />
                    );
                  }
                  return null;
                })}
                
                {/* Current time indicator */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 pointer-events-none z-10"
                  style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              
              {/* Quick add button */}
              <button
                onClick={addParameterEvent}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-sm px-3 py-2 rounded flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                Add at {formatTime(currentTime)}
              </button>
              
              {/* Collapsible event list */}
              {parameterSettingsExpanded && (
                parameterEvents.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-xs mt-3">
                    No events. Click "Add at Xs" to create flash effects.
                  </div>
                ) : (
                  <div className="space-y-2 mt-3">
                    {parameterEvents.map((event) => (
                      <div key={event.id} className="bg-gray-800 rounded p-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="text-white font-medium">
                              {event.mode === 'manual' ? `${formatTimeInput(event.startTime)} → ${formatTimeInput(event.endTime)}` : '🤖 Automated'}
                            </span>
                            {event.mode === 'automated' && event.audioTrackId && (
                              <span className="text-gray-400 ml-2">
                                → {audioTracks.find(t => t.id === event.audioTrackId)?.name || 'Unknown track'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingEventId(event.id);
                                setShowEventModal(true);
                              }}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteParameterEvent(event.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                        <div className="text-gray-400 space-y-0.5">
                          <div>Duration: {(event.endTime - event.startTime).toFixed(2)}s</div>
                          {event.parameters.backgroundFlash !== undefined && event.parameters.backgroundFlash > 0 && (
                            <div>⚪ BG Flash: {Math.round(event.parameters.backgroundFlash * 100)}%</div>
                          )}
                          {event.parameters.cameraShake !== undefined && event.parameters.cameraShake > 0 && (
                            <div>📷 Shake (Auto): {Math.round(event.parameters.cameraShake * 100)}%</div>
                          )}
                          {event.parameters.vignettePulse !== undefined && event.parameters.vignettePulse > 0 && (
                            <div>🌑 Vignette: {Math.round(event.parameters.vignettePulse * 100)}%</div>
                          )}
                          {event.parameters.saturationBurst !== undefined && event.parameters.saturationBurst > 0 && (
                            <div>🎨 Saturation: {Math.round(event.parameters.saturationBurst * 100)}%</div>
                          )}
                          {event.parameters.vignetteStrengthPulse !== undefined && event.parameters.vignetteStrengthPulse > 0 && (
                            <div>🌫️ Vig. Pulse: {Math.round(event.parameters.vignetteStrengthPulse * 100)}%</div>
                          )}
                          {event.parameters.contrastBurst !== undefined && event.parameters.contrastBurst > 0 && (
                            <div>🔆 Contrast: {Math.round(event.parameters.contrastBurst * 100)}%</div>
                          )}
                          {event.parameters.colorTintFlash !== undefined && event.parameters.colorTintFlash.intensity > 0 && (
                            <div>🌈 Tint: R{event.parameters.colorTintFlash.r.toFixed(1)} G{event.parameters.colorTintFlash.g.toFixed(1)} B{event.parameters.colorTintFlash.b.toFixed(1)} ({Math.round(event.parameters.colorTintFlash.intensity * 100)}%)</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
            
            <div className="mb-4 bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎚️ Frequency Gain Controls</h3>
              <p className="text-xs text-gray-400 mb-3">Adjust the sensitivity of each frequency band to the music</p>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-400">Bass Gain</label>
                    <span className="text-xs text-cyan-300">{bassGain.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" id="bassGain" name="bassGain" 
                    min="0" 
                    max="3" 
                    step="0.1" 
                    value={bassGain} 
                    onChange={(e) => setBassGain(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-400">Mids Gain</label>
                    <span className="text-xs text-cyan-300">{midsGain.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" id="midsGain" name="midsGain" 
                    min="0" 
                    max="3" 
                    step="0.1" 
                    value={midsGain} 
                    onChange={(e) => setMidsGain(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-400">Highs Gain</label>
                    <span className="text-xs text-cyan-300">{highsGain.toFixed(2)}x</span>
                  </div>
                  <input 
                    type="range" id="highsGain" name="highsGain" 
                    min="0" 
                    max="3" 
                    step="0.1" 
                    value={highsGain} 
                    onChange={(e) => setHighsGain(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
                <button 
                  onClick={() => { setBassGain(1.0); setMidsGain(1.0); setHighsGain(1.0); }}
                  className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-white w-full"
                >
                  Reset Frequency Gains
                </button>
              </div>
            </div>
            
            <div className="mb-4 bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎭 Shape Material Controls</h3>
              <p className="text-xs text-gray-400 mb-3">Customize the appearance of each shape type (cubes, octahedrons, tetrahedrons, sphere)</p>
              
              {/* Cubes */}
              <div className="bg-gray-800 rounded p-3 mb-3">
                <h4 className="text-xs font-semibold text-purple-300 mb-2">Cubes</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Material Type</label>
                    <select value={cubeMaterialType} onChange={(e) => setCubeMaterialType(e.target.value as any)} className="w-full bg-gray-700 text-white text-xs px-2 py-1.5 rounded cursor-pointer">
                      <option value="basic">Basic (Unlit)</option>
                      <option value="standard">Standard (PBR)</option>
                      <option value="phong">Phong (Shiny)</option>
                      <option value="lambert">Lambert (Matte)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Color</label>
                    <input type="color" value={cubeColor} onChange={(e) => setCubeColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label htmlFor="cubeOpacity" className="text-xs text-gray-400 block mb-1">Opacity: {cubeOpacity.toFixed(2)}</label>
                    <input type="range" id="cubeOpacity" name="cubeOpacity" min="0" max="1" step="0.05" value={cubeOpacity} onChange={(e) => setCubeOpacity(parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                  </div>
                  {cubeMaterialType === 'standard' && (
                    <>
                      <div>
                        <label htmlFor="cubeMetalness" className="text-xs text-gray-400 block mb-1">Metalness: {cubeMetalness.toFixed(2)}</label>
                        <input type="range" id="cubeMetalness" name="cubeMetalness" min="0" max="1" step="0.05" value={cubeMetalness} onChange={(e) => setCubeMetalness(parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                      </div>
                      <div>
                        <label htmlFor="cubeRoughness" className="text-xs text-gray-400 block mb-1">Roughness: {cubeRoughness.toFixed(2)}</label>
                        <input type="range" id="cubeRoughness" name="cubeRoughness" min="0" max="1" step="0.05" value={cubeRoughness} onChange={(e) => setCubeRoughness(parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="cubeWireframe" checked={cubeWireframe} onChange={(e) => setCubeWireframe(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                    <label htmlFor="cubeWireframe" className="text-xs text-white cursor-pointer">Wireframe</label>
                  </div>
                </div>
              </div>
              
              {/* Octahedrons */}
              <div className="bg-gray-800 rounded p-3 mb-3">
                <h4 className="text-xs font-semibold text-cyan-300 mb-2">Octahedrons</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Material Type</label>
                    <select value={octahedronMaterialType} onChange={(e) => setOctahedronMaterialType(e.target.value as any)} className="w-full bg-gray-700 text-white text-xs px-2 py-1.5 rounded cursor-pointer">
                      <option value="basic">Basic (Unlit)</option>
                      <option value="standard">Standard (PBR)</option>
                      <option value="phong">Phong (Shiny)</option>
                      <option value="lambert">Lambert (Matte)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Color</label>
                    <input type="color" value={octahedronColor} onChange={(e) => setOctahedronColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label htmlFor="octahedronOpacity" className="text-xs text-gray-400 block mb-1">Opacity: {octahedronOpacity.toFixed(2)}</label>
                    <input type="range" id="octahedronOpacity" name="octahedronOpacity" min="0" max="1" step="0.05" value={octahedronOpacity} onChange={(e) => setOctahedronOpacity(parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                  </div>
                  {octahedronMaterialType === 'standard' && (
                    <>
                      <div>
                        <label htmlFor="octahedronMetalness" className="text-xs text-gray-400 block mb-1">Metalness: {octahedronMetalness.toFixed(2)}</label>
                        <input type="range" id="octahedronMetalness" name="octahedronMetalness" min="0" max="1" step="0.05" value={octahedronMetalness} onChange={(e) => setOctahedronMetalness(parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                      </div>
                      <div>
                        <label htmlFor="octahedronRoughness" className="text-xs text-gray-400 block mb-1">Roughness: {octahedronRoughness.toFixed(2)}</label>
                        <input type="range" id="octahedronRoughness" name="octahedronRoughness" min="0" max="1" step="0.05" value={octahedronRoughness} onChange={(e) => setOctahedronRoughness(parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="octahedronWireframe" checked={octahedronWireframe} onChange={(e) => setOctahedronWireframe(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                    <label htmlFor="octahedronWireframe" className="text-xs text-white cursor-pointer">Wireframe</label>
                  </div>
                </div>
              </div>
              
              {/* Tetrahedrons */}
              <div className="bg-gray-800 rounded p-3 mb-3">
                <h4 className="text-xs font-semibold text-pink-300 mb-2">Tetrahedrons</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Material Type</label>
                    <select value={tetrahedronMaterialType} onChange={(e) => setTetrahedronMaterialType(e.target.value as any)} className="w-full bg-gray-700 text-white text-xs px-2 py-1.5 rounded cursor-pointer">
                      <option value="basic">Basic (Unlit)</option>
                      <option value="standard">Standard (PBR)</option>
                      <option value="phong">Phong (Shiny)</option>
                      <option value="lambert">Lambert (Matte)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Color</label>
                    <input type="color" value={tetrahedronColor} onChange={(e) => setTetrahedronColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label htmlFor="tetrahedronOpacity" className="text-xs text-gray-400 block mb-1">Opacity: {tetrahedronOpacity.toFixed(2)}</label>
                    <input type="range" id="tetrahedronOpacity" name="tetrahedronOpacity" min="0" max="1" step="0.05" value={tetrahedronOpacity} onChange={(e) => setTetrahedronOpacity(parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                  </div>
                  {tetrahedronMaterialType === 'standard' && (
                    <>
                      <div>
                        <label htmlFor="tetrahedronMetalness" className="text-xs text-gray-400 block mb-1">Metalness: {tetrahedronMetalness.toFixed(2)}</label>
                        <input type="range" id="tetrahedronMetalness" name="tetrahedronMetalness" min="0" max="1" step="0.05" value={tetrahedronMetalness} onChange={(e) => setTetrahedronMetalness(parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                      </div>
                      <div>
                        <label htmlFor="tetrahedronRoughness" className="text-xs text-gray-400 block mb-1">Roughness: {tetrahedronRoughness.toFixed(2)}</label>
                        <input type="range" id="tetrahedronRoughness" name="tetrahedronRoughness" min="0" max="1" step="0.05" value={tetrahedronRoughness} onChange={(e) => setTetrahedronRoughness(parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="tetrahedronWireframe" checked={tetrahedronWireframe} onChange={(e) => setTetrahedronWireframe(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                    <label htmlFor="tetrahedronWireframe" className="text-xs text-white cursor-pointer">Wireframe</label>
                  </div>
                </div>
              </div>
              
              {/* Sphere */}
              <div className="bg-gray-800 rounded p-3 mb-3">
                <h4 className="text-xs font-semibold text-purple-300 mb-2">Sphere</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Material Type</label>
                    <select value={sphereMaterialType} onChange={(e) => setSphereMaterialType(e.target.value as any)} className="w-full bg-gray-700 text-white text-xs px-2 py-1.5 rounded cursor-pointer">
                      <option value="basic">Basic (Unlit)</option>
                      <option value="standard">Standard (PBR)</option>
                      <option value="phong">Phong (Shiny)</option>
                      <option value="lambert">Lambert (Matte)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Color</label>
                    <input type="color" value={sphereColor} onChange={(e) => setSphereColor(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                  </div>
                  <div>
                    <label htmlFor="sphereOpacity" className="text-xs text-gray-400 block mb-1">Opacity: {sphereOpacity.toFixed(2)}</label>
                    <input type="range" id="sphereOpacity" name="sphereOpacity" min="0" max="1" step="0.05" value={sphereOpacity} onChange={(e) => setSphereOpacity(parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                  </div>
                  {sphereMaterialType === 'standard' && (
                    <>
                      <div>
                        <label htmlFor="sphereMetalness" className="text-xs text-gray-400 block mb-1">Metalness: {sphereMetalness.toFixed(2)}</label>
                        <input type="range" id="sphereMetalness" name="sphereMetalness" min="0" max="1" step="0.05" value={sphereMetalness} onChange={(e) => setSphereMetalness(parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                      </div>
                      <div>
                        <label htmlFor="sphereRoughness" className="text-xs text-gray-400 block mb-1">Roughness: {sphereRoughness.toFixed(2)}</label>
                        <input type="range" id="sphereRoughness" name="sphereRoughness" min="0" max="1" step="0.05" value={sphereRoughness} onChange={(e) => setSphereRoughness(parseFloat(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="sphereWireframe" checked={sphereWireframe} onChange={(e) => setSphereWireframe(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                    <label htmlFor="sphereWireframe" className="text-xs text-white cursor-pointer">Wireframe</label>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setCubeColor('#8a2be2'); setCubeWireframe(true); setCubeOpacity(0.6); setCubeMaterialType('basic'); setCubeMetalness(0.5); setCubeRoughness(0.5);
                  setOctahedronColor('#40e0d0'); setOctahedronWireframe(true); setOctahedronOpacity(0.5); setOctahedronMaterialType('basic'); setOctahedronMetalness(0.5); setOctahedronRoughness(0.5);
                  setTetrahedronColor('#c8b4ff'); setTetrahedronWireframe(false); setTetrahedronOpacity(0.7); setTetrahedronMaterialType('basic'); setTetrahedronMetalness(0.5); setTetrahedronRoughness(0.5);
                  setSphereColor('#8a2be2'); setSphereWireframe(true); setSphereOpacity(0.4); setSphereMaterialType('basic'); setSphereMetalness(0.5); setSphereRoughness(0.5);
                }}
                className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-white w-full"
              >
                Reset All Materials to Defaults
              </button>
            </div>
          </div>
        )}

        {/* Camera Settings Tab */}
        {activeTab === 'camera' && (
          <div>
            <div className="bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">📷 Global Camera Controls</h3>
              <p className="text-xs text-gray-400 mb-3">These settings apply when no keyframes are active.</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Zoom Distance: {cameraDistance}</label>
                  <input type="range" id="cameraDistance" name="cameraDistance" min="5" max="50" step="1" value={cameraDistance} onChange={(e) => setCameraDistance(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Height Offset: {cameraHeight}</label>
                  <input type="range" id="cameraHeight" name="cameraHeight" min="-10" max="10" step="1" value={cameraHeight} onChange={(e) => setCameraHeight(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                </div>
                <p className="text-xs text-gray-400 mt-2">ℹ️ Camera rotation is controlled via keyframes below. Use distance and height as defaults when no keyframes are active.</p>
                <button onClick={resetCamera} className="w-full bg-gray-600 hover:bg-gray-500 text-white text-xs py-2 rounded mt-2">Reset Camera</button>
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 mt-4">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎬 HUD Display Options</h3>
              <p className="text-xs text-gray-400 mb-3">Control what information is shown on the visualization canvas.</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="showFilename" checked={showFilename} onChange={(e) => setShowFilename(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                  <label htmlFor="showFilename" className="text-sm text-white cursor-pointer">Show Audio Filename</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="showBorder" checked={showBorder} onChange={(e) => setShowBorder(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                  <label htmlFor="showBorder" className="text-sm text-white cursor-pointer">Show Canvas Border</label>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 mt-4">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🔍 Camera Rig Visual Hints</h3>
              <p className="text-xs text-gray-400 mb-3">Toggle visual guides to help understand camera positioning and movement.</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="showRigHints" 
                    checked={showRigHints} 
                    onChange={(e) => setShowRigHints(e.target.checked)} 
                    className="w-4 h-4 cursor-pointer" 
                  />
                  <label htmlFor="showRigHints" className="text-sm text-white cursor-pointer font-semibold">Enable Visual Hints</label>
                </div>
                
                {showRigHints && (
                  <div className="ml-6 space-y-2 mt-2 border-l-2 border-cyan-500 pl-3">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="showRigPosition" 
                        checked={showRigPosition} 
                        onChange={(e) => setShowRigPosition(e.target.checked)} 
                        className="w-4 h-4 cursor-pointer" 
                      />
                      <label htmlFor="showRigPosition" className="text-xs text-gray-300 cursor-pointer">
                        <span className="text-cyan-400">●</span> Camera Position Marker
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="showRigTarget" 
                        checked={showRigTarget} 
                        onChange={(e) => setShowRigTarget(e.target.checked)} 
                        className="w-4 h-4 cursor-pointer" 
                      />
                      <label htmlFor="showRigTarget" className="text-xs text-gray-300 cursor-pointer">
                        <span className="text-yellow-400">●</span> Look-At Target Marker
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="showRigPath" 
                        checked={showRigPath} 
                        onChange={(e) => setShowRigPath(e.target.checked)} 
                        className="w-4 h-4 cursor-pointer" 
                      />
                      <label htmlFor="showRigPath" className="text-xs text-gray-300 cursor-pointer">
                        <span className="text-purple-400">━</span> Keyframe Path Preview
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="showRigGrid" 
                        checked={showRigGrid} 
                        onChange={(e) => setShowRigGrid(e.target.checked)} 
                        className="w-4 h-4 cursor-pointer" 
                      />
                      <label htmlFor="showRigGrid" className="text-xs text-gray-300 cursor-pointer">
                        <span className="text-gray-500">▦</span> Reference Grid
                      </label>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Tip:</strong> Use 'G' key to quickly toggle hints on/off during playback
                </p>
              </div>
            </div>
            
            {/* Letterbox Animation with Timeline */}
            <div className="bg-gray-700 rounded-lg p-3 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-cyan-400">🎬 Letterbox (Cinematic Bars)</h3>
                  <p className="text-xs text-gray-400 mt-1">Create dynamic letterbox animations with timeline keyframes</p>
                </div>
                <button
                  onClick={() => {
                    const time = currentTime;
                    const newKeyframe = {
                      id: nextLetterboxKeyframeId.current++,
                      time,
                      targetSize: letterboxSize || 50,
                      duration: 1.0,
                      mode: 'smooth' as const,
                      invert: activeLetterboxInvert
                    };
                    setLetterboxKeyframes([...letterboxKeyframes, newKeyframe].sort((a, b) => a.time - b.time));
                    setShowLetterbox(true);
                    setUseLetterboxAnimation(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1"
                >
                  <Plus size={14} /> Add at {Math.floor(currentTime)}s
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="showLetterbox" 
                    checked={showLetterbox} 
                    onChange={(e) => setShowLetterbox(e.target.checked)} 
                    className="w-4 h-4 cursor-pointer" 
                  />
                  <label htmlFor="showLetterbox" className="text-sm text-white cursor-pointer font-semibold">
                    Enable Letterbox
                  </label>
                </div>

                {showLetterbox && (
                  <div className="ml-7 space-y-3">
                    <div>
                      <label className="text-xs text-gray-300 block mb-1">Max Curtain Height: {maxLetterboxHeight}px</label>
                      <input 
                        type="range"
                        min="50"
                        max="500"
                        step="10"
                        value={maxLetterboxHeight}
                        onChange={(e) => setMaxLetterboxHeight(parseInt(e.target.value) || DEFAULT_MAX_LETTERBOX_HEIGHT)}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600"
                      />
                      <p className="text-xs text-gray-400 mt-1">Controls maximum bar height when at 100%</p>
                    </div>

                    {letterboxKeyframes.length > 0 && (
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="useLetterboxAnimation" 
                          checked={useLetterboxAnimation} 
                          onChange={(e) => setUseLetterboxAnimation(e.target.checked)} 
                          className="w-4 h-4 cursor-pointer" 
                        />
                        <label htmlFor="useLetterboxAnimation" className="text-sm text-white cursor-pointer">
                          Use Timeline Animation ({letterboxKeyframes.length} keyframe{letterboxKeyframes.length !== 1 ? 's' : ''})
                        </label>
                      </div>
                    )}

                    {letterboxKeyframes.length === 0 && (
                      <div className="bg-gray-800 rounded p-2">
                        <p className="text-xs text-gray-400 text-center">No keyframes yet. Click "Add at {Math.floor(currentTime)}s" to create one</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Visualization */}
                {showLetterbox && letterboxKeyframes.length > 0 && (
                  <div className="mt-4 bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLetterboxSettingsExpanded(!letterboxSettingsExpanded)}
                          className="text-gray-300 hover:text-white transition-colors"
                        >
                          <ChevronDown 
                            size={16} 
                            className={`transition-transform ${letterboxSettingsExpanded ? '' : '-rotate-90'}`}
                          />
                        </button>
                        <span className="text-xs font-semibold text-gray-300">Timeline</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatTime(duration)}</span>
                    </div>
                    
                    {/* Timeline bar with keyframe markers */}
                    <div className="relative bg-gray-900 rounded h-12 mb-3">
                      {/* Current time indicator */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10"
                        style={{ left: `${(currentTime / duration) * 100}%` }}
                      >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full"></div>
                      </div>
                      
                      {/* Keyframe markers */}
                      {letterboxKeyframes.map((kf, idx) => (
                        <div
                          key={kf.id || idx}
                          className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
                          style={{ left: `${(kf.time / duration) * 100}%` }}
                          title={`${formatTime(kf.time)} - ${kf.targetSize}px`}
                        >
                          <div className="w-3 h-8 bg-purple-500 hover:bg-purple-400 rounded group-hover:scale-110 transition-transform flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                          <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-gray-700 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {formatTime(kf.time)}: {kf.targetSize}px
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Collapsible Keyframe List */}
                    {letterboxSettingsExpanded && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                      {letterboxKeyframes.map((keyframe, index) => (
                        <div key={keyframe.id || index} className="bg-gray-900 rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-white font-semibold text-sm">
                                {formatTime(keyframe.time)}
                              </span>
                            </div>
                            <button 
                              onClick={() => {
                                const newKeyframes = letterboxKeyframes.filter((_, i) => i !== index);
                                setLetterboxKeyframes(newKeyframes);
                                if (newKeyframes.length === 0) {
                                  setUseLetterboxAnimation(false);
                                }
                              }}
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Time (s)</label>
                              <input 
                                type="number"
                                min="0"
                                max={duration}
                                step="0.1"
                                value={keyframe.time}
                                onChange={(e) => {
                                  const newKeyframes = [...letterboxKeyframes];
                                  newKeyframes[index] = { ...keyframe, time: parseFloat(e.target.value) || 0 };
                                  setLetterboxKeyframes(newKeyframes.sort((a, b) => a.time - b.time));
                                }}
                                className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Size (0-100)</label>
                              <input 
                                type="number"
                                min="0"
                                max="100"
                                step="5"
                                value={keyframe.targetSize}
                                onChange={(e) => {
                                  const newKeyframes = [...letterboxKeyframes];
                                  newKeyframes[index] = { ...keyframe, targetSize: parseInt(e.target.value) || 0 };
                                  setLetterboxKeyframes(newKeyframes);
                                }}
                                className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Duration (s)</label>
                              <input 
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={keyframe.duration}
                                onChange={(e) => {
                                  const newKeyframes = [...letterboxKeyframes];
                                  newKeyframes[index] = { ...keyframe, duration: parseFloat(e.target.value) || 0 };
                                  setLetterboxKeyframes(newKeyframes);
                                }}
                                className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-300 block mb-1">Mode</label>
                              <select 
                                value={keyframe.mode}
                                onChange={(e) => {
                                  const newKeyframes = [...letterboxKeyframes];
                                  newKeyframes[index] = { ...keyframe, mode: e.target.value as 'smooth' | 'instant' };
                                  setLetterboxKeyframes(newKeyframes);
                                }}
                                className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded"
                              >
                                <option value="smooth">Smooth</option>
                                <option value="instant">Instant</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox"
                                id={`invert-${keyframe.id || index}`}
                                checked={keyframe.invert}
                                onChange={(e) => {
                                  const newKeyframes = [...letterboxKeyframes];
                                  newKeyframes[index] = { ...keyframe, invert: e.target.checked };
                                  setLetterboxKeyframes(newKeyframes);
                                }}
                                className="w-4 h-4 cursor-pointer"
                              />
                              <label htmlFor={`invert-${keyframe.id || index}`} className="text-xs text-gray-300 cursor-pointer">
                                Curtain Mode (opens/closes from edges)
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <div>
            <div className="bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎨 Visual Effects</h3>
              <p className="text-xs text-gray-400 mb-3">Customize the look and feel of the visualization.</p>
              <div className="space-y-3">
                {/* Skybox Type Selection */}
                <div>
                  <label className="text-xs text-gray-400 block mb-2">Background Type</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <button 
                      onClick={() => setSkyboxType('color')}
                      className={`px-2 py-2 rounded text-xs ${skyboxType === 'color' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                    >
                      Solid Color
                    </button>
                    <button 
                      onClick={() => setSkyboxType('gradient')}
                      className={`px-2 py-2 rounded text-xs ${skyboxType === 'gradient' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                    >
                      Gradient
                    </button>
                    <button 
                      onClick={() => setSkyboxType('image')}
                      className={`px-2 py-2 rounded text-xs ${skyboxType === 'image' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                    >
                      Image
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setSkyboxType('stars')}
                      className={`px-2 py-2 rounded text-xs ${skyboxType === 'stars' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                    >
                      ✨ Stars
                    </button>
                    <button 
                      onClick={() => setSkyboxType('galaxy')}
                      className={`px-2 py-2 rounded text-xs ${skyboxType === 'galaxy' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                    >
                      🌌 Galaxy
                    </button>
                    <button 
                      onClick={() => setSkyboxType('nebula')}
                      className={`px-2 py-2 rounded text-xs ${skyboxType === 'nebula' ? 'bg-cyan-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                    >
                      🌠 Nebula
                    </button>
                  </div>
                </div>
                
                {/* Color Mode Controls */}
                {skyboxType === 'color' && (
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Background Color</label>
                    <input type="color" id="backgroundColor" name="backgroundColor" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                  </div>
                )}
                
                {/* Gradient Mode Controls */}
                {skyboxType === 'gradient' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Top Color (Sky)</label>
                      <input type="color" id="skyboxGradientTop" name="skyboxGradientTop" value={skyboxGradientTop} onChange={(e) => setSkyboxGradientTop(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Bottom Color (Ground)</label>
                      <input type="color" id="skyboxGradientBottom" name="skyboxGradientBottom" value={skyboxGradientBottom} onChange={(e) => setSkyboxGradientBottom(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                    </div>
                  </div>
                )}
                
                {/* Image Mode Controls */}
                {skyboxType === 'image' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Equirectangular Image URL</label>
                      <input 
                        type="text" 
                        id="skyboxImageUrl" 
                        name="skyboxImageUrl"
                        value={skyboxImageUrl} 
                        onChange={(e) => setSkyboxImageUrl(e.target.value)} 
                        placeholder="https://example.com/skybox.jpg"
                        className="w-full bg-gray-600 text-white text-xs px-3 py-2 rounded" 
                      />
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      Use equirectangular (360°) panoramic images. Try free resources like <a href="https://polyhaven.com/hdris" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Poly Haven</a>.
                    </p>
                  </div>
                )}
                
                {/* Stars Mode Controls */}
                {skyboxType === 'stars' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Star Count: {starCount}</label>
                      <input 
                        type="range" 
                        min="1000" 
                        max="10000" 
                        step="500" 
                        value={starCount} 
                        onChange={(e) => setStarCount(Number(e.target.value))} 
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                      />
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      Procedurally generated star field with random distribution.
                    </p>
                  </div>
                )}
                
                {/* Galaxy Mode Controls */}
                {skyboxType === 'galaxy' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Star Count: {starCount}</label>
                      <input 
                        type="range" 
                        min="1000" 
                        max="10000" 
                        step="500" 
                        value={starCount} 
                        onChange={(e) => setStarCount(Number(e.target.value))} 
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Galaxy Color</label>
                      <input type="color" id="galaxyColor" name="galaxyColor" value={galaxyColor} onChange={(e) => setGalaxyColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      Spiral galaxy with colored star clusters.
                    </p>
                  </div>
                )}
                
                {/* Nebula Mode Controls */}
                {skyboxType === 'nebula' && (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Star Count: {starCount}</label>
                      <input 
                        type="range" 
                        min="1000" 
                        max="10000" 
                        step="500" 
                        value={starCount} 
                        onChange={(e) => setStarCount(Number(e.target.value))} 
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Nebula Color 1</label>
                      <input type="color" id="nebulaColor1" name="nebulaColor1" value={nebulaColor1} onChange={(e) => setNebulaColor1(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Nebula Color 2</label>
                      <input type="color" id="nebulaColor2" name="nebulaColor2" value={nebulaColor2} onChange={(e) => setNebulaColor2(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      Colorful nebula with gas clouds and stars.
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Border Color</label>
                  <input type="color" id="borderColor" name="borderColor" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                </div>
              </div>
            </div>
            
          </div>
        )}

        {/* Keyframes Tab */}

        {/* Post-FX Tab */}
        {activeTab === 'postfx' && (
          <div>
            {/* Blend Mode Section */}
            <div className="mb-4 bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎭 Blend Mode</h3>
              <p className="text-xs text-gray-400 mb-3">Layer blending affects how objects combine visually</p>
              <select 
                value={blendMode} 
                onChange={(e) => setBlendMode(e.target.value as any)}
                className="w-full bg-gray-600 text-white text-sm px-3 py-2 rounded"
              >
                <option value="normal">Normal (Standard)</option>
                <option value="additive">Additive (Brighten)</option>
                <option value="multiply">Multiply (Darken)</option>
                <option value="screen">Screen (Lighten)</option>
              </select>
            </div>

            {/* Vignette Section */}
            <div className="mb-4 bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🌫️ Vignette</h3>
              <p className="text-xs text-gray-400 mb-3">Edge darkening effect for cinematic look</p>
              
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-400">Strength</label>
                  <span className="text-xs text-cyan-300">{vignetteStrength.toFixed(2)}</span>
                </div>
                <input 
                  type="range" id="vignetteStrength" name="vignetteStrength" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={vignetteStrength} 
                  onChange={(e) => setVignetteStrength(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-400">Softness</label>
                  <span className="text-xs text-cyan-300">{vignetteSoftness.toFixed(2)}</span>
                </div>
                <input 
                  type="range" id="vignetteSoftness" name="vignetteSoftness" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={vignetteSoftness} 
                  onChange={(e) => setVignetteSoftness(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <button 
                onClick={() => { setVignetteStrength(0); setVignetteSoftness(0.5); }}
                className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-white w-full"
              >
                Reset Vignette
              </button>
            </div>

            {/* Color Grading Section */}
            <div className="mb-4 bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎨 Color Grading</h3>
              <p className="text-xs text-gray-400 mb-3">Adjust overall image tone and color</p>
              
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-400">Saturation</label>
                  <span className="text-xs text-cyan-300">{colorSaturation.toFixed(2)}x</span>
                </div>
                <input 
                  type="range" id="colorSaturation" name="colorSaturation" 
                  min="0" 
                  max="2" 
                  step="0.01" 
                  value={colorSaturation} 
                  onChange={(e) => setColorSaturation(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">0 = grayscale, 1 = normal, 2 = vivid</p>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-400">Contrast</label>
                  <span className="text-xs text-cyan-300">{colorContrast.toFixed(2)}x</span>
                </div>
                <input 
                  type="range" id="colorContrast" name="colorContrast" 
                  min="0.5" 
                  max="2" 
                  step="0.01" 
                  value={colorContrast} 
                  onChange={(e) => setColorContrast(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Lower = flat, higher = punchy</p>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-400">Gamma</label>
                  <span className="text-xs text-cyan-300">{colorGamma.toFixed(2)}</span>
                </div>
                <input 
                  type="range" id="colorGamma" name="colorGamma" 
                  min="0.5" 
                  max="2" 
                  step="0.01" 
                  value={colorGamma} 
                  onChange={(e) => setColorGamma(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Brightness curve adjustment</p>
              </div>

              <button 
                onClick={() => { setColorSaturation(1.0); setColorContrast(1.0); setColorGamma(1.0); }}
                className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-white w-full mb-3"
              >
                Reset Color Grading
              </button>
            </div>

            {/* Color Tint Section */}
            <div className="mb-4 bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🌈 Color Tint</h3>
              <p className="text-xs text-gray-400 mb-3">Apply color cast for mood and atmosphere</p>
              
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-red-400">Red Tint</label>
                  <span className="text-xs text-cyan-300">{colorTintR.toFixed(2)}x</span>
                </div>
                <input 
                  type="range" id="colorTintR" name="colorTintR" 
                  min="0" 
                  max="2" 
                  step="0.01" 
                  value={colorTintR} 
                  onChange={(e) => setColorTintR(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-green-400">Green Tint</label>
                  <span className="text-xs text-cyan-300">{colorTintG.toFixed(2)}x</span>
                </div>
                <input 
                  type="range" id="colorTintG" name="colorTintG" 
                  min="0" 
                  max="2" 
                  step="0.01" 
                  value={colorTintG} 
                  onChange={(e) => setColorTintG(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-blue-400">Blue Tint</label>
                  <span className="text-xs text-cyan-300">{colorTintB.toFixed(2)}x</span>
                </div>
                <input 
                  type="range" id="colorTintB" name="colorTintB" 
                  min="0" 
                  max="2" 
                  step="0.01" 
                  value={colorTintB} 
                  onChange={(e) => setColorTintB(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <button 
                onClick={() => { setColorTintR(1.0); setColorTintG(1.0); setColorTintB(1.0); }}
                className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-white w-full"
              >
                Reset Color Tint
              </button>
            </div>
          </div>
        )}

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div>
            {/* Timeline Visualization */}
            <div className="bg-gray-700 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-purple-400">🎬 Preset Timeline</h3>
                <button
                  onClick={() => setPresetSettingsExpanded(!presetSettingsExpanded)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title={presetSettingsExpanded ? "Collapse settings" : "Expand settings"}
                >
                  <ChevronDown 
                    size={20} 
                    className={`transition-transform ${presetSettingsExpanded ? '' : '-rotate-90'}`}
                  />
                </button>
              </div>
              
              {/* Timeline bar visualization with segments */}
              <div className="relative bg-gray-800 rounded h-12 mb-3 overflow-hidden">
                {/* Preset segments */}
                {presetKeyframes.map(kf => {
                  const startPos = duration > 0 ? Math.min((kf.time / duration) * 100, 100) : 0;
                  const endPos = duration > 0 ? Math.min((kf.endTime / duration) * 100, 100) : 0;
                  const width = Math.max(endPos - startPos, 0.5); // Minimum visible width
                  const animType = animationTypes.find(a => a.value === kf.preset);
                  
                  // Color coding by preset type
                  const colors: Record<string, string> = {
                    orbit: 'bg-blue-500',
                    explosion: 'bg-orange-500',
                    tunnel: 'bg-green-500',
                    wave: 'bg-cyan-500',
                    spiral: 'bg-purple-500',
                    chill: 'bg-pink-500',
                    pulse: 'bg-yellow-500',
                    vortex: 'bg-red-500',
                    dragon: 'bg-indigo-500',
                    hammerhead: 'bg-teal-500'
                  };
                  const colorClass = colors[kf.preset] || 'bg-gray-500';
                  
                  return (
                    <div
                      key={kf.id}
                      className={`absolute top-0 bottom-0 ${colorClass} opacity-70 hover:opacity-90 transition-opacity cursor-pointer border-r-2 border-white`}
                      style={{ left: `${startPos}%`, width: `${width}%` }}
                      title={`${animType?.label || kf.preset}: ${formatTime(kf.time)} - ${formatTime(kf.endTime)} (${kf.speed}x speed)`}
                    >
                      <div className="absolute top-1 left-1 text-xs text-white font-semibold truncate px-1">
                        {animType?.icon}
                      </div>
                    </div>
                  );
                })}
                
                {/* Current time indicator */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 pointer-events-none z-10"
                  style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              
              {/* Quick add button */}
              <button
                onClick={handleAddPresetKeyframe}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-2 rounded flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                Add at {formatTime(currentTime)}
              </button>
            </div>
            
            {/* Collapsible keyframe settings */}
            {presetSettingsExpanded && (
              <div className="space-y-3">
                {presetKeyframes.map((kf, index) => {
                  const animType = animationTypes.find(a => a.value === kf.preset);
                  const duration = kf.endTime - kf.time;
                  return (
                    <div key={kf.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-400 font-mono text-sm">
                          #{index + 1} - {formatTime(kf.time)} → {formatTime(kf.endTime)} ({duration.toFixed(1)}s)
                        </span>
                        <button
                          onClick={() => handleDeletePresetKeyframe(kf.id)}
                          className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={presetKeyframes.length <= 1}
                          title={presetKeyframes.length <= 1 ? "Cannot delete last keyframe" : "Delete keyframe"}
                          aria-disabled={presetKeyframes.length <= 1}
                          aria-label={presetKeyframes.length <= 1 ? "Cannot delete last preset keyframe" : "Delete preset keyframe"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Start Time</label>
                          <input
                            type="text"
                            id={`preset-kf-time-${kf.id}`}
                            name={`preset-kf-time-${kf.id}`}
                            value={formatTime(kf.time)}
                            onChange={(e) => handleUpdatePresetKeyframe(kf.id, 'time', parseTime(e.target.value))}
                            className="w-full bg-gray-600 text-white text-sm px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">End Time</label>
                          <input
                            type="text"
                            id={`preset-kf-endtime-${kf.id}`}
                            name={`preset-kf-endtime-${kf.id}`}
                            value={formatTime(kf.endTime)}
                            onChange={(e) => handleUpdatePresetKeyframe(kf.id, 'endTime', parseTime(e.target.value))}
                            className="w-full bg-gray-600 text-white text-sm px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Speed</label>
                          <input
                            type="number"
                            id={`preset-kf-speed-${kf.id}`}
                            name={`preset-kf-speed-${kf.id}`}
                            min="0.1"
                            max="3.0"
                            step="0.1"
                            value={kf.speed}
                            onChange={(e) => handleUpdatePresetKeyframe(kf.id, 'speed', parseFloat(e.target.value) || 1.0)}
                            className="w-full bg-gray-600 text-white text-sm px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Preset</label>
                        <select
                          value={kf.preset}
                          onChange={(e) => handleUpdatePresetKeyframe(kf.id, 'preset', e.target.value)}
                          className="w-full bg-gray-600 text-white text-sm px-2 py-1 rounded"
                        >
                          {animationTypes.map(t => (
                            <option key={t.value} value={t.value}>
                              {t.icon} {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Preview of current preset */}
                      <div className="mt-2 px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                        {animType?.icon} {animType?.label || kf.preset} • {kf.speed}x speed • {duration.toFixed(1)}s duration
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PHASE 5: Text Animator Tab */}
        {activeTab === 'textAnimator' && (
          <div>
            {/* Song Name Overlay Section */}
            <div className="mb-4 bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎤 Song Name Overlay</h3>
              <div className="mb-3 pb-3 border-b border-gray-600">
                <label className="text-xs text-gray-400 block mb-2">Custom Font (.typeface.json)</label>
                <input type="file" id="custom-font-typeface-json" name="custom-font-typeface-json" accept=".json,.typeface.json" onChange={(e) => { if (e.target.files && e.target.files[0]) loadCustomFont(e.target.files[0]); }} className="block flex-1 text-sm text-gray-300 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer" />
                <p className="text-xs text-gray-500 mt-1">Current: {customFontName}</p>
              </div>
              <div className="flex gap-2 mb-2">
                <input type="text" id="customSongName" name="customSongName" value={customSongName} onChange={(e) => setCustomSongName(e.target.value)} placeholder="Enter song name" className="flex-1 bg-gray-600 text-white text-sm px-3 py-2 rounded" />
                <button onClick={toggleSongName} disabled={!fontLoaded} className={`px-4 py-2 rounded font-semibold ${fontLoaded ? (showSongName ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700') : 'bg-gray-500 cursor-not-allowed'} text-white`}>{!fontLoaded ? 'Loading...' : showSongName ? 'Hide' : 'Show'}</button>
              </div>
              <p className="text-xs text-gray-400">3D text that bounces to the music!</p>
            </div>

            {/* Text Animator Section */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-purple-400 mb-2">📝 Text Animator</h3>
              <p className="text-sm text-gray-400 mb-4">Create per-character animated text with customizable offsets and stagger timing</p>
              
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => createTextAnimatorKeyframe(currentTime)} 
                  disabled={!fontLoaded}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Plus size={16} /> Add Text Keyframe
                </button>
              </div>

              {!fontLoaded && (
                <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3 mb-4">
                  <p className="text-yellow-400 text-sm">⚠️ Font not loaded. Upload a font file to use text animator.</p>
                </div>
              )}

              {/* Text Keyframes List */}
              <div className="space-y-3">
                {textAnimatorKeyframes.map(kf => (
                  <div key={kf.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-mono text-sm">{formatTime(kf.time)}</span>
                        <span className="text-white font-semibold">{kf.text}</span>
                      </div>
                      <button 
                        onClick={() => deleteTextAnimatorKeyframe(kf.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Text</label>
                        <input 
                          type="text" id="text" name="text" 
                          value={kf.text}
                          onChange={(e) => updateTextAnimatorKeyframe(kf.id, { text: e.target.value })}
                          className="w-full bg-gray-600 text-white text-sm px-3 py-1 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Animation</label>
                        <select 
                          value={kf.animation}
                          onChange={(e) => updateTextAnimatorKeyframe(kf.id, { animation: e.target.value })}
                          className="w-full bg-gray-600 text-white text-sm px-3 py-1 rounded"
                        >
                          <option value="fade">Fade In</option>
                          <option value="slide">Slide In</option>
                          <option value="scale">Scale In</option>
                          <option value="bounce">Bounce</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                    </div>

                    {kf.animation === 'slide' && (
                      <div className="mb-3">
                        <label className="text-xs text-gray-400 block mb-1">Direction</label>
                        <select 
                          value={kf.direction}
                          onChange={(e) => updateTextAnimatorKeyframe(kf.id, { direction: e.target.value })}
                          className="w-full bg-gray-600 text-white text-sm px-3 py-1 rounded"
                        >
                          <option value="up">Up</option>
                          <option value="down">Down</option>
                          <option value="left">Left</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Stagger (s)</label>
                        <input 
                          type="number" id="stagger-s" name="stagger-s" 
                          step="0.01"
                          min="0"
                          max="1"
                          value={kf.stagger}
                          onChange={(e) => updateTextAnimatorKeyframe(kf.id, { stagger: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-gray-600 text-white text-sm px-3 py-1 rounded"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Duration (s)</label>
                        <input 
                          type="number" id="duration-s-2" name="duration-s-2" 
                          step="0.1"
                          min="0.1"
                          max="5"
                          value={kf.duration}
                          onChange={(e) => updateTextAnimatorKeyframe(kf.id, { duration: parseFloat(e.target.value) || 0.5 })}
                          className="w-full bg-gray-600 text-white text-sm px-3 py-1 rounded"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input 
                          type="checkbox" id="checkbox-field-3973" name="checkbox-field-3973" 
                          checked={kf.visible}
                          onChange={(e) => updateTextAnimatorKeyframe(kf.id, { visible: e.target.checked })}
                          className="rounded"
                        />
                        Visible
                      </label>
                    </div>
                  </div>
                ))}

                {textAnimatorKeyframes.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No text keyframes yet. Click "Add Text Keyframe" to create one.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PHASE 5: Masks Tab */}
        {activeTab === 'masks' && (
          <div>
            {/* Implementation Status Notice */}
            <div className="mb-4 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Masks - Advanced Feature (Not Yet Implemented)</h3>
              <p className="text-xs text-yellow-200 mb-2">
                The Masks feature requires WebGL shader-based rendering or stencil buffer implementation, which is not currently available in the rendering pipeline.
              </p>
              <p className="text-xs text-yellow-200">
                UI controls below allow you to configure mask properties, but they won't affect the visualization until the rendering system is updated with WebGL post-processing support.
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-purple-400 mb-2">🎭 Mask Reveals</h3>
              <p className="text-sm text-gray-400 mb-4">Create shape-based masks with animated reveals and feathering</p>
              
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => createMask('circle')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                  disabled
                >
                  ⭕ Circle Mask
                </button>
                <button 
                  onClick={() => createMask('rectangle')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm cursor-not-allowed opacity-60"
                  disabled
                >
                  ◻️ Rectangle Mask
                </button>
                <button 
                  onClick={() => createMask('custom')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm cursor-not-allowed opacity-60"
                  disabled
                >
                  ✏️ Custom Path
                </button>
              </div>

              {/* Masks List */}
              <div className="space-y-3 mb-6">
                {masks.map(mask => (
                  <div key={mask.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" id="checkbox-field-4043" name="checkbox-field-4043" 
                          checked={mask.enabled}
                          onChange={(e) => updateMask(mask.id, { enabled: e.target.checked })}
                          className="rounded"
                        />
                        <input 
                          type="text" id="text-field-4049" name="text-field-4049" 
                          value={mask.name}
                          onChange={(e) => updateMask(mask.id, { name: e.target.value })}
                          className="bg-gray-600 text-white text-sm px-2 py-1 rounded"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => createMaskRevealKeyframe(mask.id, currentTime)}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded text-xs"
                        >
                          + Keyframe
                        </button>
                        <button 
                          onClick={() => deleteMask(mask.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Blend Mode</label>
                        <select 
                          value={mask.blendMode}
                          onChange={(e) => updateMask(mask.id, { blendMode: e.target.value })}
                          className="w-full bg-gray-600 text-white text-sm px-2 py-1 rounded"
                        >
                          <option value="normal">Normal</option>
                          <option value="add">Add</option>
                          <option value="subtract">Subtract</option>
                          <option value="multiply">Multiply</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Feather: {mask.feather}</label>
                        <input 
                          type="range" id="feather-mask-feather" name="feather-mask-feather" 
                          min="0" 
                          max="100"
                          value={mask.feather}
                          onChange={(e) => updateMask(mask.id, { feather: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {mask.type === 'circle' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Center X</label>
                          <input 
                            type="number" id="center-x" name="center-x" 
                            step="0.01"
                            min="0"
                            max="1"
                            value={mask.center?.x || 0.5}
                            onChange={(e) => updateMask(mask.id, { center: { ...mask.center, x: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Center Y</label>
                          <input 
                            type="number" id="center-y" name="center-y" 
                            step="0.01"
                            min="0"
                            max="1"
                            value={mask.center?.y || 0.5}
                            onChange={(e) => updateMask(mask.id, { center: { x: mask.center?.x || 0.5, y: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Radius</label>
                          <input 
                            type="number" id="radius-1" name="radius-1" 
                            step="0.01"
                            min="0"
                            max="1"
                            value={mask.radius || 0.3}
                            onChange={(e) => updateMask(mask.id, { radius: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                    )}

                    {mask.type === 'rectangle' && mask.rect && (
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">X</label>
                          <input 
                            type="number" id="x" name="x" 
                            step="0.01"
                            min="0"
                            max="1"
                            value={mask.rect.x}
                            onChange={(e) => updateMask(mask.id, { rect: { ...mask.rect, x: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Y</label>
                          <input 
                            type="number" id="y" name="y" 
                            step="0.01"
                            min="0"
                            max="1"
                            value={mask.rect.y}
                            onChange={(e) => updateMask(mask.id, { rect: { ...mask.rect, y: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Width</label>
                          <input 
                            type="number" id="width" name="width" 
                            step="0.01"
                            min="0"
                            max="1"
                            value={mask.rect.width}
                            onChange={(e) => updateMask(mask.id, { rect: { ...mask.rect, width: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Height</label>
                          <input 
                            type="number" id="height-1" name="height-1" 
                            step="0.01"
                            min="0"
                            max="1"
                            value={mask.rect.height}
                            onChange={(e) => updateMask(mask.id, { rect: { ...mask.rect, height: parseFloat(e.target.value) } })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-3">
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input 
                          type="checkbox" id="checkbox-field-4195" name="checkbox-field-4195" 
                          checked={mask.inverted}
                          onChange={(e) => updateMask(mask.id, { inverted: e.target.checked })}
                          className="rounded"
                        />
                        Invert Mask
                      </label>
                    </div>
                  </div>
                ))}

                {masks.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No masks yet. Click a mask type button to create one.
                  </div>
                )}
              </div>

              {/* Mask Reveal Keyframes */}
              <div className="mt-6">
                <h4 className="text-md font-bold text-cyan-400 mb-3">Mask Reveal Keyframes</h4>
                <div className="space-y-2">
                  {maskRevealKeyframes.map(kf => {
                    const mask = masks.find(m => m.id === kf.maskId);
                    return (
                      <div key={kf.id} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-cyan-400 font-mono text-sm">{formatTime(kf.time)}</span>
                          <span className="text-white text-sm">{mask?.name || 'Unknown Mask'}</span>
                          <span className="text-gray-400 text-xs">({kf.animation})</span>
                        </div>
                        <button 
                          onClick={() => deleteMaskRevealKeyframe(kf.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}

                  {maskRevealKeyframes.length === 0 && (
                    <div className="text-center text-gray-500 py-4 text-sm">
                      No reveal keyframes. Select a mask and click "+ Keyframe".
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 5: Camera Rig Tab */}
        {activeTab === 'cameraRig' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-purple-400 mb-2">🎥 Camera Rig System</h3>
              <p className="text-sm text-gray-400 mb-4">Create null object rigs for advanced camera movements and tracking</p>
              
              <div className="flex gap-2 mb-4 flex-wrap">
                <button 
                  onClick={() => createCameraRig('orbit')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  🔄 Orbit Rig
                </button>
                <button 
                  onClick={() => createCameraRig('rotation')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                  title="Camera that continuously faces the animation center"
                >
                  🎯 Rotation Rig
                </button>
                <button 
                  onClick={() => createCameraRig('dolly')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  🎬 Dolly Rig
                </button>
                <button 
                  onClick={() => createCameraRig('pan')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                  title="Horizontal sweeping camera movement"
                >
                  📹 Pan Rig
                </button>
                <button 
                  onClick={() => createCameraRig('crane')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  🏗️ Crane Rig
                </button>
                <button 
                  onClick={() => createCameraRig('zoom')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                  title="Smooth zoom in/out movement"
                >
                  🔍 Zoom Rig
                </button>
                <button 
                  onClick={() => createCameraRig('custom')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  ⚙️ Custom Rig
                </button>
              </div>

              {/* Path Visualization Controls */}
              <div className="bg-gray-700 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-semibold text-cyan-400 mb-3">📍 Path Visualization</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="showRigPaths" 
                      checked={showRigPaths} 
                      onChange={(e) => setShowRigPaths(e.target.checked)} 
                      className="w-4 h-4 cursor-pointer" 
                    />
                    <label htmlFor="showRigPaths" className="text-sm text-white cursor-pointer">
                      Show Paths
                    </label>
                  </div>
                  {showRigPaths && (
                    <div className="ml-6 flex items-center gap-3 border-l-2 border-cyan-500 pl-3">
                      <input 
                        type="checkbox" 
                        id="showRigKeyframeMarkers" 
                        checked={showRigKeyframeMarkers} 
                        onChange={(e) => setShowRigKeyframeMarkers(e.target.checked)} 
                        className="w-4 h-4 cursor-pointer" 
                      />
                      <label htmlFor="showRigKeyframeMarkers" className="text-xs text-gray-300 cursor-pointer">
                        Show Keyframe Markers
                      </label>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Path Colors:</strong> Orbit=<span className="text-cyan-400">Cyan</span>, 
                  Dolly=<span className="text-green-400">Green</span>, 
                  Crane=<span className="text-purple-400">Magenta</span>, 
                  Custom=<span className="text-white">White</span>
                </p>
              </div>

              {/* Rig Transitions */}
              <div className="bg-gray-700 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-semibold text-cyan-400 mb-3">🔄 Rig Transitions</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="enableRigTransitions" 
                      checked={enableRigTransitions} 
                      onChange={(e) => setEnableRigTransitions(e.target.checked)} 
                      className="w-4 h-4 cursor-pointer" 
                    />
                    <label htmlFor="enableRigTransitions" className="text-sm text-white cursor-pointer">
                      Enable Smooth Transitions
                    </label>
                  </div>
                  {enableRigTransitions && (
                    <div className="ml-6 space-y-3 border-l-2 border-cyan-500 pl-3">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Duration: {rigTransitionDuration.toFixed(1)}s</label>
                        <input 
                          type="range" 
                          min="0.1" 
                          max="5" 
                          step="0.1" 
                          value={rigTransitionDuration} 
                          onChange={(e) => setRigTransitionDuration(parseFloat(e.target.value))} 
                          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Easing</label>
                        <select 
                          value={rigTransitionEasing}
                          onChange={(e) => setRigTransitionEasing(e.target.value as any)}
                          className="w-full bg-gray-600 text-white text-sm px-2 py-1 rounded"
                        >
                          <option value="linear">Linear</option>
                          <option value="easeIn">Ease In</option>
                          <option value="easeOut">Ease Out</option>
                          <option value="easeInOut">Ease In-Out</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Framing Controls */}
              <div className="bg-gray-700 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-semibold text-cyan-400 mb-3">🎯 Framing Controls</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Look-At Offset X: {lookAtOffsetX.toFixed(1)}</label>
                      <input 
                        type="range" 
                        min="-10" 
                        max="10" 
                        step="0.5" 
                        value={lookAtOffsetX} 
                        onChange={(e) => setLookAtOffsetX(parseFloat(e.target.value))} 
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Look-At Offset Y: {lookAtOffsetY.toFixed(1)}</label>
                      <input 
                        type="range" 
                        min="-10" 
                        max="10" 
                        step="0.5" 
                        value={lookAtOffsetY} 
                        onChange={(e) => setLookAtOffsetY(parseFloat(e.target.value))} 
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="enableFramingLock" 
                      checked={enableFramingLock} 
                      onChange={(e) => setEnableFramingLock(e.target.checked)} 
                      className="w-4 h-4 cursor-pointer" 
                    />
                    <label htmlFor="enableFramingLock" className="text-sm text-white cursor-pointer">
                      Framing Lock (keep subject centered)
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="enableRuleOfThirds" 
                      checked={enableRuleOfThirds} 
                      onChange={(e) => setEnableRuleOfThirds(e.target.checked)} 
                      className="w-4 h-4 cursor-pointer" 
                    />
                    <label htmlFor="enableRuleOfThirds" className="text-sm text-white cursor-pointer">
                      Rule of Thirds Bias
                    </label>
                  </div>
                </div>
              </div>

              {/* Camera FX Layer */}
              <div className="bg-gray-700 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-semibold text-cyan-400 mb-3">✨ Camera FX Layer</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Shake Intensity: {cameraShakeIntensity.toFixed(1)}x</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="3" 
                      step="0.1" 
                      value={cameraShakeIntensity} 
                      onChange={(e) => setCameraShakeIntensity(parseFloat(e.target.value))} 
                      className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Shake Frequency: {cameraShakeFrequency}Hz</label>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      step="5" 
                      value={cameraShakeFrequency} 
                      onChange={(e) => setCameraShakeFrequency(parseInt(e.target.value))} 
                      className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="enableHandheldDrift" 
                      checked={enableHandheldDrift} 
                      onChange={(e) => setEnableHandheldDrift(e.target.checked)} 
                      className="w-4 h-4 cursor-pointer" 
                    />
                    <label htmlFor="enableHandheldDrift" className="text-sm text-white cursor-pointer">
                      Handheld Drift
                    </label>
                  </div>
                  {enableHandheldDrift && (
                    <div className="ml-6 border-l-2 border-cyan-500 pl-3">
                      <label className="text-xs text-gray-400 block mb-1">Drift Intensity: {handheldDriftIntensity.toFixed(2)}</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={handheldDriftIntensity} 
                        onChange={(e) => setHandheldDriftIntensity(parseFloat(e.target.value))} 
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="enableFovRamping" 
                      checked={enableFovRamping} 
                      onChange={(e) => setEnableFovRamping(e.target.checked)} 
                      className="w-4 h-4 cursor-pointer" 
                    />
                    <label htmlFor="enableFovRamping" className="text-sm text-white cursor-pointer">
                      FOV Ramping (motion blur effect)
                    </label>
                  </div>
                  {enableFovRamping && (
                    <div className="ml-6 border-l-2 border-cyan-500 pl-3">
                      <label className="text-xs text-gray-400 block mb-1">FOV Ramp Amount: {fovRampAmount}°</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="20" 
                        step="1" 
                        value={fovRampAmount} 
                        onChange={(e) => setFovRampAmount(parseInt(e.target.value))} 
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Shot Presets */}
              <div className="bg-gray-700 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-semibold text-cyan-400 mb-3">📷 Shot Presets</h4>
                <p className="text-xs text-gray-400 mb-3">Apply cinematic presets to active rigs</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(shotPresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => applyShotPreset(key)}
                      className={`text-xs px-3 py-2 rounded transition-colors ${
                        selectedShotPreset === key 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                      }`}
                      title={preset.description}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Rigs List */}
              <div className="space-y-3 mb-6">
                {cameraRigs.map(rig => (
                  <div key={rig.id} className={`bg-gray-700 rounded-lg p-4 ${activeCameraRigIds.includes(rig.id) ? 'ring-2 ring-purple-500' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" id="checkbox-field-4288" name="checkbox-field-4288" 
                          checked={rig.enabled}
                          onChange={(e) => {
                            updateCameraRig(rig.id, { enabled: e.target.checked });
                            if (e.target.checked) {
                              setActiveCameraRigIds(prev => [...prev, rig.id]);
                            } else {
                              setActiveCameraRigIds(prev => prev.filter(id => id !== rig.id));
                            }
                          }}
                          className="rounded"
                        />
                        <input 
                          type="text" id="text-field-4301" name="text-field-4301" 
                          value={rig.name}
                          onChange={(e) => updateCameraRig(rig.id, { name: e.target.value })}
                          className="bg-gray-600 text-white text-sm px-2 py-1 rounded"
                        />
                        <span className="text-xs text-gray-400">({rig.type})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => createCameraRigKeyframe(rig.id, currentTime)}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded text-xs"
                        >
                          + Keyframe
                        </button>
                        <button 
                          onClick={() => deleteCameraRig(rig.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Rig Type-Specific Controls */}
                    {rig.type === 'orbit' && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Radius</label>
                          <input 
                            type="number" id="radius-2" name="radius-2" 
                            step="0.5"
                            value={rig.orbitRadius || 15}
                            onChange={(e) => updateCameraRig(rig.id, { orbitRadius: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Speed</label>
                          <input 
                            type="number" id="speed-1" name="speed-1" 
                            step="0.1"
                            value={rig.orbitSpeed || 0.5}
                            onChange={(e) => updateCameraRig(rig.id, { orbitSpeed: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Axis</label>
                          <select 
                            value={rig.orbitAxis || 'y'}
                            onChange={(e) => updateCameraRig(rig.id, { orbitAxis: e.target.value })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          >
                            <option value="x">X</option>
                            <option value="y">Y</option>
                            <option value="z">Z</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {rig.type === 'dolly' && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Speed</label>
                          <input 
                            type="number" id="speed-2" name="speed-2" 
                            step="0.1"
                            value={rig.dollySpeed || 1.0}
                            onChange={(e) => updateCameraRig(rig.id, { dollySpeed: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Axis</label>
                          <select 
                            value={rig.dollyAxis || 'z'}
                            onChange={(e) => updateCameraRig(rig.id, { dollyAxis: e.target.value })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          >
                            <option value="x">X</option>
                            <option value="y">Y</option>
                            <option value="z">Z</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {rig.type === 'crane' && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Height</label>
                          <input 
                            type="number" id="height-2" name="height-2" 
                            step="0.5"
                            value={rig.craneHeight || 10}
                            onChange={(e) => updateCameraRig(rig.id, { craneHeight: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Tilt</label>
                          <input 
                            type="number" id="tilt" name="tilt" 
                            step="0.1"
                            value={rig.craneTilt || 0}
                            onChange={(e) => updateCameraRig(rig.id, { craneTilt: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                    )}

                    {rig.type === 'rotation' && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Distance from Center</label>
                          <input 
                            type="number" 
                            step="0.5"
                            value={rig.rotationDistance || 20}
                            onChange={(e) => updateCameraRig(rig.id, { rotationDistance: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Rotation Speed</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={rig.rotationSpeed || 0.3}
                            onChange={(e) => updateCameraRig(rig.id, { rotationSpeed: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                    )}

                    {rig.type === 'pan' && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Pan Speed</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={rig.panSpeed || 0.5}
                            onChange={(e) => updateCameraRig(rig.id, { panSpeed: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Pan Range (degrees)</label>
                          <input 
                            type="number" 
                            step="5"
                            value={rig.panRange || 90}
                            onChange={(e) => updateCameraRig(rig.id, { panRange: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                    )}

                    {rig.type === 'zoom' && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Zoom Speed</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={rig.zoomSpeed || 0.5}
                            onChange={(e) => updateCameraRig(rig.id, { zoomSpeed: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Min Distance</label>
                          <input 
                            type="number" 
                            step="1"
                            value={rig.zoomMinDistance || 10}
                            onChange={(e) => updateCameraRig(rig.id, { zoomMinDistance: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Max Distance</label>
                          <input 
                            type="number" 
                            step="1"
                            value={rig.zoomMaxDistance || 40}
                            onChange={(e) => updateCameraRig(rig.id, { zoomMaxDistance: parseFloat(e.target.value) })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                    )}

                    {/* Invert Direction Control - for all animated rig types */}
                    {(rig.type === 'orbit' || rig.type === 'rotation' || rig.type === 'dolly' || rig.type === 'pan' || rig.type === 'zoom' || rig.type === 'crane') && (
                      <div className="mb-3">
                        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={rig.invertDirection || false}
                            onChange={(e) => updateCameraRig(rig.id, { invertDirection: e.target.checked })}
                            className="rounded"
                          />
                          <span>↔️ Invert Direction</span>
                          <span className="text-gray-500">(Reverse movement)</span>
                        </label>
                      </div>
                    )}

                    {/* Base Position/Rotation for all rig types */}
                    <div className="border-t border-gray-600 pt-3 mt-3">
                      <div className="text-xs text-gray-400 mb-2">Base Position (X, Y, Z)</div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">X</label>
                          <input 
                            type="number" 
                            step="0.5"
                            value={rig.position.x}
                            onChange={(e) => updateCameraRig(rig.id, { position: { ...rig.position, x: parseFloat(e.target.value) || 0 } })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Y</label>
                          <input 
                            type="number" 
                            step="0.5"
                            value={rig.position.y}
                            onChange={(e) => updateCameraRig(rig.id, { position: { ...rig.position, y: parseFloat(e.target.value) || 0 } })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Z</label>
                          <input 
                            type="number" 
                            step="0.5"
                            value={rig.position.z}
                            onChange={(e) => updateCameraRig(rig.id, { position: { ...rig.position, z: parseFloat(e.target.value) || 0 } })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">Base Rotation (X, Y, Z in radians)</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">X</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={rig.rotation.x}
                            onChange={(e) => updateCameraRig(rig.id, { rotation: { ...rig.rotation, x: parseFloat(e.target.value) || 0 } })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Y</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={rig.rotation.y}
                            onChange={(e) => updateCameraRig(rig.id, { rotation: { ...rig.rotation, y: parseFloat(e.target.value) || 0 } })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Z</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={rig.rotation.z}
                            onChange={(e) => updateCameraRig(rig.id, { rotation: { ...rig.rotation, z: parseFloat(e.target.value) || 0 } })}
                            className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {cameraRigs.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No camera rigs yet. Click a rig type button to create one.
                  </div>
                )}
              </div>

              {/* Camera Rig Keyframes */}
              <div className="mt-6">
                <h4 className="text-md font-bold text-cyan-400 mb-3">Camera Rig Keyframes</h4>
                <p className="text-xs text-gray-400 mb-3">Edit keyframe timing, position, rotation, and animation settings.</p>
                <div className="space-y-3">
                  {cameraRigKeyframes.map(kf => {
                    const rig = cameraRigs.find(r => r.id === kf.rigId);
                    return (
                      <div key={kf.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-cyan-400 font-semibold text-sm">{rig?.name || 'Unknown Rig'}</span>
                          </div>
                          <button 
                            onClick={() => deleteCameraRigKeyframe(kf.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Time and Animation Controls */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Time</label>
                            <input 
                              type="text" 
                              value={formatTime(kf.time)} 
                              onChange={(e) => updateCameraRigKeyframe(kf.id, { time: parseTime(e.target.value) })}
                              className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Duration (sec)</label>
                            <input 
                              type="number" 
                              step="0.1"
                              min="0.1"
                              value={kf.duration}
                              onChange={(e) => updateCameraRigKeyframe(kf.id, { duration: parseFloat(e.target.value) || 1.0 })}
                              className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Easing</label>
                            <select 
                              value={kf.easing}
                              onChange={(e) => updateCameraRigKeyframe(kf.id, { easing: e.target.value })}
                              className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                            >
                              <option value="linear">Linear</option>
                              <option value="easeIn">Ease In</option>
                              <option value="easeOut">Ease Out</option>
                              <option value="easeInOut">Ease In-Out</option>
                            </select>
                          </div>
                        </div>

                        {/* Position Controls */}
                        <div className="mb-2">
                          <label className="text-xs text-gray-400 block mb-1">Position (X, Y, Z)</label>
                          <div className="grid grid-cols-3 gap-2">
                            <input 
                              type="number" 
                              placeholder="X"
                              step="0.5"
                              value={kf.position.x}
                              onChange={(e) => updateCameraRigKeyframe(kf.id, { position: { ...kf.position, x: parseFloat(e.target.value) || 0 } })}
                              className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                            />
                            <input 
                              type="number" 
                              placeholder="Y"
                              step="0.5"
                              value={kf.position.y}
                              onChange={(e) => updateCameraRigKeyframe(kf.id, { position: { ...kf.position, y: parseFloat(e.target.value) || 0 } })}
                              className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                            />
                            <input 
                              type="number" 
                              placeholder="Z"
                              step="0.5"
                              value={kf.position.z}
                              onChange={(e) => updateCameraRigKeyframe(kf.id, { position: { ...kf.position, z: parseFloat(e.target.value) || 0 } })}
                              className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                            />
                          </div>
                        </div>

                        {/* Rotation Controls */}
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Rotation (X, Y, Z in radians)</label>
                          <div className="grid grid-cols-3 gap-2">
                            <input 
                              type="number" 
                              placeholder="X"
                              step="0.1"
                              value={kf.rotation.x}
                              onChange={(e) => updateCameraRigKeyframe(kf.id, { rotation: { ...kf.rotation, x: parseFloat(e.target.value) || 0 } })}
                              className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                            />
                            <input 
                              type="number" 
                              placeholder="Y"
                              step="0.1"
                              value={kf.rotation.y}
                              onChange={(e) => updateCameraRigKeyframe(kf.id, { rotation: { ...kf.rotation, y: parseFloat(e.target.value) || 0 } })}
                              className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                            />
                            <input 
                              type="number" 
                              placeholder="Z"
                              step="0.1"
                              value={kf.rotation.z}
                              onChange={(e) => updateCameraRigKeyframe(kf.id, { rotation: { ...kf.rotation, z: parseFloat(e.target.value) || 0 } })}
                              className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {cameraRigKeyframes.length === 0 && (
                    <div className="text-center text-gray-500 py-4 text-sm">
                      No rig keyframes. Select a rig and click "+ Keyframe".
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Debugger - Always visible at bottom */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-cyan-400">📋 Debug Console</h3>
              {isPlaying && <span className="text-xs font-mono px-2 py-1 bg-gray-800 rounded text-green-400">FPS: {fps}</span>}
            </div>
            <button onClick={() => setErrorLog([])} className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-white">Clear</button>
          </div>
          <div className="bg-black rounded p-3 h-40 overflow-y-auto font-mono text-xs">
            {errorLog.length === 0 ? <div className="text-gray-500">Waiting for events...</div> : errorLog.map((log, i) => (
              <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-cyan-300'}`}>
                <span className="text-gray-600">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>

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

                {/* Tab Navigation */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Tab Navigation</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Waveforms</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">1</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Controls</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">2</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Camera Settings</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">3</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Keyframes</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">4</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Effects</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">5</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Post-FX</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">6</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Presets</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">7</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Text Animator</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">8</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Masks</span>
                      <kbd className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 border border-gray-600 rounded shadow-sm">9</kbd>
                    </div>
                    <div className="flex items-center justify-between py-2 px-3 rounded bg-gray-800/50">
                      <span className="text-gray-300">Switch to Camera Rig</span>
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
    </div>
  );
}