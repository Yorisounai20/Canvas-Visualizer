import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Trash2, Plus, Play, Square, Video, X, BadgeHelp } from 'lucide-react';

interface LogEntry {
  message: string;
  type: string;
  timestamp: string;
}

interface AudioTrack {
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

interface ParameterEvent {
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
    vignetteStrengthPulse?: number; // 0-1 intensity - temporarily increase vignette
    contrastBurst?: number; // 0-1 intensity - temporarily boost contrast
    colorTintFlash?: { r: number; g: number; b: number; intensity: number }; // RGB color flash
  };
}
// Default camera settings constants
const DEFAULT_CAMERA_DISTANCE = 15;
const DEFAULT_CAMERA_HEIGHT = 0;
const DEFAULT_CAMERA_ROTATION = 0;
const DEFAULT_CAMERA_AUTO_ROTATE = true;
const WAVEFORM_SAMPLES = 200; // Reduced from 800 for better performance
const WAVEFORM_THROTTLE_MS = 33; // Throttle waveform rendering to ~30fps (1000ms / 30fps = 33ms)
const FPS_UPDATE_INTERVAL_MS = 1000; // Update FPS counter every second

export default function ThreeDVisualizer() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
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
  const [cameraAutoRotate, setCameraAutoRotate] = useState(DEFAULT_CAMERA_AUTO_ROTATE);
  
  // Camera Rig Visual Hints
  const [showRigHints, setShowRigHints] = useState(false);
  const [showRigPosition, setShowRigPosition] = useState(true);
  const [showRigTarget, setShowRigTarget] = useState(true);
  const [showRigPath, setShowRigPath] = useState(true);
  const [showRigGrid, setShowRigGrid] = useState(true);
  
  // NEW: HUD visibility controls
  const [showPresetDisplay, setShowPresetDisplay] = useState(true);
  const [showFilename, setShowFilename] = useState(true);
  const [showBorder, setShowBorder] = useState(true);
  
  // NEW: Waveform mode control
  const [waveformMode, setWaveformMode] = useState<'scrolling' | 'static'>('scrolling');
  
  // NEW: Visual effects controls
  const [letterboxSize, setLetterboxSize] = useState(0); // 0-100 pixels (current animated value)
  const [showLetterbox, setShowLetterbox] = useState(false);
  const [useLetterboxAnimation, setUseLetterboxAnimation] = useState(false); // Toggle for animated vs manual mode
  const [activeLetterboxInvert, setActiveLetterboxInvert] = useState(false); // Current active invert setting from keyframes
  const [maxLetterboxHeight, setMaxLetterboxHeight] = useState(270); // Maximum bar height for curtain mode (affects both top and bottom)
  const [backgroundColor, setBackgroundColor] = useState('#0a0a14');
  const [borderColor, setBorderColor] = useState('#9333ea'); // purple-600
  const [ambientLightIntensity, setAmbientLightIntensity] = useState(0.5);
  const [directionalLightIntensity, setDirectionalLightIntensity] = useState(0.5);
  
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
    time: number;        // Time in seconds when this keyframe activates
    targetSize: number;  // Target letterbox size (0-100px)
    duration: number;    // Duration of the animation in seconds
    mode: 'instant' | 'smooth'; // Animation mode
    invert: boolean;     // Per-keyframe invert: true = curtain mode (100=closed, 0=open)
  }>>([]);
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
  
  // PHASE 4: Multi-audio track system
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const audioTracksRef = useRef<AudioTrack[]>([]);
  
  // PHASE 4: Parameter events for flash effects
  const [parameterEvents, setParameterEvents] = useState<ParameterEvent[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
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
  
  const [sections, setSections] = useState([
    { id: 1, start: 0, end: 20, animation: 'orbit' },
    { id: 2, start: 20, end: 40, animation: 'explosion' },
    { id: 3, start: 40, end: 60, animation: 'chill' }
  ]);
  const prevAnimRef = useRef('orbit');
  const transitionRef = useRef(1);
  
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
  const [activeCameraRigId, setActiveCameraRigId] = useState<string | null>(null);
  const [selectedRigId, setSelectedRigId] = useState<string | null>(null);
  const cameraRigNullObjectsRef = useRef<Map<string, THREE.Object3D>>(new Map()); // rigId -> null object
  
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

  // Helper function to convert seconds to MM:SS format
  const formatTimeInput = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to parse MM:SS format to seconds
  const parseTimeInput = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0]) || 0;
      const secs = parseInt(parts[1]) || 0;
      return mins * 60 + secs;
    }
    return 0;
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

  const animationTypes = [
    { value: 'orbit', label: 'Orbital Dance', icon: '🌀' },
    { value: 'explosion', label: 'Explosion', icon: '💥' },
    { value: 'tunnel', label: 'Tunnel Rush', icon: '🚀' },
    { value: 'wave', label: 'Wave Motion', icon: '🌊' },
    { value: 'spiral', label: 'Spiral Galaxy', icon: '🌌' },
    { value: 'chill', label: 'Chill Vibes', icon: '🎵' },
    { value: 'pulse', label: 'Pulse Grid', icon: '⚡' },
    { value: 'vortex', label: 'Vortex Storm', icon: '🌪️' },
    { value: 'seiryu', label: 'Azure Dragon', icon: '🐉' }
  ];

  const formatTime = (s: number) => `${Math.floor(s/60)}:${(Math.floor(s%60)).toString().padStart(2,'0')}`;
  const parseTime = (t: string) => { const [m,s]=t.split(':').map(Number); return m*60+s; };
  const getCurrentSection = () => sections.find(s => currentTime >= s.start && currentTime < s.end);

  // Easing functions for smooth transitions
  const applyEasing = (t: number, easing: string) => {
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

  // Interpolate camera values between keyframes
  const interpolateCameraKeyframes = (keyframes, currentTime) => {
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

  const resetCamera = () => {
    setCameraDistance(DEFAULT_CAMERA_DISTANCE);
    setCameraHeight(DEFAULT_CAMERA_HEIGHT);
    // Rotation is now keyframe-only, don't reset it here
    setCameraAutoRotate(DEFAULT_CAMERA_AUTO_ROTATE);
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

  // Letterbox keyframe management
  const addLetterboxKeyframe = () => {
    const newKeyframe = {
      time: letterboxKeyframes.length > 0 
        ? Math.max(...letterboxKeyframes.map(k => k.time)) + 5 
        : 0,
      targetSize: 50,
      duration: 1,
      mode: 'smooth' as 'smooth' | 'instant',
      invert: false  // Default to non-inverted
    };
    setLetterboxKeyframes([...letterboxKeyframes, newKeyframe]);
    setShowLetterbox(true); // Enable letterbox when adding keyframes
    setUseLetterboxAnimation(true); // Enable animation mode
  };

  const deleteLetterboxKeyframe = (index: number) => {
    const newKeyframes = letterboxKeyframes.filter((_, i) => i !== index);
    setLetterboxKeyframes(newKeyframes);
    // If no keyframes left, disable animation mode
    if (newKeyframes.length === 0) {
      setUseLetterboxAnimation(false);
    }
  };

  const updateLetterboxKeyframe = (index: number, field: string, value: number | string | boolean) => {
    setLetterboxKeyframes(letterboxKeyframes.map((kf, i) => 
      i === index ? { ...kf, [field]: value } : kf
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

  const generateWaveformData = (buffer: AudioBuffer, samples = WAVEFORM_SAMPLES) => {
    const rawData = buffer.getChannelData(0); // Get mono or first channel
    const blockSize = Math.floor(rawData.length / samples);
    const waveform: number[] = [];
    
    for (let i = 0; i < samples; i++) {
      let blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j]);
      }
      waveform.push(sum / blockSize);
    }
    
    return waveform;
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
    ).sort((a, b) => a.time - b.time));
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
  const createCameraRig = (type: 'orbit' | 'dolly' | 'crane' | 'custom' = 'orbit') => {
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
      orbitRadius: type === 'orbit' ? 15 : undefined,
      orbitSpeed: type === 'orbit' ? 0.5 : undefined,
      orbitAxis: type === 'orbit' ? 'y' as const : undefined,
      dollySpeed: type === 'dolly' ? 1.0 : undefined,
      dollyAxis: type === 'dolly' ? 'z' as const : undefined,
      craneHeight: type === 'crane' ? 10 : undefined,
      craneTilt: type === 'crane' ? 0 : undefined
    };
    setCameraRigs(prev => [...prev, newRig]);
    
    // Create null object in scene
    if (sceneRef.current) {
      const nullObject = new THREE.Object3D();
      nullObject.name = newRig.name;
      sceneRef.current.add(nullObject);
      cameraRigNullObjectsRef.current.set(newRig.id, nullObject);
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
    
    if (activeCameraRigId === id) {
      setActiveCameraRigId(null);
    }
    
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

  const deleteCameraRigKeyframe = (id: string) => {
    setCameraRigKeyframes(prev => prev.filter(kf => kf.id !== id));
    addLog(`Deleted camera rig keyframe`, 'info');
  };

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

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setSize(960, 540);
      renderer.setClearColor(0x0a0a14);

      if (containerRef.current.children.length > 0) {
        containerRef.current.removeChild(containerRef.current.children[0]);
      }

      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;
      addLog('Scene initialized successfully', 'success');
    } catch (e) {
      console.error('Three.js initialization error:', e);
      const error = e as Error;
      addLog(`Three.js error: ${error.message}`, 'error');
      return;
    }

    const cubes: THREE.Mesh[] = [];
    for (let i=0; i<8; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({color:0x8a2be2,wireframe:true,transparent:true,opacity:0.6}));
      const a = (i/8)*Math.PI*2;
      c.position.x = Math.cos(a)*8;
      c.position.z = Math.sin(a)*8;
      scene.add(c);
      cubes.push(c);
    }

    const octas: THREE.Mesh[] = [];
    for (let r=0; r<3; r++) {
      for (let i=0; i<6+r*4; i++) {
        const o = new THREE.Mesh(new THREE.OctahedronGeometry(0.5), new THREE.MeshBasicMaterial({color:0x40e0d0,wireframe:true,transparent:true,opacity:0.5}));
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
      const t = new THREE.Mesh(new THREE.TetrahedronGeometry(0.3), new THREE.MeshBasicMaterial({color:0xc8b4ff,transparent:true,opacity:0.7}));
      t.position.set((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10);
      scene.add(t);
      tetras.push(t);
    }

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.5,16,16), new THREE.MeshBasicMaterial({color:0x8a2be2,wireframe:true,transparent:true,opacity:0.4}));
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
    
    // Start idle render loop
    idleAnimationRef.current = requestAnimationFrame(idleRender);

    return () => {
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
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }
    };
  }, [isPlaying, currentTime, cameraDistance, cameraHeight, cameraKeyframes, showRigHints, showRigPosition, showRigTarget, showRigGrid, showRigPath]);

  // Update scene background, fog, and lights when settings change
  useEffect(() => {
    if (sceneRef.current && rendererRef.current) {
      const bgColor = new THREE.Color(backgroundColor);
      sceneRef.current.background = bgColor;
      sceneRef.current.fog = new THREE.Fog(backgroundColor, 10, 50);
      rendererRef.current.setClearColor(backgroundColor);
    }
  }, [backgroundColor]);

  useEffect(() => {
    if (lightsRef.current.ambient) {
      lightsRef.current.ambient.intensity = ambientLightIntensity;
    }
    if (lightsRef.current.directional) {
      lightsRef.current.directional.intensity = directionalLightIntensity;
    }
  }, [ambientLightIntensity, directionalLightIntensity]);

  // Enable/disable OrbitControls based on play state
  useEffect(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = !isPlaying;
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !rendererRef.current) return;
    const scene = sceneRef.current, cam = cameraRef.current, rend = rendererRef.current;
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
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
      
      analyser.getByteFrequencyData(data);
      const f = getFreq(data);
      const el = (Date.now() - startTimeRef.current) * 0.001;
      const t = el % duration;
      setCurrentTime(t);
      const sec = sections.find(s => t >= s.start && t < s.end);
      const type = sec ? sec.animation : 'orbit';
      
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
        const getCurrentSize = () => currentKeyframeIndex >= 0 
          ? sortedLetterboxKeyframes[currentKeyframeIndex].targetSize 
          : 0;
        
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
          const frequency = 50; // Shake frequency
          const amplitude = shake.intensity * decay;
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

      if (type !== prevAnimRef.current) {
        transitionRef.current = 0;
        prevAnimRef.current = type;
      }
      if (transitionRef.current < 1) {
        transitionRef.current = Math.min(1, transitionRef.current + 0.02);
      }
      const blend = transitionRef.current;

      if (type === 'orbit') {
        const rotationSpeed = cameraAutoRotate ? el*0.2 : 0;
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
          const angle = el * orbitSpeed + i * 0.5;
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
          const moonAngle = el * moonOrbitSpeed + i;
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
          rogue.rotation.x = el * 0.05 + i;
          rogue.rotation.y = el * 0.03;
          rogue.rotation.z = 0;
          rogue.material.color.setStyle(midsColor);
          rogue.material.opacity = (0.4 + f.mids * 0.2) * blend;
          rogue.material.wireframe = true;
        });
        obj.tetras.forEach((asteroid, i) => {
          const beltRadius = 11 + (i % 5) * 0.5;
          const beltSpeed = 0.3;
          const angle = el * beltSpeed + i * 0.2;
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
      } else if (type === 'wave') {
        const pathProgress = el * 2;
        cam.position.set(Math.sin(pathProgress * 0.3) * 3 + shakeX, Math.cos(pathProgress * 0.4) * 2 + 2 + activeCameraHeight + shakeY, activeCameraDistance - 5 + shakeZ);
        cam.lookAt(Math.sin((pathProgress + 2) * 0.3) * 3, Math.cos((pathProgress + 2) * 0.4) * 2, -10);
        obj.octas.slice(0, 30).forEach((segment, i) => {
          const segmentTime = el * 3 - i * 0.3;
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
          const t = el * 5 + i * 0.8;
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
          const angle = (ringIndex / 5) * Math.PI * 2 + el * 2;
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
        const rotationSpeed = cameraAutoRotate ? el*0.3 : 0;
        const a = rotationSpeed + activeCameraRotation;
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
          const angle = el * 2 + i * 0.3;
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
          c.position.set(gridX, gridY, Math.sin(el * 3 + i) * (2 + f.bass * 5));
          c.rotation.x = el + i;
          c.rotation.y = el * 1.5;
          const s = 1.5 + f.bass * 2.5;
          c.scale.set(s,s,s);
          c.material.opacity = (0.5 + f.bass * 0.5) * blend;
          c.material.color.setStyle(bassColor);
        });
        obj.octas.forEach((o,i) => {
          const gridPos = i % 16;
          const x = (gridPos % 4 - 1.5) * 4;
          const y = (Math.floor(gridPos / 4) - 1.5) * 4;
          o.position.set(x, y, Math.cos(el * 2 + i * 0.1) * (1 + f.mids * 3));
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
          const angle = el * 2 + i * 0.8;
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
          const angle = -el * 3 + i * 0.5;
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
        const rotationSpeed = cameraAutoRotate ? el * 0.3 : 0;
        cam.position.set(Math.sin(rotationSpeed + activeCameraRotation) * 5 + shakeX, 8 + Math.cos(el * 0.2) * 3 + activeCameraHeight + shakeY, activeCameraDistance + shakeZ);
        cam.lookAt(0, 0, 0);
        obj.cubes.forEach((c, i) => {
          const segmentTime = el * 1.5 - i * 0.6;
          const progress = i / obj.cubes.length;
          const isHead = i === 0;
          const x = Math.sin(segmentTime) * (6 + f.bass * 3);
          const y = Math.cos(segmentTime * 0.5) * 4 + Math.sin(segmentTime * 1.5) * 2;
          const z = progress * -15 + Math.sin(segmentTime * 0.3) * 3;
          c.position.set(x, y, z);
          const baseScale = isHead ? 5 : 1.3;
          const scaleSize = baseScale + f.bass * 0.8;
          c.scale.set(scaleSize, scaleSize * 0.8, scaleSize * 1.2);
          const nextT = el * 1.5 - (i + 1) * 0.6;
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
          mountain.rotation.y = el * 0.1 + i;
          const s = 8 + (i % 3) * 3;
          mountain.scale.set(s, mountainHeight * 2, s);
          mountain.material.color.setStyle(midsColor);
          mountain.material.opacity = (0.4 + f.mids * 0.2) * blend;
          mountain.material.wireframe = true;
        });
        obj.octas.slice(10).forEach((o, i) => {
          const bodyIndex = (i % obj.cubes.length);
          const orbitAngle = (i / 4) * Math.PI * 2 + el * 3;
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
          cloud.position.x = ((el * driftSpeed + i * 4) % 50) - 25;
          cloud.position.y = 5 + layer * 3 + Math.sin(el + i) * 0.5;
          cloud.position.z = -10 - layer * 8 + Math.cos(el * 0.3 + i) * 2;
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
      if (activeCameraRigId) {
        const activeRig = cameraRigs.find(r => r.id === activeCameraRigId && r.enabled);
        if (activeRig) {
          const rigNullObject = cameraRigNullObjectsRef.current.get(activeCameraRigId);
          
          // Find active rig keyframe or use rig's base position
          const sortedRigKeyframes = cameraRigKeyframes
            .filter(kf => kf.rigId === activeCameraRigId)
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
          
          // Apply rig type-specific motion
          switch (activeRig.type) {
            case 'orbit':
              if (activeRig.orbitRadius && activeRig.orbitSpeed && activeRig.orbitAxis) {
                const orbitAngle = t * activeRig.orbitSpeed;
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
                const dollyDistance = t * activeRig.dollySpeed;
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
                rigRotation.x = activeRig.craneTilt;
              }
              break;
          }
          
          // Update null object position/rotation
          if (rigNullObject) {
            rigNullObject.position.set(rigPosition.x, rigPosition.y, rigPosition.z);
            rigNullObject.rotation.set(rigRotation.x, rigRotation.y, rigRotation.z);
            
            // Parent camera to null object (apply rig offset to camera)
            const rigCameraOffset = new THREE.Vector3(0, 0, activeCameraDistance);
            const rigWorldPos = new THREE.Vector3();
            rigNullObject.getWorldPosition(rigWorldPos);
            
            // Apply rig rotation to camera offset
            rigCameraOffset.applyEuler(rigNullObject.rotation);
            
            // Only override camera position if rig is active
            // (this overrides the preset camera positioning)
            cam.position.copy(rigWorldPos.add(rigCameraOffset));
            cam.lookAt(rigWorldPos);
          }
        }
      }

      // PHASE 4: Apply background flash effect before rendering
      if (bgFlash > 0) {
        const baseColor = new THREE.Color(backgroundColor);
        const flashColor = new THREE.Color(0xffffff);
        const blendedColor = baseColor.lerp(flashColor, Math.min(bgFlash, 1));
        scene.background = blendedColor;
        rend.setClearColor(blendedColor);
      } else {
        const baseColor = new THREE.Color(backgroundColor);
        scene.background = baseColor;
        rend.setClearColor(baseColor);
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

      // PHASE 5: Mask Reveals - Apply masks to renderer (post-render effect)
      // Note: Full mask implementation would require shader-based rendering or stencil buffer
      // For now, we'll prepare the mask data and apply basic visibility controls
      const activeMasks = masks.filter(m => m.enabled);
      if (activeMasks.length > 0) {
        // Mask rendering would be implemented here with custom shaders
        // This is a placeholder for the mask system infrastructure
        // Future implementation: Use WebGL stencil buffer or shader-based masking
      }

      rend.render(scene, cam);
    };

    anim();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isPlaying, sections, duration, bassColor, midsColor, highsColor, showSongName]);

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
            {showPresetDisplay && getCurrentSection() && (
              <p className="text-cyan-400 text-xs mt-1">
                {animationTypes.find(a => a.value === getCurrentSection()?.animation)?.icon} {animationTypes.find(a => a.value === getCurrentSection()?.animation)?.label}
              </p>
            )}
            
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
            onClick={() => setActiveTab('keyframes')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'keyframes' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            🎬 Keyframes
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
          <button 
            onClick={() => setActiveTab('cameraRig')} 
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'cameraRig' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            🎥 Camera Rig
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
            
            {/* Parameter Events Section */}
            <div className="mb-4 bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-cyan-400">⚡ Parameter Events</h3>
                <button
                  onClick={addParameterEvent}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded flex items-center gap-1"
                >
                  <Plus size={14} /> Add Event
                </button>
              </div>
              
              {parameterEvents.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-xs">
                  No events. Click "Add Event" to create flash effects.
                </div>
              ) : (
                <div className="space-y-2">
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
              )}
            </div>
          </div>
        )}

        {/* Controls Tab */}
        {activeTab === 'controls' && (
          <div>
            <div className="mb-4 bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎨 Colors</h3>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-gray-400 block mb-1">Bass</label><input type="color" id="bassColor" name="bassColor" value={bassColor} onChange={(e) => setBassColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" /></div>
                <div><label className="text-xs text-gray-400 block mb-1">Mids</label><input type="color" id="midsColor" name="midsColor" value={midsColor} onChange={(e) => setMidsColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" /></div>
                <div><label className="text-xs text-gray-400 block mb-1">Highs</label><input type="color" id="highsColor" name="highsColor" value={highsColor} onChange={(e) => setHighsColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" /></div>
              </div>
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
          </div>
        )}

        {/* Camera Settings Tab */}
        {activeTab === 'camera' && (
          <div>
            <div className="bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">📷 Global Camera Controls</h3>
              <p className="text-xs text-gray-400 mb-3">These settings apply when no keyframes are active.</p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="autoRotate" checked={cameraAutoRotate} onChange={(e) => setCameraAutoRotate(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                  <label htmlFor="autoRotate" className="text-sm text-white cursor-pointer">Auto-Rotate Camera</label>
                </div>
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
          </div>
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <div>
            <div className="bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">📹 Camera Shake Events</h3>
              <p className="text-xs text-gray-400 mb-3">Add manual shake events at specific timestamps for impact moments.</p>
              <button 
                onClick={addCameraShake} 
                className="mb-3 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Plus size={16} /> Add Shake at {formatTime(currentTime)}
              </button>
              
              {cameraShakes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cameraShakes.map((shake, index) => (
                    <div key={index} className="bg-gray-600 rounded p-3 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold text-sm">Shake {index + 1}</span>
                        <button 
                          onClick={() => deleteCameraShake(index)} 
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-300 block mb-1">Time: {formatTime(shake.time)}</label>
                        <input 
                          type="text" id="time-formattime-shake-time" name="time-formattime-shake-time" 
                          value={formatTime(shake.time)} 
                          onChange={(e) => updateCameraShake(index, 'time', parseTime(e.target.value))} 
                          className="w-full bg-gray-700 text-white text-sm px-2 py-1.5 rounded" 
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-300 block mb-1">Intensity: {shake.intensity.toFixed(1)}</label>
                        <input 
                          type="range" id="intensity-shake-intensity-tofixed-1" name="intensity-shake-intensity-tofixed-1" 
                          min="1" 
                          max="20" 
                          step="0.5" 
                          value={shake.intensity} 
                          onChange={(e) => updateCameraShake(index, 'intensity', Number(e.target.value))} 
                          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-700" 
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-gray-300 block mb-1">Duration: {shake.duration.toFixed(2)}s</label>
                        <input 
                          type="range" id="duration-shake-duration-tofixed-2-s" name="duration-shake-duration-tofixed-2-s" 
                          min="0.05" 
                          max="1" 
                          step="0.05" 
                          value={shake.duration} 
                          onChange={(e) => updateCameraShake(index, 'duration', Number(e.target.value))} 
                          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-700" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-4">No shake events yet. Click "Add Shake" to create one.</p>
              )}
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 mt-4">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎨 Visual Effects</h3>
              <p className="text-xs text-gray-400 mb-3">Customize the look and feel of the visualization.</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Background Color</label>
                  <input type="color" id="backgroundColor" name="backgroundColor" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Border Color</label>
                  <input type="color" id="borderColor" name="borderColor" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                </div>
              </div>
            </div>
            
            {/* Letterbox Animation Section */}
            <div className="bg-gray-700 rounded-lg p-3 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-cyan-400">🎬 Animated Letterbox</h3>
                  <p className="text-xs text-gray-400 mt-1">Create cinematic curtain-like letterbox animations</p>
                </div>
                <button 
                  onClick={addLetterboxKeyframe} 
                  disabled={!showLetterbox}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="showLetterbox" checked={showLetterbox} onChange={(e) => setShowLetterbox(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                  <label htmlFor="showLetterbox" className="text-sm text-white cursor-pointer font-semibold">Enable Letterbox</label>
                </div>
                
                {showLetterbox && (
                  <div className="ml-7 space-y-2">
                    <div>
                      <label className="text-xs text-gray-300 block mb-1">Max Curtain Height (px) - affects both top & bottom bars</label>
                      <input 
                        type="number" id="maxLetterboxHeight" name="maxLetterboxHeight" 
                        min="50" 
                        max="500" 
                        step="10" 
                        value={maxLetterboxHeight} 
                        onChange={(e) => setMaxLetterboxHeight(parseInt(e.target.value) || 270)} 
                        className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded" 
                      />
                      <p className="text-xs text-gray-400 mt-1">Default: 270px (full coverage). Tip: 270px covers entire 540px canvas when both bars at 100%</p>
                    </div>
                  </div>
                )}
                
                {showLetterbox && letterboxKeyframes.length > 0 && (
                  <div className="flex items-center gap-3 ml-7">
                    <input 
                      type="checkbox" 
                      id="useLetterboxAnimation" 
                      checked={useLetterboxAnimation} 
                      onChange={(e) => setUseLetterboxAnimation(e.target.checked)} 
                      className="w-4 h-4 cursor-pointer" 
                    />
                    <label htmlFor="useLetterboxAnimation" className="text-sm text-white cursor-pointer">
                      Use Animations ({letterboxKeyframes.length} keyframe{letterboxKeyframes.length !== 1 ? 's' : ''})
                    </label>
                  </div>
                )}
                
                {showLetterbox && letterboxKeyframes.length === 0 && (
                  <p className="text-xs text-gray-400 ml-7">Manual mode - use slider below</p>
                )}
              </div>
              
              {letterboxKeyframes.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {letterboxKeyframes.map((keyframe, index) => (
                    <div key={index} className="bg-gray-800 rounded p-3 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-semibold text-sm">Keyframe {index + 1}</span>
                        <button 
                          onClick={() => deleteLetterboxKeyframe(index)} 
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-300 block mb-1">Time (s)</label>
                          <input 
                            type="number" id="time-s" name="time-s" 
                            min="0" 
                            max={duration}
                            step="0.1" 
                            value={keyframe.time} 
                            onChange={(e) => updateLetterboxKeyframe(index, 'time', parseFloat(e.target.value) || 0)} 
                            className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded" 
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-300 block mb-1">Size (px)</label>
                          <input 
                            type="number" id="size-px" name="size-px" 
                            min="0" 
                            max="100" 
                            step="5" 
                            value={keyframe.targetSize} 
                            onChange={(e) => updateLetterboxKeyframe(index, 'targetSize', parseInt(e.target.value) || 0)} 
                            className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded" 
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-300 block mb-1">Duration (s)</label>
                          <input 
                            type="number" id="duration-s-1" name="duration-s-1" 
                            min="0" 
                            max="10" 
                            step="0.1" 
                            value={keyframe.duration} 
                            onChange={(e) => updateLetterboxKeyframe(index, 'duration', parseFloat(e.target.value) || 0)} 
                            className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded" 
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-300 block mb-1">Mode</label>
                          <select 
                            value={keyframe.mode} 
                            onChange={(e) => updateLetterboxKeyframe(index, 'mode', e.target.value)} 
                            className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded"
                          >
                            <option value="smooth">Smooth</option>
                            <option value="instant">Instant</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="checkbox" 
                          id={`invert-${index}`}
                          checked={keyframe.invert} 
                          onChange={(e) => updateLetterboxKeyframe(index, 'invert', e.target.checked)} 
                          className="w-4 h-4 cursor-pointer" 
                        />
                        <label htmlFor={`invert-${index}`} className="text-xs text-gray-300 cursor-pointer">
                          Curtain mode (100=closed, 0=open)
                        </label>
                      </div>
                      
                      <p className="text-xs text-gray-400 italic">
                        {keyframe.invert
                          ? (keyframe.mode === 'smooth' 
                              ? `Animates to ${keyframe.targetSize === 100 ? 'fully closed' : keyframe.targetSize === 0 ? 'fully open' : `${keyframe.targetSize}% ${keyframe.targetSize > 50 ? 'closed' : 'open'}`} over ${keyframe.duration}s`
                              : `Instantly sets to ${keyframe.targetSize === 100 ? 'fully closed' : keyframe.targetSize === 0 ? 'fully open' : `${keyframe.targetSize}% ${keyframe.targetSize > 50 ? 'closed' : 'open'}`}`)
                          : (keyframe.mode === 'smooth' 
                              ? `Animates to ${keyframe.targetSize}px bars over ${keyframe.duration}s`
                              : `Instantly sets to ${keyframe.targetSize}px bars`)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic text-center py-4">
                  No letterbox animations yet. Click "Add" to create cinematic curtain effects.
                </p>
              )}
              
              {showLetterbox && letterboxKeyframes.length === 0 && (
                <div className="mt-3">
                  <label className="text-xs text-gray-400 block mb-1">Manual Size: {letterboxSize}px</label>
                  <input type="range" id="letterboxSize" name="letterboxSize" min="0" max="100" step="5" value={letterboxSize} onChange={(e) => setLetterboxSize(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                </div>
              )}
            </div>
            
            <div className="bg-gray-700 rounded-lg p-3 mt-4">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">💡 Lighting Controls</h3>
              <p className="text-xs text-gray-400 mb-3">Adjust scene lighting intensity.</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Ambient Light: {(ambientLightIntensity * 100).toFixed(0)}%</label>
                  <input type="range" id="ambientLightIntensity" name="ambientLightIntensity" min="0" max="2" step="0.1" value={ambientLightIntensity} onChange={(e) => setAmbientLightIntensity(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Directional Light: {(directionalLightIntensity * 100).toFixed(0)}%</label>
                  <input type="range" id="directionalLightIntensity" name="directionalLightIntensity" min="0" max="2" step="0.1" value={directionalLightIntensity} onChange={(e) => setDirectionalLightIntensity(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Keyframes Tab */}
        {activeTab === 'keyframes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Global Camera Keyframes</h3>
                <p className="text-xs text-gray-400 mt-1">Independent camera timeline - not tied to animation presets. Auto-rotate is controlled in Camera Settings.</p>
              </div>
              <button 
                onClick={addKeyframe} 
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Plus size={16} /> Add Keyframe
              </button>
            </div>
            
            {cameraKeyframes && cameraKeyframes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cameraKeyframes.map((kf, kfIndex) => (
                  <div key={kfIndex} className="bg-gray-700 rounded p-3 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold text-sm">Keyframe {kfIndex + 1}</span>
                      {cameraKeyframes.length > 1 && (
                        <button 
                          onClick={() => deleteKeyframe(kfIndex)} 
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-300 block mb-1">Time: {formatTime(kf.time)}</label>
                      <input 
                        type="text" id="time-formattime-kf-time" name="time-formattime-kf-time" 
                        value={formatTime(kf.time)} 
                        onChange={(e) => updateKeyframe(kfIndex, 'time', parseTime(e.target.value))} 
                        className="w-full bg-gray-600 text-white text-sm px-2 py-1.5 rounded" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-300 block mb-1">Easing</label>
                      <select 
                        value={kf.easing || 'linear'} 
                        onChange={(e) => updateKeyframe(kfIndex, 'easing', e.target.value)}
                        className="w-full bg-gray-600 text-white text-sm px-2 py-1.5 rounded"
                      >
                        <option value="linear">Linear (No Easing)</option>
                        <option value="easeIn">Ease In (Slow Start)</option>
                        <option value="easeOut">Ease Out (Slow End)</option>
                        <option value="easeInOut">Ease In-Out (Smooth)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-300 block mb-1">Distance: {kf.distance.toFixed(1)}</label>
                      <input 
                        type="range" id="distance-kf-distance-tofixed-1" name="distance-kf-distance-tofixed-1" 
                        min="5" 
                        max="50" 
                        step="0.5" 
                        value={kf.distance} 
                        onChange={(e) => updateKeyframe(kfIndex, 'distance', Number(e.target.value))} 
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-300 block mb-1">Height: {kf.height.toFixed(1)}</label>
                      <input 
                        type="range" id="height-kf-height-tofixed-1" name="height-kf-height-tofixed-1" 
                        min="-10" 
                        max="10" 
                        step="0.5" 
                        value={kf.height} 
                        onChange={(e) => updateKeyframe(kfIndex, 'height', Number(e.target.value))} 
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-300 block mb-1">Rotation: {(kf.rotation * 180 / Math.PI).toFixed(0)}°</label>
                      <input 
                        type="range" id="rotation-kf-rotation-180-math-pi-tofixed-0" name="rotation-kf-rotation-180-math-pi-tofixed-0" 
                        min="0" 
                        max={Math.PI * 2} 
                        step="0.05" 
                        value={kf.rotation} 
                        onChange={(e) => updateKeyframe(kfIndex, 'rotation', Number(e.target.value))} 
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-600" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic text-center py-4">No keyframes yet. Click "Add Keyframe" to create one.</p>
            )}
          </div>
        )}

        {/* Post-FX Tab */}
        {activeTab === 'postfx' && (
          <div>
            {/* Limitations Notice */}
            <div className="mb-4 bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Post-Processing Effects - Limitations</h3>
              <p className="text-xs text-yellow-200">
                The Post-FX controls below require WebGL shader-based post-processing (EffectComposer, passes) which is not yet implemented. 
                These controls will not affect the visualization until the rendering pipeline is updated to support post-processing effects.
              </p>
            </div>

            {/* Blend Mode Section */}
            <div className="mb-4 bg-gray-700 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎭 Blend Mode</h3>
              <p className="text-xs text-gray-400 mb-3">Layer blending affects how objects combine visually (not yet implemented)</p>
              <select 
                value={blendMode} 
                onChange={(e) => setBlendMode(e.target.value as any)}
                className="w-full bg-gray-600 text-white text-sm px-3 py-2 rounded"
                disabled
              >
                <option value="normal">Normal (Standard)</option>
                <option value="additive">Additive (Brighten)</option>
                <option value="multiply">Multiply (Darken)</option>
                <option value="screen">Screen (Lighten)</option>
              </select>
            </div>

            {/* Vignette Section */}
            <div className="mb-4 bg-gray-700 rounded-lg p-3 opacity-60">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🌫️ Vignette (Not Implemented)</h3>
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
                  disabled
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
                  disabled
                />
              </div>

              <button 
                onClick={() => { setVignetteStrength(0); setVignetteSoftness(0.5); }}
                className="text-xs bg-gray-600 px-3 py-1 rounded text-white w-full cursor-not-allowed"
                disabled
              >
                Reset Vignette
              </button>
            </div>

            {/* Color Grading Section */}
            <div className="mb-4 bg-gray-700 rounded-lg p-3 opacity-60">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🎨 Color Grading (Not Implemented)</h3>
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
                  disabled
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
                  disabled
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
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Brightness curve adjustment</p>
              </div>

              <button 
                onClick={() => { setColorSaturation(1.0); setColorContrast(1.0); setColorGamma(1.0); }}
                className="text-xs bg-gray-600 px-3 py-1 rounded text-white w-full mb-3 cursor-not-allowed"
                disabled
              >
                Reset Color Grading
              </button>
            </div>

            {/* Color Tint Section */}
            <div className="mb-4 bg-gray-700 rounded-lg p-3 opacity-60">
              <h3 className="text-sm font-semibold text-cyan-400 mb-3">🌈 Color Tint (Not Implemented)</h3>
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
                  disabled
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
                  disabled
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
                  disabled
                />
              </div>

              <button 
                onClick={() => { setColorTintR(1.0); setColorTintG(1.0); setColorTintB(1.0); }}
                className="text-xs bg-gray-600 px-3 py-1 rounded text-white w-full cursor-not-allowed"
                disabled
              >
                Reset Color Tint
              </button>
            </div>
          </div>
        )}

        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div>
            <div className="mb-4 flex gap-2">
              <button onClick={addSection} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"><Plus size={16} /> Add Preset</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sections.map((s) => (
                <div key={s.id} className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold text-sm">{animationTypes.find(a => a.value === s.animation)?.icon || '🎵'} {animationTypes.find(a => a.value === s.animation)?.label || s.animation}</span>
                    <button onClick={() => deleteSection(s.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div><label className="text-xs text-gray-400">Start</label><input type="text" id="start" name="start" value={formatTime(s.start)} onChange={(e) => updateSection(s.id, 'start', parseTime(e.target.value))} className="w-full bg-gray-600 text-white text-sm px-2 py-1 rounded" /></div>
                    <div><label className="text-xs text-gray-400">End</label><input type="text" id="text-input-2" name="text-input-2" value={formatTime(s.end)} onChange={(e) => updateSection(s.id, 'end', parseTime(e.target.value))} className="w-full bg-gray-600 text-white text-sm px-2 py-1 rounded" /></div>
                  </div>
                  <select value={s.animation} onChange={(e) => updateSection(s.id, 'animation', e.target.value)} className="w-full bg-gray-600 text-white text-sm px-2 py-1 rounded mb-2">
                    {animationTypes.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
              ))}
            </div>
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
              
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => createCameraRig('orbit')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  🔄 Orbit Rig
                </button>
                <button 
                  onClick={() => createCameraRig('dolly')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  🎬 Dolly Rig
                </button>
                <button 
                  onClick={() => createCameraRig('crane')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  🏗️ Crane Rig
                </button>
                <button 
                  onClick={() => createCameraRig('custom')} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  ⚙️ Custom Rig
                </button>
              </div>

              {/* Camera Rigs List */}
              <div className="space-y-3 mb-6">
                {cameraRigs.map(rig => (
                  <div key={rig.id} className={`bg-gray-700 rounded-lg p-4 ${activeCameraRigId === rig.id ? 'ring-2 ring-purple-500' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" id="checkbox-field-4288" name="checkbox-field-4288" 
                          checked={rig.enabled}
                          onChange={(e) => {
                            updateCameraRig(rig.id, { enabled: e.target.checked });
                            if (e.target.checked) {
                              setActiveCameraRigId(rig.id);
                            } else if (activeCameraRigId === rig.id) {
                              setActiveCameraRigId(null);
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

                    {/* Base Position/Rotation for all rig types */}
                    <div className="border-t border-gray-600 pt-3 mt-3">
                      <div className="text-xs text-gray-400 mb-2">Base Position</div>
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <input 
                          type="number" id="number-field-4419" name="number-field-4419" 
                          placeholder="X"
                          step="0.5"
                          value={rig.position.x}
                          onChange={(e) => updateCameraRig(rig.id, { position: { ...rig.position, x: parseFloat(e.target.value) || 0 } })}
                          className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                        />
                        <input 
                          type="number" id="number-field-4427" name="number-field-4427" 
                          placeholder="Y"
                          step="0.5"
                          value={rig.position.y}
                          onChange={(e) => updateCameraRig(rig.id, { position: { ...rig.position, y: parseFloat(e.target.value) || 0 } })}
                          className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                        />
                        <input 
                          type="number" id="number-field-4435" name="number-field-4435" 
                          placeholder="Z"
                          step="0.5"
                          value={rig.position.z}
                          onChange={(e) => updateCameraRig(rig.id, { position: { ...rig.position, z: parseFloat(e.target.value) || 0 } })}
                          className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                        />
                      </div>
                      <div className="text-xs text-gray-400 mb-2">Base Rotation</div>
                      <div className="grid grid-cols-3 gap-2">
                        <input 
                          type="number" id="number-field-4446" name="number-field-4446" 
                          placeholder="X"
                          step="0.1"
                          value={rig.rotation.x}
                          onChange={(e) => updateCameraRig(rig.id, { rotation: { ...rig.rotation, x: parseFloat(e.target.value) || 0 } })}
                          className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                        />
                        <input 
                          type="number" id="number-field-4454" name="number-field-4454" 
                          placeholder="Y"
                          step="0.1"
                          value={rig.rotation.y}
                          onChange={(e) => updateCameraRig(rig.id, { rotation: { ...rig.rotation, y: parseFloat(e.target.value) || 0 } })}
                          className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                        />
                        <input 
                          type="number" id="number-field-4462" name="number-field-4462" 
                          placeholder="Z"
                          step="0.1"
                          value={rig.rotation.z}
                          onChange={(e) => updateCameraRig(rig.id, { rotation: { ...rig.rotation, z: parseFloat(e.target.value) || 0 } })}
                          className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded"
                        />
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
                <div className="space-y-2">
                  {cameraRigKeyframes.map(kf => {
                    const rig = cameraRigs.find(r => r.id === kf.rigId);
                    return (
                      <div key={kf.id} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-cyan-400 font-mono text-sm">{formatTime(kf.time)}</span>
                          <span className="text-white text-sm">{rig?.name || 'Unknown Rig'}</span>
                          <span className="text-gray-400 text-xs">({kf.easing})</span>
                        </div>
                        <button 
                          onClick={() => deleteCameraRigKeyframe(kf.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X size={16} />
                        </button>
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
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowExportModal(false)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
                <Video size={24} />
                Video Export
              </h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Resolution Selector */}
              <div>
                <label className="text-sm text-gray-300 block mb-2 font-semibold">Export Resolution</label>
                <select 
                  value={exportResolution} 
                  onChange={(e) => setExportResolution(e.target.value)}
                  disabled={isExporting}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500 focus:outline-none">
                  <option value="960x540">960x540 (SD)</option>
                  <option value="1280x720">1280x720 (HD 720p)</option>
                  <option value="1920x1080">1920x1080 (Full HD 1080p)</option>
                </select>
              </div>
              
              {/* Format Selector */}
              <div>
                <label className="text-sm text-gray-300 block mb-2 font-semibold">Output Format</label>
                <select 
                  value={exportFormat} 
                  onChange={(e) => setExportFormat(e.target.value)}
                  disabled={isExporting}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500 focus:outline-none">
                  <option value="webm">WebM (VP9 + Opus)</option>
                  <option value="mp4">MP4 (if supported)</option>
                </select>
              </div>

              {/* Export Button */}
              <button 
                onClick={handleExportAndCloseModal} 
                disabled={!audioReady || isExporting} 
                className={`w-full px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 ${!audioReady || isExporting ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white transition-colors`}>
                <Video size={20} />
                {isExporting ? 'Exporting...' : 'Export Full Video'}
              </button>

              {/* Progress Bar */}
              {isExporting && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{exportProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-purple-500 h-3 rounded-full transition-all duration-300" 
                      style={{width: `${exportProgress}%`}}>
                    </div>
                  </div>
                  <p className="text-purple-400 text-sm mt-2 animate-pulse text-center">🎬 Rendering video...</p>
                </div>
              )}
              
              <p className="text-xs text-gray-400 text-center">Automatically renders full timeline with all presets & camera movements</p>
            </div>
          </div>
        </div>
      )}

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