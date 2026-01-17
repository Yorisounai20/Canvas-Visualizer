/**
 * TimelineV2 - Scrollable Per-Track Timeline
 * 
 * New timeline implementation with:
 * - Two-column layout (fixed left labels, scrollable right content)
 * - Sticky time ruler at top
 * - Per-track waveforms
 * - Horizontal and vertical scrolling
 * - Wheel zoom and pan (to be implemented in PR C)
 */

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { Section, AnimationType, PresetKeyframe, CameraKeyframe, TextKeyframe, EnvironmentKeyframe, WorkspaceObject, CameraFXClip, LetterboxKeyframe, TextAnimatorKeyframe, MaskRevealKeyframe, CameraRigKeyframe, CameraFXKeyframe } from '../../types';
import WaveformVisualizer from './WaveformVisualizer';
import { ParameterEvent } from '../VisualizerSoftware/types';

// Particle emitter keyframe type (not in main types yet)
interface ParticleEmitterKeyframe {
  id: number;
  time: number;
  duration: number;
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
}
import { 
  BASE_PX_PER_SECOND, 
  MIN_ZOOM, 
  MAX_ZOOM, 
  calculatePixelsPerSecond,
  calculateTimelineWidth,
  formatTime,
  timeToPixels,
  pixelsToTime,
  clampZoom
} from './utils';

// Re-export TimelineProps from original Timeline for compatibility
interface TimelineProps {
  sections: Section[];
  currentTime: number;
  duration: number;
  animationTypes: AnimationType[];
  selectedSectionId: number | null;
  audioBuffer: AudioBuffer | null;
  showWaveform?: boolean;
  presetKeyframes: PresetKeyframe[];
  cameraKeyframes: CameraKeyframe[];
  textKeyframes: TextKeyframe[];
  environmentKeyframes: EnvironmentKeyframe[];
  presetSpeedKeyframes?: Array<{ id: number; time: number; speed: number; easing: string }>;
  letterboxKeyframes?: LetterboxKeyframe[];
  textAnimatorKeyframes?: TextAnimatorKeyframe[];
  maskRevealKeyframes?: MaskRevealKeyframe[];
  cameraRigKeyframes?: CameraRigKeyframe[];
  cameraFXKeyframes?: CameraFXKeyframe[];
  particleEmitterKeyframes?: ParticleEmitterKeyframe[];
  parameterEvents?: ParameterEvent[];
  workspaceObjects?: WorkspaceObject[];
  cameraFXClips?: CameraFXClip[];
  selectedFXClipId?: string | null;
  isPlaying?: boolean;
  onSelectSection: (id: number) => void;
  onUpdateSection: (id: number, field: string, value: any) => void;
  onAddSection: () => void;
  onSeek: (time: number) => void;
  onTogglePlayPause?: () => void;
  onAddPresetKeyframe?: (time: number) => void;
  onAddCameraKeyframe?: (time: number) => void;
  onAddTextKeyframe?: (time: number) => void;
  onAddEnvironmentKeyframe?: (time: number) => void;
  onDeletePresetKeyframe?: (id: number) => void;
  onDeleteCameraKeyframe?: (time: number) => void;
  onDeleteTextKeyframe?: (id: number) => void;
  onDeleteEnvironmentKeyframe?: (id: number) => void;
  onUpdatePresetKeyframe?: (id: number, preset: string) => void;
  onUpdateCameraKeyframe?: (time: number, updates: Partial<CameraKeyframe>) => void;
  onUpdateTextKeyframe?: (id: number, show: boolean, text?: string) => void;
  onUpdateEnvironmentKeyframe?: (id: number, type: string, intensity: number, color?: string) => void;
  onMovePresetKeyframe?: (id: number, newTime: number) => void;
  onMoveTextKeyframe?: (id: number, newTime: number) => void;
  onMoveEnvironmentKeyframe?: (id: number, newTime: number) => void;
  onMoveSpeedKeyframe?: (id: number, newTime: number) => void;
  onMoveLetterboxKeyframe?: (id: number, newTime: number) => void;
  onMoveTextAnimatorKeyframe?: (id: string, newTime: number) => void;
  onMoveMaskRevealKeyframe?: (id: string, newTime: number) => void;
  onMoveCameraRigKeyframe?: (id: string, newTime: number) => void;
  onMoveCameraFXKeyframe?: (id: string, newTime: number) => void;
  onMoveParticleEmitterKeyframe?: (id: number, newTime: number) => void;
  onMoveParameterEvent?: (id: string, newTime: number) => void;
  onSelectFXClip?: (id: string) => void;
  onUpdateCameraFXClip?: (id: string, updates: Partial<CameraFXClip>) => void;
  onDeleteCameraFXClip?: (id: string) => void;
  onAddCameraFXClip?: (type: 'grid' | 'kaleidoscope' | 'pip', startTime: number) => void;
}

const LEFT_COLUMN_WIDTH = 240; // Fixed width for track labels
const RULER_HEIGHT = 40; // Height of time ruler
const TRACK_HEIGHT = 80; // Height of each track row
const MIN_TIMELINE_WIDTH = 800; // Minimum width for timeline content

// Snap mode constants
const DEFAULT_FPS = 30; // Fixed frame rate for the application
const DEFAULT_BPM = 120; // Fixed tempo for beat snapping
const SNAP_MODES: Array<'none' | 'frame' | 'beat' | 'second'> = ['none', 'frame', 'beat', 'second'];

