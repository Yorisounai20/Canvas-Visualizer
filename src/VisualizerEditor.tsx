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
import { Section, CameraKeyframe, LetterboxKeyframe, CameraShake, LogEntry, AnimationType } from './types';

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

/**
 * VisualizerEditor - Main After Effects-style editor component
 * Coordinates all panels and manages the 3D visualization state
 */
export default function VisualizerEditor() {
  // Refs for Three.js
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const bufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
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

  // Colors
  const [bassColor, setBassColor] = useState('#8a2be2');
  const [midsColor, setMidsColor] = useState('#40e0d0');
  const [highsColor, setHighsColor] = useState('#c8b4ff');
  const [backgroundColor, setBackgroundColor] = useState('#0a0a14');
  const [borderColor, setBorderColor] = useState('#9333ea');

  // Effects
  const [showLetterbox, setShowLetterbox] = useState(false);
  const [letterboxSize, setLetterboxSize] = useState(0);
  const [useLetterboxAnimation, setUseLetterboxAnimation] = useState(false);
  const [letterboxKeyframes, setLetterboxKeyframes] = useState<LetterboxKeyframe[]>([]);
  const [maxLetterboxHeight, setMaxLetterboxHeight] = useState(270);
  const [activeLetterboxInvert, setActiveLetterboxInvert] = useState(false);

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

  // Audio management
  const initAudio = async (file: File) => {
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
      addLog('Audio loaded successfully!', 'success');
    } catch (e) {
      console.error(e);
      const error = e as Error;
      addLog(`Audio load error: ${error.message}`, 'error');
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setAudioFileName(f.name.replace(/\.[^/.]+$/, ''));
      initAudio(f);
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

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    let scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer;
    
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

    // Create 3D objects
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
    addLog(`Added ${cubes.length} cubes, ${octas.length} octas, ${tetras.length} tetras`, 'info');

    // Idle render loop (when not playing)
    let idleAnimFrame: number;
    const idleRender = () => {
      idleAnimFrame = requestAnimationFrame(idleRender);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    idleAnimFrame = requestAnimationFrame(idleRender);

    return () => {
      if (idleAnimFrame) cancelAnimationFrame(idleAnimFrame);
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
  }, [ambientLightIntensity, directionalLightIntensity]);

  // Update scene background and lighting when settings change
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
        onPlay={playAudio}
        onStop={stopAudio}
        onExport={() => setShowExportModal(true)}
        canUndo={false}
        canRedo={false}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Layers */}
        <LeftPanel
          sections={sections}
          selectedSectionId={selectedSectionId}
          animationTypes={ANIMATION_TYPES}
          onSelectSection={setSelectedSectionId}
          onToggleVisibility={toggleSectionVisibility}
          onToggleLock={toggleSectionLock}
          onDeleteSection={deleteSection}
          onReorderSections={reorderSections}
        />

        {/* Center - Canvas */}
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

        {/* Right Panel - Properties */}
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
        />
      </div>

      {/* Bottom - Timeline */}
      <Timeline
        sections={sections}
        currentTime={currentTime}
        duration={duration}
        animationTypes={ANIMATION_TYPES}
        selectedSectionId={selectedSectionId}
        onSelectSection={setSelectedSectionId}
        onUpdateSection={updateSection}
        onAddSection={addSection}
        onSeek={seekTo}
      />

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

      {/* Audio Upload - Floating button */}
      <div className="fixed bottom-72 right-4 z-30">
        <div className="bg-[#2B2B2B] rounded-lg p-4 shadow-2xl border border-gray-700">
          <label className="text-cyan-400 text-sm font-semibold block mb-2">
            Upload Audio
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioFileChange}
            className="block w-full text-xs text-gray-300 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
