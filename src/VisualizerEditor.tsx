import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import TopBar from './components/Controls/TopBar';
import LeftPanel from './components/Panels/LeftPanel';
import RightPanel from './components/Panels/RightPanel';
import Timeline from './components/Timeline/Timeline';
import CanvasWrapper from './components/Canvas/CanvasWrapper';
import ExportModal from './components/Controls/ExportModal';
import DebugConsole from './components/Debug/DebugConsole';
import { Section, CameraKeyframe, LetterboxKeyframe, CameraShake, LogEntry, AnimationType, PresetKeyframe, TextKeyframe, ProjectSettings } from './types';

// Animation types/presets
const ANIMATION_TYPES: AnimationType[] = [
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

// Default constants
const DEFAULT_CAMERA_DISTANCE = 15;
const DEFAULT_CAMERA_HEIGHT = 0;
const DEFAULT_CAMERA_ROTATION = 0;
const DEFAULT_CAMERA_AUTO_ROTATE = true;

interface VisualizerEditorProps {
  projectSettings: ProjectSettings;
  initialAudioFile?: File;
}

/**
 * VisualizerEditor - Main After Effects-style editor component
 * 
 * PHASE 1 ARCHITECTURE (CORE STABILITY):
 * - Single unified render loop (runs continuously, checks isPlaying state)
 * - Scene/Camera/Renderer lifecycle managed in one useEffect
 * - Audio context created once, reused for all playback
 * - Timeline sections are the single source of truth for animations
 * - All errors/successes logged to debug console
 * 
 * PHASE 2 ARCHITECTURE (PROJECT SYSTEM):
 * - Accepts ProjectSettings from NewProjectModal
 * - Initializes editor with project configuration
 * - Project state can be saved/loaded (persistence not yet implemented)
 * 
 * Coordinates all panels and manages the 3D visualization state
 */
export default function VisualizerEditor({ projectSettings, initialAudioFile }: VisualizerEditorProps) {
  // PHASE 1: Core Three.js refs (stable across component lifetime)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  // PHASE 1: Audio system refs (stable, single instances)
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // PHASE 1: Single unified render loop ref
  const animationRef = useRef<number | null>(null);
  
  // PHASE 1: Playback timing refs
  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);
  const lightsRef = useRef<{ 
    ambient: THREE.AmbientLight | null; 
    directional: THREE.DirectionalLight | null 
  }>({ ambient: null, directional: null });
  const objectsRef = useRef<{
    cubes: THREE.Mesh[];
    octas: THREE.Mesh[];
    tetras: THREE.Mesh[];
    sphere: THREE.Mesh;
  } | null>(null);
  const songNameMeshesRef = useRef<THREE.Mesh[]>([]);
  const fontRef = useRef<any>(null);
  const prevAnimRef = useRef('orbit');
  const transitionRef = useRef(1);
  const fpsFrameCount = useRef(0);
  const fpsLastTime = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioFileName, setAudioFileName] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Sections/Layers state
  const [sections, setSections] = useState<Section[]>([
    { id: 1, start: 0, end: 20, animation: 'orbit', visible: true, locked: false },
    { id: 2, start: 20, end: 40, animation: 'explosion', visible: true, locked: false },
    { id: 3, start: 40, end: 60, animation: 'chill', visible: true, locked: false }
  ]);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  // Camera state
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE);
  const [cameraHeight, setCameraHeight] = useState(DEFAULT_CAMERA_HEIGHT);
  const [cameraRotation, setCameraRotation] = useState(DEFAULT_CAMERA_ROTATION);
  const [cameraAutoRotate, setCameraAutoRotate] = useState(DEFAULT_CAMERA_AUTO_ROTATE);
  const [cameraKeyframes, setCameraKeyframes] = useState<CameraKeyframe[]>([
    { time: 0, distance: 15, height: 0, rotation: 0, easing: 'linear' },
    { time: 20, distance: 15, height: 0, rotation: 0, easing: 'linear' },
    { time: 40, distance: 15, height: 0, rotation: 0, easing: 'linear' }
  ]);
  const [cameraShakes, setCameraShakes] = useState<CameraShake[]>([]);
  const [presetKeyframes, setPresetKeyframes] = useState<PresetKeyframe[]>([]);
  const [textKeyframes, setTextKeyframes] = useState<TextKeyframe[]>([]);

  // PHASE 2: Colors (initialized from project settings)
  const [bassColor, setBassColor] = useState('#8a2be2');
  const [midsColor, setMidsColor] = useState('#40e0d0');
  const [highsColor, setHighsColor] = useState('#c8b4ff');
  const [backgroundColor, setBackgroundColor] = useState(projectSettings.backgroundColor);
  const [borderColor, setBorderColor] = useState('#9333ea');

  // Effects
  const [showLetterbox, setShowLetterbox] = useState(false);
  const [letterboxSize, setLetterboxSize] = useState(0);
  const [useLetterboxAnimation, setUseLetterboxAnimation] = useState(false);
  const [letterboxKeyframes, setLetterboxKeyframes] = useState<LetterboxKeyframe[]>([]);
  const [maxLetterboxHeight, setMaxLetterboxHeight] = useState(270);
  const [activeLetterboxInvert, setActiveLetterboxInvert] = useState(false);

  // Manual control mode
  const [manualMode, setManualMode] = useState(false);

  // UI state
  const [showSongName, setShowSongName] = useState(false);
  const [customSongName, setCustomSongName] = useState('');
  const [showPresetDisplay, setShowPresetDisplay] = useState(true);
  const [showFilename, setShowFilename] = useState(true);
  const [showBorder, setShowBorder] = useState(true);

  // Lighting
  const [ambientLightIntensity, setAmbientLightIntensity] = useState(0.5);
  const [directionalLightIntensity, setDirectionalLightIntensity] = useState(0.5);

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState('webm');
  const [exportResolution, setExportResolution] = useState('960x540');

  // Debug/Log state
  const [errorLog, setErrorLog] = useState<LogEntry[]>([]);
  const [fps, setFps] = useState(0);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);

  // Panel resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(256); // 64 * 4 = 256px (w-64)
  const [rightPanelWidth, setRightPanelWidth] = useState(320); // 80 * 4 = 320px (w-80)
  const [timelineHeight, setTimelineHeight] = useState(256); // h-64
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);
  const [isResizingTimeline, setIsResizingTimeline] = useState(false);

  // PHASE 2: Log project initialization
  useEffect(() => {
    addLog(`Project "${projectSettings.name}" initialized`, 'success');
    addLog(`Resolution: ${projectSettings.resolution.width}x${projectSettings.resolution.height} @ ${projectSettings.fps}fps`, 'info');
    addLog(`Background: ${projectSettings.backgroundColor}`, 'info');
  }, [projectSettings]);

  // Helper functions
  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setErrorLog((prev: LogEntry[]) => [...prev, { message, type, timestamp }].slice(-10));
  };

  const getCurrentSection = (): Section | null => {
    return sections.find((s: Section) => currentTime >= s.start && currentTime < s.end) || null;
  };

  // Section management
  const addSection = () => {
    const last = sections[sections.length - 1];
    const startTime = last ? last.end : 0;
    const endTime = startTime + 20;
    const newSection: Section = {
      id: Date.now(),
      start: startTime,
      end: endTime,
      animation: 'orbit',
      visible: true,
      locked: false
    };
    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
  };

  const deleteSection = (id: number) => {
    setSections(sections.filter((s: Section) => s.id !== id));
    if (selectedSectionId === id) {
      setSelectedSectionId(null);
    }
  };

  const duplicateSection = (id: number) => {
    const sectionToDuplicate = sections.find((s: Section) => s.id === id);
    if (!sectionToDuplicate) return;

    const newSection: Section = {
      ...sectionToDuplicate,
      id: Date.now(),
      start: sectionToDuplicate.end,
      end: sectionToDuplicate.end + (sectionToDuplicate.end - sectionToDuplicate.start)
    };
    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
    addLog(`Duplicated section "${ANIMATION_TYPES.find(a => a.value === newSection.animation)?.label}"`, 'success');
  };

  const updateSection = (id: number, field: string, value: any) => {
    setSections(sections.map((s: Section) => s.id === id ? { ...s, [field]: value } : s));
  };

  const toggleSectionVisibility = (id: number) => {
    setSections(sections.map((s: Section) => 
      s.id === id ? { ...s, visible: !(s.visible !== false) } : s
    ));
  };

  const toggleSectionLock = (id: number) => {
    setSections(sections.map((s: Section) => 
      s.id === id ? { ...s, locked: !(s.locked === true) } : s
    ));
  };

  const reorderSections = (newSections: Section[]) => {
    setSections(newSections);
  };

  // Keyframe management
  const addPresetKeyframe = (time: number) => {
    const currentSection = getCurrentSection();
    const preset = currentSection?.animation || 'orbit';
    const newKeyframe: PresetKeyframe = {
      id: Date.now(),
      time: parseFloat(time.toFixed(2)),
      preset
    };
    setPresetKeyframes([...presetKeyframes, newKeyframe].sort((a, b) => a.time - b.time));
    addLog(`Added preset keyframe at ${formatTime(time)}`, 'success');
  };

  const deletePresetKeyframe = (id: number) => {
    setPresetKeyframes(presetKeyframes.filter(kf => kf.id !== id));
    addLog('Deleted preset keyframe', 'info');
  };

  const addCameraKeyframe = (time: number) => {
    const newKeyframe: CameraKeyframe = {
      time: parseFloat(time.toFixed(2)),
      distance: cameraDistance,
      height: cameraHeight,
      rotation: cameraRotation,
      easing: 'linear'
    };
    setCameraKeyframes([...cameraKeyframes, newKeyframe].sort((a, b) => a.time - b.time));
    addLog(`Added camera keyframe at ${formatTime(time)}`, 'success');
  };

  const deleteCameraKeyframe = (time: number) => {
    setCameraKeyframes(cameraKeyframes.filter(kf => kf.time !== time));
    addLog('Deleted camera keyframe', 'info');
  };

  const addTextKeyframe = (time: number) => {
    const newKeyframe: TextKeyframe = {
      id: Date.now(),
      time: parseFloat(time.toFixed(2)),
      show: showSongName
    };
    setTextKeyframes([...textKeyframes, newKeyframe].sort((a, b) => a.time - b.time));
    addLog(`Added text keyframe at ${formatTime(time)}`, 'success');
  };

  const deleteTextKeyframe = (id: number) => {
    setTextKeyframes(textKeyframes.filter(kf => kf.id !== id));
    addLog('Deleted text keyframe', 'info');
  };

  const formatTime = (s: number) => 
    `${Math.floor(s/60)}:${(Math.floor(s%60)).toString().padStart(2,'0')}`;


  // PHASE 1: Audio management with robust error handling
  const initAudio = async (file: File) => {
    try {
      addLog(`Loading audio: ${file.name}`, 'info');
      
      // PHASE 1: Clean up existing audio context properly
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        addLog('Closed previous audio context', 'info');
      }
      
      // PHASE 1: Create new audio context and analyser
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048; // FFT size for frequency analysis
      
      // PHASE 1: Decode audio file
      const arrayBuffer = await file.arrayBuffer();
      const buf = await ctx.decodeAudioData(arrayBuffer);
      
      // PHASE 1: Store refs (single source of truth)
      audioBufferRef.current = buf;
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      
      // PHASE 1: Update state
      setDuration(buf.duration);
      setAudioReady(true);
      setCurrentTime(0);
      pauseTimeRef.current = 0;
      
      addLog(`Audio loaded successfully! Duration: ${buf.duration.toFixed(2)}s`, 'success');
    } catch (e) {
      console.error('Audio init error:', e);
      const error = e as Error;
      addLog(`Audio load error: ${error.message}`, 'error');
      setAudioReady(false);
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      addLog('No file selected', 'error');
      return;
    }
    
    // PHASE 1: Validate file type
    if (!file.type.startsWith('audio/')) {
      addLog(`Invalid file type: ${file.type}. Please select an audio file.`, 'error');
      return;
    }
    
    setAudioFileName(file.name.replace(/\.[^/.]+$/, ''));
    initAudio(file);
  };

  const playAudio = () => {
    // PHASE 1: Validate audio system is ready
    if (!audioContextRef.current || !audioBufferRef.current || !analyserRef.current) {
      addLog('Audio not ready for playback', 'error');
      return;
    }
    
    try {
      // PHASE 1: Stop existing source if playing
      if (bufferSourceRef.current) {
        bufferSourceRef.current.stop();
      }
      
      // PHASE 1: Create new buffer source
      const src = audioContextRef.current.createBufferSource();
      src.buffer = audioBufferRef.current;
      src.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      src.start(0, pauseTimeRef.current);
      
      bufferSourceRef.current = src;
      startTimeRef.current = Date.now() - (pauseTimeRef.current * 1000);
      setIsPlaying(true);
      
      addLog(`Playback started at ${pauseTimeRef.current.toFixed(2)}s`, 'success');
    } catch (e) {
      console.error('Playback error:', e);
      const error = e as Error;
      addLog(`Playback error: ${error.message}`, 'error');
    }
  };

  const stopAudio = () => {
    try {
      if (bufferSourceRef.current) {
        pauseTimeRef.current = currentTime;
        bufferSourceRef.current.stop();
        bufferSourceRef.current = null;
      }
      setIsPlaying(false);
      addLog('Playback stopped', 'info');
    } catch (e) {
      console.error('Stop audio error:', e);
      const error = e as Error;
      addLog(`Stop error: ${error.message}`, 'error');
    }
  };

  const seekTo = (t: number) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) stopAudio();
    pauseTimeRef.current = t;
    setCurrentTime(t);
    if (wasPlaying) playAudio();
  };

  // Video export
  const exportVideo = async () => {
    addLog('Export feature requires full implementation', 'info');
    // Full export logic from original file would go here
  };

  // PHASE 1: Frequency analysis helper (pure function, no side effects)
  const getFreq = (d: Uint8Array) => ({
    bass: d.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255,
    mids: d.slice(10, 100).reduce((a, b) => a + b, 0) / 90 / 255,
    highs: d.slice(100, 200).reduce((a, b) => a + b, 0) / 100 / 255
  });

  // PHASE 1: UNIFIED RENDER LOOP
  // Replaces both the idle loop and the playing loop with a single continuous loop
  // This loop runs continuously and checks isPlaying state internally
  useEffect(() => {
    const scene = sceneRef.current;
    const cam = cameraRef.current;
    const rend = rendererRef.current;
    const obj = objectsRef.current;

    // Don't start render loop until scene is initialized
    if (!scene || !cam || !rend || !obj) return;

    addLog('Starting unified render loop', 'info');
    
    const data = new Uint8Array(analyserRef.current?.frequencyBinCount || 2048);

    const render = () => {
      animationRef.current = requestAnimationFrame(render);

      // PHASE 1: Update time if playing
      if (isPlaying && audioContextRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const t = Math.min(elapsed, duration);
        setCurrentTime(t);

        if (t >= duration) {
          stopAudio();
          return;
        }

        // Get frequency data when playing
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(data);
        }
      }

      // PHASE 1: Get current section from timeline (single source of truth)
      const t = currentTime;
      const sec = sections.find((s: Section) => t >= s.start && t < s.end);
      const type = sec?.animation || 'orbit';
      const isVisible = sec?.visible !== false;

      // PHASE 1: Get frequency data (defaults to 0 when not playing)
      const f = isPlaying && analyserRef.current ? getFreq(data) : { bass: 0, mids: 0, highs: 0 };

      // Handle preset transitions with cleanup
      if (type !== prevAnimRef.current) {
        transitionRef.current = 0;
        prevAnimRef.current = type;
        addLog(`Switching to preset: ${type}`, 'info');
        
        // CRITICAL FIX: Reset all object properties to default state when switching presets
        // This prevents visual artifacts from previous presets
        obj.cubes.forEach(c => {
          c.position.set(0, 0, 0);
          c.rotation.set(0, 0, 0);
          c.scale.set(1, 1, 1);
          (c.material as THREE.MeshBasicMaterial).opacity = 1;
          (c.material as THREE.MeshBasicMaterial).wireframe = true;
        });
        obj.octas.forEach(o => {
          o.position.set(0, 0, 0);
          o.rotation.set(0, 0, 0);
          o.scale.set(1, 1, 1);
          (o.material as THREE.MeshBasicMaterial).opacity = 1;
          (o.material as THREE.MeshBasicMaterial).wireframe = true;
        });
        obj.tetras.forEach(t => {
          t.position.set(0, 0, 0);
          t.rotation.set(0, 0, 0);
          t.scale.set(1, 1, 1);
          (t.material as THREE.MeshBasicMaterial).opacity = 1;
          (t.material as THREE.MeshBasicMaterial).wireframe = true;
        });
        obj.sphere.position.set(0, 0, 0);
        obj.sphere.rotation.set(0, 0, 0);
        obj.sphere.scale.set(1, 1, 1);
        (obj.sphere.material as THREE.MeshBasicMaterial).opacity = 1;
        (obj.sphere.material as THREE.MeshBasicMaterial).wireframe = true;
      }
      if (transitionRef.current < 1) {
        transitionRef.current = Math.min(1, transitionRef.current + 0.02);
      }
      const blend = transitionRef.current;

      // Camera settings
      const activeCameraDistance = cameraDistance;
      const activeCameraHeight = cameraHeight;
      const activeCameraRotation = cameraRotation;
      const el = elapsed; // Elapsed time for animations

      // Apply visibility - hide all objects if layer is not visible
      if (!isVisible) {
        obj.cubes.forEach(c => { c.visible = false; });
        obj.octas.forEach(o => { o.visible = false; });
        obj.tetras.forEach(t => { t.visible = false; });
        obj.sphere.visible = false;
        rend.render(scene, cam);
        return;
      } else {
        // Make all visible for rendering
        obj.cubes.forEach(c => { c.visible = true; });
        obj.octas.forEach(o => { o.visible = true; });
        obj.tetras.forEach(t => { t.visible = true; });
        obj.sphere.visible = true;
      }

      // PRESET ANIMATIONS
      if (type === 'orbit') {
        // Orbital Dance - Solar system with orbiting planets
        const rotationSpeed = cameraAutoRotate ? el * 0.2 : 0;
        const r = activeCameraDistance - f.bass * 5;
        cam.position.set(Math.cos(rotationSpeed + activeCameraRotation) * r, 10 + activeCameraHeight, Math.sin(rotationSpeed + activeCameraRotation) * r);
        cam.lookAt(0, 0, 0);
        
        // Central sphere as sun
        obj.sphere.position.set(0, 0, 0);
        const sunScale = 3 + f.bass * 2;
        obj.sphere.scale.set(sunScale, sunScale, sunScale);
        obj.sphere.rotation.y += 0.01;
        (obj.sphere.material as THREE.MeshBasicMaterial).color.setStyle(bassColor);
        (obj.sphere.material as THREE.MeshBasicMaterial).opacity = (0.9 + f.bass * 0.1) * blend;
        (obj.sphere.material as THREE.MeshBasicMaterial).wireframe = false;
        
        // Cubes as planets
        obj.cubes.forEach((planet, i) => {
          const orbitRadius = 5 + i * 1.8;
          const orbitSpeed = 0.8 / (1 + i * 0.3);
          const angle = el * orbitSpeed + i * 0.5;
          const tilt = Math.sin(i) * 0.3;
          planet.position.x = Math.cos(angle) * orbitRadius;
          planet.position.z = Math.sin(angle) * orbitRadius;
          planet.position.y = Math.sin(angle * 2) * tilt;
          const sizeVariation = [0.8, 0.6, 1.0, 0.7, 2.5, 2.2, 1.8, 1.6][i] || 1.0;
          const planetSize = sizeVariation + f.bass * 0.3;
          planet.scale.set(planetSize, planetSize, planetSize);
          planet.rotation.y += 0.02 + i * 0.005;
          const colorIndex = i % 3;
          (planet.material as THREE.MeshBasicMaterial).color.setStyle(colorIndex === 0 ? bassColor : colorIndex === 1 ? midsColor : highsColor);
          (planet.material as THREE.MeshBasicMaterial).opacity = (0.8 + f.bass * 0.2) * blend;
          (planet.material as THREE.MeshBasicMaterial).wireframe = false;
        });
        
        // Octas as moons and distant objects
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
          (moon.material as THREE.MeshBasicMaterial).color.setStyle(midsColor);
          (moon.material as THREE.MeshBasicMaterial).opacity = (0.6 + f.mids * 0.4) * blend;
          (moon.material as THREE.MeshBasicMaterial).wireframe = false;
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
          (rogue.material as THREE.MeshBasicMaterial).color.setStyle(midsColor);
          (rogue.material as THREE.MeshBasicMaterial).opacity = (0.4 + f.mids * 0.2) * blend;
          (rogue.material as THREE.MeshBasicMaterial).wireframe = true;
        });
        
        // Tetras as asteroid belt
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
          (asteroid.material as THREE.MeshBasicMaterial).color.setStyle(highsColor);
          (asteroid.material as THREE.MeshBasicMaterial).opacity = (0.5 + f.highs * 0.4) * blend;
          (asteroid.material as THREE.MeshBasicMaterial).wireframe = true;
        });

      } else if (type === 'explosion') {
        // Explosion - Objects explode outward from center
        cam.position.set(0, activeCameraHeight, activeCameraDistance - f.bass * 10);
        cam.lookAt(0, 0, 0);
        
        obj.sphere.position.set(0, 0, 0);
        const ss = 1.5 + f.bass + f.mids * 0.5;
        obj.sphere.scale.set(ss, ss, ss);
        obj.sphere.rotation.x += 0.005;
        obj.sphere.rotation.y += 0.01;
        (obj.sphere.material as THREE.MeshBasicMaterial).opacity = (0.4 + f.bass * 0.4) * blend;
        (obj.sphere.material as THREE.MeshBasicMaterial).color.setStyle(bassColor);
        (obj.sphere.material as THREE.MeshBasicMaterial).wireframe = true;
        
        obj.cubes.forEach((c, i) => {
          const rad = 15 + f.bass * 10;
          const a = (i / obj.cubes.length) * Math.PI * 2;
          c.position.set(Math.cos(a + el) * rad, Math.sin(a + el) * rad, Math.cos(el * 2 + i) * 5);
          c.rotation.x += 0.05 + f.bass * 0.1;
          c.rotation.y += 0.05 + f.bass * 0.1;
          const s = 2 + f.bass * 1.5;
          c.scale.set(s, s, s);
          (c.material as THREE.MeshBasicMaterial).opacity = (0.6 + f.bass * 0.4) * blend;
          (c.material as THREE.MeshBasicMaterial).color.setStyle(bassColor);
          (c.material as THREE.MeshBasicMaterial).wireframe = true;
        });
        
        obj.octas.forEach((o, i) => {
          const radius = 10 + i * 0.5 + f.mids * 8;
          const angle = el + i;
          o.position.x = Math.cos(angle) * radius;
          o.position.y = Math.sin(angle) * radius;
          o.position.z = 0;
          o.rotation.x += 0.1 + f.mids * 0.05;
          o.rotation.y += 0.1 + f.mids * 0.03;
          const s = 1.2 + f.mids * 0.8;
          o.scale.set(s, s, s);
          (o.material as THREE.MeshBasicMaterial).opacity = (0.4 + f.mids * 0.5) * blend;
          (o.material as THREE.MeshBasicMaterial).color.setStyle(midsColor);
          (o.material as THREE.MeshBasicMaterial).wireframe = true;
        });
        
        obj.tetras.forEach((tr, i) => {
          const sp = 0.5 + i * 0.1;
          const rad = 3 + f.highs * 5;
          tr.position.set(Math.cos(el * sp + i) * rad, Math.sin(el * sp * 1.3 + i) * rad, Math.sin(el * sp * 0.7 + i) * rad);
          tr.rotation.x += 0.03 + f.highs * 0.1;
          tr.rotation.y += 0.02 + f.highs * 0.08;
          const s = 0.5 + f.highs * 0.5;
          tr.scale.set(s, s, s);
          (tr.material as THREE.MeshBasicMaterial).opacity = (0.4 + f.highs * 0.6) * blend;
          (tr.material as THREE.MeshBasicMaterial).color.setStyle(highsColor);
          (tr.material as THREE.MeshBasicMaterial).wireframe = true;
        });

      } else if (type === 'tunnel') {
        // Tunnel Rush - NEW PRESET - Fast-moving tunnel effect
        const tunnelSpeed = el * 5;
        cam.position.set(0, 0, activeCameraDistance);
        cam.lookAt(0, 0, -20);
        
        // Hide sphere
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        (obj.sphere.material as THREE.MeshBasicMaterial).opacity = 0;
        
        // Cubes form tunnel rings
        obj.cubes.forEach((c, i) => {
          const z = -i * 5 + (tunnelSpeed % 5);
          const angle = (i % 4) * (Math.PI / 2) + el;
          const radius = 8 + f.bass * 3;
          c.position.x = Math.cos(angle) * radius;
          c.position.y = Math.sin(angle) * radius;
          c.position.z = z;
          c.rotation.z = angle;
          const s = 1.5 + f.bass * 1;
          c.scale.set(s, s, s * 3);
          (c.material as THREE.MeshBasicMaterial).color.setStyle(bassColor);
          (c.material as THREE.MeshBasicMaterial).opacity = (0.7 + f.bass * 0.3) * blend;
          (c.material as THREE.MeshBasicMaterial).wireframe = false;
        });
        
        // Octas as tunnel walls
        obj.octas.forEach((o, i) => {
          const z = -(i % 10) * 3 + (tunnelSpeed % 3);
          const ringIndex = Math.floor(i / 10);
          const angle = (i % 10) * (Math.PI * 2 / 10) + ringIndex * 0.5;
          const radius = 10 + f.mids * 2;
          o.position.x = Math.cos(angle) * radius;
          o.position.y = Math.sin(angle) * radius;
          o.position.z = z;
          o.rotation.x = 0;
          o.rotation.y = el + i;
          const s = 0.8 + f.mids * 0.5;
          o.scale.set(s, s, s);
          (o.material as THREE.MeshBasicMaterial).color.setStyle(midsColor);
          (o.material as THREE.MeshBasicMaterial).opacity = (0.6 + f.mids * 0.4) * blend;
          (o.material as THREE.MeshBasicMaterial).wireframe = true;
        });
        
        // Tetras as particles rushing past
        obj.tetras.forEach((t, i) => {
          const z = -(i % 15) * 2 + (tunnelSpeed * 2 % 2);
          const angle = (i / 15) * Math.PI * 2;
          const radius = 6 + Math.sin(el + i) * 2 + f.highs * 2;
          t.position.x = Math.cos(angle) * radius;
          t.position.y = Math.sin(angle) * radius;
          t.position.z = z;
          t.rotation.x += 0.1;
          t.rotation.y += 0.15;
          const s = 0.4 + f.highs * 0.6;
          t.scale.set(s, s, s);
          (t.material as THREE.MeshBasicMaterial).color.setStyle(highsColor);
          (t.material as THREE.MeshBasicMaterial).opacity = (0.5 + f.highs * 0.5) * blend;
          (t.material as THREE.MeshBasicMaterial).wireframe = true;
        });

      } else if (type === 'wave') {
        // Wave Motion - Flowing wave path
        const pathProgress = el * 2;
        cam.position.set(Math.sin(pathProgress * 0.3) * 3, Math.cos(pathProgress * 0.4) * 2 + 2 + activeCameraHeight, activeCameraDistance - 5);
        cam.lookAt(Math.sin((pathProgress + 2) * 0.3) * 3, Math.cos((pathProgress + 2) * 0.4) * 2, -10);
        
        // Octas form the wave
        obj.octas.slice(0, 30).forEach((segment, i) => {
          const segmentTime = el * 3 - i * 0.3;
          const waveValue = f.bass * Math.sin(segmentTime * 10 + i) + f.mids * Math.cos(segmentTime * 7 + i * 0.5) + f.highs * Math.sin(segmentTime * 15 + i * 2);
          const x = Math.sin(segmentTime * 0.3) * 3;
          const y = waveValue * 3;
          const z = -i * 1.5;
          segment.position.set(x, y, z);
          const thickness = 0.4 + f.bass * 0.4;
          segment.scale.set(thickness, thickness, 1);
          segment.rotation.set(0, 0, 0);
          (segment.material as THREE.MeshBasicMaterial).color.setStyle(bassColor);
          (segment.material as THREE.MeshBasicMaterial).opacity = (0.8 + f.bass * 0.2) * blend;
          (segment.material as THREE.MeshBasicMaterial).wireframe = false;
        });
        
        // Cubes as vectorscope patterns
        const vectorscopePositions = [{x: -8, y: 5, z: -10}, {x: 8, y: -3, z: -15}, {x: -5, y: -5, z: -20}];
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
          c.rotation.z = t;
          (c.material as THREE.MeshBasicMaterial).color.setStyle(midsColor);
          (c.material as THREE.MeshBasicMaterial).opacity = (0.8 + f.mids * 0.2) * blend;
          (c.material as THREE.MeshBasicMaterial).wireframe = false;
        });
        
        // Hide sphere
        obj.sphere.position.set(0, -1000, 0);
        obj.sphere.scale.set(0.001, 0.001, 0.001);
        (obj.sphere.material as THREE.MeshBasicMaterial).opacity = 0;

      } else if (type === 'spiral') {
        // Spiral Galaxy - Spiraling objects
        const rotationSpeed = cameraAutoRotate ? el * 0.3 : 0;
        const a = rotationSpeed + activeCameraRotation;
        cam.position.set(Math.cos(a) * activeCameraDistance, Math.sin(el * 0.2) * 5 + activeCameraHeight, Math.sin(a) * activeCameraDistance);
        cam.lookAt(0, 0, 0);
        
        obj.cubes.forEach((c, i) => {
          const sa = el + i * 0.5;
          const sr = 5 + i * 0.8;
          c.position.set(Math.cos(sa) * sr, Math.sin(el * 2 + i) * 3 + i - 4, Math.sin(sa) * sr);
          c.rotation.x += 0.03;
          c.rotation.y += 0.02;
          const s = 1.5 + f.bass * 1.2;
          c.scale.set(s, s, s);
          (c.material as THREE.MeshBasicMaterial).opacity = (0.5 + f.bass * 0.4) * blend;
          (c.material as THREE.MeshBasicMaterial).color.setStyle(bassColor);
        });
        
        obj.octas.forEach((o, i) => {
          const angle = el * 2 + i * 0.3;
          const radius = 3 + Math.sin(el + i) * 2 + f.mids * 2;
          o.position.x = Math.cos(angle) * radius;
          o.position.y = i * 0.5 - 5;
          o.position.z = Math.sin(angle) * radius;
          o.rotation.x += 0.02 + f.mids * 0.05;
          o.rotation.y += 0.02 + f.mids * 0.03;
          const s = 1 + f.mids * 0.7;
          o.scale.set(s, s, s);
          (o.material as THREE.MeshBasicMaterial).opacity = (0.4 + f.mids * 0.4) * blend;
          (o.material as THREE.MeshBasicMaterial).color.setStyle(midsColor);
        });

      } else if (type === 'chill') {
        // Chill Vibes - Slow, gentle movement
        cam.position.set(0, 5 + activeCameraHeight, activeCameraDistance);
        cam.lookAt(0, 0, 0);
        
        obj.cubes.forEach((c, i) => {
          const a = (i / obj.cubes.length) * Math.PI * 2;
          const rad = 6 + Math.sin(el * 0.5 + i) * 1;
          c.position.set(Math.cos(a + el * 0.3) * rad, Math.sin(el * 0.4 + i) * 1.5, Math.sin(a + el * 0.3) * rad);
          c.rotation.x += 0.005;
          c.rotation.y += 0.005;
          const s = 0.8 + f.bass * 0.4;
          c.scale.set(s, s, s);
          (c.material as THREE.MeshBasicMaterial).opacity = (0.4 + f.bass * 0.3) * blend;
          (c.material as THREE.MeshBasicMaterial).color.setStyle(bassColor);
        });
        
        obj.octas.forEach((o, i) => {
          o.rotation.x += 0.008 + f.mids * 0.05;
          o.rotation.y += 0.005 + f.mids * 0.03;
          o.position.y = Math.sin(el * 0.6 + i * 0.3) * 2 + f.mids * 2;
          const s = 0.8 + f.mids * 0.3;
          o.scale.set(s, s, s);
          (o.material as THREE.MeshBasicMaterial).opacity = (0.3 + f.mids * 0.3) * blend;
          (o.material as THREE.MeshBasicMaterial).color.setStyle(midsColor);
        });

      } else if (type === 'pulse') {
        // Pulse Grid - Grid that pulses to the beat
        cam.position.set(0, activeCameraHeight, activeCameraDistance);
        cam.lookAt(0, 0, 0);
        
        obj.cubes.forEach((c, i) => {
          const gridX = (i % 4 - 1.5) * 5;
          const gridY = (Math.floor(i / 4) - 1) * 5;
          c.position.set(gridX, gridY, Math.sin(el * 3 + i) * (2 + f.bass * 5));
          c.rotation.x = el + i;
          c.rotation.y = el * 1.5;
          const s = 1.5 + f.bass * 2.5;
          c.scale.set(s, s, s);
          (c.material as THREE.MeshBasicMaterial).opacity = (0.5 + f.bass * 0.5) * blend;
          (c.material as THREE.MeshBasicMaterial).color.setStyle(bassColor);
        });
        
        obj.octas.forEach((o, i) => {
          const gridPos = i % 16;
          const x = (gridPos % 4 - 1.5) * 4;
          const y = (Math.floor(gridPos / 4) - 1.5) * 4;
          o.position.set(x, y, Math.cos(el * 2 + i * 0.1) * (1 + f.mids * 3));
          o.rotation.x += 0.02 + f.mids * 0.05;
          o.rotation.y += 0.01 + f.mids * 0.03;
          o.rotation.z += 0.05;
          const s = 0.8 + f.mids * 0.8;
          o.scale.set(s, s, s);
          (o.material as THREE.MeshBasicMaterial).opacity = (0.4 + f.mids * 0.5) * blend;
          (o.material as THREE.MeshBasicMaterial).color.setStyle(midsColor);
        });

      } else if (type === 'vortex') {
        // Vortex Storm - Spinning vortex
        cam.position.set(0, 15 + activeCameraHeight, activeCameraDistance);
        cam.lookAt(0, 0, 0);
        
        obj.cubes.forEach((c, i) => {
          const angle = el * 2 + i * 0.8;
          const radius = 3 + i * 1.5 + f.bass * 5;
          const height = Math.sin(el + i * 0.5) * 10;
          c.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
          c.rotation.x += 0.1;
          c.rotation.y += 0.15;
          const s = 1.8 + f.bass * 1.5;
          c.scale.set(s, s, s);
          (c.material as THREE.MeshBasicMaterial).opacity = (0.6 + f.bass * 0.4) * blend;
          (c.material as THREE.MeshBasicMaterial).color.setStyle(bassColor);
        });
        
        obj.octas.forEach((o, i) => {
          const angle = -el * 3 + i * 0.5;
          const radius = 5 + Math.sin(el + i) * 3 + f.mids * 4;
          o.position.set(Math.cos(angle) * radius, (i % 10 - 5) * 2, Math.sin(angle) * radius);
          o.rotation.x += 0.08 + f.mids * 0.05;
          o.rotation.y += 0.05 + f.mids * 0.03;
          o.rotation.z += 0.05;
          const s = 1.2 + f.mids * 0.8;
          o.scale.set(s, s, s);
          (o.material as THREE.MeshBasicMaterial).opacity = (0.5 + f.mids * 0.4) * blend;
          (o.material as THREE.MeshBasicMaterial).color.setStyle(midsColor);
        });

      } else if (type === 'seiryu') {
        // Azure Dragon - Dragon-like serpentine movement (FIXED: added proper body rotation)
        const rotationSpeed = cameraAutoRotate ? el * 0.3 : 0;
        cam.position.set(Math.sin(rotationSpeed + activeCameraRotation) * 5, 8 + Math.cos(el * 0.2) * 3 + activeCameraHeight, activeCameraDistance);
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
          // CRITICAL FIX: Calculate rotation to point along the dragon's body path
          const nextT = el * 1.5 - (i + 1) * 0.6;
          const lookX = Math.sin(nextT) * 6;
          const lookY = Math.cos(nextT * 0.5) * 4;
          const lookZ = (progress + 0.1) * -15;
          c.rotation.x = Math.atan2(lookY - y, lookZ - z);
          c.rotation.y = Math.atan2(lookX - x, lookZ - z);
          (c.material as THREE.MeshBasicMaterial).color.setStyle(bassColor);
          (c.material as THREE.MeshBasicMaterial).opacity = (0.8 + f.bass * 0.2) * blend;
          (c.material as THREE.MeshBasicMaterial).wireframe = isHead ? false : true;
        });
        
        // Tetras as dragon horns
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
          (horn.material as THREE.MeshBasicMaterial).color.setStyle(highsColor);
          (horn.material as THREE.MeshBasicMaterial).opacity = (0.9 + f.highs * 0.1) * blend;
          (horn.material as THREE.MeshBasicMaterial).wireframe = false;
        });
        
        // Octas as environment and dragon scales
        obj.octas.forEach((o, i) => {
          if (i < 10) {
            // Mountains (background scenery)
            const mountainX = (i - 5) * 8;
            const mountainHeight = 3 + (i % 3) * 2;
            const mountainZ = -25 - (i % 2) * 5;
            o.position.set(mountainX, -5 + mountainHeight, mountainZ);
            o.rotation.x = 0; // CRITICAL FIX: Reset rotation.x for mountains
            o.rotation.y = el * 0.1 + i;
            const s = 8 + (i % 3) * 3;
            o.scale.set(s, mountainHeight * 2, s);
            (o.material as THREE.MeshBasicMaterial).color.setStyle(midsColor);
            (o.material as THREE.MeshBasicMaterial).opacity = (0.4 + f.mids * 0.2) * blend;
            (o.material as THREE.MeshBasicMaterial).wireframe = true;
          } else {
            // Dragon scales
            const bodyIndex = i % obj.cubes.length;
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
            (o.material as THREE.MeshBasicMaterial).color.setStyle(midsColor);
            (o.material as THREE.MeshBasicMaterial).opacity = (0.7 + f.mids * 0.3) * blend;
            (o.material as THREE.MeshBasicMaterial).wireframe = false;
          }
        });
      }

      // PHASE 1: Always render (whether playing or idle)
      rend.render(scene, cam);
    };

    // PHASE 1: Start the unified render loop immediately
    animationRef.current = requestAnimationFrame(render);
    addLog('Unified render loop started successfully', 'success');

    return () => {
      // PHASE 1: Cleanup - cancel animation frame on unmount or dependency change
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        addLog('Render loop stopped', 'info');
      }
    };
  }, [sections, bassColor, midsColor, highsColor, cameraDistance, cameraHeight, cameraRotation, cameraAutoRotate, duration, isPlaying, currentTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Prevent default for shortcuts we handle
      const shouldPreventDefault = () => {
        switch (e.key.toLowerCase()) {
          case ' ':
          case 'home':
          case 'end':
          case 'arrowleft':
          case 'arrowright':
          case 'arrowup':
          case 'arrowdown':
            return true;
          default:
            return false;
        }
      };

      if (shouldPreventDefault()) {
        e.preventDefault();
      }

      // Transport controls
      if (e.key === ' ') {
        // Space - Play/Pause
        if (isPlaying) {
          stopAudio();
        } else if (audioReady) {
          playAudio();
        }
      } else if (e.key === 'Home') {
        // Home - Go to start
        seekTo(0);
      } else if (e.key === 'End') {
        // End - Go to end
        seekTo(duration);
      } else if (e.key === 'ArrowLeft') {
        // Left arrow - Step backward
        const step = e.shiftKey ? 5 : 1; // Shift for larger jumps
        seekTo(Math.max(0, currentTime - step));
      } else if (e.key === 'ArrowRight') {
        // Right arrow - Step forward
        const step = e.shiftKey ? 5 : 1;
        seekTo(Math.min(duration, currentTime + step));
      }

      // Section navigation
      if (e.key === '[') {
        // Previous section
        const currentSection = getCurrentSection();
        if (currentSection) {
          const currentIndex = sections.findIndex((s: Section) => s.id === currentSection.id);
          if (currentIndex > 0) {
            const prevSection = sections[currentIndex - 1];
            seekTo(prevSection.start);
            setSelectedSectionId(prevSection.id);
          }
        } else if (sections.length > 0) {
          seekTo(sections[0].start);
          setSelectedSectionId(sections[0].id);
        }
      } else if (e.key === ']') {
        // Next section
        const currentSection = getCurrentSection();
        if (currentSection) {
          const currentIndex = sections.findIndex((s: Section) => s.id === currentSection.id);
          if (currentIndex < sections.length - 1) {
            const nextSection = sections[currentIndex + 1];
            seekTo(nextSection.start);
            setSelectedSectionId(nextSection.id);
          }
        } else if (sections.length > 0) {
          seekTo(sections[0].start);
          setSelectedSectionId(sections[0].id);
        }
      }

      // Preset switching (1-9 keys)
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && selectedSectionId && !e.ctrlKey && !e.metaKey) {
        const presetIndex = num - 1;
        if (presetIndex < ANIMATION_TYPES.length) {
          updateSection(selectedSectionId, 'animation', ANIMATION_TYPES[presetIndex].value);
        }
      }

      // Layer navigation with arrow up/down
      if (e.key === 'ArrowUp' && selectedSectionId) {
        const currentIndex = sections.findIndex((s: Section) => s.id === selectedSectionId);
        if (currentIndex > 0) {
          setSelectedSectionId(sections[currentIndex - 1].id);
        }
      } else if (e.key === 'ArrowDown' && selectedSectionId) {
        const currentIndex = sections.findIndex((s: Section) => s.id === selectedSectionId);
        if (currentIndex < sections.length - 1) {
          setSelectedSectionId(sections[currentIndex + 1].id);
        }
      }

      // Effect toggles
      if (e.key.toLowerCase() === 'g') {
        // G - Toggle letterbox
        setShowLetterbox(!showLetterbox);
      } else if (e.key.toLowerCase() === 'b') {
        // B - Toggle border
        setShowBorder(!showBorder);
      }

      // Debug console toggle
      if (e.key === '`') {
        // ` (backtick) - Toggle debug console
        e.preventDefault();
        setShowDebugConsole(!showDebugConsole);
      }

      // Camera controls
      if (e.key.toLowerCase() === 'r' && selectedSectionId === null) {
        // R - Reset camera (only when no section selected to avoid conflicts)
        setCameraDistance(DEFAULT_CAMERA_DISTANCE);
        setCameraHeight(DEFAULT_CAMERA_HEIGHT);
        setCameraRotation(DEFAULT_CAMERA_ROTATION);
        setCameraAutoRotate(DEFAULT_CAMERA_AUTO_ROTATE);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPlaying,
    audioReady,
    currentTime,
    duration,
    sections,
    selectedSectionId,
    showLetterbox,
    showBorder,
    showDebugConsole
  ]);

  // Handle panel resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = Math.max(200, Math.min(600, e.clientX));
        setLeftPanelWidth(newWidth);
      } else if (isResizingRight) {
        const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX));
        setRightPanelWidth(newWidth);
      } else if (isResizingTimeline) {
        const newHeight = Math.max(150, Math.min(500, window.innerHeight - e.clientY));
        setTimelineHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      setIsResizingTimeline(false);
    };

    if (isResizingLeft || isResizingRight || isResizingTimeline) {
      document.body.style.cursor = isResizingTimeline ? 'ns-resize' : 'ew-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingLeft, isResizingRight, isResizingTimeline]);

  // PHASE 1: Initialize Three.js scene (lifecycle management)
  // This effect runs once and sets up the stable scene/camera/renderer
  // The unified render loop (above) handles all animation
  useEffect(() => {
    if (!containerRef.current) return;

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    
    try {
      addLog('Initializing Three.js scene...', 'info');
      
      // PHASE 1: Create scene with fog
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x0a0a14, 10, 50);
      sceneRef.current = scene;
      
      // PHASE 1: Create camera (960x540 = 16:9 aspect ratio)
      camera = new THREE.PerspectiveCamera(75, 960/540, 0.1, 1000);
      camera.position.z = 15;
      cameraRef.current = camera;

      // PHASE 1: Create renderer with required flags for video export
      renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true, 
        preserveDrawingBuffer: true // Required for video capture
      });
      renderer.setSize(960, 540);
      renderer.setClearColor(0x0a0a14);

      // PHASE 1: Clean up any existing renderer before adding new one
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

    // PHASE 1: Create 3D objects (geometry created once, animated by render loop)
    const cubes: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i++) {
      const c = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: 0x8a2be2, wireframe: true, transparent: true, opacity: 0.6 })
      );
      const a = (i / 8) * Math.PI * 2;
      c.position.x = Math.cos(a) * 8;
      c.position.z = Math.sin(a) * 8;
      scene.add(c);
      cubes.push(c);
    }

    const octas: THREE.Mesh[] = [];
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 6 + r * 4; i++) {
        const o = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.5),
          new THREE.MeshBasicMaterial({ color: 0x40e0d0, wireframe: true, transparent: true, opacity: 0.5 })
        );
        const a = (i / (6 + r * 4)) * Math.PI * 2;
        const rad = 5 + r * 2;
        o.position.x = Math.cos(a) * rad;
        o.position.y = Math.sin(a) * rad;
        o.position.z = -r * 2;
        scene.add(o);
        octas.push(o);
      }
    }

    const tetras: THREE.Mesh[] = [];
    for (let i = 0; i < 30; i++) {
      const t = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.3),
        new THREE.MeshBasicMaterial({ color: 0xc8b4ff, transparent: true, opacity: 0.7 })
      );
      t.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
      scene.add(t);
      tetras.push(t);
    }

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x8a2be2, wireframe: true, transparent: true, opacity: 0.4 })
    );
    scene.add(sphere);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientLightIntensity);
    scene.add(ambientLight);
    lightsRef.current.ambient = ambientLight;
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, directionalLightIntensity);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    lightsRef.current.directional = directionalLight;
    
    objectsRef.current = { cubes, octas, tetras, sphere };
    addLog(`Added ${cubes.length} cubes, ${octas.length} octas, ${tetras.length} tetras`, 'success');

    // PHASE 1: No idle render loop needed - the unified loop below handles both playing and idle states

    return () => {
      // PHASE 1: Cleanup - renderer disposal handled here
      if (rendererRef.current) {
        try {
          if (containerRef.current && containerRef.current.contains(rendererRef.current.domElement)) {
            containerRef.current.removeChild(rendererRef.current.domElement);
          }
          rendererRef.current.dispose();
          addLog('Renderer disposed successfully', 'info');
        } catch (e) {
          console.error('Cleanup error:', e);
          addLog(`Cleanup error: ${(e as Error).message}`, 'error');
        }
      }
    };
  }, [ambientLightIntensity, directionalLightIntensity]);

  // Load default font for 3D text
  useEffect(() => {
    const loader = new FontLoader();
    
    // Load Helvetiker font from CDN
    addLog('Loading font for 3D text...', 'info');
    loader.load(
      'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
      (font) => {
        fontRef.current = font;
        setFontLoaded(true);
        addLog('Font loaded successfully', 'success');
      },
      undefined,
      (error) => {
        console.error('Font loading error:', error);
        addLog('Failed to load font', 'error');
      }
    );
  }, []);

  // PHASE 2: Load initial audio file from project settings
  useEffect(() => {
    if (initialAudioFile) {
      addLog(`Loading initial audio: ${initialAudioFile.name}`, 'info');
      setAudioFileName(initialAudioFile.name.replace(/\.[^/.]+$/, ''));
      initAudio(initialAudioFile);
    }
  }, [initialAudioFile]);

  // Create/update 3D song name text
  useEffect(() => {
    if (!sceneRef.current || !fontRef.current || !fontLoaded) return;

    // Remove existing text meshes
    songNameMeshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    songNameMeshesRef.current = [];

    // Create new text if showSongName is true
    if (showSongName) {
      const textToDisplay = customSongName || audioFileName || '3D Music Visualizer';
      
      try {
        const textGeometry = new TextGeometry(textToDisplay, {
          font: fontRef.current,
          size: 0.8,
          depth: 0.2,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 0.03,
          bevelSize: 0.02,
          bevelSegments: 5
        });

        textGeometry.center();

        const textMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(bassColor),
          transparent: true,
          opacity: 0.9
        });

        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 5, 0);
        sceneRef.current.add(textMesh);
        songNameMeshesRef.current.push(textMesh);
        
        addLog(`3D text created: "${textToDisplay}"`, 'success');
      } catch (error) {
        console.error('Text geometry error:', error);
        addLog('Failed to create 3D text', 'error');
      }
    }

    // Trigger a re-render if not playing
    if (!isPlaying && rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [showSongName, customSongName, audioFileName, fontLoaded, bassColor, isPlaying]);

  // Update scene background and lighting when settings change
  useEffect(() => {
    if (sceneRef.current && rendererRef.current) {
      const bgColor = new THREE.Color(backgroundColor);
      sceneRef.current.background = bgColor;
      sceneRef.current.fog = new THREE.Fog(backgroundColor, 10, 50);
      rendererRef.current.setClearColor(backgroundColor);
    }
  }, [backgroundColor]);

  // CRITICAL FIX: Update lighting intensities safely without breaking animation
  useEffect(() => {
    if (lightsRef.current.ambient) {
      lightsRef.current.ambient.intensity = ambientLightIntensity;
    }
    if (lightsRef.current.directional) {
      lightsRef.current.directional.intensity = directionalLightIntensity;
    }
    // Trigger a re-render if animation is not playing
    if (!isPlaying && rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [ambientLightIntensity, directionalLightIntensity, isPlaying]);

  // Get selected section
  const selectedSection = selectedSectionId 
    ? sections.find((s: Section) => s.id === selectedSectionId) || null 
    : null;

  // Get current preset name for TopBar
  const currentPreset = getCurrentSection() 
    ? ANIMATION_TYPES.find(a => a.value === getCurrentSection()?.animation)?.label || null
    : null;

  return (
    <div className="h-screen bg-[#1E1E1E] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <TopBar
        isPlaying={isPlaying}
        audioReady={audioReady}
        currentTime={currentTime}
        duration={duration}
        currentPreset={currentPreset}
        audioFileName={audioFileName}
        projectName={projectSettings.name} // PHASE 2: Pass project name from settings
        onPlay={playAudio}
        onStop={stopAudio}
        onExport={() => setShowExportModal(true)}
        onAudioFileChange={handleAudioFileChange}
        canUndo={false}
        canRedo={false}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Layers */}
        <div style={{ width: `${leftPanelWidth}px` }} className="flex-shrink-0 relative">
          <LeftPanel
            sections={sections}
            selectedSectionId={selectedSectionId}
            animationTypes={ANIMATION_TYPES}
            onSelectSection={setSelectedSectionId}
            onToggleVisibility={toggleSectionVisibility}
            onToggleLock={toggleSectionLock}
            onDeleteSection={deleteSection}
            onReorderSections={reorderSections}
            onDuplicateSection={duplicateSection}
          />
          {/* Resize handle for left panel */}
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-purple-500 transition-colors"
            onMouseDown={() => setIsResizingLeft(true)}
            title="Drag to resize"
          />
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 min-w-0">
          <CanvasWrapper
            containerRef={containerRef}
            showBorder={showBorder}
            borderColor={borderColor}
            showLetterbox={showLetterbox}
            letterboxSize={letterboxSize}
            activeLetterboxInvert={activeLetterboxInvert}
            maxLetterboxHeight={maxLetterboxHeight}
            showFilename={showFilename}
            audioFileName={audioFileName}
          />
        </div>

        {/* Right Panel - Properties */}
        <div style={{ width: `${rightPanelWidth}px` }} className="flex-shrink-0 relative">
          {/* Resize handle for right panel */}
          <div
            className="absolute top-0 left-0 w-1 h-full cursor-ew-resize hover:bg-purple-500 transition-colors z-10"
            onMouseDown={() => setIsResizingRight(true)}
            title="Drag to resize"
          />
          <RightPanel
            selectedSection={selectedSection}
            animationTypes={ANIMATION_TYPES}
            bassColor={bassColor}
            midsColor={midsColor}
            highsColor={highsColor}
            backgroundColor={backgroundColor}
            borderColor={borderColor}
            ambientLightIntensity={ambientLightIntensity}
            directionalLightIntensity={directionalLightIntensity}
            cameraDistance={cameraDistance}
            cameraHeight={cameraHeight}
            cameraRotation={cameraRotation}
            cameraAutoRotate={cameraAutoRotate}
            showLetterbox={showLetterbox}
            letterboxSize={letterboxSize}
            showBorder={showBorder}
            showSongName={showSongName}
            customSongName={customSongName}
            fontLoaded={fontLoaded}
            manualMode={manualMode}
            onUpdateSection={updateSection}
            onSetBassColor={setBassColor}
            onSetMidsColor={setMidsColor}
            onSetHighsColor={setHighsColor}
            onSetBackgroundColor={setBackgroundColor}
            onSetBorderColor={setBorderColor}
            onSetAmbientLight={setAmbientLightIntensity}
            onSetDirectionalLight={setDirectionalLightIntensity}
            onSetCameraDistance={setCameraDistance}
            onSetCameraHeight={setCameraHeight}
            onSetCameraRotation={setCameraRotation}
            onSetCameraAutoRotate={setCameraAutoRotate}
            onSetShowLetterbox={setShowLetterbox}
            onSetLetterboxSize={setLetterboxSize}
            onSetShowBorder={setShowBorder}
            onSetShowSongName={setShowSongName}
            onSetCustomSongName={setCustomSongName}
            onSetManualMode={setManualMode}
          />
        </div>
      </div>

      {/* Bottom - Timeline */}
      <div style={{ height: `${timelineHeight}px` }} className="flex-shrink-0 relative">
        {/* Resize handle for timeline */}
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-purple-500 transition-colors z-10"
          onMouseDown={() => setIsResizingTimeline(true)}
          title="Drag to resize"
        />
        <Timeline
          sections={sections}
          currentTime={currentTime}
          duration={duration}
          animationTypes={ANIMATION_TYPES}
          selectedSectionId={selectedSectionId}
          audioBuffer={audioBufferRef.current}
          showWaveform={true}
          presetKeyframes={presetKeyframes}
          cameraKeyframes={cameraKeyframes}
          textKeyframes={textKeyframes}
          onSelectSection={setSelectedSectionId}
          onUpdateSection={updateSection}
          onAddSection={addSection}
          onSeek={seekTo}
          onAddPresetKeyframe={addPresetKeyframe}
          onAddCameraKeyframe={addCameraKeyframe}
          onAddTextKeyframe={addTextKeyframe}
          onDeletePresetKeyframe={deletePresetKeyframe}
          onDeleteCameraKeyframe={deleteCameraKeyframe}
          onDeleteTextKeyframe={deleteTextKeyframe}
        />
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        isExporting={isExporting}
        exportProgress={exportProgress}
        exportFormat={exportFormat}
        exportResolution={exportResolution}
        audioReady={audioReady}
        onClose={() => setShowExportModal(false)}
        onExport={exportVideo}
        onSetFormat={setExportFormat}
        onSetResolution={setExportResolution}
      />

      {/* Debug Console */}
      <DebugConsole
        logs={errorLog}
        isOpen={showDebugConsole}
        onToggle={() => setShowDebugConsole(!showDebugConsole)}
      />
    </div>
  );
}