export default function TimelineV2({
  currentTime,
  duration,
  audioBuffer,
  showWaveform = true,
  onSeek,
  isPlaying = false,
  onTogglePlayPause,
  presetKeyframes = [],
  cameraKeyframes = [],
  textKeyframes = [],
  environmentKeyframes = [],
  presetSpeedKeyframes = [],
  letterboxKeyframes = [],
  textAnimatorKeyframes = [],
  maskRevealKeyframes = [],
  cameraRigKeyframes = [],
  cameraFXKeyframes = [],
  particleEmitterKeyframes = [],
  parameterEvents = [],
  onMovePresetKeyframe,
  onMoveTextKeyframe,
  onMoveEnvironmentKeyframe,
  onMoveSpeedKeyframe,
  onMoveLetterboxKeyframe,
  onMoveTextAnimatorKeyframe,
  onMoveMaskRevealKeyframe,
  onMoveCameraRigKeyframe,
  onMoveCameraFXKeyframe,
  onMoveParticleEmitterKeyframe,
  onMoveParameterEvent,
  onUpdateCameraKeyframe,
}: TimelineProps) {
  const [zoomLevel, setZoomLevel] = useState(() => {
    // Load from localStorage (Chunk 6.4)
    try {
      const saved = localStorage.getItem('cv_timeline_zoom_level');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= MIN_ZOOM && parsed <= MAX_ZOOM) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load zoom level from localStorage:', e);
    }
    return 1.0;
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  
  // Snap mode state - controls how keyframes snap when dragging
  type SnapMode = 'none' | 'frame' | 'beat' | 'second';
  const [snapMode, setSnapMode] = useState<SnapMode>(() => {
    // Load from localStorage
    try {
      const saved = localStorage.getItem('cv_timeline_snap_mode');
      if (saved && SNAP_MODES.includes(saved as SnapMode)) {
        return saved as SnapMode;
      }
    } catch (e) {
      console.warn('Failed to load snap mode from localStorage:', e);
    }
    return 'frame'; // Default to frame snapping
  });
  
  // Playhead dragging state
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  
  // Keyframe dragging state
  const [isDraggingKeyframe, setIsDraggingKeyframe] = useState(false);
  const [draggedKeyframe, setDraggedKeyframe] = useState<{
    trackType: string;
    keyframeId: string;
    originalTime: number;
    currentTime: number;
  } | null>(null);
  // Use ref to track drag time to avoid closure issues
  const draggedTimeRef = useRef<number>(0);
  
  // Track collapse state (Chunk 6.1)
  const [collapsedTracks, setCollapsedTracks] = useState<Set<string>>(() => {
    // Load from localStorage (Chunk 6.4)
    try {
      const saved = localStorage.getItem('cv_timeline_collapsed_tracks');
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        return new Set(parsed);
      }
    } catch (e) {
      console.warn('Failed to load collapsed tracks from localStorage:', e);
    }
    return new Set();
  });
  
  // Track naming state (Chunk 6.2)
  const [trackNames, setTrackNames] = useState<Map<string, string>>(() => {
    // Load from localStorage (Chunk 6.4)
    try {
      const saved = localStorage.getItem('cv_timeline_track_names');
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Map(Object.entries(parsed));
      }
    } catch (e) {
      console.warn('Failed to load track names from localStorage:', e);
    }
    return new Map();
  });
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingTrackName, setEditingTrackName] = useState('');
  
  // Marquee selection state
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectedKeyframes, setSelectedKeyframes] = useState<Set<string>>(new Set());
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    trackType: string;
    keyframeId: string;
    time: number;
  } | null>(null);

  // Calculate dimensions
  const pixelsPerSecond = useMemo(() => calculatePixelsPerSecond(zoomLevel), [zoomLevel]);
  const timelineWidth = useMemo(
    () => calculateTimelineWidth(duration, zoomLevel, MIN_TIMELINE_WIDTH),
    [duration, zoomLevel]
  );

  // Mock tracks for initial implementation
  // TODO: Replace with actual track data from props in future PRs
  const tracks = useMemo(() => [
    { id: 'audio', name: 'Audio', type: 'audio' as const },
    { id: 'presets', name: 'Presets', type: 'preset' as const },
    { id: 'preset-speed', name: 'Preset Speed', type: 'presetSpeed' as const },
    { id: 'camera', name: 'Camera', type: 'camera' as const },
    { id: 'camera-rig', name: 'Camera Rig', type: 'cameraRig' as const },
    { id: 'camera-fx', name: 'Camera FX', type: 'cameraFX' as const },
    { id: 'text', name: 'Text', type: 'text' as const },
    { id: 'text-animator', name: 'Text Animator', type: 'textAnimator' as const },
    { id: 'letterbox', name: 'Letterbox', type: 'letterbox' as const },
    { id: 'mask-reveal', name: 'Mask Reveal', type: 'maskReveal' as const },
    { id: 'particles', name: 'Particles', type: 'particles' as const },
    { id: 'fx-events', name: 'FX Events', type: 'fxEvents' as const },
    { id: 'environment', name: 'Environment', type: 'environment' as const },
  ], []);

  // Handle wheel zoom (shift+wheel) and scroll (wheel)
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!scrollContainerRef.current) return;

    // Shift+wheel = zoom centered at mouse position
    if (e.shiftKey) {
      e.preventDefault();
      
      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left + container.scrollLeft;
      
      // Calculate time position under mouse before zoom
      const timeUnderMouse = pixelsToTime(mouseX, pixelsPerSecond);
      
      // Calculate new zoom level
      const zoomDelta = -e.deltaY * 0.001; // Adjust sensitivity
      const newZoom = clampZoom(zoomLevel + zoomDelta);
      
      if (newZoom !== zoomLevel) {
        setZoomLevel(newZoom);
        
        // After zoom, calculate new pixel position for the same time
        // and adjust scroll to keep that time under the mouse
        requestAnimationFrame(() => {
          const newPixelsPerSecond = calculatePixelsPerSecond(newZoom);
          const newMouseX = timeToPixels(timeUnderMouse, newPixelsPerSecond);
          const mouseOffsetInViewport = e.clientX - rect.left;
          container.scrollLeft = newMouseX - mouseOffsetInViewport;
        });
      }
    } else {
      // Normal wheel = horizontal scroll
      // Let browser handle this naturally, but we could customize if needed
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  }, [zoomLevel, pixelsPerSecond]);

  // Handle right-click pan start
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    // Always prevent browser context menu - keyframes show custom menu with stopPropagation
    e.preventDefault();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    
    // Shift+right-click = marquee selection
    if (e.button === 2 && e.shiftKey) {
      e.preventDefault();
      setIsMarqueeSelecting(true);
      const x = e.clientX - rect.left + container.scrollLeft;
      const y = e.clientY - rect.top + container.scrollTop;
      setMarqueeStart({ x, y });
      setMarqueeEnd({ x, y });
      document.body.style.cursor = 'crosshair';
    }
    // Right-click (button 2) without shift = pan
    else if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
      };
      document.body.style.cursor = 'grabbing';
    }
    // Left-click on empty area = clear selection
    else if (e.button === 0) {
      // Clear selection when clicking on timeline background
      setSelectedKeyframes(new Set());
    }
  }, []);

  // Handle pan move and end at document level
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      if (isPanning && panStartRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        
        container.scrollLeft = panStartRef.current.scrollLeft - dx;
        container.scrollTop = panStartRef.current.scrollTop - dy;
      } else if (isMarqueeSelecting && marqueeStart) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left + container.scrollLeft;
        const y = e.clientY - rect.top + container.scrollTop;
        setMarqueeEnd({ x, y });
      } else if (isDraggingPlayhead) {
        // Smooth playhead dragging with RAF throttling
        requestAnimationFrame(() => {
          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left + container.scrollLeft;
          const time = pixelsToTime(x, pixelsPerSecond);
          onSeek(Math.max(0, Math.min(duration, time)));
        });
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        setIsPanning(false);
        panStartRef.current = null;
        document.body.style.cursor = '';
      } else if (isMarqueeSelecting) {
        // Finalize marquee selection
        setIsMarqueeSelecting(false);
        document.body.style.cursor = '';
        
        // Select keyframes within marquee rectangle
        if (marqueeStart && marqueeEnd) {
          const left = Math.min(marqueeStart.x, marqueeEnd.x);
          const right = Math.max(marqueeStart.x, marqueeEnd.x);
          const top = Math.min(marqueeStart.y, marqueeEnd.y);
          const bottom = Math.max(marqueeStart.y, marqueeEnd.y);
          
          const newSelectedKeyframes = new Set<string>();
          
          // Check all keyframes from all tracks
          const allKeyframes = [
            ...presetKeyframes.map(k => ({ ...k, type: 'preset', y: 80 })), // Estimate track Y positions
            ...presetSpeedKeyframes.map(k => ({ ...k, type: 'presetSpeed', y: 160 })),
            ...cameraKeyframes.map(k => ({ ...k, type: 'camera', y: 240 })),
            ...cameraRigKeyframes.map(k => ({ ...k, type: 'cameraRig', y: 320 })),
            ...cameraFXKeyframes.map(k => ({ ...k, type: 'cameraFX', y: 400 })),
            ...textKeyframes.map(k => ({ ...k, type: 'text', y: 480 })),
            ...textAnimatorKeyframes.map(k => ({ ...k, type: 'textAnimator', y: 560 })),
            ...letterboxKeyframes.map(k => ({ ...k, type: 'letterbox', y: 640 })),
            ...maskRevealKeyframes.map(k => ({ ...k, type: 'maskReveal', y: 720 })),
            ...particleEmitterKeyframes.map(k => ({ ...k, type: 'particleEmitter', y: 800 })),
            ...parameterEvents.map(k => ({ ...k, type: 'parameterEvent', y: 880 })),
            ...environmentKeyframes.map(k => ({ ...k, type: 'environment', y: 960 })),
          ];
          
          allKeyframes.forEach((kf: any) => {
            // Handle different time field names
            const kfTime = kf.time !== undefined ? kf.time : kf.startTime !== undefined ? kf.startTime : 0;
            const kfX = timeToPixels(kfTime, pixelsPerSecond);
            const kfY = kf.y; // Approximate track Y position
            
            if (kfX >= left && kfX <= right && kfY >= top && kfY <= bottom) {
              newSelectedKeyframes.add(`${kf.type}-${kf.id}`);
            }
          });
          
          setSelectedKeyframes(newSelectedKeyframes);
          console.log(`Marquee selected ${newSelectedKeyframes.size} keyframes`);
        }
        
        setMarqueeStart(null);
        setMarqueeEnd(null)
      } else if (isDraggingPlayhead) {
        setIsDraggingPlayhead(false);
        document.body.style.cursor = '';
      }
    };

    if (isPanning || isMarqueeSelecting || isDraggingPlayhead) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, isMarqueeSelecting, isDraggingPlayhead, marqueeStart, pixelsPerSecond, duration, onSeek]);

  // Attach wheel listener to scroll container
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle when timeline area has focus
    if (!scrollContainerRef.current?.contains(document.activeElement)) return;

    const DEFAULT_FPS = 30;
    const frameTime = 1 / DEFAULT_FPS;

    switch (e.key) {
      case ' ':
      case 'Spacebar': // For older browsers
        e.preventDefault();
        if (onTogglePlayPause) {
          onTogglePlayPause();
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd+Left = -5 seconds
          onSeek(Math.max(0, currentTime - 5));
        } else if (e.shiftKey) {
          // Shift+Left = -1 second
          onSeek(Math.max(0, currentTime - 1));
        } else {
          // Left = -1 frame
          onSeek(Math.max(0, currentTime - frameTime));
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd+Right = +5 seconds
          onSeek(Math.min(duration, currentTime + 5));
        } else if (e.shiftKey) {
          // Shift+Right = +1 second
          onSeek(Math.min(duration, currentTime + 1));
        } else {
          // Right = +1 frame
          onSeek(Math.min(duration, currentTime + frameTime));
        }
        break;

      case 'Home':
        e.preventDefault();
        onSeek(0);
        break;

      case 'End':
        e.preventDefault();
        onSeek(duration);
        break;

      case 'PageUp':
        e.preventDefault();
        // Jump backward by visible viewport width (in time)
        if (scrollContainerRef.current) {
          const viewportWidth = scrollContainerRef.current.clientWidth;
          const viewportTime = pixelsToTime(viewportWidth, pixelsPerSecond);
          onSeek(Math.max(0, currentTime - viewportTime));
        }
        break;

      case 'PageDown':
        e.preventDefault();
        // Jump forward by visible viewport width (in time)
        if (scrollContainerRef.current) {
          const viewportWidth = scrollContainerRef.current.clientWidth;
          const viewportTime = pixelsToTime(viewportWidth, pixelsPerSecond);
          onSeek(Math.min(duration, currentTime + viewportTime));
        }
        break;
    }
  }, [currentTime, duration, onSeek, pixelsPerSecond]);

  // Attach keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Sync left column vertical scroll with right column
  useEffect(() => {
    const rightColumn = scrollContainerRef.current;
    const leftColumn = leftColumnRef.current;
    
    if (!rightColumn || !leftColumn) return;
    
    const handleScroll = () => {
      // Sync vertical scroll from right to left
      leftColumn.scrollTop = rightColumn.scrollTop;
    };
    
    rightColumn.addEventListener('scroll', handleScroll);
    
    return () => {
      rightColumn.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const playheadPixelX = timeToPixels(currentTime, pixelsPerSecond);
    const scrollLeft = container.scrollLeft;
    const viewportWidth = container.clientWidth;
    
    // If playhead is off-screen to the left
    if (playheadPixelX < scrollLeft) {
      container.scrollLeft = playheadPixelX - 50; // 50px padding
    }
    // If playhead is off-screen to the right
    else if (playheadPixelX > scrollLeft + viewportWidth) {
      container.scrollLeft = playheadPixelX - viewportWidth + 50; // 50px padding
    }
  }, [currentTime, pixelsPerSecond]);
  
  // Persist zoom level to localStorage (Chunk 6.4)
  useEffect(() => {
    try {
      localStorage.setItem('cv_timeline_zoom_level', zoomLevel.toString());
    } catch (e) {
      console.warn('Failed to save zoom level to localStorage:', e);
    }
  }, [zoomLevel]);
  
  // Persist collapsed tracks to localStorage (Chunk 6.4)
  useEffect(() => {
    try {
      const array = Array.from(collapsedTracks);
      localStorage.setItem('cv_timeline_collapsed_tracks', JSON.stringify(array));
    } catch (e) {
      console.warn('Failed to save collapsed tracks to localStorage:', e);
    }
  }, [collapsedTracks]);
  
  // Persist track names to localStorage (Chunk 6.4)
  useEffect(() => {
    try {
      const obj = Object.fromEntries(trackNames);
      localStorage.setItem('cv_timeline_track_names', JSON.stringify(obj));
    } catch (e) {
      console.warn('Failed to save track names to localStorage:', e);
    }
  }, [trackNames]);
  
  // Persist snap mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cv_timeline_snap_mode', snapMode);
    } catch (e) {
      console.warn('Failed to save snap mode to localStorage:', e);
    }
  }, [snapMode]);

  // Handle timeline click for seeking
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't seek if we were panning or dragging playhead
    if (isPanning || isDraggingPlayhead) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelsToTime(x, pixelsPerSecond);
    onSeek(Math.max(0, Math.min(duration, time)));
  };
  
  // Handle track collapse/expand toggle (Chunk 6.1)
  const toggleTrackCollapse = useCallback((trackId: string) => {
    setCollapsedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  }, []);
  
  // Handle track rename (Chunk 6.2)
  const startRenameTrack = useCallback((trackId: string, currentName: string) => {
    setEditingTrackId(trackId);
    setEditingTrackName(trackNames.get(trackId) || currentName);
  }, [trackNames]);
  
  const commitTrackRename = useCallback(() => {
    if (editingTrackId && editingTrackName.trim()) {
      setTrackNames(prev => {
        const newMap = new Map(prev);
        newMap.set(editingTrackId, editingTrackName.trim());
        return newMap;
      });
    }
    setEditingTrackId(null);
    setEditingTrackName('');
  }, [editingTrackId, editingTrackName]);
  
  const cancelTrackRename = useCallback(() => {
    setEditingTrackId(null);
    setEditingTrackName('');
  }, []);

  // Render time ruler markers - adapts to snap mode
  const renderRulerMarkers = () => {
    const markers: JSX.Element[] = [];
    let secondsInterval: number;
    
    // Determine interval based on snap mode and zoom level
    if (snapMode === 'none') {
      // Default behavior: zoom-based intervals
      secondsInterval = zoomLevel < 0.5 ? 10 : zoomLevel < 1 ? 5 : 1;
    } else if (snapMode === 'frame') {
      // Show every 1 second (multiple frames grouped for readability)
      secondsInterval = zoomLevel < 0.5 ? 10 : zoomLevel < 1 ? 5 : 1;
    } else if (snapMode === 'beat') {
      // Show every beat (0.5s at 120 BPM) or every 2 beats for clarity
      secondsInterval = zoomLevel < 1 ? 1.0 : 0.5;
    } else if (snapMode === 'second') {
      // Show whole seconds
      secondsInterval = zoomLevel < 0.5 ? 10 : zoomLevel < 1 ? 5 : 1;
    } else {
      secondsInterval = 1;
    }
    
    for (let time = 0; time <= duration; time += secondsInterval) {
      const x = timeToPixels(time, pixelsPerSecond);
      markers.push(
        <div
          key={time}
          className="absolute top-0 bottom-0 flex flex-col items-center"
          style={{ left: `${x}px` }}
        >
          <div className="w-px h-2 bg-gray-500" />
          <span className="text-xs text-gray-400 mt-1">
            {formatTime(time)}
          </span>
        </div>
      );
    }
    
    return markers;
  };

  // Apply snapping based on current snap mode
  // Note: Frame rate and BPM are fixed constants for this timeline implementation
  // These match the default recording settings and common music tempo
  const applySnapping = (time: number): number => {
    const BEATS_PER_SECOND = DEFAULT_BPM / 60; // 2 beats/sec at 120 BPM
    // At 120 BPM: 1 beat = 0.5s, quarter note = 0.125s, so 8 quarter notes per second
    const QUARTER_NOTES_PER_SECOND = BEATS_PER_SECOND * 4; // 8 quarter notes/sec
    
    switch (snapMode) {
      case 'none':
        return time; // No snapping
      case 'frame':
        // Snap to 30fps frames (~0.033s per frame)
        return Math.round(time * DEFAULT_FPS) / DEFAULT_FPS;
      case 'beat':
        // Snap to quarter notes (1/4 of a beat at 120 BPM = 0.125s)
        return Math.round(time * QUARTER_NOTES_PER_SECOND) / QUARTER_NOTES_PER_SECOND;
      case 'second':
        // Snap to whole seconds
        return Math.round(time);
      default:
        return time;
    }
  };
  
  // Get snap mode label for button display
  const getSnapModeLabel = (mode: SnapMode): string => {
    switch (mode) {
      case 'none': return 'Off';
      case 'frame': return 'Frame';
      case 'beat': return 'Beat';
      case 'second': return 'Sec';
      default: return 'Off';
    }
  };
  
  // Render grid lines based on snap mode
  const renderGridLines = () => {
    const lines: JSX.Element[] = [];
    let interval: number;
    let showMinorLines = true;
    
    // Determine grid interval based on snap mode and zoom
    switch (snapMode) {
      case 'none':
        interval = 1.0; // 1 second intervals
        showMinorLines = false;
        break;
      case 'frame':
        // Show frame lines only at higher zoom levels to avoid clutter
        if (zoomLevel >= 2.0) {
          interval = 1.0 / DEFAULT_FPS; // Frame intervals (~0.033s)
        } else if (zoomLevel >= 1.0) {
          interval = 0.1; // Every 3 frames (10fps markers)
        } else {
          interval = 1.0; // 1 second at low zoom
          showMinorLines = false;
        }
        break;
      case 'beat':
        // Show beat subdivisions at higher zoom
        if (zoomLevel >= 1.5) {
          interval = 0.125; // Quarter note intervals (0.125s at 120 BPM)
        } else if (zoomLevel >= 0.75) {
          interval = 0.25; // Half beat intervals
        } else {
          interval = 0.5; // Full beat intervals
          showMinorLines = false;
        }
        break;
      case 'second':
        interval = 1.0; // 1 second intervals
        showMinorLines = false;
        break;
      default:
        interval = 1.0;
        showMinorLines = false;
    }
    
    // Generate grid lines at calculated intervals
    for (let time = 0; time <= duration; time += interval) {
      const x = timeToPixels(time, pixelsPerSecond);
      // Make major lines (whole seconds) more visible
      const isSecond = Math.abs(time - Math.round(time)) < 0.001;
      lines.push(
        <div
          key={time}
          className={`absolute top-0 bottom-0 w-px pointer-events-none ${
            isSecond ? 'bg-gray-700 opacity-40' : 'bg-gray-700 opacity-20'
          }`}
          style={{ left: `${x}px` }}
        />
      );
    }
    
    return lines;
  };
  
  // Get snap mode description for tooltip
  const getSnapModeDescription = (mode: SnapMode): string => {
    switch (mode) {
      case 'none': return 'Off';
      case 'frame': return 'Frame (30fps)';
      case 'beat': return 'Beat (1/4)';
      case 'second': return 'Second';
      default: return 'Unknown';
    }
  };

  // Helper function to extract keyframe IDs in the correct type
  // Keyframes may have numeric or string IDs depending on their type
  // Some keyframes use compound IDs like "preset-1" which need to be parsed
  const extractKeyframeIds = (kf: any, keyId: string | number) => {
    // Try to get numeric ID directly, or parse it from compound ID format
    const numericId = 'id' in kf && typeof kf.id === 'number' ? kf.id : parseInt(String(keyId).split('-').pop() || '0');
    // Try to get string ID directly, or use the full keyId as string
    const stringId = 'id' in kf && typeof kf.id === 'string' ? kf.id : String(keyId);
    return { numericId, stringId };
  };

  // Render keyframes for a track
  const renderKeyframes = (trackType: 'preset' | 'camera' | 'text' | 'environment' | 'presetSpeed' | 'letterbox' | 'textAnimator' | 'maskReveal' | 'cameraRig' | 'cameraFX' | 'particles' | 'fxEvents') => {
    type KeyframeWithTime = PresetKeyframe | CameraKeyframe | TextKeyframe | EnvironmentKeyframe | LetterboxKeyframe | TextAnimatorKeyframe | MaskRevealKeyframe | CameraRigKeyframe | CameraFXKeyframe | ParticleEmitterKeyframe | ParameterEvent | { id: number; time: number; speed: number; easing: string };
    let keyframes: KeyframeWithTime[] = [];
    let color = '';
    
    switch (trackType) {
      case 'preset':
        keyframes = presetKeyframes;
        color = 'bg-cyan-500';
        break;
      case 'presetSpeed':
        keyframes = presetSpeedKeyframes;
        color = 'bg-cyan-300'; // Lighter cyan for speed
        break;
      case 'camera':
        keyframes = cameraKeyframes;
        color = 'bg-purple-500';
        break;
      case 'cameraRig':
        keyframes = cameraRigKeyframes;
        color = 'bg-purple-300'; // Lighter purple for rig
        break;
      case 'cameraFX':
        keyframes = cameraFXKeyframes;
        color = 'bg-purple-700'; // Darker purple for FX
        break;
      case 'text':
        keyframes = textKeyframes;
        color = 'bg-green-500';
        break;
      case 'textAnimator':
        keyframes = textAnimatorKeyframes;
        color = 'bg-green-300'; // Lighter green for animator
        break;
      case 'letterbox':
        keyframes = letterboxKeyframes;
        color = 'bg-yellow-500';
        break;
      case 'maskReveal':
        keyframes = maskRevealKeyframes;
        color = 'bg-pink-500';
        break;
      case 'particles':
        keyframes = particleEmitterKeyframes;
        color = 'bg-blue-500'; // Blue for particles
        break;
      case 'fxEvents':
        keyframes = parameterEvents;
        color = 'bg-red-500'; // Red for FX events
        break;
      case 'environment':
        keyframes = environmentKeyframes;
        color = 'bg-orange-500';
        break;
    }
    
    return keyframes.map((kf, idx) => {
      // Extract time from various keyframe types
      const time = 'time' in kf ? kf.time : 'startTime' in kf ? kf.startTime : 0;
      const keyId = 'id' in kf && kf.id ? kf.id : `${trackType}-${time}-${idx}`;
      const fullKeyId = `${trackType}-${keyId}`;
      const isSelected = selectedKeyframes.has(fullKeyId);
      const isDragging = isDraggingKeyframe && draggedKeyframe?.keyframeId === fullKeyId;
      const displayTime = isDragging && draggedKeyframe ? draggedKeyframe.currentTime : time;
      const x = timeToPixels(displayTime, pixelsPerSecond);
      
      const handleKeyframeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Left click only - right click handled by onContextMenu
        if (e.button !== 0) return;
        
        let hasMoved = false;
        const startX = e.clientX;
        const startY = e.clientY;
        const originalTime = time;
        
        // Initialize ref with original time
        draggedTimeRef.current = time;
        
        setIsDraggingKeyframe(true);
        setDraggedKeyframe({
          trackType,
          keyframeId: fullKeyId,
          originalTime: time,
          currentTime: time,
        });
        
        const handleMouseMove = (moveE: MouseEvent) => {
          if (!scrollContainerRef.current) return;
          
          // Check if mouse moved enough to consider it a drag (>3px)
          const dx = Math.abs(moveE.clientX - startX);
          const dy = Math.abs(moveE.clientY - startY);
          if (dx > 3 || dy > 3) {
            hasMoved = true;
          }
          
          requestAnimationFrame(() => {
            const rect = scrollContainerRef.current!.getBoundingClientRect();
            const scrollLeft = scrollContainerRef.current!.scrollLeft;
            const relativeX = moveE.clientX - rect.left + scrollLeft;
            let newTime = pixelsToTime(relativeX, pixelsPerSecond);
            
            // Clamp to valid range
            newTime = Math.max(0, Math.min(duration, newTime));
            
            // Apply snapping based on current snap mode
            newTime = applySnapping(newTime);
            
            // Update both state and ref
            draggedTimeRef.current = newTime;
            setDraggedKeyframe(prev => prev ? { ...prev, currentTime: newTime } : null);
          });
        };
        
        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.cursor = '';
          
          if (!hasMoved) {
            // This was a click, not a drag - select the keyframe
            console.log(`Selected keyframe: ${fullKeyId} at ${formatTime(time)}`);
            setSelectedKeyframes(new Set([fullKeyId]));
          } else {
            // This was a drag - check if position actually changed using ref
            const finalTime = draggedTimeRef.current;
            if (finalTime !== originalTime) {
              // Move the keyframe
              console.log(`Move keyframe ${fullKeyId} from ${originalTime} to ${finalTime}`);
              
              // Extract the correct ID based on keyframe structure
              const { numericId, stringId } = extractKeyframeIds(kf, keyId);
              
              switch (trackType) {
                case 'preset':
                  onMovePresetKeyframe?.(numericId, finalTime);
                  break;
                case 'presetSpeed':
                  onMoveSpeedKeyframe?.(numericId, finalTime);
                  break;
                case 'text':
                  onMoveTextKeyframe?.(numericId, finalTime);
                  break;
                case 'environment':
                  onMoveEnvironmentKeyframe?.(numericId, finalTime);
                  break;
                case 'camera':
                  // Camera keyframes identified by time, update via onUpdateCameraKeyframe
                  onUpdateCameraKeyframe?.(originalTime, { time: finalTime });
                  break;
                case 'letterbox':
                  onMoveLetterboxKeyframe?.(numericId, finalTime);
                  break;
                case 'textAnimator':
                  onMoveTextAnimatorKeyframe?.(stringId, finalTime);
                  break;
                case 'maskReveal':
                  onMoveMaskRevealKeyframe?.(stringId, finalTime);
                  break;
                case 'cameraRig':
                  onMoveCameraRigKeyframe?.(stringId, finalTime);
                  break;
                case 'cameraFX':
                  onMoveCameraFXKeyframe?.(stringId, finalTime);
                  break;
                case 'particles':
                  onMoveParticleEmitterKeyframe?.(numericId, finalTime);
                  break;
                case 'fxEvents':
                  onMoveParameterEvent?.(stringId, finalTime);
                  break;
                default:
                  console.warn(`No move handler for track type: ${trackType}`);
              }
            }
          }
          
          setIsDraggingKeyframe(false);
          setDraggedKeyframe(null);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'grabbing';
      };
      
      const handleKeyframeContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          trackType,
          keyframeId: fullKeyId,
          time,
        });
      };
      
      return (
        <div
          key={fullKeyId}
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${color} ${
            isSelected || isDragging ? 'ring-2 ring-white' : ''
          } hover:scale-125 transition-transform ${isDragging ? 'z-50 cursor-grabbing' : 'cursor-grab'}`}
          style={{ 
            left: `${x}px`, 
            marginLeft: '-6px',
            opacity: isDragging ? 1 : isSelected ? 0.9 : 0.8,
          }}
          title={`${trackType} keyframe at ${formatTime(displayTime)}`}
          onMouseDown={handleKeyframeMouseDown}
          onContextMenu={handleKeyframeContextMenu}
        />
      );
    });
  };

  // Render marquee selection rectangle
  const renderMarquee = () => {
    if (!isMarqueeSelecting || !marqueeStart || !marqueeEnd) return null;
    
    const left = Math.min(marqueeStart.x, marqueeEnd.x);
    const top = Math.min(marqueeStart.y, marqueeEnd.y);
    const width = Math.abs(marqueeEnd.x - marqueeStart.x);
    const height = Math.abs(marqueeEnd.y - marqueeStart.y);
    
    return (
      <div
        className="absolute border-2 border-cyan-500 bg-cyan-500 bg-opacity-20 pointer-events-none z-30"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
    );
  };

  // Render playhead
  const playheadX = timeToPixels(currentTime, pixelsPerSecond);

  // Handle context menu actions
  const handleContextMenuAction = (action: 'copy' | 'delete' | 'duplicate') => {
    if (!contextMenu) return;
    
    const { trackType, keyframeId, time } = contextMenu;
    console.log(`${action} keyframe: ${keyframeId} at ${formatTime(time)}`);
    
    // TODO: Implement actual actions based on track type
    // For now, just log the action
    
    setContextMenu(null);
  };
  
  // Close context menu on click away
  useEffect(() => {
    if (!contextMenu) return;
    
    const handleClickAway = () => setContextMenu(null);
    document.addEventListener('click', handleClickAway);
    return () => document.removeEventListener('click', handleClickAway);
  }, [contextMenu]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header with play/pause and zoom controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          {/* Play/Pause button */}
          {onTogglePlayPause && (
            <button
              onClick={onTogglePlayPause}
              className="p-2 rounded bg-cyan-600 hover:bg-cyan-700 transition-colors flex items-center justify-center"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
          )}
          
          <span className="text-sm font-medium">Zoom:</span>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.25}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="w-32"
          />
          <span className="text-xs text-gray-400">{zoomLevel.toFixed(2)}x</span>
          <button
            onClick={() => setZoomLevel(1.0)}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
          >
            Reset
          </button>
          
          {/* Snap mode toggle button */}
          <button
            onClick={() => {
              const currentIndex = SNAP_MODES.indexOf(snapMode);
              const nextMode = SNAP_MODES[(currentIndex + 1) % SNAP_MODES.length];
              setSnapMode(nextMode);
            }}
            className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition-colors ${
              snapMode === 'none' 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-400' 
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
            title={`Snap Mode: ${getSnapModeDescription(snapMode)}\nClick to cycle modes`}
          >
            <span className="text-base">🧲</span>
            <span className="capitalize">{getSnapModeLabel(snapMode)}</span>
          </button>
          
          <span className="text-xs text-gray-500 ml-4">
            💡 Space=Play, Shift+Wheel=Zoom, Right-click=Pan, Arrows=Step
          </span>
        </div>
        <div className="text-sm text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Main timeline area - two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left column - Fixed track labels (synced scroll) */}
        <div 
          ref={leftColumnRef}
          className="flex-shrink-0 bg-gray-800 border-r border-gray-700 overflow-y-hidden"
          style={{ width: `${LEFT_COLUMN_WIDTH}px` }}
        >
          {/* Spacer for ruler */}
          <div 
            className="border-b border-gray-700"
            style={{ height: `${RULER_HEIGHT}px` }}
          />
          
          {/* Track labels */}
          {tracks.map((track) => {
            const isCollapsed = collapsedTracks.has(track.id);
            const displayName = trackNames.get(track.id) || track.name;
            const isEditing = editingTrackId === track.id;
            
            return (
              <div
                key={track.id}
                className="flex items-center px-2 border-b border-gray-700"
                style={{ height: `${TRACK_HEIGHT}px` }}
              >
                {/* Collapse/expand button */}
                <button
                  onClick={() => toggleTrackCollapse(track.id)}
                  className="p-1 hover:bg-gray-700 rounded mr-2 text-gray-400 hover:text-gray-200"
                  title={isCollapsed ? "Expand track" : "Collapse track"}
                >
                  {isCollapsed ? '▶' : '▼'}
                </button>
                
                {/* Track name - editable on double-click */}
                {isEditing ? (
                  <input
                    type="text"
                    value={editingTrackName}
                    onChange={(e) => setEditingTrackName(e.target.value)}
                    onBlur={commitTrackRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        commitTrackRename();
                      } else if (e.key === 'Escape') {
                        cancelTrackRename();
                      }
                    }}
                    autoFocus
                    className="text-sm font-medium bg-gray-700 text-white px-2 py-1 rounded border border-cyan-500 focus:outline-none"
                    style={{ width: '140px' }}
                  />
                ) : (
                  <span
                    className="text-sm font-medium cursor-text hover:text-cyan-400"
                    onDoubleClick={() => startRenameTrack(track.id, displayName)}
                    title="Double-click to rename"
                  >
                    {displayName}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right column - Scrollable timeline content */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto relative focus:outline-none focus:ring-2 focus:ring-cyan-500"
          onContextMenu={handleContextMenu}
          onMouseDown={handleMouseDown}
          style={{ cursor: isPanning ? 'grabbing' : 'default' }}
          tabIndex={0}
          role="region"
          aria-label="Timeline content"
        >
          {/* Sticky ruler at top */}
          <div
            className="sticky top-0 z-20 bg-gray-800 border-b border-gray-700"
            style={{ 
              height: `${RULER_HEIGHT}px`,
              width: `${timelineWidth}px`
            }}
          >
            <div className="relative h-full">
              {renderRulerMarkers()}
            </div>
          </div>

          {/* Timeline content container */}
          <div
            className="relative"
            style={{ 
              width: `${timelineWidth}px`,
              minHeight: `${tracks.length * TRACK_HEIGHT}px`
            }}
            onClick={handleTimelineClick}
          >
            {/* Track rows */}
            {tracks.map((track, index) => {
              const isCollapsed = collapsedTracks.has(track.id);
              return (
                <div
                  key={track.id}
                  className="relative border-b border-gray-700 overflow-hidden transition-all"
                  style={{ height: isCollapsed ? '40px' : `${TRACK_HEIGHT}px` }}
                >
                  {/* Only render track content if not collapsed */}
                  {!isCollapsed && (
                    <>
                      {/* Waveform for audio track */}
                      {track.type === 'audio' && showWaveform && audioBuffer && (
                        <WaveformVisualizer
                          audioBuffer={audioBuffer}
                          duration={duration}
                          width={timelineWidth}
                          height={TRACK_HEIGHT}
                          color="rgba(100, 180, 255, 0.3)"
                        />
                      )}

                {/* Grid lines for visual reference - adapt to snap mode */}
                      <div className="absolute inset-0 pointer-events-none">
                        {renderGridLines()}
                      </div>

                      {/* Render keyframes for this track */}
                      {track.type === 'preset' && renderKeyframes('preset')}
                      {track.type === 'presetSpeed' && renderKeyframes('presetSpeed')}
                      {track.type === 'camera' && renderKeyframes('camera')}
                      {track.type === 'cameraRig' && renderKeyframes('cameraRig')}
                      {track.type === 'cameraFX' && renderKeyframes('cameraFX')}
                      {track.type === 'text' && renderKeyframes('text')}
                      {track.type === 'textAnimator' && renderKeyframes('textAnimator')}
                      {track.type === 'letterbox' && renderKeyframes('letterbox')}
                      {track.type === 'maskReveal' && renderKeyframes('maskReveal')}
                      {track.type === 'particles' && renderKeyframes('particles')}
                      {track.type === 'environment' && (
                        <div className="absolute inset-0">
                          {renderKeyframes('environment')}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Playhead - spans all tracks */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              style={{ left: `${playheadX}px`, pointerEvents: 'none' }}
            >
              {/* Playhead handle - draggable */}
              <div 
                className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full cursor-grab hover:scale-125 transition-transform"
                style={{ pointerEvents: 'auto' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsDraggingPlayhead(true);
                  document.body.style.cursor = 'grabbing';
                }}
                title="Drag to scrub timeline"
              />
            </div>
            
            {/* Marquee selection rectangle */}
            {renderMarquee()}
          </div>
        </div>
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded shadow-lg py-1 z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
            onClick={() => handleContextMenuAction('copy')}
          >
            <span>📋</span> Copy Keyframe
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
            onClick={() => handleContextMenuAction('duplicate')}
          >
            <span>➕</span> Duplicate
          </button>
          <div className="border-t border-gray-700 my-1" />
          <button
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
            onClick={() => handleContextMenuAction('delete')}
          >
            <span>🗑️</span> Delete
          </button>
        </div>
      )}
    </div>
  );
}
